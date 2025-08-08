#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class PayTrackAPITester:
    def __init__(self, base_url="https://cfa933a6-2168-4ef6-83d7-d6900b025b6e.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user = None
        self.test_company_id = None
        self.test_user_id = None
        self.test_entry_id = None

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    self.log(f"   Error: {error_detail}")
                except:
                    self.log(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Exception: {str(e)}")
            return False, {}

    def test_system_initialization(self):
        """Test system initialization"""
        self.log("\n=== TESTING SYSTEM INITIALIZATION ===")
        
        # Try to initialize system (might fail if already initialized)
        success, response = self.run_test(
            "System Initialization",
            "POST",
            "init",
            200
        )
        
        if not success:
            self.log("ℹ️  System likely already initialized, continuing with existing admin")
        else:
            self.log(f"✅ System initialized with admin credentials")
        
        return True

    def test_authentication(self):
        """Test login functionality"""
        self.log("\n=== TESTING AUTHENTICATION ===")
        
        # Test login with admin credentials
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "login",
            200,
            data={"user_id": "admin", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.admin_user = response['user']
            self.log(f"✅ Logged in as: {self.admin_user['identifiant']} (Role: {self.admin_user['role']})")
            
            # Test /me endpoint
            success, me_response = self.run_test(
                "Get Current User",
                "GET",
                "me",
                200
            )
            
            return success
        else:
            self.log("❌ Failed to login - cannot continue tests")
            return False

    def test_company_management(self):
        """Test company CRUD operations"""
        self.log("\n=== TESTING COMPANY MANAGEMENT ===")
        
        # Create a test company
        success, response = self.run_test(
            "Create Company",
            "POST",
            "companies",
            200,
            data={"name": "Test Company Ltd"}
        )
        
        if success and 'id' in response:
            self.test_company_id = response['id']
            self.log(f"✅ Created company with ID: {self.test_company_id}")
        else:
            self.log("❌ Failed to create company")
            return False
        
        # Get all companies
        success, companies = self.run_test(
            "Get Companies",
            "GET",
            "companies",
            200
        )
        
        if success:
            self.log(f"✅ Retrieved {len(companies)} companies")
        
        # Update company
        success, response = self.run_test(
            "Update Company",
            "PUT",
            f"companies/{self.test_company_id}",
            200,
            data={"name": "Updated Test Company Ltd"}
        )
        
        return success

    def test_user_management(self):
        """Test user CRUD operations"""
        self.log("\n=== TESTING USER MANAGEMENT ===")
        
        # Create a test user
        success, response = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data={
                "identifiant": "Test Employee",
                "role": "employee",
                "password": "testpass123"
            }
        )
        
        if success and 'id' in response:
            self.test_user_id = response['id']
            self.log(f"✅ Created user with ID: {self.test_user_id}, Login ID: {response['user_id']}")
        else:
            self.log("❌ Failed to create user")
            return False
        
        # Get all users
        success, users = self.run_test(
            "Get Users",
            "GET",
            "users",
            200
        )
        
        if success:
            self.log(f"✅ Retrieved {len(users)} users")
        
        # Update user
        success, response = self.run_test(
            "Update User",
            "PUT",
            f"users/{self.test_user_id}",
            200,
            data={"identifiant": "Updated Test Employee"}
        )
        
        return success

    def test_payment_entries(self):
        """Test payment entry CRUD operations"""
        self.log("\n=== TESTING PAYMENT ENTRIES ===")
        
        if not self.test_company_id:
            self.log("❌ No test company available for payment entry tests")
            return False
        
        # Create a payment entry
        success, response = self.run_test(
            "Create Payment Entry",
            "POST",
            "payment-entries",
            200,
            data={
                "company_id": self.test_company_id,
                "client_name": "Test Client",
                "invoice_number": "INV-001",
                "amount": 1500.50
            }
        )
        
        if success and 'id' in response:
            self.test_entry_id = response['id']
            self.log(f"✅ Created payment entry with ID: {self.test_entry_id}")
        else:
            self.log("❌ Failed to create payment entry")
            return False
        
        # Get all payment entries
        success, entries = self.run_test(
            "Get All Payment Entries",
            "GET",
            "payment-entries",
            200
        )
        
        if success:
            self.log(f"✅ Retrieved {len(entries)} payment entries")
        
        # Get validated entries only
        success, validated_entries = self.run_test(
            "Get Validated Entries",
            "GET",
            "payment-entries?validated_only=true",
            200
        )
        
        if success:
            self.log(f"✅ Retrieved {len(validated_entries)} validated entries")
        
        # Update payment entry
        success, response = self.run_test(
            "Update Payment Entry",
            "PUT",
            f"payment-entries/{self.test_entry_id}",
            200,
            data={
                "company_id": self.test_company_id,
                "client_name": "Updated Test Client",
                "invoice_number": "INV-001-UPDATED",
                "amount": 2000.75
            }
        )
        
        # Validate payment entry
        success, response = self.run_test(
            "Validate Payment Entry",
            "POST",
            f"payment-entries/{self.test_entry_id}/validate",
            200
        )
        
        return success

    def test_reminder_system(self):
        """Test reminder system"""
        self.log("\n=== TESTING REMINDER SYSTEM ===")
        
        if not self.test_entry_id:
            self.log("❌ No test payment entry available for reminder tests")
            return False
        
        # Create a reminder
        success, response = self.run_test(
            "Create Reminder",
            "POST",
            "reminders",
            200,
            data={
                "payment_entry_id": self.test_entry_id,
                "note": "Test reminder note"
            }
        )
        
        if success:
            self.log("✅ Created reminder successfully")
        
        # Get reminders for entry
        success, reminders = self.run_test(
            "Get Reminders for Entry",
            "GET",
            f"reminders/{self.test_entry_id}",
            200
        )
        
        if success:
            self.log(f"✅ Retrieved {len(reminders)} reminders for entry")
        
        return success

    def test_analytics(self):
        """Test analytics endpoint"""
        self.log("\n=== TESTING ANALYTICS ===")
        
        success, analytics = self.run_test(
            "Get Analytics",
            "GET",
            "analytics",
            200
        )
        
        if success:
            self.log(f"✅ Analytics data retrieved:")
            self.log(f"   Total entries: {analytics.get('total_entries', 0)}")
            self.log(f"   Validated entries: {analytics.get('validated_entries', 0)}")
            self.log(f"   Pending entries: {analytics.get('pending_entries', 0)}")
            self.log(f"   Total amount: {analytics.get('total_amount', 0)}")
        
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        self.log("\n=== CLEANING UP TEST DATA ===")
        
        # Delete payment entry (if not validated)
        if self.test_entry_id:
            success, response = self.run_test(
                "Delete Payment Entry",
                "DELETE",
                f"payment-entries/{self.test_entry_id}",
                200
            )
            if not success:
                self.log("ℹ️  Could not delete payment entry (might be validated)")

    def run_all_tests(self):
        """Run all tests"""
        self.log("🚀 Starting PayTrack API Tests")
        self.log(f"🌐 Testing against: {self.base_url}")
        
        # Run test suites
        test_suites = [
            self.test_system_initialization,
            self.test_authentication,
            self.test_company_management,
            self.test_user_management,
            self.test_payment_entries,
            self.test_reminder_system,
            self.test_analytics
        ]
        
        all_passed = True
        for test_suite in test_suites:
            try:
                result = test_suite()
                if not result:
                    all_passed = False
            except Exception as e:
                self.log(f"❌ Test suite failed with exception: {str(e)}")
                all_passed = False
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print results
        self.log(f"\n📊 TEST RESULTS:")
        self.log(f"   Tests run: {self.tests_run}")
        self.log(f"   Tests passed: {self.tests_passed}")
        self.log(f"   Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if all_passed and self.tests_passed == self.tests_run:
            self.log("🎉 ALL TESTS PASSED!")
            return 0
        else:
            self.log("💥 SOME TESTS FAILED!")
            return 1

def main():
    tester = PayTrackAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())