/**
 * AdvancedBlocks.jsx
 * 
 * Advanced block components: Code, LaTeX, Image, File
 */

import { forwardRef, useState, useEffect, useRef } from 'react';
import { BLOCK_TYPES } from '../../types/blocks.js';
import katex from 'katex';

/**
 * CodeBlock Component
 * Multi-line code editor with syntax highlighting
 */
export const CodeBlock = forwardRef(({ block, onChange, onKeyDown, onFocus, autoFocus, readOnly }, ref) => {
  const language = block.metadata?.language || 'javascript';
  
  return (
    <div className="code-block my-2">
      {/* Language selector */}
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-t text-sm">
        <select
          value={language}
          onChange={(e) => {
            const newMetadata = { ...block.metadata, language: e.target.value };
            if (onChange) {
              // Update metadata through parent
              onChange(block.content, newMetadata);
            }
          }}
          disabled={readOnly}
          className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs border-none outline-none"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
          <option value="bash">Bash</option>
          <option value="sql">SQL</option>
          <option value="plaintext">Plain Text</option>
        </select>
        <span className="text-gray-400 text-xs">Code Block</span>
      </div>
      
      {/* Code editor */}
      <textarea
        ref={ref}
        value={block.content}
        onChange={(e) => onChange && onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        autoFocus={autoFocus}
        readOnly={readOnly}
        placeholder="Enter code..."
        className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm rounded-b resize-none min-h-[100px] outline-none border-none"
        style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace' }}
      />
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

/**
 * LaTeXBlock Component
 * LaTeX math editor with live preview
 */
export const LaTeXBlock = forwardRef(({ block, onChange, onKeyDown, onFocus, autoFocus, readOnly }, ref) => {
  const [showPreview, setShowPreview] = useState(true);
  const [renderError, setRenderError] = useState(null);
  const previewRef = useRef(null);
  const isInline = block.metadata?.inline || false;

  // Render LaTeX using KaTeX
  useEffect(() => {
    if (showPreview && previewRef.current && block.content.trim()) {
      try {
        katex.render(block.content, previewRef.current, {
          displayMode: !isInline,
          throwOnError: false,
          errorColor: '#ef4444',
        });
        setRenderError(null);
      } catch (error) {
        setRenderError(error.message);
      }
    }
  }, [showPreview, block.content, isInline]);

  return (
    <div className="latex-block my-2">
      {/* Controls */}
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs px-2 py-1 bg-purple-900 text-purple-200 rounded hover:bg-purple-800"
          disabled={readOnly}
        >
          {showPreview ? '📝 Edit' : '👁️ Preview'}
        </button>
        
        <label className="flex items-center gap-1 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={isInline}
            onChange={(e) => {
              const newMetadata = { ...block.metadata, inline: e.target.checked };
              if (onChange) {
                onChange(block.content, newMetadata);
              }
            }}
            disabled={readOnly}
          />
          Inline
        </label>
      </div>

      {/* Editor or Preview */}
      {showPreview ? (
        <div 
          className={`p-4 bg-gray-800 rounded border border-purple-700 ${isInline ? '' : 'text-center'}`}
          onClick={() => !readOnly && setShowPreview(false)}
        >
          {block.content.trim() ? (
            <div ref={previewRef} className="text-white" />
          ) : (
            <span className="text-gray-400 italic">Enter LaTeX formula...</span>
          )}
          {renderError && (
            <div className="text-red-400 text-xs mt-2">{renderError}</div>
          )}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={block.content}
          onChange={(e) => onChange && onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          autoFocus={autoFocus}
          readOnly={readOnly}
          placeholder="x^2 + y^2 = z^2"
          className="w-full px-4 py-3 bg-gray-900 text-gray-100 border border-purple-700 rounded font-mono text-sm resize-none min-h-[80px] outline-none focus:border-purple-500"
        />
      )}
      
      <div className="text-xs text-gray-500 mt-1">
        LaTeX Math Block (rendered with KaTeX)
      </div>
    </div>
  );
});

LaTeXBlock.displayName = 'LaTeXBlock';

/**
 * ImageBlock Component
 * Image upload and display
 */
export const ImageBlock = forwardRef(({ block, onChange, onFocus, readOnly }, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const imageUrl = block.content; // URL or base64
  const caption = block.metadata?.caption || '';
  const altText = block.metadata?.alt || '';

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      if (onChange) {
        onChange(base64, { 
          ...block.metadata, 
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (readOnly) return;
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!readOnly) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  if (!imageUrl) {
    // Upload interface
    return (
      <div 
        ref={ref}
        className={`image-block my-2 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onFocus={onFocus}
        tabIndex={0}
      >
        <div className="text-gray-500">
          <div className="text-4xl mb-2">🖼️</div>
          <div className="font-medium">Drop image here or click to upload</div>
          <div className="text-sm mt-1">Supports: JPG, PNG, GIF, WebP</div>
        </div>
        
        {!readOnly && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
            id={`image-upload-${block.id}`}
          />
        )}
        
        {!readOnly && (
          <label 
            htmlFor={`image-upload-${block.id}`}
            className="inline-block mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
          >
            Choose File
          </label>
        )}
      </div>
    );
  }

  // Display uploaded image
  return (
    <div ref={ref} className="image-block my-2" onFocus={onFocus} tabIndex={0}>
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <img 
          src={imageUrl} 
          alt={altText || caption || 'Uploaded image'}
          className="w-full h-auto"
        />
      </div>
      
      {/* Caption editor */}
      {!readOnly && (
        <input
          type="text"
          value={caption}
          onChange={(e) => {
            if (onChange) {
              onChange(imageUrl, { ...block.metadata, caption: e.target.value });
            }
          }}
          placeholder="Add a caption..."
          className="w-full mt-2 px-2 py-1 text-sm text-gray-600 text-center border-none outline-none focus:bg-gray-50 rounded"
        />
      )}
      
      {caption && readOnly && (
        <div className="text-center text-sm text-gray-600 mt-2">{caption}</div>
      )}
    </div>
  );
});

ImageBlock.displayName = 'ImageBlock';

/**
 * FileBlock Component
 * File attachment with upload/download
 */
export const FileBlock = forwardRef(({ block, onChange, onFocus, readOnly }, ref) => {
  const fileName = block.metadata?.fileName || '';
  const fileSize = block.metadata?.fileSize || 0;
  const mimeType = block.metadata?.mimeType || '';
  const fileId = block.content; // File ID for IndexedDB lookup

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
    return '📎';
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Generate file ID
    const newFileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store file metadata
    if (onChange) {
      onChange(newFileId, {
        ...block.metadata,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: Date.now()
      });
    }

    // TODO: Save file blob to IndexedDB in Phase 6
    console.log('File selected:', file.name, 'ID:', newFileId);
  };

  if (!fileId) {
    // Upload interface
    return (
      <div 
        ref={ref}
        className="file-block my-2 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
        onFocus={onFocus}
        tabIndex={0}
      >
        <div className="text-gray-500">
          <div className="text-4xl mb-2">📎</div>
          <div className="font-medium">Attach a file</div>
          <div className="text-sm mt-1">Any file type supported</div>
        </div>
        
        {!readOnly && (
          <>
            <input
              type="file"
              onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              id={`file-upload-${block.id}`}
            />
            <label 
              htmlFor={`file-upload-${block.id}`}
              className="inline-block mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
            >
              Choose File
            </label>
          </>
        )}
      </div>
    );
  }

  // Display attached file
  return (
    <div 
      ref={ref}
      className="file-block my-2 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-4"
      onFocus={onFocus}
      tabIndex={0}
    >
      <div className="text-4xl">{getFileIcon(mimeType)}</div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate">{fileName}</div>
        <div className="text-sm text-gray-500">
          {formatFileSize(fileSize)} • {mimeType || 'Unknown type'}
        </div>
      </div>
      
      {!readOnly && (
        <button
          onClick={() => {
            // TODO: Implement file download from IndexedDB in Phase 6
            console.log('Download file:', fileId);
            alert('File download will be implemented in Phase 6');
          }}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Download
        </button>
      )}
    </div>
  );
});

FileBlock.displayName = 'FileBlock';
