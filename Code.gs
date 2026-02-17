/**
 * gas-web-dashboard v1.0.0
 * GAS 웹앱 대시보드 프레임워크
 * Material Design + Chart.js 기반 실시간 데이터 대시보드
 */

// ─── 웹앱 진입점 ───

function doGet(e) {
  try {
    if (CONFIG.ALLOWED_EMAILS.length > 0) {
      const user = Session.getActiveUser().getEmail();
      if (!CONFIG.ALLOWED_EMAILS.includes(user)) {
        return HtmlService.createHtmlOutput('<h2>접근 권한이 없습니다.</h2>');
      }
    }
    return HtmlService.createHtmlOutput(buildDashboardHtml_())
      .setTitle(CONFIG.APP_NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    log_('ERROR', 'doGet 실패: ' + err.message);
    return HtmlService.createHtmlOutput('<h2>오류가 발생했습니다: ' + err.message + '</h2>');
  }
}

// ─── 클라이언트에서 호출하는 API ───

function getCardData(cardId) {
  try {
    const card = CONFIG.CARDS.find(c => c.id === cardId);
    if (!card) throw new Error('카드를 찾을 수 없습니다: ' + cardId);

    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('시트를 찾을 수 없습니다: ' + CONFIG.SHEET_NAME);

    const range = sheet.getRange(card.dataRange);
    const values = range.getValues();

    return { success: true, data: values, card: card };
  } catch (err) {
    log_('ERROR', 'getCardData 실패 [' + cardId + ']: ' + err.message);
    return { success: false, error: err.message };
  }
}

function getAllCardsData() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('시트를 찾을 수 없습니다: ' + CONFIG.SHEET_NAME);

    const result = {};
    CONFIG.CARDS.forEach(card => {
      try {
        const values = sheet.getRange(card.dataRange).getValues();
        result[card.id] = { success: true, data: values, card: card };
      } catch (e) {
        result[card.id] = { success: false, error: e.message };
      }
    });
    return result;
  } catch (err) {
    log_('ERROR', 'getAllCardsData 실패: ' + err.message);
    return { error: err.message };
  }
}

function getDashboardConfig() {
  return {
    appName: CONFIG.APP_NAME,
    autoRefreshMs: CONFIG.AUTO_REFRESH_MS,
    chartColors: CONFIG.CHART_COLORS,
    cards: CONFIG.CARDS
  };
}

// ─── HTML 빌더 ───

