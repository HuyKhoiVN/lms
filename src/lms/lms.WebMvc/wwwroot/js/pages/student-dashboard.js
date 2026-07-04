(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    courses: [],
    exams: [],
    results: [],
    certificates: [],
    materialsTotal: null,
    loaded: false
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function unwrapAjaxResponse(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getPagedData(response) {
    const payload = unwrapAjaxResponse(response);
    return payload && payload.data ? payload.data : {};
  }

  function getItems(response) {
    const data = getPagedData(response);
    return Array.isArray(data.items) ? data.items : [];
  }

  function getTotalCount(response) {
    const data = getPagedData(response);
    return Number(data.totalCount ?? data.total ?? (Array.isArray(data.items) ? data.items.length : 0));
  }

  function escapeHtml(value) {
    return $("<div>").text(value == null ? "" : value).html();
  }

  function setText(selector, value) {
    $(selector).text(value);
  }

  function setProgress($element, value) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    $element.css("--progress-width", safeValue + "%").css("width", safeValue + "%");
  }

  function formatNumber(value, digits) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "--";
    }

    return numeric.toLocaleString(undefined, {
      maximumFractionDigits: typeof digits === "number" ? digits : 1
    });
  }

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleDateString();
  }

  function getInitials(name) {
    return String(name || t("dashboard.studentPage.courseFallback", null, "Khóa học"))
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function getCourseTone(course) {
    const source = String((course.code || "") + " " + (course.name || "")).toLowerCase();

    if (/it|tech|c[oô]ng ngh[eệ]|data|excel|sql|code|phase/.test(source)) {
      return "sky";
    }

    if (/qu[aả]n tr[iị]|manage|agile|project|leader/.test(source)) {
      return "amber";
    }

    if (/security|an to[aà]n|attt|b[aả]o m[aậ]t/.test(source)) {
      return "rose";
    }

    if (/marketing|campaign|sale/.test(source)) {
      return "pink";
    }

    return "indigo";
  }

  function getBadgeClass(isPublished) {
    return isPublished ? "student-dashboard-status-published" : "student-dashboard-status-draft";
  }

  function renderPageTitle() {
    document.title = t("dashboard.studentPage.title", null, "Bảng điều khiển học tập") + " - " + t("common.appName", null, "lms");
  }

  function renderMetrics(courses, exams, results, certificates) {
    const pendingExams = exams.filter(function (exam) { return exam.isPublished; });
    const averageScore = results.length
      ? results.reduce(function (total, result) { return total + Number(result.score || 0); }, 0) / results.length
      : null;

    setText("[data-student-metric='courses']", courses.length);
    setText("[data-student-metric='pendingExams']", pendingExams.length);
    setText("[data-student-metric='learningHours']", "--");
    setText("[data-student-metric='averageScore']", averageScore == null ? "--" : formatNumber(averageScore, 1));
    setText("[data-student-metric='certificates']", certificates.length);
    setText("[data-student-exam-count]", pendingExams.length);
  }

  function renderLatestResult(results) {
    const latest = results.slice().sort(function (a, b) {
      return new Date(b.completedDate) - new Date(a.completedDate);
    })[0];

    if (!latest) {
      setText("[data-student-hero-score]", "--");
      setText("[data-student-latest-exam]", t("dashboard.studentPage.noResultTitle", null, "Chưa có kết quả bài thi"));
      setText("[data-student-latest-copy]", t("dashboard.studentPage.noResultCopy", null, "Hoàn thành một bài thi được giao để xem điểm gần nhất."));
      setProgress($("[data-student-latest-progress]"), 0);
      return;
    }

    const score = Number(latest.score || 0);
    setText("[data-student-hero-score]", formatNumber(score, 2) + "/100");
    setText("[data-student-latest-exam]", latest.examName || t("dashboard.studentPage.examFallback", null, "Bài thi"));
    setText(
      "[data-student-latest-copy]",
      (latest.passed
        ? t("dashboard.studentPage.passed", null, "Đạt")
        : t("dashboard.studentPage.needsReview", null, "Cần xem lại")) + " với " + formatNumber(score, 2) + "/100."
    );
    setProgress($("[data-student-latest-progress]"), score);
  }

  function renderCourses(courses) {
    const $container = $("#studentCourseCards");

    if (!courses.length) {
      $container.html(
        '<div class="student-dashboard-empty student-dashboard-reveal is-visible" data-dashboard-reveal>' +
          '<span class="student-dashboard-soft-icon icon-indigo" aria-hidden="true"><i class="bi bi-book"></i></span>' +
          '<h3>' + escapeHtml(t("dashboard.studentPage.noCoursesTitle", null, "Không có khóa học đang học.")) + '</h3>' +
          '<p>' + escapeHtml(t("dashboard.studentPage.noCoursesCopy", null, "Các khóa học được giao sẽ xuất hiện tại đây.")) + '</p>' +
        '</div>'
      );
      return;
    }

    const cards = courses.slice(0, 6).map(function (course) {
      const progress = Number(course.completionRate || 0);
      const totalMaterials = Number(course.totalMaterials || 0);
      const completedMaterials = Number(course.completedMaterials || 0);
      const hasImage = Boolean(course.thumbnailUrl);
      const tone = getCourseTone(course);
      const imageMarkup = hasImage
        ? '<img src="' + escapeHtml(course.thumbnailUrl) + '" alt="' + escapeHtml(course.name) + '" loading="lazy" data-course-image />'
        : '<div class="student-dashboard-course-fallback tone-' + tone + '" aria-hidden="true"><i class="bi bi-window-stack"></i><span></span><span></span></div>';

      return (
        '<a class="student-dashboard-course-card student-dashboard-reveal" data-dashboard-reveal href="/Courses/Detail/' + Number(course.id) + '" aria-label="' + escapeHtml(course.name || "Course") + '">' +
          '<div class="student-dashboard-course-media">' +
            imageMarkup +
            '<span class="student-dashboard-course-badge">' + escapeHtml(getInitials(course.name)) + '</span>' +
          '</div>' +
          '<div class="student-dashboard-course-body">' +
            '<h3>' + escapeHtml(course.name || t("dashboard.studentPage.courseFallback", null, "Khóa học")) + '</h3>' +
            '<p>' + escapeHtml(course.code || course.description || "") + '</p>' +
            '<div class="student-dashboard-course-progress">' +
              '<div><strong>' + formatNumber(progress, 0) + '%</strong><span>' + completedMaterials + '/' + totalMaterials + ' bài học</span></div>' +
              '<div class="student-dashboard-progress-track" aria-hidden="true"><span data-course-progress="' + progress + '"></span></div>' +
            '</div>' +
          '</div>' +
        '</a>'
      );
    });

    $container.html(cards.join(""));
    $container.find("[data-course-progress]").each(function () {
      setProgress($(this), $(this).data("course-progress"));
    });
    $container.find("[data-course-image]").on("error", function () {
      const $media = $(this).closest(".student-dashboard-course-media");
      const tone = getCourseTone(courses[$media.closest(".student-dashboard-course-card").index()] || {});
      $(this).replaceWith('<div class="student-dashboard-course-fallback tone-' + tone + '" aria-hidden="true"><i class="bi bi-window-stack"></i><span></span><span></span></div>');
    });
    initDashboardReveal();
  }

  function renderExams(exams) {
    const $container = $("#studentPendingExams");
    const publishedExams = exams.filter(function (exam) { return exam.isPublished; }).slice(0, 3);

    if (!publishedExams.length) {
      $container.html(
        '<div class="student-dashboard-empty student-dashboard-reveal is-visible" data-dashboard-reveal>' +
          '<span class="student-dashboard-soft-icon icon-green" aria-hidden="true"><i class="bi bi-clipboard-check"></i></span>' +
          '<h3>' + escapeHtml(t("dashboard.studentPage.noPendingExamsTitle", null, "Không có bài thi đang mở.")) + '</h3>' +
          '<p>' + escapeHtml(t("dashboard.studentPage.noPendingExamsCopy", null, "Bài thi đã xuất bản được giao sẽ xuất hiện tại đây.")) + '</p>' +
        '</div>'
      );
      return;
    }

    const rows = publishedExams.map(function (exam) {
      return (
        '<article class="student-dashboard-exam-row student-dashboard-reveal" data-dashboard-reveal>' +
          '<span class="student-dashboard-soft-icon icon-sky" aria-hidden="true"><i class="bi bi-clipboard-check"></i></span>' +
          '<div class="student-dashboard-exam-copy">' +
            '<h3>' + escapeHtml(exam.name || t("dashboard.studentPage.examFallback", null, "Bài thi")) + '</h3>' +
            '<p>' + escapeHtml(exam.durationMinutes + " phút, điểm đạt " + formatNumber(exam.passScore, 1) + ", " + exam.questionCount + " câu hỏi") + '</p>' +
          '</div>' +
          '<span class="student-dashboard-status ' + getBadgeClass(exam.isPublished) + '">' + escapeHtml(exam.statusLabel) + '</span>' +
          '<a class="student-dashboard-exam-action" href="/Exams/Start/' + Number(exam.id) + '">' + escapeHtml(t("dashboard.studentPage.startExam", null, "Làm bài")) + '</a>' +
        '</article>'
      );
    });

    $container.html(rows.join(""));
    initDashboardReveal();
  }

  function renderCertificates(certificates) {
    const $container = $("#studentCertificateSummary");

    if (!certificates.length) {
      $container.html(
        '<div class="student-dashboard-empty student-dashboard-reveal is-visible" data-dashboard-reveal>' +
          '<span class="student-dashboard-soft-icon icon-orange" aria-hidden="true"><i class="bi bi-award"></i></span>' +
          '<h3>' + escapeHtml(t("dashboard.studentPage.noCertificatesTitle", null, "Chưa có chứng chỉ.")) + '</h3>' +
          '<p>' + escapeHtml(t("dashboard.studentPage.noCertificatesCopy", null, "Chứng chỉ sẽ được cấp sau khi bạn đạt điều kiện.")) + '</p>' +
        '</div>'
      );
      return;
    }

    const latest = certificates.slice().sort(function (a, b) {
      return new Date(b.issuedDate) - new Date(a.issuedDate);
    })[0];

    $container.html(
      '<article class="student-dashboard-certificate-card student-dashboard-reveal is-visible" data-dashboard-reveal>' +
        '<span class="student-dashboard-soft-icon icon-orange" aria-hidden="true"><i class="bi bi-award"></i></span>' +
        '<div class="student-dashboard-certificate-copy">' +
          '<h3>' + escapeHtml(latest.examName || t("dashboard.studentPage.certificateFallback", null, "Chứng chỉ")) + '</h3>' +
          '<p>' + escapeHtml(latest.certificateCode || "") + '</p>' +
        '</div>' +
        '<div class="student-dashboard-certificate-date"><span>' + escapeHtml(t("dashboard.studentPage.issueDate", null, "Ngày cấp")) + '</span><strong>' + escapeHtml(formatDate(latest.issuedDate)) + '</strong></div>' +
        '<a class="student-dashboard-certificate-action" href="/Certificates">' + escapeHtml(t("dashboard.studentPage.previewCertificate", null, "Xem chứng chỉ")) + '</a>' +
      '</article>'
    );
    initDashboardReveal();
  }

  function renderQuickAccess() {
    const $container = $("#studentQuickAccess");
    const publishedExams = state.exams.filter(function (exam) { return exam.isPublished; }).length;
    const items = [
      { href: "/LearningMaterials", icon: "bi-file-earmark-text", tone: "sky", title: "Tài liệu", value: state.materialsTotal == null ? "--" : state.materialsTotal + " tài liệu" },
      { href: "/Exams", icon: "bi-clipboard-check-fill", tone: "green", title: "Bài thi", value: publishedExams + " bài thi" },
      { href: "/Results", icon: "bi-bar-chart-line-fill", tone: "violet", title: "Kết quả", value: state.results.length ? "Xem kết quả" : "Chưa có kết quả" },
      { href: "/Certificates", icon: "bi-trophy", tone: "orange", title: "Chứng chỉ", value: state.certificates.length + " chứng chỉ" }
    ];

    $container.html(items.map(function (item) {
      return (
        '<a class="student-dashboard-quick-card student-dashboard-reveal" data-dashboard-reveal href="' + item.href + '">' +
          '<span class="student-dashboard-soft-icon icon-' + item.tone + '" aria-hidden="true"><i class="bi ' + item.icon + '"></i></span>' +
          '<span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.value) + '</small></span>' +
        '</a>'
      );
    }).join(""));
    initDashboardReveal();
  }

  function initDashboardReveal() {
    const $items = $("[data-dashboard-reveal]").not("[data-dashboard-reveal-ready]");

    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-dashboard-reveal-ready", "true");
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        $(entry.target).addClass("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    $items.each(function (index) {
      this.style.setProperty("--reveal-delay", Math.min(index * 60, 360) + "ms");
      $(this).attr("data-dashboard-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function renderAll() {
    if (!state.loaded) {
      return;
    }

    renderMetrics(state.courses, state.exams, state.results, state.certificates);
    renderLatestResult(state.results);
    renderCourses(state.courses);
    renderExams(state.exams);
    renderCertificates(state.certificates);
    renderQuickAccess();
    initDashboardReveal();
  }

  function loadCourseProgress(courses) {
    if (!courses.length || !Lms.apiClient) {
      return $.Deferred().resolve([]).promise();
    }

    const requests = courses.map(function (course) {
      return Lms.apiClient.get("api/courses/" + Number(course.id) + "/progress")
        .then(function (response) {
          const payload = unwrapAjaxResponse(response);
          const data = payload && payload.data ? payload.data : {};
          return {
            courseId: Number(course.id),
            completionRate: Number(data.overallPercent || 0),
            totalMaterials: Number(data.totalMaterials || 0),
            completedMaterials: Number(data.completedMaterials || 0)
          };
        }, function () {
          return {
            courseId: Number(course.id),
            completionRate: null,
            totalMaterials: null,
            completedMaterials: null
          };
        });
    });

    return $.when.apply($, requests).then(function () {
      const args = Array.prototype.slice.call(arguments);
      return requests.length === 1 ? [args[0]] : args;
    });
  }

  function loadStudentDashboardData() {
    renderPageTitle();

    if (!Lms.apiClient) {
      return;
    }

    $.when(
      Lms.apiClient.get("api/courses?page=1&pageSize=200"),
      Lms.apiClient.get("api/exams?page=1&pageSize=200"),
      Lms.apiClient.get("api/results/my?page=1&pageSize=200"),
      Lms.apiClient.get("api/certificates?page=1&pageSize=200"),
      Lms.apiClient.get("api/learning-materials?page=1&pageSize=1")
    ).done(function (coursesResponse, examsResponse, resultsResponse, certificatesResponse, materialsResponse) {
      state.courses = getItems(coursesResponse).map(function (item) {
        return {
          id: Number(item.id),
          name: item.name || "",
          code: item.code || "",
          description: item.description || "",
          thumbnailUrl: item.thumbnailUrl || item.imageUrl || item.coverImage || item.bannerUrl || item.thumbnail || "",
          completionRate: 0,
          totalMaterials: 0,
          completedMaterials: 0
        };
      });
      state.exams = getItems(examsResponse).map(function (item) {
        const isPublished = Boolean(item.isPublished);
        return {
          id: Number(item.id),
          name: item.name || "",
          durationMinutes: Number(item.durationMinutes || 0),
          passScore: Number(item.passScore || 0),
          questionCount: Number(item.questionCount || 0),
          isPublished: isPublished,
          statusLabel: isPublished ? "Published" : "Draft"
        };
      });
      state.results = getItems(resultsResponse).map(function (item) {
        return {
          id: Number(item.id),
          examName: item.examName || "",
          score: Number(item.score || 0),
          passed: Boolean(item.passed),
          completedDate: item.completedDate
        };
      });
      state.certificates = getItems(certificatesResponse).map(function (item) {
        return {
          id: Number(item.id),
          examName: item.examName || "",
          certificateCode: item.certificateCode || "",
          issuedDate: item.issuedDate
        };
      });
      state.materialsTotal = getTotalCount(materialsResponse);

      loadCourseProgress(state.courses).always(function (progressItems) {
        const progressMap = {};
        (Array.isArray(progressItems) ? progressItems : []).forEach(function (item) {
          progressMap[item.courseId] = item;
        });

        state.courses = state.courses.map(function (course) {
          const progress = progressMap[course.id];
          if (!progress) {
            return course;
          }

          return {
            ...course,
            completionRate: progress.completionRate == null ? 0 : progress.completionRate,
            totalMaterials: progress.totalMaterials == null ? 0 : progress.totalMaterials,
            completedMaterials: progress.completedMaterials == null ? 0 : progress.completedMaterials
          };
        });

        state.loaded = true;
        renderAll();
      });
    }).fail(function (error) {
      if (Lms.ui && Lms.ui.showToast) {
        Lms.ui.showToast({
          type: "error",
          title: t("dashboard.studentPage.dataErrorTitle", null, "Lỗi dữ liệu dashboard"),
          message: error && error.message
            ? error.message
            : t("dashboard.studentPage.dataErrorMessage", null, "Không thể tải dữ liệu dashboard học viên từ backend.")
        });
      }
    });
  }

  function bindActions() {
    $(document).on("lms:i18n:changed", function () {
      renderPageTitle();
      renderAll();
    });
  }

  function initStudentDashboard() {
    bindActions();
    initDashboardReveal();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadStudentDashboardData);
      return;
    }

    loadStudentDashboardData();
  }

  $(initStudentDashboard);
})(window, jQuery);
