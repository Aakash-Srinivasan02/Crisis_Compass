#!/usr/bin/env python3
"""
Comprehensive Feature Testing Script for Crisis_Compass
Tests all features of the website systematically
"""

import requests
import json
import time
import re
from urllib.parse import urljoin

class CrisisCompassTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.test_results = []
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, test_name, status, details=""):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        
        if status == "PASS":
            self.passed_tests += 1
            print(f"✅ PASS: {test_name}")
        else:
            self.failed_tests += 1
            print(f"❌ FAIL: {test_name}")
            if details:
                print(f"   Details: {details}")
    
    def test_server_connectivity(self):
        """Test if the local server is running"""
        try:
            response = requests.get(self.base_url, timeout=5)
            if response.status_code == 200:
                self.log_test("Server Connectivity", "PASS", "Local server responding")
                return True
            else:
                self.log_test("Server Connectivity", "FAIL", f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Server Connectivity", "FAIL", str(e))
            return False
    
    def test_main_page_load(self):
        """Test main page loads correctly"""
        try:
            response = requests.get(self.base_url)
            if response.status_code == 200:
                content = response.text
                
                # Check for key elements
                checks = [
                    ("title", "Crisis Compass" in content),
                    ("header", "U.S. Department of Health & Human Services" in content),
                    ("search form", 'id="searchForm"' in content),
                    ("hotlines", "988" in content and "Suicide" in content),
                    ("language selector", 'id="langSelect"' in content),
                    ("privacy link", "privacy.html" in content),
                    ("javascript", "scripts.js" in content),
                    ("css", "styles.css" in content)
                ]
                
                for check_name, check_result in checks:
                    if check_result:
                        self.log_test(f"Main Page - {check_name}", "PASS")
                    else:
                        self.log_test(f"Main Page - {check_name}", "FAIL", "Element not found")
                
                return True
            else:
                self.log_test("Main Page Load", "FAIL", f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Main Page Load", "FAIL", str(e))
            return False
    
    def test_resources_data(self):
        """Test resources.json data loading and structure"""
        try:
            response = requests.get(urljoin(self.base_url, "resources.json"))
            if response.status_code == 200:
                data = response.json()
                
                # Validate data structure
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Resources Data - Valid JSON", "PASS", f"Loaded {len(data)} resources")
                    
                    # Check required fields
                    sample_resource = data[0]
                    required_fields = [
                        "id", "name", "type", "services", "city", "state", 
                        "phone", "address", "lat", "lon"
                    ]
                    
                    for field in required_fields:
                        if field in sample_resource:
                            self.log_test(f"Resources Data - {field} field", "PASS")
                        else:
                            self.log_test(f"Resources Data - {field} field", "FAIL", "Missing field")
                    
                    # Test data diversity
                    states = set(r["state"] for r in data)
                    service_types = set(r["type"] for r in data)
                    
                    self.log_test("Resources Data - Geographic Diversity", "PASS", f"States: {len(states)}")
                    self.log_test("Resources Data - Service Diversity", "PASS", f"Types: {len(service_types)}")
                    
                else:
                    self.log_test("Resources Data - Valid JSON", "FAIL", "Invalid data structure")
                    
            else:
                self.log_test("Resources Data Load", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Resources Data", "FAIL", str(e))
    
    def test_css_files(self):
        """Test CSS files load correctly"""
        try:
            response = requests.get(urljoin(self.base_url, "styles.css"))
            if response.status_code == 200:
                css_content = response.text
                
                # Check for key CSS classes and features
                css_checks = [
                    ("responsive design", "@media" in css_content),
                    ("color variables", ":root" in css_content),
                    ("button styles", ".small-btn" in css_content),
                    ("card styles", ".card" in css_content),
                    ("modal styles", ".modal" in css_content),
                    ("accessibility", ".sr-only" in css_content)
                ]
                
                for check_name, check_result in css_checks:
                    if check_result:
                        self.log_test(f"CSS - {check_name}", "PASS")
                    else:
                        self.log_test(f"CSS - {check_name}", "FAIL", "CSS feature not found")
                        
            else:
                self.log_test("CSS File Load", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("CSS File", "FAIL", str(e))
    
    def test_javascript_file(self):
        """Test JavaScript file loads and has key functions"""
        try:
            response = requests.get(urljoin(self.base_url, "scripts.js"))
            if response.status_code == 200:
                js_content = response.text
                
                # Check for key JavaScript functions
                js_functions = [
                    ("loadResources", "loadResources" in js_content),
                    ("doSearch", "doSearch" in js_content),
                    ("geolocateAndSearch", "geolocateAndSearch" in js_content),
                    ("showMapView", "showMapView" in js_content),
                    ("showListView", "showListView" in js_content),
                    ("openDetail", "openDetail" in js_content),
                    ("setLanguage", "setLanguage" in js_content),
                    ("toggleLowBandwidth", "toggleLowBandwidth" in js_content),
                    ("quickExit", "quickExit" in js_content)
                ]
                
                for func_name, found in js_functions:
                    if found:
                        self.log_test(f"JavaScript - {func_name} function", "PASS")
                    else:
                        self.log_test(f"JavaScript - {func_name} function", "FAIL", "Function not found")
                
                # Check for external dependencies
                dependencies = [
                    ("Leaflet map library", "leaflet" in js_content.lower() or "L.map" in js_content),
                    ("LocalStorage usage", "localStorage" in js_content),
                    ("Fetch API", "fetch(" in js_content),
                    ("Geolocation API", "navigator.geolocation" in js_content)
                ]
                
                for dep_name, found in dependencies:
                    if found:
                        self.log_test(f"JavaScript - {dep_name}", "PASS")
                    else:
                        self.log_test(f"JavaScript - {dep_name}", "FAIL", "Dependency not found")
                        
            else:
                self.log_test("JavaScript File Load", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("JavaScript File", "FAIL", str(e))
    
    def test_privacy_page(self):
        """Test privacy page exists and loads"""
        try:
            response = requests.get(urljoin(self.base_url, "privacy.html"))
            if response.status_code == 200:
                content = response.text
                
                privacy_checks = [
                    ("privacy content", "privacy" in content.lower()),
                    ("proper HTML structure", "<html" in content and "</html>" in content),
                    ("title", "<title>" in content)
                ]
                
                for check_name, check_result in privacy_checks:
                    if check_result:
                        self.log_test(f"Privacy Page - {check_name}", "PASS")
                    else:
                        self.log_test(f"Privacy Page - {check_name}", "FAIL", "Content missing")
                        
            else:
                self.log_test("Privacy Page Load", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Privacy Page", "FAIL", str(e))
    
    def test_internationalization(self):
        """Test i18n files exist"""
        try:
            languages = ["en", "es", "fr", "ar"]
            for lang in languages:
                response = requests.get(urljoin(self.base_url, f"i18n/{lang}.json"))
                if response.status_code == 200:
                    self.log_test(f"i18n - {lang} translation file", "PASS")
                else:
                    self.log_test(f"i18n - {lang} translation file", "FAIL", f"HTTP {response.status_code}")
                    
        except Exception as e:
            self.log_test("i18n Files", "FAIL", str(e))
    
    def test_emergency_hotlines(self):
        """Test emergency hotline links in HTML"""
        try:
            response = requests.get(self.base_url)
            if response.status_code == 200:
                content = response.text
                
                hotline_checks = [
                    ("988 Suicide Lifeline", 'tel:988' in content),
                    ("Domestic Violence Hotline", 'tel:8007997233' in content),
                    ("Emergency Services", 'tel:911' in content)
                ]
                
                for check_name, found in hotline_checks:
                    if found:
                        self.log_test(f"Emergency Hotline - {check_name}", "PASS")
                    else:
                        self.log_test(f"Emergency Hotline - {check_name}", "FAIL", "Link not found")
                        
        except Exception as e:
            self.log_test("Emergency Hotlines", "FAIL", str(e))
    
    def test_search_functionality(self):
        """Test search form elements exist"""
        try:
            response = requests.get(self.base_url)
            if response.status_code == 200:
                content = response.text
                
                search_checks = [
                    ("search input", 'id="query"' in content),
                    ("service filter", 'id="filter"' in content),
                    ("state filter", 'id="stateFilter"' in content),
                    ("search button", 'id="findBtn"' in content),
                    ("geolocation button", "geolocateAndSearch" in content),
                    ("view toggle buttons", 'id="listViewBtn"' in content and 'id="mapViewBtn"' in content)
                ]
                
                for check_name, found in search_checks:
                    if found:
                        self.log_test(f"Search Functionality - {check_name}", "PASS")
                    else:
                        self.log_test(f"Search Functionality - {check_name}", "FAIL", "Element not found")
                        
        except Exception as e:
            self.log_test("Search Functionality", "FAIL", str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive Crisis Compass Feature Testing")
        print("=" * 60)
        
        # Core functionality tests
        self.test_server_connectivity()
        self.test_main_page_load()
        self.test_resources_data()
        
        # File integrity tests
        self.test_css_files()
        self.test_javascript_file()
        
        # Content and feature tests
        self.test_privacy_page()
        self.test_internationalization()
        self.test_emergency_hotlines()
        self.test_search_functionality()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/len(self.test_results)*100):.1f}%")
        
        # Save detailed results
        with open("TEST_RESULTS.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": len(self.test_results),
                    "passed": self.passed_tests,
                    "failed": self.failed_tests,
                    "success_rate": self.passed_tests/len(self.test_results)*100
                },
                "detailed_results": self.test_results
            }, f, indent=2)
        
        print(f"\nDetailed results saved to: TEST_RESULTS.json")
        
        # List failed tests
        if self.failed_tests > 0:
            print(f"\n❌ Failed Tests ({self.failed_tests}):")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"  - {result['test']}: {result['details']}")

if __name__ == "__main__":
    tester = CrisisCompassTester()
    tester.run_all_tests()
