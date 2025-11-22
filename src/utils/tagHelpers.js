/**
 * 태그 시스템 유틸리티 함수
 * 
 * 데이터 구조:
 * - 노드 태그: { "Category1": ["tag1", "tag2"], "Category2": ["tag3"] }
 * - 글로벌 인덱스: { "Category1": ["tag1", "tag2", "tag3"], ... }
 * @module utils/tagHelpers
 */

import { STORAGE_KEYS } from '../constants/storage';

/**
 * 태그 인덱스를 localStorage에서 로드
 * @returns {import('../types').TagsIndex} 카테고리별 태그 맵
 */
export function loadTagsIndex() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TAGS_INDEX);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('태그 인덱스 로드 실패:', error);
    return {};
  }
}

/**
 * 태그 인덱스를 localStorage에 저장
 * @param {import('../types').TagsIndex} index - 카테고리별 태그 맵
 */
export function saveTagsIndex(index) {
  try {
    localStorage.setItem(STORAGE_KEYS.TAGS_INDEX, JSON.stringify(index));
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
 * 노드에 태그 추가 (계층 구조 자동 생성)
 * @param {import('../types').TagsIndex} nodeTags - 노드의 현재 태그
 * @param {string} category - 카테고0리명
 * @param {string} tag - 추가할 태그 (계층 구조 포함 가능)
 * @returns {import('../types').TagsIndex} 업데이트된 태그 객체
 */
export function addTagToNode(nodeTags, category, tag) {
  const updated = { ...nodeTags };
  
  if (!updated[category]) {
    updated[category] = [];
  }
  
  // 계층 구조가 있는 경우 모든 부모 태그도 추가
  if (tag.includes(' > ')) {
    const levels = tag.split(' > ').map(p => p.trim()).filter(p => p.length > 0);
    
    // 각 레벨의 경로를 생성하고 추가
    for (let i = 0; i < levels.length; i++) {
      const partialPath = levels.slice(0, i + 1).join(' > ');
      if (!updated[category].includes(partialPath)) {
        updated[category] = [...updated[category], partialPath];
      }
    }
  } else {
    // 단일 태그는 그냥 추가
    if (!updated[category].includes(tag)) {
      updated[category] = [...updated[category], tag];
    }
  }
  
  return updated;
}

/**
 * 노드에서 태그 제거 (하위 태그도 함께 제거, 고아 부모 태그 정리)
 * @param {import('../types').TagsIndex} nodeTags - 노드의 현재 태그
 * @param {string} category - 카테고리명
 * @param {string} tag - 제거할 태그
 * @returns {import('../types').TagsIndex} 업데이트된 태그 객체
 */
export function removeTagFromNode(nodeTags, category, tag) {
  const updated = { ...nodeTags };
  
  if (updated[category]) {
    // 현재 태그와 모든 하위 태그 제거
    updated[category] = updated[category].filter(t => {
      // 정확히 일치하는 태그 제거
      if (t === tag) return false;
      
      // 하위 태그 제거 (tag > 로 시작하는 모든 태그)
      if (t.startsWith(tag + ' > ')) return false;
      
      return true;
    });
    
    // 고아 부모 태그 정리
    // "Deep Learning > CNN > ResNet" 삭제 시
    // "Deep Learning > CNN"과 "Deep Learning"에 다른 자식이 없으면 삭제
    if (tag.includes(' > ')) {
      const levels = tag.split(' > ').map(p => p.trim());
      
      // 상위 레벨부터 확인 (역순)
      for (let i = levels.length - 2; i >= 0; i--) {
        const parentPath = levels.slice(0, i + 1).join(' > ');
        
        // 이 부모를 접두사로 가지는 다른 태그가 있는지 확인
        const hasChildren = updated[category].some(t => 
          t !== parentPath && t.startsWith(parentPath + ' > ')
        );
        
        // 자식이 없으면 부모도 삭제
        if (!hasChildren) {
          updated[category] = updated[category].filter(t => t !== parentPath);
        } else {
          // 자식이 있으면 더 상위 부모는 확인할 필요 없음
          break;
        }
      }
    }
    
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
 * 태그 인덱스에 새 태그 추가 (계층 구조 포함, 중복 방지)
 * @param {string} category - 카테고리명
 * @param {string} tag - 태그명 (계층 구조 포함 가능)
 */
export function addTagToIndex(category, tag) {
  const index = loadTagsIndex();
  
  if (!index[category]) {
    index[category] = [];
  }
  
  // 계층 구조가 있는 경우 모든 부모 태그도 인덱스에 추가
  if (tag.includes(' > ')) {
    const levels = tag.split(' > ').map(p => p.trim()).filter(p => p.length > 0);
    
    // 각 레벨의 경로를 생성하고 인덱스에 추가
    for (let i = 0; i < levels.length; i++) {
      const partialPath = levels.slice(0, i + 1).join(' > ');
      if (!index[category].includes(partialPath)) {
        index[category].push(partialPath);
      }
    }
  } else {
    // 단일 태그는 그냥 추가
    if (!index[category].includes(tag)) {
      index[category].push(tag);
    }
  }
  
  index[category].sort();
  saveTagsIndex(index);
}

/**
 * 태그 인덱스에서 태그 제거 (하위 태그와 고아 부모도 함께)
 * @param {string} category - 카테고리명
 * @param {string} tag - 제거할 태그명
 */
export function removeTagFromIndex(category, tag) {
  const index = loadTagsIndex();
  
  if (!index[category]) return;
  
  // 현재 태그와 모든 하위 태그 제거
  index[category] = index[category].filter(t => {
    if (t === tag) return false;
    if (t.startsWith(tag + ' > ')) return false;
    return true;
  });
  
  // 고아 부모 태그 정리
  if (tag.includes(' > ')) {
    const levels = tag.split(' > ').map(p => p.trim());
    
    for (let i = levels.length - 2; i >= 0; i--) {
      const parentPath = levels.slice(0, i + 1).join(' > ');
      
      const hasChildren = index[category].some(t => 
        t !== parentPath && t.startsWith(parentPath + ' > ')
      );
      
      if (!hasChildren) {
        index[category] = index[category].filter(t => t !== parentPath);
      } else {
        break;
      }
    }
  }
  
  // 카테고리가 비었으면 삭제
  if (index[category].length === 0) {
    delete index[category];
  } else {
    index[category].sort();
  }
  
  saveTagsIndex(index);
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
  
  // 특수문자 제한 (> 는 계층 구조를 위해 허용)
  const validPattern = /^[a-zA-Z0-9가-힣\s\-_>]+$/;
  if (!validPattern.test(trimmed)) return false;
  
  return true;
}

/**
 * 계층 구조 태그 파싱
 * @param {string} tag - 태그 문자열 (예: "Deep Learning > CNN > ResNet")
 * @returns {Object} { fullPath: 전체 경로, displayName: 마지막 태그, levels: 계층 배열 }
 */
export function parseHierarchicalTag(tag) {
  const levels = tag.split('>').map(part => part.trim()).filter(part => part.length > 0);
  
  return {
    fullPath: tag.trim(),
    displayName: levels[levels.length - 1] || tag.trim(),
    levels: levels,
    depth: levels.length
  };
}

/**
 * 태그를 표시용 형식으로 변환 (마지막 태그만)
 * @param {string} tag - 전체 경로 태그 (예: "Deep Learning > CNN > ResNet")
 * @returns {string} 표시용 태그 (예: "ResNet")
 */
export function formatTagForDisplay(tag) {
  const parsed = parseHierarchicalTag(tag);
  return parsed.displayName;
}

/**
 * 태그를 저장용 형식으로 변환 (전체 경로 유지)
 * @param {string} tag - 입력된 태그
 * @returns {string} 저장용 태그 (정규화된 전체 경로)
 */
export function formatTagForStorage(tag) {
  const levels = tag.split('>').map(part => part.trim()).filter(part => part.length > 0);
  return levels.join(' > ');
}

/**
 * 태그 계층 구조로 파싱 (향후 사용)
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
