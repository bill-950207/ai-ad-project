# 제품 광고 마법사 레이아웃 변경

## 작업 일시
2026-01-23 18:00

## 작업 유형
style (UI 개선)

## 작업 내용
제품 광고 생성 마법사에서 첫 씬 키프레임과 영상 리스트의 레이아웃을 가로 스크롤에서 그리드로 변경

## 변경 파일

### 1. components/video-ad/product-ad/wizard-step-5.tsx
- `SortableKeyframeCard` 컴포넌트에서 고정 width 스타일 제거
- `totalCount` prop 제거
- `flex-shrink-0 snap-start` 클래스 제거
- 가로 스크롤 컨테이너를 그리드 레이아웃으로 변경

### 2. components/video-ad/product-ad/wizard-step-6.tsx
- `SortableVideoCard` 컴포넌트에서 고정 width 스타일 제거
- `totalCount` prop 제거
- `flex-shrink-0 snap-start` 클래스 제거
- 가로 스크롤 컨테이너를 그리드 레이아웃으로 변경

## 그리드 컬럼 규칙
개수에 따른 컬럼 수:
- 1개: 1열
- 2개: 2열
- 3개: 3열
- 4개: 2열 (2x2)
- 5-6개: 3열
- 7개 이상: 4열

## CLAUDE.md 변경 필요 사항
없음
