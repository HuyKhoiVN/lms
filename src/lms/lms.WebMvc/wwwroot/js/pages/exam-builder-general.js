(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const draftKey = "lms.admin.examBuilderDrafts";
  const state = {
    examId: 0,
    exam: null,
    exams: [],
    questions: [],
    filteredQuestions: [],
    selectedQuestionIds: [],
    randomRules: [],
    questionSearch: "",
    questionCategory: "",
    questionDifficulty: "",
    users: [],
    groups: [],
    assignedUserIds: [],
    assignedGroupIds: [],
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

  function getItems(response) {
    const payload = unwrap(response);
    return payload && payload.data && Array.isArray(payload.data.items) ? payload.data.items : [];
  }

  function showToast(type, title, message) {
    if (Lms.ui && Lms.ui.showToast) {
      Lms.ui.showToast({ type, title, message });
    }
  }

  function getReviewLabel(reviewMode) {
    const labels = {
      FULL_REVIEW: t("exams.builderPage.optionReviewFull", null, "Xem toàn bộ"),
      RESULT_ONLY: t("exams.builderPage.optionReviewResultOnly", null, "Chỉ xem kết quả"),
      ANSWER_ONLY: t("exams.builderPage.optionReviewAnswerOnly", null, "Chỉ xem đáp án"),
      NO_REVIEW: t("exams.builderPage.optionReviewNo", null, "Không cho xem lại")
    };

    return labels[reviewMode] || "--";
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
      Easy: t("exams.builderPage.optionEasy", null, "Dễ"),
      Medium: t("exams.builderPage.optionMedium", null, "Trung bình"),
      Hard: t("exams.builderPage.optionHard", null, "Khó")
    };
    return labels[difficulty] || difficulty;
  }

  function getStatusLabel(status) {
    return status === "Published" ? t("exams.builderPage.statusPublished", null, "Đã xuất bản") : t("exams.builderPage.statusDraft", null, "Bản nháp");
  }

  function getTypeLabel(type) {
    return type === "MultipleChoice" ? t("exams.builderPage.optionMultipleChoice", null, "Nhiều lựa chọn") : t("exams.builderPage.optionSingleChoice", null, "Một lựa chọn");
  }

  function getStoredDrafts() {
    return Lms.storage ? Lms.storage.get(draftKey, {}) : {};
  }

  function saveDraft(exam) {
    if (!Lms.storage) {
      return;
    }

    const drafts = getStoredDrafts();
    drafts[exam.id] = exam;
    Lms.storage.set(draftKey, drafts);
  }

  function getCurrentDraft() {
    if (state.exam && state.exam.id) {
      return state.exam;
    }

    return null;
  }

  function getNextExamId() {
    const storedIds = Object.keys(getStoredDrafts()).map(Number);
    const mockMax = state.exams.reduce(function (maxId, exam) {
      return Math.max(maxId, Number(exam.id) || 0);
    }, 0);
    const storedMax = storedIds.reduce(function (maxId, id) {
      return Math.max(maxId, id || 0);
    }, 0);

    return Math.max(mockMax, storedMax) + 1;
  }

  function getFormValues() {
    const $form = $("#examGeneralForm");

    return {
      name: $form.find("[name='name']").val().trim(),
      description: $form.find("[name='description']").val().trim(),
      durationMinutes: Number($form.find("[name='durationMinutes']").val()),
      passScore: Number($form.find("[name='passScore']").val()),
      reviewMode: $form.find("[name='reviewMode']").val()
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
      setFieldError("name", t("exams.builderPage.errorName", null, "Tên bài thi phải có ít nhất 3 ký tự."));
      valid = false;
    }

    if (!values.description || values.description.length < 10) {
      setFieldError("description", t("exams.builderPage.errorDescription", null, "Mô tả phải có ít nhất 10 ký tự."));
      valid = false;
    }

    if (!Number.isInteger(values.durationMinutes) || values.durationMinutes < 5) {
      setFieldError("durationMinutes", t("exams.builderPage.errorDuration", null, "Thời lượng phải có ít nhất 5 phút."));
      valid = false;
    }

    if (!Number.isInteger(values.passScore) || values.passScore < 1 || values.passScore > 100) {
      setFieldError("passScore", t("exams.builderPage.errorPassScore", null, "Điểm đạt phải từ 1 đến 100."));
      valid = false;
    }

    if (!values.reviewMode) {
      setFieldError("reviewMode", t("exams.builderPage.errorReviewMode", null, "Vui lòng chọn chính sách xem lại."));
      valid = false;
    }

    return valid;
  }

  function fillForm(exam) {
    const $form = $("#examGeneralForm");

    $form.find("[name='name']").val(exam.name || "");
    $form.find("[name='description']").val(exam.description || "");
    $form.find("[name='durationMinutes']").val(exam.durationMinutes || 30);
    $form.find("[name='passScore']").val(exam.passScore || 75);
    $form.find("[name='reviewMode']").val(exam.reviewMode || "RESULT_ONLY");
    renderPageTitle();
    renderSummary();
  }

  function renderPageTitle() {
    const examId = state.examId;
    $("[data-exam-builder-title]").text(examId ? t("exams.builderPage.editTitle", null, "Sửa bài thi") : t("exams.builderPage.createTitle", null, "Tạo bài thi"));
  }

  function renderSummary() {
    const values = getFormValues();
    const status = state.exam && state.exam.status ? state.exam.status : "Draft";

    $("[data-exam-builder-summary='status']").text(getStatusLabel(status));
    $("[data-exam-builder-summary='duration']").text(values.durationMinutes ? values.durationMinutes + " " + t("exams.builderPage.minutes", null, "phút") : "--");
    $("[data-exam-builder-summary='passScore']").text(values.passScore ? values.passScore + "/100" : "--");
    $("[data-exam-builder-summary='reviewMode']").text(getReviewLabel(values.reviewMode));
  }

  function saveGeneral() {
    if (!validateForm()) {
      return;
    }

    const values = getFormValues();
    const existing = state.exam || {};
    const exam = {
      id: existing.id || getNextExamId(),
      name: values.name,
      description: values.description,
      durationMinutes: values.durationMinutes,
      passScore: values.passScore,
      reviewMode: values.reviewMode,
      status: existing.status || "Draft",
      assignedCount: existing.assignedCount || 0,
      questionCount: existing.questionCount || 0,
      selectedQuestionIds: state.selectedQuestionIds,
      randomRules: state.randomRules,
      assignedUserIds: state.assignedUserIds,
      assignedGroupIds: state.assignedGroupIds,
      settings: state.settings
    };

    state.exam = exam;
    state.examId = exam.id;
    saveDraft(exam);
    renderSummary();
    renderSettingsSummary();
    showToast("success", t("exams.builderPage.toastGeneralSavedTitle", null, "Đã lưu thông tin chung"), t("exams.builderPage.toastGeneralSavedMessage", { name: exam.name }, exam.name + " đã được lưu vào bộ nhớ mô phỏng."));
  }

  function setActiveTab(tabName) {
    $("[data-exam-builder-tab]").toggleClass("active", false);
    $("[data-exam-builder-tab='" + tabName + "']").toggleClass("active", true);
    $("[data-exam-builder-panel]").addClass("u-hidden");
    $("[data-exam-builder-panel='" + tabName + "']").removeClass("u-hidden");
  }

  function renderQuestionCategoryOptions() {
    const categories = Array.from(new Set(state.questions.map(function (question) {
      return question.category;
    }))).sort();

    ["[data-exam-question-filter='category']", "[data-random-rule-field='category']"].forEach(function (selector) {
      const $select = $(selector);
      const currentValue = $select.val();

      $select.find("option:not(:first)").remove();
      categories.forEach(function (category) {
        $select.append('<option value="' + escapeHtml(category) + '">' + escapeHtml(category) + "</option>");
      });
      $select.val(currentValue || "");
    });
  }

  function getSelectedQuestions() {
    return state.questions.filter(function (question) {
      return state.selectedQuestionIds.includes(question.id);
    });
  }

  function renderQuestionSummary() {
    const selected = getSelectedQuestions();
    const score = selected.reduce(function (total, question) {
      return total + Number(question.score || 0);
    }, 0);

    $("[data-exam-question-count]").text(t("exams.builderPage.selectedCount", { count: selected.length }, selected.length + " đã chọn"));
    $("[data-exam-question-summary='manual']").text(selected.length);
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
              '<h3 class="app-empty-title">' + t("exams.builderPage.noQuestionsFoundTitle", null, "Không tìm thấy câu hỏi") + "</h3>" +
              '<p class="app-empty-copy">' + t("exams.builderPage.noQuestionsFoundCopy", null, "Thử bộ lọc từ khóa, danh mục hoặc độ khó khác.") + "</p>" +
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
              "<span>" + t("exams.builderPage.questionId", { id: question.id }, "Mã câu hỏi #" + question.id) + "</span>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge app-badge-info">' + escapeHtml(question.category) + "</span></td>" +
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
      const matchesKeyword = !keyword || question.content.toLowerCase().includes(keyword);
      const matchesCategory = !state.questionCategory || question.category === state.questionCategory;
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
      $list.append('<p class="page-muted u-mb-0">' + t("exams.builderPage.noRandomRules", null, "Chưa thêm quy tắc ngẫu nhiên nào.") + "</p>");
      return;
    }

    state.randomRules.forEach(function (rule, index) {
      $list.append(
        '<div class="question-answer-row exam-random-rule-row">' +
          '<span class="app-badge app-badge-info">' + t("exams.builderPage.badgeRule", null, "Quy tắc") + "</span>" +
          "<span>" + t("exams.builderPage.randomRuleText", {
            count: rule.count,
            category: rule.category ? rule.category : t("exams.builderPage.anyCategory", null, "danh mục bất kỳ"),
            difficulty: rule.difficulty ? getDifficultyLabel(rule.difficulty) : t("exams.builderPage.anyDifficulty", null, "độ khó bất kỳ")
          }, rule.count + " câu hỏi, " + (rule.category || "danh mục bất kỳ") + ", " + (rule.difficulty ? getDifficultyLabel(rule.difficulty) : "độ khó bất kỳ")) + "</span>" +
          '<button class="app-button app-button-secondary" type="button" data-random-rule-remove="' + index + '">' + t("exams.builderPage.buttonRemove", null, "Xóa") + "</button>" +
        "</div>"
      );
    });
  }

  function addRandomRule() {
    const count = Number($("[data-random-rule-field='count']").val());

    if (!Number.isInteger(count) || count < 1) {
      showToast("warning", t("exams.builderPage.toastInvalidRule", null, "Quy tắc không hợp lệ"), t("exams.builderPage.toastCountAtLeastOne", null, "Số lượng câu hỏi phải ít nhất là 1."));
      return;
    }

    state.randomRules.push({
      category: $("[data-random-rule-field='category']").val(),
      difficulty: $("[data-random-rule-field='difficulty']").val(),
      count
    });
    renderRandomRules();
    renderQuestionSummary();
    renderSettingsSummary();
    showToast("success", t("exams.builderPage.toastRuleAddedTitle", null, "Đã thêm quy tắc"), t("exams.builderPage.toastRuleAddedMessage", null, "Quy tắc câu hỏi ngẫu nhiên đã được thêm vào bản nháp bài thi."));
  }

  function saveQuestions() {
    const draft = getCurrentDraft();

    if (!draft) {
      showToast("warning", t("exams.builderPage.toastSaveGeneralFirst", null, "Lưu thông tin chung trước"), t("exams.builderPage.toastSaveGeneralBeforeQuestions", null, "Lưu tab Thông tin chung trước khi lưu câu hỏi."));
      return;
    }

    draft.selectedQuestionIds = state.selectedQuestionIds;
    draft.randomRules = state.randomRules;
    draft.questionCount = state.selectedQuestionIds.length + state.randomRules.reduce(function (total, rule) {
      return total + Number(rule.count || 0);
    }, 0);
    saveDraft(draft);
    renderSettingsSummary();
    showToast("success", t("exams.builderPage.toastQuestionsSavedTitle", null, "Đã lưu câu hỏi"), t("exams.builderPage.toastQuestionsSavedMessage", null, "Danh sách câu hỏi đã chọn và các quy tắc ngẫu nhiên đã được lưu."));
  }

  function getById(items, id) {
    return items.find(function (item) {
      return item.id === Number(id);
    });
  }

  function renderAssignmentSelect(selector, items, selectedIds, emptyText, labelSelector) {
    const $select = $(selector).empty();
    const available = items.filter(function (item) {
      return !selectedIds.includes(item.id);
    });

    if (!available.length) {
      $select.append('<option value="">' + emptyText + "</option>");
      $select.prop("disabled", true);
      $(labelSelector).prop("disabled", true);
      return;
    }

    $select.prop("disabled", false);
    $(labelSelector).prop("disabled", false);
    $select.append('<option value="">' + t("exams.builderPage.selectItem", null, "Chọn mục") + "</option>");
    available.forEach(function (item) {
      $select.append('<option value="' + item.id + '">' + escapeHtml(item.fullName || item.name) + "</option>");
    });
  }

  function renderAssignedList(containerSelector, items, selectedIds, type) {
    const $container = $(containerSelector).empty();

    if (!selectedIds.length) {
      const emptyTitle = type === "user"
        ? t("exams.builderPage.noUsersAssignedTitle", null, "Chưa giao cho học viên nào")
        : t("exams.builderPage.noGroupsAssignedTitle", null, "Chưa giao cho nhóm nào");
      const emptyCopy = type === "user"
        ? t("exams.builderPage.noUsersAssignedCopy", null, "Sử dụng bộ chọn phía trên để thêm học viên.")
        : t("exams.builderPage.noGroupsAssignedCopy", null, "Sử dụng bộ chọn phía trên để thêm nhóm.");

      $container.append(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">A</div>' +
          '<h3 class="app-empty-title">' + emptyTitle + "</h3>" +
          '<p class="app-empty-copy">' + emptyCopy + "</p>" +
        "</div>"
      );
      return;
    }

    selectedIds.forEach(function (id) {
      const item = getById(items, id);

      if (!item) {
        return;
      }

      const title = item.fullName || item.name;
      const subtitle = item.email || t("exams.builderPage.memberCount", { count: item.memberCount }, item.memberCount + " thành viên");

      $container.append(
        '<div class="group-detail-item">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar" aria-hidden="true">' + escapeHtml(title.charAt(0).toUpperCase()) + "</span>" +
            "<div>" +
              "<strong>" + escapeHtml(title) + "</strong>" +
              "<span>" + escapeHtml(subtitle) + "</span>" +
            "</div>" +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-exam-assignment-remove="' + type + '" data-item-id="' + item.id + '">' + t("exams.builderPage.buttonRemove", null, "Xóa") + "</button>" +
        "</div>"
      );
    });
  }

  function renderAssignment() {
    renderAssignmentSelect(
      "[data-exam-assignment-select='user']",
      state.users.filter(function (user) { return user.role === "Student"; }),
      state.assignedUserIds,
      t("exams.builderPage.allUsersAssigned", null, "Đã giao cho tất cả học viên"),
      "[data-exam-assignment-add='user']"
    );
    renderAssignmentSelect(
      "[data-exam-assignment-select='group']",
      state.groups,
      state.assignedGroupIds,
      t("exams.builderPage.allGroupsAssigned", null, "Đã giao cho tất cả nhóm"),
      "[data-exam-assignment-add='group']"
    );
    renderAssignedList("#examAssignedUserList", state.users, state.assignedUserIds, "user");
    renderAssignedList("#examAssignedGroupList", state.groups, state.assignedGroupIds, "group");
    $("[data-exam-assignment-count]").text(t("exams.builderPage.assignedCount", { count: state.assignedUserIds.length + state.assignedGroupIds.length }, (state.assignedUserIds.length + state.assignedGroupIds.length) + " đã giao"));
    $("[data-exam-assignment-summary='users']").text(state.assignedUserIds.length);
    $("[data-exam-assignment-summary='groups']").text(state.assignedGroupIds.length);
    renderSettingsSummary();
  }

  function addAssignment(type) {
    const selector = type === "user" ? "[data-exam-assignment-select='user']" : "[data-exam-assignment-select='group']";
    const value = Number($(selector).val());
    const target = type === "user" ? state.assignedUserIds : state.assignedGroupIds;

    if (!value) {
      showToast("warning", t("exams.builderPage.toastChooseAssignment", null, "Chọn đối tượng"), t("exams.builderPage.toastSelectBeforeAdding", { type: type === "user" ? t("exams.builderPage.student", null, "học viên") : t("exams.builderPage.group", null, "nhóm") }, "Vui lòng chọn một " + (type === "user" ? "học viên" : "nhóm") + " trước khi thêm."));
      return;
    }

    if (!target.includes(value)) {
      target.push(value);
    }

    renderAssignment();
    showToast("success", t("exams.builderPage.toastAssignmentAddedTitle", null, "Đã giao bài"), t("exams.builderPage.toastAssignmentAddedMessage", { type: type === "user" ? t("exams.builderPage.student", null, "học viên") : t("exams.builderPage.group", null, "nhóm") }, "Đã giao bài cho " + (type === "user" ? "học viên" : "nhóm") + " thành công."));
  }

  function removeAssignment(type, itemId) {
    if (type === "user") {
      state.assignedUserIds = state.assignedUserIds.filter(function (id) {
        return id !== Number(itemId);
      });
    } else {
      state.assignedGroupIds = state.assignedGroupIds.filter(function (id) {
        return id !== Number(itemId);
      });
    }

    renderAssignment();
  }

  function saveAssignment() {
    const draft = getCurrentDraft();

    if (!draft) {
      showToast("warning", t("exams.builderPage.toastSaveGeneralFirst", null, "Lưu thông tin chung trước"), t("exams.builderPage.toastSaveGeneralBeforeAssignment", null, "Lưu tab Thông tin chung trước khi lưu thông tin giao bài."));
      return;
    }

    draft.assignedUserIds = state.assignedUserIds;
    draft.assignedGroupIds = state.assignedGroupIds;
    draft.assignedCount = state.assignedUserIds.length + state.assignedGroupIds.length;
    saveDraft(draft);
    showToast("success", t("exams.builderPage.toastAssignmentSavedTitle", null, "Đã lưu giao bài"), t("exams.builderPage.toastAssignmentSavedMessage", null, "Thông tin giao bài thi đã được lưu vào bộ nhớ mô phỏng."));
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

    $form.find("[name='shuffleQuestions']").prop("checked", Boolean(settings.shuffleQuestions));
    $form.find("[name='shuffleAnswers']").prop("checked", Boolean(settings.shuffleAnswers));
    $form.find("[name='allowBackNavigation']").prop("checked", Boolean(settings.allowBackNavigation));
    $form.find("[name='autoSubmit']").prop("checked", settings.autoSubmit !== false);
    $form.find("[name='attemptLimit']").val(settings.attemptLimit || 1);
    $form.find("[name='autosaveSeconds']").val(settings.autosaveSeconds || 30);
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
      setSettingsError("attemptLimit", t("exams.builderPage.errorAttemptLimit", null, "Số lượt làm bài tối đa phải ít nhất là 1."));
      valid = false;
    }

    if (!Number.isInteger(values.autosaveSeconds) || values.autosaveSeconds < 15) {
      setSettingsError("autosaveSeconds", t("exams.builderPage.errorAutosaveSeconds", null, "Thời gian tự động lưu phải từ 15 giây trở lên."));
      valid = false;
    }

    return valid;
  }

  function renderSettingsSummary() {
    const questionCount = state.selectedQuestionIds.length + state.randomRules.reduce(function (total, rule) {
      return total + Number(rule.count || 0);
    }, 0);

    $("[data-exam-settings-summary='status']").text(getStatusLabel(state.exam && state.exam.status ? state.exam.status : "Draft"));
    $("[data-exam-settings-summary='questions']").text(questionCount);
    $("[data-exam-settings-summary='assigned']").text(state.assignedUserIds.length + state.assignedGroupIds.length);
  }

  function saveSettings() {
    const draft = getCurrentDraft();

    if (!draft) {
      showToast("warning", t("exams.builderPage.toastSaveGeneralFirst", null, "Lưu thông tin chung trước"), t("exams.builderPage.toastSaveGeneralBeforeSettings", null, "Lưu tab Thông tin chung trước khi lưu cài đặt."));
      return false;
    }

    if (!validateSettings()) {
      return false;
    }

    state.settings = getSettingsValues();
    draft.settings = state.settings;
    saveDraft(draft);
    renderSettingsSummary();
    showToast("success", t("exams.builderPage.toastSettingsSavedTitle", null, "Đã lưu cài đặt"), t("exams.builderPage.toastSettingsSavedMessage", null, "Cài đặt bài thi đã được lưu vào bộ nhớ mô phỏng."));
    return true;
  }

  function publishExam() {
    const draft = getCurrentDraft();

    if (!draft) {
      showToast("warning", t("exams.builderPage.toastSaveGeneralFirst", null, "Lưu thông tin chung trước"), t("exams.builderPage.toastSaveGeneralBeforePublish", null, "Lưu tab Thông tin chung trước khi xuất bản."));
      return;
    }

    const questionCount = state.selectedQuestionIds.length + state.randomRules.reduce(function (total, rule) {
      return total + Number(rule.count || 0);
    }, 0);

    if (questionCount < 1) {
      showToast("warning", t("exams.builderPage.toastQuestionsRequiredTitle", null, "Cần có câu hỏi"), t("exams.builderPage.toastQuestionsRequiredMessage", null, "Vui lòng chọn ít nhất một câu hỏi hoặc quy tắc ngẫu nhiên trước khi xuất bản."));
      setActiveTab("questions");
      return;
    }

    if (!Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title" data-i18n="exams.builderPage.modalPublishTitle">' + t("exams.builderPage.modalPublishTitle", null, "Xuất bản bài thi") + "</h2>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="exams.builderPage.buttonClose">' + t("exams.builderPage.buttonClose", null, "Đóng") + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0"></p>' +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close data-i18n="exams.builderPage.buttonCancel">' + t("exams.builderPage.buttonCancel", null, "Hủy") + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-exam-publish-confirm data-i18n="exams.builderPage.buttonPublish">' + t("exams.builderPage.buttonPublish", null, "Xuất bản") + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find(".app-modal-body p").html(
      t("exams.builderPage.modalPublishConfirm", { name: "<strong>" + escapeHtml(draft.name) + "</strong>" }, "Xuất bản <strong>" + escapeHtml(draft.name) + "</strong>? Học viên được giao bài thi này sẽ có thể bắt đầu làm bài.")
    );
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-exam-publish-confirm]").on("click", function () {
      if (!validateSettings()) {
        return;
      }

      state.settings = getSettingsValues();
      draft.settings = state.settings;
      draft.status = "Published";
      draft.questionCount = questionCount;
      draft.assignedUserIds = state.assignedUserIds;
      draft.assignedGroupIds = state.assignedGroupIds;
      draft.assignedCount = state.assignedUserIds.length + state.assignedGroupIds.length;
      state.exam = draft;
      saveDraft(draft);
      Lms.ui.closeModal();
      renderSummary();
      renderSettingsSummary();
      showToast("success", t("exams.builderPage.toastExamPublishedTitle", null, "Đã xuất bản bài thi"), t("exams.builderPage.toastExamPublishedMessage", { name: draft.name }, draft.name + " hiện đã được xuất bản trong bộ nhớ mô phỏng."));
    });

    Lms.ui.showModal(modal);
  }

  function bindEvents() {
    $("#examGeneralForm").on("input change", "input, textarea, select", renderSummary);

    $(document).on("click", "[data-exam-builder-action='save']", saveGeneral);

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

    $(document).on("click", "[data-exam-question-action='clear-filters']", function () {
      state.questionSearch = "";
      state.questionCategory = "";
      state.questionDifficulty = "";
      $("[data-exam-question-filter='search']").val("");
      $("[data-exam-question-filter='category']").val("");
      $("[data-exam-question-filter='difficulty']").val("");
      applyQuestionFilters();
    });

    $(document).on("click", "[data-exam-question-action='add-random-rule']", addRandomRule);
    $(document).on("click", "[data-exam-question-action='save']", saveQuestions);
    $(document).on("click", "[data-random-rule-remove]", function () {
      state.randomRules.splice(Number($(this).data("random-rule-remove")), 1);
      renderRandomRules();
      renderQuestionSummary();
      renderSettingsSummary();
    });

    $(document).on("click", "[data-exam-assignment-add]", function () {
      addAssignment($(this).data("exam-assignment-add"));
    });

    $(document).on("click", "[data-exam-assignment-remove]", function () {
      removeAssignment($(this).data("exam-assignment-remove"), $(this).data("item-id"));
    });

    $(document).on("click", "[data-exam-assignment-action='save']", saveAssignment);

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

  function init() {
    state.examId = Number($("[data-exam-builder-id]").data("exam-builder-id"));
    bindEvents();

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }
    loadPageData();
  }

  function loadPageData() {
    $.when(
      Lms.apiClient.get("exams.json"),
      Lms.apiClient.get("questions.json"),
      Lms.apiClient.get("users.json"),
      Lms.apiClient.get("groups.json")
    ).done(function (examsResponse, questionsResponse, usersResponse, groupsResponse) {
      const drafts = getStoredDrafts();
      state.exams = getItems(examsResponse);
      state.questions = getItems(questionsResponse);
      state.users = getItems(usersResponse);
      state.groups = getItems(groupsResponse);
      state.exam = drafts[state.examId] || state.exams.find(function (exam) {
        return exam.id === state.examId;
      }) || null;
      state.selectedQuestionIds = state.exam && Array.isArray(state.exam.selectedQuestionIds) ? state.exam.selectedQuestionIds : [];
      state.randomRules = state.exam && Array.isArray(state.exam.randomRules) ? state.exam.randomRules : [];
      state.assignedUserIds = state.exam && Array.isArray(state.exam.assignedUserIds) ? state.exam.assignedUserIds : [];
      state.assignedGroupIds = state.exam && Array.isArray(state.exam.assignedGroupIds) ? state.exam.assignedGroupIds : [];

      fillForm(state.exam || {
        id: 0,
        name: "",
        description: "",
        durationMinutes: 30,
        passScore: 75,
        reviewMode: "RESULT_ONLY",
        status: "Draft",
        assignedCount: 0,
        questionCount: 0
      });
      renderQuestionCategoryOptions();
      state.filteredQuestions = state.questions.slice();
      renderQuestionRows();
      renderRandomRules();
      renderQuestionSummary();
      fillSettings(state.exam && state.exam.settings ? state.exam.settings : state.settings);
      renderAssignment();
    }).fail(function () {
      fillForm({
        id: 0,
        name: "",
        description: "",
        durationMinutes: 30,
        passScore: 75,
        reviewMode: "RESULT_ONLY",
        status: "Draft",
        assignedCount: 0,
        questionCount: 0
      });
      showToast("error", t("exams.builderPage.toastLoadErrorTitle", null, "Lỗi tải dữ liệu"), t("exams.builderPage.toastLoadErrorMessage", null, "Không thể tải dữ liệu mô phỏng bài thi."));
    });
  }

  $(init);
})(window, jQuery);
