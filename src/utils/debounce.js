/**
 * 디바운스 유틸리티 함수
 * 
 * 연속된 함수 호출을 지연시켜 마지막 호출만 실행
 * localStorage 저장과 같은 비용이 큰 작업을 최적화
 * 
 * @template {Function} T
 * @param {T} func - 디바운스할 함수
 * @param {number} delay - 지연 시간 (ms)
 * @returns {T} 디바운스된 함수
 */
export function debounce(func, delay) {
  let timeoutId;
  
  return function debounced(...args) {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * 쓰로틀 유틸리티 함수
 * 
 * 연속된 함수 호출을 일정 간격으로 제한
 * 스크롤, 리사이즈와 같은 빈번한 이벤트 최적화
 * 
 * @template {Function} T
 * @param {T} func - 쓰로틀할 함수
 * @param {number} limit - 최소 실행 간격 (ms)
 * @returns {T} 쓰로틀된 함수
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
