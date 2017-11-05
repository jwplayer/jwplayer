import * as validator from 'utils/validator';
import _ from 'utils/underscore';

describe('validator', function() {
    const testerGenerator = function (method) {
        return function (left, right, message) {
            expect(method.apply(this, left), message).to.equal(right);
        };
    };

    it('validator.exists test', function() {
        const test = testerGenerator(validator.exists);
        test([true], true);
        test([0], true);
        test(['ok'], true);
        test([''], false); // I don't like this
        test([null], false);
        test([undefined], false);
    });

    it('validator.typeOf', function() {
        const test = testerGenerator(validator.typeOf);
        test([0], 'number');
        test([''], 'string');
        test([false], 'boolean');
        test([{}], 'object');
        test([[]], 'array');
        test([function() {
        }], 'function');
        test([undefined], 'undefined');
        test([null], 'null');
    });

    it('isYouTube test', function() {
        const sampleUrls = [
            'http://www.youtube.com/watch?v=YE7VzlLtp-4',
            'http://youtu.be/YE7VzlLtp-4',
            'https://www.youtube.com/v/YE7VzlLtp-4',
            'https://youtu.be/YE7VzlLtp-4?extra=foo&extra2=bar',
            '//www.youtube.com/v/YE7VzlLtp-4',
            '//youtu.be/YE7VzlLtp-4?extra=foo&extra2=bar'
        ];

        _.each(sampleUrls, function (value) {
            expect(validator.isYouTube(value), 'Checking utils.isYouTube for ' + value).to.be.true;
        });
        const notYoutube = 'http://www.jwplayer.com/video.mp4';
        expect(validator.isYouTube('value'), 'Checking utils.isYouTube for ' + notYoutube).to.be.false;
    });
});
