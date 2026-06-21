(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const progressKey = "lms.student.materialProgress";
  const state = {
    materialId: 0,
    material: null,
    course: null
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

  function getViewerImage(type) {
    const images = {
      Text: "/images/reading-library.jpg",
      Pdf: "/images/online-learning-banner.jpg",
      File: "/images/study-collaboration.jpg",
      Link: "/images/online-tutor-lesson.jpg"
    };

    return images[type] || "/images/placeholders/material-placeholder.svg";
  }

  function getViewerImageLabel(type) {
    const labels = {
      Text: "Text lesson preview 520x292",
      Pdf: "PDF preview 520x292",
      File: "Downloadable file preview 520x292",
      Link: "External learning link preview 520x292"
    };

    return labels[type] || "Material preview 520x292";
  }

  function renderViewerImage(type) {
    return (
      '<div class="image-slot image-slot-lg image-slot-material material-viewer-preview" data-image-label="' + getViewerImageLabel(type) + '">' +
        '<img src="' + getViewerImage(type) + '" alt="" aria-hidden="true" />' +
      '</div>'
    );
  }

  function getProgress() {
    return Lms.storage ? Lms.storage.get(progressKey, {}) : {};
  }

  function saveProgress(progress) {
    if (Lms.storage) {
      Lms.storage.set(progressKey, progress);
    }
  }

  function isComplete() {
    return Boolean(getProgress()[state.materialId]);
  }

  function getTypeBadgeClass(type) {
    if (type === "Pdf") {
      return "app-badge-danger";
    }

    if (type === "File") {
      return "app-badge-warning";
    }

    if (type === "Link") {
      return "app-badge-info";
    }

    return "app-badge-success";
  }

  function getContentTypeLabel(type) {
    const labels = {
      Text: t("materials.viewerPage.typeText", null, "Văn bản"),
      Pdf: t("materials.viewerPage.typePdf", null, "PDF"),
      File: t("materials.viewerPage.typeFile", null, "Tệp tin"),
      Link: t("materials.viewerPage.typeLink", null, "Liên kết")
    };
    return labels[type] || type;
  }

  function renderTextViewer() {
    return (
      '<article class="material-reader">' +
        renderViewerImage("Text") +
        '<h3>' + t("materials.viewerPage.textViewOverviewTitle", null, "Tổng quan") + '</h3>' +
        '<p>' + t("materials.viewerPage.textViewOverviewDesc", { title: escapeHtml(state.material.title) }, "Bài học văn bản này tóm tắt các ý chính từ <strong>" + escapeHtml(state.material.title) + "</strong>. Trong giai đoạn API, khu vực này sẽ hiển thị nội dung bài học thực tế từ backend.") + '</p>' +
        '<h3>' + t("materials.viewerPage.textViewPointsTitle", null, "Điểm cốt lõi") + '</h3>' +
        '<ul>' +
          '<li>' + t("materials.viewerPage.textViewPoint1", null, "Xem lại mục tiêu của khóa học được giao.") + '</li>' +
          '<li>' + t("materials.viewerPage.textViewPoint2", null, "Hiểu rõ chính sách, quy trình hoặc danh sách kiểm tra được mô tả trong tài liệu.") + '</li>' +
          '<li>' + t("materials.viewerPage.textViewPoint3", null, "Sử dụng hành động hoàn thành khi bạn đọc xong.") + '</li>' +
        '</ul>' +
      '</article>'
    );
  }

  function renderPdfViewer() {
    return (
      '<div class="material-placeholder material-placeholder-pdf">' +
        renderViewerImage("Pdf") +
        '<div class="app-empty-icon" aria-hidden="true">PDF</div>' +
        '<h3>' + t("materials.viewerPage.pdfPlaceholderTitle", null, "Trình xem trước PDF mô phỏng") + '</h3>' +
        '<p>' + t("materials.viewerPage.pdfPlaceholderDesc", null, "Trình xem PDF thực tế sẽ được kết nối khi có tích hợp lưu trữ tệp tin/API.") + '</p>' +
        '<button class="app-button app-button-secondary" type="button" data-material-viewer-action="download">' + t("materials.viewerPage.buttonDownloadPlaceholder", null, "Tải xuống tài liệu mẫu") + '</button>' +
      '</div>'
    );
  }

  function renderFileViewer() {
    return (
      '<div class="material-placeholder">' +
        renderViewerImage("File") +
        '<div class="app-empty-icon" aria-hidden="true">FILE</div>' +
        '<h3>' + t("materials.viewerPage.filePlaceholderTitle", null, "Tài liệu tệp tin") + '</h3>' +
        '<p>' + t("materials.viewerPage.filePlaceholderDesc", null, "Mục này đại diện cho một danh sách kiểm tra hoặc tài liệu phát tay có thể tải xuống kèm theo khóa học.") + '</p>' +
        '<button class="app-button app-button-secondary" type="button" data-material-viewer-action="download">' + t("materials.viewerPage.buttonDownloadPlaceholder", null, "Tải xuống tài liệu mẫu") + '</button>' +
      '</div>'
    );
  }

  function renderLinkViewer() {
    return (
      '<div class="material-placeholder">' +
        renderViewerImage("Link") +
        '<div class="app-empty-icon" aria-hidden="true">URL</div>' +
        '<h3>' + t("materials.viewerPage.linkPlaceholderTitle", null, "Tài liệu liên kết bên ngoài") + '</h3>' +
        '<p>' + t("materials.viewerPage.linkPlaceholderDesc", null, "Mục này sẽ mở một tài nguyên bên ngoài sau khi các liên kết được cung cấp bởi backend.") + '</p>' +
        '<button class="app-button app-button-secondary" type="button" data-material-viewer-action="open-link">' + t("materials.viewerPage.buttonOpenLinkPlaceholder", null, "Mở liên kết mẫu") + '</button>' +
      '</div>'
    );
  }

  function renderContent() {
    if (state.material.contentType === "Pdf") {
      return renderPdfViewer();
    }

    if (state.material.contentType === "File") {
      return renderFileViewer();
    }

    if (state.material.contentType === "Link") {
      return renderLinkViewer();
    }

    return renderTextViewer();
  }

  function render() {
    if (!state.material) {
      $("[data-material-viewer-title]").text(t("materials.viewerPage.notFoundTitle", null, "Không tìm thấy tài liệu"));
      $("[data-material-viewer-course]").text(t("materials.viewerPage.notFoundDesc", null, "Tài liệu yêu cầu không tồn tại trong dữ liệu mô phỏng."));
      $("#materialViewerContent").html(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">!</div>' +
          '<h3 class="app-empty-title">' + t("materials.viewerPage.notFoundTitle", null, "Không tìm thấy tài liệu") + '</h3>' +
          '<p class="app-empty-copy">' + t("materials.viewerPage.notFoundCopy", null, "Quay lại trang tài liệu và chọn một mục khác.") + '</p>' +
        '</div>'
      );
      return;
    }

    const courseName = state.course ? state.course.name : t("materials.viewerPage.unknownCourse", null, "Khóa học không xác định");
    const complete = isComplete();

    $("[data-material-viewer-title]").text(state.material.title);
    $("[data-material-viewer-course]").text(courseName);
    $("[data-material-viewer-heading]").text(state.material.title);
    $("[data-material-viewer-subtitle]").text(courseName + " / " + t("materials.viewerPage.durationMinutes", { minutes: state.material.durationMinutes }, state.material.durationMinutes + " phút"));
    $("[data-material-viewer-type]")
      .removeClass("app-badge-success app-badge-danger app-badge-warning app-badge-info")
      .addClass(getTypeBadgeClass(state.material.contentType))
      .text(getContentTypeLabel(state.material.contentType));
    $("[data-material-viewer-progress-status]").text(complete ? t("materials.viewerPage.statusCompleted", null, "Đã hoàn thành") : t("materials.viewerPage.statusInProgress", null, "Đang tiến hành"));
    $("[data-material-viewer-duration]").text(t("materials.viewerPage.durationMinutes", { minutes: state.material.durationMinutes }, state.material.durationMinutes + " phút"));
    $("[data-material-viewer-course-name]").text(courseName);
    $("[data-material-viewer-action='complete']").text(complete ? t("materials.viewerPage.statusCompleted", null, "Đã hoàn thành") : t("materials.viewerPage.buttonComplete", null, "Đánh dấu hoàn thành"));
    $("[data-material-viewer-progress-percent]").text(complete ? "100%" : "35%");
    $("[data-material-viewer-progress-ring]")
      .toggleClass("is-complete", complete)
      .css("--progress", complete ? "100%" : "35%");
    $("#materialViewerContent").html(renderContent());
  }

  function bindEvents() {
    $(document).on("click", "[data-material-viewer-action='complete']", function () {
      if (!state.material) {
        return;
      }

      const progress = getProgress();
      progress[state.materialId] = {
        completed: true,
        completedAt: new Date().toISOString()
      };
      saveProgress(progress);
      render();
      showToast(
        "success",
        t("materials.viewerPage.toastProgressSavedTitle", null, "Đã lưu tiến trình"),
        t("materials.viewerPage.toastProgressSavedMessage", { title: state.material.title }, state.material.title + " đã được đánh dấu hoàn thành.")
      );
    });

    $(document).on("click", "[data-material-viewer-action='save-note']", function () {
      showToast(
        "info",
        t("materials.viewerPage.toastNoteSavedTitle", null, "Đã lưu ghi chú"),
        t("materials.viewerPage.toastNoteSavedMessage", null, "Ghi chú sẽ được kết nối với tiến trình của học viên ở giai đoạn sau.")
      );
    });

    $(document).on("click", "[data-material-viewer-action='download']", function () {
      showToast(
        "info",
        t("materials.viewerPage.toastDownloadTitle", null, "Tải xuống mẫu"),
        t("materials.viewerPage.toastDownloadMessage", null, "Tải xuống tệp tin sẽ khả dụng sau khi tích hợp bộ lưu trữ.")
      );
    });

    $(document).on("click", "[data-material-viewer-action='open-link']", function () {
      showToast(
        "info",
        t("materials.viewerPage.toastLinkTitle", null, "Liên kết mẫu"),
        t("materials.viewerPage.toastLinkMessage", null, "Các liên kết ngoài sẽ mở khi các URL tài liệu được sẵn sàng.")
      );
    });

    $(document).on("lms:i18n:changed", render);
  }

  function init() {
    state.materialId = Number($("[data-student-material-id]").data("student-material-id"));
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    $.when(
      Lms.apiClient.get("learning-materials.json"),
      Lms.apiClient.get("courses.json")
    ).done(function (materialsResponse, coursesResponse) {
      const materials = getItems(materialsResponse);
      const courses = getItems(coursesResponse);

      state.material = materials.find(function (material) {
        return material.id === state.materialId;
      });
      state.course = state.material
        ? courses.find(function (course) {
          return course.id === state.material.courseId;
        })
        : null;
      render();
    }).fail(function () {
      $("#materialViewerContent").html(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">!</div>' +
          '<h3 class="app-empty-title">' + t("materials.viewerPage.loadErrorTitle", null, "Không thể tải tài liệu") + '</h3>' +
          '<p class="app-empty-copy">' + t("materials.viewerPage.loadErrorCopy", null, "Vui lòng kiểm tra các tệp tin dữ liệu mô phỏng.") + '</p>' +
        '</div>'
      );
    });
  }

  $(init);
})(window, jQuery);
