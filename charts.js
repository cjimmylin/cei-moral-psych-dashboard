/* charts.js — ECharts option builders for Moral Psychology Benchmarks Dashboard
 *
 * Each function: echarts.init(el) -> setOption(...) -> return chart instance
 * Uses Okabe-Ito colorblind-safe palette from DATA.palette
 */

// Shared dark theme defaults
const DARK_TEXT = '#c8d0e8';
const DARK_BG = 'transparent';
const GRID_LINE = 'rgba(200,208,232,0.12)';

function baseTheme() {
  return {
    textStyle: { color: DARK_TEXT, fontFamily: 'Inter, sans-serif' },
    backgroundColor: DARK_BG,
    toolbox: {
      show: true,
      right: 10,
      top: 0,
      iconStyle: { borderColor: 'rgba(200,208,232,0.35)' },
      emphasis: { iconStyle: { borderColor: '#56B4E9' } },
      feature: {
        saveAsImage: {
          show: true,
          title: 'Save',
          pixelRatio: 2,
          backgroundColor: '#0f0f1a'
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Tab 1: Overview
// ---------------------------------------------------------------------------

function chartCompositeBar(el) {
  const chart = echarts.init(el);
  const d = DATA.compositeBar;
  const palette = DATA.palette;

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        let tip = '<b>' + params[0].name + '</b><br/>';
        params.forEach(function (p) {
          tip += p.marker + ' ' + p.seriesName + ': ' + p.value + '<br/>';
        });
        return tip;
      }
    },
    legend: {
      data: ['PD (Psychometric Depth)', 'PE (Practical Evaluation)', 'CI (Community Impact)'],
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 280, right: 40, top: 20, bottom: 50 },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    yAxis: {
      type: 'category',
      data: d.names,
      axisLabel: { color: DARK_TEXT, fontSize: 11, width: 260, overflow: 'truncate' }
    },
    series: [
      {
        name: 'PD (Psychometric Depth)',
        type: 'bar',
        stack: 'score',
        data: d.PD,
        itemStyle: { color: palette[0] },
        barMaxWidth: 20
      },
      {
        name: 'PE (Practical Evaluation)',
        type: 'bar',
        stack: 'score',
        data: d.PE,
        itemStyle: { color: palette[1] }
      },
      {
        name: 'CI (Community Impact)',
        type: 'bar',
        stack: 'score',
        data: d.CI,
        itemStyle: { color: palette[2] }
      }
    ]
  }));
  return chart;
}


function chartTheoryPie(el) {
  const chart = echarts.init(el);
  const d = DATA.theoryPie;

  var pieData = d.labels.map(function (label, i) {
    return { value: d.values[i], name: label, itemStyle: { color: d.colors[i] } };
  });

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      textStyle: { color: DARK_TEXT, fontSize: 11 }
    },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 13, fontWeight: 'bold', color: DARK_TEXT }
      },
      data: pieData
    }]
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 3: Theory Heatmap
// ---------------------------------------------------------------------------

function chartHeatmap(el) {
  const chart = echarts.init(el);
  const d = DATA.theoryHeatmap;

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      position: 'top',
      formatter: function (p) {
        return d.benchmarkNames[p.value[0]] + '<br/>' +
               d.theoryNames[p.value[1]] + ': ' + p.value[2];
      }
    },
    grid: { left: 100, right: 80, top: 10, bottom: 140 },
    xAxis: {
      type: 'category',
      data: d.benchmarkNames,
      axisLabel: { color: DARK_TEXT, fontSize: 10, rotate: 45, interval: 0 },
      splitArea: { show: true, areaStyle: { color: ['rgba(200,208,232,0.04)', 'rgba(200,208,232,0.02)'] } }
    },
    yAxis: {
      type: 'category',
      data: d.theoryNames,
      axisLabel: { color: DARK_TEXT, fontSize: 11 },
      splitArea: { show: true, areaStyle: { color: ['rgba(200,208,232,0.04)', 'rgba(200,208,232,0.02)'] } }
    },
    visualMap: {
      min: 0,
      max: d.maxVal,
      calculable: true,
      orient: 'vertical',
      right: 10,
      top: 'center',
      inRange: { color: ['#1a1a2e', '#0072B2', '#56B4E9', '#E69F00'] },
      textStyle: { color: DARK_TEXT }
    },
    series: [{
      type: 'heatmap',
      data: d.data,
      label: {
        show: true,
        formatter: function (p) { return p.value[2] > 0 ? p.value[2] : ''; },
        color: DARK_TEXT,
        fontSize: 10
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
    }]
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 4: Implementation Grid
// ---------------------------------------------------------------------------

function chartImplementation(el) {
  const chart = echarts.init(el);
  const d = DATA.implementationGrid;

  // Status: READY=4, IMPLEMENTED=3, POSSIBLE=2, BARRIERS=1, NOT_FEASIBLE=0, N_A=-1
  var statusColors = {
    4: '#009E73',   // green - READY
    3: '#56B4E9',   // blue - IMPLEMENTED
    2: '#E69F00',   // yellow - POSSIBLE
    1: '#D55E00',   // orange - BARRIERS
    0: '#CC79A7',   // red-pink - NOT_FEASIBLE
    '-1': '#444455' // grey - N/A
  };

  var statusLabels = {
    4: 'READY', 3: 'IMPLEMENTED', 2: 'POSSIBLE',
    1: 'BARRIERS', 0: 'NOT FEASIBLE', '-1': 'N/A'
  };

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      position: 'top',
      formatter: function (p) {
        var val = p.value;
        return d.benchmarkNames[val[0]] + '<br/>' +
               d.harnessLabels[val[1]] + ': ' +
               (val[3] || statusLabels[val[2]] || 'N/A');
      }
    },
    grid: { left: 100, right: 20, top: 10, bottom: 140 },
    xAxis: {
      type: 'category',
      data: d.benchmarkNames,
      axisLabel: { color: DARK_TEXT, fontSize: 10, rotate: 45, interval: 0 }
    },
    yAxis: {
      type: 'category',
      data: d.harnessLabels,
      axisLabel: { color: DARK_TEXT, fontSize: 11 }
    },
    series: [{
      type: 'heatmap',
      data: d.data.map(function (item) {
        return {
          value: [item[0], item[1], item[2]],
          itemStyle: { color: statusColors[item[2]] || '#444455' },
          label: { show: true, formatter: item[3] || '', color: '#fff', fontSize: 9 }
        };
      }),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
    }],
    visualMap: { show: false, min: -1, max: 4 }
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 5: Trials (conditional charts)
// ---------------------------------------------------------------------------

function chartTrialBars(el) {
  var chart = echarts.init(el);

  var cv = DATA.crossVendor;
  if (!cv || !cv.available || !cv.trialTable || cv.trialTable.length === 0) {
    var td = DATA.trialData;
    if (!td || !td.available) {
      chart.setOption(Object.assign(baseTheme(), {
        title: { text: 'Trials pending', left: 'center', top: 'center',
                 textStyle: { color: '#999', fontSize: 16 } }
      }));
      return chart;
    }
  }

  var rows = cv.trialTable;
  var modelKeys = cv.modelKeys || ['anthropic_opus'];
  var modelNames = cv.models || ['Opus'];
  var modelColors = cv.modelColors || ['#7C3AED'];

  // Build model selector dropdown above the chart
  var selectEl = document.getElementById('trial-bars-model-select');
  if (selectEl && selectEl.options.length === 0) {
    modelNames.forEach(function (name, i) {
      var opt = document.createElement('option');
      opt.value = modelKeys[i];
      opt.textContent = name;
      opt.style.color = modelColors[i];
      selectEl.appendChild(opt);
    });
  }

  function renderBars(selectedKey) {
    var idx = modelKeys.indexOf(selectedKey);
    var selectedName = idx >= 0 ? modelNames[idx] : selectedKey;
    var selectedColor = idx >= 0 ? modelColors[idx] : '#7C3AED';
    var names = [];
    var values = [];
    var palette = DATA.palette;

    rows.forEach(function (r) {
      var v = parseFloat(r.values[selectedKey]);
      if (!isNaN(v)) {
        names.push(r.benchmark.length > 20 ? r.benchmark.substring(0, 18) + '..' : r.benchmark);
        values.push(v);
      }
    });

    chart.setOption(Object.assign(baseTheme(), {
      title: { text: 'Primary Metric by Benchmark (' + selectedName + ')', left: 'center', textStyle: { color: DARK_TEXT, fontSize: 14 } },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function (params) {
          var di = params[0].dataIndex;
          var row = rows[di];
          return '<b>' + row.benchmark + '</b><br/>Metric: ' + row.metric + '<br/>Value: ' + params[0].value;
        }
      },
      grid: { left: 140, right: 40, top: 40, bottom: 30 },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { color: DARK_TEXT, fontSize: 10 }
      },
      xAxis: {
        type: 'value',
        axisLabel: { color: DARK_TEXT },
        splitLine: { lineStyle: { color: GRID_LINE } }
      },
      series: [{
        type: 'bar',
        data: values.map(function (v, i) {
          return { value: v, itemStyle: { color: palette[i % palette.length] } };
        }),
        barMaxWidth: 18,
        label: { show: true, position: 'right', color: DARK_TEXT, fontSize: 10, formatter: function (p) { return p.value; } }
      }]
    }), true);
  }

  // Initial render with first model (Opus)
  renderBars(modelKeys[0]);

  // Wire up dropdown
  if (selectEl) {
    selectEl.addEventListener('change', function () {
      renderBars(this.value);
    });
  }

  return chart;
}


