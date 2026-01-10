#!/bin/bash

# JTIK Project - Docker Management Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

case "$1" in
    start)
        print_header "Starting JTIK Project with Docker"
        docker-compose up -d
        sleep 5
        print_success "All services started!"
        echo ""
        print_info "Services:"
        echo "  🗄️  MongoDB:  mongodb://localhost:27017/jtik"
        echo "  🖥️  Server:   http://localhost:3001"
        echo "  🌐 Client:   http://localhost:5173"
        echo ""
        print_info "Logs: ./docker.sh logs"
        ;;
    
    stop)
        print_header "Stopping JTIK Project"
        docker-compose down
        print_success "All services stopped"
        ;;
    
    restart)
        print_header "Restarting JTIK Project"
        docker-compose restart
        print_success "All services restarted"
        ;;
    
    build)
        print_header "Building JTIK Project"
        docker-compose build --no-cache
        print_success "Build complete"
        ;;
    
    logs)
        if [ -z "$2" ]; then
            print_info "Showing logs for all services (Ctrl+C to exit)"
            docker-compose logs -f
        else
            print_info "Showing logs for $2"
            docker-compose logs -f "$2"
        fi
        ;;
    
    status)
        print_header "JTIK Project Status"
        docker-compose ps
        ;;
    
    clean)
        print_header "Cleaning JTIK Project"
        print_info "Stopping and removing containers..."
        docker-compose down
        print_info "Removing volumes (database data will be lost)..."
        docker-compose down -v
        print_success "Cleanup complete"
        ;;
    
    shell)
        if [ -z "$2" ]; then
            print_error "Please specify service: mongodb, server, or client"
            exit 1
        fi
        case "$2" in
            mongodb)
                docker exec -it jtik-mongodb mongosh jtik
                ;;
            server)
                docker exec -it jtik-server sh
                ;;
            client)
                docker exec -it jtik-client sh
                ;;
            *)
                print_error "Unknown service: $2"
                exit 1
                ;;
        esac
        ;;
    
    test)
        print_header "Testing JTIK APIs"
        
        echo "Testing health endpoint..."
        curl -s http://localhost:3001/api/health | python3 -m json.tool
        echo ""
        
        echo "Testing customers endpoint..."
        curl -s http://localhost:3001/api/shopee/customers | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Total customers: {data['total']}\")"
        echo ""
        
        print_success "API tests complete"
        ;;
    
    *)
        print_header "JTIK Docker Management"
        echo "Usage: $0 {command} [options]"
        echo ""
        echo "Commands:"
        echo "  start          Start all services"
        echo "  stop           Stop all services"
        echo "  restart        Restart all services"
        echo "  build          Rebuild all images"
        echo "  logs [service] Show logs (all or specific service)"
        echo "  status         Show service status"
        echo "  clean          Stop and remove all containers and volumes"
        echo "  shell {service} Open shell in service (mongodb|server|client)"
        echo "  test           Test APIs"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs server"
        echo "  $0 shell mongodb"
        exit 1
        ;;
esac
