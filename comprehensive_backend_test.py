import requests
import sys
from datetime import datetime
import json

class ComprehensivePayTrackAPITester:
    def __init__(self, base_url="https://4d43934b-f685-469c-b2ab-2f2225e17c27.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.manager_token = None
        self.employee_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.company_id = None
        self.manager_user_id = None
        self.employee_user_id = None
        self.payment_entry_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
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

    def test_authentication_comprehensive(self):
        """Test comprehensive authentication scenarios"""
        print("\n" + "="*60)
        print("COMPREHENSIVE AUTHENTICATION TESTING")
        print("="*60)
        
        # Test admin login
        success1, response1 = self.run_test(
            "Admin Login (admin/admin123)",
            "POST",
            "login",
            200,
            data={"user_id": "admin", "password": "admin123"}
        )
        if success1 and 'access_token' in response1:
            self.admin_token = response1['access_token']
            print(f"   Admin token obtained successfully")
        
        # Test invalid login
        success2, response2 = self.run_test(
            "Invalid Login (should fail)",
            "POST",
            "login",
            401,
            data={"user_id": "invalid", "password": "wrong"}
        )
        
        # Test /me endpoint
        success3, response3 = self.run_test(
            "Get Current User (/me)",
            "GET",
            "me",
            200,
            token=self.admin_token
        )
        
        # Test /me without token (should fail)
        success4, response4 = self.run_test(
            "Get Current User without token (should fail)",
            "GET",
            "me",
            403  # FastAPI returns 403 for missing auth, not 401
        )
        
        return all([success1, success2, success3, success4])

    def test_user_management_comprehensive(self):
        """Test comprehensive user management"""
        print("\n" + "="*60)
        print("COMPREHENSIVE USER MANAGEMENT TESTING")
        print("="*60)
        
        # Create manager
        success1, response1 = self.run_test(
            "Create Manager User",
            "POST",
            "users",
            200,
            data={
                "identifiant": "Test Manager Comprehensive",
                "role": "manager",
                "password": "manager123"
            },
            token=self.admin_token
        )
        if success1 and 'user_id' in response1:
            self.manager_user_id = response1['user_id']
            print(f"   Manager user_id: {self.manager_user_id}")
        
        # Create employee
        success2, response2 = self.run_test(
            "Create Employee User",
            "POST",
            "users",
            200,
            data={
                "identifiant": "Test Employee Comprehensive",
                "role": "employee",
                "password": "employee123"
            },
            token=self.admin_token
        )
        if success2 and 'user_id' in response2:
            self.employee_user_id = response2['user_id']
            print(f"   Employee user_id: {self.employee_user_id}")
        
        # Test manager login
        success3, response3 = self.run_test(
            "Manager Login",
            "POST",
            "login",
            200,
            data={"user_id": self.manager_user_id, "password": "manager123"}
        )
        if success3 and 'access_token' in response3:
            self.manager_token = response3['access_token']
            print(f"   Manager token obtained")
        
        # Test employee login
        success4, response4 = self.run_test(
            "Employee Login",
            "POST",
            "login",
            200,
            data={"user_id": self.employee_user_id, "password": "employee123"}
        )
        if success4 and 'access_token' in response4:
            self.employee_token = response4['access_token']
            print(f"   Employee token obtained")
        
        # Test get users as admin
        success5, response5 = self.run_test(
            "Get Users (as Admin)",
            "GET",
            "users",
            200,
            token=self.admin_token
        )
        
        # Test get users as manager (should only see employees)
        success6, response6 = self.run_test(
            "Get Users (as Manager - should see employees only)",
            "GET",
            "users",
            200,
            token=self.manager_token
        )
        if success6:
            employee_users = [u for u in response6 if u['role'] == 'employee']
            non_employee_users = [u for u in response6 if u['role'] != 'employee']
            print(f"   Manager sees {len(employee_users)} employees, {len(non_employee_users)} non-employees")
        
        # Test get users as employee (should fail)
        success7, response7 = self.run_test(
            "Get Users (as Employee - should fail)",
            "GET",
            "users",
            403,
            token=self.employee_token
        )
        
        return all([success1, success2, success3, success4, success5, success6, success7])

    def test_company_management_comprehensive(self):
        """Test comprehensive company management"""
        print("\n" + "="*60)
        print("COMPREHENSIVE COMPANY MANAGEMENT TESTING")
        print("="*60)
        
        # Create company as admin
        success1, response1 = self.run_test(
            "Create Company (as Admin)",
            "POST",
            "companies",
            200,
            data={"name": f"Comprehensive Test Company {datetime.now().strftime('%H%M%S')}"},
            token=self.admin_token
        )
        if success1 and 'id' in response1:
            self.company_id = response1['id']
            print(f"   Company created with ID: {self.company_id}")
        
        # Create company as manager
        success2, response2 = self.run_test(
            "Create Company (as Manager)",
            "POST",
            "companies",
            200,
            data={"name": f"Manager Company {datetime.now().strftime('%H%M%S')}"},
            token=self.manager_token
        )
        
        # Try to create company as employee (should fail)
        success3, response3 = self.run_test(
            "Create Company (as Employee - should fail)",
            "POST",
            "companies",
            403,
            data={"name": "Employee Company"},
            token=self.employee_token
        )
        
        # Get companies (all roles should be able to see)
        success4, response4 = self.run_test(
            "Get Companies (as Admin)",
            "GET",
            "companies",
            200,
            token=self.admin_token
        )
        
        success5, response5 = self.run_test(
            "Get Companies (as Manager)",
            "GET",
            "companies",
            200,
            token=self.manager_token
        )
        
        success6, response6 = self.run_test(
            "Get Companies (as Employee)",
            "GET",
            "companies",
            200,
            token=self.employee_token
        )
        
        # Update company as admin
        success7, response7 = self.run_test(
            "Update Company (as Admin)",
            "PUT",
            f"companies/{self.company_id}",
            200,
            data={"name": "Updated Company Name"},
            token=self.admin_token
        )
        
        return all([success1, success2, success3, success4, success5, success6, success7])

    def test_payment_entries_comprehensive(self):
        """Test comprehensive payment entry operations"""
        print("\n" + "="*60)
        print("COMPREHENSIVE PAYMENT ENTRY TESTING")
        print("="*60)
        
        if not self.company_id:
            print("   No company_id available, skipping payment entry tests")
            return False
        
        # Create payment entry as admin
        success1, response1 = self.run_test(
            "Create Payment Entry (as Admin)",
            "POST",
            "payment-entries",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Comprehensive Test Client",
                "invoice_number": f"COMP-INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "amount": 2500.75
            },
            token=self.admin_token
        )
        if success1 and 'id' in response1:
            self.payment_entry_id = response1['id']
            print(f"   Payment entry created with ID: {self.payment_entry_id}")
        
        # Create payment entry as manager
        success2, response2 = self.run_test(
            "Create Payment Entry (as Manager)",
            "POST",
            "payment-entries",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Manager Test Client",
                "invoice_number": f"MGR-INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "amount": 1800.00
            },
            token=self.manager_token
        )
        
        # Create payment entry as employee
        success3, response3 = self.run_test(
            "Create Payment Entry (as Employee)",
            "POST",
            "payment-entries",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Employee Test Client",
                "invoice_number": f"EMP-INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "amount": 1200.50
            },
            token=self.employee_token
        )
        
        # Get all payment entries
        success4, response4 = self.run_test(
            "Get All Payment Entries",
            "GET",
            "payment-entries",
            200,
            token=self.admin_token
        )
        
        # Get validated entries only
        success5, response5 = self.run_test(
            "Get Validated Entries Only",
            "GET",
            "payment-entries",
            200,
            params={"validated_only": "true"},
            token=self.admin_token
        )
        
        # Update payment entry (should work before validation)
        success6, response6 = self.run_test(
            "Update Payment Entry",
            "PUT",
            f"payment-entries/{self.payment_entry_id}",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Updated Client Name",
                "invoice_number": f"UPD-INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "amount": 3000.00
            },
            token=self.admin_token
        )
        
        return all([success1, success2, success3, success4, success5, success6])

    def test_validation_workflow_comprehensive(self):
        """Test comprehensive validation workflow"""
        print("\n" + "="*60)
        print("COMPREHENSIVE VALIDATION WORKFLOW TESTING")
        print("="*60)
        
        if not self.payment_entry_id:
            print("   No payment_entry_id available, skipping validation tests")
            return False
        
        # Try to validate as employee (should fail)
        success1, response1 = self.run_test(
            "Validate Payment Entry (as Employee - should fail)",
            "POST",
            f"payment-entries/{self.payment_entry_id}/validate",
            403,
            token=self.employee_token
        )
        
        # Validate as manager (should work)
        success2, response2 = self.run_test(
            "Validate Payment Entry (as Manager)",
            "POST",
            f"payment-entries/{self.payment_entry_id}/validate",
            200,
            token=self.manager_token
        )
        
        # Try to validate again (should fail - already validated)
        success3, response3 = self.run_test(
            "Validate Entry Again (should fail - already validated)",
            "POST",
            f"payment-entries/{self.payment_entry_id}/validate",
            400,
            token=self.admin_token
        )
        
        # Try to update validated entry (should fail)
        success4, response4 = self.run_test(
            "Update Validated Entry (should fail)",
            "PUT",
            f"payment-entries/{self.payment_entry_id}",
            400,
            data={
                "company_id": self.company_id,
                "client_name": "Should Not Update",
                "invoice_number": "SHOULD-NOT-UPDATE",
                "amount": 9999.99
            },
            token=self.admin_token
        )
        
        # Try to delete validated entry (should fail)
        success5, response5 = self.run_test(
            "Delete Validated Entry (should fail)",
            "DELETE",
            f"payment-entries/{self.payment_entry_id}",
            400,
            token=self.admin_token
        )
        
        return all([success1, success2, success3, success4, success5])

    def test_reminders_comprehensive(self):
        """Test comprehensive reminder system"""
        print("\n" + "="*60)
        print("COMPREHENSIVE REMINDER SYSTEM TESTING")
        print("="*60)
        
        if not self.company_id:
            print("   No company_id available, skipping reminder tests")
            return False
        
        # Create unvalidated payment entry for reminder testing
        success1, response1 = self.run_test(
            "Create Unvalidated Payment Entry for Reminders",
            "POST",
            "payment-entries",
            200,
            data={
                "company_id": self.company_id,
                "client_name": "Reminder Test Client",
                "invoice_number": f"REM-INV-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "amount": 1500.00
            },
            token=self.admin_token
        )
        
        reminder_entry_id = None
        if success1 and 'id' in response1:
            reminder_entry_id = response1['id']
            print(f"   Created unvalidated entry for reminders: {reminder_entry_id}")
        
        # Try to create reminder as employee (should fail)
        success2, response2 = self.run_test(
            "Create Reminder (as Employee - should fail)",
            "POST",
            "reminders",
            403,
            data={
                "payment_entry_id": reminder_entry_id,
                "note": "Employee reminder attempt"
            },
            token=self.employee_token
        )
        
        # Create reminder as manager
        success3, response3 = self.run_test(
            "Create Reminder (as Manager)",
            "POST",
            "reminders",
            200,
            data={
                "payment_entry_id": reminder_entry_id,
                "note": "Manager reminder - follow up needed"
            },
            token=self.manager_token
        )
        
        # Create reminder as admin
        success4, response4 = self.run_test(
            "Create Reminder (as Admin)",
            "POST",
            "reminders",
            200,
            data={
                "payment_entry_id": reminder_entry_id,
                "note": "Admin reminder - urgent follow up"
            },
            token=self.admin_token
        )
        
        # Get reminders for entry as manager
        success5, response5 = self.run_test(
            "Get Reminders for Entry (as Manager)",
            "GET",
            f"reminders/{reminder_entry_id}",
            200,
            token=self.manager_token
        )
        if success5:
            print(f"   Found {len(response5)} reminders for entry")
        
        # Try to get reminders as employee (should fail)
        success6, response6 = self.run_test(
            "Get Reminders (as Employee - should fail)",
            "GET",
            f"reminders/{reminder_entry_id}",
            403,
            token=self.employee_token
        )
        
        return all([success1, success2, success3, success4, success5, success6])

    def test_analytics_comprehensive(self):
        """Test comprehensive analytics"""
        print("\n" + "="*60)
        print("COMPREHENSIVE ANALYTICS TESTING")
        print("="*60)
        
        # Get analytics as admin (should work)
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
            print(f"   Total amount: {response1.get('total_amount', 0)}€")
            print(f"   Companies in analytics: {len(response1.get('by_company', []))}")
            print(f"   Employees in analytics: {len(response1.get('by_employee', []))}")
            print(f"   Months in analytics: {len(response1.get('by_month', []))}")
        
        # Try to get analytics as manager (should fail)
        success2, response2 = self.run_test(
            "Get Analytics (as Manager - should fail)",
            "GET",
            "analytics",
            403,
            token=self.manager_token
        )
        
        # Try to get analytics as employee (should fail)
        success3, response3 = self.run_test(
            "Get Analytics (as Employee - should fail)",
            "GET",
            "analytics",
            403,
            token=self.employee_token
        )
        
        return all([success1, success2, success3])

    def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n" + "="*60)
        print("EDGE CASES AND ERROR HANDLING TESTING")
        print("="*60)
        
        # Test with invalid payment entry ID
        success1, response1 = self.run_test(
            "Validate Non-existent Payment Entry",
            "POST",
            "payment-entries/invalid-id/validate",
            404,
            token=self.admin_token
        )
        
        # Test with invalid company ID in payment entry
        success2, response2 = self.run_test(
            "Create Payment Entry with Invalid Company ID",
            "POST",
            "payment-entries",
            200,  # Should still create but with invalid company reference
            data={
                "company_id": "invalid-company-id",
                "client_name": "Test Client",
                "invoice_number": f"INVALID-{datetime.now().strftime('%H%M%S')}",
                "amount": 100.00
            },
            token=self.admin_token
        )
        
        # Test reminder for non-existent payment entry
        success3, response3 = self.run_test(
            "Create Reminder for Non-existent Entry",
            "POST",
            "reminders",
            404,
            data={
                "payment_entry_id": "invalid-entry-id",
                "note": "This should fail"
            },
            token=self.admin_token
        )
        
        # Test update non-existent payment entry
        success4, response4 = self.run_test(
            "Update Non-existent Payment Entry",
            "PUT",
            "payment-entries/invalid-id",
            404,
            data={
                "company_id": self.company_id,
                "client_name": "Should Not Work",
                "invoice_number": "INVALID",
                "amount": 100.00
            },
            token=self.admin_token
        )
        
        # Test delete non-existent payment entry
        success5, response5 = self.run_test(
            "Delete Non-existent Payment Entry",
            "DELETE",
            "payment-entries/invalid-id",
            404,
            token=self.admin_token
        )
        
        return all([success1, success2, success3, success4, success5])

