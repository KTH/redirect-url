const { templates } = require("@kth/basic-html-templates");
const appInsights = require("applicationinsights");
const express = require("express");
const os = require("os");
const httpResponse = require("@kth/http-responses");
const about = require("./config/version");
const { log } = require("./modules/logger");
const defaultEnvs = require("@kth/default-envs");
const applicationInsights = require("./modules/applicationInsights");
const { url } = require("inspector");
const app = express();
const started = new Date();

/**
 * Let the package @kth/http-responses use the Tamarack log.
 */
httpResponse.setLogger(log);

/**
 * Process env:s that are not configured on start up, but accessed
 * as envs in the application are added with there default values.
 *
 * They are also logged.
 *
 * This way you will always have a value for process.env.X
 */
defaultEnvs.set(
  {
    APPLICATION_NAME: "Redirect URL",
    LOG_LEVEL: "warning",
    PORT: 80,
    TO_URL: "https://www.kth.se",
    PATH_PREFIX: "some-path",
    REDIRECT_ID: "",
    TEMPORARY_REDIRECT: false,
  },
  log
);

/**
 * Start the server on configured port.
 */
app.listen(process.env.PORT, function () {
  log.info(
    `Started '${about.dockerName}:${
      about.dockerVersion
    }' on '${os.hostname()}:${process.env.PORT}'`
  );
  applicationInsights.init();
});

app.getRedirectUrl = function (requestUrl) {
  log.info(`requestUrl '${requestUrl}'.`);
  let result = process.env.TO_URL + requestUrl;
  if (requestUrl.startsWith("/")) {
    result = process.env.TO_URL + requestUrl.substring(1);
  }
  log.debug(`Redirect to url '${result}'.`);
  return result;
};

/**
 * Is the env TEMPORARY_REDIRECT the string true
 */
app.useTemporaryRedirect = function () {
  if (String(process.env.TEMPORARY_REDIRECT).toLowerCase() == "true") {
    return true;
  }
  return false;
};

/**
 * Is the env TEMPORARY_REDIRECT the string true
 */
app.getPathPrefix = function () {
  let result = process.env.PATH_PREFIX;
  if (process.env.PATH_PREFIX.startsWith("/")) {
    result = process.env.PATH_PREFIX.substring(1);
  }

  log.debug(`Use path prefix '${result}'.`);
  return result;
};

/********************* routes **************************/

/**
 * About page. Versions and such. Has to start with / for some reason to make Express
 * accept it as a path.
 */
app.get(`/${app.getPathPrefix()}/_about`, function (request, response) {
  console.log(JSON.stringify(request.headers));
  httpResponse.ok(request, response, templates._about(about, started));
});

/**
 * Health check route. Has to start with / for some reason to make Express
 * accept it as a path.
 */
app.get(`/${app.getPathPrefix()}/_monitor`, function (request, response) {
  console.log(JSON.stringify(request.headers));
  httpResponse.ok(
    request,
    response,
    templates._monitor((status = "OK")),
    httpResponse.contentTypes.PLAIN_TEXT
  );
});

/**
 * Redirect all traffic
 */
app.use(function (request, response) {
  console.log(JSON.stringify(request.headers));

  let url = app.getRedirectUrl(request.url);
  response.set(
    `X-KTH-redirected-by`,
    `${about.dockerName}:${about.dockerVersion}`
  );
  if (process.env.REDIRECT_ID) {
    response.set(`X-KTH-redirected-by-id`, `${process.env.REDIRECT_ID}`);
  }

  if (app.useTemporaryRedirect()) {
    log.info(`Temporary redirect request for '${request.url}' to '${url}'`);
    httpResponse.temporaryRedirect(response), url;
  } else {
    log.info(`Permanent redirect request for '${request.url}' to '${url}'`);
    httpResponse.permanentRedirect(response, url);
  }
});
