'use strict';
const chalk = require('chalk');

function ts() {
    return new Date().toLocaleTimeString();
}

module.exports = {
    info: (...args) => console.log(chalk.gray(`[${ts()}]`), ...args),
    warn: (...args) => console.log(chalk.gray(`[${ts()}]`), ...args),
    error: (...args) => console.log(chalk.gray(`[${ts()}]`), ...args),
    debug: (...args) => {
        if (process.env.DEBUG === 'true') console.log(chalk.gray(`[${ts()}] [debug]`), ...args);
    },
};
