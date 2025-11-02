import { toId } from '../utils/helpers';

/**
 * 동심원 앵커 계산
 * Core 노드를 중심으로 전방/후방 참조 노드들을 동심원 형태로 배치
 */
export function computeRadialAnchors(baseData) {
  const nodes = baseData.nodes.map((n) => ({ ...n }));
  const links = baseData.links.map((l) => ({ source: toId(l.source), target: toId(l.target), type: l.type }));
  const core = nodes.find((n) => n.id.toLowerCase() === 'core') || nodes[0];

  const inToCore = new Map(), outFromCore = new Map();
  for (const n of nodes) {
    inToCore.set(n.id, new Set());
    outFromCore.set(n.id, new Set());
  }
  for (const l of links) {
    inToCore.get(l.target).add(l.source);
    outFromCore.get(l.source).add(l.target);
  }

  // core 기준 전방(+), 후방(-) 깊이 탐색
  const depth = new Map([[core.id, 0]]);
  const q = [core.id];
  while (q.length) {
    const v = q.shift();
    for (const nxt of outFromCore.get(v)) {
      if (!depth.has(nxt)) {
        depth.set(nxt, (depth.get(v) || 0) + 1);
        q.push(nxt);
      }
    }
  }
  const q2 = [core.id];
  while (q2.length) {
    const v = q2.shift();
    for (const prev of inToCore.get(v)) {
      if (!depth.has(prev)) {
        depth.set(prev, (depth.get(v) || 0) - 1);
        q2.push(prev);
      }
    }
  }

  // 깊이별 링 배치
  const groups = {};
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0;
    (groups[d] = groups[d] || []).push(n.id);
  }
  const rings = Object.keys(groups).map(Number).sort((a, b) => a - b);
  const radiusStep = 100;
  const anchors = new Map();
  for (const r of rings) {
    const arr = groups[r];
    const R = Math.abs(r) * radiusStep;
    const count = Math.max(1, arr.length);
    arr.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / count + (r >= 0 ? 0 : Math.PI / count);
      anchors.set(id, { x: R * Math.cos(angle), y: R * Math.sin(angle) });
    });
  }
  for (const n of nodes) {
    if (!anchors.has(n.id)) anchors.set(n.id, { x: 0, y: 0 });
  }
  return anchors; // Map<id,{x,y}>
}

/**
 * 링크 곡률 계산 (A안)
 * 다른 노드와 겹칠 때 곡선으로 표시
 */
export function makeCurvatureAccessor(derivedData) {
  return (l) => {
    const s = l.source, t = l.target;
    if (!s || !t || s.x == null || s.y == null || t.x == null || t.y == null) return 0;
    const dx = t.x - s.x, dy = t.y - s.y;
    const segLen = Math.hypot(dx, dy);
    if (segLen < 2) return 0;
    const thresh = 18, thresh2 = thresh * thresh;
    const dist2AndParam = (px, py) => {
      const wx = px - s.x, wy = py - s.y;
      const c1 = dx * wx + dy * wy;
      if (c1 <= 0) return { d2: (px - s.x) ** 2 + (py - s.y) ** 2, b: 0 };
      const c2 = dx * dx + dy * dy;
      if (c2 <= c1) return { d2: (px - t.x) ** 2 + (py - t.y) ** 2, b: 1 };
      const b = c1 / c2;
      const bx = s.x + b * dx, by = s.y + b * dy;
      return { d2: (px - bx) ** 2 + (py - by) ** 2, b };
    };
    for (const n of derivedData.nodes) {
      if (n === s || n === t) continue;
      const nx = n.x, ny = n.y;
      if (nx == null || ny == null) continue;
      const { d2, b } = dist2AndParam(nx, ny);
      if (b <= 0.18 || b >= 0.82) continue;
      if (d2 < thresh2) {
        const cross = dx * (ny - s.y) - dy * (nx - s.x);
        const sign = cross >= 0 ? 1 : -1;
        const tight = Math.max(0, 1 - Math.sqrt(d2) / thresh);
        return (0.10 + 0.06 * tight) * sign;
      }
    }
    return 0;
  };
}
