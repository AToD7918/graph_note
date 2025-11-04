import React, { useEffect, useRef, useState } from 'react';

/**
 * Minimap Component
 * 
 * Features:
 * - Overview of entire graph
 * - Current viewport indicator
 * - Click to navigate
 */
export function Minimap({ fgRef, graph, size, notePanelOpen }) {
  const canvasRef = useRef(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 100, height: 100 });

  // Update minimap when graph changes
  useEffect(() => {
    if (!canvasRef.current || !graph.nodes.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    graph.nodes.forEach(node => {
      const x = node.x || 0;
      const y = node.y || 0;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    const graphWidth = maxX - minX || 1000;
    const graphHeight = maxY - minY || 1000;
    const scale = Math.min(width / graphWidth, height / graphHeight) * 0.8;
    const offsetX = (width - graphWidth * scale) / 2;
    const offsetY = (height - graphHeight * scale) / 2;

    // Draw links
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    graph.links.forEach(link => {
      const source = graph.nodes.find(n => n.id === (link.source.id || link.source));
      const target = graph.nodes.find(n => n.id === (link.target.id || link.target));
      
      if (source && target) {
        const x1 = ((source.x || 0) - minX) * scale + offsetX;
        const y1 = ((source.y || 0) - minY) * scale + offsetY;
        const x2 = ((target.x || 0) - minX) * scale + offsetX;
        const y2 = ((target.y || 0) - minY) * scale + offsetY;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    // Draw nodes
    graph.nodes.forEach(node => {
      const x = ((node.x || 0) - minX) * scale + offsetX;
      const y = ((node.y || 0) - minY) * scale + offsetY;
      
      // Node color based on group
      let color;
      switch(node.group) {
        case 1: color = '#22d3ee'; break; // Core - cyan
        case 2: color = '#34d399'; break; // Forward - green
        case 3: color = '#a78bfa'; break; // Backward - purple
        default: color = '#64748b';
      }
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Update viewport indicator
    if (fgRef.current) {
      const zoom = fgRef.current.zoom();
      const centerPos = fgRef.current.centerAt();
      
      if (centerPos) {
        const viewWidth = (size.width / zoom) * scale;
        const viewHeight = (size.height / zoom) * scale;
        const viewX = ((centerPos.x || 0) - minX) * scale + offsetX - viewWidth / 2;
        const viewY = ((centerPos.y || 0) - minY) * scale + offsetY - viewHeight / 2;
        
        setViewport({
          x: Math.max(0, Math.min(viewX, width - viewWidth)),
          y: Math.max(0, Math.min(viewY, height - viewHeight)),
          width: Math.min(viewWidth, width),
          height: Math.min(viewHeight, height)
        });
      }
    }
  }, [graph, fgRef, size]);

  // Handle minimap click
  const handleMinimapClick = (e) => {
    if (!fgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate graph bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    graph.nodes.forEach(node => {
      const x = node.x || 0;
      const y = node.y || 0;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    const graphWidth = maxX - minX || 1000;
    const graphHeight = maxY - minY || 1000;
    const scale = Math.min(canvas.width / graphWidth, canvas.height / graphHeight) * 0.8;
    const offsetX = (canvas.width - graphWidth * scale) / 2;
    const offsetY = (canvas.height - graphHeight * scale) / 2;

    // Convert click position to graph coordinates
    const graphX = (clickX - offsetX) / scale + minX;
    const graphY = (clickY - offsetY) / scale + minY;

    // Center graph at clicked position
    fgRef.current.centerAt(graphX, graphY, 400);
  };

  return (
    <div 
      className="minimap-container"
      style={{
        right: notePanelOpen ? 'calc(max(360px, 40vw) + 1rem)' : '1rem'
      }}
    >
      <canvas 
        ref={canvasRef}
        width={200}
        height={150}
        onClick={handleMinimapClick}
        style={{ cursor: 'pointer' }}
      />
      <div 
        className="minimap-viewport"
        style={{
          left: `${viewport.x}px`,
          top: `${viewport.y}px`,
          width: `${viewport.width}px`,
          height: `${viewport.height}px`
        }}
      />
      <div className="absolute bottom-1 right-2 text-xs opacity-50">
        Map
      </div>
    </div>
  );
}
