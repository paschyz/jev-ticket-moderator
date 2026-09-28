.PHONY: help install dev build test test-unit test-integration test-acceptance lint format typecheck architecture check

help:
	@echo "Targets:"
	@echo "  make install             Install dependencies"
	@echo "  make dev                 Run dev server"
	@echo "  make build               Build TypeScript"
	@echo "  make test                Run all tests"
	@echo "  make test-unit           Unit tests only"
	@echo "  make test-integration    Integration tests only"
	@echo "  make test-acceptance     Acceptance tests only"
	@echo "  make lint                Run ESLint"
	@echo "  make format              Format code with Prettier"
	@echo "  make typecheck           TypeScript strict check"
	@echo "  make architecture        Check dependency rules"
	@echo "  make check               Run all validations"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration

test-acceptance:
	npm run test:acceptance

lint:
	npm run lint

format:
	npm run format

typecheck:
	npm run typecheck

architecture:
	npm run architecture

check: typecheck lint architecture test
	@echo "All checks passed"
