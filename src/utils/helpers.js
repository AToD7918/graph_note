/**
 * 공통 유틸리티 함수들
 */

/**
 * 객체나 ID를 ID 문자열로 변환
 */
export const toId = (v) => (typeof v === 'object' && v !== null ? v.id : v);

/**
 * 랜덤 ID 생성 (8자리)
 */
export const genId = () => Math.random().toString(36).slice(2, 10);