function chartMFQRadar(el) {
  var chart = echarts.init(el);
  var d = DATA.trialResults;
  if (!d || !d.available || !d.moralRadar) {
    chart.setOption(Object.assign(baseTheme(), {
      title: { text: 'MFQ-30 Radar -- awaiting trial data', left: 'center', top: 'center',
               textStyle: { color: '#999', fontSize: 14 } }
    }));
    return chart;
  }

  // Extract MFT foundations from the 15-dimension moral radar
  var mr = d.moralRadar;
  var mftDims = ['Care', 'Fairness', 'Loyalty', 'Authority', 'Purity'];
  var claudeVals = [];
  var humanVals = [];

  mftDims.forEach(function (dim) {
    var idx = mr.dimensions.indexOf(dim);
    claudeVals.push(idx >= 0 ? mr.claudeValues[idx] : 0);
    humanVals.push(idx >= 0 && mr.humanBaselines ? mr.humanBaselines[idx] : 0);
  });

  var palette = DATA.palette;
  chart.setOption(Object.assign(baseTheme(), {
    title: { text: 'MFQ-30 Foundation Radar', left: 'center', textStyle: { color: DARK_TEXT, fontSize: 14 } },
    tooltip: { trigger: 'item' },
    legend: {
      data: ['Claude', 'Human Baseline'],
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    radar: {
      indicator: mftDims.map(function (d) { return { name: d, max: 100 }; }),
      axisName: { color: DARK_TEXT, fontSize: 12 },
      splitArea: { areaStyle: { color: ['rgba(200,208,232,0.02)', 'rgba(200,208,232,0.05)'] } },
      splitLine: { lineStyle: { color: GRID_LINE } },
      axisLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [{
      type: 'radar',
      data: [
        { value: claudeVals, name: 'Claude', lineStyle: { color: palette[4], width: 2 }, areaStyle: { color: 'rgba(0,114,178,0.15)' }, itemStyle: { color: palette[4] } },
        { value: humanVals, name: 'Human Baseline', lineStyle: { color: palette[0], width: 2, type: 'dashed' }, areaStyle: { color: 'rgba(230,159,0,0.08)' }, itemStyle: { color: palette[0] } }
      ]
    }]
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 9a: Feature Structure
// ---------------------------------------------------------------------------

function chartScreePlot(el) {
  const chart = echarts.init(el);
  const d = DATA.screeData;
  const palette = DATA.palette;

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        var tip = '<b>Component ' + (params[0].dataIndex + 1) + '</b><br/>';
        params.forEach(function (p) {
          tip += p.marker + ' ' + p.seriesName + ': ' + p.value.toFixed(2) + '<br/>';
        });
        return tip;
      }
    },
    legend: {
      data: ['Eigenvalue', 'Parallel Analysis Threshold'],
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 60, right: 40, top: 40, bottom: 60 },
    xAxis: {
      type: 'category',
      data: d.components,
      name: 'Component',
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT }
    },
    yAxis: {
      type: 'value',
      name: 'Eigenvalue',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [
      {
        name: 'Eigenvalue',
        type: 'line',
        data: d.eigenvalues,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: palette[1] },
        itemStyle: { color: palette[1] },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ xAxis: d.suggestedFactors - 1, lineStyle: { color: palette[5], type: 'dashed', width: 2 } }],
          label: { formatter: d.suggestedFactors + '-factor', color: palette[5], fontSize: 11 }
        }
      },
      {
        name: 'Parallel Analysis Threshold',
        type: 'line',
        data: d.parallelThreshold,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 2, type: 'dashed', color: palette[6] },
        itemStyle: { color: palette[6] }
      }
    ]
  }));
  return chart;
}


function chartFeatureImportance(el) {
  const chart = echarts.init(el);
  const d = DATA.featureImportance;
  const tierColors = { D: '#E69F00', E: '#56B4E9', F: '#009E73', G: '#0072B2' };

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        var p = params[0];
        var item = d.features[p.dataIndex];
        return '<b>' + item.name + '</b> (Tier ' + item.tier + ')<br/>' +
               'Variance: ' + item.variance.toFixed(1) + '<br/>' +
               'Mean: ' + item.mean.toFixed(1);
      }
    },
    grid: { left: 60, right: 40, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: d.features.map(function (f) { return f.name; }),
      axisLabel: { color: DARK_TEXT, fontSize: 10, rotate: 45 }
    },
    yAxis: {
      type: 'value',
      name: 'Variance',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [{
      type: 'bar',
      data: d.features.map(function (f) {
        return {
          value: f.variance,
          itemStyle: { color: tierColors[f.tier] || '#999' }
        };
      }),
      barMaxWidth: 28
    }]
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 9b: Benchmark Landscape
// ---------------------------------------------------------------------------

function chartUMAP(el) {
  const chart = echarts.init(el);
  const d = DATA.umapData;
  var clusterColors = [DATA.palette[0], DATA.palette[1], DATA.palette[2], DATA.palette[4], DATA.palette[5]];
  var clusterNames = d.clusterLabels || ['Cluster 0', 'Cluster 1', 'Cluster 2'];

  var seriesMap = {};
  d.points.forEach(function (p) {
    var cl = p[3];
    if (!seriesMap[cl]) seriesMap[cl] = [];
    seriesMap[cl].push(p);
  });

  var series = Object.keys(seriesMap).sort().map(function (cl) {
    var idx = parseInt(cl);
    return {
      name: clusterNames[idx] || ('Cluster ' + cl),
      type: 'scatter',
      data: seriesMap[cl].map(function (p) {
        // Scale symbol size by composite score (min 8, max 30)
        var sz = Math.max(8, Math.min(30, (p[4] / 80) * 25));
        return {
          value: [p[0], p[1]],
          symbolSize: sz,
          name: p[2]
        };
      }),
      itemStyle: { color: clusterColors[idx % clusterColors.length] },
      emphasis: { label: { show: true, formatter: function (p) { return p.data.name; }, color: DARK_TEXT, fontSize: 11 } }
    };
  });

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      formatter: function (params) {
        return '<b>' + params.data.name + '</b><br/>' +
               'Cluster: ' + params.seriesName + '<br/>' +
               'UMAP: (' + params.value[0].toFixed(2) + ', ' + params.value[1].toFixed(2) + ')';
      }
    },
    legend: {
      data: clusterNames,
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 60, right: 40, top: 20, bottom: 50 },
    xAxis: {
      type: 'value',
      name: 'UMAP-1',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    yAxis: {
      type: 'value',
      name: 'UMAP-2',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: series
  }));
  return chart;
}


