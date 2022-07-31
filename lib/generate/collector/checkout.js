/* global document, BASE_URL */

const merge = require('lodash.merge');

const logger = require('../../utils/logger');
const addHandlers = require('../addHandlers');
const collectModules = require('../collectModules');
const { blue, cyan, green, magenta, red, yellow } = require('colorette');

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
    const productUrl = generationConfig.productUrl;
    const bundleConfig = merge({}, baseConfig);
    const bundleName = bundleConfig.name;
    const page = await browserContext.newPage();
    const baseUrl = new URL(productUrl).origin + '/us/'

    addHandlers(page, generationConfig.productUrl, generationConfig.loadExt);

    await page.goto(productUrl, { waitUntil: 'networkidle0' })
        .catch(err => console.log(err));

    // Select option for every swatch if there are any.
    await page.evaluate(() => {
        const swatches = document.querySelectorAll(
            '.product-options-wrapper .swatch-attribute'
        );
        Array.from(swatches).forEach((swatch) => {
            const swatchOption = swatch.querySelector(
                '.swatch-option:not([disabled])'
            );
            swatch.querySelector('.swatch-input').value =
                swatchOption.getAttribute('option-id') ||
                swatchOption.getAttribute('data-option-id');
        });

        if (swatches.length) {
            return;
        }

        Array.from(
            document.querySelectorAll(
                '.product-options-wrapper .super-attribute-select'
            )
        ).forEach((select) => {
            select.value = Array.from(select.options).reduce(
                (selectedValue, option) => {
                    return (
                        selectedValue ||
                        (option.value ? option.value : selectedValue)
                    );
                },
                null
            );
        });
    });

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.evaluate(() =>
            document.querySelector('#product_addtocart_form').submit()
        ),
    ]);

    await page.goto(`${baseUrl}checkout`, { waitUntil: 'networkidle0' })
        .catch(err => console.log(err));

    const checkoutModules = await collectModules(page, generationConfig.exclMods);

    merge(bundleConfig.modules, /* cartModules, */ checkoutModules);

    logger.debug(`page.close`);
    await page.close();

    logger.success(`Finished collecting modules for bundle "${bundleName}".`);

    return bundleConfig;
};

module.exports = checkout;
