(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const progressKey = "lms.student.materialProgress";
  const notesKey = "lms.student.materialNotes";
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

  function getProgress() {
    return Lms.storage ? Lms.storage.get(progressKey, {}) : {};
  }

  function saveProgress(progress) {
    if (Lms.storage) {
      Lms.storage.set(progressKey, progress);
    }
  }

  function getNotes() {
    return Lms.storage ? Lms.storage.get(notesKey, {}) : {};
  }

  function saveNotes(notes) {
    if (Lms.storage) {
      Lms.storage.set(notesKey, notes);
    }
  }

  function isComplete() {
    return Boolean(getProgress()[state.materialId]);
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

  function getTypeBadgeClass(type) {
    if (type === "Pdf") {
      return "lms-status-danger";
    }

    if (type === "File") {
      return "lms-status-warning";
    }

    if (type === "Link") {
      return "lms-status-info";
    }

    return "lms-status-success";
  }

  function getPlaceholderIconClass(type) {
    const classes = {
      Pdf: "is-pdf",
      File: "is-file",
      Link: "is-link"
    };
    return classes[type] || "is-link";
  }

  function getPlaceholderIcon(type) {
    const icons = {
      Pdf: "bi-file-earmark-pdf",
      File: "bi-paperclip",
      Link: "bi-link-45deg"
    };
    return icons[type] || "bi-file-earmark";
  }

  function renderTextViewer() {
    return (
      '<article class="material-reader">' +
        '<h3>' + escapeHtml(t("materials.viewerPage.textViewOverviewTitle", null, "Tổng quan")) + "</h3>" +
        '<p>' + escapeHtml(t("materials.viewerPage.textViewOverviewDesc", null, "Nội dung này mô phỏng bài học văn bản được giao trong hệ thống LMS nội bộ.")) + "</p>" +
        '<h3>' + escapeHtml(t("materials.viewerPage.textViewPointsTitle", null, "Điểm cần nhớ")) + "</h3>" +
        "<ul>" +
          "<li>" + escapeHtml(t("materials.viewerPage.textViewPoint1", null, "Nắm mục tiêu của tài liệu và phạm vi áp dụng.")) + "</li>" +
          "<li>" + escapeHtml(t("materials.viewerPage.textViewPoint2", null, "Liên hệ nội dung với quy trình hoặc bài thi được giao.")) + "</li>" +
          "<li>" + escapeHtml(t("materials.viewerPage.textViewPoint3", null, "Đánh dấu hoàn thành sau khi đã đọc và ghi chú xong.")) + "</li>" +
        "</ul>" +
      "</article>"
    );
  }

  function renderAttachmentViewer(type, title, copy, actionLabel, action) {
    return (
      '<div class="student-material-viewer-placeholder">' +
        '<span class="student-material-viewer-placeholder-icon ' + getPlaceholderIconClass(type) + '" aria-hidden="true">' +
          '<i class="bi ' + getPlaceholderIcon(type) + '"></i>' +
        "</span>" +
        "<div>" +
          "<h3>" + escapeHtml(title) + "</h3>" +
          "<p>" + escapeHtml(copy) + "</p>" +
        "</div>" +
        '<button class="app-button app-button-secondary" type="button" data-material-viewer-action="' + action + '">' + escapeHtml(actionLabel) + "</button>" +
      "</div>"
    );
  }

  function renderContent() {
    if (!state.material) {
      return "";
    }

    if (state.material.contentType === "Pdf") {
      return renderAttachmentViewer(
        "Pdf",
        t("materials.viewerPage.pdfPlaceholderTitle", null, "PDF Preview"),
        t("materials.viewerPage.pdfPlaceholderDesc", null, "Tài liệu PDF sẽ được hiển thị ở đây khi tích hợp lưu trữ tệp và preview backend."),
        t("materials.viewerPage.buttonDownload", null, "Tải xuống tài liệu"),
        "download"
      );
    }

    if (state.material.contentType === "File") {
      return renderAttachmentViewer(
        "File",
        t("materials.viewerPage.filePlaceholderTitle", null, "Attachment"),
        t("materials.viewerPage.filePlaceholderDesc", null, "Tài liệu đính kèm dùng cho học tập nội bộ hoặc checklist thực thi."),
        t("materials.viewerPage.buttonDownload", null, "Tải xuống tài liệu"),
        "download"
      );
    }

    if (state.material.contentType === "Link") {
      return renderAttachmentViewer(
        "Link",
        t("materials.viewerPage.linkPlaceholderTitle", null, "External Resource"),
        t("materials.viewerPage.linkPlaceholderDesc", null, "Liên kết ngoài sẽ được mở ở đây khi URL thực tế được cung cấp."),
        t("materials.viewerPage.buttonOpenLinkPlaceholder", null, "Mở liên kết"),
        "open-link"
      );
    }

    return renderTextViewer();
  }

  function renderNotFound() {
    $("[data-material-viewer-title]").text(t("materials.viewerPage.notFoundTitle", null, "Không tìm thấy tài liệu"));
    $("[data-material-viewer-course]").text(t("materials.viewerPage.notFoundDesc", null, "Tài liệu yêu cầu không tồn tại trong dữ liệu mô phỏng."));
    $("#materialViewerContent").html(
      '<div class="lms-empty-compact student-material-viewer-reveal is-visible" data-viewer-reveal>' +
        '<i class="bi bi-folder-x" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("materials.viewerPage.notFoundTitle", null, "Không tìm thấy tài liệu")) + "</h3>" +
        '<p>' + escapeHtml(t("materials.viewerPage.notFoundCopy", null, "Quay lại trang tài liệu và chọn một mục khác.")) + "</p>" +
      "</div>"
    );
  }

  function render() {
    if (!state.material) {
      renderNotFound();
      return;
    }

    const courseName = state.course ? state.course.name : t("materials.viewerPage.unknownCourse", null, "Khóa học không xác định");
    const complete = isComplete();
    const percent = complete ? "100%" : "35%";

    $("[data-material-viewer-title]").text(state.material.title);
    $("[data-material-viewer-course]").text(courseName);
    $("[data-material-viewer-heading]").text(state.material.title);
    $("[data-material-viewer-type]")
      .removeClass("lms-status-success lms-status-danger lms-status-warning lms-status-info")
      .addClass(getTypeBadgeClass(state.material.contentType))
      .text(getContentTypeLabel(state.material.contentType));
    $("[data-material-viewer-progress-status]").text(
      complete ? t("materials.viewerPage.statusCompleted", null, "Đã hoàn thành") : t("materials.viewerPage.statusInProgress", null, "Đang tiến hành")
    );
    $("[data-material-viewer-duration]").text(
      t("materials.viewerPage.durationMinutes", { minutes: state.material.durationMinutes }, state.material.durationMinutes + " phút")
    );
    $("[data-material-viewer-course-name]").text(courseName);
    $("[data-material-viewer-progress-percent]").text(percent);
    $("[data-material-viewer-progress-ring]")
      .toggleClass("is-complete", complete)
      .css("--progress", percent);
    $("[data-material-viewer-action='complete']").text(
      complete ? t("materials.viewerPage.statusCompleted", null, "Đã hoàn thành") : t("materials.viewerPage.buttonComplete", null, "Đánh dấu hoàn thành")
    );
    $("[data-material-viewer-note]").val(getNotes()[state.materialId] || "");
    $("#materialViewerContent").html(renderContent());
    initViewerReveal();
  }

  function initViewerReveal() {
    const $items = $("[data-viewer-reveal]").not("[data-viewer-reveal-ready]");

    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-viewer-reveal-ready", "true");
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
      this.style.setProperty("--reveal-delay", Math.min(index * 50, 220) + "ms");
      $(this).attr("data-viewer-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function bindEvents() {
    $(document).on("click", "[data-material-viewer-action='complete']", function () {
      if (!state.material) {
        return;
      }

      const $button = $(this);
      if (Lms.ui && Lms.ui.setButtonLoading) {
        Lms.ui.setButtonLoading($button);
      }

      const progress = getProgress();
      progress[state.materialId] = {
        completed: true,
        completedAt: new Date().toISOString()
      };
      saveProgress(progress);

      showToast(
        "success",
        t("materials.viewerPage.toastProgressSavedTitle", null, "Đã lưu tiến trình"),
        t("materials.viewerPage.toastProgressSavedMessage", { title: state.material.title }, state.material.title + " đã được đánh dấu hoàn thành.")
      );

      window.setTimeout(function () {
        if (Lms.ui && Lms.ui.clearButtonLoading) {
          Lms.ui.clearButtonLoading($button);
        }
        render();
      }, 220);
    });

    $(document).on("click", "[data-material-viewer-action='save-note']", function () {
      const notes = getNotes();
      notes[state.materialId] = $("[data-material-viewer-note]").val() || "";
      saveNotes(notes);

      showToast(
        "info",
        t("materials.viewerPage.toastNoteSavedTitle", null, "Đã lưu ghi chú"),
        t("materials.viewerPage.toastNoteSavedMessage", null, "Ghi chú đã được lưu cục bộ cho tài liệu này.")
      );
    });

    $(document).on("click", "[data-material-viewer-action='download']", function () {
      showToast(
        "info",
        t("materials.viewerPage.toastDownloadTitle", null, "Tải xuống mẫu"),
        t("materials.viewerPage.toastDownloadMessage", null, "Tính năng tải xuống sẽ khả dụng khi tích hợp lưu trữ tài liệu.")
      );
    });

    $(document).on("click", "[data-material-viewer-action='open-link']", function () {
      showToast(
        "info",
        t("materials.viewerPage.toastLinkTitle", null, "Liên kết mẫu"),
        t("materials.viewerPage.toastLinkMessage", null, "Liên kết ngoài sẽ được mở khi URL thực tế được cung cấp.")
      );
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadPageData() {
    if (!Lms.apiClient) {
      renderNotFound();
      return;
    }

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
        '<div class="lms-empty-compact student-material-viewer-reveal is-visible" data-viewer-reveal>' +
          '<i class="bi bi-exclamation-circle" aria-hidden="true"></i>' +
          '<h3>' + escapeHtml(t("materials.viewerPage.loadErrorTitle", null, "Không thể tải tài liệu")) + "</h3>" +
          '<p>' + escapeHtml(t("materials.viewerPage.loadErrorCopy", null, "Vui lòng kiểm tra các tệp dữ liệu mô phỏng.")) + "</p>" +
        "</div>"
      );
      initViewerReveal();
    });
  }

  function init() {
    state.materialId = Number($("[data-student-material-id]").data("student-material-id"));
    bindEvents();
    initViewerReveal();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }

    loadPageData();
  }

  $(init);
})(window, jQuery);
