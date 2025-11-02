/**
 * 초기 시드 데이터
 * Core 노드와 전방/후방 참조 노드들
 */
export function seedCore5() {
  return {
    nodes: [
      { id: 'Core', group: 1, title: 'Core Paper', note: '핵심 논문 요약을 여기에 작성' },
      { id: 'F1', group: 2, title: 'Later uses Core', note: 'Core 개념을 활용한 후속 연구 1' },
      { id: 'F2', group: 2, title: 'Later uses Core', note: 'Core 개념을 활용한 후속 연구 2' },
      { id: 'B1', group: 3, title: 'Prior work 1', note: 'Core 이전 배경연구 1' },
      { id: 'B2', group: 3, title: 'Prior work 2', note: 'Core 이전 배경연구 2' },
    ],
    links: [
      { source: 'Core', target: 'F1', type: 'forward' },
      { source: 'Core', target: 'F2', type: 'forward' },
      { source: 'B1', target: 'Core', type: 'backward' },
      { source: 'B2', target: 'Core', type: 'backward' },
    ],
    nodeStyles: {},
    lockedIds: ['Core', 'F1', 'F2', 'B1', 'B2']
  };
}
