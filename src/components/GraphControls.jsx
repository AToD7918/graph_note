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
 * 
 * @param {Object} props
 * @param {React.RefObject<any>} props.fgRef - ForceGraph2D ref
 * @param {number} props.zoomLevel - 현재 줌 레벨
 * @param {function(number): void} props.onZoomChange - 줄 변경 핸들러
 * @param {string} props.graphViewMode - 그래프 뷰 모드
 * @param {function(string): void} props.onViewModeChange - 뷰 모드 변경 핸들러
 * @param {function(): void} props.onOpenSettings - 설정 열기
 * @param {function(): void} props.onOpenAddNode - 노드 추가 모달 열기
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
