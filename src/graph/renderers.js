/**
 * 노드 렌더링 함수 (Canvas API 사용)
 * 
 * ? 이 파일의 역할:
 * - HTML5 Canvas에 노드와 링크를 그리는 방법 정의
 * - react-force-graph-2d 라이브러리가 호출하는 커스텀 렌더러
 * 
 * ? Canvas API 기본 개념:
 * - ctx (Context): 그리기 도구 (붓과 같음)
 * - save()/restore(): 설정 저장/복원 (레이어처럼)
 * - fillStyle: 채우기 색상
 * - strokeStyle: 테두리 색상
 */

/**
 * 노드 그리기 함수 생성
 * 
 * @param {Object} nodeStyles - 각 노드의 스타일 설정 { nodeId: { size, shape, color, ... } }
 * @param {string|null} selectedId - 현재 선택된 노드 ID (노트 패널에서 보고 있는 노드)
 * @returns {Function} (node, ctx, globalScale) => void
 * 
 * ? 반환하는 함수는 react-force-graph-2d가 각 프레임마다 호출
 */
export function makeNodeCanvasObject(nodeStyles, selectedId = null) {
  // 클로저: nodeStyles를 기억하는 렌더링 함수 반환
  return (node, ctx, globalScale) => {
    // ? 스타일 가져오기 (없으면 빈 객체)
    const style = nodeStyles[node.id] || {};
    
    // 현재 노드가 선택된 노드인지 확인
    const isSelected = selectedId === node.id;
    
    // ? 크기 계산
    const sizeKey = style.size || 'm';  // 's', 'm', 'l'
    const base = sizeKey === 's' ? 4 : (sizeKey === 'l' ? 12 : 7);  // 기본 크기
    // globalScale: 줌 레벨 (확대하면 커짐)
    // 노드 크기가 줌과 함께 확대/축소되도록 변경
    const r = base;  // 반지름 (줌과 함께 스케일링)
    
    // ? 모양과 색상
    const shape = style.shape || 'circle';  // 'circle' 또는 'square'
    // 그룹별 기본 색상: Core=청록, Based On=초록, Cited By=보라
    const fill = style.color || (
      node.group === 1 ? '#22d3ee' : 
      (node.group === 2 ? '#34d399' : '#a78bfa')
    );
    
    // ? 글로우 효과 (강조 표시)
    if (style.glow) {
      ctx.save();  // 현재 설정 저장
      ctx.fillStyle = fill;
      ctx.shadowColor = fill;  // 그림자 색상
      ctx.globalAlpha = 1.0;   // 불투명도
      ctx.shadowBlur = 32;     // 그림자 흐림 정도
      
      // 1단계: 기본 모양 그리기
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);  // 원
        ctx.fill();
      } else {
        const s = r * 2.0;  // 정사각형 한 변 길이
        ctx.beginPath();
        ctx.rect(node.x - s / 2, node.y - s / 2, s, s);  // 중심 기준 정사각형
        ctx.fill();
      }
      
      // 2단계: 더 큰 외곽 글로우
      ctx.shadowBlur = 60;
      ctx.globalAlpha = 0.35;  // 반투명
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 1.2, 0, 2 * Math.PI);  // 20% 더 큼
        ctx.fill();
      } else {
        const s2 = r * 2.4;
        ctx.beginPath();
        ctx.rect(node.x - s2 / 2, node.y - s2 / 2, s2, s2);
        ctx.fill();
      }
      ctx.restore();  // 설정 복원
    }
    
    // ? 노드 본체 그리기
    ctx.save();
    ctx.fillStyle = fill;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      const s = r * 2.0;
      ctx.beginPath();
      ctx.rect(node.x - s / 2, node.y - s / 2, s, s);
      ctx.fill();
    }
    
    // ? Core 노드(Group 1)는 내부에 흰 원 표시
    if (node.group === 1) {
      ctx.fillStyle = '#ffffff';
      const innerR = r * 0.4; // 내부 원 크기 (외부 원의 40%)
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, innerR, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        const innerS = innerR * 2.0;
        ctx.beginPath();
        ctx.rect(node.x - innerS / 2, node.y - innerS / 2, innerS, innerS);
        ctx.fill();
      }
    }
    
    ctx.restore();
    
    // ? 선택된 노드는 도넛 링으로 표시
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#fbbf24'; // 황금색
      ctx.lineWidth = 2.5; // 링 두께
      ctx.globalAlpha = 0.9;
      
      if (shape === 'circle') {
        // 원형 도넛 링
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 1.6, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 이중 링 효과 (선택사항)
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 1.9, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        // 사각 도넛 링
        const s = r * 2.0;
        const ringSize = s * 1.6;
        ctx.beginPath();
        ctx.rect(node.x - ringSize / 2, node.y - ringSize / 2, ringSize, ringSize);
        ctx.stroke();
        
        // 이중 링 효과
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.5;
        const ringSize2 = s * 1.9;
        ctx.beginPath();
        ctx.rect(node.x - ringSize2 / 2, node.y - ringSize2 / 2, ringSize2, ringSize2);
        ctx.stroke();
      }
      ctx.restore();
    }
    
    // ?? 라벨 그리기 (Pin label 옵션이 켜진 경우)
    if (style.labelPinned) {
      const label = node.title || node.id;  // 표시할 텍스트
      const fontSize = Math.max(7, 0.5 * (12 / globalScale));  // 줌에 따라 조정
      const padX = 4, padY = 2;  // 패딩
      
      ctx.save();
      // 라벨에는 그림자 제거 (가독성 향상)
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.font = `${fontSize}px sans-serif`;
      
      // 텍스트 크기 측정
      const tw = ctx.measureText(label).width;
      
      // 배경 박스 위치 계산 (노드 위쪽)
      const bx = node.x - tw / 2 - padX;  // 중앙 정렬
      const by = node.y - r - fontSize - 6 - padY;  // 노드 위
      
      // 배경 그리기 (검은색 반투명)
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(bx, by, tw + padX * 2, fontSize + padY * 2);
      
      // 텍스트 그리기 (흰색)
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, node.x, by + padY + fontSize / 2);
      ctx.restore();
    }
  };
}

