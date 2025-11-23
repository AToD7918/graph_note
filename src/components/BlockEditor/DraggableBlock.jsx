/**
 * DraggableBlock.jsx
 * 
 * Wrapper component for draggable blocks
 * Uses native HTML5 drag and drop API
 */

import { useState } from 'react';

/**
 * DraggableBlock Component
 * 
 * @param {Object} props
 * @param {Object} props.block - Block data
 * @param {number} props.index - Block index in array
 * @param {Function} props.onMove - Callback when block is moved (fromIndex, toIndex)
 * @param {Function} props.onDelete - Callback to delete block
 * @param {Function} props.onDuplicate - Callback to duplicate block
 * @param {boolean} props.readOnly - Read-only mode
 * @param {ReactNode} props.children - Block content to render
 */
export default function DraggableBlock({ 
  block, 
  index, 
  onMove, 
  onDelete, 
  onDuplicate, 
  readOnly,
  isFocused = false,
  onFocus,
  children 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Drag handlers
  const handleDragStart = (e) => {
    if (readOnly) return;
    
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ blockId: block.id, index }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    if (readOnly) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (readOnly) return;
    
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const fromIndex = data.index;
      const toIndex = index;

      if (fromIndex !== toIndex && onMove) {
        onMove(fromIndex, toIndex);
      }
    } catch (err) {
      console.error('Failed to parse drag data:', err);
    }
  };

  return (
    <div
      className={`draggable-block-wrapper group relative transition-all duration-200 ${
        isDragging ? 'opacity-50' : ''
      } ${isDragOver ? 'border-t-2 border-blue-500' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onFocus && onFocus(block.id)}
    >
      {/* Block container with focus/hover styling */}
      <div 
        className={`flex items-start gap-2 rounded-lg px-2 py-0.5 -mx-2 transition-all duration-200 ${
          isFocused 
            ? 'bg-blue-500/10 shadow-[0_0_0_2px_rgba(59,130,246,0.3)]' 
            : isHovered 
            ? 'bg-gray-800/40' 
            : 'bg-transparent'
        }`}
      >
        {/* Drag handle */}
        {!readOnly && (
          <div className="flex-shrink-0 self-center">
            <button
              draggable={!readOnly}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              className={`drag-handle cursor-grab active:cursor-grabbing p-1 rounded transition-all duration-200 ${
                isHovered || isFocused 
                  ? 'opacity-100 hover:bg-gray-700' 
                  : 'opacity-0'
              }`}
              title="Drag to reorder"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="currentColor"
                className="text-gray-400"
              >
                <circle cx="4" cy="4" r="1.5" />
                <circle cx="4" cy="8" r="1.5" />
                <circle cx="4" cy="12" r="1.5" />
                <circle cx="12" cy="4" r="1.5" />
                <circle cx="12" cy="8" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
              </svg>
            </button>
          </div>
        )}

        {/* Block content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Action menu */}
        {!readOnly && (
          <div className="flex-shrink-0 relative self-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`p-1 rounded transition-all duration-200 ${
                isHovered || isFocused 
                  ? 'opacity-100 hover:bg-gray-700' 
                  : 'opacity-0'
              }`}
              title="Block actions"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="currentColor"
                className="text-gray-400"
              >
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 top-8 z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button
                    onClick={() => {
                      onDuplicate && onDuplicate(block.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span>📋</span>
                    <span>Duplicate</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Copy block as JSON to clipboard
                      navigator.clipboard.writeText(JSON.stringify(block, null, 2));
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span>📄</span>
                    <span>Copy</span>
                  </button>
                  
                  <div className="border-t border-gray-700 my-1" />
                  
                  <button
                    onClick={() => {
                      onDelete && onDelete(block.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-900/50 text-red-400 flex items-center gap-2"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
