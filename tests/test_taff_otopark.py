"""
TAFF OTOPARK Backend API Tests
Tests for: Authentication, Vehicles, Companies, Brands, Locations, Users
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://car-tracker-38.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@taff.com"
ADMIN_PASSWORD = "admin123"
STAFF_EMAIL = "demo@taff.com"
STAFF_PASSWORD = "demo123"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "TAFF OTOPARK API"
        print("✓ API root endpoint working")
    
    def test_admin_login(self):
        """Test admin login with admin@taff.com / admin123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful - User: {data['user']['name']}, Role: {data['user']['role']}")
    
    def test_staff_login(self):
        """Test TAFF staff login with demo@taff.com / demo123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STAFF_EMAIL,
            "password": STAFF_PASSWORD
        })
        assert response.status_code == 200, f"Staff login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == STAFF_EMAIL
        assert data["user"]["role"] == "taff_staff"
        print(f"✓ Staff login successful - User: {data['user']['name']}, Role: {data['user']['role']}")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint with valid token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Test /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print("✓ Auth me endpoint working")


class TestCompanies:
    """Company management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_companies(self, admin_token):
        """Test getting all companies"""
        response = requests.get(f"{BASE_URL}/api/companies", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Companies list retrieved - Count: {len(data)}")
    
    def test_create_and_delete_company(self, admin_token):
        """Test creating and deleting a company"""
        test_company_name = f"TEST_Company_{uuid.uuid4().hex[:8]}"
        
        # Create company
        create_response = requests.post(f"{BASE_URL}/api/companies", 
            json={
                "name": test_company_name,
                "contact_person": "Test Contact",
                "phone": "555-1234",
                "email": "test@company.com"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_response.status_code == 200
        company = create_response.json()
        assert company["name"] == test_company_name
        company_id = company["id"]
        print(f"✓ Company created: {test_company_name}")
        
        # Delete company
        delete_response = requests.delete(f"{BASE_URL}/api/companies/{company_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200
        print(f"✓ Company deleted: {test_company_name}")


class TestBrands:
    """Brand management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_brands(self, admin_token):
        """Test getting all brands"""
        response = requests.get(f"{BASE_URL}/api/brands", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Brands list retrieved - Count: {len(data)}")
    
    def test_create_and_delete_brand(self, admin_token):
        """Test creating and deleting a brand"""
        test_brand_name = f"TEST_Brand_{uuid.uuid4().hex[:8]}"
        
        # Create brand
        create_response = requests.post(f"{BASE_URL}/api/brands", 
            json={"name": test_brand_name},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_response.status_code == 200
        brand = create_response.json()
        assert brand["name"] == test_brand_name
        brand_id = brand["id"]
        print(f"✓ Brand created: {test_brand_name}")
        
        # Delete brand
        delete_response = requests.delete(f"{BASE_URL}/api/brands/{brand_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200
        print(f"✓ Brand deleted: {test_brand_name}")


class TestLocations:
    """Location management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_locations(self, admin_token):
        """Test getting all locations"""
        response = requests.get(f"{BASE_URL}/api/locations", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Locations list retrieved - Count: {len(data)}")
    
    def test_create_and_delete_location(self, admin_token):
        """Test creating and deleting a location"""
        test_location_name = f"TEST_Location_{uuid.uuid4().hex[:8]}"
        
        # Create location
        create_response = requests.post(f"{BASE_URL}/api/locations", 
            json={"name": test_location_name},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_response.status_code == 200
        location = create_response.json()
        assert location["name"] == test_location_name
        location_id = location["id"]
        print(f"✓ Location created: {test_location_name}")
        
        # Delete location
        delete_response = requests.delete(f"{BASE_URL}/api/locations/{location_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200
        print(f"✓ Location deleted: {test_location_name}")


class TestUsers:
    """User management tests (Admin only)"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_users_as_admin(self, admin_token):
        """Test getting all users as admin"""
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Users list retrieved - Count: {len(data)}")
        
        # Verify admin user exists
        admin_user = next((u for u in data if u["email"] == ADMIN_EMAIL), None)
        assert admin_user is not None
        assert admin_user["role"] == "admin"
        print(f"✓ Admin user verified: {admin_user['name']}")
    
    def test_get_users_as_staff_forbidden(self):
        """Test that staff cannot access user list"""
        # Login as staff
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STAFF_EMAIL,
            "password": STAFF_PASSWORD
        })
        staff_token = login_response.json()["access_token"]
        
        # Try to get users
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {staff_token}"
        })
        assert response.status_code == 403
        print("✓ Staff correctly forbidden from user list")


class TestVehicles:
    """Vehicle management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def staff_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STAFF_EMAIL,
            "password": STAFF_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_vehicles_as_admin(self, admin_token):
        """Test getting all vehicles as admin"""
        response = requests.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Vehicles list retrieved as admin - Count: {len(data)}")
        
        # Check that vehicles have received_by_name field
        if len(data) > 0:
            vehicle = data[0]
            assert "received_by_name" in vehicle
            assert "company" in vehicle
            print(f"✓ Vehicle has received_by_name: {vehicle.get('received_by_name')}")
            print(f"✓ Vehicle has company: {vehicle.get('company')}")
    
    def test_get_vehicles_as_staff(self, staff_token):
        """Test getting all vehicles as staff"""
        response = requests.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {staff_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Vehicles list retrieved as staff - Count: {len(data)}")
    
    def test_get_vehicle_detail(self, admin_token):
        """Test getting vehicle detail"""
        # First get list of vehicles
        list_response = requests.get(f"{BASE_URL}/api/vehicles", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        vehicles = list_response.json()
        
        if len(vehicles) > 0:
            vehicle_id = vehicles[0]["id"]
            response = requests.get(f"{BASE_URL}/api/vehicles/{vehicle_id}", headers={
                "Authorization": f"Bearer {admin_token}"
            })
            assert response.status_code == 200
            vehicle = response.json()
            assert vehicle["id"] == vehicle_id
            assert "received_by_name" in vehicle
            assert "company" in vehicle
            print(f"✓ Vehicle detail retrieved: {vehicle['plate']} - {vehicle['brand']} {vehicle['model']}")
        else:
            print("⚠ No vehicles to test detail endpoint")


class TestReports:
    """Reports endpoint tests (Admin only)"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_user_summary_report(self, admin_token):
        """Test user summary report endpoint"""
        response = requests.get(f"{BASE_URL}/api/reports/user-summary", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ User summary report retrieved - Users with delivered vehicles: {len(data)}")


class TestRoleBasedAccess:
    """Test role-based access control"""
    
    def test_admin_can_delete_vehicle(self):
        """Test that admin can access delete vehicle endpoint"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        admin_token = login_response.json()["access_token"]
        
        # Try to delete non-existent vehicle (should return 404, not 403)
        response = requests.delete(f"{BASE_URL}/api/vehicles/non-existent-id", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        # Should be 404 (not found) not 403 (forbidden)
        assert response.status_code == 404
        print("✓ Admin has access to delete vehicle endpoint")
    
    def test_staff_cannot_delete_vehicle(self):
        """Test that staff cannot delete vehicles"""
        # Login as staff
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STAFF_EMAIL,
            "password": STAFF_PASSWORD
        })
        staff_token = login_response.json()["access_token"]
        
        # Try to delete vehicle
        response = requests.delete(f"{BASE_URL}/api/vehicles/any-id", headers={
            "Authorization": f"Bearer {staff_token}"
        })
        assert response.status_code == 403
        print("✓ Staff correctly forbidden from deleting vehicles")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
