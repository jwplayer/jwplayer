/* jshint node: true */
module.exports = function( config ) {
    var env = process.env;
    var isJenkins = !!process.env.JENKINS_HOME;
    var serverPort = process.env.KARMA_PORT || 9876;
    var testReporters = [
        'progress',
        'coverage'
    ];
    if (isJenkins) {
        testReporters.push('junit');
    }
    var packageInfo = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));

    config.set({

        basePath: '.',

        plugins: [
            'karma-coverage',
            'karma-requirejs',
            'karma-qunit',
            'karma-junit-reporter',
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-safari-launcher',
            'karma-browserstack-launcher'
        ],
        frameworks: ['requirejs', 'qunit'],
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
        // config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        browsers: [
            'PhantomJS',
            'Chrome',
            //'Safari', // experiencing issues with safari-launcher@1.0.0 and Safari 9.1.1
            'Firefox'
        ],

        customLaunchers: require( './test/karma/browserstack-launchers' ),

        browserStack: {
            username:  env.BS_USERNAME,
            accessKey: env.BS_AUTHKEY,
            name: 'Unit Tests',
            project: 'jwplayer',
            build: '' + (env.JOB_NAME     || 'local' ) +' '+
            (env.BUILD_NUMBER || env.USER) +' '+
            (env.GIT_BRANCH   || ''      ) +' '+
            packageInfo.version,
            timeout: 300 // 5 minutes
        },

        // to avoid DISCONNECTED messages when connecting to BrowserStack
        browserDisconnectTimeout : 20 * 1000, // default 2000
        browserDisconnectTolerance : 1, // default 0
        browserNoActivityTimeout : 100 * 1000, //default 10000
        captureTimeout : 120 * 1000, //default 60000

        files : [
            //3rd Party Code
            {pattern: 'bower_components/requirejs/require.js', included: true},
            {pattern: 'bower_components/**/*.js', included: false},
            {pattern: 'node_modules/simple-style-loader/addStyles.js', included: false},

            // Require Config
            {pattern: 'test/config.js', included: true},

            // Source
            {pattern: 'src/js/**/*.js', included: false},
            {pattern: 'src/css/**/*.less', included: false},
            {pattern: 'src/templates/**/*.html', included: false},

            // Tests
            {pattern: 'test/data/*.js', included: false},
            {pattern: 'test/data/*.json', included: false},
            {pattern: 'test/data/*.xml', included: false},
            {pattern: 'test/mock/*.js', included: false},
            {pattern: 'test/unit/*.js', included: false},
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            // source files, that you want to generate coverage for
            'src/js/*.js': ['coverage'],
            'src/js/!(polyfill)/*.js': ['coverage']
        },
        coverageReporter: {
            type: 'html',
            dir: 'reports/coverage'
        },

        // number of browsers to run at once
        concurrency: Infinity
    });
};