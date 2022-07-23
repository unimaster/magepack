const puppeteer = require('puppeteer');
const { stringify } = require('javascript-stringify');
const fs = require('fs');
const path = require('path');
const merge = require('lodash.merge');

const logger = require('./utils/logger');
const collectors = require('./generate/collector');
const extractCommonBundle = require('./generate/extractCommonBundle');

module.exports = async (generationConfig) => {
    logger.debug('Start timer');

    let $timer = Date.now();
    const browser = await puppeteer.launch({
        headless: generationConfig.headless,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--unhandled-rejections=strict'],
        defaultViewport: { width: 412, height: 732 },
        ignoreHTTPSErrors: true,
        // dumpio: true,
    });

    const browserContext = await browser.createIncognitoBrowserContext();

    logger.info('Collecting bundle modules in the browser.');

    let bundles = [];
    for (const collectorName in collectors) {
        // if (collectorName !== 'checkout') {
        //     continue;
        // }

        let collected = await collectors[collectorName](browserContext, generationConfig);
        if (collected) {
            if (Array.isArray(collected)) {
               merge(bundles, collected);
            } else {
                bundles.push(collected);
            }
        }
    }
// console.log(bundles);

    logger.debug('Finished, closing the browser.');

    await browser.close();

    logger.debug('Extracting common module...');

    bundles = extractCommonBundle(bundles);

    logger.success('Done, outputting following modules:');

    bundles.forEach((bundle) => {
        logger.success(
            `${bundle.name} - ${Object.keys(bundle.modules).length} items.`
        );
    });

    fs.writeFileSync(
        path.resolve('magepack.config.js'),
        `module.exports = ${stringify(bundles, null, '  ')}`
    );
    logger.debug('Stop timer: ' + (Date.now() - $timer));
};
