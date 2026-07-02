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
      return t("users.listPage.never", null, "Chua tung");
    }

    return new Date(value).toLocaleString();
  }

  function renderPageTitle() {
    document.title = t("users.listPage.title", null, "Quan ly nguoi dung") + " - " + t("common.appName", null, "lms");
  }

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type: type, title: title, message: message });
    }
  }

  function toUiUser(item) {
    return {
      id: item.id,
      userName: item.userName,
      fullName: item.fullName,
      email: item.email,
      role: item.role,
      status: item.isLocked ? "Locked" : "Active",
      lastLoginAt: item.lastLoginDate || null
    };
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredUsers.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredUsers.slice(start, start + state.pageSize);
  }

  function renderMetrics() {
    const active = state.users.filter(function (user) { return user.status === "Active"; }).length;
    const locked = state.users.filter(function (user) { return user.status === "Locked"; }).length;
    const admins = state.users.filter(function (user) { return user.role === "Admin"; }).length;

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
        "<tr><td colspan='5'><div class='app-empty-state'>" +
        "<div class='app-empty-icon' aria-hidden='true'>U</div>" +
        "<h3 class='app-empty-title'>" + escapeHtml(t("users.listPage.noUsersTitle", null, "Khong tim thay nguoi dung")) + "</h3>" +
        "<p class='app-empty-copy'>" + escapeHtml(t("users.listPage.noUsersCopy", null, "Thu tu khoa, vai tro hoac trang thai khac.")) + "</p>" +
        "</div></td></tr>"
      );
      return;
    }

    rows.forEach(function (user) {
      const lockAction = user.status === "Locked" ? "unlock" : "lock";
      const lockText = user.status === "Locked"
        ? t("users.listPage.unlock", null, "Mo khoa")
        : t("users.listPage.lock", null, "Khoa");

      $rows.append(
        "<tr>" +
          "<td><div class='admin-user-cell'>" +
            "<span class='app-avatar' aria-hidden='true'>" + escapeHtml((user.fullName || "U").charAt(0).toUpperCase()) + "</span>" +
            "<div><strong>" + escapeHtml(user.fullName) + "</strong>" +
            "<span>" + escapeHtml(user.userName) + " / " + escapeHtml(user.email) + "</span></div>" +
          "</div></td>" +
          "<td><span class='app-badge app-badge-info'>" + escapeHtml(translateRole(user.role)) + "</span></td>" +
          "<td><span class='app-badge " + getBadgeClass(user.status) + "'>" + escapeHtml(translateStatus(user.status)) + "</span></td>" +
          "<td>" + escapeHtml(formatDate(user.lastLoginAt)) + "</td>" +
          "<td class='u-text-right'><div class='admin-row-actions'>" +
            "<button class='app-button app-button-secondary' type='button' data-user-action='edit' data-user-id='" + user.id + "'>" + escapeHtml(t("users.listPage.edit", null, "Sua")) + "</button>" +
            "<button class='app-button app-button-secondary' type='button' data-user-action='" + lockAction + "' data-user-id='" + user.id + "'>" + escapeHtml(lockText) + "</button>" +
            "<button class='app-button app-button-secondary' type='button' data-user-action='reset-password' data-user-id='" + user.id + "'>" + escapeHtml(t("users.listPage.reset", null, "Dat lai")) + "</button>" +
          "</div></td>" +
        "</tr>"
      );
    });
  }

  function renderPagination() {
    const pageCount = getPageCount();
    const $pages = $("#userPaginationPages").empty();
    const startRecord = state.filteredUsers.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const endRecord = Math.min(state.page * state.pageSize, state.filteredUsers.length);

    $("[data-user-result-count]").text(t("users.listPage.records", { count: state.filteredUsers.length }, state.filteredUsers.length + " ban ghi"));
    $("[data-user-page-info]").text(t(
      "users.listPage.showing",
      { start: startRecord, end: endRecord, total: state.filteredUsers.length },
      "Hien thi " + startRecord + "-" + endRecord + " tren " + state.filteredUsers.length + " nguoi dung"
    ));
    $("[data-user-page='prev']").prop("disabled", state.page <= 1);
    $("[data-user-page='next']").prop("disabled", state.page >= pageCount);

    for (let page = 1; page <= pageCount; page += 1) {
      const $button = $("<button class='admin-pagination-page' type='button'></button>");
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
      setFieldError(form, "fullName", t("users.listPage.fullNameMin", null, "Ho va ten phai co it nhat 3 ky tu."));
      valid = false;
    }

    if (!editingUserId) {
      if (!values.userName || values.userName.length < 3) {
        setFieldError(form, "userName", t("users.listPage.usernameMin", null, "Ten dang nhap phai co it nhat 3 ky tu."));
        valid = false;
      }

      if (values.userName && !/^[a-zA-Z0-9._-]+$/.test(values.userName)) {
        setFieldError(form, "userName", t("users.listPage.usernamePattern", null, "Chi dung chu cai, so, dau cham, gach ngang hoac gach duoi."));
        valid = false;
      }
    }

    if (!isValidEmail(values.email)) {
      setFieldError(form, "email", t("users.listPage.emailInvalid", null, "Nhap dia chi email hop le."));
      valid = false;
    }

    if (!values.role) {
      setFieldError(form, "role", t("users.listPage.roleRequired", null, "Chon vai tro."));
      valid = false;
    }

    if (!values.status) {
      setFieldError(form, "status", t("users.listPage.statusRequired", null, "Chon trang thai."));
      valid = false;
    }

    if (!editingUserId) {
      const duplicateUserName = state.users.some(function (user) {
        return user.userName.toLowerCase() === values.userName.toLowerCase();
      });
      const duplicateEmail = state.users.some(function (user) {
        return user.email.toLowerCase() === values.email.toLowerCase();
      });

      if (duplicateUserName) {
        setFieldError(form, "userName", t("users.listPage.usernameDuplicate", null, "Ten dang nhap da ton tai."));
        valid = false;
      }

      if (duplicateEmail) {
        setFieldError(form, "email", t("users.listPage.emailDuplicate", null, "Email da ton tai."));
        valid = false;
      }
    }

    return valid;
  }

  function buildUserForm(user) {
    const isEdit = Boolean(user);
    const modal = $(
      "<div>" +
        "<div class='app-modal-header'><div>" +
          "<h2 class='app-modal-title'>" + escapeHtml(isEdit ? t("users.listPage.editUser", null, "Sua nguoi dung") : t("users.listPage.createUserModal", null, "Tao nguoi dung")) + "</h2>" +
          "<p class='app-card-subtitle'>" + escapeHtml(isEdit ? t("users.listPage.editSubtitle", null, "Cap nhat thong tin tai khoan.") : t("users.listPage.createSubtitle", null, "Them tai khoan moi vao he thong.")) + "</p>" +
        "</div><button class='app-button app-button-secondary' type='button' data-modal-close>" + escapeHtml(t("users.listPage.close", null, "Dong")) + "</button></div>" +
        "<form class='app-modal-body admin-user-form' novalidate>" +
          "<label class='auth-field'>" + escapeHtml(t("users.listPage.fullName", null, "Ho va ten")) +
            "<input class='app-input' name='fullName' type='text' autocomplete='name' />" +
            "<span class='auth-error' data-user-error='fullName'></span></label>" +
          "<label class='auth-field'>" + escapeHtml(t("users.listPage.username", null, "Ten dang nhap")) +
            "<input class='app-input' name='userName' type='text' autocomplete='username' />" +
            "<span class='auth-error' data-user-error='userName'></span></label>" +
          "<label class='auth-field'>" + escapeHtml(t("users.listPage.email", null, "Email")) +
            "<input class='app-input' name='email' type='email' autocomplete='email' />" +
            "<span class='auth-error' data-user-error='email'></span></label>" +
          "<div class='admin-user-form-grid'>" +
            "<label class='auth-field'>" + escapeHtml(t("users.listPage.role", null, "Vai tro")) +
              "<select class='app-select' name='role'>" +
                "<option value=''>" + escapeHtml(t("users.listPage.selectRole", null, "Chon vai tro")) + "</option>" +
                "<option value='Admin'>" + escapeHtml(t("users.listPage.admin", null, "Quan tri")) + "</option>" +
                "<option value='Student'>" + escapeHtml(t("users.listPage.student", null, "Hoc vien")) + "</option>" +
              "</select><span class='auth-error' data-user-error='role'></span></label>" +
            "<label class='auth-field'>" + escapeHtml(t("users.listPage.status", null, "Trang thai")) +
              "<select class='app-select' name='status'>" +
                "<option value=''>" + escapeHtml(t("users.listPage.selectStatus", null, "Chon trang thai")) + "</option>" +
                "<option value='Active'>" + escapeHtml(t("users.listPage.active", null, "Hoat dong")) + "</option>" +
                "<option value='Locked'>" + escapeHtml(t("users.listPage.locked", null, "Da khoa")) + "</option>" +
              "</select><span class='auth-error' data-user-error='status'></span></label>" +
          "</div>" +
        "</form>" +
        "<div class='app-modal-footer'>" +
          "<button class='app-button app-button-secondary' type='button' data-modal-close>" + escapeHtml(t("users.listPage.cancel", null, "Huy")) + "</button>" +
          "<button class='app-button app-button-primary' type='button' data-user-save>" + escapeHtml(isEdit ? t("users.listPage.saveChanges", null, "Luu thay doi") : t("users.listPage.createUser", null, "Tao nguoi dung")) + "</button>" +
        "</div>" +
      "</div>"
    );

    if (isEdit) {
      modal.find("[name='fullName']").val(user.fullName);
      modal.find("[name='userName']").val(user.userName).prop("disabled", true);
      modal.find("[name='email']").val(user.email);
      modal.find("[name='role']").val(user.role);
      modal.find("[name='status']").val(user.status);
    } else {
      modal.find("[name='role']").val("Student");
      modal.find("[name='status']").val("Active");
    }

    return modal;
  }

  function syncUserStatus(userId, nextStatus) {
    const user = findUser(userId);
    if (user) {
      user.status = nextStatus;
    }
  }

  function saveUser(form, editingUserId) {
    const values = getFormValues(form);

    if (editingUserId) {
      const existing = findUser(editingUserId);
      return Lms.apiClient.put("api/users/" + editingUserId, {
        fullName: values.fullName,
        email: values.email,
        role: values.role
      }).then(function (response) {
        const updated = toUiUser(response.data);
        if (existing) {
          updated.status = values.status;
          updated.lastLoginAt = existing.lastLoginAt;
          Object.assign(existing, updated);
        }

        const statusCall = values.status === "Locked"
          ? Lms.apiClient.post("api/users/" + editingUserId + "/lock", { reason: "Locked from admin user list" })
          : Lms.apiClient.post("api/users/" + editingUserId + "/unlock", {});

        return statusCall.then(function () {
          syncUserStatus(editingUserId, values.status);
          return existing;
        });
      });
    }

    return Lms.apiClient.post("api/users", {
      userName: values.userName,
      fullName: values.fullName,
      email: values.email,
      role: values.role
    }).then(function (response) {
      const created = toUiUser(response.data);
      state.users.unshift(created);

      if (values.status === "Locked") {
        return Lms.apiClient.post("api/users/" + created.id + "/lock", { reason: "Created as locked from admin user list" })
          .then(function () {
            created.status = "Locked";
            return created;
          });
      }

      return created;
    });
  }

  function showUserForm(userId) {
    const editingUserId = userId ? Number(userId) : null;
    const user = editingUserId ? findUser(editingUserId) : null;

    if (editingUserId && !user) {
      showToast("error", t("users.listPage.userNotFoundTitle", null, "Khong tim thay nguoi dung"), t("users.listPage.userNotFoundMessage", null, "Khong tim thay nguoi dung da chon."));
      return;
    }

    if (!Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = buildUserForm(user);
    const form = modal.find("form")[0];

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-user-save]").on("click", function () {
      const button = $(this);

      if (!validateUserForm(form, editingUserId)) {
        return;
      }

      Lms.ui.setButtonLoading(button, t("users.listPage.saving", null, "Dang luu"));
      saveUser(form, editingUserId).done(function (savedUser) {
        Lms.ui.clearButtonLoading(button);
        Lms.ui.closeModal();
        state.page = 1;
        applyFilters();
        showToast(
          "success",
          editingUserId ? t("users.listPage.userUpdatedTitle", null, "Da cap nhat nguoi dung") : t("users.listPage.userCreatedTitle", null, "Da tao nguoi dung"),
          editingUserId
            ? t("users.listPage.userUpdatedMessage", { name: savedUser.fullName }, savedUser.fullName + " da duoc cap nhat.")
            : t("users.listPage.userCreatedMessage", { name: savedUser.fullName }, savedUser.fullName + " da duoc them.")
        );
      }).fail(function (error) {
        Lms.ui.clearButtonLoading(button);
        showToast(
          "error",
          t("users.listPage.saveFailedTitle", null, "Khong the luu nguoi dung"),
          error && error.message ? error.message : t("users.listPage.saveFailedMessage", null, "Vui long thu lai.")
        );
      });
    });

    Lms.ui.showModal(modal);
  }

  function toggleLock(userId, locked) {
    const call = locked
      ? Lms.apiClient.post("api/users/" + userId + "/lock", { reason: "Locked from admin user list" })
      : Lms.apiClient.post("api/users/" + userId + "/unlock", {});

    call.done(function () {
      const user = findUser(userId);
      if (!user) {
        return;
      }

      user.status = locked ? "Locked" : "Active";
      applyFilters();
      showToast(
        locked ? "warning" : "success",
        locked ? t("users.listPage.userLockedTitle", null, "Da khoa nguoi dung") : t("users.listPage.userUnlockedTitle", null, "Da mo khoa nguoi dung"),
        t("users.listPage.userStatusMessage", { name: user.fullName, status: translateStatus(user.status).toLowerCase() }, user.fullName + " hien " + translateStatus(user.status).toLowerCase() + ".")
      );
    }).fail(function (error) {
      showToast(
        "error",
        t("users.listPage.actionFailedTitle", null, "Khong the cap nhat trang thai"),
        error && error.message ? error.message : t("users.listPage.actionFailedMessage", null, "Vui long thu lai.")
      );
    });
  }

  function showResetPasswordConfirm(userId) {
    const user = findUser(userId);

    if (!user || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = $(
      "<div>" +
        "<div class='app-modal-header'>" +
          "<h2 class='app-modal-title'>" + escapeHtml(t("users.listPage.resetPassword", null, "Dat lai mat khau")) + "</h2>" +
          "<button class='app-button app-button-secondary' type='button' data-modal-close>" + escapeHtml(t("users.listPage.close", null, "Dong")) + "</button>" +
        "</div>" +
        "<div class='app-modal-body'>" +
          "<p class='u-mb-0'>" + escapeHtml(t("users.listPage.resetPasswordCopy", { name: user.fullName }, "Dat lai mat khau cho " + user.fullName + "?")) + "</p>" +
        "</div>" +
        "<div class='app-modal-footer'>" +
          "<button class='app-button app-button-secondary' type='button' data-modal-close>" + escapeHtml(t("users.listPage.cancel", null, "Huy")) + "</button>" +
          "<button class='app-button app-button-primary' type='button' data-user-confirm-reset>" + escapeHtml(t("users.listPage.resetPassword", null, "Dat lai mat khau")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-user-confirm-reset]").on("click", function () {
      const button = $(this);
      Lms.ui.setButtonLoading(button, t("users.listPage.resetting", null, "Dang dat lai"));

      Lms.apiClient.post("api/users/" + userId + "/reset-password", {
        newPassword: "123456"
      }).done(function () {
        Lms.ui.clearButtonLoading(button);
        Lms.ui.closeModal();
        showToast(
          "success",
          t("users.listPage.passwordResetTitle", null, "Da dat lai mat khau"),
          t("users.listPage.passwordResetMessage", { name: user.fullName }, "Da tao mat khau tam thoi cho " + user.fullName + ".")
        );
      }).fail(function (error) {
        Lms.ui.clearButtonLoading(button);
        showToast(
          "error",
          t("users.listPage.passwordResetFailedTitle", null, "Khong the dat lai mat khau"),
          error && error.message ? error.message : t("users.listPage.passwordResetFailedMessage", null, "Vui long thu lai.")
        );
      });
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
      showToast("info", t("users.listPage.exportTitle", null, "Xuat nguoi dung"), t("users.listPage.exportMessage", null, "Chuc nang xuat se duoc noi o task bao cao/xuat du lieu."));
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

    Lms.apiClient.get("api/users?page=1&pageSize=200").done(function (response) {
      const items = response && response.data && Array.isArray(response.data.items) ? response.data.items : [];
      state.users = items.map(toUiUser);
      state.filteredUsers = state.users.slice();
      state.loaded = true;
      render();
    }).fail(function (error) {
      $("#userTableRows").html(
        "<tr><td colspan='5'><div class='app-empty-state'>" +
          "<div class='app-empty-icon' aria-hidden='true'>!</div>" +
          "<h3 class='app-empty-title'>" + escapeHtml(t("users.listPage.loadErrorTitle", null, "Khong the tai nguoi dung")) + "</h3>" +
          "<p class='app-empty-copy'>" + escapeHtml(error && error.message ? error.message : t("users.listPage.loadErrorCopy", null, "Vui long kiem tra ket noi API.")) + "</p>" +
        "</div></td></tr>"
      );
      showToast("error", t("users.listPage.dataErrorTitle", null, "Loi du lieu nguoi dung"), error && error.message ? error.message : t("users.listPage.dataErrorMessage", null, "Khong the tai API nguoi dung."));
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
