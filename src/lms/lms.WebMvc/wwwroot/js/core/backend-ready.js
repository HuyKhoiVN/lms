(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  let readyPromise = null;
  let isReady = false;

  function getConfig() {
    const config = Lms.config && Lms.config.backendReady ? Lms.config.backendReady : {};
    return {
      path: config.path || "/health/ready",
      retryIntervalMs: Number(config.retryIntervalMs || 1500),
      retryMaxIntervalMs: Number(config.retryMaxIntervalMs || 5000)
    };
  }

  function getApiOrigin() {
    const baseUrl = String(Lms.config && Lms.config.apiBaseUrl ? Lms.config.apiBaseUrl : "").replace(/\/$/, "");
    return baseUrl.replace(/\/api\/v\d+$/i, "");
  }

  function buildReadyUrl() {
    const config = getConfig();
    const path = String(config.path || "/health/ready");

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return getApiOrigin() + "/" + path.replace(/^\/+/, "");
  }

  function ensureOverlay() {
    let overlay = $(".app-startup-overlay");
    if (overlay.length) {
      return overlay;
    }

    overlay = $(
      '<div class="app-startup-overlay" role="status" aria-live="polite">' +
        '<div class="app-startup-panel">' +
          '<span class="app-spinner" aria-hidden="true"></span>' +
          '<div>' +
            '<p class="app-startup-title">&#272;ang kh&#7903;i &#273;&#7897;ng h&#7879; th&#7889;ng...</p>' +
            '<p class="app-startup-copy">Vui l&#242;ng &#273;&#7907;i trong gi&#226;y l&#225;t.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    $("body").append(overlay);
    return overlay;
  }

  function showOverlay() {
    ensureOverlay().addClass("is-visible");
  }

  function hideOverlay() {
    $(".app-startup-overlay").removeClass("is-visible");
  }

  function waitForReady() {
    if (isReady) {
      return $.Deferred().resolve().promise();
    }

    if (readyPromise) {
      return readyPromise;
    }

    const deferred = $.Deferred();
    const config = getConfig();
    let delayMs = config.retryIntervalMs;

    function check() {
      $.ajax({
        method: "GET",
        url: buildReadyUrl(),
        cache: false,
        timeout: Math.max(config.retryMaxIntervalMs, 5000)
      }).done(function () {
        isReady = true;
        readyPromise = null;
        hideOverlay();
        deferred.resolve();
      }).fail(function () {
        showOverlay();
        window.setTimeout(check, delayMs);
        delayMs = Math.min(Math.round(delayMs * 1.4), config.retryMaxIntervalMs);
      });
    }

    check();
    readyPromise = deferred.promise();
    return readyPromise;
  }

  Lms.backendReady = {
    wait: waitForReady,
    isReady: function () {
      return isReady;
    },
    buildReadyUrl: buildReadyUrl
  };

  window.Lms = Lms;
})(window, jQuery);
