# Graph Note 프로젝트 아키텍처 문서

## ? 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [전체 데이터 흐름](#전체-데이터-흐름)
3. [파일별 상세 역할](#파일별-상세-역할)
4. [핵심 알고리즘](#핵심-알고리즘)
5. [상태 관리 전략](#상태-관리-전략)
6. [미래 확장 계획](#미래-확장-계획)
7. [추천 개발 가이드](#추천-개발-가이드)

---

## 프로젝트 개요

### ? 목표
연구 논문 간의 관계를 **그래프 형태로 시각화**하고, 각 논문(노드)에 대한 노트를 작성/관리하는 웹 애플리케이션

### ?? 기술 스택
- **React 19.1.1**: UI 프레임워크
- **react-force-graph-2d 1.29.0**: Canvas 기반 그래프 시각화
- **Tailwind CSS v3**: 스타일링
- **Vite 7.1.12**: 개발 서버 및 빌드 도구
- **localStorage API**: 브라우저 기반 데이터 영속성

### ? 주요 기능
1. **동적 그래프 시각화**: 동심원 레이아웃 + Force-Directed 시뮬레이션
2. **노드 커스터마이징**: 크기, 모양, 색상, 강조 효과
3. **노트 작성/편집**: 우측 슬라이딩 패널
4. **컨텍스트 메뉴**: 우클릭으로 노드 스타일 변경
5. **레이아웃 전환**: 동심원 고정(Radial) ↔ 자유 이동(Force)

---

## 전체 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                     ? 브라우저 (사용자)                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    ? App.jsx (메인 컴포넌트)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  전역 상태 (State)                                      │   │
│  │  - graph: { nodes[], links[] }                       │   │
│  │  - nodeStyles: { [nodeId]: {size,shape,color...} }   │   │
│  │  - lockedIds: Set([...nodeId])                       │   │
│  │  - selectedId: 현재 선택된 노드                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────┐            │
│  │ GraphView   │  │ Modals   │  │ RightPanel  │            │
│  │ (그래프)     │  │ (설정/추가)│  │ (노트편집)   │            │
│  └─────────────┘  └──────────┘  └─────────────┘            │
└───────┬─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              ? 유틸리티 & 알고리즘 레이어                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐        │
│  │ layout.js   │  │ renderers.js │  │ helpers.js  │        │
│  │ (위치계산)  │  │ (Canvas그리기)│ │ (ID변환)    │        │
│  └─────────────┘  └──────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌──────────────┐                          │
│  │ useMeasure  │  │ seedData.js  │                          │
│  │ (크기감지)   │  │ (초기데이터)  │                          │
│  └─────────────┘  └──────────────┘                          │
└───────┬─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                  ? 데이터 영속성 레이어                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             storage.js (Adapter Pattern)            │   │
│  │  ┌──────────────────┐      ┌──────────────────┐    │   │
│  │  │ LocalStorage     │      │ Remote (미구현)   │    │   │
│  │  │ - save()         │      │ - save()         │    │   │
│  │  │ - load()         │      │ - load()         │    │   │
│  │  │ - clear()        │      │ - clear()        │    │   │
│  │  └──────────────────┘      └──────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└───────┬─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│         ?? 저장소 (localStorage / 미래: 서버 DB)               │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름 설명

1. **초기 로딩**
   ```
   App.jsx 마운트
   → storage.load() 호출
   → localStorage에서 데이터 읽기
   → 없으면 seedData.js의 seedCore5() 사용
   → graph/nodeStyles/lockedIds 상태 초기화
   ```

2. **사용자 상호작용**
   ```
   사용자가 노드 클릭
   → GraphView의 onNodeClick 이벤트
   → App.jsx의 setSelectedId() 호출
   → 토글 메뉴 표시 (마우스 위치)
   → "Open Note" 버튼 클릭
   → notePanelOpen = true
   → RightPanel 슬라이드 인
   ```

3. **상태 변경 & 자동 저장**
   ```
   사용자가 노트 수정
   → RightPanel의 onChange 호출
   → App.jsx의 updateNote() 실행
   → setGraph()로 상태 업데이트
   → useEffect 감지
   → storage.save() 자동 호출
   → localStorage에 저장
   ```

4. **렌더링 파이프라인**
   ```
   graph 상태 변경
   → derivedData 재계산 (useMemo)
   → computeRadialAnchors() 호출 (동심원 위치)
   → ForceGraph2D에 데이터 전달
   → makeCurvatureAccessor() 계산 (링크 곡률)
   → makeNodeCanvasObject() 호출 (Canvas 그리기)
   → 화면에 렌더링
   ```

---

## 파일별 상세 역할

### ? `src/` 디렉토리 구조

```
src/
├── App.jsx                 ? 메인 컴포넌트 (600줄)
├── main.jsx                ? React 진입점
├── index.css               ? Tailwind 설정
├── adapters/
│   └── storage.js          ? 데이터 저장 어댑터
├── data/
│   └── seedData.js         ? 초기 그래프 데이터
├── graph/
│   ├── layout.js           ? 레이아웃 알고리즘
│   └── renderers.js        ?? Canvas 렌더링
├── hooks/
│   └── useMeasure.js       ? 크기 감지 훅
└── utils/
    └── helpers.js          ? 유틸리티 함수
```

---

### ? **App.jsx** - 핵심 역할

#### ? 책임
- **전역 상태 관리**: graph, nodeStyles, lockedIds
- **컴포넌트 조합**: GraphView + Modals + Panels
- **이벤트 핸들링**: 노드 클릭, 우클릭, 키보드 입력
- **자동 저장**: useEffect로 상태 변경 감지

#### ? 핵심 코드 블록

##### 1. 저장소 초기화
```javascript
const storage = useMemo(() => 
  storageMode === 'local' 
    ? createLocalStorageAdapter() 
    : createRemoteAdapter(), 
  [storageMode]
);

const loaded = storage.load && storage.load();
const initial = loaded || seedCore5();
```
**설명**: 
- `storageMode`에 따라 localStorage 또는 Remote 어댑터 선택
- 저장된 데이터 로드, 없으면 seedCore5() 기본 데이터 사용

##### 2. 전역 상태
```javascript
const [graph, setGraph] = useState({ 
  nodes: initial.nodes, 
  links: initial.links 
});
const [nodeStyles, setNodeStyles] = useState(initial.nodeStyles || {});
const [lockedIds, setLockedIds] = useState(new Set(initial.lockedIds || []));
```
**저장 위치**: 
- `graph`: 노드/링크 데이터 (제목, 그룹, 노트 내용)
- `nodeStyles`: 각 노드의 시각적 스타일 (크기, 색상, 모양)
- `lockedIds`: 동심원 레이아웃에 고정된 노드 ID 집합

##### 3. 자동 저장
```javascript
useEffect(() => { 
  storage.save && storage.save({ 
    nodes: graph.nodes, 
    links: graph.links, 
    nodeStyles, 
    lockedIds: Array.from(lockedIds) 
  }); 
}, [graph, nodeStyles, lockedIds, storage]);
```
**동작**: 
- graph/nodeStyles/lockedIds 중 하나라도 변경되면
- storage.save() 자동 호출
- localStorage에 JSON 직렬화하여 저장

##### 4. 동심원 레이아웃 적용
```javascript
const radialAnchors = useMemo(() => 
  computeRadialAnchors(graph), 
  [graph]
);

const derivedData = useMemo(() => {
  const nodes = graph.nodes.map((n) => ({ ...n }));
  const links = graph.links.map((l) => ({ 
    source: toId(l.source), 
    target: toId(l.target), 
    type: l.type 
  }));
  
  for (const n of nodes) {
    if (lockedIds.has(n.id)) { 
      const a = radialAnchors.get(n.id); 
      n.fx = a?.x ?? 0;  // 고정 x 좌표
      n.fy = a?.y ?? 0;  // 고정 y 좌표
    } else { 
      n.fx = undefined;  // 자유 이동
      n.fy = undefined; 
    }
  }
  return { nodes, links };
}, [graph, lockedIds, radialAnchors]);
```
**설명**:
- `computeRadialAnchors()`: BFS로 동심원 위치 계산
- `lockedIds`에 있는 노드만 `fx`, `fy` 설정 (고정)
- 나머지 노드는 Force-Directed 알고리즘이 자유롭게 배치

---

### ? **adapters/storage.js** - 데이터 저장

#### 어디에 저장하나?
- **현재**: 브라우저 `localStorage` (키: `graph-notes-v1`)
- **미래**: 서버 API (REST/GraphQL)

#### 구현 방식 (Adapter Pattern)
```javascript
// Local Storage 어댑터
createLocalStorageAdapter('graph-notes-v1')
  .save({ nodes, links, nodeStyles, lockedIds })  // 저장
  .load()                                         // 불러오기
  .clear()                                        // 삭제

// Remote 어댑터 (미구현 - 인터페이스만 정의)
createRemoteAdapter()
  .save(data)   // → POST /api/graph
  .load()       // → GET /api/graph
  .clear()      // → DELETE /api/graph
```

#### 언제 저장되나?
- `App.jsx`의 useEffect가 상태 변경 감지
- **자동 저장** (디바운싱 없음, 즉시 저장)

#### 저장 데이터 구조
```javascript
{
  nodes: [
    { 
      id: "abc123", 
      title: "논문 제목",
      group: 1,  // 1=Core, 2=Forward, 3=Backward
      note: "노트 내용..."
    }
  ],
  links: [
    { 
      source: "Core", 
      target: "abc123", 
      type: "forward"  // forward | backward
    }
  ],
  nodeStyles: {
    "abc123": {
      size: "m",           // s | m | l
      shape: "circle",     // circle | square
      color: "#22d3ee",    // null=auto | hex color
      labelPinned: true,   // 라벨 고정 표시
      glow: true           // 강조 효과
    }
  },
  lockedIds: ["Core", "abc123"]  // 동심원 고정 노드
}
```

---

### ? **data/seedData.js** - 초기 데이터

#### 역할
- 첫 방문자에게 제공되는 **예제 데이터**
- Core 논문 1개 + Forward 2개 + Backward 2개 구조

#### 데이터 구조
```javascript
export const seedCore5 = () => ({
  nodes: [
    { id: 'Core', group: 1, title: '핵심 논문', note: '...' },
    { id: 'fw1', group: 2, title: '후속 연구 1', note: '...' },
    // ...
  ],
  links: [
    { source: 'Core', target: 'fw1', type: 'forward' },
    // ...
  ],
  nodeStyles: {
    Core: { glow: true, labelPinned: true }
  },
  lockedIds: ['Core', 'fw1', 'fw2', 'bw1', 'bw2']
});
```

#### 언제 사용되나?
```javascript
const loaded = storage.load();
const initial = loaded || seedCore5();  // ? 저장 데이터 없으면 사용
```

---

### ? **graph/layout.js** - 레이아웃 알고리즘

#### 1?? `computeRadialAnchors(baseData)` - 동심원 위치 계산

**목적**: 노드를 Core 중심으로 동심원 배치

**알고리즘**: BFS (Breadth-First Search)
```
1. Core 노드를 depth=0으로 설정
2. Forward 링크 따라가며 depth 증가 (+1, +2, ...)
3. Backward 링크 따라가며 depth 감소 (-1, -2, ...)
4. 같은 depth 노드들을 원 위에 균등 배치
   - 반지름: R = depth × 160
   - 각도: θ = (2π / count) × index
   - 좌표: x = R × cos(θ), y = R × sin(θ)
```

**결과**: `Map<nodeId, {x, y}>` (각 노드의 고정 좌표)

**시각화**:
```
        bw2 (-2)
          ↑
    bw1 (-1) ← Core (0) → fw1 (+1) → fw2 (+2)
```

#### 2?? `makeCurvatureAccessor(derivedData)` - 링크 곡률 계산

**목적**: 링크가 노드를 관통하지 않도록 곡선으로 휘기

**알고리즘**: 충돌 감지 + 곡률 조정
```
1. 링크의 시작점(source)과 끝점(target) 가져오기
2. 링크 선분과 각 노드의 거리 계산
   - dist2AndParam: 점-선분 최단거리 (내적 사용)
3. 거리가 18px 이하면 충돌로 간주
4. 외적으로 곡률 방향 결정 (시계/반시계)
5. 곡률 강도: 0.10 + 0.06 × tight
```

**결과**: 각 링크의 곡률 값 (-0.5 ~ +0.5)

---

### ?? **graph/renderers.js** - Canvas 렌더링

#### `makeNodeCanvasObject(nodeStyles, lockedIds)`

**목적**: Canvas API로 노드 그리기

**렌더링 단계**:
```
1. 스타일 정보 추출 (size, shape, color)
2. 글로우 효과 (선택사항)
   - shadowBlur: 32 → 60 (2단계)
   - globalAlpha: 1.0 → 0.35 (투명도)
3. 노드 본체
   - circle: ctx.arc(x, y, r, 0, 2π)
   - square: ctx.rect(x-s/2, y-s/2, s, s)
4. 고정 표시 (lockedIds)
   - 흰색 테두리 (strokeStyle='#fff')
5. 라벨 (labelPinned)
   - 배경 박스: 검은색 반투명
   - 텍스트: 흰색, 노드 위쪽
```

**Canvas API 사용**:
- `ctx.save()` / `ctx.restore()`: 설정 저장/복원
- `ctx.beginPath()`: 경로 시작
- `ctx.arc()` / `ctx.rect()`: 도형 그리기
- `ctx.fill()` / `ctx.stroke()`: 채우기/테두리
- `ctx.fillText()`: 텍스트 렌더링

---

### ? **utils/helpers.js** - 유틸리티

#### `toId(v)` - ID 안전 추출
```javascript
toId({ id: 'abc' })  // → 'abc'
toId('abc')          // → 'abc'
```
**왜 필요한가?**
- react-force-graph-2d가 링크의 source/target을 객체로 변환
- 원본 데이터는 문자열 ID
- 비교/저장 시 문자열로 통일 필요

#### `genId()` - 랜덤 ID 생성
```javascript
genId()  // → 'a7b3f9e2' (8자리)
```
**구현**:
```javascript
Math.random().toString(36).slice(2, 10)
```
- 36진수 변환 (0-9, a-z)
- 2~10번째 문자 추출

---

### ? **hooks/useMeasure.js** - 크기 감지

#### 목적
- 컨테이너 div의 실시간 크기 추적
- 창 크기 변경 시 Canvas 리사이즈

#### 사용법
```javascript
const [containerRef, size] = useMeasure();

<div ref={containerRef}>
  <ForceGraph2D 
    width={size.width || window.innerWidth}
    height={size.height || window.innerHeight}
  />
</div>
```

#### 동작 원리
```javascript
const observer = new ResizeObserver((entries) => {
  const { width, height } = entries[0].contentRect;
  setSize({ width, height });
});
observer.observe(element);
```
- `ResizeObserver`: 브라우저 네이티브 API
- 요소 크기 변경 시 콜백 호출
- 성능 최적화 (requestAnimationFrame 사용)

---

## 핵심 알고리즘

### ? BFS (Breadth-First Search) - 동심원 레이아웃

```javascript
// 의사 코드
function computeRadialAnchors(graph) {
  // 1. Core 노드 찾기
  const coreNode = graph.nodes.find(n => n.id === 'Core');
  
  // 2. BFS 큐 초기화
  queue = [{ nodeId: 'Core', depth: 0 }];
  visited = new Set();
  
  // 3. BFS 탐색
  while (queue.notEmpty()) {
    const { nodeId, depth } = queue.dequeue();
    
    // Forward 링크: depth 증가
    for (link in forwardLinks(nodeId)) {
      queue.enqueue({ nodeId: link.target, depth: depth + 1 });
    }
    
    // Backward 링크: depth 감소
    for (link in backwardLinks(nodeId)) {
      queue.enqueue({ nodeId: link.target, depth: depth - 1 });
    }
  }
  
  // 4. 같은 depth 노드들을 원 위에 배치
  for (depth in depthGroups) {
    const radius = depth * 160;
    const count = depthGroups[depth].length;
    
    depthGroups[depth].forEach((nodeId, index) => {
      const angle = (2 * Math.PI / count) * index;
      positions[nodeId] = {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      };
    });
  }
  
  return positions;
}
```

**시간 복잡도**: O(V + E) (V=노드 수, E=링크 수)

---

### ? 충돌 감지 - 링크 곡률

```javascript
// 의사 코드
function makeCurvatureAccessor(links, nodes) {
  return (link) => {
    const source = link.source;
    const target = link.target;
    
    // 1. 링크 벡터 계산
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const segLen = Math.sqrt(dx*dx + dy*dy);
    
    // 2. 충돌 감지
    let maxTightness = 0;
    
    for (node in nodes) {
      if (node === source || node === target) continue;
      
      // 점-선분 최단거리 계산
      const distance = pointToLineSegmentDistance(
        node.x, node.y,
        source.x, source.y,
        target.x, target.y
      );
      
      if (distance < 18) {  // 충돌 임계값
        const tightness = 1 - (distance / 18);
        maxTightness = Math.max(maxTightness, tightness);
      }
    }
    
    // 3. 곡률 계산
    if (maxTightness === 0) return 0;  // 직선
    
    // 외적으로 방향 결정
    const crossProduct = dx * (node.y - source.y) - dy * (node.x - source.x);
    const sign = crossProduct > 0 ? 1 : -1;
    
    return sign * (0.10 + 0.06 * maxTightness);
  };
}
```

**수학적 개념**:
- **내적**: 점-선분 최단거리 (수직 투영)
- **외적**: 곡률 방향 (시계/반시계)

---

## 상태 관리 전략

### 현재 구조 (단일 파일 State)

```
App.jsx (전역 State)
  ├── graph: { nodes[], links[] }
  ├── nodeStyles: { [nodeId]: {...} }
  ├── lockedIds: Set([...])
  ├── selectedId: string
  └── UI states (modals, panels)
      │
      └─→ Props Drilling
          └─→ GraphView / Modals / Panels
```

**장점**:
- ? 간단하고 직관적
- ? 단일 진실 공급원 (Single Source of Truth)
- ? useEffect로 자동 저장 용이

**단점**:
- ? Props Drilling (깊은 컴포넌트 트리 시 불편)
- ? 컴포넌트 재사용성 낮음
- ? 대규모 확장 시 복잡도 증가

---

## 미래 확장 계획

### 1?? 백엔드 서버 연동

#### ? 목표
- 여러 기기에서 동일한 그래프 접근
- 협업 기능 (여러 사용자가 동시 편집)
- 데이터 백업 및 버전 관리

#### ?? 구현 방법

**A. Remote Adapter 구현**
```javascript
// adapters/storage.js
export function createRemoteAdapter() {
  const API_BASE = 'https://api.yourserver.com/graph';
  
  return {
    mode: 'remote',
    
    async save(data) {
      const response = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    
    async load() {
      const response = await fetch(`${API_BASE}/load`, {
        headers: { 
          'Authorization': `Bearer ${getToken()}` 
        }
      });
      return response.json();
    },
    
    async clear() {
      await fetch(`${API_BASE}/delete`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${getToken()}` 
        }
      });
    }
  };
}
```

**B. 디바운싱 추가 (성능 최적화)**
```javascript
// App.jsx
import { debounce } from 'lodash';

