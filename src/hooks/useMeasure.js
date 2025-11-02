import { useRef, useState, useEffect } from 'react';

/**
 * 리사이즈 관찰 훅
 * 컨테이너의 크기를 실시간으로 측정하여 반환
 */
export function useMeasure() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ width: Math.floor(cr.width), height: Math.floor(cr.height) });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  
  return [ref, size];
}
