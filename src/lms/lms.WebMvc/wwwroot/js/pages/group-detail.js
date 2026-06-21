(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    groupId: 0,
    group: null,
    users: [],
    courses: [],
    exams: [],
    memberIds: [],
    courseIds: [],
    examIds: [],
    loaded: false
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
    const title = state.group ? state.group.name : t("groups.detailPage.title", null, "Chi tiết nhóm");
    document.title = title + " - " + t("common.appName", null, "lms");
  }

  function seedRelations() {
    const studentIds = state.users.filter(function (user) { return user.role === "Student"; }).map(function (user) { return user.id; });
    const courseIds = state.courses.map(function (course) { return course.id; });
    const examIds = state.exams.map(function (exam) { return exam.id; });

    state.memberIds = state.groupId === 1 ? studentIds.slice(0, 2) : studentIds.slice(1);
    state.courseIds = state.groupId === 1 ? courseIds.slice(0, 1) : courseIds.slice();
    state.examIds = state.groupId === 1 ? examIds.slice(0, 1) : examIds.slice(1);
  }

  function getById(items, id) {
    return items.find(function (item) {
      return item.id === Number(id);
    });
  }

  function renderHeader() {
    if (!state.group) {
      $("[data-group-detail-name]").text(t("groups.detailPage.groupNotFoundTitle", null, "Không tìm thấy nhóm"));
      $("[data-group-detail-summary]").text(t("groups.detailPage.groupNotFoundCopy", null, "Mã nhóm được yêu cầu không tồn tại trong dữ liệu mô phỏng."));
      return;
    }

    $("[data-group-detail-name]").text(state.group.name);
    $("[data-group-detail-summary]").text(t("groups.detailPage.groupSummary", { id: state.group.id }, "Mã nhóm #" + state.group.id + " / Giao nhiệm vụ mô phỏng chỉ ở UI."));
  }

  function renderMetrics() {
    $("[data-group-detail-metric='members']").text(state.memberIds.length);
    $("[data-group-detail-metric='courses']").text(state.courseIds.length);
    $("[data-group-detail-metric='exams']").text(state.examIds.length);
    $("[data-group-detail-count='members']").text(t("groups.detailPage.memberCount", { count: state.memberIds.length }, state.memberIds.length + " thành viên"));
    $("[data-group-detail-count='courses']").text(t("groups.detailPage.courseCount", { count: state.courseIds.length }, state.courseIds.length + " khóa học"));
    $("[data-group-detail-count='exams']").text(t("groups.detailPage.examCount", { count: state.examIds.length }, state.examIds.length + " bài thi"));
  }

  function renderSelect(selector, items, selectedIds, emptyText) {
    const $select = $(selector).empty();
    const availableItems = items.filter(function (item) {
      return !selectedIds.includes(item.id);
    });

    if (!availableItems.length) {
      $select.append('<option value="">' + escapeHtml(emptyText) + '</option>');
      $select.prop("disabled", true);
      return;
    }

    $select.prop("disabled", false);
    $select.append('<option value="">' + escapeHtml(t("groups.detailPage.selectItem", null, "Chọn một mục")) + '</option>');
    availableItems.forEach(function (item) {
      $select.append('<option value="' + item.id + '">' + escapeHtml(item.fullName || item.name) + '</option>');
    });
  }

  function renderList(containerSelector, items, selectedIds, type, emptyCopy) {
    const $container = $(containerSelector).empty();

    if (!selectedIds.length) {
      $container.append(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">+</div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("groups.detailPage.nothingAssigned", null, "Chưa có mục được giao")) + '</h3>' +
          '<p class="app-empty-copy">' + escapeHtml(emptyCopy) + '</p>' +
        '</div>'
      );
      return;
    }

    selectedIds.forEach(function (id) {
      const item = getById(items, id);
      if (!item) {
        return;
      }

      const title = item.fullName || item.name;
      let subtitle = "";

      if (type === "member") {
        subtitle = item.userName + " / " + item.email;
      } else if (type === "course") {
        subtitle = t("groups.detailPage.materialsMeta", { status: item.status, count: item.materialCount }, item.status + " / " + item.materialCount + " tài liệu");
      } else {
        subtitle = t("groups.detailPage.examMeta", { status: item.status, minutes: item.durationMinutes, passScore: item.passScore }, item.status + " / " + item.durationMinutes + " phút / đạt " + item.passScore);
      }

      $container.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">' + escapeHtml(title.charAt(0).toUpperCase()) + '</span>' +
            '<div>' +
              '<strong>' + escapeHtml(title) + '</strong>' +
              '<span>' + escapeHtml(subtitle) + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="app-button app-button-secondary" type="button" data-group-detail-remove="' + type + '" data-item-id="' + item.id + '">' + escapeHtml(t("groups.detailPage.remove", null, "Xóa")) + '</button>' +
        '</div>'
      );
    });
  }

  function render() {
    renderPageTitle();
    renderHeader();

    if (!state.group) {
      return;
    }

    renderMetrics();
    renderSelect("[data-group-detail-select='member']", state.users, state.memberIds, t("groups.detailPage.allUsersAssigned", null, "Tất cả người dùng đã là thành viên"));
    renderSelect("[data-group-detail-select='course']", state.courses, state.courseIds, t("groups.detailPage.allCoursesAssigned", null, "Tất cả khóa học đã được giao"));
    renderSelect("[data-group-detail-select='exam']", state.exams, state.examIds, t("groups.detailPage.allExamsAssigned", null, "Tất cả bài thi đã được giao"));

    renderList("#groupMemberList", state.users, state.memberIds, "member", t("groups.detailPage.emptyMembers", null, "Thêm người dùng vào nhóm từ bộ chọn phía trên."));
    renderList("#groupCourseList", state.courses, state.courseIds, "course", t("groups.detailPage.emptyCourses", null, "Giao khóa học cho nhóm từ bộ chọn phía trên."));
    renderList("#groupExamList", state.exams, state.examIds, "exam", t("groups.detailPage.emptyExams", null, "Giao bài thi cho nhóm từ bộ chọn phía trên."));
  }

  function getRelation(type) {
    if (type === "member") return state.memberIds;
    if (type === "course") return state.courseIds;
    return state.examIds;
  }

  function getTypeLabel(type) {
    if (type === "member") return t("groups.detailPage.memberLabel", null, "thành viên");
    if (type === "course") return t("groups.detailPage.courseLabel", null, "khóa học");
    return t("groups.detailPage.examLabel", null, "bài thi");
  }

  function addItem(type) {
    const $select = $("[data-group-detail-select='" + type + "']");
    const itemId = Number($select.val());
    const typeLabel = getTypeLabel(type);

    if (!itemId) {
      showToast("warning", t("groups.detailPage.selectWarningTitle", { type: typeLabel }, "Chọn " + typeLabel), t("groups.detailPage.selectWarningMessage", null, "Chọn một mục trước khi thêm."));
      return;
    }

    const relation = getRelation(type);
    if (!relation.includes(itemId)) {
      relation.push(itemId);
    }

    render();
    showToast("success", t("groups.detailPage.addedTitle", null, "Đã thêm giao nhiệm vụ"), t("groups.detailPage.addedMessage", { type: typeLabel, group: state.group.name }, typeLabel + " đã được thêm vào " + state.group.name + "."));
  }

  function removeItem(type, itemId) {
    const relation = getRelation(type);
    const index = relation.indexOf(Number(itemId));
    const typeLabel = getTypeLabel(type);

    if (index >= 0) {
      relation.splice(index, 1);
    }

    render();
    showToast("success", t("groups.detailPage.removedTitle", null, "Đã xóa giao nhiệm vụ"), t("groups.detailPage.removedMessage", { type: typeLabel, group: state.group.name }, typeLabel + " đã được xóa khỏi " + state.group.name + "."));
  }

  function bindEvents() {
    $(document).on("click", "[data-group-detail-add]", function () {
      addItem($(this).data("group-detail-add"));
    });

    $(document).on("click", "[data-group-detail-remove]", function () {
      removeItem($(this).data("group-detail-remove"), $(this).data("item-id"));
    });

    $(document).on("lms:i18n:changed", render);
  }

  function renderLoadError() {
    $(".group-detail-list").html(
      '<div class="app-empty-state">' +
        '<div class="app-empty-icon" aria-hidden="true">!</div>' +
        '<h3 class="app-empty-title">' + escapeHtml(t("groups.detailPage.loadErrorTitle", null, "Không thể tải chi tiết nhóm")) + '</h3>' +
        '<p class="app-empty-copy">' + escapeHtml(t("groups.detailPage.loadErrorCopy", null, "Vui lòng kiểm tra các file dữ liệu mô phỏng.")) + '</p>' +
      '</div>'
    );
  }

  function loadGroupDetail() {
    state.groupId = Number($("[data-group-detail-id]").data("group-detail-id"));

    $.when(
      Lms.apiClient.get("groups.json"),
      Lms.apiClient.get("users.json"),
      Lms.apiClient.get("courses.json"),
      Lms.apiClient.get("exams.json")
    ).done(function (groupsResponse, usersResponse, coursesResponse, examsResponse) {
      const groups = getItems(groupsResponse);

      state.group = getById(groups, state.groupId);
      state.users = getItems(usersResponse);
      state.courses = getItems(coursesResponse);
      state.exams = getItems(examsResponse);
      state.loaded = true;

      if (!state.group) {
        render();
        renderLoadError();
        return;
      }

      seedRelations();
      render();
    }).fail(function () {
      renderLoadError();
      showToast("error", t("groups.detailPage.dataErrorTitle", null, "Lỗi chi tiết nhóm"), t("groups.detailPage.dataErrorMessage", null, "Không thể tải dữ liệu mô phỏng chi tiết nhóm."));
    });
  }

  function init() {
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadGroupDetail);
      return;
    }

    loadGroupDetail();
  }

  $(init);
})(window, jQuery);