const debouncedSave = useMemo(
  () => debounce((data) => {
    storage.save && storage.save(data);
  }, 1000),  // 1초 대기
  [storage]
);

useEffect(() => { 
  debouncedSave({ 
    nodes: graph.nodes, 
    links: graph.links, 
    nodeStyles, 
    lockedIds: Array.from(lockedIds) 
  }); 
}, [graph, nodeStyles, lockedIds, debouncedSave]);
```

**C. 백엔드 API 예시 (Node.js + Express)**
```javascript
// server/api/graph.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Graph = require('../models/Graph');

// 저장
router.post('/save', authenticate, async (req, res) => {
  const userId = req.user.id;
  const graphData = req.body;
  
  await Graph.findOneAndUpdate(
    { userId },
    { data: graphData, updatedAt: new Date() },
    { upsert: true }
  );
  
  res.json({ success: true });
});

// 불러오기
router.get('/load', authenticate, async (req, res) => {
  const userId = req.user.id;
  const graph = await Graph.findOne({ userId });
  
  res.json(graph ? graph.data : null);
});

// 삭제
router.delete('/delete', authenticate, async (req, res) => {
  const userId = req.user.id;
  await Graph.deleteOne({ userId });
  
  res.json({ success: true });
});

module.exports = router;
```

**D. 데이터베이스 스키마 (MongoDB)**
```javascript
// models/Graph.js
const mongoose = require('mongoose');

const GraphSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  data: {
    nodes: [{ 
      id: String, 
      title: String, 
      group: Number, 
      note: String 
    }],
    links: [{ 
      source: String, 
      target: String, 
      type: String 
    }],
    nodeStyles: Object,
    lockedIds: [String]
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Graph', GraphSchema);
```

---

### 2?? 상태 관리 라이브러리 도입

#### ? 문제점
- Props Drilling (컴포넌트 깊이 5~6단계)
- 전역 상태 변경 시 불필요한 리렌더링

#### ?? 해결책: Zustand 사용

**장점**:
- ? 간단한 API (Redux보다 훨씬 가벼움)
- ? TypeScript 지원 우수
- ? DevTools 지원
- ? Context API 불필요

**구현 예시**:
```javascript
// stores/graphStore.js
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useGraphStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        graph: { nodes: [], links: [] },
        nodeStyles: {},
        lockedIds: new Set(),
        selectedId: null,
        
        // Actions
        setGraph: (graph) => set({ graph }),
        
        updateNode: (nodeId, patch) => set((state) => ({
          graph: {
            ...state.graph,
            nodes: state.graph.nodes.map(n => 
              n.id === nodeId ? { ...n, ...patch } : n
            )
          }
        })),
        
        addNode: (node) => set((state) => ({
          graph: {
            ...state.graph,
            nodes: [...state.graph.nodes, node]
          }
        })),
        
        setNodeStyle: (nodeId, style) => set((state) => ({
          nodeStyles: {
            ...state.nodeStyles,
            [nodeId]: { ...state.nodeStyles[nodeId], ...style }
          }
        })),
        
        toggleLock: (nodeId) => set((state) => {
          const newLocked = new Set(state.lockedIds);
          if (newLocked.has(nodeId)) {
            newLocked.delete(nodeId);
          } else {
            newLocked.add(nodeId);
          }
          return { lockedIds: newLocked };
        }),
        
        setSelectedId: (id) => set({ selectedId: id }),
        
        // 저장소 동기화
        saveToStorage: async () => {
          const state = get();
          await storage.save({
            nodes: state.graph.nodes,
            links: state.graph.links,
            nodeStyles: state.nodeStyles,
            lockedIds: Array.from(state.lockedIds)
          });
        }
      }),
      {
        name: 'graph-storage',
        partialize: (state) => ({
          graph: state.graph,
          nodeStyles: state.nodeStyles,
          lockedIds: Array.from(state.lockedIds)
        })
      }
    )
  )
);
```

**사용 예시**:
```javascript
// App.jsx (간소화됨)
import { useGraphStore } from './stores/graphStore';

