# 코드 개선 제안 사항

자동 정렬 기능 제거 후 코드베이스를 분석한 결과 아래와 같은 구조적/기능적 개선 사항들이 발견되었습니다.

## ✅ 완료된 작업

1. **자동 정렬 기능 제거**
   - `lockedIds` 상태 및 관련 함수 제거
   - `computeHierarchicalLayout` 함수 및 관련 로직 삭제
   - `nodePositionOptimizer.js` 파일 삭제
   - `layout.js` 파일 삭제 (필요한 `makeCurvatureAccessor`는 `renderers.js`로 이동)
   - Lock/Unlock UI 요소 제거 (AddNodeModal, ContextMenu)
   - 렌더러에서 lock 테두리 표시 제거

2. **사용되지 않는 파일 정리**
   - `App_old.jsx` 삭제
   - `App_new.jsx` 삭제

## 🔍 개선 제안 사항

### 1. 성능 최적화

#### 1.1 노드 추가 시 충돌 검사 최적화
**위치**: `App.jsx` - `handleAddNode` 함수

**현재 문제**:
```javascript
for (const nodeId in savedNodePositions) {
  const pos = savedNodePositions[nodeId];
  const dx = testX - pos.x;
  const dy = testY - pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < minNodeGap) {
    hasCollision = true;
    break;
  }
}
```
- O(n) 선형 검색으로 노드가 많아질수록 느려짐
- 모든 노드와 거리를 계산

**개선 방안**:
```javascript
// Spatial Hash Grid 또는 Quadtree 자료구조 사용
// 가까운 노드만 검사하여 O(1) ~ O(log n)으로 개선
```

**우선순위**: 중 (노드가 50개 이상일 때 체감 가능)

---

#### 1.2 derivedData 메모이제이션 개선
**위치**: `App.jsx` - `derivedData` useMemo

**현재 코드**:
```javascript
const derivedData = useMemo(() => {
  const nodes = graph.nodes.map((n) => ({ ...n }));
  // ...
}, [graph, savedNodePositions]);
```

**개선 방안**:
- `graph.nodes`와 `graph.links`를 개별적으로 의존성에 추가
- 불필요한 재계산 방지
```javascript
const derivedData = useMemo(() => {
  // ...
}, [graph.nodes, graph.links, savedNodePositions]);
```

**우선순위**: 하 (성능 차이 미미)

---

### 2. 코드 구조 개선

#### 2.1 노드 추가 로직 분리
**위치**: `App.jsx` - `handleAddNode` 함수

**현재 문제**:
- 230줄의 메인 App 컴포넌트에 노드 추가 로직이 포함되어 있음
- 충돌 검사, 위치 계산 등 복잡한 로직이 섞여있음

**개선 방안**:
```javascript
// utils/nodePositionCalculator.js 생성
export function findValidPositionForNewNode(
  parentPosition, 
  existingPositions, 
  options = {}
) {
  // 충돌 검사 및 위치 계산 로직 분리
}
```

**우선순위**: 중 (가독성 및 유지보수성 향상)

---

#### 2.2 상수 분리
**위치**: `App.jsx` - `handleAddNode` 함수

**현재 문제**:
```javascript
const minDistance = 20;
const maxDistance = 30;
const minNodeGap = 25;
const maxAttempts = 12;
```
- 매직 넘버가 함수 내부에 하드코딩되어 있음

**개선 방안**:
```javascript
// src/constants/nodeLayout.js
export const NODE_LAYOUT = {
  MIN_DISTANCE: 20,
  MAX_DISTANCE: 30,
  MIN_NODE_GAP: 25,
  MAX_PLACEMENT_ATTEMPTS: 12,
  FALLBACK_DISTANCE_OFFSET: 10
};
```

**우선순위**: 하 (코드 가독성 향상)

---

### 3. 에러 처리 개선

#### 3.1 에러 경계 컴포넌트 추가
**위치**: 전역