function chartTreemap(el) {
  const chart = echarts.init(el);
  const d = DATA.treemapData;

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      formatter: function (p) {
        return '<b>' + p.name + '</b><br/>' +
               'Benchmarks: ' + p.value;
      }
    },
    series: [{
      type: 'treemap',
      data: d.children,
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      label: {
        show: true,
        formatter: '{b}\n{c}',
        fontSize: 12,
        color: '#fff',
        fontWeight: 500
      },
      itemStyle: { borderColor: '#1a1a2e', borderWidth: 2, gapWidth: 2 },
      levels: [{
        itemStyle: { borderColor: '#1a1a2e', borderWidth: 3, gapWidth: 3 }
      }]
    }]
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 9c: Temporal Trends
// ---------------------------------------------------------------------------

function chartTemporal(el) {
  const chart = echarts.init(el);
  const d = DATA.temporalData;
  const palette = DATA.palette;

  var seriesNames = ['Construct Validity (A6)', 'D Mean', 'E Mean', 'Composite'];
  var seriesKeys = ['A6_mean', 'D_mean', 'E_mean', 'composite_mean'];
  var seriesColors = [palette[0], palette[1], palette[2], palette[4]];

  var series = seriesKeys.map(function (key, i) {
    return {
      name: seriesNames[i],
      type: 'line',
      data: d.years.map(function (y) { return d.values[y] ? d.values[y][key] : null; }),
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: seriesColors[i] },
      itemStyle: { color: seriesColors[i] },
      connectNulls: true
    };
  });

  // Add RLHF inflection mark line
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: { trigger: 'axis' },
    legend: {
      data: seriesNames,
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 60, right: 40, top: 30, bottom: 60 },
    xAxis: {
      type: 'category',
      data: d.years,
      axisLabel: { color: DARK_TEXT },
      axisLine: { lineStyle: { color: GRID_LINE } }
    },
    yAxis: {
      type: 'value',
      name: 'Score',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: series.concat([{
      type: 'line',
      data: [],
      markLine: {
        silent: true,
        symbol: 'none',
        data: [{ xAxis: '2022', lineStyle: { color: palette[5], type: 'dashed', width: 2 } }],
        label: { formatter: 'RLHF era', color: palette[5], fontSize: 11 }
      }
    }])
  }));
  return chart;
}


function chartRLHF(el) {
  const chart = echarts.init(el);
  const d = DATA.rlhfComparison;
  const palette = DATA.palette;

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Pre-2022 (n=' + d.preCount + ')', 'Post-2022 (n=' + d.postCount + ')'],
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 60, right: 40, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: d.tiers,
      axisLabel: { color: DARK_TEXT }
    },
    yAxis: {
      type: 'value',
      name: 'Mean Score',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [
      {
        name: 'Pre-2022 (n=' + d.preCount + ')',
        type: 'bar',
        data: d.preMeans,
        itemStyle: { color: palette[0] },
        barMaxWidth: 30
      },
      {
        name: 'Post-2022 (n=' + d.postCount + ')',
        type: 'bar',
        data: d.postMeans.map(function (v, i) {
          var sig = d.significant[i];
          return {
            value: v,
            itemStyle: { color: sig ? palette[5] : palette[1] },
            label: sig ? { show: true, position: 'top', formatter: 'p<0.05', color: palette[5], fontSize: 10 } : {}
          };
        }),
        barMaxWidth: 30
      }
    ]
  }));
  return chart;
}


function chartTheoryEvolution(el) {
  const chart = echarts.init(el);
  const d = DATA.theoryEvolution;
  const palette = DATA.palette;

  var series = d.theories.map(function (theory, i) {
    return {
      name: theory,
      type: 'bar',
      stack: 'theory',
      data: d.years.map(function (y) {
        return d.counts[y] ? (d.counts[y][theory] || 0) : 0;
      }),
      itemStyle: { color: palette[i % palette.length] },
      barMaxWidth: 30
    };
  });

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      type: 'scroll',
      data: d.theories,
      textStyle: { color: DARK_TEXT, fontSize: 10 },
      bottom: 0
    },
    grid: { left: 50, right: 20, top: 20, bottom: 70 },
    xAxis: {
      type: 'category',
      data: d.years,
      axisLabel: { color: DARK_TEXT }
    },
    yAxis: {
      type: 'value',
      name: 'Count',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: series
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 9d: Gap Analysis
// ---------------------------------------------------------------------------

function chartGapHeatmap(el) {
  const chart = echarts.init(el);
  const d = DATA.gapHeatmap;

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      position: 'top',
      formatter: function (p) {
        var levels = ['Zero', 'Minimal', 'Partial', 'Adequate'];
        return d.theories[p.value[1]] + '<br/>' +
               d.tiers[p.value[0]] + ': ' + levels[p.value[2]];
      }
    },
    grid: { left: 140, right: 80, top: 10, bottom: 80 },
    xAxis: {
      type: 'category',
      data: d.tiers,
      axisLabel: { color: DARK_TEXT, fontSize: 10, rotate: 30, interval: 0 },
      splitArea: { show: true, areaStyle: { color: ['rgba(200,208,232,0.04)', 'rgba(200,208,232,0.02)'] } }
    },
    yAxis: {
      type: 'category',
      data: d.theories,
      axisLabel: { color: DARK_TEXT, fontSize: 11 },
      splitArea: { show: true, areaStyle: { color: ['rgba(200,208,232,0.04)', 'rgba(200,208,232,0.02)'] } }
    },
    visualMap: {
      min: 0,
      max: 3,
      calculable: false,
      orient: 'vertical',
      right: 10,
      top: 'center',
      inRange: { color: ['#CC3333', '#D55E00', '#E69F00', '#009E73'] },
      text: ['Adequate', 'Zero'],
      textStyle: { color: DARK_TEXT }
    },
    series: [{
      type: 'heatmap',
      data: d.data,
      label: {
        show: true,
        formatter: function (p) {
          var labels = ['0', '1', '2', '3'];
          return labels[p.value[2]];
        },
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
    }]
  }));
  return chart;
}


