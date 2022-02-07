'use strict';

/* eslint-env node */
/* eslint no-process-env: 0 */

const path = require('path');
const puppeteer = require('puppeteer');
const {merge} = require('webpack-merge');
const webpackConfig = require('./webpack.config.js')({ debug: true })[0];
const pkg = require('./package.json');

const karmaPlugins = ['karma-*'];

Object.keys(pkg.devDependencies).forEach(function(pkgName) {
  const parts = pkgName.split('/');
  const name = parts[parts.length - 1];

  if ((/^karma-/).test(name)) {
    karmaPlugins.push(require(pkgName));
  }
});

const webpackTestConfig = merge(webpackConfig, {
    devtool: false,
    externals: {
        sinon: 'sinon'
    },
    resolve: {
        alias: {
            'test/underscore': path.resolve(__dirname + '/node_modules/underscore/underscore.js'),
            'utils/video': path.resolve(__dirname + '/test/mock/video.js'),
            sinon: path.resolve(__dirname + '/node_modules/sinon/pkg/sinon.js'),
            data: path.resolve(__dirname + '/test/data'),
            mock: path.resolve(__dirname + '/test/mock')
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve('src/js/'),
                use: {
                    loader: '@jsdevtools/coverage-istanbul-loader',
                    options: { esModules: true }
                }
            }
        ],
        noParse: [
            /node_modules\/sinon\//
        ]
    }
});

delete webpackTestConfig.entry;
delete webpackTestConfig.output;

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
        'Firefox',
    ];
    if (isJenkins) {
        testReporters.push('junit');
        process.env.CHROME_BIN = puppeteer.executablePath();
        browsers = [
            'ChromeHeadless',
            'chrome',
            'firefox',
        ];
    }
    const packageInfo = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));

    config.set({
        frameworks: ['mocha', 'sinon-chai', 'webpack'],
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
        concurrency: Infinity,

        client: {
            mocha: {
                reporter: 'html'
            }
        }
    });
};
