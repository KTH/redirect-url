const appInsights = require("applicationinsights");
const logger = require("./logger");

/**
 * Use app insights if env APPINSIGHTS_INSTRUMENTATIONKEY is set
 */

const use = () => {
  return process.env.APPINSIGHTS_INSTRUMENTATIONKEY ? true : false;
};

/**
 * Init a Azure Application Insights if a key is passed as env APPINSIGHTS_INSTRUMENTATIONKEY
 */

const init = () => {
  if (use()) {
    appInsights
      .setup()
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .start();
    logger.log.info(
      `Using Application Ingsights: '${process.env.APPINSIGHTS_INSTRUMENTATIONKEY}'.`
    );
  } else {
    logger.log.info(`Application Ingsights not used.`);
  }
};

/**
 * Module exports
 */
module.exports = {
  use: use,
  init: init,
};
