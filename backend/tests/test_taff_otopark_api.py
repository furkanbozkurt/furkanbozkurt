"""
TAFF OTOPARK API Tests
Tests for: Authentication, Vehicles, Users, Companies, Brands, Locations, Test Drives
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fleet-manager-273.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@taff.com"
ADMIN_PASSWORD = "admin123"
STAFF_EMAIL = "demo@taff.com"
STAFF_PASSWORD = "demo123"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['name']}")
    
    def test_staff_login_success(self):
        """Test TAFF staff login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STAFF_EMAIL,
            "password": STAFF_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == STAFF_EMAIL
        assert data["user"]["role"] == "taff_staff"
        print(f"✓ Staff login successful: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print(f"✓ Current user retrieved: {data['name']}")


class TestVehicles:
    """Vehicle endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def staff_token(self):
        """Get staff authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STAFF_EMAIL,
            "password": STAFF_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_vehicles_list(self, admin_token):
        """Test getting vehicles list"""
        response = requests.get(
            f"{BASE_URL}/api/vehicles",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Vehicles list retrieved: {len(data)} vehicles")
        
        # Check vehicle structure
        if len(data) > 0:
            vehicle = data[0]
            assert "id" in vehicle
            assert "plate" in vehicle
            assert "brand" in vehicle
            assert "model" in vehicle
            assert "status" in vehicle
            assert "received_by_name" in vehicle
            print(f"✓ Vehicle structure verified: {vehicle['plate']}")
    
    def test_get_vehicle_detail(self, admin_token):
        """Test getting vehicle detail"""
        # First get list
        list_response = requests.get(
            f"{BASE_URL}/api/vehicles",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vehicles = list_response.json()
        
        if len(vehicles) > 0:
            vehicle_id = vehicles[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/vehicles/{vehicle_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == vehicle_id
            print(f"✓ Vehicle detail retrieved: {data['plate']}")
    
    def test_vehicles_unauthorized(self):
        """Test vehicles endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/vehicles")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized access correctly blocked")


class TestPendingApprovals:
    """Test pending approvals functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_pending_approval_vehicles(self, admin_token):
        """Test getting vehicles with pending_approval status"""
        response = requests.get(
            f"{BASE_URL}/api/vehicles",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        vehicles = response.json()
        
        pending_vehicles = [v for v in vehicles if v["status"] == "pending_approval"]
        print(f"✓ Found {len(pending_vehicles)} vehicles pending approval")
        
        for v in pending_vehicles:
            print(f"  - {v['plate']}: {v['brand']} {v['model']}")


class TestUserManagement:
    """User management endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_users_list(self, admin_token):
        """Test getting users list (admin only)"""
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Users list retrieved: {len(data)} users")
        
        # Check user structure
        if len(data) > 0:
            user = data[0]
            assert "id" in user
            assert "email" in user
            assert "name" in user
            assert "role" in user
            assert "approved" in user
            print(f"✓ User structure verified")
    
    def test_users_list_staff_forbidden(self):
        """Test that staff cannot access users list"""
        # Login as staff
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": STAFF_EMAIL,
            "password": STAFF_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
        print("✓ Staff correctly forbidden from users list")


class TestCompanies:
    """Company endpoint tests"""
    
    def test_get_companies_list(self):
        """Test getting companies list (public)"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Companies list retrieved: {len(data)} companies")
        
        for company in data[:5]:
            print(f"  - {company['name']}")


class TestBrands:
    """Brand endpoint tests"""
    
    def test_get_brands_list(self):
        """Test getting brands list (public)"""
        response = requests.get(f"{BASE_URL}/api/brands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Brands list retrieved: {len(data)} brands")
        
        for brand in data[:5]:
            print(f"  - {brand['name']}")


class TestLocations:
    """Location endpoint tests"""
    
    def test_get_locations_list(self):
        """Test getting locations list (public)"""
        response = requests.get(f"{BASE_URL}/api/locations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Locations list retrieved: {len(data)} locations")
        
        for location in data:
            print(f"  - {location['name']}")


class TestDepartments:
    """Department endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_departments_list(self, admin_token):
        """Test getting departments list"""
        response = requests.get(
            f"{BASE_URL}/api/departments",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Departments list retrieved: {len(data)} departments")


class TestTestDrives:
    """Test drive endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_test_drives_for_vehicle(self, admin_token):
        """Test getting test drives for a vehicle"""
        # First get a vehicle
        vehicles_response = requests.get(
            f"{BASE_URL}/api/vehicles",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vehicles = vehicles_response.json()
        
        if len(vehicles) > 0:
            vehicle_id = vehicles[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/test-drives/vehicle/{vehicle_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Test drives retrieved for vehicle: {len(data)} drives")


class TestVehicleDelivery:
    """Vehicle delivery endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_deliver_vehicle_requires_early_delivery_reason(self, admin_token):
        """Test that early delivery requires explanation"""
        # Get a vehicle with estimated_test_km
        vehicles_response = requests.get(
            f"{BASE_URL}/api/vehicles",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vehicles = vehicles_response.json()
        
        # Find a vehicle with estimated_test_km that's not delivered
        test_vehicle = None
        for v in vehicles:
            if v.get("estimated_test_km") and v["status"] not in ["delivered", "pending_approval"]:
                test_vehicle = v
                break
        
        if test_vehicle:
            # Try to deliver without completing estimated KM and without reason
            km_end = test_vehicle["km_start"] + 10  # Much less than estimated
            response = requests.put(
                f"{BASE_URL}/api/vehicles/{test_vehicle['id']}/deliver",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={
                    "km_end": km_end,
                    "deliver_location": "Ana Giriş",
                    "notes": "Test delivery"
                }
            )
            # Should fail because early_delivery_reason is required
            if test_vehicle.get("estimated_test_km", 0) > 10:
                assert response.status_code == 400
                print("✓ Early delivery correctly requires explanation")
            else:
                print("✓ Vehicle doesn't have enough estimated KM to test early delivery")
        else:
            print("✓ No suitable vehicle found for early delivery test (skipped)")


class TestRegistration:
    """Registration endpoint tests"""
    
    def test_register_new_user(self):
        """Test registering a new user"""
        import uuid
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User",
            "role": "company_staff"
        })
        
        # Company staff registration returns 201 with pending approval message
        assert response.status_code in [200, 201]
        print(f"✓ User registration works (status: {response.status_code})")
    
    def test_register_duplicate_email(self):
        """Test registering with existing email"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "testpass123",
            "name": "Test User",
            "role": "company_staff"
        })
        assert response.status_code == 400
        print("✓ Duplicate email correctly rejected")


class TestFinalReport:
    """Final report endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_final_report(self, admin_token):
        """Test getting final report for a vehicle"""
        # Get vehicles
        vehicles_response = requests.get(
            f"{BASE_URL}/api/vehicles",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        vehicles = vehicles_response.json()
        
        if len(vehicles) > 0:
            vehicle_id = vehicles[0]["id"]
            response = requests.get(
                f"{BASE_URL}/api/vehicles/{vehicle_id}/final-report",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "vehicle" in data
            assert "summary" in data
            print(f"✓ Final report retrieved for vehicle")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
