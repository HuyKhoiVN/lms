(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    courses: [],
    filteredCourses: [],
    search: "",
    status: "",
    completion: ""
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function unwrap(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getItems(response) {
    const payload = unwrap(response);
    return payload && payload.data && Array.isArray(payload.data.items) ? payload.data.items : [];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function renderPageTitle() {
    document.title = t("courses.listPage.title", null, "Khóa học") + " - " + t("common.appName", null, "lms");
  }

  function getInitials(name) {
    return String(name || t("courses.listPage.courseFallback", null, "Khóa học"))
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function getBadgeClass(status) {
    return status === "Published" ? "lms-status-success" : "lms-status-muted";
  }

  function translateStatus(status) {
    return status === "Published"
      ? t("courses.listPage.statuses.Published", null, "Đang học")
      : t("courses.listPage.statuses.Draft", null, "Sắp mở");
  }

  function getCourseImage(index) {
    const images = [
      "/images/course-programming.jpg",
      "/images/course-ai-tech.jpg",
      "/images/course-business.jpg",
      "/images/course-softskills.jpg",
      "/images/course-languages.jpg",
      "/images/course-science.jpg"
    ];

    return images[index % images.length];
  }

  function setProgress($element, value) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    $element.css("width", safeValue + "%");
  }

  function renderMetrics() {
    const total = state.courses.length;
    const active = state.courses.filter(function (course) {
      return course.status === "Published";
    }).length;
    const materials = state.courses.reduce(function (sum, course) {
      return sum + Number(course.materialCount || 0);
    }, 0);
    const completion = total
      ? Math.round(state.courses.reduce(function (sum, course) {
        return sum + Number(course.completionRate || 0);
      }, 0) / total)
      : 0;

    $("[data-student-course-metric='total']").text(total);
    $("[data-student-course-metric='active']").text(active);
    $("[data-student-course-metric='materials']").text(materials);
    $("[data-student-course-metric='completion']").text(completion + "%");
  }

  function renderFocus() {
    const $container = $("#studentCourseFocus").empty();
    const focusCourse = state.courses.slice().sort(function (a, b) {
      return Number(b.completionRate || 0) - Number(a.completionRate || 0);
    })[0];

    if (!focusCourse) {
      $container.html(
        '<div class="lms-empty-compact">' +
          '<i class="bi bi-journal-bookmark" aria-hidden="true"></i>' +
          '<h3>Chưa có khóa học</h3>' +
          '<p>Khi có khóa học được giao, khu vực này sẽ đề xuất nội dung nên tiếp tục.</p>' +
        "</div>"
      );
      return;
    }

    $container.html(
      '<div class="student-course-focus-card">' +
        '<div class="student-course-focus-media image-slot image-slot-md image-slot-course" data-image-label="Course focus 320x180">' +
          '<img src="' + getCourseImage(Number(focusCourse.id) || 0) + '" alt="" aria-hidden="true" />' +
        "</div>" +
        '<div class="student-course-focus-copy">' +
          '<span class="' + getBadgeClass(focusCourse.status) + '">' + escapeHtml(translateStatus(focusCourse.status)) + "</span>" +
          "<h3>" + escapeHtml(focusCourse.name) + "</h3>" +
          "<p>" + escapeHtml(focusCourse.description) + "</p>" +
          '<div class="student-course-focus-progress">' +
            '<div class="lms-progress-track"><span style="width:' + Math.max(0, Math.min(100, Number(focusCourse.completionRate) || 0)) + '%"></span></div>' +
            "<strong>" + escapeHtml(focusCourse.completionRate) + "% hoàn thành</strong>" +
          "</div>" +
          '<a class="app-button app-button-primary" href="/LearningMaterials">Tiếp tục học</a>' +
        "</div>" +
      "</div>"
    );
  }

  function emptyMarkup() {
    return (
      '<div class="lms-empty-compact">' +
        '<i class="bi bi-search" aria-hidden="true"></i>' +
        "<h3>" + escapeHtml(t("courses.listPage.noCoursesTitle", null, "Không tìm thấy khóa học")) + "</h3>" +
        "<p>" + escapeHtml(t("courses.listPage.noCoursesCopy", null, "Thử điều chỉnh từ khóa hoặc mức tiến độ để xem kết quả phù hợp hơn.")) + "</p>" +
      "</div>"
    );
  }

  function renderCourses() {
    const $grid = $("#studentCourseGrid").empty();

    $("[data-student-course-count]").text(
      t("courses.listPage.records", { count: state.filteredCourses.length }, state.filteredCourses.length + " khóa học")
    );

    if (!state.filteredCourses.length) {
      $grid.html(emptyMarkup());
      initReveal();
      return;
    }

    state.filteredCourses.forEach(function (course, index) {
      const progress = Math.max(0, Math.min(100, Number(course.completionRate) || 0));
      const actionLabel = progress > 0 ? "Tiếp tục học" : "Mở khóa học";
      const $card = $(
        '<article class="student-course-card student-course-reveal" data-student-course-reveal>' +
          '<div class="student-course-card-media image-slot image-slot-md image-slot-course" data-image-label="Course card 320x180">' +
            '<img src="' + getCourseImage(index) + '" alt="" aria-hidden="true" />' +
          "</div>" +
          '<div class="student-course-card-body">' +
            '<div class="student-course-card-top">' +
              '<span class="student-course-thumb">' + escapeHtml(getInitials(course.name)) + "</span>" +
              '<span class="' + getBadgeClass(course.status) + '">' + escapeHtml(translateStatus(course.status)) + "</span>" +
            "</div>" +
            "<h3>" + escapeHtml(course.name) + "</h3>" +
            '<p class="student-course-card-copy">' + escapeHtml(course.description) + "</p>" +
            '<dl class="student-course-card-stats">' +
              "<div><dt>Tài liệu</dt><dd>" + escapeHtml(course.materialCount) + "</dd></div>" +
              "<div><dt>Học viên</dt><dd>" + escapeHtml(course.assignedCount) + "</dd></div>" +
            "</dl>" +
            '<div class="student-course-card-progress">' +
              '<div class="student-course-card-progress-label"><span>Tiến độ</span><strong>' + progress + "%</strong></div>" +
              '<div class="lms-progress-track"><span></span></div>' +
            "</div>" +
          "</div>" +
          '<div class="student-course-card-footer">' +
            '<a class="app-button app-button-secondary" href="/Exams">Bài thi liên quan</a>' +
            '<a class="app-button app-button-primary" href="/LearningMaterials">' + actionLabel + "</a>" +
          "</div>" +
        "</article>"
      );

      setProgress($card.find(".lms-progress-track span"), progress);
      $grid.append($card);
    });

    initReveal();
  }

  function render() {
    renderPageTitle();
    renderMetrics();
    renderFocus();
    renderCourses();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredCourses = state.courses.filter(function (course) {
      const matchesKeyword = !keyword
        || String(course.name).toLowerCase().includes(keyword)
        || String(course.description).toLowerCase().includes(keyword);
      const matchesStatus = !state.status || course.status === state.status;
      const matchesCompletion = !state.completion
        || (state.completion === "high" && Number(course.completionRate) >= 70)
        || (state.completion === "low" && Number(course.completionRate) < 70);

      return matchesKeyword && matchesStatus && matchesCompletion;
    });

    renderCourses();
  }

  function initReveal() {
    const $items = $("[data-student-course-reveal]").not("[data-student-course-reveal-ready]");

    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-student-course-reveal-ready", "true");
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
      this.style.setProperty("--reveal-delay", Math.min(index * 45, 180) + "ms");
      $(this).attr("data-student-course-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function bindEvents() {
    $("[data-student-course-filter='search']").on("input", function () {
      state.search = $(this).val();
      applyFilters();
    });

    $("[data-student-course-filter='status']").on("change", function () {
      state.status = $(this).val();
      applyFilters();
    });

    $("[data-student-course-filter='completion']").on("change", function () {
      state.completion = $(this).val();
      applyFilters();
    });

    $(document).on("click", "[data-student-course-action='clear-filters']", function () {
      state.search = "";
      state.status = "";
      state.completion = "";
      $("[data-student-course-filter='search'], [data-student-course-filter='status'], [data-student-course-filter='completion']").val("");
      applyFilters();
    });

    $(document).on("lms:i18n:changed", render);
  }

  function init() {
    bindEvents();
    initReveal();

    $.when(Lms.apiClient.get("courses.json")).done(function (coursesResponse) {
      state.courses = getItems(coursesResponse);
      state.filteredCourses = state.courses.slice();
      render();
    }).fail(function () {
      $("#studentCourseGrid").html(emptyMarkup());
      $("#studentCourseFocus").html(
        '<div class="lms-empty-compact">' +
          '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>' +
          '<h3>Không thể tải khóa học</h3>' +
          '<p>Vui lòng kiểm tra mock/courses.json và thử tải lại trang.</p>' +
        "</div>"
      );
      showToast(
        "error",
        t("courses.listPage.dataErrorTitle", null, "Lỗi dữ liệu khóa học"),
        t("courses.listPage.dataErrorMessage", null, "Không thể tải dữ liệu mô phỏng danh sách khóa học.")
      );
    });
  }

  $(init);
})(window, jQuery);
