(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const sessionKey = "lms.student.examSession";
  const state = {
    examId: 0,
    exam: null
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

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function getReviewLabel(reviewMode) {
    const labels = {
      FULL_REVIEW: t("exams.startPage.reviewFull", null, "Xem toàn bộ"),
      RESULT_ONLY: t("exams.startPage.reviewResultOnly", null, "Chỉ xem kết quả"),
      ANSWER_ONLY: t("exams.startPage.reviewAnswerOnly", null, "Chỉ xem đáp án"),
      NO_REVIEW: t("exams.startPage.reviewNo", null, "Không cho xem lại")
    };

    return labels[reviewMode] || reviewMode;
  }

  function getStatusLabel(status) {
    return status === "Published" ? t("exams.startPage.statusPublished", null, "Sẵn sàng") : t("exams.startPage.statusDraft", null, "Bản nháp");
  }

  function renderRules() {
    const rules = [
      t("exams.startPage.rule1", null, "Không tải lại trang hoặc đóng trình duyệt trong khi làm bài."),
      t("exams.startPage.rule2", null, "Nộp bài trước khi thời gian đếm ngược trở về không."),
      t("exams.startPage.rule3", null, "Đáp án đúng chỉ được hiển thị sau khi nộp bài và tùy thuộc vào chính sách xem lại."),
      t("exams.startPage.rule4", null, "Sử dụng màn hình làm bài tiếp theo để làm bài; màn hình này chỉ dùng để bắt đầu.")
    ];

    $("#startExamRules").html(rules.map(function (rule, index) {
      const icons = ["bi-wifi-off", "bi-hourglass-split", "bi-eye", "bi-play-circle"];
      return (
        '<div class="start-exam-rule linear-start-exam-rule start-exam-reveal" data-start-exam-reveal>' +
          '<span class="start-exam-rule-icon" aria-hidden="true"><i class="bi ' + icons[index % icons.length] + '"></i></span>' +
          '<span class="app-badge app-badge-info">' + t("exams.startPage.badgeRule", null, "Quy định") + '</span>' +
          '<span>' + escapeHtml(rule) + '</span>' +
        '</div>'
      );
    }).join(""));
    initStartExamReveal();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function render() {
    if (!state.exam) {
      $("[data-start-exam-title]").text(t("exams.startPage.notFoundTitle", null, "Không tìm thấy bài thi"));
      $("[data-start-exam-subtitle]").text(t("exams.startPage.notFoundDesc", null, "Bài thi yêu cầu không tồn tại trong dữ liệu mô phỏng."));
      $("[data-start-exam-action='start']").prop("disabled", true);
      $("#startExamRules").html(
        '<div class="app-empty-state start-exam-empty start-exam-reveal is-visible" data-start-exam-reveal>' +
          '<div class="image-slot image-slot-md image-slot-exam u-mb-4" data-image-label="Exam not found"><img src="/images/placeholders/exam-placeholder.svg" alt="" aria-hidden="true"></div>' +
          '<h3 class="app-empty-title">' + t("exams.startPage.notFoundTitle", null, "Không tìm thấy bài thi") + '</h3>' +
          '<p class="app-empty-copy">' + t("exams.startPage.notFoundCopy", null, "Quay lại danh sách bài thi và chọn bài thi khác.") + '</p>' +
        '</div>'
      );
      return;
    }

    const canStart = state.exam.status === "Published";

    $("[data-start-exam-title]").text(state.exam.name);
    $("[data-start-exam-subtitle]").text(t("exams.startPage.readySubtitle", null, "Sẵn sàng làm bài khi bạn đã chuẩn bị xong."));
    $("[data-start-exam-status]").text(getStatusLabel(state.exam.status)).toggleClass("app-badge-muted", !canStart).toggleClass("app-badge-success", canStart);
    $("[data-start-exam-summary='duration']").text(t("exams.startPage.durationMinutes", { minutes: state.exam.durationMinutes }, state.exam.durationMinutes + " phút"));
    $("[data-start-exam-summary='passScore']").text(state.exam.passScore + "/100");
    $("[data-start-exam-summary='questions']").text(state.exam.questionCount);
    $("[data-start-exam-summary='review']").text(getReviewLabel(state.exam.reviewMode));
    $("[data-start-exam-action='start']").prop("disabled", !canStart);
    renderRules();
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
      this.style.setProperty("--reveal-delay", Math.min(index * 60, 300) + "ms");
      $(this).attr("data-start-exam-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function bindEvents() {
    $(document).on("click", "[data-start-exam-action='start']", function () {
      const button = this;
      if (!state.exam || state.exam.status !== "Published") {
        showToast(
          "warning",
          t("exams.startPage.toastUnavailableTitle", null, "Bài thi chưa sẵn sàng"),
          t("exams.startPage.toastUnavailableMessage", null, "Chỉ bài thi đã xuất bản mới có thể bắt đầu làm.")
        );
        return;
      }

      if (Lms.storage) {
        Lms.storage.set(sessionKey, {
          examId: state.exam.id,
          startedAt: new Date().toISOString(),
          durationMinutes: state.exam.durationMinutes,
          answers: {},
          marked: []
        });
      }

      if (Lms.ui && Lms.ui.setButtonLoading) {
        Lms.ui.setButtonLoading(button);
      }

      window.location.href = "/Exams/Take/" + state.exam.id;
    });

    $(document).on("lms:i18n:changed", render);
  }

  function init() {
    state.examId = Number($("[data-student-start-exam-id]").data("student-start-exam-id"));
    bindEvents();
    initStartExamReveal();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    Lms.apiClient.get("exams.json").done(function (response) {
      state.exam = getItems(response).find(function (exam) {
        return exam.id === state.examId;
      }) || null;
      render();
    }).fail(function () {
      showToast(
        "error",
        t("exams.startPage.toastLoadErrorTitle", null, "Lỗi tải dữ liệu"),
        t("exams.startPage.toastLoadErrorMessage", null, "Không thể tải dữ liệu bài thi.")
      );
      render();
    });
  }

  $(init);
})(window, jQuery);
