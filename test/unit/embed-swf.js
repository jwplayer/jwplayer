define([
    'jquery',
    'utils/embedswf'
], function ($, EmbedSwf) {
    /* jshint qunit: true */

    module('Embed SWF Util');

    test('embeds a swf', function() {
        var parent = $('<div id="container"></div>')[0];
        var id = 'player_swf_0';
        var swf = createEmbedder(parent, id);

        equal(swf.nodeName, 'OBJECT', 'object node is returned');
        equal(swf.id, id, 'object id matches specified id');
        strictEqual(swf.parentNode, parent, 'object is added to specified parent');

        // To Flash interface
        equal(typeof swf.triggerFlash, 'function', 'object.triggerFlash is a function');

        // commenting out this test as it triggers console.error message when flash is not present
        var chainableSwf = swf.triggerFlash('setup', {}).triggerFlash('stop');
        strictEqual(chainableSwf, swf, 'triggerFlash method is chainable');

        // From Flash interface (Backbone.Events)
        equal(typeof swf.trigger, 'function', 'object.trigger is a function');
        equal(typeof swf.on, 'function', 'object.on is a function');
        equal(typeof swf.off, 'function', 'object.off is a function');
        equal(typeof swf.once, 'function', 'object.once is a function');

        EmbedSwf.remove(swf);
    });

    test('remove a swf', function() {
        var parent = $('<div id="container"></div>')[0];
        var id = 'player_swf_1';
        var swf = createEmbedder(parent, id);
        EmbedSwf.remove(swf);

        equal(swf.parentNode, null, 'object is removed from parent');
    });

    function createEmbedder(parent, id) {
        $('#qunit-fixture').append(parent);


        return EmbedSwf.embed('../bin-debug/jwplayer.flash.swf', parent, id);
    }
});
