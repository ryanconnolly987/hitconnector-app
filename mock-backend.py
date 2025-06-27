#!/usr/bin/env python3
import json
import socketserver
from http.server import BaseHTTPRequestHandler
import urllib.parse
import uuid
from datetime import datetime

# Mock data
users_db = {}
studios_db = {
    "1": {
        "id": "1",
        "name": "SoundWave Studios",
        "location": "Los Angeles, CA",
        "hourlyRate": 85,
        "specialties": ["Hip Hop", "R&B", "Pop"],
        "rating": 4.8,
        "reviewCount": 127,
        "description": "Professional recording studio with state-of-the-art equipment and experienced engineers.",
        "amenities": ["SSL Console", "Pro Tools", "Vocal Booth", "Lounge Area"],
        "owner": "studio_user_1",
        "images": ["/placeholder.svg?height=300&width=400"],
        "availability": {
            "monday": {"start": "09:00", "end": "22:00"},
            "tuesday": {"start": "09:00", "end": "22:00"},
            "wednesday": {"start": "09:00", "end": "22:00"},
            "thursday": {"start": "09:00", "end": "22:00"},
            "friday": {"start": "09:00", "end": "22:00"},
            "saturday": {"start": "10:00", "end": "20:00"},
            "sunday": {"start": "12:00", "end": "18:00"}
        },
        "equipment": ["SSL Console", "Pro Tools HDX", "Neumann U87", "API Preamps"],
        "rooms": [
            {
                "id": "room-1-1",
                "name": "Studio A",
                "description": "Large recording space with isolation booth, perfect for full bands",
                "hourlyRate": 125,
                "capacity": 8,
                "equipment": ["SSL Console", "Pro Tools HDX", "Neumann U87", "Vintage Neve 1073"],
                "images": ["/placeholder.svg?height=300&width=400"]
            },
            {
                "id": "room-1-2", 
                "name": "Studio B",
                "description": "Mid-sized studio ideal for vocals and small ensembles",
                "hourlyRate": 95,
                "capacity": 4,
                "equipment": ["Pro Tools", "API Preamps", "Shure SM7B", "Universal Audio Apollo"],
                "images": ["/placeholder.svg?height=300&width=400"]
            },
            {
                "id": "room-1-3",
                "name": "Studio C", 
                "description": "Compact studio perfect for vocal recording and production",
                "hourlyRate": 75,
                "capacity": 2,
                "equipment": ["Pro Tools", "Focusrite Interface", "Audio-Technica AT2020", "KRK Monitors"],
                "images": ["/placeholder.svg?height=300&width=400"]
            }
        ],
        "createdAt": "2024-01-15T10:30:00Z"
    },
    "30fc37ba-9d45-4963-b005-61a1679ec441": {
        "id": "30fc37ba-9d45-4963-b005-61a1679ec441",
        "name": "The fart room",
        "location": "Nashville, TN",
        "hourlyRate": 90,
        "specialties": ["Country", "Rock", "Blues"],
        "rating": 4.6,
        "reviewCount": 89,
        "description": "Country music's premier recording destination with vintage analog gear.",
        "amenities": ["Vintage Neve Console", "Analog Tape", "Live Room", "Control Room"],
        "owner": "sophiemalone@gmail.com",
        "images": ["/placeholder.svg?height=300&width=400"],
        "availability": {
            "monday": {"start": "10:00", "end": "21:00"},
            "tuesday": {"start": "10:00", "end": "21:00"},
            "wednesday": {"start": "10:00", "end": "21:00"},
            "thursday": {"start": "10:00", "end": "21:00"},
            "friday": {"start": "10:00", "end": "23:00"},
            "saturday": {"start": "10:00", "end": "23:00"},
            "sunday": {"start": "12:00", "end": "18:00"}
        },
        "equipment": ["Vintage Neve Console", "Studer A827 Tape Machine", "Coles 4038", "Fairchild 670"],
        "rooms": [
            {
                "id": "room-fart-1",
                "name": "Main Live Room",
                "description": "Large live room with natural acoustics, perfect for tracking bands",
                "hourlyRate": 120,
                "capacity": 12,
                "equipment": ["Vintage Neve Console", "Studer A827", "Coles 4038", "Hammond B3"],
                "images": ["/placeholder.svg?height=300&width=400"]
            },
            {
                "id": "room-fart-2",
                "name": "Vocal Booth",
                "description": "Intimate vocal recording space with pristine acoustics",
                "hourlyRate": 80,
                "capacity": 2,
                "equipment": ["Neumann U47", "Avalon VT-737sp", "Manley Voxbox"],
                "images": ["/placeholder.svg?height=300&width=400"]
            }
        ],
        "createdAt": "2024-01-20T14:15:00Z"
    },
    "fd1a479b-684a-4155-9d26-165fe8592afb": {
        "id": "fd1a479b-684a-4155-9d26-165fe8592afb",
        "name": "The fart room pt 2",
        "location": "Atlanta, GA",
        "hourlyRate": 110,
        "specialties": ["Hip Hop", "Trap", "R&B"],
        "rating": 4.9,
        "reviewCount": 203,
        "description": "Atlanta's hottest hip-hop studio where the biggest hits are made.",
        "amenities": ["SSL Console", "Pro Tools", "MPC Studio", "Vocal Booth"],
        "owner": "sophiemalone@gmail.com",
        "images": ["/placeholder.svg?height=300&width=400"],
        "availability": {
            "monday": {"start": "12:00", "end": "24:00"},
            "tuesday": {"start": "12:00", "end": "24:00"},
            "wednesday": {"start": "12:00", "end": "24:00"},
            "thursday": {"start": "12:00", "end": "24:00"},
            "friday": {"start": "12:00", "end": "02:00"},
            "saturday": {"start": "12:00", "end": "02:00"},
            "sunday": {"start": "14:00", "end": "22:00"}
        },
        "equipment": ["SSL G Series Console", "Pro Tools HDX", "MPC X", "Roland TR-808"],
        "rooms": [
            {
                "id": "room-pt2-1",
                "name": "Studio A",
                "description": "Main recording room with SSL console and premium outboard gear",
                "hourlyRate": 150,
                "capacity": 6,
                "equipment": ["SSL G Series", "Pro Tools HDX", "Avalon 737", "Distressor"],
                "images": ["/placeholder.svg?height=300&width=400"]
            },
            {
                "id": "room-pt2-2",
                "name": "Trap Room",
                "description": "Specialized room for trap and hip-hop production",
                "hourlyRate": 100,
                "capacity": 4,
                "equipment": ["MPC X", "Roland TR-808", "Moog Sub 37", "KRK Rokit"],
                "images": ["/placeholder.svg?height=300&width=400"]
            },
            {
                "id": "room-pt2-3",
                "name": "Vocal Suite",
                "description": "Premium vocal recording suite with vintage microphones",
                "hourlyRate": 85,
                "capacity": 3,
                "equipment": ["Neumann U67", "Telefunken ELA M 251", "Universal Audio 610"],
                "images": ["/placeholder.svg?height=300&width=400"]
            }
        ],
        "createdAt": "2024-01-25T16:45:00Z"
    }
}

