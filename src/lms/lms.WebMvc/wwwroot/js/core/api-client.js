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

    if (Lms.config.useMock) {
      return `${Lms.config.mockBaseUrl}/${normalizedPath}`;
    }

    return `${Lms.config.apiBaseUrl}/${normalizedPath.replace(/^api\//, "")}`;
  }

  function getAuthHeaders() {
    const token = Lms.auth && Lms.auth.getAccessToken ? Lms.auth.getAccessToken() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function request(options) {
    const requestOptions = {
      method: options.method || "GET",
      url: buildUrl(options.url),
      contentType: "application/json",
      dataType: "json",
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    };

    if (options.data !== undefined && requestOptions.method !== "GET") {
      requestOptions.data = JSON.stringify(options.data);
    }

    return $.ajax(requestOptions).then(
      (response) => response,
      (xhr) => {
        if (xhr.status === 401 && Lms.auth && Lms.auth.handleUnauthorized) {
          Lms.auth.handleUnauthorized();
        }

        return $.Deferred().reject({
          status: xhr.status,
          message: xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Request failed",
          errors: xhr.responseJSON && xhr.responseJSON.errors ? xhr.responseJSON.errors : []
        }).promise();
      }
    );
  }

  Lms.apiClient = {
    request,
    get: (url, options) => request({ ...(options || {}), method: "GET", url }),
    post: (url, data, options) => request({ ...(options || {}), method: "POST", url, data }),
    put: (url, data, options) => request({ ...(options || {}), method: "PUT", url, data }),
    delete: (url, options) => request({ ...(options || {}), method: "DELETE", url })
  };

  window.Lms = Lms;
})(window, jQuery);
