define([
    'underscore',
    'playlist/item'
], function (_, item) {
    /* jshint qunit: true */

    module('playlist items');

    // http://support.jwplayer.com/customer/portal/articles/1413113-configuration-options-reference
    function testItem(config) {
        var x = item(config);

        ok(_.isObject(x), 'Config generated from ' + config);
        ok(_.isArray(x.sources), 'Sources attr is present');
        ok(_.isArray(x.tracks), 'Tracks attr is present');
        return x;
    }

    // Check for the attrs which testItem does not
    function testItemComplete(config) {
        var item = testItem(config);

        var attrs = ['image', 'description', 'mediaid', 'title'];
        _.each(attrs, function(a) {
            ok(_.has(item, a), 'Item has ' + a + ' attribute');
        });

        return item;
    }

    test('Test worst case config options', function() {

        testItem();
        testItem(undefined);
        testItem({});
        testItem(true);
        testItem(false);
        testItem({title : 'hi', sources: false});
        testItem({title : 'hi', sources: {}});
    });

    test('Test kitchen sink config', function() {
        var x = testItemComplete({
            image: 'image.png',
            description: 'desc',
            sources: [
                {
                    file: 'f1.mp4',
                    label: 'f1 label',
                    //'default' : true,
                    type: 'mp4'
                },
                {
                    file: 'f2.mp4',
                    label: 'f2 label',
                    'default' : true,
                    type: 'mp4'
                }
            ],
            title: 'title',
            mediaid: 12345,
            tracks: [
                {
                    file: 'fake.vtt',
                    //kind: 'captions',
                    label: 'track label'
                    //'default': true
                }
            ]
        });

        // Test Sources
        equal(x.sources[0].file, 'f1.mp4', 'source set properly');
        equal(x.sources[1].file, 'f2.mp4', 'second source also set properly');
        equal(x.sources[1]['default'], true, 'default value working');

        // Test tracks
        equal(x.tracks[0].file, 'fake.vtt', 'tracks set properly');
        equal(x.tracks[0].kind, 'captions', 'tracks default kind working');
        equal(x.tracks[0].label, 'track label', 'tracks label');

    });

    test('Test for levels param', function() {
        var x = testItemComplete({
            levels: [{
                file: 'f1.mp4',
                label : 'f1 label',
                //'default' : true,
                type : 'mp4'
            }]
        });

        equal(x.sources[0].file, 'f1.mp4', 'levels param is converted to sources param');
    });

    test('Test for passthrough of unknown values', function() {
        var x = testItemComplete({
            file: 'x',
            randomStr : 'rrr',
            adSchedule: {
                adbreak: {
                    tag : 'hi'
                }
            }
        });

        // This is important for passing adschedule data through
        equal(x.randomStr, 'rrr', 'Passes through unknown values');
    });

    test('Test for sources as object instead of array', function() {
        var x = testItemComplete({
            sources: {
                file: 'f1.mp4',
                label : 'f1 label',
                //'default' : true,
                type : 'mp4'
            }
        });

        equal(x.sources[0].file, 'f1.mp4', 'levels param is converted to sources param');
    });
});
