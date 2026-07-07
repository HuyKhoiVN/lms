(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    exams: [],
    results: [],
    filteredExams: [],
    tab: "",
    sort: "default",
    page: 1,
    pageSize: 4
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

  function normalizeReviewMode(reviewMode) {
    const map = {
      FULL_REVIEW: "FullReview",
      RESULT_ONLY: "ResultOnly",
      ANSWER_ONLY: "AnswerOnly",
      NO_REVIEW: "NoReview"
    };

    return map[reviewMode] || reviewMode || "ResultOnly";
  }

  function getReviewLabel(reviewMode) {
    const labels = {
      FullReview: t("exams.studentListPage.reviewFull", null, "Xem toàn bộ"),
      ResultOnly: t("exams.studentListPage.reviewResultOnly", null, "Chỉ xem kết quả"),
      AnswerOnly: t("exams.studentListPage.reviewAnswerOnly", null, "Chỉ xem đáp án"),
      NoReview: t("exams.studentListPage.reviewNo", null, "Không cho xem lại")
    };

    return labels[normalizeReviewMode(reviewMode)] || reviewMode || labels.ResultOnly;
  }

  function normalizeResult(item) {
    return {
      id: item.id,
      attemptId: item.attemptId,
      examId: Number(item.examId || 0),
      examName: item.examName || t("common.exam", null, "Bài thi"),
      score: Number(item.score || 0),
      passed: Boolean(item.passed),
      completedDate: item.completedDate
    };
  }

  function normalizeExam(item) {
    return {
      id: Number(item.id),
      name: item.name || t("common.exam", null, "Bài thi"),
      durationMinutes: Number(item.durationMinutes || 0),
      passScore: Number(item.passScore || 0),
      questionCount: Number(item.questionCount || 0),
      reviewMode: normalizeReviewMode(item.reviewMode),
      isPublished: Boolean(item.isPublished),
      latestResult: null
    };
  }

  function attachResults(exams, results) {
    const latestByExam = {};

    results.forEach(function (result) {
      const current = latestByExam[result.examId];
      if (!current || new Date(result.completedDate) > new Date(current.completedDate)) {
        latestByExam[result.examId] = result;
      }
    });

    return exams.map(function (exam) {
      exam.latestResult = latestByExam[exam.id] || null;
      return exam;
    });
  }

  function getExamState(exam) {
    if (exam.latestResult) {
      return "completed";
    }
    if (exam.isPublished) {
      return "open";
    }
    return "locked";
  }

  function getStatusLabel(exam) {
    const examState = getExamState(exam);
    if (examState === "completed") {
      return "Đã hoàn thành";
    }
    if (examState === "open") {
      return t("exams.studentListPage.statusPublished", null, "Đang mở");
    }
    return "Chưa mở";
  }

  function getExamIcon() {
    return { tone: "common", icon: "bi-clipboard-check" };
  }

  function getAction(exam) {
    const examState = getExamState(exam);
    if (examState === "completed" && exam.latestResult) {
      return {
        href: "/Results/Detail/" + exam.latestResult.id,
        label: "Xem kết quả",
        disabled: false,
        icon: "bi-clipboard-data"
      };
    }
    if (exam.isPublished) {
      return {
        href: "/Exams/Start/" + exam.id,
        label: t("exams.studentListPage.buttonStart", null, "Bắt đầu"),
        disabled: false,
        icon: "bi-play-circle"
      };
    }
    return {
      href: "#",
      label: "Chưa mở",
      disabled: true,
      icon: "bi-lock"
    };
  }

  function getPagedExams() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredExams.slice(start, start + state.pageSize);
  }

  function applyFilters() {
    let exams = state.exams.slice();

    if (state.tab) {
      exams = exams.filter(function (exam) {
        return getExamState(exam) === state.tab;
      });
    }

    if (state.sort === "name-asc") {
      exams.sort(function (a, b) {
        return a.name.localeCompare(b.name, "vi");
      });
    }

    if (state.sort === "duration-asc") {
      exams.sort(function (a, b) {
        return a.durationMinutes - b.durationMinutes;
      });
    }

    state.filteredExams = exams;
    const totalPages = Math.max(1, Math.ceil(state.filteredExams.length / state.pageSize));
    if (state.page > totalPages) {
      state.page = totalPages;
    }
  }

  function renderMetrics() {
    const total = state.exams.length;
    const open = state.exams.filter(function (exam) { return exam.isPublished; }).length;
    const completedExamIds = {};

    state.results.forEach(function (result) {
      if (result.examId) {
        completedExamIds[result.examId] = true;
      }
    });

    const completed = Object.keys(completedExamIds).length;
    const average = state.results.length
      ? Math.round(state.results.reduce(function (sum, result) {
        return sum + Number(result.score || 0);
      }, 0) / state.results.length)
      : 0;

    $("[data-student-exam-metric='total']").text(total);
    $("[data-student-exam-metric='open']").text(open);
    $("[data-student-exam-metric='completed']").text(completed);
    $("[data-student-exam-metric='average']").text(state.results.length ? average + "%" : "--");
  }

  function renderPagination() {
    const total = state.filteredExams.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const from = total ? ((state.page - 1) * state.pageSize) + 1 : 0;
    const to = total ? Math.min(total, state.page * state.pageSize) : 0;

    $("[data-student-exam-page-summary]").text(
      total
        ? "Hiển thị " + from + "-" + to + " trong " + total + " bài thi"
        : "Hiển thị 0 bài thi"
    );
    $("[data-student-exam-page-indicator]").text(state.page + " / " + totalPages);
    $("[data-student-exam-page='prev']").prop("disabled", state.page <= 1);
    $("[data-student-exam-page='next']").prop("disabled", state.page >= totalPages);
  }

  function renderHeroAction() {
    const latestAssignedExam = state.exams[0];
    const $link = $("[data-student-exam-primary-link]");

    if (!latestAssignedExam || !latestAssignedExam.isPublished) {
      $link.addClass("is-disabled").attr("aria-disabled", "true").attr("href", "#");
      return;
    }

    $link
      .removeClass("is-disabled")
      .attr("aria-disabled", null)
      .attr("href", "/Exams/Start/" + latestAssignedExam.id);
  }

  function renderEmptyState() {
    return (
      '<div class="lms-empty-compact student-exam-empty student-exam-list-reveal is-visible" data-exam-list-reveal>' +
        '<i class="bi bi-journal-x" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("exams.studentListPage.noExamsTitle", null, "Hiện chưa có bài thi được giao.")) + "</h3>" +
        '<p>' + escapeHtml(t("exams.studentListPage.noExamsCopy", null, "Các bài thi được giao sẽ xuất hiện ở đây.")) + "</p>" +
      "</div>"
    );
  }

  function renderExamRow(exam) {
    const examState = getExamState(exam);
    const visual = getExamIcon();
    const action = getAction(exam);
    const actionMarkup = action.disabled
      ? '<button class="student-exam-action" type="button" disabled><i class="bi ' + action.icon + '" aria-hidden="true"></i><span>' + escapeHtml(action.label) + "</span></button>"
      : '<a class="student-exam-action" href="' + action.href + '"><i class="bi ' + action.icon + '" aria-hidden="true"></i><span>' + escapeHtml(action.label) + "</span></a>";

    return (
      '<article class="student-exam-row student-exam-list-reveal" data-exam-list-reveal>' +
        '<span class="student-exam-icon student-exam-icon-' + visual.tone + '" aria-hidden="true"><i class="bi ' + visual.icon + '"></i></span>' +
        '<div class="student-exam-row-main">' +
          '<span class="student-exam-code">' + escapeHtml((exam.name || "BT").trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join("")) + "</span>" +
          "<h3>" + escapeHtml(exam.name) + "</h3>" +
          "<p>" + escapeHtml(getReviewLabel(exam.reviewMode)) + "</p>" +
          '<div class="student-exam-meta">' +
            '<span><i class="bi bi-clock" aria-hidden="true"></i>' + escapeHtml(exam.durationMinutes + " phút") + "</span>" +
            '<span><i class="bi bi-question-circle" aria-hidden="true"></i>' + escapeHtml(exam.questionCount + " câu hỏi") + "</span>" +
            '<span><i class="bi bi-bullseye" aria-hidden="true"></i>' + escapeHtml("Điểm đạt " + exam.passScore) + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="student-exam-row-action">' +
          '<span class="student-exam-status student-exam-status-' + examState + '">' + escapeHtml(getStatusLabel(exam)) + "</span>" +
          actionMarkup +
        "</div>" +
      "</article>"
    );
  }

  function renderExams() {
    const $grid = $("#studentExamGrid").empty();

    applyFilters();
    renderMetrics();
    renderHeroAction();
    renderPagination();

    if (!state.filteredExams.length) {
      $grid.html(renderEmptyState());
      initExamListReveal();
      return;
    }

    $grid.html(getPagedExams().map(renderExamRow).join(""));
    initExamListReveal();
  }

  function initExamListReveal() {
    const $items = $("[data-exam-list-reveal]").not("[data-exam-list-reveal-ready]");

    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-exam-list-reveal-ready", "true");
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
      this.style.setProperty("--reveal-delay", Math.min(index * 45, 220) + "ms");
      $(this).attr("data-exam-list-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function renderLoadError(error) {
    $("#studentExamGrid").html(
      '<div class="lms-empty-compact student-exam-empty student-exam-list-reveal is-visible" data-exam-list-reveal>' +
        '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("exams.studentListPage.loadErrorTitle", null, "Không thể tải bài thi")) + "</h3>" +
        '<p>' + escapeHtml(error && error.message ? error.message : t("exams.studentListPage.loadErrorCopy", null, "Vui lòng kiểm tra API exams.")) + "</p>" +
      "</div>"
    );
    initExamListReveal();
  }

  function loadResults() {
    const deferred = $.Deferred();

    Lms.apiClient.get("api/results/my?page=1&pageSize=500")
      .done(function (response) {
        deferred.resolve(getItems(response).map(normalizeResult));
      })
      .fail(function () {
        deferred.resolve([]);
      });

    return deferred.promise();
  }

  function loadPageData() {
    if (!Lms.apiClient) {
      $("#studentExamGrid").html(renderEmptyState());
      return;
    }

    Lms.apiClient.get("api/exams?page=1&pageSize=200").done(function (response) {
      const exams = getItems(response).map(normalizeExam);

      loadResults().done(function (results) {
        state.results = results;
        state.exams = attachResults(exams, results);
        state.page = 1;
        renderExams();
      });
    }).fail(renderLoadError);
  }

  function bindEvents() {
    $(document).on("click", "[data-student-exam-tab]", function (event) {
      event.preventDefault();
      state.tab = String($(this).data("student-exam-tab") || "");
      state.page = 1;
      $("[data-student-exam-tab]").removeClass("is-active").attr("aria-selected", "false");
      $(this).addClass("is-active").attr("aria-selected", "true");
      renderExams();
    });

    $(document).on("change", "[data-student-exam-filter='sort']", function () {
      state.sort = String($(this).val() || "default");
      state.page = 1;
      renderExams();
    });

    $(document).on("click", "[data-student-exam-action='clear-filters']", function () {
      state.tab = "";
      state.sort = "default";
      state.page = 1;
      $("[data-student-exam-tab]").removeClass("is-active").attr("aria-selected", "false");
      $("[data-student-exam-tab='']").addClass("is-active").attr("aria-selected", "true");
      $("[data-student-exam-filter='sort']").val("default");
      renderExams();
    });

    $(document).on("click", "[data-student-exam-page]", function () {
      const direction = String($(this).data("student-exam-page"));
      const totalPages = Math.max(1, Math.ceil(state.filteredExams.length / state.pageSize));

      if (direction === "prev" && state.page > 1) {
        state.page -= 1;
      }

      if (direction === "next" && state.page < totalPages) {
        state.page += 1;
      }

      renderExams();
    });
  }

  function init() {
    initExamListReveal();
    bindEvents();

    $(document).on("lms:i18n:changed", function () {
      renderExams();
    });

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }

    loadPageData();
  }

  $(init);
})(window, jQuery);
