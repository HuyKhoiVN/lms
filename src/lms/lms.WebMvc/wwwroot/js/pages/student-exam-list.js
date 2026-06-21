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

  function getBadgeClass(status) {
    return status === "Published" ? "app-badge-success" : "app-badge-muted";
  }

  function getExamImage(index) {
    const images = [
      "/images/online-exam.jpg",
      "/images/exam-stress.jpg",
      "/images/graduation-success.jpg"
    ];

    return images[index % images.length];
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

  function getStatusLabel(status) {
    return status === "Published" ? t("exams.studentListPage.statusPublished", null, "Đang mở") : t("exams.studentListPage.statusUnavailable", null, "Không khả dụng");
  }

  function renderExams(exams) {
    const $grid = $("#studentExamGrid").empty();
    const publishedCount = exams.filter(function (exam) {
      return exam.status === "Published";
    }).length;

    $("[data-student-exam-count]").text(t("exams.studentListPage.records", { count: publishedCount }, publishedCount + " bài thi"));

    if (!exams.length) {
      $grid.append(
        '<div class="app-empty-state">' +
          '<div class="image-slot image-slot-md image-slot-exam u-mb-4" data-image-label="Empty exams illustration 320x180">' +
            '<img src="/images/placeholders/exam-placeholder.svg" alt="" aria-hidden="true" />' +
          '</div>' +
          '<h3 class="app-empty-title">' + t("exams.studentListPage.noExamsTitle", null, "Không có bài thi được giao") + '</h3>' +
          '<p class="app-empty-copy">' + t("exams.studentListPage.noExamsCopy", null, "Các bài thi được giao cho bạn sẽ xuất hiện ở đây.") + '</p>' +
        '</div>'
      );
      return;
    }

    exams.forEach(function (exam, index) {
      const canStart = exam.status === "Published";
      const cardClass = ["learning-card-safety", "learning-card-service", "learning-card-exam"][index % 3];

      $grid.append(
        '<article class="app-card learning-card student-exam-card app-card-clickable app-animate-slide-up ' + cardClass + '">' +
          '<div class="app-card-body">' +
            '<div class="image-slot image-slot-md image-slot-exam student-exam-image" data-image-label="Exam card image 320x180">' +
              '<img src="' + getExamImage(index) + '" alt="" aria-hidden="true" />' +
            '</div>' +
            '<div class="course-thumb">' +
              '<span class="course-thumb-code">EX</span>' +
              '<span class="app-badge ' + getBadgeClass(exam.status) + '">' + escapeHtml(getStatusLabel(exam.status)) + '</span>' +
            '</div>' +
            '<h3 class="app-card-title">' + escapeHtml(exam.name) + '</h3>' +
            '<p class="app-card-subtitle">' +
              t("exams.studentListPage.metaText", {
                minutes: exam.durationMinutes,
                passScore: exam.passScore,
                review: getReviewLabel(exam.reviewMode)
              }, exam.durationMinutes + " phút / điểm đạt " + exam.passScore + " / " + getReviewLabel(exam.reviewMode)) +
            '</p>' +
            '<div class="admin-summary-line u-mt-4"><span>' + t("exams.studentListPage.questionsLabel", null, "Số câu hỏi") + '</span><strong>' + escapeHtml(exam.questionCount) + '</strong></div>' +
            '<div class="admin-summary-line u-mt-4"><span>' + t("exams.studentListPage.assignedLearnersLabel", null, "Số người được giao") + '</span><strong>' + escapeHtml(exam.assignedCount) + '</strong></div>' +
          '</div>' +
          '<div class="app-card-footer">' +
            (canStart
              ? '<a class="app-button app-button-primary" href="/Exams/Start/' + exam.id + '">' + t("exams.studentListPage.buttonStart", null, "Bắt đầu") + '</a>'
              : '<button class="app-button app-button-secondary" type="button" disabled>' + t("exams.studentListPage.buttonUnavailable", null, "Không khả dụng") + '</button>') +
          '</div>' +
        '</article>'
      );
    });
  }

  function init() {
    $(document).on("lms:i18n:changed", function () {
      renderExams(cachedExams);
    });

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    Lms.apiClient.get("exams.json").done(function (response) {
      cachedExams = getItems(response);
      renderExams(cachedExams);
    }).fail(function () {
      $("#studentExamGrid").html(
        '<div class="app-empty-state">' +
          '<div class="image-slot image-slot-md image-slot-exam u-mb-4" data-image-label="Exam load error illustration 320x180">' +
            '<img src="/images/placeholders/exam-placeholder.svg" alt="" aria-hidden="true" />' +
          '</div>' +
          '<h3 class="app-empty-title">' + t("exams.studentListPage.loadErrorTitle", null, "Không thể tải bài thi") + '</h3>' +
          '<p class="app-empty-copy">' + t("exams.studentListPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/exams.json.") + '</p>' +
        '</div>'
      );
    });
  }

  $(init);
})(window, jQuery);
