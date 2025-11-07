import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useMeasure } from './hooks/useMeasure';
import { toId, genId } from './utils/helpers';
import { createLocalStorageAdapter, createRemoteAdapter } from './adapters/storage';
import { initializeSeedNotes } from './adapters/noteStorage';
import { seedCore5 } from './data/seedData';
import { computeRadialAnchors, makeCurvatureAccessor } from './graph/layout';
import { makeNodeCanvasObject, makeNodePointerAreaPaint, defaultLinkColor } from './graph/renderers';
import { NotePanel } from './components/NotePanel';
import { ZoomControls } from './components/ZoomControls';

/**
 * Graph-First Paper Notes (V1.2, 컴포넌트 분리 버전)
 * -------------------------------------------------------------
 * 목표
 * 1) 노트 패널을 별도 컴포넌트로 분리하여 기능 확장 용이
 * 2) 모듈화된 구조로 유지보수성 향상
 * 3) 기존 기능 유지 (그래프 우선, 동심원 레이아웃, 컨텍스트 메뉴 등)
 *
 * 분리된 컴포넌트
 * - src/
 *   - adapters/storage.js     (Local/Remote 어댑터) ✅
 *   - hooks/useMeasure.js     (리사이즈 관찰) ✅
 *   - utils/helpers.js        (공통 유틸) ✅
 *   - data/seedData.js        (초기 데이터) ✅
 *   - graph/layout.js         (동심원 앵커 계산, 곡률 계산) ✅
 *   - graph/renderers.js      (nodeCanvasObject 등 그리기 로직) ✅
 *   - components/
 *     - NotePanel.jsx         (노트 패널 - 확장 기능 추가 예정) ✅
 *   - App.jsx                 (메인 앱 - 상태 관리 + 조립)
 */

