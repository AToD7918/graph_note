/**
 * 브라우저 스토리지 초기화 스크립트
 * 
 * 개발자 도구 콘솔에서 실행:
 * 1. F12 키를 눌러 개발자 도구 열기
 * 2. Console 탭으로 이동
 * 3. 아래 코드를 복사하여 붙여넣고 Enter
 */

// localStorage 초기화
console.log('?? localStorage 클리어 중...');
localStorage.clear();
console.log('? localStorage 클리어 완료');

// IndexedDB 초기화
console.log('?? IndexedDB 클리어 중...');
const dbName = 'graph-notes-db';
const request = indexedDB.deleteDatabase(dbName);

request.onsuccess = () => {
  console.log('? IndexedDB 삭제 완료');
  console.log('? 페이지를 새로고침하세요 (F5)');
};

request.onerror = (event) => {
  console.error('? IndexedDB 삭제 실패:', event);
};

request.onblocked = () => {
  console.warn('?? IndexedDB가 다른 탭에서 사용 중입니다. 다른 탭을 닫고 다시 시도하세요.');
};
