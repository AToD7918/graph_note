import React from 'react';

/**
 * 노드 미리보기 메뉴
 * 
 * 노드 클릭 시 마우스 근처에 표시되는 토글 메뉴
 * - 노드 제목
 * - 요약 미리보기
 * - "Open Note" 버튼 (노트 패널 열기)
 */
export function NodePreviewMenu({ 
  selectedNote, 
  position, 
  containerSize,
  onClose, 
  onOpenNote 
}) {
  // 메뉴가 화면 밖으로 나가지 않도록 위치 조정
  const menuWidth = 270;
  const menuHeight = 120;
  
  const adjustedX = Math.min(position.x + 10, containerSize.width - menuWidth);
  const adjustedY = Math.min(position.y + 10, containerSize.height - menuHeight);

  if (!selectedNote || position.x === 0) {
    return null;
  }

  return (
    <div 
      className="preview-menu"
      style={{
        left: adjustedX,
        top: adjustedY,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-sm truncate">{selectedNote.title}</div>
        <button 
          className="text-xs opacity-60 hover:opacity-100"
          onClick={onClose}
        >✕</button>
      </div>
      <div className="text-xs opacity-70 mb-3 line-clamp-2">
        {selectedNote.summary || '요약 내용이 없습니다.'}
      </div>
      <button 
        className="w-full px-3 py-1.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-sm font-medium transition-colors"
        onClick={onOpenNote}
      >
        📝 Open Note
      </button>
    </div>
  );
}
