(function (window) {
  "use strict";

  const Lms = window.Lms || {};

  Lms.config = {
    appName: "lms",
    apiBaseUrl: "https://localhost:7001/api",
    mockBaseUrl: "/mock",
    useMock: true,
    auth: {
      accessTokenKey: "lms.access_token",
      refreshTokenKey: "lms.refresh_token",
      currentUserKey: "lms.current_user"
    },
    ui: {
      toastDurationMs: 4000,
      sidebarStateKey: "lms.sidebar_collapsed"
    },
    i18n: {
      defaultLanguage: "vi",
      supportedLanguages: ["vi", "en"],
      storageKey: "lms.ui.language",
      baseUrl: "/i18n"
    }
  };

  window.Lms = Lms;
})(window);
