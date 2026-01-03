# Crisis Compass - Comprehensive Feature Test Plan

## Overview
This document outlines the complete testing strategy for all features in the Crisis_Compass website. Testing covers functionality, usability, accessibility, and data integrity.

## Test Environment
- **Local Server**: http://localhost:8000
- **Live Website**: https://aakash-srinivasan02.github.io/Crisis_Compass/
- **Test Date**: Current Session
- **Browser**: Local development environment

## Core Features to Test

### 1. Emergency Contact Features
- [ ] 988 Suicide & Crisis Lifeline link (tel:988)
- [ ] Domestic Violence Hotline link (tel:8007997233)
- [ ] Emergency services notice and links

### 2. User Interface & Navigation
- [ ] Header branding and government trust indicators
- [ ] Responsive design on different screen sizes
- [ ] Quick Exit functionality (redirects to weather.com)
- [ ] Privacy policy link

### 3. Language & Accessibility
- [ ] Language selector functionality
- [ ] Auto-detect language feature
- [ ] Supported languages: English, Español, Français, العربية
- [ ] Low Data Mode toggle
- [ ] Accessibility features (screen reader support)

### 4. Search & Filter System
- [ ] Text search functionality (city, ZIP, service)
- [ ] Service type filtering:
  - [ ] All services
  - [ ] Shelter
  - [ ] Housing
  - [ ] Mental health
  - [ ] Substance use
  - [ ] Legal aid
- [ ] State filtering (All 50 states + DC)
- [ ] Client type refinements:
  - [ ] Families
  - [ ] Women
  - [ ] Men
  - [ ] Youth
  - [ ] Veterans
- [ ] Requirements refinements:
  - [ ] Pet-friendly
  - [ ] Walk-ins
  - [ ] Wheelchair accessible

### 5. Geolocation Features
- [ ] "Use my location" button functionality
- [ ] Location permission handling
- [ ] Distance-based sorting (within 50 miles)
- [ ] User location marker on map

### 6. View Modes
- [ ] List View (default)
- [ ] Map View with Leaflet integration
- [ ] View toggle functionality
- [ ] Map markers and popups

### 7. Service Details
- [ ] Service card display
- [ ] Detail modal functionality
- [ ] Contact information display:
  - [ ] Phone number (clickable tel: link)
  - [ ] Website links (external)
  - [ ] Address information
- [ ] Service metadata:
  - [ ] Hours
  - [ ] Intake process
  - [ ] Eligibility requirements
  - [ ] Cost information
  - [ ] Capacity status
  - [ ] Client types served

### 8. Interactive Features
- [ ] Favorites system (add/remove favorites)
- [ ] "Call Now" button functionality
- [ ] "Get Directions" button functionality
- [ ] Report issue system

### 9. Data Management
- [ ] Resource loading from resources.json
- [ ] Data filtering and sorting
- [ ] Search result pagination (if applicable)
- [ ] Data persistence (favorites, preferences)

### 10. Technical Performance
- [ ] Page load times
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] Low bandwidth mode effectiveness

## Test Data
- **Sample Services**: 12 resources across 6 states (CA, FL, IL, NY, TX)
- **Service Types**: Shelter, Housing, Mental Health, Substance Use
- **Geographic Coverage**: Multiple cities with coordinates

## Expected Results
- All search and filter functions should work correctly
- Geolocation should work within 50-mile radius
- Map view should display markers with proper popups
- All contact links should be functional
- UI should be responsive and accessible

## Testing Notes
- Some features may require user interaction (geolocation permissions)
- Map functionality may be limited in low-bandwidth mode
- Language translations may be limited to available JSON files
