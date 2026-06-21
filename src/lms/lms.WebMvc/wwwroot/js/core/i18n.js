(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const config = Lms.config && Lms.config.i18n ? Lms.config.i18n : {};
  const defaultLanguage = config.defaultLanguage || "vi";
  const supportedLanguages = config.supportedLanguages || ["vi", "en"];
  const storageKey = config.storageKey || "lms.ui.language";
  const baseUrl = config.baseUrl || "/i18n";
  const state = {
    language: defaultLanguage,
    dictionaries: {},
    ready: $.Deferred()
  };

  function normalizeLanguage(language) {
    return supportedLanguages.includes(language) ? language : defaultLanguage;
  }

  function getStoredLanguage() {
    const stored = Lms.storage ? Lms.storage.get(storageKey, defaultLanguage) : defaultLanguage;
    return normalizeLanguage(stored);
  }

  function getNestedValue(source, path) {
    return String(path || "").split(".").reduce(function (current, segment) {
      if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
        return current[segment];
      }

      return undefined;
    }, source);
  }

  function interpolate(text, params) {
    if (!params) {
      return text;
    }

    return String(text).replace(/\{\{\s*([\w.-]+)\s*\}\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
    });
  }

  function t(key, params, fallback) {
    const dictionary = state.dictionaries[state.language] || {};
    const defaultDictionary = state.dictionaries[defaultLanguage] || {};
    const value = getNestedValue(dictionary, key) ?? getNestedValue(defaultDictionary, key) ?? fallback ?? key;

    return interpolate(value, params);
  }

  function setDocumentLanguage(language) {
    $("html").attr("lang", language);
    $("[data-i18n-language]").val(language);
  }

  function translateElement(element) {
    const $element = $(element);
    const textKey = $element.data("i18n");
    const placeholderKey = $element.data("i18n-placeholder");
    const titleKey = $element.data("i18n-title");
    const ariaKey = $element.data("i18n-aria");
    const valueKey = $element.data("i18n-value");

    if (textKey) {
      $element.text(t(textKey, null, $element.text()));
    }

    if (placeholderKey) {
      $element.attr("placeholder", t(placeholderKey, null, $element.attr("placeholder")));
    }

    if (titleKey) {
      $element.attr("title", t(titleKey, null, $element.attr("title")));
    }

    if (ariaKey) {
      $element.attr("aria-label", t(ariaKey, null, $element.attr("aria-label")));
    }

    if (valueKey) {
      $element.val(t(valueKey, null, $element.val()));
    }
  }

  function translatePage(root) {
    const scope = root ? $(root) : $(document);
    scope.find("[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria], [data-i18n-value]").each(function () {
      translateElement(this);
    });
  }

  function loadDictionary(language) {
    const normalized = normalizeLanguage(language);

    if (state.dictionaries[normalized]) {
      return $.Deferred().resolve(state.dictionaries[normalized]).promise();
    }

    return $.getJSON(baseUrl + "/" + normalized + ".json").done(function (dictionary) {
      state.dictionaries[normalized] = dictionary || {};
    });
  }

  function setLanguage(language, options) {
    const normalized = normalizeLanguage(language);
    const settings = {
      persist: true,
      trigger: true,
      ...options
    };

    return loadDictionary(normalized).then(function () {
      state.language = normalized;

      if (settings.persist && Lms.storage) {
        Lms.storage.set(storageKey, normalized);
      }

      setDocumentLanguage(normalized);
      translatePage();

      if (settings.trigger) {
        $(document).trigger("lms:i18n:changed", [normalized]);
      }

      return normalized;
    });
  }

  function bindLanguageSwitcher() {
    $(document).on("change", "[data-i18n-language]", function () {
      setLanguage($(this).val());
    });
  }

  function init() {
    bindLanguageSwitcher();

    return setLanguage(getStoredLanguage(), { persist: false, trigger: false })
      .always(function () {
        state.ready.resolve(state.language);
      });
  }

  Lms.i18n = {
    init,
    t,
    setLanguage,
    translatePage,
    ready: state.ready.promise(),
    get language() {
      return state.language;
    }
  };

  $(init);
  window.Lms = Lms;
})(window, jQuery);
