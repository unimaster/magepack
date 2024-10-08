#!/usr/bin/env node

const program = require('commander');
const logger = require('./lib/utils/logger');
const version = require('./package.json').version;

program.name('magepack').usage('[generate|bundle] <options...>');

program
    .version(version, '-v, --version', 'Output the current version.')
    .helpOption('-h, --help', 'Show this command summary.')
    .addHelpCommand(false);

program
    .command('generate')
    .description(
        'Generate optimization configuration based on given page URLs.'
    )
    .requiredOption('--home-url <url>', 'CMS page URL.')
    .requiredOption('--category-url <url>', 'Category page URL.')
    .requiredOption('--product-url <url>', 'Product page URL.')
    .option('--search-url <url>', 'Search page URL.')
    .option('-p, --pages <user>', 'Comma separated pages.')
    // .option('-u, --auth-username <user>', 'Basic authentication username.')
    // .option('-p, --auth-password <password>', 'Basic authentication password.')
    .option('-d, --debug', 'Enable logging of debugging information.')
    .option('-h, --headless', 'Don\'t use headless.', false)
    .option('-e, --excl-mods <items>', 'Exclude modules.')
    .option('-l, --load-ext <items>', 'Load external urls including text (comma separated).')
    .action((config) => {
        logger.level = 3;
        if (config.debug) {
            logger.level = 5;
        }

        require('./lib/generate')(config).catch(logger.error);
    });

program
    .command('bundle')
    .description('Bundle JavaScript files using given configuration file.')
    .option(
        '-c, --config <path>',
        'Configuration file path.',
        'magepack.config.js'
    )
    .option('-g, --glob <path>', 'Glob pattern of themes to bundle.')
    .option('-d, --debug', 'Enable logging of debugging information.')
    .action(({ config, debug, glob }) => {
        if (debug) {
            logger.level = 5;
        }

        require('./lib/bundle')(config, glob).catch(logger.error);
    });

program.parse(process.argv);
