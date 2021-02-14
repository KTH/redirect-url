# Redirect url ![alt text](https://api.travis-ci.org/KTH/redirect-url.svg?branch=master)

Redirect a url to another absolute or relative url

```bash
TO_HOST='https://wwww.kth.se' REDIRECT_ID='Id added to header x-kth-redirected-by-id' node app.js

```

## Unit tests

https://travis-ci.org/KTH/redirect-url

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
