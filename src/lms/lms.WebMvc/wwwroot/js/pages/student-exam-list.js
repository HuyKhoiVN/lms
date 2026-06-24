(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  let cachedExams = [];

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

  function getStatusClass(status) {
    return status === "Published" ? "lms-status-warning" : "lms-status-muted";
  }

  function getStatusLabel(status) {
    return status === "Published"
      ? t("exams.studentListPage.statusPublished", null, "Đang mở")
      : t("exams.studentListPage.statusUnavailable", null, "Chưa khả dụng");
  }

  function getReviewLabel(reviewMode) {
    const labels = {
      FULL_REVIEW: t("exams.studentListPage.reviewFull", null, "Xem toàn bộ"),
      RESULT_ONLY: t("exams.studentListPage.reviewResultOnly", null, "Chỉ xem kết quả"),
      ANSWER_ONLY: t("exams.studentListPage.reviewAnswerOnly", null, "Chỉ xem đáp án"),
      NO_REVIEW: t("exams.studentListPage.reviewNo", null, "Không cho xem lại")
    };

    return labels[reviewMode] || reviewMode;
  }

  function renderAttention(exams) {
    const actionableExam = exams.find(function (exam) {
      return exam.status === "Published";
    }) || exams[0];

    if (!actionableExam) {
      $("[data-student-exam-attention-title]").text(t("exams.studentListPage.noExamsTitle", null, "Hiện chưa có bài thi được giao."));
      $("[data-student-exam-attention-copy]").text(t("exams.studentListPage.noExamsCopy", null, "Các bài thi được giao sẽ xuất hiện ở đây."));
      $("[data-student-exam-attention-duration]").text("--");
      $("[data-student-exam-attention-score]").text("--");
      $("[data-student-exam-attention-status]").text(t("exams.studentListPage.statusUnavailable", null, "Chưa khả dụng"));
      $("[data-student-exam-attention-review]").text("--");
      $("[data-student-exam-attention-questions]").text("--");
      $("[data-student-exam-attention-link]").addClass("is-disabled").attr("aria-disabled", "true").attr("href", "#");
      return;
    }

    $("[data-student-exam-attention-title]").text(actionableExam.name);
    $("[data-student-exam-attention-copy]").text(
      actionableExam.status === "Published"
        ? t("exams.studentListPage.onlyPublishedSubtitle", null, "Chỉ bài thi đã xuất bản mới có thể bắt đầu làm.")
        : t("exams.studentListPage.statusUnavailable", null, "Bài thi này chưa khả dụng để bắt đầu.")
    );
    $("[data-student-exam-attention-duration]").text(
      t("exams.studentListPage.metaDuration", { minutes: actionableExam.durationMinutes }, actionableExam.durationMinutes + " phút")
    );
    $("[data-student-exam-attention-score]").text(
      t("exams.studentListPage.metaPassScore", { score: actionableExam.passScore }, "Điểm đạt " + actionableExam.passScore)
    );
    $("[data-student-exam-attention-status]")
      .removeClass("lms-status-warning lms-status-muted")
      .addClass(getStatusClass(actionableExam.status))
      .text(getStatusLabel(actionableExam.status));
    $("[data-student-exam-attention-review]").text(getReviewLabel(actionableExam.reviewMode));
    $("[data-student-exam-attention-questions]").text(actionableExam.questionCount);
    $("[data-student-exam-attention-link]")
      .attr("href", actionableExam.status === "Published" ? "/Exams/Start/" + actionableExam.id : "/Exams")
      .text(actionableExam.status === "Published"
        ? t("exams.studentListPage.buttonStart", null, "Bắt đầu")
        : t("exams.studentListPage.buttonUnavailable", null, "Không khả dụng"));
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
    const canStart = exam.status === "Published";

    return (
      '<article class="student-exam-row student-exam-list-reveal" data-exam-list-reveal>' +
        '<div class="student-exam-row-main">' +
          "<h3>" + escapeHtml(exam.name) + "</h3>" +
          "<p>" + escapeHtml(getReviewLabel(exam.reviewMode)) + "</p>" +
        "</div>" +
        '<div class="student-exam-row-stat">' +
          '<span>' + escapeHtml(t("exams.studentListPage.durationLabel", null, "Thời lượng")) + "</span>" +
          "<strong>" + escapeHtml(exam.durationMinutes + " phút") + "</strong>" +
        "</div>" +
        '<div class="student-exam-row-stat">' +
          '<span>' + escapeHtml(t("exams.studentListPage.passScoreLabel", null, "Điểm đạt")) + "</span>" +
          "<strong>" + escapeHtml(String(exam.passScore)) + "</strong>" +
        "</div>" +
        '<div class="student-exam-row-stat">' +
          '<span>' + escapeHtml(t("exams.studentListPage.questionsLabel", null, "Số câu hỏi")) + "</span>" +
          "<strong>" + escapeHtml(String(exam.questionCount)) + "</strong>" +
        "</div>" +
        '<div class="student-exam-row-action">' +
          '<span class="' + getStatusClass(exam.status) + '">' + escapeHtml(getStatusLabel(exam.status)) + "</span>" +
          (canStart
            ? '<a class="app-button app-button-primary" href="/Exams/Start/' + exam.id + '">' + escapeHtml(t("exams.studentListPage.buttonStart", null, "Bắt đầu")) + "</a>"
            : '<button class="app-button app-button-secondary" type="button" disabled>' + escapeHtml(t("exams.studentListPage.buttonUnavailable", null, "Không khả dụng")) + "</button>") +
        "</div>" +
      "</article>"
    );
  }

  function renderExams(exams) {
    const $grid = $("#studentExamGrid").empty();
    const assignedCount = exams.length;

    renderAttention(exams);
    $("[data-student-exam-count]").text(
      t("exams.studentListPage.records", { count: assignedCount }, assignedCount + " bài thi")
    );

    if (!exams.length) {
      $grid.html(renderEmptyState());
      return;
    }

    $grid.html(exams.map(renderExamRow).join(""));
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

  function loadPageData() {
    if (!Lms.apiClient) {
      $("#studentExamGrid").html(renderEmptyState());
      return;
    }

    Lms.apiClient.get("exams.json").done(function (response) {
      cachedExams = getItems(response);
      renderExams(cachedExams);
    }).fail(function () {
      $("#studentExamGrid").html(
        '<div class="lms-empty-compact student-exam-empty student-exam-list-reveal is-visible" data-exam-list-reveal>' +
          '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>' +
          '<h3>' + escapeHtml(t("exams.studentListPage.loadErrorTitle", null, "Không thể tải bài thi")) + "</h3>" +
          '<p>' + escapeHtml(t("exams.studentListPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/exams.json.")) + "</p>" +
        "</div>"
      );
      initExamListReveal();
    });
  }

  function init() {
    initExamListReveal();

    $(document).on("lms:i18n:changed", function () {
      renderExams(cachedExams);
    });

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }

    loadPageData();
  }

  $(init);
})(window, jQuery);
