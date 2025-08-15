#!/bin/bash

# BEwithU Deployment Script
# This script helps deploy the BEwithU system using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
DEV_COMPOSE_FILE="$PROJECT_DIR/docker-compose.dev.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check available disk space (at least 5GB)
    available_space=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
    required_space=5242880  # 5GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log_warning "Available disk space is less than 5GB. Deployment may fail."
    fi
    
    log_success "System requirements check passed"
}

create_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_info "Creating environment file..."
        
        # Generate random passwords
        POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
        N8N_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)
        
        cat > "$ENV_FILE" << EOF
# BEwithU Environment Configuration
# Generated on $(date)

# Database Configuration
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_PORT=6379

# API Configuration
JWT_SECRET=$JWT_SECRET
API_PORT=5000
CORS_ORIGINS=http://localhost:3000,http://localhost:80

# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=$N8N_PASSWORD
N8N_PORT=5678

# Frontend Configuration
FRONTEND_PORT=3000

# Ollama Configuration
OLLAMA_PORT=11434

# Nginx Configuration
HTTP_PORT=80
HTTPS_PORT=443

# Application Configuration
APP_VERSION=1.0.0
FLASK_ENV=production
EOF
        
        log_success "Environment file created at $ENV_FILE"
        log_warning "Please review and update the environment variables as needed"
    else
        log_info "Environment file already exists"
    fi
}

pull_images() {
    log_info "Pulling Docker images..."
    
    if [ "$1" = "dev" ]; then
        docker-compose -f "$DEV_COMPOSE_FILE" pull
    else
        docker-compose -f "$COMPOSE_FILE" pull
    fi
    
    log_success "Docker images pulled successfully"
}

build_images() {
    log_info "Building custom Docker images..."
    
    if [ "$1" = "dev" ]; then
        docker-compose -f "$DEV_COMPOSE_FILE" build
    else
        docker-compose -f "$COMPOSE_FILE" build
    fi
    
    log_success "Docker images built successfully"
}

start_services() {
    local mode="$1"
    log_info "Starting BEwithU services in $mode mode..."
    
    if [ "$mode" = "dev" ]; then
        docker-compose -f "$DEV_COMPOSE_FILE" up -d
    else
        docker-compose -f "$COMPOSE_FILE" up -d
    fi
    
    log_success "Services started successfully"
}

stop_services() {
    local mode="$1"
    log_info "Stopping BEwithU services..."
    
    if [ "$mode" = "dev" ]; then
        docker-compose -f "$DEV_COMPOSE_FILE" down
    else
        docker-compose -f "$COMPOSE_FILE" down
    fi
    
    log_success "Services stopped successfully"
}

show_status() {
    local mode="$1"
    log_info "Service status:"
    
    if [ "$mode" = "dev" ]; then
        docker-compose -f "$DEV_COMPOSE_FILE" ps
    else
        docker-compose -f "$COMPOSE_FILE" ps
    fi
}

show_logs() {
    local mode="$1"
    local service="$2"
    
    if [ "$mode" = "dev" ]; then
        if [ -n "$service" ]; then
            docker-compose -f "$DEV_COMPOSE_FILE" logs -f "$service"
        else
            docker-compose -f "$DEV_COMPOSE_FILE" logs -f
        fi
    else
        if [ -n "$service" ]; then
            docker-compose -f "$COMPOSE_FILE" logs -f "$service"
        else
            docker-compose -f "$COMPOSE_FILE" logs -f
        fi
    fi
}

setup_ollama() {
    log_info "Setting up Ollama LLM models..."
    
    # Wait for Ollama to be ready
    log_info "Waiting for Ollama service to be ready..."
    sleep 30
    
    # Pull required models
    docker exec bewithU-ollama-dev ollama pull llama2 2>/dev/null || \
    docker exec bewithU-ollama ollama pull llama2 || {
        log_warning "Failed to pull llama2 model. You can pull it manually later."
    }
    
    log_success "Ollama setup completed"
}

deploy_workflows() {
    log_info "Deploying n8n workflows..."
    
    # Wait for n8n to be ready
    log_info "Waiting for n8n service to be ready..."
    sleep 60
    
    # Run workflow deployment script
    if [ -f "$PROJECT_DIR/n8n/deploy-workflows.sh" ]; then
        cd "$PROJECT_DIR"
        ./n8n/deploy-workflows.sh
    else
        log_warning "Workflow deployment script not found. Please deploy workflows manually."
    fi
    
    log_success "Workflow deployment completed"
}

show_access_info() {
    local mode="$1"
    
    log_success "BEwithU deployment completed!"
    echo
    echo "Access Information:"
    echo "=================="
    
    if [ "$mode" = "dev" ]; then
        echo "Frontend Application: http://localhost:3001"
        echo "Backend API: http://localhost:5001"
        echo "n8n Workflow: http://localhost:5679 (admin/admin123)"
        echo "PostgreSQL: localhost:5433 (dev_user/dev_password)"
        echo "Redis: localhost:6380"
        echo "Ollama: http://localhost:11435"
    else
        echo "Frontend Application: http://localhost:3000"
        echo "Backend API: http://localhost:5000"
        echo "n8n Workflow: http://localhost:5678 (admin/[check .env file])"
        echo "PostgreSQL: localhost:5432"
        echo "Redis: localhost:6379"
        echo "Ollama: http://localhost:11434"
        echo "Nginx Proxy: http://localhost:80"
    fi
    
    echo
    echo "Default Credentials:"
    echo "==================="
    echo "n8n: admin / [check .env file for password]"
    echo
    echo "Useful Commands:"
    echo "==============="
    echo "View logs: $0 logs [service-name]"
    echo "Check status: $0 status"
    echo "Stop services: $0 stop"
    echo "Restart services: $0 restart"
}

show_help() {
    echo "BEwithU Deployment Script"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  start [dev]     Start services (dev for development mode)"
    echo "  stop [dev]      Stop services"
    echo "  restart [dev]   Restart services"
    echo "  status [dev]    Show service status"
    echo "  logs [service]  Show logs (optionally for specific service)"
    echo "  setup           Initial setup (create env, pull images, build)"
    echo "  clean           Remove all containers and volumes"
    echo "  help            Show this help message"
    echo
    echo "Examples:"
    echo "  $0 setup        # Initial setup"
    echo "  $0 start        # Start production services"
    echo "  $0 start dev    # Start development services"
    echo "  $0 logs api     # Show API logs"
    echo "  $0 status dev   # Show development service status"
}

# Main script logic
case "$1" in
    "setup")
        check_requirements
        create_env_file
        pull_images "$2"
        build_images "$2"
        log_success "Setup completed. Run '$0 start' to start services."
        ;;
    "start")
        check_requirements
        create_env_file
        pull_images "$2"
        build_images "$2"
        start_services "$2"
        sleep 10
        setup_ollama
        deploy_workflows
        show_access_info "$2"
        ;;
    "stop")
        stop_services "$2"
        ;;
    "restart")
        stop_services "$2"
        sleep 5
        start_services "$2"
        show_access_info "$2"
        ;;
    "status")
        show_status "$2"
        ;;
    "logs")
        show_logs "$2" "$3"
        ;;
    "clean")
        log_warning "This will remove all containers and volumes. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
            docker-compose -f "$DEV_COMPOSE_FILE" down -v --remove-orphans
            log_success "Cleanup completed"
        else
            log_info "Cleanup cancelled"
        fi
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