/********************** [components] 컨텍스트 메뉴 **********************/
function ContextMenu({ visible, x, y, nodeId, nodeStyles, setStyle, lockedIds, toggleLock, onClose, customColorHistory, addCustomColor }) {
  const current = nodeStyles[nodeId] || { shape: 'circle', size: 'm', color: null, labelPinned: false, glow: false };
  
  // 커스텀 색상 입력 상태 (항상 호출)
  const [showColorInput, setShowColorInput] = useState(false);
  const [hue, setHue] = useState(180);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(60);
  
  // HSL을 HEX로 변환
  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  
  const customColor = hslToHex(hue, saturation, lightness);
  
  if (!visible || !nodeId) return null;
  
  // 기본 색상 팔레트
  const defaultColors = ['#22d3ee', '#34d399', '#a78bfa', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];
  
  return (
    <div className="context-menu"
         style={{ left: x, top: y }} onClick={(e)=>e.stopPropagation()}>
      <div className="text-xs uppercase opacity-70 px-1 pb-2">Node: {nodeId}</div>
      <button className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10" onClick={()=>{ toggleLock(nodeId); onClose(); }}>
        { lockedIds.has(nodeId) ? 'Switch to Force (unlock)' : 'Switch to Radial (lock)' }
      </button>
      <div className="h-px my-2 bg-white/10" />
      <div className="px-1 text-xs opacity-70">Shape</div>
      <div className="flex gap-2 px-1 mt-1">
        <button className={`flex-1 px-2 py-1 rounded-lg ${current.shape==='circle'?'bg-white/10':''} hover:bg-white/10`} onClick={()=>{ setStyle(nodeId,{shape:'circle'}); onClose(); }}>Circle</button>
        <button className={`flex-1 px-2 py-1 rounded-lg ${current.shape==='square'?'bg-white/10':''} hover:bg-white/10`} onClick={()=>{ setStyle(nodeId,{shape:'square'}); onClose(); }}>Square</button>
      </div>
      <div className="px-1 text-xs opacity-70 mt-2">Size</div>
      <div className="flex gap-2 px-1 mt-1">
        {['s','m','l'].map(sz => (
          <button key={sz} className={`flex-1 px-2 py-1 rounded-lg ${ (current.size||'m')===sz?'bg-white/10':''} hover:bg-white/10`} onClick={()=>{ setStyle(nodeId,{size:sz}); onClose(); }}>{sz.toUpperCase()}</button>
        ))}
      </div>
      <div className="px-1 text-xs opacity-70 mt-2 mb-1 flex items-center justify-between">
        <span>Color</span>
        <button 
          className="text-xs opacity-60 hover:opacity-100 px-1 py-0.5 rounded hover:bg-white/10"
          onClick={()=>{ setStyle(nodeId,{color:null}); onClose(); }}
          title="Reset to default group color"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1 px-1">
        {defaultColors.map((c)=> (
          <button 
            key={c} 
            aria-label={`color-${c}`} 
            className={`w-4 h-4 rounded-full border border-white/30 hover:scale-110 transition-transform ${ current.color===c?'ring-2 ring-white':'' }`} 
            style={{ backgroundColor: c, fontSize: '0.5em' }} 
            onClick={()=>{ setStyle(nodeId,{color:c}); onClose(); }} 
          />
        ))}
      </div>
      {/* 커스텀 색상 히스토리 (두 번째 줄) */}
      <div className="grid grid-cols-8 gap-1 px-1 mt-1">
        {customColorHistory.map((c, idx)=> (
          <button 
            key={`${c}-${idx}`}
            aria-label={`custom-color-${c}`} 
            className={`w-4 h-4 rounded-full border border-white/30 hover:scale-110 transition-transform ${ current.color===c?'ring-2 ring-white':'' }`} 
            style={{ backgroundColor: c, fontSize: '0.5em' }} 
            onClick={()=>{ setStyle(nodeId,{color:c}); onClose(); }} 
          />
        ))}
        {/* 빈 슬롯 표시 */}
        {Array.from({ length: 8 - customColorHistory.length }).map((_, idx) => (
          <div 
            key={`empty-${idx}`}
            className="w-4 h-4 rounded-full border border-white/10 bg-white/5"
            style={{ fontSize: '0.5em' }}
          />
        ))}
      </div>
      <div className="px-1 mt-2">
        {!showColorInput ? (
          <button 
            className="w-full px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 text-xs flex items-center justify-center gap-2 transition-colors"
            onClick={()=>setShowColorInput(true)}
          >
            <span>🎨</span>
            <span>Custom Color</span>
          </button>
        ) : (
          <div className="bg-white/5 border border-white/20 rounded-lg p-2 space-y-2">
            {/* 색상 미리보기 */}
            <div className="flex items-center gap-2">
              <div 
                className="flex-1 h-10 rounded border border-white/30"
                style={{ backgroundColor: customColor }}
              />
              <div className="text-xs font-mono opacity-70">{customColor}</div>
            </div>
            
            {/* Hue 슬라이더 */}
            <div>
              <div className="text-xs opacity-70 mb-1">Hue</div>
              <input 
                type="range" 
                min="0" 
                max="360" 
                value={hue}
                onChange={(e)=>setHue(Number(e.target.value))}
                className="w-full h-2 rounded appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
              />
            </div>
            
            {/* Saturation 슬라이더 */}
            <div>
              <div className="text-xs opacity-70 mb-1">Saturation</div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={saturation}
                onChange={(e)=>setSaturation(Number(e.target.value))}
                className="w-full h-2 rounded appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(${hue}, 0%, 50%), hsl(${hue}, 100%, 50%))`
                }}
              />
            </div>
            
            {/* Lightness 슬라이더 */}
            <div>
              <div className="text-xs opacity-70 mb-1">Lightness</div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={lightness}
                onChange={(e)=>setLightness(Number(e.target.value))}
                className="w-full h-2 rounded appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))`
                }}
              />
            </div>
            
            <div className="flex gap-1 pt-1">
              <button 
                className="flex-1 px-2 py-1 rounded bg-teal-500/80 hover:bg-teal-500 text-xs text-black font-semibold"
                onClick={()=>{ 
                  addCustomColor(customColor); // 히스토리에 추가
                  setStyle(nodeId,{color:customColor}); 
                  setShowColorInput(false);
                  onClose(); 
                }}
              >
                Apply
              </button>
              <button 
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs"
                onClick={()=>setShowColorInput(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-1 mt-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!current.labelPinned} onChange={(e)=>setStyle(nodeId,{labelPinned:e.target.checked})} /> Pin label
        </label>
        <label className="flex items-center gap-2 text-sm ml-2">
          <input type="checkbox" checked={!!current.glow} onChange={(e)=>setStyle(nodeId,{glow:e.target.checked})} /> Emphasis glow
        </label>
      </div>
    </div>
  );
}

