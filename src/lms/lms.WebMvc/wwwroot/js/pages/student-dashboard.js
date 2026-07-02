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

  function setProgress($element, value) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    $element.css("--progress-width", safeValue + "%").css("width", safeValue + "%");
  }

  function renderPageTitle() {
    document.title = t("dashboard.studentPage.title", null, "Bang dieu khien hoc tap") + " - " + t("common.appName", null, "lms");
  }

  function getInitials(name) {
    return String(name || t("dashboard.studentPage.courseFallback", null, "Khoa hoc"))
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

  function renderMetrics(courses, exams, results, certificates) {
    const pendingExams = exams.filter(function (exam) {
      return exam.status === "Published";
    });
    const averageScore = results.length
      ? Math.round(results.reduce(function (total, result) {
        return total + Number(result.score || 0);
      }, 0) / results.length)
      : 0;

    setText("[data-student-metric='courses']", courses.length);
    setText("[data-student-metric='pendingExams']", pendingExams.length);
    setText("[data-student-metric='averageScore']", averageScore);
    setText("[data-student-metric='certificates']", certificates.length);
    setText(
      "[data-student-exam-count]",
      t("dashboard.studentPage.pendingCount", { count: pendingExams.length }, pendingExams.length + " can lam")
    );
  }

  function renderHero(results) {
    const latest = results.slice().sort(function (a, b) {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    })[0];

    if (!latest) {
      setText("[data-student-hero-score]", "--");
      setText("[data-student-latest-exam]", t("dashboard.studentPage.noResultTitle", null, "Chua co ket qua bai thi"));
      setText("[data-student-latest-copy]", t("dashboard.studentPage.noResultCopy", null, "Hoan thanh mot bai thi duoc giao de xem diem gan nhat."));
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
            ? t("dashboard.studentPage.passed", null, "Dat")
            : t("dashboard.studentPage.needsReview", null, "Can xem lai"),
          score: latest.score
        },
        (latest.passed ? "Dat" : "Can xem lai") + " voi " + latest.score + "/100."
      )
    );
    setProgress($("[data-student-latest-progress]"), latest.score);
  }

  function renderCourses(courses) {
    const $container = $("#studentCourseCards");

    if (!courses.length) {
      $container.html(
        '<div class="app-empty-state student-dashboard-empty student-dashboard-reveal is-visible" data-dashboard-reveal>' +
          '<div class="media-placeholder media-placeholder-course u-mb-4" style="margin: 0 auto; max-width: 320px;"><span>Course</span></div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("dashboard.studentPage.noCoursesTitle", null, "Chua co khoa hoc duoc giao")) + '</h3>' +
          '<p class="app-empty-copy">' + escapeHtml(t("dashboard.studentPage.noCoursesCopy", null, "Cac khoa hoc duoc giao se xuat hien tai day.")) + '</p>' +
        '</div>'
      );
      return;
    }

    const cards = courses.map(function (course) {
      const progress = Number(course.completionRate || 0);
      const actionText = progress > 0
        ? t("dashboard.studentPage.resume", null, "Tiep tuc")
        : t("dashboard.studentPage.start", null, "Bat dau");
      const metaText = course.code
        ? course.code
        : (course.description || t("dashboard.studentPage.courseFallback", null, "Khoa hoc"));

      return (
        '<article class="app-card learning-card student-dashboard-course-card student-dashboard-reveal" data-dashboard-reveal>' +
          '<div class="app-card-body">' +
            '<div class="media-placeholder media-placeholder-course u-mb-4">' +
              '<span>' + escapeHtml(course.name) + '</span>' +
            '</div>' +
            '<div class="u-flex u-align-center u-justify-between u-mb-3">' +
              '<span class="app-badge app-badge-muted">' + escapeHtml(getInitials(course.name)) + '</span>' +
              '<span class="app-badge app-badge-info">' + progress + '%</span>' +
            '</div>' +
            '<h3 class="app-card-title text-base font-semibold u-mb-2" style="font-size: 16px;">' + escapeHtml(course.name) + '</h3>' +
            '<p class="app-card-subtitle text-xs u-mb-4" style="font-size: 12px; margin-bottom: 16px;">' + escapeHtml(metaText) + '</p>' +
            '<div class="progress-track u-mt-4">' +
              '<div class="progress-fill" data-course-progress="' + progress + '"></div>' +
            '</div>' +
          '</div>' +
          '<div class="app-card-footer">' +
            '<a class="app-button app-button-primary u-w-full" href="/Courses/Detail/' + course.id + '">' + escapeHtml(actionText) + '</a>' +
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
          '<div class="media-placeholder media-placeholder-exam u-mb-4" style="margin: 0 auto;"><span>Exam</span></div>' +
          '<h3 class="app-empty-title text-sm">' + escapeHtml(t("dashboard.studentPage.noPendingExamsTitle", null, "Khong co bai thi can lam")) + '</h3>' +
          '<p class="app-empty-copy text-xs">' + escapeHtml(t("dashboard.studentPage.noPendingExamsCopy", null, "Bai thi da xuat ban duoc giao se xuat hien tai day.")) + '</p>' +
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
              escapeHtml(exam.durationMinutes + " phut, diem dat " + exam.passScore + ", " + exam.questionCount + " cau hoi") +
            '</p>' +
          '</div>' +
          '<div class="student-exam-actions">' +
            '<span class="app-badge ' + getBadgeClass(exam.status) + '" style="font-size: 11px; padding: 2px 8px;">' + escapeHtml(exam.status) + '</span>' +
            '<a class="app-button app-button-secondary" href="/Exams/Start/' + exam.id + '" style="height: 32px; min-height: 32px; padding: 0 12px; font-size: 12px; border-radius: 8px;">' + escapeHtml(t("dashboard.studentPage.reviewRules", null, "Mo bai thi")) + '</a>' +
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
          '<div class="media-placeholder media-placeholder-certificate u-mb-4" style="margin: 0 auto;"><span>Cert</span></div>' +
          '<h3 class="app-empty-title text-sm">' + escapeHtml(t("dashboard.studentPage.noCertificatesTitle", null, "Chua co chung chi")) + '</h3>' +
          '<p class="app-empty-copy text-xs">' + escapeHtml(t("dashboard.studentPage.noCertificatesCopy", null, "Chung chi se duoc cap sau khi vuot qua bai thi.")) + '</p>' +
        '</div>'
      );
      return;
    }

    const latest = certificates[0];
    $container.html(
      '<div class="student-certificate-card student-dashboard-reveal is-visible" style="padding: 0; border: none; background: transparent;" data-dashboard-reveal>' +
        '<div class="media-placeholder media-placeholder-certificate u-mb-3" style="margin: 0 auto;"><span>Cert</span></div>' +
        '<h4 class="text-base font-semibold text-center u-mb-2" style="font-size: 15px; font-weight: 600; margin-top: 8px;">' + escapeHtml(latest.examName) + '</h4>' +
        '<p class="text-xs text-muted text-center u-mb-3" style="font-size: 12px; margin-bottom: 12px;">' + escapeHtml(latest.certificateCode) + '</p>' +
        '<div class="admin-summary-line u-flex u-justify-between text-xs u-mb-3" style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px;">' +
          '<span>' + escapeHtml(t("dashboard.studentPage.issueDate", null, "Ngay cap")) + '</span>' +
          '<strong>' + escapeHtml(latest.issueDate) + '</strong>' +
        '</div>' +
        '<a class="app-button app-button-secondary u-w-full" href="/Certificates">' + escapeHtml(t("dashboard.studentPage.previewCertificate", null, "Xem chung chi")) + '</a>' +
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
      Lms.apiClient.get("api/courses?page=1&pageSize=200"),
      Lms.apiClient.get("api/exams?page=1&pageSize=200"),
      Lms.apiClient.get("api/results/my?page=1&pageSize=200"),
      Lms.apiClient.get("api/certificates?page=1&pageSize=200")
    ).done(function (coursesResponse, examsResponse, resultsResponse, certificatesResponse) {
      state.courses = getItems(coursesResponse).map(function (item) {
        return {
          id: Number(item.id),
          name: item.name || "",
          code: item.code || "",
          description: item.description || "",
          completionRate: 0
        };
      });
      state.exams = getItems(examsResponse).map(function (item) {
        return {
          id: Number(item.id),
          name: item.name || "",
          durationMinutes: Number(item.durationMinutes || 0),
          passScore: Number(item.passScore || 0),
          questionCount: Number(item.questionCount || 0),
          status: item.isPublished ? "Published" : "Draft"
        };
      });
      state.results = getItems(resultsResponse).map(function (item) {
        return {
          id: Number(item.id),
          examName: item.examName || "",
          score: Number(item.score || 0),
          passed: Boolean(item.passed),
          submittedAt: item.completedDate
        };
      });
      state.certificates = getItems(certificatesResponse).map(function (item) {
        return {
          id: Number(item.id),
          examName: item.examName || "",
          certificateCode: item.certificateCode || "",
          issueDate: item.issuedDate ? new Date(item.issuedDate).toLocaleDateString() : "--"
        };
      });
      state.loaded = true;

      renderAll();
    }).fail(function (error) {
      if (Lms.ui && Lms.ui.showToast) {
        Lms.ui.showToast({
          type: "error",
          title: t("dashboard.studentPage.dataErrorTitle", null, "Loi du lieu dashboard"),
          message: error && error.message
            ? error.message
            : t("dashboard.studentPage.dataErrorMessage", null, "Khong the tai du lieu dashboard hoc vien tu backend.")
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
