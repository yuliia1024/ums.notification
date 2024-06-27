## User Management System - Microservice Notification

### Pre-requirements

- Docker installed locally. [Debian](https://docs.docker.com/engine/install/debian/)
  or [Ubuntu](https://docs.docker.com/engine/install/ubuntu/) or other distributive.
- Docker Compose installed locally [installation link](https://docs.docker.com/compose/install/).
- Clone [ums.user](https://github.com/yuliia1024/ums.user) repository:


### Installing

A step-by-step series of examples that tell you how to get a development env running.

- Copy the .env file and set up environment variables. Replace all 'xxx' with real credentials:

```bash
$ cp .env.sample .env
```

- Install global dependencies:

```bash
$ npm install -g @nestjs/cli typescript
```

## Running the app docker compose

```bash
$ cd ums.user

$ docker-compose up --build 
or 
$ docker-compose up --build -d
```

## Endpoint to create user
```bash
curl --location 'localhost:8080/users' \
--header 'Content-Type: application/json' \
--data-raw '{
    "firstName": "Test Namr",
    "lastName": "Test Last Name",
    "email": "test@mail.com",
    "password": "test!pass"
}'
```
