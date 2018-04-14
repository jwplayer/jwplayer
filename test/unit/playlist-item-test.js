import item from 'playlist/item';
import _ from 'test/underscore';

describe('playlist item', function() {

    function testItem(config) {
        const x = item(config);

        expect(_.isObject(x), 'Item generated from ' + config + ' input').to.be.true;
        expect(_.isArray(x.sources), 'Item has sources array').to.be.true;
        expect(_.isArray(x.tracks), 'Item has tracks array').to.be.true;
        return x;
    }

    // Check for the attrs which testItem does not
    function testItemComplete(config) {
        const playlistItem = testItem(config);

        const attrs = ['image', 'description', 'mediaid', 'title', 'minDvrWindow'];
        _.each(attrs, function (a) {
            expect(_.has(playlistItem, a), 'Item has ' + a + ' attribute').to.be.true;
        });

        return playlistItem;
    }

    it('worst case input arguments are handled', function() {
        testItem();
        testItem(undefined);
        testItem({});
        testItem(true);
        testItem(false);
        testItem({ title: 'hi', sources: false });
        testItem({ title: 'hi', sources: {} });
        testItem({ tracks: [{}, null] });
        testItem({ tracks: 1 });
    });

    it('input with multiple sources, a default and captions track', function() {
        const x = testItemComplete({
            image: 'image.png',
            description: 'desc',
            sources: [
                {
                    file: 'f1.mp4',
                    label: 'f1 label'
                },
                {
                    file: 'rtmp://f2',
                    'default': true
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
                    label: 'track label'
                }
            ]
        });

        // Test Sources
        expect(x.sources[0].file, 'First source file is correct').to.equal('f1.mp4');
        expect(x.sources[1].file, 'Second source file is correct').to.equal('rtmp://f2');
        expect(x.sources[2].file, 'Third source file is correct').to.equal('https://www.youtube.com/watch?v=zKtAuflyc5w');
        expect(x.sources.length, 'Sources whose types cannot be determined are removed').to.equal(3);
        expect(!x.sources[0].default, 'First source was not set to default').to.be.true;
        expect(x.sources[1].default, 'Second source was set to default').to.equal(true);
        expect(x.sources[0].label, 'First source label matches input.source[0].label').to.equal('f1 label');
        expect(x.sources[1].label, 'Second source label is assigned 1').to.equal('1');

        // Test tracks
        expect(x.tracks[0].file, 'First track file matches input.tracks[0].file').to.equal('fake.vtt');
        expect(x.tracks[0].kind, 'First track kind defaults to captions').to.equal('captions');
        expect(x.tracks[0].label, 'First track label matches input.tracks[0].label').to.equal('track label');

    });

    it('input source type normalization', function() {
        const x = testItem({
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
        expect(x.sources[0].type, 'First source mp4 type read from file extension').to.equal('mp4');
        expect(x.sources[1].type, 'Second source rtmp type read from file protocol').to.equal('rtmp');
        expect(x.sources[2].type, 'Third source youtube type parsed from url').to.equal('youtube');
        expect(x.sources[3].type, 'Fourth source mp4 type split from MIME type video/mp4').to.equal('mp4');
        expect(x.sources[4].type, 'm3u8 type normailzed to hls').to.equal('hls');
        expect(x.sources[5].type, 'smil type normailzed to rtmp').to.equal('rtmp');
        expect(x.sources[6].type, 'm4a type normailzed to aac').to.equal('aac');

    });

    it('input.levels are converted to sources', function() {
        const x = testItem({
            levels: [{
                file: 'f1.mp4',
                label: 'f1 label',
                // 'default' : true,
                type: 'mp4'
            }]
        });

        expect(x.sources[0].file, 'first source file matches input.levels[0].file').to.equal('f1.mp4');
    });

    it('input.captions are converted to tracks', function() {
        const x = testItem({
            file: 'x',
            captions: [
                {
                    file: 'fake.vtt',
                    label: 'track label'
                }
            ]
        });

        expect(x.tracks[0].file, 'First track file matches input.captions[0].file').to.equal('fake.vtt');
    });

    it('property passthrough of unknown values', function() {
        const x = testItem({
            file: 'x',
            randomStr: 'rrr',
            adSchedule: {
                adbreak: {
                    tag: 'hi'
                }
            }
        });

        // This is important for passing adschedule data through
        expect(x.randomStr, 'Passes through unknown values').to.equal('rrr');
    });

    it('input.sources may contain one source object instead of array', function() {
        const x = testItem({
            sources: {
                file: 'f1.mp4',
                label: 'f1 label',
                // 'default' : true,
                type: 'mp4'
            }
        });

        expect(x.sources[0].file, 'First source file matches input.sources.file').to.equal('f1.mp4');
    });
});
