/**
 * script.js — PopuLens Dashboard
 * ─────────────────────────────────────────────
 * TABLE OF CONTENTS
 *  1. Data
 *  2. Shared Chart Configs
 *  3. Cached DOM References
 *  4. State
 *  5. Utility Functions
 *  6. Filtering & Sorting
 *  7. KPI Renderer
 *  8. Chart Helper (patch in-place)
 *  9. Static Charts (built once)
 * 10. Dynamic Charts (init + patch)
 * 11. Gender Gap Renderer
 * 12. Table Renderer
 * 13. Refresh Strategy
 * 14. Event Listeners
 * 15. Mobile Drawer
 * 16. Scroll-to-Top
 * 17. Toast Notification
 * 18. Live Clock
 * 19. Boot
 */

'use strict';

/* ─────────────────────────────────────────────────────────
   1. DATA
   ───────────────────────────────────────────────────────── */

/** 30 countries with population (M), gender split, density, growth */
const COUNTRIES = [
  { name:'China',        region:'Asia',     pop:1412, male:51.4, female:48.6, density:150,  growth:0.1  },
  { name:'India',        region:'Asia',     pop:1441, male:51.8, female:48.2, density:464,  growth:0.8  },
  { name:'USA',          region:'Americas', pop:335,  male:49.4, female:50.6, density:36,   growth:0.5  },
  { name:'Indonesia',    region:'Asia',     pop:278,  male:50.1, female:49.9, density:148,  growth:0.9  },
  { name:'Pakistan',     region:'Asia',     pop:240,  male:51.2, female:48.8, density:310,  growth:2.0  },
  { name:'Brazil',       region:'Americas', pop:215,  male:49.0, female:51.0, density:25,   growth:0.6  },
  { name:'Nigeria',      region:'Africa',   pop:224,  male:50.8, female:49.2, density:248,  growth:2.6  },
  { name:'Bangladesh',   region:'Asia',     pop:173,  male:50.5, female:49.5, density:1266, growth:1.0  },
  { name:'Russia',       region:'Europe',   pop:144,  male:46.2, female:53.8, density:9,    growth:-0.2 },
  { name:'Ethiopia',     region:'Africa',   pop:127,  male:50.2, female:49.8, density:124,  growth:2.5  },
  { name:'Mexico',       region:'Americas', pop:130,  male:48.9, female:51.1, density:67,   growth:1.0  },
  { name:'Japan',        region:'Asia',     pop:125,  male:48.7, female:51.3, density:336,  growth:-0.4 },
  { name:'Philippines',  region:'Asia',     pop:116,  male:50.4, female:49.6, density:386,  growth:1.5  },
  { name:'Egypt',        region:'Africa',   pop:106,  male:51.0, female:49.0, density:107,  growth:1.8  },
  { name:'DR Congo',     region:'Africa',   pop:102,  male:50.3, female:49.7, density:45,   growth:3.1  },
  { name:'Germany',      region:'Europe',   pop:84,   male:49.2, female:50.8, density:240,  growth:0.3  },
  { name:'UK',           region:'Europe',   pop:68,   male:49.4, female:50.6, density:281,  growth:0.5  },
  { name:'France',       region:'Europe',   pop:68,   male:48.8, female:51.2, density:119,  growth:0.2  },
  { name:'Tanzania',     region:'Africa',   pop:65,   male:50.1, female:49.9, density:74,   growth:3.0  },
  { name:'South Africa', region:'Africa',   pop:60,   male:49.0, female:51.0, density:50,   growth:1.3  },
  { name:'Australia',    region:'Oceania',  pop:26,   male:49.8, female:50.2, density:3,    growth:1.2  },
  { name:'New Zealand',  region:'Oceania',  pop:5,    male:49.5, female:50.5, density:19,   growth:0.9  },
  { name:'Argentina',    region:'Americas', pop:46,   male:49.2, female:50.8, density:17,   growth:0.8  },
  { name:'Colombia',     region:'Americas', pop:52,   male:49.3, female:50.7, density:46,   growth:0.9  },
  { name:'South Korea',  region:'Asia',     pop:52,   male:50.1, female:49.9, density:527,  growth:-0.1 },
  { name:'Kenya',        region:'Africa',   pop:55,   male:50.3, female:49.7, density:97,   growth:2.3  },
  { name:'Italy',        region:'Europe',   pop:60,   male:48.9, female:51.1, density:201,  growth:-0.3 },
  { name:'Spain',        region:'Europe',   pop:47,   male:49.1, female:50.9, density:94,   growth:0.0  },
  { name:'Canada',       region:'Americas', pop:38,   male:49.7, female:50.3, density:4,    growth:1.5  },
  { name:'Saudi Arabia', region:'Asia',     pop:36,   male:56.3, female:43.7, density:16,   growth:1.9  },
];

