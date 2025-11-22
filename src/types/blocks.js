/**
 * 블록 에디터 타입 정의
 * Notion 스타일 블록 기반 에디터를 위한 타입 시스템
 */

/**
 * 지원하는 블록 타입
 */
export const BLOCK_TYPES = {
  TEXT: 'text',
  HEADING1: 'heading1',
  HEADING2: 'heading2',
  HEADING3: 'heading3',
  BULLET_LIST: 'bulletList',
  NUMBERED_LIST: 'numberedList',
  TODO_LIST: 'todoList',
  CODE: 'code',
  LATEX: 'latex',
  IMAGE: 'image',
  FILE: 'file',
  DIVIDER: 'divider',
  QUOTE: 'quote',
};

/**
 * @typedef {'text' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'todoList' | 'code' | 'latex' | 'image' | 'file' | 'divider' | 'quote'} BlockType
 */

/**
 * 블록 메타데이터
 * @typedef {Object} BlockMetadata
 * @property {string} [language] - 코드 블록의 프로그래밍 언어
 * @property {string} [fileName] - 파일/이미지 이름
 * @property {number} [fileSize] - 파일 크기 (bytes)
 * @property {string} [mimeType] - MIME 타입
 * @property {string} [blobUrl] - Blob URL 또는 파일 ID
 * @property {boolean} [checked] - Todo 체크 상태
 * @property {number} [level] - 리스트 중첩 레벨
 * @property {'inline' | 'block'} [displayMode] - LaTeX 표시 모드
 * @property {string} [caption] - 이미지/파일 캡션
 */

/**
 * 블록 인터페이스
 * @typedef {Object} Block
 * @property {string} id - 고유 ID (UUID)
 * @property {BlockType} type - 블록 타입
 * @property {string} content - 텍스트 내용
 * @property {BlockMetadata} [metadata] - 타입별 메타데이터
 * @property {number} createdAt - 생성 시간 (timestamp)
 * @property {number} updatedAt - 수정 시간 (timestamp)
 */

/**
 * 노트 콘텐츠 (블록 시스템)
 * @typedef {Object} NoteContent
 * @property {string} version - 블록 시스템 버전
 * @property {Block[]} blocks - 블록 배열
 * @property {Object.<string, AttachmentMeta>} [attachments] - 첨부파일 메타데이터
 */

/**
 * 첨부파일 메타데이터
 * @typedef {Object} AttachmentMeta
 * @property {string} name - 파일명
 * @property {number} size - 파일 크기
 * @property {string} type - MIME 타입
 * @property {number} uploadedAt - 업로드 시간
 */

/**
 * 슬래시 커맨드 아이템
 * @typedef {Object} SlashCommandItem
 * @property {string} id - 커맨드 ID
 * @property {BlockType} blockType - 생성할 블록 타입
 * @property {string} label - 표시 이름
 * @property {string} icon - 아이콘
 * @property {string} description - 설명
 * @property {string[]} keywords - 검색 키워드
 * @property {string} [shortcut] - 키보드 단축키 힌트
 */

/**
 * 슬래시 커맨드 목록
 */
