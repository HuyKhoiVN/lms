(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const sessionKey = "lms.student.examSession";
  const autosaveIntervalSeconds = 20;
  const state = {
    examId: 0,
    attemptId: 0,
    exam: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    marked: [],
    submitted: false,
    startedAt: null,
    durationMinutes: 0,
    timerIntervalId: null,
    autosaveIntervalId: null
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
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

  const iconSvg = {
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
    "circle-help": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M9.6 9a2.7 2.7 0 0 1 5.1 1.2c0 1.8-2.7 2-2.7 3.8"></path><path d="M12 17h.01"></path></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    bookmark: '<svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-3-6 3V4z"></path></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z"></path><path d="M9 12l2 2 4-5"></path></svg>',
    rotate: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 4v6h-6"></path></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>',
    browser: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 9h18"></path><path d="M7 7h.01M10 7h.01"></path></svg>',
    warning: '<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2L12 3z"></path><path d="M12 9v5"></path><path d="M12 17h.01"></path></svg>',
    "chevron-left": '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"></path></svg>',
    "chevron-right": '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>'
  };

  function renderStaticIcons() {
    $("[data-exam-icon]").each(function () {
      const $icon = $(this);
      const name = $icon.data("exam-icon");
      if (!$icon.attr("data-exam-icon-ready") && iconSvg[name]) {
        $icon.html(iconSvg[name]).attr("data-exam-icon-ready", "true");
      }
    });
  }

  function getResponsePayload(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getResponseData(response) {
    const payload = getResponsePayload(response);
    return payload && payload.data ? payload.data : null;
  }

  function getSession() {
    return Lms.storage ? Lms.storage.get(sessionKey, null) : null;
  }

  function saveSession() {
    if (!Lms.storage || !state.exam) {
      return;
    }

    Lms.storage.set(sessionKey, {
      examId: state.examId,
      attemptId: state.attemptId,
      startedAt: state.startedAt,
      durationMinutes: state.durationMinutes,
      marked: state.marked
    });
  }

  function clearSession() {
    if (Lms.storage) {
      Lms.storage.remove(sessionKey);
    }
  }

  function normalizeQuestion(question) {
    return {
      id: Number(question.questionId),
      content: question.content || "",
      questionType: question.questionType || "SingleChoice",
      difficulty: question.difficulty || "",
      category: question.category || "",
      score: Number(question.score || 0),
      order: Number(question.order || 0),
      options: Array.isArray(question.options) ? question.options.map(function (option) {
        return {
          id: Number(option.answerOptionId),
          content: option.content || "",
          order: Number(option.order || 0)
        };
      }) : []
    };
  }

  function hydrateAnswers(savedAnswers) {
    state.answers = {};
    (savedAnswers || []).forEach(function (answer) {
      const values = Array.isArray(answer.selectedOptionIds) ? answer.selectedOptionIds.map(Number) : [];
      state.answers[Number(answer.questionId)] = values;
    });
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

  function getPositiveNumber() {
    for (let index = 0; index < arguments.length; index += 1) {
      const value = Number(arguments[index] || 0);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }

    return 0;
  }

  function resolveDurationMinutes(data) {
    const session = getSession() || {};
    return getPositiveNumber(
      data && data.durationMinutes,
      state.durationMinutes,
      session.durationMinutes
    );
  }

  function normalizeUtcDateString(value) {
    if (!value) {
      return null;
    }

    const text = String(value);
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(text)) {
      return text;
    }

    return text + "Z";
  }

  function getStartedAtMs() {
    const normalized = normalizeUtcDateString(state.startedAt);
    return normalized ? new Date(normalized).getTime() : NaN;
  }

  function hasValidTimerRuntime() {
    return Number(state.durationMinutes || 0) > 0 && Number.isFinite(getStartedAtMs());
  }

  function getRemainingSeconds() {
    if (!hasValidTimerRuntime()) {
      return null;
    }

    const startedAt = getStartedAtMs();
    const durationSeconds = Number(state.durationMinutes || 0) * 60;
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);

    return Math.max(0, durationSeconds - elapsedSeconds);
  }

  function renderTimer() {
    const remaining = getRemainingSeconds();
    if (remaining === null) {
      $("[data-exam-taking-timer]").text("--:--");
      $(".student-exam-taking-timer").attr("data-exam-timer-state", "normal");
      $("[data-exam-taking-timer-progress]").css("width", "0%");
      return;
    }

    const durationSeconds = Number(state.durationMinutes || 0) * 60 || 1;
    const ratio = remaining / durationSeconds;
    const timerState = ratio <= 0.1 ? "danger" : ratio <= 0.2 ? "warning" : "normal";

    $("[data-exam-taking-timer]").text(formatTime(remaining));
    $(".student-exam-taking-timer").attr("data-exam-timer-state", timerState);
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
        '<button class="student-exam-question-nav-item' + active + answered + marked + '" type="button" data-exam-question-index="' + index + '">' +
          '<span>' + (index + 1) + "</span>" +
        "</button>"
      );
    });

    const answeredCount = state.questions.filter(function (question) {
      return isAnswered(question.id);
    }).length;
    $("[data-exam-taking-progress]").text(t("exams.takePage.progressText", { answered: answeredCount, total: state.questions.length }, answeredCount + "/" + state.questions.length + " da tra loi"));
    $("[data-exam-taking-floating-progress]").text("Câu " + (state.currentIndex + 1) + " / " + Math.max(state.questions.length, 1));
  }

  function formatNumber(value) {
    const number = Number(value || 0);
    return Number.isInteger(number) ? String(number) : String(number.toFixed(2)).replace(/\.?0+$/, "");
  }

  function getDifficultyLabel(value) {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "easy") return "Dễ";
    if (normalized === "medium") return "Trung bình";
    if (normalized === "hard") return "Khó";
    return value || "";
  }

  function renderExamMeta() {
    if (!state.exam) {
      return;
    }

    const questionCount = Number(state.exam.questionCount || state.questions.length || 0);
    const reviewPolicy = state.exam.reviewPolicy || t("exams.takePage.reviewPolicy", null, "Chính sách xem lại");
    $("[data-exam-taking-status]").text(t("exams.takePage.statusInProgress", null, "Đang làm bài"));
    $("[data-exam-taking-meta='duration']").text(formatNumber(state.durationMinutes) + " phút");
    $("[data-exam-taking-meta='questions']").text(questionCount + " câu");
    $("[data-exam-taking-meta='passScore']").text("Điểm đạt " + formatNumber(state.exam.passScore) + "/100");
    $("[data-exam-taking-meta='review']").text(reviewPolicy);
  }

  function renderQuestion() {
    const question = state.questions[state.currentIndex];

    if (!question) {
      $("[data-exam-question-content]").text(t("exams.takePage.noQuestion", null, "Khong co cau hoi nao."));
      $("#examAnswerList").empty();
      return;
    }

    const inputType = question.questionType === "MultipleChoice" ? "checkbox" : "radio";
    const selected = state.answers[question.id] || [];
    const progressRatio = state.questions.length ? ((state.currentIndex + 1) / state.questions.length) * 100 : 0;

    $("[data-exam-question-heading]").text("Câu hỏi " + (state.currentIndex + 1) + " / " + state.questions.length);
    $("[data-exam-question-progress]").css("width", Math.max(0, Math.min(100, progressRatio)) + "%");
    const metaItems = [];
    if (question.difficulty) {
      metaItems.push('<span class="is-amber">' + escapeHtml(getDifficultyLabel(question.difficulty)) + "</span>");
    }
    if (question.category) {
      metaItems.push('<span class="is-blue">' + escapeHtml(question.category) + "</span>");
    }
    metaItems.push('<span class="is-green">' + escapeHtml(formatNumber(question.score)) + " điểm</span>");
    $("[data-exam-question-meta]").html(metaItems.join(""));
    $("[data-exam-question-content]").text(question.content);

    const $answers = $("#examAnswerList").empty();

    question.options.forEach(function (answer, index) {
      const checked = selected.includes(answer.id);
      const letter = String.fromCharCode(65 + index);

      $answers.append(
        '<label class="student-exam-answer-option' + (checked ? " selected" : "") + '">' +
          '<input type="' + inputType + '" name="examAnswer" value="' + answer.id + '"' + (checked ? " checked" : "") + " />" +
          '<span class="exam-session-answer-letter">' + letter + "</span>" +
          '<span class="exam-session-answer-text">' + escapeHtml(answer.content) + "</span>" +
        "</label>"
      );
    });

    $("[data-exam-taking-action='prev']").prop("disabled", state.currentIndex === 0);
    $("[data-exam-taking-action='next']").prop("disabled", state.currentIndex >= state.questions.length - 1);
    $("[data-exam-taking-action='prev'].app-button").text(t("exams.takePage.buttonPrev", null, "Câu trước"));
    $("[data-exam-taking-action='next'].app-button").text(t("exams.takePage.buttonNext", null, "Câu sau"));
    $(".exam-session-nav-submit [data-exam-taking-action='submit'] span").text(t("exams.takePage.buttonSubmit", null, "Nộp bài"));
    $("[data-exam-taking-action='mark']").toggleClass("active", state.marked.includes(question.id)).find("span").text(t("exams.takePage.buttonMark", null, "Đánh dấu"));
    renderStaticIcons();
  }

  function getUnansweredQuestions() {
    return state.questions.filter(function (question) {
      return !isAnswered(question.id);
    });
  }

  function buildAutosavePayload() {
    return {
      answers: state.questions.map(function (question) {
        return {
          questionId: question.id,
          selectedOptionIds: state.answers[question.id] || []
        };
      }).filter(function (item) {
        return item.selectedOptionIds.length > 0;
      })
    };
  }

  function autosave(showFeedback) {
    if (!state.attemptId || state.submitted) {
      return $.Deferred().resolve().promise();
    }

    return Lms.apiClient.post("api/exam-attempts/" + state.attemptId + "/autosave", buildAutosavePayload()).done(function () {
      if (showFeedback) {
        showToast("info", t("exams.takePage.toastAutosavedTitle", null, "Tu dong luu"), t("exams.takePage.toastAutosavedMessage", null, "Bai lam cua ban da duoc luu len he thong."));
      }
    });
  }

  function submitExam(mode) {
    if (state.submitted || !state.exam || !state.attemptId) {
      return;
    }

    if (!hasValidTimerRuntime()) {
      showToast("warning", t("exams.takePage.toastTimerInvalidTitle", null, "Chưa thể nộp bài"), t("exams.takePage.toastTimerInvalidMessage", null, "Dữ liệu thời gian làm bài chưa sẵn sàng. Vui lòng tải lại trang."));
      return;
    }

    state.submitted = true;
    window.clearInterval(state.timerIntervalId);
    window.clearInterval(state.autosaveIntervalId);

    const payload = buildAutosavePayload();
    if (mode === "auto") {
      payload.autoSubmit = true;
    }

    Lms.apiClient.post("api/exam-attempts/" + state.attemptId + "/submit", payload).done(function (response) {
      const data = getResponseData(response);
      clearSession();
      $("[data-exam-taking-action]").prop("disabled", true);
      $("#examAnswerList input").prop("disabled", true);
      showToast(
        data && data.passed ? "success" : "warning",
        mode === "auto" ? t("exams.takePage.toastTimeEnded", null, "Het gio lam bai") : t("exams.takePage.toastSubmitted", null, "Da nop bai"),
        t("exams.takePage.toastSubmitMessage", { name: state.exam.name, score: data && typeof data.score !== "undefined" ? data.score : "--" }, state.exam.name + " da duoc nop.")
      );
      if (mode !== "auto") {
        window.setTimeout(function () {
          window.location.href = "/Results";
        }, 800);
      }
    }).fail(function (error) {
      state.submitted = false;
      showToast("error", t("exams.takePage.toastSubmitErrorTitle", null, "Khong the nop bai"), error && error.message ? error.message : t("exams.takePage.toastSubmitErrorMessage", null, "Vui long thu lai."));
      state.timerIntervalId = window.setInterval(renderTimer, 1000);
      startAutosave();
    });
  }

  function showSubmitConfirm() {
    if (!state.exam || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const unanswered = getUnansweredQuestions();
    const modal = $(
      '<div class="linear-exam-submit-modal">' +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title" data-i18n="exams.takePage.modalSubmitTitle">' + t("exams.takePage.modalSubmitTitle", null, "Nop bai thi") + "</h2>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="exams.takePage.buttonClose">' + t("exams.takePage.buttonClose", null, "Dong") + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0"></p>' +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="exams.takePage.buttonCancel">' + t("exams.takePage.buttonCancel", null, "Huy") + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-exam-confirm-submit data-i18n="exams.takePage.buttonSubmit">' + t("exams.takePage.buttonSubmit", null, "Nop bai") + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find(".app-modal-body p").html(
      t("exams.takePage.modalSubmitConfirm", { count: "<strong>" + unanswered.length + "</strong>" }, "Ban con <strong>" + unanswered.length + "</strong> cau hoi chua tra loi. Ban co chac chan muon nop bai?")
    );
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-exam-confirm-submit]").on("click", function () {
      Lms.ui.closeModal();
      submitExam("manual");
    });

    Lms.ui.showModal(modal);
  }

  function initExamTakingReveal() {
    const $items = $("[data-exam-taking-reveal]").not("[data-exam-taking-reveal-ready]");

    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-exam-taking-reveal-ready", "true");
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
      this.style.setProperty("--reveal-delay", Math.min(index * 45, 180) + "ms");
      $(this).attr("data-exam-taking-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function startAutosave() {
    window.clearInterval(state.autosaveIntervalId);
    state.autosaveIntervalId = window.setInterval(function () {
      autosave(true);
    }, autosaveIntervalSeconds * 1000);
  }

  function render() {
    if (!state.exam) {
      $("[data-exam-taking-title]").text(t("exams.takePage.notFoundTitle", null, "Khong tim thay bai thi"));
      $("[data-exam-taking-subtitle]").text(t("exams.takePage.notFoundDesc", null, "Quay lai danh sach bai thi va chon bai thi khac."));
      $("[data-exam-question-content]").empty();
      $("#examAnswerList").html(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">!</div>' +
          '<h3 class="app-empty-title">' + t("exams.takePage.notFoundTitle", null, "Khong tim thay bai thi") + "</h3>" +
          '<p class="app-empty-copy">' + t("exams.takePage.notFoundCopy", null, "Bai thi yeu cau khong ton tai hoac ban khong co quyen truy cap.") + "</p>" +
        "</div>"
      );
      return;
    }

    $("[data-exam-taking-title]").text(state.exam.name);
    $("[data-exam-taking-subtitle]").text(t("exams.takePage.readySubtitle", null, "Tra loi cac cau hoi va nop bai khi hoan thanh."));
    renderExamMeta();
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
        state.answers[question.id] = [Number($(this).val())];
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
      autosave(false).always(showSubmitConfirm);
    });

    $(document).on("click", "[data-exam-taking-tab]", function () {
      const tab = $(this).data("exam-taking-tab");
      $("[data-exam-taking-tab]").removeClass("is-active").attr("aria-selected", "false");
      $(this).addClass("is-active").attr("aria-selected", "true");
      $("[data-exam-taking-panel]").removeClass("is-active").attr("hidden", true);
      $("[data-exam-taking-panel='" + tab + "']").addClass("is-active").removeAttr("hidden");
    });

    $(document).on("lms:i18n:changed", render);
  }

  function fetchAttempt(attemptId) {
    return Lms.apiClient.get("api/exam-attempts/" + attemptId).done(function (response) {
      const data = getResponseData(response);
      state.attemptId = Number(data.attemptId);
      state.exam = {
        id: Number(data.examId),
        name: data.examName || "",
        passScore: Number(data.passScore || 0),
        reviewMode: data.reviewMode || "",
        reviewPolicy: data.reviewPolicy || "",
        questionCount: Number(data.questionCount || 0),
        status: data.status || ""
      };
      state.durationMinutes = resolveDurationMinutes(data);
      state.startedAt = normalizeUtcDateString(data.startedAt) || state.startedAt;
      state.questions = Array.isArray(data.questions) ? data.questions.map(normalizeQuestion) : [];
      hydrateAnswers(data.savedAnswers);
      render();
      state.timerIntervalId = window.setInterval(renderTimer, 1000);
      startAutosave();
    });
  }

  function startOrResumeAttempt() {
    const session = getSession();
    if (session && Number(session.examId) === state.examId) {
      state.marked = session.marked || [];
    }

    return Lms.apiClient.post("api/exam-attempts/start", { examId: state.examId }).done(function (response) {
      const data = getResponseData(response);
      state.attemptId = Number(data.attemptId);
      state.exam = {
        id: Number(data.examId),
        name: data.examName || "",
        passScore: Number(data.passScore || 0),
        reviewMode: data.reviewMode || "",
        reviewPolicy: data.reviewPolicy || "",
        questionCount: Number(data.questionCount || 0),
        status: data.status || ""
      };
      state.durationMinutes = resolveDurationMinutes(data);
      state.startedAt = normalizeUtcDateString(data.startedAt) || state.startedAt;
      saveSession();
      fetchAttempt(state.attemptId);
    });
  }

  function init() {
    state.examId = Number($("[data-exam-taking-id]").data("exam-taking-id"));
    bindEvents();
    renderStaticIcons();
    initExamTakingReveal();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    startOrResumeAttempt().fail(function (error) {
      showToast(
        "error",
        t("exams.takePage.toastLoadErrorTitle", null, "Loi tai du lieu"),
        error && error.message ? error.message : t("exams.takePage.toastLoadErrorMessage", null, "Khong the tai du lieu lam bai thi.")
      );
      render();
    });
  }

  $(init);
})(window, jQuery);
