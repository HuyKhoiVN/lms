(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  let cachedExams = [];

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

  function getResponseItems(response) {
    const data = getResponseData(response);
    return data && Array.isArray(data.items) ? data.items : [];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

  function getStatusClass(status) {
    return status === "Published" ? "lms-status-warning" : "lms-status-muted";
  }

  function getStatusLabel(status) {
    return status === "Published"
      ? t("exams.studentListPage.statusPublished", null, "Dang mo")
      : t("exams.studentListPage.statusUnavailable", null, "Chua kha dung");
  }

  function getReviewLabel(reviewMode) {
    const labels = {
      FullReview: t("exams.studentListPage.reviewFull", null, "Xem toan bo"),
      ResultOnly: t("exams.studentListPage.reviewResultOnly", null, "Chi xem ket qua"),
      AnswerOnly: t("exams.studentListPage.reviewAnswerOnly", null, "Chi xem dap an"),
      NoReview: t("exams.studentListPage.reviewNo", null, "Khong cho xem lai")
    };

    return labels[normalizeReviewMode(reviewMode)] || reviewMode;
  }

  function renderAttention(exams) {
    const actionableExam = exams.find(function (exam) {
      return exam.status === "Published";
    }) || exams[0];

    if (!actionableExam) {
      $("[data-student-exam-attention-title]").text(t("exams.studentListPage.noExamsTitle", null, "Hien chua co bai thi duoc giao."));
      $("[data-student-exam-attention-copy]").text(t("exams.studentListPage.noExamsCopy", null, "Cac bai thi duoc giao se xuat hien o day."));
      $("[data-student-exam-attention-duration]").text("--");
      $("[data-student-exam-attention-score]").text("--");
      $("[data-student-exam-attention-status]").text(t("exams.studentListPage.statusUnavailable", null, "Chua kha dung"));
      $("[data-student-exam-attention-review]").text("--");
      $("[data-student-exam-attention-questions]").text("--");
      $("[data-student-exam-attention-link]").addClass("is-disabled").attr("aria-disabled", "true").attr("href", "#");
      $("[data-student-exam-primary-link]").addClass("is-disabled").attr("aria-disabled", "true").attr("href", "#");
      return;
    }

    $("[data-student-exam-attention-title]").text(actionableExam.name);
    $("[data-student-exam-attention-copy]").text(
      actionableExam.status === "Published"
        ? t("exams.studentListPage.onlyPublishedSubtitle", null, "Chi bai thi da xuat ban moi co the bat dau lam.")
        : t("exams.studentListPage.statusUnavailable", null, "Bai thi nay chua kha dung de bat dau.")
    );
    $("[data-student-exam-attention-duration]").text(
      t("exams.studentListPage.metaDuration", { minutes: actionableExam.durationMinutes }, actionableExam.durationMinutes + " phut")
    );
    $("[data-student-exam-attention-score]").text(
      t("exams.studentListPage.metaPassScore", { score: actionableExam.passScore }, "Diem dat " + actionableExam.passScore)
    );
    $("[data-student-exam-attention-status]")
      .removeClass("lms-status-warning lms-status-muted")
      .addClass(getStatusClass(actionableExam.status))
      .text(getStatusLabel(actionableExam.status));
    $("[data-student-exam-attention-review]").text(getReviewLabel(actionableExam.reviewMode));
    $("[data-student-exam-attention-questions]").text(actionableExam.questionCount);
    $("[data-student-exam-attention-link]")
      .toggleClass("is-disabled", actionableExam.status !== "Published")
      .attr("aria-disabled", actionableExam.status === "Published" ? null : "true")
      .attr("href", actionableExam.status === "Published" ? "/Exams/Start/" + actionableExam.id : "/Exams")
      .text(actionableExam.status === "Published"
        ? t("exams.studentListPage.buttonStart", null, "Bat dau")
        : t("exams.studentListPage.buttonUnavailable", null, "Khong kha dung"));
  }

  function renderEmptyState() {
    return (
      '<div class="lms-empty-compact student-exam-empty student-exam-list-reveal is-visible" data-exam-list-reveal>' +
        '<i class="bi bi-journal-x" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("exams.studentListPage.noExamsTitle", null, "Hien chua co bai thi duoc giao.")) + "</h3>" +
        '<p>' + escapeHtml(t("exams.studentListPage.noExamsCopy", null, "Cac bai thi duoc giao se xuat hien o day.")) + "</p>" +
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
          '<span>' + escapeHtml(t("exams.studentListPage.durationLabel", null, "Thoi luong")) + "</span>" +
          "<strong>" + escapeHtml(exam.durationMinutes + " phut") + "</strong>" +
        "</div>" +
        '<div class="student-exam-row-stat">' +
          '<span>' + escapeHtml(t("exams.studentListPage.passScoreLabel", null, "Diem dat")) + "</span>" +
          "<strong>" + escapeHtml(String(exam.passScore)) + "</strong>" +
        "</div>" +
        '<div class="student-exam-row-stat">' +
          '<span>' + escapeHtml(t("exams.studentListPage.questionsLabel", null, "So cau hoi")) + "</span>" +
          "<strong>" + escapeHtml(String(exam.questionCount)) + "</strong>" +
        "</div>" +
        '<div class="student-exam-row-action">' +
          '<span class="' + getStatusClass(exam.status) + '">' + escapeHtml(getStatusLabel(exam.status)) + "</span>" +
          (canStart
            ? '<a class="app-button app-button-primary" href="/Exams/Start/' + exam.id + '">' + escapeHtml(t("exams.studentListPage.buttonStart", null, "Bat dau")) + "</a>"
            : '<button class="app-button app-button-secondary" type="button" disabled>' + escapeHtml(t("exams.studentListPage.buttonUnavailable", null, "Khong kha dung")) + "</button>") +
        "</div>" +
      "</article>"
    );
  }

  function renderExams(exams) {
    const $grid = $("#studentExamGrid").empty();
    const assignedCount = exams.length;

    renderAttention(exams);
    $("[data-student-exam-count]").text(
      t("exams.studentListPage.records", { count: assignedCount }, assignedCount + " bai thi")
    );

    if (!exams.length) {
      $grid.html(renderEmptyState());
      return;
    }

    $grid.html(exams.map(renderExamRow).join(""));
    const firstPublished = exams.find(function (exam) {
      return exam.status === "Published";
    }) || exams[0];
    $("[data-student-exam-primary-link]")
      .toggleClass("is-disabled", !firstPublished)
      .attr("aria-disabled", firstPublished ? null : "true")
      .attr("href", firstPublished ? "/Exams/Start/" + firstPublished.id : "#");
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

    Lms.apiClient.get("api/exams?page=1&pageSize=200").done(function (response) {
      cachedExams = getResponseItems(response).map(function (item) {
        return {
          id: Number(item.id),
          name: item.name || "",
          durationMinutes: Number(item.durationMinutes || 0),
          passScore: Number(item.passScore || 0),
          questionCount: Number(item.questionCount || 0),
          reviewMode: normalizeReviewMode(item.reviewMode),
          status: item.isPublished ? "Published" : "Draft"
        };
      });
      renderExams(cachedExams);
    }).fail(function (error) {
      $("#studentExamGrid").html(
        '<div class="lms-empty-compact student-exam-empty student-exam-list-reveal is-visible" data-exam-list-reveal>' +
          '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>' +
          '<h3>' + escapeHtml(t("exams.studentListPage.loadErrorTitle", null, "Khong the tai bai thi")) + "</h3>" +
          '<p>' + escapeHtml(error && error.message ? error.message : t("exams.studentListPage.loadErrorCopy", null, "Vui long kiem tra API exams.")) + "</p>" +
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
