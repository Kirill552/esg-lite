#!/bin/bash

# 🚀 ESG-Lite Production Deployment Script
# Автоматизированный скрипт для развертывания в production

set -e  # Останавливаем выполнение при любой ошибке

# ============================================================================
# Конфигурация
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV=${1:-production}
BUILD_NUMBER=${CI_BUILD_NUMBER:-$(date +%Y%m%d-%H%M%S)}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-esg-lite}
IMAGE_TAG=${IMAGE_TAG:-latest}

echo "🚀 ESG-Lite Deployment Script"
echo "=================================="
echo "Environment: $DEPLOYMENT_ENV"
echo "Build Number: $BUILD_NUMBER"
echo "Image Tag: $IMAGE_TAG"
echo "Project Dir: $PROJECT_DIR"
echo ""

# ============================================================================
# Функции
# ============================================================================

log_info() {
    echo "ℹ️  [INFO] $1"
}

log_success() {
    echo "✅ [SUCCESS] $1"
}

log_error() {
    echo "❌ [ERROR] $1"
}

log_warning() {
    echo "⚠️  [WARNING] $1"
}

# Проверка требований
check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Проверяем Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Проверяем Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Проверяем Node.js (для билда)
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Проверяем .env файл
    if [[ ! -f "$PROJECT_DIR/.env.$DEPLOYMENT_ENV" ]]; then
        log_error ".env.$DEPLOYMENT_ENV file not found"
        log_info "Please create .env.$DEPLOYMENT_ENV file based on .env.production template"
        exit 1
    fi
    
    # Проверяем authorized_key.json
    if [[ ! -f "$PROJECT_DIR/authorized_key.json" ]]; then
        log_warning "authorized_key.json not found - Yandex Cloud Monitoring will be disabled"
    fi
    
    log_success "All requirements satisfied"
}

# Подготовка окружения
prepare_environment() {
    log_info "Preparing deployment environment..."
    
    cd "$PROJECT_DIR"
    
    # Копируем нужный .env файл
    cp ".env.$DEPLOYMENT_ENV" .env
    log_success "Environment variables configured for $DEPLOYMENT_ENV"
    
    # Создаем необходимые директории
    mkdir -p logs temp uploads
    
    # Устанавливаем зависимости
    log_info "Installing dependencies..."
    npm ci --only=production
    
    # Генерируем Prisma client
    log_info "Generating Prisma client..."
    npx prisma generate
    
    log_success "Environment prepared"
}

# Билд приложения
build_application() {
    log_info "Building application..."
    
    cd "$PROJECT_DIR"
    
    # Запускаем билд Next.js
    npm run build
    
    log_success "Application built successfully"
}

# Билд Docker образа
build_docker_image() {
    log_info "Building Docker image..."
    
    cd "$PROJECT_DIR"
    
    # Билдим образ с тегами
    docker build \
        --tag "$DOCKER_REGISTRY/esg-lite:$IMAGE_TAG" \
        --tag "$DOCKER_REGISTRY/esg-lite:$BUILD_NUMBER" \
        --label "build.number=$BUILD_NUMBER" \
        --label "build.environment=$DEPLOYMENT_ENV" \
        --label "build.date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        .
    
    log_success "Docker image built: $DOCKER_REGISTRY/esg-lite:$IMAGE_TAG"
}

# Тестирование Docker образа
test_docker_image() {
    log_info "Testing Docker image..."
    
    # Запускаем контейнер для тестирования
    CONTAINER_ID=$(docker run -d \
        --env NODE_ENV=production \
        --env DATABASE_URL="postgresql://test:test@localhost:5432/test" \
        "$DOCKER_REGISTRY/esg-lite:$IMAGE_TAG")
    
    # Ждем запуска
    sleep 10
    
    # Проверяем что контейнер запустился
    if docker ps | grep -q "$CONTAINER_ID"; then
        log_success "Docker container started successfully"
    else
        log_error "Docker container failed to start"
        docker logs "$CONTAINER_ID"
        docker rm -f "$CONTAINER_ID"
        exit 1
    fi
    
    # Очищаем тестовый контейнер
    docker rm -f "$CONTAINER_ID"
}

# Развертывание с Docker Compose
deploy_docker_compose() {
    log_info "Deploying with Docker Compose..."
    
    cd "$PROJECT_DIR"
    
    # Останавливаем предыдущую версию
    docker-compose -f docker-compose.prod.yml down
    
    # Запускаем новую версию
    docker-compose -f docker-compose.prod.yml up -d
    
    # Ждем запуска сервисов
    log_info "Waiting for services to start..."
    sleep 30
    
    # Проверяем статус сервисов
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log_success "Services deployed successfully"
    else
        log_error "Service deployment failed"
        docker-compose -f docker-compose.prod.yml logs
        exit 1
    fi
}

