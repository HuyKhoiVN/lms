(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const notesKey = "lms.student.materialNotes";
  const state = {
    materialId: 0,
    material: null,
    course: null,
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
      headers: {
        Authorization: "Bearer " + token
      }
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

  function getContentTypeLabel(type) {
    const labels = {
      Text: t("materials.viewerPage.typeText", null, "Van ban"),
      Pdf: t("materials.viewerPage.typePdf", null, "PDF"),
      File: t("materials.viewerPage.typeFile", null, "Tep tin"),
      Link: t("materials.viewerPage.typeLink", null, "Lien ket"),
      Image: t("materials.viewerPage.typeImage", null, "Hinh anh"),
      Video: t("materials.viewerPage.typeVideo", null, "Video"),
      Mixed: t("materials.viewerPage.typeMixed", null, "Tong hop")
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
    if (type === "Image" || type === "Video" || type === "Mixed") {
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
    const textContent = state.material && state.material.textContent
      ? state.material.textContent
      : t("materials.viewerPage.textFallback", null, "Tai lieu text chua co noi dung chi tiet.");

    return (
      '<article class="material-reader">' +
        "<p>" + escapeHtml(textContent) + "</p>" +
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

  function renderFilesList() {
    if (!state.material || !Array.isArray(state.material.files) || !state.material.files.length) {
      return "";
    }

    return (
      '<div class="student-material-file-list">' +
        state.material.files.map(function (file) {
          return (
            '<button class="app-button app-button-secondary" type="button" data-material-viewer-action="download-file" data-file-id="' + file.id + '">' +
              escapeHtml(file.originalFileName || ("file-" + file.id)) +
            "</button>"
          );
        }).join("") +
      "</div>"
    );
  }

  function getBlocks() {
    const blocks = state.material && Array.isArray(state.material.blocks) ? state.material.blocks.slice() : [];
    return blocks.sort(function (a, b) {
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    });
  }

  function getBlockEndpoint(block, action) {
    return getApiUrl("learning-materials/" + state.material.id + "/blocks/" + block.id + "/" + action);
  }

  function getAuthenticatedBlockEndpoint(block, action) {
    const token = getAccessToken();
    const endpoint = getBlockEndpoint(block, action);
    return token ? endpoint + "?access_token=" + encodeURIComponent(token) : endpoint;
  }

  function renderBlockCaption(block) {
    if (!block.caption) {
      return "";
    }

    return '<p class="student-material-block-caption">' + escapeHtml(block.caption) + "</p>";
  }

  function renderTextBlock(block) {
    const text = block.textContent || "";
    const paragraphs = text.split(/\r?\n/).filter(function (line) {
      return line.trim().length > 0;
    });

    return (
      '<section class="student-material-block student-material-block-text student-material-viewer-reveal" data-viewer-reveal>' +
        renderBlockCaption(block) +
        '<article class="material-reader">' +
          (paragraphs.length
            ? paragraphs.map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("")
            : "<p>" + escapeHtml(t("materials.viewerPage.textFallback", null, "No text content available.")) + "</p>") +
        "</article>" +
      "</section>"
    );
  }

  function renderImageBlock(block) {
    return (
      '<section class="student-material-block student-material-viewer-reveal" data-viewer-reveal>' +
        renderBlockCaption(block) +
        '<img class="student-material-block-media" alt="' + escapeHtml(block.caption || block.originalFileName || state.material.title) + '" data-material-block-stream data-block-id="' + block.id + '" />' +
      "</section>"
    );
  }

  function renderVideoBlock(block) {
    return (
      '<section class="student-material-block student-material-viewer-reveal" data-viewer-reveal>' +
        renderBlockCaption(block) +
        '<video class="student-material-block-media" controls preload="metadata" src="' + escapeHtml(getAuthenticatedBlockEndpoint(block, "stream")) + '"></video>' +
      "</section>"
    );
  }

  function renderPdfBlock(block) {
    return (
      '<section class="student-material-block student-material-viewer-reveal" data-viewer-reveal>' +
        renderBlockCaption(block) +
        '<iframe class="student-material-block-pdf" title="' + escapeHtml(block.caption || block.originalFileName || state.material.title) + '" src="' + escapeHtml(getAuthenticatedBlockEndpoint(block, "stream")) + '"></iframe>' +
      "</section>"
    );
  }

  function renderFileBlock(block) {
    return (
      '<section class="student-material-block student-material-viewer-reveal" data-viewer-reveal>' +
        '<div class="student-material-viewer-placeholder">' +
          '<span class="student-material-viewer-placeholder-icon is-file" aria-hidden="true"><i class="bi bi-paperclip"></i></span>' +
          '<div><h3>' + escapeHtml(block.originalFileName || t("materials.viewerPage.filePlaceholderTitle", null, "File material")) + "</h3>" +
          renderBlockCaption(block) +
          '<p>' + escapeHtml(t("materials.viewerPage.fileDownloadCopy", null, "Download this file to view it on your device.")) + "</p></div>" +
          '<button class="app-button app-button-secondary" type="button" data-material-viewer-action="download-block" data-block-id="' + block.id + '">' + escapeHtml(t("materials.viewerPage.buttonDownload", null, "Download")) + "</button>" +
        "</div>" +
      "</section>"
    );
  }

  function renderLinkBlock(block) {
    return (
      '<section class="student-material-block student-material-viewer-reveal" data-viewer-reveal>' +
        '<div class="student-material-viewer-placeholder">' +
          '<span class="student-material-viewer-placeholder-icon is-link" aria-hidden="true"><i class="bi bi-link-45deg"></i></span>' +
          '<div><h3>' + escapeHtml(block.caption || t("materials.viewerPage.linkPlaceholderTitle", null, "External resource")) + "</h3>" +
          '<p>' + escapeHtml(block.url || "") + "</p></div>" +
          '<button class="app-button app-button-secondary" type="button" data-material-viewer-action="open-block-link" data-block-id="' + block.id + '">' + escapeHtml(t("materials.viewerPage.buttonOpenLinkPlaceholder", null, "Open link")) + "</button>" +
        "</div>" +
      "</section>"
    );
  }

  function renderBlock(block) {
    if (block.blockType === "Image") {
      return renderImageBlock(block);
    }
    if (block.blockType === "Video") {
      return renderVideoBlock(block);
    }
    if (block.blockType === "Pdf") {
      return renderPdfBlock(block);
    }
    if (block.blockType === "File") {
      return renderFileBlock(block);
    }
    if (block.blockType === "Link") {
      return renderLinkBlock(block);
    }
    return renderTextBlock(block);
  }

  function renderBlocksContent() {
    const blocks = getBlocks();
    if (!blocks.length) {
      return "";
    }

    return blocks.map(renderBlock).join("");
  }

  function hydrateBlockMedia() {
    $("#materialViewerContent [data-material-block-stream]").each(function () {
      const element = this;
      const blockId = Number($(element).data("block-id"));
      const block = getBlocks().find(function (item) {
        return Number(item.id) === blockId;
      });

      if (!block) {
        return;
      }

      fetchAuthorizedBlob(getBlockEndpoint(block, "stream")).then(function (blob) {
        const objectUrl = trackObjectUrl(window.URL.createObjectURL(blob));
        $(element).attr("src", objectUrl);
        if (element.tagName.toLowerCase() === "video") {
          element.load();
        }
      }).catch(function () {
        $(element).replaceWith(
          '<div class="student-material-viewer-placeholder">' +
            '<span class="student-material-viewer-placeholder-icon is-file" aria-hidden="true"><i class="bi bi-exclamation-triangle"></i></span>' +
            '<p>' + escapeHtml(t("materials.viewerPage.mediaLoadFailed", null, "Could not load this media block.")) + "</p>" +
          "</div>"
        );
      });
    });
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
      return renderAttachmentViewer(
        "Pdf",
        t("materials.viewerPage.pdfPlaceholderTitle", null, "PDF Preview"),
        t("materials.viewerPage.pdfPlaceholderDesc", null, "Tai lieu PDF hien co file dinh kem hoac se duoc xem tai day."),
        t("materials.viewerPage.buttonDownload", null, "Tai xuong tai lieu"),
        "download"
      ) + renderFilesList();
    }

    if (state.material.contentType === "File") {
      return renderAttachmentViewer(
        "File",
        t("materials.viewerPage.filePlaceholderTitle", null, "Attachment"),
        t("materials.viewerPage.filePlaceholderDesc", null, "Tai lieu dinh kem duoc cung cap tu backend."),
        t("materials.viewerPage.buttonDownload", null, "Tai xuong tai lieu"),
        "download"
      ) + renderFilesList();
    }

    if (state.material.contentType === "Link") {
      return renderAttachmentViewer(
        "Link",
        t("materials.viewerPage.linkPlaceholderTitle", null, "External Resource"),
        state.material.externalLink || t("materials.viewerPage.linkPlaceholderDesc", null, "Lien ket ngoai se mo khi duoc cung cap."),
        t("materials.viewerPage.buttonOpenLinkPlaceholder", null, "Mo lien ket"),
        "open-link"
      );
    }

    return renderTextViewer();
  }

  function renderNotFound(message) {
    $("[data-material-viewer-title]").text(t("materials.viewerPage.notFoundTitle", null, "Khong tim thay tai lieu"));
    $("[data-material-viewer-course]").text(message || t("materials.viewerPage.notFoundDesc", null, "Tai lieu yeu cau khong ton tai hoac ban khong co quyen truy cap."));
    $("#materialViewerContent").html(
      '<div class="lms-empty-compact student-material-viewer-reveal is-visible" data-viewer-reveal>' +
        '<i class="bi bi-folder-x" aria-hidden="true"></i>' +
        '<h3>' + escapeHtml(t("materials.viewerPage.notFoundTitle", null, "Khong tim thay tai lieu")) + "</h3>" +
        '<p>' + escapeHtml(message || t("materials.viewerPage.notFoundCopy", null, "Quay lai trang tai lieu va chon mot muc khac.")) + "</p>" +
      "</div>"
    );
  }

  function render() {
    if (!state.material) {
      renderNotFound();
      return;
    }

    const courseName = state.course ? state.course.name : t("materials.viewerPage.unknownCourse", null, "Khoa hoc khong xac dinh");
    const complete = isComplete();
    const percent = getProgressPercent();

    $("[data-material-viewer-title]").text(state.material.title);
    $("[data-material-viewer-course]").text(courseName);
    $("[data-material-viewer-heading]").text(state.material.title);
    $("[data-material-viewer-type]")
      .removeClass("lms-status-success lms-status-danger lms-status-warning lms-status-info")
      .addClass(getTypeBadgeClass(state.material.contentType))
      .text(getContentTypeLabel(state.material.contentType));
    $("[data-material-viewer-progress-status]").text(
      complete
        ? t("materials.viewerPage.statusCompleted", null, "Da hoan thanh")
        : percent > 0
          ? t("materials.viewerPage.statusInProgress", null, "Dang tien hanh")
          : t("materials.viewerPage.statusNotStarted", null, "Chua bat dau")
    );
    $("[data-material-viewer-duration]").text(
      t("materials.viewerPage.orderValue", { order: state.material.order }, "Thu tu " + state.material.order)
    );
    $("[data-material-viewer-course-name]").text(courseName);
    $("[data-material-viewer-progress-percent]").text(percent + "%");
    $("[data-material-viewer-progress-ring]")
      .toggleClass("is-complete", complete)
      .css("--progress", percent + "%");
    $("[data-material-viewer-action='complete']").text(
      complete ? t("materials.viewerPage.statusCompleted", null, "Da hoan thanh") : t("materials.viewerPage.buttonComplete", null, "Danh dau hoan thanh")
    );
    $("[data-material-viewer-note]").val(getNotes()[state.materialId] || "");
    revokeObjectUrls();
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

  function downloadAuthenticatedFile(fileId, fileName) {
    const token = Lms.auth && Lms.auth.getAccessToken ? Lms.auth.getAccessToken() : null;
    const url = Lms.apiClient && Lms.apiClient.request
      ? Lms.config.apiBaseUrl + "/files/" + fileId + "/download"
      : null;

    if (!token || !url) {
      showToast("error", t("materials.viewerPage.toastDownloadTitle", null, "Khong the tai file"), t("materials.viewerPage.toastDownloadMessage", null, "Phien dang nhap khong hop le hoac api client chua san sang."));
      return;
    }

    window.fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token
      }
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Download failed");
      }
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
      showToast("error", t("materials.viewerPage.toastDownloadTitle", null, "Khong the tai file"), t("materials.viewerPage.toastDownloadMessage", null, "Tai file that bai, vui long thu lai."));
    });
  }

  function downloadMaterialBlock(blockId) {
    const block = getBlocks().find(function (item) {
      return Number(item.id) === Number(blockId);
    });

    if (!block) {
      showToast("error", t("materials.viewerPage.toastDownloadTitle", null, "Could not download"), t("materials.viewerPage.toastDownloadEmptyMessage", null, "No file is available for download."));
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
      showToast("error", t("materials.viewerPage.toastDownloadTitle", null, "Could not download"), t("materials.viewerPage.toastDownloadMessage", null, "File download failed. Please try again."));
    });
  }

  function bindEvents() {
    $(document).on("click", "[data-material-viewer-action='complete']", function () {
      if (!state.material || !state.course) {
        return;
      }

      const $button = $(this);
      if (Lms.ui && Lms.ui.setButtonLoading) {
        Lms.ui.setButtonLoading($button);
      }

      Lms.apiClient.post("api/learning-progress", {
        courseId: state.course.id,
        learningMaterialId: state.material.id,
        progressPercent: 100
      }).done(function (response) {
        state.progress = getResponseData(response);
        showToast(
          "success",
          t("materials.viewerPage.toastProgressSavedTitle", null, "Da luu tien trinh"),
          t("materials.viewerPage.toastProgressSavedMessage", { title: state.material.title }, state.material.title + " da duoc danh dau hoan thanh.")
        );
        render();
      }).fail(function (error) {
        showToast("error", t("materials.viewerPage.toastProgressErrorTitle", null, "Khong the cap nhat tien trinh"), error && error.message ? error.message : t("materials.viewerPage.toastProgressErrorMessage", null, "Vui long thu lai."));
      }).always(function () {
        if (Lms.ui && Lms.ui.clearButtonLoading) {
          Lms.ui.clearButtonLoading($button);
        }
      });
    });

    $(document).on("click", "[data-material-viewer-action='save-note']", function () {
      const notes = getNotes();
      notes[state.materialId] = $("[data-material-viewer-note]").val() || "";
      saveNotes(notes);

      showToast(
        "info",
        t("materials.viewerPage.toastNoteSavedTitle", null, "Da luu ghi chu"),
        t("materials.viewerPage.toastNoteSavedMessage", null, "Ghi chu da duoc luu cuc bo cho tai lieu nay.")
      );
    });

    $(document).on("click", "[data-material-viewer-action='download']", function () {
      if (!state.material || !state.material.files || !state.material.files.length) {
        showToast("info", t("materials.viewerPage.toastDownloadTitle", null, "Chua co file de tai"), t("materials.viewerPage.toastDownloadEmptyMessage", null, "Tai lieu nay hien chua co file dinh kem tren backend."));
        return;
      }

      const firstFile = state.material.files[0];
      downloadAuthenticatedFile(firstFile.id, firstFile.originalFileName);
    });

    $(document).on("click", "[data-material-viewer-action='download-file']", function () {
      const fileId = Number($(this).data("file-id"));
      const file = state.material && state.material.files
        ? state.material.files.find(function (item) {
          return Number(item.id) === fileId;
        })
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

      showToast(
        "info",
        t("materials.viewerPage.toastLinkTitle", null, "Chua co lien ket"),
        t("materials.viewerPage.toastLinkMessage", null, "Tai lieu nay hien chua co lien ket ngoai.")
      );
    });

    $(document).on("click", "[data-material-viewer-action='open-block-link']", function () {
      const blockId = Number($(this).data("block-id"));
      const block = getBlocks().find(function (item) {
        return Number(item.id) === blockId;
      });

      if (block && block.url) {
        window.open(block.url, "_blank", "noopener,noreferrer");
      }
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadCourseAndProgress(material) {
    return $.when(
      Lms.apiClient.get("api/courses/" + material.courseId),
      Lms.apiClient.get("api/learning-progress/my?page=1&pageSize=500&courseId=" + material.courseId)
    ).done(function (courseResponse, progressResponse) {
      state.course = getResponseData(courseResponse);
      state.progress = getResponseItems(progressResponse).find(function (item) {
        return Number(item.learningMaterialId) === state.materialId;
      }) || null;
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
      loadCourseAndProgress(state.material).fail(function () {
        render();
      });
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
