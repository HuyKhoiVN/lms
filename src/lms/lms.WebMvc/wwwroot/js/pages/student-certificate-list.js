(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    certificates: [],
    filteredCertificates: [],
    detailCache: {},
    search: "",
    page: 1,
    pageSize: 6
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
    const payload = getData(response);
    return payload && Array.isArray(payload.items) ? payload.items : [];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) {
      return "--";
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "--" : date.toLocaleDateString();
  }

  function formatFileSize(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) {
      return "--";
    }

    if (value < 1024) {
      return value + " B";
    }

    if (value < 1024 * 1024) {
      return (value / 1024).toFixed(1).replace(/\.0$/, "") + " KB";
    }

    return (value / (1024 * 1024)).toFixed(1).replace(/\.0$/, "") + " MB";
  }

  function getInitials(value) {
    const words = String(value || "LMS")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) {
      return "LMS";
    }

    return words.slice(0, 2).map(function (word) {
      return word.charAt(0).toUpperCase();
    }).join("");
  }

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type: type, title: title, message: message });
    }
  }

  function normalizeCertificate(item) {
    return {
      id: item.id,
      examId: item.examId,
      examName: item.examName || t("common.exam", null, "Bai thi"),
      studentId: item.userId,
      studentName: item.userName || t("common.student", null, "Hoc vien"),
      certificateCode: item.certificateCode || "",
      issueDate: item.issuedDate,
      expiryDate: item.expiryDate || null,
      file: item.file || null,
      downloadUrl: "api/certificates/" + encodeURIComponent(item.id) + "/download"
    };
  }

  function renderPageTitle() {
    document.title = t("certificates.listPage.title", null, "Chung chi") + " - " + t("common.appName", null, "lms");
  }

  function getLatestCertificate() {
    return state.certificates.slice().sort(function (a, b) {
      return new Date(b.issueDate) - new Date(a.issueDate);
    })[0] || null;
  }

  function renderMetrics() {
    const latest = getLatestCertificate();
    const available = state.certificates.filter(function (certificate) {
      return certificate.downloadUrl;
    }).length;

    $("[data-certificate-metric='total']").text(state.certificates.length);
    $("[data-certificate-metric='latest']").text(latest ? formatDate(latest.issueDate) : "--");
    $("[data-certificate-metric='available']").text(available);
  }

  function renderCertificateMini(certificate, options) {
    const variant = options && options.variant ? options.variant : "card";

    return (
      '<div class="student-certificate-visual ' + escapeHtml(variant) + '">' +
        '<div class="student-certificate-visual-border">' +
          '<span class="student-certificate-watermark">LMS</span>' +
          '<span class="student-certificate-ribbon" aria-hidden="true"><i class="bi bi-award"></i></span>' +
          '<p>' + escapeHtml(t("certificates.listPage.modalAwardTitle", null, "Chung nhan hoan thanh")) + "</p>" +
          '<h3>' + escapeHtml(certificate.examName) + "</h3>" +
          '<strong>' + escapeHtml(certificate.studentName) + "</strong>" +
          '<small>' + escapeHtml(certificate.certificateCode || "--") + "</small>" +
        "</div>" +
      "</div>"
    );
  }

  function renderSpotlight() {
    const $container = $("#studentCertificateSpotlight").empty();
    const latest = getLatestCertificate();

    if (!latest) {
      $container.html(
        '<div class="student-certificate-empty">' +
          '<span><i class="bi bi-award" aria-hidden="true"></i></span>' +
          "<h3>" + escapeHtml(t("certificates.listPage.emptyLatestTitle", null, "Chua co chung chi")) + "</h3>" +
          "<p>" + escapeHtml(t("certificates.listPage.emptyLatestDesc", null, "Chung chi se xuat hien tai day sau khi ban dat dieu kien cua bai thi.")) + "</p>" +
        "</div>"
      );
      return;
    }

    $container.html(
      '<div class="student-certificate-spotlight-card-modern">' +
        renderCertificateMini(latest, { variant: "spotlight" }) +
        '<div class="student-certificate-spotlight-meta">' +
          '<span class="student-certificate-issued">' + escapeHtml(t("certificates.listPage.statusIssued", null, "Da cap")) + "</span>" +
          "<h3>" + escapeHtml(latest.examName) + "</h3>" +
          "<p>" + escapeHtml(latest.studentName) + "</p>" +
          '<dl>' +
            "<div><dt>" + escapeHtml(t("certificates.listPage.metaCode", null, "Ma chung chi")) + "</dt><dd>" + escapeHtml(latest.certificateCode || "--") + "</dd></div>" +
            "<div><dt>" + escapeHtml(t("certificates.listPage.metaDate", null, "Ngay cap")) + "</dt><dd>" + escapeHtml(formatDate(latest.issueDate)) + "</dd></div>" +
          "</dl>" +
        "</div>" +
        '<button class="student-certificate-primary-action" type="button" data-certificate-action="preview" data-certificate-id="' + latest.id + '">' +
          '<i class="bi bi-eye" aria-hidden="true"></i>' +
          '<span>' + escapeHtml(t("certificates.listPage.buttonPreview", null, "Xem chung chi")) + "</span>" +
        "</button>" +
      "</div>"
    );
  }

  function renderEmpty() {
    $("#certificateGrid").html(
      '<div class="student-certificate-empty grid-empty student-certificate-reveal is-visible" data-certificate-reveal>' +
        '<span><i class="bi bi-search" aria-hidden="true"></i></span>' +
        "<h3>" + escapeHtml(t("certificates.listPage.noCertificatesTitle", null, "Khong tim thay chung chi")) + "</h3>" +
        "<p>" + escapeHtml(t("certificates.listPage.noCertificatesCopy", null, "Hay thu tim bang ma chung chi hoac ten bai thi khac.")) + "</p>" +
      "</div>"
    );
  }

  function getPageItems() {
    const pageCount = Math.max(1, Math.ceil(state.filteredCertificates.length / state.pageSize));
    state.page = Math.min(Math.max(1, state.page), pageCount);
    const start = (state.page - 1) * state.pageSize;
    return state.filteredCertificates.slice(start, start + state.pageSize);
  }

  function renderPagination() {
    const total = state.filteredCertificates.length;
    const pageCount = Math.max(1, Math.ceil(total / state.pageSize));
    const start = total ? (state.page - 1) * state.pageSize + 1 : 0;
    const end = Math.min(total, state.page * state.pageSize);
    const summary = t("certificates.listPage.paginationSummary", { start: start, end: end, total: total }, "Hien thi " + start + "-" + end + " trong " + total + " chung chi");

    if (!total) {
      $(".student-certificate-pagination").remove();
      return;
    }

    const html =
      '<div class="student-certificate-pagination">' +
        "<span>" + escapeHtml(summary) + "</span>" +
        '<div>' +
          '<button type="button" data-certificate-page="prev" ' + (state.page <= 1 ? "disabled" : "") + '><i class="bi bi-arrow-left" aria-hidden="true"></i>' + escapeHtml(t("common.previous", null, "Truoc")) + "</button>" +
          '<strong>' + state.page + " / " + pageCount + "</strong>" +
          '<button type="button" data-certificate-page="next" ' + (state.page >= pageCount ? "disabled" : "") + '>' + escapeHtml(t("common.next", null, "Sau")) + '<i class="bi bi-arrow-right" aria-hidden="true"></i></button>' +
        "</div>" +
      "</div>";

    $(".student-certificate-pagination").remove();
    $("#certificateGrid").after(html);
  }

  function renderCards() {
    const $grid = $("#certificateGrid").empty();
    const pageItems = getPageItems();
    $("[data-certificate-count]").text(t("certificates.listPage.records", { count: state.filteredCertificates.length }, state.filteredCertificates.length + " ban ghi"));

    if (!state.filteredCertificates.length) {
      renderEmpty();
      renderPagination();
      return;
    }

    pageItems.forEach(function (certificate) {
      const expiryText = certificate.expiryDate
        ? formatDate(certificate.expiryDate)
        : t("certificates.listPage.noExpiry", null, "Khong thoi han");

      $grid.append(
        '<article class="student-certificate-card-modern student-certificate-reveal" data-certificate-reveal>' +
          renderCertificateMini(certificate, { variant: "card" }) +
          '<div class="student-certificate-card-body">' +
            '<div class="student-certificate-card-top">' +
              '<span class="student-certificate-issued">' + escapeHtml(t("certificates.listPage.statusIssued", null, "Da cap")) + "</span>" +
              '<button type="button" data-certificate-action="preview" data-certificate-id="' + certificate.id + '" aria-label="' + escapeHtml(t("certificates.listPage.buttonPreview", null, "Xem chung chi")) + '"><i class="bi bi-three-dots"></i></button>' +
            "</div>" +
            '<h3>' + escapeHtml(certificate.examName) + "</h3>" +
            '<dl class="student-certificate-card-meta">' +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaCode", null, "Ma chung chi")) + "</dt><dd>" + escapeHtml(certificate.certificateCode || "--") + "</dd></div>" +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaStudent", null, "Cap cho")) + "</dt><dd>" + escapeHtml(certificate.studentName) + "</dd></div>" +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaDate", null, "Ngay cap")) + "</dt><dd>" + escapeHtml(formatDate(certificate.issueDate)) + "</dd></div>" +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaExpiry", null, "Hieu luc")) + "</dt><dd>" + escapeHtml(expiryText) + "</dd></div>" +
            "</dl>" +
            '<div class="student-certificate-actions-modern">' +
              '<button class="student-certificate-button is-secondary" type="button" data-certificate-action="preview" data-certificate-id="' + certificate.id + '"><i class="bi bi-eye" aria-hidden="true"></i>' + escapeHtml(t("certificates.listPage.buttonPreview", null, "Xem chung chi")) + "</button>" +
              '<button class="student-certificate-button is-primary" type="button" data-certificate-action="download" data-certificate-id="' + certificate.id + '"><i class="bi bi-download" aria-hidden="true"></i>' + escapeHtml(t("certificates.listPage.buttonDownload", null, "Tai xuong")) + "</button>" +
            "</div>" +
          "</div>" +
        "</article>"
      );
    });

    renderPagination();
    initCertificateReveal();
  }

  function render() {
    renderPageTitle();
    renderMetrics();
    renderSpotlight();
    renderCards();
    initCertificateReveal();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredCertificates = state.certificates.filter(function (certificate) {
      return !keyword
        || String(certificate.examName).toLowerCase().includes(keyword)
        || String(certificate.certificateCode).toLowerCase().includes(keyword)
        || String(certificate.studentName).toLowerCase().includes(keyword);
    });

    state.page = 1;
    renderCards();
  }

  function findCertificate(id) {
    return state.certificates.find(function (certificate) {
      return String(certificate.id) === String(id);
    }) || null;
  }

  function buildApiUrl(path) {
    const normalizedPath = String(path || "").replace(/^\/+/, "");
    const apiBaseUrl = (Lms.config && Lms.config.apiBaseUrl) || "";
    return apiBaseUrl.replace(/\/$/, "") + "/" + normalizedPath.replace(/^api\//i, "");
  }

  function downloadCertificate(certificate) {
    if (!certificate) {
      return;
    }

    const accessToken = Lms.auth && Lms.auth.getAccessToken ? Lms.auth.getAccessToken() : null;
    fetch(buildApiUrl(certificate.downloadUrl), {
      method: "GET",
      headers: accessToken ? { Authorization: "Bearer " + accessToken } : {}
    }).then(function (response) {
      if (response.status === 401 && Lms.auth && Lms.auth.handleUnauthorized) {
        Lms.auth.handleUnauthorized();
        return null;
      }

      if (!response.ok) {
        throw new Error("DOWNLOAD_FAILED");
      }

      return Promise.all([response.blob(), response.headers.get("Content-Disposition")]);
    }).then(function (payload) {
      if (!payload) {
        return;
      }

      const blob = payload[0];
      const contentDisposition = payload[1] || "";
      const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(contentDisposition);
      const fileName = match
        ? decodeURIComponent(match[1].replace(/"/g, ""))
        : (certificate.certificateCode || "certificate") + ".html";
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }).catch(function () {
      showToast(
        "error",
        t("certificates.listPage.toastDownloadErrorTitle", null, "Khong tai duoc chung chi"),
        t("certificates.listPage.toastDownloadErrorMessage", null, "Khong the tai tep chung chi tu he thong.")
      );
    });
  }

  function loadCertificateDetail(id) {
    if (state.detailCache[id]) {
      return $.Deferred().resolve(state.detailCache[id]).promise();
    }

    return Lms.apiClient.get("api/certificates/" + encodeURIComponent(id)).then(function (response) {
      const detail = normalizeCertificate(getData(response) || {});
      state.detailCache[id] = detail;
      return detail;
    });
  }

  function renderPreviewModal(certificate) {
    if (!certificate || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const expiryText = certificate.expiryDate
      ? formatDate(certificate.expiryDate)
      : t("certificates.listPage.noExpiry", null, "Khong thoi han");
    const fileName = certificate.file && certificate.file.originalFileName ? certificate.file.originalFileName : "--";
    const fileSize = certificate.file && certificate.file.fileSize ? formatFileSize(certificate.file.fileSize) : "--";
    const modal = $(
      '<div class="student-certificate-modal">' +
        '<div class="student-certificate-modal-head">' +
          '<div>' +
            '<p class="lms-workspace-kicker">CERTIFICATE PREVIEW</p>' +
            '<h2>' + escapeHtml(t("certificates.listPage.modalPreviewTitle", null, "Xem chung chi")) + "</h2>" +
          "</div>" +
          '<button type="button" data-modal-close aria-label="' + escapeHtml(t("certificates.listPage.buttonClose", null, "Dong")) + '"><i class="bi bi-x-lg" aria-hidden="true"></i></button>' +
        "</div>" +
        '<div class="student-certificate-modal-body">' +
          '<div class="student-certificate-preview-sheet">' +
            '<span class="student-certificate-preview-watermark">LMS</span>' +
            '<div class="student-certificate-preview-top">' +
              '<span>' + escapeHtml(t("certificates.listPage.modalAwardTitle", null, "Chung nhan hoan thanh")) + "</span>" +
              '<strong>' + escapeHtml(certificate.certificateCode || "--") + "</strong>" +
            "</div>" +
            '<div class="student-certificate-preview-main">' +
              '<div class="student-certificate-preview-seal" aria-hidden="true"><i class="bi bi-award"></i></div>' +
              '<p>' + escapeHtml(t("certificates.listPage.awardedTo", null, "Duoc trao cho")) + "</p>" +
              '<h3>' + escapeHtml(certificate.studentName) + "</h3>" +
              '<small>' + escapeHtml(t("certificates.listPage.modalAwardCopyPlain", null, "Vi da hoan thanh xuat sac ky danh gia")) + "</small>" +
              '<h4>' + escapeHtml(certificate.examName) + "</h4>" +
            "</div>" +
            '<div class="student-certificate-preview-footer">' +
              '<div><span>' + escapeHtml(t("certificates.listPage.metaDate", null, "Ngay cap")) + '</span><strong>' + escapeHtml(formatDate(certificate.issueDate)) + "</strong></div>" +
              '<div><span>' + escapeHtml(t("certificates.listPage.metaExpiry", null, "Hieu luc")) + '</span><strong>' + escapeHtml(expiryText) + "</strong></div>" +
            "</div>" +
          "</div>" +
          '<aside class="student-certificate-preview-info">' +
            "<h3>" + escapeHtml(certificate.examName) + "</h3>" +
            '<dl>' +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaCode", null, "Ma chung chi")) + "</dt><dd>" + escapeHtml(certificate.certificateCode || "--") + "</dd></div>" +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaStudent", null, "Cap cho")) + "</dt><dd>" + escapeHtml(certificate.studentName) + "</dd></div>" +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaDate", null, "Ngay cap")) + "</dt><dd>" + escapeHtml(formatDate(certificate.issueDate)) + "</dd></div>" +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaExpiry", null, "Hieu luc")) + "</dt><dd>" + escapeHtml(expiryText) + "</dd></div>" +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaFile", null, "File")) + "</dt><dd>" + escapeHtml(fileName) + "</dd></div>" +
              "<div><dt>" + escapeHtml(t("certificates.listPage.metaFileSize", null, "Dung luong")) + "</dt><dd>" + escapeHtml(fileSize) + "</dd></div>" +
            "</dl>" +
            '<button class="student-certificate-primary-action" type="button" data-certificate-preview-download><i class="bi bi-download" aria-hidden="true"></i>' + escapeHtml(t("certificates.listPage.buttonDownload", null, "Tai xuong")) + "</button>" +
          "</aside>" +
        "</div>" +
      "</div>"
    );

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-certificate-preview-download]").on("click", function () {
      downloadCertificate(certificate);
    });

    Lms.ui.showModal(modal, { size: "student-certificate-modal-shell" });
  }

  function showPreview(certificate) {
    if (!certificate) {
      return;
    }

    loadCertificateDetail(certificate.id).done(function (detail) {
      renderPreviewModal($.extend({}, certificate, detail));
    }).fail(function () {
      renderPreviewModal(certificate);
      showToast(
        "warning",
        t("certificates.listPage.toastDetailWarningTitle", null, "Khong tai duoc chi tiet"),
        t("certificates.listPage.toastDetailWarningMessage", null, "Dang hien thi thong tin chung chi tu danh sach.")
      );
    });
  }

  function initCertificateReveal() {
    const $items = $("[data-certificate-reveal]").not("[data-certificate-reveal-ready]");
    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-certificate-reveal-ready", "true");
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
      this.style.setProperty("--reveal-delay", Math.min(index * 70, 360) + "ms");
      $(this).attr("data-certificate-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function bindEvents() {
    $("[data-certificate-filter='search']").on("input", function () {
      state.search = $(this).val();
      applyFilters();
    });

    $("[data-certificate-action='clear-filters']").on("click", function () {
      state.search = "";
      $("[data-certificate-filter='search']").val("");
      applyFilters();
    });

    $(document).on("click", "[data-certificate-action='preview']", function () {
      showPreview(findCertificate($(this).data("certificate-id")));
    });

    $(document).on("click", "[data-certificate-action='download']", function () {
      downloadCertificate(findCertificate($(this).data("certificate-id")));
    });

    $(document).on("click", "[data-certificate-page='prev']", function () {
      if (state.page > 1) {
        state.page -= 1;
        renderCards();
      }
    });

    $(document).on("click", "[data-certificate-page='next']", function () {
      const pageCount = Math.max(1, Math.ceil(state.filteredCertificates.length / state.pageSize));
      if (state.page < pageCount) {
        state.page += 1;
        renderCards();
      }
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadPageData() {
    Lms.apiClient.get("api/certificates?page=1&pageSize=100").done(function (response) {
      state.certificates = getItems(response).map(normalizeCertificate).sort(function (a, b) {
        return new Date(b.issueDate) - new Date(a.issueDate);
      });
      state.filteredCertificates = state.certificates.slice();
      state.page = 1;
      render();
    }).fail(function (error) {
      state.certificates = [];
      state.filteredCertificates = [];
      render();
      showToast(
        "error",
        t("certificates.listPage.toastLoadErrorTitle", null, "Chung chi khong kha dung"),
        error && error.message
          ? error.message
          : t("certificates.listPage.toastLoadErrorMessage", null, "Khong the tai du lieu chung chi tu he thong.")
      );
    });
  }

  function init() {
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      initCertificateReveal();
      return;
    }

    initCertificateReveal();
    loadPageData();
  }

  $(init);
})(window, jQuery);
