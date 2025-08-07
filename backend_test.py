import requests
import sys
from datetime import datetime
import json

class PaymentTrackerAPITester:
    def __init__(self, base_url="https://cfa933a6-2168-4ef6-83d7-d6900b025b6e.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.manager_token = None
        self.employee_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.company_id = None
        self.manager_id = None
        self.employee_id = None
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

    def test_admin_initialization(self):
        """Test admin initialization"""
        print("\n" + "="*50)
        print("TESTING ADMIN INITIALIZATION")
        print("="*50)
        
        success, response = self.run_test(
            "Initialize Admin",
            "POST",
            "init-admin",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
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
            print(f"   User: {response.get('name')} ({response.get('role')})")
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

    def test_user_operations(self):
        """Test user CRUD operations"""
        print("\n" + "="*50)
        print("TESTING USER OPERATIONS")
        print("="*50)
        
        # Create manager
        success1, response1 = self.run_test(
            "Create Manager",
            "POST",
            "users",
            200,
            data={
                "user_id": "manager1",
                "name": "Test Manager",
                "role": "manager",
                "password": "manager123",
                "company_id": self.company_id
            },
            token=self.admin_token
        )
        if success1 and 'id' in response1:
            self.manager_id = response1['id']
            print(f"   Manager created with ID: {self.manager_id}")
        
        # Login as manager
        success2, response2 = self.run_test(
            "Manager Login",
            "POST",
            "login",
            200,
            data={"user_id": "manager1", "password": "manager123"}
        )
        if success2 and 'access_token' in response2:
            self.manager_token = response2['access_token']
            print(f"   Manager token obtained")
        
        # Create employee (as manager)
        success3, response3 = self.run_test(
            "Create Employee (as Manager)",
            "POST",
            "users",
            200,
            data={
                "user_id": "employee1",
                "name": "Test Employee",
                "role": "employee",
                "password": "employee123",
                "company_id": self.company_id
            },
            token=self.manager_token
        )
        if success3 and 'id' in response3:
            self.employee_id = response3['id']
            print(f"   Employee created with ID: {self.employee_id}")
        
        # Login as employee
        success4, response4 = self.run_test(
            "Employee Login",
            "POST",
            "login",
            200,
            data={"user_id": "employee1", "password": "employee123"}
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

    def test_payment_entry_operations(self):
        """Test payment entry CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PAYMENT ENTRY OPERATIONS")
        print("="*50)
        
        # Create payment entry (as employee)
        success1, response1 = self.run_test(
            "Create Payment Entry (as Employee)",
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
        
        # Get payment entries (as employee - should see only own)
        success2, response2 = self.run_test(
            "Get Payment Entries (as Employee)",
            "GET",
            "payment-entries",
            200,
            token=self.employee_token
        )
        if success2:
            print(f"   Employee sees {len(response2)} entries")
        
        # Get payment entries (as manager - should see all)
        success3, response3 = self.run_test(
            "Get Payment Entries (as Manager)",
            "GET",
            "payment-entries",
            200,
            token=self.manager_token
        )
        if success3:
            print(f"   Manager sees {len(response3)} entries")
        
        # Get pending entries (as manager)
        success4, response4 = self.run_test(
            "Get Pending Entries (as Manager)",
            "GET",
            "payment-entries/pending",
            200,
            token=self.manager_token
        )
        if success4:
            print(f"   Found {len(response4)} pending entries")
        
        return all([success1, success2, success3, success4])

    def test_validation_workflow(self):
        """Test payment validation workflow"""
        print("\n" + "="*50)
        print("TESTING VALIDATION WORKFLOW")
        print("="*50)
        
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
                "user_id": "manager2",
                "name": "Another Manager",
                "role": "manager",
                "password": "password123"
            },
            token=self.employee_token
        )
        
        # Duplicate user ID
        success4, response4 = self.run_test(
            "Duplicate User ID (should fail)",
            "POST",
            "users",
            400,
            data={
                "user_id": "admin",  # Already exists
                "name": "Duplicate Admin",
                "role": "admin",
                "password": "password123"
            },
            token=self.admin_token
        )
        
        return all([success1, success2, success3, success4])

    def test_delete_operations(self):
        """Test delete operations"""
        print("\n" + "="*50)
        print("TESTING DELETE OPERATIONS")
        print("="*50)
        
        # Create a new entry to delete
        success1, response1 = self.run_test(
            "Create Entry for Deletion",
            "POST",
            "payment-entries",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Delete Test Client",
                "invoice_number": "INV-DELETE",
                "amount": 500.00
            },
            token=self.employee_token
        )
        
        delete_entry_id = None
        if success1 and 'id' in response1:
            delete_entry_id = response1['id']
        
        # Delete own entry (should succeed)
        success2, response2 = self.run_test(
            "Delete Own Entry",
            "DELETE",
            f"payment-entries/{delete_entry_id}",
            200,
            token=self.employee_token
        )
        
        # Try to delete validated entry (should fail)
        success3, response3 = self.run_test(
            "Delete Validated Entry (should fail)",
            "DELETE",
            f"payment-entries/{self.payment_entry_id}",
            400,
            token=self.employee_token
        )
        
        return all([success1, success2, success3])

def main():
    print("🚀 Starting Payment Tracker API Tests")
    print("="*60)
    
    tester = PaymentTrackerAPITester()
    
    # Run all tests
    test_results = []
    
    test_results.append(tester.test_admin_initialization())
    test_results.append(tester.test_admin_login())
    test_results.append(tester.test_get_current_user())
    test_results.append(tester.test_company_operations())
    test_results.append(tester.test_user_operations())
    test_results.append(tester.test_payment_entry_operations())
    test_results.append(tester.test_validation_workflow())
    test_results.append(tester.test_reminder_system())
    test_results.append(tester.test_error_scenarios())
    test_results.append(tester.test_delete_operations())
    
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
            "Admin Initialization", "Admin Login", "Current User", "Company Operations",
            "User Operations", "Payment Entry Operations", "Validation Workflow",
            "Reminder System", "Error Scenarios", "Delete Operations"
        ]
        for i, result in enumerate(test_results):
            if not result:
                failed_suites.append(suite_names[i])
        print(f"Failed suites: {', '.join(failed_suites)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())