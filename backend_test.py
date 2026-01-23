#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class ValetProAPITester:
    def __init__(self, base_url="https://fleet-manager-273.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.staff_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_staff_registration(self):
        """Test staff registration"""
        staff_data = {
            "email": f"staff_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Staff",
            "role": "staff"
        }
        
        success, response = self.run_test(
            "Staff Registration",
            "POST",
            "auth/register",
            200,
            data=staff_data
        )
        
        if success and 'access_token' in response:
            self.staff_token = response['access_token']
            return True, staff_data
        return False, {}

    def test_customer_registration(self):
        """Test customer registration"""
        customer_data = {
            "email": f"customer_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Customer",
            "role": "customer"
        }
        
        success, response = self.run_test(
            "Customer Registration",
            "POST",
            "auth/register",
            200,
            data=customer_data
        )
        
        if success and 'access_token' in response:
            self.customer_token = response['access_token']
            return True, customer_data
        return False, {}

    def test_staff_login(self, staff_data):
        """Test staff login"""
        login_data = {
            "email": staff_data["email"],
            "password": staff_data["password"]
        }
        
        success, response = self.run_test(
            "Staff Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.staff_token = response['access_token']
            return True
        return False

    def test_customer_login(self, customer_data):
        """Test customer login"""
        login_data = {
            "email": customer_data["email"],
            "password": customer_data["password"]
        }
        
        success, response = self.run_test(
            "Customer Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.customer_token = response['access_token']
            return True
        return False

    def test_auth_me_staff(self):
        """Test /auth/me endpoint for staff"""
        success, response = self.run_test(
            "Staff Auth Me",
            "GET",
            "auth/me",
            200,
            token=self.staff_token
        )
        return success and response.get('role') == 'staff'

    def test_auth_me_customer(self):
        """Test /auth/me endpoint for customer"""
        success, response = self.run_test(
            "Customer Auth Me",
            "GET",
            "auth/me",
            200,
            token=self.customer_token
        )
        return success and response.get('role') == 'customer'

    def test_vehicle_creation_by_staff(self, customer_email):
        """Test vehicle creation by staff"""
        vehicle_data = {
            "plate": "34TEST123",
            "brand": "BMW",
            "model": "320i",
            "company": "Test Şirket",
            "fuel_status": "full",
            "notes": "Test araç notları",
            "customer_email": customer_email,
            "photos": [
                {"category": "general", "url": "data:image/jpeg;base64,test1"},
                {"category": "dashboard", "url": "data:image/jpeg;base64,test2"},
                {"category": "seats", "url": "data:image/jpeg;base64,test3"},
                {"category": "hood", "url": "data:image/jpeg;base64,test4"},
                {"category": "coolant", "url": "data:image/jpeg;base64,test5"}
            ]
        }
        
        success, response = self.run_test(
            "Vehicle Creation by Staff",
            "POST",
            "vehicles",
            200,
            data=vehicle_data,
            token=self.staff_token
        )
        
        if success and 'id' in response:
            return True, response['id']
        return False, None

    def test_vehicle_creation_by_customer(self):
        """Test vehicle creation by customer (should fail)"""
        vehicle_data = {
            "plate": "34FAIL123",
            "brand": "Toyota",
            "model": "Corolla",
            "company": "Test Şirket",
            "fuel_status": "full"
        }
        
        success, response = self.run_test(
            "Vehicle Creation by Customer (Should Fail)",
            "POST",
            "vehicles",
            403,
            data=vehicle_data,
            token=self.customer_token
        )
        return success

    def test_get_vehicles_staff(self):
        """Test getting vehicles as staff (should see all)"""
        success, response = self.run_test(
            "Get Vehicles as Staff",
            "GET",
            "vehicles",
            200,
            token=self.staff_token
        )
        return success, response

    def test_get_vehicles_customer(self):
        """Test getting vehicles as customer (should see only own)"""
        success, response = self.run_test(
            "Get Vehicles as Customer",
            "GET",
            "vehicles",
            200,
            token=self.customer_token
        )
        return success, response

    def test_get_vehicle_detail_staff(self, vehicle_id):
        """Test getting vehicle detail as staff"""
        success, response = self.run_test(
            "Get Vehicle Detail as Staff",
            "GET",
            f"vehicles/{vehicle_id}",
            200,
            token=self.staff_token
        )
        return success

    def test_get_vehicle_detail_customer(self, vehicle_id):
        """Test getting vehicle detail as customer"""
        success, response = self.run_test(
            "Get Vehicle Detail as Customer",
            "GET",
            f"vehicles/{vehicle_id}",
            200,
            token=self.customer_token
        )
        return success

    def test_deliver_vehicle_by_staff(self, vehicle_id):
        """Test vehicle delivery by staff"""
        deliver_data = {
            "notes": "Araç başarıyla teslim edildi"
        }
        
        success, response = self.run_test(
            "Vehicle Delivery by Staff",
            "PUT",
            f"vehicles/{vehicle_id}/deliver",
            200,
            data=deliver_data,
            token=self.staff_token
        )
        return success

    def test_deliver_vehicle_by_customer(self, vehicle_id):
        """Test vehicle delivery by customer (should fail)"""
        deliver_data = {
            "notes": "Müşteri teslim etmeye çalışıyor"
        }
        
        success, response = self.run_test(
            "Vehicle Delivery by Customer (Should Fail)",
            "PUT",
            f"vehicles/{vehicle_id}/deliver",
            403,
            data=deliver_data,
            token=self.customer_token
        )
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access"""
        success, response = self.run_test(
            "Unauthorized Access (Should Fail)",
            "GET",
            "vehicles",
            401
        )
        return success

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

def main():
    print("🚗 ValetPro API Test Suite")
    print("=" * 50)
    
    tester = ValetProAPITester()
    
    # Test root endpoint
    tester.test_root_endpoint()
    
    # Test unauthorized access
    tester.test_unauthorized_access()
    
    # Test staff registration and login
    staff_success, staff_data = tester.test_staff_registration()
    if not staff_success:
        print("❌ Staff registration failed, stopping tests")
        return 1
    
    # Test customer registration and login
    customer_success, customer_data = tester.test_customer_registration()
    if not customer_success:
        print("❌ Customer registration failed, stopping tests")
        return 1
    
    # Test auth/me endpoints
    tester.test_auth_me_staff()
    tester.test_auth_me_customer()
    
    # Test vehicle operations
    vehicle_success, vehicle_id = tester.test_vehicle_creation_by_staff(customer_data["email"])
    if not vehicle_success:
        print("❌ Vehicle creation failed, stopping vehicle tests")
    else:
        # Test vehicle access permissions
        tester.test_get_vehicle_detail_staff(vehicle_id)
        tester.test_get_vehicle_detail_customer(vehicle_id)
        
        # Test vehicle lists
        staff_vehicles_success, staff_vehicles = tester.test_get_vehicles_staff()
        customer_vehicles_success, customer_vehicles = tester.test_get_vehicles_customer()
        
        # Verify authorization logic
        if staff_vehicles_success and customer_vehicles_success:
            staff_count = len(staff_vehicles) if isinstance(staff_vehicles, list) else 0
            customer_count = len(customer_vehicles) if isinstance(customer_vehicles, list) else 0
            
            print(f"📊 Staff sees {staff_count} vehicles, Customer sees {customer_count} vehicles")
            
            if staff_count >= customer_count:
                tester.log_test("Authorization Logic Check", True, "Staff sees >= customer vehicles")
            else:
                tester.log_test("Authorization Logic Check", False, "Staff should see more vehicles than customer")
        
        # Test delivery operations
        tester.test_deliver_vehicle_by_customer(vehicle_id)  # Should fail
        tester.test_deliver_vehicle_by_staff(vehicle_id)    # Should succeed
    
    # Test permission failures
    tester.test_vehicle_creation_by_customer()  # Should fail
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())