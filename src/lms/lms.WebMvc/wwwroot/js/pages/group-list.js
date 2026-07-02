(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    groups: [],
    filteredGroups: [],
    page: 1,
    pageSize: 8,
    search: "",
    size: "",
    loaded: false
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
    document.title = t("groups.listPage.title", null, "Quan ly nhom") + " - " + t("common.appName", null, "lms");
  }

  function toUiGroup(item) {
    return {
      id: item.id,
      name: item.name,
      description: item.description || "",
      memberCount: 0,
      assignedCourseCount: 0,
      assignedExamCount: 0
    };
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredGroups.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredGroups.slice(start, start + state.pageSize);
  }

  function findGroup(groupId) {
    return state.groups.find(function (group) {
      return group.id === Number(groupId);
    });
  }

  function renderMetrics() {
    const memberTotal = state.groups.reduce(function (total, group) { return total + Number(group.memberCount || 0); }, 0);
    const courseTotal = state.groups.reduce(function (total, group) { return total + Number(group.assignedCourseCount || 0); }, 0);
    const examTotal = state.groups.reduce(function (total, group) { return total + Number(group.assignedExamCount || 0); }, 0);

    $("[data-group-metric='total']").text(state.groups.length);
    $("[data-group-metric='members']").text(memberTotal);
    $("[data-group-metric='courses']").text(courseTotal);
    $("[data-group-metric='exams']").text(examTotal);
  }

  function renderRows() {
    const $rows = $("#groupTableRows").empty();
    const rows = getCurrentPageRows();

    if (!rows.length) {
      $rows.append(
        "<tr><td colspan='5'><div class='app-empty-state'>" +
          "<div class='app-empty-icon' aria-hidden='true'>G</div>" +
          "<h3 class='app-empty-title'>" + escapeHtml(t("groups.listPage.noGroupsTitle", null, "Khong tim thay nhom")) + "</h3>" +
          "<p class='app-empty-copy'>" + escapeHtml(t("groups.listPage.noGroupsCopy", null, "Thu tu khoa hoac quy mo khac.")) + "</p>" +
        "</div></td></tr>"
      );
      return;
    }

    rows.forEach(function (group) {
      $rows.append(
        "<tr>" +
          "<td><div class='admin-user-cell'>" +
            "<span class='app-avatar' aria-hidden='true'>" + escapeHtml((group.name || "G").charAt(0).toUpperCase()) + "</span>" +
            "<div><strong>" + escapeHtml(group.name) + "</strong>" +
            "<span>" + escapeHtml(group.description || t("groups.listPage.noDescription", null, "Chua co mo ta")) + "</span></div>" +
          "</div></td>" +
          "<td><span class='app-badge app-badge-info'>" + escapeHtml(t("groups.listPage.memberCount", { count: group.memberCount }, group.memberCount + " thanh vien")) + "</span></td>" +
          "<td>" + escapeHtml(group.assignedCourseCount) + "</td>" +
          "<td>" + escapeHtml(group.assignedExamCount) + "</td>" +
          "<td class='u-text-right'><div class='admin-row-actions'>" +
            "<button class='app-button app-button-secondary' type='button' data-group-action='detail' data-group-id='" + group.id + "'>" + escapeHtml(t("groups.listPage.detail", null, "Chi tiet")) + "</button>" +
            "<button class='app-button app-button-secondary' type='button' data-group-action='edit' data-group-id='" + group.id + "'>" + escapeHtml(t("groups.listPage.edit", null, "Sua")) + "</button>" +
          "</div></td>" +
        "</tr>"
      );
    });
  }

  function renderPagination() {
    const pageCount = getPageCount();
    const $pages = $("#groupPaginationPages").empty();
    const startRecord = state.filteredGroups.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const endRecord = Math.min(state.page * state.pageSize, state.filteredGroups.length);

    $("[data-group-result-count]").text(t("groups.listPage.records", { count: state.filteredGroups.length }, state.filteredGroups.length + " ban ghi"));
    $("[data-group-page-info]").text(t(
      "groups.listPage.showing",
      { start: startRecord, end: endRecord, total: state.filteredGroups.length },
      "Hien thi " + startRecord + "-" + endRecord + " tren " + state.filteredGroups.length + " nhom"
    ));
    $("[data-group-page='prev']").prop("disabled", state.page <= 1);
    $("[data-group-page='next']").prop("disabled", state.page >= pageCount);

    for (let page = 1; page <= pageCount; page += 1) {
      const $button = $("<button class='admin-pagination-page' type='button'></button>");
      $button.text(page);
      $button.attr("data-group-page-number", page);
      $button.toggleClass("active", page === state.page);
      $pages.append($button);
    }
  }

  function render() {
    if (!state.loaded) {
      return;
    }

    renderMetrics();
    renderRows();
    renderPagination();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredGroups = state.groups.filter(function (group) {
      const matchesKeyword = !keyword ||
        group.name.toLowerCase().includes(keyword) ||
        group.description.toLowerCase().includes(keyword);
      const matchesSize = !state.size ||
        (state.size === "small" && Number(group.memberCount) < 20) ||
        (state.size === "large" && Number(group.memberCount) >= 20);
      return matchesKeyword && matchesSize;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function getFormValues(form) {
    const $form = $(form);
    return {
      name: $form.find("[name='name']").val().trim(),
      description: $form.find("[name='description']").val().trim()
    };
  }

  function setFieldError(form, fieldName, message) {
    const $field = $(form).find("[name='" + fieldName + "']");
    const $error = $(form).find("[data-group-error='" + fieldName + "']");

    $field.toggleClass("is-invalid", Boolean(message));
    $error.text(message || "");
  }

  function clearFormErrors(form) {
    $(form).find(".is-invalid").removeClass("is-invalid");
    $(form).find("[data-group-error]").text("");
  }

  function validateGroupForm(form, editingGroupId) {
    const values = getFormValues(form);
    let valid = true;

    clearFormErrors(form);

    if (!values.name || values.name.length < 3) {
      setFieldError(form, "name", t("groups.listPage.groupNameMin", null, "Ten nhom phai co it nhat 3 ky tu."));
      valid = false;
    }

    const duplicateName = state.groups.some(function (group) {
      return group.id !== editingGroupId && group.name.toLowerCase() === values.name.toLowerCase();
    });

    if (duplicateName) {
      setFieldError(form, "name", t("groups.listPage.duplicateName", null, "Ten nhom da ton tai."));
      valid = false;
    }

    return valid;
  }

  function buildGroupForm(group) {
    const isEdit = Boolean(group);
    const modal = $(
      "<div>" +
        "<div class='app-modal-header'><div>" +
          "<h2 class='app-modal-title'>" + escapeHtml(isEdit ? t("groups.listPage.editGroup", null, "Sua nhom") : t("groups.listPage.createGroupModal", null, "Tao nhom")) + "</h2>" +
          "<p class='app-card-subtitle'>" + escapeHtml(isEdit ? t("groups.listPage.editSubtitle", null, "Cap nhat thong tin nhom.") : t("groups.listPage.createSubtitle", null, "Them nhom moi vao he thong.")) + "</p>" +
        "</div><button class='app-button app-button-secondary' type='button' data-modal-close>" + escapeHtml(t("groups.listPage.close", null, "Dong")) + "</button></div>" +
        "<form class='app-modal-body admin-user-form' novalidate>" +
          "<label class='auth-field'>" + escapeHtml(t("groups.listPage.groupName", null, "Ten nhom")) +
            "<input class='app-input' name='name' type='text' autocomplete='off' />" +
            "<span class='auth-error' data-group-error='name'></span></label>" +
          "<label class='auth-field'>" + escapeHtml(t("groups.listPage.description", null, "Mo ta")) +
            "<textarea class='app-input' name='description' rows='4'></textarea>" +
            "<span class='auth-error' data-group-error='description'></span></label>" +
        "</form>" +
        "<div class='app-modal-footer'>" +
          "<button class='app-button app-button-secondary' type='button' data-modal-close>" + escapeHtml(t("groups.listPage.cancel", null, "Huy")) + "</button>" +
          "<button class='app-button app-button-primary' type='button' data-group-save>" + escapeHtml(isEdit ? t("groups.listPage.saveChanges", null, "Luu thay doi") : t("groups.listPage.createGroup", null, "Tao nhom")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("[name='name']").val(group ? group.name : "");
    modal.find("[name='description']").val(group ? group.description : "");
    return modal;
  }

  function saveGroup(form, editingGroupId) {
    const values = getFormValues(form);

    if (editingGroupId) {
      return Lms.apiClient.put("api/groups/" + editingGroupId, values).then(function (response) {
        const group = findGroup(editingGroupId);
        if (group && response && response.data) {
          group.name = response.data.name;
          group.description = response.data.description || "";
        }
        return group;
      });
    }

    return Lms.apiClient.post("api/groups", values).then(function (response) {
      const created = toUiGroup(response.data);
      state.groups.unshift(created);
      return created;
    });
  }

  function showGroupForm(groupId) {
    const editingGroupId = groupId ? Number(groupId) : null;
    const group = editingGroupId ? findGroup(editingGroupId) : null;

    if (editingGroupId && !group) {
      showToast("error", t("groups.listPage.groupNotFoundTitle", null, "Khong tim thay nhom"), t("groups.listPage.groupNotFoundMessage", null, "Khong tim thay nhom da chon."));
      return;
    }

    if (!Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = buildGroupForm(group);
    const form = modal.find("form")[0];

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-group-save]").on("click", function () {
      const button = $(this);

      if (!validateGroupForm(form, editingGroupId)) {
        return;
      }

      Lms.ui.setButtonLoading(button, t("groups.listPage.saving", null, "Dang luu"));
      saveGroup(form, editingGroupId).done(function (savedGroup) {
        Lms.ui.clearButtonLoading(button);
        Lms.ui.closeModal();
        state.page = 1;
        applyFilters();
        showToast(
          "success",
          editingGroupId ? t("groups.listPage.groupUpdatedTitle", null, "Da cap nhat nhom") : t("groups.listPage.groupCreatedTitle", null, "Da tao nhom"),
          editingGroupId
            ? t("groups.listPage.groupUpdatedMessage", { name: savedGroup.name }, savedGroup.name + " da duoc cap nhat.")
            : t("groups.listPage.groupCreatedMessage", { name: savedGroup.name }, savedGroup.name + " da duoc them.")
        );
      }).fail(function (error) {
        Lms.ui.clearButtonLoading(button);
        showToast("error", t("groups.listPage.saveFailedTitle", null, "Khong the luu nhom"), error && error.message ? error.message : t("groups.listPage.saveFailedMessage", null, "Vui long thu lai."));
      });
    });

    Lms.ui.showModal(modal);
  }

  function bindEvents() {
    $("[data-group-filter='search']").on("input", function () {
      state.search = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-group-filter='assignment']").prop("disabled", true);

    $("[data-group-filter='size']").on("change", function () {
      state.size = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-group-action='clear-filters']").on("click", function () {
      state.search = "";
      state.size = "";
      $("[data-group-filter='search']").val("");
      $("[data-group-filter='assignment']").val("");
      $("[data-group-filter='size']").val("");
      state.page = 1;
      applyFilters();
    });

    $(document).on("click", "[data-group-page='prev']", function () {
      if (state.page > 1) {
        state.page -= 1;
        render();
      }
    });

    $(document).on("click", "[data-group-page='next']", function () {
      if (state.page < getPageCount()) {
        state.page += 1;
        render();
      }
    });

    $(document).on("click", "[data-group-page-number]", function () {
      state.page = Number($(this).data("group-page-number"));
      render();
    });

    $(document).on("click", "[data-group-action='create']", function () {
      showGroupForm();
    });

    $(document).on("click", "[data-group-action='edit']", function () {
      showGroupForm($(this).data("group-id"));
    });

    $(document).on("click", "[data-group-action='detail']", function () {
      window.location.href = "/admin/groups/detail/" + $(this).data("group-id");
    });

    $(document).on("click", "[data-group-action='export']", function () {
      showToast("info", t("groups.listPage.exportTitle", null, "Xuat nhom"), t("groups.listPage.exportMessage", null, "Chuc nang xuat se duoc noi o task bao cao/xuat du lieu."));
    });

    $(document).on("lms:i18n:changed", function () {
      renderPageTitle();
      render();
    });
  }

  function loadMemberCounts() {
    const requests = state.groups.map(function (group) {
      return Lms.apiClient.get("api/groups/" + group.id + "/users?page=1&pageSize=200")
        .then(function (response) {
          const total = response && response.data ? Number(response.data.total || 0) : 0;
          group.memberCount = total;
        }, function () {
          group.memberCount = 0;
        });
    });

    return $.when.apply($, requests);
  }

  function loadGroups() {
    renderPageTitle();

    if (!Lms.apiClient) {
      return;
    }

    Lms.apiClient.get("api/groups?page=1&pageSize=200").done(function (response) {
      const items = response && response.data && Array.isArray(response.data.items) ? response.data.items : [];
      state.groups = items.map(toUiGroup);

      loadMemberCounts().always(function () {
        state.filteredGroups = state.groups.slice();
        state.loaded = true;
        render();
      });
    }).fail(function (error) {
      $("#groupTableRows").html(
        "<tr><td colspan='5'><div class='app-empty-state'>" +
          "<div class='app-empty-icon' aria-hidden='true'>!</div>" +
          "<h3 class='app-empty-title'>" + escapeHtml(t("groups.listPage.loadErrorTitle", null, "Khong the tai nhom")) + "</h3>" +
          "<p class='app-empty-copy'>" + escapeHtml(error && error.message ? error.message : t("groups.listPage.loadErrorCopy", null, "Vui long kiem tra ket noi API.")) + "</p>" +
        "</div></td></tr>"
      );
      showToast("error", t("groups.listPage.dataErrorTitle", null, "Loi du lieu nhom"), error && error.message ? error.message : t("groups.listPage.dataErrorMessage", null, "Khong the tai API nhom."));
    });
  }

  function init() {
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadGroups);
      return;
    }

    loadGroups();
  }

  $(init);
})(window, jQuery);