/**
 * 링크 색상 함수
 * 
 * @param {Object} l - 링크 객체 { source, target, type }
 * @returns {string} RGBA 색상 문자열
 * 
 * 색상 구분:
 * - Based On (선행 연구): 보라색 (indigo)
 * - Cited By (후속 연구): 청록색 (teal)
 */
export const defaultLinkColor = (l) => 
  l.type === 'based-on' ? 'rgba(165,180,252,0.9)' : 'rgba(94,234,212,0.9)';

/**
 * 클릭 판정용 영역을 그리는 함수
 * react-force-graph-2d의 nodePointerAreaPaint 프로퍼티에 연결
 */
export function makeNodePointerAreaPaint(nodeStyles) {
  return (node, color, ctx) => {
    const style = nodeStyles[node.id] || {};
    const sizeKey = style.size || 'm';
    const base = sizeKey === 's' ? 4 : (sizeKey === 'l' ? 12 : 7);
    const r = base;  // 클릭 영역도 줌과 함께 스케일링
    const shape = style.shape || 'circle';

    ctx.fillStyle = color; // 고유 픽셀색
    // 선두께 영향 제거
    ctx.lineWidth = 0;
    ctx.shadowBlur = 0;

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      const s = r * 2.0;
      ctx.fillRect(node.x - s / 2, node.y - s / 2, s, s);
    }
  };
}

/**
 * 링크 곡률 계산 (Link Curvature)
 * 
 * 이 함수의 역할:
 * - 링크가 다른 노드와 겹칠 때 곡선으로 표시
 * - 직선 링크가 노드를 지나가면 보기 어려움 → 곡선으로 우회
 * 
 * @param {Object} derivedData - { nodes: [], links: [] } (시뮬레이션 중인 데이터)
 * @returns {Function} 링크 → 곡률 값 (-1 ~ 1)
 * 
 * 작동 원리:
 * 1. 링크의 선분(source → target) 계산
 * 2. 다른 노드들이 이 선분과 가까운지 검사
 * 3. 가까우면 곡률 적용 (노드 피하기)
 */
export function makeCurvatureAccessor(derivedData) {
  // 클로저(Closure): derivedData를 기억하는 함수 반환
  return (l) => {
    // 링크의 출발점(s)과 도착점(t)
    const s = l.source, t = l.target;
    
    // 좌표가 없으면 곡률 0 (직선)
    if (!s || !t || s.x == null || s.y == null || t.x == null || t.y == null) return 0;
    
    // 벡터 계산: source → target
    const dx = t.x - s.x;  // x 방향 거리
    const dy = t.y - s.y;  // y 방향 거리
    const segLen = Math.hypot(dx, dy);  // 선분 길이 √(dx²+dy²)
    
    // 선분이 너무 짧으면 곡선 불필요
    if (segLen < 2) return 0;
    
    // 임계값 설정
    const thresh = 18;  // 노드와의 최소 거리 (픽셀)
    const thresh2 = thresh * thresh;  // 제곱 (비교용, sqrt 연산 생략)
    
    /**
     * 점에서 선분까지의 최단 거리 계산
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
    
    // 모든 노드 검사: 이 선분과 가까운 노드가 있나?
    for (const n of derivedData.nodes) {
      // source나 target 자신은 제외
      if (n === s || n === t) continue;
      
      const nx = n.x, ny = n.y;
      if (nx == null || ny == null) continue;  // 좌표 없으면 스킵
      
      // 노드에서 선분까지의 거리 계산
      const { d2, b } = dist2AndParam(nx, ny);
      
      // 선분 양 끝 18% 구간은 무시 (화살표 근처)
      if (b <= 0.18 || b >= 0.82) continue;
      
      // 충돌 감지: 노드가 선분과 가까움!
      if (d2 < thresh2) {
        // 외적(cross product)으로 방향 결정
        // - 양수: 왼쪽으로 휘어짐
        // - 음수: 오른쪽으로 휘어짐
        const cross = dx * (ny - s.y) - dy * (nx - s.x);
        const sign = cross >= 0 ? 1 : -1;
        
        // 곡률 강도 계산: 가까울수록 많이 휨
        const tight = Math.max(0, 1 - Math.sqrt(d2) / thresh);
        
        // 최종 곡률: 기본 0.10 + 거리 기반 보정 0.06
        return (0.10 + 0.06 * tight) * sign;
      }
    }
    
    // 충돌하는 노드가 없으면 직선(곡률 0)
    return 0;
  };
}