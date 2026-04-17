@echo off
echo ============================================
echo   MySQL Root 密码重置脚本
echo   新密码将设为: huang426523
echo ============================================
echo.

:: 1. 停止 MySQL 服务
echo [1/4] 正在停止 MySQL 服务...
net stop MySQL80
if %errorlevel% neq 0 (
    echo 停止服务失败，请确保以管理员身份运行此脚本！
    pause
    exit /b 1
)
echo MySQL 服务已停止
echo.

:: 2. 创建临时 SQL 文件
echo [2/4] 创建密码重置 SQL 文件...
set SQLFILE=%TEMP%\mysql_reset.sql
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'huang426523'; > "%SQLFILE%"
echo FLUSH PRIVILEGES; >> "%SQLFILE%"
echo SQL 文件已创建: %SQLFILE%
echo.

:: 3. 用 init-file 启动 MySQL
echo [3/4] 用 --init-file 启动 MySQL 重置密码...
start "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --init-file="%SQLFILE%"
echo 等待 MySQL 启动...
timeout /t 8 /nobreak >nul
echo.

:: 4. 关闭 mysqld 进程，恢复服务方式运行
echo [4/4] 恢复 MySQL 服务模式运行...
taskkill /f /im mysqld.exe >nul 2>&1
timeout /t 3 /nobreak >nul
net start MySQL80
echo.

:: 5. 验证
echo 正在验证连接...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -phuang426523 -e "SELECT '密码重置成功！' AS result;"
if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo   密码重置成功！新密码: huang426523
    echo ============================================
) else (
    echo.
    echo 验证失败，请检查上方输出信息
)

:: 清理临时文件
del "%SQLFILE%" >nul 2>&1
pause
