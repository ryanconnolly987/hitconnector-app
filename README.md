# HitConnector App

A platform connecting rappers with recording studios.

## Current Status ✅

The application is now fully functional with the following features:

### ✅ Working Features

1. **Dynamic Studio Discovery**: The "Find Studios" page now fetches studios from the API instead of using static mock data
2. **Studio Creation Integration**: Studios created through the studio dashboard are saved to both localStorage and the API
3. **Real-time Data Flow**: Studios created on the website now appear in the Find Studios section
4. **Authentication System**: Working auth context with login/signup functionality
5. **Toast Notifications**: Integrated toast system for user feedback
6. **Mock Backend API**: Python HTTP server providing studio and auth endpoints

### 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS (Port 3000)
- **Backend**: Python mock server with CORS support (Port 3005)
- **Data Flow**: Studio creation → API storage → Find Studios display

### 🚀 Getting Started

1. **Start the Mock Backend**:
   ```bash
   python3 mock-backend.py
   ```
   Server runs on http://localhost:3005

2. **Start the Frontend**:
   ```bash
   npm run dev
   ```
   App runs on http://localhost:3000

### 📡 API Endpoints

- `GET /health` - Health check
- `GET /api/studios` - Fetch all studios (supports ?location= filter)
- `POST /api/studios` - Create new studio
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### 🎯 Key Pages

- `/` - Homepage with hero section
- `/find-studios` - Dynamic studio discovery with filtering
- `/studio-dashboard/profile` - Studio profile creation/editing
- `/login` & `/signup` - Authentication pages

### 🔧 Recent Fixes

- ✅ Recreated missing auth and toast files
- ✅ Fixed port conflicts (backend on 3005, frontend on 3000)
- ✅ Resolved SelectItem component errors
- ✅ Integrated ToastDisplay into ToastProvider
- ✅ Updated API URLs to use correct port
- ✅ Fixed variable naming conflicts in studio creation

### 📝 Data Structure

Studios are stored with the following structure:
```json
{
  "id": "unique-id",
  "name": "Studio Name",
  "location": "City, State",
  "hourlyRate": 150,
  "specialties": ["Hip Hop", "R&B"],
  "rating": 4.8,
  "reviewCount": 127,
  "description": "Studio description",
  "amenities": ["WiFi", "Parking"],
  "images": ["image-urls"],
  "equipment": ["Pro Tools", "SSL Console"],
  "createdAt": "2024-01-15T10:00:00Z",
  "owner": "owner-email"
}
```

The application successfully connects studio creation with studio discovery, fulfilling the original requirement to make studios that appear in "Find studios" be the studios created on the website.

## Features

- **Studio Discovery**: Browse and search for recording studios
- **User Authentication**: Separate login for rappers and studio owners
- **Studio Profiles**: Detailed studio information with photos, equipment, and pricing
- **Booking System**: Complete booking request and management system
- **Studio Dashboard**: Comprehensive management interface for studio owners

## New Booking System

The booking system allows rappers to request studio sessions and studios to manage those requests:

### For Rappers:
1. Browse studio profiles and view available rooms
2. Click "Book Now" to request a session
3. Fill in date, time, room selection, and optional message
4. Submit booking request to the studio
5. Receive notifications when studio responds

### For Studio Owners:
1. View booking requests in the "Booking Requests" tab on your studio profile
2. See detailed information including date, time, cost, and rapper's message
3. Approve or reject booking requests with one click
4. Approved bookings automatically appear in your studio dashboard calendar
5. Manage your schedule and confirmed bookings

### API Endpoints:
- `POST /api/booking-requests` - Create new booking request
- `GET /api/booking-requests?studioId={id}` - Get requests for a studio
- `PUT /api/booking-requests/{id}` - Approve/reject a request
- `GET /api/bookings?studioId={id}` - Get confirmed bookings for calendar

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server:
   ```bash
   python3 mock-backend.py
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing the Booking System

1. Create a studio account and set up your studio profile
2. Add rooms and equipment to your studio
3. Switch to a rapper account (or create one)
4. Browse to your studio profile and make a booking request
5. Switch back to studio account and check the "Booking Requests" tab
6. Approve the request and see it appear in your studio dashboard calendar

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Python mock server (for development)
- **UI Components**: Custom components with shadcn/ui
- **Authentication**: Custom auth system with localStorage
- **State Management**: React hooks and context

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── studio-profile/     # Studio profile with booking requests
│   ├── studio-dashboard/   # Studio management dashboard
│   ├── bookings/          # Rapper booking management
│   └── ...
├── components/            # Reusable UI components
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions and auth
```