# Bookings database - cleared of fake data
bookings_db = {}

# Booking requests database - for pending requests - starting clean
booking_requests_db = {}

# Sample booking data for testing
sample_booking_id = "111f50f5-5cb7-4db6-bd9c-439690373a27"
bookings_db[sample_booking_id] = {
    "id": sample_booking_id,
    "studioId": "1",
    "studioName": "Downtown Studios",
    "roomId": "room-1-1",
    "roomName": "Studio A",
    "userId": "rapper1",
    "userName": "Jay Williams",
    "userEmail": "jay@example.com",
    "date": "2024-06-15",
    "startTime": "14:00",
    "endTime": "18:00",
    "duration": 4,
    "hourlyRate": 125,
    "totalCost": 500,
    "message": "Looking to record my new album. Need a professional setup with good acoustics.",
    "status": "confirmed",
    "createdAt": "2024-06-10T10:30:00Z",
    "approvedAt": "2024-06-10T12:15:00Z"
}

# Add another confirmed booking
sample_booking_id_2 = "booking-abc-123"
bookings_db[sample_booking_id_2] = {
    "id": sample_booking_id_2,
    "studioId": "1",
    "studioName": "Downtown Studios",
    "roomId": "room-1-2",
    "roomName": "Studio B",
    "userId": "rapper3",
    "userName": "Alex Rodriguez",
    "userEmail": "alex@example.com",
    "date": "2024-06-25",
    "startTime": "10:00",
    "endTime": "14:00",
    "duration": 4,
    "hourlyRate": 95,
    "totalCost": 380,
    "message": "Recording session for my mixtape. Need clean vocals.",
    "status": "confirmed",
    "createdAt": "2024-06-20T09:15:00Z",
    "approvedAt": "2024-06-20T11:30:00Z"
}

