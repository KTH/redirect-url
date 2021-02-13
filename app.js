const { templates } = require("@kth/basic-html-templates");
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
    REDIRECT_ID: "No redirect id specified",
    TEMPORARY_REDIRECT: false,
  },
  log
);

/**
 * Start the server on configured port.
 */
app.listen(process.env.PORT, function () {
  app.cleanToUrl();
  log.info(
    `Started '${about.dockerName}:${
      about.dockerVersion
    }' on '${os.hostname()}:${process.env.PORT}'`
  );
  applicationInsights.init();
});

/**
 * Remove the last forward slash if present and update the TO_URL env.
 */
app.cleanToUrl = function () {
  if (process.env.TO_URL.endsWith("/")) {
    process.env["TO_URL"] = process.env["TO_URL"].slice(0, -1);
  }
};

/**
 * Gets the absolute url to redirect to.
 * @param {*} requestUrl The path to redirect.
 */
app.getRedirectUrl = function (requestUrl) {
  return process.env.TO_URL + requestUrl;
};

/**
 * Is the env TEMPORARY_REDIRECT the string true
 */
app.useTemporaryRedirect = function () {
  if (String(process.env.TEMPORARY_REDIRECT).toLowerCase() == "true") {
    return true;
  }
  log.debug(
    `Will not use temporary redirect since env TEMPORARY_REDIRECT is not 'true' ${process.env.TEMPORARY_REDIRECT}'.`
  );
  return false;
};

/********************* routes **************************/

/**
 * Redirect all traffic that does not end with '/_monitor' or '/_about'.
 */
app.use(function (request, response) {
  let url = app.getRedirectUrl(request.url);

  if (process.env.REDIRECT_ID) {
    response.set(`X-KTH-redirect-id`, `${process.env.REDIRECT_ID}`);
  }

  if (url.endsWith("/_about")) {
    httpResponse.ok(request, response, templates._about(about, started));
    return;
  }

  if (url.endsWith("/_monitor")) {
    httpResponse.ok(
      request,
      response,
      templates._monitor((status = "OK")),
      httpResponse.contentTypes.PLAIN_TEXT
    );
    return;
  }

  response.set(
    `X-KTH-redirected-by`,
    `${about.dockerName}:${about.dockerVersion}`
  );

  if (app.useTemporaryRedirect()) {
    log.info(`Temporary redirect request for '${request.url}' to '${url}'`);
    httpResponse.temporaryRedirect(response, url);
  } else {
    log.info(`Permanent redirect request for '${request.url}' to '${url}'`);
    httpResponse.permanentRedirect(response, url);
  }
});
