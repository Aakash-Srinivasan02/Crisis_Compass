# TODO: Fill White Spaces and Add State Dropdown

## Information Gathered
- Current webpage has white spaces in results section and info section.
- Resources.json contains data only for Illinois (IL).
- GET_ALL_50_STATES_QUICK_START.md provides a plan to expand to all 50 states, but not implemented.
- HTML search form has city/zip input, filter dropdown, geolocate button.
- Info section has basic "Our Values" and emergency info.

## Plan
- Add a state dropdown to the search form with all 50 US states.
- Update scripts.js to filter search results by selected state.
- Add placeholder images (SVG icons) to the info section for services.
- Add more content to the info section to fill white spaces.
- Ensure the dropdown is functional even with current IL-only data.

## Dependent Files to be Edited
- index.html: Add state select to search form.
- scripts.js: Update doSearch and related functions to handle state filtering.
- styles.css: Add styles for new elements if needed.

## Followup Steps
- Test the state dropdown functionality.
- Verify search filters by state.
- Check if more data expansion is needed for full functionality.
- Add placeholder images for services in info section.

## Completed Tasks
- [x] Added state dropdown with all 50 US states to index.html
- [x] Updated scripts.js to filter by selected state in doSearch function
- [x] Added service grid with placeholder icons and descriptions to info section
- [x] Added CSS styles for service grid and items
