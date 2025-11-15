import { toId } from '../utils/helpers';

/**
 * 계층적 자동 배치 계산 (Hierarchical Auto-Layout Algorithm)
 * 
 * 🎯 이 함수의 목적:
 * - 사용자가 노드를 수동으로 배치하지 않을 때 자동으로 자연스럽게 배치
 * - 그래프의 계층 구조를 시각화하되, 정형화된 동심원이 아닌 자연스러운 트리 구조
 * - Based On (선행): 왼쪽 영역에 배치
 * - Core: 중앙에 배치
 * - Cited By (후속): 오른쪽 영역에 배치
 * 
 * @param {Object} baseData - { nodes: [], links: [] }
 * @param {Set<string>} lockedIds - 자동 배치할 노드 ID 집합 (선택적)
 * @returns {Map<string, {x, y}>} 각 노드의 고정 위치 (앵커)
 * 
 * 🔧 알고리즘 특징:
 * 1. BFS로 그래프 깊이 분석
 * 2. 깊이별 수직 레이어 배치 (왼쪽→오른쪽)
 * 3. 각 레이어 내에서는 수직으로 균등 배치
 * 4. 적당한 간격으로 가독성 최적화
 */
export function computeHierarchicalLayout(baseData, lockedIds = null) {
  // 🔍 lockedIds가 제공되면 해당 노드들만 필터링
  const allNodes = baseData.nodes.map((n) => ({ ...n }));
  const nodes = lockedIds 
    ? allNodes.filter(n => lockedIds.has(n.id))
    : allNodes;
  
  // 고정 노드가 없으면 빈 Map 반환
  if (nodes.length === 0) {
    console.log('⚠️ 자동 배치할 노드가 없습니다.');
    return new Map();
  }
  
  // 🔗 고정 노드들 간의 링크만 추출
  const nodeIds = new Set(nodes.map(n => n.id));
  const links = baseData.links
    .map((l) => ({ 
      source: toId(l.source),
      target: toId(l.target), 
      type: l.type 
    }))
    .filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
  
  console.log(`📊 계층적 배치 계산: ${nodes.length}개 노드, ${links.length}개 링크`);
  
  // 🎯 Core 노드 찾기 (중심축이 될 노드)
  const core = nodes.find((n) => n.id.toLowerCase() === 'core') || nodes[0];

  // 📚 그래프 구조 생성 (인접 리스트)
  const incomingEdges = new Map();
  const outgoingEdges = new Map();
  
  for (const n of nodes) {
    incomingEdges.set(n.id, new Set());
    outgoingEdges.set(n.id, new Set());
  }
  
  for (const l of links) {
    incomingEdges.get(l.target).add(l.source);
    outgoingEdges.get(l.source).add(l.target);
  }

  // 📏 깊이 계산 (BFS - Breadth First Search)
  // depth: 각 노드의 Core로부터의 논리적 거리
  //   - 0: Core 자신
  //   - 음수: Core가 참조하는 선행 연구 (왼쪽 배치)
  //   - 양수: Core를 참조하는 후속 연구 (오른쪽 배치)
  const depth = new Map([[core.id, 0]]);
  
  // ⬅️ Based On 방향 탐색
  const q1 = [core.id];
  while (q1.length) {
    const v = q1.shift();
    for (const prev of incomingEdges.get(v)) {
      if (!depth.has(prev)) {
        depth.set(prev, (depth.get(v) || 0) - 1);
        q1.push(prev);
      }
    }
  }
  
  // ➡️ Cited By 방향 탐색
  const q2 = [core.id];
  while (q2.length) {
    const v = q2.shift();
    for (const nxt of outgoingEdges.get(v)) {
      if (!depth.has(nxt)) {
        depth.set(nxt, (depth.get(v) || 0) + 1);
        q2.push(nxt);
      }
    }
  }

  // 🎨 계층적 배치 (Hierarchical Positioning)
  
  // 1️⃣ 깊이별로 노드 그룹화 및 연결 관계 매핑
  const layers = {};
  const nodeConnections = new Map(); // 각 노드의 인접 레이어 연결 노드들
  
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0;
    (layers[d] = layers[d] || []).push(n.id);
  }
  
  // 각 노드의 인접 레이어 연결 노드 찾기
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0;
    const connections = new Set();
    
    // Core를 기준으로 방향 결정
    if (d < 0) {
      // 선행 노드 (Based On, 음수 레이어): Core 방향(+1)이 "자식"
      // outgoing: Core 방향으로 나가는 엣지
      for (const target of outgoingEdges.get(n.id)) {
        const targetDepth = depth.get(target);
        if (targetDepth === d + 1) { // Core에 더 가까운 방향
          connections.add(target);
        }
      }
      // incoming: Core 반대 방향에서 들어오는 엣지
      for (const source of incomingEdges.get(n.id)) {
        const sourceDepth = depth.get(source);
        if (sourceDepth === d - 1) { // Core에서 더 먼 방향
          connections.add(source);
        }
      }
    } else if (d > 0) {
      // 후속 노드 (Cited By, 양수 레이어): Core 방향(-1)이 "부모"
      // incoming: Core 방향에서 들어오는 엣지
      for (const source of incomingEdges.get(n.id)) {
        const sourceDepth = depth.get(source);
        if (sourceDepth === d - 1) { // Core에 더 가까운 방향
          connections.add(source);
        }
      }
      // outgoing: Core 반대 방향으로 나가는 엣지
      for (const target of outgoingEdges.get(n.id)) {
        const targetDepth = depth.get(target);
        if (targetDepth === d + 1) { // Core에서 더 먼 방향
          connections.add(target);
        }
      }
    } else {
      // Core 노드 (d === 0): 모든 인접 레이어 연결
      for (const target of outgoingEdges.get(n.id)) {
        const targetDepth = depth.get(target);
        if (Math.abs(targetDepth - d) === 1) {
          connections.add(target);
        }
      }
      for (const source of incomingEdges.get(n.id)) {
        const sourceDepth = depth.get(source);
        if (Math.abs(sourceDepth - d) === 1) {
          connections.add(source);
        }
      }
    }
    
    nodeConnections.set(n.id, Array.from(connections));
  }
  
  // 2️⃣ 레이어 정렬 (왼쪽부터: -2, -1, 0, 1, 2, ...)
  const sortedLayers = Object.keys(layers).map(Number).sort((a, b) => a - b);
  
  // 3️⃣ 레이아웃 설정
  const HORIZONTAL_SPACING = 200;  // 레이어 간 가로 간격
  const BASE_VERTICAL_SPACING = 80; // 기본 노드 간 세로 간격
  const anchors = new Map();
  const layerNodeOrder = new Map(); // 각 레이어의 노드 순서 저장
  
  // 4️⃣ 레이어별로 순차적으로 배치
  for (const layerIndex of sortedLayers) {
    const nodeList = layers[layerIndex];
    const x = layerIndex * HORIZONTAL_SPACING;
    
    // 각 노드의 공간 요구사항 계산
    const nodeSpaceRequirement = new Map();
    for (const nodeId of nodeList) {
      const connections = nodeConnections.get(nodeId) || [];
      const maxConnections = Math.max(connections.length, 1);
      nodeSpaceRequirement.set(nodeId, maxConnections * BASE_VERTICAL_SPACING);
    }
    
    // 연결된 노드의 순번을 기반으로 정렬
    // 1단계: 각 노드의 정렬 키 계산 (인접 레이어 연결 노드들의 최소 순번)
    const nodeSortKeys = new Map();
    
    for (const nodeId of nodeList) {
      const connectedNodes = nodeConnections.get(nodeId) || [];
      
      if (connectedNodes.length === 0) {
        // 연결이 없으면 큰 값 (맨 아래)
        nodeSortKeys.set(nodeId, { minIndex: 999999, avgIndex: 999999, nodeId });
      } else {
        // 연결된 노드들의 순번 확인 (인접 레이어)
        const connectedIndices = connectedNodes
          .map(cId => {
            const connectedLayer = depth.get(cId);
            const connectedOrder = layerNodeOrder.get(connectedLayer);
            return connectedOrder ? connectedOrder.indexOf(cId) : -1;
          })
          .filter(idx => idx !== -1);
        
        if (connectedIndices.length === 0) {
          // 연결은 있지만 순번을 찾을 수 없으면 (인접 레이어 미배치)
          nodeSortKeys.set(nodeId, { minIndex: 999999, avgIndex: 999999, nodeId });
        } else {
          // 연결된 노드들의 최소 순번과 평균 순번 계산
          const minIndex = Math.min(...connectedIndices);
          const avgIndex = connectedIndices.reduce((sum, idx) => sum + idx, 0) / connectedIndices.length;
          nodeSortKeys.set(nodeId, { minIndex, avgIndex, nodeId });
        }
      }
    }
    
    // 2단계: 정렬 키를 기준으로 정렬
    // 우선순위: 1) 최소 부모 순번, 2) 평균 부모 순번, 3) 노드 ID
    const orderedNodes = [...nodeList].sort((a, b) => {
      const keyA = nodeSortKeys.get(a);
      const keyB = nodeSortKeys.get(b);
      
      // 최소 부모 순번으로 먼저 비교
      if (keyA.minIndex !== keyB.minIndex) {
        return keyA.minIndex - keyB.minIndex;
      }
      
      // 최소값이 같으면 평균 순번으로 비교
      if (keyA.avgIndex !== keyB.avgIndex) {
        return keyA.avgIndex - keyB.avgIndex;
      }
      
      // 모두 같으면 노드 ID로 비교 (안정적인 정렬)
      return a.localeCompare(b);
    });
    
    // 현재 레이어의 순서 저장
    layerNodeOrder.set(layerIndex, orderedNodes);
    
    // 5️⃣ Y 위치 계산 (동적 간격 적용)
    let currentY = 0;
    const positions = [];
    
    for (let i = 0; i < orderedNodes.length; i++) {
      const nodeId = orderedNodes[i];
      const requiredSpace = nodeSpaceRequirement.get(nodeId);
      
      if (i === 0) {
        currentY = 0;
      } else {
        const prevNodeId = orderedNodes[i - 1];
        const prevSpace = nodeSpaceRequirement.get(prevNodeId);
        const gap = (prevSpace + requiredSpace) / 2;
        currentY = positions[i - 1].y + gap;
      }
      
      positions.push({ id: nodeId, y: currentY });
    }
    
    // 6️⃣ 중심 정렬
    if (positions.length > 0) {
      const minY = Math.min(...positions.map(p => p.y));
      const maxY = Math.max(...positions.map(p => p.y));
      const centerOffset = -(minY + maxY) / 2;
      
      for (const pos of positions) {
        anchors.set(pos.id, { x, y: pos.y + centerOffset });
      }
    }
  }
  
  // 7️⃣ 깊이가 계산되지 않은 고립 노드는 중앙에 배치
  for (const n of nodes) {
    if (!anchors.has(n.id)) {
      anchors.set(n.id, { x: 0, y: 0 });
    }
  }
  
  return anchors;
}

