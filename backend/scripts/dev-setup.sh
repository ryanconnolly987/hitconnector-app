#!/bin/bash

# HitConnector Backend Development Setup Script
# This script sets up the development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_node() {
    log_step "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    log_info "Node.js $(node --version) found."
}

check_postgres() {
    log_step "Checking PostgreSQL installation..."
    
    if ! command -v psql &> /dev/null && ! command -v docker &> /dev/null; then
        log_warn "Neither PostgreSQL nor Docker found."
        echo "Please install either:"
        echo "1. PostgreSQL: https://www.postgresql.org/download/"
        echo "2. Docker: https://www.docker.com/get-started"
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_info "Database option available."
    fi
}

install_dependencies() {
    log_step "Installing Node.js dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_info "Dependencies installed successfully."
}

setup_environment() {
    log_step "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        log_info "Creating development .env file..."
        cat > .env << EOF
# Development Environment Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hitconnector
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
EOF
        log_info ".env file created with development defaults."
    else
        log_info ".env file already exists."
    fi
    
    if [ ! -f ".env.test" ]; then
        log_info "Creating test environment file..."
        cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test

# Test Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=hitconnector_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=test-jwt-secret
JWT_EXPIRES_IN=1h

# CORS Configuration
FRONTEND_URL=http://localhost:3000
EOF
        log_info ".env.test file created."
    else
        log_info ".env.test file already exists."
    fi
}

setup_database() {
    log_step "Setting up development database..."
    
    # Check if we can connect to PostgreSQL
    if command -v psql &> /dev/null; then
        log_info "Attempting to set up PostgreSQL databases..."
        
        # Try to create databases
        if psql -U postgres -c "SELECT 1;" &>/dev/null; then
            log_info "Creating development database..."
            createdb hitconnector -U postgres 2>/dev/null || log_warn "Database 'hitconnector' may already exist."
            
            log_info "Creating test database..."
            createdb hitconnector_test -U postgres 2>/dev/null || log_warn "Database 'hitconnector_test' may already exist."
            
            log_info "Databases created successfully."
        else
            log_warn "Could not connect to PostgreSQL. Please ensure PostgreSQL is running."
            log_info "You can start PostgreSQL manually or use Docker:"
            echo "  Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15"
        fi
    else
        log_info "PostgreSQL not found locally. You can use Docker:"
        echo "  docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15"
    fi
}

create_uploads_directory() {
    log_step "Creating uploads directory..."
    
    mkdir -p uploads/avatar uploads/images
    
    # Create .gitkeep files
    touch uploads/avatar/.gitkeep
    touch uploads/images/.gitkeep
    
    log_info "Uploads directory structure created."
}

build_project() {
    log_step "Building TypeScript project..."
    
    npm run build
    
    log_info "Project built successfully."
}

run_tests() {
    log_step "Running tests to verify setup..."
    
    # Only run smoke tests for quick verification
    if npm test -- --testNamePattern="Health Check" --silent; then
        log_info "Basic tests passed."
    else
        log_warn "Some tests failed. This might be due to database connectivity."
        log_info "You can run 'npm test' later to verify everything works."
    fi
}

show_next_steps() {
    echo ""
    echo "=================================================="
    log_info "Development setup completed!"
    echo "=================================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Start the development server:"
    echo "   npm run dev"
    echo ""
    echo "2. Test the API health check:"
    echo "   curl http://localhost:3001/health"
    echo ""
    echo "3. Run tests:"
    echo "   npm test"
    echo ""
    echo "4. Build for production:"
    echo "   npm run build"
    echo ""
    echo "Available scripts:"
    echo "  npm run dev    - Start development server with hot reload"
    echo "  npm run build  - Build for production"
    echo "  npm start      - Start production server"
    echo "  npm test       - Run all tests"
    echo "  npm test:watch - Run tests in watch mode"
    echo ""
    echo "API will be available at: http://localhost:3001"
    echo "API documentation: See README.md for endpoint details"
    echo ""
    if [ -f ".env" ]; then
        echo "Environment file: .env (check database credentials)"
    fi
    echo ""
    log_info "Happy coding! 🚀"
}

# Main setup process
main() {
    echo "=================================================="
    echo "  HitConnector Backend Development Setup"
    echo "=================================================="
    echo ""
    
    check_node
    check_postgres
    install_dependencies
    setup_environment
    setup_database
    create_uploads_directory
    build_project
    run_tests
    show_next_steps
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "clean")
        log_info "Cleaning development environment..."
        rm -rf node_modules dist uploads .env .env.test
        log_info "Environment cleaned. Run './scripts/dev-setup.sh' to reinstall."
        ;;
    "test-db")
        log_info "Testing database connection..."
        if psql -U postgres -d hitconnector -c "SELECT 1;" &>/dev/null; then
            log_info "Development database connection: OK"
        else
            log_error "Cannot connect to development database"
        fi
        
        if psql -U postgres -d hitconnector_test -c "SELECT 1;" &>/dev/null; then
            log_info "Test database connection: OK"
        else
            log_error "Cannot connect to test database"
        fi
        ;;
    "reset-db")
        log_info "Resetting databases..."
        dropdb hitconnector -U postgres --if-exists
        dropdb hitconnector_test -U postgres --if-exists
        createdb hitconnector -U postgres
        createdb hitconnector_test -U postgres
        log_info "Databases reset successfully."
        ;;
    *)
        echo "Usage: $0 {setup|clean|test-db|reset-db}"
        echo ""
        echo "Commands:"
        echo "  setup    - Set up development environment (default)"
        echo "  clean    - Clean all generated files and dependencies"
        echo "  test-db  - Test database connections"
        echo "  reset-db - Drop and recreate databases"
        exit 1
        ;;
esac 