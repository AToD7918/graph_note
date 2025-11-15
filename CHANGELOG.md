# 레이아웃 알고리즘 변경 (v1.3)

## ? 변경사항 요약

### 동심원 배치 → 계층적 자동 배치로 대체

**이전 (v1.2)**:
- 동심원(Radial) 배치: Core를 중심으로 원형으로 노드 배치
- 정형화된 패턴, 노드가 많을 때 겹침 문제

**이후 (v1.3)**:
- 계층적(Hierarchical) 자동 배치: 트리 구조로 자연스럽게 배치
- 왼쪽→오른쪽 방향으로 계층 구조 시각화
- 가독성 향상, 노드 간 관계가 더 명확

### 주요 개선사항

1. ? **자연스러운 배치**: 정형화된 원형 대신 트리 형태의 자유로운 레이아웃
2. ? **가로 레이어 구조**: Based On(왼쪽) ← Core(중앙) → Cited By(오른쪽)
3. ? **가독성 향상**: 각 레이어 내에서 수직으로 균등 배치되어 겹침 최소화
4. ? **성능 유지**: 기존 최적화 로직(공간 해시 그리드) 모두 유지

---

## ? 변경된 파일

### 1. `src/graph/layout.js`
- `computeRadialAnchors()` → `computeHierarchicalLayout()`로 대체
- 동심원 기반 극좌표 계산 → 계층별 직교좌표 계산
- 레이어 간격: 200px (가로), 노드 간격: 100px (세로)

### 2. `src/App.jsx`
- `radialAnchors` → `hierarchicalAnchors`로 변수명 변경
- 모든 관련 함수 호출 업데이트
- 주석 업데이트: "동심원" → "계층적 자동 배치"

### 3. `src/utils/nodePositionOptimizer.js`
- 함수 파라미터 이름 변경: `radialAnchors` → `hierarchicalAnchors`
- JSDoc 주석 업데이트

### 4. `src/store/graphStore.js`, `src/data/seedData.js`, `src/components/SettingsModal.jsx`
- 주석 및 UI 텍스트 업데이트
- "동심원 고정" → "계층적 자동 배치" 또는 "자동 배치 고정"

---

# 컴포넌트 분리 업데이트 (v1.2)

## ? 변경사항 요약

### 노트 패널 분리 완료!

**Before (v1.1)**:
- `App.jsx`: 497줄 (모든 컴포넌트 포함)
- 노트 패널이 App.jsx 내부 함수로 존재

**After (v1.2)**:
- `App.jsx`: 463줄 (34줄 감소)
- `components/NotePanel.jsx`: 200줄 (새로 분리)

### 장점

1. ? **관심사 분리**: 노트 기능만 독립적으로 관리
2. ? **확장 용이**: 마크다운, 태그, 첨부파일 등 추가 기능 구현 준비 완료
3. ? **재사용 가능**: 다른 프로젝트에서도 NotePanel 컴포넌트 활용 가능
4. ? **테스트 용이**: 독립 컴포넌트로 단위 테스트 작성 가능

---

## ? NotePanel 컴포넌트 상세

### Props 인터페이스

```typescript
interface NotePanelProps {
  selectedNote: {
    id: string;
    title: string;
    note: string;
    group: number;  // 1=Core, 2=Forward, 3=Backward
  } | null;
  
  onClose: () => void;              // 패널 닫기
  onChange: (patch: object) => void; // 노트 업데이트
  isOpen: boolean;                   // 패널 열림 상태
}
```

### 현재 기능

- ? 실시간 노트 편집
- ? 워드 카운트 표시
- ? 마지막 저장 시간 표시
- ? 그룹별 이모지 표시 (? Core, ?? Forward, ?? Backward)
- ? 탭 UI 준비 (Note/Tags/Files)

### 미래 기능 (구현 가이드 포함)

파일 내부에 상세한 JSDoc 주석으로 다음 기능 구현 방법 설명:
1. 마크다운 에디터 (react-markdown)
2. 태그 시스템
3. 첨부파일 업로드 (IndexedDB)
4. 자동 저장 디바운싱 (lodash)
5. 버전 히스토리
6. 검색 및 하이라이트

---

## ?? 업데이트된 파일 구조

