(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    users: [],
    filteredUsers: [],
    page: 1,
    pageSize: 8,
    search: "",
    role: "",
    status: "",
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

  function getBadgeClass(status) {
    return status === "Locked" ? "app-badge-danger" : "app-badge-success";
  }

  function translateRole(role) {
    return t("users.listPage.roles." + role, null, role);
  }

  function translateStatus(status) {
    return t("users.listPage.statuses." + status, null, status);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function formatDate(value) {
    if (!value) {
      return t("users.listPage.never", null, "Chưa từng");
    }

    return new Date(value).toLocaleString();
  }

  function renderPageTitle() {
    document.title = t("users.listPage.title", null, "Quản lý người dùng") + " - " + t("common.appName", null, "lms");
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredUsers.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredUsers.slice(start, start + state.pageSize);
  }

  function renderMetrics() {
    const active = state.users.filter(function (user) {
      return user.status === "Active";
    }).length;
    const locked = state.users.filter(function (user) {
      return user.status === "Locked";
    }).length;
    const admins = state.users.filter(function (user) {
      return user.role === "Admin";
    }).length;

    $("[data-user-metric='total']").text(state.users.length);
    $("[data-user-metric='active']").text(active);
    $("[data-user-metric='locked']").text(locked);
    $("[data-user-metric='admins']").text(admins);
  }

  function renderRows() {
    const $rows = $("#userTableRows").empty();
    const rows = getCurrentPageRows();

    if (!rows.length) {
      $rows.append(
        "<tr>" +
          '<td colspan="5">' +
            '<div class="app-empty-state">' +
              '<div class="app-empty-icon" aria-hidden="true">U</div>' +
              '<h3 class="app-empty-title">' + escapeHtml(t("users.listPage.noUsersTitle", null, "Không tìm thấy người dùng")) + "</h3>" +
              '<p class="app-empty-copy">' + escapeHtml(t("users.listPage.noUsersCopy", null, "Thử từ khóa, vai trò hoặc trạng thái khác.")) + "</p>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
      return;
    }

    rows.forEach(function (user) {
      const lockAction = user.status === "Locked" ? "unlock" : "lock";
      const lockText = user.status === "Locked"
        ? t("users.listPage.unlock", null, "Mở khóa")
        : t("users.listPage.lock", null, "Khóa");

      $rows.append(
        "<tr>" +
          "<td>" +
            '<div class="admin-user-cell">' +
              '<span class="app-avatar" aria-hidden="true">' + escapeHtml(user.fullName.charAt(0).toUpperCase()) + "</span>" +
              "<div>" +
                "<strong>" + escapeHtml(user.fullName) + "</strong>" +
                "<span>" + escapeHtml(user.userName) + " / " + escapeHtml(user.email) + "</span>" +
              "</div>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge app-badge-info">' + escapeHtml(translateRole(user.role)) + "</span></td>" +
          '<td><span class="app-badge ' + getBadgeClass(user.status) + '">' + escapeHtml(translateStatus(user.status)) + "</span></td>" +
          "<td>" + escapeHtml(formatDate(user.lastLoginAt)) + "</td>" +
          '<td class="u-text-right">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-user-action="edit" data-user-id="' + user.id + '">' + escapeHtml(t("users.listPage.edit", null, "Sửa")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-user-action="' + lockAction + '" data-user-id="' + user.id + '">' + escapeHtml(lockText) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-user-action="reset-password" data-user-id="' + user.id + '">' + escapeHtml(t("users.listPage.reset", null, "Đặt lại")) + "</button>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
    });
  }

  function renderPagination() {
    const pageCount = getPageCount();
    const $pages = $("#userPaginationPages").empty();
    const startRecord = state.filteredUsers.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const endRecord = Math.min(state.page * state.pageSize, state.filteredUsers.length);

    $("[data-user-result-count]").text(t("users.listPage.records", { count: state.filteredUsers.length }, state.filteredUsers.length + " bản ghi"));
    $("[data-user-page-info]").text(t(
      "users.listPage.showing",
      { start: startRecord, end: endRecord, total: state.filteredUsers.length },
      "Hiển thị " + startRecord + "-" + endRecord + " trên " + state.filteredUsers.length + " người dùng"
    ));
    $("[data-user-page='prev']").prop("disabled", state.page <= 1);
    $("[data-user-page='next']").prop("disabled", state.page >= pageCount);

    for (let page = 1; page <= pageCount; page += 1) {
      const $button = $('<button class="admin-pagination-page" type="button"></button>');
      $button.text(page);
      $button.attr("data-user-page-number", page);
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

    state.filteredUsers = state.users.filter(function (user) {
      const matchesKeyword = !keyword ||
        user.fullName.toLowerCase().includes(keyword) ||
        user.userName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword);
      const matchesRole = !state.role || user.role === state.role;
      const matchesStatus = !state.status || user.status === state.status;

      return matchesKeyword && matchesRole && matchesStatus;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function findUser(userId) {
    return state.users.find(function (user) {
      return user.id === Number(userId);
    });
  }

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function getNextUserId() {
    return state.users.reduce(function (maxId, user) {
      return Math.max(maxId, Number(user.id) || 0);
    }, 0) + 1;
  }

  function getFormValues(form) {
    const $form = $(form);

    return {
      fullName: $form.find("[name='fullName']").val().trim(),
      userName: $form.find("[name='userName']").val().trim(),
      email: $form.find("[name='email']").val().trim(),
      role: $form.find("[name='role']").val(),
      status: $form.find("[name='status']").val()
    };
  }

  function setFieldError(form, fieldName, message) {
    const $field = $(form).find("[name='" + fieldName + "']");
    const $error = $(form).find("[data-user-error='" + fieldName + "']");

    $field.toggleClass("is-invalid", Boolean(message));
    $error.text(message || "");
  }

  function clearFormErrors(form) {
    $(form).find(".is-invalid").removeClass("is-invalid");
    $(form).find("[data-user-error]").text("");
  }

  function validateUserForm(form, editingUserId) {
    const values = getFormValues(form);
    let valid = true;

    clearFormErrors(form);

    if (!values.fullName || values.fullName.length < 3) {
      setFieldError(form, "fullName", t("users.listPage.fullNameMin", null, "Họ và tên phải có ít nhất 3 ký tự."));
      valid = false;
    }

    if (!values.userName || values.userName.length < 3) {
      setFieldError(form, "userName", t("users.listPage.usernameMin", null, "Tên đăng nhập phải có ít nhất 3 ký tự."));
      valid = false;
    }

    if (values.userName && !/^[a-zA-Z0-9._-]+$/.test(values.userName)) {
      setFieldError(form, "userName", t("users.listPage.usernamePattern", null, "Chỉ dùng chữ cái, số, dấu chấm, gạch ngang hoặc gạch dưới."));
      valid = false;
    }

    if (!isValidEmail(values.email)) {
      setFieldError(form, "email", t("users.listPage.emailInvalid", null, "Nhập địa chỉ email hợp lệ."));
      valid = false;
    }

    if (!values.role) {
      setFieldError(form, "role", t("users.listPage.roleRequired", null, "Chọn vai trò."));
      valid = false;
    }

    if (!values.status) {
      setFieldError(form, "status", t("users.listPage.statusRequired", null, "Chọn trạng thái."));
      valid = false;
    }

    const duplicateUserName = state.users.some(function (user) {
      return user.id !== editingUserId && user.userName.toLowerCase() === values.userName.toLowerCase();
    });
    const duplicateEmail = state.users.some(function (user) {
      return user.id !== editingUserId && user.email.toLowerCase() === values.email.toLowerCase();
    });

    if (duplicateUserName) {
      setFieldError(form, "userName", t("users.listPage.usernameDuplicate", null, "Tên đăng nhập đã tồn tại."));
      valid = false;
    }

    if (duplicateEmail) {
      setFieldError(form, "email", t("users.listPage.emailDuplicate", null, "Email đã tồn tại."));
      valid = false;
    }

    return valid;
  }

  function buildUserForm(user) {
    const isEdit = Boolean(user);
    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          "<div>" +
            '<h2 class="app-modal-title">' + escapeHtml(isEdit ? t("users.listPage.editUser", null, "Sửa người dùng") : t("users.listPage.createUserModal", null, "Tạo người dùng")) + "</h2>" +
            '<p class="app-card-subtitle">' + escapeHtml(isEdit ? t("users.listPage.editSubtitle", null, "Cập nhật thông tin tài khoản mô phỏng.") : t("users.listPage.createSubtitle", null, "Thêm người dùng mô phỏng mới trong bộ nhớ.")) + "</p>" +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("users.listPage.close", null, "Đóng")) + "</button>" +
        "</div>" +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("users.listPage.fullName", null, "Họ và tên")) +
            '<input class="app-input" name="fullName" type="text" autocomplete="name" />' +
            '<span class="auth-error" data-user-error="fullName"></span>' +
          "</label>" +
          '<label class="auth-field">' + escapeHtml(t("users.listPage.username", null, "Tên đăng nhập")) +
            '<input class="app-input" name="userName" type="text" autocomplete="username" />' +
            '<span class="auth-error" data-user-error="userName"></span>' +
          "</label>" +
          '<label class="auth-field">' + escapeHtml(t("users.listPage.email", null, "Email")) +
            '<input class="app-input" name="email" type="email" autocomplete="email" />' +
            '<span class="auth-error" data-user-error="email"></span>' +
          "</label>" +
          '<div class="admin-user-form-grid">' +
            '<label class="auth-field">' + escapeHtml(t("users.listPage.role", null, "Vai trò")) +
              '<select class="app-select" name="role">' +
                '<option value="">' + escapeHtml(t("users.listPage.selectRole", null, "Chọn vai trò")) + "</option>" +
                '<option value="Admin">' + escapeHtml(t("users.listPage.admin", null, "Quản trị")) + "</option>" +
                '<option value="Student">' + escapeHtml(t("users.listPage.student", null, "Học viên")) + "</option>" +
              "</select>" +
              '<span class="auth-error" data-user-error="role"></span>' +
            "</label>" +
            '<label class="auth-field">' + escapeHtml(t("users.listPage.status", null, "Trạng thái")) +
              '<select class="app-select" name="status">' +
                '<option value="">' + escapeHtml(t("users.listPage.selectStatus", null, "Chọn trạng thái")) + "</option>" +
                '<option value="Active">' + escapeHtml(t("users.listPage.active", null, "Hoạt động")) + "</option>" +
                '<option value="Locked">' + escapeHtml(t("users.listPage.locked", null, "Đã khóa")) + "</option>" +
              "</select>" +
              '<span class="auth-error" data-user-error="status"></span>' +
            "</label>" +
          "</div>" +
        "</form>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("users.listPage.cancel", null, "Hủy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-user-save>' + escapeHtml(isEdit ? t("users.listPage.saveChanges", null, "Lưu thay đổi") : t("users.listPage.createUser", null, "Tạo người dùng")) + "</button>" +
        "</div>" +
      "</div>"
    );

    if (isEdit) {
      modal.find("[name='fullName']").val(user.fullName);
      modal.find("[name='userName']").val(user.userName);
      modal.find("[name='email']").val(user.email);
      modal.find("[name='role']").val(user.role);
      modal.find("[name='status']").val(user.status);
    } else {
      modal.find("[name='role']").val("Student");
      modal.find("[name='status']").val("Active");
    }

    return modal;
  }

  function showUserForm(userId) {
    const editingUserId = userId ? Number(userId) : null;
    const user = editingUserId ? findUser(editingUserId) : null;

    if (editingUserId && !user) {
      showToast(
        "error",
        t("users.listPage.userNotFoundTitle", null, "Không tìm thấy người dùng"),
        t("users.listPage.userNotFoundMessage", null, "Không tìm thấy người dùng đã chọn.")
      );
      return;
    }

    if (!Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = buildUserForm(user);
    const form = modal.find("form")[0];

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-user-save]").on("click", function () {
      if (!validateUserForm(form, editingUserId)) {
        return;
      }

      const values = getFormValues(form);

      if (editingUserId) {
        const target = findUser(editingUserId);
        Object.assign(target, values);
        showToast(
          "success",
          t("users.listPage.userUpdatedTitle", null, "Đã cập nhật người dùng"),
          t("users.listPage.userUpdatedMessage", { name: target.fullName }, target.fullName + " đã được cập nhật.")
        );
      } else {
        const newUser = {
          id: getNextUserId(),
          fullName: values.fullName,
          userName: values.userName,
          email: values.email,
          role: values.role,
          status: values.status,
          lastLoginAt: null
        };
        state.users.unshift(newUser);
        state.page = 1;
        showToast(
          "success",
          t("users.listPage.userCreatedTitle", null, "Đã tạo người dùng"),
          t("users.listPage.userCreatedMessage", { name: newUser.fullName }, newUser.fullName + " đã được thêm.")
        );
      }

      Lms.ui.closeModal();
      applyFilters();
    });

    Lms.ui.showModal(modal);
  }

  function toggleLock(userId, locked) {
    const user = findUser(userId);

    if (!user) {
      return;
    }

    user.status = locked ? "Locked" : "Active";
    applyFilters();
    showToast(
      locked ? "warning" : "success",
      locked ? t("users.listPage.userLockedTitle", null, "Đã khóa người dùng") : t("users.listPage.userUnlockedTitle", null, "Đã mở khóa người dùng"),
      t(
        "users.listPage.userStatusMessage",
        { name: user.fullName, status: translateStatus(user.status).toLowerCase() },
        user.fullName + " hiện " + translateStatus(user.status).toLowerCase() + "."
      )
    );
  }

  function showResetPasswordConfirm(userId) {
    const user = findUser(userId);

    if (!user || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title">' + escapeHtml(t("users.listPage.resetPassword", null, "Đặt lại mật khẩu")) + "</h2>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("users.listPage.close", null, "Đóng")) + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0">' + escapeHtml(t("users.listPage.resetPasswordCopy", { name: user.fullName }, "Đặt lại mật khẩu cho " + user.fullName + "? Đây là thao tác UI mô phỏng.")) + "</p>" +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("users.listPage.cancel", null, "Hủy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-user-confirm-reset>' + escapeHtml(t("users.listPage.resetPassword", null, "Đặt lại mật khẩu")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-user-confirm-reset]").on("click", function () {
      Lms.ui.closeModal();
      showToast(
        "success",
        t("users.listPage.passwordResetTitle", null, "Đã đặt lại mật khẩu"),
        t("users.listPage.passwordResetMessage", { name: user.fullName }, "Đã tạo mật khẩu tạm thời cho " + user.fullName + ".")
      );
    });

    Lms.ui.showModal(modal);
  }

  function bindEvents() {
    $("[data-user-filter='search']").on("input", function () {
      state.search = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-user-filter='role']").on("change", function () {
      state.role = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-user-filter='status']").on("change", function () {
      state.status = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-user-action='clear-filters']").on("click", function () {
      state.search = "";
      state.role = "";
      state.status = "";
      $("[data-user-filter='search']").val("");
      $("[data-user-filter='role']").val("");
      $("[data-user-filter='status']").val("");
      state.page = 1;
      applyFilters();
    });

    $(document).on("click", "[data-user-page='prev']", function () {
      if (state.page > 1) {
        state.page -= 1;
        render();
      }
    });

    $(document).on("click", "[data-user-page='next']", function () {
      if (state.page < getPageCount()) {
        state.page += 1;
        render();
      }
    });

    $(document).on("click", "[data-user-page-number]", function () {
      state.page = Number($(this).data("user-page-number"));
      render();
    });

    $(document).on("click", "[data-user-action='create']", function () {
      showUserForm();
    });

    $(document).on("click", "[data-user-action='edit']", function () {
      showUserForm($(this).data("user-id"));
    });

    $(document).on("click", "[data-user-action='export']", function () {
      showToast(
        "info",
        t("users.listPage.exportTitle", null, "Xuất người dùng"),
        t("users.listPage.exportMessage", null, "Chức năng xuất sẽ được nối ở task báo cáo/xuất dữ liệu.")
      );
    });

    $(document).on("click", "[data-user-action='lock']", function () {
      toggleLock($(this).data("user-id"), true);
    });

    $(document).on("click", "[data-user-action='unlock']", function () {
      toggleLock($(this).data("user-id"), false);
    });

    $(document).on("click", "[data-user-action='reset-password']", function () {
      showResetPasswordConfirm($(this).data("user-id"));
    });

    $(document).on("lms:i18n:changed", function () {
      renderPageTitle();
      render();
    });
  }

  function loadUsers() {
    renderPageTitle();

    if (!Lms.apiClient) {
      return;
    }

    Lms.apiClient.get("users.json").done(function (response) {
      const payload = unwrap(response);
      state.users = payload.data.items.map(function (user) {
        return { ...user };
      });
      state.filteredUsers = state.users.slice();
      state.loaded = true;
      render();
    }).fail(function () {
      $("#userTableRows").html(
        '<tr><td colspan="5">' +
          '<div class="app-empty-state">' +
            '<div class="app-empty-icon" aria-hidden="true">!</div>' +
            '<h3 class="app-empty-title">' + escapeHtml(t("users.listPage.loadErrorTitle", null, "Không thể tải người dùng")) + "</h3>" +
            '<p class="app-empty-copy">' + escapeHtml(t("users.listPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/users.json.")) + "</p>" +
          "</div>" +
        "</td></tr>"
      );
      showToast(
        "error",
        t("users.listPage.dataErrorTitle", null, "Lỗi dữ liệu người dùng"),
        t("users.listPage.dataErrorMessage", null, "Không thể tải users.json.")
      );
    });
  }

  function init() {
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadUsers);
      return;
    }

    loadUsers();
  }

  $(init);
})(window, jQuery);
