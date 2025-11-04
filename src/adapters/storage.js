/**
 * 저장소 어댑터 (Adapter Pattern)
 * 
 * ? 이 파일의 역할:
 * - 데이터 저장/로드 방식을 추상화
 * - 로컬 저장소와 원격 서버 간 쉽게 전환 가능
 * 
 * ? 디자인 패턴: Adapter Pattern
 * - 다른 저장소(localStorage, 서버 API 등)를 동일한 인터페이스로 사용
 * - 나중에 서버 연동 시 코드 변경 최소화
 */

/**
 * 로컬 스토리지 어댑터
 * 
 * @param {string} key - localStorage에 저장할 키 이름 (기본: 'graph-notes-v1')
 * @returns {Object} 저장소 어댑터 객체 (load, save, clear 메서드 포함)
 * 
 * ? localStorage란?
 * - 브라우저에 데이터를 영구 저장하는 Web API
 * - 브라우저를 닫아도 데이터가 유지됨
 * - 최대 5-10MB 저장 가능 (브라우저마다 다름)
 * - 문자열만 저장 가능 → JSON으로 변환 필요
 */
export function createLocalStorageAdapter(key = 'graph-notes-v1') {
  return {
    // 어댑터 타입 식별자
    mode: 'local',
    
    /**
     * 저장된 데이터 불러오기
     * 
     * @returns {Object|null} 파싱된 그래프 데이터 또는 null (데이터 없음/에러 시)
     * 
     * 처리 과정:
     * 1. localStorage에서 문자열 데이터 가져오기
     * 2. JSON 문자열을 JavaScript 객체로 파싱
     * 3. UTF-8 유효성 검사 (한글 깨짐 방지)
     * 4. 에러 발생 시 null 반환 (초기 데이터 사용)
     */
    load() {
      try {
        const raw = localStorage.getItem(key);  // 문자열로 저장된 데이터 가져오기
        if (!raw) return null;
        
        const data = JSON.parse(raw);           // JSON → 객체 변환
        
        // 💡 UTF-8 유효성 검사: 한글이 깨졌는지 확인
        // 한글이 "���"처럼 깨진 경우 데이터 무효화
        const testString = JSON.stringify(data);
        if (testString.includes('�') || testString.includes('\\ufffd')) {
          console.warn('⚠️ UTF-8 인코딩 오류 감지. localStorage 초기화 필요.');
          localStorage.removeItem(key);  // 손상된 데이터 삭제
          return null;
        }
        
        return data;
      } catch (err) {
        // 파싱 에러 또는 데이터 손상 시
        console.error('❌ localStorage 데이터 로드 실패:', err);
        localStorage.removeItem(key);  // 손상된 데이터 삭제
        return null;
      }
    },
    
    /**
     * 데이터 저장하기
     * 
     * @param {Object} payload - 저장할 그래프 데이터 (nodes, links, nodeStyles, lockedIds)
     * 
     * 저장 내용:
     * {
     *   nodes: [...],      // 모든 노드 정보
     *   links: [...],      // 모든 링크 정보
     *   nodeStyles: {...}, // 노드별 스타일
     *   lockedIds: [...]   // 고정된 노드 목록
     * }
     * 
     * 💡 UTF-8 보장:
     * - JSON.stringify는 기본적으로 UTF-8 호환
     * - 한글, 이모지 등 모든 유니코드 문자 안전하게 저장
     */
    save(payload) {
      try {
        // 객체 → JSON 문자열 변환 (UTF-8 자동 처리)
        const jsonString = JSON.stringify(payload, null, 2);  // 들여쓰기로 가독성 향상
        localStorage.setItem(key, jsonString);
        
        // 디버깅: 저장 확인
        console.log('✅ 데이터 저장 완료 (UTF-8)');
      } catch (err) {
        // 저장 실패 시 (용량 초과, 권한 없음 등)
        console.error('❌ localStorage 저장 실패:', err);
      }
    },
    
    /**
     * 저장된 모든 데이터 삭제
     * 
     * 사용처: Settings 모달의 "Clear Local Cache" 버튼
     */
    clear() {
      try {
        localStorage.removeItem(key);  // 해당 키의 데이터만 삭제
      } catch (err) {
        console.error('Failed to clear localStorage:', err);
      }
    }
  };
}

/**
 * 원격 저장소 어댑터 (향후 구현 예정)
 * 
 * @returns {Object} 원격 저장소 어댑터 (현재는 placeholder)
 * 
 * ? 향후 구현 계획:
 * - REST API 연동 (fetch 사용)
 * - WebSocket 실시간 동기화
 * - 여러 기기 간 데이터 공유
 * 
 * ? 구현 시 유의사항:
 * - 인증/인가 처리 (JWT 토큰 등)
 * - 네트워크 에러 처리
 * - 낙관적 업데이트 (Optimistic Update)
 * - 충돌 해결 전략 (Conflict Resolution)
 */
export function createRemoteAdapter() {
  return {
    mode: 'remote',
    
    // 모든 메서드가 async (비동기)
    async load() {
      console.warn('[RemoteAdapter] not implemented');
      // 향후: await fetch('/api/graph/load')
      return null;
    },
    
    async save(payload) {
      console.warn('[RemoteAdapter] not implemented', payload);
      // 향후: await fetch('/api/graph/save', { method: 'POST', body: JSON.stringify(payload) })
    },
    
    async clear() {
      console.warn('[RemoteAdapter] not implemented');
      // 향후: await fetch('/api/graph/clear', { method: 'DELETE' })
    }
  };
}
