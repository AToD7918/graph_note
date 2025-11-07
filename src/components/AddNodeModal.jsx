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
        <div className="text-lg font-semibold mb-3">Add Node</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="opacity-70">Title</span>
            <input 
              className="input-field" 
              value={form.title} 
              onChange={(e)=>setForm({...form, title:e.target.value})} 
              placeholder="e.g., New Paper" 
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="opacity-70">Group</span>
            <select 
              className="input-field" 
              value={form.group} 
              onChange={(e)=>setForm({...form, group:e.target.value})}
            >
              <option value={1}>Core</option>
              <option value={2}>Forward</option>
              <option value={3}>Backward</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="opacity-70">Link Type</span>
            <select 
              className="input-field" 
              value={form.linkType} 
              onChange={(e)=>setForm({...form, linkType:e.target.value})}
            >
              <option value="forward">Core/기준 → 새 노드</option>
              <option value="backward">새 노드 → Core/기준</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="opacity-70">Connect To</span>
            <select 
              className="input-field" 
              value={form.connectTo} 
              onChange={(e)=>setForm({...form, connectTo:e.target.value})}
            >
              {graph.nodes.map(n=> (
                <option key={n.id} value={n.id}>{n.id}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button 
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-3 py-1 rounded bg-teal-500 text-black font-semibold hover:bg-teal-400" 
            onClick={addNode}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