export default function App() {
  const { 
    graph, 
    selectedId, 
    setSelectedId,
    updateNode,
    toggleLock 
  } = useGraphStore();
  
  // Props Drilling 제거!
  return (
    <div>
      <GraphView />  {/* 직접 store 접근 */}
      <RightPanel /> {/* 직접 store 접근 */}
    </div>
  );
}

// RightPanel.jsx
import { useGraphStore } from '../stores/graphStore';

function RightPanel() {
  const selectedId = useGraphStore(state => state.selectedId);
  const updateNode = useGraphStore(state => state.updateNode);
  
  const node = useGraphStore(state => 
    state.graph.nodes.find(n => n.id === selectedId)
  );
  
  return (
    <textarea 
      value={node?.note || ''}
      onChange={(e) => updateNode(selectedId, { note: e.target.value })}
    />
  );
}
```

---

### 3?? 컴포넌트 분리 & 파일 구조 개선

#### ? 추천 디렉토리 구조

```
src/
├── main.jsx
├── App.jsx                    (라우터 설정)
├── index.css
│
├── pages/                     ? 페이지 컴포넌트
│   ├── GraphPage.jsx          (현재 App.jsx 내용)
│   ├── SettingsPage.jsx       (설정 전용 페이지)
│   └── AboutPage.jsx
│
├── components/                ? 재사용 컴포넌트
│   ├── graph/
│   │   ├── GraphView.jsx
│   │   ├── ContextMenu.jsx
│   │   └── NodeTooltip.jsx
│   ├── panels/
│   │   ├── RightPanel.jsx
│   │   └── SearchPanel.jsx
│   ├── modals/
│   │   ├── SettingsModal.jsx
│   │   ├── AddNodeModal.jsx
│   │   └── EditLinkModal.jsx
│   └── common/
│       ├── Button.jsx
│       ├── Input.jsx
│       └── Modal.jsx
│
├── stores/                    ? 상태 관리
│   ├── graphStore.js          (Zustand)
│   ├── uiStore.js             (UI 상태)
│   └── settingsStore.js
│
├── hooks/                     ? 커스텀 훅
│   ├── useMeasure.js
│   ├── useDebounce.js
│   ├── useLocalStorage.js
│   └── useGraphData.js
│
├── utils/                     ? 유틸리티
│   ├── helpers.js
│   ├── validation.js
│   └── export.js              (JSON/CSV 내보내기)
│
├── graph/                     ? 그래프 알고리즘
│   ├── layout.js
│   ├── renderers.js
│   ├── physics.js             (Force 시뮬레이션 설정)
│   └── algorithms/
│       ├── bfs.js
│       ├── clustering.js      (커뮤니티 탐지)
│       └── pathfinding.js     (최단 경로)
│
├── adapters/                  ? 데이터 어댑터
│   ├── storage.js
│   ├── localStorage.js
│   ├── remoteAPI.js
│   └── indexedDB.js           (대용량 오프라인 저장)
│
├── data/                      ? 초기 데이터
│   ├── seedData.js
│   └── templates/
│       ├── researchPaper.js
│       ├── projectManagement.js
│       └── mindMap.js
│
├── services/                  ? API 서비스
│   ├── authService.js
│   ├── graphService.js
│   └── exportService.js
│
└── types/                     ? TypeScript 타입 정의
    ├── graph.types.ts
    ├── node.types.ts
    └── api.types.ts
