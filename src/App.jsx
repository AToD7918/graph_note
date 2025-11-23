import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { toId, genId } from './utils/helpers';
import { initializeSeedNotes } from './adapters/noteStorage';
import { ensureTagsField } from './utils/tagHelpers';
import { findValidPositionForNewNode, getParentPosition } from './utils/nodePositionCalculator';
import { POSITION_SAVE, ZOOM } from './constants/ui';
import { useGraphStore } from './store/graphStore';
import { useUIStore } from './store/uiStore';
import { GraphContainer } from './components/GraphContainer';
import { GraphControls } from './components/GraphControls';
import { NodePreviewMenu } from './components/NodePreviewMenu';
import { NotePanel } from './components/NotePanel/NotePanel';
import { SettingsModal } from './components/SettingsModal';
import { AddNodeModal } from './components/AddNodeModal';
import { ContextMenu } from './components/contextMenu';
import { LinkPreviewMenu } from './components/LinkPreviewMenu';

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
    savedNodePositions,
    tagsIndex,
    updateNode,
    addNode: addNodeToGraph,
    setNodeStyle,
    saveNodePosition,
    clearStorage,
    setStorageMode,
    storageMode,
    addLink,
    updateLink,
    deleteLink
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
    linkCreationMode,
    sourceLinkNode,
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
    addCustomColor,
    startLinkCreation,
    cancelLinkCreation
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
    isCore: false
  });

  // === 링크 프리뷰 메뉴 상태 ===
  const [linkPreviewMenu, setLinkPreviewMenu] = useState({ visible: false, x: 0, y: 0 });
  const [selectedLink, setSelectedLink] = useState(null);

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



  const derivedData = useMemo(() => {
    const nodes = graph.nodes.map((n) => ({ ...n }));
    const links = graph.links.map((l) => ({ 
      source: toId(l.source), 
      target: toId(l.target), 
      type: l.type 
    }));
    
    // 저장된 위치 적용 (savedNodePositions는 의존성에서 제외됨)
    // 초기 로드 시 위치가 적용되고, 이후 드래그로 변경된 위치는
    // ForceGraph2D 내부에서 노드 객체에 직접 유지됨
    for (const n of nodes) {
      if (savedNodePositions[n.id]) {
        n.x = savedNodePositions[n.id].x;
        n.y = savedNodePositions[n.id].y;
        n.fx = savedNodePositions[n.id].x;
        n.fy = savedNodePositions[n.id].y;
        n.vx = 0;
        n.vy = 0;
      }
    }
    
    return { nodes, links };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]); // savedNodePositions 의존성 제거 (깜빡임 방지)

  // === 선택된 노트 ===
  const selectedNote = useMemo(() => 
    graph.nodes.find(n => n.id === selectedId) || null, 
    [graph, selectedId]
  );

  // === 노드 추가 핸들러 ===
  const handleAddNode = useCallback(() => {
    const id = genId();
    const group = Number(addForm.group) || 2;
    
    // 부모 노드 위치 가져오기
    const connectToId = addForm.connectTo || 'Core';
    const parentPosition = getParentPosition(connectToId, savedNodePositions, graph.nodes);
    
    // 유효한 위치 찾기
    const position = findValidPositionForNewNode({
      parentX: parentPosition.x,
      parentY: parentPosition.y,
      existingPositions: savedNodePositions,
    });
    
    // 위치 저장
    saveNodePosition(id, position.x, position.y);
    
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
    closeAddNode();
  }, [addForm, savedNodePositions, graph.nodes, saveNodePosition, addNodeToGraph, closeAddNode]);

  // === 노드 드래그 종료 핸들러 ===
  const scheduleSavePositions = useCallback((node) => {
    if (savePositionsTimerRef.current) {
      clearTimeout(savePositionsTimerRef.current);
    }
    savePositionsTimerRef.current = setTimeout(() => {
      if (node.x != null && node.y != null) {
        saveNodePosition(node.id, node.x, node.y);
      }
    }, POSITION_SAVE.DEBOUNCE_DELAY);
  }, [saveNodePosition]);

  const handleNodeDragEnd = useCallback((node) => {
    if (!node) return;
    
    if (node.x != null && node.y != null) {
      // 위치 저장 (디바운스 적용)
      scheduleSavePositions(node);
      
      // 다음 프레임에 고정 설정 (즉시 재드래그 가능하도록)
      requestAnimationFrame(() => {
        if (node.x != null && node.y != null) {
          node.fx = node.x;
          node.fy = node.y;
          node.vx = 0;
          node.vy = 0;
        }
      });
    }
  }, [scheduleSavePositions]);

  // === 키보드 단축키 ===
  useEffect(() => {
    const onEsc = (e) => { 
      if (e.key === 'Escape') {
        // 링크 프리뷰가 열려있으면 닫기
        if (linkPreviewMenu.visible) {
          setLinkPreviewMenu({ visible: false, x: 0, y: 0 });
          setSelectedLink(null);
        } else if (notePanelOpen) {
          // 노트패널이 열려있으면 닫기 (Close 버튼과 동일한 동작)
          closeNotePanel();
        } else {
          setSelectedId(null); 
          hideContextMenu();
        }
      } 
    };
    
    const onDelete = (e) => {
      if (e.key === 'Delete' && linkPreviewMenu.visible && selectedLink) {
        // 인라인으로 링크 삭제 처리
        const sourceId = typeof selectedLink.source === 'object' ? selectedLink.source.id : selectedLink.source;
        const targetId = typeof selectedLink.target === 'object' ? selectedLink.target.id : selectedLink.target;
        
        const sourceNode = graph.nodes.find(n => n.id === sourceId);
        const targetNode = graph.nodes.find(n => n.id === targetId);
        
        if (window.confirm(`"${sourceNode?.title}" → "${targetNode?.title}" 링크를 삭제하시겠습니까?`)) {
          deleteLink(sourceId, targetId);
          setLinkPreviewMenu({ visible: false, x: 0, y: 0 });
          setSelectedLink(null);
        }
      }
    };
    
    const onClick = () => hideContextMenu();
    
    window.addEventListener('keydown', onEsc);
    window.addEventListener('keydown', onDelete);
    window.addEventListener('click', onClick);
    
    return () => { 
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('keydown', onDelete);
      window.removeEventListener('click', onClick); 
    };
  }, [setSelectedId, hideContextMenu, linkPreviewMenu.visible, selectedLink, graph.nodes, deleteLink, notePanelOpen, closeNotePanel]);

  // === 줌/핏 키보드 단축키 ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        if (fgRef.current) {
          const currentZoom = fgRef.current.zoom();
          const newZoom = Math.min(currentZoom * ZOOM.STEP, ZOOM.MAX);
          fgRef.current.zoom(newZoom, ZOOM.FIT_DURATION);
          setZoomLevel(newZoom);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        if (fgRef.current) {
          const currentZoom = fgRef.current.zoom();
          const newZoom = Math.max(currentZoom / ZOOM.STEP, ZOOM.MIN);
          fgRef.current.zoom(newZoom, ZOOM.FIT_DURATION);
          setZoomLevel(newZoom);
        }
      }
      if (e.key === ' ' && !e.target.closest('textarea') && !e.target.closest('input')) {
        e.preventDefault();
        if (fgRef.current) {
          fgRef.current.zoomToFit(ZOOM.FIT_DURATION, ZOOM.FIT_PADDING);
          setTimeout(() => {
            const newZoom = fgRef.current.zoom();
            setZoomLevel(newZoom);
          }, ZOOM.FIT_DURATION + 50);
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
  const handleClearLocal = useCallback(() => { 
    if (storageMode === 'local') { 
      clearStorage(); 
      alert('Local cache cleared. Reload to see initial seed.'); 
    } 
  }, [storageMode, clearStorage]);

  // === 컨텍스트 메뉴 핸들러 ===
  const handleShowContextMenu = useCallback((x, y, nodeId) => {
    useUIStore.getState().showContextMenu(x, y, nodeId);
  }, []);

  // === 링크 생성 핸들러 (모달 없이 즉시 생성) ===
  const handleNodeClickWithShift = useCallback((nodeId, x, y, shiftKey) => {
    if (shiftKey) {
      // Shift 키가 눌린 상태
      if (!linkCreationMode) {
        // 링크 생성 모드 시작 (첫 번째 클릭)
        startLinkCreation(nodeId);
      } else {
        // 링크 생성 모드 진행 중 (두 번째 클릭)
        if (nodeId === sourceLinkNode) {
          // 같은 노드 클릭 시 취소
          cancelLinkCreation();
        } else {
          // 다른 노드 클릭 시 즉시 based-on 링크 생성
          const success = addLink(sourceLinkNode, nodeId, 'based-on', '');
          if (success) {
            cancelLinkCreation();
          } else {
            alert('이미 존재하는 링크입니다.');
            cancelLinkCreation();
          }
        }
      }
    } else {
      // Shift 키가 없으면 기본 동작
      if (linkCreationMode) {
        // 링크 생성 모드 취소
        cancelLinkCreation();
      }
      handleNodeClick(nodeId, x, y);
    }
  }, [linkCreationMode, sourceLinkNode, startLinkCreation, cancelLinkCreation, handleNodeClick, addLink]);

  // === Shift 키 해제 감지 ===
  useEffect(() => {
    const handleKeyUp = (e) => {
      if (e.key === 'Shift' && linkCreationMode) {
        cancelLinkCreation();
      }
    };
    
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [linkCreationMode, cancelLinkCreation]);

  // === 링크 클릭/우클릭 핸들러 ===
  useEffect(() => {
    // 링크 우클릭 핸들러 (프리뷰 메뉴 표시)
    window.onLinkRightClickHandler = (link, evt) => {
      const x = evt?.clientX ?? 0;
      const y = evt?.clientY ?? 0;
      setSelectedLink(link);
      setLinkPreviewMenu({ visible: true, x, y });
    };

    // 링크 클릭 핸들러 (프리뷰 메뉴 표시)
    window.onLinkClickHandler = (link, evt) => {
      const x = evt?.clientX ?? 0;
      const y = evt?.clientY ?? 0;
      setSelectedLink(link);
      setLinkPreviewMenu({ visible: true, x, y });
    };

    return () => {
      window.onLinkRightClickHandler = null;
      window.onLinkClickHandler = null;
    };
  }, []);

  // === 링크 저장 핸들러 ===
  const handleSaveLink = useCallback((sourceId, targetId, description) => {
    updateLink(sourceId, targetId, { description });
  }, [updateLink]);

  // === 링크 삭제 핸들러 ===
  const handleDeleteLink = useCallback(() => {
    if (!selectedLink) return;
    
    const sourceId = typeof selectedLink.source === 'object' ? selectedLink.source.id : selectedLink.source;
    const targetId = typeof selectedLink.target === 'object' ? selectedLink.target.id : selectedLink.target;
    
    const sourceNode = graph.nodes.find(n => n.id === sourceId);
    const targetNode = graph.nodes.find(n => n.id === targetId);
    
    if (window.confirm(`"${sourceNode?.title}" → "${targetNode?.title}" 링크를 삭제하시겠습니까?`)) {
      deleteLink(sourceId, targetId);
      setLinkPreviewMenu({ visible: false, x: 0, y: 0 });
      setSelectedLink(null);
    }
  }, [selectedLink, deleteLink, graph.nodes]);

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
          selectedId={linkCreationMode ? sourceLinkNode : selectedId}
          onShowContextMenu={handleShowContextMenu}
          onHideContextMenu={hideContextMenu}
          onNodeClickWithPosition={handleNodeClickWithShift}
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

      {/* 링크 프리뷰 메뉴 */}
      {linkPreviewMenu.visible && (
        <LinkPreviewMenu
          link={selectedLink}
          position={linkPreviewMenu}
          containerSize={{ width: window.innerWidth, height: window.innerHeight }}
          onClose={() => {
            setLinkPreviewMenu({ visible: false, x: 0, y: 0 });
            setSelectedLink(null);
          }}
          onSave={handleSaveLink}
          onDelete={handleDeleteLink}
          sourceNodeTitle={(() => {
            if (!selectedLink) return '';
            const sourceId = typeof selectedLink.source === 'object' ? selectedLink.source.id : selectedLink.source;
            return graph.nodes.find(n => n.id === sourceId)?.title || '';
          })()}
          targetNodeTitle={(() => {
            if (!selectedLink) return '';
            const targetId = typeof selectedLink.target === 'object' ? selectedLink.target.id : selectedLink.target;
            return graph.nodes.find(n => n.id === targetId)?.title || '';
          })()}
        />
      )}

      {/* 링크 생성 모드 UI 표시 */}
      {linkCreationMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm font-medium">
            링크 생성 모드: "{graph.nodes.find(n => n.id === sourceLinkNode)?.title}" 선택됨
          </p>
          <p className="text-xs mt-1 opacity-90">
            다른 노드를 Shift+클릭하여 링크를 생성하세요. ESC로 취소
          </p>
        </div>
      )}

      {/* 기본 무결성 점검 */}
      <RuntimeAsserts data={derivedData} />
    </div>
  );
}
