(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function setMetric(selector, value) {
    $(selector).text(value);
  }

  function unwrapAjaxResponse(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function initMockPreview() {
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
      Lms.apiClient.get("users.json"),
      Lms.apiClient.get("courses.json"),
      Lms.apiClient.get("questions.json"),
      Lms.apiClient.get("exams.json")
    ).done(function (usersResponse, coursesResponse, questionsResponse, examsResponse) {
      const users = unwrapAjaxResponse(usersResponse);
      const courses = unwrapAjaxResponse(coursesResponse);
      const questions = unwrapAjaxResponse(questionsResponse);
      const exams = unwrapAjaxResponse(examsResponse);

      setMetric("[data-mock-metric='users']", users.data.total);
      setMetric("[data-mock-metric='courses']", courses.data.total);
      setMetric("[data-mock-metric='questions']", questions.data.total);
      setMetric("[data-mock-metric='exams']", exams.data.total);

      if (Lms.ui && Lms.ui.showToast) {
        Lms.ui.showToast({
          type: "success",
          title: t("dashboard.previewPage.toastLoadedTitle", null, "Đã tải dữ liệu mô phỏng"),
          message: t("dashboard.previewPage.toastLoadedMsg", null, "Các tệp JSON nền tảng đã sẵn sàng cho các màn hình giao diện."),
          duration: 2500
        });
      }
    }).fail(function () {
      if (Lms.ui && Lms.ui.showToast) {
        Lms.ui.showToast({
          type: "error",
          title: t("dashboard.previewPage.toastErrorTitle", null, "Lỗi dữ liệu mô phỏng"),
          message: t("dashboard.previewPage.toastErrorMsg", null, "Không thể tải một hoặc nhiều tệp JSON nền tảng.")
        });
      }
    });
  }

  $(initMockPreview);
})(window, jQuery);
