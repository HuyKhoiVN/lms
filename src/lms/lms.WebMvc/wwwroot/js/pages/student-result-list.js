(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    summaryResults: [],
    results: [],
    search: "",
    status: "",
    page: 1,
    pageSize: 5,
    total: 0,
    totalPages: 1,
    searchTimer: null
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function unwrap(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getPagedData(response) {
    const payload = unwrap(response);
    const data = payload && payload.data ? payload.data : {};
    return {
      items: Array.isArray(data.items) ? data.items : [],
      total: Number(data.total || 0),
      page: Number(data.page || state.page || 1),
      pageSize: Number(data.pageSize || state.pageSize || 5)
    };
  }

  function getItems(response) {
    return getPagedData(response).items;
  }

  function formatDate(value) {
    return value ? new Date(value).toLocaleString() : "--";
  }

  function clampScore(score) {
    return Math.max(0, Math.min(100, Number(score || 0)));
  }

  function getBadgeClass(passed) {
    return passed ? "results-status-badge is-passed" : "results-status-badge is-failed";
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
      Lms.ui.showToast({ type: type, title: title, message: message });
    }
  }

  function normalizeResult(item) {
    return {
      id: item.id,
      attemptId: item.attemptId,
      examId: item.examId,
      examName: item.examName || t("common.exam", null, "Bài thi"),
      studentId: item.userId,
      studentName: t("common.student", null, "Học viên"),
      score: Number(item.score || 0),
      passed: Boolean(item.passed),
      submittedAt: item.completedDate,
      durationMinutes: item.durationMinutes || null
    };
  }

  function buildHistoryUrl() {
    const query = new URLSearchParams();
    query.set("page", String(state.page));
    query.set("pageSize", String(state.pageSize));

    if (state.search.trim()) {
      query.set("keyword", state.search.trim());
    }

    if (state.status === "passed") {
      query.set("passed", "true");
    }

    if (state.status === "failed") {
      query.set("passed", "false");
    }

    return "api/results/my?" + query.toString();
  }

  function renderPageTitle() {
    document.title = t("results.listPage.title", null, "Kết quả học tập") + " - " + t("common.appName", null, "lms");
  }

  function renderMetrics() {
    const total = state.summaryResults.length;
    const passed = state.summaryResults.filter(function (result) {
      return result.passed;
    }).length;
    const average = total
      ? Math.round(state.summaryResults.reduce(function (sum, result) {
        return sum + Number(result.score || 0);
      }, 0) / total)
      : 0;
    const latest = state.summaryResults.slice().sort(function (a, b) {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    })[0];

    $("[data-result-metric='total']").text(total);
    $("[data-result-metric='passed']").text(passed);
    $("[data-result-metric='average']").text(average + "%");
    $("[data-result-metric='latest']").text(latest ? latest.score + "%" : "--");
    $("[data-result-metric='latestExam']").text(latest ? latest.examName : "--");
  }

  function renderSpotlight() {
    const $container = $("#studentResultSpotlight").empty();
    const latest = state.summaryResults.slice().sort(function (a, b) {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    })[0];

    if (!latest) {
      $container.html(
        '<div class="lms-empty-compact">' +
          '<i class="bi bi-clipboard2-data" aria-hidden="true"></i>' +
          "<h3>Chưa có kết quả</h3>" +
          "<p>Hoàn thành bài thi đầu tiên để xem tóm tắt kết quả tại đây.</p>" +
        "</div>"
      );
      return;
    }

    $container.html(
      '<div class="student-result-spotlight-card">' +
        '<span class="' + getBadgeClass(latest.passed) + '">' + escapeHtml(latest.passed ? t("results.listPage.passed", null, "Đạt") : t("results.listPage.failed", null, "Không đạt")) + "</span>" +
        "<h3>" + escapeHtml(latest.examName) + "</h3>" +
        "<p>" + escapeHtml(formatDate(latest.submittedAt)) + "</p>" +
        '<div class="student-result-spotlight-score">' +
          "<strong>" + escapeHtml(latest.score) + "/100</strong>" +
          "<span>" + escapeHtml(
            latest.durationMinutes
              ? t("results.listPage.durationValue", { minutes: latest.durationMinutes }, latest.durationMinutes + " phút")
              : t("results.listPage.durationUnavailable", null, "Chưa có dữ liệu")
          ) + "</span>" +
        "</div>" +
        '<div class="results-score-progress" aria-hidden="true"><span style="--progress-width: ' + clampScore(latest.score) + '%;"></span></div>' +
        '<a class="app-button app-button-primary" href="/Results/Detail/' + encodeURIComponent(latest.id) + '">' + escapeHtml(t("results.listPage.buttonDetail", null, "Xem chi tiết")) + "</a>" +
      "</div>"
    );
  }

  function emptyMarkup() {
    return (
      '<tr class="student-result-reveal is-visible" data-result-list-reveal>' +
        '<td colspan="6">' +
          '<div class="results-empty-state">' +
            '<i class="bi bi-search" aria-hidden="true"></i>' +
            "<h3>" + escapeHtml(t("results.listPage.noResultsTitle", null, "Không tìm thấy kết quả")) + "</h3>" +
            "<p>" + escapeHtml(t("results.listPage.noResultsCopy", null, "Thử tên bài thi hoặc trạng thái khác để xem kết quả phù hợp hơn.")) + "</p>" +
          "</div>" +
        "</td>" +
      "</tr>"
    );
  }

  function renderRows() {
    const $rows = $("#studentResultRows").empty();

    $("[data-result-count]").text(t("results.listPage.records", { count: state.total }, state.total + " bản ghi"));

    if (!state.results.length) {
      $rows.html(emptyMarkup());
      initResultListReveal();
      return;
    }

    state.results.forEach(function (result) {
      const durationText = result.durationMinutes
        ? result.durationMinutes + " phút"
        : "--";

      const $row = $(
        '<tr class="student-result-row student-result-reveal ' + (result.passed ? "is-passed" : "is-failed") + '" data-result-list-reveal>' +
          '<td data-result-label="Bài thi">' +
            '<div class="student-result-exam-cell">' +
              '<span class="student-result-avatar" aria-hidden="true"><i class="bi ' + (result.passed ? "bi-check2-circle" : "bi-x-circle") + '"></i></span>' +
              "<span>" +
                "<strong>" + escapeHtml(result.examName) + "</strong>" +
                "<small>" + escapeHtml(result.studentName) + "</small>" +
              "</span>" +
            "</div>" +
          "</td>" +
          '<td data-result-label="Trạng thái">' +
            '<span class="' + getBadgeClass(result.passed) + '">' + escapeHtml(result.passed ? t("results.listPage.passed", null, "Đạt") : t("results.listPage.failed", null, "Không đạt")) + "</span>" +
          "</td>" +
          '<td data-result-label="Điểm số"><strong class="student-result-score">' + escapeHtml(result.score) + "/100</strong></td>" +
          '<td data-result-label="Thời gian làm bài">' + escapeHtml(durationText) + "</td>" +
          '<td data-result-label="Ngày thi">' + escapeHtml(formatDate(result.submittedAt)) + "</td>" +
          '<td data-result-label="Thao tác">' +
            '<a class="app-button app-button-secondary results-detail-button" href="/Results/Detail/' + encodeURIComponent(result.id) + '">' + escapeHtml(t("results.listPage.buttonDetail", null, "Chi tiết")) + "</a>" +
            '<i class="bi bi-chevron-right results-row-chevron" aria-hidden="true"></i>' +
          "</td>" +
        "</tr>"
      );

      $rows.append($row);
    });

    initResultListReveal();
  }

  function getVisiblePages() {
    const pages = [];
    const start = Math.max(1, state.page - 1);
    const end = Math.min(state.totalPages, start + 2);

    for (let page = Math.max(1, end - 2); page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }

  function renderPagination() {
    const $pagination = $("[data-result-pagination]").empty();

    if (state.totalPages <= 1) {
      return;
    }

    const from = ((state.page - 1) * state.pageSize) + 1;
    const to = Math.min(state.total, state.page * state.pageSize);
    const pageButtons = getVisiblePages().map(function (page) {
      return (
        '<button class="results-page-button ' + (page === state.page ? "active" : "") + '" type="button" data-result-page="' + page + '">' +
          escapeHtml(page) +
        "</button>"
      );
    }).join("");

    $pagination.html(
      '<span class="results-pagination-summary">' + escapeHtml(from + "-" + to + " / " + state.total) + "</span>" +
      '<div class="results-pagination-pages">' +
        '<button class="results-page-button" type="button" data-result-page="' + (state.page - 1) + '" ' + (state.page <= 1 ? "disabled" : "") + ' aria-label="Trang trước"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>' +
        pageButtons +
        '<button class="results-page-button" type="button" data-result-page="' + (state.page + 1) + '" ' + (state.page >= state.totalPages ? "disabled" : "") + ' aria-label="Trang sau"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>' +
      "</div>"
    );
  }

  function initResultListReveal() {
    const $items = $("[data-result-list-reveal]").not("[data-result-list-reveal-ready]");

    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-result-list-reveal-ready", "true");
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        $(entry.target).addClass("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    });

    $items.each(function (index) {
      this.style.setProperty("--reveal-delay", Math.min(index * 45, 240) + "ms");
      $(this).attr("data-result-list-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function renderHistory() {
    renderRows();
    renderPagination();
  }

  function renderSummary() {
    renderPageTitle();
    renderMetrics();
    renderSpotlight();
  }

  function loadSummaryData() {
    const pageSize = 100;

    return Lms.apiClient.get("api/results/my?page=1&pageSize=" + pageSize).done(function (response) {
      const firstPage = getPagedData(response);
      const totalPages = Math.max(1, Math.ceil(firstPage.total / pageSize));
      const requests = [];

      for (let page = 2; page <= totalPages; page += 1) {
        requests.push(Lms.apiClient.get("api/results/my?page=" + page + "&pageSize=" + pageSize));
      }

      function finishSummary(extraResponses) {
        const allItems = firstPage.items.slice();
        extraResponses.forEach(function (extraResponse) {
          allItems.push.apply(allItems, getItems(extraResponse));
        });

        state.summaryResults = allItems.map(normalizeResult).sort(function (a, b) {
          return new Date(b.submittedAt) - new Date(a.submittedAt);
        });
        renderSummary();
      }

      if (!requests.length) {
        finishSummary([]);
        return;
      }

      $.when.apply($, requests).done(function () {
        const responses = requests.length === 1
          ? [arguments[0]]
          : Array.prototype.slice.call(arguments);
        finishSummary(responses);
      });
    }).fail(function () {
      state.summaryResults = [];
      renderSummary();
    });
  }

  function loadHistoryData() {
    $("#studentResultRows").html(
      '<tr><td colspan="6"><span class="app-skeleton" style="height: 24px;"></span><span class="app-skeleton u-mt-4"></span></td></tr>'
    );
    $("[data-result-pagination]").empty();

    return Lms.apiClient.get(buildHistoryUrl()).done(function (response) {
      const data = getPagedData(response);
      state.results = data.items.map(normalizeResult);
      state.total = data.total;
      state.page = data.page;
      state.pageSize = data.pageSize;
      state.totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));

      if (state.page > state.totalPages) {
        state.page = state.totalPages;
        loadHistoryData();
        return;
      }

      renderHistory();
    }).fail(function (error) {
      state.results = [];
      state.total = 0;
      state.totalPages = 1;
      renderHistory();
      showToast(
        "error",
        t("results.listPage.toastLoadErrorTitle", null, "Không tải được kết quả"),
        error && error.message
          ? error.message
          : t("results.listPage.toastLoadErrorMessage", null, "Không thể tải lịch sử kết quả từ hệ thống.")
      );
    });
  }

  function resetAndLoadHistory() {
    state.page = 1;
    loadHistoryData();
  }

  function bindEvents() {
    $("[data-result-filter='search']").on("input", function () {
      state.search = $(this).val();
      window.clearTimeout(state.searchTimer);
      state.searchTimer = window.setTimeout(resetAndLoadHistory, 220);
    });

    $("[data-result-filter='status']").on("change", function () {
      state.status = $(this).val();
      resetAndLoadHistory();
    });

    $("[data-result-filter='page-size']").on("change", function () {
      const pageSize = Number($(this).val());
      state.pageSize = [5, 10, 20].includes(pageSize) ? pageSize : 5;
      resetAndLoadHistory();
    });

    $("[data-result-action='clear-filters']").on("click", function () {
      state.search = "";
      state.status = "";
      state.pageSize = 5;
      $("[data-result-filter='search']").val("");
      $("[data-result-filter='status']").val("");
      $("[data-result-filter='page-size']").val("5");
      resetAndLoadHistory();
    });

    $(document).on("click", "[data-result-page]", function () {
      const page = Number($(this).attr("data-result-page"));
      if (!page || page < 1 || page > state.totalPages || page === state.page) {
        return;
      }

      state.page = page;
      loadHistoryData();
    });

    $(document).on("lms:i18n:changed", function () {
      renderSummary();
      renderHistory();
    });
  }

  function init() {
    bindEvents();
    initResultListReveal();
    renderPageTitle();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(function () {
        loadSummaryData();
        loadHistoryData();
      });
      return;
    }

    loadSummaryData();
    loadHistoryData();
  }

  $(init);
})(window, jQuery);
