(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const localResultsKey = "lms.student.examResults";
  const state = {
    results: [],
    filteredResults: [],
    search: "",
    status: ""
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function unwrap(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getItems(response) {
    const payload = unwrap(response);
    return payload && payload.data && Array.isArray(payload.data.items) ? payload.data.items : [];
  }

  // Use toLocaleString but keep fallback or handle custom logic if needed
  function formatDate(value) {
    return value ? new Date(value).toLocaleString() : "--";
  }

  function getBadgeClass(passed) {
    return passed ? "app-badge-success" : "app-badge-danger";
  }

  function getResultIcon(passed) {
    return passed ? "bi-check2-circle" : "bi-x-circle";
  }

  function getLocalResults() {
    return Lms.storage ? Lms.storage.get(localResultsKey, []) : [];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderMetrics() {
    const total = state.results.length;
    const passed = state.results.filter(function (result) {
      return result.passed;
    }).length;
    const average = total
      ? Math.round(state.results.reduce(function (sum, result) {
        return sum + Number(result.score || 0);
      }, 0) / total)
      : 0;
    const latest = state.results.slice().sort(function (a, b) {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    })[0];

    $("[data-result-metric='total']").text(total);
    $("[data-result-metric='passed']").text(passed);
    $("[data-result-metric='average']").text(average + "%");
    $("[data-result-metric='latest']").text(latest ? latest.score + "%" : "--");
  }

  function renderRows() {
    const $rows = $("#studentResultRows").empty();

    $("[data-result-count]").text(t("results.listPage.records", { count: state.filteredResults.length }, state.filteredResults.length + " bản ghi"));

    if (!state.filteredResults.length) {
      $rows.append(
        '<tr>' +
          '<td colspan="6">' +
            '<div class="app-empty-state">' +
              '<div class="image-slot image-slot-md image-slot-result u-mb-4" data-image-label="Empty results illustration 320x180">' +
                '<img src="/images/placeholders/result-placeholder.svg" alt="" aria-hidden="true" />' +
              '</div>' +
              '<h3 class="app-empty-title">' + t("results.listPage.noResultsTitle", null, "Không tìm thấy kết quả") + '</h3>' +
              '<p class="app-empty-copy">' + t("results.listPage.noResultsCopy", null, "Thử từ khóa tên bài thi hoặc trạng thái khác.") + '</p>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
      return;
    }

    state.filteredResults.forEach(function (result) {
      $rows.append(
        '<tr class="student-result-row ' + (result.passed ? "is-passed" : "is-failed") + '">' +
          '<td>' +
            '<div class="admin-user-cell">' +
              '<span class="app-avatar student-result-avatar" aria-hidden="true"><i class="bi ' + getResultIcon(result.passed) + '"></i></span>' +
              '<div>' +
                '<strong>' + escapeHtml(result.examName) + '</strong>' +
                '<span>' + escapeHtml(result.studentName || t("common.student", null, "Học viên")) + '</span>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td><strong>' + escapeHtml(result.score) + '/100</strong></td>' +
          '<td><span class="app-badge ' + getBadgeClass(result.passed) + '">' + (result.passed ? t("results.listPage.passed", null, "Đạt") : t("results.listPage.failed", null, "Không đạt")) + '</span></td>' +
          '<td>' + t("results.listPage.durationValue", { minutes: result.durationMinutes }, result.durationMinutes + " phút") + '</td>' +
          '<td>' + escapeHtml(formatDate(result.submittedAt)) + '</td>' +
          '<td class="u-text-right">' +
            '<button class="app-button app-button-secondary" type="button" data-result-action="detail" data-result-id="' + result.id + '">' + t("results.listPage.buttonDetail", null, "Chi tiết") + '</button>' +
          '</td>' +
        '</tr>'
      );
    });
  }

  function render() {
    renderMetrics();
    renderRows();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredResults = state.results.filter(function (result) {
      const matchesKeyword = !keyword || result.examName.toLowerCase().includes(keyword);
      const matchesStatus = !state.status ||
        (state.status === "passed" && result.passed) ||
        (state.status === "failed" && !result.passed);

      return matchesKeyword && matchesStatus;
    });

    render();
  }

  function bindEvents() {
    $("[data-result-filter='search']").on("input", function () {
      state.search = $(this).val();
      applyFilters();
    });

    $("[data-result-filter='status']").on("change", function () {
      state.status = $(this).val();
      applyFilters();
    });

    $("[data-result-action='clear-filters']").on("click", function () {
      state.search = "";
      state.status = "";
      $("[data-result-filter='search']").val("");
      $("[data-result-filter='status']").val("");
      applyFilters();
    });

    $(document).on("click", "[data-result-action='detail']", function () {
      const resultId = $(this).data("result-id");
      window.location.href = "/Results/Detail/" + encodeURIComponent(resultId);
    });

    $(document).on("lms:i18n:changed", render);
  }

  function init() {
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    Lms.apiClient.get("results.json").done(function (response) {
      state.results = getLocalResults().concat(getItems(response)).sort(function (a, b) {
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      });
      state.filteredResults = state.results.slice();
      render();
    }).fail(function () {
      state.results = getLocalResults();
      state.filteredResults = state.results.slice();
      render();
    });
  }

  $(init);
})(window, jQuery);
