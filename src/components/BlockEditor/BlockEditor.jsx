/**
 * BlockEditor.jsx
 * 
 * Notion-style block editor container component
 * Manages block array state and renders appropriate block components
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { BLOCK_TYPES } from '../../types/blocks.js';
import {
  createBlock,
  insertBlock,
  deleteBlock,
  moveBlock,
  updateBlockContent,
  changeBlockType,
  findBlockIndex,
  getAdjacentBlockId,
  isBlockEmpty,
  isSlashCommand,
  extractSlashQuery,
  createEmptyNoteContent
} from '../../utils/blockUtils.js';
import {
  TextBlock,
  HeadingBlock,
  ListBlock,
  DividerBlock,
  QuoteBlock
} from './BasicBlocks.jsx';
import {
  CodeBlock,
  LaTeXBlock,
  ImageBlock,
  FileBlock
} from './AdvancedBlocks.jsx';
import SlashCommandMenu from './SlashCommandMenu.jsx';
import DraggableBlock from './DraggableBlock.jsx';

/**
 * BlockEditor Component
 * 
 * @param {Object} props
 * @param {Array} props.initialBlocks - Initial blocks array
 * @param {Function} props.onChange - Callback when blocks change
 * @param {boolean} props.readOnly - Read-only mode
 */
