(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    examSummary: null,
    passRate: null,
    questionAnalysis: null,
    learningSummary: null,
    exams: [],
    courses: [],
    users: [],
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

  function getData(response) {
    const payload = unwrap(response);
    return payload && payload.data ? payload.data : null;
  }

  function getItems(response) {
    const data = getData(response);
    return data && Array.isArray(data.items) ? data.items : [];
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
    const currentValue = $(selector).val() || "";
    const $select = $(selector).empty().append('<option value="">' + placeholder + "</option>");

    items.forEach(function (item) {
      $select.append('<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + "</option>");
    });

    $select.val(currentValue);
  }

  function buildQuery(extra) {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", "50");

    if (state.filters.dateFrom) {
      params.set("fromDate", state.filters.dateFrom);
    }
    if (state.filters.dateTo) {
      params.set("toDate", state.filters.dateTo);
    }
    if (state.filters.exam) {
      params.set("examId", state.filters.exam);
    }
    if (state.filters.course) {
      params.set("courseId", state.filters.course);
    }
    if (state.filters.group) {
      params.set("userId", state.filters.group);
    }

    Object.keys(extra || {}).forEach(function (key) {
      if (extra[key] !== undefined && extra[key] !== null && extra[key] !== "") {
        params.set(key, extra[key]);
      }
    });

    return params.toString();
  }

  function renderActivityChart(items) {
    if (Lms.charts && Lms.charts.renderBar) {
      Lms.charts.renderBar("#reportActivityChart", items, {
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
    const $chart = $("#reportActivityChart").empty();

    items.forEach(function (item) {
      const height = Math.max(12, Math.round((item.attempts / maxAttempts) * 132));
      const label = String(item.date || "").slice(0, 12);
      const attemptsText = item.attempts + " lượt thi";
      const $bar = $(
        '<div class="admin-bar-item">' +
          '<div class="admin-bar" title="' + attemptsText + '"></div>' +
          "<span>" + escapeHtml(label) + "</span>" +
        "</div>"
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
          "<span>" + escapeHtml(item.range) + "</span>" +
          '<div class="progress-track">' +
            '<div class="progress-fill"></div>' +
          "</div>" +
          "<strong>" + item.count + "</strong>" +
        "</div>"
      );

      $row.find(".progress-fill").css("--progress-width", width + "%");
      $chart.append($row);
    });
  }

  function buildQuestionDistribution(items) {
    const buckets = [
      { range: "0-49%", count: 0 },
      { range: "50-69%", count: 0 },
      { range: "70-84%", count: 0 },
      { range: "85-100%", count: 0 }
    ];

    (items || []).forEach(function (item) {
      const rate = Number(item.correctRatePercent || 0);
      const weight = Number(item.answerCount || 0) || 1;

      if (rate < 50) {
        buckets[0].count += weight;
      } else if (rate < 70) {
        buckets[1].count += weight;
      } else if (rate < 85) {
        buckets[2].count += weight;
      } else {
        buckets[3].count += weight;
      }
    });

    return buckets;
  }

  function getFilterLabel() {
    const active = [];

    if (state.filters.dateFrom || state.filters.dateTo) {
      active.push(t("reports.adminPage.filterDateRange", null, "khoảng ngày"));
    }

    if (state.filters.exam) {
      const exam = state.exams.find(function (item) { return String(item.id) === String(state.filters.exam); });
      if (exam) {
        active.push(exam.name);
      }
    }

    if (state.filters.course) {
      const course = state.courses.find(function (item) { return String(item.id) === String(state.filters.course); });
      if (course) {
        active.push(course.name);
      }
    }

    if (state.filters.group) {
      const user = state.users.find(function (item) { return String(item.id) === String(state.filters.group); });
      if (user) {
        active.push(user.name);
      }
    }

    return active.length ? active.join(" / ") : t("reports.adminPage.filterAllData", null, "Tất cả dữ liệu");
  }

  function renderSnapshot() {
    const examSummary = state.examSummary || {};
    const passRate = state.passRate || {};
    const learningSummary = state.learningSummary || {};
    const strongestExam = (passRate.items || []).slice().sort(function (a, b) {
      return Number(b.passRatePercent || 0) - Number(a.passRatePercent || 0);
    })[0];
    const weakestQuestion = (state.questionAnalysis && state.questionAnalysis.items || []).slice().sort(function (a, b) {
      return Number(a.correctRatePercent || 0) - Number(b.correctRatePercent || 0);
    })[0];

    $("#reportSummaryList").html(
      '<div class="report-summary-item">' +
        "<span>Hiệu suất thi</span>" +
        "<strong>" + escapeHtml(Math.round(Number(passRate.passRatePercent || 0)) + "% tỷ lệ đạt, " + Math.round(Number(examSummary.averageScore || 0)) + "/100 điểm trung bình") + "</strong>" +
      "</div>" +
      '<div class="report-summary-item">' +
        "<span>Khóa học</span>" +
        "<strong>" + escapeHtml(Number(learningSummary.completedCount || 0) + "/" + Number(learningSummary.totalProgressRecords || 0) + " bản ghi tiến độ đã hoàn thành") + "</strong>" +
      "</div>" +
      '<div class="report-summary-item">' +
        "<span>Bài thi nổi bật</span>" +
        "<strong>" + escapeHtml(strongestExam ? strongestExam.examName + " - " + Math.round(Number(strongestExam.passRatePercent || 0)) + "% đạt" : "Chưa có dữ liệu") + "</strong>" +
      "</div>" +
      '<div class="report-summary-item">' +
        "<span>Câu hỏi cần chú ý</span>" +
        "<strong>" + escapeHtml(weakestQuestion ? weakestQuestion.questionContent + " - " + Math.round(Number(weakestQuestion.correctRatePercent || 0)) + "% đúng" : "Chưa có dữ liệu") + "</strong>" +
      "</div>"
    );
  }

  function render() {
    if (!state.examSummary || !state.passRate || !state.learningSummary || !state.questionAnalysis) {
      return;
    }

    const passRatePercent = Math.round(Number(state.passRate.passRatePercent || 0));
    const averageScore = Math.round(Number(state.examSummary.averageScore || 0));
    const examCount = (state.examSummary.items || []).length;
    const completionRate = Math.round(Number(state.learningSummary.averageProgressPercent || 0));

    $("[data-report-summary='passRate']").text(passRatePercent + "%");
    $("[data-report-summary='averageScore']").text(averageScore + "/100");
    $("[data-report-summary='examCount']").text(examCount);
    $("[data-report-summary='completionRate']").text(completionRate + "%");
    $("[data-report-badge='passRate']").text(passRatePercent + "%");
    $("[data-report-chart-text='passRate']").text(passRatePercent + "%");
    $(".report-donut").css("--donut-value", passRatePercent);
    $("[data-report-filter-state]").text(getFilterLabel());
    $("[data-report-generated-at]").text("Được tạo: " + new Date().toLocaleString());

    renderActivityChart((state.examSummary.items || []).map(function (item) {
      return {
        date: item.examName,
        attempts: Number(item.attemptCount || 0)
      };
    }));
    renderDistribution(buildQuestionDistribution(state.questionAnalysis.items));
    renderSnapshot();
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
  }

  function downloadFile(url, fileNameFallback) {
    const token = Lms.auth && Lms.auth.getAccessToken ? Lms.auth.getAccessToken() : null;

    return fetch(url, {
      headers: token ? { Authorization: "Bearer " + token } : {}
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Không thể tải file báo cáo.");
      }
      return Promise.all([response.blob(), response.headers.get("Content-Disposition")]);
    }).then(function (payload) {
      const blob = payload[0];
      const disposition = payload[1] || "";
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      const fileName = match && match[1] ? match[1] : fileNameFallback;
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    });
  }

  function loadReportData() {
    const query = buildQuery();

    $.when(
      Lms.apiClient.get("api/reports/exam-summary?" + query),
      Lms.apiClient.get("api/reports/pass-rate?" + query),
      Lms.apiClient.get("api/reports/question-analysis?" + query),
      Lms.apiClient.get("api/reports/learning-summary?" + query)
    ).done(function (examSummaryResponse, passRateResponse, questionAnalysisResponse, learningSummaryResponse) {
      state.examSummary = getData(examSummaryResponse) || {};
      state.passRate = getData(passRateResponse) || {};
      state.questionAnalysis = getData(questionAnalysisResponse) || {};
      state.learningSummary = getData(learningSummaryResponse) || {};
      render();
    }).fail(function (error) {
      showToast("error", t("reports.adminPage.toastLoadErrorTitle", null, "Báo cáo không khả dụng"), error && error.message ? error.message : t("reports.adminPage.toastLoadErrorMessage", null, "Không thể tải dữ liệu báo cáo từ backend."));
    });
  }

  function bindEvents() {
    $("[data-report-action='apply-filters']").on("click", function () {
      collectFilters();
      loadReportData();
      showToast("success", "Đã áp dụng bộ lọc", "Bảng báo cáo đã được cập nhật từ API.");
    });

    $("[data-report-action='reset-filters']").on("click", function () {
      resetFilters();
      loadReportData();
      showToast("info", "Đặt lại bộ lọc", "Bảng báo cáo đã trở về toàn bộ dữ liệu.");
    });

    $("[data-report-action='export-excel']").on("click", function () {
      downloadFile((Lms.apiClient.request ? (function () {
        const base = Lms.config.apiBaseUrl.replace(/\/$/, "");
        return base + "/reports/export/excel?" + buildQuery({ reportType: "exam-summary" });
      })() : ""), "report.csv").catch(function (error) {
        showToast("error", "Xuất Excel thất bại", error.message || "Không thể tải file báo cáo.");
      });
    });

    $("[data-report-action='export-pdf']").on("click", function () {
      downloadFile((function () {
        const base = Lms.config.apiBaseUrl.replace(/\/$/, "");
        return base + "/reports/export/pdf?" + buildQuery({ reportType: "exam-summary" });
      })(), "report.pdf").catch(function (error) {
        showToast("error", "Xuất PDF thất bại", error.message || "Không thể tải file báo cáo.");
      });
    });
  }

  function init() {
    bindEvents();

    $(document).on("lms:i18n:changed", function () {
      populateSelect("[data-report-filter='exam']", state.exams, t("reports.adminPage.optionAllExams", null, "Tất cả bài thi"));
      populateSelect("[data-report-filter='course']", state.courses, t("reports.adminPage.optionAllCourses", null, "Tất cả khóa học"));
      populateSelect("[data-report-filter='group']", state.users, "Tất cả học viên");
      render();
    });

    $.when(
      Lms.apiClient.get("api/exams?page=1&pageSize=200"),
      Lms.apiClient.get("api/courses?page=1&pageSize=200"),
      Lms.apiClient.get("api/users?page=1&pageSize=200")
    ).done(function (examsResponse, coursesResponse, usersResponse) {
      state.exams = getItems(examsResponse).map(function (item) {
        return { id: item.id, name: item.name || "" };
      });
      state.courses = getItems(coursesResponse).map(function (item) {
        return { id: item.id, name: item.name || "" };
      });
      state.users = getItems(usersResponse).filter(function (item) {
        return item.role === "Student";
      }).map(function (item) {
        return { id: item.id, name: item.fullName || item.userName || "" };
      });

      populateSelect("[data-report-filter='exam']", state.exams, t("reports.adminPage.optionAllExams", null, "Tất cả bài thi"));
      populateSelect("[data-report-filter='course']", state.courses, t("reports.adminPage.optionAllCourses", null, "Tất cả khóa học"));
      populateSelect("[data-report-filter='group']", state.users, "Tất cả học viên");
      loadReportData();
    }).fail(function (error) {
      showToast("error", t("reports.adminPage.toastLoadErrorTitle", null, "Báo cáo không khả dụng"), error && error.message ? error.message : t("reports.adminPage.toastLoadErrorMessage", null, "Không thể tải dữ liệu nguồn cho báo cáo."));
    });
  }

  $(init);
})(window, jQuery);
