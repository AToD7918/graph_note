# 노드 저장 및 노트 패널 가이드

## ? 새 노드는 어디에 저장되나요?

### 저장 흐름도

```
사용자가 "+" 버튼 클릭
    ↓
AddNodeModal 열림 (제목, 그룹, 연결 정보 입력)
    ↓
"Add" 버튼 클릭 → addNode() 함수 실행
    ↓
1. genId()로 랜덤 ID 생성 (예: 'a7b3f9e2')
2. setGraph()로 graph.nodes 배열에 추가
3. setLockedIds()로 동심원 고정 목록에 추가
    ↓
useEffect가 graph 상태 변경 감지 (App.jsx 296줄)
    ↓
storage.save() 자동 호출
    ↓
localStorage에 JSON 저장
    ↓
브라우저 재시작 후에도 데이터 유지
```

### 저장 위치

**1. 메모리 (실행 중)**
```javascript
// App.jsx의 State
const [graph, setGraph] = useState({
  nodes: [...],  // 모든 노드 정보
  links: [...]   // 모든 연결 정보
});
```

**2. 브라우저 localStorage (영구 저장)**
```javascript
// 키: 'graph-notes-v1'
// 위치: 브라우저 내부 저장소

{
  "nodes": [
    {
      "id": "a7b3f9e2",
      "title": "새 논문 제목",
      "group": 2,
      "note": "여기에 작성한 노트 내용"
    }
  ],
  "links": [...],
  "nodeStyles": {...},
  "lockedIds": [...]
}
```

**확인 방법**:
1. 브라우저에서 `F12` → `Application` 탭
2. `Local Storage` → `http://localhost:5173`
3. `graph-notes-v1` 키 확인

### 데이터 구조

```javascript
// 새 노드 객체
{
  id: 'a7b3f9e2',           // 고유 ID (genId()로 생성)
  title: '새 논문 제목',     // 사용자 입력
  group: 2,                 // 1=Core, 2=Forward, 3=Backward
  note: ''                  // 초기값은 빈 문자열
}
```

---

## ? 노트 패널 분리 완료!

### 변경 사항

**Before** (App.jsx에 모든 코드):
```jsx
// App.jsx에 RightPanel 함수 정의 (~30줄)
function RightPanel({ selectedNote, onClose, onChange }) {
  // ... 복잡한 UI 코드
}
```

**After** (별도 파일로 분리):
```jsx
// src/components/NotePanel.jsx (새 파일)
export function NotePanel({ selectedNote, onClose, onChange, isOpen }) {
  // 확장 가능한 구조
  // 마크다운, 태그, 첨부파일 등 추가 예정
}

// App.jsx (간결해짐)
import { NotePanel } from './components/NotePanel';

<NotePanel
  selectedNote={selectedNote}
  onClose={() => setNotePanelOpen(false)}
  onChange={updateNote}
  isOpen={notePanelOpen}
/>
```

### 새 NotePanel의 기능

#### ? 현재 구현된 기능

1. **노트 편집**
   - 실시간 텍스트 편집
   - 자동 저장 (변경 즉시 localStorage 저장)

2. **메타 정보 표시**
   - 노드 ID
   - 그룹 (Core/Forward/Backward) 이모지 표시
   - 워드 카운트
   - 마지막 저장 시간

3. **탭 UI 준비**
   - ? Note (활성)
   - ?? Tags (준비 중)
   - ? Files (준비 중)

#### ? 미래 확장 계획 (구현 가이드 포함)

**1. 마크다운 지원**
```bash
npm install react-markdown remark-gfm
```

```jsx
// NotePanel.jsx에 추가
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'preview' | 'split'

{viewMode === 'preview' && (
  <div className="prose prose-invert">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {localNote}
    </ReactMarkdown>
  </div>
)}
```

**2. 태그 시스템**
```jsx
// 데이터 구조
{
  id: 'abc123',
  title: '논문 제목',
  note: '내용',
  tags: ['machine-learning', 'nlp', 'transformer']  // 새로 추가
}

// 컴포넌트
const [tags, setTags] = useState(selectedNote.tags || []);

const addTag = (tag) => {
  const newTags = [...tags, tag];
  setTags(newTags);
  onChange({ tags: newTags });
};

<div className="flex flex-wrap gap-2">
  {tags.map(tag => (
    <span key={tag} className="px-2 py-1 bg-teal-500/20 rounded text-xs">
      #{tag}
      <button onClick={() => removeTag(tag)}>×</button>
    </span>
  ))}
  <input 
    placeholder="Add tag..."
    onKeyPress={(e) => {
      if (e.key === 'Enter') {
        addTag(e.target.value);
        e.target.value = '';
      }
    }}
  />
</div>
```

**3. 첨부파일 업로드**
```bash
npm install localforage  # IndexedDB 래퍼
```

```jsx
import localforage from 'localforage';

const handleFileUpload = async (file) => {
  // Base64 인코딩 (소용량) 또는 IndexedDB (대용량)
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    
    // IndexedDB에 저장
    await localforage.setItem(`file-${selectedNote.id}-${file.name}`, {
      name: file.name,
      type: file.type,
      data: dataUrl,
      size: file.size,
      uploadedAt: new Date()
    });
    
    // 노드에 첨부파일 목록 추가
    onChange({
      attachments: [
        ...(selectedNote.attachments || []),
        { name: file.name, size: file.size }
      ]
    });
  };
  reader.readAsDataURL(file);
};

<input 
  type="file"
  onChange={(e) => handleFileUpload(e.target.files[0])}
  accept=".pdf,.png,.jpg"
/>
```

