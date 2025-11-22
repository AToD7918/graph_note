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
  children 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
      className={`draggable-block-wrapper group relative transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isDragOver ? 'border-t-2 border-blue-500' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Block container */}
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {!readOnly && (
          <div className="flex-shrink-0 pt-2">
            <button
              draggable={!readOnly}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              className="drag-handle opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-opacity"
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
          <div className="flex-shrink-0 relative pt-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
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
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button
                    onClick={() => {
                      onDuplicate && onDuplicate(block.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
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
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <span>📄</span>
                    <span>Copy</span>
                  </button>
                  
                  <div className="border-t border-gray-200 my-1" />
                  
                  <button
                    onClick={() => {
                      onDelete && onDelete(block.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
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
