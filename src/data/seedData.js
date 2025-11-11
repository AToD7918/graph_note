/**
 * 초기 시드 데이터
 * 
 * 📖 이 파일의 역할:
 * - 앱을 처음 실행할 때 보여줄 기본 그래프 데이터를 정의
 * - localStorage에 저장된 데이터가 없을 때 사용됨
 * 
 * 📊 데이터 구조 (분리 저장):
 * - localStorage: 그래프 메타데이터 + 요약 (summary)
 *   - nodes: 노드 정보 (id, title, group, summary)
 *   - links: 연결 정보
 *   - nodeStyles: 시각적 스타일
 *   - lockedIds: 고정 노드 목록
 * 
 * - IndexedDB: 상세 노트 내용 (detailedNote)
 *   - { id: 'Core', detailedNote: '상세 내용...' }
 * 
 * 💡 UTF-8 인코딩 보장: 한글, 이모지 등 모든 문자 지원
 */
export function seedCore5() {
  return {
    // 📌 노드(Node) 배열: 각 노드는 하나의 논문을 나타냄
    nodes: [
      {
        id: 'Core',
        group: 1,
        title: 'Core Paper',
        summary: '핵심 논문 요약',  // 토글 메뉴에 표시될 짧은 요약
        tags: {}  // 🆕 태그 객체 (카테고리별 태그)
      },
      { 
        id: 'F1', 
        group: 2,
        title: 'Later uses Core', 
        summary: 'Core를 활용한 후속 연구',
        tags: {}
      },
      { 
        id: 'F2', 
        group: 2, 
        title: 'Later uses Core', 
        summary: 'Core 확장 연구',
        tags: {}
      },
      { 
        id: 'B1', 
        group: 3,
        title: 'Prior work 1', 
        summary: 'Core 이전 배경연구',
        tags: {}
      },
      { 
        id: 'B2', 
        group: 3, 
        title: 'Prior work 2', 
        summary: 'Core 기반 이론',
        tags: {}
      },
    ],
    
    // 📝 상세 노트 내용 (IndexedDB에 저장될 데이터)
    // 초기화 시 noteStorage.initializeSeedNotes()로 저장
    detailedNotes: {
      'Core': '# Core Paper 상세 노트\n\n## 연구 배경\n이 논문은 해당 분야의 핵심 연구입니다.\n\n## 주요 기여\n1. 새로운 알고리즘 제안\n2. 성능 개선 (기존 대비 30%)\n3. 이론적 증명 제공\n\n## 향후 연구 방향\n- 확장 가능성 검토\n- 실제 응용 사례 발굴',

      'F1': '# Later uses Core - 후속 연구 1\n\nCore 논문의 개념을 실제 문제에 적용한 연구입니다.\n\n## 적용 분야\n- 이미지 처리\n- 자연어 처리\n\n## 결과\n기존 대비 20% 성능 향상',

      'F2': '# Later uses Core - 후속 연구 2\n\nCore의 알고리즘을 개선한 연구입니다.\n\n## 개선 사항\n- 계산 복잡도 감소\n- 메모리 효율 개선',

      'B1': '# Prior work 1 - 선행 연구\n\nCore 논문이 참고한 기초 이론입니다.\n\n## 핵심 개념\n- 기본 알고리즘 정의\n- 이론적 토대 마련',

      'B2': '# Prior work 2 - 선행 연구\n\nCore가 발전시킨 원래 아이디어입니다.\n\n## 초기 접근법\n- 단순한 구현\n- 제한된 적용 범위'
    },
    
    // 🔗 링크(Link) 배열: 노드 간의 연결(화살표)
    links: [
      { 
        source: 'F1',
        target: 'Core',
        type: 'cited-by'
      },
      { source: 'F2', target: 'Core', type: 'cited-by' },
      { source: 'Core', target: 'B1', type: 'based-on' },
      { source: 'Core', target: 'B2', type: 'based-on' },
    ],
    
    // 🎨 노드 스타일: 각 노드의 시각적 설정 (비어있으면 기본값 사용)
    nodeStyles: {},
    
    // 🔒 고정된 노드 목록: 이 노드들은 동심원 위치에 고정됨 (force simulation 미적용)
    lockedIds: ['Core', 'F1', 'F2', 'B1', 'B2']
  };
}