**4. 자동 저장 표시 (디바운싱)**
```bash
npm install lodash
```

```jsx
import { debounce } from 'lodash';

const debouncedSave = useMemo(
  () => debounce((value) => {
    onChange({ note: value });
    setLastSaved(new Date());
    setSaveStatus('saved');
  }, 1000),  // 1초 대기
  [onChange]
);

const handleChange = (e) => {
  const newValue = e.target.value;
  setLocalNote(newValue);
  setSaveStatus('saving...');
  debouncedSave(newValue);
};

// UI
<div className="text-xs">
  {saveStatus === 'saving...' && '? Saving...'}
  {saveStatus === 'saved' && '? Saved'}
</div>
```

**5. 버전 히스토리**
```jsx
// 데이터 구조
{
  id: 'abc123',
  note: '현재 내용',
  history: [
    {
      version: 1,
      content: '이전 버전 1',
      timestamp: '2025-01-01T12:00:00Z',
      author: 'user1'
    },
    {
      version: 2,
      content: '이전 버전 2',
      timestamp: '2025-01-02T14:30:00Z',
      author: 'user1'
    }
  ]
}

// 컴포넌트
const saveVersion = () => {
  const newHistory = [
    ...(selectedNote.history || []),
    {
      version: (selectedNote.history?.length || 0) + 1,
      content: localNote,
      timestamp: new Date().toISOString()
    }
  ];
  onChange({ history: newHistory });
};

// UI - 히스토리 목록
<div className="history-panel">
  {selectedNote.history?.map(h => (
    <div key={h.version} onClick={() => setLocalNote(h.content)}>
      <div>Version {h.version}</div>
      <div>{new Date(h.timestamp).toLocaleString()}</div>
    </div>
  ))}
</div>
```

**6. 검색 및 하이라이트**
```jsx
const [searchQuery, setSearchQuery] = useState('');

const highlightText = (text, query) => {
  if (!query) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i} className="bg-yellow-300 text-black">{part}</mark>
      : part
  );
};

<input 
  placeholder="Search in note..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
```

---

## ? 현재 파일 구조

```
src/
├── App.jsx                    (메인 앱 - 463줄 → 더 간결해짐)
├── components/
│   └── NotePanel.jsx          (노트 패널 - 200줄, 확장 가능) ? NEW!
├── adapters/
│   └── storage.js             (저장소 - UTF-8 보장)
├── data/
│   └── seedData.js            (초기 데이터)
├── graph/
│   ├── layout.js              (레이아웃 알고리즘)
│   └── renderers.js           (Canvas 렌더링)
├── hooks/
│   └── useMeasure.js          (크기 감지)
└── utils/
    └── helpers.js             (유틸리티)
```

---

## ? 새 기능 추가 방법

### 1단계: 데이터 구조 확장
```javascript
// App.jsx의 addNode() 함수 수정
const addNode = () => {
  const id = genId();
  setGraph((g)=>({
    nodes: [...g.nodes, { 
      id, 
      group: Number(addForm.group)||2, 
      title: addForm.title||'Untitled', 
      note: '',
      tags: [],              // ? 새로 추가
      attachments: [],       // ? 새로 추가
      history: []            // ? 새로 추가
    }],
    links: [...]
  }));
};
```

### 2단계: NotePanel에 UI 추가
```jsx
// components/NotePanel.jsx에 탭 추가
const [activeTab, setActiveTab] = useState('note');

<div className="tabs">
  <button onClick={() => setActiveTab('note')}>? Note</button>
  <button onClick={() => setActiveTab('tags')}>?? Tags</button>
  <button onClick={() => setActiveTab('files')}>? Files</button>
</div>

{activeTab === 'note' && <NoteEditor />}
{activeTab === 'tags' && <TagManager />}
{activeTab === 'files' && <FileManager />}
```

### 3단계: storage.js는 자동 처리
```javascript
// 아무 수정 없어도 됨!
// JSON.stringify가 새 필드를 자동으로 저장
storage.save({ 
  nodes: [{ id, title, note, tags, attachments, ... }],
  ...
});
```

---

## ? 디버깅 팁

### localStorage 확인
```javascript
// 브라우저 콘솔에서 실행
const data = JSON.parse(localStorage.getItem('graph-notes-v1'));
console.log(data);
```

### 특정 노드 찾기
```javascript
const node = data.nodes.find(n => n.id === 'abc123');
console.log(node);
```

### 저장 내용 초기화
```javascript
localStorage.removeItem('graph-notes-v1');
location.reload();
```

---

## ? 요약

1. **새 노드 저장 위치**
   - 실행 중: `App.jsx`의 `graph` state
   - 영구 저장: `localStorage['graph-notes-v1']`
   - 자동 저장: 상태 변경 시 즉시

2. **노트 패널 분리 완료**
   - 파일: `src/components/NotePanel.jsx`
   - 장점: 독립적 기능 추가 용이
   - 현재: 기본 편집 + 메타 정보
   - 미래: 마크다운, 태그, 첨부파일 등

3. **확장 준비 완료**
   - 명확한 props 인터페이스
   - 상세한 구현 가이드 포함
   - 모듈화된 구조

이제 노트 패널에 원하는 기능을 자유롭게 추가할 수 있습니다! ?
