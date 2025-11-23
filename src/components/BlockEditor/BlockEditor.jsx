/**
 * BlockEditor.jsx
 * 
 * Notion-style block editor container component
 * Manages block array state and renders appropriate block components
 */

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
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
const BlockEditor = forwardRef(function BlockEditor({ initialBlocks = null, onChange, readOnly = false }, ref) {
  // Initialize blocks (default to single empty text block)
  const [blocks, setBlocks] = useState(() => {
    if (initialBlocks && Array.isArray(initialBlocks) && initialBlocks.length > 0) {
      return initialBlocks;
    }
    return createEmptyNoteContent().blocks;
  });

  // Track focused block
  const [focusedBlockId, setFocusedBlockId] = useState(null);

  // Slash command menu state
  const [slashMenuState, setSlashMenuState] = useState({
    isOpen: false,
    blockId: null,
    query: '',
    position: { top: 0, left: 0 }
  });

  // Refs for block elements (keyed by blockId)
  const blockRefs = useRef({});
  
  // Store onChange in ref to avoid triggering effect on every render
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Track if this is the first render to avoid calling onChange on mount
  const isFirstRender = useRef(true);

  // Notify parent of changes (only when blocks actually change, not on mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (onChangeRef.current) {
      onChangeRef.current(blocks);
    }
  }, [blocks]);

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

  // Expose focusLastBlock method to parent via ref
  useImperativeHandle(ref, () => ({
    focusLastBlock: () => {
      if (blocks.length > 0) {
        const lastBlock = blocks[blocks.length - 1];
        focusBlock(lastBlock.id);
      }
    }
  }), [blocks, focusBlock]);

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
    if (typeof newContent === 'string') {
      const trimmed = newContent.trim();
      
      // Check if content is exactly '/' or starts with '/'
      if (trimmed === '/' || trimmed.startsWith('/')) {
        const query = trimmed === '/' ? '' : trimmed.slice(1).toLowerCase();
        const blockRef = blockRefs.current[blockId];
        
        if (blockRef) {
          // Get the actual position of the input/textarea element (not the wrapper)
          const rect = blockRef.getBoundingClientRect();
          
          // Get the note panel container to calculate relative position
          const notePanelContainer = document.querySelector('.right-panel-container');
          const notePanelRect = notePanelContainer ? notePanelContainer.getBoundingClientRect() : null;
          
          // Calculate position relative to viewport, but considering note panel offset
          const menuLeft = notePanelRect ? rect.left - notePanelRect.left : rect.left;
          
          // Use the input's actual left position which already accounts for padding
          setSlashMenuState({
            isOpen: true,
            blockId,
            query,
            position: {
              top: rect.bottom + 4,
              left: menuLeft + 2 // Add small offset for visual alignment
            }
          });
        }
      } else {
        // Close menu if slash command is removed
        if (slashMenuState.isOpen && slashMenuState.blockId === blockId) {
          setSlashMenuState({ isOpen: false, blockId: null, query: '', position: { top: 0, left: 0 } });
        }
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

    // Determine the type for the new block
    let newBlockType = BLOCK_TYPES.TEXT;
    let newBlockMetadata = {};
    
    // If current block is a list type, continue with the same list type
    if ([BLOCK_TYPES.BULLET_LIST, BLOCK_TYPES.NUMBERED_LIST, BLOCK_TYPES.TODO_LIST].includes(currentBlock.type)) {
      // If current block is empty, convert to text instead of continuing list
      if (!currentBlock.content || currentBlock.content.trim() === '') {
        // Convert current empty list item to text and focus it
        setBlocks(prevBlocks => changeBlockType(prevBlocks, blockId, BLOCK_TYPES.TEXT));
        setTimeout(() => focusBlock(blockId), 0);
        return;
      }
      newBlockType = currentBlock.type;
      // For TODO list, reset checked state
      if (currentBlock.type === BLOCK_TYPES.TODO_LIST) {
        newBlockMetadata = { checked: false };
      }
      // For NUMBERED list, increment the number
      if (currentBlock.type === BLOCK_TYPES.NUMBERED_LIST) {
        const currentNumber = currentBlock.metadata?.number || 1;
        newBlockMetadata = { number: currentNumber + 1 };
      }
    }

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
      // Insert new block with the determined type
      const newBlock = createBlock(newBlockType, '', newBlockMetadata);
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

    // If current block is empty, just delete it
    if (isBlockEmpty(currentBlock)) {
      setBlocks(prevBlocks => deleteBlock(prevBlocks, blockId));
      setTimeout(() => {
        focusBlock(previousBlock.id);
        // Move cursor to end of previous block
        const prevRef = blockRefs.current[previousBlock.id];
        if (prevRef && prevRef.setSelectionRange) {
          const length = prevRef.value?.length || 0;
          prevRef.setSelectionRange(length, length);
        }
      }, 0);
    } else {
      // If current block has content, merge it into previous block
      const prevContent = previousBlock.content || '';
      const currentContent = currentBlock.content || '';
      const mergedContent = prevContent + currentContent;
      const cursorPosition = prevContent.length;
      
      setBlocks(prevBlocks => {
        let newBlocks = updateBlockContent(prevBlocks, previousBlock.id, mergedContent);
        newBlocks = deleteBlock(newBlocks, blockId);
        return newBlocks;
      });
      
      setTimeout(() => {
        focusBlock(previousBlock.id);
        // Set cursor at the merge point
        const prevRef = blockRefs.current[previousBlock.id];
        if (prevRef && prevRef.setSelectionRange) {
          prevRef.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
  }, [blocks, readOnly, focusBlock]);

  // Handle Arrow Up - move to previous block
  const handleArrowUp = useCallback((blockId) => {
    const prevBlockId = getAdjacentBlockId(blocks, blockId, 'prev');
    if (prevBlockId) {
      focusBlock(prevBlockId);
      // Move cursor to same position in previous block (or end if shorter)
      setTimeout(() => {
        const prevRef = blockRefs.current[prevBlockId];
        const currentRef = blockRefs.current[blockId];
        if (prevRef && prevRef.setSelectionRange && currentRef) {
          const currentPos = currentRef.selectionStart;
          const length = prevRef.value?.length || 0;
          const targetPos = Math.min(currentPos, length);
          prevRef.setSelectionRange(targetPos, targetPos);
        }
      }, 0);
    }
  }, [blocks, focusBlock]);

  // Handle Arrow Down - move to next block
  const handleArrowDown = useCallback((blockId) => {
    const nextBlockId = getAdjacentBlockId(blocks, blockId, 'next');
    if (nextBlockId) {
      focusBlock(nextBlockId);
      // Move cursor to same position in next block (or end if shorter)
      setTimeout(() => {
        const nextRef = blockRefs.current[nextBlockId];
        const currentRef = blockRefs.current[blockId];
        if (nextRef && nextRef.setSelectionRange && currentRef) {
          const currentPos = currentRef.selectionStart;
          const length = nextRef.value?.length || 0;
          const targetPos = Math.min(currentPos, length);
          nextRef.setSelectionRange(targetPos, targetPos);
        }
      }, 0);
    }
  }, [blocks, focusBlock]);

  // Handle block delete
  const handleBlockDelete = useCallback((blockId) => {
    if (readOnly) return;
    
    const blockIndex = findBlockIndex(blocks, blockId);
    if (blockIndex === -1) return;
    
    setBlocks(prevBlocks => {
      // Don't allow deleting the last block
      if (prevBlocks.length === 1) {
        return [createBlock(BLOCK_TYPES.TEXT)];
      }
      
      const newBlocks = deleteBlock(prevBlocks, blockId);
      
      // Focus previous or next block
      const targetIndex = blockIndex > 0 ? blockIndex - 1 : 0;
      if (newBlocks[targetIndex]) {
        setTimeout(() => focusBlock(newBlocks[targetIndex].id), 0);
      }
      
      return newBlocks;
    });
  }, [blocks, readOnly, focusBlock]);

  // Handle keyboard events from blocks
  const handleKeyDown = useCallback((blockId, e) => {
    // If slash menu is open, don't handle arrow keys and Enter (let menu handle them)
    if (slashMenuState.isOpen && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      return;
    }

    switch (e.key) {
      case 'Enter':
        if (!e.shiftKey) {
          e.preventDefault();
          handleEnter(blockId);
        }
        break;

      case 'Backspace': {
        const ref = blockRefs.current[blockId];
        const currentBlock = blocks.find(b => b.id === blockId);
        
        // Delete block if empty
        if (currentBlock && isBlockEmpty(currentBlock)) {
          e.preventDefault();
          handleBlockDelete(blockId);
        }
        // Merge with previous block if at start
        else if (ref && ref.selectionStart === 0 && ref.selectionEnd === 0) {
          e.preventDefault();
          handleBackspaceAtStart(blockId);
        }
        break;
      }

      case 'Delete': {
        const ref = blockRefs.current[blockId];
        const currentBlock = blocks.find(b => b.id === blockId);
        const blockIndex = findBlockIndex(blocks, blockId);
        
        // Check if text input is actually focused (not just block selected)
        const isTextInputFocused = ref && document.activeElement === ref;
        
        // For blocks with text input that is focused
        if (isTextInputFocused && ref.selectionStart !== undefined && ref.selectionEnd !== undefined) {
          const hasSelection = ref.selectionStart !== ref.selectionEnd;
          const cursorAtEnd = ref.selectionStart === (ref.value?.length || 0);
          
          // Case 1: Empty block - delete current block and move to next
          if (!hasSelection && currentBlock && isBlockEmpty(currentBlock)) {
            e.preventDefault();
            const nextBlock = blocks[blockIndex + 1];
            
            setBlocks(prevBlocks => deleteBlock(prevBlocks, blockId));
            
            // Focus next block at start
            if (nextBlock) {
              setTimeout(() => {
                focusBlock(nextBlock.id);
                const nextRef = blockRefs.current[nextBlock.id];
                if (nextRef && nextRef.setSelectionRange) {
                  nextRef.setSelectionRange(0, 0);
                }
              }, 0);
            } else if (blockIndex > 0) {
              const prevBlock = blocks[blockIndex - 1];
              setTimeout(() => focusBlock(prevBlock.id), 0);
            }
          }
          // Case 2: Cursor at end of non-empty block - merge with next block
          else if (!hasSelection && cursorAtEnd && blockIndex < blocks.length - 1) {
            e.preventDefault();
            const nextBlock = blocks[blockIndex + 1];
            
            if (nextBlock) {
              // Merge next block content into current block
              const currentContent = currentBlock.content || '';
              const nextContent = nextBlock.content || '';
              const mergedContent = currentContent + nextContent;
              const cursorPosition = currentContent.length;
              
              setBlocks(prevBlocks => {
                let newBlocks = updateBlockContent(prevBlocks, blockId, mergedContent);
                newBlocks = deleteBlock(newBlocks, nextBlock.id);
                return newBlocks;
              });
              
              // Set cursor position after merge
              setTimeout(() => {
                const currentRef = blockRefs.current[blockId];
                if (currentRef && currentRef.setSelectionRange) {
                  currentRef.setSelectionRange(cursorPosition, cursorPosition);
                }
              }, 0);
            }
          }
        }
        // For blocks without text input (divider, image, file)
        else if (!ref && currentBlock && [BLOCK_TYPES.DIVIDER, BLOCK_TYPES.IMAGE, BLOCK_TYPES.FILE].includes(currentBlock.type)) {
          e.preventDefault();
          const nextBlock = blocks[blockIndex + 1];
          
          setBlocks(prevBlocks => deleteBlock(prevBlocks, blockId));
          
          // Focus next block if exists, otherwise focus previous
          if (nextBlock) {
            setTimeout(() => focusBlock(nextBlock.id), 0);
          } else if (blockIndex > 0) {
            const prevBlock = blocks[blockIndex - 1];
            setTimeout(() => focusBlock(prevBlock.id), 0);
          }
        }
        break;
      }

      case 'ArrowUp': {
        // Always move to previous block
        e.preventDefault();
        handleArrowUp(blockId);
        break;
      }

      case 'ArrowDown': {
        // Always move to next block
        e.preventDefault();
        handleArrowDown(blockId);
        break;
      }

      case 'ArrowLeft': {
        const ref = blockRefs.current[blockId];
        // Move to previous block if at the start
        if (ref && ref.selectionStart === 0 && ref.selectionEnd === 0) {
          e.preventDefault();
          const prevBlockId = getAdjacentBlockId(blocks, blockId, 'prev');
          if (prevBlockId) {
            focusBlock(prevBlockId);
            // Move cursor to end of previous block
            setTimeout(() => {
              const prevRef = blockRefs.current[prevBlockId];
              if (prevRef && prevRef.setSelectionRange) {
                const length = prevRef.value?.length || 0;
                prevRef.setSelectionRange(length, length);
              }
            }, 0);
          }
        }
        break;
      }

      case 'ArrowRight': {
        const ref = blockRefs.current[blockId];
        // Move to next block if at the end
        if (ref && ref.selectionStart === ref.value?.length && ref.selectionEnd === ref.value?.length) {
          e.preventDefault();
          const nextBlockId = getAdjacentBlockId(blocks, blockId, 'next');
          if (nextBlockId) {
            focusBlock(nextBlockId);
            // Move cursor to start of next block
            setTimeout(() => {
              const nextRef = blockRefs.current[nextBlockId];
              if (nextRef && nextRef.setSelectionRange) {
                nextRef.setSelectionRange(0, 0);
              }
            }, 0);
          }
        }
        break;
      }

      default:
        break;
    }
  }, [blocks, slashMenuState.isOpen, handleEnter, handleBackspaceAtStart, handleArrowUp, handleArrowDown, handleBlockDelete, focusBlock]);

  // Handle block focus
  const handleBlockFocus = useCallback((blockId) => {
    setFocusedBlockId(blockId);
  }, []);

  // Handle slash command selection
  const handleSlashCommandSelect = useCallback((blockType) => {
    if (!slashMenuState.blockId) return;

    // Change block type and clear slash command from content
    handleBlockTypeChange(slashMenuState.blockId, blockType);
    setBlocks(prevBlocks => {
      const updatedBlocks = updateBlockContent(prevBlocks, slashMenuState.blockId, '');
      
      // For non-editable blocks (divider, image, file), add a new text block after
      if ([BLOCK_TYPES.DIVIDER, BLOCK_TYPES.IMAGE, BLOCK_TYPES.FILE].includes(blockType)) {
        const blockIndex = findBlockIndex(updatedBlocks, slashMenuState.blockId);
        if (blockIndex !== -1) {
          const newTextBlock = createBlock(BLOCK_TYPES.TEXT, '');
          const newBlocks = insertBlock(updatedBlocks, newTextBlock, blockIndex + 1);
          
          // Focus the new text block
          setTimeout(() => focusBlock(newTextBlock.id), 0);
          
          return newBlocks;
        }
      }
      
      return updatedBlocks;
    });
    
    // Close menu
    setSlashMenuState({ isOpen: false, blockId: null, query: '', position: { top: 0, left: 0 } });
  }, [slashMenuState.blockId, handleBlockTypeChange, focusBlock]);

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
      onMetadataChange: (blockId, metadata) => {
        setBlocks(prevBlocks =>
          prevBlocks.map(b =>
            b.id === blockId ? { ...b, metadata: { ...b.metadata, ...metadata } } : b
          )
        );
      },
      autoFocus: isFirstBlock && blocks.length === 1,
      readOnly,
      ref: (ref) => registerBlockRef(block.id, ref)
    };

    switch (block.type) {
      case BLOCK_TYPES.TEXT:
        return <TextBlock {...commonProps} />;

      case BLOCK_TYPES.HEADING1:
      case BLOCK_TYPES.HEADING2:
      case BLOCK_TYPES.HEADING3:
        return <HeadingBlock {...commonProps} level={block.type.slice(-1)} />;

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
        isFocused={focusedBlockId === block.id}
        onFocus={handleBlockFocus}
      >
        {renderBlockContent(block)}
      </DraggableBlock>
    );
  };

  return (
    <div className="block-editor w-full max-w-4xl mx-auto py-8 px-4 relative min-h-[200px]">
      <div className="space-y-1">
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
});

export default BlockEditor;
