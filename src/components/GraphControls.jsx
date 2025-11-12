import React from 'react';
import { ZoomControls } from './ZoomControls';
import { GraphViewSelector } from './GraphViewSelector';

/**
 * 그래프 컨트롤 버튼 모음
 * 
 * 포함 요소:
 * - GraphViewSelector (우측 상단)
 * - ZoomControls (좌측 하단 위)
 * - Settings 버튼 (좌하단)
 * - Add Node 버튼 (우하단)
 */
export function GraphControls({ 
  fgRef, 
  zoomLevel, 
  onZoomChange,
  graphViewMode,
  onViewModeChange,
  onOpenSettings,
  onOpenAddNode
}) {
  return (
    <>
      {/* Graph View Selector - 그래프 우측 상단 */}
      <GraphViewSelector 
        currentView={graphViewMode}
        onViewChange={onViewModeChange}
      />

      {/* Zoom Controls - 좌측 하단 위 */}
      <ZoomControls 
        fgRef={fgRef} 
        zoom={zoomLevel}
        onZoomChange={onZoomChange}
      />

      {/* 좌하단: 설정 버튼 */}
      <button 
        className="btn-circular btn-settings"
        onClick={onOpenSettings} 
        title="Settings"
      >
        ⚙️
      </button>

      {/* 우하단: 노드 추가 버튼 */}
      <button 
        className="btn-circular btn-add-node"
        onClick={onOpenAddNode} 
        title="Add node"
      >
        +
      </button>
    </>
  );
}