# Sample booking request for testing
sample_request_id = "req-456-789"
booking_requests_db[sample_request_id] = {
    "id": sample_request_id,
    "studioId": "1",
    "studioName": "Downtown Studios",
    "roomId": "room-1-2",
    "roomName": "Studio B",
    "userId": "rapper2",
    "userName": "Maya Johnson",
    "userEmail": "maya@example.com",
    "date": "2024-06-20",
    "startTime": "16:00",
    "endTime": "20:00",
    "duration": 4,
    "hourlyRate": 95,
    "totalCost": 380,
    "message": "Need to record vocals for my EP. Looking for a clean, professional sound.",
    "status": "pending",
    "createdAt": "2024-06-12T14:20:00Z"
}

# Add another pending request
sample_request_id_2 = "req-789-456"
booking_requests_db[sample_request_id_2] = {
    "id": sample_request_id_2,
    "studioId": "1",
    "studioName": "Downtown Studios",
    "roomId": "room-1-3",
    "roomName": "Studio C",
    "userId": "rapper4",
    "userName": "Sam Turner",
    "userEmail": "sam@example.com",
    "date": "2024-07-05",
    "startTime": "18:00",
    "endTime": "22:00",
    "duration": 4,
    "hourlyRate": 75,
    "totalCost": 300,
    "message": "First time recording, looking for a professional experience.",
    "status": "pending",
    "createdAt": "2024-06-25T16:45:00Z"
}

PORT = 3002

def check_booking_conflict(room_id, date, start_time, end_time, exclude_booking_id=None):
    """Check if there's a booking conflict for the given room, date, and time."""
    # Check confirmed bookings
    for booking_id, booking in bookings_db.items():
        if exclude_booking_id and booking_id == exclude_booking_id:
            continue
            
        if (booking.get('roomId') == room_id and 
            booking.get('date') == date and
            booking.get('status') in ['confirmed', 'pending']):
            
            # Check time overlap
            booking_start = booking.get('startTime')
            booking_end = booking.get('endTime')
            
            # Convert times to minutes for easier comparison
            def time_to_minutes(time_str):
                hours, minutes = map(int, time_str.split(':'))
                return hours * 60 + minutes
            
            new_start = time_to_minutes(start_time)
            new_end = time_to_minutes(end_time)
            existing_start = time_to_minutes(booking_start)
            existing_end = time_to_minutes(booking_end)
            
            # Check for overlap
            if not (new_end <= existing_start or new_start >= existing_end):
                return True
                
    # Also check booking requests (but exclude the one being processed)
    for request_id, request in booking_requests_db.items():
        if exclude_booking_id and request_id == exclude_booking_id:
            continue
            
        if (request.get('roomId') == room_id and 
            request.get('date') == date and
            request.get('status') == 'pending'):
            
            request_start = request.get('startTime')
            request_end = request.get('endTime')
            
            def time_to_minutes(time_str):
                hours, minutes = map(int, time_str.split(':'))
                return hours * 60 + minutes
            
            new_start = time_to_minutes(start_time)
            new_end = time_to_minutes(end_time)
            existing_start = time_to_minutes(request_start)
            existing_end = time_to_minutes(request_end)
            
            # Check for overlap
            if not (new_end <= existing_start or new_start >= existing_end):
                return True
    
    return False

