(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    courseId: 0,
    course: null,
    materials: [],
    users: [],
    groups: []
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

  function getById(items, id) {
    return items.find(function (item) {
      return item.id === Number(id);
    });
  }

  function getInitials(name) {
    return String(name || t("courses.detailPage.courseFallback", null, "Khóa học"))
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
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

  function renderPageTitle() {
    const title = state.course ? state.course.name : t("courses.detailPage.title", null, "Chi tiết khóa học");
    document.title = title + " - " + t("common.appName", null, "lms");
  }

  function getAssignedUsers() {
    return state.users.filter(function (user) {
      return user.role === "Student";
    }).slice(0, Math.max(1, Math.min(3, Number(state.course.assignedCount || 0))));
  }

  function getAssignedGroups() {
    return state.groups.slice(0, Math.max(1, Math.min(state.groups.length, Number(state.course.id || 1))));
  }

  function renderHeader() {
    if (!state.course) {
      $("[data-course-detail-name]").text(t("courses.detailPage.courseNotFoundTitle", null, "Không tìm thấy khóa học"));
      $("[data-course-detail-description]").text(t("courses.detailPage.courseNotFoundCopy", null, "Mã khóa học được yêu cầu không tồn tại trong dữ liệu mô phỏng."));
      return;
    }

    $("[data-course-detail-name]").text(state.course.name);
    $("[data-course-detail-description]").text(state.course.description);
  }

  function renderMetrics() {
    $("[data-course-detail-metric='status']").text(translateStatus(state.course.status));
    $("[data-course-detail-metric='materials']").text(state.materials.length);
    $("[data-course-detail-metric='assigned']").text(state.course.assignedCount);
    $("[data-course-detail-metric='completion']").text(state.course.completionRate + "%");
    $("[data-course-detail-count='materials']").text(t("courses.detailPage.materialCount", { count: state.materials.length }, state.materials.length + " tài liệu"));
  }

  function renderCourseInfo() {
    const badgeClass = getBadgeClass(state.course.status);

    $("[data-course-detail-status]")
      .removeClass("app-badge-success app-badge-muted")
      .addClass(badgeClass)
      .text(translateStatus(state.course.status));
    $("[data-course-detail-code]").text(getInitials(state.course.name));
    $("[data-course-detail-progress-badge]").text(t("courses.detailPage.complete", { percent: state.course.completionRate }, state.course.completionRate + "% hoàn thành"));
    $("[data-course-detail-title]").text(state.course.name);
    $("[data-course-detail-copy]").text(state.course.description);
    setProgress(state.course.completionRate);
  }

  function renderMaterials() {
    const $container = $("#courseMaterialList").empty();

    if (!state.materials.length) {
      $container.append(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">M</div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("courses.detailPage.noMaterialsTitle", null, "Chưa có tài liệu")) + '</h3>' +
          '<p class="app-empty-copy">' + escapeHtml(t("courses.detailPage.noMaterialsCopy", null, "Tài liệu học tập sẽ được quản lý ở task tiếp theo.")) + '</p>' +
        '</div>'
      );
      return;
    }

    state.materials.forEach(function (material) {
      $container.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">' + escapeHtml(material.contentType.charAt(0).toUpperCase()) + '</span>' +
            '<div>' +
              '<strong>' + escapeHtml(material.title) + '</strong>' +
              '<span>' + escapeHtml(t("courses.detailPage.materialMeta", { type: material.contentType, minutes: material.durationMinutes }, material.contentType + " / " + material.durationMinutes + " phút")) + '</span>' +
            '</div>' +
          '</div>' +
          '<span class="app-badge ' + getBadgeClass(material.status) + '">' + escapeHtml(translateStatus(material.status)) + '</span>' +
        '</div>'
      );
    });
  }

  function renderPeopleList(containerSelector, items, emptyTitle, emptyCopy) {
    const $container = $(containerSelector).empty();

    if (!items.length) {
      $container.append(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">A</div>' +
          '<h3 class="app-empty-title">' + escapeHtml(emptyTitle) + '</h3>' +
          '<p class="app-empty-copy">' + escapeHtml(emptyCopy) + '</p>' +
        '</div>'
      );
      return;
    }

    items.forEach(function (item) {
      const title = item.fullName || item.name;
      const subtitle = item.email || t("courses.detailPage.groupMembers", { count: item.memberCount }, item.memberCount + " thành viên");

      $container.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">' + escapeHtml(title.charAt(0).toUpperCase()) + '</span>' +
            '<div>' +
              '<strong>' + escapeHtml(title) + '</strong>' +
              '<span>' + escapeHtml(subtitle) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    });
  }

  function renderAssignments() {
    renderPeopleList(
      "#courseAssignedUsers",
      getAssignedUsers(),
      t("courses.detailPage.noUsersTitle", null, "Chưa giao người dùng"),
      t("courses.detailPage.noUsersCopy", null, "Thao tác giao khóa học có ở danh sách khóa học.")
    );
    renderPeopleList(
      "#courseAssignedGroups",
      getAssignedGroups(),
      t("courses.detailPage.noGroupsTitle", null, "Chưa giao nhóm"),
      t("courses.detailPage.noGroupsCopy", null, "Thao tác giao nhóm có ở danh sách khóa học.")
    );
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

  function bindEvents() {
    $(document).on("click", "[data-course-detail-action='publish']", function () {
      if (!state.course) {
        return;
      }

      state.course.status = "Published";
      render();
      showToast(
        "success",
        t("courses.detailPage.publishedTitle", null, "Đã xuất bản khóa học"),
        t("courses.detailPage.publishedMessage", { name: state.course.name }, state.course.name + " hiện đã xuất bản trong trạng thái mô phỏng.")
      );
    });

    $(document).on("lms:i18n:changed", render);
  }

  function renderLoadError() {
    $("#courseMaterialList, #courseAssignedUsers, #courseAssignedGroups").html(
      '<div class="app-empty-state">' +
        '<div class="app-empty-icon" aria-hidden="true">!</div>' +
        '<h3 class="app-empty-title">' + escapeHtml(t("courses.detailPage.loadErrorTitle", null, "Không thể tải chi tiết khóa học")) + '</h3>' +
        '<p class="app-empty-copy">' + escapeHtml(t("courses.detailPage.loadErrorCopy", null, "Vui lòng kiểm tra các file dữ liệu mô phỏng.")) + '</p>' +
      '</div>'
    );
  }

  function loadCourseDetail() {
    state.courseId = Number($("[data-course-detail-id]").data("course-detail-id"));

    $.when(
      Lms.apiClient.get("courses.json"),
      Lms.apiClient.get("learning-materials.json"),
      Lms.apiClient.get("users.json"),
      Lms.apiClient.get("groups.json")
    ).done(function (coursesResponse, materialsResponse, usersResponse, groupsResponse) {
      state.course = getById(getItems(coursesResponse), state.courseId);
      state.materials = getItems(materialsResponse).filter(function (material) {
        return material.courseId === state.courseId;
      });
      state.users = getItems(usersResponse);
      state.groups = getItems(groupsResponse);
      render();
    }).fail(function () {
      renderLoadError();
      showToast("error", t("courses.detailPage.dataErrorTitle", null, "Lỗi chi tiết khóa học"), t("courses.detailPage.dataErrorMessage", null, "Không thể tải dữ liệu mô phỏng chi tiết khóa học."));
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
