const merge = require('lodash.merge');

const logger = require('../../utils/logger');
const authenticate = require('../authenticate');
const collectModules = require('../collectModules');

const baseConfig = {
    url: 'faq',
    name: 'faq',
    modules: {},
};

/**
 * Prepares a bundle configuration for all modules loaded on CMS pages.
 *
 * @param {BrowserContext} browserContext Puppeteer's BrowserContext object.
 * @param {object} configuration Generation configuration object.
 * @param {string} configuration.cmsUrl URL to the CMS page.
 * @param {string} configuration.authUsername Basic auth username.
 * @param {string} configuration.authPassword Basic auth password.
 */
const cms = async (browserContext, { cmsUrl, authUsername, authPassword , exclMods}) => {
    let faqUrl = cmsUrl + baseConfig.url;

    const bundleConfig = merge({}, baseConfig);

    const bundleName = bundleConfig.name;

    logger.info(`Collecting modules for bundle "${bundleName}".`);

    const page = await browserContext.newPage();

    await authenticate(page, authUsername, authPassword);

    await page.goto(faqUrl, { waitUntil: 'networkidle0' });

    merge(bundleConfig.modules, await collectModules(page, exclMods));

    await page.close();

    logger.success(`Finished collecting modules for bundle "${bundleName}".`);

    return bundleConfig;
};

module.exports = cms;
