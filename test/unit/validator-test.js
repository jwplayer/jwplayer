define([
    'utils/underscore',
    'utils/validator'
], function (_, validator) {
    /* jshint qunit: true */

    QUnit.module('validator');
    var test = QUnit.test.bind(QUnit);

    var testerGenerator = function (assert, method) {
        return function (left, right, message) {
            assert.strictEqual(method.apply(this, left), right, message);
        };
    };

    test('validator.exists test', function(assert) {
        var test = testerGenerator(assert, validator.exists);
        test([true], true);
        test([0],    true);
        test(['ok'], true);
        test([''], false); // I don't like this
        test([null], false);
        test([undefined], false);
    });

    test('validator.typeOf', function(assert) {
        var test = testerGenerator(assert, validator.typeOf);
        test([0],       'number');
        test([''],      'string');
        test([false],   'boolean');
        test([{}],      'object');
        test([[]],      'array');
        test([function(){}], 'function');
        test([undefined], 'undefined');
        // do we really need this?
        test([null],      'null');
    });


    test('validator.youTubeID', function(assert) {
        var ytVideoId = 'YE7VzlLtp-4';

        var sampleUrls = [
            'http://www.youtube.com/watch?v='+ytVideoId,
            'http://www.youtube.com/watch#!v='+ytVideoId,
            'http://www.youtube.com/v/'+ytVideoId,
            'http://youtu.be/'+ytVideoId,
            'http://www.youtube.com/watch?v='+ytVideoId+'&extra=foo',
            'http://www.youtube.com/watch#!v='+ytVideoId+'?extra=foo&extra2=bar',
            'http://www.youtube.com/v/'+ytVideoId+'?extra=foo&extra2=bar',
            'http://youtu.be/'+ytVideoId+'?extra=foo&extra2=bar',
            'https://www.youtube.com/v/'+ytVideoId,
            '//www.youtube.com/v/'+ytVideoId,
            ytVideoId
        ];

        assert.equal(typeof validator.youTubeID, 'function', 'is defined');
        _.each(sampleUrls, function(value) {
            assert.equal(validator.youTubeID(value), ytVideoId, 'Checking validator.youTubeID for ' + value);
        });

        assert.equal(validator.youTubeID('invalid?@?!@$?!$@'), '', 'youTubeID with invalid path');
    });

    test('isYouTube test', function(assert) {
        var sampleUrls = [
            'http://www.youtube.com/watch?v=YE7VzlLtp-4',
            'http://youtu.be/YE7VzlLtp-4',
            'https://www.youtube.com/v/YE7VzlLtp-4',
            'https://youtu.be/YE7VzlLtp-4?extra=foo&extra2=bar',
            '//www.youtube.com/v/YE7VzlLtp-4',
            '//youtu.be/YE7VzlLtp-4?extra=foo&extra2=bar'
        ];

        _.each(sampleUrls, function(value) {
            assert.equal(validator.isYouTube(value), true, 'Checking utils.isYouTube for ' + value);
        });
        var notYoutube = 'http://www.jwplayer.com/video.mp4';
        assert.equal(validator.isYouTube('value'), false, 'Checking utils.isYouTube for ' + notYoutube);
    });
});
