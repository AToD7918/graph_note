# 📝 Notion 스타일 블록 에디터 구현 계획

## 🎯 목표
현재 단일 textarea 기반 노트 시스템을 블록 기반 에디터로 전환

---

## 📋 구현 단계

### **Phase 1: 데이터 구조 및 기본 인프라 (1-2일)**
- [ ] 1.1 블록 데이터 타입 정의 (types)
- [ ] 1.2 블록 스토리지 어댑터 구현 (IndexedDB)
- [ ] 1.3 기존 데이터 → 블록 형식 마이그레이션 유틸리티
- [ ] 1.4 블록 관리 유틸리티 함수 (추가/삭제/이동)

### **Phase 2: 기본 블록 컴포넌트 (2-3일)**
- [ ] 2.1 TextBlock (일반 텍스트)
- [ ] 2.2 HeadingBlock (H1, H2, H3)
- [ ] 2.3 ListBlock (Bullet, Numbered, Todo)
- [ ] 2.4 블록 컨테이너 컴포넌트 (BlockEditor)
- [ ] 2.5 블록 간 키보드 네비게이션 (Enter, Backspace, Arrow)

### **Phase 3: 슬래시 커맨드 시스템 (1-2일)**
- [ ] 3.1 `/` 입력 감지 및 커맨드 메뉴 표시
- [ ] 3.2 블록 타입 선택 UI
- [ ] 3.3 키보드 네비게이션 (↑↓, Enter, Esc)
- [ ] 3.4 블록 타입 변환 로직

### **Phase 4: 고급 블록 타입 (2-3일)**
- [ ] 4.1 CodeBlock (Syntax Highlighting)
- [ ] 4.2 LatexBlock (수식 렌더링)
- [ ] 4.3 ImageBlock (업로드 + 프리뷰)
- [ ] 4.4 FileBlock (첨부파일)
- [ ] 4.5 DividerBlock (구분선)

### **Phase 5: 블록 조작 기능 (1-2일)**
- [ ] 5.1 드래그 앤 드롭으로 블록 순서 변경
- [ ] 5.2 블록 왼쪽 핸들 메뉴 (삭제, 복제, 타입 변경)
- [ ] 5.3 블록 선택 및 다중 선택
- [ ] 5.4 복사/붙여넣기 지원

### **Phase 6: UI/UX 개선 및 통합 (1-2일)**
- [ ] 6.1 NotePanel에 BlockEditor 통합
- [ ] 6.2 로딩/저장 상태 표시
- [ ] 6.3 스타일링 및 애니메이션
- [ ] 6.4 모바일 반응형 대응

### **Phase 7: 마이그레이션 및 테스트 (1일)**
- [ ] 7.1 기존 노트 데이터 자동 마이그레이션
- [ ] 7.2 에러 핸들링 및 fallback
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

## 🚀 시작

**현재 단계: Phase 1 - 데이터 구조 및 기본 인프라**

다음 작업:
1. 블록 타입 정의 파일 생성
2. 블록 스토리지 어댑터 구현
3. 마이그레이션 유틸리티 작성
