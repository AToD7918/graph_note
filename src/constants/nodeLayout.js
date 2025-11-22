/**
 * 노드 레이아웃 관련 상수
 * 
 * 노드의 배치, 간격, 크기 등을 정의
 */

// 노드 배치 관련
export const NODE_PLACEMENT = {
  MIN_DISTANCE: 20,           // 부모로부터 최소 거리
  MAX_DISTANCE: 30,           // 부모로부터 최대 거리
  MIN_NODE_GAP: 25,          // 노드 간 최소 간격
  MAX_PLACEMENT_ATTEMPTS: 12, // 최대 배치 시도 횟수
  FALLBACK_DISTANCE_OFFSET: 10, // 실패 시 추가 거리
};

// 노드 크기
export const NODE_SIZE = {
  SMALL: 4,
  MEDIUM: 7,
  LARGE: 12,
};

// 노드 그룹별 기본 색상
export const NODE_COLORS = {
  CORE: '#22d3ee',      // 청록색 (Core 논문)
  BASED_ON: '#34d399',  // 초록색 (Based On - 선행 연구)
  CITED_BY: '#a78bfa',  // 보라색 (Cited By - 후속 연구)
};

// 링크 곡률 계산 관련
export const LINK_CURVATURE = {
  MIN_SEGMENT_LENGTH: 2,      // 곡선 적용할 최소 선분 길이
  NODE_THRESHOLD: 18,         // 노드와의 최소 거리 (픽셀)
  EDGE_IGNORE_RATIO: 0.18,    // 선분 양 끝 무시 비율 (화살표 근처)
  BASE_CURVATURE: 0.10,       // 기본 곡률
  DISTANCE_CURVATURE: 0.06,   // 거리 기반 추가 곡률
};

// 노드 렌더링
export const NODE_RENDERING = {
  INNER_CORE_RATIO: 0.4,      // Core 노드 내부 원 크기 비율
  SELECTION_RING_RATIO: 1.6,  // 선택 링 크기 비율
  SELECTION_OUTER_RING_RATIO: 1.9, // 선택 외부 링 크기 비율
  GLOW_SCALE: 1.2,            // 글로우 효과 크기 배율
  GLOW_OUTER_SCALE: 2.4,      // 글로우 외부 효과 크기 배율
};

// 선택 링 스타일
export const SELECTION_RING = {
  COLOR: '#fbbf24',           // 황금색
  LINE_WIDTH: 2.5,
  OPACITY: 0.9,
  OUTER_LINE_WIDTH: 1.5,
  OUTER_OPACITY: 0.5,
};

// 글로우 효과
export const GLOW_EFFECT = {
  SHADOW_BLUR: 32,
  SHADOW_BLUR_OUTER: 60,
  OPACITY: 1.0,
  OPACITY_OUTER: 0.35,
};

// 클릭 판정 영역
export const HIT_AREA = {
  LINE_WIDTH: 0,
  SHADOW_BLUR: 0,
};
