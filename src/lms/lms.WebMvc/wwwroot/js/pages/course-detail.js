(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    courseId: 0,
    course: null,
    materials: [],
    progress: null
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

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
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

  function getInitials(name) {
    return String(name || t("courses.detailPage.courseFallback", null, "Khoa hoc"))
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function getApiOrigin() {
    return Lms.apiClient && Lms.apiClient.buildApiOrigin ? Lms.apiClient.buildApiOrigin() : "";
  }

  function resolveAssetUrl(url) {
    if (!url) {
      return "";
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return getApiOrigin() + (url.charAt(0) === "/" ? url : "/" + url);
  }

  function getBadgeClass(status) {
    return status === "Published" ? "app-badge-success" : "app-badge-muted";
  }

  function translateStatus(status) {
    return t("courses.detailPage.statuses." + status, null, status);
  }

  function setProgress(value) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    $("[data-course-detail-progress]").css("width", safeValue + "%");
  }

  function getCourseStatus() {
    return state.course && state.course.isPublished ? "Published" : "Draft";
  }

  function renderPageTitle() {
    const title = state.course ? state.course.name : t("courses.detailPage.title", null, "Chi tiet khoa hoc");
    document.title = title + " - " + t("common.appName", null, "lms");
  }

  function renderHeader() {
    if (!state.course) {
      $("[data-course-detail-name]").text(t("courses.detailPage.courseNotFoundTitle", null, "Khong tim thay khoa hoc"));
      $("[data-course-detail-description]").text(t("courses.detailPage.courseNotFoundCopy", null, "Ma khoa hoc duoc yeu cau khong ton tai trong he thong."));
      return;
    }

    $("[data-course-detail-name]").text(state.course.name);
    $("[data-course-detail-description]").text(state.course.description || state.course.code || "");
  }

  function renderMetrics() {
    const progressData = state.progress || { totalMaterials: 0, overallPercent: 0 };

    $("[data-course-detail-metric='status']").text(translateStatus(getCourseStatus()));
    $("[data-course-detail-metric='materials']").text(progressData.totalMaterials || state.materials.length);
    $("[data-course-detail-metric='assigned']").text("--");
    $("[data-course-detail-metric='completion']").text(Math.round(Number(progressData.overallPercent || 0)) + "%");
    $("[data-course-detail-count='materials']").text(
      t("courses.detailPage.materialCount", { count: state.materials.length }, state.materials.length + " tai lieu")
    );
  }

  function renderCourseInfo() {
    const status = getCourseStatus();
    const badgeClass = getBadgeClass(status);
    const percent = Math.round(Number(state.progress && state.progress.overallPercent ? state.progress.overallPercent : 0));

    $("[data-course-detail-status]")
      .removeClass("app-badge-success app-badge-muted")
      .addClass(badgeClass)
      .text(translateStatus(status));
    $("[data-course-detail-code]").text(getInitials(state.course.name));
    $("[data-course-detail-progress-badge]").text(
      t("courses.detailPage.complete", { percent: percent }, percent + "% hoan thanh")
    );
    $("[data-course-detail-title]").text(state.course.name);
    $("[data-course-detail-copy]").text(state.course.description || state.course.code || "");
    if (state.course.thumbnailUrl) {
      $(".admin-course-detail-image img").attr("src", resolveAssetUrl(state.course.thumbnailUrl));
    }
    setProgress(percent);
    $("[data-course-detail-action='publish']").text(
      state.course.isPublished
        ? t("courses.detailPage.unpublish", null, "Huy xuat ban")
        : t("courses.detailPage.publish", null, "Xuat ban")
    );
  }

  function renderMaterials() {
    const $container = $("#courseMaterialList").empty();

    if (!state.materials.length) {
      $container.append(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">M</div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("courses.detailPage.noMaterialsTitle", null, "Chua co tai lieu")) + "</h3>" +
          '<p class="app-empty-copy">' + escapeHtml(t("courses.detailPage.noMaterialsCopy", null, "Tai lieu hoc tap se hien thi tai day khi da duoc tao cho khoa hoc.")) + "</p>" +
        "</div>"
      );
      return;
    }

    state.materials.forEach(function (material) {
      const meta = [
        material.contentType,
        t("courses.detailPage.materialOrder", { order: material.order || 0 }, "Thu tu " + (material.order || 0)),
        material.hasFile ? t("courses.detailPage.materialHasFile", null, "Co tep dinh kem") : null
      ].filter(Boolean).join(" / ");

      $container.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">' + escapeHtml(String(material.contentType || "T").charAt(0).toUpperCase()) + "</span>" +
            "<div>" +
              "<strong>" + escapeHtml(material.title) + "</strong>" +
              "<span>" + escapeHtml(meta) + "</span>" +
            "</div>" +
          "</div>" +
          '<span class="app-badge app-badge-info">' + escapeHtml(material.contentType) + "</span>" +
        "</div>"
      );
    });
  }

  function renderAssignments() {
    const emptyUsers =
      '<div class="app-empty-state">' +
        '<div class="app-empty-icon" aria-hidden="true">A</div>' +
        '<h3 class="app-empty-title">' + escapeHtml(t("courses.detailPage.noUsersTitle", null, "Chua co danh sach hoc vien")) + "</h3>" +
        '<p class="app-empty-copy">' + escapeHtml(t("courses.detailPage.assignmentReadPending", null, "Backend chua co API doc danh sach assignment theo khoa hoc cho man hinh nay.")) + "</p>" +
      "</div>";
    const emptyGroups =
      '<div class="app-empty-state">' +
        '<div class="app-empty-icon" aria-hidden="true">G</div>' +
        '<h3 class="app-empty-title">' + escapeHtml(t("courses.detailPage.noGroupsTitle", null, "Chua co danh sach nhom")) + "</h3>" +
        '<p class="app-empty-copy">' + escapeHtml(t("courses.detailPage.assignmentReadPending", null, "Backend chua co API doc danh sach assignment theo khoa hoc cho man hinh nay.")) + "</p>" +
      "</div>";

    $("#courseAssignedUsers").html(emptyUsers);
    $("#courseAssignedGroups").html(emptyGroups);
  }

  function render() {
    renderPageTitle();
    renderHeader();

    if (!state.course) {
      return;
    }

    renderMetrics();
    renderCourseInfo();
    renderMaterials();
    renderAssignments();
  }

  function togglePublish() {
    if (!state.course) {
      return;
    }

    const endpoint = state.course.isPublished
      ? "api/courses/" + state.course.id + "/unpublish"
      : "api/courses/" + state.course.id + "/publish";

    Lms.apiClient.post(endpoint, {}).done(function (response) {
      const data = getResponseData(response);
      state.course = data || state.course;
      render();
      showToast(
        "success",
        state.course.isPublished
          ? t("courses.detailPage.publishedTitle", null, "Da xuat ban khoa hoc")
          : t("courses.detailPage.unpublishedTitle", null, "Da huy xuat ban khoa hoc"),
        state.course.isPublished
          ? t("courses.detailPage.publishedMessage", { name: state.course.name }, state.course.name + " da duoc xuat ban.")
          : t("courses.detailPage.unpublishedMessage", { name: state.course.name }, state.course.name + " da duoc chuyen ve ban nhap.")
      );
    }).fail(function (xhr) {
      const message = xhr && xhr.responseJSON && xhr.responseJSON.message
        ? xhr.responseJSON.message
        : t("courses.detailPage.publishErrorMessage", null, "Khong the cap nhat trang thai khoa hoc.");
      showToast("error", t("courses.detailPage.publishErrorTitle", null, "Cap nhat trang thai that bai"), message);
    });
  }

  function bindEvents() {
    $(document).on("click", "[data-course-detail-action='publish']", togglePublish);
    $(document).on("lms:i18n:changed", render);
  }

  function renderLoadError(message) {
    $("#courseMaterialList, #courseAssignedUsers, #courseAssignedGroups").html(
      '<div class="app-empty-state">' +
        '<div class="app-empty-icon" aria-hidden="true">!</div>' +
        '<h3 class="app-empty-title">' + escapeHtml(t("courses.detailPage.loadErrorTitle", null, "Khong the tai chi tiet khoa hoc")) + "</h3>" +
        '<p class="app-empty-copy">' + escapeHtml(message || t("courses.detailPage.loadErrorCopy", null, "Vui long kiem tra API chi tiet khoa hoc.")) + "</p>" +
      "</div>"
    );
  }

  function loadCourseDetail() {
    state.courseId = Number($("[data-course-detail-id]").data("course-detail-id"));

    $.when(
      Lms.apiClient.get("api/courses/" + state.courseId),
      Lms.apiClient.get("api/learning-materials?page=1&pageSize=500&courseId=" + state.courseId),
      Lms.apiClient.get("api/courses/" + state.courseId + "/progress")
    ).done(function (courseResponse, materialsResponse, progressResponse) {
      state.course = getResponseData(courseResponse);
      state.materials = getResponseItems(materialsResponse);
      state.progress = getResponseData(progressResponse);
      render();
    }).fail(function (xhr) {
      const message = xhr && xhr.responseJSON && xhr.responseJSON.message
        ? xhr.responseJSON.message
        : t("courses.detailPage.dataErrorMessage", null, "Khong the tai du lieu chi tiet khoa hoc tu backend.");
      renderLoadError(message);
      showToast("error", t("courses.detailPage.dataErrorTitle", null, "Loi chi tiet khoa hoc"), message);
    });
  }

  function init() {
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadCourseDetail);
      return;
    }

    loadCourseDetail();
  }

  $(init);
})(window, jQuery);
