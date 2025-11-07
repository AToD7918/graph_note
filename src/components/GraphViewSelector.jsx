import { useState } from 'react';

/**
 * GraphViewSelector
 * 그래프 뷰 형식을 선택하는 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.currentView - 현재 선택된 뷰 ('relationship' | 'tag' | 'timeline')
 * @param {Function} props.onViewChange - 뷰 변경 핸들러
 */
export function GraphViewSelector({ currentView, onViewChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const viewOptions = [
    { id: 'relationship', label: 'R→S 관계', icon: '🔗', description: '노드 간 관계 기반' },
    { id: 'tag', label: 'Tag별 모음', icon: '🏷️', description: '태그별 그룹화 (추후 추가)', disabled: true },
    { id: 'timeline', label: '시간순 정렬', icon: '⏱️', description: '생성 시간 기반 (추후 추가)', disabled: true },
  ];

  const handleViewSelect = (viewId) => {
    if (!viewOptions.find(v => v.id === viewId)?.disabled) {
      onViewChange(viewId);
      setIsOpen(false);
    }
  };

  const currentViewInfo = viewOptions.find(v => v.id === currentView);

  return (
    <div className="absolute top-4 right-4 z-10">
      {/* 메인 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
        title="그래프 뷰 선택"
      >
        <span className="text-lg">{currentViewInfo?.icon}</span>
        <span className="font-medium text-gray-200">{currentViewInfo?.label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <>
          {/* 배경 클릭 영역 */}
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 옵션 리스트 */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg overflow-hidden">
            {viewOptions.map((view) => (
              <button
                key={view.id}
                onClick={() => handleViewSelect(view.id)}
                disabled={view.disabled}
                className={`
                  w-full px-4 py-3 text-left flex items-start gap-3 transition-colors
                  ${view.id === currentView ? 'bg-blue-900/40 border-l-4 border-blue-400' : ''}
                  ${view.disabled 
                    ? 'opacity-50 cursor-not-allowed bg-gray-900/40' 
                    : 'hover:bg-gray-700 cursor-pointer'
                  }
                `}
              >
                <span className="text-xl mt-0.5">{view.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-200 flex items-center gap-2">
                    {view.label}
                    {view.disabled && (
                      <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded">
                        준비중
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    {view.description}
                  </div>
                </div>
                {view.id === currentView && (
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
