import { useRef } from 'react';

/**
 * AutocompleteSuggestions - 자동완성 드롭다운 컴포넌트
 * 
 * @param {string[]} suggestions - 제안할 항목 목록
 * @param {Function} onSelect - 항목 선택 핸들러
 * @param {string} query - 현재 입력 쿼리 (하이라이트용)
 * @param {boolean} visible - 표시 여부
 * @param {number} selectedIndex - 현재 선택된 인덱스
 */
export function AutocompleteSuggestions({ suggestions, onSelect, query = '', visible = true, selectedIndex = 0 }) {
  const containerRef = useRef(null);

  if (!visible || suggestions.length === 0) return null;

  // 쿼리 하이라이트
  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-500/30 text-yellow-200">
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto z-50"
    >
      {suggestions.map((item, index) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
            index === selectedIndex
              ? 'bg-blue-900/40 text-blue-200'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          {highlightMatch(item, query)}
        </button>
      ))}
    </div>
  );
}
