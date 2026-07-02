(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    courseId: 0,
    course: null,
    materials: [],
    progress: null,
    courseExams: []
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

  function getItems(response) {
    const data = getData(response);
    if (Array.isArray(data)) {
      return data;
    }
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

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function getMaterialProgress(materialId) {
    const details = state.progress && Array.isArray(state.progress.details) ? state.progress.details : [];
    return details.find(function (item) {
      return Number(item.learningMaterialId) === Number(materialId);
    }) || null;
  }

  function setPrimaryLink() {
    const firstIncomplete = state.materials.find(function (material) {
      const progress = getMaterialProgress(material.id);
      return !(progress && progress.isCompleted);
    }) || state.materials[0];

    const $link = $("[data-student-course-detail-primary-link]");
    if (!firstIncomplete) {
      $link.addClass("is-disabled").attr("aria-disabled", "true").attr("href", "#");
      return;
    }

    $link
      .removeClass("is-disabled")
      .removeAttr("aria-disabled")
      .attr("href", "/LearningMaterials/Viewer/" + firstIncomplete.id)
      .text(t("courses.detailStudentPage.continueLearning", null, "Tiếp tục học"));
  }

  function renderHeader() {
    const courseName = state.course ? state.course.name : t("courses.detailStudentPage.notFoundTitle", null, "Không tìm thấy khóa học");
    const courseDescription = state.course
      ? (state.course.description || state.course.code || "")
      : t("courses.detailStudentPage.notFoundCopy", null, "Khóa học được yêu cầu không tồn tại hoặc bạn chưa được cấp quyền.");

    document.title = courseName + " - " + t("common.appName", null, "lms");
    $("[data-student-course-detail-name]").text(courseName);
    $("[data-student-course-detail-description]").text(courseDescription);
    $("[data-student-course-detail-focus-title]").text(courseName);
    $("[data-student-course-detail-focus-copy]").text(courseDescription);
    $("[data-student-course-detail-status]").text(
      state.course && state.course.isPublished
        ? t("courses.detailStudentPage.statusPublished", null, "Đang học")
        : t("courses.detailStudentPage.statusDraft", null, "Chưa mở")
    );
  }

  function renderMetrics() {
    const totalMaterials = Number(state.progress && state.progress.totalMaterials || state.materials.length || 0);
    const completedMaterials = Number(state.progress && state.progress.completedMaterials || 0);
    const progressPercent = Math.round(Number(state.progress && state.progress.overallPercent || 0));

    $("[data-student-course-detail-metric='progress']").text(progressPercent + "%");
    $("[data-student-course-detail-metric='completed']").text(completedMaterials + "/" + totalMaterials);
    $("[data-student-course-detail-metric='materials']").text(totalMaterials);
    $("[data-student-course-detail-metric='exams']").text(state.courseExams.length);
    $("[data-student-course-detail-progress-bar]").css("width", Math.max(0, Math.min(100, progressPercent)) + "%");
    $("[data-student-course-detail-progress-text]").text(
      t("courses.detailStudentPage.progressValue", { percent: progressPercent }, progressPercent + "% hoàn thành")
    );
    $("[data-student-course-detail-count='materials']").text(
      t("courses.detailStudentPage.materialCount", { count: state.materials.length }, state.materials.length + " tài liệu")
    );
    $("[data-student-course-detail-count='exams']").text(
      t("courses.detailStudentPage.examCount", { count: state.courseExams.length }, state.courseExams.length + " bài thi")
    );
  }

  function getTypeBadge(contentType) {
    if (contentType === "Pdf") {
      return "lms-status-danger";
    }
    if (contentType === "File") {
      return "lms-status-warning";
    }
    if (contentType === "Link") {
      return "lms-status-info";
    }
    return "lms-status-success";
  }

  function getTypeLabel(contentType) {
    const labels = {
      Text: t("materials.studentListPage.typeText", null, "Văn bản"),
      Pdf: t("materials.studentListPage.typePdf", null, "PDF"),
      File: t("materials.studentListPage.typeFile", null, "Tệp tin"),
      Link: t("materials.studentListPage.typeLink", null, "Liên kết")
    };
    return labels[contentType] || contentType || "--";
  }

  function renderMaterials() {
    const $container = $("#studentCourseDetailMaterials").empty();

    if (!state.materials.length) {
      $container.html(
        '<div class="lms-empty-compact">' +
          '<i class="bi bi-folder2-open" aria-hidden="true"></i>' +
          "<h3>" + escapeHtml(t("courses.detailStudentPage.noMaterialsTitle", null, "Chưa có tài liệu")) + "</h3>" +
          "<p>" + escapeHtml(t("courses.detailStudentPage.noMaterialsCopy", null, "Tài liệu của khóa học sẽ hiển thị tại đây khi được công bố.")) + "</p>" +
        "</div>"
      );
      return;
    }

    state.materials.forEach(function (material) {
      const progress = getMaterialProgress(material.id);
      const percent = Math.round(Number(progress && progress.progressPercent || 0));
      const completed = Boolean(progress && progress.isCompleted);
      const statusText = completed
        ? t("courses.detailStudentPage.materialCompleted", null, "Đã hoàn thành")
        : percent > 0
          ? t("courses.detailStudentPage.materialInProgress", null, "Đang học")
          : t("courses.detailStudentPage.materialNotStarted", null, "Chưa bắt đầu");
      const actionText = completed
        ? t("courses.detailStudentPage.reviewMaterial", null, "Xem lại")
        : t("courses.detailStudentPage.openMaterial", null, "Mở học liệu");

      $container.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">' + escapeHtml(String(material.contentType || "T").charAt(0).toUpperCase()) + "</span>" +
            "<div>" +
              "<strong>" + escapeHtml(material.title) + "</strong>" +
              "<span>" + escapeHtml(statusText + " / " + percent + "%") + "</span>" +
            "</div>" +
          "</div>" +
          '<span class="' + getTypeBadge(material.contentType) + '">' + escapeHtml(getTypeLabel(material.contentType)) + "</span>" +
          '<a class="app-button app-button-primary" href="/LearningMaterials/Viewer/' + material.id + '">' + escapeHtml(actionText) + "</a>" +
        "</div>"
      );
    });
  }

  function renderExams() {
    const $container = $("#studentCourseDetailExams").empty();

    if (!state.courseExams.length) {
      $container.html(
        '<div class="lms-empty-compact">' +
          '<i class="bi bi-journal-x" aria-hidden="true"></i>' +
          "<h3>" + escapeHtml(t("courses.detailStudentPage.noExamsTitle", null, "Chưa có bài thi")) + "</h3>" +
          "<p>" + escapeHtml(t("courses.detailStudentPage.noExamsCopy", null, "Bài thi liên quan tới khóa học sẽ hiển thị tại đây.")) + "</p>" +
        "</div>"
      );
      return;
    }

    state.courseExams.forEach(function (item) {
      $container.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">E</span>' +
            "<div>" +
              "<strong>" + escapeHtml(item.examName || ("Exam #" + item.examId)) + "</strong>" +
              "<span>" + escapeHtml(t("courses.detailStudentPage.examOrder", { order: item.order || 0 }, "Thứ tự " + (item.order || 0))) + "</span>" +
            "</div>" +
          "</div>" +
          '<a class="app-button app-button-primary" href="/Exams/Start/' + item.examId + '">' + escapeHtml(t("courses.detailStudentPage.startExam", null, "Làm bài")) + "</a>" +
        "</div>"
      );
    });
  }

  function render() {
    renderHeader();
    renderMetrics();
    renderMaterials();
    renderExams();
    setPrimaryLink();
    initReveal();
  }

  function renderLoadError(message) {
    $("#studentCourseDetailMaterials, #studentCourseDetailExams").html(
      '<div class="lms-empty-compact">' +
        '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>' +
        "<h3>" + escapeHtml(t("courses.detailStudentPage.loadErrorTitle", null, "Không thể tải khóa học")) + "</h3>" +
        "<p>" + escapeHtml(message || t("courses.detailStudentPage.loadErrorCopy", null, "Vui lòng kiểm tra kết nối API và quyền truy cập khóa học.")) + "</p>" +
      "</div>"
    );
  }

  function initReveal() {
    const $items = $("[data-student-course-reveal]").not("[data-student-course-reveal-ready]");
    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-student-course-reveal-ready", "true");
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
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    $items.each(function (index) {
      this.style.setProperty("--reveal-delay", Math.min(index * 45, 220) + "ms");
      $(this).attr("data-student-course-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function loadPageData() {
    state.courseId = Number($("[data-student-course-detail-id]").data("student-course-detail-id"));

    $.when(
      Lms.apiClient.get("api/courses/" + state.courseId),
      Lms.apiClient.get("api/learning-materials?page=1&pageSize=500&courseId=" + state.courseId),
      Lms.apiClient.get("api/courses/" + state.courseId + "/progress"),
      Lms.apiClient.get("api/courses/" + state.courseId + "/exams")
    ).done(function (courseResponse, materialsResponse, progressResponse, courseExamsResponse) {
      state.course = getData(courseResponse);
      state.materials = getItems(materialsResponse).sort(function (a, b) {
        return Number(a.order || 0) - Number(b.order || 0);
      });
      state.progress = getData(progressResponse);
      state.courseExams = getItems(courseExamsResponse);
      render();
    }).fail(function (error) {
      const message = error && error.message ? error.message : null;
      renderLoadError(message);
      showToast(
        "error",
        t("courses.detailStudentPage.dataErrorTitle", null, "Lỗi dữ liệu khóa học"),
        message || t("courses.detailStudentPage.dataErrorMessage", null, "Không thể tải dữ liệu chi tiết khóa học từ backend.")
      );
    });
  }

  function init() {
    initReveal();
    $(document).on("lms:i18n:changed", render);

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }

    loadPageData();
  }

  $(init);
})(window, jQuery);
