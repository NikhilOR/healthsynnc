#!/usr/bin/env python3
"""
HealthSync Backend API Testing Suite
Tests all backend APIs in priority order
"""

import requests
import json
import sys
from datetime import datetime
import time
import base64

# Configuration
BASE_URL = "https://vitals-insights.preview.emergentagent.com/api"
TEST_EMAIL = f"testuser_{int(time.time())}@healthsync.com"
TEST_PASSWORD = "test123456"
TEST_NAME = "Test User"

# Global variables
auth_token = None
food_item_id = None
food_log_id = None

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(test_name):
    print(f"\n{BLUE}Testing: {test_name}{RESET}")

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}⚠ {message}{RESET}")

def print_section(section_name):
    print(f"\n{'='*60}")
    print(f"{YELLOW}{section_name}{RESET}")
    print(f"{'='*60}")

# ==================== AUTH TESTS ====================

def test_register():
    """Test user registration"""
    global auth_token
    print_test("POST /auth/register")
    
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "name": TEST_NAME
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                auth_token = data["access_token"]
                print_success(f"User registered successfully: {data['user']['email']}")
                print_success(f"Token received: {auth_token[:20]}...")
                return True
            else:
                print_error(f"Missing fields in response: {data}")
                return False
        else:
            print_error(f"Registration failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during registration: {str(e)}")
        return False

def test_login():
    """Test user login"""
    global auth_token
    print_test("POST /auth/login")
    
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                auth_token = data["access_token"]
                print_success(f"Login successful: {data['user']['name']}")
                return True
            else:
                print_error(f"Missing access_token in response")
                return False
        else:
            print_error(f"Login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during login: {str(e)}")
        return False

def test_get_profile():
    """Test get user profile"""
    print_test("GET /auth/profile")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "email" in data and "name" in data:
                print_success(f"Profile retrieved: {data['name']} ({data['email']})")
                return True
            else:
                print_error(f"Missing fields in profile response")
                return False
        else:
            print_error(f"Get profile failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during get profile: {str(e)}")
        return False

# ==================== DASHBOARD TESTS ====================

def test_dashboard_summary():
    """Test dashboard summary"""
    print_test("GET /dashboard/summary")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/dashboard/summary", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            required_keys = ["calories", "water", "weight", "expenses", "smoking", "health_score"]
            if all(key in data for key in required_keys):
                print_success(f"Dashboard summary retrieved")
                print_success(f"  Health Score: {data['health_score']}")
                print_success(f"  Calories: {data['calories']['consumed']}/{data['calories']['goal']}")
                print_success(f"  Water: {data['water']['consumed']}ml/{data['water']['goal']}ml")
                return True
            else:
                print_error(f"Missing required keys in dashboard response")
                return False
        else:
            print_error(f"Dashboard summary failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during dashboard summary: {str(e)}")
        return False

# ==================== FOOD TESTS ====================