export const SLASH_COMMANDS = [
  {
    id: 'text',
    blockType: BLOCK_TYPES.TEXT,
    label: 'Text',
    icon: '📝',
    description: '일반 텍스트',
    keywords: ['text', 'paragraph', '텍스트', '문단'],
  },
  {
    id: 'heading1',
    blockType: BLOCK_TYPES.HEADING1,
    label: 'Heading 1',
    icon: 'H1',
    description: '대제목',
    keywords: ['h1', 'heading', 'title', '제목', '대제목'],
    shortcut: 'Ctrl+Alt+1',
  },
  {
    id: 'heading2',
    blockType: BLOCK_TYPES.HEADING2,
    label: 'Heading 2',
    icon: 'H2',
    description: '중제목',
    keywords: ['h2', 'heading', 'subtitle', '제목', '중제목'],
    shortcut: 'Ctrl+Alt+2',
  },
  {
    id: 'heading3',
    blockType: BLOCK_TYPES.HEADING3,
    label: 'Heading 3',
    icon: 'H3',
    description: '소제목',
    keywords: ['h3', 'heading', 'subheading', '제목', '소제목'],
    shortcut: 'Ctrl+Alt+3',
  },
  {
    id: 'bulletList',
    blockType: BLOCK_TYPES.BULLET_LIST,
    label: 'Bullet List',
    icon: '•',
    description: '글머리 기호 목록',
    keywords: ['bullet', 'list', 'ul', '목록', '리스트'],
  },
  {
    id: 'numberedList',
    blockType: BLOCK_TYPES.NUMBERED_LIST,
    label: 'Numbered List',
    icon: '1.',
    description: '번호 매기기 목록',
    keywords: ['numbered', 'list', 'ol', '번호', '목록'],
  },
  {
    id: 'todoList',
    blockType: BLOCK_TYPES.TODO_LIST,
    label: 'To-do List',
    icon: '☐',
    description: '체크리스트',
    keywords: ['todo', 'checkbox', 'task', '할일', '체크'],
  },
  {
    id: 'code',
    blockType: BLOCK_TYPES.CODE,
    label: 'Code Block',
    icon: '<//>',
    description: '코드 블록',
    keywords: ['code', 'snippet', '코드'],
  },
  {
    id: 'latex',
    blockType: BLOCK_TYPES.LATEX,
    label: 'LaTeX Math',
    icon: '∫',
    description: '수식 (LaTeX)',
    keywords: ['latex', 'math', 'equation', '수식'],
  },
  {
    id: 'image',
    blockType: BLOCK_TYPES.IMAGE,
    label: 'Image',
    icon: '🖼️',
    description: '이미지 업로드',
    keywords: ['image', 'picture', 'photo', '이미지', '사진'],
  },
  {
    id: 'file',
    blockType: BLOCK_TYPES.FILE,
    label: 'File',
    icon: '📎',
    description: '파일 첨부',
    keywords: ['file', 'attachment', '파일', '첨부'],
  },
  {
    id: 'divider',
    blockType: BLOCK_TYPES.DIVIDER,
    label: 'Divider',
    icon: '—',
    description: '구분선',
    keywords: ['divider', 'separator', 'hr', '구분선'],
  },
  {
    id: 'quote',
    blockType: BLOCK_TYPES.QUOTE,
    label: 'Quote',
    icon: '"',
    description: '인용구',
    keywords: ['quote', 'blockquote', '인용'],
  },
];

/**
 * 블록 타입별 기본값
 */
export const BLOCK_DEFAULTS = {
  [BLOCK_TYPES.TEXT]: {
    content: '',
    metadata: {},
  },
  [BLOCK_TYPES.HEADING1]: {
    content: '',
    metadata: {},
  },
  [BLOCK_TYPES.HEADING2]: {
    content: '',
    metadata: {},
  },
  [BLOCK_TYPES.HEADING3]: {
    content: '',
    metadata: {},
  },
  [BLOCK_TYPES.BULLET_LIST]: {
    content: '',
    metadata: { level: 0 },
  },
  [BLOCK_TYPES.NUMBERED_LIST]: {
    content: '',
    metadata: { level: 0 },
  },
  [BLOCK_TYPES.TODO_LIST]: {
    content: '',
    metadata: { checked: false, level: 0 },
  },
  [BLOCK_TYPES.CODE]: {
    content: '',
    metadata: { language: 'javascript' },
  },
  [BLOCK_TYPES.LATEX]: {
    content: '',
    metadata: { displayMode: 'block' },
  },
  [BLOCK_TYPES.IMAGE]: {
    content: '',
    metadata: { fileName: '', caption: '' },
  },
  [BLOCK_TYPES.FILE]: {
    content: '',
    metadata: { fileName: '' },
  },
  [BLOCK_TYPES.DIVIDER]: {
    content: '',
    metadata: {},
  },
  [BLOCK_TYPES.QUOTE]: {
    content: '',
    metadata: {},
  },
};

/**
 * 현재 블록 시스템 버전
 */
export const BLOCK_SYSTEM_VERSION = '2.0';
