(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const notesKey = "lms.student.materialNotes";
  const state = {
    materials: [],
    filteredMaterials: [],
    courses: [],
    progressByMaterialId: {},
    search: "",
    courseId: "",
    type: ""
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getResponsePayload(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getResponseData(response) {
    const payload = getResponsePayload(response);
    return payload && payload.data ? payload.data : null;
  }

  function getResponseItems(response) {
    const data = getResponseData(response);
    return data && Array.isArray(data.items) ? data.items : [];
  }

  function getNotes() {
    return Lms.storage ? Lms.storage.get(notesKey, {}) : {};
  }

  function getCourse(courseId) {
    return state.courses.find(function (course) {
      return course.id === Number(courseId);
    });
  }

  function getMaterialProgress(materialId) {
    return state.progressByMaterialId[Number(materialId)] || null;
  }

  function isCompleted(materialId) {
    const progress = getMaterialProgress(materialId);
    return Boolean(progress && progress.isCompleted);
  }

  function getContentTypeLabel(type) {
    const labels = {
      Text: t("materials.studentListPage.typeText", null, "Van ban"),
      Pdf: t("materials.studentListPage.typePdf", null, "PDF"),
      File: t("materials.studentListPage.typeFile", null, "Tep tin"),
      Link: t("materials.studentListPage.typeLink", null, "Lien ket")
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
        '<h3>' + escapeHtml(t("materials.studentListPage.noMaterialsFoundTitle", null, "Khong tim thay tai lieu phu hop.")) + "</h3>" +
        '<p>' + escapeHtml(t("materials.studentListPage.noMaterialsFoundCopy", null, "Hay thu doi tu khoa, khoa hoc hoac loai tai lieu khac.")) + "</p>" +
      "</div>"
    );
  }

  function renderErrorState(message) {
    return (
      '<div class="lms-empty-compact">' +
        '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("materials.studentListPage.loadErrorTitle", null, "Khong the tai tai lieu")) + "</h3>" +
        '<p>' + escapeHtml(message || t("materials.studentListPage.loadErrorCopy", null, "Vui long kiem tra API learning materials.")) + "</p>" +
      "</div>"
    );
  }

  function renderMaterialCard(material) {
    const course = getCourse(material.courseId);
    const completed = isCompleted(material.id);
    const actionText = completed
      ? t("materials.studentListPage.buttonReview", null, "Xem lai")
      : t("materials.studentListPage.buttonOpen", null, "Mo");
    const courseName = course ? course.name : t("materials.studentListPage.unknownCourse", null, "Khoa hoc khong xac dinh");
    const progress = getMaterialProgress(material.id);
    const progressPercent = progress ? Math.round(Number(progress.progressPercent || 0)) : 0;
    const statusText = completed
      ? t("materials.studentListPage.completed", null, "Da hoan thanh")
      : progressPercent > 0
        ? t("materials.studentListPage.inProgress", null, "Dang hoc")
        : t("materials.studentListPage.notStarted", null, "Chua bat dau");
    const notes = getNotes();
    const hasNote = Boolean(notes[material.id]);

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
          '<span>' + escapeHtml(t("materials.studentListPage.orderValue", { order: material.order }, "Thu tu " + material.order)) + "</span>" +
          '<span class="' + getProgressBadgeClass(completed) + '">' + escapeHtml(statusText) + "</span>" +
        "</div>" +
        '<div class="student-material-meta-row">' +
          "<span>" + escapeHtml(progressPercent + "%") + "</span>" +
          "<span>" + escapeHtml(hasNote ? t("materials.studentListPage.hasNote", null, "Co ghi chu") : t("materials.studentListPage.noNote", null, "Chua ghi chu")) + "</span>" +
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
      t("materials.studentListPage.records", { count: state.filteredMaterials.length }, state.filteredMaterials.length + " tai lieu")
    );

    if (!state.filteredMaterials.length) {
      $grid.append(renderEmptyState());
      $("[data-student-material-primary-link]").addClass("is-disabled").attr("aria-disabled", "true").attr("href", "#");
      return;
    }

    $grid.html(state.filteredMaterials.map(renderMaterialCard).join(""));
    const firstMaterial = state.filteredMaterials[0];
    const href = firstMaterial ? "/LearningMaterials/Viewer/" + firstMaterial.id : "#";
    $("[data-student-material-primary-link]")
      .toggleClass("is-disabled", !firstMaterial)
      .attr("aria-disabled", firstMaterial ? null : "true")
      .attr("href", href);
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
      Lms.apiClient.get("api/learning-materials?page=1&pageSize=500"),
      Lms.apiClient.get("api/courses?page=1&pageSize=200"),
      Lms.apiClient.get("api/learning-progress/my?page=1&pageSize=500")
    ).done(function (materialsResponse, coursesResponse, progressResponse) {
      state.materials = getResponseItems(materialsResponse).map(function (item) {
        return {
          id: Number(item.id),
          courseId: Number(item.courseId),
          title: item.title || "",
          contentType: item.contentType || "Text",
          order: Number(item.order || 0),
          hasFile: Boolean(item.hasFile)
        };
      });
      state.courses = getResponseItems(coursesResponse);
      state.progressByMaterialId = {};
      getResponseItems(progressResponse).forEach(function (item) {
        state.progressByMaterialId[Number(item.learningMaterialId)] = item;
      });
      state.filteredMaterials = state.materials.slice();
      renderCourseOptions();
      render();
    }).fail(function (error) {
      $("#studentMaterialGrid").html(renderErrorState(error && error.message ? error.message : null));
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
