/**
 * 노트 저장소 - IndexedDB 기반
 * 
 * ? 역할:
 * - 상세 노트 내용을 IndexedDB에 개별 저장
 * - 노트가 열릴 때만 로드 (Lazy Loading)
 * - 대용량 데이터 처리 (수백 MB 가능)
 * 
 * ? 데이터 흐름:
 * localStorage: 그래프 메타데이터 + 요약 (summary)
 * IndexedDB: 상세 노트 내용 (detailedNote)
 */

const DB_NAME = 'graph-notes-db';
const DB_VERSION = 1;
const STORE_NAME = 'notes';

/**
 * IndexedDB 초기화
 * @returns {Promise<IDBDatabase>} IndexedDB 데이터베이스 연결
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    // 데이터베이스 구조 생성 (최초 1회)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 'notes' 저장소 생성 (이미 있으면 무시)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // 인덱스 생성 (빠른 검색용)
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        
        console.log('? IndexedDB 저장소 생성 완료');
      }
    };
  });
}

/**
 * 노트 상세 내용 저장
 * 
 * @param {string} nodeId - 노드 ID
 * @param {string} detailedNote - 상세 노트 내용
 * @returns {Promise<void>}
 * @param {string} detailedNote - 상세 노트 내용
 * @returns {Promise<void>}
 */
export async function saveNoteDetail(nodeId, detailedNote) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const noteData = {
      id: nodeId,
      detailedNote: detailedNote,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // 기존 데이터가 있으면 updatedAt만 갱신
    const existingData = await new Promise((resolve) => {
      const getRequest = store.get(nodeId);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => resolve(null);
    });
    
    if (existingData) {
      noteData.createdAt = existingData.createdAt;
    }
    
    store.put(noteData);
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    
    console.log(`? 노트 저장 완료: ${nodeId}`);
  } catch (error) {
    console.error('? IndexedDB 저장 실패:', error);
    throw error;
  }
}

/**
 * 노트 상세 내용 불러오기
 * 
 * @param {string} nodeId - 노드 ID
 * @returns {Promise<string|null>} 상세 노트 내용 또는 null
 */
export async function loadNoteDetail(nodeId) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const result = await new Promise((resolve, reject) => {
      const request = store.get(nodeId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (result) {
      console.log(`? 노트 로드 완료: ${nodeId}`);
      return result.detailedNote || '';
    }
    
    return null;
  } catch (error) {
    console.error('? IndexedDB 로드 실패:', error);
    return null;
  }
}

/**
 * 노트 삭제
 * 
 * @param {string} nodeId - 노드 ID
 * @returns {Promise<void>}
 */
export async function deleteNoteDetail(nodeId) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.delete(nodeId);
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    
    console.log(`? 노트 삭제 완료: ${nodeId}`);
  } catch (error) {
    console.error('? IndexedDB 삭제 실패:', error);
    throw error;
  }
}

/**
 * 모든 노트 삭제 (초기화)
 * 
 * @returns {Promise<void>}
 */
export async function clearAllNotes() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.clear();
    
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    
    console.log('? 모든 노트 삭제 완료');
  } catch (error) {
    console.error('? IndexedDB 초기화 실패:', error);
    throw error;
  }
}

/**
 * 초기 시드 데이터를 IndexedDB에 저장
 * 
 * @param {Object} detailedNotes - { nodeId: detailedNote } 형태의 객체
 * @returns {Promise<void>}
 */
export async function initializeSeedNotes(detailedNotes) {
  try {
    // 이미 데이터가 있는지 확인
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const count = await new Promise((resolve) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
    
    // 데이터가 이미 있으면 초기화 건너뛰기
    if (count > 0) {
      console.log('? IndexedDB에 이미 데이터가 있습니다. 초기화 건너뛰기');
      return;
    }
    
    // detailedNotes 객체의 각 항목을 저장
    for (const [nodeId, detailedNote] of Object.entries(detailedNotes)) {
      await saveNoteDetail(nodeId, detailedNote);
    }
    
    console.log('? 초기 시드 노트 저장 완료');
  } catch (error) {
    console.error('? 시드 노트 초기화 실패:', error);
  }
}
