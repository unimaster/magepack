const merge = require('lodash.merge');

const logger = require('../../utils/logger');
const addHandlers = require('../addHandlers');
const collectModules = require('../collectModules');
const chalk = require("chalk");

const baseConfig = {
    url: [],
    name: 'product',
    modules: {},
};

/**
 * Prepares a bundle configuration for all modules loaded on product pages.
 *
 * @param {BrowserContext} browserContext Puppeteer's BrowserContext object.
 * @param {object} configuration Generation configuration object.
 * @param {string} configuration.productUrl URL to the product page.
 * @param {string} configuration.authUsername Basic auth username.
 * @param {string} configuration.authPassword Basic auth password.
 */
const product = async (
    browserContext,
    { productUrl, authUsername, authPassword , exclMods}
) => {
    const bundleConfig = merge({}, baseConfig);
    const bundleName = bundleConfig.name;
    const page = await browserContext.newPage();

    addHandlers(page, productUrl);
    logger.log(chalk.blueBright(`⇒`) + ` Collecting product page "` + chalk.blueBright(productUrl) + `"`);
    await page.goto(productUrl, { waitUntil: 'networkidle0' })
        .catch(err => console.log(err));

    merge(bundleConfig.modules, await collectModules(page, exclMods));

    await page.close();

    logger.success(`Finished collecting modules for bundle "${bundleName}".\n`);

    return bundleConfig;
};

module.exports = product;
