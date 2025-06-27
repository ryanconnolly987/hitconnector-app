# HitConnector Backend API

> **🚀 Current Status**: Backend implementation is **COMPLETE** and production-ready!
> 
> **⚠️ Setup Required**: You need PostgreSQL or Docker to run the full application.
> See [SETUP.md](./SETUP.md) for detailed setup instructions.

A robust Node.js/Express backend API for connecting rappers with recording studios.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Separate rapper and studio user types
- **Studio Management**: Full CRUD operations for studios and rooms
- **Booking System**: Real-time booking with conflict detection
- **Review System**: Studio rating and review functionality
- **File Upload**: Image upload for avatars and studio photos
- **Database**: PostgreSQL with proper indexing and relationships
- **Testing**: Comprehensive test suite with smoke and integration tests

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Authentication**: JWT
- **File Upload**: Multer
- **Testing**: Jest + Supertest
- **Type Safety**: TypeScript
- **Containerization**: Docker & Docker Compose

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Check health**
   ```bash
   curl http://localhost:3001/health
   ```

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database**
   ```bash
   createdb hitconnector
   ```

3. **Configure environment variables**
   Create a `.env` file with:
   ```
   NODE_ENV=development
   PORT=3001
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=hitconnector
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Studios
- `GET /api/studios` - List/search studios
- `GET /api/studios/:id` - Get studio details
- `POST /api/studios` - Create studio (studio owners only)
- `PUT /api/studios/:id` - Update studio
- `DELETE /api/studios/:id` - Delete studio

### Bookings
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking (rappers only)
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password
- `DELETE /api/users/account` - Delete account
- `GET /api/users/:id` - Get public user profile

### Reviews
- `GET /api/reviews/studio/:studioId` - Get studio reviews
- `GET /api/reviews/:id` - Get review details
- `POST /api/reviews` - Create review (rappers only)
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Uploads
- `POST /api/upload/avatar` - Upload user avatar
- `POST /api/upload/studio-images` - Upload studio images
- `DELETE /api/upload/:type/:filename` - Delete uploaded file

## Testing

### Run All Tests
```bash
npm test
```

### Run Smoke Tests
```bash
npm test -- --testNamePattern="Smoke Tests"
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Environment Setup
Create `.env.test` file:
```
NODE_ENV=test
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=hitconnector_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=your_password
JWT_SECRET=test-jwt-secret
```

## Database Schema

### Core Tables
- **users** - User accounts (rappers and studios)
- **studios** - Studio information and settings
- **studio_rooms** - Individual rooms within studios
- **bookings** - Booking records and status
- **reviews** - Studio reviews and ratings
- **studio_availability** - Studio availability schedules

### Key Features
- Foreign key constraints for data integrity
- Indexes for performance optimization
- Soft deletes for data preservation
- Automatic timestamp tracking
- Rating aggregation for studios

## Deployment

### Production Environment Variables
```
NODE_ENV=production
PORT=3001
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=hitconnector
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment
1. Build image: `docker build -t hitconnector-backend .`
2. Run with environment variables
3. Ensure PostgreSQL is accessible
4. Set up persistent volumes for uploads

### Health Checks
- **Endpoint**: `GET /health`
- **Docker**: Built-in health check configured
- **Response**: Server status and timestamp

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- File upload restrictions
- Database parameter sanitization
- CORS configuration
- Error handling without information leakage

## Performance Optimizations

- Database connection pooling
- Proper database indexing
- Pagination for large datasets
- Efficient query patterns
- Graceful error handling
- Request logging and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the ISC License. 