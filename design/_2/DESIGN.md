---
name: 동일토건 공무 본사 엔터프라이즈 포털
colors:
  surface: '#faf8ff'
  surface-dim: '#dad9e1'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3fa'
  surface-container: '#eeedf4'
  surface-container-high: '#e9e7ef'
  surface-container-highest: '#e3e1e9'
  on-surface: '#1a1b21'
  on-surface-variant: '#444651'
  inverse-surface: '#2f3036'
  inverse-on-surface: '#f1f0f7'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#4b1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e2c00'
  on-tertiary-container: '#f39461'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#773205'
  background: '#faf8ff'
  on-background: '#1a1b21'
  surface-variant: '#e3e1e9'
  status-normal: '#059669'
  status-normal-bg: '#ECFDF5'
  status-normal-border: '#A7F3D0'
  status-warning: '#D97706'
  status-warning-bg: '#FFFBEB'
  status-warning-border: '#FDE68A'
  status-danger: '#E11D48'
  status-danger-bg: '#FFF1F2'
  status-danger-border: '#FECDD3'
  surface-table-header: '#F8FAFC'
  surface-table-hover: '#F1F5F9'
  surface-table-selected: '#EFF6FF'
  surface-expanded-bg: '#F8FAFC'
  border-grid: '#E2E8F0'
  border-focus: '#1D4ED8'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  metric-value:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  metric-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  table-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  table-cell-text:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  table-cell-num:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  badge-label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

본 디자인 시스템은 건설 본사 공무팀의 데이터 중심 의사결정을 지원하기 위해 구축된 **고밀도 엔터프라이즈 정보 아키텍처**를 지향합니다. 감성적 장식 요소를 배제하고, 수백 개의 공정·기성 수치와 다중 현장 상황을 한눈에 조망할 수 있는 **정통 기업용 ERP / 대시보드 스타일**을 따릅니다.

### 핵심 브랜드 퍼소나
- **신뢰와 권위 (Institutional Rigor):** 전통 건설 본사의 무게감을 담은 딥 네이비(`Deep Navy`)와 차분한 슬레이트 그레이를 중심에 두어 오랜 업력의 안정감과 신뢰도를 전달합니다.
- **정밀함과 투명성 (Engineering Precision):** 단 0.1%의 기성률과 0.1pp의 공정 지연도 즉각적으로 식별할 수 있도록 숫자 중심의 서식 체계와 엄격한 상태(Status) 가시성을 제공합니다.
- **실무 중심의 고밀도 (High-Density Utility):** 복잡한 엑셀 시트 144행의 피로도를 해소하기 위해 간결한 수평 그리드, 최소화된 라운딩, 명확한 행(Row) 대비를 채택하여 시각적 인지 부하를 줄입니다.

## Colors

네이비 기반의 코어 팔레트와 3단계 상태 신호(정상/주의/점검) 체계로 구성됩니다. 데이터 표의 시각적 피로도를 방지하기 위해 바탕면은 무채색과 연회색을 유지하고, 위험 수준에만 선별적으로 고채도 시각 지표를 부여합니다.

### 상태 판정 색상 원칙
- **정상 (Normal):** 공정차이 $\ge 0\,\text{pp}$. 에메랄드 그린(`#059669`)을 사용하여 계획 대비 적기 진행 상태를 전달합니다.
- **주의 (Warning):** $-5\,\text{pp} < \text{공정차이} < 0\,\text{pp}$. 앰버 오렌지(`#D97706`)를 사용하여 관리 감독이 필요한 잠재적 지연 상태를 표기합니다.
- **점검 (Danger/Inspection):** $\text{공정차이} \le -5\,\text{pp}$. 로즈 레드(`#E11D48`)와 틴트 배경(`#FFF1F2`)을 복합 적용해 즉각적인 확인 및 본사 대응 계획 소명이 필요한 현장을 강조합니다.

모든 배경색과 글자색 조합은 WCAG 2.1 AA 기준(4.5:1 이상)을 충족하여 가독성을 보장합니다.

## Typography

공학적·재무적 데이터 처리에 최적화된 `Inter` 단일 폰트 체계를 적용합니다. 

### 숫자 타이포그래피 가이드
- **고정폭 숫자(Tabular Figures):** 금액, 공정률, 차이 수치가 정렬되는 모든 테이블 셀과 KPI 지표에는 `font-variant-numeric: tabular-nums`를 강제하여 자릿수 흔들림 없이 수직 비교가 가능하도록 합니다.
- **단위 표기 규격:**
  - 금액: `백만원` (천 단위 콤마 필수, 소수점 1자리 표기 예: `424,063.4백만원`)
  - 공정률 및 기성률: `%` (소수점 1자리 필수 예: `73.2%`)
  - 공정차이: `pp` (부호 명시 필수 예: `+1.2pp`, `0.0pp`, `−10.7pp`)
- **시각적 계층:** 본문 글꼴 크기를 12~13px로 조밀하게 세팅하여 스크롤 없이도 한 화면 내에서 12개 현장의 15개 속성을 비교할 수 있도록 정보 집약성을 극대화합니다.

## Layout & Spacing

본 시스템은 본사 PC 환경(1920x1080 및 1440x900)에 완벽히 최적화된 **12컬럼 고정 패딩 그리드**를 사용합니다.

- **그리드 및 캔버스 여백:** 좌우 마진 `1.5rem(24px)`, 열 사이 간격 `1rem(16px)`을 기준으로 메인 콘텐츠가 좌우로 적절히 확장되는 Fluid 구조를 취합니다.
- **고밀도 컴포넌트 간격:** 
  - 테이블 헤더/셀 세로 패딩: `0.5rem(8px)`을 적용해 1개 화면 내에서 12개 행 전체가 스크롤 없이 노출되도록 타이트한 수직 리듬을 형성합니다.
  - 필터 툴바 영역: `0.75rem(12px)` 여백을 주어 기준 월(2026-09), 지역, 공종 셀렉터를 빠르고 오작동 없이 조작할 수 있도록 돕습니다.

