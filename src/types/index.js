/**
 * @fileoverview 타입 정의 파일
 * JSDoc을 사용한 타입 안전성 확보
 */

/**
 * @typedef {Object} Node
 * @property {string} id - 노드 고유 ID
 * @property {number} group - 그룹 번호 (1: Core, 2: Based On, 3: Cited By)
 * @property {string} title - 노드 제목
 * @property {string} [summary] - 노드 요약
 * @property {Object.<string, string[]>} [tags] - 태그 객체 (카테고리: [태그들])
 * @property {number} [x] - X 좌표
 * @property {number} [y] - Y 좌표
 * @property {number} [fx] - 고정 X 좌표
 * @property {number} [fy] - 고정 Y 좌표
 * @property {number} [vx] - X 속도
 * @property {number} [vy] - Y 속도
 */

/**
 * @typedef {Object} Link
 * @property {string|Node} source - 소스 노드 ID 또는 노드 객체
 * @property {string|Node} target - 타겟 노드 ID 또는 노드 객체
 * @property {string} type - 링크 타입 ('based-on' | 'cited-by')
 */

/**
 * @typedef {Object} GraphData
 * @property {Node[]} nodes - 노드 배열
 * @property {Link[]} links - 링크 배열
 */

/**
 * @typedef {Object} NodeStyle
 * @property {string} [size] - 노드 크기 ('s' | 'm' | 'l')
 * @property {string} [shape] - 노드 모양 ('circle' | 'square')
 * @property {string} [color] - 노드 색상 (hex color)
 * @property {boolean} [glow] - 글로우 효과 여부
 * @property {boolean} [labelPinned] - 라벨 고정 여부
 */

/**
 * @typedef {Object.<string, NodeStyle>} NodeStyles
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X 좌표
 * @property {number} y - Y 좌표
 */

/**
 * @typedef {Object.<string, Position>} NodePositions
 */

/**
 * @typedef {Object.<string, string[]>} TagsIndex
 * 카테고리별 태그 목록
 */

/**
 * @typedef {Object} ContextMenu
 * @property {boolean} visible - 메뉴 표시 여부
 * @property {number} x - X 좌표
 * @property {number} y - Y 좌표
 * @property {string|null} nodeId - 선택된 노드 ID
 */

/**
 * @typedef {Object} PreviewMenu
 * @property {boolean} visible - 메뉴 표시 여부
 * @property {number} x - X 좌표
 * @property {number} y - Y 좌표
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {function(): GraphData & {nodeStyles: NodeStyles}} [load] - 데이터 로드
 * @property {function(GraphData & {nodeStyles: NodeStyles}): void} [save] - 데이터 저장
 * @property {function(): void} [clear] - 데이터 삭제
 */

/**
 * @typedef {Object} GraphStore
 * @property {string} storageMode - 저장소 모드 ('local' | 'remote')
 * @property {StorageAdapter} storage - 저장소 어댑터
 * @property {GraphData} graph - 그래프 데이터
 * @property {NodeStyles} nodeStyles - 노드 스타일
 * @property {NodePositions} savedNodePositions - 저장된 노드 위치
 * @property {TagsIndex} tagsIndex - 태그 인덱스
 * @property {function(GraphData): void} setGraph - 그래프 설정
 * @property {function(string, Partial<Node>): void} updateNode - 노드 업데이트
 * @property {function(Node, Link=): void} addNode - 노드 추가
 * @property {function(string): void} deleteNode - 노드 삭제
 * @property {function(string, Partial<NodeStyle>): void} setNodeStyle - 노드 스타일 설정
 * @property {function(string, number, number): void} saveNodePosition - 노드 위치 저장
 * @property {function(): void} clearNodePositions - 노드 위치 전체 삭제
 * @property {function(TagsIndex): void} updateTagsIndex - 태그 인덱스 업데이트
 * @property {function(): void} saveToStorage - 저장소에 저장
 * @property {function(): void} clearStorage - 저장소 삭제
 * @property {function(string): void} setStorageMode - 저장소 모드 설정
 */

/**
 * @typedef {Object} UIStore
 * @property {string|null} selectedId - 선택된 노드 ID
 * @property {boolean} notePanelOpen - 노트 패널 열림 상태
 * @property {number} panelWidth - 패널 너비
 * @property {boolean} showSettings - 설정 모달 표시 여부
 * @property {boolean} showAddNode - 노드 추가 모달 표시 여부
 * @property {ContextMenu} contextMenu - 컨텍스트 메뉴 상태
 * @property {PreviewMenu} previewMenu - 미리보기 메뉴 상태
 * @property {number} zoomLevel - 줌 레벨
 * @property {string} graphViewMode - 그래프 뷰 모드
 * @property {string[]} customColorHistory - 커스텀 색상 히스토리
 * @property {function(string|null): void} setSelectedId - 선택 노드 설정
 * @property {function(): void} openNotePanel - 노트 패널 열기
 * @property {function(): void} closeNotePanel - 노트 패널 닫기
 * @property {function(number): void} setPanelWidth - 패널 너비 설정
 * @property {function(): void} openSettings - 설정 열기
 * @property {function(): void} closeSettings - 설정 닫기
 * @property {function(): void} openAddNode - 노드 추가 모달 열기
 * @property {function(): void} closeAddNode - 노드 추가 모달 닫기
 * @property {function(number, number, string): void} showContextMenu - 컨텍스트 메뉴 표시
 * @property {function(): void} hideContextMenu - 컨텍스트 메뉴 숨김
 * @property {function(string, number, number): void} handleNodeClick - 노드 클릭 처리
 * @property {function(): void} hidePreviewMenu - 미리보기 메뉴 숨김
 * @property {function(number): void} setZoomLevel - 줌 레벨 설정
 * @property {function(string): void} setGraphViewMode - 그래프 뷰 모드 설정
 * @property {function(string): void} addCustomColor - 커스텀 색상 추가
 */

export {};
