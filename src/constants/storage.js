/**
 * 저장소 관련 상수
 * 
 * localStorage, IndexedDB 키 및 설정
 */

// localStorage 키
export const STORAGE_KEYS = {
  GRAPH_DATA: 'graph-notes-v1',
  NODE_POSITIONS: 'graphNodePositions',
  TAGS_INDEX: 'graph-notes-tags-index-v1',
};

// IndexedDB 설정
export const INDEXED_DB = {
  NAME: 'graph-notes-db',
  VERSION: 1,
  STORE_NAME: 'notes',
  INDEXES: {
    UPDATED_AT: 'updatedAt',
    CREATED_AT: 'createdAt',
  },
};

// 저장소 모드
export const STORAGE_MODE = {
  LOCAL: 'local',
  REMOTE: 'remote',
};

// 데이터 검증
export const DATA_VALIDATION = {
  MIN_NODES: 5,
  MIN_LINKS: 4,
};
