(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};

  function clearErrors() {
    $(".auth-error").text("");
  }

  function showError(field, message) {
    $(`[data-valmsg-for='${field}']`).text(message);
  }

  function t(key, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, null, fallback) : fallback;
  }

  function renderPageTitle() {
    document.title = t("auth.loginPage.title", "Dang nhap") + " - lms";
  }

  function getRedirectUrl(session) {
    const user = session && session.user ? session.user : null;
    return Lms.auth && Lms.auth.getHomePath
      ? Lms.auth.getHomePath(user)
      : (user && user.role === "Admin" ? "/admin" : "/");
  }

  function init() {
    renderPageTitle();

    if (Lms.auth && Lms.auth.isAuthenticated()) {
      const user = Lms.auth.getCurrentUser();
      window.location.href = Lms.auth.getHomePath ? Lms.auth.getHomePath(user) : "/";
      return;
    }

    if (Lms.auth && Lms.auth.hasRefreshToken && Lms.auth.hasRefreshToken() && Lms.auth.refreshSession) {
      Lms.auth.refreshSession().done(function (session) {
        window.location.href = getRedirectUrl(session);
      });
    }

    $("#loginForm").on("submit", function (event) {
      event.preventDefault();
      clearErrors();

      const submitButton = $(this).find("button[type='submit']");
      const username = $("#username").val().trim();
      const password = $("#password").val();

      if (!username) {
        showError("username", t("auth.loginPage.usernameRequired", "Vui long nhap ten dang nhap."));
      }

      if (!password) {
        showError("password", t("auth.loginPage.passwordRequired", "Vui long nhap mat khau."));
      }

      if (!username || !password) {
        return;
      }

      Lms.ui.setButtonLoading(submitButton, t("auth.loginPage.signingIn", "Dang dang nhap"));

      Lms.apiClient.post("api/auth/login", {
        userName: username,
        password: password
      }).done(function (response) {
        const session = response && response.data ? response.data : null;

        if (!session) {
          Lms.ui.clearButtonLoading(submitButton);
          if (Lms.ui) {
            Lms.ui.showToast({
              type: "error",
              title: t("auth.loginPage.loginFailedTitle", "Dang nhap that bai"),
              message: t("auth.loginPage.loginFailedMessage", "Khong the dang nhap vao he thong.")
            });
          }
          return;
        }

        Lms.auth.setSession(session);
        const currentUser = Lms.auth.getCurrentUser ? Lms.auth.getCurrentUser() : session.user;

        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get("returnUrl");
        const redirectUrl = getRedirectUrl({ user: currentUser });
        const canUseReturnUrl = returnUrl && (currentUser.role === "Admin" || !returnUrl.toLowerCase().startsWith("/admin"));
        window.location.href = canUseReturnUrl ? returnUrl : redirectUrl;
      }).fail(function (error) {
        Lms.ui.clearButtonLoading(submitButton);
        if (Lms.ui) {
          Lms.ui.showToast({
            type: "error",
            title: t("auth.loginPage.loginFailedTitle", "Dang nhap that bai"),
            message: error && error.message
              ? error.message
              : t("auth.loginPage.loginFailedMessage", "Khong the dang nhap vao he thong.")
          });
        }
      });
    });

    $(document).on("lms:i18n:changed", renderPageTitle);
  }

  $(init);
})(window, jQuery);
