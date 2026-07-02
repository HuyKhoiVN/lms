(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    usersTotal: 0,
    coursesTotal: 0,
    questionsTotal: 0,
    examsTotal: 0,
    examSummary: null,
    passRate: null,
    learningSummary: null,
    auditItems: [],
    loaded: false
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function unwrap(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getData(response) {
    const payload = unwrap(response);
    return payload && payload.data ? payload.data : null;
  }

  function getItems(response) {
    const data = getData(response);
    return data && Array.isArray(data.items) ? data.items : [];
  }

  function setText(selector, value) {
    $(selector).text(value);
  }

  function renderPageTitle() {
    document.title = t("dashboard.adminPage.title", null, "Bảng điều khiển quản trị") + " - " + t("common.appName", null, "lms");
  }

  function renderActivityChart(items) {
    if (Lms.charts && Lms.charts.renderBar) {
      Lms.charts.renderBar("#examActivityChart", items, {
        valueKey: "attempts",
        labelKey: "date",
        labelFormat: function (value) {
          return String(value || "").slice(0, 12);
        }
      });
      return;
    }

    const maxAttempts = Math.max.apply(null, items.map(function (item) {
      return item.attempts;
    }).concat([1]));
    const chart = $("#examActivityChart").empty();

    items.forEach(function (item) {
      const height = Math.max(12, Math.round((item.attempts / maxAttempts) * 120));
      const label = String(item.date || "").slice(0, 12);
      const title = item.attempts + " lượt làm bài";
      const barItem = $(
        '<div class="admin-bar-item">' +
          '<div class="admin-bar"></div>' +
          "<span>" + label + "</span>" +
        "</div>"
      );

      barItem.find(".admin-bar").attr("title", title).css("--bar-height", height + "px");
      chart.append(barItem);
    });
  }

  function renderDistribution(items) {
    if (Lms.charts && Lms.charts.renderDistribution) {
      Lms.charts.renderDistribution("#scoreDistributionChart", items);
      return;
    }

    const total = items.reduce(function (sum, item) {
      return sum + item.count;
    }, 0) || 1;
    const chart = $("#scoreDistributionChart").empty();

    items.forEach(function (item) {
      const width = Math.round((item.count / total) * 100);
      const row = $(
        '<div class="admin-distribution-row">' +
          "<span>" + item.range + "</span>" +
          '<div class="progress-track">' +
            '<div class="progress-fill"></div>' +
          "</div>" +
          "<strong>" + item.count + "</strong>" +
        "</div>"
      );

      row.find(".progress-fill").css("--progress-width", width + "%");
      chart.append(row);
    });
  }

  function buildScoreDistribution(items) {
    const buckets = [
      { range: "0-49", count: 0 },
      { range: "50-69", count: 0 },
      { range: "70-84", count: 0 },
      { range: "85-100", count: 0 }
    ];

    (items || []).forEach(function (item) {
      const score = Number(item.averageScore || 0);
      const weight = Number(item.attemptCount || 0) || 1;

      if (score < 50) {
        buckets[0].count += weight;
      } else if (score < 70) {
        buckets[1].count += weight;
      } else if (score < 85) {
        buckets[2].count += weight;
      } else {
        buckets[3].count += weight;
      }
    });

    return buckets;
  }

  function renderAuditRows(items) {
    const rows = $("#recentActivityRows").empty();

    if (!items.length) {
      rows.append(
        "<tr>" +
          '<td colspan="4" class="u-text-center">Chưa có nhật ký hoạt động.</td>' +
        "</tr>"
      );
      return;
    }

    items.forEach(function (item) {
      rows.append(
        "<tr>" +
          "<td>" + (item.userName || "Hệ thống") + "</td>" +
          '<td><span class="app-badge app-badge-info">' + (item.action || "--") + "</span></td>" +
          "<td>" + (item.entityName || "--") + "</td>" +
          '<td class="u-text-right">' + (item.createdDate ? new Date(item.createdDate).toLocaleString() : "--") + "</td>" +
        "</tr>"
      );
    });
  }

  function renderDashboard() {
    if (!state.loaded) {
      return;
    }

    const passRatePercent = Math.round(Number(state.passRate && state.passRate.passRatePercent || 0));
    const averageScore = Math.round(Number(state.examSummary && state.examSummary.averageScore || 0));
    const completionRate = Math.round(Number(state.learningSummary && state.learningSummary.averageProgressPercent || 0));
    const examCount = state.examsTotal;
    const activityItems = (state.examSummary && state.examSummary.items || []).slice(0, 8).map(function (item) {
      return {
        date: item.examName,
        attempts: Number(item.attemptCount || 0)
      };
    });

    setText("[data-admin-metric='users']", state.usersTotal);
    setText("[data-admin-metric='courses']", state.coursesTotal);
    setText("[data-admin-metric='questions']", state.questionsTotal);
    setText("[data-admin-metric='exams']", state.examsTotal);

    setText("[data-admin-summary='passRate']", passRatePercent + "%");
    setText("[data-admin-summary='averageScore']", averageScore + "/100");
    setText("[data-admin-summary-text='passRate']", passRatePercent + "%");
    setText("[data-admin-summary-text='averageScore']", averageScore + "/100");
    setText("[data-admin-summary-text='completionRate']", completionRate + "%");
    setText("[data-admin-summary-text='examCount']", examCount);

    $(".admin-donut").css("--donut-value", passRatePercent);
    renderActivityChart(activityItems);
    renderDistribution(buildScoreDistribution(state.examSummary && state.examSummary.items));
    renderAuditRows(state.auditItems);
  }

  function loadDashboardData() {
    renderPageTitle();

    if (!Lms.apiClient) {
      return;
    }

    $.when(
      Lms.apiClient.get("api/users?page=1&pageSize=1"),
      Lms.apiClient.get("api/courses?page=1&pageSize=1"),
      Lms.apiClient.get("api/questions?page=1&pageSize=1"),
      Lms.apiClient.get("api/exams?page=1&pageSize=1"),
      Lms.apiClient.get("api/reports/exam-summary?page=1&pageSize=20"),
      Lms.apiClient.get("api/reports/pass-rate?page=1&pageSize=20"),
      Lms.apiClient.get("api/reports/learning-summary?page=1&pageSize=20"),
      Lms.apiClient.get("api/audit-logs?page=1&pageSize=8")
    ).done(function (usersResponse, coursesResponse, questionsResponse, examsResponse, examSummaryResponse, passRateResponse, learningSummaryResponse, auditResponse) {
      state.usersTotal = Number(getData(usersResponse).total || 0);
      state.coursesTotal = Number(getData(coursesResponse).total || 0);
      state.questionsTotal = Number(getData(questionsResponse).total || 0);
      state.examsTotal = Number(getData(examsResponse).total || 0);
      state.examSummary = getData(examSummaryResponse) || {};
      state.passRate = getData(passRateResponse) || {};
      state.learningSummary = getData(learningSummaryResponse) || {};
      state.auditItems = getItems(auditResponse);
      state.loaded = true;

      renderDashboard();
    }).fail(function (error) {
      if (Lms.ui) {
        Lms.ui.showToast({
          type: "error",
          title: t("dashboard.adminPage.dataErrorTitle", null, "Lỗi dashboard"),
          message: error && error.message
            ? error.message
            : t("dashboard.adminPage.dataErrorMessage", null, "Không thể tải dữ liệu dashboard quản trị từ backend.")
        });
      }
    });
  }

  function bindI18nRefresh() {
    $(document).on("lms:i18n:changed", function () {
      renderPageTitle();
      renderDashboard();
    });
  }

  function init() {
    bindI18nRefresh();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadDashboardData);
      return;
    }

    loadDashboardData();
  }

  $(init);
})(window, jQuery);
