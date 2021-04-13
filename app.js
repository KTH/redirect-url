const { templates } = require("@kth/basic-html-templates");
const express = require("express");
const os = require("os");
const httpResponse = require("@kth/http-responses");
const about = require("./config/version");
const { log } = require("./modules/logger");
const defaultEnvs = require("@kth/default-envs");
const applicationInsights = require("./modules/applicationInsights");
const e = require("express");
const app = express();
const started = new Date();

/**
 * Response headers set by this application.
 */
const headers = {
  X_KTH_REDIRECT_ID: "X-KTH-redirect-id",
  X_KTH_REDIRECED_BY: "X-KTH-redirected-by",
};

/**
 * Let the package @kth/http-responses use the Redirect-url log.
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
    TO_HOST: "https://www.kth.se",
    REDIRECT_ID: "No redirect id specified",
    TEMPORARY_REDIRECT: false,
    REPLACE_PATH: undefined,
    REPLACE_PATH_WITH: undefined,
    REMOVE_PATH_AFTER: undefined,
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
 * Remove the last forward slash if present and update the TO_HOST env.
 */
app.cleanToUrl = function () {
  if (process.env.TO_HOST.endsWith("/")) {
    process.env["TO_HOST"] = process.env["TO_HOST"].slice(0, -1);
  }
};

/**
 * Gets the absolute url to redirect to, also replaces any part of the
 * url that matches REPLACE_PATH with REPLACE_PATH_WITH.
 * @param {*} requestUrl The path to redirect.
 */
app.getRedirectToUrl = function (requestUrl) {
  let result = process.env.TO_HOST + requestUrl;

  // Remove part of a path
  // I.e: REPLACE_PATH='/some/' REPLACE_PATH_WITH='other'
  // example.com/some/path/index.html -> domain.com/other/path/index.html
  if (process.env.REPLACE_PATH) {
    if (process.env.REPLACE_PATH_WITH) {
      result = result.replace(
        process.env.REPLACE_PATH,
        process.env.REPLACE_PATH_WITH
      );
    }
  }
  // Remove anything after a path
  // I.e: REMOVE_PATH_AFTER='/some/'
  // example.com/some/path/index.html -> domain.org/some/
  if (process.env.REMOVE_PATH_AFTER === undefined) {
    const truncatAfter =
      result.indexOf(process.env.REMOVE_PATH_AFTER) +
      process.env.REMOVE_PATH_AFTER.length;
    result = result.substring(0, truncatAfter);
  }

  return result;
};

/**
 * Is the env TEMPORARY_REDIRECT the string "true".
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

/**
 * Add the header X-KTH-redirect-id
 */
app.addHeaderRedirectId = function (response) {
  if (process.env.REDIRECT_ID) {
    response.set(headers.X_KTH_REDIRECT_ID, `${process.env.REDIRECT_ID}`);
  }
};

/**
 * Add the header X-KTH-redirected-by
 */
app.addHeaderRedirectedBy = function (response) {
  response.set(
    headers.X_KTH_REDIRECED_BY,
    `${about.dockerName}:${about.dockerVersion}`
  );
};

/**
 * Show a page containing information about the application.
 * @param {*} request
 * @param {*} response
 */
app.handleAbout = function (request, response) {
  httpResponse.ok(request, response, templates._about(about, started));
};

/**
 * Show a health monitor page. Always contains "APPLICATION_STATUS: OK" if the service works.
 * @param {*} request
 * @param {*} response
 */
app.handleMonitor = function (request, response) {
  let url = app.getRedirectToUrl(request.url).replace("_monitor", "");

  let extras = `REDIRECT ID: ${process.env.REDIRECT_ID}\n`;
  extras += `REDIRECTS TO: ${url}`;

  httpResponse.ok(
    request,
    response,
    templates._monitor((status = "OK"), extras),
    httpResponse.contentTypes.PLAIN_TEXT
  );
};

/**
 * Check for previously set headers that indicate a possible redirect loop.
 * In other words, the request was forwared by an ontehr redirect-url application.
 *
 * @param {*} request
 * @param {*} toUrl
 */
app.handlePossibleRedirectLoop = function (request, toUrl) {
  const redirectId = request.header(headers.X_KTH_REDIRECT_ID);
  if (redirectId) {
    log.warn(
      `Found previously set '${headers.X_KTH_REDIRECT_ID}' header with value '${redirectId}', possible redirect loop for '${toUrl}'?`
    );
  }
};

/********************* routes **************************/

/**
 * Redirect all traffic that does not end with '/_monitor' or '/_about'.
 */
app.use(function (request, response) {
  let toUrl = app.getRedirectToUrl(request.url);

  app.handlePossibleRedirectLoop(request, toUrl);

  app.addHeaderRedirectId(response);

  if (request.url.endsWith("/_about")) {
    app.handleAbout(request, response);
    return;
  }

  if (request.url.endsWith("/_monitor")) {
    app.handleMonitor(request, response);
    return;
  }

  app.addHeaderRedirectedBy(response);

  if (app.useTemporaryRedirect()) {
    httpResponse.temporaryRedirect(response, toUrl);
    log.info(`Temporary redirected request for '${request.url}' to '${toUrl}'`);
  } else {
    httpResponse.permanentRedirect(response, toUrl);
    log.info(`Permanent redirected request for '${request.url}' to '${toUrl}'`);
  }
});