class CORSHTTPRequestHandler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query_params = urllib.parse.parse_qs(parsed_path.query)

        response_data = None
        status_code = 200

        if path == '/health':
            response_data = {"status": "healthy", "timestamp": datetime.now().isoformat()}
        elif path == '/api/auth/me':
            # Mock user data for auth check
            response_data = {
                "id": "1",
                "email": "test@example.com",
                "name": "Test User",
                "role": "rapper",
                "avatar": "/placeholder.svg?height=40&width=40"
            }
        elif path == '/api/studios':
            # Return all studios or filter by query params
            location = query_params.get('location', [None])[0]
            studios_list = list(studios_db.values())
            
            if location and location.lower() != 'all':
                studios_list = [s for s in studios_list if location.lower() in s['location'].lower()]
            
            response_data = {"studios": studios_list}
        elif path.startswith('/api/studios/'):
            studio_id = path.split('/')[-1]
            if studio_id in studios_db:
                response_data = studios_db[studio_id]
            else:
                status_code = 404
                response_data = {"error": "Studio not found"}
        elif path == '/api/bookings':
            # Get bookings for user or studio
            user_id = query_params.get('userId', [None])[0]
            studio_id = query_params.get('studioId', [None])[0]
            
            bookings_list = list(bookings_db.values())
            
            if user_id:
                bookings_list = [b for b in bookings_list if b.get('userId') == user_id]
            elif studio_id:
                bookings_list = [b for b in bookings_list if b.get('studioId') == studio_id]
            
            response_data = {"bookings": bookings_list}
        elif path == '/api/booking-requests':
            # Get booking requests for studio
            studio_id = query_params.get('studioId', [None])[0]
            
            requests_list = list(booking_requests_db.values())
            
            if studio_id:
                requests_list = [r for r in requests_list if r.get('studioId') == studio_id]
            
            response_data = {"bookingRequests": requests_list}
        elif path.startswith('/api/bookings/'):
            booking_id = path.split('/')[-1]
            if booking_id in bookings_db:
                response_data = bookings_db[booking_id]
            else:
                # If not found in confirmed bookings, check booking requests
                if booking_id in booking_requests_db:
                    response_data = booking_requests_db[booking_id]
                else:
                    status_code = 404
                    response_data = {"error": "Booking not found"}
        else:
            status_code = 404
            response_data = {"error": "Not found"}

        # Prepare response
        response_json = json.dumps(response_data)
        response_bytes = response_json.encode('utf-8')

        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.send_header('Connection', 'close')
        self._set_cors_headers()
        self.end_headers()

        self.wfile.write(response_bytes)

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode()) if post_data else {}
        except:
            data = {}

        path = urllib.parse.urlparse(self.path).path

        if path == '/api/auth/signup':
            email = data.get('email')
            
            # Check if email already exists
            for user in users_db.values():
                if user.get('email') == email:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self._set_cors_headers()
                    self.end_headers()
                    response = {"error": "Email already exists. Please login instead."}
                    self.wfile.write(json.dumps(response).encode())
                    return
            
            user_id = str(uuid.uuid4())
            users_db[user_id] = {
                "id": user_id,
                "email": email,
                "name": data.get('name'),
                "role": data.get('role'),
                "created_at": datetime.now().isoformat()
            }
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            response = {
                "user": users_db[user_id],
                "token": f"mock_token_{user_id}"
            }
            self.wfile.write(json.dumps(response).encode())

        elif path == '/api/auth/login':
            email = data.get('email')
            
            # Check if user exists
            user_found = None
            for user in users_db.values():
                if user.get('email') == email:
                    user_found = user
                    break
            
            if not user_found:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                response = {"error": "Invalid credentials. Please check your email and password."}
                self.wfile.write(json.dumps(response).encode())
                return
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            response = {
                "user": user_found,
                "token": f"mock_token_{user_found['id']}"
            }
            self.wfile.write(json.dumps(response).encode())

        elif path == '/api/studios':
            # Check if a studio already exists for this owner
            owner_email = data.get('owner', 'unknown')
            existing_studio = None
            existing_studio_id = None
            
            for studio_id, studio in studios_db.items():
                if studio.get('owner') == owner_email:
                    existing_studio = studio
                    existing_studio_id = studio_id
                    break
            
            if existing_studio:
                # Update existing studio
                studio_data = {
                    "id": existing_studio_id,
                    "name": data.get('name', existing_studio.get('name', 'New Studio')),
                    "location": data.get('location', existing_studio.get('location', '')),
                    "address": data.get('address', existing_studio.get('address', '')),  # Add address field
                    "phone": data.get('phone', existing_studio.get('phone', '')),  # Add phone field
                    "email": data.get('email', existing_studio.get('email', '')),  # Add email field
                    "website": data.get('website', existing_studio.get('website', '')),  # Add website field
                    "profileImage": data.get('profileImage', existing_studio.get('profileImage', '')),  # Add profile image
                    "coverImage": data.get('coverImage', existing_studio.get('coverImage', '')),  # Add cover image
                    "hourlyRate": data.get('hourlyRate', existing_studio.get('hourlyRate', 100)),
                    "specialties": data.get('specialties', existing_studio.get('specialties', [])),
                    "rating": existing_studio.get('rating', 0),  # Keep existing rating
                    "reviewCount": existing_studio.get('reviewCount', 0),  # Keep existing review count
                    "description": data.get('description', existing_studio.get('description', '')),
                    "amenities": data.get('amenities', existing_studio.get('amenities', [])),
                    "owner": owner_email,
                    "images": data.get('images', existing_studio.get('images', [])),
                    "gallery": data.get('gallery', existing_studio.get('gallery', [])),  # Add gallery field
                    "availability": data.get('availability', existing_studio.get('availability', {})),
                    "equipment": data.get('equipment', existing_studio.get('equipment', [])),
                    "rooms": data.get('rooms', existing_studio.get('rooms', [])),
                    "operatingHours": data.get('operatingHours', existing_studio.get('operatingHours', {})),  # Add operating hours
                    "staff": data.get('staff', existing_studio.get('staff', [])),  # Add staff field
                    "createdAt": existing_studio.get('createdAt', datetime.now().isoformat()),
                    "updatedAt": datetime.now().isoformat()
                }
                
                studios_db[existing_studio_id] = studio_data
                
                self.send_response(200)  # 200 for update
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                self.wfile.write(json.dumps(studio_data).encode())
            else:
                # Create new studio
                studio_id = str(uuid.uuid4())
                studio_data = {
                    "id": studio_id,
                    "name": data.get('name', 'New Studio'),
                    "location": data.get('location', ''),
                    "address": data.get('address', ''),  # Add address field
                    "phone": data.get('phone', ''),  # Add phone field
                    "email": data.get('email', ''),  # Add email field
                    "website": data.get('website', ''),  # Add website field
                    "profileImage": data.get('profileImage', ''),  # Add profile image
                    "coverImage": data.get('coverImage', ''),  # Add cover image
                    "hourlyRate": data.get('hourlyRate', 100),
                    "specialties": data.get('specialties', []),
                    "rating": 0,
                    "reviewCount": 0,
                    "description": data.get('description', ''),
                    "amenities": data.get('amenities', []),
                    "owner": owner_email,
                    "images": data.get('images', []),
                    "gallery": data.get('gallery', []),  # Add gallery field
                    "availability": data.get('availability', {}),
                    "equipment": data.get('equipment', []),
                    "rooms": data.get('rooms', []),
                    "operatingHours": data.get('operatingHours', {}),  # Add operating hours
                    "staff": data.get('staff', []),  # Add staff field
                    "createdAt": datetime.now().isoformat(),
                    "updatedAt": datetime.now().isoformat()
                }
                
                studios_db[studio_id] = studio_data
                
                self.send_response(201)  # 201 for create
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                self.wfile.write(json.dumps(studio_data).encode())

        elif path == '/api/bookings':
            # Create new booking request (not confirmed booking)
            studio_id = data.get('studioId')
            room_id = data.get('roomId')
            date = data.get('date')
            start_time = data.get('startTime')
            end_time = data.get('endTime')
            
            # Validate required fields
            if not all([studio_id, room_id, date, start_time, end_time]):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                response = {"error": "Missing required fields: studioId, roomId, date, startTime, endTime"}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Check for booking conflicts
            if check_booking_conflict(room_id, date, start_time, end_time):
                self.send_response(409)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                response = {"error": "This time slot is already booked for the selected room"}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Find room details for pricing
            studio = studios_db.get(studio_id)
            if not studio:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                response = {"error": "Studio not found"}
                self.wfile.write(json.dumps(response).encode())
                return
                
            room = None
            for r in studio.get('rooms', []):
                if r['id'] == room_id:
                    room = r
                    break
                    
            if not room:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                response = {"error": "Room not found"}
                self.wfile.write(json.dumps(response).encode())
                return
            
            request_id = str(uuid.uuid4())
            booking_request_data = {
                "id": request_id,
                "studioId": studio_id,
                "studioName": studio['name'],
                "roomId": room_id,
                "roomName": room['name'],
                "userId": data.get('userId'),
                "userName": data.get('userName'),
                "userEmail": data.get('userEmail'),
                "date": date,
                "startTime": start_time,
                "endTime": end_time,
                "duration": data.get('duration', 1),
                "hourlyRate": room['hourlyRate'],
                "totalCost": data.get('totalCost', 0),
                "message": data.get('message', ''),
                "status": "pending",
                "createdAt": datetime.now().isoformat()
            }
            
            booking_requests_db[request_id] = booking_request_data
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            self.wfile.write(json.dumps(booking_request_data).encode())

        elif path == '/api/booking-requests':
            # Create new booking request (same as above but clearer endpoint)
            studio_id = data.get('studioId')
            room_id = data.get('roomId')
            date = data.get('date')
            start_time = data.get('startTime')
            end_time = data.get('endTime')
            
            # Validate required fields
            if not all([studio_id, room_id, date, start_time, end_time]):
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                response = {"error": "Missing required fields: studioId, roomId, date, startTime, endTime"}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Check for booking conflicts
            if check_booking_conflict(room_id, date, start_time, end_time):
                self.send_response(409)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                response = {"error": "This time slot is already booked for the selected room"}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Find room details for pricing
            studio = studios_db.get(studio_id)
            if not studio:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                response = {"error": "Studio not found"}
                self.wfile.write(json.dumps(response).encode())
                return
                
            room = None
            for r in studio.get('rooms', []):
                if r['id'] == room_id:
                    room = r
                    break
                    
            if not room:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                response = {"error": "Room not found"}
                self.wfile.write(json.dumps(response).encode())
                return
            
            request_id = str(uuid.uuid4())
            booking_request_data = {
                "id": request_id,
                "studioId": studio_id,
                "studioName": studio['name'],
                "roomId": room_id,
                "roomName": room['name'],
                "userId": data.get('userId'),
                "userName": data.get('userName'),
                "userEmail": data.get('userEmail'),
                "date": date,
                "startTime": start_time,
                "endTime": end_time,
                "duration": data.get('duration', 1),
                "hourlyRate": room['hourlyRate'],
                "totalCost": data.get('totalCost', 0),
                "message": data.get('message', ''),
                "status": "pending",
                "createdAt": datetime.now().isoformat()
            }
            
            booking_requests_db[request_id] = booking_request_data
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            self.wfile.write(json.dumps(booking_request_data).encode())

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_PUT(self):
        self._set_cors_headers()
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            path = self.path
            
            # Handle booking approval/rejection
            if path.startswith('/api/booking-requests/'):
                request_id = path.split('/')[-1]
                action = data.get('action')  # 'approve' or 'reject'
                
                if request_id not in booking_requests_db:
                    response_data = {"error": "Booking request not found"}
                    response_json = json.dumps(response_data)
                    response_bytes = response_json.encode('utf-8')
                    
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Content-Length', str(len(response_bytes)))
                    self.send_header('Connection', 'close')
                    self.end_headers()
                    self.wfile.write(response_bytes)
                    return
                
                booking_request = booking_requests_db[request_id]
                
                if action == 'approve':
                    # Check for conflicts again before approving
                    room_id = booking_request.get('roomId')
                    date = booking_request.get('date')
                    start_time = booking_request.get('startTime')
                    end_time = booking_request.get('endTime')
                    
                    if check_booking_conflict(room_id, date, start_time, end_time, exclude_booking_id=request_id):
                        self.send_response(409)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        response = {"error": "This time slot is no longer available"}
                        self.wfile.write(json.dumps(response).encode())
                        return
                    
                    # Create confirmed booking
                    booking_id = str(uuid.uuid4())
                    booking_data = {
                        "id": booking_id,
                        "studioId": booking_request.get('studioId'),
                        "studioName": booking_request.get('studioName'),
                        "roomId": booking_request.get('roomId'),
                        "roomName": booking_request.get('roomName'),
                        "userId": booking_request.get('userId'),
                        "userName": booking_request.get('userName'),
                        "userEmail": booking_request.get('userEmail'),
                        "date": booking_request.get('date'),
                        "startTime": booking_request.get('startTime'),
                        "endTime": booking_request.get('endTime'),
                        "duration": booking_request.get('duration'),
                        "hourlyRate": booking_request.get('hourlyRate'),
                        "totalCost": booking_request.get('totalCost'),
                        "message": booking_request.get('message'),
                        "status": "confirmed",
                        "createdAt": booking_request.get('createdAt'),
                        "approvedAt": datetime.now().isoformat()
                    }
                    
                    bookings_db[booking_id] = booking_data
                    booking_request['status'] = 'approved'
                    
                    response = {
                        "message": "Booking approved successfully",
                        "booking": booking_data
                    }
                elif action == 'reject':
                    booking_request['status'] = 'rejected'
                    response = {
                        "message": "Booking rejected"
                    }
                else:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    response = {"error": "Invalid action. Use 'approve' or 'reject'"}
                    self.wfile.write(json.dumps(response).encode())
                    return
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                response_json = json.dumps(response)
                response_bytes = response_json.encode('utf-8')
                self.send_header('Content-Length', str(len(response_bytes)))
                self.send_header('Connection', 'close')
                self.end_headers()
                self.wfile.write(response_bytes)
                return

            # Handle cancellation of booking requests or bookings
            elif path.startswith('/api/bookings/') and path.endswith('/cancel'):
                booking_id = path.split('/')[-2]  # Extract booking ID from /api/bookings/{id}/cancel
                
                # Check if it's a booking request first
                if booking_id in booking_requests_db:
                    booking_requests_db[booking_id]['status'] = 'cancelled'
                    response = {"message": "Booking request cancelled successfully"}
                # Check if it's a confirmed booking
                elif booking_id in bookings_db:
                    bookings_db[booking_id]['status'] = 'cancelled'
                    response = {"message": "Booking cancelled successfully"}
                else:
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    response = {"error": "Booking not found"}
                    self.wfile.write(json.dumps(response).encode())
                    return
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Handle studio profile updates
            elif path.startswith('/api/studios/'):
                studio_id = path.split('/')[-1]
                
                if studio_id in studios_db:
                    # Update studio data
                    studios_db[studio_id].update(data)
                    
                    response = studios_db[studio_id]
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(response).encode())
                else:
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    response = {"error": "Studio not found"}
                    self.wfile.write(json.dumps(response).encode())
                    
        except Exception as e:
            print(f"Error in PUT request: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"error": "Internal server error"}
            self.wfile.write(json.dumps(response).encode())

if __name__ == '__main__':
    # Check if port is already in use
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', PORT))
    sock.close()
    
    if result == 0:
        print(f"Error: Port {PORT} is already in use.")
        print("Please stop any existing server on that port or use a different port.")
        exit(1)
    
    print(f"Starting mock backend server on port {PORT}")
    print(f"Health check: http://localhost:{PORT}/health")
    print("Press Ctrl+C to stop")
    
    with socketserver.TCPServer(('', PORT), CORSHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown() 