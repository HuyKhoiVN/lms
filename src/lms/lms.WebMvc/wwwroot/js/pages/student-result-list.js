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

  function getBadgeClass(passed) {
    return passed ? "lms-status-success" : "lms-status-danger";
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
      examName: item.examName || t("common.exam", null, "Bai thi"),
      studentId: item.userId,
      studentName: item.userName || t("common.student", null, "Hoc vien"),
      score: Number(item.score || 0),
      passed: Boolean(item.passed),
      submittedAt: item.completedDate,
      durationMinutes: item.durationMinutes || null
    };
  }

  function renderPageTitle() {
    document.title = t("results.listPage.title", null, "Ket qua hoc tap") + " - " + t("common.appName", null, "lms");
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

  function renderSpotlight() {
    const $container = $("#studentResultSpotlight").empty();
    const latest = state.results.slice().sort(function (a, b) {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    })[0];

    if (!latest) {
      $container.html(
        '<div class="lms-empty-compact">' +
          '<i class="bi bi-clipboard2-data" aria-hidden="true"></i>' +
          "<h3>Chua co ket qua</h3>" +
          "<p>Hoan thanh bai thi dau tien de xem tom tat ket qua tai day.</p>" +
        "</div>"
      );
      return;
    }

    $container.html(
      '<div class="student-result-spotlight-card">' +
        '<span class="' + getBadgeClass(latest.passed) + '">' + escapeHtml(latest.passed ? t("results.listPage.passed", null, "Dat") : t("results.listPage.failed", null, "Khong dat")) + "</span>" +
        "<h3>" + escapeHtml(latest.examName) + "</h3>" +
        "<p>" + escapeHtml(formatDate(latest.submittedAt)) + "</p>" +
        '<div class="student-result-spotlight-score">' +
          "<strong>" + escapeHtml(latest.score) + "/100</strong>" +
          "<span>" + escapeHtml(
            latest.durationMinutes
              ? t("results.listPage.durationValue", { minutes: latest.durationMinutes }, latest.durationMinutes + " phut")
              : t("results.listPage.durationUnavailable", null, "Khong co thoi gian lam bai")
          ) + "</span>" +
        "</div>" +
        '<a class="app-button app-button-primary" href="/Results/Detail/' + encodeURIComponent(latest.id) + '">' + escapeHtml(t("results.listPage.buttonDetail", null, "Chi tiet")) + "</a>" +
      "</div>"
    );
  }

  function emptyMarkup() {
    return (
      '<div class="lms-empty-compact student-result-reveal is-visible" data-result-list-reveal>' +
        '<i class="bi bi-search" aria-hidden="true"></i>' +
        "<h3>" + escapeHtml(t("results.listPage.noResultsTitle", null, "Khong tim thay ket qua")) + "</h3>" +
        "<p>" + escapeHtml(t("results.listPage.noResultsCopy", null, "Thu ten bai thi hoac trang thai khac de xem ket qua phu hop hon.")) + "</p>" +
      "</div>"
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
        '<article class="student-result-row student-result-reveal ' + (result.passed ? "is-passed" : "is-failed") + '" data-result-list-reveal>' +
          '<div class="student-result-row-main">' +
            '<div class="student-result-row-head">' +
              '<span class="student-result-avatar" aria-hidden="true"><i class="bi ' + (result.passed ? "bi-check2-circle" : "bi-x-circle") + '"></i></span>' +
              "<div>" +
                "<h3>" + escapeHtml(result.examName) + "</h3>" +
                "<p>" + escapeHtml(result.studentName) + "</p>" +
              "</div>" +
            "</div>" +
            '<div class="student-result-row-meta">' +
              '<span class="' + getBadgeClass(result.passed) + '">' + escapeHtml(result.passed ? t("results.listPage.passed", null, "Dat") : t("results.listPage.failed", null, "Khong dat")) + "</span>" +
              "<span>" + escapeHtml(formatDate(result.submittedAt)) + "</span>" +
            "</div>" +
          "</div>" +
          '<div class="student-result-row-stat">' +
            "<span>Diem so</span>" +
            "<strong>" + escapeHtml(result.score) + "/100</strong>" +
          "</div>" +
          '<div class="student-result-row-stat">' +
            "<span>Thoi gian lam bai</span>" +
            "<strong>" + escapeHtml(durationText) + "</strong>" +
          "</div>" +
          '<div class="student-result-row-action">' +
            '<a class="app-button app-button-secondary" href="/Results/Detail/' + encodeURIComponent(result.id) + '">' + escapeHtml(t("results.listPage.buttonDetail", null, "Chi tiet")) + "</a>" +
          "</div>" +
        "</article>"
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
        t("results.listPage.toastLoadErrorTitle", null, "Khong tai duoc ket qua"),
        error && error.message
          ? error.message
          : t("results.listPage.toastLoadErrorMessage", null, "Khong the tai lich su ket qua tu he thong.")
      );
    });
  }

  $(init);
})(window, jQuery);
