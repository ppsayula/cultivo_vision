@echo off
echo ========================================
echo BerryVision - Separacion de Aplicaciones
echo ========================================
echo.

echo [1/8] Creando estructura de BerryVision Lab...
cd berryvision-lab 2>nul || mkdir berryvision-lab
cd berryvision-lab

echo [2/8] Copiando archivos base de configuracion...
copy ..\web\package.json package.json >nul
copy ..\web\next.config.ts next.config.ts >nul
copy ..\web\tailwind.config.ts tailwind.config.ts >nul
copy ..\web\tsconfig.json tsconfig.json >nul
copy ..\web\.gitignore .gitignore >nul
copy ..\web\.env.local .env.local >nul

echo [3/8] Actualizando package.json para puerto 3001...
powershell -Command "(Get-Content package.json) -replace '\"name\": \"web\"', '\"name\": \"berryvision-lab\"' | Set-Content package.json"
powershell -Command "(Get-Content package.json) -replace '\"dev\": \"next dev\"', '\"dev\": \"next dev -p 3001\"' | Set-Content package.json"
powershell -Command "(Get-Content package.json) -replace '\"start\": \"next start\"', '\"start\": \"next start -p 3001\"' | Set-Content package.json"

echo [4/8] Creando estructura de carpetas...
mkdir src\app 2>nul
mkdir src\components 2>nul
mkdir src\lib 2>nul
mkdir public 2>nul

echo [5/8] Copiando librerias compartidas...
xcopy /E /I /Y ..\web\src\lib src\lib >nul

echo [6/8] Copiando paginas de gestion a Lab...
xcopy /E /I /Y ..\web\src\app\upload src\app\upload >nul
xcopy /E /I /Y ..\web\src\app\entrenar src\app\entrenar >nul
xcopy /E /I /Y ..\web\src\app\dataset src\app\dataset >nul
xcopy /E /I /Y ..\web\src\app\laboratorio src\app\laboratorio >nul
xcopy /E /I /Y ..\web\src\app\asistente src\app\asistente >nul
xcopy /E /I /Y ..\web\src\app\admin src\app\admin >nul

echo [7/8] Copiando APIs...
xcopy /E /I /Y ..\web\src\app\api\rag src\app\api\rag >nul
xcopy /E /I /Y ..\web\src\app\api\training src\app\api\training >nul
xcopy /E /I /Y ..\web\src\app\api\upload-image src\app\api\upload-image >nul
xcopy /E /I /Y ..\web\src\app\api\export-dataset src\app\api\export-dataset >nul

echo [8/8] Instalando dependencias...
call npm install

echo.
echo ========================================
echo COMPLETADO!
echo ========================================
echo.
echo App Lab creada en: berryvision-lab/
echo.
echo Para iniciar Lab:
echo   cd berryvision-lab
echo   npm run dev
echo.
echo Para iniciar Field (web actual):
echo   cd web
echo   npm run dev
echo.
echo Lab correra en: http://localhost:3001
echo Field correra en: http://localhost:3000
echo ========================================
pause
