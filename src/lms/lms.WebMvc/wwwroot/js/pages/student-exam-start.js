(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const sessionKey = "lms.student.examSession";
  const state = {
    examId: 0,
    exam: null
  };

  const iconMap = {
    "book-open": '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"></path>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8"></path><path d="M12 16v4"></path>',
    play: '<path d="m8 5 11 7-11 7Z"></path>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>',
    eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="3"></circle>',
    "refresh-cw-off": '<path d="M20 11a8.1 8.1 0 0 0-13.9-4.5L4 9"></path><path d="M4 4v5h5"></path><path d="m2 2 20 20"></path><path d="M4 13a8.1 8.1 0 0 0 13.9 4.5L20 15"></path><path d="M20 20v-5h-5"></path>',
    wifi: '<path d="M5 13a10 10 0 0 1 14 0"></path><path d="M8.5 16.5a5 5 0 0 1 7 0"></path><path d="M12 20h.01"></path>',
    timer: '<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M9 2h6"></path>',
    "shield-alert": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path>',
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    question: '<circle cx="12" cy="12" r="9"></circle><path d="M9.8 9a2.4 2.4 0 0 1 4.5 1.3c0 1.7-2.3 2-2.3 3.7"></path><path d="M12 17h.01"></path>',
    target: '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"></path><path d="M3 21v-5h5"></path><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8"></path><path d="M21 3v5h-5"></path>',
    info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path>'
  };

  function t(key, params, fallback) {
    return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
  }

  function getResponsePayload(response) {
    return Array.isArray(response) ? response[0] : response;
  }

  function getResponseData(response) {
    const payload = getResponsePayload(response);
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

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function formatDuration(minutes) {
    return t("exams.startPage.durationMinutes", { minutes }, minutes + " phút");
  }

  function formatQuestionCount(count) {
    return count + " câu hỏi";
  }

  function formatPassScore(score) {
    return score + "/100 điểm";
  }

  function formatAttempts(count) {
    return count + " lần";
  }

  function canStartExam(exam) {
    return Boolean(exam && exam.isPublished && exam.canStart !== false);
  }

  function formatAttemptAvailability(exam) {
    const total = Number(exam.attemptCount || exam.attemptLimit || 0);
    const used = Number(exam.usedAttemptCount || 0);

    if (exam.remainingAttemptCount == null) {
      return used > 0 ? "Đã làm " + used + " lần" : formatAttempts(total || 1);
    }

    return "Còn " + Number(exam.remainingAttemptCount || 0) + "/" + total + " lần";
  }

  function getIconSvg(icon) {
    const paths = iconMap[icon] || '<circle cx="12" cy="12" r="8"></circle>';
    return '<svg aria-hidden="true" viewBox="0 0 24 24">' + paths + "</svg>";
  }

  function renderStaticIcons() {
    $("[data-exam-prep-icon]").each(function () {
      const icon = $(this).data("exam-prep-icon");
      $(this).html(getIconSvg(icon));
    });
  }

  function renderTimeline(instructions) {
    const items = Array.isArray(instructions) ? instructions : [];
    if (!items.length) {
      $("[data-start-exam-timeline]").empty();
      return;
    }

    $("[data-start-exam-timeline]").html(items.map(function (item) {
      return (
        '<article class="exam-prep-timeline-item exam-prep-reveal" data-start-exam-reveal>' +
          '<span class="exam-prep-timeline-number">' + escapeHtml(item.number) + "</span>" +
          '<span class="exam-prep-line-icon" aria-hidden="true">' + getIconSvg(item.icon) + "</span>" +
          '<div>' +
            "<h3>" + escapeHtml(item.title) + "</h3>" +
            "<p>" + escapeHtml(item.description) + "</p>" +
          "</div>" +
        "</article>"
      );
    }).join(""));
  }

  function renderRules(rules) {
    const items = Array.isArray(rules) ? rules : [];
    if (!items.length) {
      $("#startExamRules").empty();
      return;
    }

    $("#startExamRules").html(items.map(function (rule) {
      return (
        '<article class="exam-prep-rule-row exam-prep-reveal" data-start-exam-reveal>' +
          '<span class="exam-prep-line-icon" aria-hidden="true">' + getIconSvg(rule.icon) + "</span>" +
          '<div>' +
            "<h3>" + escapeHtml(rule.title) + "</h3>" +
            "<p>" + escapeHtml(rule.description) + "</p>" +
          "</div>" +
        "</article>"
      );
    }).join(""));
  }

  function renderNotFound(message) {
    $("[data-start-exam-title]").text(t("exams.startPage.notFoundTitle", null, "Không tìm thấy bài thi"));
    $("[data-start-exam-subtitle]").text(message || t("exams.startPage.notFoundDesc", null, "Bài thi yêu cầu không tồn tại hoặc bạn không có quyền truy cập."));
    $("[data-start-exam-action='start']").prop("disabled", true);
    $("[data-start-exam-timeline], #startExamRules").empty();
  }

  function render() {
    if (!state.exam) {
      renderNotFound();
      return;
    }

    const exam = state.exam;
    const canStart = canStartExam(exam);
    const duration = formatDuration(exam.durationMinutes);
    const questions = formatQuestionCount(exam.questionCount);
    const passScore = formatPassScore(exam.passScore);
    const attempts = formatAttemptAvailability(exam);

    document.title = exam.name + " - lms";
    $("[data-start-exam-title]").text(exam.name);
    $("[data-start-exam-subtitle]").text(exam.description || "");
    $("[data-start-exam-status]").text(exam.status ? " / " + exam.status : "");
    $("[data-start-exam-meta='duration']").text(duration);
    $("[data-start-exam-meta='questions']").text(questions);
    $("[data-start-exam-meta='passScore']").text(passScore);
    $("[data-start-exam-meta='review']").text(exam.reviewPolicy);
    $("[data-start-exam-overview='duration']").text(duration);
    $("[data-start-exam-overview='questions']").text(questions);
    $("[data-start-exam-overview='passScore']").text(passScore);
    $("[data-start-exam-overview='review']").text(exam.reviewPolicy);
    $("[data-start-exam-overview='attempts']").text(attempts);
    $("[data-start-exam-overview='language']").text(exam.language);
    $("[data-start-exam-overview='status']").text(exam.status || "");
    $("[data-start-exam-action='start']").prop("disabled", !canStart);

    renderTimeline(exam.instructions);
    renderRules(exam.examRules);
    initStartExamReveal();
  }

  function initStartExamReveal() {
    const $items = $("[data-start-exam-reveal]").not("[data-start-exam-reveal-ready]");

    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-start-exam-reveal-ready", "true");
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
      $(this).attr("data-start-exam-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function setStartLoading(isLoading) {
    const buttons = $("[data-start-exam-action='start']");
    buttons.prop("disabled", isLoading || !canStartExam(state.exam));
    buttons.toggleClass("is-loading", isLoading);
  }

  function bindEvents() {
    $(document).on("click", "[data-start-exam-action='start']", function () {
      if (!canStartExam(state.exam)) {
        showToast(
          "warning",
          t("exams.startPage.toastUnavailableTitle", null, "Bài thi chưa sẵn sàng"),
          state.exam && state.exam.isPublished
            ? "Bạn đã sử dụng hết số lượt làm bài cho bài thi này."
            : t("exams.startPage.toastUnavailableMessage", null, "Chỉ bài thi đã xuất bản mới có thể bắt đầu làm.")
        );
        return;
      }

      setStartLoading(true);

      Lms.apiClient.post("api/exam-attempts/start", { examId: state.exam.id }).done(function (response) {
        const data = getResponseData(response);
        if (Lms.storage) {
          Lms.storage.set(sessionKey, {
            examId: state.exam.id,
            attemptId: data.attemptId,
            startedAt: data.startedAt,
            durationMinutes: data.durationMinutes
          });
        }
        window.location.href = "/Exams/Take/" + state.exam.id;
      }).fail(function (error) {
        setStartLoading(false);
        showToast("error", t("exams.startPage.toastStartErrorTitle", null, "Không thể bắt đầu bài thi"), error && error.message ? error.message : t("exams.startPage.toastStartErrorMessage", null, "Vui lòng thử lại."));
      });
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadPageData() {
    if (!Lms.apiClient) {
      renderNotFound();
      return;
    }

    Lms.apiClient.get("api/exams/" + state.examId).done(function (response) {
      state.exam = getResponseData(response);
      render();
    }).fail(function (error) {
      showToast(
        "error",
        t("exams.startPage.toastLoadErrorTitle", null, "Lỗi tải dữ liệu"),
        error && error.message ? error.message : t("exams.startPage.toastLoadErrorMessage", null, "Không thể tải dữ liệu bài thi.")
      );
      renderNotFound(error && error.message ? error.message : null);
    });
  }

  function init() {
    state.examId = Number($("[data-student-start-exam-id]").data("student-start-exam-id"));
    renderStaticIcons();
    bindEvents();
    initStartExamReveal();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }

    loadPageData();
  }

  $(init);
})(window, jQuery);
