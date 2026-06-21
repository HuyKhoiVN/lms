(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const icons = {
    success: "bi-check-circle-fill",
    info: "bi-info-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    error: "bi-x-circle-fill"
  };

  function ensureContainer() {
    let $container = $(".app-toast-container");

    if (!$container.length) {
      $container = $('<div class="app-toast-container" aria-live="polite" aria-atomic="true"></div>');
      $("body").append($container);
    }

    return $container;
  }

  function dismiss($toast) {
    if (!$toast || !$toast.length || $toast.hasClass("is-hiding")) {
      return;
    }

    $toast.addClass("is-hiding");
    window.setTimeout(function () {
      $toast.remove();
    }, 180);
  }

  function show(options) {
    const settings = {
      type: "info",
      title: "Notification",
      message: "",
      duration: Lms.config && Lms.config.ui ? Lms.config.ui.toastDurationMs : 4000,
      ...options
    };
    const safeType = ["success", "info", "warning", "error"].includes(settings.type) ? settings.type : "info";
    const $toast = $(
      '<div class="app-toast app-toast-' + safeType + '" role="' + (safeType === "error" ? "alert" : "status") + '">' +
        '<span class="app-toast-icon" aria-hidden="true"><i class="bi ' + icons[safeType] + '"></i></span>' +
        '<div class="app-toast-content">' +
          '<p class="app-toast-title"></p>' +
          '<p class="app-toast-message"></p>' +
        '</div>' +
        '<button class="app-toast-close" type="button" aria-label="Close notification"><i class="bi bi-x-lg" aria-hidden="true"></i></button>' +
      '</div>'
    );

    $toast.find(".app-toast-title").text(settings.title);
    $toast.find(".app-toast-message").text(settings.message);
    $toast.find(".app-toast-close").on("click", function () {
      dismiss($toast);
    });

    ensureContainer().append($toast);

    if (settings.duration > 0) {
      const timeoutId = window.setTimeout(function () {
        dismiss($toast);
      }, settings.duration);
      $toast.data("dismiss-timeout", timeoutId);
    }

    return $toast;
  }

  Lms.toast = {
    show,
    dismiss
  };

  window.Lms = Lms;
})(window, jQuery);
