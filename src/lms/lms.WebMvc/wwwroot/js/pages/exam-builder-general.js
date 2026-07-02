(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    examId: 0,
    exam: null,
    categories: [],
    questions: [],
    filteredQuestions: [],
    selectedQuestionIds: [],
    originalQuestionIds: [],
    randomRules: [],
    userAssignments: [],
    groupAssignments: [],
    assignedGroupIds: [],
    users: [],
    groups: [],
    questionSearch: "",
    questionCategory: "",
    questionDifficulty: "",
    settings: {
      shuffleQuestions: false,
      shuffleAnswers: false,
      allowBackNavigation: false,
      autoSubmit: true,
      attemptLimit: 1,
      autosaveSeconds: 30
    }
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

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getDifficultyBadgeClass(difficulty) {
    if (difficulty === "Easy") {
      return "app-badge-success";
    }
    if (difficulty === "Hard") {
      return "app-badge-danger";
    }
    return "app-badge-warning";
  }

  function getDifficultyLabel(difficulty) {
    const labels = {
      Easy: "Dễ",
      Medium: "Trung bình",
      Hard: "Khó"
    };
    return labels[difficulty] || difficulty;
  }

  function getStatusLabel(status) {
    return status === "Published" ? "Đã xuất bản" : "Bản nháp";
  }

  function getTypeLabel(type) {
    return type === "MultipleChoice" ? "Nhiều lựa chọn" : "Một lựa chọn";
  }

  function getReviewLabel(reviewMode) {
    const labels = {
      FullReview: "Xem toàn bộ",
      ResultOnly: "Chỉ xem kết quả",
      AnswerOnly: "Chỉ xem đáp án",
      NoReview: "Không cho xem lại"
    };
    return labels[reviewMode] || "--";
  }

  function normalizeReviewMode(value) {
    const map = {
      FULL_REVIEW: "FullReview",
      RESULT_ONLY: "ResultOnly",
      ANSWER_ONLY: "AnswerOnly",
      NO_REVIEW: "NoReview"
    };
    return map[value] || value || "ResultOnly";
  }

  function ensureExamExists(actionName) {
    if (state.examId > 0) {
      return true;
    }

    showToast("warning", "Lưu thông tin chung trước", "Vui lòng lưu thông tin chung trước khi " + actionName + ".");
    setActiveTab("general");
    return false;
  }

  function getFormValues() {
    const $form = $("#examGeneralForm");

    return {
      name: $form.find("[name='name']").val().trim(),
      description: $form.find("[name='description']").val().trim(),
      durationMinutes: Number($form.find("[name='durationMinutes']").val()),
      passScore: Number($form.find("[name='passScore']").val()),
      reviewMode: normalizeReviewMode($form.find("[name='reviewMode']").val())
    };
  }

  function setFieldError(fieldName, message) {
    const $form = $("#examGeneralForm");
    const $field = $form.find("[name='" + fieldName + "']");
    const $error = $form.find("[data-exam-builder-error='" + fieldName + "']");

    $field.toggleClass("is-invalid", Boolean(message));
    $error.text(message || "");
  }

  function clearErrors() {
    $("#examGeneralForm").find(".is-invalid").removeClass("is-invalid");
    $("#examGeneralForm").find("[data-exam-builder-error]").text("");
  }

  function validateForm() {
    const values = getFormValues();
    let valid = true;

    clearErrors();

    if (!values.name || values.name.length < 3) {
      setFieldError("name", "Tên bài thi phải có ít nhất 3 ký tự.");
      valid = false;
    }
    if (!values.description || values.description.length < 10) {
      setFieldError("description", "Mô tả phải có ít nhất 10 ký tự.");
      valid = false;
    }
    if (!Number.isInteger(values.durationMinutes) || values.durationMinutes < 5) {
      setFieldError("durationMinutes", "Thời lượng phải có ít nhất 5 phút.");
      valid = false;
    }
    if (!Number.isFinite(values.passScore) || values.passScore < 1 || values.passScore > 100) {
      setFieldError("passScore", "Điểm đạt phải từ 1 đến 100.");
      valid = false;
    }
    if (!values.reviewMode) {
      setFieldError("reviewMode", "Vui lòng chọn chính sách xem lại.");
      valid = false;
    }

    return valid;
  }

  function fillForm(exam) {
    const $form = $("#examGeneralForm");
    $form.find("[name='name']").val(exam && exam.name || "");
    $form.find("[name='description']").val(exam && exam.description || "");
    $form.find("[name='durationMinutes']").val(exam && exam.durationMinutes || 30);
    $form.find("[name='passScore']").val(exam && exam.passScore || 75);
    $form.find("[name='reviewMode']").val(exam && exam.reviewMode || "ResultOnly");
    renderPageTitle();
    renderSummary();
  }

  function renderPageTitle() {
    $("[data-exam-builder-title]").text(state.examId ? "Sửa bài thi" : "Tạo bài thi");
  }

  function renderSummary() {
    const values = getFormValues();
    const status = state.exam && state.exam.isPublished ? "Published" : "Draft";

    $("[data-exam-builder-summary='status']").text(getStatusLabel(status));
    $("[data-exam-builder-summary='duration']").text(values.durationMinutes ? values.durationMinutes + " phút" : "--");
    $("[data-exam-builder-summary='passScore']").text(values.passScore ? values.passScore + "/100" : "--");
    $("[data-exam-builder-summary='reviewMode']").text(getReviewLabel(values.reviewMode));
  }

  function setActiveTab(tabName) {
    $("[data-exam-builder-tab]").removeClass("active");
    $("[data-exam-builder-tab='" + tabName + "']").addClass("active");
    $("[data-exam-builder-panel]").addClass("u-hidden");
    $("[data-exam-builder-panel='" + tabName + "']").removeClass("u-hidden");
  }

  function getSettingsValues() {
    const $form = $("#examSettingsForm");

    return {
      shuffleQuestions: $form.find("[name='shuffleQuestions']").prop("checked"),
      shuffleAnswers: $form.find("[name='shuffleAnswers']").prop("checked"),
      allowBackNavigation: $form.find("[name='allowBackNavigation']").prop("checked"),
      autoSubmit: $form.find("[name='autoSubmit']").prop("checked"),
      attemptLimit: Number($form.find("[name='attemptLimit']").val()),
      autosaveSeconds: Number($form.find("[name='autosaveSeconds']").val())
    };
  }

  function fillSettings(settings) {
    const $form = $("#examSettingsForm");
    const source = settings || state.settings;

    $form.find("[name='shuffleQuestions']").prop("checked", Boolean(source.shuffleQuestions));
    $form.find("[name='shuffleAnswers']").prop("checked", Boolean(source.shuffleAnswers));
    $form.find("[name='allowBackNavigation']").prop("checked", Boolean(source.allowBackNavigation));
    $form.find("[name='autoSubmit']").prop("checked", source.autoSubmit !== false);
    $form.find("[name='attemptLimit']").val(source.attemptLimit || 1);
    $form.find("[name='autosaveSeconds']").val(source.autosaveSeconds || 30);
    state.settings = getSettingsValues();
    renderSettingsSummary();
  }

  function setSettingsError(fieldName, message) {
    const $form = $("#examSettingsForm");
    const $field = $form.find("[name='" + fieldName + "']");
    const $error = $form.find("[data-exam-settings-error='" + fieldName + "']");

    $field.toggleClass("is-invalid", Boolean(message));
    $error.text(message || "");
  }

  function validateSettings() {
    const values = getSettingsValues();
    let valid = true;

    $("#examSettingsForm").find(".is-invalid").removeClass("is-invalid");
    $("#examSettingsForm").find("[data-exam-settings-error]").text("");

    if (!Number.isInteger(values.attemptLimit) || values.attemptLimit < 1) {
      setSettingsError("attemptLimit", "Số lượt làm bài tối đa phải ít nhất là 1.");
      valid = false;
    }
    if (!Number.isInteger(values.autosaveSeconds) || values.autosaveSeconds < 15) {
      setSettingsError("autosaveSeconds", "Thời gian tự động lưu phải từ 15 giây trở lên.");
      valid = false;
    }

    return valid;
  }

  function renderQuestionCategoryOptions() {
    const categories = state.categories.slice();
    ["[data-exam-question-filter='category']", "[data-random-rule-field='category']"].forEach(function (selector) {
      const $select = $(selector);
      const currentValue = $select.val() || "";
      $select.find("option:not(:first)").remove();
      categories.forEach(function (category) {
        $select.append('<option value="' + category.id + '">' + escapeHtml(category.name) + "</option>");
      });
      $select.val(currentValue);
    });
  }

  function renderQuestionSummary() {
    const selected = state.questions.filter(function (question) {
      return state.selectedQuestionIds.includes(question.id);
    });
    const score = selected.reduce(function (total, question) {
      return total + Number(question.score || 0);
    }, 0);

    $("[data-exam-question-count]").text(state.selectedQuestionIds.length + " đã chọn");
    $("[data-exam-question-summary='manual']").text(state.selectedQuestionIds.length);
    $("[data-exam-question-summary='score']").text(score);
    $("[data-exam-question-summary='rules']").text(state.randomRules.length);
  }

  function renderQuestionRows() {
    const $rows = $("#examQuestionRows").empty();

    if (!state.filteredQuestions.length) {
      $rows.append(
        "<tr>" +
          '<td colspan="6">' +
            '<div class="app-empty-state">' +
              '<div class="app-empty-icon" aria-hidden="true">Q</div>' +
              "<h3 class='app-empty-title'>Không tìm thấy câu hỏi</h3>" +
              "<p class='app-empty-copy'>Thử bộ lọc từ khóa, danh mục hoặc độ khó khác.</p>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
      return;
    }

    state.filteredQuestions.forEach(function (question) {
      const checked = state.selectedQuestionIds.includes(question.id) ? " checked" : "";

      $rows.append(
        "<tr>" +
          '<td><input type="checkbox" data-exam-question-select="' + question.id + '"' + checked + " /></td>" +
          "<td>" +
            '<div class="admin-question-cell">' +
              "<strong>" + escapeHtml(question.content) + "</strong>" +
              "<span>Mã câu hỏi #" + question.id + "</span>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge app-badge-info">' + escapeHtml(question.categoryName || "--") + "</span></td>" +
          '<td><span class="app-badge ' + getDifficultyBadgeClass(question.difficulty) + '">' + escapeHtml(getDifficultyLabel(question.difficulty)) + "</span></td>" +
          "<td>" + escapeHtml(getTypeLabel(question.questionType)) + "</td>" +
          "<td>" + escapeHtml(question.score) + "</td>" +
        "</tr>"
      );
    });
  }

  function applyQuestionFilters() {
    const keyword = state.questionSearch.trim().toLowerCase();

    state.filteredQuestions = state.questions.filter(function (question) {
      const matchesKeyword = !keyword || String(question.content || "").toLowerCase().includes(keyword);
      const matchesCategory = !state.questionCategory || String(question.categoryId) === String(state.questionCategory);
      const matchesDifficulty = !state.questionDifficulty || question.difficulty === state.questionDifficulty;

      return matchesKeyword && matchesCategory && matchesDifficulty;
    });

    renderQuestionRows();
    renderQuestionSummary();
    renderSettingsSummary();
  }

  function renderRandomRules() {
    const $list = $("#examRandomRuleList").empty();

    if (!state.randomRules.length) {
      $list.append('<p class="page-muted u-mb-0">Chưa thêm quy tắc ngẫu nhiên nào.</p>');
      return;
    }

    state.randomRules.forEach(function (rule, index) {
      const category = getCategory(rule.categoryId);
      $list.append(
        '<div class="question-answer-row exam-random-rule-row">' +
          '<span class="app-badge app-badge-info">Quy tắc</span>' +
          "<span>" + escapeHtml(rule.questionCount + " câu hỏi, " + (category ? category.name : "mọi danh mục") + ", " + (rule.difficulty ? getDifficultyLabel(rule.difficulty) : "mọi độ khó")) + "</span>" +
          '<button class="app-button app-button-secondary" type="button" data-random-rule-remove="' + index + '">Xóa</button>' +
        "</div>"
      );
    });
  }

  function addRandomRule() {
    const questionCount = Number($("[data-random-rule-field='count']").val());

    if (!Number.isInteger(questionCount) || questionCount < 1) {
      showToast("warning", "Quy tắc không hợp lệ", "Số lượng câu hỏi phải ít nhất là 1.");
      return;
    }

    state.randomRules.push({
      categoryId: Number($("[data-random-rule-field='category']").val()) || null,
      difficulty: $("[data-random-rule-field='difficulty']").val() || null,
      questionCount: questionCount,
      scorePerQuestion: 1
    });
    renderRandomRules();
    renderQuestionSummary();
    renderSettingsSummary();
  }

  function renderAssignmentSelect(selector, items, usedIds, emptyText, buttonSelector) {
    const $select = $(selector).empty();
    const available = items.filter(function (item) {
      return !usedIds.includes(item.id);
    });

    if (!available.length) {
      $select.append('<option value="">' + emptyText + "</option>");
      $select.prop("disabled", true);
      $(buttonSelector).prop("disabled", true);
      return;
    }

    $select.prop("disabled", false);
    $(buttonSelector).prop("disabled", false);
    $select.append('<option value="">Chọn mục</option>');
    available.forEach(function (item) {
      $select.append('<option value="' + item.id + '">' + escapeHtml(item.fullName || item.name || item.userName) + "</option>");
    });
  }

  function renderAssignedList(containerSelector, items, selectedIds, type) {
    const $container = $(containerSelector).empty();

    if (!selectedIds.length) {
      $container.append(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">A</div>' +
          '<h3 class="app-empty-title">' + (type === "user" ? "Chưa giao cho học viên nào" : "Chưa có nhóm mới được thêm") + "</h3>" +
          '<p class="app-empty-copy">' + (type === "user" ? "Sử dụng bộ chọn phía trên để thêm học viên." : "Sử dụng bộ chọn phía trên để thêm nhóm học viên.") + "</p>" +
        "</div>"
      );
      return;
    }

    selectedIds.forEach(function (id) {
      const item = items.find(function (entry) { return entry.id === Number(id); });
      if (!item) {
        return;
      }

      $container.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">' + escapeHtml((item.fullName || item.name || item.userName || "?").charAt(0).toUpperCase()) + "</span>" +
            "<div>" +
              "<strong>" + escapeHtml(item.fullName || item.name || item.userName) + "</strong>" +
              "<span>" + escapeHtml(item.email || (item.memberCount ? item.memberCount + " thành viên" : "Đã gán qua API")) + "</span>" +
            "</div>" +
          "</div>" +
          (type === "user"
            ? '<button class="app-button app-button-secondary" type="button" data-exam-assignment-remove="user" data-item-id="' + item.id + '">Xóa</button>'
            : "") +
        "</div>"
      );
    });
  }

  function renderAssignment() {
    const userIds = state.userAssignments.map(function (item) { return item.userId; });

    renderAssignmentSelect("[data-exam-assignment-select='user']", state.users.filter(function (user) {
      return user.role === "Student";
    }), userIds, "Đã giao cho tất cả học viên", "[data-exam-assignment-add='user']");
    renderAssignmentSelect("[data-exam-assignment-select='group']", state.groups, state.assignedGroupIds, "Không còn nhóm để thêm", "[data-exam-assignment-add='group']");
    renderAssignedList("#examAssignedUserList", state.users, userIds, "user");
    renderAssignedList("#examAssignedGroupList", state.groups, state.assignedGroupIds, "group");
    $("[data-exam-assignment-count]").text((userIds.length + state.assignedGroupIds.length) + " đã giao");
    $("[data-exam-assignment-summary='users']").text(userIds.length);
    $("[data-exam-assignment-summary='groups']").text(state.assignedGroupIds.length);
    renderSettingsSummary();
  }

  function renderSettingsSummary() {
    const questionCount = state.selectedQuestionIds.length + state.randomRules.reduce(function (total, rule) {
      return total + Number(rule.questionCount || 0);
    }, 0);

    $("[data-exam-settings-summary='status']").text(getStatusLabel(state.exam && state.exam.isPublished ? "Published" : "Draft"));
    $("[data-exam-settings-summary='questions']").text(questionCount);
    $("[data-exam-settings-summary='assigned']").text(state.userAssignments.length + state.assignedGroupIds.length);
  }

  function updateExamUrl(examId) {
    const url = "/admin/exams/builder/" + examId;
    window.history.replaceState({}, "", url);
    $("[data-exam-builder-id]").attr("data-exam-builder-id", examId);
  }

  function createOrUpdateExam() {
    if (!validateForm()) {
      return;
    }

    const values = getFormValues();
    const settings = getSettingsValues();
    const request = {
      name: values.name,
      description: values.description,
      durationMinutes: values.durationMinutes,
      passScore: values.passScore,
      attemptLimit: settings.attemptLimit,
      randomQuestion: settings.shuffleQuestions,
      randomAnswer: settings.shuffleAnswers,
      reviewMode: values.reviewMode
    };

    const apiRequest = state.examId > 0
      ? Lms.apiClient.put("api/exams/" + state.examId, request)
      : Lms.apiClient.post("api/exams", request);

    apiRequest.done(function (response) {
      const exam = getData(response);
      state.examId = Number(exam.id);
      state.exam = exam;
      updateExamUrl(state.examId);
      renderPageTitle();
      renderSummary();
      renderSettingsSummary();
      showToast("success", "Đã lưu thông tin chung", "Thông tin bài thi đã được cập nhật.");
      loadExamDetail();
    }).fail(function (error) {
      showToast("error", "Lưu thất bại", error && error.message ? error.message : "Không thể lưu thông tin bài thi.");
    });
  }

  function saveQuestions() {
    if (!ensureExamExists("lưu câu hỏi")) {
      return;
    }

    const addedIds = state.selectedQuestionIds.filter(function (id) {
      return !state.originalQuestionIds.includes(id);
    });
    const removedIds = state.originalQuestionIds.filter(function (id) {
      return !state.selectedQuestionIds.includes(id);
    });
    const requests = [];

    addedIds.forEach(function (id, index) {
      requests.push(function () {
        return Lms.apiClient.post("api/exams/" + state.examId + "/questions", {
          questionId: id,
          order: state.selectedQuestionIds.indexOf(id) + 1
        });
      });
    });

    removedIds.forEach(function (id) {
      requests.push(function () {
        return Lms.apiClient.delete("api/exams/" + state.examId + "/questions/" + id);
      });
    });

    requests.push(function () {
      return Lms.apiClient.put("api/exams/" + state.examId + "/random-rules", {
        rules: state.randomRules.map(function (rule) {
          return {
            categoryId: rule.categoryId,
            difficulty: rule.difficulty,
            questionCount: rule.questionCount,
            scorePerQuestion: rule.scorePerQuestion || 1
          };
        })
      });
    });

    runSequence(requests).done(function () {
      showToast("success", "Đã lưu câu hỏi", "Danh sách câu hỏi và quy tắc ngẫu nhiên đã được cập nhật.");
      loadExamDetail();
    }).fail(function (error) {
      showToast("error", "Lưu câu hỏi thất bại", error && error.message ? error.message : "Không thể cập nhật cấu hình câu hỏi.");
    });
  }

  function runSequence(requests) {
    let chain = $.Deferred().resolve().promise();

    requests.forEach(function (requestFactory) {
      chain = chain.then(function () {
        return requestFactory();
      });
    });

    return chain;
  }

  function addAssignment(type) {
    if (!ensureExamExists("giao bài thi")) {
      return;
    }

    const selector = type === "user" ? "[data-exam-assignment-select='user']" : "[data-exam-assignment-select='group']";
    const value = Number($(selector).val());

    if (!value) {
      showToast("warning", "Chọn đối tượng", "Vui lòng chọn " + (type === "user" ? "học viên" : "nhóm") + " trước khi thêm.");
      return;
    }

    Lms.apiClient.post("api/exams/" + state.examId + "/assign", {
      userIds: type === "user" ? [value] : [],
      groupIds: type === "group" ? [value] : []
    }).done(function () {
      if (type === "group" && !state.assignedGroupIds.includes(value)) {
        state.assignedGroupIds.push(value);
      }
      showToast("success", "Đã giao bài", "Bài thi đã được giao thành công.");
      loadAssignments();
    }).fail(function (error) {
      showToast("error", "Giao bài thất bại", error && error.message ? error.message : "Không thể giao bài thi.");
    });
  }

  function removeUserAssignment(userId) {
    const assignment = state.userAssignments.find(function (item) {
      return item.userId === Number(userId);
    });

    if (!assignment) {
      return;
    }

    Lms.apiClient.delete("api/exam-assignments/" + assignment.id).done(function () {
      showToast("success", "Đã xóa giao bài", "Học viên đã được gỡ khỏi bài thi.");
      loadAssignments();
    }).fail(function (error) {
      showToast("error", "Xóa giao bài thất bại", error && error.message ? error.message : "Không thể gỡ học viên khỏi bài thi.");
    });
  }

  function saveSettings() {
    if (!ensureExamExists("lưu cài đặt")) {
      return false;
    }

    if (!validateSettings()) {
      return false;
    }

    const values = getFormValues();
    const settings = getSettingsValues();
    const request = {
      name: values.name,
      description: values.description,
      durationMinutes: values.durationMinutes,
      passScore: values.passScore,
      attemptLimit: settings.attemptLimit,
      randomQuestion: settings.shuffleQuestions,
      randomAnswer: settings.shuffleAnswers,
      reviewMode: values.reviewMode
    };

    return Lms.apiClient.put("api/exams/" + state.examId, request).done(function (response) {
      state.exam = getData(response);
      renderSummary();
      renderSettingsSummary();
      showToast("success", "Đã lưu cài đặt", "Cài đặt bài thi đã được cập nhật.");
    }).fail(function (error) {
      showToast("error", "Lưu cài đặt thất bại", error && error.message ? error.message : "Không thể lưu cài đặt.");
    });
  }

  function publishExam() {
    if (!ensureExamExists("xuất bản")) {
      return;
    }

    if (state.selectedQuestionIds.length + state.randomRules.length < 1) {
      showToast("warning", "Cần có câu hỏi", "Vui lòng chọn ít nhất một câu hỏi hoặc quy tắc ngẫu nhiên trước khi xuất bản.");
      setActiveTab("questions");
      return;
    }

    if (!validateSettings()) {
      setActiveTab("settings");
      return;
    }

    saveSettings();
    Lms.apiClient.post("api/exams/" + state.examId + "/publish", {}).done(function () {
      showToast("success", "Đã xuất bản bài thi", "Bài thi đã sẵn sàng cho học viên.");
      loadExamDetail();
    }).fail(function (error) {
      showToast("error", "Xuất bản thất bại", error && error.message ? error.message : "Không thể xuất bản bài thi.");
    });
  }

  function loadAssignments() {
    if (!state.examId) {
      state.userAssignments = [];
      state.groupAssignments = [];
      state.assignedGroupIds = [];
      renderAssignment();
      return;
    }

    $.when(
      Lms.apiClient.get("api/exam-assignments?examId=" + state.examId + "&page=1&pageSize=200"),
      Lms.apiClient.get("api/group-exam-assignments?examId=" + state.examId + "&page=1&pageSize=200")
    ).done(function (userResponse, groupResponse) {
      state.userAssignments = getItems(userResponse).map(function (item) {
        return {
          id: Number(item.id),
          userId: Number(item.userId)
        };
      });
      state.groupAssignments = getItems(groupResponse).map(function (item) {
        return {
          id: Number(item.id),
          groupId: Number(item.groupId)
        };
      });
      state.assignedGroupIds = state.groupAssignments.map(function (item) {
        return item.groupId;
      });
      renderAssignment();
    }).fail(function () {
      state.userAssignments = [];
      state.groupAssignments = [];
      state.assignedGroupIds = [];
      renderAssignment();
    });
  }

  function loadExamDetail() {
    if (!state.examId) {
      state.exam = null;
      state.selectedQuestionIds = [];
      state.originalQuestionIds = [];
      state.randomRules = [];
      fillForm(null);
      fillSettings(state.settings);
      renderQuestionRows();
      renderRandomRules();
      renderQuestionSummary();
      renderSettingsSummary();
      loadAssignments();
      return;
    }

    Lms.apiClient.get("api/exams/" + state.examId).done(function (response) {
      const exam = getData(response) || {};

      state.exam = exam;
      state.selectedQuestionIds = (exam.questions || []).map(function (item) { return Number(item.questionId); });
      state.originalQuestionIds = state.selectedQuestionIds.slice();
      state.randomRules = (exam.randomRules || []).map(function (item) {
        return {
          categoryId: item.categoryId,
          difficulty: item.difficulty,
          questionCount: Number(item.questionCount || 0),
          scorePerQuestion: Number(item.scorePerQuestion || 1)
        };
      });
      fillForm({
        name: exam.name,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        passScore: exam.passScore,
        reviewMode: normalizeReviewMode(exam.reviewMode)
      });
      fillSettings({
        shuffleQuestions: Boolean(exam.randomQuestion),
        shuffleAnswers: Boolean(exam.randomAnswer),
        allowBackNavigation: false,
        autoSubmit: true,
        attemptLimit: Number(exam.attemptLimit || 1),
        autosaveSeconds: Number(state.settings.autosaveSeconds || 30)
      });
      renderRandomRules();
      applyQuestionFilters();
      loadAssignments();
    }).fail(function (error) {
      showToast("error", "Không thể tải bài thi", error && error.message ? error.message : "Vui lòng thử lại.");
    });
  }

  function bindEvents() {
    $("#examGeneralForm").on("input change", "input, textarea, select", renderSummary);
    $(document).on("click", "[data-exam-builder-action='save']", createOrUpdateExam);
    $(document).on("click", "[data-exam-builder-tab]", function () {
      setActiveTab($(this).data("exam-builder-tab"));
    });

    $("[data-exam-question-filter='search']").on("input", function () {
      state.questionSearch = $(this).val();
      applyQuestionFilters();
    });
    $("[data-exam-question-filter='category']").on("change", function () {
      state.questionCategory = $(this).val();
      applyQuestionFilters();
    });
    $("[data-exam-question-filter='difficulty']").on("change", function () {
      state.questionDifficulty = $(this).val();
      applyQuestionFilters();
    });
    $(document).on("click", "[data-exam-question-action='clear-filters']", function () {
      state.questionSearch = "";
      state.questionCategory = "";
      state.questionDifficulty = "";
      $("[data-exam-question-filter='search']").val("");
      $("[data-exam-question-filter='category']").val("");
      $("[data-exam-question-filter='difficulty']").val("");
      applyQuestionFilters();
    });
    $(document).on("change", "[data-exam-question-select]", function () {
      const questionId = Number($(this).data("exam-question-select"));
      if ($(this).prop("checked")) {
        if (!state.selectedQuestionIds.includes(questionId)) {
          state.selectedQuestionIds.push(questionId);
        }
      } else {
        state.selectedQuestionIds = state.selectedQuestionIds.filter(function (id) {
          return id !== questionId;
        });
      }
      renderQuestionSummary();
      renderSettingsSummary();
    });
    $(document).on("click", "[data-exam-question-action='add-random-rule']", addRandomRule);
    $(document).on("click", "[data-random-rule-remove]", function () {
      state.randomRules.splice(Number($(this).data("random-rule-remove")), 1);
      renderRandomRules();
      renderQuestionSummary();
      renderSettingsSummary();
    });
    $(document).on("click", "[data-exam-question-action='save']", saveQuestions);

    $(document).on("click", "[data-exam-assignment-add]", function () {
      addAssignment($(this).data("exam-assignment-add"));
    });
    $(document).on("click", "[data-exam-assignment-remove='user']", function () {
      removeUserAssignment($(this).data("item-id"));
    });
    $(document).on("click", "[data-exam-assignment-action='save']", function () {
      showToast("info", "Giao bài được lưu theo thời gian thực", "Mỗi lần thêm hoặc xóa học viên đều gọi API ngay.");
    });

    $("#examSettingsForm").on("input change", "input", function () {
      state.settings = getSettingsValues();
    });
    $(document).on("click", "[data-exam-settings-action='save']", saveSettings);
    $(document).on("click", "[data-exam-settings-action='publish']", publishExam);

    $(document).on("lms:i18n:changed", function () {
      renderPageTitle();
      renderSummary();
      renderQuestionRows();
      renderRandomRules();
      renderQuestionSummary();
      renderAssignment();
      renderSettingsSummary();
    });
  }

  function loadPageData() {
    $.when(
      Lms.apiClient.get("api/question-categories?page=1&pageSize=200"),
      Lms.apiClient.get("api/questions?page=1&pageSize=200"),
      Lms.apiClient.get("api/users?page=1&pageSize=200"),
      Lms.apiClient.get("api/groups?page=1&pageSize=200")
    ).done(function (categoriesResponse, questionsResponse, usersResponse, groupsResponse) {
      state.categories = getItems(categoriesResponse).map(function (item) {
        return { id: Number(item.id), name: item.name || "" };
      });
      state.questions = getItems(questionsResponse).map(function (item) {
        return {
          id: Number(item.id),
          categoryId: Number(item.categoryId),
          categoryName: item.categoryName || "",
          content: item.content || "",
          questionType: item.questionType || "SingleChoice",
          difficulty: item.difficulty || "Easy",
          score: Number(item.score || 0)
        };
      });
      state.users = getItems(usersResponse);
      state.groups = getItems(groupsResponse);
      state.filteredQuestions = state.questions.slice();
      renderQuestionCategoryOptions();
      loadExamDetail();
    }).fail(function (error) {
      showToast("error", "Không thể tải dữ liệu màn hình", error && error.message ? error.message : "Vui lòng kiểm tra kết nối API.");
    });
  }

  function init() {
    state.examId = Number($("[data-exam-builder-id]").data("exam-builder-id")) || 0;
    bindEvents();
    renderPageTitle();
    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  $(init);
})(window, jQuery);
