/**
 * gas-web-dashboard - 설정값
 * 이 파일의 값을 수정하여 대시보드를 커스터마이징하세요.
 */
const CONFIG = {
  // 앱 기본 설정
  APP_NAME: 'GAS Web Dashboard',
  APP_VERSION: '1.0.0',

  // 데이터 소스 스프레드시트 ID
  SPREADSHEET_ID: '',

  // 시트 이름 (데이터를 가져올 시트)
  SHEET_NAME: '데이터',

  // 자동 새로고침 간격 (밀리초, 0이면 비활성화)
  AUTO_REFRESH_MS: 30000,

  // 차트 기본 색상 팔레트
  CHART_COLORS: ['#1976D2', '#388E3C', '#F57C00', '#D32F2F', '#7B1FA2', '#0097A7'],

  // 대시보드 카드 설정
  CARDS: [
    {
      id: 'summary',
      title: '요약',
      type: 'kpi',        // kpi | chart | table
      dataRange: 'A1:D1',
      icon: 'dashboard'
    },
    {
      id: 'salesChart',
      title: '매출 추이',
      type: 'chart',
      chartType: 'line',   // line | bar | pie | doughnut
      dataRange: 'A1:B30',
      icon: 'show_chart'
    },
    {
      id: 'categoryPie',
      title: '카테고리별 비율',
      type: 'chart',
      chartType: 'doughnut',
      dataRange: 'D1:E10',
      icon: 'pie_chart'
    },
    {
      id: 'dataTable',
      title: '상세 데이터',
      type: 'table',
      dataRange: 'A1:F50',
      icon: 'table_chart'
    }
  ],

  // 접근 제한 (빈 배열이면 제한 없음)
  ALLOWED_EMAILS: [],

  // 로깅
  ENABLE_LOGGING: true
};
