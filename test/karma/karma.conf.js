var grunt = require('grunt');

module.exports = function( config ) {
    /* jshint node: true */

    var gruntTarget = grunt.task.current.target;

    var isJenkins = !!process.env.JENKINS_HOME;
    var jenkinsBuildTag = process.env.BUILD_TAG;

    config.set({

        basePath: '../../',

        plugins: [
            'karma-coverage',
            'karma-requirejs',
            'karma-qunit',
            'karma-phantomjs-launcher',
            'karma-browserstack-launcher'
        ],
        frameworks: ['requirejs', 'qunit'],
        reporters: [
            // Make jenkins output less verbose
            isJenkins ? 'dots' : 'progress',
            'coverage'
        ],
        port: 9876, // web server port
        colors: true, // colors in the output (reporters and logs)
        autoWatch: false, // watch file and execute tests whenever any file changes

        // Possible values:
        // config.LOG_DISABLE
        // config.LOG_ERROR
        // config.LOG_WARN
        // config.LOG_INFO
        // config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // to avoid DISCONNECTED messages when connecting to BrowserStack
        browserDisconnectTimeout : 5*60*1000, // default 2000
        browserDisconnectTolerance : 1, // default 0
        browserNoActivityTimeout : 7*60*1000, //default 10000
        captureTimeout : 8*60*1000, //default 60000

        files : [
            //3rd Party Code
            {pattern: 'bower_components/requirejs/require.js', included: true},
            {pattern: 'bower_components/**/*.js', included: false},

            // Require Config
            {pattern: 'test/config.js', included: true},

            // Source
            {pattern: 'src/js/**/*.js', included: false},
            {pattern: 'src/css/**/*.less', included: false},
            {pattern: 'src/templates/**/*.html', included: false},

            // Tests
            {pattern: 'test/data/*.js', included: false},
            {pattern: 'test/mock/*.js', included: false},
            {pattern: 'test/unit/*.js', included: false}
        ],

        // optionally, configure the reporter
        coverageReporter: {
            type : 'html',
            dir: 'reports/coverage',
            subdir: function(/* browser */) {
                // create one coverage report for local and browserstack configs
                return gruntTarget;
            }
        },

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            // source files, that you want to generate coverage for
            'src/js/!(polyfill)/*.js': ['coverage']
        },

        browserStack: {
            username:  process.env.BS_USERNAME,
            accessKey: process.env.BS_AUTHKEY,
            name: 'Unit Tests',
            project: 'JW Player',
            build: grunt.config( 'pkg.version' ) + ' ('+ (jenkinsBuildTag || 'local') +')',
            timeout: 600 // 10 min
        },

        customLaunchers: require( './browserstack-launchers' ),

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });

    // Run on BrowserStack
    if (gruntTarget === 'browserstack') {
        if (config.browserStack.username && config.browserStack.accessKey) {
            config.browsers = Object.keys(config.customLaunchers);
            return;
        }
        throw new Error('BS_USERNAME and BS_AUTHKEY env vars must be set to launch on BrowserStack');
    }
    // Run local with PhantomJS
    config.browsers.push( 'PhantomJS' );
};