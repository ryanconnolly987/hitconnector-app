# HitConnector Backend Setup Guide

## Quick Start Options

You have several options to get the HitConnector backend running:

### Option 1: Docker Compose (Recommended - Complete Setup)

This option provides a complete environment with PostgreSQL database.

1. **Install Docker Desktop**
   - Visit [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Download and install for your operating system

2. **Start the Application**
   ```bash
   docker-compose up -d
   ```

3. **Check Health**
   ```bash
   curl http://localhost:3001/health
   ```

### Option 2: Local Development with PostgreSQL

If you prefer to run the backend locally with a PostgreSQL database:

1. **Install PostgreSQL**
   - **macOS**: `brew install postgresql` or download from [postgresql.org](https://www.postgresql.org/download/)
   - **Windows**: Download installer from [postgresql.org](https://www.postgresql.org/download/)
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib` (Ubuntu/Debian)

2. **Start PostgreSQL Service**
   ```bash
   # macOS with Homebrew
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

3. **Create Database**
   ```bash
   createdb hitconnector
   createdb hitconnector_test
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Setup Environment**
   ```bash
   # Run the setup script
   ./scripts/dev-setup.sh
   
   # Or manually create .env file
   cp .env.example .env
   # Edit .env with your database credentials
   ```

6. **Initialize Database**
   ```bash
   psql -d hitconnector -f init.sql
   ```

7. **Start Development Server**
   ```bash
   npm run dev
   ```

### Option 3: Local Development with Docker Database Only

Run the backend locally but use Docker for the database:

1. **Install Docker Desktop** (see Option 1)

2. **Start Database Only**
   ```bash
   docker-compose up postgres -d
   ```

3. **Install Dependencies and Setup**
   ```bash
   npm install
   ./scripts/dev-setup.sh
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Option 4: Testing Without Database (Limited Functionality)

For quick testing of API structure without database functionality:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build Project**
   ```bash
   npm run build
   ```

3. **Run Health Check Only**
   ```bash
   npm test -- --testNamePattern="Health Check"
   ```

4. **Start Server (API structure only)**
   ```bash
   npm start
   ```

Note: Database-dependent endpoints will return 500 errors without a database connection.

## Environment Variables

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hitconnector
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## Testing

### Full Test Suite (Requires Database)
```bash
npm test
```

### Health Check Only (No Database Required)
```bash
npm test -- --testNamePattern="Health Check"
```

### Specific Test Files
```bash
npm test src/__tests__/smoke.test.ts
npm test src/__tests__/integration.test.ts
```

## Troubleshooting

### Database Connection Issues

1. **PostgreSQL not running**
   ```bash
   # Check if PostgreSQL is running
   pg_isready -h localhost -p 5432
   
   # Start PostgreSQL
   brew services start postgresql  # macOS
   sudo systemctl start postgresql # Linux
   ```

2. **Database doesn't exist**
   ```bash
   createdb hitconnector
   psql -d hitconnector -f init.sql
   ```

3. **Permission denied**
   ```bash
   # Create PostgreSQL user
   sudo -u postgres createuser --interactive
   ```

### Docker Issues

1. **Docker not running**
   - Start Docker Desktop application

2. **Port conflicts**
   ```bash
   # Check what's using port 5432
   lsof -i :5432
   
   # Stop conflicting services
   brew services stop postgresql
   ```

3. **Container won't start**
   ```bash
   # Check logs
   docker-compose logs postgres
   
   # Reset containers
   docker-compose down -v
   docker-compose up -d
   ```

### Build Issues

1. **TypeScript errors**
   ```bash
   # Clean build
   rm -rf dist node_modules
   npm install
   npm run build
   ```

2. **Missing dependencies**
   ```bash
   npm install
   ```

## API Testing

Once the server is running, you can test the API endpoints:

### Health Check
```bash
curl http://localhost:3001/health
```

### User Registration
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "userType": "rapper",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Get Studios
```bash
curl http://localhost:3001/api/studios
```

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm test:watch` - Run tests in watch mode

## Production Deployment

For production deployment, see the main README.md file for Docker deployment instructions.

## Support

If you encounter issues:

1. Check this setup guide
2. Review the error logs
3. Ensure all prerequisites are installed
4. Try the Docker Compose option for the most reliable setup

The Docker Compose option is recommended as it provides a consistent environment regardless of your local setup. 