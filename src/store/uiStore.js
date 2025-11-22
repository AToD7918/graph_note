import { create } from 'zustand';
import { NOTE_PANEL, ZOOM, GRAPH_VIEW_MODE, COLOR_HISTORY } from '../constants/ui';

/**
 * UI 상태 스토어
 * 
 * 책임:
 * - 선택된 노드 관리
 * - 노트 패널 상태
 * - 모달 상태
 * - 컨텍스트 메뉴 상태
 * - 미리보기 메뉴 상태
 * - 줄 레벨
 * - 그래프 뷰 모드
 * - 커스텀 색상 히스토리
 * 
 * @returns {import('../types').UIStore}
 */
export const useUIStore = create((set) => ({
  // === 상태 ===
  selectedId: null,
  notePanelOpen: false,
  panelWidth: Math.max(NOTE_PANEL.MIN_WIDTH, window.innerWidth * NOTE_PANEL.DEFAULT_WIDTH_RATIO),
  
  showSettings: false,
  showAddNode: false,
  
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    nodeId: null
  },
  
  previewMenu: {
    visible: false,
    x: 0,
    y: 0
  },
  
  zoomLevel: ZOOM.DEFAULT,
  graphViewMode: GRAPH_VIEW_MODE.RELATIONSHIP,
  
  customColorHistory: [],
  
  // === 링크 생성 상태 ===
  linkCreationMode: false,
  sourceLinkNode: null,

  // === 선택/패널 액션 ===
  setSelectedId: (id) => set({ selectedId: id }),
  
  openNotePanel: () => set({ notePanelOpen: true, previewMenu: { visible: false, x: 0, y: 0 } }),
  
  closeNotePanel: () => set({ notePanelOpen: false, selectedId: null }),
  
  setPanelWidth: (width) => set({ panelWidth: width }),

  // === 모달 액션 ===
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
  
  openAddNode: () => set({ showAddNode: true }),
  closeAddNode: () => set({ showAddNode: false }),

  // === 컨텍스트 메뉴 액션 ===
  showContextMenu: (x, y, nodeId) => set({
    contextMenu: { visible: true, x, y, nodeId }
  }),
  
  hideContextMenu: () => set((state) => ({
    contextMenu: { ...state.contextMenu, visible: false }
  })),

  // === 미리보기 메뉴 액션 ===
  showPreviewMenu: (x, y) => set({
    previewMenu: { visible: true, x, y }
  }),
  
  hidePreviewMenu: () => set({
    previewMenu: { visible: false, x: 0, y: 0 }
  }),
  
  closeAllMenus: () => set({
    previewMenu: { visible: false, x: 0, y: 0 },
    contextMenu: { visible: false, x: 0, y: 0, nodeId: null }
  }),

  // === 노드 클릭 핸들러 (통합) ===
  handleNodeClick: (nodeId, x, y) => {
    set({
      selectedId: nodeId,
      previewMenu: { visible: true, x, y }
    });
  },

  // === 줌 액션 ===
  setZoomLevel: (level) => set({ zoomLevel: level }),

  // === 뷰 모드 액션 ===
  setGraphViewMode: (mode) => set({ graphViewMode: mode }),

  // === 커스텀 색상 액션 ===
  addCustomColor: (color) => set((state) => {
    const filtered = state.customColorHistory.filter((c) => c !== color);
    const newHistory = [color, ...filtered];
    return { customColorHistory: newHistory.slice(0, COLOR_HISTORY.MAX_COLORS) };
  }),

  // === 링크 생성 액션 ===
  startLinkCreation: (nodeId) => set({ 
    linkCreationMode: true, 
    sourceLinkNode: nodeId 
  }),
  
  cancelLinkCreation: () => set({ 
    linkCreationMode: false, 
    sourceLinkNode: null 
  })
}));
