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
      ? t("exams.adminListPage.published", null, "Đã xuất bản")
      : t("exams.adminListPage.draft", null, "Bản nháp");
  }

  function getReviewLabel(reviewMode) {
    const labels = {
      FULL_REVIEW: t("exams.adminListPage.reviewFull", null, "Xem toàn bộ"),
      RESULT_ONLY: t("exams.adminListPage.reviewResultOnly", null, "Chỉ xem kết quả"),
      ANSWER_ONLY: t("exams.adminListPage.reviewAnswerOnly", null, "Chỉ xem đáp án"),
      NO_REVIEW: t("exams.adminListPage.reviewNo", null, "Không cho xem lại")
    };

    return labels[reviewMode] || reviewMode;
  }

  function getExamVisual(index) {
    const images = ["/images/online-exam.jpg", "/images/exam-stress.jpg", "/images/graduation-success.jpg"];
    return images[index % images.length];
  }

  function renderPageTitle() {
    document.title = t("exams.adminListPage.title", null, "Quản lý bài thi") + " - " + t("common.appName", null, "lms");
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredExams.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredExams.slice(start, start + state.pageSize);
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
              '<h3 class="app-empty-title">' + escapeHtml(t("exams.adminListPage.noExamsTitle", null, "Không tìm thấy bài thi")) + "</h3>" +
              '<p class="app-empty-copy">' + escapeHtml(t("exams.adminListPage.noExamsCopy", null, "Thử từ khóa, trạng thái, thời lượng hoặc bộ lọc xem lại khác.")) + "</p>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
      return;
    }

    rows.forEach(function (exam, index) {
      $rows.append(
        "<tr>" +
          "<td>" +
            '<div class="admin-user-cell">' +
              '<span class="app-avatar admin-thumbnail-avatar" aria-hidden="true"><img src="' + getExamVisual(index) + '" alt="" /></span>' +
              "<div>" +
                "<strong>" + escapeHtml(exam.name) + "</strong>" +
                "<span>" + escapeHtml(t("exams.adminListPage.examId", { id: exam.id }, "Mã bài thi #" + exam.id)) + "</span>" +
              "</div>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge ' + getBadgeClass(exam.status) + '">' + escapeHtml(translateStatus(exam.status)) + "</span></td>" +
          "<td>" + escapeHtml(exam.durationMinutes) + " " + escapeHtml(t("exams.adminListPage.minutesUnit", null, "phút")) + "</td>" +
          "<td>" + escapeHtml(exam.passScore) + "</td>" +
          "<td>" + escapeHtml(exam.questionCount) + "</td>" +
          "<td>" + escapeHtml(exam.assignedCount) + "</td>" +
          "<td>" + escapeHtml(getReviewLabel(exam.reviewMode)) + "</td>" +
          '<td class="u-text-right">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-exam-action="edit" data-exam-id="' + exam.id + '">' + escapeHtml(t("common.edit", null, "Sửa")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-exam-action="assign" data-exam-id="' + exam.id + '">' + escapeHtml(t("exams.adminListPage.assign", null, "Giao")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-exam-action="publish" data-exam-id="' + exam.id + '">' + escapeHtml(t("exams.adminListPage.publish", null, "Xuất bản")) + "</button>" +
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

    $("[data-exam-result-count]").text(t("exams.adminListPage.records", { count: state.filteredExams.length }, state.filteredExams.length + " bản ghi"));
    $("[data-exam-page-info]").text(t("exams.adminListPage.showing", { start: startRecord, end: endRecord, total: state.filteredExams.length }, "Hiển thị " + startRecord + "-" + endRecord + " trên " + state.filteredExams.length + " bài thi"));
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
      const matchesKeyword = !keyword || exam.name.toLowerCase().includes(keyword);
      const matchesStatus = !state.status || exam.status === state.status;
      const matchesDuration = !state.duration ||
        (state.duration === "short" && Number(exam.durationMinutes) <= 30) ||
        (state.duration === "long" && Number(exam.durationMinutes) > 30);
      const matchesReview = !state.review || exam.reviewMode === state.review;

      return matchesKeyword && matchesStatus && matchesDuration && matchesReview;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function showPublishConfirm(examId) {
    const exam = findExam(examId);

    if (!exam || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title">' + escapeHtml(t("exams.adminListPage.publishExamTitle", null, "Xuất bản bài thi")) + "</h2>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("exams.adminListPage.close", null, "Đóng")) + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0">' + escapeHtml(t("exams.adminListPage.publishConfirmPrefix", null, "Xuất bản bài thi ")) + "<strong></strong>" + escapeHtml(t("exams.adminListPage.publishConfirmSuffix", null, "? Học viên được giao bài thi này sẽ có thể nhìn thấy nó.")) + "</p>" +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("exams.adminListPage.cancel", null, "Hủy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-exam-confirm-publish>' + escapeHtml(t("exams.adminListPage.publish", null, "Xuất bản")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("strong").text(exam.name);
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-exam-confirm-publish]").on("click", function () {
      exam.status = "Published";
      Lms.ui.closeModal();
      applyFilters();
      showToast("success", t("exams.adminListPage.publishedTitle", null, "Đã xuất bản bài thi"), t("exams.adminListPage.publishedMessage", { name: exam.name }, exam.name + " đã được xuất bản ở trạng thái mô phỏng."));
    });

    Lms.ui.showModal(modal);
  }

  function buildAssignForm(exam) {
    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          "<div>" +
            '<h2 class="app-modal-title">' + escapeHtml(t("exams.adminListPage.assignExamTitle", null, "Giao bài thi")) + "</h2>" +
            '<p class="app-card-subtitle"></p>' +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("exams.adminListPage.close", null, "Đóng")) + "</button>" +
        "</div>" +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("exams.adminListPage.assignToUser", null, "Giao cho người dùng")) +
            '<select class="app-select" name="userId"></select>' +
          "</label>" +
          '<label class="auth-field">' + escapeHtml(t("exams.adminListPage.assignToGroup", null, "Giao cho nhóm")) +
            '<select class="app-select" name="groupId"></select>' +
          "</label>" +
          '<p class="page-muted u-mb-0">' + escapeHtml(t("exams.adminListPage.assignHelp", null, "Thao tác mô phỏng này chỉ tăng số lượt giao trong bộ nhớ.")) + "</p>" +
        "</form>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("exams.adminListPage.cancel", null, "Hủy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-exam-confirm-assign>' + escapeHtml(t("exams.adminListPage.assign", null, "Giao")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find(".app-card-subtitle").text(exam.name);
    const $userSelect = modal.find("[name='userId']").append('<option value="">' + escapeHtml(t("exams.adminListPage.noIndividualUser", null, "Không chọn người dùng riêng lẻ")) + "</option>");
    const $groupSelect = modal.find("[name='groupId']").append('<option value="">' + escapeHtml(t("exams.adminListPage.noGroup", null, "Không chọn nhóm")) + "</option>");

    state.users
      .filter(function (user) {
        return user.role === "Student";
      })
      .forEach(function (user) {
        $userSelect.append('<option value="' + user.id + '">' + escapeHtml(user.fullName) + "</option>");
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
        showToast("warning", t("exams.adminListPage.chooseAssignmentTitle", null, "Chọn đối tượng giao"), t("exams.adminListPage.chooseAssignmentMessage", null, "Chọn người dùng hoặc nhóm trước khi giao."));
        return;
      }

      exam.assignedCount += (userId ? 1 : 0) + (groupId ? 1 : 0);
      Lms.ui.closeModal();
      applyFilters();
      showToast("success", t("exams.adminListPage.examAssignedTitle", null, "Đã giao bài thi"), t("exams.adminListPage.examAssignedMessage", { name: exam.name }, "Số lượt giao của " + exam.name + " đã được cập nhật."));
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
      showToast("info", t("exams.adminListPage.exportTitle", null, "Xuất bài thi"), t("exams.adminListPage.exportMessage", null, "Chức năng xuất sẽ được nối ở task báo cáo/xuất dữ liệu."));
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadPageData() {
    renderPageTitle();
    $.when(
      Lms.apiClient.get("exams.json"),
      Lms.apiClient.get("users.json"),
      Lms.apiClient.get("groups.json")
    ).done(function (examsResponse, usersResponse, groupsResponse) {
      state.exams = getItems(examsResponse).map(function (exam) {
        return { ...exam };
      });
      state.users = getItems(usersResponse);
      state.groups = getItems(groupsResponse);
      state.filteredExams = state.exams.slice();
      state.loaded = true;
      render();
    }).fail(function () {
      $("#examTableRows").html(
        '<tr><td colspan="8">' +
          '<div class="app-empty-state">' +
            '<div class="app-empty-icon" aria-hidden="true">!</div>' +
            '<h3 class="app-empty-title">' + escapeHtml(t("exams.adminListPage.loadErrorTitle", null, "Không thể tải bài thi")) + "</h3>" +
            '<p class="app-empty-copy">' + escapeHtml(t("exams.adminListPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/exams.json.")) + "</p>" +
          "</div>" +
        "</td></tr>"
      );
      showToast("error", t("exams.adminListPage.dataErrorTitle", null, "Lỗi dữ liệu bài thi"), t("exams.adminListPage.dataErrorMessage", null, "Không thể tải dữ liệu mô phỏng bài thi."));
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
