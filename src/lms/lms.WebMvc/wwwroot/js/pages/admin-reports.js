(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    reports: null,
    exams: [],
    courses: [],
    groups: [],
    filters: {
      dateFrom: "",
      dateTo: "",
      exam: "",
      course: "",
      group: ""
    }
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function populateSelect(selector, items, placeholder) {
    const $select = $(selector).empty().append('<option value="">' + placeholder + "</option>");

    items.forEach(function (item) {
      $select.append('<option value="' + escapeHtml(item.name) + '">' + escapeHtml(item.name) + "</option>");
    });
  }

  function getFilteredSummary(summary) {
    const activeFilterCount = Object.keys(state.filters).filter(function (key) {
      return Boolean(state.filters[key]);
    }).length;
    const adjustment = activeFilterCount * 2;

    return {
      passRate: Math.max(0, summary.passRate - adjustment),
      averageScore: Math.max(0, summary.averageScore - adjustment),
      examCount: Math.max(1, summary.examCount - activeFilterCount),
      completionRate: Math.max(0, summary.completionRate - adjustment)
    };
  }

  function renderActivityChart(items) {
    if (Lms.charts && Lms.charts.renderBar) {
      Lms.charts.renderBar("#reportActivityChart", items, {
        valueKey: "attempts",
        labelKey: "date",
        labelFormat: function (value) {
          return String(value).slice(5);
        }
      });
      return;
    }

    const maxAttempts = Math.max.apply(null, items.map(function (item) {
      return item.attempts;
    }).concat([1]));
    const $chart = $("#reportActivityChart").empty();

    items.forEach(function (item) {
      const height = Math.max(12, Math.round((item.attempts / maxAttempts) * 132));
      const label = item.date.slice(5);
      const attemptsText = t("reports.adminPage.attemptsCount", { count: item.attempts }, item.attempts + " lượt thi");
      const $bar = $(
        '<div class="admin-bar-item">' +
          '<div class="admin-bar" title="' + attemptsText + '"></div>' +
          '<span>' + escapeHtml(label) + '</span>' +
        '</div>'
      );

      $bar.find(".admin-bar").css("--bar-height", height + "px");
      $chart.append($bar);
    });
  }

  function renderDistribution(items) {
    if (Lms.charts && Lms.charts.renderDistribution) {
      Lms.charts.renderDistribution("#reportScoreDistribution", items);
      return;
    }

    const total = items.reduce(function (sum, item) {
      return sum + item.count;
    }, 0) || 1;
    const $chart = $("#reportScoreDistribution").empty();

    items.forEach(function (item) {
      const width = Math.round((item.count / total) * 100);
      const $row = $(
        '<div class="admin-distribution-row">' +
          '<span>' + escapeHtml(item.range) + '</span>' +
          '<div class="progress-track">' +
            '<div class="progress-fill"></div>' +
          '</div>' +
          '<strong>' + item.count + '</strong>' +
        '</div>'
      );

      $row.find(".progress-fill").css("--progress-width", width + "%");
      $chart.append($row);
    });
  }

  // Translates filter state description at runtime
  function getFilterLabel() {
    const active = [];

    if (state.filters.dateFrom || state.filters.dateTo) {
      active.push(t("reports.adminPage.filterDateRange", null, "khoảng ngày"));
    }

    ["exam", "course", "group"].forEach(function (key) {
      if (state.filters[key]) {
        active.push(state.filters[key]);
      }
    });

    return active.length ? active.join(" / ") : t("reports.adminPage.filterAllData", null, "Tất cả dữ liệu");
  }

  function renderSnapshot(summary) {
    $("#reportSummaryList").html(
      '<div class="report-summary-item">' +
        '<span>' + t("reports.adminPage.snapshotPerformance", null, "Hiệu suất") + '</span>' +
        '<strong>' + t("reports.adminPage.snapshotPerformanceDesc", { passRate: summary.passRate, averageScore: summary.averageScore }, summary.passRate + '% tỉ lệ đạt với ' + summary.averageScore + '/100 điểm trung bình') + '</strong>' +
      '</div>' +
      '<div class="report-summary-item">' +
        '<span>' + t("reports.adminPage.snapshotCoverage", null, "Phạm vi") + '</span>' +
        '<strong>' + t("reports.adminPage.snapshotCoverageDesc", { count: summary.examCount }, summary.examCount + ' bài thi bao gồm trong ngữ cảnh báo cáo này') + '</strong>' +
      '</div>' +
      '<div class="report-summary-item">' +
        '<span>' + t("reports.adminPage.snapshotCompletion", null, "Hoàn thành") + '</span>' +
        '<strong>' + t("reports.adminPage.snapshotCompletionDesc", { completionRate: summary.completionRate }, summary.completionRate + '% tỉ lệ hoàn thành của học viên') + '</strong>' +
      '</div>'
    );
  }

  function render() {
    if (!state.reports) {
      return;
    }

    const summary = getFilteredSummary(state.reports.summary);

    $("[data-report-summary='passRate']").text(summary.passRate + "%");
    $("[data-report-summary='averageScore']").text(summary.averageScore + "/100");
    $("[data-report-summary='examCount']").text(summary.examCount);
    $("[data-report-summary='completionRate']").text(summary.completionRate + "%");
    $("[data-report-badge='passRate']").text(summary.passRate + "%");
    $("[data-report-chart-text='passRate']").text(summary.passRate + "%");
    $(".report-donut").css("--donut-value", summary.passRate);
    $("[data-report-filter-state]").text(getFilterLabel());
    $("[data-report-generated-at]").text(t("reports.adminPage.generatedAtText", { date: new Date().toLocaleString() }, "Được tạo: " + new Date().toLocaleString()));

    renderActivityChart(state.reports.examActivity);
    renderDistribution(state.reports.scoreDistribution);
    renderSnapshot(summary);
  }

  function collectFilters() {
    Object.keys(state.filters).forEach(function (key) {
      state.filters[key] = $("[data-report-filter='" + key + "']").val() || "";
    });
  }

  function resetFilters() {
    Object.keys(state.filters).forEach(function (key) {
      state.filters[key] = "";
      $("[data-report-filter='" + key + "']").val("");
    });
    render();
  }

  function bindEvents() {
    $("[data-report-action='apply-filters']").on("click", function () {
      collectFilters();
      render();
      showToast("success", t("reports.adminPage.toastFiltersAppliedTitle", null, "Đã áp dụng bộ lọc"), t("reports.adminPage.toastFiltersAppliedMsg", null, "Bảng báo cáo đã được cập nhật theo bộ lọc mô phỏng."));
    });

    $("[data-report-action='reset-filters']").on("click", function () {
      resetFilters();
      showToast("info", t("reports.adminPage.toastFiltersResetTitle", null, "Đặt lại bộ lọc"), t("reports.adminPage.toastFiltersResetMsg", null, "Bảng báo cáo đã được đưa về tất cả dữ liệu mô phỏng."));
    });

    $("[data-report-action='export-excel'], [data-report-action='export-pdf']").on("click", function () {
      const type = $(this).data("report-action") === "export-excel" ? "Excel" : "PDF";
      showToast("info", t("reports.adminPage.toastExportTitle", { type: type }, "Xuất " + type), t("reports.adminPage.toastExportMsg", { type: type }, "Chức năng xuất " + type + " là giao diện mô phỏng trong giai đoạn này."));
    });
  }

  function init() {
    bindEvents();

    $(document).on("lms:i18n:changed", function () {
      populateSelect("[data-report-filter='exam']", state.exams, t("reports.adminPage.optionAllExams", null, "Tất cả bài thi"));
      populateSelect("[data-report-filter='course']", state.courses, t("reports.adminPage.optionAllCourses", null, "Tất cả khóa học"));
      populateSelect("[data-report-filter='group']", state.groups, t("reports.adminPage.optionAllGroups", null, "Tất cả học viên và nhóm"));
      render();
    });

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    $.when(
      Lms.apiClient.get("reports.json"),
      Lms.apiClient.get("exams.json"),
      Lms.apiClient.get("courses.json"),
      Lms.apiClient.get("groups.json")
    ).done(function (reportsResponse, examsResponse, coursesResponse, groupsResponse) {
      const reports = unwrap(reportsResponse);
      state.reports = reports.data;
      state.exams = getItems(examsResponse);
      state.courses = getItems(coursesResponse);
      state.groups = getItems(groupsResponse);

      populateSelect("[data-report-filter='exam']", state.exams, t("reports.adminPage.optionAllExams", null, "Tất cả bài thi"));
      populateSelect("[data-report-filter='course']", state.courses, t("reports.adminPage.optionAllCourses", null, "Tất cả khóa học"));
      populateSelect("[data-report-filter='group']", state.groups, t("reports.adminPage.optionAllGroups", null, "Tất cả học viên và nhóm"));
      render();
    }).fail(function () {
      showToast("error", t("reports.adminPage.toastLoadErrorTitle", null, "Báo cáo không khả dụng"), t("reports.adminPage.toastLoadErrorMessage", null, "Không thể tải dữ liệu mô phỏng báo cáo."));
    });
  }

  $(init);
})(window, jQuery);
