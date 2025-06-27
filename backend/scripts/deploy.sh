#!/bin/bash

# HitConnector Backend Deployment Script
# This script handles production deployment with proper error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="hitconnector-backend"
DOCKER_IMAGE="${APP_NAME}:latest"
CONTAINER_NAME="${APP_NAME}-container"
NETWORK_NAME="${APP_NAME}-network"
DB_CONTAINER_NAME="${APP_NAME}-postgres"

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

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_info "Dependencies check passed."
}

check_env_file() {
    if [ ! -f ".env" ]; then
        log_warn ".env file not found. Creating template..."
        cat > .env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=hitconnector
DB_USER=postgres
DB_PASSWORD=change-this-password
JWT_SECRET=change-this-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-domain.com
EOF
        log_error "Please update the .env file with your production values and run the script again."
        exit 1
    fi
    log_info "Environment file found."
}

build_image() {
    log_info "Building Docker image..."
    docker build -t $DOCKER_IMAGE .
    log_info "Docker image built successfully."
}

stop_existing_containers() {
    log_info "Stopping existing containers..."
    
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        docker stop $CONTAINER_NAME
        log_info "Stopped existing application container."
    fi
    
    if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
        docker rm $CONTAINER_NAME
        log_info "Removed existing application container."
    fi
}

create_network() {
    if ! docker network ls | grep -q $NETWORK_NAME; then
        log_info "Creating Docker network..."
        docker network create $NETWORK_NAME
    else
        log_info "Docker network already exists."
    fi
}

deploy_database() {
    log_info "Checking database container..."
    
    if [ ! "$(docker ps -q -f name=$DB_CONTAINER_NAME)" ]; then
        log_info "Starting database container..."
        docker-compose up -d postgres
        
        # Wait for database to be ready
        log_info "Waiting for database to be ready..."
        sleep 10
        
        # Check if database is accepting connections
        for i in {1..30}; do
            if docker exec $DB_CONTAINER_NAME pg_isready -U postgres; then
                log_info "Database is ready."
                break
            fi
            log_info "Waiting for database... ($i/30)"
            sleep 2
        done
    else
        log_info "Database container is already running."
    fi
}

deploy_application() {
    log_info "Deploying application..."
    
    # Run the application container
    docker run -d \
        --name $CONTAINER_NAME \
        --network $NETWORK_NAME \
        --env-file .env \
        -p 3001:3001 \
        -v $(pwd)/uploads:/app/uploads \
        --restart unless-stopped \
        $DOCKER_IMAGE
    
    log_info "Application container started."
}

check_health() {
    log_info "Checking application health..."
    
    # Wait a moment for the application to start
    sleep 5
    
    for i in {1..30}; do
        if curl -f http://localhost:3001/health &>/dev/null; then
            log_info "Application is healthy and responding."
            return 0
        fi
        log_info "Waiting for application to be ready... ($i/30)"
        sleep 2
    done
    
    log_error "Application health check failed."
    
    # Show logs for debugging
    log_info "Application logs:"
    docker logs $CONTAINER_NAME --tail 50
    
    return 1
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    docker image prune -f
    log_info "Cleanup completed."
}

show_status() {
    echo ""
    log_info "Deployment completed successfully!"
    echo ""
    echo "Application Status:"
    docker ps --filter name=$CONTAINER_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Database Status:"
    docker ps --filter name=$DB_CONTAINER_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    log_info "Application is available at: http://localhost:3001"
    log_info "Health check: http://localhost:3001/health"
    echo ""
}

# Main deployment process
main() {
    log_info "Starting HitConnector Backend deployment..."
    
    check_dependencies
    check_env_file
    build_image
    stop_existing_containers
    create_network
    deploy_database
    deploy_application
    
    if check_health; then
        cleanup_old_images
        show_status
    else
        log_error "Deployment failed. Please check the logs."
        exit 1
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "stop")
        log_info "Stopping all containers..."
        docker-compose down
        log_info "All containers stopped."
        ;;
    "logs")
        log_info "Showing application logs..."
        docker logs $CONTAINER_NAME -f
        ;;
    "restart")
        log_info "Restarting application..."
        docker restart $CONTAINER_NAME
        log_info "Application restarted."
        ;;
    "status")
        show_status
        ;;
    "clean")
        log_info "Cleaning up all containers and images..."
        docker-compose down -v
        docker rmi $DOCKER_IMAGE 2>/dev/null || true
        docker system prune -f
        log_info "Cleanup completed."
        ;;
    *)
        echo "Usage: $0 {deploy|stop|logs|restart|status|clean}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy the application (default)"
        echo "  stop    - Stop all containers"
        echo "  logs    - Show application logs"
        echo "  restart - Restart the application"
        echo "  status  - Show deployment status"
        echo "  clean   - Clean up all containers and images"
        exit 1
        ;;
esac 