function buildDashboardHtml_() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CONFIG.APP_NAME}</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { font-family: 'Noto Sans KR', sans-serif; }
    body { background: #f5f5f5; }
    .brand-bar { background: linear-gradient(135deg, #1976D2, #1565C0); padding: 20px 30px; color: #fff; }
    .brand-bar h4 { margin: 0; font-weight: 500; }
    .brand-bar .sub { opacity: 0.8; font-size: 14px; }
    .dash-card { border-radius: 12px; margin-top: 20px; }
    .dash-card .card-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .dash-card .card-title-row i { color: #1976D2; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; }
    .kpi-item { text-align: center; padding: 16px; background: #E3F2FD; border-radius: 8px; }
    .kpi-item .value { font-size: 28px; font-weight: 700; color: #1565C0; }
    .kpi-item .label { font-size: 13px; color: #666; margin-top: 4px; }
    .refresh-info { text-align: right; font-size: 12px; color: #999; padding: 8px 16px; }
    .loading { text-align: center; padding: 40px; color: #999; }
    canvas { max-height: 300px; }
    table.striped > tbody > tr:nth-child(odd) { background: #FAFAFA; }
  </style>
</head>
<body>
  <div class="brand-bar">
    <h4 id="appTitle">${CONFIG.APP_NAME}</h4>
    <div class="sub" id="refreshInfo">로딩 중...</div>
  </div>
  <div class="container" style="max-width:1200px; padding-bottom:40px;">
    <div class="row" id="cardContainer">
      <div class="loading"><div class="preloader-wrapper active"><div class="spinner-layer spinner-blue-only"><div class="circle-clipper left"><div class="circle"></div></div></div></div></div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
  <script>
    const charts = {};
    let dashConfig = null;

    function init() {
      google.script.run.withSuccessHandler(cfg => {
        dashConfig = cfg;
        document.getElementById('appTitle').textContent = cfg.appName;
        loadAllCards();
        if (cfg.autoRefreshMs > 0) setInterval(loadAllCards, cfg.autoRefreshMs);
      }).withFailureHandler(err => {
        document.getElementById('cardContainer').innerHTML = '<p class="red-text">설정 로드 실패: ' + err.message + '</p>';
      }).getDashboardConfig();
    }

    function loadAllCards() {
      google.script.run.withSuccessHandler(renderAllCards).withFailureHandler(err => {
        M.toast({html: '데이터 로드 실패: ' + err.message});
      }).getAllCardsData();
    }

    function renderAllCards(allData) {
      if (allData.error) {
        document.getElementById('cardContainer').innerHTML = '<p class="red-text">' + allData.error + '</p>';
        return;
      }
      const container = document.getElementById('cardContainer');
      container.innerHTML = '';
      dashConfig.cards.forEach(card => {
        const d = allData[card.id];
        const col = document.createElement('div');
        col.className = card.type === 'table' ? 'col s12' : 'col s12 m6';
        col.innerHTML = '<div class="card dash-card"><div class="card-content">' +
          '<div class="card-title-row"><i class="material-icons">' + card.icon + '</i><span class="card-title">' + card.title + '</span></div>' +
          '<div id="content-' + card.id + '">' + (d && d.success ? '' : '<p class="red-text">' + (d ? d.error : '데이터 없음') + '</p>') + '</div>' +
          '</div></div>';
        container.appendChild(col);
        if (d && d.success) renderCardContent(card, d.data);
      });
      document.getElementById('refreshInfo').textContent = '마지막 업데이트: ' + new Date().toLocaleTimeString('ko-KR');
    }

    function renderCardContent(card, data) {
      const el = document.getElementById('content-' + card.id);
      if (!el) return;
      if (card.type === 'kpi') renderKpi(el, data);
      else if (card.type === 'chart') renderChart(el, card, data);
      else if (card.type === 'table') renderTable(el, data);
    }

    function renderKpi(el, data) {
      if (!data.length) return;
      let html = '<div class="kpi-grid">';
      // 첫 행을 레이블, 둘째 행(또는 같은 행)을 값으로
      const labels = data[0] || [];
      const values = data[1] || data[0];
      labels.forEach((label, i) => {
        const val = data.length > 1 ? (values[i] || '-') : label;
        const lbl = data.length > 1 ? label : ('항목 ' + (i + 1));
        html += '<div class="kpi-item"><div class="value">' + formatNumber(val) + '</div><div class="label">' + lbl + '</div></div>';
      });
      html += '</div>';
      el.innerHTML = html;
    }

    function renderChart(el, card, data) {
      if (charts[card.id]) charts[card.id].destroy();
      const canvas = document.createElement('canvas');
      canvas.id = 'chart-' + card.id;
      el.innerHTML = '';
      el.appendChild(canvas);
      const labels = data.slice(1).map(r => r[0]);
      const datasets = [];
      for (let c = 1; c < (data[0] || []).length; c++) {
        datasets.push({
          label: data[0][c] || '시리즈 ' + c,
          data: data.slice(1).map(r => r[c]),
          backgroundColor: dashConfig.chartColors.map(c => c + '88'),
          borderColor: dashConfig.chartColors,
          borderWidth: 2, fill: card.chartType === 'line', tension: 0.3
        });
      }
      charts[card.id] = new Chart(canvas, {
        type: card.chartType === 'doughnut' ? 'doughnut' : card.chartType,
        data: { labels, datasets },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
      });
    }

    function renderTable(el, data) {
      if (!data.length) { el.innerHTML = '<p>데이터가 없습니다.</p>'; return; }
      let html = '<table class="striped responsive-table"><thead><tr>';
      data[0].forEach(h => html += '<th>' + h + '</th>');
      html += '</tr></thead><tbody>';
      data.slice(1).forEach(row => {
        html += '<tr>';
        row.forEach(cell => html += '<td>' + (cell !== '' ? cell : '-') + '</td>');
        html += '</tr>';
      });
      html += '</tbody></table>';
      el.innerHTML = html;
    }

    function formatNumber(v) {
      if (typeof v === 'number') return v.toLocaleString('ko-KR');
      return v;
    }

    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}

// ─── 유틸리티 ───

function log_(level, message) {
  if (!CONFIG.ENABLE_LOGGING) return;
  console.log('[' + level + '] ' + new Date().toISOString() + ' ' + message);
}

// ─── 초기 설정 도우미 ───

function setupSampleData() {
  const ss = CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.create(CONFIG.APP_NAME + ' 데이터');

  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);

  sheet.getRange('A1:D2').setValues([
    ['총 매출', '주문 수', '평균 객단가', '전환율'],
    [12500000, 342, 36549, '3.2%']
  ]);

  sheet.getRange('A4:B14').setValues([
    ['날짜', '매출'],
    ['1월', 8500000], ['2월', 9200000], ['3월', 11000000],
    ['4월', 10500000], ['5월', 12500000], ['6월', 13800000],
    ['7월', 12000000], ['8월', 14500000], ['9월', 15200000],
    ['10월', 16000000]
  ]);

  sheet.getRange('D4:E9').setValues([
    ['카테고리', '매출'],
    ['전자제품', 45], ['의류', 25], ['식품', 15], ['생활용품', 10], ['기타', 5]
  ]);

  Logger.log('샘플 데이터 생성 완료. 스프레드시트 ID: ' + ss.getId());
  Logger.log('Config.gs의 SPREADSHEET_ID에 위 ID를 입력하세요.');
  return ss.getId();
}
