const logger = require('../utils/logger');

/**
 *
 * @param {Page} page Puppeteer Page object instance.
 * @param {string} username Basic auth username.
 * @param {string} password Basic auth password.
 */
const addHandlers = async (page) => {
    page.on('console', message => {

            let $message = `${message.text()}`; //${message.type().toUpperCase()} -
            if (
                typeof message.location().url !== 'undefined'
                && message.location().url.search(/magepack\/bundle/gi) > 0
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
            if (response.url().search(/magepack\/bundle/gi) > 0) {
                return;
            }

            if (response.status() !== 200) {
                logger.warn(`${response.status()} ${response.url()}`);
            }
        })
        .on('requestfailed', request => {
            if (request.url().search(/magepack\/bundle/gi) > 0) {
                return;
            }

            logger.warn(`${request.failure().errorText} ${request.url()}`)
        });
};

module.exports = addHandlers;
