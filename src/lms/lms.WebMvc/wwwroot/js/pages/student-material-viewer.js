(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const notesKey = "lms.student.materialNotes";
  const state = {
    materialId: 0,
    material: null,
    course: null,
    progress: null
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
      Link: t("materials.viewerPage.typeLink", null, "Lien ket")
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

  function renderContent() {
    if (!state.material) {
      return "";
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
