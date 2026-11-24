@echo off
title CampusNav - Cloud-Based Smart Indoor Campus Navigation
echo =========================================================================
echo  CampusNav: Smart Indoor Campus Navigation and Facility Locator
echo  RV University - School of Computer Science and Engineering (SoCSE)
echo =========================================================================
echo.
echo Starting CampusNav Server on http://localhost:5000 ...
echo Open your browser and navigate to: http://localhost:5000/
echo.
cd /d "%~dp0backend"
node src/server.js
pause
