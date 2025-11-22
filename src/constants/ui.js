/**
 * UI 관련 상수
 * 
 * 패널, 모달, 줌 등 UI 요소의 기본값과 제약사항
 */

// 노트 패널
export const NOTE_PANEL = {
  MIN_WIDTH: 360,
  DEFAULT_WIDTH_RATIO: 0.4,  // 화면 너비의 40%
  MAX_WIDTH_RATIO: 0.7,      // 화면 너비의 70%
};

// 줌 레벨
export const ZOOM = {
  MIN: 0.5,
  MAX: 4.0,
  DEFAULT: 1.0,
  STEP: 1.2,           // 줌 인/아웃 배율
  FIT_DURATION: 400,   // 전체 보기 애니메이션 시간 (ms)
  FIT_PADDING: 40,     // 전체 보기 여백 (px)
};

// 그래프 뷰 모드
export const GRAPH_VIEW_MODE = {
  RELATIONSHIP: 'relationship',
  TAG: 'tag',
  TIMELINE: 'timeline',
};

// 애니메이션 지속 시간
export const ANIMATION_DURATION = {
  PANEL_TRANSITION: 300,    // 패널 열림/닫힘 (ms)
  ZOOM_TRANSITION: 400,     // 줌 변경 (ms)
  MODAL_FADE: 200,          // 모달 페이드 인/아웃 (ms)
};

// 노드 드래그
export const NODE_DRAG = {
  PADDING: 50,              // 화면 가장자리 여백 (px)
  AUTO_ZOOM_THRESHOLD: 100, // 자동 줌 아웃 트리거 간격 (ms)
  AUTO_ZOOM_SCALE: 0.5,     // 자동 줌 아웃 배율
};

// 위치 저장
export const POSITION_SAVE = {
  DEBOUNCE_DELAY: 400,      // 드래그 종료 후 저장 지연 시간 (ms)
};

// 커스텀 색상 히스토리
export const COLOR_HISTORY = {
  MAX_COLORS: 8,            // 최대 저장 색상 개수
};

// Force-Directed 그래프 설정
export const FORCE_GRAPH = {
  NODE_REL_SIZE: 6,
  BACKGROUND_COLOR: '#0a0a0a',
  ARROW_LENGTH: 6,
  ARROW_REL_POS: 0.5,
  COOLDOWN_TICKS: 0,        // 물리 시뮬레이션 비활성화
  D3_ALPHA_DECAY: 1,
  D3_VELOCITY_DECAY: 1,
};

// 그래프 컨테이너
export const GRAPH_CONTAINER = {
  CURSOR_DEFAULT: 'default',
  CURSOR_POINTER: 'pointer',
};
