/**
 * 노드 그리기 함수
 */
export function makeNodeCanvasObject(nodeStyles, lockedIds) {
  return (node, ctx, globalScale) => {
    const style = nodeStyles[node.id] || {};
    const sizeKey = style.size || 'm';
    const base = sizeKey === 's' ? 4 : (sizeKey === 'l' ? 12 : 7);
    const r = Math.max(2.5, base / (globalScale * 0.42));
    const shape = style.shape || 'circle';
    const fill = style.color || (node.group === 1 ? '#22d3ee' : (node.group === 2 ? '#34d399' : '#a78bfa'));
    
    // Glow (라벨에는 적용 X)
    if (style.glow) {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.shadowColor = fill;
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 32;
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
      ctx.shadowBlur = 60;
      ctx.globalAlpha = 0.35;
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 1.2, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        const s2 = r * 2.4;
        ctx.beginPath();
        ctx.rect(node.x - s2 / 2, node.y - s2 / 2, s2, s2);
        ctx.fill();
      }
      ctx.restore();
    }
    
    // 본체
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
    if (lockedIds.has(node.id)) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
    ctx.restore();
    
    // 라벨 (글로우 제거)
    if (style.labelPinned) {
      const label = node.title || node.id;
      const fontSize = Math.max(7, 0.5 * (12 / globalScale));
      const padX = 4, padY = 2;
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.font = `${fontSize}px sans-serif`;
      const tw = ctx.measureText(label).width;
      const bx = node.x - tw / 2 - padX;
      const by = node.y - r - fontSize - 6 - padY;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(bx, by, tw + padX * 2, fontSize + padY * 2);
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
 */
export const defaultLinkColor = (l) => 
  l.type === 'forward' ? 'rgba(94,234,212,0.9)' : 'rgba(165,180,252,0.9)';
