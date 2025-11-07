import React, { useState } from 'react';

/**
 * ? 커스텀 색상 선택기 컴포넌트
 * 
 * ? 역할:
 * - HSL 색상 모델 기반 커스텀 색상 선택
 * - Hue, Saturation, Lightness 슬라이더 제공
 * - 실시간 색상 미리보기
 * 
 * ? Props:
 * @param {Function} onApply - 색상 적용 핸들러 (color: string) => void
 * @param {Function} onCancel - 취소 핸들러
 */
export function ColorPicker({ onApply, onCancel }) {
  const [hue, setHue] = useState(180);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(60);
  
  // HSL을 HEX로 변환
  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  
  const customColor = hslToHex(hue, saturation, lightness);
  
  return (
    <div className="bg-white/5 border border-white/20 rounded-lg p-2 space-y-2">
      {/* 색상 미리보기 */}
      <div className="flex items-center gap-2">
        <div 
          className="flex-1 h-10 rounded border border-white/30"
          style={{ backgroundColor: customColor }}
        />
        <div className="text-xs font-mono opacity-70">{customColor}</div>
      </div>
      
      {/* Hue 슬라이더 */}
      <div>
        <div className="text-xs opacity-70 mb-1">Hue</div>
        <input 
          type="range" 
          min="0" 
          max="360" 
          value={hue}
          onChange={(e)=>setHue(Number(e.target.value))}
          className="w-full h-2 rounded appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
          }}
        />
      </div>
      
      {/* Saturation 슬라이더 */}
      <div>
        <div className="text-xs opacity-70 mb-1">Saturation</div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={saturation}
          onChange={(e)=>setSaturation(Number(e.target.value))}
          className="w-full h-2 rounded appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(${hue}, 0%, 50%), hsl(${hue}, 100%, 50%))`
          }}
        />
      </div>
      
      {/* Lightness 슬라이더 */}
      <div>
        <div className="text-xs opacity-70 mb-1">Lightness</div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={lightness}
          onChange={(e)=>setLightness(Number(e.target.value))}
          className="w-full h-2 rounded appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))`
          }}
        />
      </div>
      
      {/* 버튼 */}
      <div className="flex gap-1 pt-1">
        <button 
          className="flex-1 px-2 py-1 rounded bg-teal-500/80 hover:bg-teal-500 text-xs text-black font-semibold"
          onClick={()=>onApply(customColor)}
        >
          Apply
        </button>
        <button 
          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
