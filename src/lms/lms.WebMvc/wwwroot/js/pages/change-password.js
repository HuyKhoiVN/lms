(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};

  function t(key, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, null, fallback) : fallback;
  }

  function renderPageTitle() {
    document.title = t("auth.changePasswordPage.title", "Đổi mật khẩu") + " - lms";
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
      showError("oldPassword", t("auth.changePasswordPage.currentRequired", "Vui lòng nhập mật khẩu hiện tại."));
      isValid = false;
    } else if (values.oldPassword !== "123456") {
      showError("oldPassword", t("auth.changePasswordPage.currentMustMatch", "Mật khẩu mô phỏng hiện tại phải là 123456."));
      isValid = false;
    }

    if (!values.newPassword) {
      showError("newPassword", t("auth.changePasswordPage.newRequired", "Vui lòng nhập mật khẩu mới."));
      isValid = false;
    } else if (values.newPassword.length < 6) {
      showError("newPassword", t("auth.changePasswordPage.newMinLength", "Mật khẩu mới phải có ít nhất 6 ký tự."));
      isValid = false;
    } else if (values.newPassword === values.oldPassword) {
      showError("newPassword", t("auth.changePasswordPage.newMustDiffer", "Mật khẩu mới phải khác mật khẩu hiện tại."));
      isValid = false;
    }

    if (!values.confirmPassword) {
      showError("confirmPassword", t("auth.changePasswordPage.confirmRequired", "Vui lòng xác nhận mật khẩu mới."));
      isValid = false;
    } else if (values.confirmPassword !== values.newPassword) {
      showError("confirmPassword", t("auth.changePasswordPage.confirmMismatch", "Mật khẩu xác nhận không khớp."));
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
            title: t("auth.changePasswordPage.validationFailedTitle", "Kiểm tra chưa đạt"),
            message: t("auth.changePasswordPage.validationFailedMessage", "Vui lòng kiểm tra lại các trường mật khẩu được đánh dấu.")
          });
        }
        return;
      }

      Lms.ui.setButtonLoading(submitButton, t("auth.changePasswordPage.updating", "Đang cập nhật"));

      window.setTimeout(function () {
        Lms.ui.clearButtonLoading(submitButton);
        form[0].reset();
        Lms.ui.showToast({
          type: "success",
          title: t("auth.changePasswordPage.successTitle", "Đã cập nhật mật khẩu"),
          message: t("auth.changePasswordPage.successMessage", "Đổi mật khẩu mô phỏng thành công.")
        });
      }, 500);
    });
  }

  $(init);
})(window, jQuery);
