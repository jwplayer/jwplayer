 window.__BUILD_VERSION__ = 0;
 window.__FLASH_VERSION__ = 11.2;
 var base = '../../';

 var components = base + 'bower_components';
 var data       = base + 'test/data';
 var mock       = base + 'test/mock';
 var unit       = base + 'test/unit';

 require.config({

    // Go to open source root url
    baseUrl : base + 'src/js',

    paths: {
        'templates':     '../' + 'templates',
        'css':           '../' + 'css',
        'underscore': 'utils/' + 'underscore',

        'handlebars': components + '/handlebars/handlebars.amd',
        'text':       components + '/requirejs-text/text',
        'handlebars-loader': components + '/requirejs-handlebars/hb',
        'less':       components + '/require-less/less',
        'lessc':      components + '/require-less/lessc',
        'normalize':  components + '/require-less/normalize',
        'jquery':     components + '/jquery/dist/jquery',

        // always use test/underscore in test scripts
        'test/underscore': components + '/underscore/underscore',

        'data' : data,
        'mock' : mock,
        'unit' : unit
    },
    shim: {
        'test/underscore': {
            exports: '_'
        }
    },
    map: {
        // make sure the text plugin is used to load templates
        '*' : {
            'templates/error.html': 'hbars!templates/error.html',
            '../css/styles.less': 'less!css/styles'
        },
        'providers/html5' : {
            'utils/video': mock + '/video.js'
        }
    }
});
