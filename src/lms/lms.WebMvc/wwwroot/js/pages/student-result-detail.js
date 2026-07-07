(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    resultId: "",
    result: null,
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
    if (!value) {
      return "--";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleString();
  }

  function formatScore(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "--";
    }

    return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, "");
  }

  function formatPercent(value) {
    const score = formatScore(value);
    return score === "--" ? score : score + "%";
  }

  function formatDuration(minutes) {
    const value = Number(minutes);
    if (!Number.isFinite(value) || value <= 0) {
      return "--";
    }

    return t("results.detailPage.durationValue", { minutes: value }, value + " phut");
  }

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type: type, title: title, message: message });
    }
  }

  function normalizeReviewVisibility(visibility, reviewMode) {
    const rawVisibility = String(visibility || "").replace(/[-_\s]/g, "").toLowerCase();
    const rawMode = String(reviewMode || "").replace(/[-_\s]/g, "").toLowerCase();
    const map = {
      none: "None",
      noreview: "None",
      resultonly: "ResultOnly",
      answersonly: "AnswersOnly",
      answeronly: "AnswersOnly",
      fullreview: "FullReview"
    };

    return map[rawVisibility] || map[rawMode] || "ResultOnly";
  }

  function getReviewVisibilityLabel(visibility) {
    const labels = {
      None: t("results.detailPage.reviewNo", null, "Khong cho xem lai"),
      ResultOnly: t("results.detailPage.reviewResultOnly", null, "Chi xem ket qua"),
      AnswersOnly: t("results.detailPage.reviewAnswerOnly", null, "Chi xem dap an"),
      FullReview: t("results.detailPage.reviewFull", null, "Xem toan bo")
    };

    return labels[visibility] || labels.ResultOnly;
  }

  function getReviewCopy(visibility) {
    const copy = {
      None: t("results.detailPage.copyNoReview", null, "Theo chinh sach bai thi, ban khong duoc phep xem lai noi dung sau khi nop."),
      ResultOnly: t("results.detailPage.copyResultOnly", null, "Ban chi duoc xem diem so, trang thai va thong ke tong quan cua luot thi."),
      AnswersOnly: t("results.detailPage.copyAnswerOnly", null, "Ban co the xem cau hoi, dap an da chon va dap an dung. Giai thich chi hien thi khi chinh sach cho phep."),
      FullReview: t("results.detailPage.copyFull", null, "Ban co the xem toan bo cau hoi, dap an, giai thich va tai lieu tham khao neu co.")
    };

    return copy[visibility] || copy.ResultOnly;
  }

  function getResultStats() {
    const details = state.result && Array.isArray(state.result.details) ? state.result.details : [];
    const totalFromDetails = details.length;
    const totalFromQuestions = state.questions.length;
    const total = Math.max(totalFromDetails, totalFromQuestions);
    const correct = Number(state.result && state.result.correctCount != null
      ? state.result.correctCount
      : (totalFromQuestions
        ? state.questions.filter(function (question) { return Boolean(question.isCorrect); }).length
        : details.filter(function (detail) { return Boolean(detail.isCorrect); }).length));
    const wrong = Number(state.result && state.result.wrongCount != null
      ? state.result.wrongCount
      : Math.max(0, total - correct));

    return {
      total: total,
      correct: Number.isFinite(correct) ? correct : 0,
      wrong: Number.isFinite(wrong) ? wrong : 0
    };
  }

  function renderNotFound(message) {
    const fallbackMessage = message || t("results.detailPage.notFoundDesc", null, "Quay lai danh sach ket qua va chon ket qua khac.");
    $("[data-result-detail-title]").text(t("results.detailPage.notFoundTitle", null, "Khong tim thay ket qua"));
    $("[data-result-detail-subtitle]").text(fallbackMessage);
    $("#resultReviewContent").html(
      '<div class="student-result-review-state is-visible" data-result-detail-reveal>' +
        '<span class="student-result-review-state-icon"><i class="bi bi-search" aria-hidden="true"></i></span>' +
        "<h3>" + escapeHtml(t("results.detailPage.notFoundTitle", null, "Khong tim thay ket qua")) + "</h3>" +
        "<p>" + escapeHtml(fallbackMessage) + "</p>" +
      "</div>"
    );
  }

  function renderSummary() {
    const stats = getResultStats();
    const visibility = normalizeReviewVisibility(
      (state.review && state.review.reviewVisibility) || state.result.reviewVisibility,
      (state.review && state.review.reviewMode) || state.result.reviewMode
    );
    const passed = Boolean(state.result.passed);
    const score = Math.max(0, Math.min(100, Number(state.result.score || 0)));
    const resultClass = passed ? "is-passed" : "is-failed";
    const statusText = passed
      ? t("results.detailPage.passed", null, "Dat")
      : t("results.detailPage.failed", null, "Khong dat");
    const summaryTitle = passed
      ? t("results.detailPage.summaryPassedTitle", null, "Ban da vuot qua bai thi.")
      : t("results.detailPage.summaryFailedTitle", null, "Ban chua vuot qua bai thi.");
    const reviewLabel = getReviewVisibilityLabel(visibility);

    $(".student-result-summary-card")
      .removeClass("is-passed is-failed")
      .addClass(resultClass);
    $(".student-result-report-page")
      .removeClass("is-passed is-failed")
      .addClass(resultClass);

    $("[data-result-detail-title]").text(state.result.examName);
    $("[data-result-detail-subtitle]").text(
      t("results.detailPage.submittedAtText", { date: formatDate(state.result.submittedAt) }, "Da nop luc " + formatDate(state.result.submittedAt))
    );
    $("[data-result-score-ring]").css("--score", score + "%");
    $("[data-result-detail-metric='scoreHero']").text(formatPercent(state.result.score));
    $("[data-result-detail-metric='score']").text(formatPercent(state.result.score));
    $("[data-result-detail-metric='correct']").text(stats.total ? stats.correct + "/" + stats.total : "--");
    $("[data-result-detail-metric='wrong']").text(stats.total ? String(stats.wrong) : "--");
    $("[data-result-detail-metric='duration']").text(formatDuration(state.result.durationMinutes));
    $("[data-result-detail-status]").text(statusText);
    $("[data-result-summary-title]").text(summaryTitle);
    $("[data-result-summary-copy]").text(passed
      ? t("results.detailPage.summaryPassedCopy", null, "Ket qua cua ban dat nguong yeu cau. Ban co the xem lai noi dung theo chinh sach bai thi.")
      : t("results.detailPage.summaryFailedCopy", null, "Hay on tap lai de cai thien ket qua trong lan thi tiep theo."));

    $("[data-result-detail-info='statusText']").text(statusText);
    $("[data-result-detail-info='passScore']").text(state.result.passScore != null ? formatScore(state.result.passScore) + "/100" : "--");
    $("[data-result-detail-info='duration']").text(formatDuration(state.result.durationMinutes));
    $("[data-result-detail-info='submittedAt']").text(formatDate(state.result.submittedAt));
    $("[data-result-detail-info='reviewPolicy']").text(reviewLabel);
    $("[data-result-detail-info='studentName']").text(state.result.studentName || t("common.student", null, "Hoc vien"));
    $("[data-result-review-copy]").text(getReviewCopy(visibility));
    $("[data-result-review-count]").text(stats.total
      ? t("results.detailPage.reviewQuestionsCount", { count: stats.total }, stats.total + " cau hoi")
      : t("results.detailPage.reviewQuestionsEmpty", null, "Khong hien thi cau hoi"));
  }

  function renderStateCard(options) {
    const action = options.action
      ? '<a class="student-result-review-action" href="' + escapeHtml(options.action.href) + '">' + escapeHtml(options.action.label) + "</a>"
      : '<button class="student-result-review-action" type="button" disabled>' + escapeHtml(options.disabledLabel || t("results.detailPage.contactSupport", null, "Lien he ho tro")) + "</button>";

    $("#resultReviewContent").html(
      '<div class="student-result-review-state student-result-detail-reveal is-visible" data-result-detail-reveal>' +
        '<span class="student-result-review-state-icon ' + escapeHtml(options.iconClass || "") + '"><i class="bi ' + escapeHtml(options.icon) + '" aria-hidden="true"></i></span>' +
        "<h3>" + escapeHtml(options.title) + "</h3>" +
        "<p>" + escapeHtml(options.description) + "</p>" +
        (options.listHtml || "") +
        action +
      "</div>"
    );
  }

  function renderLockedReview() {
    renderStateCard({
      icon: "bi-lock",
      iconClass: "is-locked",
      title: t("results.detailPage.noReviewTitle", null, "Khong the xem lai"),
      description: t("results.detailPage.noReviewDesc", null, "Theo chinh sach cua bai thi, ban khong duoc phep xem lai noi dung sau khi nop."),
      disabledLabel: t("results.detailPage.contactSupport", null, "Lien he ho tro")
    });
  }

  function renderResultOnlyReview() {
    renderStateCard({
      icon: "bi-eye",
      title: t("results.detailPage.resultOnlyTitle", null, "Chi xem ket qua"),
      description: t("results.detailPage.resultOnlyDesc", null, "Chinh sach hien tai chi cho phep xem diem so, trang thai va thong ke tong quan."),
      listHtml:
        '<div class="student-result-review-rules">' +
          '<div><strong>' + escapeHtml(t("results.detailPage.resultOnlyAllowed", null, "Duoc xem")) + '</strong><span>' + escapeHtml(t("results.detailPage.resultOnlyAllowedItems", null, "Diem so, trang thai, thong ke")) + '</span></div>' +
          '<div><strong>' + escapeHtml(t("results.detailPage.resultOnlyBlocked", null, "Khong duoc xem")) + '</strong><span>' + escapeHtml(t("results.detailPage.resultOnlyBlockedItems", null, "Cau hoi, dap an da chon, dap an dung")) + '</span></div>' +
        "</div>",
      action: {
        href: "/Results",
        label: t("results.detailPage.backToResults", null, "Quay lai ket qua")
      }
    });
  }

  function getQuestionStatus(question) {
    return Boolean(question.isCorrect)
      ? { className: "is-correct", label: t("results.detailPage.badgeCorrectState", null, "Dung") }
      : { className: "is-wrong", label: t("results.detailPage.badgeWrongState", null, "Sai") };
  }

  function getOptionClass(answer) {
    const classes = ["student-result-answer-option"];
    const selected = Boolean(answer.wasSelected);
    const correct = Boolean(answer.isCorrect);

    if (correct) {
      classes.push("is-correct");
    }

    if (selected) {
      classes.push("is-selected");
    }

    if (selected && !correct) {
      classes.push("is-wrong");
    }

    return classes.join(" ");
  }

  function renderAnswer(answer) {
    const flags = [];
    const selected = Boolean(answer.wasSelected);
    const correct = Boolean(answer.isCorrect);

    if (selected) {
      flags.push('<span class="student-result-answer-badge is-selected">' + escapeHtml(t("results.detailPage.badgeSelected", null, "Da chon")) + "</span>");
    }

    if (correct) {
      flags.push('<span class="student-result-answer-badge is-correct">' + escapeHtml(t("results.detailPage.badgeCorrect", null, "Dap an dung")) + "</span>");
    }

    if (selected && !correct) {
      flags.push('<span class="student-result-answer-badge is-wrong">' + escapeHtml(t("results.detailPage.badgeWrongState", null, "Sai")) + "</span>");
    }

    return (
      '<li class="' + getOptionClass(answer) + '">' +
        '<span class="student-result-answer-icon" aria-hidden="true">' +
          (correct ? '<i class="bi bi-check"></i>' : (selected ? '<i class="bi bi-x"></i>' : "")) +
        "</span>" +
        '<span class="student-result-answer-text">' + escapeHtml(answer.content) + "</span>" +
        '<span class="student-result-answer-flags">' + flags.join("") + "</span>" +
      "</li>"
    );
  }

  function renderQuestionFooter(question, visibility) {
    if (visibility !== "FullReview") {
      return "";
    }

    const explanation = question.explanation || question.reference || question.attachmentUrl || question.mediaUrl;
    if (!explanation) {
      return "";
    }

    const blocks = [];
    if (question.explanation) {
      blocks.push('<div><strong>' + escapeHtml(t("results.detailPage.explanation", null, "Giai thich")) + '</strong><p>' + escapeHtml(question.explanation) + "</p></div>");
    }
    if (question.reference) {
      blocks.push('<div><strong>' + escapeHtml(t("results.detailPage.reference", null, "Tham khao")) + '</strong><p>' + escapeHtml(question.reference) + "</p></div>");
    }
    if (question.attachmentUrl) {
      blocks.push('<a href="' + escapeHtml(question.attachmentUrl) + '" target="_blank" rel="noopener">' + escapeHtml(t("results.detailPage.attachment", null, "Tai lieu dinh kem")) + "</a>");
    }
    if (question.mediaUrl) {
      blocks.push('<a href="' + escapeHtml(question.mediaUrl) + '" target="_blank" rel="noopener">' + escapeHtml(t("results.detailPage.media", null, "Media")) + "</a>");
    }

    return '<footer class="student-result-question-footer">' + blocks.join("") + "</footer>";
  }

  function renderQuestionReview(visibility) {
    if (!state.questions.length) {
      renderResultOnlyReview();
      return;
    }

    const html = state.questions.map(function (question, index) {
      const status = getQuestionStatus(question);
      const options = Array.isArray(question.options)
        ? question.options.map(renderAnswer).join("")
        : "";

      return (
        '<article class="student-result-question-review student-result-detail-reveal ' + status.className + '" data-result-detail-reveal>' +
          '<header class="student-result-question-head">' +
            "<div>" +
              '<span class="student-result-question-number">' + escapeHtml(t("results.detailPage.questionHeading", { index: index + 1 }, "Cau hoi " + (index + 1))) + "</span>" +
              '<h3>' + escapeHtml(question.content || "--") + "</h3>" +
            "</div>" +
            '<div class="student-result-question-meta">' +
              '<span>' + escapeHtml(question.questionType || t("results.detailPage.questionTypeDefault", null, "Cau hoi")) + "</span>" +
              '<span>' + escapeHtml(formatScore(question.scoreEarned)) + "/" + escapeHtml(formatScore(question.maxScore)) + " " + escapeHtml(t("results.detailPage.points", null, "diem")) + "</span>" +
              '<strong class="' + status.className + '">' + escapeHtml(status.label) + "</strong>" +
            "</div>" +
          "</header>" +
          '<ul class="student-result-answer-list">' + options + "</ul>" +
          renderQuestionFooter(question, visibility) +
        "</article>"
      );
    }).join("");

    $("#resultReviewContent").html('<div class="student-result-review-list">' + html + "</div>");
    initResultDetailReveal();
  }

  function renderReview() {
    const visibility = normalizeReviewVisibility(
      (state.review && state.review.reviewVisibility) || state.result.reviewVisibility,
      (state.review && state.review.reviewMode) || state.result.reviewMode
    );

    switch (visibility) {
      case "None":
        renderLockedReview();
        break;
      case "ResultOnly":
        renderResultOnlyReview();
        break;
      case "AnswersOnly":
      case "FullReview":
        renderQuestionReview(visibility);
        break;
      default:
        renderResultOnlyReview();
        break;
    }
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
      this.style.setProperty("--reveal-delay", Math.min(index * 80, 420) + "ms");
      $(this).attr("data-result-detail-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function normalizeResult(result) {
    const details = Array.isArray(result.details) ? result.details : [];

    return {
      id: result.id,
      attemptId: result.attemptId,
      examId: result.examId,
      examName: result.examName || t("common.exam", null, "Bai thi"),
      studentId: result.userId,
      studentName: result.userName || t("common.student", null, "Hoc vien"),
      score: Number(result.score || 0),
      passed: Boolean(result.passed),
      submittedAt: result.completedDate,
      passScore: result.passScore,
      durationMinutes: result.durationMinutes,
      attemptStatus: result.attemptStatus,
      reviewMode: result.reviewMode,
      reviewVisibility: result.reviewVisibility,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      details: details
    };
  }

  function loadReviewData() {
    Lms.apiClient.get("api/results/" + encodeURIComponent(state.resultId) + "/review").done(function (reviewResponse) {
      state.review = getData(reviewResponse) || {};
      state.questions = Array.isArray(state.review.questions) ? state.review.questions : [];
      render();
    }).fail(function () {
      state.review = {
        reviewMode: state.result.reviewMode,
        reviewVisibility: state.result.reviewVisibility || normalizeReviewVisibility(null, state.result.reviewMode),
        questions: []
      };
      state.questions = [];
      render();
    });
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

      state.result = normalizeResult(result);
      loadReviewData();
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

  $(init);
})(window, jQuery);
