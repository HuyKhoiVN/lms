(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const notesKey = "lms.student.materialNotes";
  const state = {
    materialId: 0,
    material: null,
    course: null,
    courseMaterials: [],
    progressItems: [],
    progress: null,
    objectUrls: []
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

  function getApiUrl(path) {
    return String(Lms.config && Lms.config.apiBaseUrl || "").replace(/\/$/, "") + "/" + String(path || "").replace(/^\//, "");
  }

  function getAccessToken() {
    return Lms.auth && Lms.auth.getAccessToken ? Lms.auth.getAccessToken() : null;
  }

  function fetchAuthorizedBlob(url) {
    const token = getAccessToken();
    if (!token || !url) {
      return Promise.reject(new Error("Missing access token"));
    }

    return window.fetch(url, {
      method: "GET",
      headers: { Authorization: "Bearer " + token }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Download failed");
      }
      return response.blob();
    });
  }

  function revokeObjectUrls() {
    state.objectUrls.forEach(function (url) {
      window.URL.revokeObjectURL(url);
    });
    state.objectUrls = [];
  }

  function trackObjectUrl(url) {
    state.objectUrls.push(url);
    return url;
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
    return Boolean(state.progress && state.progress.isCompleted);
  }

  function getProgressPercent() {
    return state.progress ? Math.round(Number(state.progress.progressPercent || 0)) : 0;
  }

  function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  }

  function getStatusText(complete, percent) {
    if (complete) {
      return t("materials.viewerPage.statusCompleted", null, "Đã hoàn thành");
    }
    if (percent > 0) {
      return t("materials.viewerPage.statusInProgress", null, "Đang học");
    }
    return t("materials.viewerPage.statusNotStarted", null, "Chưa bắt đầu");
  }

  function formatDuration(value) {
    const minutes = Number(value || 0);
    if (minutes > 0) {
      return t("materials.viewerPage.durationMinutes", { minutes }, minutes + " phút");
    }
    return t("materials.viewerPage.durationMissing", null, "Chưa cập nhật");
  }

  function formatOrder(value) {
    const order = Number(value || 0);
    return order > 0
      ? t("materials.viewerPage.orderValue", { order }, "Thứ tự " + order)
      : "--";
  }

  function getBlocks() {
    const blocks = state.material && Array.isArray(state.material.blocks) ? state.material.blocks.slice() : [];
    return blocks.sort(function (a, b) {
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    });
  }

  function getBlockCount() {
    return getBlocks().length;
  }

  function getFileCount() {
    return state.material && Array.isArray(state.material.files) ? state.material.files.length : 0;
  }

  function getCourseCode() {
    if (!state.course) {
      return "--";
    }
    return state.course.code || ("COURSE-" + state.course.id);
  }

  function getContentTypeLabel(type) {
    const labels = {
      Text: t("materials.viewerPage.typeText", null, "Văn bản"),
      Pdf: t("materials.viewerPage.typePdf", null, "PDF"),
      File: t("materials.viewerPage.typeFile", null, "Tệp tin"),
      Link: t("materials.viewerPage.typeLink", null, "Liên kết"),
      Image: t("materials.viewerPage.typeImage", null, "Hình ảnh"),
      Video: t("materials.viewerPage.typeVideo", null, "Video"),
      Mixed: t("materials.viewerPage.typeMixed", null, "Tổng hợp"),
      Scorm: t("materials.viewerPage.typeScorm", null, "SCORM")
    };
    return labels[type] || type || "--";
  }

  function getTypeBadgeClass(type) {
    if (type === "Pdf") return "is-pdf";
    if (type === "File") return "is-file";
    if (type === "Link") return "is-link";
    if (type === "Scorm") return "is-scorm";
    if (type === "Image" || type === "Video" || type === "Mixed") return "is-media";
    return "is-text";
  }

  function getTypeIcon(type) {
    const icons = {
      Text: "bi-file-text",
      Pdf: "bi-filetype-pdf",
      File: "bi-file-earmark-arrow-down",
      Link: "bi-link-45deg",
      Image: "bi-image",
      Video: "bi-play-btn",
      Mixed: "bi-collection",
      Scorm: "bi-diagram-3"
    };
    return icons[type] || "bi-file-earmark";
  }

  function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (!size) {
      return t("materials.viewerPage.fileSizeUnknown", null, "Không rõ dung lượng");
    }
    if (size >= 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1).replace(/\.0$/, "") + " MB";
    }
    return Math.max(1, Math.round(size / 1024)) + " KB";
  }

  function getBlockEndpoint(block, action) {
    return getApiUrl("learning-materials/" + state.material.id + "/blocks/" + block.id + "/" + action);
  }

  function getAuthenticatedBlockEndpoint(block, action) {
    const token = getAccessToken();
    const endpoint = getBlockEndpoint(block, action);
    return token ? endpoint + "?access_token=" + encodeURIComponent(token) : endpoint;
  }

  function getCurrentIndex() {
    return state.courseMaterials.findIndex(function (item) {
      return Number(item.id) === Number(state.materialId);
    });
  }

  function getMaterialProgress(materialId) {
    return state.progressItems.find(function (item) {
      return Number(item.learningMaterialId) === Number(materialId);
    }) || null;
  }

  function getTextParagraphs(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);
  }

  function createTextReader(text, caption) {
    const paragraphs = getTextParagraphs(text);
    const body = paragraphs.length
      ? paragraphs.map(function (line, index) {
        return index === 0
          ? '<p class="student-material-reader-lead">' + escapeHtml(line) + "</p>"
          : "<p>" + escapeHtml(line) + "</p>";
      }).join("")
      : '<p class="student-material-reader-lead">' + escapeHtml(t("materials.viewerPage.textFallback", null, "Chưa có nội dung văn bản.")) + "</p>";

    return (
      '<article class="material-reader">' +
        (caption ? '<p class="student-material-reader-eyebrow">' + escapeHtml(caption) + "</p>" : "") +
        body +
        '<blockquote>' + escapeHtml(t("materials.viewerPage.readerCallout", null, "Gợi ý: đánh dấu hoàn thành khi bạn đã đọc xong và ghi lại ý chính ở phần Notes.")) + "</blockquote>" +
        '<div class="student-material-reader-callout">' +
          '<i class="bi bi-lightbulb" aria-hidden="true"></i>' +
          '<span>' + escapeHtml(t("materials.viewerPage.readerInfoBox", null, "Học liệu được trình bày ở chế độ đọc tập trung để giảm nhiễu và giữ nhịp học liên tục.")) + "</span>" +
        "</div>" +
      "</article>"
    );
  }

  function renderBlockCaption(block) {
    return block && block.caption
      ? '<p class="student-material-block-caption">' + escapeHtml(block.caption) + "</p>"
      : "";
  }

  function renderTextViewer() {
    return '<section class="student-material-viewer-surface is-text student-material-viewer-reveal" data-viewer-reveal>' +
      createTextReader(state.material && state.material.textContent, t("materials.viewerPage.typeText", null, "Văn bản")) +
    "</section>";
  }

  function renderTextBlock(block) {
    return '<section class="student-material-viewer-surface is-text student-material-viewer-reveal" data-viewer-reveal>' +
      createTextReader(block.textContent || "", block.caption) +
    "</section>";
  }

  function renderPdfShell(source, title, block) {
    return (
      '<section class="student-material-viewer-surface is-pdf student-material-viewer-reveal" data-viewer-reveal>' +
        '<div class="student-material-pdf-toolbar">' +
          '<div><i class="bi bi-filetype-pdf" aria-hidden="true"></i><strong>' + escapeHtml(title) + '</strong></div>' +
          '<div class="student-material-toolbar-group">' +
            '<button type="button"><i class="bi bi-dash-lg" aria-hidden="true"></i><span>90%</span></button>' +
            '<button type="button"><i class="bi bi-plus-lg" aria-hidden="true"></i><span>110%</span></button>' +
            '<button type="button"><i class="bi bi-printer" aria-hidden="true"></i><span>Print</span></button>' +
            (block ? '<button type="button" data-material-viewer-action="download-block" data-block-id="' + block.id + '"><i class="bi bi-download" aria-hidden="true"></i><span>Download</span></button>' : '<button type="button" data-material-viewer-action="download"><i class="bi bi-download" aria-hidden="true"></i><span>Download</span></button>') +
          "</div>" +
        "</div>" +
        '<div class="student-material-pdf-workspace">' +
          '<aside class="student-material-pdf-thumbs" aria-label="PDF thumbnails">' +
            '<span class="is-active">1</span><span>2</span><span>3</span>' +
          "</aside>" +
          '<div class="student-material-pdf-stage">' +
            (source
              ? '<iframe title="' + escapeHtml(title) + '" src="' + escapeHtml(source) + '"></iframe>'
              : '<div class="student-material-document-preview"><i class="bi bi-filetype-pdf" aria-hidden="true"></i><h3>' + escapeHtml(t("materials.viewerPage.pdfPlaceholderTitle", null, "PDF Preview")) + "</h3><p>" + escapeHtml(t("materials.viewerPage.pdfPlaceholderDesc", null, "Tải tệp PDF để xem nội dung chi tiết.")) + "</p></div>") +
          "</div>" +
        "</div>" +
      "</section>"
    );
  }

  function renderPdfBlock(block) {
    return renderBlockCaption(block) + renderPdfShell(getAuthenticatedBlockEndpoint(block, "stream"), block.caption || block.originalFileName || state.material.title, block);
  }

  function renderVideoBlock(block) {
    return (
      renderBlockCaption(block) +
      '<section class="student-material-viewer-surface is-video student-material-viewer-reveal" data-viewer-reveal>' +
        '<div class="student-material-video-frame">' +
          '<video controls preload="metadata" src="' + escapeHtml(getAuthenticatedBlockEndpoint(block, "stream")) + '"></video>' +
          '<div class="student-material-video-overlay"><i class="bi bi-play-circle" aria-hidden="true"></i><span>' + escapeHtml(block.caption || state.material.title) + "</span></div>" +
        "</div>" +
        '<div class="student-material-video-details">' +
          '<div><strong>' + escapeHtml(t("materials.viewerPage.transcriptTitle", null, "Transcript")) + "</strong><p>" + escapeHtml(t("materials.viewerPage.transcriptCopy", null, "Transcript sẽ hiển thị tại đây khi nội dung được cung cấp từ backend.")) + "</p></div>" +
          '<button type="button"><i class="bi bi-bookmark-plus" aria-hidden="true"></i>' + escapeHtml(t("materials.viewerPage.bookmarkTimestamp", null, "Bookmark timestamp")) + "</button>" +
        "</div>" +
      "</section>"
    );
  }

  function renderImageBlock(block) {
    return (
      '<section class="student-material-viewer-surface is-image student-material-viewer-reveal" data-viewer-reveal>' +
        '<div class="student-material-image-toolbar"><span>' + escapeHtml(block.caption || block.originalFileName || state.material.title) + '</span><div><button type="button"><i class="bi bi-zoom-in" aria-hidden="true"></i>Zoom</button><button type="button"><i class="bi bi-arrows-fullscreen" aria-hidden="true"></i>Fullscreen</button></div></div>' +
        '<div class="student-material-image-stage">' +
          '<img alt="' + escapeHtml(block.caption || block.originalFileName || state.material.title) + '" data-material-block-stream data-block-id="' + block.id + '" />' +
        "</div>" +
        renderBlockCaption(block) +
      "</section>"
    );
  }

  function renderLinkPreview(title, url, blockId) {
    const hostname = getHostname(url);
    return (
      '<section class="student-material-viewer-surface is-link student-material-viewer-reveal" data-viewer-reveal>' +
        '<div class="student-material-link-preview">' +
          '<div class="student-material-link-thumb"><i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></div>' +
          '<div class="student-material-link-body">' +
            '<span><i class="bi bi-globe2" aria-hidden="true"></i>' + escapeHtml(hostname || t("materials.viewerPage.linkPlaceholderTitle", null, "External resource")) + "</span>" +
            '<h3>' + escapeHtml(title || t("materials.viewerPage.linkPlaceholderTitle", null, "Tài liệu liên kết bên ngoài")) + "</h3>" +
            '<p>' + escapeHtml(url || t("materials.viewerPage.linkPlaceholderDesc", null, "Liên kết ngoài sẽ mở khi URL được cung cấp.")) + "</p>" +
            '<button class="student-material-viewer-button is-primary" type="button" data-material-viewer-action="' + (blockId ? "open-block-link" : "open-link") + '"' + (blockId ? ' data-block-id="' + blockId + '"' : "") + '><i class="bi bi-box-arrow-up-right" aria-hidden="true"></i><span>Open Website</span></button>' +
          "</div>" +
        "</div>" +
      "</section>"
    );
  }

  function getHostname(url) {
    try {
      return url ? new URL(url).hostname : "";
    } catch (_) {
      return "";
    }
  }

  function renderLinkBlock(block) {
    return renderLinkPreview(block.caption, block.url, block.id);
  }

  function renderFileCard(title, size, type, action, id) {
    return (
      '<section class="student-material-viewer-surface is-file student-material-viewer-reveal" data-viewer-reveal>' +
        '<div class="student-material-file-card">' +
          '<span class="student-material-file-icon"><i class="bi bi-file-earmark-arrow-down" aria-hidden="true"></i></span>' +
          '<div class="student-material-file-copy">' +
            '<p>' + escapeHtml(t("materials.viewerPage.typeFile", null, "Tệp tin")) + "</p>" +
            '<h3>' + escapeHtml(title || t("materials.viewerPage.filePlaceholderTitle", null, "Tài liệu tệp tin")) + "</h3>" +
            '<dl><div><dt>Dung lượng</dt><dd>' + escapeHtml(size || t("materials.viewerPage.fileSizeUnknown", null, "Không rõ dung lượng")) + '</dd></div><div><dt>Loại file</dt><dd>' + escapeHtml(type || "Attachment") + '</dd></div><div><dt>Ngày cập nhật</dt><dd>--</dd></div></dl>' +
          "</div>" +
          '<button class="student-material-viewer-button is-primary" type="button" data-material-viewer-action="' + action + '"' + (id ? ' data-file-id="' + id + '" data-block-id="' + id + '"' : "") + '><i class="bi bi-download" aria-hidden="true"></i><span>' + escapeHtml(t("materials.viewerPage.buttonDownload", null, "Tải xuống")) + "</span></button>" +
        "</div>" +
      "</section>"
    );
  }

  function renderFileBlock(block) {
    return renderBlockCaption(block) + renderFileCard(block.originalFileName, formatFileSize(block.fileSize), block.contentType, "download-block", block.id);
  }

  function renderScormViewer() {
    return (
      '<section class="student-material-viewer-surface is-scorm student-material-viewer-reveal" data-viewer-reveal>' +
        '<div class="student-material-scorm-player">' +
          '<aside><strong>SCORM</strong><span class="is-active">Resume package</span><span>Lesson tree</span><span>Completion</span></aside>' +
          '<div><i class="bi bi-diagram-3" aria-hidden="true"></i><h3>' + escapeHtml(t("materials.viewerPage.scormTitle", null, "SCORM learning player")) + "</h3><p>" + escapeHtml(t("materials.viewerPage.scormCopy", null, "SCORM package sẽ được phát trong learning player khi backend cung cấp package runtime.")) + '</p><button class="student-material-viewer-button is-primary" type="button"><i class="bi bi-play-circle" aria-hidden="true"></i><span>Resume</span></button></div>' +
        "</div>" +
      "</section>"
    );
  }

  function renderBlock(block) {
    if (block.blockType === "Image") return renderImageBlock(block);
    if (block.blockType === "Video") return renderVideoBlock(block);
    if (block.blockType === "Pdf") return renderPdfBlock(block);
    if (block.blockType === "File") return renderFileBlock(block);
    if (block.blockType === "Link") return renderLinkBlock(block);
    return renderTextBlock(block);
  }

  function renderBlocksContent() {
    const blocks = getBlocks();
    return blocks.length ? blocks.map(renderBlock).join("") : "";
  }

  function renderFilesList() {
    if (!state.material || !Array.isArray(state.material.files) || !state.material.files.length) {
      return "";
    }
    return state.material.files.map(function (file) {
      return renderFileCard(file.originalFileName || ("file-" + file.id), formatFileSize(file.fileSize), file.contentType, "download-file", file.id);
    }).join("");
  }

  function renderContent() {
    if (!state.material) {
      return "";
    }

    const blockContent = renderBlocksContent();
    if (blockContent) {
      return blockContent;
    }

    if (state.material.contentType === "Pdf") {
      return renderPdfShell("", state.material.title, null) + renderFilesList();
    }
    if (state.material.contentType === "File") {
      return renderFilesList() || renderFileCard(state.material.title, "", "Attachment", "download", null);
    }
    if (state.material.contentType === "Link") {
      return renderLinkPreview(state.material.title, state.material.externalLink, null);
    }
    if (state.material.contentType === "Scorm") {
      return renderScormViewer();
    }
    return renderTextViewer();
  }

  function renderToolbar() {
    if (!state.material) {
      $("#materialViewerToolbar").empty();
      return;
    }

    const type = state.material.contentType;
    const toolsByType = {
      Text: [
        ["bi-layout-text-sidebar-reverse", "Reading Mode"],
        ["bi-type", "Font size"],
        ["bi-moon", "Dark mode"],
        ["bi-bookmark", "Bookmark"],
        ["bi-search", "Search"]
      ],
      Pdf: [
        ["bi-zoom-in", "Zoom"],
        ["bi-file-earmark", "Page"],
        ["bi-download", "Download"],
        ["bi-arrows-fullscreen", "Fullscreen"],
        ["bi-printer", "Print"]
      ],
      Video: [
        ["bi-speedometer2", "Speed"],
        ["bi-badge-cc", "Transcript"],
        ["bi-bookmark", "Bookmark"],
        ["bi-arrows-fullscreen", "Fullscreen"]
      ],
      Link: [
        ["bi-box-arrow-up-right", "Open"],
        ["bi-bookmark", "Bookmark"],
        ["bi-share", "Share"]
      ],
      File: [
        ["bi-download", "Download"],
        ["bi-eye", "Preview"],
        ["bi-share", "Share"]
      ],
      Image: [
        ["bi-zoom-in", "Zoom"],
        ["bi-arrows-fullscreen", "Fullscreen"],
        ["bi-download", "Download"]
      ],
      Scorm: [
        ["bi-play-circle", "Resume"],
        ["bi-list-task", "Lesson tree"],
        ["bi-check2-circle", "Completion"]
      ],
      Mixed: [
        ["bi-layout-text-sidebar-reverse", "Reading Mode"],
        ["bi-bookmark", "Bookmark"],
        ["bi-search", "Search"],
        ["bi-download", "Download"]
      ]
    };

    const tools = toolsByType[type] || toolsByType.Mixed;
    $("#materialViewerToolbar").html(
      tools.map(function (tool) {
        return '<button type="button" title="' + escapeHtml(tool[1]) + '"><i class="bi ' + tool[0] + '" aria-hidden="true"></i><span>' + escapeHtml(tool[1]) + "</span></button>";
      }).join("")
    );
  }

  function hydrateBlockMedia() {
    $("#materialViewerContent [data-material-block-stream]").each(function () {
      const element = this;
      const blockId = Number($(element).data("block-id"));
      const block = getBlocks().find(function (item) { return Number(item.id) === blockId; });
      if (!block) {
        return;
      }

      fetchAuthorizedBlob(getBlockEndpoint(block, "stream")).then(function (blob) {
        const objectUrl = trackObjectUrl(window.URL.createObjectURL(blob));
        $(element).attr("src", objectUrl);
      }).catch(function () {
        $(element).replaceWith(
          '<div class="student-material-document-preview">' +
            '<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>' +
            '<p>' + escapeHtml(t("materials.viewerPage.mediaLoadFailed", null, "Không thể tải media block này.")) + "</p>" +
          "</div>"
        );
      });
    });
  }

  function renderCourseNavigation() {
    const $container = $("#materialCourseNavigation");
    if (!state.courseMaterials.length) {
      $container.html('<p class="student-material-course-nav-empty">' + escapeHtml(t("materials.viewerPage.noCourseNavigation", null, "Chưa có learning path cho khóa học này.")) + "</p>");
      return;
    }

    $container.html(state.courseMaterials.map(function (material, index) {
      const progress = getMaterialProgress(material.id);
      const complete = Boolean(progress && progress.isCompleted);
      const current = Number(material.id) === Number(state.materialId);
      const marker = complete ? "✓" : (current ? "●" : "○");
      const className = complete ? "is-completed" : (current ? "is-current" : "");
      return (
        '<a class="student-material-course-nav-item ' + className + '" href="/LearningMaterials/Viewer/' + material.id + '">' +
          '<span>' + marker + "</span>" +
          '<div><strong>' + escapeHtml(material.title) + '</strong><small>' + escapeHtml(getContentTypeLabel(material.contentType)) + " · " + escapeHtml(formatDuration(material.durationMinutes)) + "</small></div>" +
          '<em>' + String(index + 1).padStart(2, "0") + "</em>" +
        "</a>"
      );
    }).join(""));
  }

  function updateFooterNavigation(percent, statusText) {
    const index = getCurrentIndex();
    const previous = index > 0 ? state.courseMaterials[index - 1] : null;
    const next = index >= 0 && index < state.courseMaterials.length - 1 ? state.courseMaterials[index + 1] : null;

    setNavLink("[data-material-viewer-nav='previous']", previous);
    setNavLink("[data-material-viewer-nav='next']", next);
    $("[data-material-viewer-footer-status]").text(statusText);
    $("[data-material-viewer-footer-copy]").text(percent + "% " + t("materials.viewerPage.lessonProgress", null, "lesson progress"));
  }

  function setNavLink(selector, material) {
    const $link = $(selector);
    if (material) {
      $link.attr("href", "/LearningMaterials/Viewer/" + material.id).removeClass("is-disabled").attr("aria-disabled", "false");
      return;
    }
    $link.attr("href", "#").addClass("is-disabled").attr("aria-disabled", "true");
  }

  function renderNotFound(message) {
    $("[data-material-viewer-title]").text(t("materials.viewerPage.notFoundTitle", null, "Không tìm thấy học liệu"));
    $("[data-material-viewer-course]").text(message || t("materials.viewerPage.notFoundDesc", null, "Học liệu yêu cầu không tồn tại hoặc bạn không có quyền truy cập."));
    $("#materialViewerToolbar").empty();
    $("#materialCourseNavigation").html("");
    $("#materialViewerContent").html(
      '<div class="lms-empty-compact student-material-viewer-reveal is-visible" data-viewer-reveal>' +
        '<i class="bi bi-folder-x" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("materials.viewerPage.notFoundTitle", null, "Không tìm thấy học liệu")) + "</h3>" +
        '<p>' + escapeHtml(message || t("materials.viewerPage.notFoundCopy", null, "Quay lại trang tài liệu và chọn một mục khác.")) + "</p>" +
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
    const percent = clampPercent(getProgressPercent());
    const typeLabel = getContentTypeLabel(state.material.contentType);
    const statusText = getStatusText(complete, percent);
    const durationText = formatDuration(state.material.durationMinutes);
    const orderText = formatOrder(state.material.order);

    $("[data-material-viewer-title]").text(state.material.title);
    $("[data-material-viewer-course]").text(courseName);
    $("[data-material-viewer-heading]").text(state.material.title);
    $("[data-material-viewer-type], [data-material-viewer-side='type'], [data-material-viewer-summary='type']").text(typeLabel);
    $("[data-material-viewer-type]")
      .removeClass("is-text is-pdf is-file is-link is-media is-scorm")
      .addClass(getTypeBadgeClass(state.material.contentType));
    $("[data-material-viewer-progress-status], [data-material-viewer-summary='status']").text(statusText);
    $("[data-material-viewer-duration], [data-material-viewer-summary='duration']").text(durationText);
    $("[data-material-viewer-course-name]").text(courseName);
    $("[data-material-viewer-side='order'], [data-material-viewer-chip='order']").text(orderText);
    $("[data-material-viewer-progress-percent], [data-material-viewer-summary='progress']").text(percent + "%");
    $("[data-material-viewer-progress-ring]").toggleClass("is-complete", complete).css("--progress", percent + "%");
    $("[data-material-viewer-progress-bar]").css("width", percent + "%");
    $("[data-material-viewer-chip='type']").text(typeLabel);
    $("[data-material-viewer-chip='status']").text(statusText);
    $("[data-material-viewer-chip='duration']").text(durationText);
    $("[data-material-viewer-course-link]").attr("href", state.course ? "/Courses/Detail/" + state.course.id : "#").toggleClass("is-disabled", !state.course);

    const completeButtonText = complete
      ? t("materials.viewerPage.statusCompleted", null, "Đã hoàn thành")
      : t("materials.viewerPage.buttonComplete", null, "Đánh dấu hoàn thành");
    $("[data-material-viewer-action='complete']")
      .toggleClass("is-complete", complete)
      .find("span")
      .text(completeButtonText);

    $("[data-material-viewer-note]").val(getNotes()[state.materialId] || "");
    $("[data-material-viewer-note-status]").text(t("materials.viewerPage.noteAutosaveIdle", null, "Sẵn sàng lưu"));

    revokeObjectUrls();
    renderToolbar();
    renderCourseNavigation();
    updateFooterNavigation(percent, statusText);
    $("#materialViewerContent").html(renderContent());
    initViewerReveal();
    hydrateBlockMedia();
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
        if (entry.isIntersecting) {
          $(entry.target).addClass("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    $items.each(function (index) {
      this.style.setProperty("--reveal-delay", Math.min(index * 50, 220) + "ms");
      $(this).attr("data-viewer-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function downloadAuthenticatedFile(fileId, fileName) {
    const token = getAccessToken();
    const url = Lms.apiClient && Lms.apiClient.request ? Lms.config.apiBaseUrl + "/files/" + fileId + "/download" : null;

    if (!token || !url) {
      showToast("error", t("materials.viewerPage.toastDownloadTitle", null, "Không thể tải file"), t("materials.viewerPage.toastDownloadMessage", null, "Phiên đăng nhập không hợp lệ hoặc api client chưa sẵn sàng."));
      return;
    }

    window.fetch(url, {
      method: "GET",
      headers: { Authorization: "Bearer " + token }
    }).then(function (response) {
      if (!response.ok) throw new Error("Download failed");
      return response.blob();
    }).then(function (blob) {
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName || ("file-" + fileId);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    }).catch(function () {
      showToast("error", t("materials.viewerPage.toastDownloadTitle", null, "Không thể tải file"), t("materials.viewerPage.toastDownloadMessage", null, "Tải file thất bại, vui lòng thử lại."));
    });
  }

  function downloadMaterialBlock(blockId) {
    const block = getBlocks().find(function (item) { return Number(item.id) === Number(blockId); });
    if (!block) {
      showToast("error", t("materials.viewerPage.toastDownloadTitle", null, "Không thể tải file"), t("materials.viewerPage.toastDownloadEmptyMessage", null, "Chưa có tệp để tải xuống."));
      return;
    }

    fetchAuthorizedBlob(getBlockEndpoint(block, "download")).then(function (blob) {
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = block.originalFileName || ("material-block-" + block.id);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    }).catch(function () {
      showToast("error", t("materials.viewerPage.toastDownloadTitle", null, "Không thể tải file"), t("materials.viewerPage.toastDownloadMessage", null, "Tải file thất bại, vui lòng thử lại."));
    });
  }

  function bindEvents() {
    $(document).on("click", "[data-material-viewer-action='continue']", function () {
      const target = document.getElementById("materialViewerContent");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    $(document).on("click", "[data-material-viewer-action='complete']", function () {
      if (!state.material || !state.course) return;

      const $button = $(this);
      if (Lms.ui && Lms.ui.setButtonLoading) Lms.ui.setButtonLoading($button);

      Lms.apiClient.post("api/learning-progress", {
        courseId: state.course.id,
        learningMaterialId: state.material.id,
        progressPercent: 100
      }).done(function (response) {
        state.progress = getResponseData(response);
        const existingIndex = state.progressItems.findIndex(function (item) {
          return Number(item.learningMaterialId) === Number(state.materialId);
        });
        if (existingIndex >= 0) {
          state.progressItems[existingIndex] = state.progress;
        } else {
          state.progressItems.push(state.progress);
        }
        showToast("success", t("materials.viewerPage.toastProgressSavedTitle", null, "Đã lưu tiến trình"), t("materials.viewerPage.toastProgressSavedMessage", { title: state.material.title }, state.material.title + " đã được đánh dấu hoàn thành."));
        render();
      }).fail(function (error) {
        showToast("error", t("materials.viewerPage.toastProgressErrorTitle", null, "Không thể cập nhật tiến trình"), error && error.message ? error.message : t("materials.viewerPage.toastProgressErrorMessage", null, "Vui lòng thử lại."));
      }).always(function () {
        if (Lms.ui && Lms.ui.clearButtonLoading) Lms.ui.clearButtonLoading($button);
      });
    });

    $(document).on("click", "[data-material-viewer-action='save-note']", function () {
      const notes = getNotes();
      notes[state.materialId] = $("[data-material-viewer-note]").val() || "";
      saveNotes(notes);
      $("[data-material-viewer-note-status]").text(t("materials.viewerPage.noteSavedStatus", null, "Đã lưu vừa xong"));
      showToast("info", t("materials.viewerPage.toastNoteSavedTitle", null, "Đã lưu ghi chú"), t("materials.viewerPage.toastNoteSavedMessage", null, "Ghi chú đã được lưu cục bộ cho tài liệu này."));
    });

    $(document).on("input", "[data-material-viewer-note]", function () {
      $("[data-material-viewer-note-status]").text(t("materials.viewerPage.noteUnsavedStatus", null, "Có thay đổi chưa lưu"));
    });

    $(document).on("click", "[data-material-viewer-action='download']", function () {
      if (!state.material || !state.material.files || !state.material.files.length) {
        showToast("info", t("materials.viewerPage.toastDownloadTitle", null, "Chưa có file để tải"), t("materials.viewerPage.toastDownloadEmptyMessage", null, "Tài liệu này hiện chưa có file đính kèm trên backend."));
        return;
      }
      const firstFile = state.material.files[0];
      downloadAuthenticatedFile(firstFile.id, firstFile.originalFileName);
    });

    $(document).on("click", "[data-material-viewer-action='download-file']", function () {
      const fileId = Number($(this).data("file-id"));
      const file = state.material && state.material.files
        ? state.material.files.find(function (item) { return Number(item.id) === fileId; })
        : null;
      downloadAuthenticatedFile(fileId, file ? file.originalFileName : null);
    });

    $(document).on("click", "[data-material-viewer-action='download-block']", function () {
      downloadMaterialBlock(Number($(this).data("block-id")));
    });

    $(document).on("click", "[data-material-viewer-action='open-link']", function () {
      if (state.material && state.material.externalLink) {
        window.open(state.material.externalLink, "_blank", "noopener,noreferrer");
        return;
      }
      showToast("info", t("materials.viewerPage.toastLinkTitle", null, "Chưa có liên kết"), t("materials.viewerPage.toastLinkMessage", null, "Tài liệu này hiện chưa có liên kết ngoài."));
    });

    $(document).on("click", "[data-material-viewer-action='open-block-link']", function () {
      const blockId = Number($(this).data("block-id"));
      const block = getBlocks().find(function (item) { return Number(item.id) === blockId; });
      if (block && block.url) {
        window.open(block.url, "_blank", "noopener,noreferrer");
      }
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadCourseAndProgress(material) {
    return $.when(
      Lms.apiClient.get("api/courses/" + material.courseId),
      Lms.apiClient.get("api/learning-progress/my?page=1&pageSize=500&courseId=" + material.courseId),
      Lms.apiClient.get("api/learning-materials?page=1&pageSize=500&courseId=" + material.courseId)
    ).done(function (courseResponse, progressResponse, materialsResponse) {
      state.course = getResponseData(courseResponse);
      state.progressItems = getResponseItems(progressResponse);
      state.progress = state.progressItems.find(function (item) {
        return Number(item.learningMaterialId) === state.materialId;
      }) || null;
      state.courseMaterials = getResponseItems(materialsResponse).sort(function (a, b) {
        return Number(a.order || 0) - Number(b.order || 0);
      });
      render();
    }).fail(function () {
      state.courseMaterials = state.material ? [state.material] : [];
      render();
    });
  }

  function loadPageData() {
    if (!Lms.apiClient) {
      renderNotFound();
      return;
    }

    Lms.apiClient.get("api/learning-materials/" + state.materialId).done(function (response) {
      state.material = getResponseData(response);
      loadCourseAndProgress(state.material);
    }).fail(function (error) {
      renderNotFound(error && error.message ? error.message : null);
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
