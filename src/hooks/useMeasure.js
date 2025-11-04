import { useRef, useState, useEffect } from 'react';

/**
 * 리사이즈 관찰 훅 (Custom React Hook)
 * 
 * ? 이 훅의 역할:
 * - DOM 요소의 크기를 실시간으로 측정
 * - 창 크기 변경, 패널 열림/닫힘 시 자동으로 크기 업데이트
 * - ForceGraph2D의 width/height를 동적으로 계산하는 데 사용
 * 
 * @returns {Array} [ref, size]
 *   - ref: 측정할 DOM 요소에 연결할 ref 객체
 *   - size: { width: number, height: number } 현재 크기
 * 
 * ? 사용 예시:
 * ```jsx
 * const [containerRef, size] = useMeasure();
 * return (
 *   <div ref={containerRef}>
 *     <Canvas width={size.width} height={size.height} />
 *   </div>
 * );
 * ```
 */
export function useMeasure() {
  // ? ref: DOM 요소에 대한 참조를 저장
  // null로 초기화 (아직 DOM에 연결 안 됨)
  const ref = useRef(null);
  
  // ? size: 현재 측정된 크기를 state로 관리
  // 초기값: { width: 0, height: 0 }
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  /**
   * ? ResizeObserver 설정 (컴포넌트 마운트 시 실행)
   * 
   * ResizeObserver란?
   * - 브라우저 API로, 요소의 크기 변화를 감지
   * - window.resize보다 정확하고 효율적
   * - 특정 요소만 관찰 가능
   */
  useEffect(() => {
    // ref가 DOM에 연결되지 않았으면 종료
    if (!ref.current) return;
    
    // ResizeObserver 생성: 크기 변화 감지 시 콜백 실행
    const ro = new ResizeObserver((entries) => {
      // entries[0]: 관찰 중인 요소 (우리는 하나만 관찰)
      const cr = entries[0].contentRect;  // contentRect: 실제 콘텐츠 영역 크기
      
      // ? 측정된 크기를 state에 저장 (소수점 버림)
      setSize({ 
        width: Math.floor(cr.width),   // 가로 크기
        height: Math.floor(cr.height)  // 세로 크기
      });
    });
    
    // ? 관찰 시작: ref.current 요소의 크기 변화 감지
    ro.observe(ref.current);
    
    // ? cleanup: 컴포넌트 언마운트 시 관찰 중지
    // 메모리 누수 방지를 위해 필수!
    return () => ro.disconnect();
  }, []); // 빈 배열: 컴포넌트 마운트 시 1번만 실행
  
  // [ref, size] 반환: 구조 분해 할당으로 사용
  return [ref, size];
}
