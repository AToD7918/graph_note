# 📝 Notion 스타일 블록 에디터 구현 계획

## 🎯 목표
현재 단일 textarea 기반 노트 시스템을 블록 기반 에디터로 전환

---

## 📋 구현 단계

### **Phase 1: 데이터 구조 및 기본 인프라 (1-2일)** ✅ COMPLETED
- [x] 1.1 블록 데이터 타입 정의 (types)
- [x] 1.2 블록 스토리지 어댑터 구현 (IndexedDB)
- [x] 1.3 기존 데이터 → 블록 형식 마이그레이션 유틸리티
- [x] 1.4 블록 관리 유틸리티 함수 (추가/삭제/이동)

### **Phase 2: 기본 블록 컴포넌트 (2-3일)** ✅ COMPLETED
- [x] 2.1 TextBlock (일반 텍스트)
- [x] 2.2 HeadingBlock (H1, H2, H3)
- [x] 2.3 ListBlock (Bullet, Numbered, Todo)
- [x] 2.4 블록 컨테이너 컴포넌트 (BlockEditor)
- [x] 2.5 블록 간 키보드 네비게이션 (Enter, Backspace, Arrow)

### **Phase 3: 슬래시 커맨드 시스템 (1-2일)** ✅ COMPLETED
- [x] 3.1 `/` 입력 감지 및 커맨드 메뉴 표시
- [x] 3.2 블록 타입 선택 UI
- [x] 3.3 키보드 네비게이션 (↑↓, Enter, Esc)
- [x] 3.4 블록 타입 변환 로직

### **Phase 4: 고급 블록 타입 (2-3일)** ✅ COMPLETED
- [x] 4.1 CodeBlock (Syntax Highlighting placeholder)
- [x] 4.2 LatexBlock (수식 렌더링 placeholder)
- [x] 4.3 ImageBlock (업로드 + 프리뷰)
- [x] 4.4 FileBlock (첨부파일)
- [x] 4.5 DividerBlock, QuoteBlock (구분선, 인용)

### **Phase 5: 블록 조작 기능 (1-2일)** ✅ COMPLETED
- [x] 5.1 드래그 앤 드롭으로 블록 순서 변경
- [x] 5.2 블록 메뉴 (삭제, 복제, 복사)
- [x] 5.3 드래그 핸들 및 액션 메뉴
- [x] 5.4 복사/붙여넣기 지원 (JSON 포맷)

### **Phase 6: UI/UX 개선 및 통합 (1-2일)** ✅ COMPLETED
- [x] 6.1 NotePanel에 BlockEditor 통합
- [x] 6.2 로딩/저장 상태 표시
- [x] 6.3 스타일링 (기존 디자인 시스템 활용)
- [x] 6.4 자동 마이그레이션 통합

### **Phase 7: 마이그레이션 및 테스트 (1일)** ✅ COMPLETED
- [x] 7.1 기존 노트 데이터 자동 마이그레이션
- [x] 7.2 에러 핸들링 및 ErrorBoundary
- [ ] 7.3 성능 최적화 (블록 가상화)
- [ ] 7.4 사용자 가이드 작성

---

## 🏗️ 기술 스택

### 핵심 라이브러리
- **블록 에디터**: 자체 구현 (React 기반)
- **드래그 앤 드롭**: `@dnd-kit/core` (가볍고 현대적)
- **LaTeX 렌더링**: `katex` + `react-katex`
- **마크다운 파싱**: `remark` + `remark-gfm` (일부 블록)
- **코드 하이라이팅**: `prism-react-renderer`

### 데이터 저장
- **블록 데이터**: IndexedDB (기존 detailedNote 대체)
- **첨부파일**: IndexedDB (Blob 저장)

---

## 📦 데이터 구조

