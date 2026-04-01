#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Urban Logistics Platform
Tests all authentication, truck tracking, slot booking, reporting endpoints, and WebSocket functionality
"""

import requests
import sys
import json
import socketio
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class UrbanLogisticsAPITester:
    def __init__(self, base_url: str = "https://urban-logistics.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.admin_token = None
        self.driver_token = None
        self.org_token = None
        self.regular_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append(f"{name}: {details}")
        print()

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    expected_status: int = 200, use_cookies: bool = True) -> tuple[bool, Dict]:
        """Make API request and validate response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
                
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login functionality"""
        success, data = self.make_request(
            'POST', 'auth/login',
            {"email": "admin@example.com", "password": "admin123"},
            200
        )
        
        if success and 'role' in data and data['role'] == 'admin':
            self.log_test("Admin Login", True, f"Logged in as {data.get('name', 'Admin')}")
            return True
        else:
            self.log_test("Admin Login", False, f"Response: {data}")
            return False

    def test_user_registration(self):
        """Test user registration for different roles"""
        timestamp = int(time.time())
        test_users = [
            {"name": "Test Driver", "email": f"testdriver_{timestamp}@test.com", "password": "test123", "role": "driver"},
            {"name": "Test Org", "email": f"testorg_{timestamp}@test.com", "password": "test123", "role": "organization", "organization_name": "Test Logistics"},
            {"name": "Test User", "email": f"testuser_{timestamp}@test.com", "password": "test123", "role": "regular"}
        ]
        
        for user_data in test_users:
            success, data = self.make_request(
                'POST', 'auth/register', user_data, 200
            )
            
            if success and 'role' in data and data['role'] == user_data['role']:
                self.log_test(f"Register {user_data['role'].title()}", True, 
                            f"Created user: {data.get('name')}")
            else:
                self.log_test(f"Register {user_data['role'].title()}", False, 
                            f"Response: {data}")

    def test_auth_me(self):
        """Test current user endpoint"""
        success, data = self.make_request('GET', 'auth/me', expected_status=200)
        
        if success and 'role' in data:
            self.log_test("Auth Me", True, f"Current user: {data.get('name')} ({data.get('role')})")
        else:
            self.log_test("Auth Me", False, f"Response: {data}")

    def test_live_positions(self):
        """Test truck live positions endpoint"""
        success, data = self.make_request('GET', 'trucks/live-positions', expected_status=200)
        
        if success and isinstance(data, list):
            truck_count = len(data)
            mock_count = len([t for t in data if t.get('is_mock', False)])
            live_count = truck_count - mock_count
            
            self.log_test("Live Positions", True, 
                        f"Found {truck_count} trucks ({mock_count} mock, {live_count} live)")
            
            # Validate truck data structure
            if truck_count > 0:
                sample_truck = data[0]
                required_fields = ['truck_id', 'driver_name', 'lat', 'lng', 'speed', 'route_name']
                missing_fields = [f for f in required_fields if f not in sample_truck]
                
                if not missing_fields:
                    self.log_test("Truck Data Structure", True, "All required fields present")
                else:
                    self.log_test("Truck Data Structure", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test("Live Positions", False, f"Expected list, got: {type(data)}")

    def test_delivery_slots(self):
        """Test delivery slots functionality"""
        # Get slots
        success, data = self.make_request('GET', 'slots', expected_status=200)
        
        if success and isinstance(data, list):
            slot_count = len(data)
            self.log_test("Get Delivery Slots", True, f"Found {slot_count} slots")
            
            # Test slot booking (requires admin/org role) - login as admin first
            admin_success, admin_data = self.make_request(
                'POST', 'auth/login',
                {"email": "admin@example.com", "password": "admin123"},
                200
            )
            
            if admin_success and slot_count > 0:
                test_slot = data[0]
                if test_slot.get('booked_count', 0) < test_slot.get('max_capacity', 15):
                    book_success, book_data = self.make_request(
                        'POST', 'slots/book',
                        {"slot_id": test_slot['slot_id']},
                        200
                    )
                    
                    if book_success and 'booking_id' in book_data:
                        self.log_test("Slot Booking", True, f"Booked slot: {book_data['booking_id']}")
                    else:
                        self.log_test("Slot Booking", False, f"Response: {book_data}")
                else:
                    self.log_test("Slot Booking", True, "Slot full - booking test skipped")
            else:
                self.log_test("Slot Booking", False, "Could not login as admin for booking test")
        else:
            self.log_test("Get Delivery Slots", False, f"Expected list, got: {type(data)}")

    def test_ground_reports(self):
        """Test ground reports functionality"""
        # Get reports
        success, data = self.make_request('GET', 'reports', expected_status=200)
        
        if success and isinstance(data, list):
            report_count = len(data)
            active_reports = len([r for r in data if r.get('status') == 'active'])
            self.log_test("Get Ground Reports", True, 
                        f"Found {report_count} reports ({active_reports} active)")
            
            # Test report creation
            new_report = {
                "lat": 19.076,
                "lng": 72.878,
                "category": "traffic_incident",
                "report_type": "Test Report",
                "severity": "moderate",
                "description": "API test report - please ignore",
                "time_advisory": "Test advisory"
            }
            
            create_success, create_data = self.make_request(
                'POST', 'reports', new_report, 200
            )
            
            if create_success and 'report_id' in create_data:
                report_id = create_data['report_id']
                self.log_test("Create Report", True, f"Created report: {report_id}")
                
                # Test voting
                vote_success, vote_data = self.make_request(
                    'POST', f'reports/{report_id}/vote',
                    {"vote_type": "upvote"},
                    200
                )
                
                if vote_success and 'upvotes' in vote_data:
                    self.log_test("Report Voting", True, f"Upvotes: {vote_data['upvotes']}")
                else:
                    self.log_test("Report Voting", False, f"Response: {vote_data}")
            else:
                self.log_test("Create Report", False, f"Response: {create_data}")
        else:
            self.log_test("Get Ground Reports", False, f"Expected list, got: {type(data)}")

    def test_admin_endpoints(self):
        """Test admin-specific endpoints"""
        # Re-login as admin for admin tests
        admin_success, admin_data = self.make_request(
            'POST', 'auth/login',
            {"email": "admin@example.com", "password": "admin123"},
            200
        )
        
        if not admin_success:
            self.log_test("Admin Re-login", False, "Could not re-login as admin")
            return
        
        # Admin stats
        success, data = self.make_request('GET', 'admin/stats', expected_status=200)
        
        if success and 'total_users' in data:
            stats = data
            self.log_test("Admin Stats", True, 
                        f"Users: {stats['total_users']}, Trucks: {stats['active_trucks']}, Reports: {stats['total_reports']}")
        else:
            self.log_test("Admin Stats", False, f"Response: {data}")

        # Admin users
        success, data = self.make_request('GET', 'admin/users', expected_status=200)
        
        if success and isinstance(data, list):
            user_count = len(data)
            roles = {}
            for user in data:
                role = user.get('role', 'unknown')
                roles[role] = roles.get(role, 0) + 1
            
            role_summary = ", ".join([f"{role}: {count}" for role, count in roles.items()])
            self.log_test("Admin Users", True, f"Found {user_count} users ({role_summary})")
        else:
            self.log_test("Admin Users", False, f"Expected list, got: {type(data)}")

    def test_logout(self):
        """Test logout functionality"""
        success, data = self.make_request('POST', 'auth/logout', expected_status=200)
        
        if success:
            self.log_test("Logout", True, "Successfully logged out")
        else:
            self.log_test("Logout", False, f"Response: {data}")

    def test_socket_io_endpoint(self):
        """Test Socket.IO endpoint accessibility"""
        try:
            # Test Socket.IO endpoint accessibility - should return 200 for GET request
            socket_url = f"{self.base_url}/api/socket.io/"
            response = requests.get(socket_url, params={'transport': 'polling'})
            
            # Socket.IO endpoint should return 200 for polling transport
            if response.status_code == 200:
                self.log_test("Socket.IO Endpoint", True, f"Socket.IO accessible at {socket_url}")
            else:
                # Try without params
                response2 = requests.get(f"{self.base_url}/api/socket.io/")
                if response2.status_code == 200:
                    self.log_test("Socket.IO Endpoint", True, f"Socket.IO accessible at {socket_url}")
                else:
                    self.log_test("Socket.IO Endpoint", False, f"Status: {response.status_code}, Response: {response.text[:200]}")
                
        except Exception as e:
            self.log_test("Socket.IO Endpoint", False, f"Error: {str(e)}")

    def test_websocket_connection(self):
        """Test WebSocket connection and real-time functionality"""
        try:
            # Create Socket.IO client
            sio = socketio.SimpleClient()
            
            # Track connection events
            connected = False
            position_updates = []
            
            # Connect to Socket.IO
            try:
                sio.connect(self.base_url, socketio_path='/api/socket.io')
                connected = True
                print("    Socket.IO connected successfully")
                
                self.log_test("WebSocket Connection", True, "Successfully connected to Socket.IO")
                
                # Wait for position updates (mock truck simulator should be running)
                print("    Waiting for truck position updates...")
                
                # Listen for events manually since we can't use decorators with SimpleClient
                start_time = time.time()
                while time.time() - start_time < 8:  # Wait up to 8 seconds
                    try:
                        # Check for incoming events
                        events = sio.receive(timeout=1)
                        if events:
                            for event in events:
                                if event[0] == 'truck-position-update':
                                    position_updates.append(event[1])
                                    print(f"    Received position update: {event[1].get('driver_name', 'Unknown')} at {event[1].get('lat')}, {event[1].get('lng')}")
                    except socketio.exceptions.TimeoutError:
                        continue
                    except Exception as e:
                        print(f"    Event receive error: {e}")
                        break
                
                if position_updates:
                    self.log_test("Real-time Position Updates", True, 
                                f"Received {len(position_updates)} position updates")
                else:
                    self.log_test("Real-time Position Updates", False, 
                                "No position updates received from mock simulator")
                
                # Test location update emission
                test_location = {
                    "driver_id": "test_driver_123",
                    "driver_name": "Test Driver",
                    "org_name": "Test Org",
                    "lat": 19.076,
                    "lng": 72.878,
                    "speed": 45.5,
                    "heading": 180,
                    "accuracy": 10
                }
                
                sio.emit('location-update', test_location)
                time.sleep(2)  # Wait for broadcast
                
                self.log_test("Location Update Emission", True, "Successfully sent test location update")
                
            except Exception as e:
                self.log_test("WebSocket Connection", False, f"Connection error: {str(e)}")
                return
            
            sio.disconnect()
            
        except Exception as e:
            self.log_test("WebSocket Connection", False, f"Error: {str(e)}")

    def test_driver_endpoints(self):
        """Test driver-specific endpoints"""
        # First register a driver for testing
        driver_data = {
            "name": "Test Driver API", 
            "email": f"testdriver_api_{int(time.time())}@test.com", 
            "password": "test123", 
            "role": "driver"
        }
        
        reg_success, reg_data = self.make_request('POST', 'auth/register', driver_data, 200)
        
        if not reg_success:
            self.log_test("Driver Registration", False, f"Could not register driver: {reg_data}")
            return
        
        self.log_test("Driver Registration", True, f"Registered driver: {reg_data.get('name')}")
        
        # Test start trip
        start_success, start_data = self.make_request('POST', 'driver/start-trip', {}, 200)
        
        if start_success and start_data.get('status') == 'trip_started':
            self.log_test("Start Trip", True, "Trip started successfully")
            
            # Test get trip
            trip_success, trip_data = self.make_request('GET', 'driver/trip', expected_status=200)
            
            if trip_success and trip_data.get('status') == 'active':
                self.log_test("Get Active Trip", True, "Active trip retrieved")
            else:
                self.log_test("Get Active Trip", False, f"Response: {trip_data}")
            
            # Test location update via REST
            location_data = {
                "lat": 19.076,
                "lng": 72.878,
                "speed": 45.5,
                "heading": 180,
                "accuracy": 10
            }
            
            loc_success, loc_data = self.make_request('POST', 'location/update', location_data, 200)
            
            if loc_success and loc_data.get('status') == 'ok':
                self.log_test("Location Update (REST)", True, "Location updated via REST API")
            else:
                self.log_test("Location Update (REST)", False, f"Response: {loc_data}")
            
            # Test stop trip
            stop_success, stop_data = self.make_request('POST', 'driver/stop-trip', {}, 200)
            
            if stop_success and stop_data.get('status') == 'trip_stopped':
                self.log_test("Stop Trip", True, "Trip stopped successfully")
            else:
                self.log_test("Stop Trip", False, f"Response: {stop_data}")
        else:
            self.log_test("Start Trip", False, f"Response: {start_data}")

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚛 Urban Logistics Platform - Backend API Testing (WebSocket Upgrade)")
        print("=" * 70)
        print(f"Testing against: {self.base_url}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        # WebSocket Tests First
        print("🔌 WEBSOCKET TESTS")
        print("-" * 30)
        self.test_socket_io_endpoint()
        self.test_websocket_connection()
        print()

        # Authentication Tests
        print("🔐 AUTHENTICATION TESTS")
        print("-" * 30)
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
        
        self.test_user_registration()
        self.test_auth_me()
        print()

        # Core API Tests
        print("🚚 CORE API TESTS")
        print("-" * 30)
        self.test_live_positions()
        self.test_delivery_slots()
        self.test_ground_reports()
        print()

        # Driver Tests
        print("🚗 DRIVER TESTS")
        print("-" * 30)
        self.test_driver_endpoints()
        print()

        # Admin Tests
        print("👑 ADMIN TESTS")
        print("-" * 30)
        self.test_admin_endpoints()
        print()

        # Cleanup
        print("🧹 CLEANUP")
        print("-" * 30)
        self.test_logout()
        
        # Summary
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = UrbanLogisticsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())