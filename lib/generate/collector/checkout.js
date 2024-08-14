/* global document, BASE_URL */

const merge = require('lodash.merge');

const logger = require('../../utils/logger');
const addHandlers = require('../addHandlers');
const collectModules = require('../collectModules');
const { blue, cyan, green, magenta, red, yellow } = require('colorette');
const chalk = require("chalk");
const {c} = require("puppeteer/lib/USKeyboardLayout");

const baseConfig = {
    url: {},
    name: 'checkout',
    modules: {},
};

/**
 * Prepares a bundle configuration for all modules loaded on cart and checkout pages.
 *
 * @param {BrowserContext} browserContext Puppeteer's BrowserContext object.
 * @param {object} configuration Generation configuration object.
 * @param {string} configuration.productUrl URL to the product page.
 * @param {string} configuration.authUsername Basic auth username.
 * @param {string} configuration.authPassword Basic auth password.
 */
const checkout = async (
    browserContext,
    generationConfig
) => {
    const homeUrl = generationConfig.homeUrl;
    const productUrl = generationConfig.productUrl;
    const bundleConfig = merge({}, baseConfig);
    const bundleName = bundleConfig.name;
    const page = await browserContext.newPage();
    const baseUrl = new URL(productUrl).origin + '/us/'

    addHandlers(page, generationConfig.homeUrl, generationConfig.loadExt);
    logger.log(chalk.blueBright(`⇒`) + ` Open home page "` + chalk.blueBright(homeUrl) + `"`);
    await page.goto(homeUrl, { waitUntil: 'networkidle0' })
        .catch(err => console.log(err));
    await page.evaluate(() => {
        document.querySelector('.products-grid button.tocart[type="submit"]').click();
        //how to wait while ajax request done here?

        console.log('test');
    });

    // Wait for the AJAX request to complete
    await page.waitForResponse(response =>
        response.url().includes('/checkout/cart/add/uenc') && response.status() === 200
    );

    logger.ready('Product added to cart successfully.');

    logger.log(chalk.blueBright(`⇒`) + ` Collecting checkout page "` + chalk.blueBright(`${baseUrl}checkout`) + `"`);
    await page.goto(`${baseUrl}checkout`, { waitUntil: 'networkidle0' })
        .catch(err => console.log(err));

    const checkoutModules = await collectModules(page, generationConfig.exclMods);

    merge(bundleConfig.modules, /* cartModules, */ checkoutModules);

    logger.debug(`page.close`);
    await page.close();

    logger.success(`Finished collecting modules for bundle "${bundleName}".\n`);

    return bundleConfig;
};

module.exports = checkout;
