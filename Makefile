COMPOSE := docker compose
BACKEND_SERVICES := backend
ALL_SERVICES := backend frontend

.DEFAULT_GOAL := help

.PHONY: help config build up up-all up-backend down restart restart-backend \
	ps logs logs-backend backend-logs frontend-logs \
	backend-shell frontend-shell backend-install frontend-install \
	backend-test backend-lint frontend-lint check clean

help: ## Muestra los comandos disponibles
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-20s %s\n", $$1, $$2}'

config: ## Valida la configuración de Docker Compose
	@$(COMPOSE) config --quiet

build: ## Construye las imágenes de backend y frontend
	@$(COMPOSE) build $(ALL_SERVICES)

up: up-all ## Levanta backend y frontend

up-all: ## Levanta backend y frontend
	@$(COMPOSE) up -d --build $(ALL_SERVICES)

up-backend: ## Levanta únicamente el backend y su red
	@$(COMPOSE) up -d --build $(BACKEND_SERVICES)

down: ## Detiene y elimina los contenedores y la red
	@$(COMPOSE) down --remove-orphans

restart: ## Reinicia backend y frontend
	@$(COMPOSE) down --remove-orphans
	@$(COMPOSE) up -d --build $(ALL_SERVICES)

restart-backend: ## Reinicia únicamente el backend
	@$(COMPOSE) restart $(BACKEND_SERVICES)

ps: ## Muestra el estado de los servicios
	@$(COMPOSE) ps

logs: ## Sigue los logs de todos los servicios
	@$(COMPOSE) logs -f --tail=100

logs-backend: backend-logs ## Alias para los logs del backend

backend-logs: ## Sigue los logs del backend
	@$(COMPOSE) logs -f --tail=100 backend

frontend-logs: ## Sigue los logs del frontend
	@$(COMPOSE) logs -f --tail=100 frontend

backend-shell: ## Abre una terminal dentro del backend
	@$(COMPOSE) exec backend sh

frontend-shell: ## Abre una terminal dentro del frontend
	@$(COMPOSE) exec frontend sh

backend-install: ## Sincroniza las dependencias del backend
	@$(COMPOSE) exec backend yarn install --frozen-lockfile

frontend-install: ## Sincroniza las dependencias del frontend
	@$(COMPOSE) exec frontend yarn install --frozen-lockfile

backend-test: ## Ejecuta las pruebas unitarias del backend
	@$(COMPOSE) exec backend yarn test

backend-lint: ## Ejecuta ESLint en el backend
	@$(COMPOSE) exec backend yarn lint

frontend-lint: ## Ejecuta ESLint en el frontend
	@$(COMPOSE) exec frontend yarn lint

check: backend-test backend-lint frontend-lint ## Ejecuta las verificaciones principales

clean: ## Elimina contenedores y volúmenes locales de dependencias
	@$(COMPOSE) down --volumes --remove-orphans
