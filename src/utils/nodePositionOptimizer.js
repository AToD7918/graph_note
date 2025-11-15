/**
 * 노드 위치 계산 최적화 유틸리티
 * 
 * 성능 개선:
 * - 노드별로 위치가 이미 확정된 경우 재계산 스킵
 * - 충돌 검사를 공간 분할로 최적화 (O(n²) → O(n log n))
 */

/**
 * 노드의 위치가 이미 확정되었는지 확인
 */
export function hasFixedPosition(node, lockedIds, savedNodePositions) {
  return lockedIds.has(node.id) || 
         savedNodePositions[node.id] !== undefined ||
         (node.x != null && node.y != null && node.fx != null && node.fy != null);
}

/**
 * 공간 해시맵을 이용한 충돌 검사 최적화
 * 그리드 기반으로 노드를 분할하여 인근 노드만 검사
 */
export class SpatialHashGrid {
  constructor(cellSize = 50) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * 좌표를 그리드 키로 변환
   */
  getKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * 노드를 그리드에 추가
   */
  insert(x, y, data) {
    const key = this.getKey(x, y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push({ x, y, data });
  }

  /**
   * 특정 위치 주변의 노드들을 검색
   * 인근 9개 셀만 검사 (현재 셀 + 주변 8개)
   */
  getNearby(x, y, radius) {
    const nearby = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`;
        const cellNodes = this.grid.get(key);
        if (cellNodes) {
          nearby.push(...cellNodes);
        }
      }
    }

    return nearby;
  }

  /**
   * 특정 위치에서 충돌이 있는지 검사 (최적화된 버전)
   */
  hasCollision(testX, testY, minGap) {
    const nearby = this.getNearby(testX, testY, minGap);
    
    for (const node of nearby) {
      const dx = testX - node.x;
      const dy = testY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minGap) {
        return true;
      }
    }
    
    return false;
  }
}

/**
 * 새 노드의 초기 위치 계산 (최적화된 버전)
 * 
 * @param {Object} node - 새 노드
 * @param {Array} links - 모든 링크
 * @param {Map} nodeMap - 노드 ID -> 노드 객체 맵
 * @param {Set} lockedIds - 고정된 노드 ID 집합
 * @param {Map} hierarchicalAnchors - 계층적 자동 배치 앵커 위치
 * @param {Object} savedNodePositions - 저장된 노드 위치
 * @param {SpatialHashGrid} spatialGrid - 공간 해시 그리드
 * @returns {{ x: number, y: number }} 계산된 위치
 */
export function computeNewNodePosition(
  node,
  links,
  nodeMap,
  lockedIds,
  hierarchicalAnchors,
  savedNodePositions,
  spatialGrid
) {
  // 부모 노드 찾기
  const parentLink = links.find(l => 
    l.target === node.id || l.source === node.id
  );

  if (!parentLink) {
    return { x: 0, y: 0 };
  }

  const parentId = parentLink.target === node.id 
    ? parentLink.source 
    : parentLink.target;
  
  const parentNode = nodeMap.get(parentId);
  
  if (!parentNode) {
    return { x: 0, y: 0 };
  }

  // 부모 노드 위치 확인
  let parentX = 0, parentY = 0;
  
  if (lockedIds.has(parentId)) {
    const anchor = hierarchicalAnchors.get(parentId);
    parentX = anchor?.x ?? 0;
    parentY = anchor?.y ?? 0;
  } else if (savedNodePositions[parentId]) {
    parentX = savedNodePositions[parentId].x;
    parentY = savedNodePositions[parentId].y;
  } else if (parentNode.x != null && parentNode.y != null) {
    parentX = parentNode.x;
    parentY = parentNode.y;
  }

  // 충돌 회피 알고리즘
  const minDistance = 20;
  const maxDistance = 30;
  const minNodeGap = 25;
  const maxAttempts = 12;
  
  let finalX, finalY;
  let foundValidPosition = false;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const baseAngle = Math.random() * 2 * Math.PI;
    const angle = baseAngle + (attempt * Math.PI / 6);
    
    const testX = parentX + distance * Math.cos(angle);
    const testY = parentY + distance * Math.sin(angle);
    
    // 공간 해시 그리드를 사용한 충돌 검사 (O(1) 평균 복잡도)
    if (!spatialGrid.hasCollision(testX, testY, minNodeGap)) {
      finalX = testX;
      finalY = testY;
      foundValidPosition = true;
      break;
    }
  }
  
  // 충돌 회피 실패 시 거리 증가
  if (!foundValidPosition) {
    const fallbackDistance = maxDistance + 10;
    const angle = Math.random() * 2 * Math.PI;
    finalX = parentX + fallbackDistance * Math.cos(angle);
    finalY = parentY + fallbackDistance * Math.sin(angle);
  }
  
  return { x: finalX, y: finalY };
}

/**
 * 노드 위치 캐시 생성
 * 이미 위치가 확정된 노드들의 위치를 미리 계산하여 캐싱
 */
export function buildNodePositionCache(nodes, lockedIds, hierarchicalAnchors, savedNodePositions) {
  const cache = new Map();
  
  for (const node of nodes) {
    if (lockedIds.has(node.id)) {
      const anchor = hierarchicalAnchors.get(node.id);
      cache.set(node.id, {
        x: anchor?.x ?? 0,
        y: anchor?.y ?? 0,
        fixed: true
      });
    } else if (savedNodePositions[node.id]) {
      cache.set(node.id, {
        x: savedNodePositions[node.id].x,
        y: savedNodePositions[node.id].y,
        fixed: true
      });
    } else if (node.x != null && node.y != null) {
      cache.set(node.id, {
        x: node.x,
        y: node.y,
        fixed: false
      });
    }
  }
  
  return cache;
}
