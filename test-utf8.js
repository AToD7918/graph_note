/**
 * UTF-8 인코딩 테스트 스크립트
 * 
 * 사용 방법:
 * 1. 브라우저 개발자 도구(F12) 열기
 * 2. Console 탭으로 이동
 * 3. 이 파일의 코드를 복사하여 실행
 */

// 1. localStorage UTF-8 테스트
console.log('=== localStorage UTF-8 테스트 ===');
const testData = {
  korean: '한글 테스트',
  emoji: '? ? ?',
  mixed: '한글 + English + 123 + ?'
};

localStorage.setItem('utf8-test', JSON.stringify(testData));
const loaded = JSON.parse(localStorage.getItem('utf8-test'));
console.log('저장된 데이터:', loaded);
console.log('한글 확인:', loaded.korean === '한글 테스트' ? '? 정상' : '? 깨짐');
console.log('이모지 확인:', loaded.emoji === '? ? ?' ? '? 정상' : '? 깨짐');

// 2. IndexedDB UTF-8 테스트
console.log('\n=== IndexedDB UTF-8 테스트 ===');

const testIndexedDB = async () => {
  const request = indexedDB.open('utf8-test-db', 1);
  
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    db.createObjectStore('test', { keyPath: 'id' });
  };
  
  request.onsuccess = async (e) => {
    const db = e.target.result;
    
    // 저장
    const testNote = {
      id: 'test-1',
      content: `# 한글 제목

## 테스트 내용
- 한글 리스트 1
- 한글 리스트 2
- 이모지: ? ? ?

**굵게** _기울임_ \`코드\`

향후 연구 방향...`
    };
    
    const tx = db.transaction(['test'], 'readwrite');
    const store = tx.objectStore('test');
    await store.put(testNote);
    
    // 로드
    const tx2 = db.transaction(['test'], 'readonly');
    const store2 = tx2.objectStore('test');
    const getRequest = store2.get('test-1');
    
    getRequest.onsuccess = () => {
      const result = getRequest.result;
      console.log('IndexedDB 저장된 데이터:', result);
      console.log('한글 확인:', result.content.includes('한글 제목') ? '? 정상' : '? 깨짐');
      console.log('이모지 확인:', result.content.includes('?') ? '? 정상' : '? 깨짐');
    };
  };
};

testIndexedDB();

// 3. 현재 graph-notes-db 확인
console.log('\n=== 실제 graph-notes-db 확인 ===');
const checkActualDB = async () => {
  const request = indexedDB.open('graph-notes-db', 1);
  
  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction(['notes'], 'readonly');
    const store = tx.objectStore('notes');
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = () => {
      const notes = getAllRequest.result;
      console.log('저장된 노트 개수:', notes.length);
      
      notes.forEach(note => {
        console.log(`\n[${note.id}]`);
        console.log('내용 미리보기:', note.detailedNote.substring(0, 100));
        console.log('한글 포함:', note.detailedNote.match(/[\u3131-\u314e\u314f-\u3163\uac00-\ud7a3]/g) ? '? 있음' : '? 없음');
      });
    };
  };
};

checkActualDB();

console.log('\n=== 테스트 완료 ===');
console.log('위 결과를 확인하여 UTF-8 인코딩 상태를 점검하세요.');