/** Historical growth data for the line chart */
const GROWTH_DATA = {
  years:  [2000, 2005, 2010, 2015, 2020, 2024],
  series: [
    { label:'India',    color:'#e8c547', data:[1016, 1094, 1170, 1275, 1380, 1441] },
    { label:'China',    color:'#5b8df5', data:[1263, 1308, 1340, 1371, 1411, 1412] },
    { label:'USA',      color:'#f5736a', data:[282,  295,  310,  320,  331,  335 ] },
    { label:'Nigeria',  color:'#4ecdc4', data:[122,  138,  158,  182,  206,  224 ] },
    { label:'Brazil',   color:'#b06ef5', data:[174,  186,  197,  207,  213,  215 ] },
    { label:'Pakistan', color:'#f0a93b', data:[138,  153,  170,  190,  218,  240 ] },
  ],
};

/** Age-group pyramid data (global estimate, millions) */
const PYRAMID = [
  { age:'75+',   male:175, female:240 },
  { age:'65-74', male:350, female:410 },
  { age:'55-64', male:450, female:490 },
  { age:'45-54', male:530, female:560 },
  { age:'35-44', male:610, female:620 },
  { age:'25-34', male:660, female:650 },
  { age:'15-24', male:680, female:650 },
  { age:'5-14',  male:700, female:665 },
  { age:'0-4',   male:380, female:360 },
];

/** Regional totals (millions) for polar chart */
const REGION_POP = { Asia:4800, Africa:1450, Europe:750, Americas:1050, Oceania:45 };

/** Shared accent colours used across charts */
const COLORS = ['#e8c547', '#5b8df5', '#f5736a', '#4ecdc4', '#b06ef5', '#f0a93b'];


/* ─────────────────────────────────────────────────────────
   2. SHARED CHART CONFIGS
   Defined once here and spread into every chart options object
   ───────────────────────────────────────────────────────── */
const TOOLTIP = {
  backgroundColor: '#181c24',
  borderColor:     '#252a35',
  borderWidth:     1,
  titleColor:      '#e8c547',
  bodyColor:       '#e8eaf0',
  titleFont: { family:'DM Mono', size:11 },
  bodyFont:  { family:'DM Mono', size:11 },
};

const SCALE = {
  grid:  { color: '#252a35' },
  ticks: { color: '#7a8299', font:{ family:'DM Mono', size:10 } },
};

const LEGEND = {
  labels: { color:'#7a8299', font:{ family:'DM Mono', size:11 }, boxWidth:12 },
};


/* ─────────────────────────────────────────────────────────
   3. CACHED DOM REFERENCES
   Query the DOM exactly once at startup — faster than
   calling getElementById() on every render cycle.
   ───────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const DOM = {
  clock:        $('clockDisplay'),
  kpiGrid:      $('kpiGrid'),
  tableBody:    $('tableBody'),
  gapViz:       $('genderGapViz'),
  donutLegend:  $('donutLegend'),
  regionFilter: $('regionFilter'),
  sortField:    $('sortField'),
  searchInput:  $('searchInput'),
  regionTags:   $('regionTags'),
  ftags:        document.querySelectorAll('.ftag'),
  scrollTopBtn: $('scrollTopBtn'),
  toast:        $('toast'),
};


/* ─────────────────────────────────────────────────────────
   4. STATE
   ───────────────────────────────────────────────────────── */
