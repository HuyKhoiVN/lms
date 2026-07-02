(function (window) {
  "use strict";

  const Lms = window.Lms || {};
  const authConfig = Lms.config.auth;

  function getAccessToken() {
    return Lms.storage.get(authConfig.accessTokenKey, null);
  }

  function getRefreshToken() {
    return Lms.storage.get(authConfig.refreshTokenKey, null);
  }

  function getCurrentUser() {
    return Lms.storage.get(authConfig.currentUserKey, null);
  }

  function isAuthenticated() {
    return Boolean(getAccessToken() && getCurrentUser());
  }

  function getHomePath(user) {
    return user && user.role === "Admin" ? "/admin" : "/";
  }

  function setSession(session) {
    if (!session) {
      return;
    }

    Lms.storage.set(authConfig.accessTokenKey, session.accessToken || "");
    Lms.storage.set(authConfig.refreshTokenKey, session.refreshToken || "");
    Lms.storage.set(authConfig.currentUserKey, session.user || null);
  }

  function clearSession() {
    Lms.storage.remove(authConfig.accessTokenKey);
    Lms.storage.remove(authConfig.refreshTokenKey);
    Lms.storage.remove(authConfig.currentUserKey);
  }

  function getCurrentPath() {
    return window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";
  }

  function isLoginPath() {
    return getCurrentPath() === "/auth/login";
  }

  function isAdminPath() {
    return getCurrentPath() === "/admin" || getCurrentPath().startsWith("/admin/");
  }

  function isPublicPath() {
    return isLoginPath();
  }

  function handleUnauthorized() {
    clearSession();
    if (!isLoginPath()) {
      window.location.href = "/Auth/Login";
    }
  }

  function logout() {
    const refreshToken = getRefreshToken();
    const finalize = function () {
      clearSession();
      window.location.href = "/Auth/Login";
    };

    if (!Lms.apiClient || !refreshToken) {
      finalize();
      return;
    }

    Lms.apiClient.post("api/auth/logout", { refreshToken: refreshToken }).always(finalize);
  }

  function guardRoute() {
    if (isPublicPath()) {
      return true;
    }

    const user = getCurrentUser();

    if (!isAuthenticated()) {
      window.location.href = `/Auth/Login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    if (isAdminPath() && user.role !== "Admin") {
      window.location.href = getHomePath(user);
      return false;
    }

    if (!isAdminPath() && user.role === "Admin" && getCurrentPath() === "/") {
      window.location.href = getHomePath(user);
      return false;
    }

    return true;
  }

  function renderCurrentUser() {
    const user = getCurrentUser();

    if (!user) {
      return;
    }

    const displayName = user.fullName || user.userName || "User";

    $(".app-user-name").text(displayName);
    $(".app-user-role").text(user.role || "User");
    $(".app-avatar").text(displayName.trim().charAt(0).toUpperCase());
    $("[data-current-user-name]").text(displayName);
  }

  function bindUserRendering() {
    $(document).on("lms:i18n:changed", function () {
      renderCurrentUser();
    });
  }

  Lms.auth = {
    getAccessToken,
    getRefreshToken,
    getCurrentUser,
    isAuthenticated,
    getHomePath,
    setSession,
    clearSession,
    handleUnauthorized,
    logout,
    guardRoute,
    renderCurrentUser
  };

  $(bindUserRendering);
  window.Lms = Lms;
})(window);
