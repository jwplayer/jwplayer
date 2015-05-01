define([
    'test/underscore',
    'playlist/item'
], function (_, item) {
    /* jshint qunit: true */

    module('playlist item');

    // http://support.jwplayer.com/customer/portal/articles/1413113-configuration-options-reference
    function testItem(config) {
        var x = item(config);

        ok(_.isObject(x), 'Item generated from ' + config + ' input');
        ok(_.isArray(x.sources), 'Item has sources array');
        ok(_.isArray(x.tracks), 'Item has tracks array');
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

    test('worst case input arguments are handled', function() {

        testItem();
        testItem(undefined);
        testItem({});
        testItem(true);
        testItem(false);
        testItem({title : 'hi', sources: false});
        testItem({title : 'hi', sources: {}});
        testItem({tracks: [{}, null]});
        testItem({tracks: 1});
    });

    test('input with multiple sources, a default and captions track', function() {
        var x = testItemComplete({
            image: 'image.png',
            description: 'desc',
            sources: [
                {
                    file: 'f1.mp4',
                    label: 'f1 label'
                    //'default' : true,
                },
                {
                    file: 'rtmp://f2',
                    'default' : true
                },
                {
                    file: 'https://www.youtube.com/watch?v=zKtAuflyc5w'
                },
                {
                    file: 'file'
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
        equal(x.sources[0].file, 'f1.mp4', 'First source file set properly');
        equal(x.sources[1].file, 'rtmp://f2', 'Second source file set properly');
        equal(x.sources[2].file, 'https://www.youtube.com/watch?v=zKtAuflyc5w', 'Third source file set properly');
        equal(x.sources.length, 3, 'Sources whose types cannot be determined are removed');
        ok(!x.sources[0]['default'], 'First source was not set to default');
        equal(x.sources[1]['default'], true, 'Second source was set to default');
        equal(x.sources[0].label, 'f1 label', 'First source label matches input.source[0].label');
        equal(x.sources[1].label, '1', 'Second source label is assigned 1');

        // Test tracks
        equal(x.tracks[0].file, 'fake.vtt', 'First track file matches input.tracks[0].file');
        equal(x.tracks[0].kind, 'captions', 'First track kind defaults to captions');
        equal(x.tracks[0].label, 'track label', 'First track label matches input.tracks[0].label');

    });

    test('input source type normalization', function() {
        var x = testItem({
            sources: [
                {
                    file: 'f1.mp4'
                },
                {
                    file: 'rtmp://f2'
                },
                {
                    file: 'https://www.youtube.com/watch?v=zKtAuflyc5w'
                },
                {
                    file: 'file',
                    type: 'video/mp4'
                },
                {
                    file: 'file.m3u8'
                },
                {
                    file: 'file.smil'
                },
                {
                    file: 'file.m4a'
                }
            ]
        });

        // Test Source types
        equal(x.sources[0].type, 'mp4', 'First source mp4 type read from file extension');
        equal(x.sources[1].type, 'rtmp', 'Second source rtmp type read from file protocol');
        equal(x.sources[2].type, 'youtube', 'Third source youtube type parsed from url');
        equal(x.sources[3].type, 'mp4', 'Fourth source mp4 type split from MIME type video/mp4');
        equal(x.sources[4].type, 'hls', 'm3u8 type normailzed to hls');
        equal(x.sources[5].type, 'rtmp', 'smil type normailzed to rtmp');
        equal(x.sources[6].type, 'aac', 'm4a type normailzed to aac');

    });

    test('input.levels are converted to sources', function() {
        var x = testItem({
            levels: [{
                file: 'f1.mp4',
                label : 'f1 label',
                //'default' : true,
                type : 'mp4'
            }]
        });

        equal(x.sources[0].file, 'f1.mp4', 'first source file matches input.levels[0].file');
    });

    test('input.captions are converted to tracks', function() {
        var x = testItem({
            file: 'x',
            captions: [
                {
                    file: 'fake.vtt',
                    label: 'track label'
                }
            ]
        });

        equal(x.tracks[0].file, 'fake.vtt', 'First track file matches input.captions[0].file');
    });

    test('property passthrough of unknown values', function() {
        var x = testItem({
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

    test('input.sources may contain one source object instead of array', function() {
        var x = testItem({
            sources: {
                file: 'f1.mp4',
                label : 'f1 label',
                //'default' : true,
                type : 'mp4'
            }
        });

        equal(x.sources[0].file, 'f1.mp4', 'First source file matches input.sources.file');
    });
});