let activeRegion = 'all';           // tracks which filter tag is active
const charts = {};                   // Chart.js instances — updated in-place
let cache = null;                    // filtered dataset reused within one cycle


/* ─────────────────────────────────────────────────────────
   5. UTILITY FUNCTIONS
   ───────────────────────────────────────────────────────── */

/**
 * Format a raw population number:
 *   >= 1000 M  →  "X.XB"
 *   < 1000 M   →  "XXXM"
 */
const fmt  = n => n >= 1000 ? (n / 1000).toFixed(1) + 'B' : n + 'M';

/** Format with locale thousands separator */
const fmtM = n => n.toLocaleString() + 'M';

/**
 * debounce(fn, ms)
 * Returns a version of fn that only fires after `ms` ms of silence.
 * Used on the search input so we don't re-render on every keystroke.
 */
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}


/* ─────────────────────────────────────────────────────────
   6. FILTERING & SORTING
   ───────────────────────────────────────────────────────── */

/**
 * getFiltered()
 * Reads all active filters, returns a sorted copy of COUNTRIES.
 * Called exactly ONCE per render cycle; result stored in `cache`.
 */
function getFiltered() {
  const region = DOM.regionFilter.value;
  const search = DOM.searchInput.value.toLowerCase().trim();
  const sort   = DOM.sortField.value;

  let d = COUNTRIES;

  if (region !== 'all')       d = d.filter(c => c.region === region);
  if (activeRegion !== 'all') d = d.filter(c => c.region === activeRegion);
  if (search)                 d = d.filter(c => c.name.toLowerCase().includes(search));

  // Sort descending by selected field
  return [...d].sort((a, b) => b[sort] - a[sort]);
}


/* ─────────────────────────────────────────────────────────
   7. KPI RENDERER
   ───────────────────────────────────────────────────────── */

/**
 * renderKPIs(d)
 * Builds the 5 KPI card tiles from the filtered dataset `d`.
 */
