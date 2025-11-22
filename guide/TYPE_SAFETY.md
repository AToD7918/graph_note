# 타입 안전성 가이드

graph_note 프로젝트의 타입 안전성을 확보하기 위한 가이드입니다.

## 📋 타입 시스템 개요

이 프로젝트는 **JSDoc**을 사용하여 JavaScript에 타입 안전성을 추가했습니다.
TypeScript로 마이그레이션하지 않고도 VSCode의 IntelliSense와 타입 체크 기능을 활용할 수 있습니다.

## 🗂️ 파일 구조

```
src/
├── types/
│   └── index.js          # 중앙 타입 정의
├── store/
│   ├── graphStore.js     # ✅ 타입 추가 완료
│   └── uiStore.js        # ✅ 타입 추가 완료
├── utils/
│   ├── helpers.js        # ✅ 타입 추가 완료
│   ├── debounce.js       # ✅ 타입 추가 완료
│   ├── nodePositionCalculator.js  # ✅ 타입 추가 완료
│   └── tagHelpers.js     # ✅ 타입 추가 완료
├── adapters/
│   ├── storage.js        # ✅ 타입 추가 완료
│   └── noteStorage.js    # ✅ 타입 추가 완료
└── components/
    ├── GraphControls.jsx        # ✅ 타입 추가 완료
    └── NodePreviewMenu.jsx      # ✅ 타입 추가 완료
```

## 📝 주요 타입 정의

### Node (노드)
```javascript
/**
 * @typedef {Object} Node
 * @property {string} id - 노드 고유 ID
 * @property {number} group - 그룹 (1: Core, 2: Based On, 3: Cited By)
 * @property {string} title - 노드 제목
 * @property {string} [summary] - 노드 요약
 * @property {Object.<string, string[]>} [tags] - 태그
 * @property {number} [x] - X 좌표
 * @property {number} [y] - Y 좌표
 */
```

### GraphData (그래프 데이터)
```javascript
/**
 * @typedef {Object} GraphData
 * @property {Node[]} nodes - 노드 배열
 * @property {Link[]} links - 링크 배열
 */
```

### NodeStyle (노드 스타일)
```javascript
/**
 * @typedef {Object} NodeStyle
 * @property {string} [size] - 크기 ('s' | 'm' | 'l')
 * @property {string} [shape] - 모양 ('circle' | 'square')
 * @property {string} [color] - 색상
 * @property {boolean} [glow] - 글로우 효과
 * @property {boolean} [labelPinned] - 라벨 고정
 */
```

## 💡 사용 예시

### 함수에 타입 추가
```javascript
/**
 * 노드 위치 저장
 * @param {string} nodeId - 노드 ID
 * @param {number} x - X 좌표
 * @param {number} y - Y 좌표
 * @returns {void}
 */
function saveNodePosition(nodeId, x, y) {
  // ...
}
```

### Import 타입 사용
```javascript
/**
 * 노드 배열 필터링
 * @param {import('./types').Node[]} nodes - 노드 배열
 * @param {number} group - 그룹 번호
 * @returns {import('./types').Node[]} 필터링된 노드
 */
function filterByGroup(nodes, group) {
  return nodes.filter(n => n.group === group);
}
```

### React 컴포넌트 Props
```javascript
/**
 * 그래프 컨트롤 컴포넌트
 * @param {Object} props
 * @param {React.RefObject<any>} props.fgRef - ForceGraph2D ref
 * @param {number} props.zoomLevel - 줌 레벨
 * @param {function(number): void} props.onZoomChange - 줌 변경
 */
export function GraphControls({ fgRef, zoomLevel, onZoomChange }) {
  // ...
}
```

## 🔧 VSCode 설정

### jsconfig.json
```json
{
  "compilerOptions": {
    "checkJs": false,  // 엄격한 체크는 비활성화
    "allowJs": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 타입 체크 활성화 (선택적)
특정 파일에서만 타입 체크를 활성화하려면 파일 상단에 추가:
```javascript
// @ts-check
```

## ✅ 타입 안전성 이점

1. **IntelliSense**: 자동 완성 및 파라미터 힌트
2. **타입 체크**: VSCode가 타입 오류를 사전에 감지
3. **문서화**: JSDoc이 코드 문서 역할
4. **리팩토링**: 안전한 코드 변경
5. **마이그레이션 불필요**: TypeScript 없이도 타입 안전성 확보

## 🎯 향후 개선 사항

1. 모든 컴포넌트에 Props 타입 추가
2. 이벤트 핸들러 타입 정의
3. Zustand 스토어 타입 강화
4. 필요시 TypeScript 마이그레이션 고려

## 📚 참고 자료

- [JSDoc 공식 문서](https://jsdoc.app/)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [VSCode JSDoc Support](https://code.visualstudio.com/docs/languages/javascript#_jsdoc-support)
