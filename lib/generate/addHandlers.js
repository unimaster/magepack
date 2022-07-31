const logger = require('../utils/logger');

/**
 *
 * @param {Page} page Puppeteer Page object instance.
 * @param {string} url Page URL.
 * @param loadExt
 */
const addHandlers = async (page, url, loadExt = '') => {
    const host = new URL(url).host;
    let extExcludes = [];
    if (loadExt) {
        extExcludes = loadExt.split(',');
    }



    page.on('console', message => {
            let $message = `${message.text()}`; //${message.type().toUpperCase()} -
            if (
                typeof message.location().url !== 'undefined'
                &&
                (
                    message.location().url.search(/magepack\/bundle/gi) > -1
                    || !message.location().url.includes(host)
                    || message.text().search(/JQMIGRATE/gi) > -1
                    || message.text().search(/console.trace/gi) > -1

                )

            ) {
                return;
            }

            switch (message.type()) {
                case 'warning':
                    logger.warn($message);
                    break;
                case 'error':
                    logger.error($message);
                    break;
                case 'info':
                case 'log':
                case 'trace':
                    logger.debug($message);
                    break;
                default:
                    logger.fatal($message)
            }
        })
        // console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
        .on('pageerror', ({ message }) => {
            logger.fatal(message);
        }
            )
        .on('response', response => {
            if (response.url().search(/magepack\/bundle/gi) > -1) {
                return;
            }

            if (response.status() !== 200) {
                logger.warn(`${response.status()} ${response.url()}`);
            }
        })
        .on('requestfailed', request => {
            if (
                request.url().includes(host) > -1
            ) {
                return;
            }

            logger.warn(`${request.failure().errorText} ${request.url()}`)
        })
        .on("request", request => {
        let url = request.url();
        let reqHost = new URL(url).host;
        logger.debug(url);

        let skipAbort = false;

        if (extExcludes) {
            extExcludes.forEach(text => {
                if (reqHost.includes(text)) {
                    skipAbort = true;
                    return true;
                }
            })
        }

        if (host !== reqHost && !skipAbort) {
            logger.info('Abort external url: ' + url);
            request.abort();
        } else {
            request.continue()
        }});

    await page.setRequestInterception(true);
};

module.exports = addHandlers;
