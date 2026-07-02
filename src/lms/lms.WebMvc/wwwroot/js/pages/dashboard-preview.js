(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function setMetric(selector, value) {
    $(selector).text(value);
  }

  function getData(response) {
    const payload = Array.isArray(response) ? response[0] : response;
    return payload && payload.data ? payload.data : null;
  }

  function initPreview() {
    if (!Lms.apiClient) {
      return;
    }

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    $.when(
      Lms.apiClient.get("api/users?page=1&pageSize=1"),
      Lms.apiClient.get("api/courses?page=1&pageSize=1"),
      Lms.apiClient.get("api/questions?page=1&pageSize=1"),
      Lms.apiClient.get("api/exams?page=1&pageSize=1")
    ).done(function (usersResponse, coursesResponse, questionsResponse, examsResponse) {
      const users = getData(usersResponse) || {};
      const courses = getData(coursesResponse) || {};
      const questions = getData(questionsResponse) || {};
      const exams = getData(examsResponse) || {};

      setMetric("[data-api-metric='users']", users.total || 0);
      setMetric("[data-api-metric='courses']", courses.total || 0);
      setMetric("[data-api-metric='questions']", questions.total || 0);
      setMetric("[data-api-metric='exams']", exams.total || 0);

      if (Lms.ui && Lms.ui.showToast) {
        Lms.ui.showToast({
          type: "success",
          title: t("dashboard.previewPage.toastLoadedTitle", null, "Đã tải dữ liệu"),
          message: t("dashboard.previewPage.toastLoadedMsg", null, "Các chỉ số tổng quan đã được tải từ API."),
          duration: 2500
        });
      }
    }).fail(function () {
      if (Lms.ui && Lms.ui.showToast) {
        Lms.ui.showToast({
          type: "error",
          title: t("dashboard.previewPage.toastErrorTitle", null, "Lỗi dữ liệu"),
          message: t("dashboard.previewPage.toastErrorMsg", null, "Không thể tải các chỉ số tổng quan từ API.")
        });
      }
    });
  }

  $(initPreview);
})(window, jQuery);
