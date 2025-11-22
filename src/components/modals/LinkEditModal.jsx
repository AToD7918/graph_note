import { useState, useEffect } from 'react';

/**
 * 링크 편집 모달 컴포넌트
 * 링크 클릭 시 표시되며, 제목과 설명을 편집할 수 있음
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 핸들러
 * @param {Function} props.onSave - 저장 핸들러 (sourceId, targetId, title, description) => void
 * @param {Function} props.onDelete - 링크 삭제 핸들러
 * @param {Object} props.link - 링크 객체 { source, target, type, title, description }
 * @param {string} props.sourceNodeTitle - 소스 노드 제목
 * @param {string} props.targetNodeTitle - 타겟 노드 제목
 */
export default function LinkEditModal({ 
  isOpen, 
  onClose, 
  onSave,
  onDelete,
  link,
  sourceNodeTitle, 
  targetNodeTitle 
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && link) {
      setLocalTitle(link.title || '');
      setDescription(link.description || '');
      setIsEditingTitle(false);
    }
  }, [isOpen, link]);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditingTitle(false);
    } else if (e.key === 'Escape') {
      setLocalTitle(link?.title || '');
      setIsEditingTitle(false);
    }
  };

  const handleSave = () => {
    if (!link) return;
    
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    onSave(sourceId, targetId, localTitle.trim(), description.trim());
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('이 링크를 삭제하시겠습니까?')) {
      onDelete();
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !link) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 링크 정보 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <span className="font-semibold">{sourceNodeTitle}</span>
            <span>→</span>
            <span className="font-semibold">{targetNodeTitle}</span>
          </div>
          
          {/* 링크 제목 (인라인 편집) */}
          <div className="mb-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              링크 제목
            </label>
            {isEditingTitle ? (
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="w-full px-3 py-2 text-lg font-semibold border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                placeholder="링크 제목 입력..."
              />
            ) : (
              <div
                onClick={handleTitleClick}
                className="w-full px-3 py-2 text-lg font-semibold border border-transparent rounded-md cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {localTitle || <span className="text-gray-400">링크 제목을 입력하세요</span>}
              </div>
            )}
          </div>
        </div>

        {/* 링크 설명 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            링크 설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이 링크에 대한 설명을 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            링크 삭제
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
