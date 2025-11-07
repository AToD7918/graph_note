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
 * @param {Set} lockedIds - 고정된 노드 ID 목록
 * @param {string|null} selectedId - 현재 선택된 노드 ID (노트 패널에서 보고 있는 노드)
 * @returns {Function} (node, ctx, globalScale) => void
 * 
 * ? 반환하는 함수는 react-force-graph-2d가 각 프레임마다 호출
 */
export function makeNodeCanvasObject(nodeStyles, lockedIds, selectedId = null) {
  // 클로저: nodeStyles와 lockedIds를 기억하는 렌더링 함수 반환
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
    // 그룹별 기본 색상: Core=청록, Forward=초록, Backward=보라
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
    
    // ? 고정된 노드는 흰색 테두리 표시
    if (lockedIds.has(node.id)) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
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
 * - Forward (후속 연구): 청록색 (teal)
 * - Backward (선행 연구): 보라색 (indigo)
 */
export const defaultLinkColor = (l) => 
  l.type === 'forward' ? 'rgba(94,234,212,0.9)' : 'rgba(165,180,252,0.9)';

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