/**
 * 링크 곡률 계산 (Link Curvature - A안)
 * 
 * ? 이 함수의 역할:
 * - 링크가 다른 노드와 겹칠 때 곡선으로 표시
 * - 직선 링크가 노드를 지나가면 보기 어려움 → 곡선으로 우회
 * 
 * @param {Object} derivedData - { nodes: [], links: [] } (시뮬레이션 중인 데이터)
 * @returns {Function} 링크 → 곡률 값 (-1 ~ 1)
 * 
 * ? 작동 원리:
 * 1. 링크의 선분(source → target) 계산
 * 2. 다른 노드들이 이 선분과 가까운지 검사
 * 3. 가까우면 곡률 적용 (노드 피하기)
 */
export function makeCurvatureAccessor(derivedData) {
  // 클로저(Closure): derivedData를 기억하는 함수 반환
  return (l) => {
    // ? 링크의 출발점(s)과 도착점(t)
    const s = l.source, t = l.target;
    
    // ? 좌표가 없으면 곡률 0 (직선)
    if (!s || !t || s.x == null || s.y == null || t.x == null || t.y == null) return 0;
    
    // ? 벡터 계산: source → target
    const dx = t.x - s.x;  // x 방향 거리
    const dy = t.y - s.y;  // y 방향 거리
    const segLen = Math.hypot(dx, dy);  // 선분 길이 √(dx²+dy²)
    
    // 선분이 너무 짧으면 곡선 불필요
    if (segLen < 2) return 0;
    
    // ? 임계값 설정
    const thresh = 18;  // 노드와의 최소 거리 (픽셀)
    const thresh2 = thresh * thresh;  // 제곱 (비교용, sqrt 연산 생략)
    
    /**
     * ? 점에서 선분까지의 최단 거리 계산
     * 
     * @param {number} px, py - 확인할 점의 좌표
     * @returns {Object} { d2: 거리의 제곱, b: 매개변수 (0~1) }
     * 
     * 매개변수 b:
     * - 0: 가장 가까운 지점이 source
     * - 1: 가장 가까운 지점이 target
     * - 0~1: 선분 위의 어느 지점
     */
    const dist2AndParam = (px, py) => {
      const wx = px - s.x, wy = py - s.y;  // 점 → source 벡터
      const c1 = dx * wx + dy * wy;  // 내적 (dot product)
      
      // 점이 source 뒤쪽에 있음
      if (c1 <= 0) return { d2: (px - s.x) ** 2 + (py - s.y) ** 2, b: 0 };
      
      const c2 = dx * dx + dy * dy;  // 선분 길이의 제곱
      
      // 점이 target 앞쪽에 있음
      if (c2 <= c1) return { d2: (px - t.x) ** 2 + (py - t.y) ** 2, b: 1 };
      
      // 점이 선분 중간에 있음 → 수선의 발 계산
      const b = c1 / c2;  // 매개변수 (0~1)
      const bx = s.x + b * dx;  // 수선의 발 x 좌표
      const by = s.y + b * dy;  // 수선의 발 y 좌표
      return { d2: (px - bx) ** 2 + (py - by) ** 2, b };
    };
    
    // ? 모든 노드 검사: 이 선분과 가까운 노드가 있나?
    for (const n of derivedData.nodes) {
      // source나 target 자신은 제외
      if (n === s || n === t) continue;
      
      const nx = n.x, ny = n.y;
      if (nx == null || ny == null) continue;  // 좌표 없으면 스킵
      
      // 노드에서 선분까지의 거리 계산
      const { d2, b } = dist2AndParam(nx, ny);
      
      // 선분 양 끝 18% 구간은 무시 (화살표 근처)
      if (b <= 0.18 || b >= 0.82) continue;
      
      // ? 충돌 감지: 노드가 선분과 가까움!
      if (d2 < thresh2) {
        // ? 외적(cross product)으로 방향 결정
        // - 양수: 왼쪽으로 휘어짐
        // - 음수: 오른쪽으로 휘어짐
        const cross = dx * (ny - s.y) - dy * (nx - s.x);
        const sign = cross >= 0 ? 1 : -1;
        
        // ? 곡률 강도 계산: 가까울수록 많이 휨
        const tight = Math.max(0, 1 - Math.sqrt(d2) / thresh);
        
        // 최종 곡률: 기본 0.10 + 거리 기반 보정 0.06
        return (0.10 + 0.06 * tight) * sign;
      }
    }
    
    // 충돌하는 노드가 없으면 직선(곡률 0)
    return 0;
  };
}
