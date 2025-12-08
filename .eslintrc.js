module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  globals: {
    quickExit: false,
    toggleLowBandwidth: false,
    geolocateAndSearch: false,
    showMapView: false,
    showListView: false,
    openDetail: false,
    submitReport: false,
  },
  rules: {
  },
};
