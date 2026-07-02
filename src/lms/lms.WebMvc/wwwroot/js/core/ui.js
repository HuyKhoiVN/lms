(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};

  function getCurrentPath() {
    return window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";
  }

  function normalizePath(path) {
    if (!path) {
      return "/";
    }

    return path
      .toLowerCase()
      .replace(/[?#].*$/, "")
      .replace(/\/$/, "") || "/";
  }

  function isPathMatch(currentPath, targetPath) {
    if (targetPath === "/") {
      return currentPath === "/";
    }

    return currentPath === targetPath || currentPath.startsWith(targetPath + "/");
  }

  function setActiveLinkGroup(selector) {
    const currentPath = getCurrentPath();
    let bestMatch = null;
    let bestLength = -1;

    $(selector).each(function () {
      const link = $(this);
      const href = normalizePath(link.attr("href"));

      link.removeClass("active").removeAttr("aria-current");

      if (!href || href === "#" || href.startsWith("javascript:")) {
        return;
      }

      if (isPathMatch(currentPath, href) && href.length > bestLength) {
        bestMatch = link;
        bestLength = href.length;
      }
    });

    if (bestMatch) {
      bestMatch.addClass("active").attr("aria-current", "page");
    }
  }

  function isMobileSidebar() {
    return window.matchMedia("(max-width: 991.98px)").matches;
  }

  function updateSidebarAccessibility() {
    const isMobile = isMobileSidebar();
    const isOpen = $(".app-shell-admin").hasClass("is-sidebar-open");
    const isCollapsed = $(".app-shell-admin").hasClass("is-sidebar-collapsed");

    $(".app-sidebar-toggle").attr("aria-expanded", isMobile ? String(isOpen) : String(!isCollapsed));
    $(".app-sidebar-backdrop").attr("aria-hidden", isMobile ? String(!isOpen) : "true");
  }

  function setActiveSidebarLink() {
    setActiveLinkGroup(".app-nav-link");
    setActiveLinkGroup(".learning-menu-link");
  }

  function restoreSidebarState() {
    if (!Lms.storage || !Lms.config || !Lms.config.ui) {
      updateSidebarAccessibility();
      return;
    }

    const collapsed = Lms.storage.get(Lms.config.ui.sidebarStateKey, false);
    $(".app-shell-admin").toggleClass("is-sidebar-collapsed", Boolean(collapsed) && !isMobileSidebar());
    updateSidebarAccessibility();
  }

  function ensureSidebarBackdrop() {
    let $backdrop = $(".app-sidebar-backdrop");

    if (!$backdrop.length) {
      $backdrop = $('<button class="app-sidebar-backdrop" type="button" aria-label="Close menu"></button>');
      $(".app-shell-admin").append($backdrop);
    }

    return $backdrop;
  }

  function closeMobileSidebar() {
    $(".app-shell-admin").removeClass("is-sidebar-open");
    updateSidebarAccessibility();
  }

  function bindSidebarToggle() {
    ensureSidebarBackdrop();

    $(".app-sidebar-toggle").off("click.lmsSidebar").on("click.lmsSidebar", function () {
      const $shell = $(".app-shell-admin");

      if (isMobileSidebar()) {
        $shell.toggleClass("is-sidebar-open");
        updateSidebarAccessibility();
        return;
      }

      const nextState = !$shell.hasClass("is-sidebar-collapsed");
      $shell.toggleClass("is-sidebar-collapsed", nextState);
      if (Lms.storage && Lms.config && Lms.config.ui) {
        Lms.storage.set(Lms.config.ui.sidebarStateKey, nextState);
      }

      updateSidebarAccessibility();
    });

    $(document)
      .off("click.lmsSidebarBackdrop")
      .on("click.lmsSidebarBackdrop", ".app-sidebar-backdrop, .app-nav-link", function () {
        if (isMobileSidebar()) {
          closeMobileSidebar();
        }
      });

    $(window).off("resize.lmsSidebar").on("resize.lmsSidebar", function () {
      closeMobileSidebar();
      restoreSidebarState();
    });
  }

  function setButtonLoading(button, loadingText) {
    const target = $(button);

    if (!target.data("original-text")) {
      target.data("original-text", target.html());
    }

    target.prop("disabled", true);
    target.html('<span class="app-spinner" aria-hidden="true"></span><span>' + (loadingText || "Loading") + "</span>");
  }

  function clearButtonLoading(button) {
    const target = $(button);
    const originalText = target.data("original-text");

    if (originalText) {
      target.html(originalText);
    }

    target.prop("disabled", false);
  }

  function showToast(options) {
    if (Lms.toast && Lms.toast.show) {
      return Lms.toast.show(options);
    }

    return $();
  }

  function showModal(content, options) {
    if (Lms.modal && Lms.modal.open) {
      return Lms.modal.open(content, options);
    }

    return $();
  }

  function closeModal() {
    if (Lms.modal && Lms.modal.close) {
      Lms.modal.close();
    }
  }

  function init() {
    if (Lms.auth && Lms.auth.guardRoute && !Lms.auth.guardRoute()) {
      return;
    }

    if (Lms.dropdown && Lms.dropdown.init) {
      Lms.dropdown.init();
    }

    if (Lms.modal && Lms.modal.init) {
      Lms.modal.init();
    }

    restoreSidebarState();
    bindSidebarToggle();
    setActiveSidebarLink();

    if (Lms.auth && Lms.auth.renderCurrentUser) {
      Lms.auth.renderCurrentUser();
    }

    $(document)
      .off("keydown.lmsUi")
      .on("keydown.lmsUi", function (event) {
        if (event.key === "Escape") {
          closeMobileSidebar();
        }
      })
      .off("click.lmsLogout")
      .on("click.lmsLogout", "[data-auth-action='logout']", function () {
        if (Lms.auth && Lms.auth.logout) {
          Lms.auth.logout();
        }
      });
  }

  Lms.ui = {
    init,
    setActiveSidebarLink,
    showToast,
    showModal,
    closeModal,
    setButtonLoading,
    clearButtonLoading
  };

  $(init);
  window.Lms = Lms;
})(window, jQuery);
