(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    materials: [],
    filteredMaterials: [],
    courses: [],
    page: 1,
    pageSize: 8,
    search: "",
    courseId: "",
    type: "",
    status: ""
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

  function getBadgeClass(status) {
    return status === "Published" ? "app-badge-success" : "app-badge-muted";
  }

  function getTypeBadgeClass(type) {
    if (type === "Pdf") {
      return "app-badge-danger";
    }

    if (type === "File") {
      return "app-badge-warning";
    }

    if (type === "Link") {
      return "app-badge-info";
    }

    return "app-badge-success";
  }

  function translateType(type) {
    return t("materials.adminListPage.types." + type, null, type);
  }

  function translateStatus(status) {
    return t("materials.adminListPage.statuses." + status, null, status);
  }

  function getTypeIcon(type) {
    if (type === "Pdf") return "bi-filetype-pdf";
    if (type === "File") return "bi-paperclip";
    if (type === "Link") return "bi-link-45deg";
    return "bi-fonts";
  }

  function renderPageTitle() {
    document.title = t("materials.adminListPage.title", null, "Tài liệu học tập") + " - " + t("common.appName", null, "lms");
  }

  function getCourse(courseId) {
    return state.courses.find(function (course) {
      return course.id === Number(courseId);
    });
  }

  function findMaterial(materialId) {
    return state.materials.find(function (material) {
      return material.id === Number(materialId);
    });
  }

  function getNextMaterialId() {
    return state.materials.reduce(function (maxId, material) {
      return Math.max(maxId, Number(material.id) || 0);
    }, 0) + 1;
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredMaterials.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredMaterials.slice(start, start + state.pageSize);
  }

  function renderCourseOptions() {
    const $filter = $("[data-material-filter='course']");
    const currentValue = $filter.val() || "";

    $filter.find("option:not(:first)").remove();
    state.courses.forEach(function (course) {
      $filter.append('<option value="' + course.id + '">' + escapeHtml(course.name) + "</option>");
    });
    $filter.val(currentValue);
  }

  function renderMetrics() {
    const published = state.materials.filter(function (material) {
      return material.status === "Published";
    }).length;
    const duration = state.materials.reduce(function (total, material) {
      return total + Number(material.durationMinutes || 0);
    }, 0);
    const types = new Set(state.materials.map(function (material) {
      return material.contentType;
    })).size;

    $("[data-material-metric='total']").text(state.materials.length);
    $("[data-material-metric='published']").text(published);
    $("[data-material-metric='duration']").text(duration + " " + t("materials.adminListPage.minutesUnit", null, "m"));
    $("[data-material-metric='types']").text(types);
  }

  function renderRows() {
    const $rows = $("#materialTableRows").empty();
    const rows = getCurrentPageRows();

    if (!rows.length) {
      $rows.append(
        "<tr>" +
          '<td colspan="6">' +
            '<div class="app-empty-state">' +
              '<div class="image-slot image-slot-md image-slot-material u-mb-4" data-image-label="Empty materials illustration 320x180"><img src="/images/placeholders/material-placeholder.svg" alt="" aria-hidden="true" /></div>' +
              '<h3 class="app-empty-title">' + escapeHtml(t("materials.adminListPage.noMaterialsTitle", null, "Không tìm thấy tài liệu")) + "</h3>" +
              '<p class="app-empty-copy">' + escapeHtml(t("materials.adminListPage.noMaterialsCopy", null, "Thử từ khóa, khóa học, thể loại hoặc bộ lọc trạng thái khác.")) + "</p>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
      return;
    }

    rows.forEach(function (material) {
      const course = getCourse(material.courseId);
      const courseName = course ? course.name : t("materials.adminListPage.unassignedCourse", null, "Khóa học chưa được gán");

      $rows.append(
        "<tr>" +
          "<td>" +
            '<div class="admin-user-cell">' +
              '<span class="app-avatar admin-type-avatar" aria-hidden="true"><i class="bi ' + getTypeIcon(material.contentType) + '"></i></span>' +
              "<div>" +
                "<strong>" + escapeHtml(material.title) + "</strong>" +
                "<span>" + escapeHtml(t("materials.adminListPage.materialId", { id: material.id }, "Mã tài liệu #" + material.id)) + "</span>" +
              "</div>" +
            "</div>" +
          "</td>" +
          "<td>" + escapeHtml(courseName) + "</td>" +
          '<td><span class="app-badge ' + getTypeBadgeClass(material.contentType) + '">' + escapeHtml(translateType(material.contentType)) + "</span></td>" +
          "<td>" + escapeHtml(t("materials.adminListPage.durationMinutesValue", { minutes: material.durationMinutes }, material.durationMinutes + " phút")) + "</td>" +
          '<td><span class="app-badge ' + getBadgeClass(material.status) + '">' + escapeHtml(translateStatus(material.status)) + "</span></td>" +
          '<td class="u-text-right">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-material-action="edit" data-material-id="' + material.id + '">' + escapeHtml(t("common.edit", null, "Sửa")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-material-action="delete" data-material-id="' + material.id + '">' + escapeHtml(t("common.delete", null, "Xóa")) + "</button>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
    });
  }

  function renderPagination() {
    const pageCount = getPageCount();
    const $pages = $("#materialPaginationPages").empty();
    const startRecord = state.filteredMaterials.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const endRecord = Math.min(state.page * state.pageSize, state.filteredMaterials.length);

    $("[data-material-result-count]").text(t("materials.adminListPage.records", { count: state.filteredMaterials.length }, state.filteredMaterials.length + " bản ghi"));
    $("[data-material-page-info]").text(
      t(
        "materials.adminListPage.showing",
        { start: startRecord, end: endRecord, total: state.filteredMaterials.length },
        "Hiển thị " + startRecord + "-" + endRecord + " trên " + state.filteredMaterials.length + " tài liệu"
      )
    );
    $("[data-material-page='prev']").prop("disabled", state.page <= 1);
    $("[data-material-page='next']").prop("disabled", state.page >= pageCount);

    for (let page = 1; page <= pageCount; page += 1) {
      const $button = $('<button class="admin-pagination-page" type="button"></button>');
      $button.text(page);
      $button.attr("data-material-page-number", page);
      $button.toggleClass("active", page === state.page);
      $pages.append($button);
    }
  }

  function render() {
    renderPageTitle();
    renderMetrics();
    renderRows();
    renderPagination();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredMaterials = state.materials.filter(function (material) {
      const matchesKeyword = !keyword || material.title.toLowerCase().includes(keyword);
      const matchesCourse = !state.courseId || material.courseId === Number(state.courseId);
      const matchesType = !state.type || material.contentType === state.type;
      const matchesStatus = !state.status || material.status === state.status;

      return matchesKeyword && matchesCourse && matchesType && matchesStatus;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function getFormValues(form) {
    const $form = $(form);

    return {
      title: $form.find("[name='title']").val().trim(),
      courseId: Number($form.find("[name='courseId']").val()),
      contentType: $form.find("[name='contentType']").val(),
      durationMinutes: Number($form.find("[name='durationMinutes']").val()),
      status: $form.find("[name='status']").val()
    };
  }

  function setFieldError(form, fieldName, message) {
    const $field = $(form).find("[name='" + fieldName + "']");
    const $error = $(form).find("[data-material-error='" + fieldName + "']");

    $field.toggleClass("is-invalid", Boolean(message));
    $error.text(message || "");
  }

  function clearFormErrors(form) {
    $(form).find(".is-invalid").removeClass("is-invalid");
    $(form).find("[data-material-error]").text("");
  }

  function validateMaterialForm(form) {
    const values = getFormValues(form);
    let valid = true;

    clearFormErrors(form);

    if (!values.title || values.title.length < 3) {
      setFieldError(form, "title", t("materials.adminListPage.titleMin", null, "Tiêu đề phải có ít nhất 3 ký tự."));
      valid = false;
    }

    if (!values.courseId) {
      setFieldError(form, "courseId", t("materials.adminListPage.selectCourseWarning", null, "Vui lòng chọn khóa học."));
      valid = false;
    }

    if (!values.contentType) {
      setFieldError(form, "contentType", t("materials.adminListPage.selectTypeWarning", null, "Vui lòng chọn thể loại tài liệu."));
      valid = false;
    }

    if (!Number.isInteger(values.durationMinutes) || values.durationMinutes < 1) {
      setFieldError(form, "durationMinutes", t("materials.adminListPage.durationWarning", null, "Thời lượng phải tối thiểu là 1 phút."));
      valid = false;
    }

    if (!values.status) {
      setFieldError(form, "status", t("materials.adminListPage.selectStatusWarning", null, "Vui lòng chọn trạng thái."));
      valid = false;
    }

    return valid;
  }

  function buildCourseSelectOptions(selectedCourseId) {
    return state.courses.map(function (course) {
      const selected = course.id === Number(selectedCourseId) ? " selected" : "";
      return '<option value="' + course.id + '"' + selected + ">" + escapeHtml(course.name) + "</option>";
    }).join("");
  }

  function buildMaterialForm(material) {
    const isEdit = Boolean(material);
    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          "<div>" +
            '<h2 class="app-modal-title">' + escapeHtml(isEdit ? t("materials.adminListPage.editMaterial", null, "Sửa tài liệu") : t("materials.adminListPage.createMaterialModal", null, "Tạo tài liệu")) + "</h2>" +
            '<p class="app-card-subtitle">' + escapeHtml(isEdit ? t("materials.adminListPage.editSubtitle", null, "Cập nhật thông tin tài liệu học tập mô phỏng.") : t("materials.adminListPage.createSubtitle", null, "Thêm tài liệu học tập mô phỏng mới trong bộ nhớ.")) + "</p>" +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("materials.adminListPage.close", null, "Đóng")) + "</button>" +
        "</div>" +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.formTitle", null, "Tiêu đề")) +
            '<input class="app-input" name="title" type="text" autocomplete="off" />' +
            '<span class="auth-error" data-material-error="title"></span>' +
          "</label>" +
          '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.formCourse", null, "Khóa học")) +
            '<select class="app-select" name="courseId">' +
              '<option value="">' + escapeHtml(t("materials.adminListPage.selectCoursePlaceholder", null, "Chọn khóa học")) + "</option>" +
              buildCourseSelectOptions(material ? material.courseId : "") +
            "</select>" +
            '<span class="auth-error" data-material-error="courseId"></span>' +
          "</label>" +
          '<div class="admin-user-form-grid">' +
            '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.formType", null, "Thể loại")) +
              '<select class="app-select" name="contentType">' +
                '<option value="">' + escapeHtml(t("materials.adminListPage.selectTypePlaceholder", null, "Chọn thể loại")) + "</option>" +
                '<option value="Text">' + escapeHtml(t("materials.adminListPage.typeOptionText", null, "Văn bản")) + "</option>" +
                '<option value="Pdf">' + escapeHtml(t("materials.adminListPage.typeOptionPdf", null, "PDF")) + "</option>" +
                '<option value="File">' + escapeHtml(t("materials.adminListPage.typeOptionFile", null, "Tệp")) + "</option>" +
                '<option value="Link">' + escapeHtml(t("materials.adminListPage.typeOptionLink", null, "Liên kết")) + "</option>" +
              "</select>" +
              '<span class="auth-error" data-material-error="contentType"></span>' +
            "</label>" +
            '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.formDuration", null, "Thời lượng (phút)")) +
              '<input class="app-input" name="durationMinutes" type="number" min="1" step="1" />' +
              '<span class="auth-error" data-material-error="durationMinutes"></span>' +
            "</label>" +
          "</div>" +
          '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.formStatus", null, "Trạng thái")) +
            '<select class="app-select" name="status">' +
              '<option value="">' + escapeHtml(t("materials.adminListPage.selectStatusPlaceholder", null, "Chọn trạng thái")) + "</option>" +
              '<option value="Published">' + escapeHtml(t("materials.adminListPage.published", null, "Đã xuất bản")) + "</option>" +
              '<option value="Draft">' + escapeHtml(t("materials.adminListPage.draft", null, "Bản nháp")) + "</option>" +
            "</select>" +
            '<span class="auth-error" data-material-error="status"></span>' +
          "</label>" +
        "</form>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("materials.adminListPage.cancel", null, "Hủy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-material-save>' + escapeHtml(isEdit ? t("materials.adminListPage.saveChanges", null, "Lưu thay đổi") : t("materials.adminListPage.createMaterial", null, "Tạo tài liệu")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("[name='title']").val(material ? material.title : "");
    modal.find("[name='contentType']").val(material ? material.contentType : "Text");
    modal.find("[name='durationMinutes']").val(material ? material.durationMinutes : 10);
    modal.find("[name='status']").val(material ? material.status : "Draft");

    return modal;
  }

  function showMaterialForm(materialId) {
    const editingMaterialId = materialId ? Number(materialId) : null;
    const material = editingMaterialId ? findMaterial(editingMaterialId) : null;

    if (editingMaterialId && !material) {
      showToast("error", t("materials.adminListPage.materialNotFoundTitle", null, "Không tìm thấy tài liệu"), t("materials.adminListPage.materialNotFoundMessage", null, "Không tìm thấy tài liệu học tập được chọn."));
      return;
    }

    const modal = buildMaterialForm(material);
    const form = modal.find("form")[0];

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-material-save]").on("click", function () {
      if (!validateMaterialForm(form)) {
        return;
      }

      const values = getFormValues(form);

      if (editingMaterialId) {
        const target = findMaterial(editingMaterialId);
        Object.assign(target, values);
        showToast("success", t("materials.adminListPage.materialUpdatedTitle", null, "Đã cập nhật tài liệu"), t("materials.adminListPage.materialUpdatedMessage", { title: target.title }, target.title + " đã được cập nhật."));
      } else {
        const newMaterial = {
          id: getNextMaterialId(),
          ...values
        };
        state.materials.unshift(newMaterial);
        state.page = 1;
        showToast("success", t("materials.adminListPage.materialCreatedTitle", null, "Đã tạo tài liệu"), t("materials.adminListPage.materialCreatedMessage", { title: newMaterial.title }, newMaterial.title + " đã được thêm."));
      }

      Lms.ui.closeModal();
      applyFilters();
    });

    Lms.ui.showModal(modal);
  }

  function showDeleteConfirm(materialId) {
    const material = findMaterial(materialId);

    if (!material) {
      showToast("error", t("materials.adminListPage.materialNotFoundTitle", null, "Không tìm thấy tài liệu"), t("materials.adminListPage.materialNotFoundMessage", null, "Không tìm thấy tài liệu học tập được chọn."));
      return;
    }

    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title">' + escapeHtml(t("materials.adminListPage.deleteMaterialTitle", null, "Xóa tài liệu")) + "</h2>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("materials.adminListPage.close", null, "Đóng")) + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0">' + escapeHtml(t("materials.adminListPage.deleteConfirmPrefix", null, "Xóa ")) + "<strong></strong>" + escapeHtml(t("materials.adminListPage.deleteConfirmSuffix", null, "? Thao tác mô phỏng này chỉ xóa khỏi bộ nhớ.")) + "</p>" +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("materials.adminListPage.cancel", null, "Hủy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-material-confirm-delete>' + escapeHtml(t("materials.adminListPage.delete", null, "Xóa")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("strong").text(material.title);
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-material-confirm-delete]").on("click", function () {
      state.materials = state.materials.filter(function (item) {
        return item.id !== material.id;
      });
      Lms.ui.closeModal();
      applyFilters();
      showToast("success", t("materials.adminListPage.materialDeletedTitle", null, "Đã xóa tài liệu"), t("materials.adminListPage.materialDeletedMessage", { title: material.title }, material.title + " đã được xóa khỏi danh sách."));
    });

    Lms.ui.showModal(modal);
  }

  function bindEvents() {
    $("[data-material-filter='search']").on("input", function () {
      state.search = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-material-filter='course']").on("change", function () {
      state.courseId = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-material-filter='type']").on("change", function () {
      state.type = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-material-filter='status']").on("change", function () {
      state.status = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-material-action='clear-filters']").on("click", function () {
      state.search = "";
      state.courseId = "";
      state.type = "";
      state.status = "";
      $("[data-material-filter='search']").val("");
      $("[data-material-filter='course']").val("");
      $("[data-material-filter='type']").val("");
      $("[data-material-filter='status']").val("");
      state.page = 1;
      applyFilters();
    });

    $(document).on("click", "[data-material-page='prev']", function () {
      if (state.page > 1) {
        state.page -= 1;
        render();
      }
    });

    $(document).on("click", "[data-material-page='next']", function () {
      if (state.page < getPageCount()) {
        state.page += 1;
        render();
      }
    });

    $(document).on("click", "[data-material-page-number]", function () {
      state.page = Number($(this).data("material-page-number"));
      render();
    });

    $(document).on("click", "[data-material-action='create']", function () {
      showMaterialForm();
    });

    $(document).on("click", "[data-material-action='edit']", function () {
      showMaterialForm($(this).data("material-id"));
    });

    $(document).on("click", "[data-material-action='delete']", function () {
      showDeleteConfirm($(this).data("material-id"));
    });

    $(document).on("click", "[data-material-action='export']", function () {
      showToast("info", t("materials.adminListPage.exportTitle", null, "Xuất tài liệu"), t("materials.adminListPage.exportMessage", null, "Chức năng xuất sẽ được nối ở task báo cáo/xuất dữ liệu."));
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadPageData() {
    $.when(
      Lms.apiClient.get("learning-materials.json"),
      Lms.apiClient.get("courses.json")
    ).done(function (materialsResponse, coursesResponse) {
      state.materials = getItems(materialsResponse).map(function (material) {
        return { ...material };
      });
      state.courses = getItems(coursesResponse);
      state.filteredMaterials = state.materials.slice();
      renderCourseOptions();
      render();
    }).fail(function () {
      $("#materialTableRows").html(
        '<tr><td colspan="6">' +
          '<div class="app-empty-state">' +
            '<div class="app-empty-icon" aria-hidden="true">!</div>' +
            '<h3 class="app-empty-title">' + escapeHtml(t("materials.adminListPage.loadErrorTitle", null, "Không thể tải tài liệu")) + "</h3>" +
            '<p class="app-empty-copy">' + escapeHtml(t("materials.adminListPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/learning-materials.json.")) + "</p>" +
          "</div>" +
        "</td></tr>"
      );
      showToast("error", t("materials.adminListPage.dataErrorTitle", null, "Lỗi dữ liệu tài liệu"), t("materials.adminListPage.dataErrorMessage", null, "Không thể tải dữ liệu mô phỏng tài liệu học tập."));
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