function chartMoralMachineScatter(el) {
  var chart = echarts.init(el);
  var td = DATA.trialData;

  if (!td || !td.available) {
    chart.setOption(Object.assign(baseTheme(), {
      title: { text: 'Moral Machine -- awaiting trial data', left: 'center', top: 'center',
               textStyle: { color: '#999', fontSize: 14 } }
    }));
    return chart;
  }

  // Find MP8 (Moral Machine) trial and extract dimension preference rates
  var mmTrial = null;
  for (var i = 0; i < td.trials.length; i++) {
    if (td.trials[i].trial_id === 'MP8') { mmTrial = td.trials[i]; break; }
  }

  if (!mmTrial || !mmTrial.scores || !mmTrial.scores.dimension_preference_rates) {
    chart.setOption(Object.assign(baseTheme(), {
      title: { text: 'Moral Machine -- no dimension data', left: 'center', top: 'center',
               textStyle: { color: '#999', fontSize: 14 } }
    }));
    return chart;
  }

  var dpr = mmTrial.scores.dimension_preference_rates;
  var dimNames = [];
  var rates = [];
  var palette = DATA.palette;
  var labelMap = {
    'sparing_more': 'Spare More Lives',
    'sparing_young': 'Spare Young',
    'sparing_female': 'Spare Female',
    'sparing_higher_status': 'Spare Higher Status',
    'sparing_pedestrians': 'Spare Pedestrians',
    'sparing_lawful': 'Spare Lawful',
    'action_vs_inaction': 'Action vs Inaction',
    'sparing_fit': 'Spare Fit',
    'sparing_human': 'Spare Human'
  };

  Object.keys(dpr).forEach(function (key) {
    dimNames.push(labelMap[key] || key.replace(/_/g, ' '));
    rates.push((dpr[key].rate * 100).toFixed(0));
  });

  chart.setOption(Object.assign(baseTheme(), {
    title: { text: 'Moral Machine: Dimension Alignment Rates', left: 'center', textStyle: { color: DARK_TEXT, fontSize: 13 } },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        var idx = params[0].dataIndex;
        var key = Object.keys(dpr)[idx];
        var d = dpr[key];
        return '<b>' + dimNames[idx] + '</b><br/>Rate: ' + (d.rate * 100).toFixed(0) + '%<br/>Aligned: ' + d.aligned + '/' + d.total + (d.note ? '<br/>' + d.note : '');
      }
    },
    grid: { left: 150, right: 40, top: 40, bottom: 30 },
    yAxis: {
      type: 'category',
      data: dimNames,
      axisLabel: { color: DARK_TEXT, fontSize: 11 }
    },
    xAxis: {
      type: 'value',
      min: 0, max: 100,
      name: 'Alignment Rate (%)',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [{
      type: 'bar',
      data: rates.map(function (v, i) {
        var c = v >= 67 ? palette[2] : (v > 0 ? palette[0] : palette[5]);
        return { value: v, itemStyle: { color: c } };
      }),
      barMaxWidth: 20,
      label: { show: true, position: 'right', color: DARK_TEXT, fontSize: 10, formatter: '{c}%' }
    }]
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 8: Trial Results Charts
// ---------------------------------------------------------------------------

function chartMoralRadar(el) {
  var chart = echarts.init(el);
  var d = DATA.trialResults;
  if (!d || !d.available || !d.moralRadar) return chart;
  var mr = d.moralRadar;
  var palette = DATA.palette;

  var indicators = mr.dimensions.map(function (dim) {
    return { name: dim, max: 100 };
  });

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        var tip = '<b>' + params.seriesName + '</b><br/>';
        var otherVals = params.seriesName === 'Claude Opus 4.6' ? mr.humanBaselines : mr.claudeValues;
        var otherLabel = params.seriesName === 'Claude Opus 4.6' ? 'Human' : 'Claude';
        params.value.forEach(function (v, i) {
          var diff = otherVals && otherVals[i] != null ? ' (\u0394' + (v - otherVals[i]).toFixed(1) + ')' : '';
          tip += mr.dimensions[i] + ': ' + v + diff + '<br/>';
        });
        return tip;
      }
    },
    legend: {
      data: ['Claude Opus 4.6', 'Human Baselines'],
      textStyle: { color: DARK_TEXT, fontSize: 12 },
      bottom: 0
    },
    radar: {
      indicator: indicators,
      center: ['50%', '48%'],
      radius: '65%',
      axisName: {
        color: DARK_TEXT,
        fontSize: 10
      },
      splitArea: {
        areaStyle: { color: ['rgba(200,208,232,0.02)', 'rgba(200,208,232,0.05)'] }
      },
      splitLine: { lineStyle: { color: GRID_LINE } },
      axisLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: mr.claudeValues,
          name: 'Claude Opus 4.6',
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 2, color: palette[4] },
          areaStyle: { color: 'rgba(0,114,178,0.15)' },
          itemStyle: { color: palette[4] }
        },
        {
          value: mr.humanBaselines,
          name: 'Human Baselines',
          symbol: 'diamond',
          symbolSize: 5,
          lineStyle: { width: 2, type: 'dashed', color: palette[0] },
          areaStyle: { color: 'rgba(230,159,0,0.08)' },
          itemStyle: { color: palette[0] }
        }
      ]
    }]
  }));
  return chart;
}


function chartRlhfRanking(el) {
  var chart = echarts.init(el);
  var d = DATA.trialResults;
  if (!d || !d.available || !d.rlhfSensitivity) return chart;
  var rs = d.rlhfSensitivity;
  var palette = DATA.palette;

  // Show reversed: lowest RLHF score = best discrimination at top
  var names = rs.names.slice().reverse();
  var scores = rs.scores.slice().reverse();
  var discrim = rs.discrimination.slice().reverse();

  var discrimColors = {
    'VERY HIGH': '#009E73',
    'HIGH': '#56B4E9',
    'MODERATE': '#E69F00',
    'LOW': '#D55E00',
    'VERY LOW': '#CC79A7'
  };

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        var idx = params[0].dataIndex;
        return '<b>' + names[idx] + '</b><br/>' +
               'RLHF Score: ' + scores[idx] + '/10<br/>' +
               'Discrimination: ' + discrim[idx];
      }
    },
    grid: { left: 220, right: 40, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      max: 10,
      name: 'RLHF Sensitivity (lower = better discrimination)',
      nameTextStyle: { color: DARK_TEXT, fontSize: 10 },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: DARK_TEXT, fontSize: 10, width: 200, overflow: 'truncate' }
    },
    series: [{
      type: 'bar',
      data: scores.map(function (s, i) {
        return {
          value: s,
          itemStyle: { color: discrimColors[discrim[i]] || palette[7] }
        };
      }),
      barMaxWidth: 16,
      label: {
        show: true,
        position: 'right',
        formatter: function (p) { return discrim[p.dataIndex]; },
        color: DARK_TEXT,
        fontSize: 9
      }
    }]
  }));
  return chart;
}


function chartDualProcess(el) {
  var chart = echarts.init(el);
  var d = DATA.trialResults;
  if (!d || !d.available || !d.dualProcess) return chart;
  var dp = d.dualProcess;
  var palette = DATA.palette;

  // 2x2: personal/impersonal x zero-shot/CoT, for Claude vs Human
  var categories = ['Personal\n(Claude)', 'Impersonal\n(Claude)', 'Personal\n(Human)', 'Impersonal\n(Human)'];
  var zsValues = [
    (1 - dp.claudeGap) * 100 * 0.5 + 50 * 0.5,
    90,
    30,
    60
  ];
  // CoT values: Claude has zero CoT effect, humans have ~10% shift
  var cotValues = [
    zsValues[0],
    90,
    30 + 10,
    60 + 12.5
  ];

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['Zero-Shot', 'Chain-of-Thought'],
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: DARK_TEXT, fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: 'Utilitarian %',
      max: 100,
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [
      {
        name: 'Zero-Shot',
        type: 'bar',
        data: zsValues,
        itemStyle: { color: palette[1] },
        barMaxWidth: 28
      },
      {
        name: 'Chain-of-Thought',
        type: 'bar',
        data: cotValues,
        itemStyle: { color: palette[5] },
        barMaxWidth: 28
      }
    ]
  }));
  return chart;
}


