const { templates } = require("@kth/basic-html-templates");
const appInsights = require("applicationinsights");
const express = require("express");
const os = require("os");
const httpResponse = require("@kth/http-responses");
const about = require("./config/version");
const { log } = require("./modules/logger");
const defaultEnvs = require("@kth/default-envs");
const applicationInsights = require("./modules/applicationInsights");
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
  if (requestUrl.startsWith("/")) {
    return process.env.TO_URL + requestUrl;
  } else {
    return process.env.TO_URL + "/" + requestUrl;
  }
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
/********************* routes **************************/

/**
 * About page. Versions and such.
 */
app.get("/_about", function (request, response) {
  httpResponse.ok(request, response, templates._about(about, started));
});

/**
 * Health check route.
 */
app.get("/_monitor", function (request, response) {
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
  url = app.getRedirectUrl(request.url);
  log.info(
    `Redirecting: '${request.method} ${request.protocol}://${request.get(
      "Host"
    )}${request.url}' to '${url}'.`
  );
  response.set(
    `X-KTH-redirected-by`,
    `${about.dockerName}:${about.dockerVersion}`
  );
  if (process.env.REDIRECT_ID) {
    response.set(`X-KTH-redirected-by-id`, `${process.env.REDIRECT_ID}`);
  }

  if (app.useTemporaryRedirect()) {
    httpResponse.temporaryRedirect(response), url;
  } else {
    httpResponse.permanentRedirect(response, url);
  }
});