def test_search_food_items():
    """Test search food items"""
    global food_item_id
    print_test("GET /food/items")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        # Search for banana
        response = requests.get(f"{BASE_URL}/food/items?q=banana", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                food_item_id = data[0]["_id"]
                print_success(f"Found {len(data)} food items")
                print_success(f"  First item: {data[0]['name']} - {data[0]['calories']} cal")
                return True
            else:
                print_error(f"No food items found or invalid response format")
                return False
        else:
            print_error(f"Search food items failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during search food items: {str(e)}")
        return False

def test_create_custom_food():
    """Test create custom food item"""
    print_test("POST /food/items")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "name": "Custom Protein Shake",
        "serving_size": "1 scoop (30g)",
        "calories": 120,
        "protein": 25,
        "carbs": 3,
        "fat": 1.5,
        "category": "supplements"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/food/items", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and data["name"] == payload["name"]:
                print_success(f"Custom food created: {data['name']}")
                return True
            else:
                print_error(f"Invalid response format for custom food")
                return False
        else:
            print_error(f"Create custom food failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during create custom food: {str(e)}")
        return False

def test_log_food():
    """Test log food"""
    global food_log_id
    print_test("POST /food/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "food_item_id": food_item_id,
        "meal_type": "breakfast",
        "quantity": 2,
        "notes": "Morning breakfast"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/food/logs", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "total_calories" in data:
                food_log_id = data["id"]
                print_success(f"Food logged: {data['food_name']} - {data['total_calories']} cal")
                return True
            else:
                print_error(f"Invalid response format for food log")
                return False
        else:
            print_error(f"Log food failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during log food: {str(e)}")
        return False

def test_get_food_logs():
    """Test get food logs"""
    print_test("GET /food/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/food/logs", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"Retrieved {len(data)} food logs")
                if len(data) > 0:
                    print_success(f"  Latest: {data[0]['food_name']} - {data[0]['meal_type']}")
                return True
            else:
                print_error(f"Invalid response format for food logs")
                return False
        else:
            print_error(f"Get food logs failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during get food logs: {str(e)}")
        return False

def test_delete_food_log():
    """Test delete food log"""
    print_test("DELETE /food/logs/{log_id}")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.delete(f"{BASE_URL}/food/logs/{food_log_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                print_success(f"Food log deleted successfully")
                return True
            else:
                print_error(f"Invalid response format for delete")
                return False
        else:
            print_error(f"Delete food log failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during delete food log: {str(e)}")
        return False

# ==================== WATER TESTS ====================

def test_log_water():
    """Test log water"""
    print_test("POST /water/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {"amount_ml": 500}
    
    try:
        response = requests.post(f"{BASE_URL}/water/logs", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "amount_ml" in data:
                print_success(f"Water logged: {data['amount_ml']}ml")
                return True
            else:
                print_error(f"Invalid response format for water log")
                return False
        else:
            print_error(f"Log water failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during log water: {str(e)}")
        return False

def test_get_water_logs():
    """Test get water logs"""
    print_test("GET /water/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/water/logs", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "logs" in data and "total" in data:
                print_success(f"Retrieved water logs - Total: {data['total']}ml")
                return True
            else:
                print_error(f"Invalid response format for water logs")
                return False
        else:
            print_error(f"Get water logs failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during get water logs: {str(e)}")
        return False

def test_water_daily_progress():
    """Test water daily progress"""
    print_test("GET /water/daily-progress")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/water/daily-progress", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "total" in data and "goal" in data and "percentage" in data:
                print_success(f"Water progress: {data['total']}ml / {data['goal']}ml ({data['percentage']}%)")
                return True
            else:
                print_error(f"Invalid response format for water progress")
                return False
        else:
            print_error(f"Water daily progress failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during water daily progress: {str(e)}")
        return False

# ==================== WEIGHT TESTS ====================

def test_log_weight():
    """Test log weight"""
    print_test("POST /weight/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "weight_kg": 75.5,
        "body_fat_percent": 18.5,
        "notes": "Morning weight"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/weight/logs", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "weight_kg" in data and "bmi" in data:
                print_success(f"Weight logged: {data['weight_kg']}kg - BMI: {data['bmi']}")
                return True
            else:
                print_error(f"Invalid response format for weight log")
                return False
        else:
            print_error(f"Log weight failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during log weight: {str(e)}")
        return False

def test_get_weight_logs():
    """Test get weight logs"""
    print_test("GET /weight/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/weight/logs", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"Retrieved {len(data)} weight logs")
                if len(data) > 0:
                    print_success(f"  Latest: {data[0]['weight_kg']}kg - BMI: {data[0].get('bmi', 'N/A')}")
                return True
            else:
                print_error(f"Invalid response format for weight logs")
                return False
        else:
            print_error(f"Get weight logs failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during get weight logs: {str(e)}")
        return False

def test_weight_progress():
    """Test weight progress"""
    print_test("GET /weight/progress")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/weight/progress", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "progress" in data and "trend" in data:
                print_success(f"Weight progress retrieved - Trend: {data['trend']}")
                print_success(f"  Current: {data.get('current_weight', 0)}kg / Goal: {data.get('goal_weight', 0)}kg")
                return True
            else:
                print_error(f"Invalid response format for weight progress")
                return False
        else:
            print_error(f"Weight progress failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during weight progress: {str(e)}")
        return False

# ==================== EXPENSE TESTS ====================

def test_log_expense():
    """Test log expense"""
    print_test("POST /expenses/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "item_name": "Organic Vegetables",
        "amount": 25.50,
        "category": "vegetables",
        "notes": "Weekly grocery shopping"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/expenses/logs", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "item_name" in data and "amount" in data:
                print_success(f"Expense logged: {data['item_name']} - ${data['amount']}")
                return True
            else:
                print_error(f"Invalid response format for expense log")
                return False
        else:
            print_error(f"Log expense failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during log expense: {str(e)}")
        return False

def test_get_expense_logs():
    """Test get expense logs"""
    print_test("GET /expenses/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/expenses/logs", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"Retrieved {len(data)} expense logs")
                if len(data) > 0:
                    print_success(f"  Latest: {data[0]['item_name']} - ${data[0]['amount']}")
                return True
            else:
                print_error(f"Invalid response format for expense logs")
                return False
        else:
            print_error(f"Get expense logs failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during get expense logs: {str(e)}")
        return False

def test_expense_summary():
    """Test expense summary"""
    print_test("GET /expenses/summary")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/expenses/summary?period=daily", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "total" in data and "categories" in data:
                print_success(f"Expense summary retrieved - Total: ${data['total']}")
                return True
            else:
                print_error(f"Invalid response format for expense summary")
                return False
        else:
            print_error(f"Expense summary failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during expense summary: {str(e)}")
        return False

# ==================== SMOKING TESTS ====================

def test_log_cigarette():
    """Test log cigarette"""
    print_test("POST /smoking/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "brand": "Marlboro",
        "cost_per_cigarette": 0.50,
        "notes": "After lunch"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/smoking/logs", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "brand" in data:
                print_success(f"Cigarette logged: {data.get('brand', 'N/A')}")
                return True
            else:
                print_error(f"Invalid response format for cigarette log")
                return False
        else:
            print_error(f"Log cigarette failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during log cigarette: {str(e)}")
        return False

def test_get_cigarette_logs():
    """Test get cigarette logs"""
    print_test("GET /smoking/logs")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/smoking/logs", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"Retrieved {len(data)} cigarette logs")
                return True
            else:
                print_error(f"Invalid response format for cigarette logs")
                return False
        else:
            print_error(f"Get cigarette logs failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during get cigarette logs: {str(e)}")
        return False

def test_smoking_statistics():
    """Test smoking statistics"""
    print_test("GET /smoking/statistics")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/smoking/statistics", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "today" in data and "week" in data and "month" in data:
                print_success(f"Smoking statistics retrieved")
                print_success(f"  Today: {data['today']['count']} cigarettes")
                print_success(f"  Week: {data['week']['count']} cigarettes")
                return True
            else:
                print_error(f"Invalid response format for smoking statistics")
                return False
        else:
            print_error(f"Smoking statistics failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during smoking statistics: {str(e)}")
        return False

def test_quit_progress():
    """Test quit progress"""
    print_test("GET /smoking/quit-progress")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/smoking/quit-progress", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "smoke_free_hours" in data and "cigarettes_avoided" in data:
                print_success(f"Quit progress retrieved")
                print_success(f"  Smoke-free hours: {data['smoke_free_hours']}")
                return True
            else:
                print_error(f"Invalid response format for quit progress")
                return False
        else:
            print_error(f"Quit progress failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during quit progress: {str(e)}")
        return False

# ==================== AI TESTS ====================

def test_ai_chat():
    """Test AI chat"""
    print_test("POST /ai/chat")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "message": "What should I eat for a healthy breakfast?"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ai/chat", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "response" in data:
                print_success(f"AI chat response received")
                print_success(f"  Response preview: {data['response'][:100]}...")
                return True
            else:
                print_error(f"Invalid response format for AI chat")
                return False
        else:
            print_error(f"AI chat failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during AI chat: {str(e)}")
        return False

def test_weekly_report():
    """Test weekly report"""
    print_test("GET /ai/weekly-report")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/ai/weekly-report", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "report" in data and "data" in data:
                print_success(f"Weekly report generated")
                print_success(f"  Weekly calories: {data['data']['weekly_calories']}")
                return True
            else:
                print_error(f"Invalid response format for weekly report")
                return False
        else:
            print_error(f"Weekly report failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during weekly report: {str(e)}")
        return False

# ==================== GAMIFICATION TESTS ====================

def test_get_achievements():
    """Test get achievements"""
    print_test("GET /gamification/achievements")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/gamification/achievements", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"Retrieved {len(data)} achievements")
                return True
            else:
                print_error(f"Invalid response format for achievements")
                return False
        else:
            print_error(f"Get achievements failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during get achievements: {str(e)}")
        return False

def test_get_streaks():
    """Test get streaks"""
    print_test("GET /gamification/streaks")
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/gamification/streaks", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "calorie_streak" in data:
                print_success(f"Streaks retrieved")
                print_success(f"  Calorie streak: {data['calorie_streak']} days")
                return True
            else:
                print_error(f"Invalid response format for streaks")
                return False
        else:
            print_error(f"Get streaks failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exception during get streaks: {str(e)}")
        return False

# ==================== MAIN TEST RUNNER ====================

def run_all_tests():
    """Run all tests in priority order"""
    results = {
        "passed": 0,
        "failed": 0,
        "total": 0
    }
    
    tests = [
        # HIGH PRIORITY - Authentication
        ("User Authentication", [
            ("Register User", test_register),
            ("Login User", test_login),
            ("Get Profile", test_get_profile),
        ]),
        
        # HIGH PRIORITY - Dashboard
        ("Dashboard", [
            ("Dashboard Summary", test_dashboard_summary),
        ]),
        
        # HIGH PRIORITY - Food Tracking
        ("Food Tracking", [
            ("Search Food Items", test_search_food_items),
            ("Create Custom Food", test_create_custom_food),
            ("Log Food", test_log_food),
            ("Get Food Logs", test_get_food_logs),
            ("Delete Food Log", test_delete_food_log),
        ]),
        
        # HIGH PRIORITY - Water Tracking
        ("Water Tracking", [
            ("Log Water", test_log_water),
            ("Get Water Logs", test_get_water_logs),
            ("Water Daily Progress", test_water_daily_progress),
        ]),
        
        # HIGH PRIORITY - Weight Tracking
        ("Weight Tracking", [
            ("Log Weight", test_log_weight),
            ("Get Weight Logs", test_get_weight_logs),
            ("Weight Progress", test_weight_progress),
        ]),
        
        # MEDIUM PRIORITY - Expense Tracking
        ("Expense Tracking", [
            ("Log Expense", test_log_expense),
            ("Get Expense Logs", test_get_expense_logs),
            ("Expense Summary", test_expense_summary),
        ]),
        
        # MEDIUM PRIORITY - Smoking Tracking
        ("Smoking Tracking", [
            ("Log Cigarette", test_log_cigarette),
            ("Get Cigarette Logs", test_get_cigarette_logs),
            ("Smoking Statistics", test_smoking_statistics),
            ("Quit Progress", test_quit_progress),
        ]),
        
        # MEDIUM PRIORITY - AI Features
        ("AI Features", [
            ("AI Chat", test_ai_chat),
            ("Weekly Report", test_weekly_report),
        ]),
        
        # LOW PRIORITY - Gamification
        ("Gamification", [
            ("Get Achievements", test_get_achievements),
            ("Get Streaks", test_get_streaks),
        ]),
    ]
    
    print(f"\n{'='*60}")
    print(f"{YELLOW}HealthSync Backend API Testing Suite{RESET}")
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    print(f"{'='*60}")
    
    for section_name, section_tests in tests:
        print_section(section_name)
        
        for test_name, test_func in section_tests:
            results["total"] += 1
            try:
                if test_func():
                    results["passed"] += 1
                else:
                    results["failed"] += 1
            except Exception as e:
                print_error(f"Unexpected error in {test_name}: {str(e)}")
                results["failed"] += 1
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"{YELLOW}TEST SUMMARY{RESET}")
    print(f"{'='*60}")
    print(f"Total Tests: {results['total']}")
    print(f"{GREEN}Passed: {results['passed']}{RESET}")
    print(f"{RED}Failed: {results['failed']}{RESET}")
    print(f"Success Rate: {(results['passed']/results['total']*100):.1f}%")
    print(f"{'='*60}\n")
    
    return results["failed"] == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
