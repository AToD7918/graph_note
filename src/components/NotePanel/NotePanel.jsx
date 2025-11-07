import React, { useState, useEffect } from 'react';
import { loadNoteDetail, saveNoteDetail } from '../../adapters/noteStorage';
import { TagInput } from './Tag/TagInput';
import { addTagToIndex } from '../../utils/tagHelpers';

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
export function NotePanel({ selectedNote, onClose, onChange, isOpen, panelWidth, setPanelWidth, tagsIndex = {} }) {
  // 요약 (summary) - localStorage
  const [localSummary, setLocalSummary] = useState('');
  
  // 태그 (tags) - localStorage
  const [localTags, setLocalTags] = useState({});
  
  // 상세 노트 (detailedNote) - IndexedDB
  const [detailedNote, setDetailedNote] = useState('');
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  
  // 저장 상태
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' | 'saved' | ''
  
  // 워드 카운트
  const [summaryWords, setSummaryWords] = useState(0);
  const [detailedWords, setDetailedWords] = useState(0);

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

  // IndexedDB에서 상세 노트 로드
  const loadDetailedNote = async (nodeId) => {
    setIsLoading(true);
    try {
      const content = await loadNoteDetail(nodeId);
      setDetailedNote(content || '');
      updateWordCount(content || '', 'detailed');
      console.log(`📖 상세 노트 로드: ${nodeId}`);
    } catch (error) {
      console.error('상세 노트 로드 실패:', error);
      setDetailedNote('');
    } finally {
      setIsLoading(false);
    }
  };

  // 워드 카운트 계산
  const updateWordCount = (text, type) => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    if (type === 'summary') {
      setSummaryWords(words.length);
    } else {
      setDetailedWords(words.length);
    }
  };

  // 선택된 노트 변경 시 데이터 로드
  useEffect(() => {
    if (selectedNote && isOpen) {
      // 요약 로드 (localStorage에서 이미 로드됨)
      setLocalSummary(selectedNote.summary || '');
      updateWordCount(selectedNote.summary || '', 'summary');
      
      // 태그 로드 (localStorage)
      setLocalTags(selectedNote.tags || {});
      
      // 상세 노트 로드 (IndexedDB에서 Lazy Loading)
      loadDetailedNote(selectedNote.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote, isOpen]);

  // 요약 변경 핸들러 (localStorage)
  const handleSummaryChange = (e) => {
    const newValue = e.target.value;
    setLocalSummary(newValue);
    updateWordCount(newValue, 'summary');
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

  // 상세 노트 변경 핸들러 (IndexedDB)
  const handleDetailedNoteChange = async (e) => {
    const newValue = e.target.value;
    setDetailedNote(newValue);
    updateWordCount(newValue, 'detailed');
    
    // IndexedDB에 저장
    setSaveStatus('saving');
    try {
      await saveNoteDetail(selectedNote.id, newValue);
      setSaveStatus('saved');
      setLastSaved(new Date());
      console.log(`💾 상세 노트 저장: ${selectedNote.id}`);
    } catch (error) {
      console.error('상세 노트 저장 실패:', error);
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
            <div className="font-semibold truncate pr-3">{selectedNote.title}</div>
            <div className="text-xs opacity-50 mt-1">
              {selectedNote.group === 1 ? '🎯 Core' : 
               selectedNote.group === 2 ? '➡️ Forward' : 
               '⬅️ Backward'}
            </div>
          </div>
          <button 
            className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* 메타 정보 */}
        <div className="px-4 py-2 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between text-xs opacity-70">
            <div>
              ID: <span className="font-mono">{selectedNote.id}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                Summary: {summaryWords}w / Detailed: {detailedWords}w
              </span>
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

        {/* 노트 편집 영역 */}
        <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* 요약 입력란 (localStorage) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold opacity-90">
                📋 Summary (토글 메뉴에 표시)
              </label>
              <span className="text-xs opacity-50">
                {summaryWords} words
              </span>
            </div>
            <textarea 
              className="w-full h-24 bg-black/40 border border-white/10 rounded p-3 text-sm resize-none focus:outline-none focus:border-teal-500/50 transition-colors"
              placeholder="노드 클릭 시 보여질 짧은 요약을 작성하세요..."
              value={localSummary}
              onChange={handleSummaryChange}
            />
            <div className="text-xs opacity-50">
              💡 짧은 요약으로 노트의 핵심을 파악할 수 있습니다
            </div>
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

          {/* 상세 노트 입력란 (IndexedDB) */}
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold opacity-90">
                📝 Detailed Note (상세 내용)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-50">
                  {detailedWords} words
                </span>
                {isLoading && (
                  <span className="text-xs text-blue-400">
                    🔄 Loading...
                  </span>
                )}
              </div>
            </div>
            <textarea 
              className="flex-1 w-full bg-black/40 border border-white/10 rounded p-3 text-sm resize-none focus:outline-none focus:border-teal-500/50 transition-colors min-h-[300px]"
              placeholder="상세한 노트 내용을 작성하세요...

💡 팁:
- 연구 배경 및 동기
- 핵심 아이디어 및 방법론
- 실험 결과 및 분석
- 참고할 점 및 개인적 의견
- 향후 연구 방향

⚡ 자동 저장됨 (IndexedDB)"
              value={detailedNote}
              onChange={handleDetailedNoteChange}
              disabled={isLoading}
            />
            <div className="text-xs opacity-50">
              💾 IndexedDB에 자동 저장 (대용량 지원)
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
          </div>
        </div>
      </div>
    </div>
  );
}