function chartIntuitionism(el) {
  var chart = echarts.init(el);
  var d = DATA.trialResults;
  if (!d || !d.available || !d.socialIntuitionism) return chart;
  var si = d.socialIntuitionism;
  var palette = DATA.palette;

  var labels = ['Dumbfounding', 'Rationalization', 'Revision'];
  var claudeVals = [si.dumbfoundingRate * 100, si.rationalizationRate * 100, si.revisionRate * 100];
  var humanVals = [55, 30, 15];

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['Claude', 'Human Avg'],
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: DARK_TEXT }
    },
    yAxis: {
      type: 'value',
      name: 'Rate %',
      max: 100,
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [
      {
        name: 'Claude',
        type: 'bar',
        data: claudeVals.map(function (v) {
          return { value: v, itemStyle: { color: palette[4] } };
        }),
        barMaxWidth: 30
      },
      {
        name: 'Human Avg',
        type: 'bar',
        data: humanVals.map(function (v) {
          return { value: v, itemStyle: { color: palette[0] } };
        }),
        barMaxWidth: 30
      }
    ]
  }));
  return chart;
}


function chartDyadic(el) {
  var chart = echarts.init(el);
  var d = DATA.trialResults;
  if (!d || !d.available || !d.dyadicMorality) return chart;
  var dy = d.dyadicMorality;
  var palette = DATA.palette;

  var levels = ['High Dyadic', 'Low Dyadic', 'Structural'];
  var wrongness = [dy.wrongnessHigh, dy.wrongnessLow, dy.wrongnessStructural];
  var blame = [dy.blameHigh, dy.blameLow, dy.blameStructural];

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['Wrongness (0-10)', 'Blame (0-10)'],
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: levels,
      axisLabel: { color: DARK_TEXT }
    },
    yAxis: {
      type: 'value',
      name: 'Rating',
      max: 10,
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [
      {
        name: 'Wrongness (0-10)',
        type: 'bar',
        data: wrongness,
        itemStyle: { color: palette[5] },
        barMaxWidth: 40,
        label: { show: true, position: 'top', color: DARK_TEXT, fontSize: 11,
                 formatter: function (p) { return p.value.toFixed(1); } }
      },
      {
        name: 'Blame (0-10)',
        type: 'bar',
        data: blame,
        itemStyle: { color: palette[6] },
        barMaxWidth: 40,
        label: { show: true, position: 'top', color: DARK_TEXT, fontSize: 11,
                 formatter: function (p) { return p.value.toFixed(1); } }
      }
    ]
  }));
  return chart;
}


function chartPromptSensitivity(el) {
  var chart = echarts.init(el);
  var d = DATA.trialResults;
  if (!d || !d.available || !d.promptSensitivity) return chart;
  var ps = d.promptSensitivity;

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      position: 'top',
      formatter: function (p) {
        return ps.foundations[p.value[0]] + '<br/>' +
               ps.conditions[p.value[1]] + ': ' + p.value[2].toFixed(2);
      }
    },
    grid: { left: 100, right: 80, top: 10, bottom: 50 },
    xAxis: {
      type: 'category',
      data: ps.foundations,
      axisLabel: { color: DARK_TEXT, fontSize: 11 },
      position: 'top'
    },
    yAxis: {
      type: 'category',
      data: ps.conditions,
      axisLabel: { color: DARK_TEXT, fontSize: 11 }
    },
    visualMap: {
      min: 0,
      max: 5,
      calculable: true,
      orient: 'vertical',
      right: 10,
      top: 'center',
      inRange: { color: ['#1a1a2e', '#0072B2', '#56B4E9', '#E69F00', '#D55E00'] },
      textStyle: { color: DARK_TEXT }
    },
    series: [{
      type: 'heatmap',
      data: ps.data,
      label: {
        show: true,
        formatter: function (p) { return p.value[2].toFixed(1); },
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold'
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
    }]
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 10: Cultural & Religious Coverage Charts
// ---------------------------------------------------------------------------

function chartCrossCultural(el) {
  var chart = echarts.init(el);
  var d = DATA.culturalCoverage;
  if (!d || !d.available || !d.crossCultural) return chart;
  var cc = d.crossCultural;
  var palette = DATA.palette;

  var categories = ['Western\nDefault %', 'Islamic\nQuality', 'Confucian\nQuality', 'Ubuntu\nQuality', 'Overall\nQuality'];
  var values = [cc.westernDefaultRate, cc.islamicQuality * 20, cc.confucianQuality * 20, cc.ubuntuQuality * 20, cc.overallQuality * 20];
  var rawValues = [cc.westernDefaultRate, cc.islamicQuality, cc.confucianQuality, cc.ubuntuQuality, cc.overallQuality];

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        var idx = params[0].dataIndex;
        if (idx === 0) return '<b>Western Default Rate</b>: ' + rawValues[idx] + '%';
        return '<b>' + categories[idx].replace('\n', ' ') + '</b>: ' + rawValues[idx] + '/5';
      }
    },
    grid: { left: 50, right: 30, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: DARK_TEXT, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: {
        color: DARK_TEXT,
        formatter: function (v) {
          return v + '%';
        }
      },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [{
      type: 'bar',
      data: values.map(function (v, i) {
        var col = i === 0 ? '#D55E00' : palette[2];
        return { value: v, itemStyle: { color: col } };
      }),
      barMaxWidth: 50,
      label: {
        show: true,
        position: 'top',
        color: DARK_TEXT,
        fontSize: 12,
        fontWeight: 'bold',
        formatter: function (p) {
          return rawValues[p.dataIndex] + (p.dataIndex === 0 ? '%' : '/5');
        }
      }
    }]
  }));
  return chart;
}


// ---------------------------------------------------------------------------
// Tab 11: Model Comparison Charts
// ---------------------------------------------------------------------------

function chartMCMFTRadar(el) {
  var chart = echarts.init(el);
  var mc = DATA.modelComparison;
  var r = mc.mftRadar;
  // Vendor-lead models get thicker lines for readability
  var vendorLeads = { 0: true, 3: true, 7: true }; // Opus, Gem Flash, Codex

  var seriesData = [];
  for (var i = 0; i < mc.modelKeys.length; i++) {
    var mk = mc.modelKeys[i];
    seriesData.push({
      value: r.data[mk] || [],
      name: mc.models[i],
      lineStyle: { color: mc.modelColors[i], width: vendorLeads[i] ? 3 : 1.5, type: vendorLeads[i] ? 'solid' : 'dashed' },
      itemStyle: { color: mc.modelColors[i] },
      areaStyle: { color: mc.modelColors[i], opacity: 0.05 }
    });
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: { trigger: 'item' },
    legend: {
      type: 'scroll',
      data: mc.models,
      textStyle: { color: DARK_TEXT, fontSize: 10 },
      bottom: 0,
      pageTextStyle: { color: DARK_TEXT }
    },
    radar: {
      indicator: r.foundations.map(function (f) { return { name: f, max: 5 }; }),
      shape: 'polygon',
      axisName: { color: DARK_TEXT, fontSize: 12 },
      splitLine: { lineStyle: { color: GRID_LINE } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [{ type: 'radar', data: seriesData }]
  }));
  return chart;
}

