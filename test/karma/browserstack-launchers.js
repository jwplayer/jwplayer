module.exports = {
    firefox: {
        base: 'BrowserStack',
        browser: 'firefox',
        os: 'OS X',
        os_version: 'Yosemite'
    },

    chrome: {
        base: 'BrowserStack',
        browser: 'chrome',
        os: 'OS X',
        os_version: 'Yosemite'
    },

    ie11_windows: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '11.0',
        os: 'Windows',
        os_version: '7'
    },

    edge: {
        base: 'BrowserStack',
        browser: 'edge',
        os: 'Windows',
        os_version: '10'
    }
};
