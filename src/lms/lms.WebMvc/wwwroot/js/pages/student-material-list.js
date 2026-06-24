(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    materials: [],
    filteredMaterials: [],
    courses: [],
    search: "",
    courseId: "",
    type: ""
  };
  const progressKey = "lms.student.materialProgress";

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

  function getProgress() {
    return Lms.storage ? Lms.storage.get(progressKey, {}) : {};
  }

  function getCourse(courseId) {
    return state.courses.find(function (course) {
      return course.id === Number(courseId);
    });
  }

  function getContentTypeLabel(type) {
    const labels = {
      Text: t("materials.studentListPage.typeText", null, "Văn bản"),
      Pdf: t("materials.studentListPage.typePdf", null, "PDF"),
      File: t("materials.studentListPage.typeFile", null, "Tệp tin"),
      Link: t("materials.studentListPage.typeLink", null, "Liên kết")
    };
    return labels[type] || type;
  }

  function getTypeBadgeClass(type) {
    if (type === "Pdf") {
      return "lms-status-danger";
    }

    if (type === "File") {
      return "lms-status-warning";
    }

    if (type === "Link") {
      return "lms-status-info";
    }

    return "lms-status-success";
  }

  function getTypeMarkClass(type) {
    const classes = {
      Text: "is-text",
      Pdf: "is-pdf",
      File: "is-file",
      Link: "is-link"
    };
    return classes[type] || "is-text";
  }

  function getTypeIcon(type) {
    const icons = {
      Text: "bi-file-text",
      Pdf: "bi-file-earmark-pdf",
      File: "bi-paperclip",
      Link: "bi-link-45deg"
    };
    return icons[type] || "bi-file-earmark";
  }

  function getProgressBadgeClass(completed) {
    return completed ? "lms-status-success" : "lms-status-muted";
  }

  function renderCourseOptions() {
    const $filter = $("[data-student-material-filter='course']");
    const currentValue = $filter.val();

    $filter.find("option:not(:first)").remove();
    state.courses.forEach(function (course) {
      $filter.append('<option value="' + course.id + '">' + escapeHtml(course.name) + "</option>");
    });
    $filter.val(currentValue || "");
  }

  function renderEmptyState() {
    return (
      '<div class="lms-empty-compact student-material-empty student-material-reveal is-visible" data-material-reveal>' +
        '<i class="bi bi-folder2-open" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("materials.studentListPage.noMaterialsFoundTitle", null, "Không tìm thấy tài liệu phù hợp.")) + "</h3>" +
        '<p>' + escapeHtml(t("materials.studentListPage.noMaterialsFoundCopy", null, "Hãy thử đổi từ khóa, khóa học hoặc loại tài liệu khác.")) + "</p>" +
      "</div>"
    );
  }

  function renderErrorState() {
    return (
      '<div class="lms-empty-compact">' +
        '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("materials.studentListPage.loadErrorTitle", null, "Không thể tải tài liệu")) + "</h3>" +
        '<p>' + escapeHtml(t("materials.studentListPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/learning-materials.json.")) + "</p>" +
      "</div>"
    );
  }

  function renderMaterialCard(material) {
    const course = getCourse(material.courseId);
    const completed = Boolean(getProgress()[material.id]);
    const statusText = completed
      ? t("materials.studentListPage.completed", null, "Đã hoàn thành")
      : t("materials.studentListPage.notStarted", null, "Chưa bắt đầu");
    const actionText = completed
      ? t("materials.studentListPage.buttonReview", null, "Xem lại")
      : t("materials.studentListPage.buttonOpen", null, "Mở");
    const courseName = course ? course.name : t("materials.studentListPage.unknownCourse", null, "Khóa học không xác định");

    return (
      '<article class="student-material-card student-material-reveal" data-material-reveal>' +
        '<div class="student-material-type-row">' +
          '<span class="student-material-type-mark ' + getTypeMarkClass(material.contentType) + '" aria-hidden="true">' +
            '<i class="bi ' + getTypeIcon(material.contentType) + '"></i>' +
          "</span>" +
          '<span class="' + getTypeBadgeClass(material.contentType) + '">' + escapeHtml(getContentTypeLabel(material.contentType)) + "</span>" +
        "</div>" +
        '<h3 class="student-material-card-title">' + escapeHtml(material.title) + "</h3>" +
        '<p class="student-material-course">' + escapeHtml(courseName) + "</p>" +
        '<div class="student-material-meta-row">' +
          '<span>' + escapeHtml(t("materials.studentListPage.durationMinutes", { minutes: material.durationMinutes }, material.durationMinutes + " phút")) + "</span>" +
          '<span class="' + getProgressBadgeClass(completed) + '">' + escapeHtml(statusText) + "</span>" +
        "</div>" +
        '<div class="student-material-card-footer">' +
          '<a class="app-button app-button-primary" href="/LearningMaterials/Viewer/' + material.id + '">' + escapeHtml(actionText) + "</a>" +
        "</div>" +
      "</article>"
    );
  }

  function render() {
    const $grid = $("#studentMaterialGrid").empty();

    $("[data-student-material-count]").text(
      t("materials.studentListPage.records", { count: state.filteredMaterials.length }, state.filteredMaterials.length + " tài liệu")
    );

    if (!state.filteredMaterials.length) {
      $grid.append(renderEmptyState());
      return;
    }

    $grid.html(state.filteredMaterials.map(renderMaterialCard).join(""));
    initMaterialReveal();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredMaterials = state.materials.filter(function (material) {
      const course = getCourse(material.courseId);
      const materialTitle = String(material.title || "").toLowerCase();
      const courseName = String(course ? course.name : "").toLowerCase();
      const matchesKeyword = !keyword || materialTitle.includes(keyword) || courseName.includes(keyword);
      const matchesCourse = !state.courseId || material.courseId === Number(state.courseId);
      const matchesType = !state.type || material.contentType === state.type;

      return matchesKeyword && matchesCourse && matchesType;
    });

    render();
  }

  function initMaterialReveal() {
    const $items = $("[data-material-reveal]").not("[data-material-reveal-ready]");

    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-material-reveal-ready", "true");
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
      $(this).attr("data-material-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function bindEvents() {
    $("[data-student-material-filter='search']").on("input", function () {
      state.search = $(this).val();
      applyFilters();
    });

    $("[data-student-material-filter='course']").on("change", function () {
      state.courseId = $(this).val();
      applyFilters();
    });

    $("[data-student-material-filter='type']").on("change", function () {
      state.type = $(this).val();
      applyFilters();
    });

    $("[data-student-material-action='clear-filters']").on("click", function () {
      state.search = "";
      state.courseId = "";
      state.type = "";
      $("[data-student-material-filter='search']").val("");
      $("[data-student-material-filter='course']").val("");
      $("[data-student-material-filter='type']").val("");
      applyFilters();
    });

    $(document).on("lms:i18n:changed", function () {
      renderCourseOptions();
      render();
    });
  }

  function loadPageData() {
    if (!Lms.apiClient) {
      $("#studentMaterialGrid").html(renderErrorState());
      return;
    }

    $.when(
      Lms.apiClient.get("learning-materials.json"),
      Lms.apiClient.get("courses.json")
    ).done(function (materialsResponse, coursesResponse) {
      state.materials = getItems(materialsResponse);
      state.courses = getItems(coursesResponse);
      state.filteredMaterials = state.materials.slice();
      renderCourseOptions();
      render();
    }).fail(function () {
      $("#studentMaterialGrid").html(renderErrorState());
    });
  }

  function init() {
    bindEvents();
    initMaterialReveal();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }

    loadPageData();
  }

  $(init);
})(window, jQuery);
