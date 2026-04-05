/* app.js — Chart lifecycle, tab events, KPI rendering
 *
 * Lifecycle: dispose on tab leave, init on tab enter.
 * Resize handler for responsive charts.
 */

(function () {
  'use strict';

  // Active chart instances keyed by tab pane id
  var activeCharts = {};

  // ---------------------------------------------------------------------------
  // KPI Cards
  // ---------------------------------------------------------------------------

  function renderKPICards() {
    var kpi = DATA.kpi;
    var container = document.getElementById('kpi-cards');
    if (!container) return;

    var cards = [
      { label: 'Total Candidates', value: kpi.totalCandidates, color: '#E69F00', icon: 'search' },
      { label: 'Assessed (Feature Matrix)', value: kpi.assessed, color: '#56B4E9', icon: 'grid' },
      { label: 'Top-15 Selected', value: kpi.top15, color: '#009E73', icon: 'award' },
      { label: 'Theories Covered', value: kpi.theories, color: '#0072B2', icon: 'layers' },
      { label: 'Trials Completed', value: kpi.trials, color: '#D55E00', icon: 'activity' },
      { label: 'Features Scored', value: kpi.features || 0, color: '#CC79A7', icon: 'bar-chart' },
    ];

    var html = '';
    cards.forEach(function (c) {
      html += '<div class="col-sm-6 col-lg">' +
        '<div class="card card-dark kpi-card" style="border-top: 3px solid ' + c.color + '">' +
        '<div class="card-body text-center">' +
        '<div class="kpi-value" style="color:' + c.color + '">' + c.value + '</div>' +
        '<div class="kpi-label">' + c.label + '</div>' +
        '</div></div></div>';
    });
    container.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // Feature Table (Tab 2)
  // ---------------------------------------------------------------------------

  function renderFeatureTable() {
    var tbody = document.getElementById('feature-table-body');
    if (!tbody) return;

    var rows = DATA.featureTable;
    var html = '';

    rows.forEach(function (r) {
      var a6Class = r.A6 >= 75 ? 'cell-high' : (r.A6 >= 50 ? 'cell-mid' : 'cell-low');
      var b10Class = r.B10 >= 75 ? 'cell-high' : (r.B10 >= 50 ? 'cell-mid' : 'cell-low');

      html += '<tr>' +
        '<td>' + r.rank + '</td>' +
        '<td class="text-nowrap">' + r.short_title + '</td>' +
        '<td>' + r.year + '</td>' +
        '<td>' + r.theories + '</td>' +
        '<td>' + r.A2 + '</td>' +
        '<td>' + r.A5 + '</td>' +
        '<td class="' + a6Class + '">' + r.A6 + '</td>' +
        '<td>' + r.A7 + '</td>' +
        '<td>' + r.B1 + '</td>' +
        '<td>' + (r.B2 >= 1000 ? (r.B2 / 1000).toFixed(0) + 'k' : r.B2) + '</td>' +
        '<td class="' + b10Class + '">' + r.B10 + '</td>' +
        '<td>' + r.B10_fidelity + '</td>' +
        '<td>' + r.C1 + '</td>' +
        '<td>' + r.PD + '</td>' +
        '<td>' + r.PE + '</td>' +
        '<td>' + r.CI + '</td>' +
        '<td class="fw-bold">' + r.composite + '</td>' +
        '</tr>';
    });
    tbody.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // Methods Tab (Tab 6)
  // ---------------------------------------------------------------------------

  function renderMethods() {
    // Scoring formula
    var formulaEl = document.getElementById('methods-formula');
    if (formulaEl) {
      var sf = DATA.scoringFormula;
      formulaEl.innerHTML =
        '<div class="mb-2"><strong>Composite</strong> = ' + sf.COMPOSITE + '</div>' +
        '<div class="mb-1"><code>PD</code> = ' + sf.PD + '</div>' +
        '<div class="mb-1"><code>PE</code> = ' + sf.PE + '</div>' +
        '<div class="mb-1"><code>CI</code> = ' + sf.CI + '</div>' +
        '<div class="mt-2 text-muted small">Hard gates: ' + sf.hardGates + '</div>';
    }

    // Diversity constraints
    var constEl = document.getElementById('methods-constraints');
    if (constEl) {
      var dc = DATA.scoringFormula.diversityConstraints;
      constEl.innerHTML =
        '<ul class="list-unstyled">' +
        '<li>MFT: min ' + dc.mft_min + ', cap ' + dc.mft_cap + '</li>' +
        '<li>Schwartz: min ' + dc.schwartz_min + '</li>' +
        '<li>Trolley: min ' + dc.trolley_min + ', cap ' + dc.trolley_cap + '</li>' +
        '<li>Kohlberg: min ' + dc.kohlberg_min + '</li>' +
        '<li>Minority theories: min ' + dc.minority_min + '</li>' +
        '<li>Cross-cultural: required</li>' +
        '</ul>';
    }

    // Rescore table
    var rtbody = document.getElementById('rescore-table-body');
    var rsummary = document.getElementById('rescore-summary');
    if (rtbody && DATA.rescoreSummary && DATA.rescoreSummary.rows) {
      var rs = DATA.rescoreSummary;
      var html = '';
      rs.rows.forEach(function (r) {
        html += '<tr><td>' + r.theory + '</td><td>' + r.before +
          '</td><td>' + r.after + '</td><td class="text-success">+' + r.delta + '</td></tr>';
      });
      rtbody.innerHTML = html;
      if (rsummary) {
        rsummary.textContent = rs.totalPapers + ' papers scanned, ' +
          rs.updated + ' updated, ' + rs.unchanged + ' unchanged. ' +
          'Elapsed: ' + rs.elapsed + 's.';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Trials Tab (Tab 5)
  // ---------------------------------------------------------------------------

  function renderTrialsContainer() {
    var container = document.getElementById('trials-container');
    if (!container) return;

    var td = DATA.trialData;
    if (!td.available) {
      container.innerHTML =
        '<div class="card card-dark"><div class="card-body text-center py-5">' +
        '<h4 class="text-muted">' + td.placeholder + '</h4>' +
        '<p class="text-muted">Phase 4 trial runs will populate this tab with grouped bar charts, ' +
        'MFQ-30 radar charts, and Moral Machine scatter plots.</p>' +
        '</div></div>';
      return;
    }

    container.innerHTML =
      '<div class="row g-4">' +
      '<div class="col-12"><div class="card card-dark"><div class="card-header d-flex justify-content-between align-items-center">Trial Results' +
      '<select id="trial-bars-model-select" class="form-select form-select-sm w-auto bg-dark text-light border-secondary" style="max-width:180px"></select>' +
      '</div>' +
      '<div class="card-body"><div id="chart-trial-bars" class="chart-lg"></div></div></div></div>' +
      '<div class="col-lg-6"><div class="card card-dark"><div class="card-header">MFQ-30 Radar</div>' +
      '<div class="card-body"><div id="chart-mfq-radar" class="chart-md"></div></div></div></div>' +
      '<div class="col-lg-6"><div class="card card-dark"><div class="card-header">Moral Machine Scatter</div>' +
      '<div class="card-body"><div id="chart-mm-scatter" class="chart-md"></div></div></div></div>' +
      '</div>';
  }

  // ---------------------------------------------------------------------------
  // Tab 9: Computational Analysis — Static Renders
  // (All data is pre-computed by generate_dashboard.py; these are trusted
  //  internal constants, not user-supplied content.)
  // ---------------------------------------------------------------------------

  function renderRedundancyCards() {
    var el = document.getElementById('redundancy-cards');
    if (!el || !DATA.redundancySummary) return;
    var rs = DATA.redundancySummary;

    // Build DOM nodes safely
    var frag = document.createDocumentFragment();

    function makeBlock(val, color, label) {
      var block = document.createElement('div');
      block.className = 'metric-block';
      var valDiv = document.createElement('div');
      valDiv.className = 'metric-val';
      valDiv.style.color = color;
      valDiv.textContent = val;
      var lblDiv = document.createElement('div');
      lblDiv.className = 'metric-lbl';
      lblDiv.textContent = label;
      block.appendChild(valDiv);
      block.appendChild(lblDiv);
      return block;
    }

    frag.appendChild(makeBlock(rs.redundantPairs, '#E69F00', 'Redundant Pairs (r > 0.85)'));
    frag.appendChild(makeBlock(rs.collapsibleFeatures, '#56B4E9', 'Collapsible Features'));
    frag.appendChild(makeBlock(rs.deadFeatures, '#D55E00', 'Dead Features (zero variance)'));

    var note = document.createElement('div');
    note.className = 'text-muted small mt-2';
    note.textContent = rs.clusters + ' redundancy clusters found at r>0.85 threshold. Largest cluster has ' + rs.largestCluster + ' features.';
    frag.appendChild(note);

    el.textContent = '';
    el.appendChild(frag);
  }

  function renderArchetypeCards() {
    var el = document.getElementById('archetype-cards');
    if (!el || !DATA.archetypeData) return;
    var archetypes = DATA.archetypeData;
    var colors = ['#E69F00', '#56B4E9', '#009E73'];

    var frag = document.createDocumentFragment();
    archetypes.forEach(function (a, i) {
      var block = document.createElement('div');
      block.className = 'metric-block';
      block.style.borderLeft = '3px solid ' + colors[i];

      var header = document.createElement('div');
      header.className = 'd-flex justify-content-between align-items-center mb-1';
      var nameEl = document.createElement('strong');
      nameEl.style.color = colors[i];
      nameEl.textContent = a.label;
      var sizeEl = document.createElement('span');
      sizeEl.className = 'text-muted small';
      sizeEl.textContent = 'n=' + a.size;
      header.appendChild(nameEl);
      header.appendChild(sizeEl);

      var compDiv = document.createElement('div');
      compDiv.className = 'small';
      compDiv.textContent = 'Composite: ' + a.meanComposite;

      var tierDiv = document.createElement('div');
      tierDiv.className = 'text-muted small mt-1';
      tierDiv.textContent = 'D=' + a.tierMeans.D + ' E=' + a.tierMeans.E + ' F=' + a.tierMeans.F + ' G=' + a.tierMeans.G;

      block.appendChild(header);
      block.appendChild(compDiv);
      block.appendChild(tierDiv);
      frag.appendChild(block);
    });

    el.textContent = '';
    el.appendChild(frag);
  }

  function renderGapTable() {
    var tbody = document.getElementById('gap-table-body');
    if (!tbody || !DATA.gapTable) return;

    var frag = document.createDocumentFragment();
    DATA.gapTable.forEach(function (g) {
      var tr = document.createElement('tr');
      var cells = [g.rank, g.theory, g.gap, g.tiersMissing];
      cells.forEach(function (text, ci) {
        var td = document.createElement('td');
        if (ci === 1) td.className = 'text-nowrap';
        if (ci === 3) td.className = 'small';
        td.textContent = text;
        tr.appendChild(td);
      });
      // Priority cell with bar
      var tdP = document.createElement('td');
      var bar = document.createElement('span');
      bar.className = 'priority-bar';
      bar.style.width = Math.round(g.priority / 100 * 80) + 'px';
      tdP.appendChild(bar);
      tdP.appendChild(document.createTextNode(g.priority));
      tr.appendChild(tdP);
      frag.appendChild(tr);
    });

    tbody.textContent = '';
    tbody.appendChild(frag);
  }

  function renderHealthScorecard() {
    var el = document.getElementById('health-scorecard');
    if (!el || !DATA.healthScorecard) return;
    var hs = DATA.healthScorecard;

    function gradeClass(g) {
      if (!g) return 'grade-F';
      var letter = g.charAt(0);
      if (letter === 'A') return 'grade-A';
      if (letter === 'B') return 'grade-B';
      if (letter === 'C') return 'grade-C';
      if (letter === 'D') return 'grade-D';
      return 'grade-F';
    }

    var frag = document.createDocumentFragment();

    // Overall grade
    var center = document.createElement('div');
    center.className = 'text-center mb-3';
    var badge = document.createElement('span');
    badge.className = 'grade-badge ' + gradeClass(hs.overallGrade);
    badge.style.fontSize = '2rem';
    badge.style.padding = '0.4rem 1rem';
    badge.textContent = hs.overallGrade;
    center.appendChild(badge);
    var scoreNote = document.createElement('div');
    scoreNote.className = 'text-muted small mt-1';
    scoreNote.textContent = 'Overall Score: ' + hs.overallScore + ' / 100';
    center.appendChild(scoreNote);
    frag.appendChild(center);

    // Dimension breakdown
    var dimBox = document.createElement('div');
    dimBox.className = 'mt-3';
    hs.dimensions.forEach(function (d) {
      var row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center mb-2';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'small';
      nameSpan.textContent = d.name;
      var rightSpan = document.createElement('span');
      var gBadge = document.createElement('span');
      gBadge.className = 'grade-badge ' + gradeClass(d.grade);
      gBadge.textContent = d.grade;
      var sSpan = document.createElement('span');
      sSpan.className = 'small text-muted';
      sSpan.textContent = d.score + '/100';
      rightSpan.appendChild(gBadge);
      rightSpan.appendChild(sSpan);
      row.appendChild(nameSpan);
      row.appendChild(rightSpan);
      dimBox.appendChild(row);
    });
    frag.appendChild(dimBox);

    el.textContent = '';
    el.appendChild(frag);
  }

  // ---------------------------------------------------------------------------
  // Tab 8: Trial Results — Static Renders
  // ---------------------------------------------------------------------------

  function renderTrialResultsKPI() {
    var container = document.getElementById('trial-results-kpi');
    if (!container || !DATA.trialResults || !DATA.trialResults.available) return;
    var kpi = DATA.trialResults.trialKpi;

    var cards = [
      { label: 'Total Trials', value: kpi.totalTrials, color: '#D55E00' },
      { label: 'Total Items', value: kpi.totalItems, color: '#E69F00' },
      { label: 'Theories Covered', value: kpi.theoriesCovered, color: '#0072B2' },
      { label: 'Models Tested', value: kpi.modelsTested, color: '#009E73' },
    ];

    var html = '';
    cards.forEach(function (c) {
      html += '<div class="col-sm-6 col-lg-3">' +
        '<div class="card card-dark kpi-card" style="border-top: 3px solid ' + c.color + '">' +
        '<div class="card-body text-center">' +
        '<div class="kpi-value" style="color:' + c.color + '">' + c.value + '</div>' +
        '<div class="kpi-label">' + c.label + '</div>' +
        '</div></div></div>';
    });
    container.innerHTML = html;
  }

  function renderTrialResultsTable() {
    var tbody = document.getElementById('trial-results-table-body');
    if (!tbody || !DATA.trialResults || !DATA.trialResults.available) return;
    var rows = DATA.trialResults.trialTable;

    var html = '';
    rows.forEach(function (r) {
      var findingTrunc = r.keyFinding;
      if (findingTrunc.length > 180) findingTrunc = findingTrunc.substring(0, 177) + '...';
      html += '<tr>' +
        '<td class="text-nowrap fw-bold">' + r.id + '</td>' +
        '<td class="text-nowrap">' + r.benchmark + '</td>' +
        '<td>' + r.theory + '</td>' +
        '<td>' + r.format + '</td>' +
        '<td class="small">' + findingTrunc + '</td>' +
        '</tr>';
    });
    tbody.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // Tab 10: Cultural & Religious — Static Renders
  // ---------------------------------------------------------------------------

  function renderWLBI() {
    var scoreEl = document.getElementById('wlbi-score');
    var detailEl = document.getElementById('wlbi-detail');
    if (!scoreEl || !DATA.culturalCoverage || !DATA.culturalCoverage.available) return;
    var wbi = DATA.culturalCoverage.westernBiasIndex;
    scoreEl.textContent = wbi.score.toFixed(1);
    if (detailEl) {
      detailEl.textContent = 'WLBI of ' + wbi.score.toFixed(1) + '/100 indicates strong Western liberal default bias';
    }
  }

  function renderSacredValues() {
    var container = document.getElementById('sacred-values-container');
    if (!container || !DATA.culturalCoverage || !DATA.culturalCoverage.available) return;
    var sv = DATA.culturalCoverage.sacredValues;

    var frag = document.createDocumentFragment();

    // Sacred values
    var h1 = document.createElement('h6');
    h1.style.color = '#009E73';
    h1.className = 'mt-2';
    h1.textContent = 'Treated as Sacred';
    frag.appendChild(h1);

    var ul1 = document.createElement('ul');
    ul1.className = 'small';
    sv.brightLineValues.forEach(function (v) {
      var li = document.createElement('li');
      li.textContent = v.replace(/_/g, ' ');
      ul1.appendChild(li);
    });
    sv.egalitarianValues.forEach(function (v) {
      var li = document.createElement('li');
      li.textContent = v.replace(/_/g, ' ');
      li.style.color = '#56B4E9';
      ul1.appendChild(li);
    });
    frag.appendChild(ul1);

    // Not sacred
    var h2 = document.createElement('h6');
    h2.style.color = '#D55E00';
    h2.className = 'mt-3';
    h2.textContent = 'NOT Treated as Sacred';
    frag.appendChild(h2);

    var ul2 = document.createElement('ul');
    ul2.className = 'small';
    sv.utilitarianDomains.forEach(function (v) {
      var li = document.createElement('li');
      li.textContent = v;
      ul2.appendChild(li);
    });
    frag.appendChild(ul2);

    // Divergences
    var h3 = document.createElement('h6');
    h3.style.color = '#E69F00';
    h3.className = 'mt-3';
    h3.textContent = 'Claude vs Human Divergences';
    frag.appendChild(h3);

    var ol = document.createElement('ol');
    ol.className = 'small';
    sv.divergences.forEach(function (div) {
      if (div) {
        var li = document.createElement('li');
        li.textContent = div;
        ol.appendChild(li);
      }
    });
    frag.appendChild(ol);

    // Key finding
    if (sv.keyFinding) {
      var p = document.createElement('p');
      p.className = 'text-muted small mt-2 fst-italic';
      p.textContent = sv.keyFinding;
      frag.appendChild(p);
    }

    container.textContent = '';
    container.appendChild(frag);
  }

  function renderVaultSweepTable() {
    var tbody = document.getElementById('vault-sweep-table-body');
    if (!tbody || !DATA.culturalCoverage || !DATA.culturalCoverage.available) return;
    var vs = DATA.culturalCoverage.vaultSweep;
    if (!vs || !vs.candidates) return;

    var html = '';
    vs.candidates.forEach(function (c) {
      var extractBadge = c.hasExtract ?
        '<span class="badge bg-success">Yes</span>' :
        '<span class="badge bg-secondary">No</span>';
      html += '<tr>' +
        '<td class="text-nowrap">' + c.tradition + '</td>' +
        '<td>' + c.title + '</td>' +
        '<td class="small">' + c.keywords + '</td>' +
        '<td>' + extractBadge + '</td>' +
        '</tr>';
    });
    tbody.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // Tab 7: Paper Ranking
  // ---------------------------------------------------------------------------

  var rankingState = {
    allRows: [],
    filteredRows: [],
    sortKey: 'displayRank',
    sortDir: 'asc',
    initialized: false
  };

  function scoreClass(val) {
    if (val >= 65) return 'score-high';
    if (val >= 40) return 'score-mid';
    if (val > 0) return 'score-low';
    return 'score-zero';
  }

  function renderRankingKPI() {
    var container = document.getElementById('ranking-kpi');
    if (!container || !DATA.paperRanking) return;
    var pr = DATA.paperRanking;

    var cards = [
      { label: 'Total Candidates', value: pr.totalCandidates, color: '#E69F00' },
      { label: 'Fully Assessed', value: pr.assessedCount, color: '#56B4E9' },
      { label: 'Top-15 Selected', value: pr.top15Count, color: '#009E73' },
      { label: 'Year Range', value: pr.yearRange.min + '-' + pr.yearRange.max, color: '#0072B2' },
    ];

    var frag = document.createDocumentFragment();
    cards.forEach(function (c) {
      var col = document.createElement('div');
      col.className = 'col-sm-6 col-lg-3';
      var card = document.createElement('div');
      card.className = 'card card-dark kpi-card';
      card.style.borderTop = '3px solid ' + c.color;
      var body = document.createElement('div');
      body.className = 'card-body text-center';
      var valDiv = document.createElement('div');
      valDiv.className = 'kpi-value';
      valDiv.style.color = c.color;
      valDiv.style.fontSize = '1.8rem';
      valDiv.textContent = c.value;
      var lblDiv = document.createElement('div');
      lblDiv.className = 'kpi-label';
      lblDiv.textContent = c.label;
      body.appendChild(valDiv);
      body.appendChild(lblDiv);
      card.appendChild(body);
      col.appendChild(card);
      frag.appendChild(col);
    });
    container.textContent = '';
    container.appendChild(frag);
  }

  function initRankingFilters() {
    if (!DATA.paperRanking) return;
    var pr = DATA.paperRanking;

    // Populate theory filter dropdown
    var select = document.getElementById('ranking-theory-filter');
    if (select) {
      pr.theoryOptions.forEach(function (t) {
        var opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
      });
    }

    // Attach filter event listeners
    var searchEl = document.getElementById('ranking-search');
    var theoryEl = document.getElementById('ranking-theory-filter');
    var statusEl = document.getElementById('ranking-status-filter');
    var dataEl = document.getElementById('ranking-data-filter');

    function onFilterChange() { applyRankingFilters(); }

    if (searchEl) searchEl.addEventListener('input', onFilterChange);
    if (theoryEl) theoryEl.addEventListener('change', onFilterChange);
    if (statusEl) statusEl.addEventListener('change', onFilterChange);
    if (dataEl) dataEl.addEventListener('change', onFilterChange);

    // Attach sort headers
    var headers = document.querySelectorAll('#ranking-table thead th.sortable');
    headers.forEach(function (th) {
      th.addEventListener('click', function () {
        var key = th.getAttribute('data-sort');
        if (rankingState.sortKey === key) {
          rankingState.sortDir = rankingState.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          rankingState.sortKey = key;
          rankingState.sortDir = (key === 'displayRank' || key === 'year') ? 'asc' : 'desc';
        }
        headers.forEach(function (h) {
          h.classList.remove('sort-asc', 'sort-desc');
        });
        th.classList.add(rankingState.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
        applyRankingSort();
        renderRankingRows();
      });
    });

    // Close button for detail panel
    var closeBtn = document.getElementById('ranking-detail-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        var panel = document.getElementById('ranking-detail-panel');
        if (panel) panel.classList.add('d-none');
      });
    }
  }

  function applyRankingFilters() {
    if (!DATA.paperRanking) return;
    var rows = DATA.paperRanking.rows;

    var searchEl = document.getElementById('ranking-search');
    var theoryEl = document.getElementById('ranking-theory-filter');
    var statusEl = document.getElementById('ranking-status-filter');
    var dataEl = document.getElementById('ranking-data-filter');

    var searchVal = (searchEl ? searchEl.value : '').toLowerCase();
    var theoryVal = theoryEl ? theoryEl.value : '';
    var statusVal = statusEl ? statusEl.value : '';
    var dataVal = dataEl ? dataEl.value : '';

    rankingState.filteredRows = rows.filter(function (r) {
      if (searchVal && r.title.toLowerCase().indexOf(searchVal) === -1) return false;
      if (theoryVal && r.theories.indexOf(theoryVal) === -1) return false;
      if (statusVal === 'top15' && !r.inTop15) return false;
      if (statusVal === 'assessed' && !r.assessed) return false;
      if (statusVal === 'unassessed' && r.assessed) return false;
      if (dataVal === 'available' && !r.hasData) return false;
      if (dataVal === 'trial' && !r.hasTrial) return false;
      return true;
    });

    applyRankingSort();
    renderRankingRows();
  }

  function applyRankingSort() {
    var key = rankingState.sortKey;
    var dir = rankingState.sortDir === 'asc' ? 1 : -1;

    rankingState.filteredRows.sort(function (a, b) {
      var av = a[key];
      var bv = b[key];
      if (typeof av === 'string') {
        return dir * av.localeCompare(bv);
      }
      return dir * ((av || 0) - (bv || 0));
    });
  }

  function renderRankingRows() {
    var tbody = document.getElementById('ranking-table-body');
    if (!tbody) return;

    var rows = rankingState.filteredRows;
    var countEl = document.getElementById('ranking-count');
    if (countEl) {
      countEl.textContent = rows.length + ' of ' + DATA.paperRanking.totalCandidates + ' shown';
    }

    var frag = document.createDocumentFragment();

    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.style.borderLeftColor = r.theoryColor;

      if (r.inTop15) tr.classList.add('row-top15');
      else if (r.assessed) tr.classList.add('row-assessed');
      else tr.classList.add('row-unassessed');

      tr.setAttribute('data-file', r.file);

      // # column
      var tdRank = document.createElement('td');
      tdRank.textContent = r.displayRank;
      tr.appendChild(tdRank);

      // Title + badges
      var tdTitle = document.createElement('td');
      tdTitle.className = 'text-nowrap';
      var titleText = r.title;
      if (titleText.length > 50) titleText = titleText.substring(0, 47) + '...';
      tdTitle.appendChild(document.createTextNode(titleText));
      if (r.inTop15) {
        var badge15 = document.createElement('span');
        badge15.className = 'badge-top15';
        badge15.textContent = 'T15';
        tdTitle.appendChild(badge15);
      } else if (r.assessed) {
        var badgeA = document.createElement('span');
        badgeA.className = 'badge-assessed';
        badgeA.textContent = 'A';
        tdTitle.appendChild(badgeA);
      }
      tr.appendChild(tdTitle);

      // Year
      var tdYear = document.createElement('td');
      tdYear.textContent = r.year;
      tr.appendChild(tdYear);

      // Authors
      var tdAuth = document.createElement('td');
      tdAuth.className = 'text-nowrap';
      tdAuth.textContent = r.authors;
      tr.appendChild(tdAuth);

      // Theories
      var tdTheory = document.createElement('td');
      tdTheory.textContent = r.theories;
      tr.appendChild(tdTheory);

      // Score columns
      var scoreFields = ['composite', 'PD', 'PE', 'CI', 'D_mean', 'E_mean', 'F_mean', 'G_mean'];
      scoreFields.forEach(function (sf) {
        var td = document.createElement('td');
        var val = r[sf];
        if (!r.assessed) {
          td.className = 'score-zero';
          td.textContent = '-';
        } else {
          td.className = scoreClass(val);
          td.textContent = val.toFixed(1);
          if (sf === 'composite') td.style.fontWeight = '700';
        }
        tr.appendChild(td);
      });

      // Data available
      var tdData = document.createElement('td');
      tdData.textContent = r.hasData ? 'Y' : '-';
      tdData.style.color = r.hasData ? '#a0f0d0' : 'rgba(200,208,232,0.2)';
      tr.appendChild(tdData);

      // Trial status
      var tdTrial = document.createElement('td');
      if (r.hasTrial && r.trialId) {
        var trialBadge = document.createElement('span');
        trialBadge.className = 'badge-trial';
        trialBadge.textContent = r.trialId;
        tdTrial.appendChild(trialBadge);
      } else {
        tdTrial.textContent = '-';
        tdTrial.style.color = 'rgba(200,208,232,0.2)';
      }
      tr.appendChild(tdTrial);

      // Click handler for expand (assessed benchmarks with feature profile)
      if (r.featureProfile) {
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', function () {
          showRankingDetail(r);
        });
      }

      frag.appendChild(tr);
    });

    tbody.textContent = '';
    tbody.appendChild(frag);
  }

  function showRankingDetail(row) {
    var panel = document.getElementById('ranking-detail-panel');
    var titleEl = document.getElementById('ranking-detail-title');
    var bodyEl = document.getElementById('ranking-detail-body');
    if (!panel || !titleEl || !bodyEl || !row.featureProfile) return;

    panel.classList.remove('d-none');
    titleEl.textContent = row.title + ' (' + row.year + ') - Feature Profile';

    // Group features by tier
    var tiers = { D: [], E: [], F: [], G: [] };
    var profile = row.featureProfile;
    Object.keys(profile).forEach(function (key) {
      var tier = key.charAt(0);
      if (tiers[tier]) {
        tiers[tier].push({ key: key, score: profile[key].score, evidence: profile[key].evidence });
      }
    });

    var frag = document.createDocumentFragment();

    var tierLabels = {
      D: 'Tier D: Psychometric Properties (' + tiers.D.length + ' features)',
      E: 'Tier E: LLM-Specific Features (' + tiers.E.length + ' features)',
      F: 'Tier F: Cultural & Ethical Breadth (' + tiers.F.length + ' features)',
      G: 'Tier G: Scholarly Impact & Reproducibility (' + tiers.G.length + ' features)'
    };

    var tierColors = { D: '#E69F00', E: '#56B4E9', F: '#009E73', G: '#0072B2' };

    ['D', 'E', 'F', 'G'].forEach(function (tier) {
      if (tiers[tier].length === 0) return;

      var header = document.createElement('div');
      header.className = 'tier-header';
      header.style.color = tierColors[tier];
      header.textContent = tierLabels[tier];
      frag.appendChild(header);

      var grid = document.createElement('div');
      grid.className = 'profile-grid';

      tiers[tier].forEach(function (f) {
        var cell = document.createElement('div');
        cell.className = 'profile-cell';

        var keyDiv = document.createElement('div');
        keyDiv.className = 'dim-key';
        keyDiv.textContent = f.key;

        var scoreDiv = document.createElement('div');
        scoreDiv.className = 'dim-score ' + scoreClass(f.score);
        scoreDiv.textContent = f.score;

        var evDiv = document.createElement('div');
        evDiv.className = 'dim-evidence';
        evDiv.textContent = f.evidence;

        cell.appendChild(keyDiv);
        cell.appendChild(scoreDiv);
        cell.appendChild(evDiv);
        grid.appendChild(cell);
      });

      frag.appendChild(grid);
    });

    bodyEl.textContent = '';
    bodyEl.appendChild(frag);

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initPaperRanking() {
    if (rankingState.initialized) return;
    if (!DATA.paperRanking) return;

    rankingState.allRows = DATA.paperRanking.rows;
    rankingState.filteredRows = rankingState.allRows.slice();
    rankingState.initialized = true;

    renderRankingKPI();
    initRankingFilters();
    renderRankingRows();
  }

  // ---------------------------------------------------------------------------
  // Tab 11: Model Comparison -- Static Renders
  // (All data is pre-computed from trial JSON; these are trusted
  //  internal constants, not user-supplied content.)
  // ---------------------------------------------------------------------------

  function renderMCKPICards() {
    var mc = DATA.modelComparison;
    if (!mc || !mc.available) return;
    var container = document.getElementById('mc-kpi-cards');
    if (!container) return;

    // Compute mean classification accuracy across all models
    var ca = mc.classificationAccuracy || {};
    var meanAcc = 0;
    if (ca.data && mc.modelKeys) {
      var allAccs = [];
      mc.modelKeys.forEach(function (mk) {
        var arr = ca.data[mk];
        if (arr && arr.length > 0) {
          allAccs.push(arr.reduce(function (a, b) { return a + b; }, 0) / arr.length);
        }
      });
      if (allAccs.length > 0) {
        meanAcc = (allAccs.reduce(function (a, b) { return a + b; }, 0) / allAccs.length * 100).toFixed(1);
      }
    }

    var ps = mc.pScores || {};
    var pRange = '';
    if (ps.data && mc.modelKeys) {
      var allP = [];
      mc.modelKeys.forEach(function (mk) {
        if (ps.data[mk]) allP = allP.concat(ps.data[mk]);
      });
      if (allP.length > 0) {
        pRange = Math.min.apply(null, allP) + '-' + Math.max.apply(null, allP);
      }
    }

    var cards = [
      { label: 'Models Compared', value: (mc.models || []).length, color: '#7C3AED' },
      { label: 'Benchmarks', value: 23, color: '#2563EB' },
      { label: 'P-Score Range', value: pRange, color: '#059669' },
      { label: 'Mean Classification', value: meanAcc + '%', color: '#CC79A7' }
    ];

    // Safe DOM construction -- trusted internal data only
    var frag = document.createDocumentFragment();
    cards.forEach(function (c) {
      var col = document.createElement('div');
      col.className = 'col-sm-6 col-lg';
      var card = document.createElement('div');
      card.className = 'card card-dark kpi-card';
      card.style.borderTop = '3px solid ' + c.color;
      var body = document.createElement('div');
      body.className = 'card-body text-center';
      var valDiv = document.createElement('div');
      valDiv.className = 'kpi-value';
      valDiv.style.color = c.color;
      valDiv.textContent = c.value;
      var lblDiv = document.createElement('div');
      lblDiv.className = 'kpi-label';
      lblDiv.textContent = c.label;
      body.appendChild(valDiv);
      body.appendChild(lblDiv);
      card.appendChild(body);
      col.appendChild(card);
      frag.appendChild(col);
    });
    container.textContent = '';
    container.appendChild(frag);
  }

  function renderMCTrialTable() {
    var mc = DATA.modelComparison;
    if (!mc || !mc.available || !mc.trialTable) return;

    // Build dynamic header from model list
    var thead = document.getElementById('mc-trial-table-head');
    if (thead) {
      var headTr = document.createElement('tr');
      ['Trial', 'Benchmark', 'Primary Metric'].forEach(function (h) {
        var th = document.createElement('th');
        th.textContent = h;
        headTr.appendChild(th);
      });
      mc.models.forEach(function (name, i) {
        var th = document.createElement('th');
        th.textContent = name;
        th.style.color = mc.modelColors[i];
        th.className = 'text-nowrap';
        headTr.appendChild(th);
      });
      var thCat = document.createElement('th');
      thCat.textContent = 'Category';
      headTr.appendChild(thCat);
      thead.textContent = '';
      thead.appendChild(headTr);
    }

    var tbody = document.getElementById('mc-trial-table-body');
    if (!tbody) return;

    // Safe DOM construction -- trusted internal data
    var frag = document.createDocumentFragment();
    mc.trialTable.forEach(function (t) {
      var tr = document.createElement('tr');

      var tdId = document.createElement('td');
      tdId.className = 'text-nowrap fw-bold';
      tdId.textContent = t.id;
      tr.appendChild(tdId);

      var tdBench = document.createElement('td');
      tdBench.textContent = t.benchmark;
      tr.appendChild(tdBench);

      var tdMetric = document.createElement('td');
      tdMetric.className = 'small text-muted';
      tdMetric.textContent = t.metric;
      tr.appendChild(tdMetric);

      // Dynamic model value columns
      for (var mi = 0; mi < mc.modelKeys.length; mi++) {
        var td = document.createElement('td');
        td.style.color = mc.modelColors[mi];
        td.className = 'text-nowrap';
        var raw = t.values ? t.values[mc.modelKeys[mi]] : '\u2014';
        td.textContent = (raw !== undefined && raw !== null) ? raw : '\u2014';
        tr.appendChild(td);
      }

      var tdCat = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'badge bg-secondary bg-opacity-25 text-muted';
      badge.textContent = t.category;
      tdCat.appendChild(badge);
      tr.appendChild(tdCat);

      frag.appendChild(tr);
    });
    tbody.textContent = '';
    tbody.appendChild(frag);
  }

  function renderMCKeyFindings() {
    var mc = DATA.modelComparison;
    if (!mc || !mc.available || !mc.keyFindings) return;
    var container = document.getElementById('mc-key-findings');
    if (!container) return;

    // Safe DOM construction -- trusted internal data
    var accordion = document.createElement('div');
    accordion.className = 'accordion accordion-flush';
    accordion.id = 'mc-findings-accordion';

    mc.keyFindings.forEach(function (f) {
      var collapseId = 'mc-finding-' + f.num;

      var item = document.createElement('div');
      item.className = 'accordion-item';
      item.style.background = 'transparent';
      item.style.borderColor = 'var(--border-color)';

      var header = document.createElement('h2');
      header.className = 'accordion-header';

      var btn = document.createElement('button');
      btn.className = 'accordion-button collapsed';
      btn.type = 'button';
      btn.setAttribute('data-bs-toggle', 'collapse');
      btn.setAttribute('data-bs-target', '#' + collapseId);
      btn.style.cssText = 'background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;padding:0.7rem 1rem';

      var numBadge = document.createElement('span');
      numBadge.className = 'badge me-2';
      numBadge.style.background = '#7C3AED';
      numBadge.style.minWidth = '28px';
      numBadge.textContent = f.num;
      btn.appendChild(numBadge);

      var titleEl = document.createElement('strong');
      titleEl.textContent = f.title;
      btn.appendChild(titleEl);

      header.appendChild(btn);
      item.appendChild(header);

      var collapseDiv = document.createElement('div');
      collapseDiv.id = collapseId;
      collapseDiv.className = 'accordion-collapse collapse';
      collapseDiv.setAttribute('data-bs-parent', '#mc-findings-accordion');

      var bodyDiv = document.createElement('div');
      bodyDiv.className = 'accordion-body';
      bodyDiv.style.cssText = 'background:var(--bg-card);color:var(--text-muted);font-size:0.85rem;border-top:1px solid var(--border-color)';
      bodyDiv.textContent = f.text;

      collapseDiv.appendChild(bodyDiv);
      item.appendChild(collapseDiv);
      accordion.appendChild(item);
    });

    container.textContent = '';
    container.appendChild(accordion);
  }

  // ---------------------------------------------------------------------------
  // Chart Lifecycle
  // ---------------------------------------------------------------------------

  var TAB_CHARTS = {
    'pane-overview': function () {
      return [
        chartCompositeBar(document.getElementById('chart-composite-bar')),
        chartTheoryPie(document.getElementById('chart-theory-pie'))
      ];
    },
    'pane-heatmap': function () {
      return [chartHeatmap(document.getElementById('chart-heatmap'))];
    },
    'pane-implementation': function () {
      return [chartImplementation(document.getElementById('chart-implementation'))];
    },
    'pane-trials': function () {
      var charts = [];
      var barEl = document.getElementById('chart-trial-bars');
      if (barEl) charts.push(chartTrialBars(barEl));
      var radarEl = document.getElementById('chart-mfq-radar');
      if (radarEl) charts.push(chartMFQRadar(radarEl));
      var scatterEl = document.getElementById('chart-mm-scatter');
      if (scatterEl) charts.push(chartMoralMachineScatter(scatterEl));
      return charts;
    },
    'pane-trial-results': function () {
      var charts = [];
      var radarEl = document.getElementById('chart-moral-radar');
      if (radarEl) charts.push(chartMoralRadar(radarEl));
      var rlhfEl = document.getElementById('chart-rlhf-ranking');
      if (rlhfEl) charts.push(chartRlhfRanking(rlhfEl));
      var dpEl = document.getElementById('chart-dual-process');
      if (dpEl) charts.push(chartDualProcess(dpEl));
      var siEl = document.getElementById('chart-intuitionism');
      if (siEl) charts.push(chartIntuitionism(siEl));
      var dyEl = document.getElementById('chart-dyadic');
      if (dyEl) charts.push(chartDyadic(dyEl));
      var psEl = document.getElementById('chart-prompt-sensitivity');
      if (psEl) charts.push(chartPromptSensitivity(psEl));
      return charts;
    },
    'pane-computational': function () {
      // Only init charts for the currently active subtab
      return initComputationalSubtab();
    },
    'pane-cultural': function () {
      var charts = [];
      var ccEl = document.getElementById('chart-cross-cultural');
      if (ccEl) charts.push(chartCrossCultural(ccEl));
      var rcEl = document.getElementById('chart-religious-coverage');
      if (rcEl) charts.push(chartReligiousCoverage(rcEl));
      return charts;
    },
    'pane-model-comparison': function () {
      var charts = [];
      var radarEl = document.getElementById('chart-mc-mft-radar');
      if (radarEl) charts.push(chartMCMFTRadar(radarEl));
      var psEl = document.getElementById('chart-mc-pscore');
      if (psEl) charts.push(chartMCPScore(psEl));
      var clEl = document.getElementById('chart-mc-classification');
      if (clEl) charts.push(chartMCClassification(clEl));
      var dpEl = document.getElementById('chart-mc-dual-process');
      if (dpEl) charts.push(chartMCDualProcess(dpEl));
      return charts;
    },
    'pane-cross-vendor': function () {
      var charts = [];
      var radarEl = document.getElementById('chart-cv-radar');
      if (radarEl) charts.push(chartCVRadar(radarEl));
      var hmEl = document.getElementById('chart-cv-heatmap');
      if (hmEl) charts.push(chartCVHeatmap(hmEl));
      var scEl = document.getElementById('chart-cv-scale');
      if (scEl) charts.push(chartCVScale(scEl));
      var discEl = document.getElementById('chart-cv-discrimination');
      if (discEl) charts.push(chartCVDiscrimination(discEl));
      var convEl = document.getElementById('chart-cv-convergence');
      if (convEl) charts.push(chartCVConvergence(convEl));
      var thEl = document.getElementById('chart-cv-theory');
      if (thEl) charts.push(chartCVTheory(thEl));
      return charts;
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 12: Cross-Vendor Analysis -- Static Renders
  // ---------------------------------------------------------------------------

  function renderCVKPICards() {
    var cv = DATA.crossVendor;
    if (!cv || !cv.available) return;
    var container = document.getElementById('cv-kpi-cards');
    if (!container) return;

    var kpi = cv.kpi;
    var cards = [
      { label: 'Models Compared', value: kpi.modelsCompared, color: '#7C3AED' },
      { label: 'Vendors', value: kpi.vendorsRepresented, color: '#E69F00' },
      { label: 'Benchmarks', value: kpi.benchmarksAdministered, color: '#56B4E9' },
      { label: 'Trial Files', value: kpi.totalTrialFiles, color: '#009E73' },
      { label: 'Ceiling Benchmarks', value: kpi.ceilingBenchmarks + '/' + kpi.benchmarksAdministered, color: '#D55E00' },
      { label: 'Discriminating', value: kpi.discriminatingBenchmarks + '/' + kpi.benchmarksAdministered, color: '#059669' }
    ];

    var frag = document.createDocumentFragment();
    cards.forEach(function (c) {
      var col = document.createElement('div');
      col.className = 'col-sm-6 col-lg';
      var card = document.createElement('div');
      card.className = 'card card-dark kpi-card';
      card.style.borderTop = '3px solid ' + c.color;
      var body = document.createElement('div');
      body.className = 'card-body text-center';
      var valDiv = document.createElement('div');
      valDiv.className = 'kpi-value';
      valDiv.style.color = c.color;
      valDiv.textContent = c.value;
      var lblDiv = document.createElement('div');
      lblDiv.className = 'kpi-label';
      lblDiv.textContent = c.label;
      body.appendChild(valDiv);
      body.appendChild(lblDiv);
      card.appendChild(body);
      col.appendChild(card);
      frag.appendChild(col);
    });
    container.textContent = '';
    container.appendChild(frag);
  }

  function renderCVTrialTable() {
    var cv = DATA.crossVendor;
    if (!cv || !cv.available) return;
    var tbody = document.getElementById('cv-trial-table-body');
    if (!tbody) return;

    var modelKeys = cv.modelKeys;
    var modelColors = cv.modelColors;
    var frag = document.createDocumentFragment();

    cv.trialTable.forEach(function (t) {
      var tr = document.createElement('tr');

      var tdId = document.createElement('td');
      tdId.className = 'text-nowrap fw-bold';
      tdId.textContent = t.id;
      tr.appendChild(tdId);

      var tdBench = document.createElement('td');
      tdBench.textContent = t.benchmark;
      tr.appendChild(tdBench);

      var tdMetric = document.createElement('td');
      tdMetric.className = 'small text-muted';
      tdMetric.textContent = t.metric;
      tr.appendChild(tdMetric);

      // Collect numeric values for conditional formatting
      var numVals = [];
      var valCells = [];
      for (var mi = 0; mi < modelKeys.length; mi++) {
        var td = document.createElement('td');
        td.style.color = modelColors[mi];
        td.className = 'text-nowrap';
        var raw = t.values[modelKeys[mi]] || '\u2014';
        td.textContent = raw;
        tr.appendChild(td);
        valCells.push(td);
        var n = parseFloat(raw);
        numVals.push(isNaN(n) ? null : n);
      }

      // Detect ceiling rows (all values identical)
      var validNums = numVals.filter(function (v) { return v !== null; });
      var uniqueVals = [];
      validNums.forEach(function (v) {
        var rounded = Math.round(v * 1000) / 1000;
        if (uniqueVals.indexOf(rounded) === -1) uniqueVals.push(rounded);
      });
      if (uniqueVals.length === 1 && validNums.length >= 5) {
        tr.className = 'cv-ceiling-row';
      } else if (validNums.length >= 3) {
        // Highlight max and min
        var maxV = Math.max.apply(null, validNums);
        var minV = Math.min.apply(null, validNums);
        if (maxV !== minV) {
          for (var ci = 0; ci < numVals.length; ci++) {
            if (numVals[ci] === maxV) valCells[ci].className += ' cv-max-val';
            if (numVals[ci] === minV) valCells[ci].className += ' cv-min-val';
          }
        }
      }

      var tdCat = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'badge bg-secondary bg-opacity-25 text-muted';
      badge.textContent = t.category;
      tdCat.appendChild(badge);
      tr.appendChild(tdCat);

      frag.appendChild(tr);
    });
    tbody.textContent = '';
    tbody.appendChild(frag);
  }

  function renderCVCouncilHighlights() {
    var cv = DATA.crossVendor;
    if (!cv || !cv.available) return;
    var container = document.getElementById('cv-council-highlights');
    if (!container) return;

    var highlights = cv.councilHighlights;
    var frag = document.createDocumentFragment();
    var row = document.createElement('div');
    row.className = 'row g-3';

    highlights.forEach(function (h) {
      var col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4';
      var card = document.createElement('div');
      card.className = 'card card-dark h-100';
      card.style.borderLeft = '3px solid ' + (h.confidence === 'High' ? '#059669' : '#E69F00');
      var body = document.createElement('div');
      body.className = 'card-body';

      var title = document.createElement('h6');
      title.className = 'card-title mb-2';
      title.textContent = h.title;
      body.appendChild(title);

      var finding = document.createElement('p');
      finding.className = 'card-text small mb-2';
      finding.textContent = h.finding;
      body.appendChild(finding);

      var member = document.createElement('p');
      member.className = 'card-text text-muted small mb-0';
      member.textContent = h.member + ' | Confidence: ' + h.confidence;
      body.appendChild(member);

      card.appendChild(body);
      col.appendChild(card);
      row.appendChild(col);
    });
    frag.appendChild(row);
    container.textContent = '';
    container.appendChild(frag);
  }

  // ---------------------------------------------------------------------------
  // Executive Summary (Overview Tab)
  // ---------------------------------------------------------------------------

  function renderExecutiveSummary() {
    var container = document.getElementById('exec-summary');
    if (!container) return;
    var es = DATA.executiveSummary;
    if (!es) return;

    var iconChars = {
      'target': '\u25CE', 'brain': '\u2699', 'globe': '\u2641',
      'alert-triangle': '\u26A0', 'layers': '\u2630'
    };

    var frag = document.createDocumentFragment();
    var card = document.createElement('div');
    card.className = 'exec-summary';

    var headline = document.createElement('div');
    headline.className = 'exec-headline';
    headline.textContent = es.headline;
    card.appendChild(headline);

    (es.findings || []).forEach(function (f) {
      var row = document.createElement('div');
      row.className = 'exec-finding';

      var icon = document.createElement('div');
      icon.className = 'exec-finding-icon';
      icon.textContent = iconChars[f.icon] || '\u2022';
      row.appendChild(icon);

      var content = document.createElement('div');
      var title = document.createElement('div');
      title.className = 'exec-finding-title';
      title.textContent = f.title;
      content.appendChild(title);

      var text = document.createElement('div');
      text.className = 'exec-finding-text';
      text.textContent = f.text;
      content.appendChild(text);

      row.appendChild(content);
      card.appendChild(row);
    });

    frag.appendChild(card);
    container.textContent = '';
    container.appendChild(frag);
  }

  // ---------------------------------------------------------------------------
  // Tabs 1-11: Generic Expert Council Annotations
  // ---------------------------------------------------------------------------

  function renderTabAnnotations() {
    var ann = DATA.tabAnnotations;
    if (!ann) return;

    Object.keys(ann).forEach(function (tabKey) {
      var tabAnn = ann[tabKey];
      Object.keys(tabAnn).forEach(function (elKey) {
        var elId = tabKey + '-ann-' + elKey;
        var el = document.getElementById(elId);
        if (!el) return;

        var a = tabAnn[elKey];

        if (a.what && a.finding && a.interpretation && a.member) {
          // Chart/table annotation block (4-field pattern)
          _annBlock(el, a.what, a.finding, a.interpretation, a.member);
        } else if (a.title && a.summary) {
          // Intro block
          var h5 = document.createElement('h5');
          h5.className = 'mb-2';
          h5.textContent = a.title;
          var p = document.createElement('p');
          p.className = 'text-muted small mb-0';
          p.textContent = a.summary;
          el.textContent = '';
          el.appendChild(h5);
          el.appendChild(p);
        } else if (a.description) {
          // Description paragraph
          var dp = document.createElement('p');
          dp.className = 'text-muted small mb-0';
          dp.textContent = a.description;
          el.textContent = '';
          el.appendChild(dp);
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Tab 12: Expert Council Annotations
  // ---------------------------------------------------------------------------

  // Domain-to-CSS-class mapping for annotation border colors
  var MEMBER_DOMAIN_MAP = {
    'Psychometrics': 'psychometrics',
    'Moral Philosophy': 'philosophy',
    'Normative Ethics': 'philosophy',
    'AI Safety': 'safety',
    'Alignment': 'safety',
    'Cross-Cultural': 'cultural',
    'Computational Linguistics': 'linguistics',
    'NLP': 'linguistics',
    'Cognitive Science': 'cognitive',
    'Dual-Process': 'cognitive',
    'Religious Studies': 'religious',
    'Comparative Theology': 'religious',
    'Statistical': 'statistics',
    'AI Industry': 'industry',
    'Vendor': 'industry',
    'Policy': 'policy',
    'Governance': 'policy',
    'Developmental': 'developmental',
    'Philosophy of Mind': 'mind',
    'Consciousness': 'mind'
  };

  function _getDomainClass(memberStr) {
    if (!memberStr) return '';
    var keys = Object.keys(MEMBER_DOMAIN_MAP);
    for (var i = 0; i < keys.length; i++) {
      if (memberStr.indexOf(keys[i]) !== -1) {
        return 'ann-border-' + MEMBER_DOMAIN_MAP[keys[i]];
      }
    }
    return '';
  }

  function _addCrossRefLinks(textNode) {
    var text = textNode.textContent;
    var tabMap = {
      'Tab 1': 'tab-overview', 'Tab 2': 'tab-features', 'Tab 3': 'tab-heatmap',
      'Tab 4': 'tab-implementation', 'Tab 5': 'tab-trials', 'Tab 6': 'tab-methods',
      'Tab 7': 'tab-ranking', 'Tab 8': 'tab-trial-results', 'Tab 9': 'tab-computational',
      'Tab 10': 'tab-cultural', 'Tab 11': 'tab-model-comparison', 'Tab 12': 'tab-cross-vendor'
    };
    var pattern = /Tab (\d{1,2})(?:\s*\([^)]+\))?/g;
    var match;
    var parts = [];
    var lastIdx = 0;
    while ((match = pattern.exec(text)) !== null) {
      var tabRef = 'Tab ' + match[1];
      var tabId = tabMap[tabRef];
      if (!tabId) continue;
      if (match.index > lastIdx) {
        parts.push({ type: 'text', value: text.slice(lastIdx, match.index) });
      }
      parts.push({ type: 'link', tabId: tabId, label: match[0] });
      lastIdx = match.index + match[0].length;
    }
    if (parts.length === 0) return;
    if (lastIdx < text.length) {
      parts.push({ type: 'text', value: text.slice(lastIdx) });
    }
    textNode.textContent = '';
    parts.forEach(function (part) {
      if (part.type === 'text') {
        textNode.appendChild(document.createTextNode(part.value));
      } else {
        var badge = document.createElement('a');
        badge.className = 'cross-ref-badge';
        badge.href = '#';
        badge.textContent = part.label;
        badge.setAttribute('data-tab-id', part.tabId);
        badge.addEventListener('click', function (e) {
          e.preventDefault();
          var tid = this.getAttribute('data-tab-id');
          var tabBtn = document.getElementById(tid);
          if (tabBtn) {
            var bsTab = new bootstrap.Tab(tabBtn);
            bsTab.show();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
        textNode.appendChild(badge);
      }
    });
  }

  function _annBlock(container, what, finding, interpretation, member) {
    var block = document.createElement('div');
    block.className = 'ann-block ' + _getDomainClass(member);

    var whatP = document.createElement('p');
    whatP.className = 'ann-what mb-1';
    whatP.textContent = what;

    var findP = document.createElement('p');
    findP.className = 'ann-finding mb-1';
    var strong = document.createElement('strong');
    strong.textContent = finding;
    findP.appendChild(strong);

    var interpP = document.createElement('p');
    interpP.className = 'ann-interpretation mb-1';
    interpP.textContent = interpretation;
    _addCrossRefLinks(interpP);

    var memberP = document.createElement('p');
    memberP.className = 'ann-member mb-0';
    memberP.textContent = member;

    block.appendChild(whatP);
    block.appendChild(findP);
    block.appendChild(interpP);
    block.appendChild(memberP);

    container.textContent = '';
    container.appendChild(block);
  }

  function renderCVAnnotations() {
    var cv = DATA.crossVendor;
    if (!cv || !cv.available || !cv.annotations) return;
    var ann = cv.annotations;

    // --- Tab Introduction ---
    var introEl = document.getElementById('cv-ann-intro');
    if (introEl && ann.tabIntro) {
      var h5 = document.createElement('h5');
      h5.className = 'mb-2';
      h5.textContent = ann.tabIntro.title;
      var summP = document.createElement('p');
      summP.className = 'text-muted small mb-1';
      summP.textContent = ann.tabIntro.summary;
      var councilP = document.createElement('p');
      councilP.className = 'text-muted small mb-0';
      var councilStrong = document.createElement('strong');
      councilStrong.textContent = 'Key finding: ';
      councilP.appendChild(councilStrong);
      councilP.appendChild(document.createTextNode(ann.tabIntro.council));
      introEl.textContent = '';
      introEl.appendChild(h5);
      introEl.appendChild(summP);
      introEl.appendChild(councilP);
    }

    // --- KPI description ---
    var kpiEl = document.getElementById('cv-ann-kpi');
    if (kpiEl && ann.kpi) {
      var kpiP = document.createElement('p');
      kpiP.className = 'text-muted small mb-0';
      kpiP.textContent = ann.kpi.description;
      kpiEl.textContent = '';
      kpiEl.appendChild(kpiP);
    }

    // --- Chart annotations (6 charts) ---
    var chartKeys = ['radar', 'heatmap', 'scale', 'discrimination', 'convergence', 'theory'];
    chartKeys.forEach(function (key) {
      var el = document.getElementById('cv-ann-' + key);
      var a = ann[key];
      if (el && a) {
        _annBlock(el, a.what, a.finding, a.interpretation, a.member);
      }
    });

    // --- Trial table guide ---
    var tableEl = document.getElementById('cv-ann-table');
    if (tableEl && ann.trialTable) {
      var tt = ann.trialTable;
      var card = document.createElement('div');
      card.className = 'card card-dark';
      var body = document.createElement('div');
      body.className = 'card-body';

      var descP = document.createElement('p');
      descP.className = 'small mb-2';
      descP.textContent = tt.description;
      body.appendChild(descP);

      var guideLabel = document.createElement('strong');
      guideLabel.className = 'small';
      guideLabel.textContent = 'How to read: ';
      var guideP = document.createElement('p');
      guideP.className = 'text-muted small mb-2';
      guideP.appendChild(guideLabel);
      guideP.appendChild(document.createTextNode(tt.readingGuide));
      body.appendChild(guideP);

      var ceilP = document.createElement('p');
      ceilP.className = 'text-muted small fst-italic mb-0';
      ceilP.textContent = tt.ceilingNote;
      body.appendChild(ceilP);

      var memberP = document.createElement('p');
      memberP.className = 'text-muted small fst-italic mb-0 mt-1';
      memberP.textContent = '--- ' + tt.member;
      body.appendChild(memberP);

      card.appendChild(body);
      tableEl.textContent = '';
      tableEl.appendChild(card);
    }

    // --- Conclusions accordion (matching Tab 11 pattern) ---
    var concEl = document.getElementById('cv-ann-conclusions');
    if (concEl && ann.conclusions) {
      var accordion = document.createElement('div');
      accordion.className = 'accordion accordion-flush';
      accordion.id = 'cv-conclusions-accordion';

      ann.conclusions.forEach(function (c) {
        var collapseId = 'cv-conc-' + c.num;

        var item = document.createElement('div');
        item.className = 'accordion-item cv-accordion-item';

        // Header
        var header = document.createElement('h2');
        header.className = 'accordion-header';
        var btn = document.createElement('button');
        btn.className = 'accordion-button collapsed cv-accordion-btn';
        btn.type = 'button';
        btn.setAttribute('data-bs-toggle', 'collapse');
        btn.setAttribute('data-bs-target', '#' + collapseId);

        var badge = document.createElement('span');
        badge.className = 'badge rounded-pill me-2';
        badge.style.background = c.severity === 'Critical' ? '#e94560' : c.severity === 'Major' ? '#E69F00' : '#059669';
        badge.textContent = c.num;
        btn.appendChild(badge);

        var titleStrong = document.createElement('strong');
        titleStrong.textContent = c.title;
        btn.appendChild(titleStrong);

        header.appendChild(btn);
        item.appendChild(header);

        // Collapse body
        var collapse = document.createElement('div');
        collapse.id = collapseId;
        collapse.className = 'accordion-collapse collapse';
        collapse.setAttribute('data-bs-parent', '#cv-conclusions-accordion');
        var bodyDiv = document.createElement('div');
        bodyDiv.className = 'accordion-body text-muted small';

        var textP = document.createElement('p');
        textP.className = 'mb-2';
        textP.textContent = c.text;
        bodyDiv.appendChild(textP);

        var memberSpan = document.createElement('p');
        memberSpan.className = 'fst-italic mb-0';
        memberSpan.textContent = c.member + ' | Severity: ' + c.severity;
        bodyDiv.appendChild(memberSpan);

        collapse.appendChild(bodyDiv);
        item.appendChild(collapse);
        accordion.appendChild(item);
      });

      concEl.textContent = '';
      concEl.appendChild(accordion);
    }
  }

  // ---------------------------------------------------------------------------
  // Tab 9: Subtab Chart Init
  // ---------------------------------------------------------------------------

  function initComputationalSubtab(overrideSubId) {
    var charts = [];
    var subId = overrideSubId;
    if (!subId) {
      var activeSubPane = document.querySelector('#compSubtabContent > .tab-pane.active.show');
      if (!activeSubPane) activeSubPane = document.getElementById('comp-pane-feature');
      subId = activeSubPane ? activeSubPane.id : '';
    }

    if (subId === 'comp-pane-feature') {
      var screeEl = document.getElementById('chart-scree');
      if (screeEl) charts.push(chartScreePlot(screeEl));
      var fiEl = document.getElementById('chart-feature-importance');
      if (fiEl) charts.push(chartFeatureImportance(fiEl));
    } else if (subId === 'comp-pane-landscape') {
      var umapEl = document.getElementById('chart-umap');
      if (umapEl) charts.push(chartUMAP(umapEl));
      var tmEl = document.getElementById('chart-treemap');
      if (tmEl) charts.push(chartTreemap(tmEl));
    } else if (subId === 'comp-pane-temporal') {
      var tempEl = document.getElementById('chart-temporal');
      if (tempEl) charts.push(chartTemporal(tempEl));
      var rlhfEl = document.getElementById('chart-rlhf');
      if (rlhfEl) charts.push(chartRLHF(rlhfEl));
      var tevoEl = document.getElementById('chart-theory-evo');
      if (tevoEl) charts.push(chartTheoryEvolution(tevoEl));
    } else if (subId === 'comp-pane-gaps') {
      var ghEl = document.getElementById('chart-gap-heatmap');
      if (ghEl) charts.push(chartGapHeatmap(ghEl));
    }
    return charts;
  }

  function setupComputationalSubtabs() {
    var subTabEls = document.querySelectorAll('#compSubtabs button[data-bs-toggle="pill"]');
    subTabEls.forEach(function (btn) {
      btn.addEventListener('shown.bs.tab', function () {
        var targetPane = btn.getAttribute('data-bs-target').replace('#', '');
        // Dispose all computational charts and re-init for new subtab
        disposeCharts('pane-computational');
        activeCharts['pane-computational'] = initComputationalSubtab(targetPane);
      });
    });
  }

  function disposeCharts(paneId) {
    if (activeCharts[paneId]) {
      activeCharts[paneId].forEach(function (c) {
        if (c && !c.isDisposed()) c.dispose();
      });
      delete activeCharts[paneId];
    }
  }

  function initCharts(paneId) {
    disposeCharts(paneId);
    if (TAB_CHARTS[paneId]) {
      activeCharts[paneId] = TAB_CHARTS[paneId]();
    }
  }

  // ---------------------------------------------------------------------------
  // Tab Events
  // ---------------------------------------------------------------------------

  function setupTabs() {
    var tabEls = document.querySelectorAll('#mainTabs button[data-bs-toggle="tab"]');
    tabEls.forEach(function (tabEl) {
      tabEl.addEventListener('hidden.bs.tab', function (e) {
        var oldPane = e.target.getAttribute('data-bs-target').replace('#', '');
        disposeCharts(oldPane);
      });
      tabEl.addEventListener('shown.bs.tab', function (e) {
        var newPane = e.target.getAttribute('data-bs-target').replace('#', '');
        initCharts(newPane);
        // Lazy-init Paper Ranking when tab is first shown
        if (newPane === 'pane-ranking') {
          initPaperRanking();
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Resize
  // ---------------------------------------------------------------------------

  function onResize() {
    Object.keys(activeCharts).forEach(function (paneId) {
      if (activeCharts[paneId]) {
        activeCharts[paneId].forEach(function (c) {
          if (c && !c.isDisposed()) c.resize();
        });
      }
    });
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 200);
  });

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    renderExecutiveSummary();
    renderKPICards();
    renderFeatureTable();
    renderMethods();
    renderTrialsContainer();
    // Tab 8 static renders
    renderTrialResultsKPI();
    renderTrialResultsTable();
    // Tab 9 static renders
    renderRedundancyCards();
    renderArchetypeCards();
    renderGapTable();
    renderHealthScorecard();
    // Tab 10 static renders
    renderWLBI();
    renderSacredValues();
    renderVaultSweepTable();
    // Tab 11 static renders
    renderMCKPICards();
    renderMCTrialTable();
    renderMCKeyFindings();
    // Tab 12 static renders
    renderCVKPICards();
    renderCVTrialTable();
    renderCVCouncilHighlights();
    renderCVAnnotations();
    // Tabs 1-11 annotations
    renderTabAnnotations();
    setupTabs();
    setupComputationalSubtabs();
    // Init overview charts (default active tab)
    initCharts('pane-overview');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
