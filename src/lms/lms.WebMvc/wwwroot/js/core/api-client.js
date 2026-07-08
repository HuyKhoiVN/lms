(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};

  function normalizePath(path) {
    return String(path || "").replace(/^\/+/, "");
  }

  function buildUrl(path) {
    const normalizedPath = normalizePath(path);

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    const apiBaseUrl = String(Lms.config && Lms.config.apiBaseUrl ? Lms.config.apiBaseUrl : "").replace(/\/$/, "");

    if (/^api\//i.test(normalizedPath)) {
      return `${apiBaseUrl}/${normalizedPath.replace(/^api\//i, "")}`;
    }

    return `${apiBaseUrl}/${normalizedPath.replace(/^api\//, "")}`;
  }

  function buildApiOrigin() {
    return String(Lms.config && Lms.config.apiBaseUrl ? Lms.config.apiBaseUrl : "")
      .replace(/\/$/, "")
      .replace(/\/api\/v\d+$/i, "");
  }

  function getAuthHeaders() {
    const token = Lms.auth && Lms.auth.getAccessToken ? Lms.auth.getAccessToken() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function normalizeError(xhr) {
    return {
      status: xhr.status,
      message: xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Request failed",
      errors: xhr.responseJSON && xhr.responseJSON.errors ? xhr.responseJSON.errors : []
    };
  }

  function sendAjax(requestOptions, options, hasRetriedAuth) {
    const deferred = $.Deferred();

    $.ajax(requestOptions).done(function (response) {
      deferred.resolve(response);
    }).fail(function (xhr) {
      const canRefresh = xhr.status === 401
        && !hasRetriedAuth
        && !options.skipAuthRefresh
        && Lms.auth
        && Lms.auth.refreshSession;

      if (canRefresh) {
        Lms.auth.refreshSession().done(function () {
          requestOptions.headers = {
            ...getAuthHeaders(),
            ...(options.headers || {})
          };
          sendAjax(requestOptions, options, true).done(deferred.resolve).fail(deferred.reject);
        }).fail(function () {
          if (Lms.auth && Lms.auth.handleUnauthorized) {
            Lms.auth.handleUnauthorized();
          }
          deferred.reject(normalizeError(xhr));
        });
        return;
      }

      if (xhr.status === 401 && Lms.auth && Lms.auth.handleUnauthorized && !options.skipAuthRefresh) {
        Lms.auth.handleUnauthorized();
      }

      deferred.reject(normalizeError(xhr));
    });

    return deferred.promise();
  }

  function request(options) {
    const safeOptions = options || {};
    const requestOptions = {
      method: safeOptions.method || "GET",
      url: buildUrl(safeOptions.url),
      contentType: "application/json",
      dataType: "json",
      headers: {
        ...getAuthHeaders(),
        ...(safeOptions.headers || {})
      }
    };

    if (typeof safeOptions.contentType !== "undefined") {
      requestOptions.contentType = safeOptions.contentType;
    }

    if (safeOptions.dataType) {
      requestOptions.dataType = safeOptions.dataType;
    }

    if (typeof safeOptions.processData !== "undefined") {
      requestOptions.processData = safeOptions.processData;
    }

    if (safeOptions.data !== undefined && requestOptions.method !== "GET") {
      const isFormData = typeof window !== "undefined" && window.FormData && safeOptions.data instanceof window.FormData;
      requestOptions.data = requestOptions.contentType === "application/json" && !isFormData
        ? JSON.stringify(safeOptions.data)
        : safeOptions.data;
    }

    const deferred = $.Deferred();
    const readyWait = safeOptions.skipBackendReady || !Lms.backendReady
      ? $.Deferred().resolve().promise()
      : Lms.backendReady.wait();

    readyWait.done(function () {
      sendAjax(requestOptions, safeOptions, false).done(deferred.resolve).fail(deferred.reject);
    }).fail(function (error) {
      deferred.reject(error);
    });

    return deferred.promise();
  }

  Lms.apiClient = {
    request,
    buildUrl,
    buildApiOrigin,
    get: (url, options) => request({ ...(options || {}), method: "GET", url }),
    post: (url, data, options) => request({ ...(options || {}), method: "POST", url, data }),
    put: (url, data, options) => request({ ...(options || {}), method: "PUT", url, data }),
    delete: (url, options) => request({ ...(options || {}), method: "DELETE", url })
  };

  window.Lms = Lms;
})(window, jQuery);
