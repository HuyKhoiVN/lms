(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const accounts = {
    admin: {
      password: "123456",
      role: "Admin",
      fullName: "Administrator",
      redirectUrl: "/admin"
    },
    student01: {
      password: "123456",
      role: "Student",
      fullName: "Student One",
      redirectUrl: "/"
    }
  };

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
    document.title = t("auth.loginPage.title", "Đăng nhập") + " - lms";
  }

  function setAccount(role) {
    $("[data-login-role]").removeClass("active");
    $("[data-login-role='" + role + "']").addClass("active");

    if (role === "Admin") {
      $("#username").val("admin");
    } else {
      $("#username").val("student01");
    }

    $("#password").val("123456").trigger("focus");
  }

  function login(username, password) {
    const account = accounts[username.toLowerCase()];

    if (!account || account.password !== password) {
      return null;
    }

    return {
      accessToken: `mock-access-token-${account.role.toLowerCase()}`,
      refreshToken: `mock-refresh-token-${account.role.toLowerCase()}`,
      user: {
        id: account.role === "Admin" ? 1 : 2,
        userName: username,
        fullName: account.fullName,
        role: account.role
      },
      redirectUrl: account.redirectUrl
    };
  }

  function init() {
    renderPageTitle();

    if (Lms.auth && Lms.auth.isAuthenticated()) {
      const user = Lms.auth.getCurrentUser();
      window.location.href = user && user.role === "Admin" ? "/admin" : "/";
      return;
    }

    $("[data-login-role]").on("click", function () {
      setAccount($(this).data("login-role"));
    });

    $("#loginForm").on("submit", function (event) {
      event.preventDefault();
      clearErrors();

      const submitButton = $(this).find("button[type='submit']");
      const username = $("#username").val().trim();
      const password = $("#password").val();

      if (!username) {
        showError("username", t("auth.loginPage.usernameRequired", "Vui lòng nhập tên đăng nhập."));
      }

      if (!password) {
        showError("password", t("auth.loginPage.passwordRequired", "Vui lòng nhập mật khẩu."));
      }

      if (!username || !password) {
        return;
      }

      const session = login(username, password);

      if (!session) {
        if (Lms.ui) {
          Lms.ui.showToast({
            type: "error",
            title: t("auth.loginPage.loginFailedTitle", "Đăng nhập thất bại"),
            message: t("auth.loginPage.loginFailedMessage", "Hãy dùng admin / 123456 hoặc student01 / 123456.")
          });
        }
        return;
      }

      Lms.ui.setButtonLoading(submitButton, t("auth.loginPage.signingIn", "Đang đăng nhập"));
      Lms.auth.setSession(session);

      window.setTimeout(function () {
        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get("returnUrl");
        const canUseReturnUrl = returnUrl && (session.user.role === "Admin" || !returnUrl.toLowerCase().startsWith("/admin"));
        window.location.href = canUseReturnUrl ? returnUrl : session.redirectUrl;
      }, 450);
    });

    $(document).on("lms:i18n:changed", renderPageTitle);
  }

  $(init);
})(window, jQuery);