function chartMCPScore(el) {
  var chart = echarts.init(el);
  var mc = DATA.modelComparison;
  var ps = mc.pScores;

  var series = [];
  for (var i = 0; i < mc.modelKeys.length; i++) {
    series.push({
      name: mc.models[i], type: 'bar',
      data: ps.data[mc.modelKeys[i]] || [],
      itemStyle: { color: mc.modelColors[i] },
      barMaxWidth: 14
    });
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { type: 'scroll', data: mc.models, textStyle: { color: DARK_TEXT, fontSize: 10 }, bottom: 0, pageTextStyle: { color: DARK_TEXT } },
    grid: { left: 60, right: 30, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: ps.labels,
      axisLabel: { color: DARK_TEXT, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: 0, max: 100,
      name: 'P-Score',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: series
  }));
  return chart;
}

function chartMCClassification(el) {
  var chart = echarts.init(el);
  var mc = DATA.modelComparison;
  var ca = mc.classificationAccuracy;

  var series = [];
  for (var i = 0; i < mc.modelKeys.length; i++) {
    series.push({
      name: mc.models[i], type: 'bar',
      data: ca.data[mc.modelKeys[i]] || [],
      itemStyle: { color: mc.modelColors[i] },
      barMaxWidth: 14
    });
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        var tip = '<b>' + params[0].name + '</b><br/>';
        params.forEach(function (p) {
          tip += p.marker + ' ' + p.seriesName + ': ' + (p.value * 100).toFixed(1) + '%<br/>';
        });
        return tip;
      }
    },
    legend: { type: 'scroll', data: mc.models, textStyle: { color: DARK_TEXT, fontSize: 10 }, bottom: 0, pageTextStyle: { color: DARK_TEXT } },
    grid: { left: 60, right: 30, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: ca.labels,
      axisLabel: { color: DARK_TEXT, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: 0, max: 1,
      name: 'Accuracy',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT, formatter: function (v) { return (v * 100) + '%'; } },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: series
  }));
  return chart;
}

function chartMCDualProcess(el) {
  var chart = echarts.init(el);
  var mc = DATA.modelComparison;
  var dp = mc.dualProcess;

  var series = [];
  for (var i = 0; i < mc.modelKeys.length; i++) {
    series.push({
      name: mc.models[i], type: 'bar',
      data: dp.data[mc.modelKeys[i]] || [],
      itemStyle: { color: mc.modelColors[i] },
      barMaxWidth: 14
    });
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        var tip = '<b>' + params[0].name + '</b><br/>';
        params.forEach(function (p) {
          tip += p.marker + ' ' + p.seriesName + ': ' + (p.value * 100).toFixed(0) + '%<br/>';
        });
        return tip;
      }
    },
    legend: { type: 'scroll', data: mc.models, textStyle: { color: DARK_TEXT, fontSize: 10 }, bottom: 0, pageTextStyle: { color: DARK_TEXT } },
    grid: { left: 60, right: 30, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: dp.labels,
      axisLabel: { color: DARK_TEXT, fontSize: 11, rotate: 15 }
    },
    yAxis: {
      type: 'value',
      min: 0, max: 1,
      name: 'Utilitarian Rate',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT, formatter: function (v) { return (v * 100) + '%'; } },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: series
  }));
  return chart;
}


function chartReligiousCoverage(el) {
  var chart = echarts.init(el);
  var d = DATA.culturalCoverage;
  if (!d || !d.available || !d.religiousCoverage) return chart;
  var rc = d.religiousCoverage;
  var palette = DATA.palette;

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        var idx = params[0].dataIndex;
        var tip = '<b>' + rc.traditionNames[idx] + '</b><br/>';
        params.forEach(function (p) {
          tip += p.marker + ' ' + p.seriesName + ': ' + p.value + '<br/>';
        });
        tip += 'Depth: ' + rc.depth[idx];
        return tip;
      }
    },
    legend: {
      data: ['Papers Engaging Tradition', 'Dedicated Benchmarks'],
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 120, right: 40, top: 20, bottom: 50 },
    xAxis: {
      type: 'value',
      name: 'Count',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    yAxis: {
      type: 'category',
      data: rc.traditionNames,
      axisLabel: { color: DARK_TEXT, fontSize: 11 }
    },
    series: [
      {
        name: 'Papers Engaging Tradition',
        type: 'bar',
        data: rc.papers,
        itemStyle: { color: palette[1] },
        barMaxWidth: 18
      },
      {
        name: 'Dedicated Benchmarks',
        type: 'bar',
        data: rc.benchmarks.map(function (v) {
          return {
            value: v,
            itemStyle: { color: v === 0 ? '#CC3333' : palette[2] }
          };
        }),
        barMaxWidth: 18,
        label: {
          show: true,
          position: 'right',
          color: DARK_TEXT,
          fontSize: 10,
          formatter: function (p) {
            return p.value === 0 ? 'ZERO' : p.value;
          }
        }
      }
    ]
  }));
  return chart;
}

// ---------------------------------------------------------------------------
// Tab 12: Cross-Vendor Analysis Charts
// ---------------------------------------------------------------------------

