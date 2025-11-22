/**
 * 블록 관리 유틸리티 함수
 */

import { BLOCK_TYPES, BLOCK_DEFAULTS, BLOCK_SYSTEM_VERSION } from '../types/blocks';

/**
 * UUID 생성
 * @returns {string}
 */
export function generateBlockId() {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 새 블록 생성
 * @param {string} type - 블록 타입
 * @param {string} [content=''] - 초기 내용
 * @param {Object} [metadata={}] - 메타데이터
 * @returns {import('../types/blocks').Block}
 */
export function createBlock(type, content = '', metadata = {}) {
  const defaults = BLOCK_DEFAULTS[type] || BLOCK_DEFAULTS[BLOCK_TYPES.TEXT];
  const now = Date.now();
  
  return {
    id: generateBlockId(),
    type,
    content: content || defaults.content,
    metadata: { ...defaults.metadata, ...metadata },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 빈 노트 콘텐츠 생성
 * @returns {import('../types/blocks').NoteContent}
 */
export function createEmptyNoteContent() {
  return {
    version: BLOCK_SYSTEM_VERSION,
    blocks: [createBlock(BLOCK_TYPES.TEXT)],
    attachments: {},
  };
}

/**
 * 블록 업데이트
 * @param {import('../types/blocks').Block} block
 * @param {Partial<import('../types/blocks').Block>} updates
 * @returns {import('../types/blocks').Block}
 */
export function updateBlock(block, updates) {
  return {
    ...block,
    ...updates,
    updatedAt: Date.now(),
  };
}

/**
 * 블록 배열에서 특정 블록 찾기
 * @param {import('../types/blocks').Block[]} blocks
 * @param {string} blockId
 * @returns {number} 인덱스 (-1이면 없음)
 */
export function findBlockIndex(blocks, blockId) {
  return blocks.findIndex(b => b.id === blockId);
}

/**
 * 블록 추가
 * @param {import('../types/blocks').Block[]} blocks
 * @param {import('../types/blocks').Block} newBlock
 * @param {number} [index] - 삽입 위치 (없으면 끝에 추가)
 * @returns {import('../types/blocks').Block[]}
 */
export function insertBlock(blocks, newBlock, index) {
  const newBlocks = [...blocks];
  
  if (index === undefined || index === -1) {
    newBlocks.push(newBlock);
  } else {
    newBlocks.splice(index, 0, newBlock);
  }
  
  return newBlocks;
}

/**
 * 블록 삭제
 * @param {import('../types/blocks').Block[]} blocks
 * @param {string} blockId
 * @returns {import('../types/blocks').Block[]}
 */
export function deleteBlock(blocks, blockId) {
  return blocks.filter(b => b.id !== blockId);
}

/**
 * 블록 이동
 * @param {import('../types/blocks').Block[]} blocks
 * @param {string} blockId
 * @param {number} toIndex
 * @returns {import('../types/blocks').Block[]}
 */
export function moveBlock(blocks, blockId, toIndex) {
  const fromIndex = findBlockIndex(blocks, blockId);
  if (fromIndex === -1) return blocks;
  
  const newBlocks = [...blocks];
  const [movedBlock] = newBlocks.splice(fromIndex, 1);
  newBlocks.splice(toIndex, 0, movedBlock);
  
  return newBlocks;
}

/**
 * 블록 내용 업데이트
 * @param {import('../types/blocks').Block[]} blocks
 * @param {string} blockId
 * @param {string} content
 * @returns {import('../types/blocks').Block[]}
 */
export function updateBlockContent(blocks, blockId, content) {
  return blocks.map(block => 
    block.id === blockId
      ? updateBlock(block, { content })
      : block
  );
}

/**
 * 블록 타입 변경
 * @param {import('../types/blocks').Block[]} blocks
 * @param {string} blockId
 * @param {string} newType
 * @returns {import('../types/blocks').Block[]}
 */
export function changeBlockType(blocks, blockId, newType) {
  return blocks.map(block => {
    if (block.id !== blockId) return block;
    
    const defaults = BLOCK_DEFAULTS[newType] || BLOCK_DEFAULTS[BLOCK_TYPES.TEXT];
    
    return updateBlock(block, {
      type: newType,
      metadata: { ...defaults.metadata },
    });
  });
}

/**
 * 블록 메타데이터 업데이트
 * @param {import('../types/blocks').Block[]} blocks
 * @param {string} blockId
 * @param {Partial<import('../types/blocks').BlockMetadata>} metadata
 * @returns {import('../types/blocks').Block[]}
 */
export function updateBlockMetadata(blocks, blockId, metadata) {
  return blocks.map(block =>
    block.id === blockId
      ? updateBlock(block, { metadata: { ...block.metadata, ...metadata } })
      : block
  );
}

/**
 * 이전/다음 블록 ID 찾기
 * @param {import('../types/blocks').Block[]} blocks
 * @param {string} currentBlockId
 * @param {'prev' | 'next'} direction
 * @returns {string | null}
 */
export function getAdjacentBlockId(blocks, currentBlockId, direction) {
  const index = findBlockIndex(blocks, currentBlockId);
  if (index === -1) return null;
  
  const adjacentIndex = direction === 'prev' ? index - 1 : index + 1;
  
  if (adjacentIndex < 0 || adjacentIndex >= blocks.length) {
    return null;
  }
  
  return blocks[adjacentIndex].id;
}

/**
 * 블록이 비어있는지 확인
 * @param {import('../types/blocks').Block} block
 * @returns {boolean}
 */
export function isBlockEmpty(block) {
  return !block.content || block.content.trim() === '';
}

/**
 * 텍스트가 슬래시 커맨드인지 확인
 * @param {string} text
 * @returns {boolean}
 */
export function isSlashCommand(text) {
  return text.trim() === '/' || text.trim().startsWith('/');
}

/**
 * 슬래시 커맨드에서 검색어 추출
 * @param {string} text
 * @returns {string}
 */
export function extractSlashQuery(text) {
  const match = text.trim().match(/^\/(.*)$/);
  return match ? match[1].toLowerCase() : '';
}
