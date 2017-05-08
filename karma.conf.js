/* eslint no-process-env: 0 */
const webpack = require('webpack');
const path = require('path');
// Use the debug config
const webpackConfig = require('./webpack.config.js')[0];

const aliases = {
    'test/underscore': path.resolve(__dirname + '/node_modules/underscore/underscore.js'),
    'utils/video': path.resolve(__dirname + '/test/mock/video.js'),
    jquery: path.resolve(__dirname + '/node_modules/jquery/dist/jquery.js'),
    sinon: path.resolve(__dirname + '/node_modules/sinon/pkg/sinon.js'),
    data: path.resolve(__dirname + '/test/data'),
    mock: path.resolve(__dirname + '/test/mock')
};

webpackConfig.resolve.alias = Object.assign(webpackConfig.resolve.alias || {}, aliases);

module.exports = function(config) {
    var env = process.env;
    var isJenkins = !!process.env.JENKINS_HOME;
    var serverPort = process.env.KARMA_PORT || 9876;
    var testReporters = [
        // 'dots', // useful for writing browser console logs to stdio
        'spec',
        'coverage'
    ];
    if (isJenkins) {
        testReporters.push('junit');
    }
    var packageInfo = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));

    config.set({
        frameworks: ['mocha', 'chai', 'sinon'],
        reporters: testReporters,
        port: serverPort, // web server port
        colors: !isJenkins, // colors in the output (reporters and logs)
        autoWatch: false, // watch file and execute tests whenever any file changes
        singleRun: true, // if true, Karma captures browsers, runs the tests and exits

        client: {
            useIframe: false // use a new window for each test
        },

        // Possible values:
        // config.LOG_DISABLE
        // config.LOG_ERROR
        // config.LOG_WARN
        // config.LOG_INFO
        //  config.LOG_DEBUG LOG_DEBUG is useful for writing karma server network status messages to stdio
        logLevel: config.LOG_INFO,

        browsers: [
            'PhantomJS',
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
            // 3rd Party Code
            { pattern: 'test-context.js' }
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test-context.js': ['webpack']
        },

        coverageReporter: {
            type: 'html',
            dir: 'reports/coverage'
        },
        webpack: {
            umdNamedDefine: webpackConfig.umdNamedDefine,
            resolve: webpackConfig.resolve,
            module: webpackConfig.module,
            plugins: [
                new webpack.optimize.LimitChunkCountPlugin({
                    maxChunks: 1
                }),
                new webpack.DefinePlugin({
                    __SELF_HOSTED__: true,
                    __REPO__: '\'\'',
                    __DEBUG__: false,
                    __BUILD_VERSION__: '\'' + '7.10.0' + '\'',
                    __FLASH_VERSION__: 18.0
                }),
            ]
        },
        // number of browsers to run at once
        concurrency: Infinity
    });
};
