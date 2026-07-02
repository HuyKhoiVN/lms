(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    exams: [],
    filteredExams: [],
    users: [],
    groups: [],
    page: 1,
    pageSize: 8,
    search: "",
    status: "",
    duration: "",
    review: "",
    loaded: false
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

  function normalizeReviewMode(reviewMode) {
    const map = {
      FULL_REVIEW: "FullReview",
      RESULT_ONLY: "ResultOnly",
      ANSWER_ONLY: "AnswerOnly",
      NO_REVIEW: "NoReview"
    };
    return map[reviewMode] || reviewMode || "ResultOnly";
  }

  function mapExam(item) {
    return {
      id: Number(item.id),
      code: item.code || "",
      name: item.name || "",
      durationMinutes: Number(item.durationMinutes || 0),
      passScore: Number(item.passScore || 0),
      questionCount: Number(item.questionCount || 0),
      attemptLimit: item.attemptLimit,
      reviewMode: normalizeReviewMode(item.reviewMode),
      isPublished: Boolean(item.isPublished),
      status: item.isPublished ? "Published" : "Draft",
      assignedCount: null
    };
  }

  function findExam(examId) {
    return state.exams.find(function (exam) {
      return exam.id === Number(examId);
    });
  }

  function getBadgeClass(status) {
    return status === "Published" ? "app-badge-success" : "app-badge-muted";
  }

  function translateStatus(status) {
    return status === "Published"
      ? t("exams.adminListPage.published", null, "Da xuat ban")
      : t("exams.adminListPage.draft", null, "Ban nhap");
  }

  function getReviewLabel(reviewMode) {
    const labels = {
      FullReview: t("exams.adminListPage.reviewFull", null, "Xem toan bo"),
      ResultOnly: t("exams.adminListPage.reviewResultOnly", null, "Chi xem ket qua"),
      AnswerOnly: t("exams.adminListPage.reviewAnswerOnly", null, "Chi xem dap an"),
      NoReview: t("exams.adminListPage.reviewNo", null, "Khong cho xem lai")
    };

    return labels[normalizeReviewMode(reviewMode)] || reviewMode;
  }

  function getExamVisual(index) {
    const images = ["/images/online-exam.jpg", "/images/exam-stress.jpg", "/images/graduation-success.jpg"];
    return images[index % images.length];
  }

  function renderPageTitle() {
    document.title = t("exams.adminListPage.title", null, "Quan ly bai thi") + " - " + t("common.appName", null, "lms");
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredExams.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredExams.slice(start, start + state.pageSize);
  }

  function formatAssignedCount(count) {
    return count === null || typeof count === "undefined" ? "--" : String(count);
  }

  function renderMetrics() {
    const published = state.exams.filter(function (exam) {
      return exam.status === "Published";
    }).length;
    const assigned = state.exams.reduce(function (total, exam) {
      return total + Number(exam.assignedCount || 0);
    }, 0);
    const questions = state.exams.reduce(function (total, exam) {
      return total + Number(exam.questionCount || 0);
    }, 0);

    $("[data-exam-metric='total']").text(state.exams.length);
    $("[data-exam-metric='published']").text(published);
    $("[data-exam-metric='assigned']").text(assigned);
    $("[data-exam-metric='questions']").text(questions);
  }

  function renderRows() {
    const $rows = $("#examTableRows").empty();
    const rows = getCurrentPageRows();

    if (!rows.length) {
      $rows.append(
        "<tr>" +
          '<td colspan="8">' +
            '<div class="app-empty-state">' +
              '<div class="image-slot image-slot-md image-slot-exam u-mb-4" data-image-label="Empty exams illustration 320x180"><img src="/images/placeholders/exam-placeholder.svg" alt="" aria-hidden="true" /></div>' +
              '<h3 class="app-empty-title">' + escapeHtml(t("exams.adminListPage.noExamsTitle", null, "Khong tim thay bai thi")) + "</h3>" +
              '<p class="app-empty-copy">' + escapeHtml(t("exams.adminListPage.noExamsCopy", null, "Thu tu khoa, trang thai, thoi luong hoac bo loc xem lai khac.")) + "</p>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
      return;
    }

    rows.forEach(function (exam, index) {
      const publishAction = exam.status === "Published"
        ? t("exams.adminListPage.unpublish", null, "Huy xuat ban")
        : t("exams.adminListPage.publish", null, "Xuat ban");

      $rows.append(
        "<tr>" +
          "<td>" +
            '<div class="admin-user-cell">' +
              '<span class="app-avatar admin-thumbnail-avatar" aria-hidden="true"><img src="' + getExamVisual(index) + '" alt="" /></span>' +
              "<div>" +
                "<strong>" + escapeHtml(exam.name) + "</strong>" +
                "<span>" + escapeHtml(t("exams.adminListPage.examId", { id: exam.id }, "Ma bai thi #" + exam.id)) + "</span>" +
              "</div>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge ' + getBadgeClass(exam.status) + '">' + escapeHtml(translateStatus(exam.status)) + "</span></td>" +
          "<td>" + escapeHtml(exam.durationMinutes) + " " + escapeHtml(t("exams.adminListPage.minutesUnit", null, "phut")) + "</td>" +
          "<td>" + escapeHtml(exam.passScore) + "</td>" +
          "<td>" + escapeHtml(exam.questionCount) + "</td>" +
          "<td>" + escapeHtml(formatAssignedCount(exam.assignedCount)) + "</td>" +
          "<td>" + escapeHtml(getReviewLabel(exam.reviewMode)) + "</td>" +
          '<td class="u-text-right">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-exam-action="edit" data-exam-id="' + exam.id + '">' + escapeHtml(t("common.edit", null, "Sua")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-exam-action="assign" data-exam-id="' + exam.id + '">' + escapeHtml(t("exams.adminListPage.assign", null, "Giao")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-exam-action="publish" data-exam-id="' + exam.id + '">' + escapeHtml(publishAction) + "</button>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
    });
  }

  function renderPagination() {
    const pageCount = getPageCount();
    const $pages = $("#examPaginationPages").empty();
    const startRecord = state.filteredExams.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const endRecord = Math.min(state.page * state.pageSize, state.filteredExams.length);

    $("[data-exam-result-count]").text(t("exams.adminListPage.records", { count: state.filteredExams.length }, state.filteredExams.length + " ban ghi"));
    $("[data-exam-page-info]").text(t("exams.adminListPage.showing", { start: startRecord, end: endRecord, total: state.filteredExams.length }, "Hien thi " + startRecord + "-" + endRecord + " tren " + state.filteredExams.length + " bai thi"));
    $("[data-exam-page='prev']").prop("disabled", state.page <= 1);
    $("[data-exam-page='next']").prop("disabled", state.page >= pageCount);

    for (let page = 1; page <= pageCount; page += 1) {
      const $button = $('<button class="admin-pagination-page" type="button"></button>');
      $button.text(page);
      $button.attr("data-exam-page-number", page);
      $button.toggleClass("active", page === state.page);
      $pages.append($button);
    }
  }

  function render() {
    if (!state.loaded) return;
    renderPageTitle();
    renderMetrics();
    renderRows();
    renderPagination();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredExams = state.exams.filter(function (exam) {
      const matchesKeyword = !keyword || exam.name.toLowerCase().includes(keyword) || String(exam.code || "").toLowerCase().includes(keyword);
      const matchesStatus = !state.status || exam.status === state.status;
      const matchesDuration = !state.duration
        || (state.duration === "short" && Number(exam.durationMinutes) <= 30)
        || (state.duration === "long" && Number(exam.durationMinutes) > 30);
      const matchesReview = !state.review || normalizeReviewMode(exam.reviewMode) === normalizeReviewMode(state.review);

      return matchesKeyword && matchesStatus && matchesDuration && matchesReview;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function publishExam(exam) {
    const endpoint = exam.status === "Published"
      ? "api/exams/" + exam.id + "/unpublish"
      : "api/exams/" + exam.id + "/publish";

    Lms.apiClient.post(endpoint, {}).done(function () {
      exam.isPublished = exam.status !== "Published";
      exam.status = exam.isPublished ? "Published" : "Draft";
      applyFilters();
      showToast(
        "success",
        exam.status === "Published"
          ? t("exams.adminListPage.publishedTitle", null, "Da xuat ban bai thi")
          : t("exams.adminListPage.unpublishedTitle", null, "Da huy xuat ban bai thi"),
        exam.status === "Published"
          ? t("exams.adminListPage.publishedMessage", { name: exam.name }, exam.name + " da duoc xuat ban.")
          : t("exams.adminListPage.unpublishedMessage", { name: exam.name }, exam.name + " da duoc chuyen ve ban nhap.")
      );
    }).fail(function (error) {
      showToast("error", t("exams.adminListPage.publishErrorTitle", null, "Cap nhat trang thai that bai"), error && error.message ? error.message : t("exams.adminListPage.publishErrorMessage", null, "Khong the cap nhat trang thai bai thi."));
    });
  }

  function showPublishConfirm(examId) {
    const exam = findExam(examId);

    if (!exam || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const isPublished = exam.status === "Published";
    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title">' + escapeHtml(isPublished ? t("exams.adminListPage.unpublishExamTitle", null, "Huy xuat ban bai thi") : t("exams.adminListPage.publishExamTitle", null, "Xuat ban bai thi")) + "</h2>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("exams.adminListPage.close", null, "Dong")) + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0">' + escapeHtml(isPublished ? t("exams.adminListPage.unpublishConfirmPrefix", null, "Huy xuat ban bai thi ") : t("exams.adminListPage.publishConfirmPrefix", null, "Xuat ban bai thi ")) + "<strong></strong>" + escapeHtml(isPublished ? t("exams.adminListPage.unpublishConfirmSuffix", null, "? Hoc vien se khong the bat dau moi tu bai thi nay.") : t("exams.adminListPage.publishConfirmSuffix", null, "? Hoc vien duoc giao bai thi nay se co the nhin thay no.")) + "</p>" +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("exams.adminListPage.cancel", null, "Huy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-exam-confirm-publish>' + escapeHtml(isPublished ? t("exams.adminListPage.unpublish", null, "Huy xuat ban") : t("exams.adminListPage.publish", null, "Xuat ban")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("strong").text(exam.name);
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-exam-confirm-publish]").on("click", function () {
      Lms.ui.closeModal();
      publishExam(exam);
    });

    Lms.ui.showModal(modal);
  }

  function buildAssignForm(exam) {
    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          "<div>" +
            '<h2 class="app-modal-title">' + escapeHtml(t("exams.adminListPage.assignExamTitle", null, "Giao bai thi")) + "</h2>" +
            '<p class="app-card-subtitle"></p>' +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("exams.adminListPage.close", null, "Dong")) + "</button>" +
        "</div>" +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("exams.adminListPage.assignToUser", null, "Giao cho nguoi dung")) +
            '<select class="app-select" name="userId"></select>' +
          "</label>" +
          '<label class="auth-field">' + escapeHtml(t("exams.adminListPage.assignToGroup", null, "Giao cho nhom")) +
            '<select class="app-select" name="groupId"></select>' +
          "</label>" +
          '<p class="page-muted u-mb-0">' + escapeHtml(t("exams.adminListPage.assignHelp", null, "Ban co the giao truc tiep cho hoc vien hoac cho nhom.")) + "</p>" +
        "</form>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("exams.adminListPage.cancel", null, "Huy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-exam-confirm-assign>' + escapeHtml(t("exams.adminListPage.assign", null, "Giao")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find(".app-card-subtitle").text(exam.name);
    const $userSelect = modal.find("[name='userId']").append('<option value="">' + escapeHtml(t("exams.adminListPage.noIndividualUser", null, "Khong chon nguoi dung rieng le")) + "</option>");
    const $groupSelect = modal.find("[name='groupId']").append('<option value="">' + escapeHtml(t("exams.adminListPage.noGroup", null, "Khong chon nhom")) + "</option>");

    state.users
      .filter(function (user) {
        return user.role === "Student";
      })
      .forEach(function (user) {
        $userSelect.append('<option value="' + user.id + '">' + escapeHtml(user.fullName || user.userName) + "</option>");
      });

    state.groups.forEach(function (group) {
      $groupSelect.append('<option value="' + group.id + '">' + escapeHtml(group.name) + "</option>");
    });

    return modal;
  }

  function showAssignForm(examId) {
    const exam = findExam(examId);

    if (!exam || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = buildAssignForm(exam);

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-exam-confirm-assign]").on("click", function () {
      const userId = modal.find("[name='userId']").val();
      const groupId = modal.find("[name='groupId']").val();

      if (!userId && !groupId) {
        showToast("warning", t("exams.adminListPage.chooseAssignmentTitle", null, "Chon doi tuong giao"), t("exams.adminListPage.chooseAssignmentMessage", null, "Chon nguoi dung hoac nhom truoc khi giao."));
        return;
      }

      Lms.apiClient.post("api/exams/" + exam.id + "/assign", {
        userIds: userId ? [Number(userId)] : [],
        groupIds: groupId ? [Number(groupId)] : []
      }).done(function () {
        if (exam.assignedCount === null) {
          exam.assignedCount = 0;
        }
        exam.assignedCount += (userId ? 1 : 0) + (groupId ? 1 : 0);
        Lms.ui.closeModal();
        applyFilters();
        showToast("success", t("exams.adminListPage.examAssignedTitle", null, "Da giao bai thi"), t("exams.adminListPage.examAssignedMessage", { name: exam.name }, "Da cap nhat giao cho " + exam.name + "."));
      }).fail(function (error) {
        showToast("error", t("exams.adminListPage.assignErrorTitle", null, "Giao bai thi that bai"), error && error.message ? error.message : t("exams.adminListPage.assignErrorMessage", null, "Khong the giao bai thi."));
      });
    });

    Lms.ui.showModal(modal);
  }

  function bindEvents() {
    $("[data-exam-filter='search']").on("input", function () {
      state.search = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-exam-filter='status']").on("change", function () {
      state.status = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-exam-filter='duration']").on("change", function () {
      state.duration = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-exam-filter='review']").on("change", function () {
      state.review = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-exam-action='clear-filters']").on("click", function () {
      state.search = "";
      state.status = "";
      state.duration = "";
      state.review = "";
      $("[data-exam-filter='search']").val("");
      $("[data-exam-filter='status']").val("");
      $("[data-exam-filter='duration']").val("");
      $("[data-exam-filter='review']").val("");
      state.page = 1;
      applyFilters();
    });

    $(document).on("click", "[data-exam-page='prev']", function () {
      if (state.page > 1) {
        state.page -= 1;
        render();
      }
    });

    $(document).on("click", "[data-exam-page='next']", function () {
      if (state.page < getPageCount()) {
        state.page += 1;
        render();
      }
    });

    $(document).on("click", "[data-exam-page-number]", function () {
      state.page = Number($(this).data("exam-page-number"));
      render();
    });

    $(document).on("click", "[data-exam-action='publish']", function () {
      showPublishConfirm($(this).data("exam-id"));
    });

    $(document).on("click", "[data-exam-action='assign']", function () {
      showAssignForm($(this).data("exam-id"));
    });

    $(document).on("click", "[data-exam-action='create']", function () {
      window.location.href = "/admin/exams/builder";
    });

    $(document).on("click", "[data-exam-action='edit']", function () {
      window.location.href = "/admin/exams/builder/" + $(this).data("exam-id");
    });

    $(document).on("click", "[data-exam-action='export']", function () {
      showToast("info", t("exams.adminListPage.exportTitle", null, "Xuat bai thi"), t("exams.adminListPage.exportMessage", null, "Chuc nang xuat se duoc noi o task bao cao/xuat du lieu."));
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadAssignmentCounts() {
    const requests = state.exams.map(function (exam) {
      return $.when(
        Lms.apiClient.get("api/exam-assignments?examId=" + exam.id + "&page=1&pageSize=200"),
        Lms.apiClient.get("api/group-exam-assignments?examId=" + exam.id + "&page=1&pageSize=200")
      ).done(function (userResponse, groupResponse) {
        const userData = getResponseData(userResponse);
        const groupData = getResponseData(groupResponse);
        exam.assignedCount = (userData ? Number(userData.total || 0) : 0) + (groupData ? Number(groupData.total || 0) : 0);
      }).fail(function () {
        exam.assignedCount = 0;
      });
    });

    return requests.length ? $.when.apply($, requests) : $.Deferred().resolve().promise();
  }

  function loadPageData() {
    renderPageTitle();
    $.when(
      Lms.apiClient.get("api/exams?page=1&pageSize=200"),
      Lms.apiClient.get("api/users?page=1&pageSize=200"),
      Lms.apiClient.get("api/groups?page=1&pageSize=200")
    ).done(function (examsResponse, usersResponse, groupsResponse) {
      state.exams = getResponseItems(examsResponse).map(mapExam);
      state.users = getResponseItems(usersResponse);
      state.groups = getResponseItems(groupsResponse);

      loadAssignmentCounts().always(function () {
        state.filteredExams = state.exams.slice();
        state.loaded = true;
        render();
      });
    }).fail(function (error) {
      $("#examTableRows").html(
        '<tr><td colspan="8">' +
          '<div class="app-empty-state">' +
            '<div class="app-empty-icon" aria-hidden="true">!</div>' +
            '<h3 class="app-empty-title">' + escapeHtml(t("exams.adminListPage.loadErrorTitle", null, "Khong the tai bai thi")) + "</h3>" +
            '<p class="app-empty-copy">' + escapeHtml(error && error.message ? error.message : t("exams.adminListPage.loadErrorCopy", null, "Vui long kiem tra ket noi API exam.")) + "</p>" +
          "</div>" +
        "</td></tr>"
      );
      showToast("error", t("exams.adminListPage.dataErrorTitle", null, "Loi du lieu bai thi"), error && error.message ? error.message : t("exams.adminListPage.dataErrorMessage", null, "Khong the tai du lieu bai thi."));
    });
  }

  function init() {
    bindEvents();
    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  $(init);
})(window, jQuery);
