(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    courses: [],
    filteredCourses: [],
    users: [],
    groups: [],
    page: 1,
    pageSize: 8,
    search: "",
    status: "",
    completion: "",
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

  function mapCourse(raw) {
    return {
      id: Number(raw.id),
      code: raw.code || "",
      name: raw.name || "",
      description: raw.description || "",
      isPublished: Boolean(raw.isPublished),
      status: raw.isPublished ? "Published" : "Draft",
      thumbnailUrl: raw.thumbnailUrl || "",
      thumbnailContentType: raw.thumbnailContentType || "",
      thumbnailOriginalFileName: raw.thumbnailOriginalFileName || "",
      materialCount: 0,
      assignedCount: null,
      completionRate: 0
    };
  }

  function getBadgeClass(status) {
    return status === "Published" ? "app-badge-success" : "app-badge-muted";
  }

  function translateStatus(status) {
    return t("courses.listPage.statuses." + status, null, status);
  }

  function renderPageTitle() {
    document.title = t("courses.listPage.title", null, "Khoa hoc") + " - " + t("common.appName", null, "lms");
  }

  function getInitials(name) {
    return String(name || t("courses.listPage.courseFallback", null, "Khoa hoc"))
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function getApiOrigin() {
    return Lms.apiClient && Lms.apiClient.buildApiOrigin ? Lms.apiClient.buildApiOrigin() : "";
  }

  function resolveAssetUrl(url) {
    if (!url) {
      return "";
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return getApiOrigin() + (url.charAt(0) === "/" ? url : "/" + url);
  }

  function getCourseImage(course, index) {
    if (course && course.thumbnailUrl) {
      return resolveAssetUrl(course.thumbnailUrl);
    }

    const images = [
      "/images/course-programming.jpg",
      "/images/course-ai-tech.jpg",
      "/images/course-business.jpg",
      "/images/course-softskills.jpg",
      "/images/course-languages.jpg",
      "/images/course-science.jpg"
    ];

    return images[index % images.length];
  }

  function getPageCount() {
    return Math.max(1, Math.ceil(state.filteredCourses.length / state.pageSize));
  }

  function getCurrentPageRows() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredCourses.slice(start, start + state.pageSize);
  }

  function findCourse(courseId) {
    return state.courses.find(function (course) {
      return course.id === Number(courseId);
    });
  }

  function setProgress($element, value) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    $element.css("width", safeValue + "%");
  }

  function formatAssignedCount(value) {
    return value === null || typeof value === "undefined" ? "--" : String(value);
  }

  function syncCourseDerivedFields(course, materials, progressData) {
    const relatedMaterials = materials.filter(function (material) {
      return Number(material.courseId) === course.id;
    });
    const details = progressData && Array.isArray(progressData.details) ? progressData.details : [];
    const uniqueUsers = new Set(details.map(function (detail) {
      return Number(detail.userId);
    }).filter(Boolean));

    course.materialCount = relatedMaterials.length;
    course.completionRate = Number(progressData && progressData.overallPercent ? progressData.overallPercent : 0);
    course.assignedCount = uniqueUsers.size ? uniqueUsers.size : null;
  }

  function renderMetrics() {
    const published = state.courses.filter(function (course) {
      return course.status === "Published";
    }).length;
    const materials = state.courses.reduce(function (total, course) {
      return total + Number(course.materialCount || 0);
    }, 0);
    const averageCompletion = state.courses.length
      ? Math.round(state.courses.reduce(function (total, course) {
        return total + Number(course.completionRate || 0);
      }, 0) / state.courses.length)
      : 0;

    $("[data-course-metric='total']").text(state.courses.length);
    $("[data-course-metric='published']").text(published);
    $("[data-course-metric='materials']").text(materials);
    $("[data-course-metric='completion']").text(averageCompletion + "%");
  }

  function emptyCoursesMarkup(colspan) {
    const content =
      '<div class="app-empty-state">' +
        '<div class="image-slot image-slot-md image-slot-course u-mb-4" data-image-label="Empty courses illustration 320x180"><img src="/images/placeholders/course-placeholder.svg" alt="" aria-hidden="true" /></div>' +
        '<h3 class="app-empty-title">' + escapeHtml(t("courses.listPage.noCoursesTitle", null, "Khong tim thay khoa hoc")) + "</h3>" +
        '<p class="app-empty-copy">' + escapeHtml(t("courses.listPage.noCoursesCopy", null, "Thu tu khoa, trang thai hoac muc hoan thanh khac.")) + "</p>" +
      "</div>";

    return colspan ? '<tr><td colspan="' + colspan + '">' + content + "</td></tr>" : content;
  }

  function renderCards() {
    const $grid = $("#courseCardGrid").empty();
    const rows = getCurrentPageRows();

    if (!rows.length) {
      $grid.append(emptyCoursesMarkup());
      return;
    }

    rows.forEach(function (course, index) {
      const cardClass = ["learning-card-safety", "learning-card-service", "learning-card-exam"][index % 3];
      const $card = $(
        '<article class="app-card learning-card admin-course-card ' + cardClass + '">' +
          '<div class="app-card-body">' +
            '<div class="image-slot image-slot-md image-slot-course admin-course-image" data-image-label="Course card image 320x180">' +
              '<img src="' + getCourseImage(course, index) + '" alt="" aria-hidden="true" />' +
            "</div>" +
            '<div class="course-thumb">' +
              '<span class="course-thumb-code">' + escapeHtml(getInitials(course.name)) + "</span>" +
              '<span class="app-badge ' + getBadgeClass(course.status) + '">' + escapeHtml(translateStatus(course.status)) + "</span>" +
            "</div>" +
            '<h3 class="app-card-title">' + escapeHtml(course.name) + "</h3>" +
            '<p class="app-card-subtitle">' + escapeHtml(course.description || course.code || "") + "</p>" +
            '<div class="admin-summary-line u-mt-4">' +
              "<span>" + escapeHtml(t("courses.listPage.materials", null, "Tai lieu")) + "</span><strong>" + escapeHtml(course.materialCount) + "</strong>" +
            "</div>" +
            '<div class="admin-summary-line u-mt-4">' +
              "<span>" + escapeHtml(t("courses.listPage.assigned", null, "Da giao")) + "</span><strong>" + escapeHtml(formatAssignedCount(course.assignedCount)) + "</strong>" +
            "</div>" +
            '<div class="progress-track u-mt-4"><div class="progress-fill"></div></div>' +
          "</div>" +
          '<div class="app-card-footer">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-course-action="assign" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.assign", null, "Giao")) + "</button>" +
              '<button class="app-button app-button-primary" type="button" data-course-action="edit" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.edit", null, "Sua")) + "</button>" +
            "</div>" +
          "</div>" +
        "</article>"
      );

      setProgress($card.find(".progress-fill"), course.completionRate);
      $grid.append($card);
    });
  }

  function renderRows() {
    const $rows = $("#courseTableRows").empty();
    const rows = getCurrentPageRows();

    if (!rows.length) {
      $rows.append(emptyCoursesMarkup(6));
      return;
    }

    rows.forEach(function (course) {
      const $row = $(
        "<tr>" +
          "<td>" +
            '<div class="admin-user-cell">' +
              '<span class="app-avatar admin-thumbnail-avatar" aria-hidden="true"><img src="' + getCourseImage(course, course.id || 0) + '" alt="" /></span>' +
              "<div><strong>" + escapeHtml(course.name) + "</strong><span>" + escapeHtml(course.description || course.code || "") + "</span></div>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge ' + getBadgeClass(course.status) + '">' + escapeHtml(translateStatus(course.status)) + "</span></td>" +
          "<td>" + escapeHtml(course.materialCount) + "</td>" +
          "<td>" + escapeHtml(formatAssignedCount(course.assignedCount)) + "</td>" +
          '<td><div class="admin-course-progress"><div class="progress-track"><div class="progress-fill"></div></div><span>' + escapeHtml(Math.round(course.completionRate)) + "%</span></div></td>" +
          '<td class="u-text-right">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-course-action="detail" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.detail", null, "Chi tiet")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-course-action="assign" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.assign", null, "Giao")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-course-action="edit" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.edit", null, "Sua")) + "</button>" +
            "</div>" +
          "</td>" +
        "</tr>"
      );

      setProgress($row.find(".progress-fill"), course.completionRate);
      $rows.append($row);
    });
  }

  function renderPagination() {
    const pageCount = getPageCount();
    const $pages = $("#coursePaginationPages").empty();
    const startRecord = state.filteredCourses.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const endRecord = Math.min(state.page * state.pageSize, state.filteredCourses.length);

    $("[data-course-result-count]").text(t("courses.listPage.records", { count: state.filteredCourses.length }, state.filteredCourses.length + " ban ghi"));
    $("[data-course-page-info]").text(
      t(
        "courses.listPage.showing",
        { start: startRecord, end: endRecord, total: state.filteredCourses.length },
        "Hien thi " + startRecord + "-" + endRecord + " tren " + state.filteredCourses.length + " khoa hoc"
      )
    );
    $("[data-course-page='prev']").prop("disabled", state.page <= 1);
    $("[data-course-page='next']").prop("disabled", state.page >= pageCount);

    for (let page = 1; page <= pageCount; page += 1) {
      const $button = $('<button class="admin-pagination-page" type="button"></button>');
      $button.text(page);
      $button.attr("data-course-page-number", page);
      $button.toggleClass("active", page === state.page);
      $pages.append($button);
    }
  }

  function render() {
    if (!state.loaded) {
      return;
    }
    renderPageTitle();
    renderMetrics();
    renderCards();
    renderRows();
    renderPagination();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredCourses = state.courses.filter(function (course) {
      const matchesKeyword = !keyword
        || course.name.toLowerCase().includes(keyword)
        || String(course.description || "").toLowerCase().includes(keyword)
        || String(course.code || "").toLowerCase().includes(keyword);
      const matchesStatus = !state.status || course.status === state.status;
      const matchesCompletion = !state.completion
        || (state.completion === "high" && Number(course.completionRate) >= 70)
        || (state.completion === "low" && Number(course.completionRate) < 70);

      return matchesKeyword && matchesStatus && matchesCompletion;
    });

    state.page = Math.min(state.page, getPageCount());
    render();
  }

  function getFormValues(form) {
    const $form = $(form);
    return {
      name: $form.find("[name='name']").val().trim(),
      description: $form.find("[name='description']").val().trim(),
      code: $form.find("[name='code']").val().trim(),
      status: $form.find("[name='status']").val(),
      thumbnailFile: $form.find("[name='thumbnail']")[0] && $form.find("[name='thumbnail']")[0].files
        ? $form.find("[name='thumbnail']")[0].files[0]
        : null
    };
  }

  function setFieldError(form, fieldName, message) {
    const $field = $(form).find("[name='" + fieldName + "']");
    const $error = $(form).find("[data-course-error='" + fieldName + "']");
    $field.toggleClass("is-invalid", Boolean(message));
    $error.text(message || "");
  }

  function clearFormErrors(form) {
    $(form).find(".is-invalid").removeClass("is-invalid");
    $(form).find("[data-course-error]").text("");
  }

  function validateCourseForm(form, editingCourseId) {
    const values = getFormValues(form);
    let valid = true;
    clearFormErrors(form);

    if (!values.name || values.name.length < 3) {
      setFieldError(form, "name", t("courses.listPage.nameMin", null, "Ten khoa hoc phai co it nhat 3 ky tu."));
      valid = false;
    }
    if (!values.description || values.description.length < 10) {
      setFieldError(form, "description", t("courses.listPage.descriptionMin", null, "Mo ta phai co it nhat 10 ky tu."));
      valid = false;
    }
    if (!values.status) {
      setFieldError(form, "status", t("courses.listPage.statusRequired", null, "Chon trang thai."));
      valid = false;
    }

    const duplicateName = state.courses.some(function (course) {
      return course.id !== editingCourseId && course.name.toLowerCase() === values.name.toLowerCase();
    });
    if (duplicateName) {
      setFieldError(form, "name", t("courses.listPage.duplicateName", null, "Ten khoa hoc da ton tai."));
      valid = false;
    }

    const duplicateCode = values.code && state.courses.some(function (course) {
      return course.id !== editingCourseId && String(course.code || "").toLowerCase() === values.code.toLowerCase();
    });
    if (duplicateCode) {
      setFieldError(form, "code", t("courses.listPage.duplicateCode", null, "Ma khoa hoc da ton tai."));
      valid = false;
    }

    return valid;
  }

  function buildCourseForm(course) {
    const isEdit = Boolean(course);
    const modal = $(
      "<div>" +
        '<div class="app-modal-header"><div>' +
          '<h2 class="app-modal-title">' + escapeHtml(isEdit ? t("courses.listPage.editCourse", null, "Sua khoa hoc") : t("courses.listPage.createCourseModal", null, "Tao khoa hoc")) + "</h2>" +
          '<p class="app-card-subtitle">' + escapeHtml(isEdit ? t("courses.listPage.editSubtitle", null, "Cap nhat thong tin khoa hoc.") : t("courses.listPage.createSubtitle", null, "Them khoa hoc moi vao he thong.")) + "</p>" +
        '</div><button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("courses.listPage.close", null, "Dong")) + "</button></div>" +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("courses.listPage.courseName", null, "Ten khoa hoc")) + '<input class="app-input" name="name" type="text" autocomplete="off" /><span class="auth-error" data-course-error="name"></span></label>' +
          '<label class="auth-field">' + escapeHtml(t("courses.listPage.description", null, "Mo ta")) + '<textarea class="app-input admin-course-textarea" name="description" rows="3"></textarea><span class="auth-error" data-course-error="description"></span></label>' +
          '<div class="admin-user-form-grid">' +
            '<label class="auth-field">' + escapeHtml(t("courses.listPage.courseCode", null, "Ma khoa hoc")) + '<input class="app-input" name="code" type="text" autocomplete="off" /><span class="auth-error" data-course-error="code"></span></label>' +
            '<label class="auth-field">' + escapeHtml(t("courses.listPage.status", null, "Trang thai")) + '<select class="app-select" name="status"><option value="">' + escapeHtml(t("courses.listPage.selectStatus", null, "Chon trang thai")) + '</option><option value="Published">' + escapeHtml(t("courses.listPage.published", null, "Da xuat ban")) + '</option><option value="Draft">' + escapeHtml(t("courses.listPage.draft", null, "Ban nhap")) + '</option></select><span class="auth-error" data-course-error="status"></span></label>' +
          "</div>" +
          '<label class="auth-field">' + escapeHtml(t("courses.listPage.thumbnail", null, "Anh minh hoa")) + '<input class="app-input" name="thumbnail" type="file" accept="image/png,image/jpeg,image/webp" /><span class="auth-error" data-course-error="thumbnail"></span></label>' +
          '<div class="image-slot image-slot-md image-slot-course" data-course-thumbnail-preview><img src="' + escapeHtml(course && course.thumbnailUrl ? resolveAssetUrl(course.thumbnailUrl) : "/images/course-programming.jpg") + '" alt="" aria-hidden="true" /></div>' +
        "</form>" +
        '<div class="app-modal-footer"><button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("courses.listPage.cancel", null, "Huy")) + '</button><button class="app-button app-button-primary" type="button" data-course-save>' + escapeHtml(isEdit ? t("courses.listPage.saveChanges", null, "Luu thay doi") : t("courses.listPage.createCourse", null, "Tao khoa hoc")) + "</button></div>" +
      "</div>"
    );

    modal.find("[name='name']").val(course ? course.name : "");
    modal.find("[name='description']").val(course ? course.description : "");
    modal.find("[name='code']").val(course ? course.code : "");
    modal.find("[name='status']").val(course ? course.status : "Draft");
    modal.find("[name='thumbnail']").on("change", function () {
      const file = this.files && this.files[0];
      if (!file) {
        return;
      }
      const objectUrl = window.URL.createObjectURL(file);
      modal.find("[data-course-thumbnail-preview] img").attr("src", objectUrl);
    });
    return modal;
  }

  function uploadCourseThumbnail(courseId, file) {
    if (!file) {
      return $.Deferred().resolve(null).promise();
    }

    const formData = new FormData();
    formData.append("file", file);

    return Lms.apiClient.post("api/courses/" + courseId + "/thumbnail", formData, {
      contentType: false,
      processData: false
    });
  }

  function commitSavedCourse(editingCourseId, saved) {
    const existing = editingCourseId ? findCourse(editingCourseId) : null;

    if (existing) {
      saved.materialCount = existing.materialCount;
      saved.assignedCount = existing.assignedCount;
      saved.completionRate = existing.completionRate;
      Object.assign(existing, saved);
    } else {
      state.courses.unshift(saved);
      state.page = 1;
    }

    Lms.ui.closeModal();
    applyFilters();
    showToast(
      "success",
      editingCourseId ? t("courses.listPage.courseUpdatedTitle", null, "Da cap nhat khoa hoc") : t("courses.listPage.courseCreatedTitle", null, "Da tao khoa hoc"),
      editingCourseId
        ? t("courses.listPage.courseUpdatedMessage", { name: saved.name }, saved.name + " da duoc cap nhat.")
        : t("courses.listPage.courseCreatedMessage", { name: saved.name }, saved.name + " da duoc them.")
    );
  }

  function saveCourse(editingCourseId, values) {
    const request = {
      name: values.name,
      description: values.description,
      code: values.code || null,
      isPublished: values.status === "Published"
    };

    const action = editingCourseId
      ? Lms.apiClient.put("api/courses/" + editingCourseId, request)
      : Lms.apiClient.post("api/courses", request);

    action.done(function (response) {
      const data = getResponseData(response);
      let saved = mapCourse(data || request);

      uploadCourseThumbnail(saved.id, values.thumbnailFile).done(function (thumbnailResponse) {
        const thumbnailData = getResponseData(thumbnailResponse);
        if (thumbnailData) {
          saved = mapCourse(thumbnailData);
        }
      }).fail(function (error) {
        showToast("warning", t("courses.listPage.thumbnailWarningTitle", null, "Chua upload duoc anh"), error && error.message ? error.message : t("courses.listPage.thumbnailWarningMessage", null, "Khoa hoc da luu, nhung anh minh hoa chua duoc cap nhat."));
      }).always(function () {
        commitSavedCourse(editingCourseId, saved);
      });
    }).fail(function (xhr) {
      const message = xhr && xhr.responseJSON && xhr.responseJSON.message
        ? xhr.responseJSON.message
        : t("courses.listPage.saveErrorMessage", null, "Khong the luu khoa hoc.");
      showToast("error", t("courses.listPage.saveErrorTitle", null, "Luu khoa hoc that bai"), message);
    });
  }

  function showCourseForm(courseId) {
    const editingCourseId = courseId ? Number(courseId) : null;
    const course = editingCourseId ? findCourse(editingCourseId) : null;

    if (editingCourseId && !course) {
      showToast("error", t("courses.listPage.courseNotFoundTitle", null, "Khong tim thay khoa hoc"), t("courses.listPage.courseNotFoundMessage", null, "Khong tim thay khoa hoc da chon."));
      return;
    }

    const modal = buildCourseForm(course);
    const form = modal.find("form")[0];
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-course-save]").on("click", function () {
      if (!validateCourseForm(form, editingCourseId)) {
        return;
      }
      saveCourse(editingCourseId, getFormValues(form));
    });
    Lms.ui.showModal(modal);
  }

  function buildAssignForm(course) {
    const modal = $(
      "<div>" +
        '<div class="app-modal-header"><div><h2 class="app-modal-title">' + escapeHtml(t("courses.listPage.assignCourseTitle", null, "Giao khoa hoc")) + '</h2><p class="app-card-subtitle"></p></div><button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("courses.listPage.close", null, "Dong")) + "</button></div>" +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("courses.listPage.assignToUser", null, "Giao cho nguoi dung")) + '<select class="app-select" name="userId"></select></label>' +
          '<label class="auth-field">' + escapeHtml(t("courses.listPage.assignToGroup", null, "Giao cho nhom")) + '<select class="app-select" name="groupId"></select></label>' +
          '<p class="page-muted u-mb-0">' + escapeHtml(t("courses.listPage.assignHelp", null, "Chon hoc vien hoac nhom de gan khoa hoc.")) + "</p>" +
        "</form>" +
        '<div class="app-modal-footer"><button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("courses.listPage.cancel", null, "Huy")) + '</button><button class="app-button app-button-primary" type="button" data-course-confirm-assign>' + escapeHtml(t("courses.listPage.assign", null, "Giao")) + "</button></div>" +
      "</div>"
    );

    modal.find(".app-card-subtitle").text(course.name);
    const $userSelect = modal.find("[name='userId']").append('<option value="">' + escapeHtml(t("courses.listPage.noIndividualUser", null, "Khong chon nguoi dung rieng le")) + "</option>");
    const $groupSelect = modal.find("[name='groupId']").append('<option value="">' + escapeHtml(t("courses.listPage.noGroup", null, "Khong chon nhom")) + "</option>");
    state.users.filter(function (user) {
      return user.role === "Student";
    }).forEach(function (user) {
      $userSelect.append('<option value="' + user.id + '">' + escapeHtml(user.fullName || user.userName) + "</option>");
    });
    state.groups.forEach(function (group) {
      $groupSelect.append('<option value="' + group.id + '">' + escapeHtml(group.name) + "</option>");
    });
    return modal;
  }

  function showAssignForm(courseId) {
    const course = findCourse(courseId);
    if (!course) {
      showToast("error", t("courses.listPage.courseNotFoundTitle", null, "Khong tim thay khoa hoc"), t("courses.listPage.courseNotFoundMessage", null, "Khong tim thay khoa hoc da chon."));
      return;
    }

    const modal = buildAssignForm(course);
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-course-confirm-assign]").on("click", function () {
      const userId = modal.find("[name='userId']").val();
      const groupId = modal.find("[name='groupId']").val();
      if (!userId && !groupId) {
        showToast("warning", t("courses.listPage.chooseAssignmentTitle", null, "Chon doi tuong giao"), t("courses.listPage.chooseAssignmentMessage", null, "Chon nguoi dung hoac nhom truoc khi giao."));
        return;
      }

      const request = {
        userIds: userId ? [Number(userId)] : [],
        groupIds: groupId ? [Number(groupId)] : []
      };

      Lms.apiClient.post("api/courses/" + course.id + "/assign", request).done(function () {
        if (course.assignedCount === null) {
          course.assignedCount = 0;
        }
        course.assignedCount += request.userIds.length + request.groupIds.length;
        Lms.ui.closeModal();
        applyFilters();
        showToast("success", t("courses.listPage.courseAssignedTitle", null, "Da giao khoa hoc"), t("courses.listPage.courseAssignedMessage", { name: course.name }, "Da cap nhat giao cho " + course.name + "."));
      }).fail(function (xhr) {
        const message = xhr && xhr.responseJSON && xhr.responseJSON.message
          ? xhr.responseJSON.message
          : t("courses.listPage.assignErrorMessage", null, "Khong the giao khoa hoc.");
        showToast("error", t("courses.listPage.assignErrorTitle", null, "Giao khoa hoc that bai"), message);
      });
    });
    Lms.ui.showModal(modal);
  }

  function bindEvents() {
    $("[data-course-filter='search']").on("input", function () {
      state.search = $(this).val();
      state.page = 1;
      applyFilters();
    });
    $("[data-course-filter='status']").on("change", function () {
      state.status = $(this).val();
      state.page = 1;
      applyFilters();
    });
    $("[data-course-filter='completion']").on("change", function () {
      state.completion = $(this).val();
      state.page = 1;
      applyFilters();
    });
    $("[data-course-action='clear-filters']").on("click", function () {
      state.search = "";
      state.status = "";
      state.completion = "";
      $("[data-course-filter='search'], [data-course-filter='status'], [data-course-filter='completion']").val("");
      state.page = 1;
      applyFilters();
    });
    $(document).on("click", "[data-course-page='prev']", function () {
      if (state.page > 1) {
        state.page -= 1;
        render();
      }
    });
    $(document).on("click", "[data-course-page='next']", function () {
      if (state.page < getPageCount()) {
        state.page += 1;
        render();
      }
    });
    $(document).on("click", "[data-course-page-number]", function () {
      state.page = Number($(this).data("course-page-number"));
      render();
    });
    $(document).on("click", "[data-course-action='create']", function () {
      showCourseForm();
    });
    $(document).on("click", "[data-course-action='edit']", function () {
      showCourseForm($(this).data("course-id"));
    });
    $(document).on("click", "[data-course-action='assign']", function () {
      showAssignForm($(this).data("course-id"));
    });
    $(document).on("click", "[data-course-action='detail']", function () {
      window.location.href = "/admin/courses/detail/" + $(this).data("course-id");
    });
    $(document).on("click", "[data-course-action='export']", function () {
      showToast("info", t("courses.listPage.exportTitle", null, "Xuat khoa hoc"), t("courses.listPage.exportMessage", null, "Chuc nang xuat se duoc noi o phase bao cao/xuat du lieu."));
    });
    $(document).on("lms:i18n:changed", render);
  }

  function renderLoadError(message) {
    $("#courseTableRows").html(
      '<tr><td colspan="6"><div class="app-empty-state"><div class="app-empty-icon" aria-hidden="true">!</div><h3 class="app-empty-title">' +
      escapeHtml(t("courses.listPage.loadErrorTitle", null, "Khong the tai khoa hoc")) +
      "</h3><p class=\"app-empty-copy\">" +
      escapeHtml(message || t("courses.listPage.loadErrorCopy", null, "Vui long kiem tra API khoa hoc.")) +
      "</p></div></td></tr>"
    );
  }

  function loadUsersAndGroups() {
    return $.when(
      Lms.apiClient.get("api/users?page=1&pageSize=200"),
      Lms.apiClient.get("api/groups?page=1&pageSize=200")
    ).done(function (usersResponse, groupsResponse) {
      state.users = getResponseItems(usersResponse);
      state.groups = getResponseItems(groupsResponse);
    });
  }

  function loadProgressForCourses(courses, materials) {
    if (!courses.length) {
      state.courses = [];
      return $.Deferred().resolve().promise();
    }

    const requests = courses.map(function (course) {
      return Lms.apiClient.get("api/courses/" + course.id + "/progress");
    });

    return $.when.apply($, requests).done(function () {
      const responses = requests.length === 1 ? [arguments] : Array.prototype.slice.call(arguments);
      state.courses = courses.map(function (course, index) {
        const progressData = getResponseData(responses[index]);
        syncCourseDerivedFields(course, materials, progressData);
        return course;
      });
    }).fail(function () {
      state.courses = courses.map(function (course) {
        syncCourseDerivedFields(course, materials, null);
        return course;
      });
      showToast("warning", t("courses.listPage.progressWarningTitle", null, "Chua tai du tien do"), t("courses.listPage.progressWarningMessage", null, "Danh sach khoa hoc van hien thi, nhung thong ke tien do co the chua day du."));
    });
  }

  function loadCourses() {
    renderPageTitle();

    $.when(
      Lms.apiClient.get("api/courses?page=1&pageSize=200"),
      Lms.apiClient.get("api/learning-materials?page=1&pageSize=500"),
      loadUsersAndGroups()
    ).done(function (coursesResponse, materialsResponse) {
      const courses = getResponseItems(coursesResponse).map(mapCourse);
      const materials = getResponseItems(materialsResponse);

      loadProgressForCourses(courses, materials).always(function () {
        state.filteredCourses = state.courses.slice();
        state.loaded = true;
        render();
      });
    }).fail(function (xhr) {
      const message = xhr && xhr.responseJSON && xhr.responseJSON.message
        ? xhr.responseJSON.message
        : t("courses.listPage.dataErrorMessage", null, "Khong the tai du lieu khoa hoc tu backend.");
      renderLoadError(message);
      showToast("error", t("courses.listPage.dataErrorTitle", null, "Loi du lieu khoa hoc"), message);
    });
  }

  function init() {
    bindEvents();
    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadCourses);
      return;
    }
    loadCourses();
  }

  $(init);
})(window, jQuery);
