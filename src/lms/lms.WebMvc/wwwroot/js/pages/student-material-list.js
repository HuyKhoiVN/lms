(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    materials: [],
    courses: [],
    progressByMaterialId: {},
    search: "",
    courseId: "",
    type: "",
    page: 1,
    pageSize: 6,
    total: 0,
    searchTimer: null
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

  function unwrap(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getData(response) {
    const payload = unwrap(response);
    return payload && payload.data ? payload.data : null;
  }

  function getPagedData(response) {
    const data = getData(response) || {};
    return {
      items: Array.isArray(data.items) ? data.items : [],
      total: Number(data.total || 0),
      page: Number(data.page || state.page || 1),
      pageSize: Number(data.pageSize || state.pageSize || 6)
    };
  }

  function getItems(response) {
    return getPagedData(response).items;
  }

  function getCourse(courseId) {
    return state.courses.find(function (course) {
      return Number(course.id) === Number(courseId);
    });
  }

  function getMaterialProgress(materialId) {
    return state.progressByMaterialId[Number(materialId)] || null;
  }

  function clampProgress(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  }

  function getContentTypeLabel(type) {
    const labels = {
      Text: t("materials.studentListPage.typeText", null, "Văn bản"),
      Pdf: t("materials.studentListPage.typePdf", null, "PDF"),
      File: t("materials.studentListPage.typeFile", null, "Tệp"),
      Link: t("materials.studentListPage.typeLink", null, "Liên kết"),
      Image: t("materials.studentListPage.typeImage", null, "Hình ảnh"),
      Video: t("materials.studentListPage.typeVideo", null, "Video"),
      Mixed: t("materials.studentListPage.typeMixed", null, "Tổng hợp")
    };

    return labels[type] || type || labels.Text;
  }

  function getFileExtension(material) {
    const fileName = String(material.originalFileName || "");
    const match = fileName.match(/\.([^.]+)$/);
    if (match) {
      return match[1].toUpperCase();
    }
    if (material.contentType === "Pdf") {
      return "PDF";
    }
    if (material.contentType === "Link") {
      return "LINK";
    }
    if (material.contentType === "Text") {
      return "TEXT";
    }
    return material.contentType ? String(material.contentType).toUpperCase() : "FILE";
  }

  function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (!size) {
      return "";
    }
    if (size >= 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1).replace(/\.0$/, "") + " MB";
    }
    return Math.max(1, Math.round(size / 1024)) + " KB";
  }

  function getTypeTone(type, extension) {
    const ext = String(extension || "").toLowerCase();
    if (type === "Pdf" || ext === "pdf") {
      return "pdf";
    }
    if (type === "Link") {
      return "link";
    }
    if (type === "Video") {
      return "video";
    }
    if (type === "Text" || ext === "doc" || ext === "docx" || ext === "txt") {
      return "text";
    }
    if (ext === "zip" || ext === "rar" || ext === "7z") {
      return "archive";
    }
    return "file";
  }

  function getTypeIcon(type, tone) {
    if (tone === "pdf") {
      return "bi-file-earmark-pdf";
    }
    if (tone === "link") {
      return "bi-link-45deg";
    }
    if (tone === "archive") {
      return "bi-folder2";
    }
    if (tone === "video") {
      return "bi-play-btn";
    }
    if (tone === "text") {
      return "bi-file-text";
    }
    if (type === "Image") {
      return "bi-image";
    }
    return "bi-file-earmark";
  }

  function getActionLabel(material) {
    if (material.contentType === "Link") {
      return "Truy cập";
    }
    if (material.contentType === "File") {
      const extension = getFileExtension(material).toLowerCase();
      if (extension === "zip" || extension === "rar" || extension === "7z") {
        return "Tải xuống";
      }
    }
    if (material.contentType === "Text" || material.contentType === "Mixed") {
      return "Tiếp tục đọc";
    }
    return "Mở tài liệu";
  }

  function getActionIcon(material) {
    if (material.contentType === "Link") {
      return "bi-link-45deg";
    }
    if (getActionLabel(material) === "Tải xuống") {
      return "bi-download";
    }
    if (material.contentType === "Text" || material.contentType === "Mixed") {
      return "bi-journal-text";
    }
    return "bi-book";
  }

  function buildMaterialUrl() {
    const query = new URLSearchParams();
    query.set("page", String(state.page));
    query.set("pageSize", String(state.pageSize));

    if (state.search.trim()) {
      query.set("keyword", state.search.trim());
    }

    if (state.courseId) {
      query.set("courseId", state.courseId);
    }

    if (state.type) {
      query.set("contentType", state.type);
    }

    return "api/learning-materials?" + query.toString();
  }

  function normalizeMaterial(item) {
    return {
      id: Number(item.id),
      courseId: Number(item.courseId),
      title: item.title || "",
      contentType: item.contentType || "Text",
      order: Number(item.order || 0),
      hasFile: Boolean(item.hasFile),
      externalLink: item.externalLink || "",
      originalFileName: item.originalFileName || "",
      fileSize: item.fileSize || null,
      fileContentType: item.fileContentType || ""
    };
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

  function renderErrorState(message) {
    return (
      '<div class="lms-empty-compact student-material-empty student-material-reveal is-visible" data-material-reveal>' +
        '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("materials.studentListPage.loadErrorTitle", null, "Không thể tải tài liệu")) + "</h3>" +
        '<p>' + escapeHtml(message || t("materials.studentListPage.loadErrorCopy", null, "Vui lòng kiểm tra API learning materials.")) + "</p>" +
      "</div>"
    );
  }

  function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
    const from = state.total ? ((state.page - 1) * state.pageSize) + 1 : 0;
    const to = state.total ? Math.min(state.total, state.page * state.pageSize) : 0;

    $("[data-student-material-count]").text(
      t("materials.studentListPage.records", { count: state.total }, state.total + " tài liệu")
    );
    $("[data-student-material-page-summary]").text(
      state.total
        ? "Hiển thị " + from + "-" + to + " trong " + state.total + " tài liệu"
        : "Hiển thị 0 tài liệu"
    );
    $("[data-student-material-page-indicator]").text(state.page + " / " + totalPages);
    $("[data-student-material-page='prev']").prop("disabled", state.page <= 1);
    $("[data-student-material-page='next']").prop("disabled", state.page >= totalPages);
  }

  function renderMaterialCard(material) {
    const course = getCourse(material.courseId);
    const courseName = course ? course.name : t("materials.studentListPage.unknownCourse", null, "Khóa học không xác định");
    const progress = getMaterialProgress(material.id);
    const progressPercent = clampProgress(progress ? progress.progressPercent : 0);
    const extension = getFileExtension(material);
    const size = formatFileSize(material.fileSize);
    const tone = getTypeTone(material.contentType, extension);
    const typeLabel = getContentTypeLabel(material.contentType);
    const metaParts = [extension];

    if (size) {
      metaParts.push(size);
    } else if (material.contentType === "Link" && material.externalLink) {
      metaParts[0] = material.externalLink;
    }

    return (
      '<article class="student-material-card student-material-reveal" data-material-reveal>' +
        '<div class="student-material-card-top">' +
          '<span class="student-material-icon student-material-icon-' + tone + '" aria-hidden="true"><i class="bi ' + getTypeIcon(material.contentType, tone) + '"></i></span>' +
          '<span class="student-material-type-badge student-material-type-' + tone + '">' + escapeHtml(typeLabel) + "</span>" +
          '<span class="student-material-menu" aria-hidden="true"><i class="bi bi-three-dots"></i></span>' +
        "</div>" +
        '<h3 class="student-material-card-title">' + escapeHtml(material.title) + "</h3>" +
        '<p class="student-material-course"><span>Khóa học:</span> ' + escapeHtml(courseName) + "</p>" +
        '<div class="student-material-meta-row">' +
          "<span>" + escapeHtml(metaParts.join(" • ")) + "</span>" +
          '<span>' + escapeHtml(progressPercent + "% đã đọc") + "</span>" +
        "</div>" +
        '<div class="student-material-progress" aria-hidden="true"><span style="width: ' + progressPercent + '%"></span></div>' +
        '<a class="student-material-action" href="/LearningMaterials/Viewer/' + material.id + '">' +
          '<i class="bi ' + getActionIcon(material) + '" aria-hidden="true"></i>' +
          '<span>' + escapeHtml(getActionLabel(material)) + "</span>" +
        "</a>" +
      "</article>"
    );
  }

  function renderMaterials() {
    const $grid = $("#studentMaterialGrid").empty();

    renderPagination();

    if (!state.materials.length) {
      $grid.html(renderEmptyState());
      $("[data-student-material-primary-link]").addClass("is-disabled").attr("aria-disabled", "true").attr("href", "#");
      initMaterialReveal();
      return;
    }

    $grid.html(state.materials.map(renderMaterialCard).join(""));
    const firstMaterial = state.materials[0];
    $("[data-student-material-primary-link]")
      .toggleClass("is-disabled", !firstMaterial)
      .attr("aria-disabled", firstMaterial ? null : "true")
      .attr("href", firstMaterial ? "/LearningMaterials/Viewer/" + firstMaterial.id : "#");
    initMaterialReveal();
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

  function loadMaterials() {
    if (!Lms.apiClient) {
      $("#studentMaterialGrid").html(renderErrorState());
      return;
    }

    Lms.apiClient.get(buildMaterialUrl()).done(function (response) {
      const pageData = getPagedData(response);
      state.materials = pageData.items.map(normalizeMaterial);
      state.total = pageData.total;
      state.page = pageData.page;
      state.pageSize = pageData.pageSize || state.pageSize;
      renderMaterials();
    }).fail(function (error) {
      $("#studentMaterialGrid").html(renderErrorState(error && error.message ? error.message : null));
      initMaterialReveal();
    });
  }

  function bindEvents() {
    $("[data-student-material-filter='search']").on("input", function () {
      window.clearTimeout(state.searchTimer);
      state.search = $(this).val();
      state.page = 1;
      state.searchTimer = window.setTimeout(loadMaterials, 250);
    });

    $("[data-student-material-filter='course']").on("change", function () {
      state.courseId = $(this).val();
      state.page = 1;
      loadMaterials();
    });

    $("[data-student-material-filter='type']").on("change", function () {
      state.type = $(this).val();
      state.page = 1;
      loadMaterials();
    });

    $("[data-student-material-action='clear-filters']").on("click", function () {
      state.search = "";
      state.courseId = "";
      state.type = "";
      state.page = 1;
      $("[data-student-material-filter='search']").val("");
      $("[data-student-material-filter='course']").val("");
      $("[data-student-material-filter='type']").val("");
      loadMaterials();
    });

    $(document).on("click", "[data-student-material-page]", function () {
      const direction = String($(this).data("student-material-page"));
      const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));

      if (direction === "prev" && state.page > 1) {
        state.page -= 1;
      }

      if (direction === "next" && state.page < totalPages) {
        state.page += 1;
      }

      loadMaterials();
    });

    $(document).on("lms:i18n:changed", function () {
      renderCourseOptions();
      renderMaterials();
    });
  }

  function loadSupportData() {
    $.when(
      Lms.apiClient.get("api/courses?page=1&pageSize=200"),
      Lms.apiClient.get("api/learning-progress/my?page=1&pageSize=500")
    ).done(function (coursesResponse, progressResponse) {
      state.courses = getItems(coursesResponse);
      state.progressByMaterialId = {};
      getItems(progressResponse).forEach(function (item) {
        state.progressByMaterialId[Number(item.learningMaterialId)] = item;
      });
      renderCourseOptions();
      loadMaterials();
    }).fail(function () {
      loadMaterials();
    });
  }

  function init() {
    bindEvents();
    initMaterialReveal();

    if (!Lms.apiClient) {
      $("#studentMaterialGrid").html(renderErrorState());
      return;
    }

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadSupportData);
      return;
    }

    loadSupportData();
  }

  $(init);
})(window, jQuery);