function renderKPIs(d) {
  const n = d.length || 1;
  const totalPop  = d.reduce((s, c) => s + c.pop,    0);
  const avgMale   = (d.reduce((s, c) => s + c.male,   0) / n).toFixed(1);
  const avgFemale = (d.reduce((s, c) => s + c.female, 0) / n).toFixed(1);
  const avgGrowth = (d.reduce((s, c) => s + c.growth, 0) / n).toFixed(2);

  const cards = [
    {
      label: 'Total Population',
      val:   fmt(totalPop),
      sub:   'Across selected countries',
      delta: '+0.8% YoY',
      dir:   'up',
    },
    {
      label: 'Countries',
      val:   n,
      sub:   'Matched data points',
      delta: '—',
      dir:   '',
    },
    {
      label: 'Avg. Male %',
      val:   avgMale + '%',
      sub:   'Mean gender share',
      delta: +avgMale > 50 ? 'Male surplus' : 'Balanced',
      dir:   'up',
    },
    {
      label: 'Avg. Female %',
      val:   avgFemale + '%',
      sub:   'Mean gender share',
      delta: +avgFemale > 50 ? 'Female majority' : '—',
      dir:   'up',
    },
    {
      label: 'Avg. Growth',
      val:   avgGrowth + '%',
      sub:   'Annual growth rate',
      delta: +avgGrowth > 1 ? '↑ Accelerating' : '→ Stable',
      dir:   +avgGrowth > 0 ? 'up' : 'down',
    },
  ];

  DOM.kpiGrid.innerHTML = cards.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.val}</div>
      <div class="kpi-sub">${k.sub}</div>
      <div class="kpi-delta ${k.dir}">${k.delta}</div>
    </div>
  `).join('');
}


/* ─────────────────────────────────────────────────────────
   8. CHART HELPER
   Patch data in-place instead of destroy/recreate.
   This gives smooth animated transitions when filters change.
   ───────────────────────────────────────────────────────── */

/**
 * patchChart(chart, labels, datasets)
 * @param {Chart}    chart    — Chart.js instance
 * @param {string[]} labels   — new x-axis labels
 * @param {object[]} datasets — partial dataset objects (only changed keys)
 */
function patchChart(chart, labels, datasets) {
  chart.data.labels = labels;
  datasets.forEach((ds, i) => Object.assign(chart.data.datasets[i], ds));
  chart.update('active');
}


/* ─────────────────────────────────────────────────────────
   9. STATIC CHARTS (built exactly once at init)
   These show global data and do NOT change with filters.
   ───────────────────────────────────────────────────────── */

/** Line chart: population growth 2000–2024 for 6 countries */
function initLine() {
  charts.line = new Chart($('lineChart'), {
    type: 'line',
    data: {
      labels: GROWTH_DATA.years,
      datasets: GROWTH_DATA.series.map(s => ({
        label:           s.label,
        data:            s.data,
        borderColor:     s.color,
        backgroundColor: s.color + '22',
        borderWidth:     2.5,
        pointRadius:     3,
        pointHoverRadius: 6,
        tension:         0.4,
        fill:            false,
      })),
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend:  LEGEND,
        tooltip: {
          ...TOOLTIP,
          callbacks: { label: c => `  ${c.dataset.label}: ${c.raw}M` },
        },
      },
      scales: {
        x: SCALE,
        y: { ...SCALE, ticks:{ ...SCALE.ticks, callback: v => v + 'M' } },
      },
    },
  });
}

/** Polar area chart: population share by world region */
function initPolar() {
  charts.polar = new Chart($('polarChart'), {
    type: 'polarArea',
    data: {
      labels: Object.keys(REGION_POP),
      datasets: [{
        data:            Object.values(REGION_POP),
        backgroundColor: COLORS.map(c => c + '99'),
        borderColor:     COLORS,
        borderWidth:     1.5,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color:'#7a8299', font:{ family:'DM Mono', size:10 }, boxWidth:10, padding:10 },
        },
        tooltip: {
          ...TOOLTIP,
          callbacks: { label: c => `  ${c.label}: ${c.raw}M` },
        },
      },
      scales: {
        r: {
          grid:  { color: '#252a35' },
          ticks: { color:'#7a8299', font:{ family:'DM Mono', size:9 }, backdropColor:'transparent' },
        },
      },
    },
  });
}

/** Horizontal bar chart (pyramid shape): age-group breakdown */
function initPyramid() {
  charts.pyramid = new Chart($('pyramidChart'), {
    type: 'bar',
    data: {
      labels: PYRAMID.map(r => r.age),
      datasets: [
        {
          label:           'Male',
          data:            PYRAMID.map(r => -r.male),     // negative = left side
          backgroundColor: '#5b8df5bb',
          borderColor:     '#5b8df5',
          borderWidth:     1,
          borderRadius:    { topLeft:3, bottomLeft:3 },
          borderSkipped:   false,
        },
        {
          label:           'Female',
          data:            PYRAMID.map(r => r.female),
          backgroundColor: '#f5736abb',
          borderColor:     '#f5736a',
          borderWidth:     1,
          borderRadius:    { topRight:3, bottomRight:3 },
          borderSkipped:   false,
        },
      ],
    },
    options: {
      indexAxis:           'y',
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend:  LEGEND,
        tooltip: {
          ...TOOLTIP,
          callbacks: { label: c => ` ${c.dataset.label}: ${Math.abs(c.raw)}M` },
        },
      },
      scales: {
        x: { ...SCALE, ticks:{ ...SCALE.ticks, callback: v => Math.abs(v) + 'M' } },
        y: SCALE,
      },
    },
  });
}


/* ─────────────────────────────────────────────────────────
   10. DYNAMIC CHARTS (init once, patched on filter changes)
   ───────────────────────────────────────────────────────── */

/** Grouped bar: top-10 countries by male vs female population (M) */
function initBar(d) {
  const top = d.slice(0, 10);
  charts.bar = new Chart($('barChart'), {
    type: 'bar',
    data: {
      labels: top.map(c => c.name),
      datasets: [
        {
          label:           'Male',
          data:            top.map(c => +(c.pop * c.male   / 100).toFixed(1)),
          backgroundColor: '#5b8df5cc',
          borderColor:     '#5b8df5',
          borderWidth:     1,
          borderRadius:    3,
        },
        {
          label:           'Female',
          data:            top.map(c => +(c.pop * c.female / 100).toFixed(1)),
          backgroundColor: '#f5736acc',
          borderColor:     '#f5736a',
          borderWidth:     1,
          borderRadius:    3,
        },
      ],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend:  LEGEND,
        tooltip: {
          ...TOOLTIP,
          callbacks: { label: c => `  ${c.dataset.label}: ${c.raw}M` },
        },
      },
      scales: {
        x: { ...SCALE, ticks:{ ...SCALE.ticks, maxRotation:35 } },
        y: { ...SCALE, ticks:{ ...SCALE.ticks, callback: v => v + 'M' } },
      },
    },
  });
}

/** Doughnut: weighted male/female share across filtered countries */
function initDonut(d) {
  const { mp, fp } = split(d);
  charts.donut = new Chart($('donutChart'), {
    type: 'doughnut',
    data: {
      labels:   ['Male', 'Female'],
      datasets: [{
        data:            [mp, fp],
        backgroundColor: ['#5b8df5', '#f5736a'],
        borderColor:     '#111318',
        borderWidth:     3,
        hoverOffset:     8,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      cutout:              '72%',
      plugins: {
        legend:  { display: false },
        tooltip: {
          ...TOOLTIP,
          callbacks: { label: c => `  ${c.label}: ${c.raw}%` },
        },
      },
    },
  });
}


/* ─────────────────────────────────────────────────────────
   Gender split helper
   Returns weighted male %, female %, and total population.
   ───────────────────────────────────────────────────────── */
function split(d) {
  const tm  = d.reduce((s, c) => s + c.pop * c.male   / 100, 0);
  const tf  = d.reduce((s, c) => s + c.pop * c.female / 100, 0);
  const tot = tm + tf || 1;
  return {
    mp:    +(tm / tot * 100).toFixed(1),
    fp:    +(tf / tot * 100).toFixed(1),
    total: d.reduce((s, c) => s + c.pop, 0),
  };
}

/** Update bar chart data in-place */
function patchBar(d) {
  const top = d.slice(0, 10);
  patchChart(charts.bar, top.map(c => c.name), [
    { data: top.map(c => +(c.pop * c.male   / 100).toFixed(1)) },
    { data: top.map(c => +(c.pop * c.female / 100).toFixed(1)) },
  ]);
}

/** Update donut + legend in-place */
function patchDonut(d) {
  const { mp, fp, total } = split(d);
  patchChart(charts.donut, ['Male', 'Female'], [{ data:[mp, fp] }]);

  DOM.donutLegend.innerHTML = `
    <div class="legend-item">
      <div class="legend-dot" style="background:#5b8df5"></div>
      <span class="legend-pct">${mp}%</span>&nbsp;
      <span class="legend-lbl">Male</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:#f5736a"></div>
      <span class="legend-pct">${fp}%</span>&nbsp;
      <span class="legend-lbl">Female</span>
    </div>
    <div class="legend-item" style="margin-top:12px">
      <div class="legend-dot" style="background:#e8c547"></div>
      <span class="legend-pct">${d.length}</span>&nbsp;
      <span class="legend-lbl">countries</span>
    </div>
    <div class="legend-item">
      <div class="legend-dot" style="background:#4ecdc4"></div>
      <span class="legend-pct">${fmt(total)}</span>&nbsp;
      <span class="legend-lbl">total pop</span>
    </div>
  `;
}


/* ─────────────────────────────────────────────────────────
   11. GENDER GAP RENDERER
   ───────────────────────────────────────────────────────── */

/**
 * renderGap(d)
 * Draws the split-bar gender gap visualization for top 10 countries.
 */
function renderGap(d) {
  DOM.gapViz.innerHTML = d.slice(0, 10).map(c => {
    // Width is proportional to deviation from 50/50
    const mW = Math.min(Math.abs((c.male   - 50) / 50 * 100) * 3 + 2, 48);
    const fW = Math.min(Math.abs((c.female - 50) / 50 * 100) * 3 + 2, 48);
    return `
      <div class="gap-row">
        <div class="gap-label">${c.name}</div>
        <div class="gap-pct-m">${c.male}%</div>
        <div class="gap-track">
          <div class="gap-male"   style="width:${mW}%"></div>
          <div class="gap-female" style="width:${fW}%"></div>
        </div>
        <div class="gap-pct-f">${c.female}%</div>
      </div>
    `;
  }).join('');
}


/* ─────────────────────────────────────────────────────────
   12. TABLE RENDERER
   ───────────────────────────────────────────────────────── */

/**
 * renderTable(d)
 * Populates the data table with sorted, filtered country rows.
 */
function renderTable(d) {
  // Use reduce to find max — avoids Math.max(...spread) stack overflow on large arrays
  const maxPop = d.reduce((m, c) => c.pop > m ? c.pop : m, 0);

  const rankClass = i => {
    if (i === 0) return 'gold';
    if (i === 1) return 'silver';
    if (i === 2) return 'bronze';
    return '';
  };

  DOM.tableBody.innerHTML = d.map((c, i) => `
    <tr>
      <td><span class="rank-badge ${rankClass(i)}">${i + 1}</span></td>
      <td style="font-weight:500">${c.name}</td>
      <td style="color:var(--muted)">${c.region}</td>
      <td>${fmtM(c.pop)}</td>
      <td style="color:#5b8df5">${c.male}%</td>
      <td style="color:#f5736a">${c.female}%</td>
      <td>${c.density.toLocaleString()}</td>
      <td class="kpi-delta ${c.growth > 0 ? 'up' : 'down'}">
        ${c.growth > 0 ? '+' : ''}${c.growth}%
      </td>
      <td>
        <div class="mini-bar" style="width:${(c.pop / maxPop * 100).toFixed(0)}%"></div>
      </td>
    </tr>
  `).join('');
}


/* ─────────────────────────────────────────────────────────
   13. REFRESH STRATEGY
   ─────────────────────────────────────────────────────────
   refreshDynamic → only filter-sensitive components (fast path)
   refreshAll     → also rebuilds static charts (init only)
   ───────────────────────────────────────────────────────── */

/** Fast path: re-render only filter-sensitive parts */
function refreshDynamic() {
  cache = getFiltered();   // compute once, reuse across all renderers
  renderKPIs(cache);
  patchBar(cache);
  patchDonut(cache);
  renderGap(cache);
  renderTable(cache);
}

/** Full init: build static charts once, then run dynamic update */
function refreshAll() {
  cache = getFiltered();
  renderKPIs(cache);

  // Static charts — built exactly once
  if (!charts.line)    initLine();
  if (!charts.polar)   initPolar();
  if (!charts.pyramid) initPyramid();

  // Dynamic charts — init or patch depending on whether they exist
  if (!charts.bar)   initBar(cache);   else patchBar(cache);
  if (!charts.donut) initDonut(cache); else patchDonut(cache);

  renderGap(cache);
  renderTable(cache);
}

/** Reset all filters back to their default values */
function resetFilters() {
  DOM.regionFilter.value  = 'all';
  $('yearRange').value    = '2024';
  DOM.sortField.value     = 'pop';
  DOM.searchInput.value   = '';
  activeRegion            = 'all';

  DOM.ftags.forEach(t => t.classList.remove('active'));
  DOM.ftags[0].classList.add('active');

  refreshDynamic();
  showToast('Filters reset');
}


/* ─────────────────────────────────────────────────────────
   14. EVENT LISTENERS
   ───────────────────────────────────────────────────────── */

// Region dropdown → refresh all filter-sensitive charts
DOM.regionFilter.addEventListener('change', () => {
  refreshDynamic();
  showToast('Region filter applied');
});

// Sort dropdown → only need to re-sort the table, no chart change
DOM.sortField.addEventListener('change', () => {
  cache = getFiltered();
  renderTable(cache);
});

// Search input → debounced so we wait 280 ms after the user stops typing
DOM.searchInput.addEventListener('input', debounce(() => {
  cache = getFiltered();
  renderKPIs(cache);
  patchBar(cache);
  patchDonut(cache);
  renderGap(cache);
  renderTable(cache);
}, 280));

// Region filter tags (delegated listener on parent — one listener for all tags)
DOM.regionTags.addEventListener('click', e => {
  if (!e.target.classList.contains('ftag')) return;

  DOM.ftags.forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  activeRegion = e.target.dataset.region;

  refreshDynamic();
  showToast(activeRegion === 'all' ? 'Showing all regions' : `Region: ${activeRegion}`);
});


/* ─────────────────────────────────────────────────────────
   15. MOBILE DRAWER
   ───────────────────────────────────────────────────────── */
const hamburger    = $('hamburgerBtn');
const mobileDrawer = $('mobileDrawer');
const overlay      = $('drawerOverlay');

/** Open the mobile filter drawer */
function openDrawer() {
  mobileDrawer.classList.add('open');
  overlay.classList.add('open');
  hamburger.classList.add('open');
  document.body.style.overflow = 'hidden';  // prevent background scroll
}

/** Close the mobile filter drawer */
function closeDrawer() {
  mobileDrawer.classList.remove('open');
  overlay.classList.remove('open');
  hamburger.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  mobileDrawer.classList.contains('open') ? closeDrawer() : openDrawer();
});

/** Sync mobile drawer selects back to the desktop controls, then refresh */
function applyMobileFilters() {
  DOM.regionFilter.value = $('regionFilterMobile').value;
  DOM.sortField.value    = $('sortFieldMobile').value;
  closeDrawer();
  refreshDynamic();
  showToast('Filters applied');
}


/* ─────────────────────────────────────────────────────────
   16. SCROLL-TO-TOP BUTTON
   Shows after scrolling 300px; hides when near the top.
   ───────────────────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    DOM.scrollTopBtn.classList.add('visible');
  } else {
    DOM.scrollTopBtn.classList.remove('visible');
  }
}, { passive: true });


/* ─────────────────────────────────────────────────────────
   17. TOAST NOTIFICATION
   ───────────────────────────────────────────────────────── */
let toastTimer;

/**
 * showToast(message)
 * Briefly shows a non-blocking notification at the bottom-right.
 * Auto-dismisses after 2.2 seconds.
 */
function showToast(message) {
  clearTimeout(toastTimer);
  DOM.toast.textContent = message;
  DOM.toast.classList.add('show');
  toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), 2200);
}


/* ─────────────────────────────────────────────────────────
   18. LIVE CLOCK
   Uses a single cached DOM reference; fires every second.
   ───────────────────────────────────────────────────────── */
(function startClock() {
  function render() {
    const now = new Date();
    DOM.clock.textContent =
      now.toLocaleString('en-IN', {
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      + ' IST · '
      + now.toLocaleDateString('en-IN', {
        day:   '2-digit',
        month: 'short',
        year:  'numeric',
      });
  }
  render();
  setInterval(render, 1000);
})();


/* ─────────────────────────────────────────────────────────
   19. BOOT
   ───────────────────────────────────────────────────────── */
refreshAll();
