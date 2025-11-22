import React, { useState } from 'react';

/**
 * 링크 미리보기/편집 메뉴
 * 
 * 링크 클릭 시 마우스 근처에 표시되는 팝업 메뉴
 * - 링크 정보 (From → To)
 * - 링크 설명 (인라인 편집 가능)
 * - 삭제 버튼
 * 
 * @param {Object} props
 * @param {Object|null} props.link - 선택된 링크
 * @param {import('../types').Position} props.position - 메뉴 위치
 * @param {{width: number, height: number}} props.containerSize - 컨테이너 크기
 * @param {function(): void} props.onClose - 닫기 핸들러
 * @param {function(string, string, string): void} props.onSave - 저장 핸들러
 * @param {function(): void} props.onDelete - 삭제 핸들러
 * @param {string} props.sourceNodeTitle - 소스 노드 제목
 * @param {string} props.targetNodeTitle - 타겟 노드 제목
 */
export function LinkPreviewMenu({ 
  link,
  position, 
  containerSize,
  onClose, 
  onSave,
  onDelete,
  sourceNodeTitle,
  targetNodeTitle
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(link?.description || '');

  // link가 변경되면 description 업데이트
  React.useEffect(() => {
    if (link) {
      setDescription(link.description || '');
      setIsEditing(false);
    }
  }, [link]);

  // 메뉴가 화면 밖으로 나가지 않도록 위치 조정
  const menuWidth = 300;
  const menuHeight = isEditing ? 200 : 150;
  
  const adjustedX = Math.min(position.x + 10, containerSize.width - menuWidth);
  const adjustedY = Math.min(position.y + 10, containerSize.height - menuHeight);

  if (!link || position.x === 0) {
    return null;
  }

  const handleSave = () => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    onSave(sourceId, targetId, description.trim());
    setIsEditing(false);
  };

  const handleDescriptionClick = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setDescription(link?.description || '');
      setIsEditing(false);
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div 
      className="preview-menu"
      style={{
        left: adjustedX,
        top: adjustedY,
        width: menuWidth,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-gray-400 flex items-center gap-1">
          <span className="truncate max-w-[100px]">{sourceNodeTitle}</span>
          <span>→</span>
          <span className="truncate max-w-[100px]">{targetNodeTitle}</span>
        </div>
        <button 
          className="text-xs opacity-60 hover:opacity-100"
          onClick={onClose}
        >✕</button>
      </div>

      {/* 링크 설명 */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">링크 설명</div>
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder="링크에 대한 설명을 입력하세요..."
            className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-blue-500 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
            autoFocus
          />
        ) : (
          <div
            onClick={handleDescriptionClick}
            className="w-full px-2 py-1.5 text-xs bg-gray-800/50 border border-transparent rounded cursor-pointer hover:border-gray-600 hover:bg-gray-800 transition-colors min-h-[60px]"
          >
            {description || <span className="text-gray-500">클릭하여 설명 추가...</span>}
          </div>
        )}
        {isEditing && (
          <div className="text-xs text-gray-500 mt-1">
            Ctrl+Enter로 저장, ESC로 취소
          </div>
        )}
      </div>

      {/* 삭제 버튼 */}
      <button 
        className="w-full px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors"
        onClick={onDelete}
      >
        🗑️ 링크 삭제
      </button>
    </div>
  );
}
