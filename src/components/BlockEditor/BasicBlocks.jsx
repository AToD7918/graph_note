import React, { useRef, useEffect } from 'react';
import { BLOCK_TYPES } from '../../types/blocks';

/**
 * 텍스트 블록 컴포넌트
 */
export const TextBlock = ({ block, onChange, onKeyDown, onFocus, autoFocus }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full bg-transparent border-none outline-none resize-none text-sm text-white placeholder-gray-500 leading-relaxed"
      value={block.content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      placeholder="텍스트를 입력하거나 '/'로 명령어 메뉴를 여세요"
      rows={1}
      style={{
        minHeight: '1.5em',
        height: 'auto',
      }}
      onInput={(e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      }}
    />
  );
};

/**
 * 헤딩 블록 컴포넌트
 */
export const HeadingBlock = ({ block, onChange, onKeyDown, onFocus, autoFocus }) => {
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const getHeadingStyle = () => {
    switch (block.type) {
      case BLOCK_TYPES.HEADING1:
        return 'text-3xl font-bold';
      case BLOCK_TYPES.HEADING2:
        return 'text-2xl font-semibold';
      case BLOCK_TYPES.HEADING3:
        return 'text-xl font-medium';
      default:
        return 'text-lg';
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      className={`w-full bg-transparent border-none outline-none text-white placeholder-gray-500 ${getHeadingStyle()}`}
      value={block.content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      placeholder={`제목 ${block.type.slice(-1)}`}
    />
  );
};

/**
 * 리스트 블록 컴포넌트
 */
export const ListBlock = ({ block, onChange, onKeyDown, onFocus, onMetadataChange, autoFocus }) => {
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const getListIcon = () => {
    switch (block.type) {
      case BLOCK_TYPES.BULLET_LIST:
        return '•';
      case BLOCK_TYPES.NUMBERED_LIST:
        return '1.';
      case BLOCK_TYPES.TODO_LIST:
        return (
          <input
            type="checkbox"
            checked={block.metadata?.checked || false}
            onChange={(e) => onMetadataChange(block.id, { checked: e.target.checked })}
            className="mr-2 cursor-pointer"
          />
        );
      default:
        return '•';
    }
  };

  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">
        {getListIcon()}
      </span>
      <input
        ref={inputRef}
        type="text"
        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
        value={block.content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder="리스트 항목"
      />
    </div>
  );
};

/**
 * 구분선 블록 컴포넌트
 */
export const DividerBlock = () => {
  return (
    <div className="w-full border-t border-gray-600 my-2" />
  );
};

/**
 * 인용구 블록 컴포넌트
 */
export const QuoteBlock = ({ block, onChange, onKeyDown, onFocus, autoFocus }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="border-l-4 border-gray-500 pl-4 py-1">
      <textarea
        ref={textareaRef}
        className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-300 italic placeholder-gray-500 leading-relaxed"
        value={block.content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder="인용구 입력..."
        rows={1}
        style={{
          minHeight: '1.5em',
          height: 'auto',
        }}
        onInput={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
      />
    </div>
  );
};
