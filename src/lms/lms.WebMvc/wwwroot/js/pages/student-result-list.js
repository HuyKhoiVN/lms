(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
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

  function renderPageTitle() {
    document.title = t("results.listPage.title", null, "Kết quả học tập") + " - " + t("common.appName", null, "lms");
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
    $("[data-result-metric='latestExam']").text(latest ? latest.examName : "--");
  }

  function renderSpotlight() {
    const $container = $("#studentResultSpotlight").empty();
    const latest = state.results.slice().sort(function (a, b) {
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

    $("[data-result-count]").text(t("results.listPage.records", { count: state.filteredResults.length }, state.filteredResults.length + " ban ghi"));

    if (!state.filteredResults.length) {
      $rows.html(emptyMarkup());
      initResultListReveal();
      return;
    }

    state.filteredResults.forEach(function (result) {
      const durationText = result.durationMinutes
        ? result.durationMinutes + " phut"
        : "--";

      const $row = $(
        '<tr class="student-result-row student-result-reveal ' + (result.passed ? "is-passed" : "is-failed") + '" data-result-list-reveal>' +
          '<td data-result-label="Bai thi">' +
            '<div class="student-result-exam-cell">' +
              '<span class="student-result-avatar" aria-hidden="true"><i class="bi ' + (result.passed ? "bi-check2-circle" : "bi-x-circle") + '"></i></span>' +
              "<span>" +
                "<strong>" + escapeHtml(result.examName) + "</strong>" +
                "<small>" + escapeHtml(result.studentName) + "</small>" +
              "</span>" +
            "</div>" +
          "</td>" +
          '<td data-result-label="Trang thai">' +
            '<span class="' + getBadgeClass(result.passed) + '">' + escapeHtml(result.passed ? t("results.listPage.passed", null, "Đạt") : t("results.listPage.failed", null, "Không đạt")) + "</span>" +
          "</td>" +
          '<td data-result-label="Diem so"><strong class="student-result-score">' + escapeHtml(result.score) + "/100</strong></td>" +
          '<td data-result-label="Thoi gian lam bai">' + escapeHtml(durationText) + "</td>" +
          '<td data-result-label="Ngay thi">' + escapeHtml(formatDate(result.submittedAt)) + "</td>" +
          '<td data-result-label="Thao tac">' +
            '<a class="app-button app-button-secondary results-detail-button" href="/Results/Detail/' + encodeURIComponent(result.id) + '">' + escapeHtml(t("results.listPage.buttonDetail", null, "Chi tiết")) + "</a>" +
            '<i class="bi bi-chevron-right results-row-chevron" aria-hidden="true"></i>' +
          "</td>" +
        "</tr>"
      );

      $rows.append($row);
    });

    initResultListReveal();
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

  function render() {
    renderPageTitle();
    renderMetrics();
    renderSpotlight();
    renderRows();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredResults = state.results.filter(function (result) {
      const matchesKeyword = !keyword || String(result.examName).toLowerCase().includes(keyword);
      const matchesStatus = !state.status
        || (state.status === "passed" && result.passed)
        || (state.status === "failed" && !result.passed);

      return matchesKeyword && matchesStatus;
    });

    renderRows();
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

    $(document).on("lms:i18n:changed", render);
  }

  function init() {
    bindEvents();
    initResultListReveal();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    Lms.apiClient.get("api/results/my?page=1&pageSize=200").done(function (response) {
      state.results = getItems(response).map(normalizeResult).sort(function (a, b) {
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      });
      state.filteredResults = state.results.slice();
      render();
    }).fail(function (error) {
      state.results = [];
      state.filteredResults = [];
      render();
      showToast(
        "error",
        t("results.listPage.toastLoadErrorTitle", null, "Không tải được kết quả"),
        error && error.message
          ? error.message
          : t("results.listPage.toastLoadErrorMessage", null, "Không thể tải lịch sử kết quả từ hệ thống.")
      );
    });
  }

  $(init);
})(window, jQuery);
