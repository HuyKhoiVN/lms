(function (window) {
  "use strict";

  const Lms = window.Lms || {};
  const authConfig = Lms.config.auth;
  let refreshPromise = null;

  function getAccessToken() {
    return Lms.storage.get(authConfig.accessTokenKey, null);
  }

  function getRefreshToken() {
    return Lms.storage.get(authConfig.refreshTokenKey, null);
  }

  function getCurrentUser() {
    return Lms.storage.get(authConfig.currentUserKey, null);
  }

  function hasRefreshToken() {
    return Boolean(getRefreshToken());
  }

  function parseJwtPayload(token) {
    if (!token || token.split(".").length < 2) {
      return null;
    }

    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(window.atob(base64).split("").map(function (char) {
        return "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
      }).join(""));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function isAccessTokenExpired() {
    const payload = parseJwtPayload(getAccessToken());
    if (!payload || !payload.exp) {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  }

  function isAuthenticated() {
    return Boolean(getAccessToken() && !isAccessTokenExpired() && getCurrentUser());
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

  function refreshSession() {
    const refreshToken = getRefreshToken();

    if (!refreshToken || !Lms.apiClient) {
      return $.Deferred().reject().promise();
    }

    if (refreshPromise) {
      return refreshPromise;
    }

    const deferred = $.Deferred();
    refreshPromise = deferred.promise();

    Lms.apiClient.post("api/auth/refresh-token", {
      refreshToken: refreshToken
    }, {
      skipAuthRefresh: true
    }).done(function (response) {
      const session = response && response.data ? response.data : null;
      if (!session) {
        clearSession();
        deferred.reject();
        return;
      }

      setSession(session);
      deferred.resolve(session);
    }).fail(function () {
      clearSession();
      deferred.reject();
    }).always(function () {
      refreshPromise = null;
    });

    return deferred.promise();
  }

  function ensureSession() {
    if (isLoginPath()) {
      return $.Deferred().resolve().promise();
    }

    if (isAuthenticated()) {
      return $.Deferred().resolve(getCurrentUser()).promise();
    }

    if (hasRefreshToken()) {
      return refreshSession();
    }

    return $.Deferred().resolve().promise();
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

    if (!isAuthenticated() && !hasRefreshToken()) {
      window.location.href = `/Auth/Login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    if (!user) {
      return true;
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
    hasRefreshToken,
    isAccessTokenExpired,
    isAuthenticated,
    getHomePath,
    setSession,
    clearSession,
    refreshSession,
    ensureSession,
    handleUnauthorized,
    logout,
    guardRoute,
    renderCurrentUser
  };

  $(bindUserRendering);
  window.Lms = Lms;
})(window);
