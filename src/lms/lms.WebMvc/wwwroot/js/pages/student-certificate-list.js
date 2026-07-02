(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    certificates: [],
    filteredCertificates: [],
    search: ""
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

  function formatDate(value) {
    return value ? new Date(value).toLocaleDateString() : "--";
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
      downloadUrl: "api/certificates/" + encodeURIComponent(item.id) + "/download"
    };
  }

  function renderPageTitle() {
    document.title = t("certificates.listPage.title", null, "Chung chi") + " - " + t("common.appName", null, "lms");
  }

  function renderMetrics() {
    const latest = state.certificates.slice().sort(function (a, b) {
      return new Date(b.issueDate) - new Date(a.issueDate);
    })[0];
    const available = state.certificates.filter(function (certificate) {
      return certificate.downloadUrl;
    }).length;

    $("[data-certificate-metric='total']").text(state.certificates.length);
    $("[data-certificate-metric='latest']").text(latest ? formatDate(latest.issueDate) : "--");
    $("[data-certificate-metric='available']").text(available);
  }

  function renderSpotlight() {
    const $container = $("#studentCertificateSpotlight").empty();
    const latest = state.certificates.slice().sort(function (a, b) {
      return new Date(b.issueDate) - new Date(a.issueDate);
    })[0];

    if (!latest) {
      $container.html(
        '<div class="lms-empty-compact">' +
          '<i class="bi bi-award" aria-hidden="true"></i>' +
          "<h3>Chua co chung chi</h3>" +
          "<p>Chung chi se xuat hien tai day sau khi ban dat dieu kien cua bai thi.</p>" +
        "</div>"
      );
      return;
    }

    $container.html(
      '<div class="student-certificate-spotlight-card">' +
        '<div class="student-certificate-spotlight-frame image-slot image-slot-lg image-slot-certificate" data-image-label="Latest certificate 1120x792">' +
          '<img src="/images/placeholders/certificate-placeholder.svg" alt="" aria-hidden="true" />' +
        "</div>" +
        "<h3>" + escapeHtml(latest.examName) + "</h3>" +
        "<p>" + escapeHtml(latest.studentName) + "</p>" +
        '<div class="student-certificate-spotlight-meta">' +
          "<span>" + escapeHtml(latest.certificateCode) + "</span>" +
          "<strong>" + escapeHtml(formatDate(latest.issueDate)) + "</strong>" +
        "</div>" +
        '<button class="app-button app-button-primary" type="button" data-certificate-action="preview" data-certificate-id="' + latest.id + '">' + escapeHtml(t("certificates.listPage.buttonPreview", null, "Xem truoc")) + "</button>" +
      "</div>"
    );
  }

  function renderEmpty() {
    $("#certificateGrid").html(
      '<div class="lms-empty-compact student-certificate-reveal is-visible" data-certificate-reveal>' +
        '<i class="bi bi-search" aria-hidden="true"></i>' +
        "<h3>" + escapeHtml(t("certificates.listPage.noCertificatesTitle", null, "Khong tim thay chung chi")) + "</h3>" +
        "<p>" + escapeHtml(t("certificates.listPage.noCertificatesCopy", null, "Hay thu tim bang ma chung chi hoac ten bai thi khac.")) + "</p>" +
      "</div>"
    );
  }

  function renderCards() {
    const $grid = $("#certificateGrid").empty();
    $("[data-certificate-count]").text(t("certificates.listPage.records", { count: state.filteredCertificates.length }, state.filteredCertificates.length + " ban ghi"));

    if (!state.filteredCertificates.length) {
      renderEmpty();
      return;
    }

    state.filteredCertificates.forEach(function (certificate) {
      $grid.append(
        '<article class="student-certificate-card student-certificate-reveal" data-certificate-reveal>' +
          '<div class="student-certificate-frame image-slot image-slot-lg image-slot-certificate" data-image-label="Certificate preview 1120x792">' +
            '<img src="/images/placeholders/certificate-placeholder.svg" alt="" aria-hidden="true" />' +
          "</div>" +
          '<div class="student-certificate-card-top">' +
            '<span class="student-certificate-seal" aria-hidden="true"><i class="bi bi-award"></i></span>' +
            '<span class="lms-status-success">' + escapeHtml(t("certificates.listPage.statusIssued", null, "Da cap")) + "</span>" +
          "</div>" +
          '<h3 class="student-certificate-title">' + escapeHtml(certificate.examName) + "</h3>" +
          '<dl class="student-certificate-meta">' +
            "<div><dt>" + escapeHtml(t("certificates.listPage.metaCode", null, "Ma chung chi")) + "</dt><dd>" + escapeHtml(certificate.certificateCode) + "</dd></div>" +
            "<div><dt>" + escapeHtml(t("certificates.listPage.metaStudent", null, "Cap cho")) + "</dt><dd>" + escapeHtml(certificate.studentName) + "</dd></div>" +
            "<div><dt>" + escapeHtml(t("certificates.listPage.metaDate", null, "Ngay cap")) + "</dt><dd>" + escapeHtml(formatDate(certificate.issueDate)) + "</dd></div>" +
          "</dl>" +
          '<div class="student-certificate-actions">' +
            '<button class="app-button app-button-secondary" type="button" data-certificate-action="preview" data-certificate-id="' + certificate.id + '">' + escapeHtml(t("certificates.listPage.buttonPreview", null, "Xem truoc")) + "</button>" +
            '<button class="app-button app-button-primary" type="button" data-certificate-action="download" data-certificate-id="' + certificate.id + '">' + escapeHtml(t("certificates.listPage.buttonDownload", null, "Tai xuong")) + "</button>" +
          "</div>" +
        "</article>"
      );
    });
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
        || String(certificate.certificateCode).toLowerCase().includes(keyword);
    });

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

  function showPreview(certificate) {
    if (!certificate || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = $(
      '<div class="linear-certificate-modal">' +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title" data-i18n="certificates.listPage.modalPreviewTitle">' + t("certificates.listPage.modalPreviewTitle", null, "Xem truoc chung chi") + "</h2>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="certificates.listPage.buttonClose">' + t("certificates.listPage.buttonClose", null, "Dong") + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<div class="certificate-preview linear-certificate-preview">' +
            '<div class="certificate-preview-bg image-slot image-slot-lg image-slot-certificate" data-image-label="Certificate modal preview 1120x792">' +
              '<img src="/images/placeholders/certificate-placeholder.svg" alt="" aria-hidden="true" />' +
            "</div>" +
            '<span class="certificate-preview-seal" aria-hidden="true">LMS</span>' +
            '<p class="certificate-preview-kicker" data-i18n="certificates.listPage.modalAwardTitle">' + t("certificates.listPage.modalAwardTitle", null, "Chung nhan hoan thanh") + "</p>" +
            "<h3></h3>" +
            '<p class="certificate-preview-copy"></p>' +
            '<div class="certificate-preview-meta">' +
              "<span></span>" +
              "<span></span>" +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="certificates.listPage.buttonClose">' + t("certificates.listPage.buttonClose", null, "Dong") + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-certificate-preview-download data-i18n="certificates.listPage.buttonDownload">' + t("certificates.listPage.buttonDownload", null, "Tai xuong") + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("h3").text(certificate.examName);
    modal.find(".certificate-preview-copy").html(
      t(
        "certificates.listPage.modalAwardCopy",
        { student: "<strong>" + escapeHtml(certificate.studentName) + "</strong>" },
        "Duoc trao cho <strong>" + escapeHtml(certificate.studentName) + "</strong> vi da hoan thanh xuat sac ky danh gia."
      )
    );
    modal.find(".certificate-preview-meta span").eq(0).text(certificate.certificateCode);
    modal.find(".certificate-preview-meta span").eq(1).text(
      t("certificates.listPage.modalIssuedDateText", { date: formatDate(certificate.issueDate) }, "Da cap ngay " + formatDate(certificate.issueDate))
    );
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-certificate-preview-download]").on("click", function () {
      downloadCertificate(certificate);
    });

    Lms.ui.showModal(modal);
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
      this.style.setProperty("--reveal-delay", Math.min(index * 50, 280) + "ms");
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

    $(document).on("lms:i18n:changed", render);
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

  function loadPageData() {
    Lms.apiClient.get("api/certificates?page=1&pageSize=200").done(function (response) {
      state.certificates = getItems(response).map(normalizeCertificate).sort(function (a, b) {
        return new Date(b.issueDate) - new Date(a.issueDate);
      });
      state.filteredCertificates = state.certificates.slice();
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

  $(init);
})(window, jQuery);
