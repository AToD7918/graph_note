import { create } from 'zustand';
import { createLocalStorageAdapter, createRemoteAdapter } from '../adapters/storage';
import { seedCore5 } from '../data/seedData';
import { rebuildTagsIndex, loadTagsIndex, saveTagsIndex } from '../utils/tagHelpers';

/**
 * 그래프 데이터 스토어
 * 
 * 책임:
 * - 그래프 구조 (nodes, links) 관리
 * - 노드 스타일 (nodeStyles) 관리
 * - 동심원 고정 노드 (lockedIds) 관리
 * - 노드 위치 (savedNodePositions) 관리
 * - 태그 인덱스 관리
 * - 데이터 영속성 (localStorage/Remote)
 */
export const useGraphStore = create((set, get) => {
  // 저장소 초기화
  const storageMode = 'local'; // 'local' | 'remote'
  const storage = storageMode === 'local' 
    ? createLocalStorageAdapter() 
    : createRemoteAdapter();
  
  const loaded = storage.load && storage.load();
  const initial = loaded || seedCore5();

  // 노드 위치 로드
  let savedPositions = {};
  try {
    const saved = localStorage.getItem('graphNodePositions');
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
    lockedIds: new Set(initial.lockedIds || []),
    savedNodePositions: savedPositions,
    tagsIndex: mergedIndex,

    // === 그래프 데이터 액션 ===
    setGraph: (graph) => {
      set({ graph });
      get().saveToStorage();
    },

    updateNode: (nodeId, patch) => {
      set((state) => ({
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.map((n) =>
            n.id === nodeId ? { ...n, ...patch } : n
          )
        }
      }));
      
      // 태그가 업데이트되면 인덱스 재구축
      if (patch.tags) {
        const updatedNodes = get().graph.nodes.map(n => 
          n.id === nodeId ? { ...n, ...patch } : n
        );
        const updatedIndex = rebuildTagsIndex(updatedNodes);
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

    // === 동심원 고정 액션 ===
    toggleLock: (nodeId) => {
      set((state) => {
        const newLockedIds = new Set(state.lockedIds);
        if (newLockedIds.has(nodeId)) {
          newLockedIds.delete(nodeId);
        } else {
          newLockedIds.add(nodeId);
        }
        return { lockedIds: newLockedIds };
      });
      get().saveToStorage();
    },

    setLockedIds: (lockedIds) => {
      set({ lockedIds: new Set(lockedIds) });
      get().saveToStorage();
    },

    // === 노드 위치 액션 ===
    saveNodePosition: (nodeId, x, y) => {
      set((state) => {
        const newPositions = {
          ...state.savedNodePositions,
          [nodeId]: { x, y }
        };
        
        // localStorage에 저장
        try {
          localStorage.setItem('graphNodePositions', JSON.stringify(newPositions));
        } catch (error) {
          console.error('노드 위치 저장 실패:', error);
        }
        
        return { savedNodePositions: newPositions };
      });
    },

    clearNodePositions: () => {
      set({ savedNodePositions: {} });
      try {
        localStorage.removeItem('graphNodePositions');
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
    saveToStorage: () => {
      const state = get();
      if (state.storage.save) {
        state.storage.save({
          nodes: state.graph.nodes,
          links: state.graph.links,
          nodeStyles: state.nodeStyles,
          lockedIds: Array.from(state.lockedIds)
        });
      }
    },

    clearStorage: () => {
      const state = get();
      if (state.storage.clear) {
        state.storage.clear();
      }
    },

    setStorageMode: (mode) => {
      const newStorage = mode === 'local' 
        ? createLocalStorageAdapter() 
        : createRemoteAdapter();
      set({ storageMode: mode, storage: newStorage });
    }
  };
});
