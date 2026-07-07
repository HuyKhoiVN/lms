(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    courseId: 0,
    course: null,
    materials: [],
    progress: null,
    courseExams: []
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

  function getApiOrigin() {
    return String(Lms.config && Lms.config.apiBaseUrl || "").replace(/\/api\/v1\/?$/i, "");
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

  function clampProgress(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  }

  function getInitials(value) {
    const words = String(value || "KH")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return words.length
      ? words.slice(0, 2).map(function (word) { return word.charAt(0).toUpperCase(); }).join("")
      : "KH";
  }

  function getProgressSummary() {
    const totalMaterials = Number(state.progress && state.progress.totalMaterials || state.materials.length || 0);
    const completedMaterials = Number(state.progress && state.progress.completedMaterials || 0);
    const progressPercent = clampProgress(state.progress && state.progress.overallPercent);
    const remainingMaterials = Math.max(0, totalMaterials - completedMaterials);

    return {
      totalMaterials,
      completedMaterials,
      remainingMaterials,
      progressPercent
    };
  }

  function getCourseStatus(summary) {
    if (!state.course || !state.course.isPublished) {
      return {
        className: "is-pending",
        text: t("courses.detailStudentPage.statusDraft", null, "Chưa mở")
      };
    }

    if (summary.totalMaterials > 0 && summary.completedMaterials >= summary.totalMaterials) {
      return {
        className: "is-completed",
        text: t("courses.detailStudentPage.statusCompleted", null, "Hoàn thành")
      };
    }

    return {
      className: "is-current",
      text: t("courses.detailStudentPage.statusPublished", null, "Đang học")
    };
  }

  function getMaterialProgress(materialId) {
    const details = state.progress && Array.isArray(state.progress.details) ? state.progress.details : [];
    return details.find(function (item) {
      return Number(item.learningMaterialId) === Number(materialId);
    }) || null;
  }

  function getFirstIncompleteMaterial() {
    return state.materials.find(function (material) {
      const progress = getMaterialProgress(material.id);
      return !(progress && progress.isCompleted);
    }) || null;
  }

  function getPrimaryMaterial() {
    return getFirstIncompleteMaterial() || state.materials[0] || null;
  }

  function setPrimaryLink() {
    const target = getPrimaryMaterial();
    const summary = getProgressSummary();
    const $link = $("[data-student-course-detail-primary-link]");

    if (!target) {
      $link.addClass("is-disabled").attr("aria-disabled", "true").attr("href", "#");
      return;
    }

    const allCompleted = summary.totalMaterials > 0 && summary.completedMaterials >= summary.totalMaterials;
    const label = allCompleted
      ? t("courses.detailStudentPage.reviewMaterial", null, "Xem lại")
      : t("courses.detailStudentPage.continueLearning", null, "Tiếp tục học");

    $link
      .removeClass("is-disabled")
      .removeAttr("aria-disabled")
      .attr("href", "/LearningMaterials/Viewer/" + target.id)
      .find("span")
      .text(label);
  }

  function renderCourseVisual() {
    const courseName = state.course ? state.course.name : "";
    const courseCode = state.course && state.course.code
      ? state.course.code
      : t("courses.detailStudentPage.courseCodeFallback", null, "Course");
    const thumbnailUrl = state.course && state.course.thumbnailUrl ? resolveAssetUrl(state.course.thumbnailUrl) : "";
    const $visual = $("[data-student-course-detail-visual]");
    const $img = $("[data-student-course-detail-thumbnail]");

    $("[data-student-course-detail-initials]").text(getInitials(courseName));
    $("[data-student-course-detail-code]").text(courseCode);
    $("[data-student-course-detail-mini-stat='code']").text(courseCode);

    function showFallback() {
      $visual.removeClass("has-image");
      $img.removeAttr("src");
    }

    $img.off(".courseDetail");

    if (!thumbnailUrl) {
      showFallback();
      return;
    }

    $img
      .on("load.courseDetail", function () {
        $visual.addClass("has-image");
      })
      .on("error.courseDetail", showFallback)
      .attr("src", thumbnailUrl);
  }

  function renderHeader() {
    const summary = getProgressSummary();
    const status = getCourseStatus(summary);
    const courseName = state.course ? state.course.name : t("courses.detailStudentPage.notFoundTitle", null, "Không tìm thấy khóa học");
    const courseDescription = state.course
      ? (state.course.description || state.course.code || "")
      : t("courses.detailStudentPage.notFoundCopy", null, "Khóa học được yêu cầu không tồn tại hoặc bạn chưa được cấp quyền.");

    document.title = courseName + " - " + t("common.appName", null, "lms");
    $("[data-student-course-detail-name]").text(courseName);
    $("[data-student-course-detail-description]").text(courseDescription);
    $("[data-student-course-detail-focus-title]").text(courseName);
    $("[data-student-course-detail-focus-copy]").text(courseDescription || t("courses.detailStudentPage.loadingProgress", null, "Tiến độ của bạn sẽ hiển thị tại đây."));
    $("[data-student-course-detail-status]")
      .removeClass("is-current is-completed is-pending")
      .addClass(status.className)
      .text(status.text);

    renderCourseVisual();
  }

  function setProgressVisual(percent) {
    const target = clampProgress(percent);
    const $ring = $("[data-student-course-detail-progress-ring]");
    const $text = $("[data-student-course-detail-progress-text]");
    const $bar = $("[data-student-course-detail-progress-bar]");
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    $bar.css("width", target + "%");

    if (reduceMotion || !window.requestAnimationFrame) {
      $ring.css("--course-progress", target + "%");
      $text.text(target + "%");
      return;
    }

    const startedAt = window.performance && window.performance.now ? window.performance.now() : Date.now();
    const duration = 650;

    function step(now) {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);

      $ring.css("--course-progress", current + "%");
      $text.text(current + "%");

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }

  function renderMetrics() {
    const summary = getProgressSummary();
    const status = getCourseStatus(summary);
    const materialCountText = t(
      "courses.detailStudentPage.materialCount",
      { count: state.materials.length },
      state.materials.length + " tài liệu"
    );
    const examCountText = t(
      "courses.detailStudentPage.examCount",
      { count: state.courseExams.length },
      state.courseExams.length + " bài thi"
    );
    const completedText = summary.completedMaterials + "/" + summary.totalMaterials;

    $("[data-student-course-detail-metric='progress']").text(summary.progressPercent + "%");
    $("[data-student-course-detail-metric='completed']").text(completedText);
    $("[data-student-course-detail-metric='materials']").text(summary.totalMaterials);
    $("[data-student-course-detail-metric='exams']").text(state.courseExams.length);
    $("[data-student-course-detail-count='materials']").text(materialCountText);
    $("[data-student-course-detail-count='exams']").text(examCountText);
    $("[data-student-course-detail-chip='status']").text(status.text);
    $("[data-student-course-detail-chip='progress']").text(summary.progressPercent + "%");
    $("[data-student-course-detail-chip='materials']").text(completedText + " " + t("courses.detailStudentPage.materialChipSuffix", null, "tài liệu"));
    $("[data-student-course-detail-chip='exams']").text(examCountText);
    $("[data-student-course-detail-mini-stat='materials']").text(summary.totalMaterials);
    $("[data-student-course-detail-mini-stat='exams']").text(state.courseExams.length);
    $("[data-student-course-detail-side-stat='materials']").text(summary.totalMaterials);
    $("[data-student-course-detail-side-stat='exams']").text(state.courseExams.length);
    $("[data-student-course-detail-side-stat='completed']").text(summary.completedMaterials);
    $("[data-student-course-detail-side-stat='remaining']").text(summary.remainingMaterials);

    setProgressVisual(summary.progressPercent);
  }

  function getTypeIcon(contentType) {
    const icons = {
      Text: "bi-file-text",
      Pdf: "bi-filetype-pdf",
      File: "bi-file-earmark-arrow-down",
      Link: "bi-link-45deg",
      Image: "bi-image",
      Video: "bi-play-btn",
      Mixed: "bi-collection"
    };
    return icons[contentType] || "bi-file-earmark";
  }

  function getTypeClass(contentType) {
    const classes = {
      Text: "type-text",
      Pdf: "type-pdf",
      File: "type-file",
      Link: "type-link",
      Image: "type-image",
      Video: "type-video",
      Mixed: "type-mixed"
    };
    return classes[contentType] || "type-file";
  }

  function getTypeLabel(contentType) {
    const labels = {
      Text: t("materials.studentListPage.typeText", null, "Văn bản"),
      Pdf: t("materials.studentListPage.typePdf", null, "PDF"),
      File: t("materials.studentListPage.typeFile", null, "Tệp tin"),
      Link: t("materials.studentListPage.typeLink", null, "Liên kết"),
      Image: t("materials.studentListPage.typeImage", null, "Hình ảnh"),
      Video: t("materials.studentListPage.typeVideo", null, "Video"),
      Mixed: t("materials.studentListPage.typeMixed", null, "Tổng hợp")
    };
    return labels[contentType] || contentType || "--";
  }

  function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (!size) {
      return "";
    }
    if (size >= 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1).replace(/\.0$/, "") + " MB";
    }
    return Math.max(1, Math.round(size / 1024)) + " KB";
  }

  function formatDuration(minutes) {
    const value = Number(minutes || 0);
    if (value > 0) {
      return t("courses.detailStudentPage.durationMinutes", { minutes: value }, value + " phút");
    }
    return t("courses.detailStudentPage.durationMissing", null, "Chưa cập nhật");
  }

  function getMaterialDescription(material) {
    const fileSize = formatFileSize(material.fileSize);
    if (material.originalFileName) {
      return fileSize
        ? material.originalFileName + " · " + fileSize
        : material.originalFileName;
    }
    if (material.externalLink) {
      return material.externalLink;
    }
    if (material.hasFile) {
      return t("courses.detailStudentPage.materialHasFile", null, "Có tệp đính kèm từ học liệu.");
    }
    return t("courses.detailStudentPage.materialManagedCopy", null, "Nội dung học liệu được quản lý trong khóa học.");
  }

  function getTimelineState(material, index, currentIndex, boundedPercent, completed) {
    if (completed) {
      return {
        className: "is-completed",
        label: t("courses.detailStudentPage.materialCompleted", null, "Đã hoàn thành")
      };
    }
    if (currentIndex === index || boundedPercent > 0) {
      return {
        className: "is-current",
        label: t("courses.detailStudentPage.materialCurrent", null, "Current")
      };
    }
    if (currentIndex >= 0 && index > currentIndex) {
      return {
        className: "is-locked",
        label: t("courses.detailStudentPage.materialLocked", null, "Locked")
      };
    }
    return {
      className: "is-current",
      label: t("courses.detailStudentPage.materialNotStarted", null, "Chưa bắt đầu")
    };
  }

  function renderEmpty(container, icon, title, copy) {
    container.html(
      '<div class="student-course-detail-empty">' +
        '<span><i class="bi ' + escapeHtml(icon) + '" aria-hidden="true"></i></span>' +
        "<h3>" + escapeHtml(title) + "</h3>" +
        "<p>" + escapeHtml(copy) + "</p>" +
      "</div>"
    );
  }

  function renderMaterialAction(material, timelineState, completed) {
    if (timelineState.className === "is-locked") {
      return (
        '<span class="student-course-material-action is-locked" aria-disabled="true">' +
          escapeHtml(t("courses.detailStudentPage.lockedMaterial", null, "Chưa mở")) +
          '<i class="bi bi-lock" aria-hidden="true"></i>' +
        "</span>"
      );
    }

    const actionText = completed
      ? t("courses.detailStudentPage.reviewMaterial", null, "Xem lại")
      : t("courses.detailStudentPage.openMaterial", null, "Mở học liệu");

    return (
      '<a class="student-course-material-action" href="/LearningMaterials/Viewer/' + material.id + '">' +
        escapeHtml(actionText) +
        '<i class="bi bi-arrow-right" aria-hidden="true"></i>' +
      "</a>"
    );
  }

  function renderMaterials() {
    const $container = $("#studentCourseDetailMaterials").empty();
    const currentMaterial = getFirstIncompleteMaterial();
    const currentIndex = currentMaterial
      ? state.materials.findIndex(function (material) { return Number(material.id) === Number(currentMaterial.id); })
      : -1;

    if (!state.materials.length) {
      renderEmpty(
        $container,
        "bi-folder2-open",
        t("courses.detailStudentPage.noMaterialsTitle", null, "Chưa có tài liệu"),
        t("courses.detailStudentPage.noMaterialsCopy", null, "Tài liệu của khóa học sẽ hiển thị tại đây khi được công bố.")
      );
      return;
    }

    state.materials.forEach(function (material, index) {
      const progress = getMaterialProgress(material.id);
      const boundedPercent = clampProgress(progress && progress.progressPercent);
      const completed = Boolean(progress && progress.isCompleted);
      const timelineState = getTimelineState(material, index, currentIndex, boundedPercent, completed);
      const step = String(index + 1).padStart(2, "0");

      $container.append(
        '<article class="student-course-material-row student-course-reveal ' + timelineState.className + '" data-student-course-reveal>' +
          '<div class="student-course-material-step"><span>' + step + "</span></div>" +
          '<div class="student-course-material-icon ' + getTypeClass(material.contentType) + '">' +
            '<i class="bi ' + getTypeIcon(material.contentType) + '" aria-hidden="true"></i>' +
          "</div>" +
          '<div class="student-course-material-main">' +
            '<div class="student-course-material-title-row">' +
              "<h3>" + escapeHtml(material.title) + "</h3>" +
              '<span class="student-course-material-badge">' + escapeHtml(getTypeLabel(material.contentType)) + "</span>" +
            "</div>" +
            '<p>' + escapeHtml(getMaterialDescription(material)) + "</p>" +
            '<div class="student-course-material-meta">' +
              '<span><small>' + escapeHtml(t("courses.detailStudentPage.metaType", null, "Loại")) + '</small><strong>' + escapeHtml(getTypeLabel(material.contentType)) + "</strong></span>" +
              '<span><small>' + escapeHtml(t("courses.detailStudentPage.metaDuration", null, "Thời lượng")) + '</small><strong>' + escapeHtml(formatDuration(material.durationMinutes)) + "</strong></span>" +
              '<span><small>' + escapeHtml(t("courses.detailStudentPage.metaProgress", null, "Progress")) + '</small><strong>' + boundedPercent + "%</strong></span>" +
            "</div>" +
          "</div>" +
          '<div class="student-course-material-side">' +
            '<span class="student-course-material-status ' + timelineState.className + '">' + escapeHtml(timelineState.label) + "</span>" +
            '<div class="student-course-material-progress"><span style="width:' + boundedPercent + '%"></span></div>' +
            renderMaterialAction(material, timelineState, completed) +
          "</div>" +
        "</article>"
      );
    });
  }

  function render() {
    renderHeader();
    renderMetrics();
    renderMaterials();
    setPrimaryLink();
    initReveal();
  }

  function renderLoadError(message) {
    const errorHtml =
      '<div class="student-course-detail-empty">' +
        '<span><i class="bi bi-exclamation-circle" aria-hidden="true"></i></span>' +
        "<h3>" + escapeHtml(t("courses.detailStudentPage.loadErrorTitle", null, "Không thể tải khóa học")) + "</h3>" +
        "<p>" + escapeHtml(message || t("courses.detailStudentPage.loadErrorCopy", null, "Vui lòng kiểm tra kết nối API và quyền truy cập khóa học.")) + "</p>" +
      "</div>";

    $("#studentCourseDetailMaterials").html(errorHtml);
  }

  function initReveal() {
    const $items = $("[data-student-course-reveal]").not("[data-student-course-reveal-ready]");
    if (!$items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      $items.addClass("is-visible").attr("data-student-course-reveal-ready", "true");
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        $(entry.target).addClass("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    $items.each(function (index) {
      this.style.setProperty("--reveal-delay", Math.min(index * 50, 350) + "ms");
      $(this).attr("data-student-course-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function loadPageData() {
    state.courseId = Number($("[data-student-course-detail-id]").data("student-course-detail-id"));

    $.when(
      Lms.apiClient.get("api/courses/" + state.courseId),
      Lms.apiClient.get("api/learning-materials?page=1&pageSize=500&courseId=" + state.courseId),
      Lms.apiClient.get("api/courses/" + state.courseId + "/progress"),
      Lms.apiClient.get("api/courses/" + state.courseId + "/exams")
    ).done(function (courseResponse, materialsResponse, progressResponse, courseExamsResponse) {
      state.course = getData(courseResponse);
      state.materials = getItems(materialsResponse).sort(function (a, b) {
        return Number(a.order || 0) - Number(b.order || 0);
      });
      state.progress = getData(progressResponse);
      state.courseExams = getItems(courseExamsResponse).sort(function (a, b) {
        return Number(a.order || 0) - Number(b.order || 0);
      });
      render();
    }).fail(function (error) {
      const message = error && error.message ? error.message : null;
      renderLoadError(message);
      showToast(
        "error",
        t("courses.detailStudentPage.dataErrorTitle", null, "Lỗi dữ liệu khóa học"),
        message || t("courses.detailStudentPage.dataErrorMessage", null, "Không thể tải dữ liệu chi tiết khóa học từ backend.")
      );
    });
  }

  function init() {
    initReveal();
    $(document).on("lms:i18n:changed", render);

    if (Lms.i18n && Lms.i18n.ready) {
      Lms.i18n.ready.always(loadPageData);
      return;
    }

    loadPageData();
  }

  $(init);
})(window, jQuery);
