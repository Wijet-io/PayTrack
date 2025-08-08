import requests
import sys
from datetime import datetime
import json

class PayTrackAPITester:
    def __init__(self, base_url="https://cfa933a6-2168-4ef6-83d7-d6900b025b6e.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.manager_token = None
        self.employee_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.company_id = None
        self.manager_user = None
        self.employee_user = None
        self.payment_entry_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with correct credentials"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "login",
            200,
            data={"user_id": "admin", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            print(f"   Admin user: {response.get('user', {}).get('identifiant')} ({response.get('user', {}).get('role')})")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "me",
            200,
            token=self.admin_token
        )
        if success:
            print(f"   User: {response.get('identifiant')} ({response.get('role')})")
            print(f"   User ID: {response.get('user_id')}")
        return success

    def test_company_operations(self):
        """Test company CRUD operations"""
        print("\n" + "="*50)
        print("TESTING COMPANY OPERATIONS")
        print("="*50)
        
        # Create company
        success, response = self.run_test(
            "Create Company",
            "POST",
            "companies",
            200,
            data={"name": "Test Company Ltd"},
            token=self.admin_token
        )
        if success and 'id' in response:
            self.company_id = response['id']
            print(f"   Company created with ID: {self.company_id}")
        
        # Get companies
        success2, response2 = self.run_test(
            "Get Companies",
            "GET",
            "companies",
            200,
            token=self.admin_token
        )
        if success2:
            print(f"   Found {len(response2)} companies")
        
        return success and success2

    def test_user_operations_with_auto_id(self):
        """Test user CRUD operations with auto-generated user IDs"""
        print("\n" + "="*50)
        print("TESTING USER OPERATIONS (AUTO-GENERATED IDs)")
        print("="*50)
        
        # Create manager with auto-generated user_id
        success1, response1 = self.run_test(
            "Create Manager (Auto-Generated ID)",
            "POST",
            "users",
            200,
            data={
                "identifiant": "Test Manager",
                "role": "manager",
                "password": "manager123"
            },
            token=self.admin_token
        )
        if success1 and 'user_id' in response1:
            self.manager_user = response1
            print(f"   Manager created with auto-generated user_id: {response1['user_id']}")
            print(f"   Manager identifiant: {response1['identifiant']}")
        
        # Login as manager using auto-generated user_id
        if self.manager_user:
            success2, response2 = self.run_test(
                "Manager Login (Auto-Generated ID)",
                "POST",
                "login",
                200,
                data={"user_id": self.manager_user['user_id'], "password": "manager123"}
            )
            if success2 and 'access_token' in response2:
                self.manager_token = response2['access_token']
                print(f"   Manager token obtained")
        
        # Create employee with auto-generated user_id
        success3, response3 = self.run_test(
            "Create Employee (Auto-Generated ID)",
            "POST",
            "users",
            200,
            data={
                "identifiant": "Test Employee",
                "role": "employee",
                "password": "employee123"
            },
            token=self.admin_token
        )
        if success3 and 'user_id' in response3:
            self.employee_user = response3
            print(f"   Employee created with auto-generated user_id: {response3['user_id']}")
            print(f"   Employee identifiant: {response3['identifiant']}")
        
        # Login as employee using auto-generated user_id
        if self.employee_user:
            success4, response4 = self.run_test(
                "Employee Login (Auto-Generated ID)",
                "POST",
                "login",
                200,
                data={"user_id": self.employee_user['user_id'], "password": "employee123"}
            )
            if success4 and 'access_token' in response4:
                self.employee_token = response4['access_token']
                print(f"   Employee token obtained")
        
        # Get users
        success5, response5 = self.run_test(
            "Get Users (as Admin)",
            "GET",
            "users",
            200,
            token=self.admin_token
        )
        if success5:
            print(f"   Found {len(response5)} users")
        
        return all([success1, success2, success3, success4, success5])

    def test_admin_password_editing(self):
        """Test admin can edit any user's password"""
        print("\n" + "="*50)
        print("TESTING ADMIN PASSWORD EDITING")
        print("="*50)
        
        if not self.employee_user:
            print("❌ No employee user available for password editing test")
            return False
        
        # Admin edits employee password
        success1, response1 = self.run_test(
            "Admin Edit Employee Password",
            "PUT",
            f"users/{self.employee_user['id']}",
            200,
            data={
                "password": "newpassword123"
            },
            token=self.admin_token
        )
        
        # Test login with new password
        success2, response2 = self.run_test(
            "Employee Login with New Password",
            "POST",
            "login",
            200,
            data={"user_id": self.employee_user['user_id'], "password": "newpassword123"}
        )
        
        # Test old password fails
        success3, response3 = self.run_test(
            "Employee Login with Old Password (should fail)",
            "POST",
            "login",
            401,
            data={"user_id": self.employee_user['user_id'], "password": "employee123"}
        )
        
        return all([success1, success2, success3])

    def test_payment_entry_operations(self):
        """Test payment entry CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PAYMENT ENTRY OPERATIONS")
        print("="*50)
        
        if not self.company_id or not self.employee_token:
            print("❌ Missing company or employee token for payment entry tests")
            return False
        
        # Create payment entry (as employee) - no company restrictions
        success1, response1 = self.run_test(
            "Create Payment Entry (Employee - Any Company)",
            "POST",
            "payment-entries",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Test Client",
                "invoice_number": "INV-001",
                "amount": 1500.50
            },
            token=self.employee_token
        )
        if success1 and 'id' in response1:
            self.payment_entry_id = response1['id']
            print(f"   Payment entry created with ID: {self.payment_entry_id}")
        
        # Get all payment entries (should show ALL entries)
        success2, response2 = self.run_test(
            "Get All Payment Entries",
            "GET",
            "payment-entries",
            200,
            token=self.employee_token
        )
        if success2:
            print(f"   Found {len(response2)} total entries")
        
        # Get validated entries only
        success3, response3 = self.run_test(
            "Get Validated Entries Only",
            "GET",
            "payment-entries?validated_only=true",
            200,
            token=self.employee_token
        )
        if success3:
            print(f"   Found {len(response3)} validated entries")
        
        return all([success1, success2, success3])

    def test_validation_workflow(self):
        """Test payment validation workflow"""
        print("\n" + "="*50)
        print("TESTING VALIDATION WORKFLOW")
        print("="*50)
        
        if not self.payment_entry_id or not self.manager_token:
            print("❌ Missing payment entry or manager token for validation tests")
            return False
        
        # Try to validate as employee (should fail)
        success1, response1 = self.run_test(
            "Validate Entry (as Employee - should fail)",
            "POST",
            f"payment-entries/{self.payment_entry_id}/validate",
            403,
            token=self.employee_token
        )
        
        # Validate as manager (should succeed)
        success2, response2 = self.run_test(
            "Validate Entry (as Manager)",
            "POST",
            f"payment-entries/{self.payment_entry_id}/validate",
            200,
            token=self.manager_token
        )
        
        # Try to validate again (should fail - already validated)
        success3, response3 = self.run_test(
            "Validate Entry Again (should fail)",
            "POST",
            f"payment-entries/{self.payment_entry_id}/validate",
            400,
            token=self.manager_token
        )
        
        return all([success1, success2, success3])

    def test_reminder_system(self):
        """Test reminder system"""
        print("\n" + "="*50)
        print("TESTING REMINDER SYSTEM")
        print("="*50)
        
        if not self.company_id or not self.employee_token or not self.manager_token:
            print("❌ Missing required tokens for reminder tests")
            return False
        
        # Create another payment entry for reminder testing
        success1, response1 = self.run_test(
            "Create Another Payment Entry",
            "POST",
            "payment-entries",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Another Client",
                "invoice_number": "INV-002",
                "amount": 2000.00
            },
            token=self.employee_token
        )
        
        reminder_entry_id = None
        if success1 and 'id' in response1:
            reminder_entry_id = response1['id']
            print(f"   Created entry for reminder testing: {reminder_entry_id}")
        
        # Create reminder (as manager)
        success2, response2 = self.run_test(
            "Create Reminder (as Manager)",
            "POST",
            "reminders",
            200,
            data={
                "payment_entry_id": reminder_entry_id,
                "note": "Follow up with client about payment status"
            },
            token=self.manager_token
        )
        
        # Get reminders for entry
        success3, response3 = self.run_test(
            "Get Reminders for Entry",
            "GET",
            f"reminders/{reminder_entry_id}",
            200,
            token=self.manager_token
        )
        if success3:
            print(f"   Found {len(response3)} reminders for entry")
        
        # Try to create reminder as employee (should fail)
        success4, response4 = self.run_test(
            "Create Reminder (as Employee - should fail)",
            "POST",
            "reminders",
            403,
            data={
                "payment_entry_id": reminder_entry_id,
                "note": "Test note"
            },
            token=self.employee_token
        )
        
        return all([success1, success2, success3, success4])

    def test_analytics_functionality(self):
        """Test analytics functionality"""
        print("\n" + "="*50)
        print("TESTING ANALYTICS FUNCTIONALITY")
        print("="*50)
        
        # Get analytics (admin only)
        success1, response1 = self.run_test(
            "Get Analytics (as Admin)",
            "GET",
            "analytics",
            200,
            token=self.admin_token
        )
        if success1:
            print(f"   Total entries: {response1.get('total_entries', 0)}")
            print(f"   Validated entries: {response1.get('validated_entries', 0)}")
            print(f"   Pending entries: {response1.get('pending_entries', 0)}")
            print(f"   By company data: {len(response1.get('by_company', []))} companies")
            print(f"   By employee data: {len(response1.get('by_employee', []))} employees")
            print(f"   By month data: {len(response1.get('by_month', []))} months")
        
        # Try to get analytics as non-admin (should fail)
        success2, response2 = self.run_test(
            "Get Analytics (as Employee - should fail)",
            "GET",
            "analytics",
            403,
            token=self.employee_token
        )
        
        return all([success1, success2])

    def test_entry_modification_permissions(self):
        """Test that all users can modify/delete unvalidated entries"""
        print("\n" + "="*50)
        print("TESTING ENTRY MODIFICATION PERMISSIONS")
        print("="*50)
        
        if not self.company_id or not self.employee_token:
            print("❌ Missing required data for modification tests")
            return False
        
        # Create a new unvalidated entry
        success1, response1 = self.run_test(
            "Create Entry for Modification Test",
            "POST",
            "payment-entries",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Modification Test Client",
                "invoice_number": "INV-MOD",
                "amount": 750.00
            },
            token=self.employee_token
        )
        
        mod_entry_id = None
        if success1 and 'id' in response1:
            mod_entry_id = response1['id']
            print(f"   Created entry for modification: {mod_entry_id}")
        
        # Modify the entry (should succeed for unvalidated entry)
        success2, response2 = self.run_test(
            "Modify Unvalidated Entry",
            "PUT",
            f"payment-entries/{mod_entry_id}",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Modified Client Name",
                "invoice_number": "INV-MOD-UPDATED",
                "amount": 850.00
            },
            token=self.employee_token
        )
        
        # Delete the entry (should succeed for unvalidated entry)
        success3, response3 = self.run_test(
            "Delete Unvalidated Entry",
            "DELETE",
            f"payment-entries/{mod_entry_id}",
            200,
            token=self.employee_token
        )
        
        return all([success1, success2, success3])

    def test_error_scenarios(self):
        """Test error scenarios"""
        print("\n" + "="*50)
        print("TESTING ERROR SCENARIOS")
        print("="*50)
        
        # Invalid login
        success1, response1 = self.run_test(
            "Invalid Login",
            "POST",
            "login",
            401,
            data={"user_id": "invalid", "password": "wrong"}
        )
        
        # Unauthorized access (no token)
        success2, response2 = self.run_test(
            "Unauthorized Access",
            "GET",
            "me",
            401
        )
        
        # Employee trying to create manager
        success3, response3 = self.run_test(
            "Employee Creating Manager (should fail)",
            "POST",
            "users",
            403,
            data={
                "identifiant": "Another Manager",
                "role": "manager",
                "password": "password123"
            },
            token=self.employee_token
        )
        
        return all([success1, success2, success3])

def main():
    print("🚀 Starting PayTrack API Tests")
    print("="*60)
    
    tester = PayTrackAPITester()
    
    # Run all tests
    test_results = []
    
    test_results.append(tester.test_admin_login())
    test_results.append(tester.test_get_current_user())
    test_results.append(tester.test_company_operations())
    test_results.append(tester.test_user_operations_with_auto_id())
    test_results.append(tester.test_admin_password_editing())
    test_results.append(tester.test_payment_entry_operations())
    test_results.append(tester.test_validation_workflow())
    test_results.append(tester.test_reminder_system())
    test_results.append(tester.test_analytics_functionality())
    test_results.append(tester.test_entry_modification_permissions())
    test_results.append(tester.test_error_scenarios())
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if all(test_results):
        print("\n🎉 ALL TEST SUITES PASSED!")
        return 0
    else:
        print("\n❌ SOME TEST SUITES FAILED!")
        failed_suites = []
        suite_names = [
            "Admin Login", "Current User", "Company Operations", "User Operations (Auto-ID)",
            "Admin Password Editing", "Payment Entry Operations", "Validation Workflow",
            "Reminder System", "Analytics Functionality", "Entry Modification Permissions", "Error Scenarios"
        ]
        for i, result in enumerate(test_results):
            if not result:
                failed_suites.append(suite_names[i])
        print(f"Failed suites: {', '.join(failed_suites)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())