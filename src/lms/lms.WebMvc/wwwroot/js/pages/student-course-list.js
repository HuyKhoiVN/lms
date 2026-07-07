(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const state = {
    courses: [],
    filteredCourses: [],
    tab: "",
    sort: "default",
    page: 1,
    pageSize: 3
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

  function getCourseState(course) {
    const progress = Number(course.completionRate || 0);
    if (progress >= 100) {
      return "completed";
    }
    if (progress > 0) {
      return "active";
    }
    return "not-started";
  }

  function getStatusLabel(course) {
    const courseState = getCourseState(course);
    if (courseState === "completed") {
      return "Đã hoàn thành";
    }
    if (courseState === "active") {
      return "Đang học";
    }
    return "Chưa bắt đầu";
  }

  function getStatusClass(course) {
    return "student-course-status-" + getCourseState(course);
  }

  function setProgress($element, value) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    $element.css("width", safeValue + "%");
  }

  function renderMetrics() {
    const total = state.courses.length;
    const active = state.courses.filter(function (course) {
      return getCourseState(course) === "active";
    }).length;
    const completed = state.courses.filter(function (course) {
      return getCourseState(course) === "completed";
    }).length;
    const completion = total
      ? Math.round(state.courses.reduce(function (sum, course) {
        return sum + Number(course.completionRate || 0);
      }, 0) / total)
      : 0;

    $("[data-student-course-metric='total']").text(total);
    $("[data-student-course-metric='active']").text(active);
    $("[data-student-course-metric='completed']").text(completed);
    $("[data-student-course-metric='completion']").text(completion + "%");
  }

  function emptyMarkup() {
    return (
      '<div class="student-course-empty">' +
        '<i class="bi bi-search" aria-hidden="true"></i>' +
        "<h3>" + escapeHtml(t("courses.listPage.noCoursesTitle", null, "Không tìm thấy khóa học")) + "</h3>" +
        "<p>" + escapeHtml(t("courses.listPage.noCoursesCopy", null, "Thử đổi trạng thái hoặc sắp xếp để xem kết quả phù hợp hơn.")) + "</p>" +
      "</div>"
    );
  }

  function getVisibleCourses() {
    const start = (state.page - 1) * state.pageSize;
    return state.filteredCourses.slice(start, start + state.pageSize);
  }

  function renderPagination() {
    const total = state.filteredCourses.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const from = total ? ((state.page - 1) * state.pageSize) + 1 : 0;
    const to = total ? Math.min(total, state.page * state.pageSize) : 0;

    $("[data-student-course-page-summary]").text(
      total
        ? "Hiển thị " + from + "-" + to + " trong " + total + " khóa học"
        : "Hiển thị 0 khóa học"
    );
    $("[data-student-course-page-indicator]").text(state.page + " / " + totalPages);
    $("[data-student-course-page='prev']").prop("disabled", state.page <= 1);
    $("[data-student-course-page='next']").prop("disabled", state.page >= totalPages);
  }

  function renderCourses() {
    const $grid = $("#studentCourseGrid").empty();
    const visibleCourses = getVisibleCourses();

    if (!state.filteredCourses.length) {
      $grid.html(emptyMarkup());
      renderPagination();
      initReveal();
      return;
    }

    visibleCourses.forEach(function (course, index) {
      const progress = Math.max(0, Math.min(100, Number(course.completionRate) || 0));
      const completedMaterials = Number(course.completedMaterials || 0);
      const materialCount = Number(course.materialCount || 0);
      const actionLabel = progress > 0 ? "Tiếp tục học" : "Mở khóa học";
      const imageIndex = ((state.page - 1) * state.pageSize) + index;
      const $card = $(
        '<article class="student-course-row-card student-course-reveal" data-student-course-reveal>' +
          '<a class="student-course-row-media" href="/Courses/Detail/' + course.id + '">' +
            '<img src="' + escapeHtml(getCourseImage(course, imageIndex)) + '" alt="' + escapeHtml(course.name) + '" loading="lazy" data-course-image="' + imageIndex + '" />' +
          "</a>" +
          '<div class="student-course-row-body">' +
            '<span class="student-course-category">' + escapeHtml(getInitials(course.name)) + "</span>" +
            '<h3><a href="/Courses/Detail/' + course.id + '">' + escapeHtml(course.name) + "</a></h3>" +
            '<p>' + escapeHtml(course.description || "Khóa học được giao trong hệ thống LMS.") + "</p>" +
            '<div class="student-course-row-meta">' +
              '<span><i class="bi bi-file-earmark" aria-hidden="true"></i>' + escapeHtml(course.code || "LMS") + "</span>" +
              '<span><i class="bi bi-book" aria-hidden="true"></i>' + materialCount + " tài liệu</span>" +
              '<span><i class="bi bi-check2-circle" aria-hidden="true"></i>' + completedMaterials + "/" + materialCount + " bài học</span>" +
            "</div>" +
          "</div>" +
          '<aside class="student-course-progress-panel">' +
            '<span class="student-course-status ' + getStatusClass(course) + '">' + escapeHtml(getStatusLabel(course)) + "</span>" +
            '<div class="student-course-progress-copy"><span>Tiến độ</span><strong>' + progress + "%</strong></div>" +
            '<div class="lms-progress-track"><span></span></div>' +
            '<small>' + completedMaterials + "/" + materialCount + " bài học</small>" +
            '<a class="student-course-action" href="/Courses/Detail/' + course.id + '">' + actionLabel + "</a>" +
          "</aside>" +
        "</article>"
      );

      setProgress($card.find(".lms-progress-track span"), progress);
      $card.find("[data-course-image]").on("error", function () {
        $(this).attr("src", getCourseImage(null, imageIndex));
      });
      $grid.append($card);
    });

    renderPagination();
    initReveal();
  }

  function sortCourses(courses) {
    const sorted = courses.slice();
    if (state.sort === "progress-desc") {
      sorted.sort(function (a, b) {
        return Number(b.completionRate || 0) - Number(a.completionRate || 0);
      });
    }
    if (state.sort === "name-asc") {
      sorted.sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
    }
    return sorted;
  }

  function applyFilters(resetPage) {
    state.filteredCourses = sortCourses(state.courses.filter(function (course) {
      return !state.tab || getCourseState(course) === state.tab;
    }));

    if (resetPage) {
      state.page = 1;
    }

    const totalPages = Math.max(1, Math.ceil(state.filteredCourses.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    renderCourses();
  }

  function render() {
    renderPageTitle();
    renderMetrics();
    applyFilters(false);
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
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    });

    $items.each(function (index) {
      this.style.setProperty("--reveal-delay", Math.min(index * 45, 180) + "ms");
      $(this).attr("data-student-course-reveal-ready", "true");
      observer.observe(this);
    });
  }

  function bindEvents() {
    $(document).on("click", "[data-student-course-tab]", function () {
      const $tab = $(this);
      state.tab = $tab.data("student-course-tab") || "";
      $("[data-student-course-tab]").removeClass("is-active").attr("aria-selected", "false");
      $tab.addClass("is-active").attr("aria-selected", "true");
      applyFilters(true);
    });

    $("[data-student-course-filter='sort']").on("change", function () {
      state.sort = $(this).val() || "default";
      applyFilters(true);
    });

    $(document).on("click", "[data-student-course-action='clear-filters']", function () {
      state.tab = "";
      state.sort = "default";
      $("[data-student-course-tab]").removeClass("is-active").attr("aria-selected", "false");
      $("[data-student-course-tab='']").addClass("is-active").attr("aria-selected", "true");
      $("[data-student-course-filter='sort']").val("default");
      applyFilters(true);
    });

    $(document).on("click", "[data-student-course-page]", function () {
      const direction = $(this).data("student-course-page");
      const totalPages = Math.max(1, Math.ceil(state.filteredCourses.length / state.pageSize));
      if (direction === "prev" && state.page > 1) {
        state.page -= 1;
      }
      if (direction === "next" && state.page < totalPages) {
        state.page += 1;
      }
      renderCourses();
    });

    $(document).on("lms:i18n:changed", render);
  }

  function loadProgressForCourses(courses, materials, progressItems) {
    const requests = courses.map(function (course) {
      return Lms.apiClient.get("api/courses/" + course.id + "/progress").then(function (response) {
        const data = getData(response) || {};
        const totalMaterials = Number(data.totalMaterials || materials.filter(function (item) {
          return Number(item.courseId) === course.id;
        }).length);
        const completedMaterials = Number(data.completedMaterials || 0);

        course.materialCount = totalMaterials;
        course.completedMaterials = completedMaterials;
        course.completionRate = Math.round(Number(data.overallPercent || 0));
      }, function () {
        const courseMaterials = materials.filter(function (item) {
          return Number(item.courseId) === course.id;
        });
        const courseProgress = progressItems.filter(function (item) {
          return Number(item.courseId) === course.id;
        });

        course.materialCount = courseMaterials.length;
        course.completedMaterials = courseProgress.filter(function (item) {
          return Boolean(item.isCompleted);
        }).length;
        course.completionRate = course.materialCount
          ? Math.round((course.completedMaterials / course.materialCount) * 100)
          : 0;
      });
    });

    return requests.length ? $.when.apply($, requests) : $.Deferred().resolve().promise();
  }

  function init() {
    bindEvents();
    initReveal();
    renderPageTitle();

    $.when(
      Lms.apiClient.get("api/courses?page=1&pageSize=200"),
      Lms.apiClient.get("api/learning-materials?page=1&pageSize=500"),
      Lms.apiClient.get("api/learning-progress/my?page=1&pageSize=500")
    ).done(function (coursesResponse, materialsResponse, progressResponse) {
      const materials = getItems(materialsResponse);
      const progressItems = getItems(progressResponse);

      state.courses = getItems(coursesResponse).map(function (item) {
        return {
          id: Number(item.id),
          name: item.name || "",
          description: item.description || "",
          code: item.code || "",
          thumbnailUrl: item.thumbnailUrl || "",
          thumbnailContentType: item.thumbnailContentType || "",
          thumbnailOriginalFileName: item.thumbnailOriginalFileName || "",
          status: item.isPublished ? "Published" : "Draft",
          materialCount: 0,
          completedMaterials: 0,
          completionRate: 0
        };
      });

      loadProgressForCourses(state.courses, materials, progressItems).always(function () {
        state.filteredCourses = state.courses.slice();
        render();
      });
    }).fail(function (error) {
      $("#studentCourseGrid").html(emptyMarkup());
      renderPagination();
      showToast(
        "error",
        t("courses.listPage.dataErrorTitle", null, "Lỗi dữ liệu khóa học"),
        error && error.message
          ? error.message
          : t("courses.listPage.dataErrorMessage", null, "Không thể tải dữ liệu danh sách khóa học từ backend.")
      );
    });
  }

  $(init);
})(window, jQuery);
