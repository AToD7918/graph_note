/**
 * 공통 유틸리티 함수들
 * 
 * ? 이 파일의 역할:
 * - 프로젝트 전체에서 반복적으로 사용되는 간단한 도우미 함수들
 * - 코드 중복을 줄이고 가독성을 높임
 */

/**
 * 객체나 ID를 ID 문자열로 변환
 * 
 * @param {Object|string} v - 노드 객체 또는 ID 문자열
 * @returns {string} ID 문자열
 * 
 * ? 사용 이유:
 * react-force-graph-2d 라이브러리는 시뮬레이션 중에 링크의 source/target을
 * 문자열 ID에서 객체 참조로 자동 변환함
 * 
 * 예시:
 * - 초기: { source: 'Core', target: 'F1' }
 * - 시뮬레이션 후: { source: {id:'Core', x:100, y:50, ...}, target: {id:'F1', ...} }
 * 
 * 이 함수는 두 경우 모두에서 안전하게 ID를 추출함
 */
export const toId = (v) => (typeof v === 'object' && v !== null ? v.id : v);

/**
 * 랜덤 ID 생성 (8자리 영숫자)
 * 
 * @returns {string} 무작위 8자리 ID (예: 'a3f9k2m1')
 * 
 * ? 작동 원리:
 * 1. Math.random() - 0과 1 사이의 무작위 소수 생성 (예: 0.7392...)
 * 2. .toString(36) - 36진수로 변환 (0-9, a-z 사용)
 * 3. .slice(2, 10) - '0.' 부분 제거하고 8자리만 추출
 * 
 * 사용처: 새 노드 추가 시 고유 ID 생성
 */
export const genId = () => Math.random().toString(36).slice(2, 10);
