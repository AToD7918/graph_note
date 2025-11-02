/**
 * 저장소 어댑터
 * Local Storage와 Remote Storage 간 전환 가능
 */

/**
 * 로컬 스토리지 어댑터
 * @param {string} key - localStorage 키
 */
export function createLocalStorageAdapter(key = 'graph-notes-v1') {
  return {
    mode: 'local',
    load() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    save(payload) {
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.error('Failed to clear localStorage:', err);
      }
    }
  };
}

/**
 * 원격 저장소 어댑터 (향후 구현)
 */
export function createRemoteAdapter() {
  return {
    mode: 'remote',
    async load() {
      console.warn('[RemoteAdapter] not implemented');
      return null;
    },
    async save(payload) {
      console.warn('[RemoteAdapter] not implemented', payload);
    },
    async clear() {
      console.warn('[RemoteAdapter] not implemented');
    }
  };
}
