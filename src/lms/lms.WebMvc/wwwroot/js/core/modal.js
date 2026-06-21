(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};

  function close() {
    const $backdrop = $(".app-modal-backdrop");

    if (!$backdrop.length) {
      return;
    }

    $backdrop.addClass("is-closing");
    window.setTimeout(function () {
      $backdrop.remove();
      $("body").removeClass("app-modal-open");
    }, 160);
  }

  function open(content, options) {
    const settings = {
      size: "",
      labelledBy: "",
      ...options
    };
    close();

    const $modal = $(
      '<div class="app-modal-backdrop" role="presentation">' +
        '<div class="app-modal-preview app-modal-live ' + settings.size + '" role="dialog" aria-modal="true" tabindex="-1"></div>' +
      '</div>'
    );

    if (settings.labelledBy) {
      $modal.find(".app-modal-live").attr("aria-labelledby", settings.labelledBy);
    }

    $modal.find(".app-modal-live").append(content);
    $("body").append($modal).addClass("app-modal-open");
    window.setTimeout(function () {
      $modal.find(".app-modal-live").trigger("focus");
    }, 0);

    return $modal;
  }

  function init() {
    $(document)
      .off("click.lmsModal")
      .on("click.lmsModal", ".app-modal-backdrop", function (event) {
        if ($(event.target).is(".app-modal-backdrop")) {
          close();
        }
      })
      .on("click.lmsModal", "[data-modal-close]", function () {
        close();
      })
      .on("keydown.lmsModal", function (event) {
        if (event.key === "Escape") {
          close();
        }
      });
  }

  Lms.modal = {
    init,
    open,
    close
  };

  window.Lms = Lms;
})(window, jQuery);
