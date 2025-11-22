/**
 * 기존 텍스트 노트 → 블록 시스템 마이그레이션
 */

import { BLOCK_TYPES, BLOCK_SYSTEM_VERSION } from '../types/blocks';
import { createBlock } from './blockUtils';

/**
 * 기존 텍스트 노트를 블록 시스템으로 변환
 * 
 * @param {string} detailedNote - 기존 텍스트 노트
 * @returns {import('../types/blocks').NoteContent}
 */
export function migrateTextToBlocks(detailedNote) {
  // 빈 노트인 경우
  if (!detailedNote || detailedNote.trim() === '') {
    return {
      version: BLOCK_SYSTEM_VERSION,
      blocks: [createBlock(BLOCK_TYPES.TEXT)],
      attachments: {},
    };
  }
  
  // 줄 단위로 분리
  const lines = detailedNote.split('\n');
  const blocks = [];
  
  let currentTextBlock = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // 빈 줄은 현재 텍스트 블록 완성
    if (trimmed === '') {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      continue;
    }
    
    // 마크다운 헤딩 감지
    if (trimmed.startsWith('# ')) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      blocks.push(createBlock(BLOCK_TYPES.HEADING1, trimmed.substring(2).trim()));
      continue;
    }
    
    if (trimmed.startsWith('## ')) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      blocks.push(createBlock(BLOCK_TYPES.HEADING2, trimmed.substring(3).trim()));
      continue;
    }
    
    if (trimmed.startsWith('### ')) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      blocks.push(createBlock(BLOCK_TYPES.HEADING3, trimmed.substring(4).trim()));
      continue;
    }
    
    // 리스트 감지
    if (trimmed.match(/^[-*•]\s/)) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      blocks.push(createBlock(BLOCK_TYPES.BULLET_LIST, trimmed.substring(2).trim()));
      continue;
    }
    
    if (trimmed.match(/^\d+\.\s/)) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      const content = trimmed.replace(/^\d+\.\s/, '');
      blocks.push(createBlock(BLOCK_TYPES.NUMBERED_LIST, content));
      continue;
    }
    
    // 체크박스 감지
    if (trimmed.match(/^-\s\[([ x])\]\s/)) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      const checked = trimmed.includes('[x]');
      const content = trimmed.replace(/^-\s\[([ x])\]\s/, '');
      blocks.push(createBlock(BLOCK_TYPES.TODO_LIST, content, { checked }));
      continue;
    }
    
    // 코드 블록 감지 (```)
    if (trimmed.startsWith('```')) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      
      const language = trimmed.substring(3).trim() || 'plaintext';
      const codeLines = [];
      i++; // 다음 줄로
      
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      blocks.push(createBlock(BLOCK_TYPES.CODE, codeLines.join('\n'), { language }));
      continue;
    }
    
    // LaTeX 수식 감지 ($$)
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      const latex = trimmed.slice(2, -2).trim();
      blocks.push(createBlock(BLOCK_TYPES.LATEX, latex, { displayMode: 'block' }));
      continue;
    }
    
    // 구분선 감지
    if (trimmed.match(/^(-{3,}|_{3,}|\*{3,})$/)) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      blocks.push(createBlock(BLOCK_TYPES.DIVIDER));
      continue;
    }
    
    // 인용구 감지
    if (trimmed.startsWith('> ')) {
      if (currentTextBlock) {
        blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
        currentTextBlock = '';
      }
      blocks.push(createBlock(BLOCK_TYPES.QUOTE, trimmed.substring(2).trim()));
      continue;
    }
    
    // 일반 텍스트 누적
    currentTextBlock += (currentTextBlock ? '\n' : '') + line;
  }
  
  // 마지막 텍스트 블록 추가
  if (currentTextBlock) {
    blocks.push(createBlock(BLOCK_TYPES.TEXT, currentTextBlock.trim()));
  }
  
  // 블록이 하나도 없으면 빈 텍스트 블록 추가
  if (blocks.length === 0) {
    blocks.push(createBlock(BLOCK_TYPES.TEXT));
  }
  
  return {
    version: BLOCK_SYSTEM_VERSION,
    blocks,
    attachments: {},
  };
}

/**
 * 블록 시스템을 텍스트로 변환 (백업/내보내기용)
 * 
 * @param {import('../types/blocks').NoteContent} content
 * @returns {string}
 */
export function blocksToText(content) {
  if (!content || !content.blocks) return '';
  
  return content.blocks.map(block => {
    switch (block.type) {
      case BLOCK_TYPES.HEADING1:
        return `# ${block.content}`;
      
      case BLOCK_TYPES.HEADING2:
        return `## ${block.content}`;
      
      case BLOCK_TYPES.HEADING3:
        return `### ${block.content}`;
      
      case BLOCK_TYPES.BULLET_LIST:
        return `- ${block.content}`;
      
      case BLOCK_TYPES.NUMBERED_LIST:
        return `1. ${block.content}`;
      
      case BLOCK_TYPES.TODO_LIST: {
        const checkbox = block.metadata?.checked ? '[x]' : '[ ]';
        return `- ${checkbox} ${block.content}`;
      }
      
      case BLOCK_TYPES.CODE: {
        const lang = block.metadata?.language || '';
        return `\`\`\`${lang}\n${block.content}\n\`\`\``;
      }
      
      case BLOCK_TYPES.LATEX:
        return `$$${block.content}$$`;
      
      case BLOCK_TYPES.IMAGE: {
        const caption = block.metadata?.caption ? ` "${block.metadata.caption}"` : '';
        return `![${block.metadata?.fileName || 'image'}](${block.metadata?.blobUrl || ''})${caption}`;
      }
      
      case BLOCK_TYPES.FILE:
        return `[📎 ${block.metadata?.fileName || 'file'}](${block.metadata?.blobUrl || ''})`;
      
      case BLOCK_TYPES.DIVIDER:
        return '---';
      
      case BLOCK_TYPES.QUOTE:
        return `> ${block.content}`;
      
      case BLOCK_TYPES.TEXT:
      default:
        return block.content;
    }
  }).join('\n\n');
}

/**
 * 노트 버전 확인
 * 
 * @param {any} data - 노트 데이터
 * @returns {'legacy' | 'blocks'} 노트 타입
 */
export function detectNoteVersion(data) {
  if (!data) return 'legacy';
  
  // 블록 시스템 데이터
  if (data.version && data.blocks && Array.isArray(data.blocks)) {
    return 'blocks';
  }
  
  // 기존 텍스트 데이터
  return 'legacy';
}