```

---

### 4?? 새로운 기능 추가

#### A. 검색 기능
```javascript
// components/panels/SearchPanel.jsx
function SearchPanel() {
  const [query, setQuery] = useState('');
  const { graph, setSelectedId } = useGraphStore();
  
  const results = useMemo(() => 
    graph.nodes.filter(n => 
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.note.toLowerCase().includes(query.toLowerCase())
    ),
    [query, graph]
  );
  
  return (
    <div className="search-panel">
      <input 
        placeholder="Search nodes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul>
        {results.map(node => (
          <li 
            key={node.id}
            onClick={() => setSelectedId(node.id)}
          >
            {node.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### B. 데이터 내보내기
```javascript
// utils/export.js
export function exportToJSON(graph) {
  const dataStr = JSON.stringify(graph, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `graph-${Date.now()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

export function exportToCSV(graph) {
  const csv = [
    ['ID', 'Title', 'Group', 'Note'],
    ...graph.nodes.map(n => [n.id, n.title, n.group, n.note])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `nodes-${Date.now()}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
}
```

#### C. 다크/라이트 모드
```javascript
// stores/settingsStore.js
export const useSettingsStore = create((set) => ({
  theme: 'dark',  // 'dark' | 'light'
  
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.toggle('light', theme === 'light');
  }
}));

// index.css
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #111827;
  --text-primary: #ffffff;
}

.light {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --text-primary: #000000;
}
```

#### D. 노드 필터링
```javascript
// components/graph/GraphView.jsx
function GraphView() {
  const { graph } = useGraphStore();
  const [groupFilter, setGroupFilter] = useState(new Set([1, 2, 3]));
  
  const filteredData = useMemo(() => ({
    nodes: graph.nodes.filter(n => groupFilter.has(n.group)),
    links: graph.links.filter(l => 
      groupFilter.has(l.source.group) && 
      groupFilter.has(l.target.group)
    )
  }), [graph, groupFilter]);
  
  return (
    <>
      <div className="filter-toolbar">
        <label>
          <input 
            type="checkbox" 
            checked={groupFilter.has(1)}
            onChange={(e) => {
              const newFilter = new Set(groupFilter);
              e.target.checked 
                ? newFilter.add(1) 
                : newFilter.delete(1);
              setGroupFilter(newFilter);
            }}
          />
          Core
        </label>
        {/* Forward, Backward도 동일 */}
      </div>
      
      <ForceGraph2D graphData={filteredData} />
    </>
  );
}
```

---

### 5?? 성능 최적화

#### A. React.memo로 리렌더링 방지
```javascript
// components/graph/GraphView.jsx
import React, { memo } from 'react';

export const GraphView = memo(({ data, nodeStyles, lockedIds }) => {
  // 렌더링 로직
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수
  return (
    prevProps.data === nextProps.data &&
    prevProps.nodeStyles === nextProps.nodeStyles &&
    prevProps.lockedIds === nextProps.lockedIds
  );
});
```

#### B. Virtual Scrolling (노드 목록)
```javascript
// react-window 사용
import { FixedSizeList } from 'react-window';

function NodeList({ nodes }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {nodes[index].title}
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={nodes.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

#### C. Web Worker로 레이아웃 계산 분리
```javascript
// workers/layoutWorker.js
self.addEventListener('message', (e) => {
  const { graph } = e.data;
  
  // 무거운 계산 (BFS, 충돌 감지)
  const anchors = computeRadialAnchors(graph);
  
  self.postMessage({ anchors });
});

// App.jsx에서 사용
const worker = new Worker('layoutWorker.js');
worker.postMessage({ graph });
worker.onmessage = (e) => {
  const { anchors } = e.data;
  setRadialAnchors(anchors);
};
```

---

## 추천 개발 가이드

### ? 코드 품질

1. **TypeScript 마이그레이션**
   ```bash
   npm install --save-dev typescript @types/react @types/react-dom
   ```
   - 타입 안정성 확보
   - IDE 자동완성 향상

2. **ESLint + Prettier**
   ```bash
   npm install --save-dev eslint prettier eslint-config-prettier
   ```
   - 코드 스타일 통일
   - 자동 포맷팅

3. **테스트 작성**
   ```bash
   npm install --save-dev vitest @testing-library/react
   ```
   ```javascript
   // __tests__/helpers.test.js
   import { genId, toId } from '../utils/helpers';
   
   describe('helpers', () => {
     test('genId generates 8-char ID', () => {
       expect(genId()).toHaveLength(8);
     });
     
     test('toId extracts ID from object', () => {
       expect(toId({ id: 'abc' })).toBe('abc');
     });
   });
   ```

---

### ? 개발 워크플로우

1. **기능 브랜치 전략**
   ```bash
   main            (프로덕션)
   ├── develop     (개발)
   │   ├── feature/search-panel
   │   ├── feature/export-json
   │   └── feature/dark-mode
   ```

2. **커밋 컨벤션**
   ```
   feat: 검색 패널 추가
   fix: 동심원 레이아웃 버그 수정
   refactor: Zustand로 상태 관리 전환
   docs: 아키텍처 문서 작성
   style: ESLint 규칙 적용
   test: helpers.js 단위 테스트 추가
   ```

3. **배포 자동화 (GitHub Actions)**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

---

### ? 문서화

1. **JSDoc 주석**
   ```javascript
   /**
    * 노드의 동심원 위치를 계산합니다.
    * 
    * @param {Object} graph - 그래프 데이터
    * @param {Array} graph.nodes - 노드 배열
    * @param {Array} graph.links - 링크 배열
    * @returns {Map<string, {x: number, y: number}>} 노드 ID → 좌표 매핑
    * 
    * @example
    * const anchors = computeRadialAnchors({
    *   nodes: [{ id: 'Core' }],
    *   links: []
    * });
    */
   export function computeRadialAnchors(graph) {
     // ...
   }
   ```

2. **Storybook (컴포넌트 문서화)**
   ```bash
   npm install --save-dev @storybook/react @storybook/addon-essentials
   ```
   ```javascript
   // stories/Button.stories.jsx
   export default {
     title: 'Components/Button',
     component: Button
   };
   
   export const Primary = {
     args: {
       variant: 'primary',
       children: 'Click me'
     }
   };
   ```

---

### ?? 보안

1. **API 키 관리**
   ```javascript
   // .env
   VITE_API_URL=https://api.yourserver.com
   VITE_API_KEY=your-secret-key
   
   // 사용
   const API_URL = import.meta.env.VITE_API_URL;
   ```

2. **XSS 방지**
   ```javascript
   // 사용자 입력 sanitize
   import DOMPurify from 'dompurify';
   
   const cleanNote = DOMPurify.sanitize(userInput);
   ```

---

## 요약

### ? 어디에 무엇이 저장되나?

| 데이터 | 저장 위치 | 형식 | 용도 |
|--------|----------|------|------|
| **그래프 구조** | localStorage `graph-notes-v1` | JSON | 노드/링크/스타일 |
| **초기 데이터** | `data/seedData.js` | JavaScript | 첫 방문자 예제 |
| **렌더링 로직** | `graph/renderers.js` | 함수 | Canvas 그리기 |
| **레이아웃 로직** | `graph/layout.js` | 함수 | 위치 계산 |
| **UI 상태** | `App.jsx` useState | 메모리 | 선택/모달/패널 |

### ? 데이터 흐름 요약

```
사용자 입력 → App.jsx (State) → useEffect → storage.save() → localStorage
                ↓
            derivedData (useMemo)
                ↓
        computeRadialAnchors (BFS)
                ↓
            ForceGraph2D
                ↓
        makeNodeCanvasObject (Canvas)
                ↓
            화면 렌더링
```

### ? 확장 우선순위

1. **즉시 가능** (1주일):
   - 검색 기능
   - 데이터 내보내기 (JSON/CSV)
   - 다크/라이트 모드

2. **단기 목표** (1개월):
   - Zustand 상태 관리
   - TypeScript 마이그레이션
   - 컴포넌트 분리

3. **중기 목표** (3개월):
   - 백엔드 API 구현
   - 인증 시스템
   - 실시간 협업

4. **장기 목표** (6개월):
   - AI 추천 기능 (유사 논문 제안)
   - 커뮤니티 기능 (그래프 공유)
   - 모바일 앱

---

이 문서가 프로젝트 이해와 향후 개발에 도움이 되길 바랍니다! ?
