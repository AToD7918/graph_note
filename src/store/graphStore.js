import { create } from 'zustand';
import { createLocalStorageAdapter, createRemoteAdapter } from '../adapters/storage';
import { seedCore5 } from '../data/seedData';
import { rebuildTagsIndex, loadTagsIndex, saveTagsIndex } from '../utils/tagHelpers';
import { STORAGE_MODE, STORAGE_KEYS } from '../constants/storage';
import { debounce } from '../utils/debounce';

/**
 * 그래프 데이터 스토어
 * 
 * 책임:
 * - 그래프 구조 (nodes, links) 관리
 * - 노드 스타일 (nodeStyles) 관리
 * - 노드 위치 (savedNodePositions) 관리
 * - 태그 인덱스 관리
 * - 데이터 영속성 (localStorage/Remote)
 * 
 * @returns {import('../types').GraphStore}
 */
export const useGraphStore = create((set, get) => {
  // 저장소 초기화
  const storageMode = STORAGE_MODE.LOCAL;
  const storage = storageMode === STORAGE_MODE.LOCAL 
    ? createLocalStorageAdapter() 
    : createRemoteAdapter();
  
  const loaded = storage.load && storage.load();
  const initial = loaded || seedCore5();

  // 노드 위치 로드
  let savedPositions = {};
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NODE_POSITIONS);
    if (saved) {
      savedPositions = JSON.parse(saved);
    }
  } catch (error) {
    console.error('노드 위치 로드 실패:', error);
  }

  // 태그 인덱스 로드
  const storedIndex = loadTagsIndex();
  const rebuiltIndex = rebuildTagsIndex(initial.nodes);
  const mergedIndex = { ...storedIndex };
  Object.entries(rebuiltIndex).forEach(([category, tags]) => {
    if (!mergedIndex[category]) {
      mergedIndex[category] = tags;
    } else {
      mergedIndex[category] = [...new Set([...mergedIndex[category], ...tags])].sort();
    }
  });

  return {
    // === 상태 ===
    storageMode,
    storage,
    graph: {
      nodes: initial.nodes,
      links: initial.links
    },
    nodeStyles: initial.nodeStyles || {},
    savedNodePositions: savedPositions,
    tagsIndex: mergedIndex,

    // === 그래프 데이터 액션 ===
    setGraph: (graph) => {
      set({ graph });
      get().saveToStorage();
    },

    updateNode: (nodeId, patch) => {
      set((state) => {
        const nodes = state.graph.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...patch } : n
        );
        
        return {
          graph: {
            nodes,
            links: state.graph.links
          }
        };
      });
      
      // 태그가 업데이트되면 인덱스 재구축
      if (patch.tags) {
        const updatedIndex = rebuildTagsIndex(get().graph.nodes);
        set({ tagsIndex: updatedIndex });
        saveTagsIndex(updatedIndex);
      }
      
      get().saveToStorage();
    },

    addNode: (node, link) => {
      set((state) => ({
        graph: {
          nodes: [...state.graph.nodes, node],
          links: link ? [...state.graph.links, link] : state.graph.links
        }
      }));
      get().saveToStorage();
    },

    deleteNode: (nodeId) => {
      set((state) => ({
        graph: {
          nodes: state.graph.nodes.filter((n) => n.id !== nodeId),
          links: state.graph.links.filter(
            (l) => l.source !== nodeId && l.target !== nodeId
          )
        }
      }));
      get().saveToStorage();
    },

    // === 링크 관리 액션 ===
    /**
     * 새 링크 추가
     * @param {string} sourceId - 소스 노드 ID
     * @param {string} targetId - 타겟 노드 ID
     * @param {string} type - 링크 타입 ('based-on' | 'cited-by')
     * @param {string} description - 링크 설명 (선택사항)
     * @returns {boolean} 성공 여부
     */
    addLink: (sourceId, targetId, type, description = '') => {
      const state = get();
      
      // 중복 링크 체크
      const isDuplicate = state.graph.links.some(
        (link) => link.source === sourceId && link.target === targetId
      );
      
      if (isDuplicate) {
        console.warn('이미 존재하는 링크입니다.');
        return false;
      }
      
      // 새 링크 생성
      const newLink = {
        source: sourceId,
        target: targetId,
        type,
        description
      };
      
      set((s) => ({
        graph: {
          nodes: s.graph.nodes,
          links: [...s.graph.links, newLink]
        }
      }));
      
      get().saveToStorage();
      return true;
    },

    /**
     * 링크 삭제
     * @param {string} sourceId - 소스 노드 ID
     * @param {string} targetId - 타겟 노드 ID
     */
    deleteLink: (sourceId, targetId) => {
      set((state) => ({
        graph: {
          nodes: state.graph.nodes,
          links: state.graph.links.filter(
            (link) => !(link.source === sourceId && link.target === targetId)
          )
        }
      }));
      get().saveToStorage();
    },

    // === 노드 스타일 액션 ===
    setNodeStyle: (nodeId, patch) => {
      set((state) => ({
        nodeStyles: {
          ...state.nodeStyles,
          [nodeId]: { ...(state.nodeStyles[nodeId] || {}), ...patch }
        }
      }));
      get().saveToStorage();
    },

    // === 노드 위치 액션 ===
    _pendingPositions: {},
    
    saveNodePosition: (nodeId, x, y) => {
      const state = get();
      
      // 즉시 localStorage에 저장 (UI 깜빡임 방지)
      state._pendingPositions[nodeId] = { x, y };
      
      try {
        const currentPositions = state.savedNodePositions;
        const newPositions = {
          ...currentPositions,
          ...state._pendingPositions
        };
        localStorage.setItem(STORAGE_KEYS.NODE_POSITIONS, JSON.stringify(newPositions));
      } catch (error) {
        console.error('노드 위치 저장 실패:', error);
      }
      
      // Zustand 상태는 debounce로 업데이트 (리렌더링 최소화)
      get()._debouncedUpdatePositions();
    },
    
    _debouncedUpdatePositions: debounce(() => {
      const state = get();
      if (Object.keys(state._pendingPositions).length > 0) {
        set((s) => ({
          savedNodePositions: {
            ...s.savedNodePositions,
            ...s._pendingPositions
          },
          _pendingPositions: {}
        }));
      }
    }, 500),

    clearNodePositions: () => {
      set({ savedNodePositions: {} });
      try {
        localStorage.removeItem(STORAGE_KEYS.NODE_POSITIONS);
      } catch (error) {
        console.error('노드 위치 삭제 실패:', error);
      }
    },

    // === 태그 인덱스 액션 ===
    updateTagsIndex: (index) => {
      set({ tagsIndex: index });
      saveTagsIndex(index);
    },

    // === 저장소 액션 ===
    saveToStorage: debounce(() => {
      const state = get();
      if (state.storage.save) {
        state.storage.save({
          nodes: state.graph.nodes,
          links: state.graph.links,
          nodeStyles: state.nodeStyles
        });
      }
    }, 300),

    clearStorage: () => {
      const state = get();
      if (state.storage.clear) {
        state.storage.clear();
      }
    },

    setStorageMode: (mode) => {
      const newStorage = mode === STORAGE_MODE.LOCAL
        ? createLocalStorageAdapter() 
        : createRemoteAdapter();
      set({ storageMode: mode, storage: newStorage });
    }
  };
});
