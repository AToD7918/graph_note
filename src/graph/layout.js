import { toId } from '../utils/helpers';

/**
 * 동심원 앵커 계산 (Radial Layout Algorithm)
 * 
 * ? 이 함수의 역할:
 * - Core 노드를 중심으로 노드들을 동심원 형태로 배치
 * - 전방 참조(Forward): Core를 인용한 후속 연구들 → 바깥쪽 원
 * - 후방 참조(Backward): Core가 인용한 선행 연구들 → 안쪽 원
 * 
 * @param {Object} baseData - { nodes: [], links: [] }
 * @returns {Map<string, {x, y}>} 각 노드의 고정 위치 (앵커)
 * 
 * ? 알고리즘 단계:
 * 1. 그래프 구조 분석 (인접 리스트 생성)
 * 2. BFS로 각 노드의 깊이 계산
 * 3. 깊이별로 노드를 그룹화
 * 4. 각 그룹을 원형으로 배치
 */
export function computeRadialAnchors(baseData) {
  // ? 데이터 복사 (원본 보존)
  const nodes = baseData.nodes.map((n) => ({ ...n }));
  const links = baseData.links.map((l) => ({ 
    source: toId(l.source),  // 객체일 수도 있으므로 ID 추출
    target: toId(l.target), 
    type: l.type 
  }));
  
  // ? Core 노드 찾기 (중심이 될 노드)
  // 'core'라는 id를 가진 노드, 없으면 첫 번째 노드
  const core = nodes.find((n) => n.id.toLowerCase() === 'core') || nodes[0];

  // ? 그래프 구조 생성 (인접 리스트)
  // inToCore: 각 노드로 들어오는 엣지들 (누가 나를 가리키나)
  // outFromCore: 각 노드에서 나가는 엣지들 (내가 누구를 가리키나)
  const inToCore = new Map();
  const outFromCore = new Map();
  
  // 모든 노드에 대해 빈 Set 초기화
  for (const n of nodes) {
    inToCore.set(n.id, new Set());
    outFromCore.set(n.id, new Set());
  }
  
  // 링크를 보고 인접 리스트 채우기
  for (const l of links) {
    inToCore.get(l.target).add(l.source);    // target으로 들어오는 source 추가
    outFromCore.get(l.source).add(l.target);  // source에서 나가는 target 추가
  }

  // ? 깊이 계산 (BFS - Breadth First Search)
  // depth: 각 노드의 Core로부터의 거리
  //   - 0: Core 자신
  //   - 양수: Core를 참조하는 후속 연구 (forward)
  //   - 음수: Core가 참조한 선행 연구 (backward)
  const depth = new Map([[core.id, 0]]);  // Core는 깊이 0
  
  // ?? Forward 방향 탐색 (Core → 후속 연구들)
  const q = [core.id];  // 큐(Queue) 초기화
  while (q.length) {
    const v = q.shift();  // 큐에서 노드 하나 꺼내기
    // v에서 나가는 모든 노드 확인
    for (const nxt of outFromCore.get(v)) {
      if (!depth.has(nxt)) {  // 아직 방문 안 한 노드면
        depth.set(nxt, (depth.get(v) || 0) + 1);  // 깊이 = 부모 깊이 + 1
        q.push(nxt);  // 큐에 추가 (나중에 방문)
      }
    }
  }
  
  // ?? Backward 방향 탐색 (선행 연구들 → Core)
  const q2 = [core.id];
  while (q2.length) {
    const v = q2.shift();
    // v로 들어오는 모든 노드 확인
    for (const prev of inToCore.get(v)) {
      if (!depth.has(prev)) {  // 아직 방문 안 한 노드면
        depth.set(prev, (depth.get(v) || 0) - 1);  // 깊이 = 부모 깊이 - 1 (음수)
        q2.push(prev);
      }
    }
  }

  // ? 동심원 배치 (Radial Positioning)
  
  // 1?? 깊이별로 노드 그룹화
  // groups = { -2: ['B1'], -1: ['B2'], 0: ['Core'], 1: ['F1', 'F2'], ... }
  const groups = {};
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0;  // 깊이 가져오기 (없으면 0)
    (groups[d] = groups[d] || []).push(n.id);  // 해당 깊이 배열에 추가
  }
  
  // 2?? 깊이 정렬 (안쪽부터: -2, -1, 0, 1, 2, ...)
  const rings = Object.keys(groups).map(Number).sort((a, b) => a - b);
  
  // 3?? 각 링(ring)의 반지름 설정
  const radiusStep = 100;  // 링 간격 (픽셀)
  const anchors = new Map();  // 결과: 각 노드의 (x, y) 위치
  
  for (const r of rings) {
    const arr = groups[r];  // 해당 깊이의 노드 목록
    const R = Math.abs(r) * radiusStep;  // 반지름 = |깊이| × 100
    const count = Math.max(1, arr.length);  // 노드 개수
    
    // 원 둘레에 균등하게 배치
    arr.forEach((id, i) => {
      // 각도 계산: 360도를 노드 개수로 나눔
      const angle = (2 * Math.PI * i) / count + 
                    (r >= 0 ? 0 : Math.PI / count);  // backward는 약간 회전
      
      // 극좌표 → 직교좌표 변환
      anchors.set(id, { 
        x: R * Math.cos(angle),  // x = r × cos(θ)
        y: R * Math.sin(angle)   // y = r × sin(θ)
      });
    });
  }
  
  // 4?? 깊이가 계산되지 않은 노드는 중앙에 배치
  for (const n of nodes) {
    if (!anchors.has(n.id)) {
      anchors.set(n.id, { x: 0, y: 0 });
    }
  }
  
  return anchors;  // Map<nodeId, {x, y}>
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
