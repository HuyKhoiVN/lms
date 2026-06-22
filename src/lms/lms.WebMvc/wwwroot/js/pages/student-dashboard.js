(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    courses: [],
    exams: [],
    results: [],
    certificates: [],
    loaded: false
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function unwrapAjaxResponse(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getItems(response) {
    const payload = unwrapAjaxResponse(response);
    return payload && payload.data && Array.isArray(payload.data.items) ? payload.data.items : [];
  }

  function setText(selector, value) {
    $(selector).text(value);
  }

  function escapeHtml(value) {
    return $("<div>").text(value == null ? "" : value).html();
  }

  function attr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function setProgress($element, value) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    $element.css("--progress-width", safeValue + "%").css("width", safeValue + "%");
  }

  function renderPageTitle() {
    document.title = t("dashboard.studentPage.title", null, "Bảng điều khiển học tập") + " - " + t("common.appName", null, "lms");
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

  function getBadgeClass(status) {
    if (status === "Published") {
      return "app-badge-success";
    }

    if (status === "Draft") {
      return "app-badge-muted";
    }

    return "app-badge-info";
  }

  function getCourseImage(index) {
    const images = [
      "/images/course-programming.jpg",
      "/images/course-business.jpg",
      "/images/course-languages.jpg",
      "/images/course-ai-tech.jpg",
      "/images/course-science.jpg",
      "/images/course-softskills.jpg"
    ];
    return images[index % images.length];
  }

  function renderMetrics(courses, exams, results, certificates) {
    const publishedExams = exams.filter(function (exam) {
      return exam.status === "Published";
    });
    const averageScore = results.length
      ? Math.round(results.reduce(function (total, result) {
        return total + Number(result.score || 0);
      }, 0) / results.length)
      : 0;

    setText("[data-student-metric='courses']", courses.length);
    setText("[data-student-metric='pendingExams']", publishedExams.length);
    setText("[data-student-metric='averageScore']", averageScore);
    setText("[data-student-metric='certificates']", certificates.length);
    setText(
      "[data-student-exam-count]",
      t("dashboard.studentPage.pendingCount", { count: publishedExams.length }, publishedExams.length + " cần làm")
    );
  }

  function renderHero(results) {
    const latest = results.slice().sort(function (a, b) {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    })[0];

    if (!latest) {
      setText("[data-student-hero-score]", "--");
      setText("[data-student-latest-exam]", t("dashboard.studentPage.noResultTitle", null, "Chưa có kết quả bài thi"));
      setText("[data-student-latest-copy]", t("dashboard.studentPage.noResultCopy", null, "Hoàn thành một bài thi được giao để xem điểm gần nhất."));
      setProgress($("[data-student-latest-progress]"), 0);
      return;
    }

    setText("[data-student-hero-score]", latest.score);
    setText("[data-student-latest-exam]", latest.examName);
    setText(
      "[data-student-latest-copy]",
      t(
        "dashboard.studentPage.latestResultCopy",
        {
          status: latest.passed
            ? t("dashboard.studentPage.passed", null, "Đạt")
            : t("dashboard.studentPage.needsReview", null, "Cần xem lại"),
          score: latest.score,
          minutes: latest.durationMinutes
        },
        (latest.passed ? "Đạt" : "Cần xem lại") + " với " + latest.score + "/100 trong " + latest.durationMinutes + " phút."
      )
    );
    setProgress($("[data-student-latest-progress]"), latest.score);
  }

  function renderCourses(courses) {
    const $container = $("#studentCourseCards");

    if (!courses.length) {
      $container.html(
        '<div class="app-empty-state student-dashboard-empty student-dashboard-reveal is-visible" data-dashboard-reveal>' +
          '<div class="mock-img mock-img-course u-mb-4" style="margin: 0 auto; max-width: 320px;"><span>Course Mock</span></div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("dashboard.studentPage.noCoursesTitle", null, "Chưa có khóa học được giao")) + '</h3>' +
          '<p class="app-empty-copy">' + escapeHtml(t("dashboard.studentPage.noCoursesCopy", null, "Các khóa học được giao sẽ xuất hiện tại đây.")) + '</p>' +
        '</div>'
      );
      return;
    }

    const cards = courses.map(function (course, index) {
      const progress = Number(course.completionRate || 0);
      const actionText = progress > 0
        ? t("dashboard.studentPage.resume", null, "Tiếp tục")
        : t("dashboard.studentPage.start", null, "Bắt đầu");

      return (
        '<article class="app-card learning-card student-dashboard-course-card student-dashboard-reveal" data-dashboard-reveal>' +
          '<div class="app-card-body">' +
            '<div class="mock-img mock-img-course u-mb-4">' +
              '<span>' + escapeHtml(course.name) + '</span>' +
            '</div>' +
            '<div class="u-flex u-align-center u-justify-between u-mb-3">' +
              '<span class="app-badge app-badge-muted">' + escapeHtml(getInitials(course.name)) + '</span>' +
              '<span class="app-badge app-badge-info">' + progress + '%</span>' +
            '</div>' +
            '<h3 class="app-card-title text-base font-semibold u-mb-2" style="font-size: 16px;">' + escapeHtml(course.name) + '</h3>' +
            '<p class="app-card-subtitle text-xs u-mb-4" style="font-size: 12px; margin-bottom: 16px;">' +
              escapeHtml(t(
                "dashboard.studentPage.courseMeta",
                { materials: course.materialCount, learners: course.assignedCount },
                course.materialCount + " tài liệu, " + course.assignedCount + " học viên được giao"
              )) +
            '</p>' +
            '<div class="progress-track u-mt-4">' +
              '<div class="progress-fill" data-course-progress="' + progress + '"></div>' +
            '</div>' +
          '</div>' +
          '<div class="app-card-footer">' +
            '<button class="app-button app-button-primary u-w-full" type="button" data-student-action="continue-learning">' + escapeHtml(actionText) + '</button>' +
          '</div>' +
        '</article>'
      );
    });

    $container.html(cards.join(""));
    $container.find("[data-course-progress]").each(function () {
      setProgress($(this), $(this).data("course-progress"));
    });
    initDashboardReveal();
  }

  function renderExams(exams) {
    const $container = $("#studentPendingExams");
    const publishedExams = exams.filter(function (exam) {
      return exam.status === "Published";
    });

    if (!publishedExams.length) {
      $container.html(
        '<div class="app-empty-state student-dashboard-empty student-dashboard-reveal is-visible" style="border: none; background: transparent; padding: var(--space-2);" data-dashboard-reveal>' +
          '<div class="mock-img mock-img-exam u-mb-4" style="margin: 0 auto;"><span>Exam Mock</span></div>' +
          '<h3 class="app-empty-title text-sm">' + escapeHtml(t("dashboard.studentPage.noPendingExamsTitle", null, "Không có bài thi cần làm")) + '</h3>' +
          '<p class="app-empty-copy text-xs">' + escapeHtml(t("dashboard.studentPage.noPendingExamsCopy", null, "Bài thi đã xuất bản được giao sẽ xuất hiện tại đây.")) + '</p>' +
        '</div>'
      );
      return;
    }

    const rows = publishedExams.map(function (exam) {
      return (
        '<div class="student-exam-item student-dashboard-reveal" data-dashboard-reveal>' +
          '<div>' +
            '<h4 style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">' + escapeHtml(exam.name) + '</h4>' +
            '<p style="font-size: 12px; color: var(--color-text-secondary); margin: 0;">' +
              escapeHtml(t(
                "dashboard.studentPage.examMeta",
                { minutes: exam.durationMinutes, passScore: exam.passScore, questions: exam.questionCount },
                exam.durationMinutes + " phút, điểm đạt " + exam.passScore + ", " + exam.questionCount + " câu hỏi"
              )) +
            '</p>' +
          '</div>' +
          '<div class="student-exam-actions">' +
            '<span class="app-badge ' + getBadgeClass(exam.status) + '" style="font-size: 11px; padding: 2px 8px;">' + escapeHtml(t("dashboard.studentPage.status." + exam.status, null, exam.status)) + '</span>' +
            '<button class="app-button app-button-secondary" type="button" style="height: 32px; min-height: 32px; padding: 0 12px; font-size: 12px; border-radius: 8px;">' + escapeHtml(t("dashboard.studentPage.reviewRules", null, "Xem quy định")) + '</button>' +
          '</div>' +
        '</div>'
      );
    });

    $container.html(rows.join(""));
    initDashboardReveal();
  }

  function renderCertificates(certificates) {
    const $container = $("#studentCertificateSummary");

    if (!certificates.length) {
      $container.html(
        '<div class="app-empty-state student-dashboard-empty student-dashboard-reveal is-visible" style="border: none; background: transparent; padding: var(--space-2);" data-dashboard-reveal>' +
          '<div class="mock-img mock-img-certificate u-mb-4" style="margin: 0 auto;"><span>Cert Mock</span></div>' +
          '<h3 class="app-empty-title text-sm">' + escapeHtml(t("dashboard.studentPage.noCertificatesTitle", null, "Chưa có chứng chỉ")) + '</h3>' +
          '<p class="app-empty-copy text-xs">' + escapeHtml(t("dashboard.studentPage.noCertificatesCopy", null, "Chứng chỉ sẽ được cấp sau khi vượt qua bài thi.")) + '</p>' +
        '</div>'
      );
      return;
    }

    const latest = certificates[0];
    $container.html(
      '<div class="student-certificate-card student-dashboard-reveal is-visible" style="padding: 0; border: none; background: transparent;" data-dashboard-reveal>' +
        '<div class="mock-img mock-img-certificate u-mb-3" style="margin: 0 auto;"><span>Cert</span></div>' +
        '<h4 class="text-base font-semibold text-center u-mb-2" style="font-size: 15px; font-weight: 600; margin-top: 8px;">' + escapeHtml(latest.examName) + '</h4>' +
        '<p class="text-xs text-muted text-center u-mb-3" style="font-size: 12px; margin-bottom: 12px;">' + escapeHtml(latest.certificateCode) + '</p>' +
        '<div class="admin-summary-line u-flex u-justify-between text-xs u-mb-3" style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px;">' +
          '<span>' + escapeHtml(t("dashboard.studentPage.issueDate", null, "Ngày cấp")) + '</span>' +
          '<strong>' + escapeHtml(latest.issueDate) + '</strong>' +
        '</div>' +
        '<button class="app-button app-button-secondary u-w-full" type="button">' + escapeHtml(t("dashboard.studentPage.previewCertificate", null, "Xem trước chứng chỉ")) + '</button>' +
      '</div>'
    );
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
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    });

    $items.each(function (index) {
      this.style.setProperty("--reveal-delay", Math.min(index * 45, 240) + "ms");
      $(this).attr("data-dashboard-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function renderAll() {
    if (!state.loaded) {
      return;
    }

    renderMetrics(state.courses, state.exams, state.results, state.certificates);
    renderHero(state.results);
    renderCourses(state.courses);
    renderExams(state.exams);
    renderCertificates(state.certificates);
    initDashboardReveal();
  }

  function bindActions() {
    $(document).on("click", "[data-student-action='continue-learning']", function () {
      if (Lms.ui && Lms.ui.showToast) {
        Lms.ui.showToast({
          type: "info",
          title: t("dashboard.studentPage.courseViewerTitle", null, "Trình xem khóa học"),
          message: t(
            "dashboard.studentPage.courseViewerMessage",
            null,
            "Màn tài liệu học tập sẽ được triển khai ở các task khóa học/tài liệu tiếp theo."
          ),
          duration: 3000
        });
      }
    });

    $(document).on("lms:i18n:changed", function () {
      renderPageTitle();
      renderAll();
    });
  }

  function loadStudentDashboardData() {
    renderPageTitle();

    if (!Lms.apiClient) {
      return;
    }

    $.when(
      Lms.apiClient.get("courses.json"),
      Lms.apiClient.get("exams.json"),
      Lms.apiClient.get("results.json"),
      Lms.apiClient.get("certificates.json")
    ).done(function (coursesResponse, examsResponse, resultsResponse, certificatesResponse) {
      state.courses = getItems(coursesResponse);
      state.exams = getItems(examsResponse);
      state.results = getItems(resultsResponse);
      state.certificates = getItems(certificatesResponse);
      state.loaded = true;

      renderAll();
    }).fail(function () {
      if (Lms.ui && Lms.ui.showToast) {
        Lms.ui.showToast({
          type: "error",
          title: t("dashboard.studentPage.dataErrorTitle", null, "Lỗi dữ liệu dashboard"),
          message: t("dashboard.studentPage.dataErrorMessage", null, "Không thể tải dữ liệu mô phỏng của dashboard học viên.")
        });
      }
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
