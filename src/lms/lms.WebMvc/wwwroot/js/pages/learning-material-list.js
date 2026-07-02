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
    fileMode: ""
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

  function renderPageTitle() {
    document.title = t("materials.adminListPage.title", null, "Tai lieu hoc tap") + " - " + t("common.appName", null, "lms");
  }

  function mapMaterial(item) {
    return {
      id: Number(item.id),
      courseId: Number(item.courseId),
      title: item.title || "",
      contentType: item.contentType || "Text",
      order: Number(item.order || 0),
      hasFile: Boolean(item.hasFile),
      textContent: item.textContent || "",
      externalLink: item.externalLink || ""
    };
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

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredMaterials.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredMaterials.slice(start, start + state.pageSize);
  }

  function renderCourseOptions() {
    const $filter = $("[data-material-filter='course']");
    const $formSelect = $("[name='courseId']");
    const currentValue = $filter.val() || "";

    $filter.find("option:not(:first)").remove();
    $formSelect.find("option:not(:first)").remove();

    state.courses.forEach(function (course) {
      const option = '<option value="' + course.id + '">' + escapeHtml(course.name) + "</option>";
      $filter.append(option);
      $formSelect.append(option);
    });

    $filter.val(currentValue);
  }

  function renderMetrics() {
    const fileBacked = state.materials.filter(function (material) {
      return material.hasFile;
    }).length;
    const textCount = state.materials.filter(function (material) {
      return material.contentType === "Text";
    }).length;
    const types = new Set(state.materials.map(function (material) {
      return material.contentType;
    })).size;

    $("[data-material-metric='total']").text(state.materials.length);
    $("[data-material-metric='published']").text(fileBacked);
    $("[data-material-metric='duration']").text(textCount);
    $("[data-material-metric='types']").text(types);
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
    if (type === "Image") {
      return "app-badge-info";
    }
    if (type === "Video") {
      return "app-badge-danger";
    }
    if (type === "Mixed") {
      return "app-badge-muted";
    }
    return "app-badge-success";
  }

  function getFileBadgeClass(hasFile) {
    return hasFile ? "app-badge-success" : "app-badge-muted";
  }

  function getTypeIcon(type) {
    if (type === "Pdf") return "bi-filetype-pdf";
    if (type === "File") return "bi-paperclip";
    if (type === "Link") return "bi-link-45deg";
    if (type === "Image") return "bi-image";
    if (type === "Video") return "bi-play-btn";
    if (type === "Mixed") return "bi-collection";
    return "bi-fonts";
  }

  function translateType(type) {
    return t("materials.adminListPage.types." + type, null, type);
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
              '<h3 class="app-empty-title">' + escapeHtml(t("materials.adminListPage.noMaterialsTitle", null, "Khong tim thay tai lieu")) + "</h3>" +
              '<p class="app-empty-copy">' + escapeHtml(t("materials.adminListPage.noMaterialsCopy", null, "Thu tu khoa, khoa hoc, loai hoac file dinh kem khac.")) + "</p>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );
      return;
    }

    rows.forEach(function (material) {
      const course = getCourse(material.courseId);
      const courseName = course ? course.name : t("materials.adminListPage.unassignedCourse", null, "Khoa hoc khong xac dinh");

      $rows.append(
        "<tr>" +
          "<td>" +
            '<div class="admin-user-cell">' +
              '<span class="app-avatar admin-type-avatar" aria-hidden="true"><i class="bi ' + getTypeIcon(material.contentType) + '"></i></span>' +
              "<div>" +
                "<strong>" + escapeHtml(material.title) + "</strong>" +
                "<span>" + escapeHtml(t("materials.adminListPage.materialId", { id: material.id }, "Ma tai lieu #" + material.id)) + "</span>" +
              "</div>" +
            "</div>" +
          "</td>" +
          "<td>" + escapeHtml(courseName) + "</td>" +
          '<td><span class="app-badge ' + getTypeBadgeClass(material.contentType) + '">' + escapeHtml(translateType(material.contentType)) + "</span></td>" +
          "<td>" + escapeHtml(t("materials.adminListPage.orderValue", { order: material.order }, "Thu tu " + material.order)) + "</td>" +
          '<td><span class="app-badge ' + getFileBadgeClass(material.hasFile) + '">' + escapeHtml(material.hasFile ? t("materials.adminListPage.hasFile", null, "Co file") : t("materials.adminListPage.noFile", null, "Khong co file")) + "</span></td>" +
          '<td class="u-text-right">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-material-action="blocks" data-material-id="' + material.id + '">' + escapeHtml(t("materials.adminListPage.contentBlocks", null, "Noi dung")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-material-action="edit" data-material-id="' + material.id + '">' + escapeHtml(t("common.edit", null, "Sua")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-material-action="delete" data-material-id="' + material.id + '">' + escapeHtml(t("common.delete", null, "Xoa")) + "</button>" +
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

    $("[data-material-result-count]").text(t("materials.adminListPage.records", { count: state.filteredMaterials.length }, state.filteredMaterials.length + " ban ghi"));
    $("[data-material-page-info]").text(
      t(
        "materials.adminListPage.showing",
        { start: startRecord, end: endRecord, total: state.filteredMaterials.length },
        "Hien thi " + startRecord + "-" + endRecord + " tren " + state.filteredMaterials.length + " tai lieu"
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
      const matchesFileMode = !state.fileMode
        || (state.fileMode === "has-file" && material.hasFile)
        || (state.fileMode === "no-file" && !material.hasFile);

      return matchesKeyword && matchesCourse && matchesType && matchesFileMode;
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
      textContent: $form.find("[name='textContent']").val().trim(),
      externalLink: $form.find("[name='externalLink']").val().trim(),
      order: Number($form.find("[name='order']").val())
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

  function updateTypeSpecificFields(form) {
    const type = $(form).find("[name='contentType']").val();
    const isText = type === "Text";
    const isLink = type === "Link";

    $(form).find("[data-material-field='textContent']").toggle(isText);
    $(form).find("[data-material-field='externalLink']").toggle(isLink);

    if (!isText) {
      $(form).find("[name='textContent']").removeClass("is-invalid");
    }
    if (!isLink) {
      $(form).find("[name='externalLink']").removeClass("is-invalid");
    }
  }

  function validateMaterialForm(form, isEdit) {
    const values = getFormValues(form);
    let valid = true;

    clearFormErrors(form);

    if (!values.title || values.title.length < 3) {
      setFieldError(form, "title", t("materials.adminListPage.titleMin", null, "Tieu de phai co it nhat 3 ky tu."));
      valid = false;
    }

    if (!isEdit && !values.courseId) {
      setFieldError(form, "courseId", t("materials.adminListPage.selectCourseWarning", null, "Vui long chon khoa hoc."));
      valid = false;
    }

    if (!values.contentType) {
      setFieldError(form, "contentType", t("materials.adminListPage.selectTypeWarning", null, "Vui long chon loai tai lieu."));
      valid = false;
    }

    if (!Number.isInteger(values.order) || values.order < 1) {
      setFieldError(form, "order", t("materials.adminListPage.orderWarning", null, "Thu tu phai la so nguyen lon hon hoac bang 1."));
      valid = false;
    }

    if (values.contentType === "Text" && !values.textContent) {
      setFieldError(form, "textContent", t("materials.adminListPage.textRequired", null, "Noi dung Text khong duoc de trong."));
      valid = false;
    }

    if (values.contentType === "Link" && !values.externalLink) {
      setFieldError(form, "externalLink", t("materials.adminListPage.linkRequired", null, "Lien ket ngoai khong duoc de trong."));
      valid = false;
    }

    return valid;
  }

  function buildMaterialForm(material) {
    const isEdit = Boolean(material);
    const disabledCourse = isEdit ? ' disabled="disabled"' : "";
    const disabledType = isEdit ? ' disabled="disabled"' : "";

    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          "<div>" +
            '<h2 class="app-modal-title">' + escapeHtml(isEdit ? t("materials.adminListPage.editMaterial", null, "Sua tai lieu") : t("materials.adminListPage.createMaterialModal", null, "Tao tai lieu")) + "</h2>" +
            '<p class="app-card-subtitle">' + escapeHtml(isEdit ? t("materials.adminListPage.editSubtitle", null, "Cap nhat noi dung va thu tu tai lieu.") : t("materials.adminListPage.createSubtitle", null, "Them tai lieu hoc tap moi vao backend.")) + "</p>" +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("materials.adminListPage.close", null, "Dong")) + "</button>" +
        "</div>" +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.formTitle", null, "Tieu de")) +
            '<input class="app-input" name="title" type="text" autocomplete="off" />' +
            '<span class="auth-error" data-material-error="title"></span>' +
          "</label>" +
          '<div class="admin-user-form-grid">' +
            '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.formCourse", null, "Khoa hoc")) +
              '<select class="app-select" name="courseId"' + disabledCourse + '>' +
                '<option value="">' + escapeHtml(t("materials.adminListPage.selectCoursePlaceholder", null, "Chon khoa hoc")) + "</option>" +
              "</select>" +
              '<span class="auth-error" data-material-error="courseId"></span>' +
            "</label>" +
            '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.formType", null, "Loai tai lieu")) +
              '<select class="app-select" name="contentType"' + disabledType + '>' +
                '<option value="">' + escapeHtml(t("materials.adminListPage.selectTypePlaceholder", null, "Chon loai")) + "</option>" +
                '<option value="Text">' + escapeHtml(t("materials.adminListPage.typeOptionText", null, "Van ban")) + "</option>" +
                '<option value="Pdf">' + escapeHtml(t("materials.adminListPage.typeOptionPdf", null, "PDF")) + "</option>" +
                '<option value="File">' + escapeHtml(t("materials.adminListPage.typeOptionFile", null, "Tep")) + "</option>" +
                '<option value="Link">' + escapeHtml(t("materials.adminListPage.typeOptionLink", null, "Lien ket")) + "</option>" +
                '<option value="Image">' + escapeHtml(t("materials.adminListPage.typeOptionImage", null, "Hinh anh")) + "</option>" +
                '<option value="Video">' + escapeHtml(t("materials.adminListPage.typeOptionVideo", null, "Video")) + "</option>" +
                '<option value="Mixed">' + escapeHtml(t("materials.adminListPage.typeOptionMixed", null, "Tong hop")) + "</option>" +
              "</select>" +
              '<span class="auth-error" data-material-error="contentType"></span>' +
            "</label>" +
          "</div>" +
          '<label class="auth-field" data-material-field="textContent">' + escapeHtml(t("materials.adminListPage.formTextContent", null, "Noi dung van ban")) +
            '<textarea class="app-input" name="textContent" rows="4"></textarea>' +
            '<span class="auth-error" data-material-error="textContent"></span>' +
          "</label>" +
          '<label class="auth-field" data-material-field="externalLink">' + escapeHtml(t("materials.adminListPage.formExternalLink", null, "Lien ket ngoai")) +
            '<input class="app-input" name="externalLink" type="url" autocomplete="off" />' +
            '<span class="auth-error" data-material-error="externalLink"></span>' +
          "</label>" +
          '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.formOrder", null, "Thu tu")) +
            '<input class="app-input" name="order" type="number" min="1" step="1" />' +
            '<span class="auth-error" data-material-error="order"></span>' +
          "</label>" +
        "</form>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("materials.adminListPage.cancel", null, "Huy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-material-save>' + escapeHtml(isEdit ? t("materials.adminListPage.saveChanges", null, "Luu thay doi") : t("materials.adminListPage.createMaterial", null, "Tao tai lieu")) + "</button>" +
        "</div>" +
      "</div>"
    );

    const $courseSelect = modal.find("[name='courseId']");
    state.courses.forEach(function (course) {
      $courseSelect.append('<option value="' + course.id + '">' + escapeHtml(course.name) + "</option>");
    });

    modal.find("[name='title']").val(material ? material.title : "");
    modal.find("[name='courseId']").val(material ? material.courseId : "");
    modal.find("[name='contentType']").val(material ? material.contentType : "Text");
    modal.find("[name='textContent']").val(material ? material.textContent : "");
    modal.find("[name='externalLink']").val(material ? material.externalLink : "");
    modal.find("[name='order']").val(material ? material.order : 1);

    updateTypeSpecificFields(modal.find("form")[0]);
    return modal;
  }

  function upsertMaterial(material) {
    const existing = findMaterial(material.id);
    if (existing) {
      Object.assign(existing, material);
      return existing;
    }
    state.materials.unshift(material);
    state.page = 1;
    return material;
  }

  function createMaterial(values) {
    return Lms.apiClient.post("api/learning-materials", {
      courseId: values.courseId,
      title: values.title,
      contentType: values.contentType,
      textContent: values.contentType === "Text" ? values.textContent : null,
      externalLink: values.contentType === "Link" ? values.externalLink : null,
      order: values.order
    });
  }

  function updateMaterial(materialId, values) {
    const target = findMaterial(materialId);
    const contentType = target ? target.contentType : values.contentType;

    return Lms.apiClient.put("api/learning-materials/" + materialId, {
      title: values.title,
      textContent: contentType === "Text" ? values.textContent : null,
      externalLink: contentType === "Link" ? values.externalLink : null,
      order: values.order
    });
  }

  function getMaterialForEdit(materialId) {
    return Lms.apiClient.get("api/learning-materials/" + materialId).then(function (response) {
      return mapMaterial(getResponseData(response));
    });
  }

  function loadMaterialDetail(materialId) {
    return Lms.apiClient.get("api/learning-materials/" + materialId).then(function (response) {
      return getResponseData(response);
    });
  }

  function getBlockTypeLabel(type) {
    const labels = {
      Text: t("materials.adminListPage.blockText", null, "Van ban"),
      Image: t("materials.adminListPage.blockImage", null, "Hinh anh"),
      Video: t("materials.adminListPage.blockVideo", null, "Video"),
      Pdf: t("materials.adminListPage.blockPdf", null, "PDF"),
      File: t("materials.adminListPage.blockFile", null, "Tep tai xuong"),
      Link: t("materials.adminListPage.blockLink", null, "Lien ket")
    };
    return labels[type] || type;
  }

  function renderBlockBuilder(modal, material) {
    const blocks = Array.isArray(material.blocks) ? material.blocks.slice().sort(function (a, b) {
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    }) : [];
    const $list = modal.find("[data-material-block-list]").empty();

    if (!blocks.length) {
      $list.html(
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true"><i class="bi bi-layers"></i></div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("materials.adminListPage.noBlocksTitle", null, "Chua co khoi noi dung")) + "</h3>" +
          '<p class="app-empty-copy">' + escapeHtml(t("materials.adminListPage.noBlocksCopy", null, "Them van ban, hinh anh, video, PDF, tep hoac lien ket cho tai lieu nay.")) + "</p>" +
        "</div>"
      );
      return;
    }

    blocks.forEach(function (block, index) {
      const title = block.caption || block.originalFileName || block.url || (block.textContent ? block.textContent.slice(0, 80) : getBlockTypeLabel(block.blockType));
      $list.append(
        '<div class="group-detail-item" data-material-block-id="' + block.id + '">' +
          '<div class="admin-user-cell">' +
            '<span class="app-avatar admin-type-avatar" aria-hidden="true"><i class="bi ' + getTypeIcon(block.blockType) + '"></i></span>' +
            "<div>" +
              "<strong>" + escapeHtml(getBlockTypeLabel(block.blockType)) + "</strong>" +
              "<span>" + escapeHtml(title || "") + "</span>" +
            "</div>" +
          "</div>" +
          '<div class="admin-row-actions">' +
            '<button class="app-button app-button-secondary" type="button" data-material-block-action="up" data-block-index="' + index + '"' + (index === 0 ? " disabled" : "") + '><i class="bi bi-arrow-up" aria-hidden="true"></i></button>' +
            '<button class="app-button app-button-secondary" type="button" data-material-block-action="down" data-block-index="' + index + '"' + (index === blocks.length - 1 ? " disabled" : "") + '><i class="bi bi-arrow-down" aria-hidden="true"></i></button>' +
            '<button class="app-button app-button-secondary" type="button" data-material-block-action="edit" data-block-id="' + block.id + '">' + escapeHtml(t("common.edit", null, "Sua")) + "</button>" +
            '<button class="app-button app-button-secondary" type="button" data-material-block-action="delete" data-block-id="' + block.id + '">' + escapeHtml(t("common.delete", null, "Xoa")) + "</button>" +
          "</div>" +
        "</div>"
      );
    });
  }

  function refreshBlockBuilder(modal, materialId) {
    return loadMaterialDetail(materialId).done(function (material) {
      modal.data("material-detail", material);
      renderBlockBuilder(modal, material);
      const mapped = mapMaterial(material);
      upsertMaterial(mapped);
      applyFilters();
    });
  }

  function updateBlockFormFields(modal) {
    const type = modal.find("[name='blockType']").val();
    modal.find("[data-material-block-field='text']").toggle(type === "Text");
    modal.find("[data-material-block-field='link']").toggle(type === "Link");
    modal.find("[data-material-block-field='file']").toggle(["Image", "Video", "Pdf", "File"].includes(type));
  }

  function submitBlockForm(modal) {
    const material = modal.data("material-detail");
    if (!material) {
      return;
    }

    const type = modal.find("[name='blockType']").val();
    const caption = modal.find("[name='caption']").val().trim();
    let request;

    if (type === "Text") {
      const textContent = modal.find("[name='blockText']").val().trim();
      if (!textContent) {
        showToast("warning", t("materials.adminListPage.blockTextRequiredTitle", null, "Nhap noi dung"), t("materials.adminListPage.blockTextRequiredMessage", null, "Khoi van ban can co noi dung."));
        return;
      }
      request = Lms.apiClient.post("api/learning-materials/" + material.id + "/blocks/text", {
        textContent: textContent,
        caption: caption || null
      });
    } else if (type === "Link") {
      const url = modal.find("[name='blockUrl']").val().trim();
      if (!url) {
        showToast("warning", t("materials.adminListPage.blockLinkRequiredTitle", null, "Nhap lien ket"), t("materials.adminListPage.blockLinkRequiredMessage", null, "Khoi lien ket can co URL."));
        return;
      }
      request = Lms.apiClient.post("api/learning-materials/" + material.id + "/blocks/link", {
        url: url,
        caption: caption || null
      });
    } else {
      const fileInput = modal.find("[name='blockFile']")[0];
      const file = fileInput && fileInput.files ? fileInput.files[0] : null;
      if (!file) {
        showToast("warning", t("materials.adminListPage.blockFileRequiredTitle", null, "Chon tep"), t("materials.adminListPage.blockFileRequiredMessage", null, "Vui long chon tep de upload."));
        return;
      }
      const formData = new FormData();
      formData.append("blockType", type);
      formData.append("caption", caption || "");
      formData.append("file", file);
      request = Lms.apiClient.post("api/learning-materials/" + material.id + "/blocks/file", formData, {
        contentType: false,
        processData: false
      });
    }

    request.done(function () {
      modal.find("[name='blockText'], [name='blockUrl'], [name='caption']").val("");
      modal.find("[name='blockFile']").val("");
      refreshBlockBuilder(modal, material.id);
      showToast("success", t("materials.adminListPage.blockAddedTitle", null, "Da them noi dung"), t("materials.adminListPage.blockAddedMessage", null, "Khoi noi dung da duoc them vao tai lieu."));
    }).fail(function (error) {
      showToast("error", t("materials.adminListPage.blockSaveFailedTitle", null, "Khong the luu noi dung"), error && error.message ? error.message : t("materials.adminListPage.blockSaveFailedMessage", null, "Vui long thu lai."));
    });
  }

  function reorderBlocks(modal, direction, index) {
    const material = modal.data("material-detail");
    const blocks = material && Array.isArray(material.blocks) ? material.blocks.slice().sort(function (a, b) {
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    }) : [];
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= blocks.length) {
      return;
    }

    const temp = blocks[index];
    blocks[index] = blocks[swapIndex];
    blocks[swapIndex] = temp;

    Lms.apiClient.put("api/learning-materials/" + material.id + "/blocks/reorder", {
      blocks: blocks.map(function (block, blockIndex) {
        return { id: block.id, sortOrder: blockIndex + 1 };
      })
    }).done(function () {
      refreshBlockBuilder(modal, material.id);
    }).fail(function (error) {
      showToast("error", t("materials.adminListPage.reorderFailedTitle", null, "Khong the sap xep"), error && error.message ? error.message : t("materials.adminListPage.reorderFailedMessage", null, "Vui long thu lai."));
    });
  }

  function editBlock(modal, blockId) {
    const material = modal.data("material-detail");
    const block = material && Array.isArray(material.blocks)
      ? material.blocks.find(function (item) { return Number(item.id) === Number(blockId); })
      : null;
    if (!block) {
      return;
    }

    const caption = window.prompt(t("materials.adminListPage.blockCaptionPrompt", null, "Chu thich"), block.caption || "") || "";
    const payload = { caption: caption };

    if (block.blockType === "Text") {
      const text = window.prompt(t("materials.adminListPage.blockTextPrompt", null, "Noi dung van ban"), block.textContent || "");
      if (text === null) return;
      payload.textContent = text;
    } else if (block.blockType === "Link") {
      const url = window.prompt(t("materials.adminListPage.blockUrlPrompt", null, "Lien ket"), block.url || "");
      if (url === null) return;
      payload.url = url;
    }

    Lms.apiClient.put("api/learning-materials/" + material.id + "/blocks/" + block.id, payload).done(function () {
      refreshBlockBuilder(modal, material.id);
    }).fail(function (error) {
      showToast("error", t("materials.adminListPage.blockSaveFailedTitle", null, "Khong the luu noi dung"), error && error.message ? error.message : t("materials.adminListPage.blockSaveFailedMessage", null, "Vui long thu lai."));
    });
  }

  function deleteBlock(modal, blockId) {
    const material = modal.data("material-detail");
    if (!material || !window.confirm(t("materials.adminListPage.deleteBlockConfirm", null, "Xoa khoi noi dung nay?"))) {
      return;
    }

    Lms.apiClient.delete("api/learning-materials/" + material.id + "/blocks/" + blockId).done(function () {
      refreshBlockBuilder(modal, material.id);
    }).fail(function (error) {
      showToast("error", t("materials.adminListPage.deleteBlockFailedTitle", null, "Khong the xoa noi dung"), error && error.message ? error.message : t("materials.adminListPage.deleteBlockFailedMessage", null, "Vui long thu lai."));
    });
  }

  function openBlockBuilder(material) {
    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          "<div>" +
            '<h2 class="app-modal-title">' + escapeHtml(t("materials.adminListPage.contentBuilderTitle", null, "Noi dung tai lieu")) + "</h2>" +
            '<p class="app-card-subtitle">' + escapeHtml(material.title) + "</p>" +
          "</div>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("materials.adminListPage.close", null, "Dong")) + "</button>" +
        "</div>" +
        '<div class="app-modal-body admin-user-form">' +
          '<div class="group-detail-list" data-material-block-list></div>' +
          '<div class="app-card u-mt-4">' +
            '<div class="app-card-body admin-user-form">' +
              '<div class="admin-user-form-grid">' +
                '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.blockType", null, "Loai noi dung")) +
                  '<select class="app-select" name="blockType">' +
                    '<option value="Text">' + escapeHtml(getBlockTypeLabel("Text")) + "</option>" +
                    '<option value="Image">' + escapeHtml(getBlockTypeLabel("Image")) + "</option>" +
                    '<option value="Video">' + escapeHtml(getBlockTypeLabel("Video")) + "</option>" +
                    '<option value="Pdf">' + escapeHtml(getBlockTypeLabel("Pdf")) + "</option>" +
                    '<option value="File">' + escapeHtml(getBlockTypeLabel("File")) + "</option>" +
                    '<option value="Link">' + escapeHtml(getBlockTypeLabel("Link")) + "</option>" +
                  "</select>" +
                "</label>" +
                '<label class="auth-field">' + escapeHtml(t("materials.adminListPage.blockCaption", null, "Chu thich")) +
                  '<input class="app-input" name="caption" type="text" autocomplete="off" />' +
                "</label>" +
              "</div>" +
              '<label class="auth-field" data-material-block-field="text">' + escapeHtml(t("materials.adminListPage.blockTextContent", null, "Noi dung van ban")) +
                '<textarea class="app-input" name="blockText" rows="4"></textarea>' +
              "</label>" +
              '<label class="auth-field" data-material-block-field="link">' + escapeHtml(t("materials.adminListPage.blockUrl", null, "Lien ket")) +
                '<input class="app-input" name="blockUrl" type="url" autocomplete="off" />' +
              "</label>" +
              '<label class="auth-field" data-material-block-field="file">' + escapeHtml(t("materials.adminListPage.blockFileUpload", null, "Tep dinh kem")) +
                '<input class="app-input" name="blockFile" type="file" />' +
              "</label>" +
              '<button class="app-button app-button-primary" type="button" data-material-block-add>' + escapeHtml(t("materials.adminListPage.addBlock", null, "Them noi dung")) + "</button>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>"
    );

    modal.data("material-detail", material);
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[name='blockType']").on("change", function () { updateBlockFormFields(modal); });
    modal.find("[data-material-block-add]").on("click", function () { submitBlockForm(modal); });
    modal.on("click", "[data-material-block-action='up']", function () { reorderBlocks(modal, "up", Number($(this).data("block-index"))); });
    modal.on("click", "[data-material-block-action='down']", function () { reorderBlocks(modal, "down", Number($(this).data("block-index"))); });
    modal.on("click", "[data-material-block-action='edit']", function () { editBlock(modal, $(this).data("block-id")); });
    modal.on("click", "[data-material-block-action='delete']", function () { deleteBlock(modal, $(this).data("block-id")); });

    updateBlockFormFields(modal);
    renderBlockBuilder(modal, material);
    Lms.ui.showModal(modal);
  }

  function showBlockBuilder(materialId) {
    loadMaterialDetail(materialId).done(function (material) {
      openBlockBuilder(material);
    }).fail(function (error) {
      showToast("error", t("materials.adminListPage.materialNotFoundTitle", null, "Khong tim thay tai lieu"), error && error.message ? error.message : t("materials.adminListPage.materialNotFoundMessage", null, "Khong tim thay tai lieu duoc chon."));
    });
  }

  function openMaterialForm(material) {
    const editingMaterialId = material ? Number(material.id) : null;
    const modal = buildMaterialForm(material);
    const form = modal.find("form")[0];

    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[name='contentType']").on("change", function () {
      updateTypeSpecificFields(form);
    });
    modal.find("[data-material-save]").on("click", function () {
      if (!validateMaterialForm(form, Boolean(editingMaterialId))) {
        return;
      }

      const values = getFormValues(form);
      const request = editingMaterialId ? updateMaterial(editingMaterialId, values) : createMaterial(values);

      request.done(function (response) {
        const saved = upsertMaterial(mapMaterial(getResponseData(response)));
        Lms.ui.closeModal();
        applyFilters();
        showToast(
          "success",
          editingMaterialId ? t("materials.adminListPage.materialUpdatedTitle", null, "Da cap nhat tai lieu") : t("materials.adminListPage.materialCreatedTitle", null, "Da tao tai lieu"),
          editingMaterialId
            ? t("materials.adminListPage.materialUpdatedMessage", { title: saved.title }, saved.title + " da duoc cap nhat.")
            : t("materials.adminListPage.materialCreatedMessage", { title: saved.title }, saved.title + " da duoc them.")
        );
      }).fail(function (error) {
        showToast("error", t("materials.adminListPage.saveFailedTitle", null, "Khong the luu tai lieu"), error && error.message ? error.message : t("materials.adminListPage.saveFailedMessage", null, "Vui long thu lai."));
      });
    });

    Lms.ui.showModal(modal);
  }

  function showMaterialForm(materialId) {
    if (!materialId) {
      openMaterialForm(null);
      return;
    }

    getMaterialForEdit(Number(materialId)).done(function (material) {
      openMaterialForm(material);
    }).fail(function (error) {
      showToast("error", t("materials.adminListPage.materialNotFoundTitle", null, "Khong tim thay tai lieu"), error && error.message ? error.message : t("materials.adminListPage.materialNotFoundMessage", null, "Khong tim thay tai lieu duoc chon."));
    });
  }

  function showDeleteConfirm(materialId) {
    const material = findMaterial(materialId);
    if (!material) {
      showToast("error", t("materials.adminListPage.materialNotFoundTitle", null, "Khong tim thay tai lieu"), t("materials.adminListPage.materialNotFoundMessage", null, "Khong tim thay tai lieu duoc chon."));
      return;
    }

    const modal = $(
      "<div>" +
        '<div class="app-modal-header">' +
          '<h2 class="app-modal-title">' + escapeHtml(t("materials.adminListPage.deleteMaterialTitle", null, "Xoa tai lieu")) + "</h2>" +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("materials.adminListPage.close", null, "Dong")) + "</button>" +
        "</div>" +
        '<div class="app-modal-body">' +
          '<p class="u-mb-0">' + escapeHtml(t("materials.adminListPage.deleteConfirmPrefix", null, "Xoa ")) + "<strong></strong>" + escapeHtml(t("materials.adminListPage.deleteConfirmSuffix", null, "? Tai lieu se bi soft delete tren backend.")) + "</p>" +
        "</div>" +
        '<div class="app-modal-footer">' +
          '<button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("materials.adminListPage.cancel", null, "Huy")) + "</button>" +
          '<button class="app-button app-button-primary" type="button" data-material-confirm-delete>' + escapeHtml(t("materials.adminListPage.delete", null, "Xoa")) + "</button>" +
        "</div>" +
      "</div>"
    );

    modal.find("strong").text(material.title);
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-material-confirm-delete]").on("click", function () {
      Lms.apiClient.delete("api/learning-materials/" + material.id).done(function () {
        state.materials = state.materials.filter(function (item) {
          return item.id !== material.id;
        });
        Lms.ui.closeModal();
        applyFilters();
        showToast("success", t("materials.adminListPage.materialDeletedTitle", null, "Da xoa tai lieu"), t("materials.adminListPage.materialDeletedMessage", { title: material.title }, material.title + " da duoc xoa khoi danh sach."));
      }).fail(function (error) {
        showToast("error", t("materials.adminListPage.deleteFailedTitle", null, "Xoa tai lieu that bai"), error && error.message ? error.message : t("materials.adminListPage.deleteFailedMessage", null, "Vui long thu lai."));
      });
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
      state.fileMode = $(this).val();
      state.page = 1;
      applyFilters();
    });

    $("[data-material-action='clear-filters']").on("click", function () {
      state.search = "";
      state.courseId = "";
      state.type = "";
      state.fileMode = "";
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

    $(document).on("click", "[data-material-action='blocks']", function () {
      showBlockBuilder($(this).data("material-id"));
    });

    $(document).on("click", "[data-material-action='delete']", function () {
      showDeleteConfirm($(this).data("material-id"));
    });

    $(document).on("click", "[data-material-action='export']", function () {
      showToast("info", t("materials.adminListPage.exportTitle", null, "Xuat tai lieu"), t("materials.adminListPage.exportMessage", null, "Chuc nang export se duoc noi o phase bao cao."));
    });

    $(document).on("lms:i18n:changed", render);
  }

  function renderLoadError(message) {
    $("#materialTableRows").html(
      '<tr><td colspan="6">' +
        '<div class="app-empty-state">' +
          '<div class="app-empty-icon" aria-hidden="true">!</div>' +
          '<h3 class="app-empty-title">' + escapeHtml(t("materials.adminListPage.loadErrorTitle", null, "Khong the tai tai lieu")) + "</h3>" +
          '<p class="app-empty-copy">' + escapeHtml(message || t("materials.adminListPage.loadErrorCopy", null, "Vui long kiem tra API learning materials.")) + "</p>" +
        "</div>" +
      "</td></tr>"
    );
  }

  function loadPageData() {
    $.when(
      Lms.apiClient.get("api/learning-materials?page=1&pageSize=500"),
      Lms.apiClient.get("api/courses?page=1&pageSize=200")
    ).done(function (materialsResponse, coursesResponse) {
      state.materials = getResponseItems(materialsResponse).map(mapMaterial);
      state.courses = getResponseItems(coursesResponse);
      state.filteredMaterials = state.materials.slice();
      renderCourseOptions();
      render();
    }).fail(function (error) {
      renderLoadError(error && error.message ? error.message : null);
      showToast("error", t("materials.adminListPage.dataErrorTitle", null, "Loi du lieu tai lieu"), error && error.message ? error.message : t("materials.adminListPage.dataErrorMessage", null, "Khong the tai du lieu tai lieu tu backend."));
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