```
graph_note/
├── ARCHITECTURE.md              (전체 아키텍처 문서)
├── NOTE_STORAGE_GUIDE.md        (저장 및 확장 가이드) ? NEW!
├── src/
│   ├── App.jsx                  (463줄 - 간소화됨)
│   ├── components/
│   │   └── NotePanel.jsx        (200줄 - 확장 가능) ? NEW!
│   ├── adapters/
│   │   └── storage.js           (UTF-8 보장, 자동 복구)
│   ├── data/
│   │   └── seedData.js          (UTF-8 재저장)
│   ├── graph/
│   │   ├── layout.js
│   │   └── renderers.js
│   ├── hooks/
│   │   └── useMeasure.js
│   └── utils/
│       └── helpers.js
└── index.css                     (커스텀 컴포넌트 클래스 추가)
```

---

## ? 데이터 흐름 (업데이트)

### 노트 편집 흐름

```
1. 사용자가 노드 클릭
   → handleNodeClickWithPosition()
   → setSelectedId(nodeId)
   → 토글 메뉴 표시

2. "Open Note" 버튼 클릭
   → handleOpenNotePanel()
   → setNotePanelOpen(true)
   → NotePanel 컴포넌트 슬라이드 인

3. NotePanel에서 텍스트 입력
   → handleChange() (NotePanel.jsx 내부)
   → setLocalNote() (로컬 상태)
   → onChange() prop 호출
   → updateNote() (App.jsx)
   → setGraph() (전역 상태)
   → useEffect 감지
   → storage.save() (localStorage)
```

### 새 노드 생성 흐름

```
1. "+" 버튼 클릭
   → setShowAdd(true)
   → AddNodeModal 열림

2. 정보 입력 후 "Add" 클릭
   → addNode() (App.jsx 318줄)
   → genId() 호출 (8자리 랜덤 ID)
   → setGraph() (nodes 배열에 추가)
   → setLockedIds() (동심원 고정)
   → useEffect 감지
   → storage.save()
   → localStorage 저장
```

---

## ? CSS 구조 개선

### index.css에 추가된 커스텀 클래스

```css
/* 모달 */
.modal-overlay              - 모달 배경
.modal-content              - 모달 컨텐츠
.modal-content-settings     - 설정 모달
.modal-content-add-node     - 노드 추가 모달

/* 메뉴 */
.context-menu               - 우클릭 메뉴
.preview-menu               - 토글 미리보기

/* 버튼 */
.btn-circular               - 원형 버튼 기본
.btn-settings               - 설정 버튼
.btn-add-node               - 노드 추가 버튼

/* 패널 */
.right-panel-container      - 노트 패널

/* 입력 */
.input-field                - 입력창
.textarea-note              - 노트 텍스트 영역
```

---

## ? 관련 문서

- **ARCHITECTURE.md**: 전체 프로젝트 아키텍처
- **NOTE_STORAGE_GUIDE.md**: 저장 메커니즘 및 확장 가이드
- **README.md**: 프로젝트 소개 및 시작 가이드

---

## ? 다음 단계

### 즉시 가능한 추가 기능 (1주일)

1. **마크다운 지원**
   ```bash
   npm install react-markdown remark-gfm
   ```
   - 에디터/미리보기 토글
   - 문법 하이라이팅
   - GFM 지원 (테이블, 체크박스 등)

2. **태그 시스템**
   - 노드별 태그 추가/삭제
   - 태그 기반 필터링
   - 태그 자동완성

3. **다크/라이트 모드**
   - Tailwind 다크모드 활용
   - 사용자 설정 저장

### 중기 목표 (1개월)

1. **검색 기능**
   - 전체 노트 검색
   - 태그 검색
   - 제목 검색

2. **내보내기**
   - JSON 내보내기
   - Markdown 내보내기
   - CSV 내보내기

3. **키보드 단축키**
   - Ctrl+N: 새 노드
   - Ctrl+S: 강제 저장
   - Ctrl+F: 검색

---

## ? 체크리스트

- [x] 노트 패널 별도 파일로 분리
- [x] UTF-8 인코딩 문제 해결
- [x] CSS 클래스명 의미화
- [x] 워드 카운트 기능
- [x] 저장 시간 표시
- [x] 탭 UI 준비
- [ ] 마크다운 에디터
- [ ] 태그 시스템
- [ ] 첨부파일 업로드
- [ ] 검색 기능
- [ ] 내보내기 기능

---

업데이트: 2025년 1월 4일
버전: v1.2
