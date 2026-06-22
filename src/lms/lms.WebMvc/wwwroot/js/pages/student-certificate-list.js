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
      Lms.ui.showToast({ type, title, message });
    }
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

  function renderEmpty() {
    $("#certificateGrid").html(
      '<div class="app-card certificate-empty-card linear-certificate-empty certificate-reveal is-visible" data-certificate-reveal>' +
        '<div class="app-card-body">' +
          '<div class="app-empty-state">' +
            '<div class="image-slot image-slot-md image-slot-certificate u-mb-4" data-image-label="Empty certificates 640x360">' +
              '<img src="/images/placeholders/certificate-placeholder.svg" alt="" aria-hidden="true" />' +
            '</div>' +
            '<h3 class="app-empty-title">' + t("certificates.listPage.noCertificatesTitle", null, "Không tìm thấy chứng chỉ") + '</h3>' +
            '<p class="app-empty-copy">' + t("certificates.listPage.noCertificatesCopy", null, "Hãy thử tìm bằng mã chứng chỉ hoặc tên bài thi khác.") + '</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderCards() {
    const $grid = $("#certificateGrid").empty();
    $("[data-certificate-count]").text(t("certificates.listPage.records", { count: state.filteredCertificates.length }, state.filteredCertificates.length + " bản ghi"));

    if (!state.filteredCertificates.length) {
      renderEmpty();
      return;
    }

    state.filteredCertificates.forEach(function (certificate) {
      $grid.append(
        '<article class="app-card certificate-card linear-certificate-card app-card-clickable app-animate-slide-up certificate-reveal" data-certificate-reveal>' +
          '<div class="app-card-body">' +
            '<div class="certificate-frame linear-certificate-frame image-slot image-slot-lg image-slot-certificate" data-image-label="Certificate preview 1120x792">' +
              '<img src="/images/placeholders/certificate-placeholder.svg" alt="" aria-hidden="true" />' +
            '</div>' +
            '<div class="certificate-card-top">' +
              '<span class="certificate-seal" aria-hidden="true"><i class="bi bi-award"></i></span>' +
              '<span class="app-badge app-badge-success">' + t("certificates.listPage.statusIssued", null, "Đã cấp") + '</span>' +
            '</div>' +
            '<h2 class="certificate-title">' + escapeHtml(certificate.examName) + '</h2>' +
            '<dl class="certificate-meta">' +
              '<div>' +
                '<dt>' + t("certificates.listPage.metaCode", null, "Mã chứng chỉ") + '</dt>' +
                '<dd>' + escapeHtml(certificate.certificateCode) + '</dd>' +
              '</div>' +
              '<div>' +
                '<dt>' + t("certificates.listPage.metaStudent", null, "Cấp cho") + '</dt>' +
                '<dd>' + escapeHtml(certificate.studentName) + '</dd>' +
              '</div>' +
              '<div>' +
                '<dt>' + t("certificates.listPage.metaDate", null, "Ngày cấp") + '</dt>' +
                '<dd>' + escapeHtml(formatDate(certificate.issueDate)) + '</dd>' +
              '</div>' +
            '</dl>' +
          '</div>' +
          '<div class="app-card-footer certificate-actions">' +
            '<button class="app-button app-button-secondary" type="button" data-certificate-action="preview" data-certificate-id="' + certificate.id + '">' + t("certificates.listPage.buttonPreview", null, "Xem trước") + '</button>' +
            '<button class="app-button app-button-primary" type="button" data-certificate-action="download" data-certificate-id="' + certificate.id + '">' + t("certificates.listPage.buttonDownload", null, "Tải xuống") + '</button>' +
          '</div>' +
        '</article>'
      );
    });
    initCertificateReveal();
  }

  function render() {
    renderMetrics();
    renderCards();
    initCertificateReveal();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredCertificates = state.certificates.filter(function (certificate) {
      return !keyword ||
        certificate.examName.toLowerCase().includes(keyword) ||
        certificate.certificateCode.toLowerCase().includes(keyword);
    });

    render();
  }

  function findCertificate(id) {
    return state.certificates.find(function (certificate) {
      return String(certificate.id) === String(id);
    }) || null;
  }

  function showPreview(certificate) {
    if (!certificate || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = $(
      '<div class="linear-certificate-modal">' +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title" data-i18n="certificates.listPage.modalPreviewTitle">' + t("certificates.listPage.modalPreviewTitle", null, "Xem trước chứng chỉ") + '</h2>' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="certificates.listPage.buttonClose">' + t("certificates.listPage.buttonClose", null, "Đóng") + '</button>' +
        '</div>' +
        '<div class="app-modal-body">' +
          '<div class="certificate-preview linear-certificate-preview">' +
            '<div class="certificate-preview-bg image-slot image-slot-lg image-slot-certificate" data-image-label="Certificate modal preview 1120x792">' +
              '<img src="/images/placeholders/certificate-placeholder.svg" alt="" aria-hidden="true" />' +
            '</div>' +
            '<span class="certificate-preview-seal" aria-hidden="true">LMS</span>' +
            '<p class="certificate-preview-kicker" data-i18n="certificates.listPage.modalAwardTitle">' + t("certificates.listPage.modalAwardTitle", null, "Chứng nhận hoàn thành") + '</p>' +
            '<h3></h3>' +
            '<p class="certificate-preview-copy"></p>' +
            '<div class="certificate-preview-meta">' +
              '<span></span>' +
              '<span></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="certificates.listPage.buttonClose">' + t("certificates.listPage.buttonClose", null, "Đóng") + '</button>' +
          '<button class="app-button app-button-primary" type="button" data-certificate-preview-download data-i18n="certificates.listPage.buttonDownload">' + t("certificates.listPage.buttonDownload", null, "Tải xuống") + '</button>' +
        '</div>' +
      '</div>'
    );

    modal.find("h3").text(certificate.examName);
    modal.find(".certificate-preview-copy").html(
      t("certificates.listPage.modalAwardCopy", { student: "<strong>" + escapeHtml(certificate.studentName) + "</strong>" }, "Được trao cho <strong>" + escapeHtml(certificate.studentName) + "</strong> vì đã hoàn thành xuất sắc kỳ đánh giá.")
    );
    modal.find(".certificate-preview-meta span").eq(0).text(certificate.certificateCode);
    modal.find(".certificate-preview-meta span").eq(1).text(t("certificates.listPage.modalIssuedDateText", { date: formatDate(certificate.issueDate) }, "Đã cấp ngày " + formatDate(certificate.issueDate)));
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-certificate-preview-download]").on("click", function () {
      showToast(
        "info",
        t("certificates.listPage.toastDownloadTitle", null, "Tải xuống mẫu"),
        t("certificates.listPage.toastDownloadMessage", null, "Tải xuống chứng chỉ sẽ được kết nối với tệp tin thực tế ở giai đoạn sau.")
      );
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
      showToast(
        "info",
        t("certificates.listPage.toastDownloadTitle", null, "Tải xuống mẫu"),
        t("certificates.listPage.toastDownloadMessage", null, "Tải xuống chứng chỉ sẽ được kết nối với tệp tin thực tế ở giai đoạn sau.")
      );
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
    Lms.apiClient.get("certificates.json").done(function (response) {
      state.certificates = getItems(response).sort(function (a, b) {
        return new Date(b.issueDate) - new Date(a.issueDate);
      });
      state.filteredCertificates = state.certificates.slice();
      render();
    }).fail(function () {
      state.certificates = [];
      state.filteredCertificates = [];
      render();
      showToast(
        "error",
        t("certificates.listPage.toastLoadErrorTitle", null, "Chứng chỉ không khả dụng"),
        t("certificates.listPage.toastLoadErrorMessage", null, "Không thể tải dữ liệu mô phỏng chứng chỉ.")
      );
    });
  }

  $(init);
})(window, jQuery);
