define([
    'test/underscore',
    'api/config'
], function (_, config) {
    /* jshint qunit: true */
    module('Embed Config');

    function validWidth(val) {

        // percentages work here
        if (val.slice && val.slice(-1) === '%') {
            val = val.slice(0,-1);
        }

        // is it numeric?
        return !isNaN(val);
    }

    function testConfig(obj) {
        var x = config(obj);


        var attrs = ['width', 'height', 'base'];

        ok(validWidth(x.width), 'width is a number ' + x.width);
        ok(validWidth(x.height), 'height is a number ' + x.height);
        _.each(attrs, function(a) {
            ok(_.has(x, a), 'Config has ' + a + ' attribute');
        });
        return x;
    }

    test('Test worst case config options', function() {
        testConfig();
        testConfig(undefined);
        testConfig({});
        testConfig(true);
        testConfig(false);

        // These do not pass, should they?
        // testConfig({width: 'bad'});
        // testConfig({width: true});
    });

    test('Testing width values', function() {
        var x = testConfig({
            width : '100px'
        });
        equal(x.width, '100', 'px values for width work');

        x = testConfig({
            width : '100%'
        });
        equal(x.width, '100%', '% values for width work');

        x = testConfig({
            width : '100'
        });
        equal(x.width, '100', 'string numbers work');

        x = testConfig({
            width : 100
        });
        equal(x.width, '100', 'raw numbers work');
    });

    test('Testing playlist values', function() {
        var x = testConfig({
            playlist:'urlToLoad'
        });
        equal(x.playlist, 'urlToLoad', 'Passing a URL will return it properly');

        x = testConfig({
            file:'abc.mp4'
        });
        equal(x.playlist.file, 'abc.mp4', 'Passing a file attr works');
    });

    test('Testing aspect ratio', function() {
        // http://support.jwplayer.com/customer/portal/articles/1406644-making-jw-player-responsive
        var x = testConfig({
            width:'10%',
            aspectratio : '4:3'
        });

        // 4:3 is 75% because of 3/4
        equal(x.aspectratio, '75%', 'integer aspect ratio');

        x = testConfig({
            width : '200',
            aspectratio : '4:3'
        });
        strictEqual(x.aspectratio, undefined, 'When width isn\'t a percentage, there is no aspect ratio');

        // TODO: Why not support a numeric value of width/height?
        x = testConfig({
            width : '100%',
            aspectratio : 1.2
        });
        strictEqual(x.aspectratio, undefined, 'Numeric aspectratio values are not supported');

        x = testConfig({
            width : '100%',
            aspectratio : '1'
        });
        strictEqual(x.aspectratio, undefined, 'aspectratio must be in the format "n:n"');

        x = testConfig({
            width : '100%',
            aspectratio : ':0'
        });
        strictEqual(x.aspectratio, undefined, 'aspectratio must contain positive numbers');
    });
});
