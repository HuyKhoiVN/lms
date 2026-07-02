(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    exams: [],
    users: [],
    groups: [],
    userAssignments: [],
    groupAssignments: [],
    examId: 0
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
    if (Array.isArray(data)) {
      return data;
    }
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

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function getCurrentExam() {
    return state.exams.find(function (exam) {
      return exam.id === Number(state.examId);
    }) || null;
  }

  function getUser(userId) {
    return state.users.find(function (user) {
      return user.id === Number(userId);
    }) || null;
  }

  function getGroup(groupId) {
    return state.groups.find(function (group) {
      return group.id === Number(groupId);
    }) || null;
  }

  function renderExamOptions() {
    const $select = $("[data-exam-assignment-filter='exam']").empty();

    if (!state.exams.length) {
      $select.append('<option value="">' + escapeHtml(t("exams.assignmentPage.noExamsOption", null, "Chưa có bài thi")) + "</option>");
      $select.prop("disabled", true);
      return;
    }

    $select.prop("disabled", false);
    state.exams.forEach(function (exam) {
      $select.append('<option value="' + exam.id + '">' + escapeHtml(exam.name) + "</option>");
    });
    $select.val(String(state.examId || state.exams[0].id));
  }

  function renderMetrics() {
    const students = state.users.filter(function (user) {
      return user.role === "Student";
    }).length;
    const assigned = state.userAssignments.length + state.groupAssignments.length;
    const currentExam = getCurrentExam();

    $("[data-exam-assignment-metric='exams']").text(state.exams.length);
    $("[data-exam-assignment-metric='students']").text(students);
    $("[data-exam-assignment-metric='groups']").text(state.groups.length);
    $("[data-exam-assignment-metric='assigned']").text(assigned);
    $("[data-exam-assignment-count='users']").text(
      t("exams.assignmentPage.studentCount", { count: state.userAssignments.length }, state.userAssignments.length + " học viên")
    );
    $("[data-exam-assignment-count='groups']").text(
      t("exams.assignmentPage.groupCount", { count: state.groupAssignments.length }, state.groupAssignments.length + " nhóm")
    );
    $("[data-exam-assignment-current-status]")
      .removeClass("app-badge-success app-badge-muted")
      .addClass(currentExam && currentExam.isPublished ? "app-badge-success" : "app-badge-muted")
      .text(currentExam && currentExam.isPublished
        ? t("exams.assignmentPage.statusPublished", null, "Đã xuất bản")
        : t("exams.assignmentPage.statusDraft", null, "Bản nháp"));
    $("[data-exam-assignment-action='open-builder']").attr("href", state.examId ? "/admin/exams/builder/" + state.examId : "/admin/exams/builder");
  }

  function renderSelect(selector, items, usedIds, emptyText, labelSelector) {
    const $select = $(selector).empty();
    const available = items.filter(function (item) {
      return !usedIds.includes(Number(item.id));
    });

    if (!state.examId || !available.length) {
      $select.append('<option value="">' + escapeHtml(emptyText) + "</option>");
      $select.prop("disabled", true);
      $(labelSelector).prop("disabled", true);
      return;
    }

    $select.prop("disabled", false);
    $(labelSelector).prop("disabled", false);
    $select.append('<option value="">' + escapeHtml(t("exams.assignmentPage.selectOption", null, "Chọn mục")) + "</option>");
    available.forEach(function (item) {
      $select.append('<option value="' + item.id + '">' + escapeHtml(item.fullName || item.name || item.userName) + "</option>");
    });
  }

  function renderUserList() {
    const $list = $("#assignmentUserList").empty();

    if (!state.userAssignments.length) {
      $list.html(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">S</div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("exams.assignmentPage.noStudentsTitle", null, "Chưa giao cho học viên nào")) + "</h3>" +
          '<p class="app-empty-copy">' + escapeHtml(t("exams.assignmentPage.noStudentsCopy", null, "Chọn học viên phía trên để giao bài thi.")) + "</p>" +
        "</div>"
      );
      return;
    }

    state.userAssignments.forEach(function (assignment) {
      const user = getUser(assignment.userId);
      if (!user) {
        return;
      }

      $list.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">' + escapeHtml((user.fullName || user.userName || "?").charAt(0).toUpperCase()) + "</span>" +
            "<div>" +
              "<strong>" + escapeHtml(user.fullName || user.userName) + "</strong>" +
              "<span>" + escapeHtml(user.email || user.userName || "") + "</span>" +
            "</div>" +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-exam-assignment-remove="user" data-assignment-id="' + assignment.id + '">' + escapeHtml(t("common.delete", null, "Xóa")) + "</button>" +
        "</div>"
      );
    });
  }

  function renderGroupList() {
    const $list = $("#assignmentGroupList").empty();

    if (!state.groupAssignments.length) {
      $list.html(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">G</div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("exams.assignmentPage.noGroupsTitle", null, "Chưa giao cho nhóm nào")) + "</h3>" +
          '<p class="app-empty-copy">' + escapeHtml(t("exams.assignmentPage.noGroupsCopy", null, "Chọn nhóm phía trên để giao bài thi cho toàn nhóm.")) + "</p>" +
        "</div>"
      );
      return;
    }

    state.groupAssignments.forEach(function (assignment) {
      const group = getGroup(assignment.groupId);
      if (!group) {
        return;
      }

      $list.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">' + escapeHtml((group.name || "?").charAt(0).toUpperCase()) + "</span>" +
            "<div>" +
              "<strong>" + escapeHtml(group.name) + "</strong>" +
              "<span>" + escapeHtml(group.description || t("exams.assignmentPage.groupAssigned", null, "Đã giao qua nhóm")) + "</span>" +
            "</div>" +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-exam-assignment-remove="group" data-assignment-id="' + assignment.id + '">' + escapeHtml(t("common.delete", null, "Xóa")) + "</button>" +
        "</div>"
      );
    });
  }

  function renderAssignments() {
    const userIds = state.userAssignments.map(function (item) { return Number(item.userId); });
    const groupIds = state.groupAssignments.map(function (item) { return Number(item.groupId); });
    const students = state.users.filter(function (user) {
      return user.role === "Student";
    });

    renderMetrics();
    renderSelect("[data-exam-assignment-select='user']", students, userIds, t("exams.assignmentPage.noMoreStudents", null, "Không còn học viên để thêm"), "[data-exam-assignment-add='user']");
    renderSelect("[data-exam-assignment-select='group']", state.groups, groupIds, t("exams.assignmentPage.noMoreGroups", null, "Không còn nhóm để thêm"), "[data-exam-assignment-add='group']");
    renderUserList();
    renderGroupList();
  }

  function loadAssignments() {
    if (!state.examId) {
      state.userAssignments = [];
      state.groupAssignments = [];
      renderAssignments();
      return;
    }

    $.when(
      Lms.apiClient.get("api/exam-assignments?examId=" + state.examId + "&page=1&pageSize=200"),
      Lms.apiClient.get("api/group-exam-assignments?examId=" + state.examId + "&page=1&pageSize=200")
    ).done(function (userResponse, groupResponse) {
      state.userAssignments = getItems(userResponse).map(function (item) {
        return { id: Number(item.id), examId: Number(item.examId), userId: Number(item.userId) };
      });
      state.groupAssignments = getItems(groupResponse).map(function (item) {
        return { id: Number(item.id), examId: Number(item.examId), groupId: Number(item.groupId) };
      });
      renderAssignments();
    }).fail(function (error) {
      state.userAssignments = [];
      state.groupAssignments = [];
      renderAssignments();
      showToast("error", t("exams.assignmentPage.loadAssignmentsErrorTitle", null, "Không thể tải giao bài"), error && error.message ? error.message : t("exams.assignmentPage.loadAssignmentsErrorMessage", null, "Vui lòng kiểm tra API assignment."));
    });
  }

  function addAssignment(type) {
    const selector = type === "user" ? "[data-exam-assignment-select='user']" : "[data-exam-assignment-select='group']";
    const value = Number($(selector).val());

    if (!state.examId || !value) {
      showToast("warning", t("exams.assignmentPage.selectTargetTitle", null, "Chọn đối tượng"), t("exams.assignmentPage.selectTargetMessage", null, "Chọn bài thi và đối tượng trước khi giao."));
      return;
    }

    Lms.apiClient.post("api/exams/" + state.examId + "/assign", {
      userIds: type === "user" ? [value] : [],
      groupIds: type === "group" ? [value] : []
    }).done(function () {
      showToast("success", t("exams.assignmentPage.assignSuccessTitle", null, "Đã giao bài thi"), t("exams.assignmentPage.assignSuccessMessage", null, "Danh sách giao bài đã được cập nhật."));
      loadAssignments();
    }).fail(function (error) {
      showToast("error", t("exams.assignmentPage.assignErrorTitle", null, "Giao bài thất bại"), error && error.message ? error.message : t("exams.assignmentPage.assignErrorMessage", null, "Không thể giao bài thi."));
    });
  }

  function removeAssignment(type, assignmentId) {
    const endpoint = type === "user"
      ? "api/exam-assignments/" + assignmentId
      : "api/group-exam-assignments/" + assignmentId;

    Lms.apiClient.delete(endpoint).done(function () {
      showToast("success", t("exams.assignmentPage.removeSuccessTitle", null, "Đã xóa giao bài"), t("exams.assignmentPage.removeSuccessMessage", null, "Đối tượng đã được gỡ khỏi bài thi."));
      loadAssignments();
    }).fail(function (error) {
      showToast("error", t("exams.assignmentPage.removeErrorTitle", null, "Xóa giao bài thất bại"), error && error.message ? error.message : t("exams.assignmentPage.removeErrorMessage", null, "Không thể xóa giao bài."));
    });
  }

  function renderPageTitle() {
    document.title = t("exams.assignmentPage.title", null, "Giao bài thi") + " - " + t("common.appName", null, "lms");
  }

  function bindEvents() {
    $("[data-exam-assignment-filter='exam']").on("change", function () {
      state.examId = Number($(this).val());
      loadAssignments();
    });

    $(document).on("click", "[data-exam-assignment-add]", function () {
      addAssignment($(this).data("exam-assignment-add"));
    });

    $(document).on("click", "[data-exam-assignment-remove]", function () {
      removeAssignment($(this).data("exam-assignment-remove"), $(this).data("assignment-id"));
    });

    $(document).on("lms:i18n:changed", function () {
      renderPageTitle();
      renderExamOptions();
      renderAssignments();
    });
  }

  function loadPageData() {
    renderPageTitle();

    $.when(
      Lms.apiClient.get("api/exams?page=1&pageSize=200"),
      Lms.apiClient.get("api/users?page=1&pageSize=200"),
      Lms.apiClient.get("api/groups?page=1&pageSize=200")
    ).done(function (examsResponse, usersResponse, groupsResponse) {
      state.exams = getItems(examsResponse);
      state.users = getItems(usersResponse);
      state.groups = getItems(groupsResponse);
      state.examId = state.exams.length ? Number(state.exams[0].id) : 0;
      renderExamOptions();
      loadAssignments();
    }).fail(function (error) {
      $("#assignmentUserList, #assignmentGroupList").html(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">!</div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("exams.assignmentPage.loadErrorTitle", null, "Không thể tải dữ liệu giao bài")) + "</h3>" +
          '<p class="app-empty-copy">' + escapeHtml(error && error.message ? error.message : t("exams.assignmentPage.loadErrorMessage", null, "Vui lòng kiểm tra kết nối API.")) + "</p>" +
        "</div>"
      );
      showToast("error", t("exams.assignmentPage.loadErrorTitle", null, "Không thể tải dữ liệu giao bài"), error && error.message ? error.message : t("exams.assignmentPage.loadErrorMessage", null, "Vui lòng kiểm tra kết nối API."));
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
