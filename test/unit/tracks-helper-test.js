import { createId, createLabel } from 'controller/tracks-helper';
import _ from 'utils/underscore';

let tracks;
let itemTrack;
let prop;
let func;
let count;

const setCount = function() {
    count = tracks.length;
};

const assertProperty = function (propToDelete, expected, msg) {
    if (propToDelete) {
        delete itemTrack[propToDelete];
    }
    const track = Object.assign({}, itemTrack);
    const val = func(track, count);
    track[prop] = val[prop] || val;
    tracks.push(track);
    expect(track[prop], msg).to.equal(expected);
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
        func = createId;
        count = 0;


        assertProperty('', 'default', 'track.default is 1st priority even if other properties are set');
        assertProperty('default', 'default',
            'track.defaulttrack is 2nd priority even if other properties are set');
        assertProperty('defaulttrack', '_id', 'track._id is used if track.default is undefined');
        assertProperty('_id', 'file', 'track.file is used if track.default or track._id is undefined');
        setCount();
        assertProperty('file', 'kind' + count,
            'track.kind is used if other properties are undefined.');
        setCount();
        assertProperty('kind', 'cc' + count, 'cc is used as the prefix if no other properties are set');
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
        func = createLabel;
        count = 0;


        assertProperty('', 'label', 'track.label is 1st priority');
        assertProperty('label', 'name', 'track.name is 2nd priority');
        assertProperty('name', 'language', 'track.language is 3rd priority');
        assertProperty('language', 'Unknown CC', 'Unknown CC is used when there is no label, name or language');
        setCount();
        assertProperty('', 'Unknown CC [5]',
            'Unknown CC [unknownTrackCount] used when there is no label, name or language and multiple tracks');
    });
});