function chartCVRadar(el) {
  var chart = echarts.init(el);
  var cv = DATA.crossVendor;
  if (!cv || !cv.available) return chart;

  // Line width: thicker for "flagship" models, thinner for smaller
  var lineWidths = {
    'Opus': 3, 'Sonnet': 2, 'Haiku': 1.5,
    'Gem Flash': 2, 'Gem FL': 1.5, 'Gem 2.5P': 3, 'Gem 3.1P': 2,
    'Codex': 3, 'GPT Mini': 1.5
  };
  var lineStyles = {
    'Opus': 'solid', 'Sonnet': 'solid', 'Haiku': 'dashed',
    'Gem Flash': 'solid', 'Gem FL': 'dashed', 'Gem 2.5P': 'solid', 'Gem 3.1P': 'dotted',
    'Codex': 'solid', 'GPT Mini': 'dashed'
  };

  var seriesData = [];
  for (var i = 0; i < cv.models.length; i++) {
    var mKey = cv.modelKeys[i];
    var mName = cv.models[i];
    seriesData.push({
      value: cv.radarData[mKey] || [],
      name: mName,
      lineStyle: {
        color: cv.modelColors[i],
        width: lineWidths[mName] || 2,
        type: lineStyles[mName] || 'solid'
      },
      itemStyle: { color: cv.modelColors[i] },
      areaStyle: { color: cv.modelColors[i], opacity: 0.03 },
      emphasis: { lineStyle: { width: 4 }, areaStyle: { opacity: 0.15 } }
    });
  }

  chart.setOption(Object.assign(baseTheme(), {
    title: {
      text: 'Click legend to toggle models',
      textStyle: { color: '#666', fontSize: 10, fontWeight: 'normal' },
      right: 10, top: 5
    },
    tooltip: {
      trigger: 'item',
      formatter: function (p) {
        if (!p.value) return '';
        var tip = '<b>' + p.name + '</b><br/>';
        cv.radarDimensions.forEach(function (d, i) {
          tip += d + ': ' + (p.value[i] || 0).toFixed(1) + '<br/>';
        });
        return tip;
      }
    },
    legend: {
      data: cv.models,
      textStyle: { color: DARK_TEXT, fontSize: 10 },
      bottom: 0,
      type: 'scroll',
      selectedMode: 'multiple'
    },
    radar: {
      indicator: cv.radarDimensions.map(function (d) { return { name: d, max: 100 }; }),
      shape: 'polygon',
      radius: '58%',
      center: ['50%', '48%'],
      axisName: { color: DARK_TEXT, fontSize: 11 },
      splitLine: { lineStyle: { color: GRID_LINE } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [{ type: 'radar', data: seriesData }]
  }));
  return chart;
}

function chartCVHeatmap(el) {
  var chart = echarts.init(el);
  var cv = DATA.crossVendor;
  if (!cv || !cv.available) return chart;
  var hm = cv.vendorHeatmap;

  // Find max absolute deviation for symmetric color scale
  var maxDev = 1;
  hm.data.forEach(function (d) { maxDev = Math.max(maxDev, Math.abs(d[2])); });

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      position: 'top',
      formatter: function (p) {
        var raw = hm.rawData ? hm.rawData[p.dataIndex] : null;
        var tip = '<b>' + hm.vendorLabels[p.data[0]] + '</b> / ' +
                  hm.benchmarkLabels[p.data[1]] + '<br/>';
        if (raw) {
          tip += 'Raw value: ' + raw[2] + '<br/>';
          tip += 'Deviation: ' + (raw[3] > 0 ? '+' : '') + raw[3].toFixed(2) + '%';
        } else {
          tip += 'Deviation: ' + p.data[2].toFixed(2) + '%';
        }
        if (Math.abs(p.data[2]) < 0.5) tip += '<br/><em>Effectively identical</em>';
        return tip;
      }
    },
    grid: { left: 120, right: 80, top: 10, bottom: 30 },
    xAxis: {
      type: 'category',
      data: hm.vendorLabels,
      position: 'top',
      axisLabel: { color: DARK_TEXT, fontSize: 12, fontWeight: 'bold' },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: hm.benchmarkLabels,
      axisLabel: { color: DARK_TEXT, fontSize: 10 },
      splitLine: { show: false }
    },
    visualMap: {
      min: -maxDev, max: maxDev,
      calculable: false,
      orient: 'vertical',
      right: 0, top: 'center',
      inRange: { color: ['#0f3460', '#16213e', '#1a1a2e', '#3e1a1a', '#e94560'] },
      textStyle: { color: DARK_TEXT, fontSize: 10 },
      text: ['Above avg', 'Below avg'],
      show: true
    },
    series: [{
      type: 'heatmap',
      data: hm.data,
      label: {
        show: true,
        fontSize: 9,
        color: DARK_TEXT,
        formatter: function (p) {
          if (Math.abs(p.data[2]) < 0.5) return '\u2248';
          return (p.data[2] > 0 ? '+' : '') + p.data[2].toFixed(1) + '%';
        }
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
    }]
  }));
  return chart;
}

function chartCVScale(el) {
  var chart = echarts.init(el);
  var cv = DATA.crossVendor;
  if (!cv || !cv.available) return chart;

  // Show Anthropic scale sensitivity only (most informative: widest spread)
  // Separate grids for each vendor to respect different model counts
  var vendorConfigs = [
    { name: 'Anthropic', labels: ['Haiku', 'Sonnet', 'Opus'], color: cv.vendorColors[0], gridIdx: 0 },
    { name: 'Gemini', labels: ['FL', 'Flash', '2.5P', '3.1P'], color: cv.vendorColors[1], gridIdx: 1 },
    { name: 'OpenAI', labels: ['Mini', 'Codex'], color: cv.vendorColors[2], gridIdx: 2 }
  ];

  // Pick top 4 discriminating benchmarks for cleaner display
  var topBench = cv.discrimination.slice(0, 4);
  var benchColors = [cv.modelColors[0], cv.modelColors[3], cv.modelColors[7], '#CC79A7'];
  var lineTypes = ['solid', 'dashed', 'solid', 'dashed'];
  var series = [];
  var legendData = [];

  var grids = [
    { left: '5%', right: '70%', top: 30, bottom: 60 },
    { left: '35%', right: '38%', top: 30, bottom: 60 },
    { left: '67%', right: '5%', top: 30, bottom: 60 }
  ];
  var xAxes = [];
  var yAxes = [];

  vendorConfigs.forEach(function (vc, vi) {
    xAxes.push({
      type: 'category',
      data: vc.labels,
      gridIndex: vi,
      axisLabel: { color: DARK_TEXT, fontSize: 10 },
      name: vc.name,
      nameLocation: 'center',
      nameGap: 30,
      nameTextStyle: { color: vc.color, fontSize: 12, fontWeight: 'bold' }
    });
    yAxes.push({
      type: 'value',
      gridIndex: vi,
      name: vi === 0 ? 'Score' : '',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT, fontSize: 10, show: vi === 0 },
      splitLine: { lineStyle: { color: GRID_LINE } }
    });
  });

  // Create one series per benchmark per vendor
  topBench.forEach(function (bench, bi) {
    vendorConfigs.forEach(function (vc, vi) {
      var ss = cv.scaleSensitivity[vc.name];
      if (!ss) return;
      var entry = ss[bench.benchmark];
      if (!entry || !entry.values) return;
      var vals = entry.values.map(function (x) { return x !== null ? x : 0; });
      var sName = bench.short;
      if (bi === 0 || !legendData.includes(sName)) legendData.push(sName);
      series.push({
        name: sName,
        type: 'line',
        data: vals,
        xAxisIndex: vi,
        yAxisIndex: vi,
        lineStyle: { color: benchColors[bi], width: 2, type: lineTypes[bi] },
        itemStyle: { color: benchColors[bi] },
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true
      });
    });
  });

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: { trigger: 'axis' },
    legend: {
      data: legendData,
      textStyle: { color: DARK_TEXT, fontSize: 10 },
      type: 'scroll',
      bottom: 0
    },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    series: series
  }));
  return chart;
}

function chartCVDiscrimination(el) {
  var chart = echarts.init(el);
  var cv = DATA.crossVendor;
  if (!cv || !cv.available) return chart;
  var disc = cv.discrimination;

  var names = disc.map(function (d) { return d.short; });
  var cvValues = disc.map(function (d) { return d.cv; });
  var colors = disc.map(function (d) {
    return d.cv > 0.05 ? '#e94560' : d.cv > 0.01 ? '#E69F00' : '#444';
  });

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        var p = params[0];
        var d = disc[p.dataIndex];
        return '<b>' + d.benchmark + '</b> (' + d.short + ')<br/>' +
               'CV: ' + d.cv.toFixed(4) + '<br/>' +
               'Mean: ' + d.mean + ' | Std: ' + d.std + '<br/>' +
               'Category: ' + d.category;
      }
    },
    grid: { left: 110, right: 30, top: 20, bottom: 30 },
    xAxis: {
      type: 'value',
      name: 'Coefficient of Variation',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    yAxis: {
      type: 'category',
      data: names,
      inverse: true,
      axisLabel: { color: DARK_TEXT, fontSize: 10 }
    },
    series: [{
      type: 'bar',
      data: cvValues.map(function (v, i) {
        return { value: v, itemStyle: { color: colors[i] } };
      }),
      barMaxWidth: 16,
      label: {
        show: true,
        position: 'right',
        color: DARK_TEXT,
        fontSize: 9,
        formatter: function (p) {
          if (p.value === 0) return 'CEILING';
          return p.value > 0.001 ? p.value.toFixed(3) : '';
        }
      },
      markLine: {
        silent: true,
        data: [{ xAxis: 0.05, lineStyle: { color: '#e94560', type: 'dashed', width: 1 }, label: { formatter: 'High discrimination', color: '#e94560', fontSize: 9 } }]
      }
    }]
  }));
  return chart;
}

