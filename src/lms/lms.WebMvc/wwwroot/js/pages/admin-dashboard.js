(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    users: null,
    courses: null,
    questions: null,
    exams: null,
    reports: null,
    audit: null,
    loaded: false
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function unwrap(response) {
    return Array.isArray(response) ? response[0] : response;
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
          return String(value).slice(5);
        }
      });
      return;
    }

    const maxAttempts = Math.max(...items.map(function (item) {
      return item.attempts;
    }), 1);
    const chart = $("#examActivityChart").empty();

    items.forEach(function (item) {
      const height = Math.max(12, Math.round((item.attempts / maxAttempts) * 120));
      const label = item.date.slice(5);
      const title = t("dashboard.adminPage.attemptsTitle", { count: item.attempts }, item.attempts + " lượt làm bài");
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

  function translateAuditAction(action) {
    return t("dashboard.adminPage.actions." + action, null, action);
  }

  function translateAuditEntity(entity) {
    return t("dashboard.adminPage.entities." + entity, null, entity);
  }

  function renderAuditRows(items) {
    const rows = $("#recentActivityRows").empty();

    items.forEach(function (item) {
      rows.append(
        "<tr>" +
          "<td>" + item.user + "</td>" +
          '<td><span class="app-badge app-badge-info">' + translateAuditAction(item.action) + "</span></td>" +
          "<td>" + translateAuditEntity(item.entity) + "</td>" +
          '<td class="u-text-right">' + new Date(item.dateTime).toLocaleString() + "</td>" +
        "</tr>"
      );
    });
  }

  function renderDashboard() {
    if (!state.loaded) {
      return;
    }

    const summary = state.reports.data.summary;

    setText("[data-admin-metric='users']", state.users.data.total);
    setText("[data-admin-metric='courses']", state.courses.data.total);
    setText("[data-admin-metric='questions']", state.questions.data.total);
    setText("[data-admin-metric='exams']", state.exams.data.total);

    setText("[data-admin-summary='passRate']", summary.passRate + "%");
    setText("[data-admin-summary='averageScore']", summary.averageScore + "/100");
    setText("[data-admin-summary-text='passRate']", summary.passRate + "%");
    setText("[data-admin-summary-text='averageScore']", summary.averageScore + "/100");
    setText("[data-admin-summary-text='completionRate']", summary.completionRate + "%");
    setText("[data-admin-summary-text='examCount']", summary.examCount);

    $(".admin-donut").css("--donut-value", summary.passRate);
    renderActivityChart(state.reports.data.examActivity);
    renderDistribution(state.reports.data.scoreDistribution);
    renderAuditRows(state.audit.data.items);
  }

  function loadDashboardData() {
    renderPageTitle();

    if (!Lms.apiClient) {
      return;
    }

    $.when(
      Lms.apiClient.get("users.json"),
      Lms.apiClient.get("courses.json"),
      Lms.apiClient.get("questions.json"),
      Lms.apiClient.get("exams.json"),
      Lms.apiClient.get("reports.json"),
      Lms.apiClient.get("audit-logs.json")
    ).done(function (usersResponse, coursesResponse, questionsResponse, examsResponse, reportsResponse, auditResponse) {
      state.users = unwrap(usersResponse);
      state.courses = unwrap(coursesResponse);
      state.questions = unwrap(questionsResponse);
      state.exams = unwrap(examsResponse);
      state.reports = unwrap(reportsResponse);
      state.audit = unwrap(auditResponse);
      state.loaded = true;

      renderDashboard();
    }).fail(function () {
      if (Lms.ui) {
        Lms.ui.showToast({
          type: "error",
          title: t("dashboard.adminPage.dataErrorTitle", null, "Lỗi dashboard"),
          message: t("dashboard.adminPage.dataErrorMessage", null, "Không thể tải dữ liệu mô phỏng dashboard quản trị.")
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
