module.exports = function() {
    return {
        files: [
            //3rd Party Code
            {pattern: 'node_modules/handlebars/dist/*.js', load: false, instrument: false},
            {pattern: 'node_modules/handlebars-loader/*.js', load: false, instrument: false},
            {pattern: 'node_modules/jquery/dist/*.js', load: false, instrument: false},
            {pattern: 'node_modules/phantomjs-polyfill/*.js', load: false, instrument: false},
            {pattern: 'node_modules/requirejs/require.js', instrument: false},
            {pattern: 'node_modules/requirejs-handlebars/*.js', load: false, instrument: false},
            {pattern: 'node_modules/requirejs-text/*.js', load: false, instrument: false},
            {pattern: 'node_modules/require-less/*.js', load: false, instrument: false},
            {pattern: 'node_modules/simple-style-loader/addStyles.js', load: false, instrument: false},
            {pattern: 'node_modules/underscore/*.js', load: false, instrument: false},

            // Source
            {pattern: 'src/js/**/*.js', load: false},
            {pattern: 'src/css/**/*.less', load: false},
            {pattern: 'src/templates/**/*.html', load: false},

            // Require Config
            {pattern: 'test/config.js', instrument: false},

            // Test Data
            {pattern: 'test/data/*.js', load: false, instrument: false},
            {pattern: 'test/data/*.json', load: false, instrument: false},
            {pattern: 'test/data/*.xml', load: false, instrument: false},
            {pattern: 'test/mock/*.js', load: false, instrument: false},
        ],
        tests: [
            {pattern: 'test/unit/*.js', load: false},
        ],
        testFramework: 'qunit'
    };
};
