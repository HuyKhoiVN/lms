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

  function translateStatus(status) {
    return t("courses.listPage.statuses." + status, null, status);
  }

  function renderPageTitle() {
    document.title = t("courses.listPage.title", null, "Khóa học") + " - " + t("common.appName", null, "lms");
  }

  function getInitials(name) {
    return String(name || t("courses.listPage.courseFallback", null, "Khóa học"))
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function getCourseImage(index) {
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

  function getNextCourseId() {
    return state.courses.reduce(function (maxId, course) {
      return Math.max(maxId, Number(course.id) || 0);
    }, 0) + 1;
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
        '<h3 class="app-empty-title">' + escapeHtml(t("courses.listPage.noCoursesTitle", null, "Không tìm thấy khóa học")) + "</h3>" +
        '<p class="app-empty-copy">' + escapeHtml(t("courses.listPage.noCoursesCopy", null, "Thử từ khóa, trạng thái hoặc mức hoàn thành khác.")) + "</p>" +
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
              '<img src="' + getCourseImage(index) + '" alt="" aria-hidden="true" />' +
            "</div>" +
            '<div class="course-thumb">' +
              '<span class="course-thumb-code">' + escapeHtml(getInitials(course.name)) + "</span>" +
              '<span class="app-badge ' + getBadgeClass(course.status) + '">' + escapeHtml(translateStatus(course.status)) + "</span>" +
            "</div>" +
            '<h3 class="app-card-title">' + escapeHtml(course.name) + "</h3>" +
            '<p class="app-card-subtitle">' + escapeHtml(course.description) + "</p>" +
            '<div class="admin-summary-line u-mt-4">' +
              "<span>" + escapeHtml(t("courses.listPage.materials", null, "Tài liệu")) + "</span><strong>" + escapeHtml(course.materialCount) + "</strong>" +
            "</div>" +
            '<div class="admin-summary-line u-mt-4">' +
              "<span>" + escapeHtml(t("courses.listPage.assigned", null, "Đã giao")) + "</span><strong>" + escapeHtml(course.assignedCount) + "</strong>" +
            "</div>" +
            '<div class="progress-track u-mt-4"><div class="progress-fill"></div></div>' +
          "</div>" +
          '<div class="app-card-footer">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-course-action="assign" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.assign", null, "Giao")) + "</button>" +
              '<button class="app-button app-button-primary" type="button" data-course-action="edit" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.edit", null, "Sửa")) + "</button>" +
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
              '<span class="app-avatar admin-thumbnail-avatar" aria-hidden="true"><img src="' + getCourseImage(course.id || 0) + '" alt="" /></span>' +
              "<div><strong>" + escapeHtml(course.name) + "</strong><span>" + escapeHtml(course.description) + "</span></div>" +
            "</div>" +
          "</td>" +
          '<td><span class="app-badge ' + getBadgeClass(course.status) + '">' + escapeHtml(translateStatus(course.status)) + "</span></td>" +
          "<td>" + escapeHtml(course.materialCount) + "</td>" +
          "<td>" + escapeHtml(course.assignedCount) + "</td>" +
          '<td><div class="admin-course-progress"><div class="progress-track"><div class="progress-fill"></div></div><span>' + escapeHtml(course.completionRate) + "%</span></div></td>" +
          '<td class="u-text-right">' +
            '<div class="admin-row-actions">' +
              '<button class="app-button app-button-secondary" type="button" data-course-action="detail" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.detail", null, "Chi tiết")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-course-action="assign" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.assign", null, "Giao")) + "</button>" +
              '<button class="app-button app-button-secondary" type="button" data-course-action="edit" data-course-id="' + course.id + '">' + escapeHtml(t("courses.listPage.edit", null, "Sửa")) + "</button>" +
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

    $("[data-course-result-count]").text(t("courses.listPage.records", { count: state.filteredCourses.length }, state.filteredCourses.length + " bản ghi"));
    $("[data-course-page-info]").text(
      t(
        "courses.listPage.showing",
        { start: startRecord, end: endRecord, total: state.filteredCourses.length },
        "Hiển thị " + startRecord + "-" + endRecord + " trên " + state.filteredCourses.length + " khóa học"
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
    if (!state.loaded) return;
    renderPageTitle();
    renderMetrics();
    renderCards();
    renderRows();
    renderPagination();
  }

  function applyFilters() {
    const keyword = state.search.trim().toLowerCase();

    state.filteredCourses = state.courses.filter(function (course) {
      const matchesKeyword = !keyword || course.name.toLowerCase().includes(keyword) || course.description.toLowerCase().includes(keyword);
      const matchesStatus = !state.status || course.status === state.status;
      const matchesCompletion = !state.completion ||
        (state.completion === "high" && Number(course.completionRate) >= 70) ||
        (state.completion === "low" && Number(course.completionRate) < 70);

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
      status: $form.find("[name='status']").val(),
      materialCount: Number($form.find("[name='materialCount']").val()),
      assignedCount: Number($form.find("[name='assignedCount']").val()),
      completionRate: Number($form.find("[name='completionRate']").val())
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
      setFieldError(form, "name", t("courses.listPage.nameMin", null, "Tên khóa học phải có ít nhất 3 ký tự."));
      valid = false;
    }
    if (!values.description || values.description.length < 10) {
      setFieldError(form, "description", t("courses.listPage.descriptionMin", null, "Mô tả phải có ít nhất 10 ký tự."));
      valid = false;
    }
    if (!values.status) {
      setFieldError(form, "status", t("courses.listPage.statusRequired", null, "Chọn trạng thái."));
      valid = false;
    }
    ["materialCount", "assignedCount"].forEach(function (fieldName) {
      if (!Number.isInteger(values[fieldName]) || values[fieldName] < 0) {
        setFieldError(form, fieldName, t("courses.listPage.wholeNumber", null, "Nhập số nguyên lớn hơn hoặc bằng 0."));
        valid = false;
      }
    });
    if (!Number.isInteger(values.completionRate) || values.completionRate < 0 || values.completionRate > 100) {
      setFieldError(form, "completionRate", t("courses.listPage.completionRange", null, "Tỷ lệ hoàn thành phải là số nguyên từ 0 đến 100."));
      valid = false;
    }

    const duplicateName = state.courses.some(function (course) {
      return course.id !== editingCourseId && course.name.toLowerCase() === values.name.toLowerCase();
    });
    if (duplicateName) {
      setFieldError(form, "name", t("courses.listPage.duplicateName", null, "Tên khóa học đã tồn tại."));
      valid = false;
    }
    return valid;
  }

  function buildCourseForm(course) {
    const isEdit = Boolean(course);
    const modal = $(
      "<div>" +
        '<div class="app-modal-header"><div>' +
          '<h2 class="app-modal-title">' + escapeHtml(isEdit ? t("courses.listPage.editCourse", null, "Sửa khóa học") : t("courses.listPage.createCourseModal", null, "Tạo khóa học")) + "</h2>" +
          '<p class="app-card-subtitle">' + escapeHtml(isEdit ? t("courses.listPage.editSubtitle", null, "Cập nhật thông tin khóa học mô phỏng.") : t("courses.listPage.createSubtitle", null, "Thêm khóa học mô phỏng mới trong bộ nhớ.")) + "</p>" +
        '</div><button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("courses.listPage.close", null, "Đóng")) + "</button></div>" +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("courses.listPage.courseName", null, "Tên khóa học")) + '<input class="app-input" name="name" type="text" autocomplete="off" /><span class="auth-error" data-course-error="name"></span></label>' +
          '<label class="auth-field">' + escapeHtml(t("courses.listPage.description", null, "Mô tả")) + '<textarea class="app-input admin-course-textarea" name="description" rows="3"></textarea><span class="auth-error" data-course-error="description"></span></label>' +
          '<div class="admin-user-form-grid">' +
            '<label class="auth-field">' + escapeHtml(t("courses.listPage.status", null, "Trạng thái")) + '<select class="app-select" name="status"><option value="">' + escapeHtml(t("courses.listPage.selectStatus", null, "Chọn trạng thái")) + '</option><option value="Published">' + escapeHtml(t("courses.listPage.published", null, "Đã xuất bản")) + '</option><option value="Draft">' + escapeHtml(t("courses.listPage.draft", null, "Bản nháp")) + '</option></select><span class="auth-error" data-course-error="status"></span></label>' +
            '<label class="auth-field">' + escapeHtml(t("courses.listPage.materialCount", null, "Tài liệu")) + '<input class="app-input" name="materialCount" type="number" min="0" step="1" /><span class="auth-error" data-course-error="materialCount"></span></label>' +
          "</div>" +
          '<div class="admin-user-form-grid">' +
            '<label class="auth-field">' + escapeHtml(t("courses.listPage.assignedCount", null, "Số lượt giao")) + '<input class="app-input" name="assignedCount" type="number" min="0" step="1" /><span class="auth-error" data-course-error="assignedCount"></span></label>' +
            '<label class="auth-field">' + escapeHtml(t("courses.listPage.completionRate", null, "Tỷ lệ hoàn thành")) + '<input class="app-input" name="completionRate" type="number" min="0" max="100" step="1" /><span class="auth-error" data-course-error="completionRate"></span></label>' +
          "</div>" +
        "</form>" +
        '<div class="app-modal-footer"><button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("courses.listPage.cancel", null, "Hủy")) + '</button><button class="app-button app-button-primary" type="button" data-course-save>' + escapeHtml(isEdit ? t("courses.listPage.saveChanges", null, "Lưu thay đổi") : t("courses.listPage.createCourse", null, "Tạo khóa học")) + "</button></div>" +
      "</div>"
    );

    modal.find("[name='name']").val(course ? course.name : "");
    modal.find("[name='description']").val(course ? course.description : "");
    modal.find("[name='status']").val(course ? course.status : "Draft");
    modal.find("[name='materialCount']").val(course ? course.materialCount : 0);
    modal.find("[name='assignedCount']").val(course ? course.assignedCount : 0);
    modal.find("[name='completionRate']").val(course ? course.completionRate : 0);
    return modal;
  }

  function showCourseForm(courseId) {
    const editingCourseId = courseId ? Number(courseId) : null;
    const course = editingCourseId ? findCourse(editingCourseId) : null;

    if (editingCourseId && !course) {
      showToast("error", t("courses.listPage.courseNotFoundTitle", null, "Không tìm thấy khóa học"), t("courses.listPage.courseNotFoundMessage", null, "Không tìm thấy khóa học đã chọn."));
      return;
    }

    const modal = buildCourseForm(course);
    const form = modal.find("form")[0];
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-course-save]").on("click", function () {
      if (!validateCourseForm(form, editingCourseId)) return;
      const values = getFormValues(form);

      if (editingCourseId) {
        const target = findCourse(editingCourseId);
        Object.assign(target, values);
        showToast("success", t("courses.listPage.courseUpdatedTitle", null, "Đã cập nhật khóa học"), t("courses.listPage.courseUpdatedMessage", { name: target.name }, target.name + " đã được cập nhật."));
      } else {
        const newCourse = { id: getNextCourseId(), ...values };
        state.courses.unshift(newCourse);
        state.page = 1;
        showToast("success", t("courses.listPage.courseCreatedTitle", null, "Đã tạo khóa học"), t("courses.listPage.courseCreatedMessage", { name: newCourse.name }, newCourse.name + " đã được thêm."));
      }

      Lms.ui.closeModal();
      applyFilters();
    });
    Lms.ui.showModal(modal);
  }

  function buildAssignForm(course) {
    const modal = $(
      "<div>" +
        '<div class="app-modal-header"><div><h2 class="app-modal-title">' + escapeHtml(t("courses.listPage.assignCourseTitle", null, "Giao khóa học")) + '</h2><p class="app-card-subtitle"></p></div><button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("courses.listPage.close", null, "Đóng")) + "</button></div>" +
        '<form class="app-modal-body admin-user-form" novalidate>' +
          '<label class="auth-field">' + escapeHtml(t("courses.listPage.assignToUser", null, "Giao cho người dùng")) + '<select class="app-select" name="userId"></select></label>' +
          '<label class="auth-field">' + escapeHtml(t("courses.listPage.assignToGroup", null, "Giao cho nhóm")) + '<select class="app-select" name="groupId"></select></label>' +
          '<p class="page-muted u-mb-0">' + escapeHtml(t("courses.listPage.assignHelp", null, "Thao tác mô phỏng này chỉ tăng số lượng giao trong bộ nhớ.")) + "</p>" +
        "</form>" +
        '<div class="app-modal-footer"><button class="app-button app-button-secondary" type="button" data-modal-close>' + escapeHtml(t("courses.listPage.cancel", null, "Hủy")) + '</button><button class="app-button app-button-primary" type="button" data-course-confirm-assign>' + escapeHtml(t("courses.listPage.assign", null, "Giao")) + "</button></div>" +
      "</div>"
    );

    modal.find(".app-card-subtitle").text(course.name);
    const $userSelect = modal.find("[name='userId']").append('<option value="">' + escapeHtml(t("courses.listPage.noIndividualUser", null, "Không chọn người dùng riêng lẻ")) + "</option>");
    const $groupSelect = modal.find("[name='groupId']").append('<option value="">' + escapeHtml(t("courses.listPage.noGroup", null, "Không chọn nhóm")) + "</option>");
    state.users.filter(function (user) { return user.role === "Student"; }).forEach(function (user) {
      $userSelect.append('<option value="' + user.id + '">' + escapeHtml(user.fullName) + "</option>");
    });
    state.groups.forEach(function (group) {
      $groupSelect.append('<option value="' + group.id + '">' + escapeHtml(group.name) + "</option>");
    });
    return modal;
  }

  function showAssignForm(courseId) {
    const course = findCourse(courseId);
    if (!course) {
      showToast("error", t("courses.listPage.courseNotFoundTitle", null, "Không tìm thấy khóa học"), t("courses.listPage.courseNotFoundMessage", null, "Không tìm thấy khóa học đã chọn."));
      return;
    }

    const modal = buildAssignForm(course);
    modal.find("[data-modal-close]").on("click", Lms.ui.closeModal);
    modal.find("[data-course-confirm-assign]").on("click", function () {
      const userId = modal.find("[name='userId']").val();
      const groupId = modal.find("[name='groupId']").val();
      if (!userId && !groupId) {
        showToast("warning", t("courses.listPage.chooseAssignmentTitle", null, "Chọn đối tượng giao"), t("courses.listPage.chooseAssignmentMessage", null, "Chọn người dùng hoặc nhóm trước khi giao."));
        return;
      }
      course.assignedCount += (userId ? 1 : 0) + (groupId ? 1 : 0);
      Lms.ui.closeModal();
      applyFilters();
      showToast("success", t("courses.listPage.courseAssignedTitle", null, "Đã giao khóa học"), t("courses.listPage.courseAssignedMessage", { name: course.name }, "Số lượt giao của " + course.name + " đã được cập nhật."));
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
    $(document).on("click", "[data-course-action='create']", function () { showCourseForm(); });
    $(document).on("click", "[data-course-action='edit']", function () { showCourseForm($(this).data("course-id")); });
    $(document).on("click", "[data-course-action='assign']", function () { showAssignForm($(this).data("course-id")); });
    $(document).on("click", "[data-course-action='detail']", function () { window.location.href = "/admin/courses/detail/" + $(this).data("course-id"); });
    $(document).on("click", "[data-course-action='export']", function () {
      showToast("info", t("courses.listPage.exportTitle", null, "Xuất khóa học"), t("courses.listPage.exportMessage", null, "Chức năng xuất sẽ được nối ở task báo cáo/xuất dữ liệu."));
    });
    $(document).on("lms:i18n:changed", render);
  }

  function loadCourses() {
    renderPageTitle();
    $.when(
      Lms.apiClient.get("courses.json"),
      Lms.apiClient.get("users.json"),
      Lms.apiClient.get("groups.json")
    ).done(function (coursesResponse, usersResponse, groupsResponse) {
      state.courses = getItems(coursesResponse).map(function (course) { return { ...course }; });
      state.users = getItems(usersResponse);
      state.groups = getItems(groupsResponse);
      state.filteredCourses = state.courses.slice();
      state.loaded = true;
      render();
    }).fail(function () {
      $("#courseTableRows").html(
        '<tr><td colspan="6"><div class="app-empty-state"><div class="app-empty-icon" aria-hidden="true">!</div><h3 class="app-empty-title">' +
        escapeHtml(t("courses.listPage.loadErrorTitle", null, "Không thể tải khóa học")) +
        "</h3><p class=\"app-empty-copy\">" +
        escapeHtml(t("courses.listPage.loadErrorCopy", null, "Vui lòng kiểm tra mock/courses.json.")) +
        "</p></div></td></tr>"
      );
      showToast("error", t("courses.listPage.dataErrorTitle", null, "Lỗi dữ liệu khóa học"), t("courses.listPage.dataErrorMessage", null, "Không thể tải dữ liệu mô phỏng danh sách khóa học."));
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
