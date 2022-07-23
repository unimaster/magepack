const merge = require('lodash.merge');

const logger = require('../../utils/logger');
const addHandlers = require('../addHandlers');
const collectModules = require('../collectModules');

const baseConfig = {
    url: '',
    name: 'category',
    modules: {},
};

/**
 * Prepares a bundle configuration for all modules loaded on category page.
 *
 * @param {BrowserContext} browserContext Puppeteer's BrowserContext object.
 * @param {object} configuration Generation configuration object.
 * @param {string} configuration.categoryUrl URL to the category page.
 * @param {string} configuration.authUsername Basic auth username.
 * @param {string} configuration.authPassword Basic auth password.
 */
const category = async (
    browserContext,
    { categoryUrl, authUsername, authPassword, exclMods }
) => {
    const bungleConfig = merge({}, baseConfig);

    const bundleName = bungleConfig.name;

    logger.info(`Collecting modules for bundle "${bundleName}".`);

    const page = await browserContext.newPage();
    addHandlers(page);

    await page.goto(categoryUrl, {
        waitUntil: 'networkidle0',
    }).catch(err => {
        console.log('GOTO CATCH');
        console.log(err);
    });

    merge(bungleConfig.modules, await collectModules(page, exclMods));

    await page.close();

    logger.success(`Finished collecting modules for bundle "${bundleName}".`);

    return bungleConfig;
};

module.exports = category;
