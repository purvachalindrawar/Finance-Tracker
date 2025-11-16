.PHONY: dev migrate seed build backend frontend

backend:
	npm --prefix backend install

frontend:
	npm --prefix frontend install

dev-backend:
	npm --prefix backend run dev

dev-frontend:
	npm --prefix frontend run dev

migrate:
	cd backend && npx prisma migrate dev --name init

seed:
	npm --prefix backend run seed

build:
	npm --prefix backend run build && npm --prefix frontend run build