function chartCVConvergence(el) {
  var chart = echarts.init(el);
  var cv = DATA.crossVendor;
  if (!cv || !cv.available) return chart;
  var conv = cv.convergence;

  // Separate zero-variance (ceiling) from non-zero for visual clarity
  // Use log-transformed values to handle multi-order-of-magnitude range (MP3 at 40+ vs others at 0.01)
  var ceilingData = [];
  var activeData = [];
  var benchKeys = Object.keys(conv);
  for (var i = 0; i < benchKeys.length; i++) {
    var tid = benchKeys[i];
    var c = conv[tid];
    // Log-transform: log10(x + epsilon) to handle zeros gracefully
    var wv = c.within_var > 0 ? Math.log10(c.within_var) : -5;
    var bv = c.between_var > 0 ? Math.log10(c.between_var) : -5;
    var entry = {
      value: [wv, bv],
      name: _BENCHMARK_SHORT_JS[tid] || tid,
      tid: tid,
      disc: c.discrimination_ratio,
      rawWithin: c.within_var,
      rawBetween: c.between_var
    };
    if (c.total_var < 0.0001) {
      ceilingData.push(entry);
    } else {
      activeData.push(entry);
    }
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      formatter: function (p) {
        if (p.seriesName === 'Equal variance') return '';
        var d = p.data;
        return '<b>' + d.name + '</b> (' + d.tid + ')<br/>' +
               'Within-vendor var: ' + (d.rawWithin !== undefined ? d.rawWithin.toFixed(6) : 'N/A') + '<br/>' +
               'Between-vendor var: ' + (d.rawBetween !== undefined ? d.rawBetween.toFixed(6) : 'N/A') + '<br/>' +
               'Discrimination ratio: ' + (d.disc * 100).toFixed(1) + '%';
      }
    },
    legend: {
      data: ['Discriminating', 'Ceiling (zero var.)'],
      textStyle: { color: DARK_TEXT, fontSize: 10 },
      bottom: 0
    },
    grid: { left: 90, right: 30, top: 20, bottom: 60 },
    xAxis: {
      type: 'value',
      name: 'Within-Vendor Variance (log\u2081\u2080)',
      nameTextStyle: { color: DARK_TEXT },
      nameLocation: 'center',
      nameGap: 35,
      axisLabel: {
        color: DARK_TEXT,
        formatter: function (v) { return v >= -4 ? '10^' + v.toFixed(0) : '0'; }
      },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    yAxis: {
      type: 'value',
      name: 'Between-Vendor Var (log\u2081\u2080)',
      nameTextStyle: { color: DARK_TEXT },
      axisLabel: {
        color: DARK_TEXT,
        formatter: function (v) { return v >= -4 ? '10^' + v.toFixed(0) : '0'; }
      },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: [
      {
        name: 'Discriminating',
        type: 'scatter',
        data: activeData,
        symbolSize: 16,
        itemStyle: { color: '#56B4E9', borderColor: '#fff', borderWidth: 1 },
        label: {
          show: true,
          position: 'right',
          formatter: function (p) { return p.data.name; },
          color: DARK_TEXT,
          fontSize: 9
        },
        emphasis: { itemStyle: { shadowBlur: 10, borderColor: '#E69F00', borderWidth: 2 } }
      },
      {
        name: 'Ceiling (zero var.)',
        type: 'scatter',
        data: ceilingData,
        symbolSize: 10,
        itemStyle: { color: '#444', borderColor: '#666', borderWidth: 1 },
        label: {
          show: true,
          position: 'right',
          formatter: function (p) { return p.data.name; },
          color: '#666',
          fontSize: 8
        }
      },
      {
        name: 'Equal variance',
        type: 'line',
        data: (function () {
          var maxV = 0;
          activeData.concat(ceilingData).forEach(function (d) {
            maxV = Math.max(maxV, d.value[0], d.value[1]);
          });
          maxV = maxV * 1.1 || 0.01;
          return [[0, 0], [maxV, maxV]];
        })(),
        lineStyle: { color: '#555', type: 'dashed', width: 1 },
        symbol: 'none',
        tooltip: { show: false },
        silent: true
      }
    ]
  }));
  return chart;
}

// Lookup for convergence chart labels
var _BENCHMARK_SHORT_JS = {
  'MP-CC': 'Cross-Cultural', 'MP-DM': 'Dyadic', 'MP-DP': 'Dual Process',
  'MP-SI': 'Intuitionism', 'MP2': 'MFQ-30', 'MP3': 'DIT', 'MP4': 'MFV',
  'MP5': 'ValueCompass', 'MP6': 'Teacher DIT', 'MP7': 'TrolleyBench',
  'MP8': 'Moral Machine', 'MP9': 'MFTC', 'MP10': 'MoralCode',
  'MP11': 'Kaleidoscope', 'MP12': 'ValAct', 'MP15': 'UniMoral',
  'MP16': 'Moral ID', 'MP17': 'SocialChem', 'MP18': 'Cult. Persona',
  'MP19': 'Conscience', 'MP20': 'M3oralBench', 'MP21': 'PRIME',
  'MP22': 'TracingMF'
};

function chartCVTheory(el) {
  var chart = echarts.init(el);
  var cv = DATA.crossVendor;
  if (!cv || !cv.available) return chart;
  var tc = cv.theoryCoverage;
  var theories = tc.theories;
  var vendors = cv.vendors;

  var series = [];
  for (var vi = 0; vi < vendors.length; vi++) {
    var v = vendors[vi];
    var vals = theories.map(function (t) {
      var entry = tc.vendorData[t];
      return entry && entry[v] !== null && entry[v] !== undefined ? entry[v] : 0;
    });
    series.push({
      name: v,
      type: 'bar',
      data: vals,
      itemStyle: { color: cv.vendorColors[vi] },
      barMaxWidth: 24
    });
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        if (!params || !params.length) return '';
        var tip = '<b>' + params[0].name + '</b><br/>';
        var vals = [];
        params.forEach(function (p) {
          tip += p.marker + ' ' + p.seriesName + ': ' +
                 (typeof p.value === 'number' ? p.value.toFixed(3) : p.value) + '<br/>';
          if (typeof p.value === 'number') vals.push(p.value);
        });
        if (vals.length >= 2) {
          var range = Math.max.apply(null, vals) - Math.min.apply(null, vals);
          tip += '<span style="color:#999">Range: ' + range.toFixed(3) +
                 (range < 0.01 ? ' (homogeneous)' : range < 0.1 ? ' (low spread)' : ' (notable spread)') +
                 '</span>';
        }
        return tip;
      }
    },
    legend: {
      data: vendors,
      textStyle: { color: DARK_TEXT, fontSize: 11 },
      bottom: 0
    },
    grid: { left: 80, right: 30, top: 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: theories,
      axisLabel: { color: DARK_TEXT, fontSize: 10, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      name: 'Normalized Score (0-100)',
      nameTextStyle: { color: DARK_TEXT },
      min: 0,
      max: 100,
      axisLabel: { color: DARK_TEXT },
      splitLine: { lineStyle: { color: GRID_LINE } }
    },
    series: series
  }));
  return chart;
}
