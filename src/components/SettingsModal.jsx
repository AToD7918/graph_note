import React from 'react';

/**
 * ⚙️ 설정 모달 컴포넌트
 * 
 * 🎯 역할:
 * - 저장소 모드 선택 (Local/Remote)
 * - 로컬 캐시 삭제
 * 
 * 📦 Props:
 * @param {boolean} open - 모달 열림 상태
 * @param {Function} onClose - 모달 닫기 핸들러
 * @param {string} storageMode - 현재 저장소 모드 ('local' | 'remote')
 * @param {Function} setStorageMode - 저장소 모드 변경 함수
 * @param {Function} clearLocal - 로컬 캐시 삭제 함수
 */
export function SettingsModal({ open, onClose, storageMode, setStorageMode, clearLocal }) {
  if (!open) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-settings" onClick={(e)=>e.stopPropagation()}>
        <div className="text-lg font-semibold mb-3">Settings</div>
        <div className="space-y-4 text-sm">
          <div>
            <div className="opacity-70 mb-1">Storage Mode</div>
            <div className="flex gap-2">
              <button 
                className={`px-3 py-1 rounded ${storageMode==='local'?'bg-white/10':''}`} 
                onClick={()=>setStorageMode('local')}
              >
                Local (default)
              </button>
              <button 
                className={`px-3 py-1 rounded ${storageMode==='remote'?'bg-white/10':''}`} 
                onClick={()=>setStorageMode('remote')}
              >
                Remote (placeholder)
              </button>
            </div>
            <div className="text-xs opacity-60 mt-1">
              Remote는 아직 미구현이며, 후에 서버 연동 시 어댑터만 교체하면 됩니다.
            </div>
          </div>
          <div>
            <div className="opacity-70 mb-1">Layout</div>
            <div className="text-xs opacity-70">
              기본은 계층적 자동 배치로 고정됩니다. 개별 노드 우클릭으로 "Switch to Force"(unlock) 전환 가능.
            </div>
          </div>
          <div>
            <button 
              className="px-3 py-1 rounded bg-red-600/80 hover:bg-red-600" 
              onClick={clearLocal}
            >
              Clear Local Cache
            </button>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button 
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" 
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
