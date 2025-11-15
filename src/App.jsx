import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { toId, genId } from './utils/helpers';
import { initializeSeedNotes } from './adapters/noteStorage';
import { computeHierarchicalLayout } from './graph/layout';
import { ensureTagsField } from './utils/tagHelpers';
import { 
  SpatialHashGrid, 
  computeNewNodePosition, 
  buildNodePositionCache,
  hasFixedPosition 
} from './utils/nodePositionOptimizer';
import { useGraphStore } from './store/graphStore';
import { useUIStore } from './store/uiStore';
import { GraphContainer } from './components/GraphContainer';
import { GraphControls } from './components/GraphControls';
import { NodePreviewMenu } from './components/NodePreviewMenu';
import { NotePanel } from './components/NotePanel/NotePanel';
import { SettingsModal } from './components/SettingsModal';
import { AddNodeModal } from './components/AddNodeModal';
import { ContextMenu } from './components/contextMenu';

/**
 * Graph-First Paper Notes (V2.0, Zustand + 컴포넌트 완전 분리)
 * -------------------------------------------------------------
 * 아키텍처 개선 사항:
 * 1) Zustand 상태 관리 도입 (graphStore, uiStore)
 * 2) 컴포넌트 완전 분리 (GraphContainer, GraphControls, NodePreviewMenu)
 * 3) Prop Drilling 제거
 * 4) App.jsx 간소화 (919줄 → ~400줄)
 * 
 * 스토어 구조:
 * - graphStore: 그래프 데이터, 노드 스타일, 위치, 태그 인덱스
 * - uiStore: 선택 상태, 패널/모달 상태, 줌 레벨, 뷰 모드
 */

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
  // === Zustand 스토어 ===
  const {
    graph,
    nodeStyles,
    lockedIds,
    savedNodePositions,
    tagsIndex,
    updateNode,
    addNode: addNodeToGraph,
    setNodeStyle,
    toggleLock,
    setLockedIds,
    saveNodePosition,
    clearStorage,
    setStorageMode,
    storageMode
  } = useGraphStore();

  const {
    selectedId,
    notePanelOpen,
    panelWidth,
    showSettings,
    showAddNode,
    contextMenu,
    previewMenu,
    zoomLevel,
    graphViewMode,
    customColorHistory,
    setSelectedId,
    openNotePanel,
    closeNotePanel,
    setPanelWidth,
    openSettings,
    closeSettings,
    openAddNode,
    closeAddNode,
    hideContextMenu,
    hidePreviewMenu,
    handleNodeClick,
    setZoomLevel,
    setGraphViewMode,
    addCustomColor
  } = useUIStore();

  // === Refs ===
  const fgRef = useRef(null);
  const savePositionsTimerRef = useRef(null);

  // === 노드 추가 폼 상태 (로컬) ===
  const [addForm, setAddForm] = useState({ 
    title: '', 
    group: 2, 
    linkType: 'based-on', 
    connectTo: 'Core', 
    isCore: false, 
    isLocked: false 
  });

  // === IndexedDB 초기화 (Seed Notes) ===
  useEffect(() => {
    const initNotes = async () => {
      try {
        const { seedCore5 } = await import('./data/seedData');
        const data = seedCore5();
        if (data.detailedNotes) {
          await initializeSeedNotes(data.detailedNotes);
          console.log('📦 IndexedDB 초기화 완료 (Seed Notes)');
        }
      } catch (error) {
        console.error('IndexedDB 초기화 실패:', error);
      }
    };
    
    // localStorage에 데이터가 없을 때만 초기화
    if (!localStorage.getItem('graph-notes-v1')) {
      initNotes();
    }
  }, []);

  // === 노드 데이터에 tags 필드 확보 (마이그레이션) ===
  useEffect(() => {
    const needsMigration = graph.nodes.some(node => !node.tags || typeof node.tags !== 'object');
    
    if (needsMigration) {
      useGraphStore.getState().setGraph({
        ...graph,
        nodes: graph.nodes.map(ensureTagsField)
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // === 계층적 자동 배치 앵커 & 고정 좌표 적용 + 저장된 위치 복원 ===
  const hierarchicalAnchors = useMemo(() => 
    computeHierarchicalLayout(graph, lockedIds), 
    [graph, lockedIds]
  );

  // === 노드 위치 캐시 (성능 최적화) ===
  const nodePositionCache = useMemo(() => 
    buildNodePositionCache(graph.nodes, lockedIds, hierarchicalAnchors, savedNodePositions),
    [graph.nodes, lockedIds, hierarchicalAnchors, savedNodePositions]
  );

  const derivedData = useMemo(() => {
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = graph.links.map((l) => ({ 
      source: toId(l.source), 
      target: toId(l.target), 
      type: l.type 
    }));
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // 공간 해시 그리드 생성 (충돌 검사 최적화)
    const spatialGrid = new SpatialHashGrid(50);
    
    // 1단계: 이미 위치가 확정된 노드들을 그리드에 추가
    for (const n of nodes) {
      if (hasFixedPosition(n, lockedIds, savedNodePositions)) {
        const cachedPos = nodePositionCache.get(n.id);
        if (cachedPos) {
          spatialGrid.insert(cachedPos.x, cachedPos.y, n.id);
        }
      }
    }
    
    // 2단계: 각 노드에 위치 적용
    for (const n of nodes) {
      if (lockedIds.has(n.id)) { 
        // 계층적 자동 배치 고정 노드
        const a = hierarchicalAnchors.get(n.id); 
        n.fx = a?.x ?? 0; 
        n.fy = a?.y ?? 0;
        n.vx = 0;
        n.vy = 0;
      } else if (savedNodePositions[n.id]) {
        // 저장된 위치가 있는 노드
        n.x = savedNodePositions[n.id].x;
        n.y = savedNodePositions[n.id].y;
        n.fx = savedNodePositions[n.id].x;
        n.fy = savedNodePositions[n.id].y;
        n.vx = 0;
        n.vy = 0;
      } else if (n.x != null && n.y != null && n.fx != null && n.fy != null) {
        // 이미 위치가 확정된 노드 (재계산 스킵)
        continue;
      } else { 
        const parentLink = links.find(l => 
          toId(l.target) === n.id || toId(l.source) === n.id
        );
        
        if (parentLink) {
          const parentId = toId(parentLink.target) === n.id 
            ? toId(parentLink.source) 
            : toId(parentLink.target);
          
          const parentNode = nodeMap.get(parentId);
          
          if (parentNode) {
            // 최적화된 위치 계산 함수 사용 (공간 해시 그리드)
            const position = computeNewNodePosition(
              n,
              links,
              nodeMap,
              lockedIds,
              hierarchicalAnchors,
              savedNodePositions,
              spatialGrid
            );
            
            const finalX = position.x;
            const finalY = position.y;
            
            n.x = finalX;
            n.y = finalY;
            n.fx = finalX;
            n.fy = finalY;
            n.vx = 0;
            n.vy = 0;
          } else {
            if (n.x == null) n.x = 0;
            if (n.y == null) n.y = 0;
            n.fx = n.x;
            n.fy = n.y;
            n.vx = 0;
            n.vy = 0;
          }
        }
      }
    }
    
    return { nodes, links };
  }, [graph, lockedIds, hierarchicalAnchors, savedNodePositions, nodePositionCache]);

  // === 선택된 노트 ===
  const selectedNote = useMemo(() => 
    graph.nodes.find(n => n.id === selectedId) || null, 
    [graph, selectedId]
  );

  // === 노드 추가 핸들러 ===
  const handleAddNode = () => {
    const id = genId();
    const group = Number(addForm.group) || 2;
    
    let initialX = 0, initialY = 0;
    
    if (!addForm.isLocked) {
      const connectToId = addForm.connectTo || 'Core';
      
      let parentX = 0, parentY = 0;
      
      if (lockedIds.has(connectToId)) {
        const anchor = hierarchicalAnchors.get(connectToId);
        parentX = anchor?.x ?? 0;
        parentY = anchor?.y ?? 0;
      } else if (savedNodePositions[connectToId]) {
        parentX = savedNodePositions[connectToId].x;
        parentY = savedNodePositions[connectToId].y;
      } else {
        const parentNode = graph.nodes.find(n => n.id === connectToId);
        if (parentNode && parentNode.x != null && parentNode.y != null) {
          parentX = parentNode.x;
          parentY = parentNode.y;
        }
      }
      
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
        
        if (!hasCollision) {
          for (const [, anchor] of hierarchicalAnchors.entries()) {
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
          break;
        }
      }
      
      if (!foundValidPosition) {
        const fallbackDistance = maxDistance + 10;
        const angle = Math.random() * 2 * Math.PI;
        initialX = parentX + fallbackDistance * Math.cos(angle);
        initialY = parentY + fallbackDistance * Math.sin(angle);
      }
      
      // 즉시 위치 저장
      saveNodePosition(id, initialX, initialY);
    }
    
    const newNode = { 
      id, 
      group, 
      title: addForm.title || 'Untitled', 
      summary: '' 
    };
    
    const newLink = { 
      source: addForm.linkType === 'based-on' ? id : (addForm.connectTo || 'Core'), 
      target: addForm.linkType === 'based-on' ? (addForm.connectTo || 'Core') : id, 
      type: addForm.linkType 
    };
    
    addNodeToGraph(newNode, newLink);
    
    if (addForm.isLocked) {
      setLockedIds([...Array.from(lockedIds), id]);
    }
    
    closeAddNode();
  };

  // === 노드 드래그 종료 핸들러 ===
  const scheduleSavePositions = useCallback((node) => {
    if (savePositionsTimerRef.current) {
      clearTimeout(savePositionsTimerRef.current);
    }
    savePositionsTimerRef.current = setTimeout(() => {
      if (node.x != null && node.y != null) {
        saveNodePosition(node.id, node.x, node.y);
      }
    }, 400);
  }, [saveNodePosition]);

  const handleNodeDragEnd = useCallback((node) => {
    if (!node) return;
    
    if (node.x != null && node.y != null) {
      node.fx = node.x;
      node.fy = node.y;
      node.vx = 0;
      node.vy = 0;
    }
    
    if (lockedIds.has(node.id)) return;
    
    if (node.x != null && node.y != null) {
      scheduleSavePositions(node);
    }
  }, [scheduleSavePositions, lockedIds]);

  // === 키보드 단축키 ===
  useEffect(() => {
    const onEsc = (e) => { 
      if (e.key === 'Escape') { 
        setSelectedId(null); 
        hideContextMenu(); 
      } 
    };
    const onClick = () => hideContextMenu();
    
    window.addEventListener('keydown', onEsc);
    window.addEventListener('click', onClick);
    
    return () => { 
      window.removeEventListener('keydown', onEsc); 
      window.removeEventListener('click', onClick); 
    };
  }, [setSelectedId, hideContextMenu]);

  // === 줌/핏 키보드 단축키 ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        if (fgRef.current) {
          const currentZoom = fgRef.current.zoom();
          const newZoom = Math.min(currentZoom * 1.2, 4);
          fgRef.current.zoom(newZoom, 400);
          setZoomLevel(newZoom);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        if (fgRef.current) {
          const currentZoom = fgRef.current.zoom();
          const newZoom = Math.max(currentZoom / 1.2, 0.5);
          fgRef.current.zoom(newZoom, 400);
          setZoomLevel(newZoom);
        }
      }
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
  }, [setZoomLevel]);

  // === 컴포넌트 언마운트 시 타이머 정리 ===
  useEffect(() => {
    return () => {
      if (savePositionsTimerRef.current) {
        clearTimeout(savePositionsTimerRef.current);
      }
    };
  }, []);

  // === 로컬 캐시 삭제 ===
  const handleClearLocal = () => { 
    if (storageMode === 'local') { 
      clearStorage(); 
      alert('Local cache cleared. Reload to see initial seed.'); 
    } 
  };

  /******************** 렌더 ********************/
  return (
    <div className="w-full h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* 그래프 영역 */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          right: notePanelOpen ? `${panelWidth}px` : '0'
        }}
      >
        <GraphContainer
          fgRef={fgRef}
          derivedData={derivedData}
          nodeStyles={nodeStyles}
          lockedIds={lockedIds}
          selectedId={selectedId}
          onShowContextMenu={(x, y, nodeId) => {
            useUIStore.getState().showContextMenu(x, y, nodeId);
          }}
          onHideContextMenu={hideContextMenu}
          onNodeClickWithPosition={handleNodeClick}
          closePreviewMenu={hidePreviewMenu}
          onZoomChange={setZoomLevel}
          onNodeDragEnd={handleNodeDragEnd}
        >
          {/* 그래프 컨트롤 */}
          <GraphControls
            fgRef={fgRef}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            graphViewMode={graphViewMode}
            onViewModeChange={setGraphViewMode}
            onOpenSettings={openSettings}
            onOpenAddNode={openAddNode}
          />

          {/* 노드 미리보기 메뉴 */}
          {!notePanelOpen && (
            <NodePreviewMenu
              selectedNote={selectedNote}
              position={previewMenu}
              containerSize={{ width: window.innerWidth, height: window.innerHeight }}
              onClose={() => {
                setSelectedId(null);
                hidePreviewMenu();
              }}
              onOpenNote={openNotePanel}
            />
          )}

          {/* 컨텍스트 메뉴 */}
          <ContextMenu
            visible={contextMenu.visible}
            x={contextMenu.x}
            y={contextMenu.y}
            nodeId={contextMenu.nodeId}
            nodeStyles={nodeStyles}
            setStyle={setNodeStyle}
            lockedIds={lockedIds}
            toggleLock={toggleLock}
            onClose={hideContextMenu}
            customColorHistory={customColorHistory}
            addCustomColor={addCustomColor}
          />
        </GraphContainer>
      </div>

      {/* 우측 노트 패널 */}
      <NotePanel
        selectedNote={selectedNote}
        onClose={closeNotePanel}
        onChange={updateNode}
        isOpen={notePanelOpen}
        panelWidth={panelWidth}
        setPanelWidth={setPanelWidth}
        tagsIndex={tagsIndex}
      />

      {/* 설정 모달 */}
      <SettingsModal 
        open={showSettings} 
        onClose={closeSettings} 
        storageMode={storageMode} 
        setStorageMode={setStorageMode} 
        clearLocal={handleClearLocal} 
      />

      {/* 노드 추가 모달 */}
      <AddNodeModal 
        open={showAddNode} 
        onClose={closeAddNode} 
        graph={graph} 
        addNode={handleAddNode} 
        form={addForm} 
        setForm={setAddForm} 
      />

      {/* 기본 무결성 점검 */}
      <RuntimeAsserts data={derivedData} />
    </div>
  );
}
