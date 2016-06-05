module.exports = function( config ) {
    /* jshint node: true */

    var isJenkins = !!process.env.JENKINS_HOME;

    config.set({

        basePath: '../../',

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
        reporters: [
            'dots',
            'coverage'
        ],
        port: 9876, // web server port
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

        // to avoid DISCONNECTED messages when connecting to BrowserStack
        browserDisconnectTimeout : 5*60*1000, // default 2000
        browserDisconnectTolerance : 1, // default 0
        browserNoActivityTimeout : 7*60*1000, //default 10000
        captureTimeout : 8*60*1000, //default 60000

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
        }
    });

    // Jenkins JUnit report
    if (isJenkins) {
        config.reporters.push( 'junit' );
    }
};