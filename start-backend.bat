@echo off
echo ---------------------------------------------------
echo Setting up local JDK 17 and Maven environment...
echo ---------------------------------------------------

set JAVA_HOME=%~dp0.tools\jdk-17.0.2
set M2_HOME=%~dp0.tools\apache-maven-3.9.6
set PATH=%JAVA_HOME%\bin;%M2_HOME%\bin;%PATH%

echo Java Version:
java -version
echo.
echo Maven Version:
call mvn -version
echo.
echo Starting Spring Boot Backend...
cd "%~dp0backend"
call mvn spring-boot:run
pause
