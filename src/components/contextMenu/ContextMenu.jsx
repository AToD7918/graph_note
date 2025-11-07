import React, { useState } from 'react';
import { ColorPalette } from './ColorPalette';
import { ColorPicker } from './ColorPicker';

/**
 * ?? 컨텍스트 메뉴 컴포넌트
 * 
 * ? 역할:
 * - 노드 우클릭 시 표시되는 스타일 편집 메뉴
 * - Shape, Size, Color, Lock 상태 등 편집
 * 
 * ? Props:
 * @param {boolean} visible - 메뉴 표시 여부
 * @param {number} x - 메뉴 X 좌표
 * @param {number} y - 메뉴 Y 좌표
 * @param {string} nodeId - 선택된 노드 ID
 * @param {Object} nodeStyles - 노드 스타일 맵 { [nodeId]: { shape, size, color, ... } }
 * @param {Function} setStyle - 스타일 설정 함수 (nodeId, styleObj) => void
 * @param {Set} lockedIds - 고정된 노드 ID Set
 * @param {Function} toggleLock - 노드 고정 토글 함수
 * @param {Function} onClose - 메뉴 닫기 핸들러
 * @param {Array<string>} customColorHistory - 커스텀 색상 히스토리
 * @param {Function} addCustomColor - 커스텀 색상 추가 함수
 */
export function ContextMenu({ 
  visible, 
  x, 
  y, 
  nodeId, 
  nodeStyles, 
  setStyle, 
  lockedIds, 
  toggleLock, 
  onClose, 
  customColorHistory, 
  addCustomColor 
}) {
  const current = nodeStyles[nodeId] || { shape: 'circle', size: 'm', color: null, labelPinned: false, glow: false };
  const [showColorInput, setShowColorInput] = useState(false);
  
  if (!visible || !nodeId) return null;
  
  // 색상 선택 핸들러
  const handleColorSelect = (color) => {
    setStyle(nodeId, { color });
    onClose();
  };
  
  // 색상 리셋 핸들러
  const handleResetColor = () => {
    setStyle(nodeId, { color: null });
    onClose();
  };
  
  // 커스텀 색상 적용 핸들러
  const handleApplyCustomColor = (color) => {
    addCustomColor(color);
    setStyle(nodeId, { color });
    setShowColorInput(false);
    onClose();
  };
  
  return (
    <div 
      className="context-menu"
      style={{ left: x, top: y }} 
      onClick={(e)=>e.stopPropagation()}
    >
      {/* 노드 ID 표시 */}
      <div className="text-xs uppercase opacity-70 px-1 pb-2">
        Node: {nodeId}
      </div>
      
      {/* Lock/Unlock 버튼 */}
      <button 
        className="w-full text-left px-2 py-1 rounded-lg hover:bg-white/10" 
        onClick={()=>{ toggleLock(nodeId); onClose(); }}
      >
        {lockedIds.has(nodeId) ? 'Switch to Force (unlock)' : 'Switch to Radial (lock)'}
      </button>
      
      <div className="h-px my-2 bg-white/10" />
      
      {/* Shape 선택 */}
      <div className="px-1 text-xs opacity-70">Shape</div>
      <div className="flex gap-2 px-1 mt-1">
        <button 
          className={`flex-1 px-2 py-1 rounded-lg ${
            current.shape === 'circle' ? 'bg-white/10' : ''
          } hover:bg-white/10`} 
          onClick={()=>{ setStyle(nodeId, { shape: 'circle' }); onClose(); }}
        >
          Circle
        </button>
        <button 
          className={`flex-1 px-2 py-1 rounded-lg ${
            current.shape === 'square' ? 'bg-white/10' : ''
          } hover:bg-white/10`} 
          onClick={()=>{ setStyle(nodeId, { shape: 'square' }); onClose(); }}
        >
          Square
        </button>
      </div>
      
      {/* Size 선택 */}
      <div className="px-1 text-xs opacity-70 mt-2">Size</div>
      <div className="flex gap-2 px-1 mt-1">
        {['s', 'm', 'l'].map(sz => (
          <button 
            key={sz} 
            className={`flex-1 px-2 py-1 rounded-lg ${
              (current.size || 'm') === sz ? 'bg-white/10' : ''
            } hover:bg-white/10`} 
            onClick={()=>{ setStyle(nodeId, { size: sz }); onClose(); }}
          >
            {sz.toUpperCase()}
          </button>
        ))}
      </div>
      
      {/* 색상 팔레트 */}
      <ColorPalette
        currentColor={current.color}
        customColorHistory={customColorHistory}
        onColorSelect={handleColorSelect}
        onResetColor={handleResetColor}
      />
      
      {/* 커스텀 색상 선택기 */}
      <div className="px-1 mt-2">
        {!showColorInput ? (
          <button 
            className="w-full px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 text-xs flex items-center justify-center gap-2 transition-colors"
            onClick={()=>setShowColorInput(true)}
          >
            <span>?</span>
            <span>Custom Color</span>
          </button>
        ) : (
          <ColorPicker
            onApply={handleApplyCustomColor}
            onCancel={()=>setShowColorInput(false)}
          />
        )}
      </div>
      
      {/* 추가 옵션 */}
      <div className="flex items-center gap-2 px-1 mt-3">
        <label className="flex items-center gap-2 text-sm">
          <input 
            type="checkbox" 
            checked={!!current.labelPinned} 
            onChange={(e)=>setStyle(nodeId, { labelPinned: e.target.checked })} 
          />
          Pin label
        </label>
        <label className="flex items-center gap-2 text-sm ml-2">
          <input 
            type="checkbox" 
            checked={!!current.glow} 
            onChange={(e)=>setStyle(nodeId, { glow: e.target.checked })} 
          />
          Emphasis glow
        </label>
      </div>
    </div>
  );
}