## Elevation & Depth

화려한 드롭 섀도우나 블러 효과를 배제하고, 전통적인 선(`Borders`)과 면의 명도 차이(`Tonal Layers`)로 깊이를 만듭니다.

- **기본 면 분할 (Level 0):** 기본 캔버스는 연한 슬레이트 그레이(`#F8FAFC`), 대시보드 카드와 데이터 테이블 영역은 순백색(`#FFFFFF`)에 1px 선형 테두리(`#E2E8F0`)를 적용합니다.
- **카드 및 모달 (Level 1):** 요약 카드 및 드롭다운 메뉴는 아주 미세한 뉴트럴 섀도우(`0 1px 3px 0 rgba(15, 23, 42, 0.08)`)만을 허용합니다.
- **행 강조 및 포커스 (Selected Layer):** 요약 표 또는 점검 순위에서 선택된 행은 섀도우 대신 `#EFF6FF` 배경과 좌측 3px 네이비(`#1E3A8A`) 솔리드 인디케이터 라인을 통해 명확히 식별됩니다.

## Shapes

엔터프라이즈 ERP 본연의 단정함과 절제미를 전달하기 위해 **`roundedness: 1` (Soft, 기본 4px / 0.25rem)** 설정을 엄격히 적용합니다.

- **컨테이너 및 카드:** 모서리 반경 `4px`로 정돈하여 화면 내 밀집도를 높입니다.
- **버튼, 인풋, 셀렉트:** `4px` 반경을 유지하여 테두리 선과의 정렬감을 극대화합니다.
- **상태 태그 및 뱃지:** 소형 뱃지 역시 과도한 알약(Pill) 형태를 피하고 `2px`~`4px`의 각진 사각 형태로 가독성과 전문성을 높입니다.

## Components

### 1. KPI 지표 요약 카드 (Metrics Cards)
- **배치:** 상단 필터 직하단에 4개 카드(누적 계약/기성액, 전체 기성률, 계획/실제 공정률, 종합 공정차이)를 4열 동등 분할 배치.
- **구성:** 상단에는 12px 굵은 라벨, 중앙에는 30px 타뷸러 볼드 수치, 하단에는 전월 대비 또는 상태 뱃지를 포함.
- **스타일:** `#FFFFFF` 배경, 1px `#E2E8F0` 외곽선, 내부 패딩 `16px`.

### 2. 고밀도 데이터 테이블 (Data Grid)
- **헤더:** 높이 `36px`, 배경 `#F8FAFC`, 하단 1px `#CBD5E1` 보더, 12px 세미볼드 네이비-슬레이트 텍스트.
- **행(Row):** 기본 높이 `40px`. 홀수/짝수 줄무늬 대신 마우스 호버 시 `#F1F5F9` 반응.
- **정렬 규칙:** 현장명·공종·지역 등 텍스트는 좌측 정렬, 금액·기성률·공정률 등 숫자는 전면 우측 정렬, 상태 뱃지는 중앙 정렬.
- **공정차이 표기:** 음수값은 전용 폰트 컬러(`#E11D48`) 및 정밀 부호(`−`) 표기.

### 3. 아코디언 펼침 행 (Expanded Row Detail)
- **인터랙션:** 현장 행 클릭 또는 좌측 토글 화살표 클릭 시 바로 아래 서브 패널이 슬라이드 없이 즉각 렌더링.
- **패널 스타일:** 배경 `#F8FAFC`, 상하 1px `#CBD5E1` 인셋 보더, 좌측 `#1E3A8A` 3px 악센트 보더.
- **정보 배치:** 3분할 그리드로 구성:
  1. **공사 기간 정보:** 계약 착공일 ~ 준공 예정일, 잔여 공기.
  2. **기록된 현장 상황:** 공정 지연 또는 기성 차이 발생 사유 전문 표출.
  3. **대응 계획:** 현장소장 및 공무팀 제출 만회 대책.

### 4. 상태 뱃지 (Status Badges)
- **정상 (`Normal`):** 배경 `#ECFDF5`, 보더 `#A7F3D0`, 텍스트 `#059669` ("정상")
- **주의 (`Warning`):** 배경 `#FFFBEB`, 보더 `#FDE68A`, 텍스트 `#D97706` ("주의")
- **점검 (`Danger`):** 배경 `#FFF1F2`, 보더 `#FECDD3`, 텍스트 `#E11D48` ("점검")
- 규격: 높이 `20px`, 좌우 패딩 `6px`, 폰트 크기 `11px`, 볼드.

### 5. 네비게이션 탭 & 필터 툴바
- **탭 네비게이션:** 상단 좌측 4개 메뉴(현황 요약, 현장별 비교표, 자료 가져오기, AI 질의응답). 활성 탭 하단에 2px `#1E3A8A` 언더라인 적용.
- **필터 셀렉트 박스:** 높이 `32px`의 콤팩트 인풋. 1px 테두리, 포커스 시 `#1E3A8A` 링 강조.

### 6. 점검 순위 요약 리스트 (Inspection Priority Panel)
- 공정차이가 큰 현장(예: D 현장 `-10.7pp`, I 현장 `-7.6pp`) 순으로 적색 계열 바와 함께 순위 뱃지를 매겨 1클릭으로 해당 행을 열람할 수 있는 퀵 액션 링크 제공.