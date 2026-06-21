(function (window) {
  "use strict";

  const Lms = window.Lms || {};

  function get(key, fallbackValue) {
    const rawValue = window.localStorage.getItem(key);

    if (rawValue === null || rawValue === undefined) {
      return fallbackValue;
    }

    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue;
    }
  }

  function set(key, value) {
    const serializedValue = typeof value === "string" ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
  }

  function remove(key) {
    window.localStorage.removeItem(key);
  }

  function clearByPrefix(prefix) {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => window.localStorage.removeItem(key));
  }

  Lms.storage = {
    get,
    set,
    remove,
    clearByPrefix
  };

  window.Lms = Lms;
})(window);
