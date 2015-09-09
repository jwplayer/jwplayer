define([
    'test/underscore',
    'utils/helpers'
], function ( _, utils) {
    /* jshint qunit: true */

    var testerGenerator = function (assert, method) {
        return function (left, right, message) {
            assert.strictEqual(method.apply(this, left), right, message);
        };
    };

    module('utils');

    test('utils.exists', function(assert) {
        assert.expect(7);

        assert.equal(typeof utils.exists, 'function', 'is defined');

        var test = testerGenerator(assert, utils.exists);
        test([true], true);
        test([0],    true);
        test(['ok'], true);
        test([''], false); // I don't like this
        test([null], false);
        test([undefined], false);
    });

    test('utils.getAbsolutePath', function(assert) {
        assert.expect(9);
        assert.equal(typeof utils.getAbsolutePath, 'function', 'is defined');

        var test = testerGenerator(assert, utils.getAbsolutePath);
        test(['.',   'https://example.com/alpha/beta/gamma'], 'https://example.com/alpha/beta');
        test(['/',   'https://example.com/alpha/beta/gamma'], 'https://example.com/');
        test(['../', 'https://example.com/alpha/beta/gamma'], 'https://example.com/alpha');

        test(['./hello/', 'https://example.com/'], 'https://example.com/hello', 'Testing with adding a directory');
        test(['/',   'https://example.com/alpha/beta/gamma?x=1&y=2'], 'https://example.com/',
            'Testing with GET arguments');
        test(['../../../../../', 'https://example.com/'], 'https://example.com/', 'Testing with extraneous ../');

        test(['hello.mp4', 'https://example.com/oh/hi.html'], 'https://example.com/oh/hello.mp4');
        test(['../hello.mp4', 'https://example.com/hi.html'], 'https://example.com/hello.mp4');
    });

    test('utils.log', function(assert) {
        assert.expect(2);
        assert.equal(typeof utils.log, 'function', 'is defined');
        assert.strictEqual(utils.log(), undefined, 'utils.log returns undefined');
    });

    test('utils browser tests', function(assert) {
        assert.expect(18);

        assert.equal(typeof utils.isFF, 'function', 'is defined');
        assert.equal(typeof utils.isIETrident, 'function', 'is defined');
        assert.equal(typeof utils.isMSIE, 'function', 'is defined');
        assert.equal(typeof utils.isIE, 'function', 'is defined');
        assert.equal(typeof utils.isSafari, 'function', 'is defined');
        assert.equal(typeof utils.isIOS, 'function', 'is defined');
        assert.equal(typeof utils.isAndroidNative, 'function', 'is defined');
        assert.equal(typeof utils.isAndroid, 'function', 'is defined');
        assert.equal(typeof utils.isMobile, 'function', 'is defined');

        assert.equal(typeof utils.isFF(), 'boolean');
        assert.equal(typeof utils.isIETrident(), 'boolean');
        assert.equal(typeof utils.isMSIE(), 'boolean');
        assert.equal(typeof utils.isIE(), 'boolean');
        assert.equal(typeof utils.isSafari(), 'boolean');
        assert.equal(typeof utils.isIOS(), 'boolean');
        assert.equal(typeof utils.isAndroidNative(), 'boolean');
        assert.equal(typeof utils.isAndroid(), 'boolean');
        assert.equal(typeof utils.isMobile(), 'boolean');
    });

    test('utils.isInt', function(assert) {
        assert.expect(10);

        assert.equal(typeof utils.isInt, 'function', 'is defined');

        var test = testerGenerator(assert, utils.isInt);
        test([0],       true);
        test([0x10],    true);
        test([24],      true);
        test([0.5],     false);
        test(['10.'],    true);
        test(['3.1'],   false);
        test([NaN],     false);
        test([null],    false);
        test([undefined], false);
    });

    test('utils.typeOf', function(assert) {
        assert.expect(9);

        assert.equal(typeof utils.typeOf, 'function', 'is defined');

        var test = testerGenerator(assert, utils.typeOf);
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

    test('utils.flashVersion', function(assert) {
        assert.expect(2);

        var flashVersion = utils.flashVersion();

        assert.equal(typeof utils.flashVersion, 'function', 'flashVersion is defined');
        assert.equal(typeof flashVersion, 'number', 'Flash version is ' + flashVersion);
    });

    test('utils.getScriptPath', function(assert) {
        assert.expect(2);

        assert.equal(typeof utils.getScriptPath, 'function', 'is defined');

        var scriptPath = utils.getScriptPath('utils-test.js');
        assert.ok(/\S+\:\/\/.+\/$/.test(scriptPath),
            'returns a directory url ending with a forward slash "'+ scriptPath +'"');
    });

    test('utils.isYouTube', function(assert) {
        var sampleUrls = [
            'http://www.youtube.com/watch?v=YE7VzlLtp-4',
            'http://youtu.be/YE7VzlLtp-4',
            'https://www.youtube.com/v/YE7VzlLtp-4',
            'https://youtu.be/YE7VzlLtp-4?extra=foo&extra2=bar',
            '//www.youtube.com/v/YE7VzlLtp-4',
            '//youtu.be/YE7VzlLtp-4?extra=foo&extra2=bar'
        ];

        assert.expect(sampleUrls.length+2);
        assert.equal(typeof utils.isYouTube, 'function', 'is defined');
        _.each(sampleUrls, function(value) {
            assert.equal(utils.isYouTube(value), true, 'Checking utils.isYouTube for ' + value);
        });
        var notYoutube = 'http://www.jwplayer.com/video.mp4';
        assert.equal(utils.isYouTube('value'), false, 'Checking utils.isYouTube for ' + notYoutube);
    });

    test('utils.youTubeID', function(assert) {
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

        assert.expect(sampleUrls.length+1);
        assert.equal(typeof utils.youTubeID, 'function', 'is defined');
        _.each(sampleUrls, function(value) {
            assert.equal(utils.youTubeID(value), ytVideoId, 'Checking utils.youTubeID for ' + value);
        });
    });

    // TODO: 
    // isRtmp
    // foreach
    // versionCheck - version = '6.10.4900'
    // ajax
    // parseXML
    // between (clamp)
    // seconds

    test('utils.addClass', function (assert) {
        assert.expect(4);
        assert.equal(typeof utils.addClass, 'function', 'is defined');
        
        var element = document.createElement('div');
        assert.strictEqual(element.className, '', 'Created an element with no classes');

        utils.addClass(element, 'class1');
        assert.equal(element.className, 'class1', 'Added first class to element');

        utils.addClass(element, 'class2');
        assert.equal(element.className, 'class1 class2', 'Added second class to element');
    });

    test('utils.removeClass', function (assert) {
        assert.expect(4);
        assert.equal(typeof utils.removeClass, 'function', 'is defined');
        
        var element = document.createElement('div');
        element.className = 'class1 class2';
        assert.equal(element.className, 'class1 class2', 'Created an element with two classes');

        utils.removeClass(element, 'class2');
        assert.equal(element.className, 'class1', 'Removed second to last class from element');

        utils.removeClass(element, 'class1');
        assert.equal(element.className, '', 'Removed last class from element');
    });

    test('utils.indexOf', function (assert) {
        assert.expect(1);
        assert.equal(typeof utils.indexOf, 'function', 'is defined');
        // provided by underscore 1.6
    });

    test('utils.serialize', function (assert) {
        assert.equal(typeof utils.serialize, 'function', 'utils.serialize is defined');

        var array = [];
        var object = {};

        var test = testerGenerator(assert, utils.serialize);
        test([undefined], null, 'undefined returns null');
        test([null], null, 'null is passed through');
        test([array], array, 'arrays are passed through');
        test([object], object, 'objects are passed through');
        test([1], 1, 'numbers are passed through');
        test([true], true, 'booleans (true) are passed through');
        test([false], false, 'booleans (false) are passed through');
        test(['true'], true, 'string "true" returns true');
        test(['false'], false, 'string "false" returns false');
        test(['TRUE'], true, 'string "TRUE" returns true');
        test(['FALSE'], false, 'string "FALSE" returns false');
        test(['100.0'], 100, 'strings of 5 chars or less that can be coerced into a number are converted');
        test(['1000.0'], '1000.0', 'strings of 6 chars or more that can be coerced into a number are not converted');
        test(['1px'], '1px', 'css px values are not changed');
        test(['100%'], '100%', 'percentage values are not changed');
    });

});
