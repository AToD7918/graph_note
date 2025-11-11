import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useMeasure } from './hooks/useMeasure';
import { toId, genId } from './utils/helpers';
import { createLocalStorageAdapter, createRemoteAdapter } from './adapters/storage';
import { initializeSeedNotes } from './adapters/noteStorage';
import { seedCore5 } from './data/seedData';
import { computeRadialAnchors, makeCurvatureAccessor } from './graph/layout';
import { makeNodeCanvasObject, makeNodePointerAreaPaint, defaultLinkColor } from './graph/renderers';
import { NotePanel } from './components/NotePanel/NotePanel';
import { ZoomControls } from './components/ZoomControls';
import { SettingsModal } from './components/SettingsModal';
import { AddNodeModal } from './components/AddNodeModal';
import { ContextMenu } from './components/contextMenu';
import { GraphViewSelector } from './components/GraphViewSelector';
import { loadTagsIndex, rebuildTagsIndex, saveTagsIndex, ensureTagsField } from './utils/tagHelpers';

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

/********************** [components] 그래프 뷰 **********************/
function GraphView({
  containerRef,
  size,
  fgRef,
  derivedData,
  nodeStyles,
  lockedIds,
  selectedId, // 선택된 노드 ID 추가
  setContextMenu,
  onNodeClickWithPosition, // 새로운 prop: 클릭 위치 포함
  closePreviewMenu, // 미리보기 메뉴 닫기
  onZoomChange, // 줌 레벨 변경 핸들러
  onNodeDragEnd, // 노드 드래그 종료 핸들러
}) {
  // 커서 포인터 처리(안전하게 컨테이너 div에 적용)
  const onNodeHover = (n) => { 
    const el = containerRef.current; 
    if (!el) return; 
    el.style.cursor = n ? 'pointer' : 'default'; 
  };
  
  // 드래그 종료 핸들러 래핑 (디버깅용)
  const handleDragEnd = useCallback((node) => {
    console.log('🔵 GraphView에서 드래그 종료 감지:', node?.id, node);
    if (onNodeDragEnd) {
      onNodeDragEnd(node);
    }
  }, [onNodeDragEnd]);
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
    // React 렌더링 사이클 밖에서 state 업데이트하기 위해 비동기 처리
    requestAnimationFrame(() => {
      closePreviewMenu();
      setContextMenu((m)=>({...m, visible:false}));
    });
  };
  // 줌/드래그 시: 모든 메뉴 닫기 + 줌 레벨 업데이트
  const onZoom = () => {
    // React 렌더링 사이클 밖에서 state 업데이트하기 위해 비동기 처리
    requestAnimationFrame(() => {
      closePreviewMenu();
      setContextMenu((m)=>({...m, visible:false}));
      
      // 줌 레벨 업데이트 (스크롤 줌 시)
      if (fgRef.current && onZoomChange) {
        const currentZoom = fgRef.current.zoom();
        onZoomChange(currentZoom);
      }
    });
  };

  // 캔버스 노드 그리기 콜백 구성
  const nodeCanvasObject = useMemo(() => makeNodeCanvasObject(nodeStyles, lockedIds, selectedId), [nodeStyles, lockedIds, selectedId]);
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
  const dragStartLoggedRef = useRef(new Set());
  
  const onNodeDrag = useCallback((node) => {
    if (!fgRef.current || !containerRef.current) return;
    
    // 드래그 시작 시 노드의 고정 해제 (물리 시뮬레이션 없이 드래그만 가능하도록)
    if (node && node.fx != null && node.fy != null) {
      node.fx = null;
      node.fy = null;
    }
    
    // 드래그 시작 로그 (노드당 한 번만)
    if (node && !dragStartLoggedRef.current.has(node.id)) {
      console.log('🟢 드래그 시작:', node.id);
      dragStartLoggedRef.current.add(node.id);
      // 5초 후 로그 추적 리셋 (다음 드래그를 위해)
      setTimeout(() => dragStartLoggedRef.current.delete(node.id), 5000);
    }
    
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
      d3AlphaDecay={1}
      d3VelocityDecay={1}
      enableNodeDrag={true}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      onNodeHover={onNodeHover}
      onNodeClick={onNodeClick}
      onNodeRightClick={onNodeRightClick}
      onBackgroundClick={onBackgroundClick}
      onZoom={onZoom}
      nodeLabel={(n)=>n.title||n.id}
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={nodePointerAreaPaint}
      onNodeDrag={onNodeDrag}
      onNodeDragEnd={handleDragEnd}
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
  
  /** 그래프 뷰 모드 상태 */
  const [graphViewMode, setGraphViewMode] = useState('relationship'); // 'relationship' | 'tag' | 'timeline'

  /** 노드 위치 상태 (localStorage에서 로드) */
  const [savedNodePositions, setSavedNodePositions] = useState({});

  /** 태그 인덱스 상태 (자동완성용) */
  const [tagsIndex, setTagsIndex] = useState({});

  /** 태그 인덱스 초기화 */
  useEffect(() => {
    // localStorage에서 인덱스 로드
    const storedIndex = loadTagsIndex();
    
    // 그래프 데이터에서 인덱스 재구축
    const rebuiltIndex = rebuildTagsIndex(graph.nodes);
    
    // 병합 (stored + rebuilt)
    const mergedIndex = { ...storedIndex };
    Object.entries(rebuiltIndex).forEach(([category, tags]) => {
      if (!mergedIndex[category]) {
        mergedIndex[category] = tags;
      } else {
        // 중복 제거 및 병합
        mergedIndex[category] = [...new Set([...mergedIndex[category], ...tags])].sort();
      }
    });
    
    setTagsIndex(mergedIndex);
    saveTagsIndex(mergedIndex);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** 노드 데이터에 tags 필드 확보 (마이그레이션) */
  useEffect(() => {
    const needsMigration = graph.nodes.some(node => !node.tags || typeof node.tags !== 'object');
    
    if (needsMigration) {
      setGraph(g => ({
        ...g,
        nodes: g.nodes.map(ensureTagsField)
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** 초기 로드 시 노드 위치 불러오기 */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('graphNodePositions');
      if (saved) {
        const positions = JSON.parse(saved);
        setSavedNodePositions(positions);
        console.log('📍 노드 위치 로드 완료:', Object.keys(positions).length, '개');
      }
    } catch (error) {
      console.error('노드 위치 로드 실패:', error);
    }
  }, []); // 초기 로드만

  /** 저장: 상태 변경 시 자동 저장 */
  useEffect(() => { storage.save && storage.save({ nodes: graph.nodes, links: graph.links, nodeStyles, lockedIds: Array.from(lockedIds) }); }, [graph, nodeStyles, lockedIds, storage]);
  /** 스타일 변경 시 캔버스만 리프레시(물리 리셋 방지) */
  useEffect(() => { fgRef.current?.refresh?.(); }, [nodeStyles]);

  const saveNodePositions = useCallback((updatedNode) => {
    try {
      if (!updatedNode || updatedNode.x == null || updatedNode.y == null) return;
      
      // 함수형 업데이트로 최신 state 사용
      setSavedNodePositions(prevPositions => {
        const newPositions = {
          ...prevPositions,
          [updatedNode.id]: { x: updatedNode.x, y: updatedNode.y }
        };
        
        // localStorage에 저장
        localStorage.setItem('graphNodePositions', JSON.stringify(newPositions));
        console.log('💾 노드 위치 저장:', updatedNode.id, `(x: ${updatedNode.x.toFixed(1)}, y: ${updatedNode.y.toFixed(1)})`);
        
        return newPositions;
      });
    } catch (error) {
      console.error('노드 위치 저장 실패:', error);
    }
  }, []);

  const savePositionsTimerRef = useRef(null);
  const scheduleSavePositions = useCallback((node) => {
    if (savePositionsTimerRef.current) {
      clearTimeout(savePositionsTimerRef.current);
    }
    // 400ms 디바운스 (드래그 중에는 저장하지 않음)
    savePositionsTimerRef.current = setTimeout(() => {
      saveNodePositions(node);
    }, 400);
  }, [saveNodePositions]);

  /** 동심원 앵커 & 고정 좌표 적용 + 저장된 위치 복원 */
  const radialAnchors = useMemo(() => computeRadialAnchors(graph, lockedIds), [graph, lockedIds]);
  const derivedData = useMemo(() => {
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = graph.links.map((l) => ({ source: toId(l.source), target: toId(l.target), type: l.type }));
    
    // 노드 ID -> 노드 객체 맵 생성 (빠른 조회)
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    let lockedCount = 0, savedCount = 0, newCount = 0;
    
    for (const n of nodes) {
      if (lockedIds.has(n.id)) { 
        // 동심원 고정 노드: 앵커 위치 사용
        const a = radialAnchors.get(n.id); 
        n.fx = a?.x ?? 0; 
        n.fy = a?.y ?? 0;
        // 속도 완전히 제거
        n.vx = 0;
        n.vy = 0;
        lockedCount++;
      } else if (savedNodePositions[n.id]) {
        // 저장된 위치가 있는 자유 노드: 저장된 위치에 완전히 고정
        n.x = savedNodePositions[n.id].x;
        n.y = savedNodePositions[n.id].y;
        // fx, fy로 고정하여 물리 시뮬레이션의 영향 완전 차단
        n.fx = savedNodePositions[n.id].x;
        n.fy = savedNodePositions[n.id].y;
        // 속도 완전히 제거
        n.vx = 0;
        n.vy = 0;
        savedCount++;
      } else { 
        // 새 노드: 연결된 부모 노드 근처에 초기 배치
        // 초기 위치 계산 후 fx, fy로 고정
        
        // 이 노드와 연결된 부모 노드 찾기
        const parentLink = links.find(l => 
          toId(l.target) === n.id || toId(l.source) === n.id
        );
        
        if (parentLink) {
          // 부모 노드 ID 확인 (target이 현재 노드면 source가 부모, 반대도 마찬가지)
          const parentId = toId(parentLink.target) === n.id 
            ? toId(parentLink.source) 
            : toId(parentLink.target);
          
          const parentNode = nodeMap.get(parentId);
          
          if (parentNode) {
            // 부모 노드의 위치 확인
            let parentX, parentY;
            
            if (lockedIds.has(parentId)) {
              // 부모가 고정 노드면 앵커 위치 사용
              const anchor = radialAnchors.get(parentId);
              parentX = anchor?.x ?? 0;
              parentY = anchor?.y ?? 0;
            } else if (savedNodePositions[parentId]) {
              // 부모가 저장된 노드면 저장된 위치 사용
              parentX = savedNodePositions[parentId].x;
              parentY = savedNodePositions[parentId].y;
            } else if (parentNode.x != null && parentNode.y != null) {
              // 부모의 현재 위치 사용
              parentX = parentNode.x;
              parentY = parentNode.y;
            } else {
              // 부모 위치도 없으면 중앙
              parentX = 0;
              parentY = 0;
            }
            
            // 부모 근처에 랜덤 오프셋으로 배치 (20-30px 거리, 충돌 방지)
            const minDistance = 20;
            const maxDistance = 30;
            const minNodeGap = 25; // 노드 간 최소 거리
            const maxAttempts = 12; // 최대 시도 횟수 (30도씩 회전)
            
            let finalX, finalY;
            let foundValidPosition = false;
            
            // 여러 각도를 시도하여 겹치지 않는 위치 찾기
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              const distance = minDistance + Math.random() * (maxDistance - minDistance);
              const baseAngle = Math.random() * 2 * Math.PI;
              const angle = baseAngle + (attempt * Math.PI / 6); // 30도씩 회전
              
              const testX = parentX + distance * Math.cos(angle);
              const testY = parentY + distance * Math.sin(angle);
              
              // 모든 기존 노드와의 거리 확인
              let hasCollision = false;
              for (const existingNode of nodes) {
                if (existingNode === n) continue; // 자기 자신 제외
                
                let existingX, existingY;
                
                if (lockedIds.has(existingNode.id)) {
                  const anchor = radialAnchors.get(existingNode.id);
                  existingX = anchor?.x ?? 0;
                  existingY = anchor?.y ?? 0;
                } else if (savedNodePositions[existingNode.id]) {
                  existingX = savedNodePositions[existingNode.id].x;
                  existingY = savedNodePositions[existingNode.id].y;
                } else if (existingNode.x != null && existingNode.y != null) {
                  existingX = existingNode.x;
                  existingY = existingNode.y;
                } else {
                  continue; // 위치 없는 노드는 스킵
                }
                
                const dx = testX - existingX;
                const dy = testY - existingY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < minNodeGap) {
                  hasCollision = true;
                  break;
                }
              }
              
              if (!hasCollision) {
                finalX = testX;
                finalY = testY;
                foundValidPosition = true;
                console.log(`✅ 새 노드 ${n.id} → 부모 ${parentId} 근처 배치 (시도 ${attempt + 1}회, ${finalX.toFixed(1)}, ${finalY.toFixed(1)})`);
                break;
              }
            }
            
            // 충돌 없는 위치를 찾지 못하면 거리를 늘려서 배치
            if (!foundValidPosition) {
              const fallbackDistance = maxDistance + 10;
              const angle = Math.random() * 2 * Math.PI;
              finalX = parentX + fallbackDistance * Math.cos(angle);
              finalY = parentY + fallbackDistance * Math.sin(angle);
              console.log(`⚠️ 새 노드 ${n.id} → 충돌 회피 실패, 거리 증가 (${finalX.toFixed(1)}, ${finalY.toFixed(1)})`);
            }
            
            n.x = finalX;
            n.y = finalY;
            // 새 노드도 fx, fy로 완전히 고정하여 물리 시뮬레이션 영향 차단
            n.fx = finalX;
            n.fy = finalY;
            // 속도 완전히 제거
            n.vx = 0;
            n.vy = 0;
          } else {
            // 부모가 없는 새 노드는 중앙에 배치하고 고정
            if (n.x == null) n.x = 0;
            if (n.y == null) n.y = 0;
            n.fx = n.x;
            n.fy = n.y;
            n.vx = 0;
            n.vy = 0;
          }
        }
        
        newCount++;
      }
    }
    
    console.log(`📊 노드 상태: 동심원 고정 ${lockedCount}개, 저장된 위치 ${savedCount}개, 새 노드 ${newCount}개`);
    
    return { nodes, links };
  }, [graph, lockedIds, radialAnchors, savedNodePositions]);

  /** 노트 읽기/수정 */
  const selectedNote = useMemo(() => graph.nodes.find(n => n.id===selectedId) || null, [graph, selectedId]);
  const updateNote = (patch) => {
    setGraph((g)=>({ ...g, nodes: g.nodes.map(n => n.id===selectedId ? { ...n, ...patch } : n) }));
    
    // 태그가 업데이트되면 인덱스 재구축
    if (patch.tags) {
      const updatedIndex = rebuildTagsIndex(graph.nodes.map(n => 
        n.id === selectedId ? { ...n, ...patch } : n
      ));
      setTagsIndex(updatedIndex);
      saveTagsIndex(updatedIndex);
    }
  };

  /** 노드 추가 폼 */
  const [addForm, setAddForm] = useState({ title: '', group: 2, linkType: 'forward', connectTo: 'Core', isCore: false, isLocked: false });
  /** 노드 추가 */
  const addNode = () => {
    const id = genId();
    const group = Number(addForm.group) || 2;
    
    // 새 노드의 초기 위치 계산 (부모 노드 근처)
    let initialX = 0, initialY = 0;
    
    // 동심원 고정이 아닌 경우에만 위치 계산 및 저장
    if (!addForm.isLocked) {
      // 연결될 노드 ID
      const connectToId = addForm.connectTo || 'Core';
      
      // 부모 노드의 위치 확인
      let parentX = 0, parentY = 0;
      
      if (lockedIds.has(connectToId)) {
        // 부모가 동심원 고정 노드면 앵커 위치 사용
        const anchor = radialAnchors.get(connectToId);
        parentX = anchor?.x ?? 0;
        parentY = anchor?.y ?? 0;
      } else if (savedNodePositions[connectToId]) {
        // 부모가 저장된 노드면 저장된 위치 사용
        parentX = savedNodePositions[connectToId].x;
        parentY = savedNodePositions[connectToId].y;
      } else {
        // 부모 노드를 graph에서 찾기
        const parentNode = graph.nodes.find(n => n.id === connectToId);
        if (parentNode && parentNode.x != null && parentNode.y != null) {
          parentX = parentNode.x;
          parentY = parentNode.y;
        }
      }
      
      // 부모 근처에 랜덤 배치 (20-30px 거리, 충돌 방지)
      const minDistance = 20;
      const maxDistance = 30;
      const minNodeGap = 25;
      const maxAttempts = 12;
      
      let foundValidPosition = false;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        const baseAngle = Math.random() * 2 * Math.PI;
        const angle = baseAngle + (attempt * Math.PI / 6);
        
        const testX = parentX + distance * Math.cos(angle);
        const testY = parentY + distance * Math.sin(angle);
        
        // 기존 노드들과 충돌 검사
        let hasCollision = false;
        for (const nodeId in savedNodePositions) {
          const pos = savedNodePositions[nodeId];
          const dx = testX - pos.x;
          const dy = testY - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < minNodeGap) {
            hasCollision = true;
            break;
          }
        }
        
        // 동심원 노드들과도 충돌 검사
        if (!hasCollision) {
          for (const [, anchor] of radialAnchors.entries()) {
            const dx = testX - anchor.x;
            const dy = testY - anchor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minNodeGap) {
              hasCollision = true;
              break;
            }
          }
        }
        
        if (!hasCollision) {
          initialX = testX;
          initialY = testY;
          foundValidPosition = true;
          console.log(`✅ 새 노드 ${id} 위치 계산 완료 (시도 ${attempt + 1}회, ${initialX.toFixed(1)}, ${initialY.toFixed(1)})`);
          break;
        }
      }
      
      // 충돌 회피 실패 시 거리 증가
      if (!foundValidPosition) {
        const fallbackDistance = maxDistance + 10;
        const angle = Math.random() * 2 * Math.PI;
        initialX = parentX + fallbackDistance * Math.cos(angle);
        initialY = parentY + fallbackDistance * Math.sin(angle);
        console.log(`⚠️ 새 노드 ${id} 충돌 회피 실패, 거리 증가 (${initialX.toFixed(1)}, ${initialY.toFixed(1)})`);
      }
      
      // 즉시 savedNodePositions에 저장하여 다음 렌더링에서 고정되도록 함
      setSavedNodePositions(prev => ({
        ...prev,
        [id]: { x: initialX, y: initialY }
      }));
      
      console.log('💾 새 노드 위치 즉시 저장:', id, `(${initialX.toFixed(1)}, ${initialY.toFixed(1)})`);
    }
    
    setGraph((g)=>({
      nodes: [...g.nodes, { id, group, title: addForm.title||'Untitled', summary: '' }],
      links: [...g.links, { source: addForm.linkType==='forward'? (addForm.connectTo||'Core') : id, target: addForm.linkType==='forward'? id : (addForm.connectTo||'Core'), type: addForm.linkType }]
    }));
    
    // isLocked 체크박스가 선택된 경우에만 동심원에 고정
    if (addForm.isLocked) {
      setLockedIds((s)=> new Set([...Array.from(s), id]));
      console.log('🔒 동심원 고정 노드 생성:', id, 'Group:', group);
    } else {
      console.log('🆓 자유 이동 노드 생성:', id, 'Group:', group, addForm.isCore ? '(Core Node)' : '', '- 위치 자동 고정됨');
    }
    
    setShowAdd(false);
  };

  /** 스타일/락 헬퍼 (하위 컴포넌트에 주입) */
  const toggleLock = (nodeId) => setLockedIds((prev)=>{ const next = new Set(prev); if(next.has(nodeId)) next.delete(nodeId); else next.add(nodeId); return next; });
  const setStyle = (nodeId, patch) => setNodeStyles((s)=> ({ ...s, [nodeId]: { ...(s[nodeId]||{}), ...patch } }));

  /** 노드 드래그 종료 핸들러 */
  const handleNodeDragEnd = useCallback((node) => {
    if (!node) {
      console.log('⚠️ handleNodeDragEnd: node가 없음');
      return;
    }
    
    // 드래그 종료 시 노드를 현재 위치에 고정
    if (node.x != null && node.y != null) {
      node.fx = node.x;
      node.fy = node.y;
      node.vx = 0;
      node.vy = 0;
    }
    
    // 동심원 고정 노드는 위치 저장 안함
    if (lockedIds.has(node.id)) {
      console.log('⚠️ 동심원 고정 노드는 위치 저장 안함:', node.id);
      return;
    }
    
    // 자유 이동 노드만 저장
    if (node.x != null && node.y != null) {
      console.log('🎯 드래그 종료 감지:', node.id, `(x: ${node.x.toFixed(1)}, y: ${node.y.toFixed(1)})`);
      scheduleSavePositions(node);
    } else {
      console.log('⚠️ 노드 좌표 없음:', node.id, node);
    }
  }, [scheduleSavePositions, lockedIds]);

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

  /** 컴포넌트 언마운트 시 타이머 정리 */
  useEffect(() => {
    return () => {
      if (savePositionsTimerRef.current) {
        clearTimeout(savePositionsTimerRef.current);
      }
    };
  }, []);

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
            selectedId={selectedId}
            setContextMenu={setContextMenu}
            onNodeClickWithPosition={handleNodeClickWithPosition}
            closePreviewMenu={closePreviewMenu}
            onZoomChange={handleZoomChange}
            onNodeDragEnd={handleNodeDragEnd}
          />
        </div>

        {/* Graph View Selector - 그래프 우측 상단 */}
        <GraphViewSelector 
          currentView={graphViewMode}
          onViewChange={setGraphViewMode}
        />

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
        tagsIndex={tagsIndex}
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