/********************** [components] 설정 모달 **********************/
function SettingsModal({ open, onClose, storageMode, setStorageMode, clearLocal }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-settings" onClick={(e)=>e.stopPropagation()}>
        <div className="text-lg font-semibold mb-3">Settings</div>
        <div className="space-y-4 text-sm">
          <div>
            <div className="opacity-70 mb-1">Storage Mode</div>
            <div className="flex gap-2">
              <button className={`px-3 py-1 rounded ${storageMode==='local'?'bg-white/10':''}`} onClick={()=>setStorageMode('local')}>Local (default)</button>
              <button className={`px-3 py-1 rounded ${storageMode==='remote'?'bg-white/10':''}`} onClick={()=>setStorageMode('remote')}>Remote (placeholder)</button>
            </div>
            <div className="text-xs opacity-60 mt-1">Remote는 아직 미구현이며, 후에 서버 연동 시 어댑터만 교체하면 됩니다.</div>
          </div>
          <div>
            <div className="opacity-70 mb-1">Layout</div>
            <div className="text-xs opacity-70">기본은 동심원 고정입니다. 개별 노드 우클릭으로 "Switch to Force"(unlock) 전환 가능.</div>
          </div>
          <div>
            <button className="px-3 py-1 rounded bg-red-600/80 hover:bg-red-600" onClick={clearLocal}>Clear Local Cache</button>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/********************** [components] 추가 모달 **********************/
function AddNodeModal({ open, onClose, graph, addNode, form, setForm }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-add-node" onClick={(e)=>e.stopPropagation()}>
        <div className="text-lg font-semibold mb-3">Add Node</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="opacity-70">Title</span>
            <input className="input-field" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} placeholder="e.g., New Paper" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="opacity-70">Group</span>
            <select className="input-field" value={form.group} onChange={(e)=>setForm({...form, group:e.target.value})}>
              <option value={1}>Core</option>
              <option value={2}>Forward</option>
              <option value={3}>Backward</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="opacity-70">Link Type</span>
            <select className="input-field" value={form.linkType} onChange={(e)=>setForm({...form, linkType:e.target.value})}>
              <option value="forward">Core/기준 → 새 노드</option>
              <option value="backward">새 노드 → Core/기준</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="opacity-70">Connect To</span>
            <select className="input-field" value={form.connectTo} onChange={(e)=>setForm({...form, connectTo:e.target.value})}>
              {graph.nodes.map(n=> (<option key={n.id} value={n.id}>{n.id}</option>))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 rounded bg-teal-500 text-black font-semibold hover:bg-teal-400" onClick={addNode}>Add</button>
        </div>
      </div>
    </div>
  );
}

