define([
    'playlist/source',
    'providers/providers',
    'utils/browser'
], function (source, Providers, browser) {
    /* jshint maxlen: 1000, qunit: true */

    browser.flashVersion = function() {
        return 11.2;
    };

    // TODO: Many of these can be moved to quint/config/{type}.source{_features}
    var videoSources = {
        'mp4': { file: 'http://content.bitsontherun.com/videos/q1fx20VZ-52qL9xLP.mp4' },
        'flv': { file:'http://playertest.longtailvideo.com/flv-cuepoints/honda_accord.flv' },	// Flash Specific
        'smil': { file: 'assets/os/edgecast.smil' },                                            // Flash Specific
        'f4v': { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.f4v' },
        'm4v': { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.m4v' },

        'm4a': { file: 'http://content.bitsontherun.com/videos/nPripu9l-Q2YqwWcp.m4a', type: 'aac' },
        'mp4_mp3': { file: 'http://content.bitsontherun.com/videos/nPripu9l-ywAKK1m8.mp4', type: 'mp3' },
        'mp3': { file: 'http://content.bitsontherun.com/videos/yj1shGJB-ywAKK1m8.mp3' },
        'aac': { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-I3ZmuSFT.aac' },
        'ogg': { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-364765.ogg' },

        'oga': { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-rjiewRbX.oga' },
        'webm': { file:'http://content.bitsontherun.com/videos/3XnJSIm4-27m5HpIu.webm' },
        'm3u8': { file: 'http://ga.video.cdn.pbs.org/videos/america-numbers/2302bcb4-acce-4dd3-a4ce-5e04005ebdf9/160593/hd-mezzanine-16x9/e901b01c_abyn0108_mezz16x9-16x9-hls-64-800k.m3u8' },  // hls video
        'hls': { file: 'http://playertest.longtailvideo.com/adaptive/bipbop/bipbopall.hls', type: 'm3u8' },
        'hls_androidhls_true': { file: 'http://playertest.longtailvideo.com/adaptive/bipbop/bipbopall.hls', type: 'm3u8', androidhls: true },

        'hls_androidhls_false': { file: 'http://playertest.longtailvideo.com/adaptive/bipbop/bipbopall.hls', type: 'm3u8', androidhls: false },
        'mov': { file: 'assets/os/bunny.mov' },
        'youtube': { file: 'http://www.youtube.com/watch?v=YE7VzlLtp-4' }
    };

	// Exists to protect against undefined results.  If no provider is chosen we get undefined.
	var getName = function(func) {
		if (func) {
            if (func.name) {
                return func.name;
            }
            return func.toString().match(/^function\s*([^\s(]+)/)[1];
		}
        return 'None chosen';
	};

    function fileDescription(file) {
        var description = source(file).type;
        var extension = file.file.replace(/^.+\.([^\.]+)$/, '$1');
        if (description !== extension) {
            description += ' (.'+ extension +')';
        }
        if (file.type !== undefined) {
            description += ' with `type: ' + file.type + '`';
        }
        if (file.androidhls !== undefined) {
            description += ' with `androidhls: ' + file.androidhls + '` ua:' + navigator.userAgent;
        }
        return description;
    }

    function getProvidersTestRunner(assert, primary) {
        var providers = new Providers({primary: primary});

        return function testChosenProvider(file, providerName, message) {
            var chosenProvider = providers.choose(source(file));
            message = null;
            if (!message) {
                message = providerName + ' is chosen for ' + fileDescription(file);
            }
            assert.equal(getName(chosenProvider), providerName, message);
        };
    }

    function getKeyIndexes(arr) {
        var o = {};
        for (var i= 0; i < arr.length; i++) {
            var name = getName(arr[i]);
            o[name] = i;
        }
        return o;
    }

    QUnit.module('provider primary priority');
    var test = QUnit.test.bind(QUnit);

    test('no primary defined', function (assert) {
        var providerList = new Providers().providers;
        assert.expect(4);

		assert.ok(providerList.length >= 3, 'There are at least 3 providers listed');

        var keys = getKeyIndexes(providerList);
		assert.ok(keys.html5 < keys.flash, 'HTML5 has higher priority than flash');
        assert.ok(keys.html5 > keys.youtube, 'HTML5 has lower priority than youtube');
        assert.ok(keys.flash > keys.youtube, 'Flash has lower priority than youtube');
    });

    test('html5 primary requested', function (assert) {
		var providerList = new Providers({primary: 'html5'}).providers;
        assert.expect(3);

        var keys = getKeyIndexes(providerList);
        assert.ok(keys.html5 < keys.flash, 'HTML5 has higher priority than flash');
        assert.ok(keys.html5 > keys.youtube, 'HTML5 has lower priority than youtube');
        assert.ok(keys.flash > keys.youtube, 'Flash has lower priority than youtube');
    });


    test('flash primary requested', function (assert) {
		var providerList = new Providers({primary: 'flash'}).providers;
        assert.expect(3);

        var keys = getKeyIndexes(providerList);
        assert.ok(keys.html5 > keys.flash, 'HTML5 has lower priority than flash');
        assert.ok(keys.html5 > keys.youtube, 'HTML5 has lower priority than youtube');
        assert.ok(keys.flash > keys.youtube, 'Flash has lower priority than youtube');
    });

	test('invalid primary requested', function (assert) {
		var providerList = new Providers({primary:'invalid primary value'}).providers;
        assert.expect(3);

        var keys = getKeyIndexes(providerList);
        assert.ok(keys.html5 < keys.flash, 'HTML5 has higher priority than flash');
        assert.ok(keys.html5 > keys.youtube, 'HTML5 has lower priority than youtube');
        assert.ok(keys.flash > keys.youtube, 'Flash has lower priority than youtube');
	});

    QUnit.module('provider.choose');

	// HTML5 Primary
	test('html5 primary', function (assert) {
        assert.expect(17);

        var runTest = getProvidersTestRunner(assert, 'html5');

        // We only allow "androidhls" configurations to use hls on 4.1 and higher
        var isAndroidWithHls = (/Android [456]\.[123456789]]/i).test(navigator.userAgent);

        runTest(videoSources.mp4, 'html5');
        runTest(videoSources.f4v, 'html5');
        runTest(videoSources.m4v, 'html5');
        runTest(videoSources.m4a, 'html5');
        runTest(videoSources.aac, 'html5');
        runTest(videoSources.mp3, 'html5');
        runTest(videoSources.ogg, 'html5');
        runTest(videoSources.oga, 'html5');
        runTest(videoSources.webm,'html5');
        runTest(videoSources.mov, 'html5');

        // The video stub defined in this test cannot handle these types
        runTest(videoSources.m3u8,'None chosen');
        runTest(videoSources.hls, 'None chosen');
        runTest(videoSources.flv, 'flash');
        runTest(videoSources.smil,'flash');
        runTest(videoSources.hls_androidhls_false, 'None chosen');
        runTest(videoSources.youtube, 'youtube');

        // our android androidhls logic in the video provider circumvents the canPlayType check
        runTest(videoSources.hls_androidhls_true,  isAndroidWithHls ? 'None chosen' : 'None chosen');
    });

	// Flash Primary
	test('flash primary', function (assert) {
        assert.expect(17);

        var runTest = getProvidersTestRunner(assert, 'flash');

        runTest(videoSources.mp4, 'flash');
        runTest(videoSources.flv, 'flash');
        runTest(videoSources.smil,'flash');
        runTest(videoSources.f4v, 'flash');
        runTest(videoSources.m4v, 'flash');
        runTest(videoSources.m4a, 'flash');
        runTest(videoSources.aac, 'flash');
        runTest(videoSources.mp3, 'flash');
        runTest(videoSources.m3u8,'None chosen');
        runTest(videoSources.hls, 'None chosen');
        runTest(videoSources.hls_androidhls_true,  'None chosen');
        runTest(videoSources.hls_androidhls_false, 'None chosen');
        runTest(videoSources.mov, 'flash');

        // The Flash provider cannot play these types
        runTest(videoSources.ogg, 'html5');
        runTest(videoSources.oga, 'html5');
        runTest(videoSources.webm,'html5');
        runTest(videoSources.youtube, 'youtube');
    });
});