**현재 문제**:
- 런타임 에러 발생 시 전체 앱이 중단됨
- 사용자에게 친화적인 에러 메시지 없음

**개선 방안**:
```javascript
// components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, info) {
    console.error('App Error:', error, info);
    // 선택적: 에러 로깅 서비스에 전송
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>문제가 발생했습니다</h2>
          <button onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**우선순위**: 중 (사용자 경험 개선)

---

#### 3.2 IndexedDB 에러 처리 강화
**위치**: `adapters/noteStorage.js`

**현재 문제**:
- try-catch로 에러를 잡지만 사용자에게 알리지 않음
- 저장 실패 시 데이터 손실 가능성

**개선 방안**:
```javascript
// 저장 실패 시 재시도 로직 추가
// 로컬 스토리지 폴백 메커니즘
// 사용자에게 toast 알림
```

**우선순위**: 중 (데이터 안정성)

---

### 4. 타입 안정성

#### 4.1 TypeScript 도입 검토
**위치**: 전역

**현재 문제**:
- JavaScript로 작성되어 타입 체크 없음
- 런타임 에러 가능성

**개선 방안**:
- 점진적으로 `.jsx` → `.tsx` 전환
- 주요 타입 정의:
  ```typescript
  interface Node {
    id: string;
    group: number;
    title: string;
    summary: string;
    tags: Record<string, string[]>;
    x?: number;
    y?: number;
    fx?: number;
    fy?: number;
  }
  
  interface Link {
    source: string;
    target: string;
    type: 'based-on' | 'cited-by';
  }
  ```

**우선순위**: 하 (대규모 리팩토링 필요, 장기 목표)

---

#### 4.2 PropTypes 추가
**위치**: 모든 컴포넌트

**현재 문제**:
- props 타입 검증 없음
- 잘못된 props 전달 시 런타임에만 발견

**개선 방안**:
```javascript
import PropTypes from 'prop-types';

GraphContainer.propTypes = {
  fgRef: PropTypes.object.isRequired,
  derivedData: PropTypes.shape({
    nodes: PropTypes.array.isRequired,
    links: PropTypes.array.isRequired
  }).isRequired,
  nodeStyles: PropTypes.object,
  // ...
};
```

**우선순위**: 중 (개발 중 에러 조기 발견)

---

### 5. 사용자 경험 개선

#### 5.1 노드 위치 저장 피드백
**위치**: `App.jsx` - `handleNodeDragEnd`

**현재 문제**:
- 노드를 드래그한 후 위치가 저장되는지 알 수 없음
- 사용자가 불안함을 느낄 수 있음

**개선 방안**:
```javascript
// 작은 체크 아이콘 또는 toast 알림
const [saveStatus, setSaveStatus] = useState('idle'); // 'saving' | 'saved'

// 저장 시
setSaveStatus('saving');
await saveNodePosition(node.id, node.x, node.y);
setSaveStatus('saved');
setTimeout(() => setSaveStatus('idle'), 2000);
```

**우선순위**: 하 (선택적 기능)

---

#### 5.2 키보드 단축키 안내
**위치**: 전역

**현재 문제**:
- Esc, Space, Ctrl+/- 등 단축키가 있지만 사용자가 모름
- 도움말이 없음

**개선 방안**:
```javascript
// 컴포넌트: KeyboardShortcutsModal
// 트리거: '?' 키 또는 도움말 버튼
const shortcuts = [
  { key: 'Esc', description: '선택 해제 / 메뉴 닫기' },
  { key: 'Space', description: '그래프 전체 보기' },
  { key: 'Ctrl + +', description: '확대' },
  { key: 'Ctrl + -', description: '축소' },
];
```

**우선순위**: 하 (사용자 편의)

---

### 6. 테스트

#### 6.1 단위 테스트 추가
**위치**: 주요 유틸리티 함수

**현재 문제**:
- 테스트 코드 없음
- 리팩토링 시 회귀 버그 가능성

**개선 방안**:
```javascript
// __tests__/utils/helpers.test.js
import { toId, genId } from '../utils/helpers';

