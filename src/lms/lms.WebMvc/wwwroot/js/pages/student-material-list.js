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

  function getTypeBadgeClass(type) {
    if (type === "Pdf") {
      return "app-badge-danger";
    }

    if (type === "File") {
      return "app-badge-warning";
    }

    if (type === "Link") {
      return "app-badge-info";
    }

    return "app-badge-success";
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

  function getMaterialImage(type) {
    const images = {
      Text: "/images/reading-library.jpg",
      Pdf: "/images/online-learning-banner.jpg",
      File: "/images/online-tutor-lesson.jpg",
      Link: "/images/study-collaboration.jpg"
    };
    return images[type] || "/images/reading-library.jpg";
  }

  function getMaterialSlotClass(type) {
    return type === "Link" ? "image-slot-dashboard" : "image-slot-material";
  }

  function renderCourseOptions() {
    const $filter = $("[data-student-material-filter='course']");
    const currentValue = $filter.val();

    $filter.find("option:not(:first)").remove();
    state.courses.forEach(function (course) {
      $filter.append('<option value="' + course.id + '">' + escapeHtml(course.name) + '</option>');
    });
    $filter.val(currentValue || "");
  }

  function render() {
    const $grid = $("#studentMaterialGrid").empty();
    const progress = getProgress();

    $("[data-student-material-count]").text(t("materials.studentListPage.records", { count: state.filteredMaterials.length }, state.filteredMaterials.length + " tài liệu"));

    if (!state.filteredMaterials.length) {
      $grid.append(
        '<div class="app-empty-state">' +
          '<div class="image-slot image-slot-sm image-slot-material u-mb-4" data-image-label="Material"></div>' +
          '<h3 class="app-empty-title">' + t("materials.studentListPage.noMaterialsFoundTitle", null, "Không tìm thấy tài liệu") + '</h3>' +
          '<p class="app-empty-copy">' + t("materials.studentListPage.noMaterialsFoundCopy", null, "Hãy thử bộ lọc từ khóa, khóa học hoặc loại khác.") + '</p>' +
        '</div>'
      );
      return;
    }

    state.filteredMaterials.forEach(function (material, index) {
      const course = getCourse(material.courseId);
      const completed = Boolean(progress[material.id]);
      const cardClass = ["learning-card-safety", "learning-card-service", "learning-card-exam"][index % 3];

      $grid.append(
        '<article class="app-card learning-card student-material-card ' + cardClass + '">' +
          '<div class="app-card-body">' +
            '<div class="image-slot image-slot-md ' + getMaterialSlotClass(material.contentType) + ' student-material-image" data-image-label="' + escapeHtml(getContentTypeLabel(material.contentType)) + '">' +
              '<img src="' + getMaterialImage(material.contentType) + '" alt="" aria-hidden="true">' +
            '</div>' +
            '<div class="course-thumb student-course-thumb-compact">' +
              '<span class="course-thumb-code">' + escapeHtml(material.contentType.charAt(0).toUpperCase()) + '</span>' +
              '<span class="app-badge ' + getTypeBadgeClass(material.contentType) + '">' + escapeHtml(getContentTypeLabel(material.contentType)) + '</span>' +
            '</div>' +
            '<h3 class="app-card-title">' + escapeHtml(material.title) + '</h3>' +
            '<p class="app-card-subtitle">' + escapeHtml(course ? course.name : t("materials.studentListPage.unknownCourse", null, "Khóa học không xác định")) + '</p>' +
            '<div class="admin-summary-line u-mt-4">' +
              '<span>' + t("materials.studentListPage.durationLabel", null, "Thời lượng") + '</span><strong>' + t("materials.studentListPage.durationMinutes", { minutes: material.durationMinutes }, material.durationMinutes + " phút") + '</strong>' +
            '</div>' +
            '<div class="admin-summary-line u-mt-4">' +
              '<span>' + t("materials.studentListPage.progressLabel", null, "Tiến trình") + '</span><strong>' + (completed ? t("materials.studentListPage.completed", null, "Đã hoàn thành") : t("materials.studentListPage.notStarted", null, "Chưa bắt đầu")) + '</strong>' +
            '</div>' +
          '</div>' +
          '<div class="app-card-footer">' +
            '<a class="app-button app-button-primary" href="/LearningMaterials/Viewer/' + material.id + '">' + (completed ? t("materials.studentListPage.buttonReview", null, "Xem lại") : t("materials.studentListPage.buttonOpen", null, "Mở")) + '</a>' +
          '</div>' +
        '</article>'
      );
    });
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredMaterials = state.materials.filter(function (material) {
      const matchesKeyword = !keyword || material.title.toLowerCase().includes(keyword);
      const matchesCourse = !state.courseId || material.courseId === Number(state.courseId);
      const matchesType = !state.type || material.contentType === state.type;

      return matchesKeyword && matchesCourse && matchesType;
    });

    render();
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

  function init() {
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
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
      $("#studentMaterialGrid").html(
        '<div class="app-empty-state">' +
          '<div class="image-slot image-slot-sm image-slot-material u-mb-4" data-image-label="Error"></div>' +
          '<h3 class="app-empty-title">' + t("materials.studentListPage.loadErrorTitle", null, "Không thể tải tài liệu") + '</h3>' +
          '<p class="app-empty-copy">' + t("materials.studentListPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/learning-materials.json.") + '</p>' +
        '</div>'
      );
    });
  }

  $(init);
})(window, jQuery);