export default function BlockEditor({ initialBlocks = null, onChange, readOnly = false }) {
  // Initialize blocks (default to single empty text block)
  const [blocks, setBlocks] = useState(() => {
    if (initialBlocks && Array.isArray(initialBlocks) && initialBlocks.length > 0) {
      return initialBlocks;
    }
    return createEmptyNoteContent().blocks;
  });

  // Update blocks when initialBlocks prop changes
  useEffect(() => {
    if (initialBlocks && Array.isArray(initialBlocks) && initialBlocks.length > 0) {
      setBlocks(initialBlocks);
    }
  }, [initialBlocks]);

  // Track focused block
  const [_focusedBlockId, setFocusedBlockId] = useState(null);

  // Slash command menu state
  const [slashMenuState, setSlashMenuState] = useState({
    isOpen: false,
    blockId: null,
    query: '',
    position: { top: 0, left: 0 }
  });

  // Refs for block elements (keyed by blockId)
  const blockRefs = useRef({});

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(blocks);
    }
  }, [blocks, onChange]);

  // Register block ref
  const registerBlockRef = useCallback((blockId, ref) => {
    if (ref) {
      blockRefs.current[blockId] = ref;
    } else {
      delete blockRefs.current[blockId];
    }
  }, []);

  // Focus specific block
  const focusBlock = useCallback((blockId) => {
    const ref = blockRefs.current[blockId];
    if (ref && ref.focus) {
      ref.focus();
      setFocusedBlockId(blockId);
    }
  }, []);

  // Handle block content change (supports metadata updates)
  const handleBlockChange = useCallback((blockId, newContent, newMetadata) => {
    setBlocks(prevBlocks => {
      let updatedBlocks = updateBlockContent(prevBlocks, blockId, newContent);
      
      // Update metadata if provided
      if (newMetadata !== undefined) {
        const blockIndex = findBlockIndex(updatedBlocks, blockId);
        if (blockIndex !== -1) {
          updatedBlocks = [
            ...updatedBlocks.slice(0, blockIndex),
            {
              ...updatedBlocks[blockIndex],
              metadata: newMetadata,
              updatedAt: Date.now()
            },
            ...updatedBlocks.slice(blockIndex + 1)
          ];
        }
      }
      
      return updatedBlocks;
    });

    // Check for slash command (only for text content)
    if (typeof newContent === 'string' && isSlashCommand(newContent)) {
      const query = extractSlashQuery(newContent);
      const blockRef = blockRefs.current[blockId];
      
      if (blockRef) {
        // Calculate menu position (below the input)
        const rect = blockRef.getBoundingClientRect();
        setSlashMenuState({
          isOpen: true,
          blockId,
          query,
          position: {
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX
          }
        });
      }
    } else {
      // Close menu if slash command is removed
      if (slashMenuState.isOpen && slashMenuState.blockId === blockId) {
        setSlashMenuState({ isOpen: false, blockId: null, query: '', position: { top: 0, left: 0 } });
      }
    }
  }, [slashMenuState]);

  // Handle block type change (used for slash commands)
  const handleBlockTypeChange = useCallback((blockId, newType) => {
    setBlocks(prevBlocks => {
      const newBlocks = changeBlockType(prevBlocks, blockId, newType);
      // Focus the block after type change
      setTimeout(() => focusBlock(blockId), 0);
      return newBlocks;
    });
  }, [focusBlock]);

  // Handle Enter key - create new block below
  const handleEnter = useCallback((blockId) => {
    if (readOnly) return;

    const blockIndex = findBlockIndex(blocks, blockId);
    if (blockIndex === -1) return;

    const currentBlock = blocks[blockIndex];
    const cursorPosition = blockRefs.current[blockId]?.selectionStart;

    // Split content at cursor if applicable
    if (cursorPosition !== undefined && currentBlock.type === BLOCK_TYPES.TEXT) {
      const beforeCursor = currentBlock.content.substring(0, cursorPosition);
      const afterCursor = currentBlock.content.substring(cursorPosition);

      // Update current block with content before cursor
      setBlocks(prevBlocks => {
        let newBlocks = updateBlockContent(prevBlocks, blockId, beforeCursor);
        
        // Insert new block with content after cursor
        const newBlock = createBlock(BLOCK_TYPES.TEXT, afterCursor);
        newBlocks = insertBlock(newBlocks, newBlock, blockIndex + 1);
        
        // Focus new block
        setTimeout(() => focusBlock(newBlock.id), 0);
        
        return newBlocks;
      });
    } else {
      // Simple case: insert empty text block below
      const newBlock = createBlock(BLOCK_TYPES.TEXT);
      setBlocks(prevBlocks => insertBlock(prevBlocks, newBlock, blockIndex + 1));
      setTimeout(() => focusBlock(newBlock.id), 0);
    }
  }, [blocks, readOnly, focusBlock]);

  // Handle Backspace at start - merge with previous block
  const handleBackspaceAtStart = useCallback((blockId) => {
    if (readOnly) return;

    const blockIndex = findBlockIndex(blocks, blockId);
    if (blockIndex === -1 || blockIndex === 0) return;

    const currentBlock = blocks[blockIndex];
    const previousBlock = blocks[blockIndex - 1];

    // Only merge if current block is empty
    if (!isBlockEmpty(currentBlock)) return;

    // Delete current block and focus previous
    setBlocks(prevBlocks => deleteBlock(prevBlocks, blockId));
    setTimeout(() => focusBlock(previousBlock.id), 0);
  }, [blocks, readOnly, focusBlock]);

  // Handle Arrow Up - move to previous block
  const handleArrowUp = useCallback((blockId) => {
    const previousBlockId = getAdjacentBlockId(blocks, blockId, 'up');
    if (previousBlockId) {
      focusBlock(previousBlockId);
    }
  }, [blocks, focusBlock]);

  // Handle Arrow Down - move to next block
  const handleArrowDown = useCallback((blockId) => {
    const nextBlockId = getAdjacentBlockId(blocks, blockId, 'down');
    if (nextBlockId) {
      focusBlock(nextBlockId);
    }
  }, [blocks, focusBlock]);

  // Handle keyboard events from blocks
  const handleKeyDown = useCallback((blockId, e) => {
    switch (e.key) {
      case 'Enter':
        if (!e.shiftKey) {
          e.preventDefault();
          handleEnter(blockId);
        }
        break;

      case 'Backspace': {
        const ref = blockRefs.current[blockId];
        if (ref && ref.selectionStart === 0 && ref.selectionEnd === 0) {
          e.preventDefault();
          handleBackspaceAtStart(blockId);
        }
        break;
      }

      case 'ArrowUp': {
        const ref = blockRefs.current[blockId];
        // Move up only if at first line
        if (ref && ref.selectionStart === 0) {
          e.preventDefault();
          handleArrowUp(blockId);
        }
        break;
      }

      case 'ArrowDown': {
        const ref = blockRefs.current[blockId];
        // Move down only if at last line
        if (ref && ref.selectionStart === ref.value?.length) {
          e.preventDefault();
          handleArrowDown(blockId);
        }
        break;
      }

      default:
        break;
    }
  }, [handleEnter, handleBackspaceAtStart, handleArrowUp, handleArrowDown]);

  // Handle block focus
  const handleBlockFocus = useCallback((blockId) => {
    setFocusedBlockId(blockId);
  }, []);

  // Handle slash command selection
  const handleSlashCommandSelect = useCallback((blockType) => {
    if (!slashMenuState.blockId) return;

    // Change block type and clear slash command from content
    handleBlockTypeChange(slashMenuState.blockId, blockType);
    setBlocks(prevBlocks => updateBlockContent(prevBlocks, slashMenuState.blockId, ''));
    
    // Close menu
    setSlashMenuState({ isOpen: false, blockId: null, query: '', position: { top: 0, left: 0 } });
  }, [slashMenuState.blockId, handleBlockTypeChange]);

  // Close slash menu
  const closeSlashMenu = useCallback(() => {
    setSlashMenuState({ isOpen: false, blockId: null, query: '', position: { top: 0, left: 0 } });
  }, []);

  // Handle block move (drag and drop)
  const handleBlockMove = useCallback((fromIndex, toIndex) => {
    if (readOnly) return;
    
    setBlocks(prevBlocks => {
      const blockId = prevBlocks[fromIndex].id;
      return moveBlock(prevBlocks, blockId, toIndex);
    });
  }, [readOnly]);

  // Handle block delete
  const handleBlockDelete = useCallback((blockId) => {
    if (readOnly) return;
    
    setBlocks(prevBlocks => {
      // Don't allow deleting the last block
      if (prevBlocks.length === 1) {
        return [createBlock(BLOCK_TYPES.TEXT)];
      }
      return deleteBlock(prevBlocks, blockId);
    });
  }, [readOnly]);

  // Handle block duplicate
  const handleBlockDuplicate = useCallback((blockId) => {
    if (readOnly) return;
    
    setBlocks(prevBlocks => {
      const blockIndex = findBlockIndex(prevBlocks, blockId);
      if (blockIndex === -1) return prevBlocks;
      
      const originalBlock = prevBlocks[blockIndex];
      const duplicatedBlock = {
        ...originalBlock,
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      return insertBlock(prevBlocks, duplicatedBlock, blockIndex + 1);
    });
  }, [readOnly]);

  // Handle paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e) => {
      if (readOnly) return;
      
      // Check if target is not an input/textarea (to avoid interfering with normal paste)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      try {
        const text = await navigator.clipboard.readText();
        
        // Try to parse as block JSON
        try {
          const blockData = JSON.parse(text);
          if (blockData.type && blockData.content !== undefined) {
            // Valid block - insert it
            const newBlock = createBlock(blockData.type, blockData.content, blockData.metadata);
            setBlocks(prevBlocks => [...prevBlocks, newBlock]);
            setTimeout(() => focusBlock(newBlock.id), 0);
          }
        } catch {
          // Not JSON - ignore
        }
      } catch (err) {
        console.error('Paste failed:', err);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [readOnly, focusBlock]);

  // Render block component based on type
  const renderBlockContent = (block) => {
    const isFirstBlock = blocks[0]?.id === block.id;
    const commonProps = {
      block,
      onChange: (content, metadata) => handleBlockChange(block.id, content, metadata),
      onKeyDown: (e) => handleKeyDown(block.id, e),
      onFocus: () => handleBlockFocus(block.id),
      autoFocus: isFirstBlock && blocks.length === 1,
      readOnly,
      ref: (ref) => registerBlockRef(block.id, ref)
    };

    switch (block.type) {
      case BLOCK_TYPES.TEXT:
        return <TextBlock {...commonProps} />;

      case BLOCK_TYPES.HEADING_1:
      case BLOCK_TYPES.HEADING_2:
      case BLOCK_TYPES.HEADING_3:
        return <HeadingBlock {...commonProps} level={block.type.split('_')[1]} />;

      case BLOCK_TYPES.BULLET_LIST:
      case BLOCK_TYPES.NUMBERED_LIST:
      case BLOCK_TYPES.TODO_LIST:
        return <ListBlock {...commonProps} listType={block.type} />;

      case BLOCK_TYPES.DIVIDER:
        return <DividerBlock {...commonProps} />;

      case BLOCK_TYPES.QUOTE:
        return <QuoteBlock {...commonProps} />;

      case BLOCK_TYPES.CODE:
        return <CodeBlock {...commonProps} />;

      case BLOCK_TYPES.LATEX:
        return <LaTeXBlock {...commonProps} />;

      case BLOCK_TYPES.IMAGE:
        return <ImageBlock {...commonProps} />;

      case BLOCK_TYPES.FILE:
        return <FileBlock {...commonProps} />;

      default:
        return (
          <div className="p-2 text-red-500">
            Unknown block type: {block.type}
          </div>
        );
    }
  };

  // Render block with drag and drop wrapper
  const renderBlock = (block, index) => {
    return (
      <DraggableBlock
        key={block.id}
        block={block}
        index={index}
        onMove={handleBlockMove}
        onDelete={handleBlockDelete}
        onDuplicate={handleBlockDuplicate}
        readOnly={readOnly}
      >
        {renderBlockContent(block)}
      </DraggableBlock>
    );
  };

  return (
    <div className="block-editor w-full max-w-4xl mx-auto py-8 px-4 relative">
      <div className="space-y-2">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="text-gray-400 text-center py-8">
          Press Enter to start writing...
        </div>
      )}

      {/* Slash command menu */}
      {slashMenuState.isOpen && (
        <SlashCommandMenu
          query={slashMenuState.query}
          onSelect={handleSlashCommandSelect}
          onClose={closeSlashMenu}
          position={slashMenuState.position}
        />
      )}
    </div>
  );
}
