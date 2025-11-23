import React, { useRef, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useMeasure } from '../hooks/useMeasure';
import { makeNodeCanvasObject, makeNodePointerAreaPaint, defaultLinkColor, makeCurvatureAccessor } from '../graph/renderers';
import { FORCE_GRAPH, NODE_DRAG, GRAPH_CONTAINER } from '../constants/ui';

/**
 * 그래프 뷰 컴포넌트 (기존 GraphView)
 * Canvas 기반 Force-Directed 그래프 렌더링
 * 
 * 성능 최적화:
 * - React.memo로 불필요한 리렌더링 방지
 * - useMemo로 렌더링 함수 캐싱
 * - useCallback으로 이벤트 핸들러 안정화
 */
const GraphView = React.memo(function GraphView({
  containerRef,
  size,
  fgRef,
  derivedData,
  nodeStyles,
  selectedId,
  onShowContextMenu,
  onHideContextMenu,
  onNodeClickWithPosition,
  closePreviewMenu,
  onZoomChange,
  onNodeDragEnd,
}) {
  const onNodeHover = (n) => { 
    const el = containerRef.current; 
    if (!el) return; 
    el.style.cursor = n ? GRAPH_CONTAINER.CURSOR_POINTER : GRAPH_CONTAINER.CURSOR_DEFAULT; 
  };
  
  const handleDragEnd = useCallback((node) => {
    if (onNodeDragEnd) {
      onNodeDragEnd(node);
    }
  }, [onNodeDragEnd]);

  const onNodeClick = (node, evt) => { 
    if (!node) return;
    
    // Shift 키 감지하여 링크 생성 모드 처리는 상위 컴포넌트에서 수행
    const rect = containerRef.current?.getBoundingClientRect();
    const x = (evt?.clientX ?? 0) - (rect?.left ?? 0);
    const y = (evt?.clientY ?? 0) - (rect?.top ?? 0);
    
    // Shift 키 정보를 포함하여 이벤트 전달
    onNodeClickWithPosition(node.id, x, y, evt?.shiftKey ?? false);
    onHideContextMenu(); 
  };

  const onNodeRightClick = (node, evt) => {
    evt?.preventDefault?.();
    const rect = containerRef.current?.getBoundingClientRect();
    const x=(evt?.clientX??0)-(rect?.left??0); 
    const y=(evt?.clientY??0)-(rect?.top??0);
    onShowContextMenu(x, y, node.id);
    closePreviewMenu();
  };

  const onBackgroundClick = () => {
    requestAnimationFrame(() => {
      closePreviewMenu();
      onHideContextMenu();
    });
  };

  const onZoom = () => {
    requestAnimationFrame(() => {
      closePreviewMenu();
      onHideContextMenu();
      
      if (fgRef.current && onZoomChange) {
        const currentZoom = fgRef.current.zoom();
        onZoomChange(currentZoom);
      }
    });
  };

  const nodeCanvasObject = React.useMemo(() => 
    makeNodeCanvasObject(nodeStyles, selectedId), 
    [nodeStyles, selectedId]
  );
  
  const nodePointerAreaPaint = React.useMemo(() => 
    makeNodePointerAreaPaint(nodeStyles), 
    [nodeStyles]
  );
  
  const linkCurvature = React.useMemo(() => 
    makeCurvatureAccessor(derivedData), 
    [derivedData]
  );

  const fit = useCallback(() => { 
    if (fgRef.current) fgRef.current.zoomToFit(600, 40); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 초기 로딩 시에만 fit 호출 (크기 변경 시에는 호출하지 않음)
  const initialFitDone = useRef(false);
  
  useEffect(() => { 
    if (size.width && size.height && !initialFitDone.current) {
      const timer = setTimeout(() => {
        fit();
        initialFitDone.current = true;
      }, 0);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);

  const onNodeDragRef = useRef(null);
  
  const onNodeDrag = useCallback((node) => {
    if (!fgRef.current || !containerRef.current) return;
    
    // 드래그 시작 시 고정 해제 (자유롭게 움직이도록)
    if (node && (node.fx != null || node.fy != null)) {
      node.fx = null;
      node.fy = null;
      node.vx = 0;
      node.vy = 0;
    }
    
    const padding = NODE_DRAG.PADDING;
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    const screenCoords = fgRef.current.graph2ScreenCoords(node.x, node.y);
    const isOutOfBounds = 
      screenCoords.x < padding || 
      screenCoords.x > width - padding || 
      screenCoords.y < padding || 
      screenCoords.y > height - padding;
    
    if (isOutOfBounds) {
      const now = Date.now();
      if (onNodeDragRef.current && now - onNodeDragRef.current < NODE_DRAG.AUTO_ZOOM_THRESHOLD) return;
      onNodeDragRef.current = now;
      
      const currentZoom = fgRef.current.zoom();
      const newZoom = currentZoom * NODE_DRAG.AUTO_ZOOM_SCALE;
      
      fgRef.current.zoom(newZoom, 100);
    }
  }, [fgRef, containerRef]);

  const displayWidth = size.width || window.innerWidth;
  const displayHeight = size.height || window.innerHeight;

  return (
    <ForceGraph2D
      ref={fgRef}
      width={displayWidth}
      height={displayHeight}
      graphData={derivedData}
      nodeRelSize={FORCE_GRAPH.NODE_REL_SIZE}
      backgroundColor={FORCE_GRAPH.BACKGROUND_COLOR}
      linkColor={defaultLinkColor}
      linkDirectionalArrowLength={FORCE_GRAPH.ARROW_LENGTH}
      linkDirectionalArrowRelPos={FORCE_GRAPH.ARROW_REL_POS}
      linkCurvature={linkCurvature}
      cooldownTicks={FORCE_GRAPH.COOLDOWN_TICKS}
      d3AlphaDecay={FORCE_GRAPH.D3_ALPHA_DECAY}
      d3VelocityDecay={FORCE_GRAPH.D3_VELOCITY_DECAY}
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
      onLinkClick={(link, evt) => {
        // 링크 클릭 핸들러 - 상위 컴포넌트로 전달
        if (window.onLinkClickHandler) {
          window.onLinkClickHandler(link, evt);
        }
      }}
      onLinkRightClick={(link, evt) => {
        // 링크 우클릭 핸들러 - 상위 컴포넌트로 전달
        evt?.preventDefault?.();
        if (window.onLinkRightClickHandler) {
          window.onLinkRightClickHandler(link, evt);
        }
      }}
    />
  );
});

/**
 * 그래프 컨테이너
 * GraphView + 관련 UI 요소들을 하나로 묶음
 * 
 * 성능 최적화:
 * - React.memo로 불필요한 리렌더링 방지
 * - children 패턴으로 UI 요소 조합
 */
export const GraphContainer = React.memo(function GraphContainer({
  fgRef,
  derivedData,
  nodeStyles,
  selectedId,
  onShowContextMenu,
  onHideContextMenu,
  onNodeClickWithPosition,
  closePreviewMenu,
  onZoomChange,
  onNodeDragEnd,
  children // 추가 UI 요소들 (Controls, Menus 등)
}) {
  const [containerRef, size] = useMeasure();

  useEffect(() => { 
    const el = containerRef.current; 
    if (!el) return; 
    const h = (e) => e.preventDefault(); 
    el.addEventListener('contextmenu', h); 
    return () => el.removeEventListener('contextmenu', h); 
  }, [containerRef]);

  return (
    <div ref={containerRef} className="graph-container">
      <GraphView
        containerRef={containerRef}
        size={size}
        fgRef={fgRef}
        derivedData={derivedData}
        nodeStyles={nodeStyles}
        selectedId={selectedId}
        onShowContextMenu={onShowContextMenu}
        onHideContextMenu={onHideContextMenu}
        onNodeClickWithPosition={onNodeClickWithPosition}
        closePreviewMenu={closePreviewMenu}
        onZoomChange={onZoomChange}
        onNodeDragEnd={onNodeDragEnd}
      />
      {children}
    </div>
  );
});
