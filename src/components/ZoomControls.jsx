import React from 'react';

/**
 * Zoom Controls Component
 * 
 * Features:
 * - Zoom In/Out buttons
 * - Current zoom level display
 * - Fit to screen button
 */
export function ZoomControls({ fgRef, zoom, onZoomChange }) {
  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      const newZoom = Math.min(currentZoom * 1.2, 4);
      fgRef.current.zoom(newZoom, 400);
      onZoomChange(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      const newZoom = Math.max(currentZoom / 1.2, 0.5);
      fgRef.current.zoom(newZoom, 400);
      onZoomChange(newZoom);
    }
  };

  const handleFitToScreen = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 40);
      // Get zoom level after fit
      setTimeout(() => {
        const newZoom = fgRef.current.zoom();
        onZoomChange(newZoom);
      }, 450);
    }
  };

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="zoom-controls">
      <button 
        className="zoom-btn"
        onClick={handleZoomIn}
        title="Zoom In (Ctrl + +)"
      >
        +
      </button>
      
      <div className="zoom-level">
        {zoomPercentage}%
      </div>
      
      <button 
        className="zoom-btn"
        onClick={handleZoomOut}
        title="Zoom Out (Ctrl + -)"
      >
        -
      </button>
      
      <div className="h-px bg-white/10 my-1"></div>
      
      <button 
        className="zoom-btn"
        onClick={handleFitToScreen}
        title="Fit to Screen (Space)"
      >
        ?
      </button>
    </div>
  );
}
