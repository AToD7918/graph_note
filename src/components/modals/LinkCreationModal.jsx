import { useState, useEffect } from 'react';

/**
 * 링크 생성 모달 컴포넌트
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 핸들러
 * @param {Function} props.onConfirm - 링크 생성 확인 핸들러 (type, description) => void
 * @param {string} props.sourceNodeTitle - 소스 노드 제목
 * @param {string} props.targetNodeTitle - 타겟 노드 제목
 */
export default function LinkCreationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  sourceNodeTitle, 
  targetNodeTitle 
}) {
  const [linkType, setLinkType] = useState('based-on');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLinkType('based-on');
      setDescription('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(linkType, description.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">링크 생성</h2>
        
        {/* 노드 정보 */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-gray-700">From:</span>
            <span className="text-gray-900">{sourceNodeTitle}</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <span className="font-semibold text-gray-700">To:</span>
            <span className="text-gray-900">{targetNodeTitle}</span>
          </div>
        </div>

        {/* 링크 타입 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            링크 타입
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="linkType"
                value="based-on"
                checked={linkType === 'based-on'}
                onChange={(e) => setLinkType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Based On (기반)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="linkType"
                value="cited-by"
                checked={linkType === 'cited-by'}
                onChange={(e) => setLinkType(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Cited By (인용)</span>
            </label>
          </div>
        </div>

        {/* 링크 설명 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            링크 설명 (선택사항)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이 링크에 대한 간단한 설명을 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter로 생성, Shift+Enter로 줄바꿈
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            링크 생성
          </button>
        </div>
      </div>
    </div>
  );
}
