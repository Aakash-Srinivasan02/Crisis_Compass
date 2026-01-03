# Full Test Plan for Crisis_Compass

## Test Overview
This document outlines the comprehensive testing strategy for Crisis_Compass project.

## Test Files Available

### 1. Python Comprehensive Feature Tests (`test_all_features.py`)
- **Purpose**: End-to-end testing of all website features
- **Tests**: 
  - Server connectivity
  - Main page loading and key elements
  - Resources data validation
  - CSS file integrity
  - JavaScript file validation
  - Privacy page testing
  - Internationalization files
  - Emergency hotline links
  - Search functionality elements
- **Requirements**: Python 3, requests library

### 2. JavaScript Function Tests (`test-functions.js`)
- **Purpose**: Unit testing of individual functions
- **Tests**:
  - Backend: calculateDistance, loadResources, validateResource, pagination, filtering
  - Frontend: escapeHtml, matchText, distanceMiles, passesRefinements, translations
  - Location features: geolocation, map setup, distance calculation
- **Requirements**: Node.js

### 3. API Integration Tests (`test-api.sh`)
- **Purpose**: Integration testing of API infrastructure
- **Tests**:
  - Directory structure verification
  - Node.js installation check
  - Dependencies validation
  - JSON file validation
  - ETL script execution
  - API server startup and health check
- **Requirements**: Bash, Node.js, Python 3

## Execution Order

1. **Start local web server** (port 8000)
2. **Run Python comprehensive tests**
3. **Run JavaScript function tests**
4. **Run API integration tests**
5. **Generate combined test report**

## Success Criteria
- All tests pass
- No console errors
- All features functional
- Website responsive and accessible
