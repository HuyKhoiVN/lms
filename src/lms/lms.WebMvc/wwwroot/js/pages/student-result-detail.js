(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    resultId: "",
    result: null,
    exam: null,
    review: null,
    questions: []
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    return value ? new Date(value).toLocaleString() : "--";
  }

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type: type, title: title, message: message });
    }
  }

  function normalizeReviewMode(mode) {
    const normalized = String(mode || "ResultOnly").replace(/-/g, "").toLowerCase();
    const labels = {
      fullreview: t("results.detailPage.reviewFull", null, "Xem toan bo"),
      resultonly: t("results.detailPage.reviewResultOnly", null, "Chi xem ket qua"),
      answeronly: t("results.detailPage.reviewAnswerOnly", null, "Chi xem dap an"),
      noreview: t("results.detailPage.reviewNo", null, "Khong cho xem lai")
    };
    const key = labels[normalized] ? normalized : "resultonly";

    return {
      key: key,
      label: labels[key]
    };
  }

  function getReviewStats() {
    const total = state.questions.length;
    const correct = state.questions.filter(function (question) {
      return question.isCorrect;
    }).length;

    return {
      total: total,
      correct: correct,
      wrong: Math.max(0, total - correct)
    };
  }

  function getPolicyCopy(reviewMode) {
    const copy = {
      fullreview: t("results.detailPage.copyFull", null, "Ban co the xem cau tra loi da chon va dap an dung."),
      resultonly: t("results.detailPage.copyResultOnly", null, "Chi hien thi ket qua cuoi cung doi voi bai thi nay."),
      answeronly: t("results.detailPage.copyAnswerOnly", null, "Hien thi dap an dung va lua chon da danh dau trong bai lam."),
      noreview: t("results.detailPage.copyNoReview", null, "Che do xem lai cau hoi bi khoa theo quy dinh bai thi.")
    };

    return copy[reviewMode.key] || copy.resultonly;
  }

  function renderNotFound(message) {
    const fallbackMessage = message || t("results.detailPage.notFoundDesc", null, "Quay lai danh sach ket qua va chon ket qua khac.");
    $("[data-result-detail-title]").text(t("results.detailPage.notFoundTitle", null, "Khong tim thay ket qua"));
    $("[data-result-detail-subtitle]").text(fallbackMessage);
    $("#resultReviewContent").html(
      '<div class="lms-empty-compact student-result-detail-reveal is-visible" data-result-detail-reveal>' +
        '<i class="bi bi-search" aria-hidden="true"></i>' +
        "<h3>" + escapeHtml(t("results.detailPage.notFoundTitle", null, "Khong tim thay ket qua")) + "</h3>" +
        "<p>" + escapeHtml(fallbackMessage) + "</p>" +
      "</div>"
    );
  }

  function renderSummary() {
    const stats = getReviewStats();
    const reviewMode = normalizeReviewMode((state.review && state.review.reviewMode) || (state.exam && state.exam.reviewMode));
    const passed = Boolean(state.result.passed);
    const badgeClass = passed ? "lms-status-success" : "lms-status-danger";
    const score = Math.max(0, Math.min(100, Number(state.result.score || 0)));
    const durationMinutes = state.exam && state.exam.durationMinutes ? state.exam.durationMinutes : null;
    const passScore = state.exam && state.exam.passScore != null ? state.exam.passScore : "--";

    $("[data-result-detail-title]").text(state.result.examName);
    $("[data-result-detail-subtitle]").text(
      t("results.detailPage.submittedAtText", { date: formatDate(state.result.submittedAt) }, "Da nop luc " + formatDate(state.result.submittedAt))
    );
    $("[data-result-detail-metric='score']").text(state.result.score + "%");
    $("[data-result-detail-metric='scoreHero']").text(state.result.score + "%");
    $("[data-result-score-ring]").css("--score", score + "%");
    $("[data-result-score-hero-title]").text(passed ? t("results.detailPage.passed", null, "Dat") : t("results.detailPage.failed", null, "Khong dat"));
    $("[data-result-score-hero-copy]").text(getPolicyCopy(reviewMode));
    $("[data-result-detail-metric='correct']").text(stats.correct + "/" + stats.total);
    $("[data-result-detail-metric='wrong']").text(stats.wrong);
    $("[data-result-detail-metric='duration']").text(
      durationMinutes
        ? t("results.detailPage.durationValue", { minutes: durationMinutes }, durationMinutes + " phut")
        : "--"
    );
    $("[data-result-detail-status]")
      .removeClass("lms-status-success lms-status-danger lms-status-info")
      .addClass(badgeClass)
      .text(passed ? t("results.detailPage.passed", null, "Dat") : t("results.detailPage.failed", null, "Khong dat"));
    $("[data-result-detail-info='passScore']").text(passScore + "/100");
    $("[data-result-detail-info='reviewPolicy']").text(reviewMode.label);
    $("[data-result-detail-info='submittedAt']").text(formatDate(state.result.submittedAt));
    $("[data-result-detail-info='studentName']").text(state.result.studentName || t("common.student", null, "Hoc vien"));
    $("[data-result-review-count]").text(t("results.detailPage.reviewQuestionsCount", { count: stats.total }, stats.total + " cau hoi"));
  }

  function renderLockedReview(reviewMode) {
    $("#resultReviewContent").html(
      '<div class="lms-empty-compact student-result-detail-reveal is-visible" data-result-detail-reveal>' +
        '<i class="bi bi-eye-slash" aria-hidden="true"></i>' +
        "<h3>" + escapeHtml(reviewMode.label) + "</h3>" +
        "<p>" + escapeHtml(getPolicyCopy(reviewMode)) + "</p>" +
      "</div>"
    );
  }

  function renderAnswer(answer, reviewMode) {
    const isSelected = Boolean(answer.wasSelected);
    const isCorrect = Boolean(answer.isCorrect);
    const showSelected = reviewMode.key === "fullreview" || reviewMode.key === "answeronly";
    const showCorrect = reviewMode.key === "fullreview" || reviewMode.key === "answeronly";
    const classes = [
      "student-result-answer-option",
      showSelected && isSelected ? "selected" : "",
      showCorrect && isCorrect ? "correct" : "",
      showSelected && isSelected && !isCorrect ? "wrong" : ""
    ].filter(Boolean).join(" ");
    const flags = [];

    if (showSelected && isSelected) {
      flags.push('<span class="lms-status-info">' + t("results.detailPage.badgeSelected", null, "Da chon") + "</span>");
    }

    if (showCorrect && isCorrect) {
      flags.push('<span class="lms-status-success">' + t("results.detailPage.badgeCorrect", null, "Dap an dung") + "</span>");
    }

    return (
      '<li class="' + classes + '">' +
        "<span>" + escapeHtml(answer.content) + "</span>" +
        '<span class="student-result-answer-flags">' + flags.join("") + "</span>" +
      "</li>"
    );
  }

  function renderQuestionReview(reviewMode) {
    if (!state.questions.length) {
      renderLockedReview(reviewMode);
      return;
    }

    const html = state.questions.map(function (question, index) {
      const stateBadge = '<span class="' + (question.isCorrect ? "lms-status-success" : "lms-status-danger") + '">' +
        (question.isCorrect
          ? t("results.detailPage.badgeCorrectState", null, "Dung")
          : t("results.detailPage.badgeWrongState", null, "Sai")) +
        "</span>";

      return (
        '<article class="student-result-question-review student-result-detail-reveal ' + (question.isCorrect ? "is-correct" : "is-wrong") + '" data-result-detail-reveal>' +
          '<div class="student-result-question-head">' +
            "<div>" +
              "<h3>" + t("results.detailPage.questionHeading", { index: index + 1 }, "Cau hoi " + (index + 1)) + "</h3>" +
              "<p>" + escapeHtml(question.questionType + " / " + question.maxScore + " diem / " + question.scoreEarned + " diem dat") + "</p>" +
            "</div>" +
            stateBadge +
          "</div>" +
          '<p class="student-result-question-content">' + escapeHtml(question.content) + "</p>" +
          '<ul class="student-result-answer-list">' +
            (Array.isArray(question.options) ? question.options.map(function (answer) {
              return renderAnswer(answer, reviewMode);
            }).join("") : "") +
          "</ul>" +
        "</article>"
      );
    }).join("");

    $("#resultReviewContent").html('<div class="student-result-review-list">' + html + "</div>");
    initResultDetailReveal();
  }

  function renderReview() {
    const reviewMode = normalizeReviewMode((state.review && state.review.reviewMode) || (state.exam && state.exam.reviewMode));
    $("[data-result-review-copy]").text(getPolicyCopy(reviewMode));

    if (reviewMode.key === "resultonly" || reviewMode.key === "noreview") {
      renderLockedReview(reviewMode);
      return;
    }

    renderQuestionReview(reviewMode);
  }

  function render() {
    if (!state.result) {
      renderNotFound();
      return;
    }

    renderSummary();
    renderReview();
    initResultDetailReveal();
  }

  function initResultDetailReveal() {
    const $items = $("[data-result-detail-reveal]").not("[data-result-detail-reveal-ready]");
    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-result-detail-reveal-ready", "true");
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
      this.style.setProperty("--reveal-delay", Math.min(index * 45, 260) + "ms");
      $(this).attr("data-result-detail-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function init() {
    state.resultId = String($("[data-result-detail-id]").data("result-detail-id") || "");

    $(document).on("lms:i18n:changed", render);

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      initResultDetailReveal();
      return;
    }
    initResultDetailReveal();
    loadPageData();
  }

  function loadPageData() {
    if (!state.resultId) {
      renderNotFound(t("results.detailPage.notFoundCopy", null, "Thieu ma ket qua de tai chi tiet."));
      return;
    }

    Lms.apiClient.get("api/results/" + encodeURIComponent(state.resultId)).done(function (resultResponse) {
      const result = getData(resultResponse);
      if (!result) {
        renderNotFound();
        return;
      }

      state.result = {
        id: result.id,
        attemptId: result.attemptId,
        examId: result.examId,
        examName: result.examName || t("common.exam", null, "Bai thi"),
        studentId: result.userId,
        studentName: result.userName || t("common.student", null, "Hoc vien"),
        score: Number(result.score || 0),
        passed: Boolean(result.passed),
        submittedAt: result.completedDate
      };

      $.when(
        Lms.apiClient.get("api/results/" + encodeURIComponent(state.resultId) + "/review"),
        Lms.apiClient.get("api/exams/" + encodeURIComponent(state.result.examId))
      ).done(function (reviewResponse, examResponse) {
        state.review = getData(reviewResponse);
        state.exam = getData(examResponse);
        state.questions = state.review && Array.isArray(state.review.questions) ? state.review.questions : [];
        render();
      }).fail(function () {
        state.review = {
          reviewMode: (state.exam && state.exam.reviewMode) || "ResultOnly",
          questions: []
        };
        state.questions = [];
        render();
      });
    }).fail(function (error) {
      state.result = null;
      renderNotFound(error && error.message ? error.message : null);
      showToast(
        "error",
        t("results.detailPage.toastLoadErrorTitle", null, "Khong tai duoc chi tiet ket qua"),
        error && error.message
          ? error.message
          : t("results.detailPage.toastLoadErrorMessage", null, "Khong the tai du lieu ket qua tu he thong.")
      );
    });
  }

  $(init);
})(window, jQuery);