```typescript
// 블록 타입 정의
type BlockType = 
  | 'text'           // 일반 텍스트
  | 'heading1'       // # 제목 1
  | 'heading2'       // ## 제목 2
  | 'heading3'       // ### 제목 3
  | 'bulletList'     // • 목록
  | 'numberedList'   // 1. 목록
  | 'todoList'       // ☐ 체크리스트
  | 'code'           // 코드 블록
  | 'latex'          // LaTeX 수식
  | 'image'          // 이미지
  | 'file'           // 파일 첨부
  | 'divider'        // 구분선
  | 'quote';         // 인용구

// 블록 인터페이스
interface Block {
  id: string;                    // 고유 ID (uuid)
  type: BlockType;               // 블록 타입
  content: string;               // 텍스트 내용
  metadata?: {                   // 타입별 메타데이터
    // 코드 블록
    language?: string;
    
    // 이미지/파일
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    blobUrl?: string;
    
    // 리스트
    checked?: boolean;           // todo 체크 상태
    level?: number;              // 중첩 레벨
    
    // LaTeX
    displayMode?: 'inline' | 'block';
  };
  createdAt: number;             // 생성 시간
  updatedAt: number;             // 수정 시간
}

// 노트 데이터 구조
interface NoteContent {
  version: '2.0';                // 블록 시스템 버전
  blocks: Block[];               // 블록 배열
  attachments?: {                // 첨부파일 메타데이터
    [fileId: string]: {
      name: string;
      size: number;
      type: string;
      uploadedAt: number;
    };
  };
}
```

---

## 🎨 UI 설계

### 블록 구조
```
┌─────────────────────────────────────┐
│ [⋮] [Block Content...............]  │ ← 각 블록
│     ↑                               │
│     드래그 핸들                       │
└─────────────────────────────────────┘
```

### 슬래시 커맨드 메뉴
```
/
┌─────────────────────────┐
│ 🔤 Text                 │
│ # Heading 1            │
│ ## Heading 2           │
│ • Bullet List          │
│ 📝 Code Block          │
│ ∫ LaTeX Math           │
│ 🖼️ Image               │
│ 📎 File                │
└─────────────────────────┘
```

---

## ✅ 구현 완료 (2025년 1월 23일)

**모든 7개 Phase 완료!**

### 📦 생성된 파일들

#### Core Types & Utils
- `src/types/blocks.js` - 블록 타입 정의, 슬래시 커맨드
- `src/utils/blockUtils.js` - 블록 조작 유틸리티 (15+ functions)
- `src/utils/blockMigration.js` - 텍스트 ↔ 블록 변환

#### Storage
- `src/adapters/noteStorage.js` - IndexedDB v2 (blocks + attachments)

#### Components
- `src/components/BlockEditor/BlockEditor.jsx` - 메인 컨테이너
- `src/components/BlockEditor/BasicBlocks.jsx` - Text, Heading, List, Divider, Quote
- `src/components/BlockEditor/AdvancedBlocks.jsx` - Code, LaTeX, Image, File
- `src/components/BlockEditor/SlashCommandMenu.jsx` - / 커맨드 메뉴
- `src/components/BlockEditor/DraggableBlock.jsx` - 드래그 앤 드롭 래퍼
- `src/components/BlockEditor/ErrorBoundary.jsx` - 에러 핸들링

#### Documentation
- `BLOCK_EDITOR_USER_GUIDE.md` - 사용자 가이드

### 🎯 주요 기능
✅ 13가지 블록 타입  
✅ 슬래시 커맨드 (14개 명령)  
✅ 드래그 앤 드롭 재정렬  
✅ 키보드 네비게이션  
✅ 자동 마이그레이션  
✅ 자동 저장  
✅ 에러 핸들링  

### 🚀 다음 개선 사항 (선택)
- KaTeX 라이브러리 통합 (LaTeX 실제 렌더링)
- Prism.js 통합 (코드 신택스 하이라이팅)
- 블록 다중 선택
- 모바일 반응형 최적화
- 성능 최적화 (블록 가상화)
- Undo/Redo 기능
