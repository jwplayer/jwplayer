import {
    pad,
    extension,
    seconds,
    hms,
    prefix,
    suffix
} from 'utils/strings';

describe('strings', function() {

    it('pad', function() {
        var str = pad('test', 7, '1');
        assert.equal(str, '111test', 'strings padding correctly done');

        str = pad('test', 3, '1');
        assert.equal(str, 'test', 'strings padding with smaller length than str should not pad anything');
    });

    it('extension', function() {
        var ext = extension('invalid');
        assert.strictEqual(ext, undefined, 'invalid path extension returns undefined');

        ext = extension(null);
        assert.strictEqual(ext, '', 'null path extension');

        ext = extension('Manifest(format=m3u8-aapl-v3)"');
        assert.equal(ext, 'm3u8', 'Azure file extension master');

        ext = extension('/Manifest(video,format=m3u8-aapl-v3,audiotrack=audio)');
        assert.equal(ext, 'm3u8', 'Azure file extension playlist');

        ext = extension('hello.jpg');
        assert.equal(ext, 'jpg', 'extension correctly received');

        // akamai url's
        ext = extension('https://akamaihd.net/i/2013/01/20131114_56c3456df2b9b_vg01/,480_270_500,.mp4.csmil/master.m3u8?hdnea=st=145747587700~exp=645456~acl=/*~hmac=34523452345sdfggdfssd345345');
        assert.equal(ext, 'm3u8', 'Akamai Tokenized Url\'s');

        ext = extension('https://domain.net/master.m3u8?dot=.');
        assert.equal(ext, 'm3u8', 'Dot in the search param');

        ext = extension('https://domain.net/master.file.m3u8?dot=.#id.1');
        assert.equal(ext, 'm3u8', 'Dot in the search and hash portions of the url');
    });

    it('seconds', function() {
        var sec = seconds(5);
        assert.equal(sec, 5, 'number input returns input');

        sec = seconds('5s');
        assert.equal(sec, 5, 'seconds input returns seconds');

        sec = seconds('5m');
        assert.equal(sec, 300, 'minutes input returns seconds');

        sec = seconds('1h');
        assert.equal(sec, 3600, 'hours input returns seconds');

        sec = seconds('5');
        assert.equal(sec, 5, 'string number input returns number');

        sec = seconds('1:01');
        assert.equal(sec, 61, 'minute seconds input returns seconds');

        sec = seconds('01:01:01.111');
        assert.equal(sec, 3661.111, 'hours minute seconds milliseconds input returns seconds');

        sec = seconds('00:00:01:15');
        assert.equal(sec, 1, 'hours minute seconds frames input without frameRate returns seconds without frames');

        sec = seconds('00:01:01:25', 50);
        assert.equal(sec, 61.5, 'hours minute seconds frames input with frameRate returns seconds');
    });

    it('hms', function() {
        var str = hms(3661);
        assert.equal(str, '01:01:01.000', 'hms gives correct time string format');

        str = hms(1.11111);
        assert.equal(str, '00:00:01.111', 'hms gives milliseconds rounded to 3dp');
    });

    it('prefix, suffix', function() {
        var pre = prefix(['1', '2'], '0');
        assert.equal(pre[0], '01', 'prefix with 0 index correct');
        assert.equal(pre[1], '02', 'prefix with 1 index correct');

        var suf = suffix(['1', '2'], '0');
        assert.equal(suf[0], '10', 'prefix suffix 0 index correct');
        assert.equal(suf[1], '20', 'prefix suffix 1 index correct');
    });
});
