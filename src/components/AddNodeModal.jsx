import React from 'react';

/**
 * ➕ 노드 추가 모달 컴포넌트
 * 
 * 🎯 역할:
 * - 새로운 노드(논문) 추가
 * - 제목, 그룹, 링크 타입, 연결 대상 설정
 * 
 * 📦 Props:
 * @param {boolean} open - 모달 열림 상태
 * @param {Function} onClose - 모달 닫기 핸들러
 * @param {Object} graph - 그래프 데이터 { nodes: [], links: [] }
 * @param {Function} addNode - 노드 추가 함수
 * @param {Object} form - 폼 상태 { title, group, linkType, connectTo }
 * @param {Function} setForm - 폼 상태 변경 함수
 */
export function AddNodeModal({ open, onClose, graph, addNode, form, setForm }) {
  if (!open) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-add-node" onClick={(e)=>e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Add New Node</h2>
            <p className="text-xs text-white/50 mt-0.5">Create a new node in your graph</p>
          </div>
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* 폼 필드 */}
        <div className="space-y-3">
          {/* Title 입력 */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-white/90">
              <span className="text-teal-400 text-sm">📝</span>
              Node Title
            </label>
            <input 
              className="input-field w-full px-3 py-2 text-sm" 
              value={form.title} 
              onChange={(e)=>setForm({...form, title:e.target.value})} 
              placeholder="Enter node title..."
              autoFocus
            />
          </div>

          {/* 연결 설정 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                <span className="text-teal-400 text-sm">🎯</span>
                Connect To
              </label>
              <select 
                className="input-field w-full px-3 py-2 text-sm" 
                value={form.connectTo} 
                onChange={(e)=>setForm({...form, connectTo:e.target.value})}
              >
                {graph.nodes.map(n=> (
                  <option key={n.id} value={n.id}>{n.id}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                <span className="text-teal-400 text-sm">🔗</span>
                Link Direction
              </label>
              <select 
                className="input-field w-full px-3 py-2 text-sm" 
                value={form.linkType} 
                onChange={(e)=>{
                  const linkType = e.target.value;
                  const group = form.isCore ? 1 : (linkType === 'based-on' ? 2 : 3);
                  setForm({...form, linkType, group});
                }}
              >
                <option value="based-on">← Based On</option>
                <option value="cited-by">→ Cited By</option>
              </select>
            </div>
          </div>

          {/* 노드 속성 */}
          <div className="space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-xs font-medium text-white/90 mb-2">Node Properties</div>
            
            <label className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-white/5 transition-colors">
              <input 
                type="checkbox" 
                checked={form.isCore || false}
                onChange={(e)=>{
                  const isCore = e.target.checked;
                  const group = isCore ? 1 : (form.linkType === 'based-on' ? 2 : 3);
                  setForm({...form, isCore, group});
                }}
                className="w-4 h-4 rounded border-2 border-white/30 checked:bg-teal-500 checked:border-teal-500 transition-colors"
              />
              <div className="flex-1">
                <div className="text-xs font-medium text-white/90 group-hover:text-white transition-colors">
                  Core Node
                </div>
                <div className="text-[10px] text-white/50 leading-tight">
                  Group 1 • Inner white circle
                </div>
              </div>
              <span className="text-base">⭕</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-white/5 transition-colors">
              <input 
                type="checkbox" 
                checked={form.isLocked || false}
                onChange={(e)=>{
                  setForm({...form, isLocked: e.target.checked});
                }}
                className="w-4 h-4 rounded border-2 border-white/30 checked:bg-teal-500 checked:border-teal-500 transition-colors"
              />
              <div className="flex-1">
                <div className="text-xs font-medium text-white/90 group-hover:text-white transition-colors">
                  Lock to Radial Layout
                </div>
                <div className="text-[10px] text-white/50 leading-tight">
                  Fixed position • White border
                </div>
              </div>
              <span className="text-base">🔒</span>
            </label>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end gap-2">
          <button 
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white/80 hover:text-white font-medium text-sm" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all text-sm" 
            onClick={addNode}
          >
            Create Node
          </button>
        </div>
      </div>
    </div>
  );
}
