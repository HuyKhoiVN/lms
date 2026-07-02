(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    logs: [],
    filteredLogs: [],
    serverTotal: 0,
    page: 1,
    pageSize: 8,
    search: "",
    action: "",
    entity: "",
    date: ""
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

  function formatDateTime(value) {
    return value ? new Date(value).toLocaleString() : "--";
  }

  function formatDate(value) {
    return value ? new Date(value).toLocaleDateString() : "--";
  }

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function getUniqueValues(key) {
    return Array.from(new Set(state.logs.map(function (log) {
      return log[key];
    }).filter(Boolean))).sort();
  }

  function populateFilter(selector, values, placeholder) {
    const currentValue = $(selector).val() || "";
    const $select = $(selector).empty().append('<option value="">' + placeholder + "</option>");

    values.forEach(function (value) {
      $select.append('<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + "</option>");
    });

    $select.val(currentValue);
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredLogs.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredLogs.slice(start, start + state.pageSize);
  }

  function getBadgeClass(action) {
    const normalized = String(action || "").toLowerCase();

    if (normalized.includes("delete") || normalized.includes("lock")) {
      return "app-badge-danger";
    }

    if (normalized.includes("submit") || normalized.includes("create") || normalized.includes("generate")) {
      return "app-badge-success";
    }

    return "app-badge-info";
  }

  function renderMetrics() {
    const latest = state.logs.slice().sort(function (a, b) {
      return new Date(b.createdDate) - new Date(a.createdDate);
    })[0];

    $("[data-audit-metric='total']").text(state.serverTotal || state.logs.length);
    $("[data-audit-metric='users']").text(getUniqueValues("userName").length);
    $("[data-audit-metric='actions']").text(getUniqueValues("action").length);
    $("[data-audit-metric='latest']").text(latest ? formatDate(latest.createdDate) : "--");
  }

  function renderRows() {
    const $rows = $("#auditLogRows").empty();
    const rows = getCurrentPageRows();

    if (!rows.length) {
      $rows.append(
        "<tr>" +
          '<td colspan="6">' +
            '<div class="app-empty-state">' +
              '<div class="image-slot image-slot-md image-slot-admin u-mb-4" data-image-label="Empty audit logs illustration 320x180"><img src="/images/backgrounds/admin-dashboard-bg.svg" alt="" aria-hidden="true" /></div>' +
              '<h3 class="app-empty-title">' + t("auditLogs.adminPage.noLogsTitle", null, "Không tìm thấy nhật ký hệ thống") + "</h3>" +
              '<p class="app-empty-copy">' + t("auditLogs.adminPage.noLogsCopy", null, "Thử từ khóa, hành động, đối tượng hoặc bộ lọc ngày khác.") + "</p>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
      return;
    }

    rows.forEach(function (log) {
      const logIdText = t("auditLogs.adminPage.logIdLabel", { id: log.id }, "Sự kiện nhật ký #" + log.id);
      const actionBtnText = t("auditLogs.adminPage.buttonView", null, "Xem");
      const description = log.entityId ? (log.entityName + " #" + log.entityId) : (log.entityName || "--");

      $rows.append(
        "<tr>" +
          "<td>" +
            '<div class="admin-user-cell audit-user-cell">' +
              '<span class="app-avatar admin-type-avatar" aria-hidden="true"><i class="bi bi-clock-history"></i></span>' +
              "<div>" +
                "<strong>" + escapeHtml(log.userName || "Hệ thống") + "</strong>" +
                "<span>" + escapeHtml(logIdText) + "</span>" +
              "</div>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge ' + getBadgeClass(log.action) + '">' + escapeHtml(log.action) + "</span></td>" +
          '<td><span class="app-badge app-badge-muted">' + escapeHtml(log.entityName || "--") + "</span></td>" +
          '<td class="audit-description-cell">' + escapeHtml(description) + "</td>" +
          "<td>" + escapeHtml(formatDateTime(log.createdDate)) + "</td>" +
          '<td class="u-text-right">' +
            '<button class="app-button app-button-secondary" type="button" data-audit-action="view" data-audit-id="' + log.id + '">' + escapeHtml(actionBtnText) + "</button>" +
          "</td>" +
        "</tr>"
      );
    });
  }

  function renderPagination() {
    const pageCount = getPageCount();
    const $pages = $("#auditPaginationPages").empty();
    const startRecord = state.filteredLogs.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const endRecord = Math.min(state.page * state.pageSize, state.filteredLogs.length);

    $("[data-audit-result-count]").text(t("auditLogs.adminPage.recordsCount", { count: state.filteredLogs.length }, state.filteredLogs.length + " bản ghi"));
    $("[data-audit-page-info]").text(t("auditLogs.adminPage.showingInfo", { start: startRecord, end: endRecord, total: state.filteredLogs.length }, "Hiển thị " + startRecord + "-" + endRecord + " trên " + state.filteredLogs.length + " nhật ký"));
    $("[data-audit-page='prev']").prop("disabled", state.page <= 1);
    $("[data-audit-page='next']").prop("disabled", state.page >= pageCount);

    for (let page = 1; page <= pageCount; page += 1) {
      const $button = $('<button class="admin-pagination-page" type="button"></button>');
      $button.text(page);
      $button.attr("data-audit-page-number", page);
      $button.toggleClass("active", page === state.page);
      $pages.append($button);
    }
  }

  function render() {
    renderMetrics();
    renderRows();
    renderPagination();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredLogs = state.logs.filter(function (log) {
      const logDate = log.createdDate ? log.createdDate.slice(0, 10) : "";
      const matchesKeyword = !keyword ||
        String(log.userName || "").toLowerCase().includes(keyword) ||
        String(log.action || "").toLowerCase().includes(keyword) ||
        String(log.entityName || "").toLowerCase().includes(keyword);
      const matchesAction = !state.action || log.action === state.action;
      const matchesEntity = !state.entity || log.entityName === state.entity;
      const matchesDate = !state.date || logDate === state.date;

      return matchesKeyword && matchesAction && matchesEntity && matchesDate;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function showLogDetail(log) {
    if (!log || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const beforeData = log.beforeData || "--";
    const afterData = log.afterData || "--";
    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          "<div>" +
            '<h2 class="app-modal-title">' + t("auditLogs.adminPage.modalTitle", null, "Chi tiết nhật ký hệ thống") + "</h2>" +
            '<p class="app-card-subtitle">Dữ liệu truy xuất từ audit log backend.</p>' +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + t("common.close", null, "Đóng") + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<dl class="audit-detail-list">' +
            "<div><dt>Người dùng</dt><dd data-audit-detail='user'></dd></div>" +
            "<div><dt>Hành động</dt><dd data-audit-detail='action'></dd></div>" +
            "<div><dt>Đối tượng</dt><dd data-audit-detail='entity'></dd></div>" +
            "<div><dt>Ngày giờ</dt><dd data-audit-detail='dateTime'></dd></div>" +
            "<div><dt>Before</dt><dd><pre class='u-mb-0' data-audit-detail='before'></pre></dd></div>" +
            "<div><dt>After</dt><dd><pre class='u-mb-0' data-audit-detail='after'></pre></dd></div>" +
          "</dl>" +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + t("common.close", null, "Đóng") + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("[data-audit-detail='user']").text(log.userName || "Hệ thống");
    modal.find("[data-audit-detail='action']").html('<span class="app-badge ' + getBadgeClass(log.action) + '">' + escapeHtml(log.action) + "</span>");
    modal.find("[data-audit-detail='entity']").text((log.entityName || "--") + (log.entityId ? " #" + log.entityId : ""));
    modal.find("[data-audit-detail='dateTime']").text(formatDateTime(log.createdDate));
    modal.find("[data-audit-detail='before']").text(beforeData);
    modal.find("[data-audit-detail='after']").text(afterData);
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);

    Lms.ui.showModal(modal);
  }

  function buildQuery() {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", "200");

    if (state.action) {
      params.set("action", state.action);
    }
    if (state.entity) {
      params.set("entityName", state.entity);
    }
    if (state.date) {
      params.set("fromDate", state.date);
      params.set("toDate", state.date);
    }

    return params.toString();
  }

  function loadPageData() {
    Lms.apiClient.get("api/audit-logs?" + buildQuery()).done(function (response) {
      const data = getData(response) || {};
      state.serverTotal = Number(data.total || 0);
      state.logs = getItems(response).slice().sort(function (a, b) {
        return new Date(b.createdDate) - new Date(a.createdDate);
      });
      state.filteredLogs = state.logs.slice();

      populateFilter("[data-audit-filter='action']", getUniqueValues("action"), t("auditLogs.adminPage.optionAllActions", null, "Tất cả hành động"));
      populateFilter("[data-audit-filter='entity']", getUniqueValues("entityName"), t("auditLogs.adminPage.optionAllEntities", null, "Tất cả đối tượng"));
      applyFilters();
    }).fail(function (error) {
      $("#auditLogRows").html(
        '<tr><td colspan="6">' +
          '<div class="app-empty-state">' +
            '<div class="app-empty-icon" aria-hidden="true">!</div>' +
            '<h3 class="app-empty-title">' + t("auditLogs.adminPage.toastLoadErrorTitle", null, "Không thể tải nhật ký hệ thống") + "</h3>" +
            '<p class="app-empty-copy">' + (error && error.message ? escapeHtml(error.message) : "Vui lòng kiểm tra API audit log.") + "</p>" +
          "</div>" +
        "</td></tr>"
      );
      showToast("error", t("auditLogs.adminPage.toastLoadErrorTitle", null, "Không thể tải nhật ký hệ thống"), error && error.message ? error.message : t("auditLogs.adminPage.toastLoadErrorMsgFile", null, "Không thể tải dữ liệu audit log."));
    });
  }

  function exportCurrentRows() {
    const rows = state.filteredLogs.map(function (log) {
      return [
        log.id,
        '"' + String(log.userName || "Hệ thống").replace(/"/g, '""') + '"',
        '"' + String(log.action || "").replace(/"/g, '""') + '"',
        '"' + String(log.entityName || "").replace(/"/g, '""') + '"',
        '"' + String(log.createdDate || "").replace(/"/g, '""') + '"'
      ].join(",");
    });
    const csv = ["Id,UserName,Action,EntityName,CreatedDate"].concat(rows).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "audit-logs.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  function bindEvents() {
    $("[data-audit-filter='search']").on("input", function () {
      state.search = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-audit-filter='action']").on("change", function () {
      state.action = $(this).val();
      state.page = 1;
      loadPageData();
    });

    $("[data-audit-filter='entity']").on("change", function () {
      state.entity = $(this).val();
      state.page = 1;
      loadPageData();
    });

    $("[data-audit-filter='date']").on("change", function () {
      state.date = $(this).val();
      state.page = 1;
      loadPageData();
    });

    $("[data-audit-action='clear-filters']").on("click", function () {
      state.search = "";
      state.action = "";
      state.entity = "";
      state.date = "";
      $("[data-audit-filter]").val("");
      state.page = 1;
      loadPageData();
    });

    $("[data-audit-action='export']").on("click", function () {
      exportCurrentRows();
    });

    $(document).on("click", "[data-audit-page='prev']", function () {
      if (state.page > 1) {
        state.page -= 1;
        render();
      }
    });

    $(document).on("click", "[data-audit-page='next']", function () {
      if (state.page < getPageCount()) {
        state.page += 1;
        render();
      }
    });

    $(document).on("click", "[data-audit-page-number]", function () {
      state.page = Number($(this).data("audit-page-number"));
      render();
    });

    $(document).on("click", "[data-audit-action='view']", function () {
      const logId = $(this).data("audit-id");

      Lms.apiClient.get("api/audit-logs/" + logId).done(function (response) {
        showLogDetail(getData(response));
      }).fail(function (error) {
        showToast("error", "Không thể tải chi tiết nhật ký", error && error.message ? error.message : "Vui lòng thử lại.");
      });
    });
  }

  function init() {
    bindEvents();

    $(document).on("lms:i18n:changed", function () {
      populateFilter("[data-audit-filter='action']", getUniqueValues("action"), t("auditLogs.adminPage.optionAllActions", null, "Tất cả hành động"));
      populateFilter("[data-audit-filter='entity']", getUniqueValues("entityName"), t("auditLogs.adminPage.optionAllEntities", null, "Tất cả đối tượng"));
      render();
    });

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  $(init);
})(window, jQuery);
