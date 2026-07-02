(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    questions: [],
    categories: [],
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

  function getCategory(categoryId) {
    return state.categories.find(function (category) {
      return category.id === Number(categoryId);
    });
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
    const $select = $("[data-question-filter='category']");
    const currentValue = $select.val() || "";

    $select.find("option:not(:first)").remove();
    state.categories.forEach(function (category) {
      $select.append('<option value="' + category.id + '">' + escapeHtml(category.name) + "</option>");
    });
    $select.val(currentValue);
  }

  function renderMetrics() {
    const score = state.questions.reduce(function (total, question) {
      return total + Number(question.score || 0);
    }, 0);
    const answers = state.questions.reduce(function (total, question) {
      return total + Number(question.answerCount || 0);
    }, 0);

    $("[data-question-metric='total']").text(state.questions.length);
    $("[data-question-metric='categories']").text(state.categories.length);
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
      $rows.append(
        "<tr>" +
          "<td>" +
            '<div class="admin-question-cell">' +
              "<strong>" + escapeHtml(question.content) + "</strong>" +
              "<span>" + escapeHtml(t("questions.listPage.questionId", { id: question.id }, "Mã câu hỏi #" + question.id)) + "</span>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge app-badge-info">' + escapeHtml(question.categoryName || "--") + "</span></td>" +
          '<td><span class="app-badge ' + getDifficultyBadgeClass(question.difficulty) + '">' + escapeHtml(translateDifficulty(question.difficulty)) + "</span></td>" +
          "<td>" + escapeHtml(translateType(question.questionType)) + "</td>" +
          "<td>" + escapeHtml(question.score) + "</td>" +
          "<td>" + escapeHtml(question.answerCount + " lựa chọn") + "</td>" +
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
      const matchesKeyword = !keyword || String(question.content || "").toLowerCase().includes(keyword);
      const matchesCategory = !state.category || String(question.categoryId) === String(state.category);
      const matchesDifficulty = !state.difficulty || question.difficulty === state.difficulty;
      const matchesType = !state.type || question.questionType === state.type;

      return matchesKeyword && matchesCategory && matchesDifficulty && matchesType;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function addAnswerRow(container, answer, questionType) {
    const answerValue = answer || { id: 0, content: "", isCorrect: false, order: 1 };
    const inputType = questionType === "SingleChoice" ? "radio" : "checkbox";
    const nameAttribute = questionType === "SingleChoice" ? ' name="questionCorrectAnswer"' : "";
    const row = $(
      '<div class="question-editor-answer-row" data-question-answer-row>' +
        '<label class="question-editor-correct">' +
          '<input type="' + inputType + '"' + nameAttribute + ' data-question-answer-correct />' +
          "<span>Đúng</span>" +
        "</label>" +
        '<input class="app-input" type="text" data-question-answer-content placeholder="Nội dung đáp án" />' +
        '<button class="app-button app-button-secondary" type="button" data-question-answer-remove>Xóa</button>' +
        '<span class="auth-error" data-question-answer-error></span>' +
      "</div>"
    );

    row.attr("data-answer-id", answerValue.id);
    row.attr("data-answer-order", answerValue.order || 1);
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

  function getEditorValues(form, isEdit) {
    const $form = $(form);
    const answers = [];

    $form.find("[data-question-answer-row]").each(function (index) {
      answers.push({
        id: Number($(this).attr("data-answer-id")) || 0,
        content: $(this).find("[data-question-answer-content]").val().trim(),
        isCorrect: $(this).find("[data-question-answer-correct]").prop("checked"),
        order: index + 1
      });
    });

    return {
      categoryId: Number($form.find("[name='categoryId']").val()),
      difficulty: $form.find("[name='difficulty']").val(),
      questionType: $form.find("[name='questionType']").val(),
      content: $form.find("[name='content']").val().trim(),
      score: Number($form.find("[name='score']").val()),
      order: Number($form.find("[name='order']").val() || 1),
      answerOptions: answers,
      isEdit: isEdit
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

  function validateQuestionEditor(form, isEdit) {
    const values = getEditorValues(form, isEdit);
    let valid = true;

    clearEditorErrors(form);

    if (!values.content || values.content.length < 10) {
      setEditorError(form, "content", "Nội dung câu hỏi phải có ít nhất 10 ký tự.");
      valid = false;
    }

    if (!values.categoryId) {
      setEditorError(form, "categoryId", "Vui lòng chọn danh mục câu hỏi.");
      valid = false;
    }

    if (!values.difficulty) {
      setEditorError(form, "difficulty", "Vui lòng chọn độ khó.");
      valid = false;
    }

    if (!isEdit && !values.questionType) {
      setEditorError(form, "questionType", "Vui lòng chọn thể loại câu hỏi.");
      valid = false;
    }

    if (!Number(values.score) || Number(values.score) <= 0) {
      setEditorError(form, "score", "Điểm số phải lớn hơn 0.");
      valid = false;
    }

    if (values.answerOptions.length < 2) {
      $(form).find("[data-question-error='answers']").text("Yêu cầu có ít nhất 2 đáp án lựa chọn.");
      valid = false;
    }

    values.answerOptions.forEach(function (answer, index) {
      if (!answer.content) {
        $(form).find("[data-question-answer-row]").eq(index).find("[data-question-answer-error]").text("Nội dung đáp án không được để trống.");
        valid = false;
      }
    });

    const correctCount = values.answerOptions.filter(function (answer) {
      return answer.isCorrect;
    }).length;

    if (values.questionType === "SingleChoice" && correctCount !== 1) {
      $(form).find("[data-question-error='answers']").text("Câu hỏi một lựa chọn phải có đúng 1 đáp án đúng.");
      valid = false;
    }

    if (values.questionType === "MultipleChoice" && correctCount < 1) {
      $(form).find("[data-question-error='answers']").text("Câu hỏi nhiều lựa chọn phải có ít nhất 1 đáp án đúng.");
      valid = false;
    }

    return valid;
  }

  function buildQuestionEditor(question) {
    const isEdit = Boolean(question);
    const modal = $([
      "<div>",
      '<div class="app-modal-header">',
      "<div>",
      '<h2 class="app-modal-title">' + escapeHtml(isEdit ? "Sửa câu hỏi" : "Tạo câu hỏi") + "</h2>",
      '<p class="app-card-subtitle">' + escapeHtml(isEdit ? "Cập nhật dữ liệu câu hỏi từ backend." : "Thêm câu hỏi mới vào hệ thống.") + "</p>",
      "</div>",
      '<button class="app-button app-button-secondary" type="button" data-modal-close>Đóng</button>',
      "</div>",
      '<form class="app-modal-body admin-user-form question-editor-form" novalidate>',
      '<label class="auth-field">Nội dung câu hỏi',
      '<textarea class="app-input admin-course-textarea" name="content" rows="3"></textarea>',
      '<span class="auth-error" data-question-error="content"></span>',
      "</label>",
      '<div class="admin-user-form-grid">',
      '<label class="auth-field">Danh mục',
      '<select class="app-select" name="categoryId"></select>',
      '<span class="auth-error" data-question-error="categoryId"></span>',
      "</label>",
      '<label class="auth-field">Độ khó',
      '<select class="app-select" name="difficulty">',
      '<option value="">Chọn độ khó</option>',
      '<option value="Easy">Dễ</option>',
      '<option value="Medium">Trung bình</option>',
      '<option value="Hard">Khó</option>',
      "</select>",
      '<span class="auth-error" data-question-error="difficulty"></span>',
      "</label>",
      "</div>",
      '<div class="admin-user-form-grid">',
      '<label class="auth-field">Thể loại câu hỏi',
      '<select class="app-select" name="questionType"' + (isEdit ? ' disabled="disabled"' : "") + ">",
      '<option value="">Chọn thể loại</option>',
      '<option value="SingleChoice">Một lựa chọn</option>',
      '<option value="MultipleChoice">Nhiều lựa chọn</option>',
      "</select>",
      '<span class="auth-error" data-question-error="questionType"></span>',
      "</label>",
      '<label class="auth-field">Điểm',
      '<input class="app-input" name="score" type="number" min="1" step="1" />',
      '<span class="auth-error" data-question-error="score"></span>',
      "</label>",
      "</div>",
      '<input type="hidden" name="order" value="1" />',
      '<div class="question-editor-answer-header">',
      "<div>",
      '<h3 class="app-card-title">Danh sách đáp án</h3>',
      '<p class="app-card-subtitle">Cấu hình các lựa chọn và đáp án đúng.</p>',
      "</div>",
      '<button class="app-button app-button-secondary" type="button" data-question-answer-add>Thêm đáp án</button>',
      "</div>",
      '<div class="question-editor-answer-list" data-question-answer-list></div>',
      '<span class="auth-error" data-question-error="answers"></span>',
      "</form>",
      '<div class="app-modal-footer">',
      '<button class="app-button app-button-secondary" type="button" data-modal-close>Hủy</button>',
      '<button class="app-button app-button-primary" type="button" data-question-save>' + escapeHtml(isEdit ? "Lưu thay đổi" : "Tạo câu hỏi") + "</button>",
      "</div>",
      "</div>"
    ].join(""));

    const $categorySelect = modal.find("[name='categoryId']");
    $categorySelect.append('<option value="">Chọn danh mục</option>');
    state.categories.forEach(function (category) {
      $categorySelect.append('<option value="' + category.id + '">' + escapeHtml(category.name) + "</option>");
    });

    modal.find("[name='content']").val(question ? question.content : "");
    modal.find("[name='categoryId']").val(question ? question.categoryId : "");
    modal.find("[name='difficulty']").val(question ? question.difficulty : "Easy");
    modal.find("[name='questionType']").val(question ? question.questionType : "SingleChoice");
    modal.find("[name='score']").val(question ? question.score : 1);
    modal.find("[name='order']").val(question ? question.order || 1 : 1);

    const answers = question && Array.isArray(question.answerOptions) && question.answerOptions.length
      ? question.answerOptions
      : [
        { id: 0, content: "", isCorrect: true, order: 1 },
        { id: 0, content: "", isCorrect: false, order: 2 }
      ];

    answers.forEach(function (answer) {
      addAnswerRow(modal.find("[data-question-answer-list]"), answer, modal.find("[name='questionType']").val());
    });

    return modal;
  }

  function normalizeRequest(values, isEdit) {
    const payload = {
      categoryId: values.categoryId,
      content: values.content,
      difficulty: values.difficulty,
      score: values.score,
      order: values.order,
      answerOptions: values.answerOptions.map(function (answer) {
        return {
          content: answer.content,
          isCorrect: answer.isCorrect,
          order: answer.order
        };
      })
    };

    if (!isEdit) {
      payload.questionType = values.questionType;
    }

    return payload;
  }

  function showQuestionEditor(questionId) {
    const editingQuestionId = questionId ? Number(questionId) : null;
    const loadRequest = editingQuestionId ? Lms.apiClient.get("api/questions/" + editingQuestionId) : $.Deferred().resolve({ data: null }).promise();

    loadRequest.done(function (response) {
      const question = editingQuestionId ? getData(response) : null;

      if (editingQuestionId && !question) {
        showToast("error", "Không tìm thấy câu hỏi", "Không tìm thấy câu hỏi đã chọn.");
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
          showToast("warning", "Yêu cầu đáp án", "Cần ít nhất 2 đáp án lựa chọn.");
          return;
        }

        $(this).closest("[data-question-answer-row]").remove();
      });
      modal.find("[data-question-save]").on("click", function () {
        const isEdit = Boolean(editingQuestionId);

        if (!validateQuestionEditor(form, isEdit)) {
          return;
        }

        const values = getEditorValues(form, isEdit);
        const request = normalizeRequest(values, isEdit);
        const apiRequest = isEdit
          ? Lms.apiClient.put("api/questions/" + editingQuestionId, request)
          : Lms.apiClient.post("api/questions", request);

        apiRequest.done(function () {
          Lms.ui.closeModal();
          loadPageData();
          showToast("success", isEdit ? "Đã cập nhật câu hỏi" : "Đã tạo câu hỏi", isEdit ? "Câu hỏi đã được cập nhật thành công." : "Câu hỏi đã được thêm thành công.");
        }).fail(function (error) {
          showToast("error", isEdit ? "Cập nhật thất bại" : "Tạo thất bại", error && error.message ? error.message : "Không thể lưu câu hỏi.");
        });
      });

      Lms.ui.showModal(modal);
    }).fail(function (error) {
      showToast("error", "Không thể tải câu hỏi", error && error.message ? error.message : "Vui lòng thử lại.");
    });
  }

  function showQuestionDetail(questionId) {
    Lms.apiClient.get("api/questions/" + questionId).done(function (response) {
      const question = getData(response);

      if (!question || !Lms.ui || !Lms.ui.showModal) {
        return;
      }

      const answers = (question.answerOptions || []).map(function (answer) {
        return (
          '<div class="question-answer-row">' +
            '<span class="app-badge ' + (answer.isCorrect ? "app-badge-success" : "app-badge-muted") + '">' + (answer.isCorrect ? "Đúng" : "Lựa chọn") + "</span>" +
            "<span>" + escapeHtml(answer.content) + "</span>" +
          "</div>"
        );
      }).join("");

      const modal = $(
        "<div>" +
          '<div class="app-modal-header">' +
            "<div>" +
              '<h2 class="app-modal-title">Chi tiết câu hỏi</h2>' +
              '<p class="app-card-subtitle">' + escapeHtml((question.categoryName || "--") + " / " + translateDifficulty(question.difficulty) + " / " + translateType(question.questionType)) + "</p>" +
            "</div>" +
            '<button class="app-button app-button-secondary" type="button" data-modal-close>Đóng</button>' +
          "</div>" +
          '<div class="app-modal-body">' +
            '<p class="question-detail-content">' + escapeHtml(question.content) + "</p>" +
            '<div class="question-answer-list">' + answers + "</div>" +
          "</div>" +
          '<div class="app-modal-footer">' +
            '<button class="app-button app-button-primary" type="button" data-modal-close>Hoàn tất</button>' +
          "</div>" +
        "</div>"
      );

      modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
      Lms.ui.showModal(modal);
    }).fail(function (error) {
      showToast("error", "Không thể tải chi tiết", error && error.message ? error.message : "Vui lòng thử lại.");
    });
  }

  function showDeleteConfirm(questionId) {
    const question = getQuestion(questionId);

    if (!question || !Lms.ui || !Lms.ui.showModal) {
      return;
    }

    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title">Xóa câu hỏi</h2>' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>Đóng</button>' +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0">Bạn có chắc chắn muốn xóa câu hỏi này?</p>' +
          '<p class="page-muted u-mt-4 u-mb-0">' + escapeHtml(question.content) + "</p>" +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>Hủy</button>' +
          '<button class="app-button app-button-primary" type="button" data-question-confirm-delete>Xóa</button>' +
        "</div>" +
      "</div>"
    );

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-question-confirm-delete]").on("click", function () {
      Lms.apiClient.delete("api/questions/" + question.id).done(function () {
        Lms.ui.closeModal();
        loadPageData();
        showToast("success", "Đã xóa câu hỏi", "Câu hỏi đã được xóa thành công.");
      }).fail(function (error) {
        showToast("error", "Xóa thất bại", error && error.message ? error.message : "Không thể xóa câu hỏi.");
      });
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
      showToast("info", "Nhập dữ liệu câu hỏi", "Chức năng import chưa được kết nối ở màn này.");
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadPageData() {
    renderPageTitle();
    $.when(
      Lms.apiClient.get("api/question-categories?page=1&pageSize=200"),
      Lms.apiClient.get("api/questions?page=1&pageSize=200")
    ).done(function (categoriesResponse, questionsResponse) {
      state.categories = getItems(categoriesResponse).map(function (item) {
        return {
          id: Number(item.id),
          name: item.name || ""
        };
      });
      state.questions = getItems(questionsResponse).map(function (question) {
        return {
          id: Number(question.id),
          categoryId: Number(question.categoryId),
          categoryName: question.categoryName || "",
          content: question.content || "",
          questionType: question.questionType || "SingleChoice",
          difficulty: question.difficulty || "Easy",
          score: Number(question.score || 0),
          answerCount: Number(question.answerCount || 0)
        };
      });
      state.filteredQuestions = state.questions.slice();
      state.loaded = true;
      renderCategoryOptions();
      render();
    }).fail(function (error) {
      $("#questionTableRows").html(
        '<tr><td colspan="7">' +
          '<div class="app-empty-state">' +
            '<div class="app-empty-icon" aria-hidden="true">!</div>' +
            '<h3 class="app-empty-title">Không thể tải câu hỏi</h3>' +
            '<p class="app-empty-copy">' + escapeHtml(error && error.message ? error.message : "Vui lòng kiểm tra API question bank.") + "</p>" +
          "</div>" +
        "</td></tr>"
      );
      showToast("error", "Lỗi dữ liệu câu hỏi", error && error.message ? error.message : "Không thể tải dữ liệu câu hỏi từ backend.");
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
