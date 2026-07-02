(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    groupId: 0,
    group: null,
    users: [],
    members: []
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
      Lms.ui.showToast({ type: type, title: title, message: message });
    }
  }

  function renderPageTitle() {
    const title = state.group ? state.group.name : t("groups.detailPage.title", null, "Chi tiet nhom");
    document.title = title + " - " + t("common.appName", null, "lms");
  }

  function renderHeader() {
    if (!state.group) {
      $("[data-group-detail-name]").text(t("groups.detailPage.groupNotFoundTitle", null, "Khong tim thay nhom"));
      $("[data-group-detail-summary]").text(t("groups.detailPage.groupNotFoundCopy", null, "Ma nhom duoc yeu cau khong ton tai."));
      return;
    }

    $("[data-group-detail-name]").text(state.group.name);
    $("[data-group-detail-summary]").text(
      state.group.description || t("groups.detailPage.groupSummary", { id: state.group.id }, "Ma nhom #" + state.group.id)
    );
  }

  function renderMetrics() {
    $("[data-group-detail-metric='members']").text(state.members.length);
    $("[data-group-detail-metric='courses']").text("-");
    $("[data-group-detail-metric='exams']").text("-");
    $("[data-group-detail-count='members']").text(t("groups.detailPage.memberCount", { count: state.members.length }, state.members.length + " thanh vien"));
    $("[data-group-detail-count='courses']").text(t("groups.detailPage.pendingPhase", null, "Phase sau"));
    $("[data-group-detail-count='exams']").text(t("groups.detailPage.pendingPhase", null, "Phase sau"));
  }

  function renderSelect() {
    const $select = $("[data-group-detail-select='member']").empty();
    const assignedIds = state.members.map(function (member) { return member.userId; });
    const availableItems = state.users.filter(function (user) {
      return user.role === "Student" && !assignedIds.includes(user.id);
    });

    if (!availableItems.length) {
      $select.append("<option value=''>" + escapeHtml(t("groups.detailPage.allUsersAssigned", null, "Tat ca nguoi dung da la thanh vien")) + "</option>");
      $select.prop("disabled", true);
      return;
    }

    $select.prop("disabled", false);
    $select.append("<option value=''>" + escapeHtml(t("groups.detailPage.selectItem", null, "Chon mot muc")) + "</option>");
    availableItems.forEach(function (item) {
      $select.append("<option value='" + item.id + "'>" + escapeHtml(item.fullName || item.userName) + "</option>");
    });
  }

  function renderMemberList() {
    const $container = $("#groupMemberList").empty();

    if (!state.members.length) {
      $container.append(
        "<div class='app-empty-state'>" +
          "<div class='app-empty-icon' aria-hidden='true'>+</div>" +
          "<h3 class='app-empty-title'>" + escapeHtml(t("groups.detailPage.nothingAssigned", null, "Chua co muc duoc giao")) + "</h3>" +
          "<p class='app-empty-copy'>" + escapeHtml(t("groups.detailPage.emptyMembers", null, "Them nguoi dung vao nhom tu bo chon phia tren.")) + "</p>" +
        "</div>"
      );
      return;
    }

    state.members.forEach(function (member) {
      $container.append(
        "<div class='group-detail-item'>" +
          "<div class='admin-user-cell'>" +
            "<span class='app-avatar' aria-hidden='true'>" + escapeHtml((member.fullName || "U").charAt(0).toUpperCase()) + "</span>" +
            "<div><strong>" + escapeHtml(member.fullName) + "</strong>" +
            "<span>" + escapeHtml(member.userName) + " / " + escapeHtml(member.email) + "</span></div>" +
          "</div>" +
          "<button class='app-button app-button-secondary' type='button' data-group-detail-remove='member' data-item-id='" + member.userId + "'>" + escapeHtml(t("groups.detailPage.remove", null, "Xoa")) + "</button>" +
        "</div>"
      );
    });
  }

  function renderPendingSection(containerSelector, messageKey, fallback) {
    $(containerSelector).html(
      "<div class='app-empty-state'>" +
        "<div class='app-empty-icon' aria-hidden='true'>~</div>" +
        "<h3 class='app-empty-title'>" + escapeHtml(t("groups.detailPage.pendingTitle", null, "Se ghep o phase tiep theo")) + "</h3>" +
        "<p class='app-empty-copy'>" + escapeHtml(t(messageKey, null, fallback)) + "</p>" +
      "</div>"
    );
  }

  function render() {
    renderPageTitle();
    renderHeader();

    if (!state.group) {
      return;
    }

    renderMetrics();
    renderSelect();
    renderMemberList();
    renderPendingSection("#groupCourseList", "groups.detailPage.pendingCoursesCopy", "Course assignment theo nhom se duoc ghep o phase Courses.");
    renderPendingSection("#groupExamList", "groups.detailPage.pendingExamsCopy", "Exam assignment theo nhom se duoc ghep o phase Exams.");
  }

  function addMember() {
    const userId = Number($("[data-group-detail-select='member']").val());

    if (!userId) {
      showToast("warning", t("groups.detailPage.selectWarningTitle", null, "Chon thanh vien"), t("groups.detailPage.selectWarningMessage", null, "Chon mot muc truoc khi them."));
      return;
    }

    Lms.apiClient.post("api/groups/" + state.groupId + "/users", { userId: userId }).done(function () {
      loadGroupDetail();
      showToast("success", t("groups.detailPage.addedTitle", null, "Da them thanh vien"), t("groups.detailPage.addedMessage", { group: state.group.name }, "Thanh vien da duoc them vao " + state.group.name + "."));
    }).fail(function (error) {
      showToast("error", t("groups.detailPage.addFailedTitle", null, "Khong the them thanh vien"), error && error.message ? error.message : t("groups.detailPage.addFailedMessage", null, "Vui long thu lai."));
    });
  }

  function removeMember(userId) {
    Lms.apiClient.delete("api/groups/" + state.groupId + "/users/" + userId).done(function () {
      loadGroupDetail();
      showToast("success", t("groups.detailPage.removedTitle", null, "Da xoa thanh vien"), t("groups.detailPage.removedMessage", { group: state.group.name }, "Thanh vien da duoc xoa khoi " + state.group.name + "."));
    }).fail(function (error) {
      showToast("error", t("groups.detailPage.removeFailedTitle", null, "Khong the xoa thanh vien"), error && error.message ? error.message : t("groups.detailPage.removeFailedMessage", null, "Vui long thu lai."));
    });
  }

  function bindEvents() {
    $(document).on("click", "[data-group-detail-add='member']", addMember);

    $(document).on("click", "[data-group-detail-remove='member']", function () {
      removeMember($(this).data("item-id"));
    });

    $(document).on("click", "[data-group-detail-add='course'], [data-group-detail-add='exam']", function () {
      showToast("info", t("groups.detailPage.pendingTitle", null, "Se ghep o phase tiep theo"), t("groups.detailPage.pendingActionMessage", null, "Phan assignment course/exam cho nhom se duoc ghep o phase sau."));
    });

    $(document).on("lms:i18n:changed", render);
  }

  function renderLoadError(message) {
    $(".group-detail-list").html(
      "<div class='app-empty-state'>" +
        "<div class='app-empty-icon' aria-hidden='true'>!</div>" +
        "<h3 class='app-empty-title'>" + escapeHtml(t("groups.detailPage.loadErrorTitle", null, "Khong the tai chi tiet nhom")) + "</h3>" +
        "<p class='app-empty-copy'>" + escapeHtml(message || t("groups.detailPage.loadErrorCopy", null, "Vui long kiem tra ket noi API.")) + "</p>" +
      "</div>"
    );
  }

  function loadGroupDetail() {
    state.groupId = Number($("[data-group-detail-id]").data("group-detail-id"));

    $.when(
      Lms.apiClient.get("api/groups/" + state.groupId),
      Lms.apiClient.get("api/groups/" + state.groupId + "/users?page=1&pageSize=200"),
      Lms.apiClient.get("api/users?page=1&pageSize=200")
    ).done(function (groupResponse, membersResponse, usersResponse) {
      state.group = groupResponse && groupResponse.data ? groupResponse.data : null;
      state.members = membersResponse && membersResponse.data && Array.isArray(membersResponse.data.items) ? membersResponse.data.items : [];
      state.users = usersResponse && usersResponse.data && Array.isArray(usersResponse.data.items) ? usersResponse.data.items : [];

      $("[data-group-detail-select='course'], [data-group-detail-select='exam']").prop("disabled", true);
      $("[data-group-detail-add='course'], [data-group-detail-add='exam']").prop("disabled", true);

      render();
    }).fail(function (error) {
      renderLoadError(error && error.message ? error.message : null);
      showToast("error", t("groups.detailPage.dataErrorTitle", null, "Loi chi tiet nhom"), error && error.message ? error.message : t("groups.detailPage.dataErrorMessage", null, "Khong the tai du lieu nhom."));
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