# Развертывание в Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    cd "$PROJECT_DIR"
    
    # Проверяем kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Обновляем образ в деплойменте
    kubectl set image deployment/esg-lite-web \
        esg-lite-web="$DOCKER_REGISTRY/esg-lite:$IMAGE_TAG" \
        -n esg-lite
    
    kubectl set image deployment/esg-lite-worker \
        esg-lite-worker="$DOCKER_REGISTRY/esg-lite:$IMAGE_TAG" \
        -n esg-lite
    
    # Ждем обновления
    kubectl rollout status deployment/esg-lite-web -n esg-lite --timeout=300s
    kubectl rollout status deployment/esg-lite-worker -n esg-lite --timeout=300s
    
    log_success "Kubernetes deployment completed"
}

# Проверка health check
verify_deployment() {
    log_info "Verifying deployment..."
    
    local max_attempts=30
    local attempt=1
    local health_url
    
    if [[ "$DEPLOYMENT_MODE" == "kubernetes" ]]; then
        # Для Kubernetes используем port-forward
        kubectl port-forward service/esg-lite-web-service 8080:80 -n esg-lite &
        PORT_FORWARD_PID=$!
        sleep 5
        health_url="http://localhost:8080/api/queue/health"
    else
        # Для Docker Compose
        health_url="http://localhost:3000/api/queue/health"
    fi
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s "$health_url" > /dev/null; then
            log_success "Health check passed"
            
            # Получаем детальную информацию
            curl -s "$health_url" | jq '.'
            
            # Останавливаем port-forward если использовался
            if [[ -n "$PORT_FORWARD_PID" ]]; then
                kill $PORT_FORWARD_PID
            fi
            
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    
    # Останавливаем port-forward если использовался
    if [[ -n "$PORT_FORWARD_PID" ]]; then
        kill $PORT_FORWARD_PID
    fi
    
    return 1
}

# Откат деплоя
rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    if [[ "$DEPLOYMENT_MODE" == "kubernetes" ]]; then
        kubectl rollout undo deployment/esg-lite-web -n esg-lite
        kubectl rollout undo deployment/esg-lite-worker -n esg-lite
    else
        # Для Docker Compose возвращаем предыдущую версию
        docker-compose -f docker-compose.prod.yml down
        docker run -d --name esg-lite-rollback \
            "$DOCKER_REGISTRY/esg-lite:previous" || true
    fi
    
    log_success "Rollback completed"
}

# Очистка старых образов
cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Удаляем образы старше 7 дней
    docker image prune -a --filter "until=168h" --force
    
    log_success "Old images cleaned up"
}

# ============================================================================
# Основная логика
# ============================================================================

main() {
    local deployment_mode=${2:-docker-compose}  # docker-compose или kubernetes
    
    echo "Deployment mode: $deployment_mode"
    echo ""
    
    # Проверяем аргументы
    if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
        echo "Usage: $0 [environment] [deployment_mode]"
        echo ""
        echo "Arguments:"
        echo "  environment      Target environment (default: production)"
        echo "  deployment_mode  Deployment method: docker-compose or kubernetes (default: docker-compose)"
        echo ""
        echo "Examples:"
        echo "  $0 production docker-compose"
        echo "  $0 staging kubernetes"
        echo ""
        exit 0
    fi
    
    DEPLOYMENT_MODE="$deployment_mode"
    
    # Выполняем шаги деплоя
    check_requirements
    prepare_environment
    build_application
    build_docker_image
    test_docker_image
    
    # Развертывание в зависимости от режима
    if [[ "$deployment_mode" == "kubernetes" ]]; then
        deploy_kubernetes
    else
        deploy_docker_compose
    fi
    
    # Проверяем результат
    if verify_deployment; then
        log_success "🎉 Deployment completed successfully!"
        echo ""
        echo "Services:"
        if [[ "$deployment_mode" == "kubernetes" ]]; then
            echo "  Web: https://esg-lite.example.com"
            echo "  Monitoring: kubectl port-forward service/esg-lite-web-service 8080:80 -n esg-lite"
        else
            echo "  Web: http://localhost:3000"
            echo "  Metrics: http://localhost:9090/metrics"
        fi
        echo ""
        
        # Очищаем старые образы
        cleanup_old_images
        
    else
        log_error "Deployment verification failed"
        
        # Предлагаем откат
        read -p "Do you want to rollback? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_deployment
        fi
        
        exit 1
    fi
}

# Запускаем основную функцию
main "$@"
