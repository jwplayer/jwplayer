define([
    'controller/tracks-helper',
    'utils/underscore'
], function (tracksHelper, _) {
    var tracks;
    var itemTrack;
    var prop;
    var func;
    var count;

    var setCount = function() {
        count = tracks.length;
    };

    var assertProperty = function (assert, propToDelete, expected, msg) {
        if (propToDelete) {
            delete itemTrack[propToDelete];
        }
        var track = _.extend({}, itemTrack);
        var val = tracksHelper[func](track, count);
        track[prop] = val[prop] || val;
        tracks.push(track);
        assert.equal(track[prop], expected, msg);
    };

    // Tests for Creating track._id

    describe('tracksHelper.createId', function() {

        it('Create track._id from track properties', function() {
            tracks = [];
            itemTrack = {
                _id: '_id',
                defaulttrack: true,
                'default': true,
                file: 'file',
                kind: 'kind',
                label: 'label',
                name: 'name',
                language: 'language'
            };
            prop = '_id';
            func = 'createId';
            count = 0;


            assertProperty(assert, '', 'default', 'track.default is 1st priority even if other properties are set');
            assertProperty(assert, 'default', 'default',
                'track.defaulttrack is 2nd priority even if other properties are set');
            assertProperty(assert, 'defaulttrack', '_id', 'track._id is used if track.default is undefined');
            assertProperty(assert, '_id', 'file', 'track.file is used if track.default or track._id is undefined');
            setCount();
            assertProperty(assert, 'file', 'kind' + count,
                'track.kind is used if other properties are undefined.');
            setCount();
            assertProperty(assert, 'kind', 'cc' + count, 'cc is used as the prefix if no other properties are set');
        });
    });


    // Tests for creating track.label

    describe('tracksHelper.createLabel', function() {

        it('Create track label from track properties', function() {
            tracks = [];
            itemTrack = {
                _id: '_id',
                defaulttrack: true,
                'default': true,
                file: 'file',
                kind: 'kind',
                label: 'label',
                name: 'name',
                language: 'language'
            };
            prop = 'label';
            func = 'createLabel';
            count = 0;


            assertProperty(assert, '', 'label', 'track.label is 1st priority');
            assertProperty(assert, 'label', 'name', 'track.name is 2nd priority');
            assertProperty(assert, 'name', 'language', 'track.language is 3rd priority');
            assertProperty(assert, 'language', 'Unknown CC', 'Unknown CC is used when there is no label, name or language');
            setCount();
            assertProperty(assert, '', 'Unknown CC [5]',
                'Unknown CC [unknownTrackCount] used when there is no label, name or language and multiple tracks');
        });
    });
});
