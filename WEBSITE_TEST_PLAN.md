# Crisis Compass Website Testing Plan

## Test URL
**Website:** https://aakash-srinivasan02.github.io/Crisis_Compass/

## Test Environment
- **Browser:** Chrome, Firefox, Safari, Edge (latest versions)
- **Device:** Desktop, Tablet, Mobile
- **Network:** WiFi, 4G/5G

---

## 1. Visual & UI Testing ✅

### 1.1 Header & Branding
- [ ] Verify logo and title "Crisis Compass" display correctly
- [ ] Check "U.S. Department of Health & Human Services" header
- [ ] Verify "SAMHSA" mission statement
- [ ] Confirm trust badges display:
  - [ ] "Official Government Website"
  - [ ] "Verified Data Source"

### 1.2 Emergency Hotlines (Top Bar)
- [ ] Verify 988 Suicide & Crisis Lifeline link
- [ ] Verify Domestic Violence Hotline (1-800-799-7233)
- [ ] Test clickable phone links
- [ ] Check responsive layout on mobile

### 1.3 Utility Controls
- [ ] Language selector dropdown (Auto-detect, English, Español, Français, العربية)
- [ ] Low-Data Mode toggle button
- [ ] Quick Exit button (red emergency button)
- [ ] Privacy link

### 1.4 Search Section
- [ ] Search input field with placeholder
- [ ] Service type filter dropdown:
  - [ ] All services
  - [ ] Shelter
  - [ ] Housing
  - [ ] Mental health
  - [ ] Substance use
  - [ ] Legal aid
- [ ] State filter dropdown (50 US states)
- [ ] "Find Local, Verified Help" CTA button
- [ ] "Use my location" geolocation button
- [ ] View toggle buttons (List View / Map View)

### 1.5 Refinement Filters
- [ ] Client type checkboxes:
  - [ ] Families
  - [ ] Women
  - [ ] Men
  - [ ] Youth
  - [ ] Veterans
- [ ] Requirements checkboxes:
  - [ ] Pet-friendly
  - [ ] Walk-ins
  - [ ] Wheelchair

### 1.6 Results Display
- [ ] Service cards display correctly
- [ ] Verified badges on verified services
- [ ] Distance badges (when location enabled)
- [ ] Capacity status indicators
- [ ] Cost badges
- [ ] Hours badges
- [ ] "View Details" buttons
- [ ] "Call Now" buttons
- [ ] "Directions" buttons

### 1.7 Footer
- [ ] Crisis Compass information
- [ ] Emergency contacts
- [ ] Privacy Policy link
- [ ] Copyright information

---

## 2. Functionality Testing ✅

### 2.1 Search Functionality
- [ ] **Basic Search:** Search by city name (e.g., "Springfield")
- [ ] **ZIP Code Search:** Search by ZIP code (e.g., "62701")
- [ ] **Service Type Filter:** Filter by service type
- [ ] **State Filter:** Filter by state
- [ ] **Combined Search:** Use multiple filters together
- [ ] **Keyboard Navigation:** Press Enter to search
- [ ] **Clear Filters:** Reset all filters

### 2.2 Geolocation Feature
- [ ] Click "Use my location" button
- [ ] Grant location permission (if prompted)
- [ ] Verify location indicator appears
- [ ] Confirm results sorted by distance
- [ ] Test with location denied
- [ ] Test with location unavailable

### 2.3 View Toggle
- [ ] **List View:** Default view displays results as cards
- [ ] **Map View:** Switch to interactive map
- [ ] Verify map markers display correctly
- [ ] Test map popup functionality
- [ ] Check user location marker on map
- [ ] Verify distance information in map popups

### 2.4 Service Details Modal
- [ ] Click "View Details" on a service
- [ ] Verify modal opens
- [ ] Check all service information displays:
  - [ ] Name and verification status
  - [ ] Type and location
  - [ ] Address
  - [ ] Phone number (clickable)
  - [ ] Website link
  - [ ] Hours
  - [ ] Intake process
  - [ ] Eligibility requirements
  - [ ] Cost
  - [ ] Capacity status
- [ ] Test report issue form
- [ ] Close modal functionality
- [ ] Test clicking outside modal to close

### 2.5 Quick Exit Feature
- [ ] Click Quick Exit button
- [ ] Verify redirects to weather.com
- [ ] Check browser history is cleared

### 2.6 Low-Data Mode
- [ ] Click "Low-Data Mode" button
- [ ] Verify alert displays
- [ ] Confirm maps are disabled
- [ ] Check reduced data usage indicators
- [ ] Toggle mode off
- [ ] Verify preference saved in localStorage

### 2.7 Internationalization (i18n)
- [ ] Switch to Spanish (Español)
- [ ] Switch to French (Français)
- [ ] Switch to Arabic (العربية)
- [ ] Test "Auto-detect" language detection
- [ ] Verify translations apply correctly
- [ ] Check RTL layout for Arabic

---

## 3. Accessibility Testing ✅

### 3.1 Screen Reader Compatibility
- [ ] All images have alt text (or are decorative)
- [ ] Form inputs have associated labels
- [ ] ARIA labels on interactive elements
- [ ] Live regions for dynamic content
- [ ] Modal has proper ARIA attributes

### 3.2 Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Skip links present (if applicable)
- [ ] Escape key closes modals
- [ ] Arrow keys in dropdowns

### 3.3 Color & Contrast
- [ ] Text meets WCAG contrast requirements
- [ ] Links distinguishable from text
- [ ] Focus states clearly visible
- [ ] Error states have sufficient contrast

