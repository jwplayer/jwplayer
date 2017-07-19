define([
    'providers/html5',
    'providers/flash',
    'polyfills/vtt',
    'intersection-observer',
    'view/controls/controls'
], function (providerHtml5, providerFlash, vtt, intersectionObserver, controls) {
    __webpack_require__.e = function (array, callback) {
        callback(function webpackRequire(modulePath) {
            const module = ({
                'providers/html5': providerHtml5,
                'providers/flash': providerFlash,
                'polyfills/vtt': vtt,
                'intersection-observer': intersectionObserver,
                'view/controls/controls': controls
            })[modulePath];

            if (!module) {
                console.log('Require.ensure mock could not find your module! If your tests are failing, add your module to mock-ensure.js');
            }

            return module;
        });
    };
});
