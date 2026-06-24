(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    questions: [],
    filteredQuestions: [],
    page: 1,
    pageSize: 8,
    search: "",
    category: "",
    difficulty: "",
    type: "",
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

  function getQuestion(questionId) {
    return state.questions.find(function (question) {
      return question.id === Number(questionId);
    });
  }

  function getNextQuestionId() {
    return state.questions.reduce(function (maxId, question) {
      return Math.max(maxId, Number(question.id) || 0);
    }, 0) + 1;
  }

  function getNextAnswerId() {
    return state.questions.reduce(function (maxId, question) {
      const answerMax = Array.isArray(question.answers)
        ? question.answers.reduce(function (innerMax, answer) {
          return Math.max(innerMax, Number(answer.id) || 0);
        }, 0)
        : 0;

      return Math.max(maxId, answerMax);
    }, 0) + 1;
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

  function translateDifficulty(difficulty) {
    return t("questions.listPage.difficulty" + difficulty, null, difficulty);
  }

  function translateType(type) {
    return type === "MultipleChoice"
      ? t("questions.listPage.typeMultiple", null, "Nhiều lựa chọn")
      : t("questions.listPage.typeSingle", null, "Một lựa chọn");
  }

  function renderPageTitle() {
    document.title = t("questions.listPage.title", null, "Ngân hàng câu hỏi") + " - " + t("common.appName", null, "lms");
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredQuestions.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredQuestions.slice(start, start + state.pageSize);
  }

  function renderCategoryOptions() {
    const categories = Array.from(new Set(state.questions.map(function (question) {
      return question.category;
    }))).sort();
    const $select = $("[data-question-filter='category']");
    const currentValue = $select.val() || "";

    $select.find("option:not(:first)").remove();
    categories.forEach(function (category) {
      $select.append('<option value="' + escapeHtml(category) + '">' + escapeHtml(category) + "</option>");
    });
    $select.val(currentValue);
  }

  function renderMetrics() {
    const categories = new Set(state.questions.map(function (question) {
      return question.category;
    })).size;
    const score = state.questions.reduce(function (total, question) {
      return total + Number(question.score || 0);
    }, 0);
    const answers = state.questions.reduce(function (total, question) {
      return total + (Array.isArray(question.answers) ? question.answers.length : 0);
    }, 0);

    $("[data-question-metric='total']").text(state.questions.length);
    $("[data-question-metric='categories']").text(categories);
    $("[data-question-metric='score']").text(score);
    $("[data-question-metric='answers']").text(answers);
  }

  function renderRows() {
    const $rows = $("#questionTableRows").empty();
    const rows = getCurrentPageRows();

    if (!rows.length) {
      $rows.append(
        "<tr>" +
          '<td colspan="7">' +
            '<div class="app-empty-state">' +
              '<div class="app-empty-icon" aria-hidden="true">Q</div>' +
              '<h3 class="app-empty-title">' + escapeHtml(t("questions.listPage.noQuestionsTitle", null, "Không tìm thấy câu hỏi")) + "</h3>" +
              '<p class="app-empty-copy">' + escapeHtml(t("questions.listPage.noQuestionsCopy", null, "Thử từ khóa, danh mục, độ khó hoặc bộ lọc thể loại khác.")) + "</p>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
      return;
    }

    rows.forEach(function (question) {
      const answerCount = Array.isArray(question.answers) ? question.answers.length : 0;
      const correctCount = Array.isArray(question.answers)
        ? question.answers.filter(function (answer) {
          return answer.isCorrect;
        }).length
        : 0;

      $rows.append(
        "<tr>" +
          "<td>" +
            '<div class="admin-question-cell">' +
              "<strong>" + escapeHtml(question.content) + "</strong>" +
              "<span>" + escapeHtml(t("questions.listPage.questionId", { id: question.id }, "Mã câu hỏi #" + question.id)) + "</span>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge app-badge-info">' + escapeHtml(question.category) + "</span></td>" +
          '<td><span class="app-badge ' + getDifficultyBadgeClass(question.difficulty) + '">' + escapeHtml(translateDifficulty(question.difficulty)) + "</span></td>" +
          "<td>" + escapeHtml(translateType(question.questionType)) + "</td>" +
          "<td>" + escapeHtml(question.score) + "</td>" +
          "<td>" + escapeHtml(t("questions.listPage.answersMeta", { options: answerCount, correct: correctCount }, answerCount + " lựa chọn / " + correctCount + " đúng")) + "</td>" +
          '<td class="u-text-right">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-question-action="view" data-question-id="' + question.id + '">' + escapeHtml(t("common.view", null, "Xem")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-question-action="edit" data-question-id="' + question.id + '">' + escapeHtml(t("common.edit", null, "Sửa")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-question-action="delete" data-question-id="' + question.id + '">' + escapeHtml(t("common.delete", null, "Xóa")) + "</button>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
    });
  }

  function renderPagination() {
    const pageCount = getPageCount();
    const $pages = $("#questionPaginationPages").empty();
    const startRecord = state.filteredQuestions.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const endRecord = Math.min(state.page * state.pageSize, state.filteredQuestions.length);

    $("[data-question-result-count]").text(t("questions.listPage.records", { count: state.filteredQuestions.length }, state.filteredQuestions.length + " bản ghi"));
    $("[data-question-page-info]").text(t("questions.listPage.showing", { start: startRecord, end: endRecord, total: state.filteredQuestions.length }, "Hiển thị " + startRecord + "-" + endRecord + " trên " + state.filteredQuestions.length + " câu hỏi"));
    $("[data-question-page='prev']").prop("disabled", state.page <= 1);
    $("[data-question-page='next']").prop("disabled", state.page >= pageCount);

    for (let page = 1; page <= pageCount; page += 1) {
      const $button = $('<button class="admin-pagination-page" type="button"></button>');
      $button.text(page);
      $button.attr("data-question-page-number", page);
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

    state.filteredQuestions = state.questions.filter(function (question) {
      const matchesKeyword = !keyword || question.content.toLowerCase().includes(keyword);
      const matchesCategory = !state.category || question.category === state.category;
      const matchesDifficulty = !state.difficulty || question.difficulty === state.difficulty;
      const matchesType = !state.type || question.questionType === state.type;

      return matchesKeyword && matchesCategory && matchesDifficulty && matchesType;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function addAnswerRow(container, answer, questionType) {
    const answerValue = answer || { id: 0, content: "", isCorrect: false };
    const inputType = questionType === "SingleChoice" ? "radio" : "checkbox";
    const nameAttribute = questionType === "SingleChoice" ? ' name="questionCorrectAnswer"' : "";
    const row = $(
      '<div class="question-editor-answer-row" data-question-answer-row>' +
        '<label class="question-editor-correct">' +
          '<input type="' + inputType + '"' + nameAttribute + ' data-question-answer-correct />' +
          "<span>" + escapeHtml(t("questions.listPage.correct", null, "Đúng")) + "</span>" +
        "</label>" +
        '<input class="app-input" type="text" data-question-answer-content placeholder="' + escapeHtml(t("questions.listPage.answerPlaceholder", null, "Nội dung đáp án")) + '" />' +
        '<button class="app-button app-button-secondary" type="button" data-question-answer-remove>' + escapeHtml(t("common.delete", null, "Xóa")) + "</button>" +
        '<span class="auth-error" data-question-answer-error></span>' +
      "</div>"
    );

    row.attr("data-answer-id", answerValue.id);
    row.find("[data-question-answer-content]").val(answerValue.content);
    row.find("[data-question-answer-correct]").prop("checked", Boolean(answerValue.isCorrect));
    $(container).append(row);
  }

  function refreshCorrectControls(form) {
    const questionType = $(form).find("[name='questionType']").val();
    const rows = $(form).find("[data-question-answer-row]");

    rows.each(function () {
      const checked = $(this).find("[data-question-answer-correct]").prop("checked");
      const input = $('<input data-question-answer-correct />');

      input.attr("type", questionType === "SingleChoice" ? "radio" : "checkbox");
      if (questionType === "SingleChoice") {
        input.attr("name", "questionCorrectAnswer");
      }
      input.prop("checked", checked);
      $(this).find("[data-question-answer-correct]").replaceWith(input);
    });

    if (questionType === "SingleChoice") {
      const checkedRows = rows.find("[data-question-answer-correct]:checked");

      if (checkedRows.length > 1) {
        checkedRows.slice(1).prop("checked", false);
      }
    }
  }

  function getEditorValues(form) {
    const $form = $(form);
    const answers = [];

    $form.find("[data-question-answer-row]").each(function () {
      answers.push({
        id: Number($(this).attr("data-answer-id")) || 0,
        content: $(this).find("[data-question-answer-content]").val().trim(),
        isCorrect: $(this).find("[data-question-answer-correct]").prop("checked")
      });
    });

    return {
      category: $form.find("[name='category']").val().trim(),
      difficulty: $form.find("[name='difficulty']").val(),
      questionType: $form.find("[name='questionType']").val(),
      content: $form.find("[name='content']").val().trim(),
      score: Number($form.find("[name='score']").val()),
      answers
    };
  }

  function setEditorError(form, fieldName, message) {
    const $field = $(form).find("[name='" + fieldName + "']");
    const $error = $(form).find("[data-question-error='" + fieldName + "']");

    $field.toggleClass("is-invalid", Boolean(message));
    $error.text(message || "");
  }

  function clearEditorErrors(form) {
    $(form).find(".is-invalid").removeClass("is-invalid");
    $(form).find("[data-question-error], [data-question-answer-error]").text("");
  }

  function validateQuestionEditor(form) {
    const values = getEditorValues(form);
    let valid = true;

    clearEditorErrors(form);

    if (!values.content || values.content.length < 10) {
      setEditorError(form, "content", t("questions.listPage.contentMin", null, "Nội dung câu hỏi phải có ít nhất 10 ký tự."));
      valid = false;
    }

    if (!values.category || values.category.length < 2) {
      setEditorError(form, "category", t("questions.listPage.categoryRequired", null, "Vui lòng nhập danh mục câu hỏi."));
      valid = false;
    }

    if (!values.difficulty) {
      setEditorError(form, "difficulty", t("questions.listPage.difficultyRequired", null, "Vui lòng chọn độ khó."));
      valid = false;
    }

    if (!values.questionType) {
      setEditorError(form, "questionType", t("questions.listPage.typeRequired", null, "Vui lòng chọn thể loại câu hỏi."));
      valid = false;
    }

    if (!Number.isInteger(values.score) || values.score < 1) {
      setEditorError(form, "score", t("questions.listPage.scoreRequired", null, "Điểm số phải là số nguyên lớn hơn 0."));
      valid = false;
    }

    if (values.answers.length < 2) {
      $(form).find("[data-question-error='answers']").text(t("questions.listPage.minAnswersRequired", null, "Yêu cầu có ít nhất 2 đáp án lựa chọn."));
      valid = false;
    }

    values.answers.forEach(function (answer, index) {
      if (!answer.content) {
        $(form).find("[data-question-answer-row]").eq(index).find("[data-question-answer-error]").text(t("questions.listPage.answerRequired", null, "Nội dung đáp án không được để trống."));
        valid = false;
      }
    });

    const correctCount = values.answers.filter(function (answer) {
      return answer.isCorrect;
    }).length;

    if (values.questionType === "SingleChoice" && correctCount !== 1) {
      $(form).find("[data-question-error='answers']").text(t("questions.listPage.singleChoiceCorrectCount", null, "Câu hỏi một lựa chọn phải có đúng 1 đáp án đúng."));
      valid = false;
    }

    if (values.questionType === "MultipleChoice" && correctCount < 1) {
      $(form).find("[data-question-error='answers']").text(t("questions.listPage.multipleChoiceCorrectCount", null, "Câu hỏi nhiều lựa chọn phải có ít nhất 1 đáp án đúng."));
      valid = false;
    }

    return valid;
  }

  function buildQuestionEditor(question) {
    const isEdit = Boolean(question);
    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          "<div>" +
            '<h2 class="app-modal-title">' + escapeHtml(isEdit ? t("questions.listPage.editQuestion", null, "Sửa câu hỏi") : t("questions.listPage.createQuestionModal", null, "Tạo câu hỏi")) + "</h2>" +
            '<p class="app-card-subtitle">' + escapeHtml(isEdit ? t("questions.listPage.editSubtitle", null, "Cập nhật nội dung câu hỏi và các lựa chọn đáp án mô phỏng.") : t("questions.listPage.createSubtitle", null, "Thêm một câu hỏi mô phỏng mới trong bộ nhớ.")) + "</p>" +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("questions.listPage.close", null, "Đóng")) + "</button>" +
        "</div>" +
        '<form class="app-modal-body admin-user-form question-editor-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("questions.listPage.formContent", null, "Nội dung câu hỏi")) +
            '<textarea class="app-input admin-course-textarea" name="content" rows="3"></textarea>' +
            '<span class="auth-error" data-question-error="content"></span>' +
          "</label>" +
          '<div class="admin-user-form-grid">' +
            '<label class="auth-field">' + escapeHtml(t("questions.listPage.formCategory", null, "Danh mục")) +
              '<input class="app-input" name="category" type="text" autocomplete="off" />' +
              '<span class="auth-error" data-question-error="category"></span>' +
            "</label>" +
            '<label class="auth-field">' + escapeHtml(t("questions.listPage.formDifficulty", null, "Độ khó")) +
              '<select class="app-select" name="difficulty">' +
                '<option value="">' + escapeHtml(t("questions.listPage.selectDifficultyPlaceholder", null, "Chọn độ khó")) + "</option>" +
                '<option value="Easy">' + escapeHtml(t("questions.listPage.difficultyEasy", null, "Dễ")) + "</option>" +
                '<option value="Medium">' + escapeHtml(t("questions.listPage.difficultyMedium", null, "Trung bình")) + "</option>" +
                '<option value="Hard">' + escapeHtml(t("questions.listPage.difficultyHard", null, "Khó")) + "</option>" +
              "</select>" +
              '<span class="auth-error" data-question-error="difficulty"></span>' +
            "</label>" +
          "</div>" +
          '<div class="admin-user-form-grid">' +
            '<label class="auth-field">' + escapeHtml(t("questions.listPage.formType", null, "Thể loại câu hỏi")) +
              '<select class="app-select" name="questionType">' +
                '<option value="">' + escapeHtml(t("questions.listPage.selectTypePlaceholder", null, "Chọn thể loại")) + "</option>" +
                '<option value="SingleChoice">' + escapeHtml(t("questions.listPage.typeSingle", null, "Một lựa chọn")) + "</option>" +
                '<option value="MultipleChoice">' + escapeHtml(t("questions.listPage.typeMultiple", null, "Nhiều lựa chọn")) + "</option>" +
              "</select>" +
              '<span class="auth-error" data-question-error="questionType"></span>' +
            "</label>" +
            '<label class="auth-field">' + escapeHtml(t("questions.listPage.formScore", null, "Điểm")) +
              '<input class="app-input" name="score" type="number" min="1" step="1" />' +
              '<span class="auth-error" data-question-error="score"></span>' +
            "</label>" +
          "</div>" +
          '<div class="question-editor-answer-header">' +
            "<div>" +
              '<h3 class="app-card-title">' + escapeHtml(t("questions.listPage.answerOptions", null, "Danh sách đáp án")) + "</h3>" +
              '<p class="app-card-subtitle">' + escapeHtml(t("questions.listPage.answersSubtitle", null, "Một lựa chọn chỉ cho phép duy nhất một đáp án đúng; nhiều lựa chọn cho phép chọn nhiều.")) + "</p>" +
            "</div>" +
            '<button class="app-button app-button-secondary" type="button" data-question-answer-add>' + escapeHtml(t("questions.listPage.addAnswer", null, "Thêm đáp án")) + "</button>" +
          "</div>" +
          '<div class="question-editor-answer-list" data-question-answer-list></div>' +
          '<span class="auth-error" data-question-error="answers"></span>' +
        "</form>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("questions.listPage.cancel", null, "Hủy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-question-save>' + escapeHtml(isEdit ? t("questions.listPage.saveChanges", null, "Lưu thay đổi") : t("questions.listPage.createQuestion", null, "Tạo câu hỏi")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("[name='content']").val(question ? question.content : "");
    modal.find("[name='category']").val(question ? question.category : "");
    modal.find("[name='difficulty']").val(question ? question.difficulty : "Easy");
    modal.find("[name='questionType']").val(question ? question.questionType : "SingleChoice");
    modal.find("[name='score']").val(question ? question.score : 1);

    const answers = question && Array.isArray(question.answers) && question.answers.length
      ? question.answers
      : [
        { id: 0, content: "", isCorrect: true },
        { id: 0, content: "", isCorrect: false }
      ];

    answers.forEach(function (answer) {
      addAnswerRow(modal.find("[data-question-answer-list]"), answer, modal.find("[name='questionType']").val());
    });

    return modal;
  }

  function normalizeAnswers(answers) {
    let nextAnswerId = getNextAnswerId();

    return answers.map(function (answer) {
      const normalizedAnswer = {
        ...answer,
        id: answer.id || nextAnswerId
      };

      if (!answer.id) {
        nextAnswerId += 1;
      }

      return normalizedAnswer;
    });
  }

  function showQuestionEditor(questionId) {
    const editingQuestionId = questionId ? Number(questionId) : null;
    const question = editingQuestionId ? getQuestion(editingQuestionId) : null;

    if (editingQuestionId && !question) {
      showToast("error", t("questions.listPage.questionNotFoundTitle", null, "Không tìm thấy câu hỏi"), t("questions.listPage.questionNotFoundMessage", null, "Không tìm thấy câu hỏi đã chọn."));
      return;
    }

    if (!Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = buildQuestionEditor(question);
    const form = modal.find("form")[0];

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[name='questionType']").on("change", function () {
      refreshCorrectControls(form);
    });
    modal.on("change", "[data-question-answer-correct]", function () {
      if ($(form).find("[name='questionType']").val() === "SingleChoice") {
        $(form).find("[data-question-answer-correct]").not(this).prop("checked", false);
      }
    });
    modal.on("click", "[data-question-answer-add]", function () {
      addAnswerRow($(form).find("[data-question-answer-list]"), { id: 0, content: "", isCorrect: false }, $(form).find("[name='questionType']").val());
    });
    modal.on("click", "[data-question-answer-remove]", function () {
      if ($(form).find("[data-question-answer-row]").length <= 2) {
        showToast("warning", t("questions.listPage.answerRequiredTitle", null, "Yêu cầu đáp án"), t("questions.listPage.minAnswersRequired", null, "Yêu cầu có ít nhất 2 đáp án lựa chọn."));
        return;
      }

      $(this).closest("[data-question-answer-row]").remove();
    });
    modal.find("[data-question-save]").on("click", function () {
      if (!validateQuestionEditor(form)) {
        return;
      }

      const values = getEditorValues(form);
      values.answers = normalizeAnswers(values.answers);

      if (editingQuestionId) {
        const target = getQuestion(editingQuestionId);
        Object.assign(target, values);
        showToast("success", t("questions.listPage.questionUpdatedTitle", null, "Đã cập nhật câu hỏi"), t("questions.listPage.questionUpdatedMessage", null, "Câu hỏi đã được cập nhật thành công."));
      } else {
        state.questions.unshift({
          id: getNextQuestionId(),
          ...values
        });
        state.page = 1;
        showToast("success", t("questions.listPage.questionCreatedTitle", null, "Đã tạo câu hỏi"), t("questions.listPage.questionCreatedMessage", null, "Câu hỏi đã được thêm thành công."));
      }

      Lms.ui.closeModal();
      renderCategoryOptions();
      applyFilters();
    });

    Lms.ui.showModal(modal);
  }

  function showQuestionDetail(questionId) {
    const question = getQuestion(questionId);

    if (!question || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const answers = question.answers.map(function (answer) {
      return (
        '<div class="question-answer-row">' +
          '<span class="app-badge ' + (answer.isCorrect ? "app-badge-success" : "app-badge-muted") + '">' + (answer.isCorrect ? escapeHtml(t("questions.listPage.badgeCorrect", null, "Đúng")) : escapeHtml(t("questions.listPage.badgeOption", null, "Lựa chọn"))) + "</span>" +
          "<span>" + escapeHtml(answer.content) + "</span>" +
        "</div>"
      );
    }).join("");

    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          "<div>" +
            '<h2 class="app-modal-title">' + escapeHtml(t("questions.listPage.detailTitle", null, "Chi tiết câu hỏi")) + "</h2>" +
            '<p class="app-card-subtitle">' + escapeHtml(question.category) + " / " + escapeHtml(translateDifficulty(question.difficulty)) + " / " + escapeHtml(translateType(question.questionType)) + "</p>" +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("questions.listPage.close", null, "Đóng")) + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="question-detail-content">' + escapeHtml(question.content) + "</p>" +
          '<div class="question-answer-list">' + answers + "</div>" +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-primary" type="button" data-modal-close>' + escapeHtml(t("questions.listPage.doneButton", null, "Hoàn tất")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    Lms.ui.showModal(modal);
  }

  function showDeleteConfirm(questionId) {
    const question = getQuestion(questionId);

    if (!question || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title">' + escapeHtml(t("questions.listPage.deleteQuestionTitle", null, "Xóa câu hỏi")) + "</h2>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("questions.listPage.close", null, "Đóng")) + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0">' + escapeHtml(t("questions.listPage.deleteConfirmMessage", null, "Bạn có chắc chắn muốn xóa câu hỏi này khỏi bộ nhớ mô phỏng?")) + "</p>" +
          '<p class="page-muted u-mt-4 u-mb-0"></p>' +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("questions.listPage.cancel", null, "Hủy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-question-confirm-delete>' + escapeHtml(t("common.delete", null, "Xóa")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find(".page-muted").text(question.content);
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-question-confirm-delete]").on("click", function () {
      state.questions = state.questions.filter(function (item) {
        return item.id !== question.id;
      });
      Lms.ui.closeModal();
      renderCategoryOptions();
      applyFilters();
      showToast("success", t("questions.listPage.questionDeletedTitle", null, "Đã xóa câu hỏi"), t("questions.listPage.questionDeletedMessage", null, "Câu hỏi đã được xóa thành công khỏi bộ nhớ."));
    });

    Lms.ui.showModal(modal);
  }

  function bindEvents() {
    $("[data-question-filter='search']").on("input", function () {
      state.search = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-question-filter='category']").on("change", function () {
      state.category = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-question-filter='difficulty']").on("change", function () {
      state.difficulty = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-question-filter='type']").on("change", function () {
      state.type = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-question-action='clear-filters']").on("click", function () {
      state.search = "";
      state.category = "";
      state.difficulty = "";
      state.type = "";
      $("[data-question-filter='search']").val("");
      $("[data-question-filter='category']").val("");
      $("[data-question-filter='difficulty']").val("");
      $("[data-question-filter='type']").val("");
      state.page = 1;
      applyFilters();
    });

    $(document).on("click", "[data-question-page='prev']", function () {
      if (state.page > 1) {
        state.page -= 1;
        render();
      }
    });

    $(document).on("click", "[data-question-page='next']", function () {
      if (state.page < getPageCount()) {
        state.page += 1;
        render();
      }
    });

    $(document).on("click", "[data-question-page-number]", function () {
      state.page = Number($(this).data("question-page-number"));
      render();
    });

    $(document).on("click", "[data-question-action='view']", function () {
      showQuestionDetail($(this).data("question-id"));
    });

    $(document).on("click", "[data-question-action='delete']", function () {
      showDeleteConfirm($(this).data("question-id"));
    });

    $(document).on("click", "[data-question-action='create']", function () {
      showQuestionEditor();
    });

    $(document).on("click", "[data-question-action='edit']", function () {
      showQuestionEditor($(this).data("question-id"));
    });

    $(document).on("click", "[data-question-action='import']", function () {
      showToast("info", t("questions.listPage.importTitle", null, "Nhập dữ liệu câu hỏi"), t("questions.listPage.importMessage", null, "Chức năng nhập câu hỏi sẽ được kết nối ở một task sau."));
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadPageData() {
    renderPageTitle();
    Lms.apiClient.get("questions.json").done(function (response) {
      state.questions = getItems(response).map(function (question) {
        return { ...question };
      });
      state.filteredQuestions = state.questions.slice();
      state.loaded = true;
      renderCategoryOptions();
      render();
    }).fail(function () {
      $("#questionTableRows").html(
        '<tr><td colspan="7">' +
          '<div class="app-empty-state">' +
            '<div class="app-empty-icon" aria-hidden="true">!</div>' +
            '<h3 class="app-empty-title">' + escapeHtml(t("questions.listPage.loadErrorTitle", null, "Không thể tải câu hỏi")) + "</h3>" +
            '<p class="app-empty-copy">' + escapeHtml(t("questions.listPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/questions.json.")) + "</p>" +
          "</div>" +
        "</td></tr>"
      );
      showToast("error", t("questions.listPage.dataErrorTitle", null, "Lỗi dữ liệu câu hỏi"), t("questions.listPage.dataErrorMessage", null, "Không thể tải dữ liệu mô phỏng câu hỏi."));
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
