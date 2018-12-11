module.exports = {
    firefox: {
        base: 'BrowserStack',
        browser: 'firefox',
        os: 'Windows',
        os_version: '10'
    },

    chrome: {
        base: 'BrowserStack',
        browser: 'chrome',
        os: 'Windows',
        os_version: '10'
    },

    ie11: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '11.0',
        os: 'Windows',
        os_version: '7'
    },

    edge: {
        base: 'BrowserStack',
        browser: 'edge',
        browser_version: '17',
        os: 'Windows',
        os_version: '10'
    },

    safari: {
        base: 'BrowserStack',
        browser: 'safari',
        os: 'OS X',
        os_version: 'Sierra'
    },

    iphone: {
        base: 'BrowserStack',
        device: 'iPhone 7',
        device_browser: 'safari',
        os: 'iOS',
        os_version: '10.0',
        real_mobile: true
    },

    android: {
        base: 'BrowserStack',
        device: 'Samsung Galaxy S8',
        device_browser: 'chrome',
        os: 'android',
        os_version: '7.0',
        real_mobile: true
    }
};