def main():
    print("🚀 Starting Comprehensive PayTrack Backend API Tests")
    print("="*70)
    
    tester = ComprehensivePayTrackAPITester()
    
    # Run all comprehensive tests
    test_results = []
    
    test_results.append(tester.test_authentication_comprehensive())
    test_results.append(tester.test_user_management_comprehensive())
    test_results.append(tester.test_company_management_comprehensive())
    test_results.append(tester.test_payment_entries_comprehensive())
    test_results.append(tester.test_validation_workflow_comprehensive())
    test_results.append(tester.test_reminders_comprehensive())
    test_results.append(tester.test_analytics_comprehensive())
    test_results.append(tester.test_edge_cases())
    
    # Print final results
    print("\n" + "="*70)
    print("📊 COMPREHENSIVE TEST RESULTS")
    print("="*70)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if all(test_results):
        print("\n🎉 ALL COMPREHENSIVE TEST SUITES PASSED!")
        return 0
    else:
        print("\n❌ SOME COMPREHENSIVE TEST SUITES FAILED!")
        failed_suites = []
        suite_names = [
            "Authentication", "User Management", "Company Management", 
            "Payment Entries", "Validation Workflow", "Reminders", 
            "Analytics", "Edge Cases"
        ]
        for i, result in enumerate(test_results):
            if not result:
                failed_suites.append(suite_names[i])
        print(f"Failed suites: {', '.join(failed_suites)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())