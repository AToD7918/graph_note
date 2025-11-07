import { useState, useEffect } from 'react';
import { CategoryRow } from './CategoryRow';
import { 
  addTagToNode, 
  removeTagFromNode, 
  removeCategoryFromNode,
  validateCategoryName,
  validateTagName,
  removeTagFromIndex
} from '../../../utils/tagHelpers';

/**
 * TagInput - 카테고리 기반 태그 입력 컴포넌트
 * 
 * @param {Object.<string, string[]>} value - 현재 태그 데이터 { "Category": ["tag1", "tag2"] }
 * @param {Function} onChange - 태그 변경 핸들러
 * @param {Object.<string, string[]>} tagsIndex - 전체 태그 인덱스 (자동완성용)
 */
export function TagInput({ value = {}, onChange, tagsIndex = {} }) {
  const [localTags, setLocalTags] = useState(value);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // value prop 변경 시 로컬 상태 업데이트
  useEffect(() => {
    setLocalTags(value);
  }, [value]);

  // 태그 추가
  const handleAddTag = (category, tag) => {
    if (!validateTagName(tag)) {
      console.warn('Invalid tag name:', tag);
      return;
    }

    const updated = addTagToNode(localTags, category, tag.trim());
    setLocalTags(updated);
    onChange(updated);
  };

  // 태그 제거
  const handleRemoveTag = (category, tag) => {
    const updated = removeTagFromNode(localTags, category, tag);
    setLocalTags(updated);
    onChange(updated);
    
    // 글로벌 인덱스에서도 제거
    removeTagFromIndex(category, tag);
  };

  // 카테고리 제거
  const handleRemoveCategory = (category) => {
    const updated = removeCategoryFromNode(localTags, category);
    setLocalTags(updated);
    onChange(updated);
  };

  // 새 카테고리 추가
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    
    if (!trimmed) {
      setIsAddingCategory(false);
      return;
    }

    if (!validateCategoryName(trimmed)) {
      alert('Invalid category name. Use only letters, numbers, spaces, hyphens, and underscores.');
      return;
    }

    if (localTags[trimmed]) {
      alert('Category already exists.');
      return;
    }

    // 빈 태그 배열로 카테고리 추가
    const updated = { ...localTags, [trimmed]: [] };
    setLocalTags(updated);
    onChange(updated);
    
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // 카테고리명 변경 (입력 중)
  const handleCategoryNameChange = (name) => {
    setNewCategoryName(name);
  };

  // Enter로 카테고리 추가
  const handleCategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    } else if (e.key === 'Escape') {
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  // 기존 카테고리 목록
  const categories = Object.keys(localTags);

  // 카테고리별 자동완성 제안 생성 (계층 구조 고려)
  const getCategorySuggestions = (category) => {
    // tagsIndex에서 해당 카테고리의 모든 태그를 가져옴
    // 이미 addTagToIndex에서 계층 구조를 모두 추가했으므로 그대로 반환
    return tagsIndex[category] || [];
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 라벨 */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold opacity-90">
          🏷️ Tags
        </label>
        <button
          onClick={() => setIsAddingCategory(true)}
          className="px-2 py-0.5 text-xs text-gray-400 hover:text-blue-400 border border-dashed border-gray-600 hover:border-blue-500 rounded transition-colors flex items-center gap-1"
          title="Add category"
        >
          <span>+</span>
          <span>Category</span>
        </button>
      </div>

      {/* 카테고리 행들 */}
      <div className="flex flex-col gap-2">
        {categories.map(category => (
          <CategoryRow
            key={category}
            category={category}
            tags={localTags[category] || []}
            onRemoveTag={handleRemoveTag}
            onRemoveCategory={handleRemoveCategory}
            onAddTag={handleAddTag}
            tagSuggestions={getCategorySuggestions(category)}
          />
        ))}

        {/* 새 카테고리 추가 행 */}
        {isAddingCategory ? (
          <div className="flex items-start border border-dashed border-blue-500/50 rounded-lg bg-gray-800/30">
            {/* 왼쪽: 카테고리 입력 */}
            <div className="w-36 flex-shrink-0 border-r border-gray-600 bg-gray-800/80 rounded-l-lg">
              <div className="px-3 py-2.5 min-h-[42px]">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                  onKeyDown={handleCategoryKeyDown}
                  onBlur={() => {
                    setTimeout(() => {
                      if (newCategoryName.trim()) {
                        handleAddCategory();
                      } else {
                        setIsAddingCategory(false);
                      }
                    }, 200);
                  }}
                  placeholder="Category..."
                  className="w-full bg-transparent text-gray-200 text-sm text-center placeholder-gray-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* 오른쪽: 빈 공간 */}
            <div className="flex-1 px-3 py-2.5 rounded-r-lg">
              <div className="text-xs text-gray-500 italic">
                Enter category name, then add tags →
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
