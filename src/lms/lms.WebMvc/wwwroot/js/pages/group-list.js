(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    groups: [],
    filteredGroups: [],
    page: 1,
    pageSize: 8,
    search: "",
    assignment: "",
    size: "",
    loaded: false
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function unwrap(response) {
    return Array.isArray(response) ? response[0] : response;
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
    document.title = t("groups.listPage.title", null, "Quản lý nhóm") + " - " + t("common.appName", null, "lms");
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredGroups.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredGroups.slice(start, start + state.pageSize);
  }

  function getNextGroupId() {
    return state.groups.reduce(function (maxId, group) {
      return Math.max(maxId, Number(group.id) || 0);
    }, 0) + 1;
  }

  function findGroup(groupId) {
    return state.groups.find(function (group) {
      return group.id === Number(groupId);
    });
  }

  function renderMetrics() {
    const memberTotal = state.groups.reduce(function (total, group) {
      return total + Number(group.memberCount || 0);
    }, 0);
    const courseTotal = state.groups.reduce(function (total, group) {
      return total + Number(group.assignedCourseCount || 0);
    }, 0);
    const examTotal = state.groups.reduce(function (total, group) {
      return total + Number(group.assignedExamCount || 0);
    }, 0);

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
        '<tr>' +
          '<td colspan="5">' +
            '<div class="app-empty-state">' +
              '<div class="app-empty-icon" aria-hidden="true">G</div>' +
              '<h3 class="app-empty-title">' + escapeHtml(t("groups.listPage.noGroupsTitle", null, "Không tìm thấy nhóm")) + '</h3>' +
              '<p class="app-empty-copy">' + escapeHtml(t("groups.listPage.noGroupsCopy", null, "Thử từ khóa, trạng thái giao hoặc quy mô khác.")) + '</p>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
      return;
    }

    rows.forEach(function (group) {
      $rows.append(
        '<tr>' +
          '<td>' +
            '<div class="admin-user-cell">' +
              '<span class="app-avatar" aria-hidden="true">' + escapeHtml(group.name.charAt(0).toUpperCase()) + '</span>' +
              '<div>' +
                '<strong>' + escapeHtml(group.name) + '</strong>' +
                '<span>' + escapeHtml(t("groups.listPage.groupId", { id: group.id }, "Mã nhóm #" + group.id)) + '</span>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td><span class="app-badge app-badge-info">' + escapeHtml(t("groups.listPage.memberCount", { count: group.memberCount }, group.memberCount + " thành viên")) + '</span></td>' +
          '<td>' + escapeHtml(group.assignedCourseCount) + '</td>' +
          '<td>' + escapeHtml(group.assignedExamCount) + '</td>' +
          '<td class="u-text-right">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-group-action="detail" data-group-id="' + group.id + '">' + escapeHtml(t("groups.listPage.detail", null, "Chi tiết")) + '</button>' +
              '<button class="app-button app-button-secondary" type="button" data-group-action="edit" data-group-id="' + group.id + '">' + escapeHtml(t("groups.listPage.edit", null, "Sửa")) + '</button>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    });
  }

  function renderPagination() {
    const pageCount = getPageCount();
    const $pages = $("#groupPaginationPages").empty();
    const startRecord = state.filteredGroups.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const endRecord = Math.min(state.page * state.pageSize, state.filteredGroups.length);

    $("[data-group-result-count]").text(t("groups.listPage.records", { count: state.filteredGroups.length }, state.filteredGroups.length + " bản ghi"));
    $("[data-group-page-info]").text(t(
      "groups.listPage.showing",
      { start: startRecord, end: endRecord, total: state.filteredGroups.length },
      "Hiển thị " + startRecord + "-" + endRecord + " trên " + state.filteredGroups.length + " nhóm"
    ));
    $("[data-group-page='prev']").prop("disabled", state.page <= 1);
    $("[data-group-page='next']").prop("disabled", state.page >= pageCount);

    for (let page = 1; page <= pageCount; page += 1) {
      const $button = $('<button class="admin-pagination-page" type="button"></button>');
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
      const matchesKeyword = !keyword || group.name.toLowerCase().includes(keyword);
      const matchesAssignment = !state.assignment ||
        (state.assignment === "courses" && Number(group.assignedCourseCount) > 0) ||
        (state.assignment === "exams" && Number(group.assignedExamCount) > 0) ||
        (state.assignment === "empty" && Number(group.assignedCourseCount) === 0 && Number(group.assignedExamCount) === 0);
      const matchesSize = !state.size ||
        (state.size === "small" && Number(group.memberCount) < 20) ||
        (state.size === "large" && Number(group.memberCount) >= 20);

      return matchesKeyword && matchesAssignment && matchesSize;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function getFormValues(form) {
    const $form = $(form);

    return {
      name: $form.find("[name='name']").val().trim(),
      memberCount: Number($form.find("[name='memberCount']").val()),
      assignedCourseCount: Number($form.find("[name='assignedCourseCount']").val()),
      assignedExamCount: Number($form.find("[name='assignedExamCount']").val())
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
      setFieldError(form, "name", t("groups.listPage.groupNameMin", null, "Tên nhóm phải có ít nhất 3 ký tự."));
      valid = false;
    }

    ["memberCount", "assignedCourseCount", "assignedExamCount"].forEach(function (fieldName) {
      if (!Number.isInteger(values[fieldName]) || values[fieldName] < 0) {
        setFieldError(form, fieldName, t("groups.listPage.wholeNumber", null, "Nhập số nguyên lớn hơn hoặc bằng 0."));
        valid = false;
      }
    });

    const duplicateName = state.groups.some(function (group) {
      return group.id !== editingGroupId && group.name.toLowerCase() === values.name.toLowerCase();
    });

    if (duplicateName) {
      setFieldError(form, "name", t("groups.listPage.duplicateName", null, "Tên nhóm đã tồn tại."));
      valid = false;
    }

    return valid;
  }

  function buildGroupForm(group) {
    const isEdit = Boolean(group);
    const modal = $(
      '<div>' +
        '<div class="app-modal-header">' +
          '<div>' +
            '<h2 class="app-modal-title">' + escapeHtml(isEdit ? t("groups.listPage.editGroup", null, "Sửa nhóm") : t("groups.listPage.createGroupModal", null, "Tạo nhóm")) + '</h2>' +
            '<p class="app-card-subtitle">' + escapeHtml(isEdit ? t("groups.listPage.editSubtitle", null, "Cập nhật thông tin nhóm mô phỏng.") : t("groups.listPage.createSubtitle", null, "Thêm nhóm mô phỏng mới trong bộ nhớ.")) + '</p>' +
          '</div>' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("groups.listPage.close", null, "Đóng")) + '</button>' +
        '</div>' +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("groups.listPage.groupName", null, "Tên nhóm")) +
            '<input class="app-input" name="name" type="text" autocomplete="off" />' +
            '<span class="auth-error" data-group-error="name"></span>' +
          '</label>' +
          '<div class="admin-user-form-grid">' +
            '<label class="auth-field">' + escapeHtml(t("groups.listPage.members", null, "Thành viên")) +
              '<input class="app-input" name="memberCount" type="number" min="0" step="1" />' +
              '<span class="auth-error" data-group-error="memberCount"></span>' +
            '</label>' +
            '<label class="auth-field">' + escapeHtml(t("groups.listPage.assignedCourses", null, "Khóa học được giao")) +
              '<input class="app-input" name="assignedCourseCount" type="number" min="0" step="1" />' +
              '<span class="auth-error" data-group-error="assignedCourseCount"></span>' +
            '</label>' +
          '</div>' +
          '<label class="auth-field">' + escapeHtml(t("groups.listPage.assignedExams", null, "Bài thi được giao")) +
            '<input class="app-input" name="assignedExamCount" type="number" min="0" step="1" />' +
            '<span class="auth-error" data-group-error="assignedExamCount"></span>' +
          '</label>' +
        '</form>' +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("groups.listPage.cancel", null, "Hủy")) + '</button>' +
          '<button class="app-button app-button-primary" type="button" data-group-save>' + escapeHtml(isEdit ? t("groups.listPage.saveChanges", null, "Lưu thay đổi") : t("groups.listPage.createGroup", null, "Tạo nhóm")) + '</button>' +
        '</div>' +
      '</div>'
    );

    modal.find("[name='name']").val(group ? group.name : "");
    modal.find("[name='memberCount']").val(group ? group.memberCount : 0);
    modal.find("[name='assignedCourseCount']").val(group ? group.assignedCourseCount : 0);
    modal.find("[name='assignedExamCount']").val(group ? group.assignedExamCount : 0);

    return modal;
  }

  function showGroupForm(groupId) {
    const editingGroupId = groupId ? Number(groupId) : null;
    const group = editingGroupId ? findGroup(editingGroupId) : null;

    if (editingGroupId && !group) {
      showToast(
        "error",
        t("groups.listPage.groupNotFoundTitle", null, "Không tìm thấy nhóm"),
        t("groups.listPage.groupNotFoundMessage", null, "Không tìm thấy nhóm đã chọn.")
      );
      return;
    }

    if (!Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = buildGroupForm(group);
    const form = modal.find("form")[0];

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-group-save]").on("click", function () {
      if (!validateGroupForm(form, editingGroupId)) {
        return;
      }

      const values = getFormValues(form);

      if (editingGroupId) {
        const target = findGroup(editingGroupId);
        Object.assign(target, values);
        showToast(
          "success",
          t("groups.listPage.groupUpdatedTitle", null, "Đã cập nhật nhóm"),
          t("groups.listPage.groupUpdatedMessage", { name: target.name }, target.name + " đã được cập nhật.")
        );
      } else {
        const newGroup = {
          id: getNextGroupId(),
          ...values
        };
        state.groups.unshift(newGroup);
        state.page = 1;
        showToast(
          "success",
          t("groups.listPage.groupCreatedTitle", null, "Đã tạo nhóm"),
          t("groups.listPage.groupCreatedMessage", { name: newGroup.name }, newGroup.name + " đã được thêm.")
        );
      }

      Lms.ui.closeModal();
      applyFilters();
    });

    Lms.ui.showModal(modal);
  }

  function bindEvents() {
    $("[data-group-filter='search']").on("input", function () {
      state.search = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-group-filter='assignment']").on("change", function () {
      state.assignment = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-group-filter='size']").on("change", function () {
      state.size = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-group-action='clear-filters']").on("click", function () {
      state.search = "";
      state.assignment = "";
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
      showToast(
        "info",
        t("groups.listPage.exportTitle", null, "Xuất nhóm"),
        t("groups.listPage.exportMessage", null, "Chức năng xuất sẽ được nối ở task báo cáo/xuất dữ liệu.")
      );
    });

    $(document).on("lms:i18n:changed", function () {
      renderPageTitle();
      render();
    });
  }

  function loadGroups() {
    renderPageTitle();

    if (!Lms.apiClient) {
      return;
    }

    Lms.apiClient.get("groups.json").done(function (response) {
      const payload = unwrap(response);
      state.groups = payload.data.items.map(function (group) {
        return { ...group };
      });
      state.filteredGroups = state.groups.slice();
      state.loaded = true;
      render();
    }).fail(function () {
      $("#groupTableRows").html(
        '<tr><td colspan="5">' +
          '<div class="app-empty-state">' +
            '<div class="app-empty-icon" aria-hidden="true">!</div>' +
            '<h3 class="app-empty-title">' + escapeHtml(t("groups.listPage.loadErrorTitle", null, "Không thể tải nhóm")) + '</h3>' +
            '<p class="app-empty-copy">' + escapeHtml(t("groups.listPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/groups.json.")) + '</p>' +
          '</div>' +
        '</td></tr>'
      );
      showToast(
        "error",
        t("groups.listPage.dataErrorTitle", null, "Lỗi dữ liệu nhóm"),
        t("groups.listPage.dataErrorMessage", null, "Không thể tải groups.json.")
      );
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
