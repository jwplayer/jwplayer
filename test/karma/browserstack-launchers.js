
module.exports = {

    // To view a list of currently available configurations run this command :
    //  curl -u 'jwplayerplayerte:xKrpdmHXFSgqhxzk6dPf' https://www.browserstack.com/automate/browsers.json

    // Firefox
    firefox_3_6: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '3.6',
        os: 'OS X',
        os_version: 'Mavericks'
    },
    firefox_24: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '24.0',
        os: 'OS X',
        os_version: 'Mavericks'
    },
    firefox_31: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '31.0',
        os: 'OS X',
        os_version: 'Mavericks'
    },
    firefox_35: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '35.0',
        os: 'OS X',
        os_version: 'Yosemite'
    },
    firefox_41: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '41.0',
        os: 'OS X',
        os_version: 'Yosemite'
    },
    firefox: {
        base: 'BrowserStack',
        browser: 'firefox',
        os: 'OS X',
        os_version: 'Yosemite'
    },

    // Chrome
    chrome_24: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '24.0',
        os: 'OS X',
        os_version: 'Mavericks'
    },
    chrome_38: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '38.0',
        os: 'OS X',
        os_version: 'Yosemite'
    },
    chrome_45: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '45.0',
        os: 'OS X',
        os_version: 'Yosemite'
    },
    chrome: {
        base: 'BrowserStack',
        browser: 'chrome',
        os: 'OS X',
        os_version: 'Yosemite'
    },

    // Internet Explorer
    //ie8_windows: {
    //    base: 'BrowserStack',
    //    browser: 'ie',
    //    browser_version: '8.0',
    //    os: 'Windows',
    //    os_version: '7'
    //},
    ie9_windows: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '9.0',
        os: 'Windows',
        os_version: '7'
    },
    ie10_windows: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '10.0',
        os: 'Windows',
        os_version: '7'
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
    },

    // Opera
    opera_12_16: {
        base: 'BrowserStack',
        browser: 'opera',
        browser_version: '12.16',
        os: 'Windows',
        os_version: '7'
    },
    opera_25: {
        base: 'BrowserStack',
        browser: 'opera',
        browser_version: '25.0',
        os: 'OS X',
        os_version: 'Yosemite'
    },
    opera_26: {
        base: 'BrowserStack',
        browser: 'opera',
        browser_version: '26.0',
        os: 'OS X',
        os_version: 'Yosemite'
    },

    /*/ Yandex
     yandex_14_5: {
     base: 'BrowserStack',
     browser: 'yandex',
     browser_version: '14.5',
     os: 'OS X',
     os_version: 'Yosemite'
     },*/

    // Safari
    safari_4_0: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '4.0',
        os: 'OS X',
        os_version: 'Snow Leopard'
    },
    safari_5_0: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '5.0',
        os: 'OS X',
        os_version: 'Snow Leopard'
    },
    safari_5_1: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '5.1',
        os: 'OS X',
        os_version: 'Lion'
    },
    safari_6_0: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '6.0',
        os: 'OS X',
        os_version: 'Lion'
    },
    safari_6_1: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '6.1',
        os: 'OS X',
        os_version: 'Mountain Lion'
    },
    safari_7_0: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '7.0',
        os: 'OS X',
        os_version: 'Mavericks'
    },
    safari_8_0: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '8.0',
        os: 'OS X',
        os_version: 'Yosemite'
    },

    // iOS
    ios_5_1: {
        base: 'BrowserStack',
        device: 'iPhone 4S',
        os: 'ios',
        os_version: '5.1'
    },
    ios_6_0: {
        base: 'BrowserStack',
        device: 'iPhone 5',
        os: 'ios',
        os_version: '6.0'
    },
    ios_7_0: {
        base: 'BrowserStack',
        device: 'iPhone 5S',
        os: 'ios',
        os_version: '7.0'
    },
    ios_8_0: {
        base: 'BrowserStack',
        device: 'iPhone 6',
        os: 'ios',
        os_version: '8.0'
    },

    // Android
    /* droid_razr: {
        base: 'BrowserStack',
        device: 'Motorola Droid Razr',
        os: 'android',
        os_version: '2.3'
    }, */
    moto_razr: {
        base: 'BrowserStack',
        device: 'Motorola Razr',
        os: 'android',
        os_version: '4.0'
    },
    nexus_7: {
        base: 'BrowserStack',
        device: 'Google Nexus 7',
        os: 'android',
        os_version: '4.1'
    },
    lg_nexus_4: {
        base: 'BrowserStack',
        device: 'LG Nexus 4',
        os: 'android',
        os_version: '4.2'
    },
    galaxy_s4 : {
        base: 'BrowserStack',
        device: 'Samsung Galaxy S4',
        os: 'android',
        os_version: '4.3'
    },
    galaxy_s5 : {
        base: 'BrowserStack',
        device : 'Samsung Galaxy S5',
        os: 'android',
        os_version: '4.4'
    }
};
