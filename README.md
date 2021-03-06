# Redirect url [![CircleCI](https://circleci.com/gh/KTH/redirect-url.svg?style=svg)](https://circleci.com/gh/KTH/redirect-url)  ![Continous Integration](https://github.com/KTH/redirect-url/actions/workflows/main.yml/badge.svg)

Redirect a url to another absolute or relative url.

## Examples

In these examples the redirect will listen for all requests to https://example.com/

### Redirect any path to another host

```bash
TO_HOST='https://wwww.kth.se' node app.js
```

https://example.com/some/path/ -> https://kth.se/some/path/

### Redirect and replace a part of the path when redirecting

```bash
TO_HOST='https://wwww.kth.se' REPLACE_PATH="/some/path/" REPLACE_PATH_WITH="/new/app/" node app.js
```

https://example.com/some/path/index.html -> https://kth.se/new/app/index.html

### Redirect a path in a Traefik 2 cluster.

https://example.com/some/path/index.html -> https://kth.se/new/app/index.html

```yml
environment:
  TO_HOST: "https://www.kth.se"
  REPLACE_PATH: "/some/path/"
  REPLACE_PATH_WITH: "/new/app/"
  TEMPORARY_REDIRECT: "true"
  REDIRECT_ID: "Test-redirect added by team awesome"

labels:
  - "traefik.http.routers.app1.rule=PathPrefix(`/some/`)"
  - "traefik.http.services.app1.loadbalancer.server.port=80"
  - "traefik.enable=true"
```

## Configuration

`curl -I https://exapmpel.com/katalog/sf1624`

```bash
x-frame-options: sameorigin
x-kth-redirect-id: Test-redirect added by team awesome
x-kth-redirected-by: redirect-url:0.0.16_2b06f76
```

### REDIRECT_ID

Add an enviroment variable `REDIRECT_ID` to add a HTTP header with information who/what made the redirect `x-kth-redirect-id: Ticket #1234567`.

### TEMPORARY_REDIRECT

The default redirect is a **Permanent Redirect**. To make the redirect temporary set `TEMPORARY_REDIRECT="True"`. Note that a temporary redirect is normally only a good thing during testing, since it messes upp your SEO score. Search crawlers does not follow _HTTP 307 Temporary Redirect_.

### LOG_LEVEL

The default log level is `warning`. Posible values are INFO, DEBUG, SEVERE. Change by setting `LOG_LEVEL="debug"`.

### PORT

The default listen port is 80 change by setting `PORT=8080`.

### Healthcheck paths

A redirect has two healtchecks paths built in that are not redirected. `/_about` and `/_monitor`
So if your redirect-url app listens on https://example.com/ https://example.com/_monitor and https://example.com/_about will not redirect, but any other path will.

## Unit tests

### In Docker

Run tests inside the :whale: Docker container using `npm run test-unit-in-docker`. The script build the Docker container according to _Dockerfile_ and then mounts the `/tests` catalog into it, and runs `npm test` inside the container. No dependencies other then Docker needed.

Run test directly `npm install` and then `npm test` in your development setup to run unit tests.

```text

Redirect.

    ✓ You can specify an absolute url (i.e: https://www.kth.se/my-path/) to redirect all traffic to
    ✓ You can specify a relative url  (i.e: /my-path/) to redirect all traffic to

```

### Integration tests in Docker

Run integration tests against the service running as a :whale: Docker container using `npm run test-integration-in-docker`. The script build the Docker container according to _Dockerfile_ and then starts another image that runs a _curl_-command against the service.

### Run end-to-end integration tests locally.

1. Start the service `npm run start-dev`
2. Run `npm run test-integration`. This will run the same tests as _npm run test-integratoin-in-docker_.

```text
 • Default check APPLICATION_STATUS: OK.
 • The about page should show Docker images information.
```
