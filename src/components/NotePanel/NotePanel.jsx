import React, { useState, useEffect } from 'react';
import { loadNoteDetail, saveNoteDetail, loadBlockContent, saveBlockContent } from '../../adapters/noteStorage';
import { TagInput } from './Tag/TagInput';
import { addTagToIndex } from '../../utils/tagHelpers';
import BlockEditor from '../BlockEditor/BlockEditor';
import ErrorBoundary from '../BlockEditor/ErrorBoundary';
import { migrateTextToBlocks, detectNoteVersion } from '../../utils/blockMigration';
import { createEmptyNoteContent } from '../../utils/blockUtils';

/**
 * 📝 노트 패널 컴포넌트
 * 
 * 🎯 역할:
 * - 선택된 노드의 요약(summary) + 태그(tags) + 상세 노트(detailedNote) 편집
 * - 요약, 태그: localStorage (토글 메뉴에 표시)
 * - 상세 노트: IndexedDB (노트 패널에서만 로드)
 * 
 * 📦 Props:
 * @param {Object} selectedNote - 현재 선택된 노드 { id, title, summary, tags, group }
 * @param {Function} onClose - 패널 닫기 핸들러
 * @param {Function} onChange - 데이터 변경 핸들러 (localStorage)
 * @param {boolean} isOpen - 패널 열림 상태
 * @param {number} panelWidth - 패널 너비 (px)
 * @param {Function} setPanelWidth - 패널 너비 설정 함수
 * @param {Object} tagsIndex - 전체 태그 인덱스 (자동완성용)
 */
