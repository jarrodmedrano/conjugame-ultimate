#!make
include .env
postgres:
	docker run --name postgres16 -p ${DATABASE_PORTS} -e POSTGRES_USER=${DATABASE_USER} -e POSTGRES_PASSWORD=${DATABASE_SECRET} -d postgres:16-alpine
createdb:
	docker exec -it postgres16 createdb --username=${DATABASE_USER} --owner=root ${DATABASE_NAME}
create:
	migrate create -ext sql -dir migration -seq init
dropdb:
	docker exec -it postgres16 dropdb ${DATABASE_NAME}
migrateup:
	migrate -path migration -database ${DATABASE_URL} -verbose up
migratedown:
	migrate -path migration -database ${DATABASE_URL} -verbose down
sqlc:
	sqlc generate
tunnel:
	ssh -N -L 127.0.0.1:5433:dokku-postgres-conjugame-db:5432 dokku@${DOKKU_SERVER} \
		-o ExitOnForwardFailure=yes \
		-o ServerAliveInterval=60 \
		-o ServerAliveCountMax=3 \
		-o StrictHostKeyChecking=yes


.PHONY: postgres createdb create dropdb migrateup migratedown sql