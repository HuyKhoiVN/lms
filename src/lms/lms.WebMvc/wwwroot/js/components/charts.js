(function (window, $) {
  "use strict";

  const Lms = window.Lms || {};
  const chartInstances = {};

  function getCanvas($target) {
    const id = $target.attr("id") || ("chart-" + Math.random().toString(36).slice(2));
    $target.attr("id", id).empty().addClass("app-chart-shell");
    const $canvas = $('<canvas aria-hidden="true"></canvas>');
    $target.append($canvas);
    return $canvas[0];
  }

  function destroyExisting(id) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }
  }

  function renderFallbackBars(selector, items, options) {
    const settings = {
      valueKey: "value",
      labelKey: "label",
      maxHeight: 132,
      ...options
    };
    const $chart = $(selector).empty().addClass("app-chart-fallback admin-bar-chart");
    const maxValue = Math.max.apply(null, items.map(function (item) {
      return Number(item[settings.valueKey]) || 0;
    }).concat([1]));

    items.forEach(function (item) {
      const value = Number(item[settings.valueKey]) || 0;
      const height = Math.max(12, Math.round((value / maxValue) * settings.maxHeight));
      const label = String(item[settings.labelKey] || "");
      const $bar = $(
        '<div class="admin-bar-item">' +
          '<div class="admin-bar"></div>' +
          '<span></span>' +
        '</div>'
      );

      $bar.find(".admin-bar").attr("title", value).css("--bar-height", height + "px");
      $bar.find("span").text(label);
      $chart.append($bar);
    });
  }

  function renderBar(selector, items, options) {
    const settings = {
      valueKey: "attempts",
      labelKey: "date",
      labelFormat: function (value) {
        return String(value).slice(5);
      },
      color: "#635bff",
      ...options
    };
    const $target = $(selector);

    if (!$target.length) {
      return;
    }

    if (!window.Chart) {
      renderFallbackBars(selector, items.map(function (item) {
        return {
          label: settings.labelFormat(item[settings.labelKey]),
          value: item[settings.valueKey]
        };
      }), { valueKey: "value", labelKey: "label" });
      return;
    }

    const canvas = getCanvas($target);
    const id = $target.attr("id");
    destroyExisting(id);
    chartInstances[id] = new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: items.map(function (item) {
          return settings.labelFormat(item[settings.labelKey]);
        }),
        datasets: [{
          data: items.map(function (item) {
            return item[settings.valueKey];
          }),
          backgroundColor: settings.color,
          borderRadius: 10,
          maxBarThickness: 34
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: "rgba(102, 112, 133, 0.12)" } }
        }
      }
    });
  }

  function renderDoughnut(selector, value, options) {
    const settings = {
      color: "#16a34a",
      trackColor: "#edf0f7",
      ...options
    };
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    const $target = $(selector);

    if (!$target.length) {
      return;
    }

    $target.css("--donut-value", safeValue);

    if (!window.Chart) {
      return;
    }

    const canvas = getCanvas($target);
    const id = $target.attr("id");
    destroyExisting(id);
    chartInstances[id] = new window.Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Value", "Remaining"],
        datasets: [{
          data: [safeValue, 100 - safeValue],
          backgroundColor: [settings.color, settings.trackColor],
          borderWidth: 0
        }]
      },
      options: {
        cutout: "72%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  }

  function renderDistribution(selector, items) {
    const total = items.reduce(function (sum, item) {
      return sum + Number(item.count || 0);
    }, 0) || 1;
    const $chart = $(selector).empty().addClass("app-chart-fallback admin-distribution");

    items.forEach(function (item) {
      const width = Math.round((Number(item.count || 0) / total) * 100);
      const $row = $(
        '<div class="admin-distribution-row">' +
          '<span></span>' +
          '<div class="progress-track"><div class="progress-fill"></div></div>' +
          '<strong></strong>' +
        '</div>'
      );

      $row.find("span").text(item.range);
      $row.find(".progress-fill").css("--progress-width", width + "%").css("width", width + "%");
      $row.find("strong").text(item.count);
      $chart.append($row);
    });
  }

  Lms.charts = {
    renderBar,
    renderDoughnut,
    renderDistribution
  };

  window.Lms = Lms;
})(window, jQuery);