### 3.4 Responsive Design
- [ ] Desktop (1920px, 1440px, 1280px)
- [ ] Tablet (768px, 820px)
- [ ] Mobile (375px, 414px)
- [ ] Landscape orientation on mobile

---

## 4. Performance Testing ✅

### 4.1 Page Load Performance
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Total Blocking Time (TBT) < 200ms

### 4.2 Resource Loading
- [ ] CSS loads without render blocking
- [ ] JavaScript loads efficiently
- [ ] Images optimized (if any)
- [ ] No excessive network requests

### 4.3 Map Performance
- [ ] Map loads lazily (on demand)
- [ ] Markers load efficiently
- [ ] No memory leaks on map view toggle

---

## 5. Data & Content Testing ✅

### 5.1 Resources Data
- [ ] Sample data loads correctly
- [ ] All 12 sample resources display
- [ ] Geographic coverage (CA, FL, IL, NY, TX)
- [ ] Service types represented:
  - [ ] Shelter (5 resources)
  - [ ] Housing (4 resources)
  - [ ] Mental health (3 resources)
  - [ ] Substance use (3 resources)

### 5.2 Data Accuracy
- [ ] Phone numbers are properly formatted
- [ ] Addresses appear valid
- [ ] Coordinates are valid lat/lon values
- [ ] Service categories match content

### 5.3 Source Attribution
- [ ] HUD-sourced resources marked
- [ ] SAMHSA-sourced resources marked
- [ ] Source dates displayed correctly

---

## 6. Mobile-Specific Testing ✅

### 6.1 Touch Interactions
- [ ] Touch targets large enough (44x44px minimum)
- [ ] Swipe gestures work (if applicable)
- [ ] No horizontal scrolling
- [ ] Pinch zoom disabled appropriately

### 6.2 Responsive Layout
- [ ] Single column layout on mobile
- [ ] Stack utility controls
- [ ] Full-width search button
- [ ] Cards stack vertically
- [ ] Modal fits within viewport

### 6.3 Mobile Performance
- [ ] Fast load on 4G network
- [ ] Efficient battery usage
- [ ] Low data mode works properly

---

## 7. Emergency Features Testing ✅

### 7.1 Crisis Hotlines
- [ ] 988 Lifeline prominently displayed
- [ ] Domestic Violence Hotline visible
- [ ] Phone links work on mobile
- [ ] Hotlines accessible from any page

### 7.2 Quick Exit
- [ ] Always visible in header
- [ ] Works from any state
- [ ] No confirmation dialog (speed critical)
- [ ] Clears browser history

### 7.3 Emergency Notice
- [ ] Emergency services info present
- [ ] 911 call instructions
- [ ] 988 crisis line reminder

---

## 8. Security & Privacy Testing ✅

### 8.1 HTTPS
- [ ] Site loads over HTTPS
- [ ] No mixed content warnings
- [ ] Valid SSL certificate

### 8.2 Data Privacy
- [ ] Privacy policy accessible
- [ ] No unnecessary data collection
- [ ] LocalStorage only for preferences
- [ ] Anonymous reporting feature

### 8.3 External Links
- [ ] All external links use `rel="noopener"`
- [ ] Phone links use `tel:` protocol
- [ ] No sensitive information in URLs

---

## 9. Browser Compatibility Testing ✅

### 9.1 Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### 9.2 Mobile Browsers
- [ ] Safari on iOS
- [ ] Chrome on Android
- [ ] Samsung Internet

### 9.3 Feature Support
- [ ] Fetch API supported
- [ ] Geolocation API supported
- [ ] LocalStorage supported
- [ ] CSS Grid/Flexbox supported

---

## 10. Error Handling Testing ✅

### 10.1 Network Errors
- [ ] Handle failed resource loading
- [ ] Show user-friendly error message
- [ ] Retry mechanism (if applicable)

### 10.2 Geolocation Errors
- [ ] Permission denied handling
- [ ] Position unavailable handling
- [ ] Timeout handling
- [ ] User-friendly error messages

### 10.3 Empty Results
- [ ] "No services found" message
- [ ] Helpful suggestions for refinement
- [ ] Clear all filters button

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Clear browser cache
- [ ] Reset localStorage
- [ ] Disable browser extensions
- [ ] Prepare test data/devices

### Test Execution
- [ ] Follow test cases in order
- [ ] Document any failures
- [ ] Capture screenshots of issues
- [ ] Note browser version and device

### Post-Test
- [ ] Review all failures
- [ ] Prioritize fixes
- [ ] Re-test after fixes
- [ ] Generate test report

---

## Expected Results Summary

### ✅ All Tests Should Pass
1. Page loads successfully on all browsers
2. Search functionality works correctly
3. Geolocation finds and sorts by distance
4. Map view displays properly
5. Service details modal opens and closes
6. Internationalization switches languages
7. Quick exit redirects safely
8. Low-data mode reduces data usage
9. All emergency hotlines accessible
10. Accessibility standards met

### ⚠️ Potential Issues to Monitor
1. Map loading time on slow connections
2. Geolocation permission prompts
3. Mobile layout on very small screens
4. Browser-specific rendering differences

---

## Test Tools Recommended
- **Browser DevTools** - Performance and network analysis
- **Lighthouse** - Accessibility and performance auditing
- **WAVE** - Accessibility testing
- **axe DevTools** - Accessibility scanning
- **BrowserStack** - Cross-browser testing

---

*Last Updated: 2024*
*Test Plan Version: 1.0*

