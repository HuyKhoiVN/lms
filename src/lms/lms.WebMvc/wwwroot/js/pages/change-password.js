(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};

  function t(key, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, null, fallback) : fallback;
  }

  function renderPageTitle() {
    document.title = t("auth.changePasswordPage.title", "Doi mat khau") + " - lms";
  }

  function clearErrors() {
    $(".auth-error").text("");
  }

  function showError(field, message) {
    $(`[data-valmsg-for='${field}']`).text(message);
  }

  function validate(values) {
    let isValid = true;

    if (!values.oldPassword) {
      showError("oldPassword", t("auth.changePasswordPage.currentRequired", "Vui long nhap mat khau hien tai."));
      isValid = false;
    }

    if (!values.newPassword) {
      showError("newPassword", t("auth.changePasswordPage.newRequired", "Vui long nhap mat khau moi."));
      isValid = false;
    } else if (values.newPassword.length < 6) {
      showError("newPassword", t("auth.changePasswordPage.newMinLength", "Mat khau moi phai co it nhat 6 ky tu."));
      isValid = false;
    } else if (values.newPassword === values.oldPassword) {
      showError("newPassword", t("auth.changePasswordPage.newMustDiffer", "Mat khau moi phai khac mat khau hien tai."));
      isValid = false;
    }

    if (!values.confirmPassword) {
      showError("confirmPassword", t("auth.changePasswordPage.confirmRequired", "Vui long xac nhan mat khau moi."));
      isValid = false;
    } else if (values.confirmPassword !== values.newPassword) {
      showError("confirmPassword", t("auth.changePasswordPage.confirmMismatch", "Mat khau xac nhan khong khop."));
      isValid = false;
    }

    return isValid;
  }

  function init() {
    renderPageTitle();
    $(document).on("lms:i18n:changed", renderPageTitle);

    $("#changePasswordForm").on("submit", function (event) {
      event.preventDefault();
      clearErrors();

      const form = $(this);
      const submitButton = form.find("button[type='submit']");
      const values = {
        oldPassword: $("#oldPassword").val(),
        newPassword: $("#newPassword").val(),
        confirmPassword: $("#confirmPassword").val()
      };

      if (!validate(values)) {
        if (Lms.ui) {
          Lms.ui.showToast({
            type: "error",
            title: t("auth.changePasswordPage.validationFailedTitle", "Kiem tra chua dat"),
            message: t("auth.changePasswordPage.validationFailedMessage", "Vui long kiem tra lai cac truong mat khau duoc danh dau.")
          });
        }
        return;
      }

      Lms.ui.setButtonLoading(submitButton, t("auth.changePasswordPage.updating", "Dang cap nhat"));

      Lms.apiClient.post("api/auth/change-password", {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      }).done(function () {
        Lms.ui.clearButtonLoading(submitButton);
        form[0].reset();
        Lms.ui.showToast({
          type: "success",
          title: t("auth.changePasswordPage.successTitle", "Da cap nhat mat khau"),
          message: t("auth.changePasswordPage.successMessage", "Doi mat khau thanh cong.")
        });
      }).fail(function (error) {
        Lms.ui.clearButtonLoading(submitButton);
        Lms.ui.showToast({
          type: "error",
          title: t("auth.changePasswordPage.failedTitle", "Khong the doi mat khau"),
          message: error && error.message ? error.message : t("auth.changePasswordPage.failedMessage", "Vui long thu lai.")
        });
      });
    });
  }

  $(init);
})(window, jQuery);
