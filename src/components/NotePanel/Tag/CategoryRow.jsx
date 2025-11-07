import { useState, useRef, useEffect } from 'react';
import { TagChip } from './TagChip';
import { AutocompleteSuggestions } from './AutocompleteSuggestions';

/**
 * CategoryRow - 카테고리와 태그를 한 줄로 표시하는 컴포넌트
 * 
 * @param {string} category - 카테고리명
 * @param {string[]} tags - 태그 배열
 * @param {Function} onRemoveTag - 태그 삭제 핸들러
 * @param {Function} onRemoveCategory - 카테고리 삭제 핸들러
 * @param {Function} onAddTag - 태그 추가 핸들러
 * @param {string[]} tagSuggestions - 자동완성 제안 목록
 * @param {boolean} isNew - 새 카테고리 추가 모드
 * @param {Function} onCategoryNameChange - 카테고리명 변경 (새 카테고리용)
 */
export function CategoryRow({
  category,
  tags = [],
  onRemoveTag,
  onRemoveCategory,
  onAddTag,
  tagSuggestions = [],
  isNew = false,
  onCategoryNameChange,
}) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const inputRef = useRef(null);

  // 입력 모드 진입 시 포커스
  useEffect(() => {
    if (isAddingTag && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTag]);

  // 자동완성 필터링
  const filteredSuggestions = tagInput
    ? tagSuggestions.filter(
        s => s.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(s)
      )
    : tagSuggestions.filter(s => !tags.includes(s));

  // suggestions 변경 시 인덱스 리셋
  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [filteredSuggestions.length]);

  // 태그 추가 핸들러
  const handleAddTag = (tagName) => {
    const trimmed = tagName.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(category, trimmed);
    }
    setTagInput('');
    setIsAddingTag(false);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(0);
  };

  // 입력 변경 핸들러
  const handleInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    setShowSuggestions(value.length > 0);
  };

  // Enter/Comma로 태그 추가 + 화살표 키 네비게이션
  const handleKeyDown = (e) => {
    const hasSuggestions = showSuggestions && filteredSuggestions.length > 0;

    if (e.key === 'ArrowDown' && hasSuggestions) {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp' && hasSuggestions) {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // 자동완성이 보이고 있으면 선택된 항목 사용
      if (hasSuggestions) {
        handleAddTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (tagInput.trim()) {
        // 자동완성이 없으면 입력된 텍스트 사용
        handleAddTag(tagInput);
      }
    } else if (e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTagInput('');
      setIsAddingTag(false);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(0);
    }
  };

  // 입력 필드 외부 클릭 시 닫기
  const handleBlur = () => {
    setTimeout(() => {
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      } else {
        setIsAddingTag(false);
        setShowSuggestions(false);
      }
    }, 200);
  };

  return (
    <div className="flex items-stretch border border-gray-600 rounded-lg bg-gray-800/50 group">
      {/* 왼쪽: 카테고리 */}
      <div className="w-36 flex-shrink-0 border-r border-gray-600 bg-gray-800/80 rounded-l-lg flex items-center">
        <div className="px-3 py-2.5 flex items-center justify-center gap-2 min-h-[42px] w-full">
          {isNew ? (
            <input
              type="text"
              placeholder="Category..."
              className="w-full bg-transparent text-gray-200 text-sm text-center placeholder-gray-500 focus:outline-none"
              autoFocus
              onChange={(e) => onCategoryNameChange(e.target.value)}
            />
          ) : (
            <>
              <span className="text-sm font-medium text-gray-200 truncate" title={category}>
                {category}
              </span>
              <button
                onClick={() => onRemoveCategory(category)}
                className="ml-auto text-gray-500 hover:text-red-400 transition-colors text-base opacity-0 group-hover:opacity-100"
                title="Remove category"
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>

      {/* 오른쪽: 태그들 */}
      <div className="flex-1 px-3 py-2 relative rounded-r-lg">
        <div className="flex flex-wrap items-center gap-2">
          {/* 기존 태그 칩들 */}
          {tags.map(tag => (
            <TagChip
              key={tag}
              label={tag}
              onRemove={() => onRemoveTag(category, tag)}
            />
          ))}

          {/* 태그 입력 필드 */}
          {isAddingTag ? (
            <div className="relative inline-block min-w-[120px] z-50">
              <input
                ref={inputRef}
                type="text"
                value={tagInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="Add tag..."
                className="px-2 py-1 bg-black/40 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-full"
              />
              
              {/* 자동완성 드롭다운 */}
              <AutocompleteSuggestions
                suggestions={filteredSuggestions}
                selectedIndex={selectedSuggestionIndex}
                onSelect={(item) => {
                  if (item) handleAddTag(item);
                  else {
                    setIsAddingTag(false);
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(0);
                  }
                }}
                query={tagInput}
                visible={showSuggestions && filteredSuggestions.length > 0}
              />
            </div>
          ) : (
            /* [+] 버튼 */
            !isNew && (
              <button
                onClick={() => setIsAddingTag(true)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-blue-400 border border-dashed border-gray-600 hover:border-blue-500 rounded transition-colors"
                title="Add tag"
              >
                +
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
