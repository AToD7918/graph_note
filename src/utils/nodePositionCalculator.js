/**
 * 노드 위치 계산 유틸리티
 * 
 * 새로운 노드의 배치 위치를 계산하고 충돌을 검사합니다.
 * @module utils/nodePositionCalculator
 */

import { NODE_PLACEMENT } from '../constants/nodeLayout';

/**
 * 두 점 사이의 거리 계산
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @returns {number} 거리
 */
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 주어진 위치에서 충돌이 있는지 확인
 * @param {number} testX - 테스트할 X 좌표
 * @param {number} testY - 테스트할 Y 좌표
 * @param {import('../types').NodePositions} existingPositions - 기존 노드 위치 맵
 * @param {number} minGap - 최소 간격
 * @returns {boolean} 충돌 여부
 */
function hasCollision(testX, testY, existingPositions, minGap) {
  for (const nodeId in existingPositions) {
    const pos = existingPositions[nodeId];
    const dist = distance(testX, testY, pos.x, pos.y);
    
    if (dist < minGap) {
      return true;
    }
  }
  return false;
}

/**
 * 새 노드를 위한 유효한 위치 찾기
 * 
 * @param {Object} options - 옵션
 * @param {number} options.parentX - 부모 노드 X 좌표
 * @param {number} options.parentY - 부모 노드 Y 좌표
 * @param {import('../types').NodePositions} options.existingPositions - 기존 노드 위치 맵
 * @param {number} [options.minDistance] - 부모로부터 최소 거리
 * @param {number} [options.maxDistance] - 부모로부터 최대 거리
 * @param {number} [options.minNodeGap] - 노드 간 최소 간격
 * @param {number} [options.maxAttempts] - 최대 시도 횟수
 * @returns {{x: number, y: number, found: boolean}} 계산된 위치와 성공 여부
 */
export function findValidPositionForNewNode(options) {
  const {
    parentX,
    parentY,
    existingPositions,
    minDistance = NODE_PLACEMENT.MIN_DISTANCE,
    maxDistance = NODE_PLACEMENT.MAX_DISTANCE,
    minNodeGap = NODE_PLACEMENT.MIN_NODE_GAP,
    maxAttempts = NODE_PLACEMENT.MAX_PLACEMENT_ATTEMPTS,
  } = options;

  // 충돌 없는 위치 찾기 시도
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const dist = minDistance + Math.random() * (maxDistance - minDistance);
    const baseAngle = Math.random() * 2 * Math.PI;
    const angle = baseAngle + (attempt * Math.PI / 6);
    
    const testX = parentX + dist * Math.cos(angle);
    const testY = parentY + dist * Math.sin(angle);
    
    if (!hasCollision(testX, testY, existingPositions, minNodeGap)) {
      return { x: testX, y: testY, found: true };
    }
  }
  
  // 충돌 없는 위치를 찾지 못하면 fallback 위치 반환
  const fallbackDistance = maxDistance + NODE_PLACEMENT.FALLBACK_DISTANCE_OFFSET;
  const angle = Math.random() * 2 * Math.PI;
  const fallbackX = parentX + fallbackDistance * Math.cos(angle);
  const fallbackY = parentY + fallbackDistance * Math.sin(angle);
  
  return { x: fallbackX, y: fallbackY, found: false };
}

/**
 * 부모 노드의 위치 가져오기
 * 
 * @param {string} parentId - 부모 노드 ID
 * @param {Object} savedNodePositions - 저장된 노드 위치
 * @param {Array} graphNodes - 그래프 노드 배열
 * @returns {{x: number, y: number}} 부모 위치
 */
export function getParentPosition(parentId, savedNodePositions, graphNodes) {
  // 저장된 위치가 있으면 사용
  if (savedNodePositions[parentId]) {
    return {
      x: savedNodePositions[parentId].x,
      y: savedNodePositions[parentId].y,
    };
  }
  
  // 그래프에서 현재 위치 찾기
  const parentNode = graphNodes.find(n => n.id === parentId);
  if (parentNode && parentNode.x != null && parentNode.y != null) {
    return {
      x: parentNode.x,
      y: parentNode.y,
    };
  }
  
  // 기본값 (원점)
  return { x: 0, y: 0 };
}
