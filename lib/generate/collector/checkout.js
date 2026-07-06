// eslint-disable-next-line no-unused-vars
/* global document */

const merge = require('lodash.merge');

const logger = require('../../utils/logger');
const addHandlers = require('../addHandlers');
const collectModules = require('../collectModules');
const chalk = require('chalk');

const baseConfig = {
    url: {},
    name: 'checkout',
    modules: {},
};

const isAddToCartResponse = (response) =>
    response.url().includes('/checkout/cart/add') && response.status() === 200;

/**
 * Adds a product to the cart straight from the product detail page.
 *
 * This is the universal path: every purchasable product has an add-to-cart
 * button on its own page, regardless of whether the store surfaces a
 * products-grid quick-add on the home page. Simple products add with a single
 * click (no options to choose).
 *
 * @param {Page} page Puppeteer page.
 * @param {string} productUrl URL to the product page.
 * @returns {Promise<boolean>} true when the product was added to the cart.
 */
const addFromProductPage = async (page, productUrl) => {
    if (!productUrl) {
        return false;
    }

    await page
        .goto(productUrl, { waitUntil: 'networkidle0' })
        .catch((err) => console.log(err));

    const button = await page.$('#product-addtocart-button');
    if (!button) {
        return false;
    }

    const addResponse = page.waitForResponse(isAddToCartResponse, {
        timeout: 30000,
    });
    await button.click();

    try {
        await addResponse;
    } catch (err) {
        return false;
    }

    return true;
};

/**
 * Legacy fallback: add the first product exposed by a products-grid quick-add
 * (e.g. featured products on the home page). Kept for stores that rely on it.
 *
 * @param {Page} page Puppeteer page.
 * @param {string} homeUrl URL rendering a products grid with quick add-to-cart.
 * @returns {Promise<boolean>} true when the product was added to the cart.
 */
const addFromProductsGrid = async (page, homeUrl) => {
    await page
        .goto(homeUrl, { waitUntil: 'networkidle0' })
        .catch((err) => console.log(err));

    const clicked = await page.evaluate(() => {
        const addToCart = document.querySelector(
            '.products-grid button.tocart[type="submit"]'
        );

        if (!addToCart) {
            return false;
        }

        addToCart.click();
        return true;
    });

    if (!clicked) {
        return false;
    }

    try {
        await page.waitForResponse(isAddToCartResponse, { timeout: 30000 });
    } catch (err) {
        return false;
    }

    return true;
};

/**
 * Prepares a bundle configuration for all modules loaded on cart and checkout pages.
 *
 * @param {BrowserContext} browserContext Puppeteer's BrowserContext object.
 * @param {object} generationConfig Generation configuration object.
 * @param {string} generationConfig.homeUrl Store home URL (also the store base).
 * @param {string} generationConfig.productUrl URL to a purchasable product page.
 */
const checkout = async (browserContext, generationConfig) => {
    const homeUrl = generationConfig.homeUrl;
    const productUrl = generationConfig.productUrl;
    const bundleConfig = merge({}, baseConfig);
    const bundleName = bundleConfig.name;
    const page = await browserContext.newPage();

    addHandlers(page, homeUrl, generationConfig.loadExt);

    logger.log(chalk.blueBright(`⇒`) + ` Adding a product to the cart`);

    // Prefer the product page (works on any store); fall back to the legacy
    // home-page products-grid quick-add.
    let added = await addFromProductPage(page, productUrl);
    if (!added) {
        added = await addFromProductsGrid(page, homeUrl);
    }

    if (!added) {
        logger.error('Add to cart button not found.');
        await page.close();
        return false;
    }

    logger.ready('Product added to cart successfully.');

    // Derive the checkout URL from the store base (homeUrl) instead of a
    // hardcoded store-view path, so it works on any store view.
    const storeBase = homeUrl.endsWith('/') ? homeUrl : `${homeUrl}/`;
    const checkoutUrl = new URL('checkout', storeBase).href;

    logger.log(
        chalk.blueBright(`⇒`) +
            ` Collecting checkout page "` +
            chalk.blueBright(checkoutUrl) +
            `"`
    );

    await page
        .goto(checkoutUrl, { waitUntil: 'networkidle0' })
        .catch((err) => console.log(err));

    const checkoutModules = await collectModules(
        page,
        generationConfig.exclMods
    );

    merge(bundleConfig.modules, checkoutModules);

    logger.debug(`page.close`);
    await page.close();

    logger.success(`Finished collecting modules for bundle "${bundleName}".\n`);

    return bundleConfig;
};

module.exports = checkout;
