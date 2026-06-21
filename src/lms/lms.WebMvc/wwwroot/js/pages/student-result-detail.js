(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const localResultsKey = "lms.student.examResults";
  const state = {
    resultId: "",
    result: null,
    exam: null,
    questions: []
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

  function formatDate(value) {
    return value ? new Date(value).toLocaleString() : "--";
  }

  function normalizeReviewMode(mode) {
    const normalized = String(mode || "RESULT_ONLY").replace(/-/g, "_").toUpperCase();
    const labels = {
      FULL_REVIEW: t("results.detailPage.reviewFull", null, "Xem toàn bộ"),
      RESULT_ONLY: t("results.detailPage.reviewResultOnly", null, "Chỉ xem kết quả"),
      ANSWER_ONLY: t("results.detailPage.reviewAnswerOnly", null, "Chỉ xem đáp án"),
      NO_REVIEW: t("results.detailPage.reviewNo", null, "Không cho xem lại")
    };

    return {
      key: labels[normalized] ? normalized : "RESULT_ONLY",
      label: labels[normalized] || labels.RESULT_ONLY
    };
  }

  function getLocalResults() {
    return Lms.storage ? Lms.storage.get(localResultsKey, []) : [];
  }

  function findResult(mockResults) {
    return getLocalResults().concat(mockResults).find(function (result) {
      return String(result.id) === state.resultId;
    }) || null;
  }

  function findExam(exams) {
    if (!state.result) {
      return null;
    }

    return exams.find(function (exam) {
      return Number(exam.id) === Number(state.result.examId) || exam.name === state.result.examName;
    }) || null;
  }

  function getSelectedIds(question) {
    const answers = state.result && state.result.answers ? state.result.answers : {};
    const selected = answers[question.id] || answers[String(question.id)];

    if (Array.isArray(selected)) {
      return selected.map(Number).sort();
    }

    return selected ? [Number(selected)] : [];
  }

  function getCorrectIds(question) {
    return question.answers
      .filter(function (answer) {
        return answer.isCorrect;
      })
      .map(function (answer) {
        return Number(answer.id);
      })
      .sort();
  }

  function hasAnswerData() {
    return state.result && state.result.answers && Object.keys(state.result.answers).length > 0;
  }

  function isQuestionCorrect(question) {
    const selectedIds = getSelectedIds(question);
    const correctIds = getCorrectIds(question);

    return selectedIds.length === correctIds.length && correctIds.every(function (id, index) {
      return id === selectedIds[index];
    });
  }

  function getReviewStats() {
    if (!hasAnswerData()) {
      const total = state.questions.length || (state.exam ? Number(state.exam.questionCount || 0) : 0);
      const correct = Math.round((Number(state.result.score || 0) / 100) * total);
      return {
        total,
        correct,
        wrong: Math.max(0, total - correct)
      };
    }

    const correct = state.questions.filter(isQuestionCorrect).length;
    return {
      total: state.questions.length,
      correct,
      wrong: Math.max(0, state.questions.length - correct)
    };
  }

  function renderNotFound() {
    $("[data-result-detail-title]").text(t("results.detailPage.notFoundTitle", null, "Không tìm thấy kết quả"));
    $("[data-result-detail-subtitle]").text(t("results.detailPage.notFoundDesc", null, "Quay lại danh sách kết quả và chọn kết quả khác."));
    $("#resultReviewContent").html(
      '<div class="app-empty-state">' +
        '<div class="image-slot image-slot-md image-slot-result u-mb-4" data-image-label="Result not found illustration 320x180">' +
          '<img src="/images/placeholders/result-placeholder.svg" alt="" aria-hidden="true" />' +
        '</div>' +
        '<h3 class="app-empty-title">' + t("results.detailPage.notFoundTitle", null, "Không tìm thấy kết quả") + '</h3>' +
        '<p class="app-empty-copy">' + t("results.detailPage.notFoundCopy", null, "Lượt làm bài này không tồn tại trong dữ liệu mô phỏng hoặc bộ nhớ cục bộ.") + '</p>' +
      '</div>'
    );
  }

  function renderSummary() {
    const stats = getReviewStats();
    const reviewMode = normalizeReviewMode(state.exam && state.exam.reviewMode);
    const passed = Boolean(state.result.passed);
    const badgeClass = passed ? "app-badge-success" : "app-badge-danger";

    $("[data-result-detail-title]").text(state.result.examName);
    $("[data-result-detail-subtitle]").text(t("results.detailPage.submittedAtText", { date: formatDate(state.result.submittedAt) }, "Đã nộp lúc " + formatDate(state.result.submittedAt)));
    $("[data-result-detail-metric='score']").text(state.result.score + "%");
    $("[data-result-detail-metric='scoreHero']").text(state.result.score + "%");
    $("[data-result-score-ring]")
      .toggleClass("is-passed", passed)
      .toggleClass("is-failed", !passed)
      .css("--score", Math.max(0, Math.min(100, Number(state.result.score || 0))) + "%");
    $("[data-result-score-hero-title]").text(passed ? t("results.detailPage.passed", null, "Äáº¡t") : t("results.detailPage.failed", null, "KhÃ´ng Ä‘áº¡t"));
    $("[data-result-score-hero-copy]").text(getPolicyCopy(reviewMode));
    $("[data-result-detail-metric='correct']").text(stats.correct + "/" + stats.total);
    $("[data-result-detail-metric='wrong']").text(stats.wrong);
    $("[data-result-detail-metric='duration']").text(t("results.detailPage.durationValue", { minutes: state.result.durationMinutes }, state.result.durationMinutes + " phút"));
    $("[data-result-detail-status]")
      .removeClass("app-badge-success app-badge-danger")
      .addClass(badgeClass)
      .text(passed ? t("results.detailPage.passed", null, "Đạt") : t("results.detailPage.failed", null, "Không đạt"));
    $("[data-result-detail-info='passScore']").text((state.exam && state.exam.passScore ? state.exam.passScore : "--") + "/100");
    $("[data-result-detail-info='reviewPolicy']").text(reviewMode.label);
    $("[data-result-detail-info='submittedAt']").text(formatDate(state.result.submittedAt));
    $("[data-result-detail-info='studentName']").text(state.result.studentName || t("common.student", null, "Học viên"));
    $("[data-result-review-count]").text(t("results.detailPage.reviewQuestionsCount", { count: stats.total }, stats.total + " câu hỏi"));
  }

  function getPolicyCopy(reviewMode) {
    const copy = {
      FULL_REVIEW: t("results.detailPage.copyFull", null, "Bạn có thể xem câu trả lời đã chọn và đáp án đúng."),
      RESULT_ONLY: t("results.detailPage.copyResultOnly", null, "Chỉ hiển thị kết quả cuối cùng đối với bài thi này."),
      ANSWER_ONLY: t("results.detailPage.copyAnswerOnly", null, "Chỉ hiển thị đáp án đúng, câu trả lời đã chọn bị ẩn."),
      NO_REVIEW: t("results.detailPage.copyNoReview", null, "Chế độ xem lại câu hỏi bị khóa theo quy định bài thi.")
    };

    return copy[reviewMode.key] || copy.RESULT_ONLY;
  }

  function renderLockedReview(reviewMode) {
    $("#resultReviewContent").html(
      '<div class="app-empty-state">' +
        '<div class="image-slot image-slot-md image-slot-result u-mb-4" data-image-label="Locked review illustration 320x180">' +
          '<img src="/images/placeholders/result-placeholder.svg" alt="" aria-hidden="true" />' +
        '</div>' +
        '<h3 class="app-empty-title">' + escapeHtml(reviewMode.label) + '</h3>' +
        '<p class="app-empty-copy">' + escapeHtml(getPolicyCopy(reviewMode)) + '</p>' +
      '</div>'
    );
  }

  function renderAnswer(answer, selectedIds, correctIds, reviewMode) {
    const isSelected = selectedIds.includes(Number(answer.id));
    const isCorrect = correctIds.includes(Number(answer.id));
    const showSelected = reviewMode.key === "FULL_REVIEW";
    const showCorrect = reviewMode.key === "FULL_REVIEW" || reviewMode.key === "ANSWER_ONLY";
    const classes = [
      "result-answer-option",
      showSelected && isSelected ? "selected" : "",
      showCorrect && isCorrect ? "correct" : "",
      showSelected && isSelected && !isCorrect ? "wrong" : ""
    ].filter(Boolean).join(" ");
    const flags = [];

    if (showSelected && isSelected) {
      flags.push('<span class="app-badge app-badge-info">' + t("results.detailPage.badgeSelected", null, "Đã chọn") + '</span>');
    }

    if (showCorrect && isCorrect) {
      flags.push('<span class="app-badge app-badge-success">' + t("results.detailPage.badgeCorrect", null, "Đáp án đúng") + '</span>');
    }

    return (
      '<li class="' + classes + '">' +
        '<span>' + escapeHtml(answer.content) + '</span>' +
        '<span class="result-answer-flags">' + flags.join("") + '</span>' +
      '</li>'
    );
  }

  function getDifficultyLabel(difficulty) {
    const labels = {
      Easy: t("results.detailPage.difficultyEasy", null, "Dễ"),
      Medium: t("results.detailPage.difficultyMedium", null, "Trung bình"),
      Hard: t("results.detailPage.difficultyHard", null, "Khó")
    };
    return labels[difficulty] || difficulty;
  }

  function renderQuestionReview(reviewMode) {
    if (!state.questions.length) {
      renderLockedReview(reviewMode);
      return;
    }

    const html = state.questions.map(function (question, index) {
      const selectedIds = getSelectedIds(question);
      const correctIds = getCorrectIds(question);
      const isCorrect = hasAnswerData() ? isQuestionCorrect(question) : null;
      const stateBadge = isCorrect === null
        ? '<span class="app-badge app-badge-info">' + t("results.detailPage.badgeSampleReview", null, "Xem thử") + '</span>'
        : '<span class="app-badge ' + (isCorrect ? "app-badge-success" : "app-badge-danger") + '">' + (isCorrect ? t("results.detailPage.badgeCorrectState", null, "Đúng") : t("results.detailPage.badgeWrongState", null, "Sai")) + '</span>';

      return (
        '<article class="result-question-review app-animate-slide-up ' + (isCorrect === null ? "is-sample" : (isCorrect ? "is-correct" : "is-wrong")) + '">' +
          '<div class="result-question-review-head">' +
            '<div>' +
              '<h3>' + t("results.detailPage.questionHeading", { index: index + 1 }, "Câu hỏi " + (index + 1)) + '</h3>' +
              '<p>' + t("results.detailPage.questionMeta", {
                category: question.category,
                difficulty: getDifficultyLabel(question.difficulty),
                score: question.score
              }, question.category + " / " + getDifficultyLabel(question.difficulty) + " / " + question.score + " điểm") + '</p>' +
            '</div>' +
            stateBadge +
          '</div>' +
          '<p class="result-question-content">' + escapeHtml(question.content) + '</p>' +
          '<ul class="result-answer-list">' +
            question.answers.map(function (answer) {
              return renderAnswer(answer, selectedIds, correctIds, reviewMode);
            }).join("") +
          '</ul>' +
        '</article>'
      );
    }).join("");

    $("#resultReviewContent").html(html);
  }

  function renderReview() {
    const reviewMode = normalizeReviewMode(state.exam && state.exam.reviewMode);
    $("[data-result-review-copy]").text(getPolicyCopy(reviewMode));

    if (reviewMode.key === "RESULT_ONLY" || reviewMode.key === "NO_REVIEW") {
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
  }

  function init() {
    state.resultId = String($("[data-result-detail-id]").data("result-detail-id") || "");

    $(document).on("lms:i18n:changed", render);

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    $.when(
      Lms.apiClient.get("results.json"),
      Lms.apiClient.get("exams.json"),
      Lms.apiClient.get("questions.json")
    ).done(function (resultsResponse, examsResponse, questionsResponse) {
      const mockResults = getItems(resultsResponse);
      const exams = getItems(examsResponse);

      state.result = findResult(mockResults);
      state.exam = findExam(exams);
      state.questions = getItems(questionsResponse);
      render();
    }).fail(function () {
      state.result = findResult([]);
      render();
    });
  }

  $(init);
})(window, jQuery);
