/**
 * SlashCommandMenu.jsx
 * 
 * Dropdown menu for slash commands (/)
 * Shows available block types with icons and keywords
 */

import { useEffect, useRef, useState } from 'react';
import { SLASH_COMMANDS } from '../../types/blocks.js';

/**
 * SlashCommandMenu Component
 * 
 * @param {Object} props
 * @param {string} props.query - Search query after "/"
 * @param {Function} props.onSelect - Callback when command is selected (blockType)
 * @param {Function} props.onClose - Callback to close menu
 * @param {Object} props.position - Menu position {top, left}
 */
export default function SlashCommandMenu({ query = '', onSelect, onClose, position }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  // Filter commands by query
  const filteredCommands = SLASH_COMMANDS.filter(cmd => {
    const searchText = query.toLowerCase();
    
    // Match label
    if (cmd.label.toLowerCase().includes(searchText)) {
      return true;
    }
    
    // Match keywords
    if (cmd.keywords.some(keyword => keyword.toLowerCase().includes(searchText))) {
      return true;
    }
    
    return false;
  });

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (filteredCommands.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev === 0 ? filteredCommands.length - 1 : prev - 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex].type);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = menuRef.current?.children[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (filteredCommands.length === 0) {
    return (
      <div
        ref={menuRef}
        className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[200px]"
        style={{ top: position.top, left: position.left }}
      >
        <div className="text-gray-400 text-sm">No commands found</div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-[250px] max-h-[400px] overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {filteredCommands.map((cmd, index) => (
        <button
          key={cmd.type}
          className={`
            w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-100
            ${index === selectedIndex ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
            transition-colors duration-100
          `}
          onClick={() => onSelect(cmd.type)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {/* Icon */}
          <span className="text-lg w-6 text-center">{cmd.icon}</span>
          
          {/* Label and description */}
          <div className="flex-1">
            <div className="font-medium">{cmd.label}</div>
            {cmd.description && (
              <div className="text-xs text-gray-500">{cmd.description}</div>
            )}
          </div>

          {/* Keywords hint */}
          {cmd.keywords.length > 0 && (
            <div className="text-xs text-gray-400">
              {cmd.keywords[0]}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
