'use strict';

/* eslint-env node */
/* eslint no-process-env: 0 */

const packageInfo = require('./package.json');
const env = process.env;

module.exports = () => {
    // Build Version: {major.minor.revision}
    let metadata = '';
    if (env.BUILD_NUMBER) {
        const branch = env.GIT_BRANCH;
        metadata = 'opensource';
        if (branch) {
            metadata += '_' + branch.replace(/^origin\//, '').replace(/[^0-9A-Za-z-]/g, '-');
        }
        metadata += '.' + env.BUILD_NUMBER;
    } else {
        const now = new Date();
        now.setTime(now.getTime() - now.getTimezoneOffset() * 60000);
        metadata = 'local.' + now.toISOString().replace(/[.\-:T]/g, '-').replace(/Z|\.\d/g, '');
    }
    return `${packageInfo.version}+${metadata}`;
};
