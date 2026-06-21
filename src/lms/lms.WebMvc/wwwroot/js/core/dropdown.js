(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const openClass = "is-open";

  function closeAll(except) {
    $("[data-dropdown]." + openClass).each(function () {
      if (except && this === except) {
        return;
      }

      const $dropdown = $(this);
      $dropdown.removeClass(openClass);
      $dropdown.find("[data-dropdown-toggle]").attr("aria-expanded", "false");
    });
  }

  function toggle(dropdown) {
    const $dropdown = $(dropdown);
    const isOpen = $dropdown.hasClass(openClass);

    closeAll(dropdown);
    $dropdown.toggleClass(openClass, !isOpen);
    $dropdown.find("[data-dropdown-toggle]").attr("aria-expanded", String(!isOpen));
  }

  function init() {
    $(document)
      .off("click.lmsDropdown")
      .on("click.lmsDropdown", "[data-dropdown-toggle]", function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggle($(this).closest("[data-dropdown]")[0]);
      })
      .on("click.lmsDropdown", "[data-dropdown-menu]", function (event) {
        event.stopPropagation();
      })
      .on("click.lmsDropdown", "[data-dropdown-close]", function () {
        closeAll();
      })
      .on("click.lmsDropdown", function () {
        closeAll();
      })
      .on("keydown.lmsDropdown", function (event) {
        if (event.key === "Escape") {
          closeAll();
        }
      });
  }

  Lms.dropdown = {
    init,
    closeAll,
    toggle
  };

  window.Lms = Lms;
})(window, jQuery);
