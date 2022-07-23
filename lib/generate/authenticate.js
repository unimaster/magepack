const logger = require('../utils/logger');

/**
 *
 * @param {Page} page Puppeteer Page object instance.
 * @param {string} username Basic auth username.
 * @param {string} password Basic auth password.
 */
const authenticate = async (page, url, username, password) => {
    page.on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
        .on('pageerror', ({ message }) => console.log(message))
        // .on('response', response =>
        //     console.log(`${response.status()} ${response.url()}`))
        .on('requestfailed', request =>
            console.log(`${request.failure().errorText} ${request.url()}`));
    url = 'url' + url;
    // if (username && password) {
    //     logger.debug('Authenticating with given user and password.');
    //
    //     await page.authenticate({
    //         username,
    //         password,
    //     });
    // }
};

module.exports = authenticate;
