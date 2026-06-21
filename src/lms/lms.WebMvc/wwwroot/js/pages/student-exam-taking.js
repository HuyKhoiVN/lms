(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const sessionKey = "lms.student.examSession";
  const resultsKey = "lms.student.examResults";
  const autosaveIntervalSeconds = 20;
  const state = {
    examId: 0,
    exam: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    marked: [],
    submitted: false,
    timerIntervalId: null,
    autosaveIntervalId: null
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

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function getSession() {
    return Lms.storage ? Lms.storage.get(sessionKey, null) : null;
  }

  function saveSession() {
    if (!Lms.storage || !state.exam) {
      return;
    }

    const existing = getSession() || {};
    Lms.storage.set(sessionKey, {
      ...existing,
      examId: state.exam.id,
      durationMinutes: state.exam.durationMinutes,
      answers: state.answers,
      marked: state.marked,
      lastSavedAt: new Date().toISOString()
    });
  }

  function clearSession() {
    if (Lms.storage) {
      Lms.storage.remove(sessionKey);
    }
  }

  function isAnswered(questionId) {
    const value = state.answers[questionId];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
    const seconds = Math.max(0, totalSeconds) % 60;

    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function getRemainingSeconds() {
    const session = getSession();
    const startedAt = session && session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const durationSeconds = Number(state.exam ? state.exam.durationMinutes : 0) * 60;
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);

    return Math.max(0, durationSeconds - elapsedSeconds);
  }

  function renderTimer() {
    const remaining = getRemainingSeconds();
    const durationSeconds = Number(state.exam ? state.exam.durationMinutes : 0) * 60 || 1;
    const ratio = remaining / durationSeconds;
    const timerState = ratio <= 0.1 ? "danger" : ratio <= 0.2 ? "warning" : "normal";

    $("[data-exam-taking-timer]").text(formatTime(remaining));
    $(".exam-timer-card").attr("data-exam-timer-state", timerState);
    $("[data-exam-taking-timer-progress]").css("width", Math.max(0, Math.min(100, ratio * 100)) + "%");

    if (remaining <= 0 && state.exam && !state.submitted) {
      submitExam("auto");
    }
  }

  function renderNavigator() {
    const $navigator = $("#examQuestionNavigator").empty();

    state.questions.forEach(function (question, index) {
      const active = index === state.currentIndex ? " active" : "";
      const answered = isAnswered(question.id) ? " answered" : "";
      const marked = state.marked.includes(question.id) ? " marked" : "";

      $navigator.append(
        '<button class="exam-question-nav-item' + active + answered + marked + '" type="button" data-exam-question-index="' + index + '">' +
          (index + 1) +
        '</button>'
      );
    });

    const answeredCount = state.questions.filter(function (question) {
      return isAnswered(question.id);
    }).length;
    $("[data-exam-taking-progress]").text(t("exams.takePage.progressText", { answered: answeredCount, total: state.questions.length }, answeredCount + "/" + state.questions.length + " đã trả lời"));
  }

  function getDifficultyLabel(difficulty) {
    const labels = {
      Easy: t("exams.takePage.difficultyEasy", null, "Dễ"),
      Medium: t("exams.takePage.difficultyMedium", null, "Trung bình"),
      Hard: t("exams.takePage.difficultyHard", null, "Khó")
    };
    return labels[difficulty] || difficulty;
  }

  function renderQuestion() {
    const question = state.questions[state.currentIndex];

    if (!question) {
      $("[data-exam-question-content]").text(t("exams.takePage.noQuestion", null, "Không có câu hỏi nào."));
      $("#examAnswerList").empty();
      return;
    }

    const inputType = question.questionType === "MultipleChoice" ? "checkbox" : "radio";
    const selected = state.answers[question.id] || (question.questionType === "MultipleChoice" ? [] : "");

    $("[data-exam-question-heading]").text(t("exams.takePage.questionHeading", { index: state.currentIndex + 1 }, "Câu hỏi " + (state.currentIndex + 1)));
    $("[data-exam-question-meta]").text(t("exams.takePage.questionMeta", {
      category: question.category,
      difficulty: getDifficultyLabel(question.difficulty),
      score: question.score
    }, question.category + " / " + getDifficultyLabel(question.difficulty) + " / " + question.score + " điểm"));
    $("[data-exam-question-content]").text(question.content);

    const $answers = $("#examAnswerList").empty();

    question.answers.forEach(function (answer) {
      const checked = Array.isArray(selected)
        ? selected.includes(answer.id)
        : Number(selected) === answer.id;

      $answers.append(
        '<label class="exam-answer-option' + (checked ? " selected" : "") + '">' +
          '<input type="' + inputType + '" name="examAnswer" value="' + answer.id + '"' + (checked ? " checked" : "") + ' />' +
          '<span>' + escapeHtml(answer.content) + '</span>' +
        '</label>'
      );
    });

    $("[data-exam-taking-action='prev']").prop("disabled", state.currentIndex === 0).text(t("exams.takePage.buttonPrev", null, "Câu trước"));
    $("[data-exam-taking-action='next']").prop("disabled", state.currentIndex >= state.questions.length - 1).text(t("exams.takePage.buttonNext", null, "Câu sau"));
    $("[data-exam-taking-action='submit']").text(t("exams.takePage.buttonSubmit", null, "Nộp bài"));
    $("[data-exam-taking-action='mark']").toggleClass("active", state.marked.includes(question.id)).text(t("exams.takePage.buttonMark", null, "Đánh dấu"));
  }

  function getUnansweredQuestions() {
    return state.questions.filter(function (question) {
      return !isAnswered(question.id);
    });
  }

  function calculateScore() {
    let score = 0;

    state.questions.forEach(function (question) {
      const correctIds = question.answers
        .filter(function (answer) {
          return answer.isCorrect;
        })
        .map(function (answer) {
          return answer.id;
        })
        .sort();
      const selected = state.answers[question.id];
      const selectedIds = Array.isArray(selected) ? selected.slice().sort() : selected ? [Number(selected)] : [];
      const isCorrect = correctIds.length === selectedIds.length && correctIds.every(function (id, index) {
        return id === selectedIds[index];
      });

      if (isCorrect) {
        score += Number(question.score || 0);
      }
    });

    const maxScore = state.questions.reduce(function (total, question) {
      return total + Number(question.score || 0);
    }, 0) || 1;

    return Math.round((score / maxScore) * 100);
  }

  function saveResult(result) {
    if (!Lms.storage) {
      return;
    }

    const results = Lms.storage.get(resultsKey, []);
    results.unshift(result);
    Lms.storage.set(resultsKey, results);
  }

  function submitExam(mode) {
    if (state.submitted || !state.exam) {
      return;
    }

    state.submitted = true;
    window.clearInterval(state.timerIntervalId);
    window.clearInterval(state.autosaveIntervalId);
    saveSession();

    const session = getSession() || {};
    const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const score = calculateScore();
    const result = {
      id: Date.now(),
      examId: state.exam.id,
      examName: state.exam.name,
      studentName: "Student One",
      score,
      passed: score >= Number(state.exam.passScore || 0),
      durationMinutes,
      submittedAt: new Date().toISOString(),
      mode: mode || "manual",
      answers: state.answers
    };

    saveResult(result);
    clearSession();
    $("[data-exam-taking-action]").prop("disabled", true);
    $("#examAnswerList input").prop("disabled", true);
    showToast(
      result.passed ? "success" : "warning",
      mode === "auto" ? t("exams.takePage.toastTimeEnded", null, "Hết giờ làm bài") : t("exams.takePage.toastSubmitted", null, "Đã nộp bài"),
      t("exams.takePage.toastSubmitMessage", { name: state.exam.name, score: score }, state.exam.name + " đã được nộp với số điểm " + score + "/100.")
    );
  }

  function showSubmitConfirm() {
    if (!state.exam || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const unanswered = getUnansweredQuestions();
    const modal = $(
      '<div>' +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title" data-i18n="exams.takePage.modalSubmitTitle">' + t("exams.takePage.modalSubmitTitle", null, "Nộp bài thi") + '</h2>' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="exams.takePage.buttonClose">' + t("exams.takePage.buttonClose", null, "Đóng") + '</button>' +
        '</div>' +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0"></p>' +
        '</div>' +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="exams.takePage.buttonCancel">' + t("exams.takePage.buttonCancel", null, "Hủy") + '</button>' +
          '<button class="app-button app-button-primary" type="button" data-exam-confirm-submit data-i18n="exams.takePage.buttonSubmit">' + t("exams.takePage.buttonSubmit", null, "Nộp bài") + '</button>' +
        '</div>' +
      '</div>'
    );

    modal.find(".app-modal-body p").html(
      t("exams.takePage.modalSubmitConfirm", { count: "<strong>" + unanswered.length + "</strong>" }, "Bạn còn " + "<strong>" + unanswered.length + "</strong>" + " câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?")
    );
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-exam-confirm-submit]").on("click", function () {
      Lms.ui.closeModal();
      submitExam("manual");
    });

    Lms.ui.showModal(modal);
  }

  function startAutosave() {
    window.clearInterval(state.autosaveIntervalId);
    state.autosaveIntervalId = window.setInterval(function () {
      if (!state.submitted) {
        saveSession();
        showToast("info", t("exams.takePage.toastAutosavedTitle", null, "Tự động lưu"), t("exams.takePage.toastAutosavedMessage", null, "Bài làm của bạn đã được tự động lưu cục bộ."));
      }
    }, autosaveIntervalSeconds * 1000);
  }

  function render() {
    if (!state.exam) {
      $("[data-exam-taking-title]").text(t("exams.takePage.notFoundTitle", null, "Không tìm thấy bài thi"));
      $("[data-exam-taking-subtitle]").text(t("exams.takePage.notFoundDesc", null, "Quay lại danh sách bài thi và chọn bài thi khác."));
      $("#examAnswerList").html(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">!</div>' +
          '<h3 class="app-empty-title">' + t("exams.takePage.notFoundTitle", null, "Không tìm thấy bài thi") + '</h3>' +
          '<p class="app-empty-copy">' + t("exams.takePage.notFoundCopy", null, "Bài thi yêu cầu không tồn tại trong dữ liệu mô phỏng.") + '</p>' +
        '</div>'
      );
      return;
    }

    $("[data-exam-taking-title]").text(state.exam.name);
    $("[data-exam-taking-subtitle]").text(t("exams.takePage.readySubtitle", null, "Trả lời các câu hỏi và nộp bài khi hoàn thành."));
    renderTimer();
    renderNavigator();
    renderQuestion();
  }

  function bindEvents() {
    $(document).on("click", "[data-exam-question-index]", function () {
      state.currentIndex = Number($(this).data("exam-question-index"));
      renderNavigator();
      renderQuestion();
    });

    $(document).on("change", "#examAnswerList input", function () {
      const question = state.questions[state.currentIndex];

      if (!question) {
        return;
      }

      if (question.questionType === "MultipleChoice") {
        state.answers[question.id] = $("#examAnswerList input:checked").map(function () {
          return Number($(this).val());
        }).get();
      } else {
        state.answers[question.id] = Number($(this).val());
      }

      saveSession();
      renderNavigator();
      renderQuestion();
    });

    $(document).on("click", "[data-exam-taking-action='prev']", function () {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        renderNavigator();
        renderQuestion();
      }
    });

    $(document).on("click", "[data-exam-taking-action='next']", function () {
      if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex += 1;
        renderNavigator();
        renderQuestion();
      }
    });

    $(document).on("click", "[data-exam-taking-action='mark']", function () {
      const question = state.questions[state.currentIndex];

      if (!question) {
        return;
      }

      if (state.marked.includes(question.id)) {
        state.marked = state.marked.filter(function (id) {
          return id !== question.id;
        });
      } else {
        state.marked.push(question.id);
      }

      saveSession();
      renderNavigator();
      renderQuestion();
    });

    $(document).on("click", "[data-exam-taking-action='submit']", function () {
      showSubmitConfirm();
    });

    $(document).on("lms:i18n:changed", render);
  }

  function init() {
    state.examId = Number($("[data-exam-taking-id]").data("exam-taking-id"));
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    $.when(
      Lms.apiClient.get("exams.json"),
      Lms.apiClient.get("questions.json")
    ).done(function (examsResponse, questionsResponse) {
      state.exam = getItems(examsResponse).find(function (exam) {
        return exam.id === state.examId;
      }) || null;
      state.questions = getItems(questionsResponse);

      const session = getSession();

      if (session && Number(session.examId) === state.examId) {
        state.answers = session.answers || {};
        state.marked = session.marked || [];
      }

      render();
      state.timerIntervalId = window.setInterval(renderTimer, 1000);
      startAutosave();
    }).fail(function () {
      showToast(
        "error",
        t("exams.takePage.toastLoadErrorTitle", null, "Lỗi tải dữ liệu"),
        t("exams.takePage.toastLoadErrorMessage", null, "Không thể tải dữ liệu làm bài thi.")
      );
      render();
    });
  }

  $(init);
})(window, jQuery);
