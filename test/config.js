(function() {

    // This allows us to test modules without loading full player
    window.__BUILD_VERSION__ = '7.8.0';
    window.__FLASH_VERSION__ = 11.2;
    window.__REPO__ = '';
    window.__SELF_HOSTED__ = true;
    window.__DEBUG__ = false;

    var base = '';
    var callback;
    var deps = [
        'phantomjs-polyfill'
    ];

    // Add polyfills for phantomjs 1.x and IE9
    if (!('atob' in window)) {
        deps.push('polyfills/base64');
    }
    if (!('Promise' in window)) {
        deps.push('polyfills/promise');
    }
    if (!('IntersectionObserver' in window)) {
        deps.push('polyfills/intersection-observer');
    }
    if (!('console' in window) || !('log' in window.console)) {
        window.console = {
            log: function() {
            }
        };
    }

    if (window.wallaby) {
        window.wallaby.delayStart();
        base = '../../';
        for (var file in window.wallaby.tests) {
            deps.push(window.wallaby.tests[file]);
        }
        callback = window.wallaby.start;
    } else if (window.__karma__) {
        base = '/base/';
        for (var file in window.__karma__.files) {
            if (/test\/unit\/[^\/]+\.js$/.test(file)) {
                deps.push(file);
            }
        }
        callback = window.__karma__.start;
    } else if (window.QUnit) {
        base = document.location.href.replace(/[^\/]+\/[^\/]*$/, '');
        // this path is relative to the baseUrl src/js folder
        deps.push('../../test/tests');
        callback = window.QUnit.start;
    } else if (window.requireBaseUrl || window.requireCallback) {
        base = window.requireBaseUrl || base;
        callback = window.requireCallback || undefined;
    }


    // Add qunit-fixture to page if not present
    if (!document.getElementById('qunit-fixture')) {
        var qunitFixture = document.createElement('div');
        qunitFixture.id = 'qunit-fixture';
        document.body.appendChild(qunitFixture);
    }

    var components = base + 'node_modules';
    var data = base + 'test/data';
    var mock = base + 'test/mock';
    var unit = base + 'test/unit';

    window.require.config({

        autostart: false,

        // Browserstack is very slow.
        waitSeconds: 120,

        // Go to open source root url
        baseUrl: base + 'src/js',

        paths: {
            'templates': '../' + 'templates',
            'css': '../' + 'css',

            'handlebars': components + '/handlebars/dist/handlebars.amd',
            'text': components + '/requirejs-text/text',
            'handlebars-loader': components + '/requirejs-handlebars/hb',
            'less': '../../test/require-less/less',
            'lessc': '../../test/require-less/lessc',
            'normalize': '../../test/require-less/normalize',
            'jquery': components + '/jquery/dist/jquery',
            'phantomjs-polyfill': components + '/phantomjs-polyfill/bind-polyfill',
            'simple-style-loader': components + '/simple-style-loader',
            'sinon': components + '/sinon/pkg/sinon-1.17.6',
            // always use test/underscore in test scripts
            'test/underscore': components + '/underscore/underscore',

            'data': data,
            'mock': mock,
            'unit': unit,
        },
        shim: {
            'test/underscore': {
                exports: '_'
            }
        },
        map: {
            // make sure the text plugin is used to load templates
            '*': {
                'templates/dock.html': 'handlebars-loader!templates/dock.html',
                'templates/logo.html': 'handlebars-loader!templates/logo.html',
                'templates/player.html': 'handlebars-loader!templates/player.html',
                'templates/error.html': 'handlebars-loader!templates/error.html',
                'templates/rightclick.html': 'handlebars-loader!templates/rightclick.html',
                'templates/slider.html': 'handlebars-loader!templates/slider.html',
                'templates/menu.html': 'handlebars-loader!templates/menu.html',
                'templates/playlist.html': 'handlebars-loader!templates/playlist.html',
                'templates/nextup.html': 'handlebars-loader!templates/nextup.html',
                'templates/display-icon.html': 'handlebars-loader!templates/display-icon.html',
                'templates/display-container.html': 'handlebars-loader!templates/display-container.html',
                'utils/video': mock + '/video.js'
            }
        },

        // ask Require.js to load these files (all our tests)
        deps: deps,

        // start test run, once Require.js is done
        callback: callback
    });
})();
