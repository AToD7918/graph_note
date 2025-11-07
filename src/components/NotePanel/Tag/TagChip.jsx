import { useState } from 'react';
import { formatTagForDisplay, parseHierarchicalTag } from '../../../utils/tagHelpers';

/**
 * TagChip - 개별 태그 칩 컴포넌트
 * 
 * @param {string} label - 태그 이름 (전체 경로)
 * @param {Function} onRemove - 삭제 핸들러
 * @param {string} color - 칩 색상 (선택)
 */
export function TagChip({ label, onRemove, color = 'blue' }) {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    blue: 'bg-blue-900/40 text-blue-300 border-blue-700/50 hover:bg-blue-900/60',
    purple: 'bg-purple-900/40 text-purple-300 border-purple-700/50 hover:bg-purple-900/60',
    green: 'bg-green-900/40 text-green-300 border-green-700/50 hover:bg-green-900/60',
    orange: 'bg-orange-900/40 text-orange-300 border-orange-700/50 hover:bg-orange-900/60',
  };

  // 표시용 이름 (마지막 태그만)
  const displayName = formatTagForDisplay(label);
  
  // 툴팁용 전체 경로
  const parsed = parseHierarchicalTag(label);
  const tooltipText = parsed.depth > 1 ? parsed.fullPath : displayName;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs transition-all ${colorClasses[color] || colorClasses.blue}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tooltipText}
    >
      <span className="select-none">{displayName}</span>
      {isHovered && (
        <button
          onClick={onRemove}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
          title="Remove tag"
        >
          ×
        </button>
      )}
    </div>
  );
}
