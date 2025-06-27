#!/usr/bin/env python3

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import uuid
from datetime import datetime
import json
import os
import base64
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

PORT = 3002

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'public', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'banners'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'avatars'), exist_ok=True)

# In-memory databases
studios_db = {}
bookings_db = {}
booking_requests_db = {}
users_db = {}
user_studios_db = {}  # Maps user_id -> studio_id for studio owners
follows_db = {}  # Maps follower_id -> list of followed_user_ids
followers_db = {}  # Maps user_id -> list of follower_user_ids
open_calls_db = {}  # New database for open calls

# Initialize with some sample data
def initialize_sample_data():
    # Sample studios
    studios_db['1'] = {
        "id": "1",
        "name": "Downtown Studios",
        "location": "Los Angeles, CA",
        "address": "123 Music Row, Downtown LA",
        "phone": "(555) 123-4567",
        "email": "info@downtownstudios.com",
        "website": "https://downtownstudios.com",
        "profileImage": "/placeholder.svg?height=300&width=400",
        "coverImage": "/placeholder.svg?height=400&width=600",
        "hourlyRate": 120,
        "specialties": ["Hip Hop", "R&B", "Pop"],
        "rating": 4.8,
        "reviewCount": 127,
        "description": "Professional recording studio in the heart of downtown LA.",
        "amenities": ["24/7 Access", "Parking", "Mixing Board", "Instruments", "WiFi", "Coffee"],
        "owner": "studio@downtown.com",
        "images": ["/placeholder.svg?height=300&width=400"],
        "gallery": ["/placeholder.svg?height=300&width=400"],
        "availability": {},
        "equipment": ["Pro Tools", "SSL Console", "Neumann Mics"],
        "trackUrl": "",  # Add trackUrl field for music samples
        "followers": [],  # Initialize followers array
        "rooms": [
            {
                "id": "room-1-1",
                "name": "Studio A",
                "description": "Main recording room with live room and booth",
                "hourlyRate": 150,
                "capacity": 10,
                "images": ["/placeholder.svg?height=300&width=400"],
                "equipment": ["Pro Tools", "SSL Console", "Neumann U87"]
            },
            {
                "id": "room-1-2",
                "name": "Studio B",
                "description": "Compact recording studio perfect for vocals",
                "hourlyRate": 95,
                "capacity": 4,
                "images": ["/placeholder.svg?height=300&width=400"],
                "equipment": ["Logic Pro", "Focusrite Interface", "Shure SM7B"]
            }
        ],
        "staff": []
    }
    
    # Add more sample studios
    for i in range(2, 6):
        studios_db[str(i)] = {
            "id": str(i),
            "name": f"Studio {i}",
            "location": "Los Angeles, CA",
            "address": f"Address {i}",
            "phone": f"(555) 123-456{i}",
            "email": f"studio{i}@example.com",
            "website": f"https://studio{i}.com",
            "profileImage": "/placeholder.svg?height=300&width=400",
            "coverImage": "/placeholder.svg?height=400&width=600",
            "hourlyRate": 100 + i * 10,
            "specialties": ["Hip Hop", "R&B"],
            "rating": 4.0 + i * 0.1,
            "reviewCount": 50 + i * 10,
            "description": f"Professional recording studio {i}.",
            "amenities": ["24/7 Access", "Parking", "WiFi"],
            "owner": f"owner{i}@example.com",
            "images": ["/placeholder.svg?height=300&width=400"],
            "gallery": ["/placeholder.svg?height=300&width=400"],
            "availability": {},
            "equipment": ["Pro Tools"],
            "trackUrl": "",  # Add trackUrl field for music samples
            "followers": [],  # Initialize followers array
            "rooms": [],
            "staff": []
        }

    # Sample users with enhanced profile fields
    users_db['sample-user-1'] = {
        "id": "sample-user-1",
        "email": "mike@example.com",
        "name": "Mike Chen",
        "role": "rapper",
        "bio": "Hip-hop artist from LA specializing in conscious rap and storytelling.",
        "location": "Los Angeles, CA",
        "experience": "intermediate",
        "genres": ["Hip Hop", "Conscious Rap"],
        "socialMedia": {
            "instagram": "@mikechen",
            "twitter": "@mikechen",
            "soundcloud": "mikechen-music"
        },
        "trackUrl": "",
        "profileImage": "/placeholder.svg?height=300&width=300",
        "bannerImage": "/placeholder.svg?height=200&width=800",
        "projectHighlights": [
            {
                "id": "project-1",
                "title": "Midnight Reflections EP",
                "description": "A 5-track EP exploring themes of urban life and personal growth."
            },
            {
                "id": "project-2", 
                "title": "City Lights (Single)",
                "description": "Collaboration with local producer featuring live instrumentation."
            }
        ],
        "following": [],  # Initialize following array
        "followers": [],  # Initialize followers array
        "created_at": datetime.now().isoformat()
    }

    users_db['sample-user-2'] = {
        "id": "sample-user-2",
        "email": "sarah@example.com",
        "name": "Sarah Johnson",
        "role": "rapper",
        "bio": "R&B and hip-hop vocalist with a passion for melodic flows.",
        "location": "Atlanta, GA",
        "experience": "advanced",
        "genres": ["R&B", "Hip Hop", "Neo Soul"],
        "socialMedia": {
            "instagram": "@sarahj_music",
            "spotify": "Sarah Johnson"
        },
        "trackUrl": "",
        "profileImage": "/placeholder.svg?height=300&width=300",
        "bannerImage": "",
        "projectHighlights": [
            {
                "id": "project-3",
                "title": "Velvet Dreams Album",
                "description": "Debut album blending contemporary R&B with classic soul influences."
            }
        ],
        "following": [],  # Initialize following array
        "followers": [],  # Initialize followers array
        "created_at": datetime.now().isoformat()
    }

    # Sample booking requests
    booking_requests_db['req-456-789'] = {
        "id": "req-456-789",
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
    
    booking_requests_db['req-789-456'] = {
        "id": "req-789-456",
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

    # Sample open calls
    open_calls_db['call-1'] = {
        "id": "call-1",
        "postedById": "1",  # Studio ID
        "postedByType": "studio",
        "postedByName": "Downtown Studios",
        "postedByImage": "/placeholder.svg?height=40&width=40",
        "role": "Looking for mixing engineer",
        "description": "We're seeking an experienced mixing engineer for our upcoming R&B project. Must have experience with analog gear and Pro Tools. This is a paid opportunity for the right candidate.",
        "genre": "R&B",
        "location": "Los Angeles, CA",
        "budget": "$1000-2000",
        "deadline": "2024-07-15",
        "contactEmail": "info@downtownstudios.com",
        "status": "active",
        "createdAt": "2024-06-10T10:30:00Z",
        "applicants": []
    }
    
    open_calls_db['call-2'] = {
        "id": "call-2",
        "postedById": "rapper2",  # User ID (assuming this exists)
        "postedByType": "user",
        "postedByName": "Maya Johnson",
        "postedByImage": "/placeholder.svg?height=40&width=40",
        "role": "Need a producer",
        "description": "Looking for a producer who specializes in trap beats. I'm working on my debut EP and need someone who can bring fresh energy to my sound. Open to collaboration or work-for-hire.",
        "genre": "Hip Hop",
        "location": "Remote",
        "budget": "$500-1500",
        "deadline": "2024-07-30",
        "contactEmail": "maya@example.com",
        "status": "active",
        "createdAt": "2024-06-12T14:20:00Z",
        "applicants": []
    }

    open_calls_db['call-3'] = {
        "id": "call-3",
        "postedById": "2",  # Studio ID
        "postedByType": "studio",
        "postedByName": "Studio 2",
        "postedByImage": "/placeholder.svg?height=40&width=40",
        "role": "Vocalist needed",
        "description": "Demo project needs a soulful vocalist for background vocals. Great opportunity for newer artists to build their portfolio. Session includes meal and transportation covered.",
        "genre": "Soul",
        "location": "Los Angeles, CA",
        "budget": "$200-500",
        "deadline": "2024-06-25",
        "contactEmail": "studio2@example.com",
        "status": "active",
        "createdAt": "2024-06-08T09:15:00Z",
        "applicants": []
    }

# Helper function to save base64 image to file
def save_base64_image(base64_data, folder, filename_prefix):
    try:
        # Remove data URL prefix if present
        if base64_data.startswith('data:image'):
            base64_data = base64_data.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_data)
        
        # Generate filename
        filename = f"{filename_prefix}_{int(datetime.now().timestamp())}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, folder, filename)
        
        # Save file
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        # Return URL path
        return f"/uploads/{folder}/{filename}"
    except Exception as e:
        print(f"Error saving image: {e}")
        return None

initialize_sample_data()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# File upload endpoint for banner images
@app.route('/api/upload/banner', methods=['POST'])
def upload_banner():
    try:
        data = request.get_json()
        if not data or 'image' not in data or 'userId' not in data:
            return jsonify({"error": "Missing image data or user ID"}), 400
        
        image_data = data['image']
        user_id = data['userId']
        
        # Save the image
        image_url = save_base64_image(image_data, 'banners', f"banner_{user_id}")
        
        if image_url:
            return jsonify({
                "success": True,
                "imageUrl": image_url,
                "message": "Banner uploaded successfully"
            }), 200
        else:
            return jsonify({"error": "Failed to save image"}), 500
            
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

# File upload endpoint for profile images
@app.route('/api/upload/avatar', methods=['POST'])
def upload_avatar():
    try:
        data = request.get_json()
        if not data or 'image' not in data or 'userId' not in data:
            return jsonify({"error": "Missing image data or user ID"}), 400
        
        image_data = data['image']
        user_id = data['userId']
        
        # Save the image
        image_url = save_base64_image(image_data, 'avatars', f"avatar_{user_id}")
        
        if image_url:
            return jsonify({
                "success": True,
                "imageUrl": image_url,
                "message": "Avatar uploaded successfully"
            }), 200
        else:
            return jsonify({"error": "Failed to save image"}), 500
            
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@app.route('/api/studios', methods=['GET', 'POST'])
def studios():
    if request.method == 'GET':
        studio_list = []
        for studio_id, studio in studios_db.items():
            studio_copy = studio.copy()
            # Add followers count to each studio
            studio_copy['followersCount'] = len(studio.get('followers', []))
            studio_list.append(studio_copy)
        return jsonify({"studios": studio_list}), 200
    
    elif request.method == 'POST':
        data = request.get_json() or {}
        
        # Check if this is an update to an existing studio
        owner_email = data.get('owner')
        existing_studio_id = None
        
        # Find existing studio by owner
        for studio_id, studio in studios_db.items():
            if studio.get('owner') == owner_email:
                existing_studio_id = studio_id
                break
        
        if existing_studio_id:
            # Update existing studio
            existing_studio = studios_db[existing_studio_id].copy()
            
            # Update fields while preserving followers
            updatable_fields = [
                'name', 'location', 'address', 'phone', 'email', 'website', 
                'profileImage', 'coverImage', 'description', 'hourlyRate', 
                'amenities', 'specialties', 'images', 'gallery', 'equipment',
                'rooms', 'operatingHours', 'isAvailable', 'trackUrl', 'staff'
            ]
            
            for field in updatable_fields:
                if field in data:
                    existing_studio[field] = data[field]
            
            # Ensure followers array exists and is preserved
            if 'followers' not in existing_studio:
                existing_studio['followers'] = []
            
            studios_db[existing_studio_id] = existing_studio
            
            # Add followers count for response
            response_studio = existing_studio.copy()
            response_studio['id'] = existing_studio_id
            response_studio['followersCount'] = len(existing_studio.get('followers', []))
            
            print(f"✅ Updated existing studio {existing_studio_id}: {existing_studio.get('name')}")
            return jsonify(response_studio), 200
        else:
            # Create new studio
            studio_id = str(uuid.uuid4())
            
            studio_data = {
                "id": studio_id,
                "name": data.get('name', 'New Studio'),
                "location": data.get('location', ''),
                "address": data.get('address', ''),
                "phone": data.get('phone', ''),
                "email": data.get('email', ''),
                "website": data.get('website', ''),
                "profileImage": data.get('profileImage', ''),
                "coverImage": data.get('coverImage', ''),
                "description": data.get('description', ''),
                "hourlyRate": data.get('hourlyRate', 0),
                "amenities": data.get('amenities', []),
                "specialties": data.get('specialties', []),
                "images": data.get('images', []),
                "gallery": data.get('gallery', []),
                "equipment": data.get('equipment', []),
                "rooms": data.get('rooms', []),
                "operatingHours": data.get('operatingHours', {}),
                "isAvailable": data.get('isAvailable', True),
                "trackUrl": data.get('trackUrl', ''),
                "staff": data.get('staff', []),
                "owner": owner_email,
                "followers": [],  # Initialize empty followers array
                "rating": 4.8,
                "reviewCount": 12
            }
            
            studios_db[studio_id] = studio_data
            
            # Add followers count for response
            response_studio = studio_data.copy()
            response_studio['followersCount'] = 0
            
            print(f"✅ Created new studio {studio_id}: {studio_data.get('name')}")
            return jsonify(response_studio), 201

@app.route('/api/studios/<studio_id>', methods=['GET', 'PUT'])
def studio_detail(studio_id):
    if request.method == 'GET':
        if studio_id in studios_db:
            studio = studios_db[studio_id].copy()
            # Add followers count from the studio's followers array
            studio['followersCount'] = len(studio.get('followers', []))
            return jsonify(studio), 200
        return jsonify({"error": "Studio not found"}), 404
    
    elif request.method == 'PUT':
        """Update an existing studio"""
        if studio_id not in studios_db:
            return jsonify({"error": "Studio not found"}), 404
        
        data = request.get_json() or {}
        existing_studio = studios_db[studio_id].copy()
        
        # Update fields if provided
        updatable_fields = [
            'name', 'location', 'address', 'phone', 'email', 'website', 
            'profileImage', 'coverImage', 'description', 'hourlyRate', 
            'amenities', 'specialties', 'images', 'gallery', 'equipment',
            'rooms', 'operatingHours', 'isAvailable', 'trackUrl', 'staff'
        ]
        
        for field in updatable_fields:
            if field in data:
                existing_studio[field] = data[field]
        
        # Ensure followers array exists and is preserved
        if 'followers' not in existing_studio:
            existing_studio['followers'] = []
        
        # Update in database
        studios_db[studio_id] = existing_studio
        
        # Add followers count for response
        response_studio = existing_studio.copy()
        response_studio['followersCount'] = len(existing_studio.get('followers', []))
        
        print(f"✅ Studio {studio_id} updated successfully")
        print(f"📊 Updated studio data: name={existing_studio.get('name')}, rooms={len(existing_studio.get('rooms', []))}, staff={len(existing_studio.get('staff', []))}")
        
        return jsonify(response_studio), 200

@app.route('/api/booking-requests', methods=['GET', 'POST'])
def booking_requests():
    if request.method == 'GET':
        studio_id = request.args.get('studioId')
        user_id = request.args.get('userId')
        
        print(f"DEBUG: Filtering booking requests - studioId: {studio_id}, userId: {user_id}")
        
        booking_requests_list = list(booking_requests_db.values())
        print(f"DEBUG: Total booking requests before filtering: {len(booking_requests_list)}")
        
        # Filter by studioId if provided
        if studio_id:
            booking_requests_list = [req for req in booking_requests_list if req.get('studioId') == studio_id]
            print(f"DEBUG: After studioId filter: {len(booking_requests_list)} requests")
        
        # Filter by userId if provided
        if user_id:
            print(f"DEBUG: Filtering by userId: {user_id}")
            original_count = len(booking_requests_list)
            booking_requests_list = [req for req in booking_requests_list if req.get('userId') == user_id]
            print(f"DEBUG: After userId filter: {len(booking_requests_list)} requests (was {original_count})")
            
            # Debug: show what userIds we have
            all_user_ids = [req.get('userId') for req in booking_requests_db.values()]
            print(f"DEBUG: All userIds in database: {set(all_user_ids)}")
        
        return jsonify({"bookingRequests": booking_requests_list}), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Extract required fields
        studio_id = data.get('studioId')
        room_id = data.get('roomId')
        date = data.get('date')
        start_time = data.get('startTime')
        end_time = data.get('endTime')
        
        if not all([studio_id, room_id, date, start_time, end_time]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Find the studio
        studio = studios_db.get(studio_id)
        if not studio:
            return jsonify({"error": "Studio not found"}), 404
        
        print(f"DEBUG: Studio found: {studio.get('name')}")
        print(f"DEBUG: Looking for room ID: {room_id} (type: {type(room_id)})")
        print(f"DEBUG: Available rooms: {studio.get('rooms', [])}")
        
        # Find the room and ensure room_id is treated as string
        room_id_str = str(room_id)  # Convert to string if it's a number
        room = None
        for r in studio.get('rooms', []):
            print(f"DEBUG: Checking room {r.get('id')} (type: {type(r.get('id'))}) against {room_id_str}")
            if str(r['id']) == room_id_str:  # Compare as strings
                room = r
                print(f"DEBUG: Room found: {room}")
                break
                
        if not room:
            print(f"DEBUG: Room not found! Searched for {room_id_str} in {[str(r['id']) for r in studio.get('rooms', [])]}")
            return jsonify({"error": "Room not found"}), 404
        
        request_id = str(uuid.uuid4())
        booking_request_data = {
            "id": request_id,
            "studioId": studio_id,
            "studioName": studio['name'],  # Use the found studio name directly
            "roomId": room_id_str,  # Ensure it's stored as string
            "roomName": room['name'],  # Use the found room name directly
            "userId": data.get('userId'),
            "userName": data.get('userName'),
            "userEmail": data.get('userEmail'),
            "date": date,
            "startTime": start_time,
            "endTime": end_time,
            "duration": data.get('duration', 1),
            "hourlyRate": data.get('hourlyRate') or room.get('hourlyRate', 100),
            "totalCost": data.get('totalCost', 0),
            "message": data.get('message', ''),
            "status": "pending",
            "createdAt": datetime.now().isoformat()
        }
        
        print(f"DEBUG: Created booking request: {booking_request_data}")
        booking_requests_db[request_id] = booking_request_data
        
        return jsonify(booking_request_data), 201

@app.route('/api/booking-requests/<request_id>', methods=['PUT'])
def update_booking_request(request_id):
    data = request.get_json() or {}
    action = data.get('action')
    
    if request_id not in booking_requests_db:
        return jsonify({"error": "Booking request not found"}), 404
    
    booking_request = booking_requests_db[request_id]
    
    if action == 'approve':
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
        
        return jsonify({
            "message": "Booking approved successfully",
            "booking": booking_data
        })
    
    elif action == 'reject':
        booking_request['status'] = 'rejected'
        return jsonify({"message": "Booking rejected"})
    
    else:
        return jsonify({"error": "Invalid action. Use 'approve' or 'reject'"}), 400

@app.route('/api/bookings', methods=['GET'])
def bookings():
    studio_id = request.args.get('studioId')
    user_id = request.args.get('userId')
    
    bookings_list = list(bookings_db.values())
    
    # Filter by studioId if provided
    if studio_id:
        bookings_list = [booking for booking in bookings_list if booking.get('studioId') == studio_id]
    
    # Filter by userId if provided
    if user_id:
        bookings_list = [booking for booking in bookings_list if booking.get('userId') == user_id]
    
    return jsonify({"bookings": bookings_list}), 200

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    role = data.get('role', 'rapper')
    
    # Find existing user by email
    existing_user = None
    for user_id, user in users_db.items():
        if user.get('email') == email:
            existing_user = user
            existing_user['id'] = user_id  # Ensure ID is set
            break
    
    if existing_user:
        # Update role if different
        existing_user['role'] = role
        # Preserve trackUrl if it exists, otherwise set empty
        if 'trackUrl' not in existing_user:
            existing_user['trackUrl'] = ''
        user_data = existing_user
    else:
        # Create new user for login
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "email": email,
            "name": data.get('name', email.split('@')[0].title()),
            "role": role,
            "trackUrl": '',
            "created_at": datetime.now().isoformat()
        }
        users_db[user_id] = user_data
    
    response_data = {
        "user": user_data,
        "token": f"mock_token_{user_data['id']}"
    }
    
    # If studio user, find their studio
    if role == 'studio':
        user_studio_id = user_studios_db.get(user_data['id'])
        if user_studio_id:
            response_data["studioId"] = user_studio_id
        else:
            # Fallback: find by email
            user_studios = [studio for studio in studios_db.values() if studio.get('owner') == email]
            if user_studios:
                response_data["studioId"] = user_studios[0]['id']
                user_studios_db[user_data['id']] = user_studios[0]['id']
    
    return jsonify(response_data), 200

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = data.get('email')
    role = data.get('role', 'rapper')
    
    # Check if email already exists
    for user in users_db.values():
        if user.get('email') == email:
            return jsonify({"error": "Email already exists. Please login instead."}), 400
    
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": email,
        "name": data.get('name'),
        "role": role,
        "trackUrl": '',
        "created_at": datetime.now().isoformat()
    }
    
    users_db[user_id] = user_data
    
    # If studio user, create a basic studio profile
    studio_id = None
    if role == 'studio':
        studio_id = str(uuid.uuid4())
        studio_data = {
            "id": studio_id,
            "name": data.get('studioName', f"{data.get('name', 'New')} Studio"),
            "location": "Location TBD",
            "address": "",
            "phone": data.get('phone', ''),
            "email": email,
            "website": "",
            "profileImage": "/placeholder.svg?height=300&width=400",
            "coverImage": "/placeholder.svg?height=400&width=600",
            "hourlyRate": 100,
            "specialties": [],
            "rating": 0,
            "reviewCount": 0,
            "description": "Professional recording studio",
            "amenities": [],
            "owner": email,
            "images": ["/placeholder.svg?height=300&width=400"],
            "gallery": ["/placeholder.svg?height=300&width=400"],
            "availability": {},
            "equipment": [],
            "rooms": [],
            "staff": [],
            "trackUrl": '',
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        studios_db[studio_id] = studio_data
        user_studios_db[user_id] = studio_id
    
    response_data = {
        "user": user_data,
        "token": f"mock_token_{user_id}"
    }
    
    if studio_id:
        response_data["studioId"] = studio_id
    
    return jsonify(response_data), 201

@app.route('/api/users/<user_id>/studios', methods=['GET'])
def get_user_studios(user_id):
    user_studio_id = user_studios_db.get(user_id)
    if user_studio_id and user_studio_id in studios_db:
        return jsonify({"studios": [studios_db[user_studio_id]]})
    
    # Fallback: find by email if user exists
    user = users_db.get(user_id)
    if user:
        user_email = user.get('email')
        user_studios = [studio for studio in studios_db.values() if studio.get('owner') == user_email]
        return jsonify({"studios": user_studios})
    
    return jsonify({"studios": []})

@app.route('/api/users/<user_id>', methods=['GET', 'PUT'])
def user_profile(user_id):
    if request.method == 'GET':
        if user_id in users_db:
            return jsonify(users_db[user_id])
        else:
            return jsonify({"error": "User not found"}), 404
    
    elif request.method == 'PUT':
        if user_id not in users_db:
            return jsonify({"error": "User not found"}), 404
        
        data = request.get_json() or {}
        user = users_db[user_id]
        
        # Update user profile fields
        user['name'] = data.get('name', user.get('name', ''))
        user['bio'] = data.get('bio', user.get('bio', ''))
        user['location'] = data.get('location', user.get('location', ''))
        user['experience'] = data.get('experience', user.get('experience', ''))
        user['genres'] = data.get('genres', user.get('genres', []))
        user['socialMedia'] = data.get('socialMedia', user.get('socialMedia', {}))
        user['trackUrl'] = data.get('trackUrl', user.get('trackUrl', ''))
        user['profileImage'] = data.get('profileImage', user.get('profileImage', ''))
        user['bannerImage'] = data.get('bannerImage', user.get('bannerImage', ''))
        user['projectHighlights'] = data.get('projectHighlights', user.get('projectHighlights', []))
        user['updated_at'] = datetime.now().isoformat()
        
        return jsonify(user), 200

@app.route('/api/bookings/<booking_id>/cancel', methods=['PUT'])
def cancel_booking(booking_id):
    """Cancel a booking by updating its status to cancelled"""
    if booking_id not in bookings_db:
        return jsonify({"error": "Booking not found"}), 404
    
    booking = bookings_db[booking_id]
    
    # Check if booking is already cancelled
    if booking.get('status') == 'cancelled':
        return jsonify({"message": "Booking is already cancelled", "booking": booking}), 200
    
    # Update booking status to cancelled
    booking['status'] = 'cancelled'
    booking['cancelledAt'] = datetime.now().isoformat()
    
    return jsonify({
        "message": "Booking cancelled successfully",
        "booking": booking
    }), 200

@app.route('/api/follow', methods=['POST'])
def follow_user():
    """Follow or unfollow a user/studio"""
    data = request.get_json() or {}
    follower_id = data.get('followerId')
    followed_id = data.get('followedId')
    
    if not follower_id or not followed_id:
        return jsonify({"error": "followerId and followedId are required"}), 400
    
    if follower_id == followed_id:
        return jsonify({"error": "Cannot follow yourself"}), 400
    
    # Find the follower (user) and followed (studio or user)
    follower = None
    followed = None
    
    # Get follower (should be a user)
    if follower_id in users_db:
        follower = users_db[follower_id]
    else:
        return jsonify({"error": "Follower not found"}), 404
    
    # Get followed (could be studio or user)
    if followed_id in studios_db:
        followed = studios_db[followed_id]
        followed_type = "studio"
    elif followed_id in users_db:
        followed = users_db[followed_id]
        followed_type = "user"
    else:
        return jsonify({"error": "Target to follow not found"}), 404
    
    # Initialize following/followers arrays if they don't exist
    if 'following' not in follower:
        follower['following'] = []
    if 'followers' not in followed:
        followed['followers'] = []
    
    # Check if already following
    is_following = followed_id in follower['following']
    
    if is_following:
        # Unfollow
        follower['following'].remove(followed_id)
        followed['followers'].remove(follower_id)
        action = "unfollowed"
    else:
        # Follow
        follower['following'].append(followed_id)
        followed['followers'].append(follower_id)
        action = "followed"
    
    # Update the databases
    users_db[follower_id] = follower
    if followed_type == "studio":
        studios_db[followed_id] = followed
    else:
        users_db[followed_id] = followed
    
    return jsonify({
        "action": action,
        "isFollowing": not is_following,
        "followersCount": len(followed.get('followers', [])),
        "followingCount": len(follower.get('following', []))
    }), 200

@app.route('/api/follow/following/<user_id>', methods=['GET'])
def get_user_following(user_id):
    """Get list of users/studios that a user is following"""
    if user_id not in users_db:
        return jsonify({"error": "User not found"}), 404
    
    user = users_db[user_id]
    following_ids = user.get('following', [])
    following_list = []
    
    for followed_id in following_ids:
        # Check if it's a studio
        if followed_id in studios_db:
            studio = studios_db[followed_id]
            following_list.append({
                'id': followed_id,
                'name': studio.get('name', 'Unnamed Studio'),
                'type': 'studio',
                'profileImage': studio.get('profileImage'),
                'location': studio.get('location') or studio.get('address'),
                'rating': studio.get('rating', 0)
            })
        # Check if it's a user
        elif followed_id in users_db:
            followed_user = users_db[followed_id]
            following_list.append({
                'id': followed_id,
                'name': followed_user.get('name', 'Unknown User'),
                'type': 'user',
                'profileImage': followed_user.get('profileImage'),
                'location': followed_user.get('location')
            })
    
    return jsonify({
        'following': following_list,
        'count': len(following_list)
    }), 200

@app.route('/api/users/<user_id>/followers', methods=['GET'])
def get_user_followers(user_id):
    """Get list of users following this user/studio"""
    # Check if it's a studio or user
    target = None
    if user_id in studios_db:
        target = studios_db[user_id]
    elif user_id in users_db:
        target = users_db[user_id]
    else:
        return jsonify({"error": "User/Studio not found"}), 404
    
    follower_ids = target.get('followers', [])
    followers_list = []
    
    # Get user details for each follower
    for follower_id in follower_ids:
        if follower_id in users_db:
            user = users_db[follower_id].copy()
            user['type'] = 'user'
            followers_list.append(user)
    
    return jsonify({
        "followers": followers_list,
        "count": len(followers_list)
    }), 200

@app.route('/api/users/<user_id>/follow-status/<target_id>', methods=['GET'])
def get_follow_status(user_id, target_id):
    """Check if user_id is following target_id"""
    # Get user
    if user_id not in users_db:
        return jsonify({"error": "User not found"}), 404
    
    user = users_db[user_id]
    is_following = target_id in user.get('following', [])
    
    # Get target (studio or user) for followers count
    followers_count = 0
    if target_id in studios_db:
        followers_count = len(studios_db[target_id].get('followers', []))
    elif target_id in users_db:
        followers_count = len(users_db[target_id].get('followers', []))
    
    following_count = len(user.get('following', []))
    
    return jsonify({
        "isFollowing": is_following,
        "followersCount": followers_count,
        "followingCount": following_count
    }), 200

@app.route('/api/open-calls', methods=['GET', 'POST'])
def open_calls():
    if request.method == 'GET':
        role_filter = request.args.get('role')
        genre_filter = request.args.get('genre')
        poster_id = request.args.get('posterId')
        
        open_calls_list = list(open_calls_db.values())
        
        # Filter by role if provided
        if role_filter and role_filter.lower() != 'all':
            open_calls_list = [call for call in open_calls_list 
                             if role_filter.lower() in call['role'].lower()]
        
        # Filter by genre if provided
        if genre_filter and genre_filter.lower() != 'all':
            open_calls_list = [call for call in open_calls_list 
                             if call.get('genre', '').lower() == genre_filter.lower()]
        
        # Filter by poster if provided
        if poster_id:
            open_calls_list = [call for call in open_calls_list 
                             if call.get('postedById') == poster_id]
        
        # Sort by creation date (newest first)
        open_calls_list.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        return jsonify({"openCalls": open_calls_list}), 200
    
    elif request.method == 'POST':
        data = request.get_json() or {}
        
        # Validate required fields
        required_fields = ['postedById', 'role', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Generate unique ID
        call_id = str(uuid.uuid4())
        
        # Determine poster info based on postedById and type
        posted_by_id = data.get('postedById')
        posted_by_type = data.get('postedByType', 'user')
        
        if posted_by_type == 'studio' and posted_by_id in studios_db:
            studio = studios_db[posted_by_id]
            posted_by_name = studio.get('name', 'Unknown Studio')
            posted_by_image = studio.get('profileImage', '/placeholder.svg?height=40&width=40')
            contact_email = studio.get('email', '')
        elif posted_by_type == 'user' and posted_by_id in users_db:
            user = users_db[posted_by_id]
            posted_by_name = user.get('name', 'Unknown User')
            posted_by_image = user.get('profileImage', '/placeholder.svg?height=40&width=40')
            contact_email = user.get('email', '')
        else:
            return jsonify({"error": "Invalid poster ID or type"}), 400
        
        # Create open call data
        open_call_data = {
            "id": call_id,
            "postedById": posted_by_id,
            "postedByType": posted_by_type,
            "postedByName": posted_by_name,
            "postedByImage": posted_by_image,
            "role": data.get('role'),
            "description": data.get('description'),
            "genre": data.get('genre', ''),
            "location": data.get('location', ''),
            "budget": data.get('budget', ''),
            "deadline": data.get('deadline', ''),
            "contactEmail": contact_email,
            "status": "active",
            "createdAt": datetime.now().isoformat(),
            "applicants": []
        }
        
        open_calls_db[call_id] = open_call_data
        
        return jsonify(open_call_data), 201

@app.route('/api/open-calls/<call_id>', methods=['GET', 'PUT', 'DELETE'])
def open_call_detail(call_id):
    if call_id not in open_calls_db:
        return jsonify({"error": "Open call not found"}), 404
    
    if request.method == 'GET':
        return jsonify(open_calls_db[call_id]), 200
    
    elif request.method == 'PUT':
        data = request.get_json() or {}
        open_call = open_calls_db[call_id]
        
        # Update allowed fields
        updatable_fields = ['role', 'description', 'genre', 'location', 'budget', 'deadline', 'status']
        for field in updatable_fields:
            if field in data:
                open_call[field] = data[field]
        
        open_call['updatedAt'] = datetime.now().isoformat()
        
        return jsonify(open_call), 200
    
    elif request.method == 'DELETE':
        del open_calls_db[call_id]
        return jsonify({"message": "Open call deleted successfully"}), 200

@app.route('/api/open-calls/<call_id>/apply', methods=['POST'])
def apply_to_open_call(call_id):
    """Apply to an open call or express interest"""
    if call_id not in open_calls_db:
        return jsonify({"error": "Open call not found"}), 404
    
    data = request.get_json() or {}
    user_id = data.get('userId')
    message = data.get('message', '')
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    if user_id not in users_db:
        return jsonify({"error": "User not found"}), 404
    
    open_call = open_calls_db[call_id]
    user = users_db[user_id]
    
    # Check if user already applied
    existing_applicant = next((app for app in open_call['applicants'] 
                             if app.get('userId') == user_id), None)
    
    if existing_applicant:
        return jsonify({"error": "You have already applied to this open call"}), 400
    
    # Add applicant
    applicant_data = {
        "userId": user_id,
        "userName": user.get('name', 'Unknown User'),
        "userEmail": user.get('email', ''),
        "userImage": user.get('profileImage', '/placeholder.svg?height=40&width=40'),
        "message": message,
        "appliedAt": datetime.now().isoformat()
    }
    
    open_call['applicants'].append(applicant_data)
    
    return jsonify({
        "message": "Application submitted successfully",
        "applicant": applicant_data
    }), 201

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/init-followers', methods=['POST'])
def init_followers():
    """Initialize followers arrays for existing studios and users"""
    updated_count = 0
    
    # Add followers arrays to all studios
    for studio_id, studio in studios_db.items():
        if 'followers' not in studio:
            studio['followers'] = []
            updated_count += 1
    
    # Add following/followers arrays to all users
    for user_id, user in users_db.items():
        if 'following' not in user:
            user['following'] = []
            updated_count += 1
        if 'followers' not in user:
            user['followers'] = []
            updated_count += 1
    
    print(f"✅ Initialized followers arrays for {updated_count} records")
    
    return jsonify({
        "message": f"Followers arrays initialized for {updated_count} records",
        "studios": len(studios_db),
        "users": len(users_db)
    }), 200

if __name__ == '__main__':
    print(f"Starting Flask backend server on port {PORT}")
    print(f"Health check: http://localhost:{PORT}/health")
    print("Press Ctrl+C to stop")
    
    app.run(host='0.0.0.0', port=PORT, debug=False) 