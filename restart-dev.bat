@echo off
echo ========================================
echo   Graph Note 개발 서버 재시작
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] node_modules/.vite 캐시 삭제 중...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ? 캐시 삭제 완료
) else (
    echo - 캐시가 없습니다
)
echo.

echo [2/4] dist 폴더 삭제 중...
if exist "dist" (
    rmdir /s /q "dist"
    echo ? dist 삭제 완료
) else (
    echo - dist가 없습니다
)
echo.

echo [3/4] 브라우저 캐시를 지워주세요!
echo    - Chrome: Ctrl+Shift+Delete
echo    - 또는 시크릿 모드로 열기: Ctrl+Shift+N
echo.

echo [4/4] 개발 서버 시작 중...
echo.
npm run dev

pause
