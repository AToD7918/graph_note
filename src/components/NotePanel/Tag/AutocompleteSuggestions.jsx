import { useRef } from 'react';
import { parseHierarchicalTag } from '../../../utils/tagHelpers';

/**
 * AutocompleteSuggestions - 자동완성 드롭다운 컴포넌트
 * 
 * @param {string[]} suggestions - 제안할 항목 목록 (전체 경로 포함)
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

  // 계층 구조 렌더링
  const renderHierarchicalTag = (tag) => {
    const parsed = parseHierarchicalTag(tag);
    
    if (parsed.depth === 1) {
      // 단일 레벨 태그
      return highlightMatch(tag, query);
    }
    
    // 다중 레벨 태그 - 부모는 회색, 마지막만 강조
    return (
      <span className="flex items-center gap-1">
        {parsed.levels.slice(0, -1).map((level, idx) => (
          <span key={idx} className="flex items-center gap-1">
            <span className="text-gray-500 text-xs">{level}</span>
            <span className="text-gray-600">›</span>
          </span>
        ))}
        <span>{highlightMatch(parsed.displayName, query)}</span>
      </span>
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
          {renderHierarchicalTag(item)}
        </button>
      ))}
    </div>
  );
}