describe('helpers', () => {
  test('toId extracts id from object', () => {
    expect(toId({ id: 'test' })).toBe('test');
    expect(toId('test')).toBe('test');
  });
  
  test('genId generates unique ids', () => {
    const id1 = genId();
    const id2 = genId();
    expect(id1).not.toBe(id2);
  });
});
```

**우선순위**: 중 (코드 안정성)

---

#### 6.2 E2E 테스트
**위치**: 전역

**개선 방안**:
- Playwright 또는 Cypress 사용
- 주요 시나리오:
  1. 노드 추가 → 저장 확인
  2. 노드 드래그 → 위치 저장 확인
  3. 노트 편집 → IndexedDB 저장 확인

**우선순위**: 하 (장기 목표)

---

### 7. 접근성 (A11y)

#### 7.1 키보드 네비게이션
**위치**: 그래프 UI

**현재 문제**:
- 마우스 없이 노드 탐색 어려움
- 스크린 리더 지원 없음

**개선 방안**:
```javascript
// 노드에 aria-label 추가
// Tab 키로 노드 순회
// Enter로 노드 선택
<div 
  role="button"
  tabIndex={0}
  aria-label={`Node: ${node.title}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleNodeClick(node.id);
  }}
>
```

**우선순위**: 하 (접근성 개선)

---

### 8. 기타

#### 8.1 콘솔 로그 정리
**위치**: 전역

**현재 상태**:
- 개발용 console.log가 프로덕션에도 남아있음

**개선 방안**:
```javascript
// 환경 변수 기반 로깅 유틸리티
// utils/logger.js
const isDev = import.meta.env.MODE === 'development';

export const logger = {
  log: (...args) => isDev && console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};
```

**우선순위**: 하 (프로덕션 빌드 최적화)

---

#### 8.2 seedData 다국어 지원
**위치**: `data/seedData.js`

**현재 문제**:
- 한글로 하드코딩됨
- 다른 언어 사용자 불편

**개선 방안**:
```javascript
// i18n 라이브러리 도입
// 또는 간단한 locale 파일
import { getSeedData } from './seedData';
const locale = navigator.language || 'ko-KR';
const seedData = getSeedData(locale);
```

**우선순위**: 하 (국제화 필요 시)

---

## 📊 우선순위 요약

| 우선순위 | 항목 | 예상 작업 시간 | 효과 |
|---------|------|--------------|------|
| **상** | - | - | - |
| **중** | 노드 추가 로직 분리 | 2-3시간 | 가독성 및 유지보수성 향상 |
| **중** | 에러 경계 컴포넌트 | 1-2시간 | 사용자 경험 개선 |
| **중** | PropTypes 추가 | 3-4시간 | 개발 중 에러 조기 발견 |
| **중** | 단위 테스트 | 4-6시간 | 코드 안정성 |
| **하** | 나머지 항목들 | - | 점진적 개선 |

---

## 🎯 추천 적용 순서

1. **단기 (1-2주)**:
   - 상수 분리
   - 에러 경계 컴포넌트
   - PropTypes 추가

2. **중기 (1-2개월)**:
   - 노드 추가 로직 분리
   - 단위 테스트 추가
   - IndexedDB 에러 처리 강화

3. **장기 (3개월+)**:
   - TypeScript 전환 검토
   - E2E 테스트
   - 접근성 개선

---

## 💡 참고 사항

- 이 문서의 제안 사항들은 **선택적**입니다.
- 프로젝트의 규모, 팀 구성, 일정에 따라 우선순위를 조정하세요.
- 모든 제안을 한 번에 적용하려 하지 말고 점진적으로 개선하세요.
- 각 개선 작업 후 충분한 테스트를 진행하세요.
