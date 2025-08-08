import requests
import sys
from datetime import datetime
import json

class PaymentTrackerAPITester:
    def __init__(self, base_url="https://4d43934b-f685-469c-b2ab-2f2225e17c27.preview.emergentagent.com"):
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
            print(f"   User info: {response.get('user', {})}")
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
            201,
            data={"name": f"Test Company {datetime.now().strftime('%H%M%S')}"},
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
        """Test user CRUD operations with correct field names"""
        print("\n" + "="*50)
        print("TESTING USER OPERATIONS")
        print("="*50)
        
        # Create manager with correct field name 'identifiant'
        success1, response1 = self.run_test(
            "Create Manager",
            "POST",
            "users",
            201,
            data={
                "identifiant": "Test Manager",
                "role": "manager",
                "password": "manager123"
            },
            token=self.admin_token
        )
        if success1 and 'id' in response1:
            self.manager_id = response1['id']
            print(f"   Manager created with ID: {self.manager_id}")
            print(f"   Manager login ID: {response1.get('user_id')}")
        
        # Create employee with correct field name 'identifiant'
        success2, response2 = self.run_test(
            "Create Employee",
            "POST",
            "users",
            201,
            data={
                "identifiant": "Test Employee",
                "role": "employee",
                "password": "employee123"
            },
            token=self.admin_token
        )
        if success2 and 'id' in response2:
            self.employee_id = response2['id']
            print(f"   Employee created with ID: {self.employee_id}")
            print(f"   Employee login ID: {response2.get('user_id')}")
        
        # Get users
        success3, response3 = self.run_test(
            "Get Users (as Admin)",
            "GET",
            "users",
            200,
            token=self.admin_token
        )
        if success3:
            print(f"   Found {len(response3)} users")
        
        return all([success1, success2, success3])

    def test_payment_entry_operations(self):
        """Test payment entry CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PAYMENT ENTRY OPERATIONS")
        print("="*50)
        
        # Create payment entry
        success1, response1 = self.run_test(
            "Create Payment Entry",
            "POST",
            "payment-entries",
            201,
            data={
                "company_id": self.company_id,
                "client_name": "Test Client",
                "invoice_number": f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "amount": 1500.50
            },
            token=self.admin_token
        )
        if success1 and 'id' in response1:
            self.payment_entry_id = response1['id']
            print(f"   Payment entry created with ID: {self.payment_entry_id}")
        
        # Get all payment entries
        success2, response2 = self.run_test(
            "Get All Payment Entries",
            "GET",
            "payment-entries",
            200,
            token=self.admin_token
        )
        if success2:
            total_entries = len(response2)
            pending_entries = [e for e in response2 if not e.get('is_validated')]
            validated_entries = [e for e in response2 if e.get('is_validated')]
            print(f"   Total entries: {total_entries}")
            print(f"   Pending entries: {len(pending_entries)}")
            print(f"   Validated entries: {len(validated_entries)}")
        
        # Get validated entries only
        success3, response3 = self.run_test(
            "Get Validated Entries Only",
            "GET",
            "payment-entries?validated_only=true",
            200,
            token=self.admin_token
        )
        if success3:
            print(f"   Validated entries (direct query): {len(response3)}")
        
        return all([success1, success2, success3])

    def test_validation_workflow(self):
        """Test payment validation workflow"""
        print("\n" + "="*50)
        print("TESTING VALIDATION WORKFLOW")
        print("="*50)
        
        # Validate payment entry (as admin)
        success1, response1 = self.run_test(
            "Validate Payment Entry (as Admin)",
            "POST",
            f"payment-entries/{self.payment_entry_id}/validate",
            200,
            token=self.admin_token
        )
        
        # Try to validate again (should fail - already validated)
        success2, response2 = self.run_test(
            "Validate Entry Again (should fail)",
            "POST",
            f"payment-entries/{self.payment_entry_id}/validate",
            400,
            token=self.admin_token
        )
        
        return all([success1, success2])

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
            201,
            data={
                "company_id": self.company_id,
                "client_name": "Another Client",
                "invoice_number": f"INV-REM-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "amount": 2000.00
            },
            token=self.admin_token
        )
        
        reminder_entry_id = None
        if success1 and 'id' in response1:
            reminder_entry_id = response1['id']
            print(f"   Created entry for reminder testing: {reminder_entry_id}")
        
        # Create reminder (as admin)
        success2, response2 = self.run_test(
            "Create Reminder (as Admin)",
            "POST",
            "reminders",
            201,
            data={
                "payment_entry_id": reminder_entry_id,
                "note": "Follow up with client about payment status"
            },
            token=self.admin_token
        )
        
        # Get reminders for entry
        success3, response3 = self.run_test(
            "Get Reminders for Entry",
            "GET",
            f"reminders/{reminder_entry_id}",
            200,
            token=self.admin_token
        )
        if success3:
            print(f"   Found {len(response3)} reminders for entry")
        
        return all([success1, success2, success3])

    def test_analytics(self):
        """Test analytics functionality"""
        print("\n" + "="*50)
        print("TESTING ANALYTICS")
        print("="*50)
        
        success, response = self.run_test(
            "Get Analytics (as Admin)",
            "GET",
            "analytics",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"   Total entries: {response.get('total_entries', 0)}")
            print(f"   Validated entries: {response.get('validated_entries', 0)}")
            print(f"   Pending entries: {response.get('pending_entries', 0)}")
            print(f"   Total amount: {response.get('total_amount', 0)}€")
            print(f"   Companies analyzed: {len(response.get('by_company', []))}")
            print(f"   Employees analyzed: {len(response.get('by_employee', []))}")
        
        return success

    def test_data_separation_verification(self):
        """Verify that pending and validated entries are properly separated"""
        print("\n" + "="*50)
        print("TESTING DATA SEPARATION VERIFICATION")
        print("="*50)
        
        # Get all entries
        success1, all_entries = self.run_test(
            "Get All Entries for Verification",
            "GET",
            "payment-entries",
            200,
            token=self.admin_token
        )
        
        # Get validated entries only
        success2, validated_entries = self.run_test(
            "Get Validated Entries for Verification",
            "GET",
            "payment-entries?validated_only=true",
            200,
            token=self.admin_token
        )
        
        if success1 and success2:
            # Count pending and validated from all entries
            pending_from_all = [e for e in all_entries if not e.get('is_validated')]
            validated_from_all = [e for e in all_entries if e.get('is_validated')]
            
            print(f"   All entries count: {len(all_entries)}")
            print(f"   Pending entries (from all): {len(pending_from_all)}")
            print(f"   Validated entries (from all): {len(validated_from_all)}")
            print(f"   Validated entries (direct query): {len(validated_entries)}")
            
            # Verify separation is correct
            separation_correct = len(validated_from_all) == len(validated_entries)
            if separation_correct:
                print("   ✅ Data separation is working correctly!")
            else:
                print("   ❌ Data separation issue detected!")
            
            return separation_correct
        
        return False

def main():
    print("🚀 Starting PayTrack Backend API Tests")
    print("="*60)
    
    tester = PaymentTrackerAPITester()
    
    # Run all tests
    test_results = []
    
    test_results.append(tester.test_admin_login())
    test_results.append(tester.test_get_current_user())
    test_results.append(tester.test_company_operations())
    test_results.append(tester.test_user_operations())
    test_results.append(tester.test_payment_entry_operations())
    test_results.append(tester.test_validation_workflow())
    test_results.append(tester.test_reminder_system())
    test_results.append(tester.test_analytics())
    test_results.append(tester.test_data_separation_verification())
    
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
            "Admin Login", "Current User", "Company Operations", "User Operations",
            "Payment Entry Operations", "Validation Workflow", "Reminder System",
            "Analytics", "Data Separation Verification"
        ]
        for i, result in enumerate(test_results):
            if not result:
                failed_suites.append(suite_names[i])
        print(f"Failed suites: {', '.join(failed_suites)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())