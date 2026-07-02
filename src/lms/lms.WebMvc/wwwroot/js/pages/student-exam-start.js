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
      FullReview: t("exams.startPage.reviewFull", null, "Xem toan bo"),
      ResultOnly: t("exams.startPage.reviewResultOnly", null, "Chi xem ket qua"),
      AnswerOnly: t("exams.startPage.reviewAnswerOnly", null, "Chi xem dap an"),
      NoReview: t("exams.startPage.reviewNo", null, "Khong cho xem lai")
    };

    return labels[normalizeReviewMode(reviewMode)] || reviewMode;
  }

  function getStatusLabel(isPublished) {
    return isPublished
      ? t("exams.startPage.statusPublished", null, "San sang")
      : t("exams.startPage.statusDraft", null, "Ban nhap");
  }

  function renderRuleList() {
    const rules = [
      t("exams.startPage.rule1", null, "Khong tai lai trang hoac dong trinh duyet trong khi lam bai."),
      t("exams.startPage.rule2", null, "Nop bai truoc khi thoi gian dem nguoc tro ve khong."),
      t("exams.startPage.rule3", null, "Dap an dung chi duoc hien thi sau khi nop bai va tuy thuoc vao chinh sach xem lai."),
      t("exams.startPage.rule4", null, "He thong co the tu dong luu dap an trong qua trinh lam bai.")
    ];
    const icons = ["bi-wifi-off", "bi-hourglass-split", "bi-eye", "bi-save"];

    $("#startExamRules").html(rules.map(function (rule, index) {
      return (
        '<div class="student-exam-rule-item student-exam-start-reveal" data-start-exam-reveal>' +
          '<span class="student-exam-rule-icon" aria-hidden="true"><i class="bi ' + icons[index % icons.length] + '"></i></span>' +
          "<div>" +
            '<span class="lms-status-info">' + escapeHtml(t("exams.startPage.badgeRule", null, "Quy dinh")) + "</span>" +
            '<p style="margin: 12px 0 0; color: var(--color-text-secondary);">' + escapeHtml(rule) + "</p>" +
          "</div>" +
        "</div>"
      );
    }).join(""));
  }

  function renderNotFound(message) {
    $("[data-start-exam-title]").text(t("exams.startPage.notFoundTitle", null, "Khong tim thay bai thi"));
    $("[data-start-exam-subtitle]").text(message || t("exams.startPage.notFoundDesc", null, "Bai thi yeu cau khong ton tai hoac ban khong co quyen truy cap."));
    $("[data-start-exam-action='start']").prop("disabled", true);
    $("#startExamRules").html(
      '<div class="lms-empty-compact student-exam-start-reveal is-visible" data-start-exam-reveal>' +
        '<i class="bi bi-journal-x" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("exams.startPage.notFoundTitle", null, "Khong tim thay bai thi")) + "</h3>" +
        '<p>' + escapeHtml(message || t("exams.startPage.notFoundCopy", null, "Quay lai danh sach bai thi va chon bai thi khac.")) + "</p>" +
      "</div>"
    );
  }

  function render() {
    if (!state.exam) {
      renderNotFound();
      return;
    }

    const canStart = Boolean(state.exam.isPublished);
    const reviewLabel = getReviewLabel(state.exam.reviewMode);

    $("[data-start-exam-title]").text(state.exam.name);
    $("[data-start-exam-subtitle]").text(t("exams.startPage.readySubtitle", null, "San sang lam bai khi ban da chuan bi xong."));
    $("[data-start-exam-status]")
      .removeClass("lms-status-success lms-status-muted")
      .addClass(canStart ? "lms-status-success" : "lms-status-muted")
      .text(getStatusLabel(state.exam.isPublished));
    $("[data-start-exam-summary='duration']").text(
      t("exams.startPage.durationMinutes", { minutes: state.exam.durationMinutes }, state.exam.durationMinutes + " phut")
    );
    $("[data-start-exam-summary='passScore']").text(state.exam.passScore + "/100");
    $("[data-start-exam-summary='questions']").text(state.exam.questions ? state.exam.questions.length : 0);
    $("[data-start-exam-summary='review']").text(reviewLabel);
    $("[data-start-exam-readiness-status]").text(getStatusLabel(state.exam.isPublished));
    $("[data-start-exam-readiness-review]").text(reviewLabel);
    $("[data-start-exam-readiness-action]").text(
      canStart
        ? t("exams.startPage.readySubtitle", null, "San sang lam bai khi ban da chuan bi xong.")
        : t("exams.startPage.toastUnavailableMessage", null, "Chi bai thi da xuat ban moi co the bat dau lam.")
    );
    $("[data-start-exam-action='start']").prop("disabled", !canStart);

    renderRuleList();
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
      this.style.setProperty("--reveal-delay", Math.min(index * 55, 220) + "ms");
      $(this).attr("data-start-exam-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function bindEvents() {
    $(document).on("click", "[data-start-exam-action='start']", function () {
      const button = this;

      if (!state.exam || !state.exam.isPublished) {
        showToast(
          "warning",
          t("exams.startPage.toastUnavailableTitle", null, "Bai thi chua san sang"),
          t("exams.startPage.toastUnavailableMessage", null, "Chi bai thi da xuat ban moi co the bat dau lam.")
        );
        return;
      }

      if (Lms.ui && Lms.ui.setButtonLoading) {
        Lms.ui.setButtonLoading(button);
      }

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
        if (Lms.ui && Lms.ui.clearButtonLoading) {
          Lms.ui.clearButtonLoading(button);
        }
        showToast("error", t("exams.startPage.toastStartErrorTitle", null, "Khong the bat dau bai thi"), error && error.message ? error.message : t("exams.startPage.toastStartErrorMessage", null, "Vui long thu lai."));
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
        t("exams.startPage.toastLoadErrorTitle", null, "Loi tai du lieu"),
        error && error.message ? error.message : t("exams.startPage.toastLoadErrorMessage", null, "Khong the tai du lieu bai thi.")
      );
      renderNotFound(error && error.message ? error.message : null);
    });
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

  $(init);
})(window, jQuery);
