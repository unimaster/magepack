const merge = require('lodash.merge');
const clone = require('lodash.clone');

const logger = require('../../utils/logger');
const addHandlers = require('../addHandlers');
const collectModules = require('../collectModules');
const chalk = require('chalk');

const baseConfig = {
    url: '',
    name: 'cms',
    modules: {},
    pages: ['']
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
const cms = async (browserContext, { homeUrl, authUsername, authPassword , exclMods, pages}) => {
    const bundleConfig = merge({}, baseConfig);
    if (pages) {
        pages = pages.split(',');
        baseConfig.pages = baseConfig.pages.concat(pages);
    }

    const bundleName = bundleConfig.name;
    const page = await browserContext.newPage();
    addHandlers(page, homeUrl);
    // await authenticate(page, homeUrl, authUsername, authPassword);

    let $pages = [];
    for (const url of baseConfig.pages) {
        logger.log(chalk.blueBright(`⇒`) + ` Collecting page "` + chalk.blueBright(homeUrl + url) + `"`);

        await page.goto(homeUrl + url, { waitUntil: 'networkidle0' })
            .catch(err => console.log(err));

        let name = url;
        if (!name) {
            name = 'cms';
        }

        name = name.endsWith('/') ? name.slice(0, -1) : name;
        name = name.replace(/\//gi, '_');
        let $page = {
            url: url,
            name: name,
            modules: await collectModules(page, exclMods),
        }

        logger.log();
        $pages.push($page);
    }

    await page.close();
    logger.success(`Finished collecting modules for bundle "${bundleName}".\n`);
    logger.log(``);
    return $pages;
};

module.exports = cms;