/********************** [components] 그래프 뷰 **********************/
function GraphView({
  containerRef,
  size,
  fgRef,
  derivedData,
  nodeStyles,
  lockedIds,
  setContextMenu,
  onNodeClickWithPosition, // 새로운 prop: 클릭 위치 포함
  closePreviewMenu, // 미리보기 메뉴 닫기
  onZoomChange, // 줌 레벨 변경 핸들러
}) {
  // 커서 포인터 처리(안전하게 컨테이너 div에 적용)
  const onNodeHover = (n) => { 
    const el = containerRef.current; 
    if (!el) return; 
    el.style.cursor = n ? 'pointer' : 'default'; 
  };
  // 좌클릭: 토글 메뉴 표시
  const onNodeClick = (node, evt) => { 
    if (!node) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const x = (evt?.clientX ?? 0) - (rect?.left ?? 0);
    const y = (evt?.clientY ?? 0) - (rect?.top ?? 0);
    onNodeClickWithPosition(node.id, x, y);
    setContextMenu((m)=>({...m, visible:false})); 
  };
  // 우클릭: 컨텍스트 메뉴
  const onNodeRightClick = (node, evt) => {
    evt?.preventDefault?.();
    const rect = containerRef.current?.getBoundingClientRect();
    const x=(evt?.clientX??0)-(rect?.left??0); const y=(evt?.clientY??0)-(rect?.top??0);
    setContextMenu({visible:true, x, y, nodeId:node.id});
    closePreviewMenu(); // 미리보기 메뉴 닫기
  };
  // 배경 클릭: 모든 메뉴 닫기
  const onBackgroundClick = () => {
    closePreviewMenu();
    setContextMenu((m)=>({...m, visible:false}));
  };
  // 줌/드래그 시: 모든 메뉴 닫기 + 줌 레벨 업데이트
  const onZoom = () => {
    closePreviewMenu();
    setContextMenu((m)=>({...m, visible:false}));
    
    // 줌 레벨 업데이트 (스크롤 줌 시)
    if (fgRef.current && onZoomChange) {
      const currentZoom = fgRef.current.zoom();
      onZoomChange(currentZoom);
    }
  };

  // 캔버스 노드 그리기 콜백 구성
  const nodeCanvasObject = useMemo(() => makeNodeCanvasObject(nodeStyles, lockedIds), [nodeStyles, lockedIds]);
  const nodePointerAreaPaint = useMemo(() => makeNodePointerAreaPaint(nodeStyles), [nodeStyles]);
  // 링크 곡률
  const linkCurvature = useMemo(() => makeCurvatureAccessor(derivedData), [derivedData]);

  // 그래프 화면 맞추기
  const fit = useCallback(() => { 
    if (fgRef.current) fgRef.current.zoomToFit(600, 40); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 초기 로드시에만 fit 실행 (derivedData 변경 시 제외)
  useEffect(() => { 
    if (size.width && size.height) {
      const timer = setTimeout(fit, 0);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  // 노드 드래그 시 화면 경계 체크 및 자동 축소
  const onNodeDragRef = useRef(null);
  const onNodeDrag = useCallback((node) => {
    if (!fgRef.current || !containerRef.current) return;
    
    const padding = 50; // 경계 여유 공간
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    // 노드가 화면 밖으로 나가는지 체크
    const screenCoords = fgRef.current.graph2ScreenCoords(node.x, node.y);
    const isOutOfBounds = 
      screenCoords.x < padding || 
      screenCoords.x > width - padding || 
      screenCoords.y < padding || 
      screenCoords.y > height - padding;
    
    if (isOutOfBounds) {
      // 스로틀링: 100ms마다 한 번만 실행
      const now = Date.now();
      if (onNodeDragRef.current && now - onNodeDragRef.current < 100) return;
      onNodeDragRef.current = now;
      
      // 현재 화면 중심을 유지하면서 줌 아웃
      const currentZoom = fgRef.current.zoom();
      const newZoom = currentZoom * 0.5;
      
      // 줌만 변경 (화면 중심 유지)
      fgRef.current.zoom(newZoom, 100);
    }
  }, [fgRef, containerRef]);

  // 크기가 0이면 윈도우 크기 사용 (초기 렌더링)
  const displayWidth = size.width || window.innerWidth;
  const displayHeight = size.height || window.innerHeight;

  return (
    <ForceGraph2D
      ref={fgRef}
      width={displayWidth}
      height={displayHeight}
      graphData={derivedData}
      nodeRelSize={6}
      backgroundColor="#0a0a0a"
      linkColor={defaultLinkColor}
      linkDirectionalArrowLength={6}
      linkDirectionalArrowRelPos={0.5}
      linkCurvature={linkCurvature}
      cooldownTicks={0}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
      onNodeHover={onNodeHover}
      onNodeClick={onNodeClick}
      onNodeRightClick={onNodeRightClick}
      onBackgroundClick={onBackgroundClick}
      onZoom={onZoom}
      nodeLabel={(n)=>n.title||n.id}
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={nodePointerAreaPaint}
      onNodeDrag={onNodeDrag}
    />
  );
}

/********************** [components] 런타임 기본 검사 **********************/
function RuntimeAsserts({ data }) {
  useEffect(() => { 
    try {
      console.assert(Array.isArray(data.nodes) && data.nodes.length >= 5, 'nodes length >= 5');
      console.assert(Array.isArray(data.links) && data.links.length >= 4, 'links length >= 4');
    } catch (err) {
      console.error('Runtime assertion failed:', err);
    } 
  }, [data]);
  return null;
}

/********************** [page] 메인 앱 **********************/
export default function App() {
  /** 저장소: 로컬 기본, 이후 Remote로 교체 가능 */
  const [storageMode, setStorageMode] = useState('local'); // 'local' | 'remote'
  const storage = useMemo(() => storageMode === 'local' ? createLocalStorageAdapter() : createRemoteAdapter(), [storageMode]);

  /** 초깃값 로드 */
  const loaded = storage.load && storage.load();
  const initial = loaded || seedCore5();

  /** 그래프/스타일/락 상태 (전역 State) */
  const [graph, setGraph] = useState({ nodes: initial.nodes, links: initial.links });
  const [nodeStyles, setNodeStyles] = useState(initial.nodeStyles || {});
  const [lockedIds, setLockedIds] = useState(new Set(initial.lockedIds || []));

  /** IndexedDB 초기화 (Seed Notes) */
  useEffect(() => {
    const initNotes = async () => {
      try {
        const data = seedCore5();
        if (data.detailedNotes) {
          await initializeSeedNotes(data.detailedNotes);
          console.log('📦 IndexedDB 초기화 완료 (Seed Notes)');
        }
      } catch (error) {
        console.error('IndexedDB 초기화 실패:', error);
      }
    };
    
    // 첫 로드 시에만 초기화 (localStorage에 데이터가 없을 때)
    if (!loaded) {
      initNotes();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** 참조/사이즈 */
  const [containerRef, size] = useMeasure();
  const fgRef = useRef(null);

  /** 선택/패널/모달 상태 */
  const [selectedId, setSelectedId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, nodeId: null });
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 }); // 토글 메뉴 위치
  const [notePanelOpen, setNotePanelOpen] = useState(false); // 노트 패널 열림 상태
  const [panelWidth, setPanelWidth] = useState(Math.max(360, window.innerWidth * 0.4)); // 노트 패널 너비
  
  /** 커스텀 색상 히스토리 (최대 8개, Queue 방식) */
  const [customColorHistory, setCustomColorHistory] = useState([]);
  
  // 커스텀 색상 추가 함수 (왼쪽에 추가, 오른쪽 제거)
  const addCustomColor = (color) => {
    setCustomColorHistory(prev => {
      // 이미 존재하면 제거하고 맨 앞에 추가
      const filtered = prev.filter(c => c !== color);
      const newHistory = [color, ...filtered];
      // 최대 8개까지만 유지
      return newHistory.slice(0, 8);
    });
  };
  
  /** 줌 레벨 상태 */
  const [zoomLevel, setZoomLevel] = useState(1.0);

  /** 저장: 상태 변경 시 자동 저장 */
  useEffect(() => { storage.save && storage.save({ nodes: graph.nodes, links: graph.links, nodeStyles, lockedIds: Array.from(lockedIds) }); }, [graph, nodeStyles, lockedIds, storage]);
  /** 스타일 변경 시 캔버스만 리프레시(물리 리셋 방지) */
  useEffect(() => { fgRef.current?.refresh?.(); }, [nodeStyles]);

  /** 동심원 앵커 & 고정 좌표 적용 */
  const radialAnchors = useMemo(() => computeRadialAnchors(graph), [graph]);
  const derivedData = useMemo(() => {
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = graph.links.map((l) => ({ source: toId(l.source), target: toId(l.target), type: l.type }));
    for (const n of nodes) {
      if (lockedIds.has(n.id)) { const a = radialAnchors.get(n.id); n.fx = a?.x ?? 0; n.fy = a?.y ?? 0; }
      else { n.fx = undefined; n.fy = undefined; }
    }
    return { nodes, links };
  }, [graph, lockedIds, radialAnchors]);

  /** 노트 읽기/수정 */
  const selectedNote = useMemo(() => graph.nodes.find(n => n.id===selectedId) || null, [graph, selectedId]);
  const updateNote = (patch) => setGraph((g)=>({ ...g, nodes: g.nodes.map(n => n.id===selectedId ? { ...n, ...patch } : n) }));

  /** 노드 추가 폼 */
  const [addForm, setAddForm] = useState({ title: '', group: 2, linkType: 'forward', connectTo: 'Core' });
  /** 노드 추가 */
  const addNode = () => {
    const id = genId();
    setGraph((g)=>({
      nodes: [...g.nodes, { id, group: Number(addForm.group)||2, title: addForm.title||'Untitled', summary: '' }],
      links: [...g.links, { source: addForm.linkType==='forward'? (addForm.connectTo||'Core') : id, target: addForm.linkType==='forward'? id : (addForm.connectTo||'Core'), type: addForm.linkType }]
    }));
    setLockedIds((s)=> new Set([...Array.from(s), id]));
    setShowAdd(false);
  };

  /** 스타일/락 헬퍼 (하위 컴포넌트에 주입) */
  const toggleLock = (nodeId) => setLockedIds((prev)=>{ const next = new Set(prev); if(next.has(nodeId)) next.delete(nodeId); else next.add(nodeId); return next; });
  const setStyle = (nodeId, patch) => setNodeStyles((s)=> ({ ...s, [nodeId]: { ...(s[nodeId]||{}), ...patch } }));

  /** 컨텍스트 메뉴 global 핸들러: ESC/바깥 클릭 닫기 */
  useEffect(() => {
    const onEsc=(e)=>{ if(e.key==='Escape'){ setSelectedId(null); setContextMenu((m)=>({...m,visible:false})); } };
    const onClick=()=> setContextMenu((m)=>({...m,visible:false}));
    window.addEventListener('keydown', onEsc);
    window.addEventListener('click', onClick);
    return ()=>{ window.removeEventListener('keydown', onEsc); window.removeEventListener('click', onClick); };
  }, []);

  /** 컨테이너 내부 기본 컨텍스트 메뉴 비활성화 */
  useEffect(() => { 
    const el = containerRef.current; 
    if (!el) return; 
    const h = (e) => e.preventDefault(); 
    el.addEventListener('contextmenu', h); 
    return () => el.removeEventListener('contextmenu', h); 
  }, [containerRef]);

  /** 로컬 캐시 삭제 */
  const clearLocal = () => { if (storage.mode==='local' && storage.clear) { storage.clear(); alert('Local cache cleared. Reload to see initial seed.'); } };

  /** 노드 클릭 시 토글 메뉴 표시 */
  const handleNodeClickWithPosition = (nodeId, x, y) => {
    setSelectedId(nodeId);
    setPreviewPosition({ x, y });
    // 노트 패널은 사용자가 "Open Note"를 클릭할 때만 열림
  };

  /** 미리보기 메뉴 닫기 */
  const closePreviewMenu = () => {
    // 노트 패널이 열려있지 않을 때만 selectedId 초기화
    if (!notePanelOpen) {
      setSelectedId(null);
    }
    setPreviewPosition({ x: 0, y: 0 });
  };

  /** 토글 메뉴에서 "Open Note" 클릭 시 패널 열기 */
  const handleOpenNotePanel = () => {
    setNotePanelOpen(true);
    setPreviewPosition({ x: 0, y: 0 }); // 토글 메뉴 숨기기 (패널이 열리면 조건에 의해 자동으로 사라짐)
  };

  /** 줌 레벨 변경 핸들러 */
  const handleZoomChange = (newZoom) => {
    setZoomLevel(newZoom);
  };

  /** 키보드 단축키 (Zoom & Fit) */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + Plus: Zoom In
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        if (fgRef.current) {
          const currentZoom = fgRef.current.zoom();
          const newZoom = Math.min(currentZoom * 1.2, 4);
          fgRef.current.zoom(newZoom, 400);
          setZoomLevel(newZoom);
        }
      }
      // Ctrl + Minus: Zoom Out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        if (fgRef.current) {
          const currentZoom = fgRef.current.zoom();
          const newZoom = Math.max(currentZoom / 1.2, 0.5);
          fgRef.current.zoom(newZoom, 400);
          setZoomLevel(newZoom);
        }
      }
      // Space: Fit to Screen
      if (e.key === ' ' && !e.target.closest('textarea') && !e.target.closest('input')) {
        e.preventDefault();
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 40);
          setTimeout(() => {
            const newZoom = fgRef.current.zoom();
            setZoomLevel(newZoom);
          }, 450);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /******************** 렌더 ********************/
  return (
    <div className="w-full h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* 그래프 영역 - 전체 화면, 노트 패널이 열리면 너비 축소 */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          right: notePanelOpen ? `${panelWidth}px` : '0'
        }}
      >
        <div ref={containerRef} className="graph-container">
          <GraphView
            containerRef={containerRef}
            size={size}
            fgRef={fgRef}
            derivedData={derivedData}
            nodeStyles={nodeStyles}
            lockedIds={lockedIds}
            setContextMenu={setContextMenu}
            onNodeClickWithPosition={handleNodeClickWithPosition}
            closePreviewMenu={closePreviewMenu}
            onZoomChange={handleZoomChange}
          />
        </div>

        {/* Zoom Controls */}
        <ZoomControls 
          fgRef={fgRef} 
          zoom={zoomLevel}
          onZoomChange={handleZoomChange}
        />

        {/* 컨텍스트 메뉴 */}
        <ContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeStyles={nodeStyles}
          setStyle={setStyle}
          lockedIds={lockedIds}
          toggleLock={toggleLock}
          onClose={()=>setContextMenu((m)=>({...m, visible:false}))}
          customColorHistory={customColorHistory}
          addCustomColor={addCustomColor}
        />

        {/* 토글 미리보기 메뉴 - 노드 클릭 시 마우스 근처에 표시 */}
        {selectedNote && !notePanelOpen && previewPosition.x > 0 && (
          <div 
            className="preview-menu"
            style={{
              left: Math.min(previewPosition.x + 10, size.width - 270),
              top: Math.min(previewPosition.y + 10, size.height - 120),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm truncate">{selectedNote.title}</div>
              <button 
                className="text-xs opacity-60 hover:opacity-100"
                onClick={() => {
                  setSelectedId(null);
                  setPreviewPosition({ x: 0, y: 0 });
                }}
              >✕</button>
            </div>
            <div className="text-xs opacity-70 mb-3 line-clamp-2">
              {selectedNote.summary || '요약 내용이 없습니다.'}
            </div>
            <button 
              className="w-full px-3 py-1.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-sm font-medium transition-colors"
              onClick={handleOpenNotePanel}
            >
              📝 Open Note
            </button>
          </div>
        )}

        {/* 좌하단: 설정 버튼 */}
        <button 
          className="btn-circular btn-settings"
          onClick={()=>setShowSettings(true)} 
          title="Settings"
        >
          ⚙️
        </button>

        {/* 우하단: 노드 추가 버튼 */}
        <button 
          className="btn-circular btn-add-node"
          onClick={()=>setShowAdd(true)} 
          title="Add node"
        >
          +
        </button>
      </div>

      {/* 우측 노트 패널 - 새로운 NotePanel 컴포넌트 사용 */}
      <NotePanel
        selectedNote={selectedNote}
        onClose={() => {
          setNotePanelOpen(false);
          setSelectedId(null); // 패널 닫을 때 선택 해제
        }}
        onChange={updateNote}
        isOpen={notePanelOpen}
        panelWidth={panelWidth}
        setPanelWidth={setPanelWidth}
      />

      {/* 설정 모달 */}
      <SettingsModal open={showSettings} onClose={()=>setShowSettings(false)} storageMode={storageMode} setStorageMode={setStorageMode} clearLocal={clearLocal} />

      {/* 노드 추가 모달 */}
      <AddNodeModal open={showAdd} onClose={()=>setShowAdd(false)} graph={graph} addNode={addNode} form={addForm} setForm={setAddForm} />

      {/* 기본 무결성 점검 */}
      <RuntimeAsserts data={derivedData} />
    </div>
  );
}
