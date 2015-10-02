define([
    'utils/strings'
], function (strings) {
    /* jshint qunit: true */

    module('strings');

    test('strings.pad', function(assert) {
        var str = strings.pad('test', 7, '1');
        assert.equal(str, '111test', 'strings padding correctly done');

        str = strings.pad('test', 3, '1');
        assert.equal(str, 'test', 'strings padding with smaller length than str should not pad anything');
    });

    test('strings.extension', function(assert) {
        var ext = strings.extension('invalid');
        assert.equal(ext, undefined, 'invalid path extension returns undefined');

        ext = strings.extension('(format=m3u8-');
        assert.equal(ext, 'm3u8', 'azureFile extension');

        ext = strings.extension(null);
        assert.equal(ext, '', 'no path extension');

        ext = strings.extension('hello.jpg');
        assert.equal(ext,'jpg', 'extension correctly received');
    });

    test('strings.seconds', function(assert) {
        var sec = strings.seconds(5);
        assert.equal(sec, 5, 'number input returns input');

        sec = strings.seconds('5s');
        assert.equal(sec, 5, 'seconds input returns seconds');

        sec = strings.seconds('5m');
        assert.equal(sec, 300, 'minutes input returns seconds');

        sec = strings.seconds('1h');
        assert.equal(sec, 3600, 'hours input returns seconds');

        sec = strings.seconds('5');
        assert.equal(sec, 5, 'string number input returns number');

        sec = strings.seconds('1:01');
        assert.equal(sec, 61, 'minute seconds input returns seconds');

        sec = strings.seconds('01:01:01.111');
        assert.equal(sec, 3661.111, 'hours minute seconds milliseconds input returns seconds');
    });

    test('strings.hms', function(assert) {
        var str = strings.hms(3661);
        assert.equal(str, '01:01:01.000', 'hms gives correct time string format');

        str = strings.hms(1.11111);
        assert.equal(str, '00:00:01.111', 'hms gives milliseconds rounded to 3dp');
    });

    test('strings.prefix', function(assert) {
        var prefix = strings.prefix(['1', '2'], '0');
        assert.equal(prefix[0], '01', 'prefix with 0 index correct');
        assert.equal(prefix[1], '02', 'prefix with 1 index correct');

        var suffix = strings.suffix(['1', '2'], '0');
        assert.equal(suffix[0], '10', 'prefix suffix 0 index correct');
        assert.equal(suffix[1], '20', 'prefix suffix 1 index correct');
    });

});
