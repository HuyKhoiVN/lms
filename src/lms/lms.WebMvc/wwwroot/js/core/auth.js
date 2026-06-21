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
    clearSession();
    window.location.href = "/Auth/Login";
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
      window.location.href = "/";
      return false;
    }

    if (!isAdminPath() && user.role === "Admin" && getCurrentPath() === "/") {
      window.location.href = "/admin";
      return false;
    }

    return true;
  }

  function renderCurrentUser() {
    const user = getCurrentUser();

    if (!user) {
      return;
    }

    $(".app-user-name").text(user.fullName || user.userName || "User");
    $(".app-user-role").text(user.role || "User");
    $(".app-avatar").text((user.fullName || user.userName || "U").trim().charAt(0).toUpperCase());
  }

  Lms.auth = {
    getAccessToken,
    getRefreshToken,
    getCurrentUser,
    isAuthenticated,
    setSession,
    clearSession,
    handleUnauthorized,
    logout,
    guardRoute,
    renderCurrentUser
  };

  window.Lms = Lms;
})(window);