export const NotePanel = React.memo(function NotePanel({ selectedNote, onClose, onChange, isOpen, panelWidth, setPanelWidth, tagsIndex = {} }) {
  // 제목 (title) - localStorage
  const [localTitle, setLocalTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  // 요약 (summary) - localStorage
  const [localSummary, setLocalSummary] = useState('');
  
  // 태그 (tags) - localStorage
  const [localTags, setLocalTags] = useState({});
  
  // 상세 노트 (blocks) - IndexedDB
  const [blocks, setBlocks] = useState([]);
  const [noteFormat, setNoteFormat] = useState('blocks'); // 'legacy' | 'blocks'
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  
  // 저장 상태
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' | 'saved' | ''

  // 리사이징 상태
  const [isResizing, setIsResizing] = useState(false);

  // 리사이저 마우스 다운 핸들러
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // 리사이징 이펙트
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 360;
      const maxWidth = window.innerWidth * 0.8;
      
      const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      setPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setPanelWidth]);

  // IndexedDB에서 상세 노트 로드 (자동 마이그레이션 포함)
  const loadDetailedNote = async (nodeId) => {
    setIsLoading(true);
    try {
      // Try loading block content first
      const blockContent = await loadBlockContent(nodeId);
      
      if (blockContent && blockContent.blocks) {
        // New block format
        setBlocks(blockContent.blocks);
        setNoteFormat('blocks');
        console.log(`📖 블록 노트 로드: ${nodeId}`);
      } else {
        // Try loading legacy text content
        const legacyContent = await loadNoteDetail(nodeId);
        
        if (legacyContent && legacyContent.trim()) {
          // Migrate legacy text to blocks
          const migratedContent = migrateTextToBlocks({ detailedNote: legacyContent });
          setBlocks(migratedContent.blocks);
          setNoteFormat('blocks');
          
          // Auto-save migrated content
          await saveBlockContent(nodeId, migratedContent);
          console.log(`📖 레거시 노트 마이그레이션: ${nodeId}`);
        } else {
          // Empty note
          const emptyContent = createEmptyNoteContent();
          setBlocks(emptyContent.blocks);
          setNoteFormat('blocks');
        }
      }
    } catch (error) {
      console.error('상세 노트 로드 실패:', error);
      const emptyContent = createEmptyNoteContent();
      setBlocks(emptyContent.blocks);
      setNoteFormat('blocks');
    } finally {
      setIsLoading(false);
    }
  };

  // 선택된 노트 변경 시 데이터 로드
  useEffect(() => {
    if (selectedNote && isOpen) {
      // 제목 로드
      setLocalTitle(selectedNote.title || '');
      setIsEditingTitle(false);
      
      // 요약 로드 (localStorage에서 이미 로드됨)
      setLocalSummary(selectedNote.summary || '');
      
      // 태그 로드 (localStorage)
      setLocalTags(selectedNote.tags || {});
      
      // 상세 노트 로드 (IndexedDB에서 Lazy Loading)
      loadDetailedNote(selectedNote.id);
    }
  }, [selectedNote, isOpen]);

  // 제목 변경 핸들러 (localStorage)
  const handleTitleChange = (e) => {
    setLocalTitle(e.target.value);
  };

  // 제목 수정 완료
  const handleTitleBlur = () => {
    const trimmedTitle = localTitle.trim();
    if (trimmedTitle && trimmedTitle !== selectedNote.title) {
      onChange({ title: trimmedTitle });
      setSaveStatus('saved');
      setLastSaved(new Date());
    } else if (!trimmedTitle) {
      // 빈 제목은 허용하지 않음
      setLocalTitle(selectedNote.title);
    }
    setIsEditingTitle(false);
  };

  // 제목 수정 중 엔터 키
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setLocalTitle(selectedNote.title);
      setIsEditingTitle(false);
    }
  };

  // 요약 변경 핸들러 (localStorage)
  const handleSummaryChange = (e) => {
    const newValue = e.target.value;
    setLocalSummary(newValue);
    onChange({ summary: newValue });
    setSaveStatus('saved');
    setLastSaved(new Date());
  };

  // 태그 변경 핸들러 (localStorage)
  const handleTagsChange = (newTags) => {
    setLocalTags(newTags);
    onChange({ tags: newTags });
    
    // 글로벌 인덱스 업데이트
    Object.entries(newTags).forEach(([category, tags]) => {
      tags.forEach(tag => {
        addTagToIndex(category, tag);
      });
    });
    
    setSaveStatus('saved');
    setLastSaved(new Date());
  };

  // 블록 변경 핸들러 (IndexedDB)
  const handleBlocksChange = (newBlocks) => {
    setBlocks(newBlocks);
    saveBlocks(newBlocks);
  };

  // 블록 저장 (IndexedDB) - auto-save
  const saveBlocks = async (newBlocks) => {
    if (!selectedNote || !newBlocks) return;
    
    setSaveStatus('saving');
    try {
      const content = {
        version: '2.0',
        blocks: newBlocks,
        updatedAt: Date.now()
      };
      
      await saveBlockContent(selectedNote.id, content);
      setSaveStatus('saved');
      setLastSaved(new Date());
      console.log(`💾 블록 노트 저장: ${selectedNote.id}`, newBlocks.length, 'blocks');
    } catch (error) {
      console.error('블록 노트 저장 실패:', error);
      setSaveStatus('error');
    }
  };

  // 패널이 닫혀있으면 렌더링하지 않음
  if (!isOpen || !selectedNote) {
    return null;
  }

  return (
    <div 
      className={`right-panel-container ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{
        width: `${panelWidth}px`
      }}
    >
      {/* 리사이저 핸들 */}
      <div
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-teal-500/50 transition-colors z-50"
        onMouseDown={handleMouseDown}
        style={{
          background: isResizing ? 'rgba(20, 184, 166, 0.5)' : 'transparent'
        }}
      />
      
      <div className="h-full flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                className="w-full font-semibold bg-transparent border-b border-teal-500 focus:outline-none text-white pr-3"
                value={localTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                placeholder="제목을 입력하세요"
              />
            ) : (
              <div 
                className="font-semibold truncate pr-3 cursor-pointer hover:text-teal-400 transition-colors group"
                onClick={() => setIsEditingTitle(true)}
                title="클릭하여 제목 수정"
              >
                {localTitle}
                <span className="ml-2 text-xs opacity-0 group-hover:opacity-50 transition-opacity">✏️</span>
              </div>
            )}
          </div>
          <button 
            className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* 노트 편집 영역 */}
        <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
          {/* 요약 입력란 (localStorage) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold opacity-90">
              📋 Summary (토글 메뉴에 표시)
            </label>
            <textarea 
              className="w-full h-12 bg-black/40 border border-white/10 rounded p-2 text-xs resize-none focus:outline-none focus:border-teal-500/50 transition-colors"
              placeholder="노드 클릭 시 보여질 짧은 요약을 작성하세요..."
              value={localSummary}
              onChange={handleSummaryChange}
            />
          </div>

          {/* 구분선 */}
          <div className="border-t border-white/10"></div>

          {/* 태그 입력란 (localStorage) */}
          <TagInput 
            value={localTags}
            onChange={handleTagsChange}
            tagsIndex={tagsIndex}
          />

          {/* 구분선 */}
          <div className="border-t border-white/10"></div>

          {/* 상세 노트 입력란 (IndexedDB) - Block Editor */}
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold opacity-90">
                📝 Detailed Note (블록 에디터)
              </label>
              {isLoading && (
                <span className="text-xs text-blue-400">
                  🔄 Loading...
                </span>
              )}
              {!isLoading && blocks.length > 0 && (
                <span className="text-xs opacity-50">
                  {blocks.length} block{blocks.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex-1 bg-black/40 border border-white/10 rounded overflow-y-auto min-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📖</div>
                    <div>Loading blocks...</div>
                  </div>
                </div>
              ) : (
                <ErrorBoundary
                  onReset={() => {
                    // Reload blocks on error
                    loadDetailedNote(selectedNote.id);
                  }}
                  onFallbackToTextarea={() => {
                    console.warn('Falling back to text editor due to error');
                    // Could implement a simple textarea fallback here if needed
                  }}
                >
                  <BlockEditor
                    initialBlocks={blocks}
                    onChange={handleBlocksChange}
                    readOnly={false}
                  />
                </ErrorBoundary>
              )}
            </div>
            <div className="text-xs opacity-50 mt-1">
              💡 &quot;/&quot; 입력으로 블록 타입 선택 | 드래그로 순서 변경 | ⚡ 자동 저장
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-4 py-2 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between text-xs opacity-50">
            <div>
              <span className="text-teal-400">Summary</span>: localStorage
              <span className="mx-2">|</span>
              <span className="text-blue-400">Detailed</span>: IndexedDB
            </div>
            <div>
              {lastSaved && (
                <span className={`${
                  saveStatus === 'saving' ? 'text-yellow-400' :
                  saveStatus === 'saved' ? 'text-green-400' :
                  saveStatus === 'error' ? 'text-red-400' : ''
                }`}>
                  {saveStatus === 'saving' && '💾 Saving...'}
                  {saveStatus === 'saved' && `✓ ${lastSaved.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}`}
                  {saveStatus === 'error' && '❌ Error'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
