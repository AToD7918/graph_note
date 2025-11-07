/**
 * 태그 시스템 유틸리티 함수
 * 
 * 데이터 구조:
 * - 노드 태그: { "Category1": ["tag1", "tag2"], "Category2": ["tag3"] }
 * - 글로벌 인덱스: { "Category1": ["tag1", "tag2", "tag3"], ... }
 */

const TAGS_INDEX_KEY = 'graph_tags_index';

/**
 * 태그 인덱스를 localStorage에서 로드
 * @returns {Object.<string, string[]>} 카테고리별 태그 맵
 */
export function loadTagsIndex() {
  try {
    const stored = localStorage.getItem(TAGS_INDEX_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('태그 인덱스 로드 실패:', error);
    return {};
  }
}

/**
 * 태그 인덱스를 localStorage에 저장
 * @param {Object.<string, string[]>} index - 카테고리별 태그 맵
 */
export function saveTagsIndex(index) {
  try {
    localStorage.setItem(TAGS_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error('태그 인덱스 저장 실패:', error);
  }
}

/**
 * 특정 카테고리의 태그 목록 가져오기
 * @param {string} category - 카테고리명
 * @returns {string[]} 태그 배열
 */
export function getTagsByCategory(category) {
  const index = loadTagsIndex();
  return index[category] || [];
}

/**
 * 모든 카테고리 목록 가져오기
 * @returns {string[]} 카테고리 배열
 */
export function getAllCategories() {
  const index = loadTagsIndex();
  return Object.keys(index).sort();
}

/**
 * 노드에 태그 추가
 * @param {Object.<string, string[]>} nodeTags - 노드의 현재 태그
 * @param {string} category - 카테고리명
 * @param {string} tag - 추가할 태그
 * @returns {Object.<string, string[]>} 업데이트된 태그 객체
 */
export function addTagToNode(nodeTags, category, tag) {
  const updated = { ...nodeTags };
  
  if (!updated[category]) {
    updated[category] = [];
  }
  
  // 중복 방지
  if (!updated[category].includes(tag)) {
    updated[category] = [...updated[category], tag];
  }
  
  return updated;
}

/**
 * 노드에서 태그 제거
 * @param {Object.<string, string[]>} nodeTags - 노드의 현재 태그
 * @param {string} category - 카테고리명
 * @param {string} tag - 제거할 태그
 * @returns {Object.<string, string[]>} 업데이트된 태그 객체
 */
export function removeTagFromNode(nodeTags, category, tag) {
  const updated = { ...nodeTags };
  
  if (updated[category]) {
    updated[category] = updated[category].filter(t => t !== tag);
    // 카테고리가 비어도 유지 (사용자가 명시적으로 삭제할 때까지)
  }
  
  return updated;
}

/**
 * 노드에서 카테고리 전체 제거
 * @param {Object.<string, string[]>} nodeTags - 노드의 현재 태그
 * @param {string} category - 제거할 카테고리명
 * @returns {Object.<string, string[]>} 업데이트된 태그 객체
 */
export function removeCategoryFromNode(nodeTags, category) {
  const updated = { ...nodeTags };
  delete updated[category];
  return updated;
}

/**
 * 전체 그래프에서 태그 인덱스 재구축
 * @param {Array} nodes - 모든 노드 배열
 * @returns {Object.<string, string[]>} 새로운 태그 인덱스
 */
export function rebuildTagsIndex(nodes) {
  const index = {};
  
  nodes.forEach(node => {
    if (!node.tags || typeof node.tags !== 'object') return;
    
    Object.entries(node.tags).forEach(([category, tags]) => {
      if (!Array.isArray(tags)) return;
      
      if (!index[category]) {
        index[category] = [];
      }
      
      tags.forEach(tag => {
        if (!index[category].includes(tag)) {
          index[category].push(tag);
        }
      });
    });
  });
  
  // 각 카테고리의 태그를 정렬
  Object.keys(index).forEach(category => {
    index[category].sort();
  });
  
  return index;
}

/**
 * 태그 인덱스에 새 태그 추가 (중복 방지)
 * @param {string} category - 카테고리명
 * @param {string} tag - 태그명
 */
export function addTagToIndex(category, tag) {
  const index = loadTagsIndex();
  
  if (!index[category]) {
    index[category] = [];
  }
  
  if (!index[category].includes(tag)) {
    index[category].push(tag);
    index[category].sort();
    saveTagsIndex(index);
  }
}

/**
 * 카테고리명 유효성 검사
 * @param {string} name - 카테고리명
 * @returns {boolean} 유효 여부
 */
export function validateCategoryName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  
  // 빈 문자열
  if (trimmed.length === 0) return false;
  
  // 너무 긴 이름 (최대 50자)
  if (trimmed.length > 50) return false;
  
  // 특수문자 제한 (알파벳, 숫자, 공백, 하이픈, 언더스코어만 허용)
  const validPattern = /^[a-zA-Z0-9가-힣\s\-_]+$/;
  if (!validPattern.test(trimmed)) return false;
  
  return true;
}

/**
 * 태그명 유효성 검사
 * @param {string} name - 태그명
 * @returns {boolean} 유효 여부
 */
export function validateTagName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  
  // 빈 문자열
  if (trimmed.length === 0) return false;
  
  // 너무 긴 이름 (최대 100자, 계층 구조 고려)
  if (trimmed.length > 100) return false;
  
  // 특수문자 제한 (슬래시는 계층 구조를 위해 허용)
  const validPattern = /^[a-zA-Z0-9가-힣\s\-_/]+$/;
  if (!validPattern.test(trimmed)) return false;
  
  return true;
}

/**
 * 태그를 계층 구조로 파싱 (향후 사용)
 * @param {string} tag - 태그 문자열 (예: "Deep Learning/CNN")
 * @returns {string[]} 계층 배열 (예: ["Deep Learning", "CNN"])
 */
export function parseTagHierarchy(tag) {
  return tag.split('/').map(part => part.trim()).filter(part => part.length > 0);
}

/**
 * 태그가 특정 접두사와 일치하는지 확인 (향후 계층 검색용)
 * @param {string} tag - 태그 문자열
 * @param {string} prefix - 접두사
 * @returns {boolean} 일치 여부
 */
export function matchesTagPrefix(tag, prefix) {
  return tag.startsWith(prefix);
}

/**
 * 노드 데이터에 빈 tags 객체 추가 (마이그레이션용)
 * @param {Object} node - 노드 객체
 * @returns {Object} 업데이트된 노드
 */
export function ensureTagsField(node) {
  if (!node.tags || typeof node.tags !== 'object' || Array.isArray(node.tags)) {
    return { ...node, tags: {} };
  }
  return node;
}
