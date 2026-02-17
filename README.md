# gas-web-dashboard

Google Apps Script 기반 웹앱 대시보드 프레임워크. Material Design UI + Chart.js 차트 + 실시간 자동 새로고침.

## 주요 기능

- **Material Design UI** — Materialize CSS 기반 반응형 대시보드
- **Chart.js 차트** — 라인, 바, 파이, 도넛 차트 지원
- **실시간 데이터** — 스프레드시트 연동, 자동 새로고침
- **KPI 카드** — 핵심 지표를 한눈에
- **테이블 뷰** — 상세 데이터 조회
- **접근 제어** — 이메일 기반 화이트리스트

## 설치법

1. [Google Apps Script](https://script.google.com)에서 새 프로젝트 생성
2. `Code.gs`, `Config.gs` 파일을 각각 복사하여 붙여넣기
3. `appsscript.json`의 내용으로 매니페스트 교체 (보기 > 매니페스트 파일 표시)
4. `Config.gs`에서 `SPREADSHEET_ID` 설정
5. **배포 > 새 배포 > 웹 앱** 으로 배포
6. (선택) `setupSampleData()` 함수를 실행하면 샘플 데이터가 생성됩니다

## 사용법

### Config.gs 설정

```javascript
SPREADSHEET_ID: '여기에_스프레드시트_ID',  // 데이터 소스
SHEET_NAME: '데이터',                       // 시트 이름
AUTO_REFRESH_MS: 30000,                     // 30초마다 갱신
```

### 카드 추가

`CARDS` 배열에 카드 객체를 추가하세요:

```javascript
{
  id: 'newCard',
  title: '새 카드',
  type: 'chart',        // kpi | chart | table
  chartType: 'bar',     // line | bar | pie | doughnut
  dataRange: 'G1:H10',
  icon: 'bar_chart'
}
```

### 지원 카드 타입

| 타입 | 설명 | 데이터 형식 |
|------|------|-------------|
| `kpi` | 핵심 지표 카드 | 1행: 레이블, 2행: 값 |
| `chart` | Chart.js 차트 | 1행: 헤더, 나머지: 데이터 |
| `table` | 테이블 | 1행: 헤더, 나머지: 행 |

## 이커머스 활용 예시

### 쇼핑몰 실시간 대시보드

스프레드시트에 주문 데이터를 연동하면 실시간 이커머스 대시보드 구축 가능:

- **KPI 카드**: 오늘 매출, 주문수, 평균 객단가, 전환율
- **매출 추이 차트**: 일별/월별 매출 라인 차트
- **카테고리 파이차트**: 상품 카테고리별 매출 비율
- **주문 테이블**: 최근 주문 상세 내역

### 활용 시나리오

1. **쿠팡/네이버 셀러**: 주문 데이터를 스프레드시트로 내보내기 → 대시보드에서 실시간 모니터링
2. **재고 현황판**: 재고 수량 KPI + 부족 상품 테이블로 즉시 파악
3. **광고 성과**: ROAS, CPC, 전환율 등 광고 지표를 차트로 시각화
4. **CS 모니터링**: 문의/반품/교환 건수를 실시간 추적

## 라이선스

MIT License
