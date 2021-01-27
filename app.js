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
  log.info(
    `Redirecting: '${request.method} ${request.protocol}://${request.get(
      "Host"
    )}${request.url}' to '${app.getRedirectUrl(request.url)}'.`
  );
  response.set(
    `x-kth-redirected-by`,
    `${about.dockerName}:${about.dockerVersion}`
  );
  if (process.env.REDIRECT_ID) {
    response.set(`x-kth-redirected-by-id`, `${process.env.REDIRECT_ID}`);
  }

  response.redirect(
    httpResponse.statusCodes.MOVED_PERMANENTLY,
    app.getRedirectUrl(request.url)
  );
});
