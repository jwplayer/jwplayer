define([
    'test/underscore',
    'api/config'
], function (_, Config) {
    /* jshint qunit: true */

    QUnit.module('API config');
    var test = QUnit.test.bind(QUnit);

    function validWidth(val) {

        // percentages work here
        if (val.slice && val.slice(-1) === '%') {
            val = val.slice(0,-1);
        }

        // is it numeric?
        return !isNaN(val);
    }

    function testConfig(assert, obj) {
        var x = new Config(obj);


        var attrs = ['width', 'height', 'base'];

        assert.ok(validWidth(x.width), 'width is a number ' + x.width);
        assert.ok(validWidth(x.height), 'height is a number ' + x.height);
        _.each(attrs, function(a) {
            assert.ok(_.has(x, a), 'Config has ' + a + ' attribute');
        });
        return x;
    }

    test('handles worst case config options', function(assert) {
        testConfig(assert);
        testConfig(assert, undefined);
        testConfig(assert, {});
        testConfig(assert, true);
        testConfig(assert, false);

        // These do not pass, should they?
        // testConfig(assert, {width: 'bad'});
        // testConfig(assert, {width: true});
    });

    test('accepts width values in different formats', function(assert) {
        var x = testConfig(assert, {
            width : '100px'
        });
        assert.equal(x.width, '100', 'px values for width work');

        x = testConfig(assert, {
            width : '100%'
        });
        assert.equal(x.width, '100%', '% values for width work');

        x = testConfig(assert, {
            width : '100'
        });
        assert.equal(x.width, '100', 'string numbers work');

        x = testConfig(assert, {
            width : 100
        });
        assert.equal(x.width, '100', 'raw numbers work');
    });

    test('accepts playlist values in different formats', function(assert) {
        var x = testConfig(assert, {
            playlist:'urlToLoad'
        });
        assert.equal(x.playlist, 'urlToLoad', 'Passing a URL will return it properly');

        x = testConfig(assert, {
            file:'abc.mp4'
        });
        assert.equal(x.playlist[0].file, 'abc.mp4', 'Passing a file attr works');
    });

    test('accepts aspectratio in percentage and W:H formats', function(assert) {
        // http://support.jwplayer.com/customer/portal/articles/1406644-making-jw-player-responsive
        var x = testConfig(assert, {
            width:'10%',
            aspectratio : '4:3'
        });
        // 4:3 is 75% because of 3/4
        assert.equal(x.aspectratio, '75%', 'integer aspect ratio');

        x = testConfig(assert, {
            width : '100%',
            aspectratio : '58.25%'
        });
        assert.strictEqual(x.aspectratio, '58.25%', 'percentage aspect ratio is passed through');

        x = testConfig(assert, {
            width : '100%',
            aspectratio : '75%'
        });
        assert.strictEqual(x.aspectratio, '75%', 'percentage aspect ratio is passed through');


        x = testConfig(assert, {
            width : '200',
            aspectratio : '4:3'
        });
        assert.strictEqual(x.aspectratio, undefined, 'When width isn\'t a percentage, there is no aspect ratio');

        // TODO: Why not support a numeric value of width/height?
        x = testConfig(assert, {
            width : '100%',
            // aspectratio could be a string too since we "deserialize" numbers and bools < 6 chars in length
            aspectratio : 1.2
        });
        assert.strictEqual(x.aspectratio, undefined, 'Numeric aspectratio values are not supported');

        x = testConfig(assert, {
            width : '100%',
            aspectratio : 'foo'
        });
        assert.strictEqual(x.aspectratio, undefined, 'aspectratio must be in the format "n:n"');

        x = testConfig(assert, {
            width : '100%',
            aspectratio : ':0'
        });
        assert.strictEqual(x.aspectratio, undefined, 'aspectratio must contain positive numbers');
    });

    test('updates base to cdn or script location', function(assert) {
        var CUSTOM_BASE = 'http://mywebsite.com/jwplayer/';
        var apiConfig;


        apiConfig = testConfig(assert, {});
        if (window.__SELF_HOSTED__) {
            assert.ok(/.+\//.test(apiConfig.base),
                'Config sets base to the jwplayer script location in self-hosted builds');
        } else {
            assert.ok(/.+\//.test(apiConfig.base),
                'Config sets base to the repo');
        }

        apiConfig = testConfig(assert, {
            base: '.'
        });
        assert.ok(/.+\//.test(apiConfig.base),
            'Config replaces a base of "." with the jwplayer script location');

        apiConfig = testConfig(assert, {
            base: CUSTOM_BASE
        });
        assert.equal(apiConfig.base, CUSTOM_BASE,
            'Config does not replace base when a custom value other than "." is specified');
    });

    test('flattens skin object', function(assert) {
        var skinObject = {
            name: 'foo',
            url: 'skin/url',
            inactive:   '#888888',
            active:     '#FFFFFF',
            background: '#000000'
        };
        var x = testConfig(assert, {
            skin: skinObject
        });

        assert.equal(x.skinUrl, skinObject.url,
            'skin.url is flattened to skinUrl');
        assert.equal(x.skinColorInactive, skinObject.inactive,
            'skin.inactive is flattened to skinColorInactive');
        assert.equal(x.skinColorActive, skinObject.active,
            'skin.active is flattened to skinColorActive');
        assert.equal(x.skinColorBackground, skinObject.background,
            'skin.background is flattened to skinColorBackground');
        assert.equal(x.skin, skinObject.name,
            'skin.name is flattened to skin');

        x = testConfig(assert, {
            skin: {}
        });
        assert.equal(x.skin, 'seven',
            'skin.name defaults to "seven" when a skin object with no name is passed');
    });

    test('removes ".xml" from skin param', function(assert) {
        var x = testConfig(assert, {
            skin: 'six.xml'
        });
        assert.equal(x.skin, 'six',
            'Skin name is updated');

        x = testConfig(assert, {});
        assert.equal(x.skin, 'seven',
            'skin.name defaults to "seven" when no skin is specified');
    });
});
