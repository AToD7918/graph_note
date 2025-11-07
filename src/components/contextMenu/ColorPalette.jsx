import React from 'react';

/**
 * ? 색상 팔레트 컴포넌트
 * 
 * ? 역할:
 * - 기본 색상 팔레트 (8개)
 * - 커스텀 색상 히스토리 (최대 8개)
 * - 색상 선택 및 적용
 * 
 * ? Props:
 * @param {string|null} currentColor - 현재 선택된 색상
 * @param {Array<string>} customColorHistory - 커스텀 색상 히스토리 배열
 * @param {Function} onColorSelect - 색상 선택 핸들러 (color: string) => void
 * @param {Function} onResetColor - 색상 리셋 핸들러
 */
export function ColorPalette({ currentColor, customColorHistory, onColorSelect, onResetColor }) {
  // 기본 색상 팔레트
  const defaultColors = ['#22d3ee', '#34d399', '#a78bfa', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];
  
  return (
    <>
      <div className="px-1 text-xs opacity-70 mt-2 mb-1 flex items-center justify-between">
        <span>Color</span>
        <button 
          className="text-xs opacity-60 hover:opacity-100 px-1 py-0.5 rounded hover:bg-white/10"
          onClick={onResetColor}
          title="Reset to default group color"
        >
          Reset
        </button>
      </div>
      
      {/* 기본 색상 팔레트 (첫 번째 줄) */}
      <div className="grid grid-cols-8 gap-1 px-1">
        {defaultColors.map((c)=> (
          <button 
            key={c} 
            aria-label={`color-${c}`} 
            className={`w-4 h-4 rounded-full border border-white/30 hover:scale-110 transition-transform ${
              currentColor === c ? 'ring-2 ring-white' : ''
            }`} 
            style={{ backgroundColor: c, fontSize: '0.5em' }} 
            onClick={()=>onColorSelect(c)} 
          />
        ))}
      </div>
      
      {/* 커스텀 색상 히스토리 (두 번째 줄) */}
      <div className="grid grid-cols-8 gap-1 px-1 mt-1">
        {customColorHistory.map((c, idx)=> (
          <button 
            key={`${c}-${idx}`}
            aria-label={`custom-color-${c}`} 
            className={`w-4 h-4 rounded-full border border-white/30 hover:scale-110 transition-transform ${
              currentColor === c ? 'ring-2 ring-white' : ''
            }`} 
            style={{ backgroundColor: c, fontSize: '0.5em' }} 
            onClick={()=>onColorSelect(c)} 
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
    </>
  );
}
