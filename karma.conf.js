'use strict';

/* eslint-env node */
/* eslint no-process-env: 0 */

const path = require('path');
const puppeteer = require('puppeteer');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js')({ release: true });

const webpackKarmaConfig = Object.assign({}, webpackConfig, {
    entry: null,
    output: null,
    mode: 'development',
    devtool: false,
    plugins: [
        new webpack.DefinePlugin({
            __SELF_HOSTED__: true,
            __REPO__: '\'\'',
            __DEBUG__: false,
            __BUILD_VERSION__: '\'' + '8.2.2' + '\'',
            __FLASH_VERSION__: 18.0
        }),
    ],
    externals: {
        $: {
            commonjs: 'jquery',
            amd: 'jquery',
            root: '$'
        },
        sinon: 'sinon'
    },
    resolve: Object.assign({}, webpackConfig.resolve, {
        alias: Object.assign({}, webpackConfig.resolve.alias || {}, {
            'test/underscore': path.resolve(__dirname + '/node_modules/underscore/underscore.js'),
            'utils/video': path.resolve(__dirname + '/test/mock/video.js'),
            // Tests using jQuery: api-test, jwplayer-selectplayer-test, setup-test
            jquery: path.resolve(__dirname + '/node_modules/jquery/dist/jquery.js'),
            sinon: path.resolve(__dirname + '/node_modules/sinon/pkg/sinon.js'),
            data: path.resolve(__dirname + '/test/data'),
            mock: path.resolve(__dirname + '/test/mock')
        })
    }),
    module: Object.assign({}, webpackConfig.module, {
        rules: [
            {
                enforce: 'post',
                test: /\.js$/,
                include: /(src)\/(js)\//,
                loader: 'istanbul-instrumenter-loader'
            }
        ].concat(webpackConfig.module.rules || []).map(rule => {
            if (rule.options && rule.options.presets) {
                rule.options.presets = rule.options.presets.map(preset => {
                    if (Array.isArray(preset) && preset[0] === 'env' && preset[1]) {
                        // karma-webpack failes if modules are not converted to commonjs by default
                        delete preset[1].modules;
                    }
                    return preset;
                });
            }
            return rule;
        }),
        noParse: [
            /node_modules\/sinon\//,
            /node_modules\/jquery\//
        ].concat(webpackConfig.module.noParse || [])
    })
});

module.exports = function(config) {
    const env = process.env;
    const isJenkins = !!env.JENKINS_HOME;
    const serverPort = env.KARMA_PORT || 9876;
    const testReporters = [
        'mocha',
        'coverage-istanbul'
    ];
    if (isJenkins) {
        testReporters.push('junit');
        process.env.CHROME_BIN = puppeteer.executablePath();
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

        browsers: [
            'ChromeHeadless',
            'Chrome',
            // 'Safari', // experiencing issues with safari-launcher@1.0.0 and Safari 9.1.1
            'Firefox'
        ],

        customLaunchers: require('./test/karma/browserstack-launchers'),

        browserStack: {
            username: env.BS_USERNAME,
            accessKey: env.BS_AUTHKEY,
            name: 'Unit Tests',
            project: 'jwplayer',
            build: '' + (env.JOB_NAME || 'local') + ' ' +
            (env.BUILD_NUMBER || env.USER) + ' ' +
            (env.GIT_BRANCH || '') + ' ' + packageInfo.version,
            timeout: 300 // 5 minutes
        },

        // to avoid DISCONNECTED messages when connecting to BrowserStack
        browserDisconnectTimeout: 20 * 1000, // default 2000
        browserDisconnectTolerance: 1, // default 0
        browserNoActivityTimeout: 10 * 1000, // default 10000
        captureTimeout: 120 * 1000, // default 60000

        files: [
            { pattern: 'test/index.js' },
            { pattern: 'test/files/*', included: false },
            { pattern: 'src/js/*', included: false }
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

        webpack: webpackKarmaConfig,

        // number of browsers to run at once
        concurrency: Infinity
    });
};
