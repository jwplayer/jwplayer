'use strict';

/* eslint-env node */
/* eslint no-process-env: 0 */

const path = require('path');
const puppeteer = require('puppeteer');
const merge = require('webpack-merge');
const webpackConfig = require('./webpack.config.js')({ debug: true });

const webpackTestConfig = merge(webpackConfig, {
    entry: null,
    output: null,
    devtool: false,
    externals: {
        $: {
            commonjs: 'jquery',
            amd: 'jquery',
            root: '$'
        },
        sinon: 'sinon'
    },
    resolve: {
        alias: {
            'test/underscore': path.resolve(__dirname + '/node_modules/underscore/underscore.js'),
            'utils/video': path.resolve(__dirname + '/test/mock/video.js'),
            // Tests using jQuery: api-test, jwplayer-selectplayer-test, setup-test
            jquery: path.resolve(__dirname + '/node_modules/jquery/dist/jquery.js'),
            sinon: path.resolve(__dirname + '/node_modules/sinon/pkg/sinon.js'),
            data: path.resolve(__dirname + '/test/data'),
            mock: path.resolve(__dirname + '/test/mock')
        }
    },
    module: {
        rules: [
            {
                enforce: 'post',
                test: /\.js$/,
                include: path.resolve('src/js/'),
                use: {
                    loader: 'istanbul-instrumenter-loader',
                    options: { esModules: true }
                }
            }
        ],
        noParse: [
            /node_modules\/sinon\//,
            /node_modules\/jquery\//
        ]
    }
});

module.exports = function(config) {
    const env = process.env;
    const isJenkins = !!env.JENKINS_HOME;
    const serverPort = env.KARMA_PORT || 9876;
    const testReporters = [
        'mocha',
        'coverage-istanbul'
    ];
    let browsers = [
        'ChromeHeadless',
        'Chrome',
        'Safari',
        'Firefox',
        'edge',
        'ie11',
        'iphone',
        'android'
    ];
    if (isJenkins) {
        testReporters.push('junit');
        process.env.CHROME_BIN = puppeteer.executablePath();
        browsers = [
            'ChromeHeadless',
            'chrome',
            'firefox',
            'edge',
            'ie11',
            'iphone',
            'android'
        ];
    }
    const packageInfo = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));

    config.set({
        frameworks: ['mocha', 'sinon-chai'],
        reporters: testReporters,
        port: serverPort, // web server port
        colors: true, // colors in the output (reporters and logs)
        autoWatch: false, // watch file and execute tests whenever any file changes
        singleRun: true, // if true, Karma captures browsers, runs the tests and exits

        // Possible logLevel values:
        // LOG_DISABLE
        // LOG_ERROR
        // LOG_WARN
        // LOG_INFO
        // LOG_DEBUG (useful for writing karma server network status messages to stdio)
        logLevel: config.LOG_INFO,

        browsers,

        customLaunchers: require('./test/karma/browserstack-launchers'),

        browserStack: {
            username: env.BS_USERNAME || env.BROWSERSTACK_USERNAME,
            accessKey: env.BS_AUTHKEY || env.BROWSERSTACK_ACCESS_KEY,
            name: 'Unit Tests',
            project: 'jwplayer',
            build: env.BROWSERSTACK_BUILD || ('' + (env.JOB_NAME || 'local') + ' ' +
            (env.BUILD_NUMBER || env.USER || env.GITHUB_USER) + ' ' +
            (env.GIT_BRANCH || 'jwplayer') + ' ' + packageInfo.version) + ' ' +
            (new Date()).toISOString(),
            timeout: 300 // 5 minutes
        },

        // to avoid DISCONNECTED messages when connecting to BrowserStack
        browserDisconnectTimeout: 20 * 1000, // default 2000
        browserDisconnectTolerance: 1, // default 0
        browserNoActivityTimeout: 10 * 1000, // default 10000
        captureTimeout: 120 * 1000, // default 60000

        files: [
            { pattern: './node_modules/intersection-observer/intersection-observer.js' },
            { pattern: './test/index.js' },
            { pattern: './test/files/**', included: false },
            { pattern: './src/js/*', included: false }
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test/index.js': ['webpack']
        },

        coverageIstanbulReporter: {
            reports: ['text-summary', 'html'],
            dir: 'reports/coverage',
            combineBrowserReports: true,
            fixWebpackSourcePaths: true
        },

        webpack: webpackTestConfig,

        // number of browsers to run at once
        concurrency: Infinity
    });
};
