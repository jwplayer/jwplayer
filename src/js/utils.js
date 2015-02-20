define([
    'utils/helpers',
    'utils/css',
    'utils/strings',
    'utils/scriptloader',
    'utils/touch',
    'utils/extensionmap',
    'underscore'
], function(helpers, css, strings, scriptloader, touch, extensionmap, _) {
    return _.extend(helpers, {
        css : css,
        strings : strings,
        scriptloader : scriptloader,
        touch : touch,
        extensionmap : extensionmap
    });
});