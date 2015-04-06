define([
    'test/underscore',
    'jquery',
    'embed/embed'
], function (_, $, Embed) {
    /* jshint qunit: true */

    module('Embed');

    /**
     * Comments by robwalch on 2015/4/5
     *
     * embed.js is a prime candidate for refactoring
     * the embed concept is left over from a dual js/swf player setup
     * it's responsibilities many are mixed (api, playlist, plugin)
     *
     * Behavior handled by this module :
     * - api container inline styles width and height are set
     * - playlist loading
     * - playlist errors
     * - plugin loading
     *   - controller setup (api responsibility)
     * - trigger setup error event
     * - error Screen
     */

    test('does not modify options', function() {
        var embedder = createEmbedder();

        var options = {
            file: 'file.mp4',
            aspectratio: '4:3',
            width: '100%'
        };
        var optionsOrig = _.extend({}, options);

        embedder.embed(options);

        deepEqual(options, optionsOrig, 'options is not modified');

        embedder.destroy();
    });

    function createEmbedder() {
        var container = $('<div id="player"></div>')[0];
        $('#qunit-fixture').append(container);

        var mockApi = {
            id: 'player',
            getContainer: function() {
                return container;
            },
            trigger: function(/* type, data */) {
                //console.log('api trigger', type, data);
            }
        };

        var mockController = {
            setup: function(/* configCopy, api */) {
                //console.log('controller config', configCopy);
                //console.log('controller api', api);
            }
        };

        return new Embed(mockApi, mockController);
    }
});
