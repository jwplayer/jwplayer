import {
    pad,
    extension,
    seconds,
    offsetToSeconds,
    hms,
    prefix,
    suffix
} from 'utils/strings';

describe('strings', function() {

    it('pad', function() {
        let str = pad('test', 7, '1');
        expect(str, 'strings padding correctly done').to.equal('111test');

        str = pad('test', 3, '1');
        expect(str, 'strings padding with smaller length than str should not pad anything').to.equal('test');
    });

    describe('extension', function() {
        let ext = extension('invalid');
        it('works as expected on properly formatted URLs', function() {
            expect(ext, 'invalid path extension returns empty string').to.equal('');

            ext = extension(null);
            expect(ext, 'null path extension').to.equal('');

            ext = extension('Manifest(format=m3u8-aapl-v3)"');
            expect(ext, 'Azure file extension master').to.equal('m3u8');

            ext = extension('/Manifest(video,format=m3u8-aapl-v3,audiotrack=audio)');
            expect(ext, 'Azure file extension playlist').to.equal('m3u8');

            ext = extension('hello.jpg');
            expect(ext, 'extension correctly received').to.equal('jpg');

            // akamai url's
            ext = extension('https://akamaihd.net/i/2013/01/20131114_56c3456df2b9b_vg01/,480_270_500,.mp4.csmil/master.m3u8?hdnea=st=145747587700~exp=645456~acl=/*~hmac=34523452345sdfggdfssd345345');
            expect(ext, 'Akamai Tokenized Url\'s').to.equal('m3u8');

            ext = extension('https://domain.net/master.m3u8?dot=.');
            expect(ext, 'Dot in the search param').to.equal('m3u8');

            ext = extension('https://domain.net/master.file.m3u8?dot=.#id.1');
            expect(ext, 'Dot in the search and hash portions of the url').to.equal('m3u8');
        });
        
        it('works as expected on non URI compliant URL schemes', function() {
            ext = extension('http://csm-e.cds1.yospace.com/csm/extlive/yospace02,hlssample.m3u8;test?test');
            expect(ext, 'Non URI compliant attributes 0').to.equal('m3u8');

            ext = extension('https://content-ause3.uplynk.com/preplay2/615cf22026534185b8926eefe40e2081/c80de391786739e108907c3d39a2226a/4og97WlCwxmX9BYdFenijuFxLClsALmqHlBVTsKcJG5.m3u8?pbs=f243e9ab81c6406ab580daf3283dd3ef');
            expect(ext, 'Non URI compliant attributes 1').to.equal('m3u8');

            ext = extension('https://foxvideo.global.ssl.fastly.net/1608921926_5aa92beceaa136a13ba83c64aa29e69d6e519e52/*~/fast/csm/live/251358077.m3u8;jsessionid=F5D27AB1D86F2035192994A50D91DA63.csm-d-foxmedia-1-proxy.bln1.yospace.com?ad_env=2&cdn=fa&__token__=st%3D1608835495~exp%3D1608836125~acl%3D%2F%2A~hmac%3D87886d6094b010ae15788d5beb68107c62eba3d935b79dbda0dc70da381a04bf&yo.pdt=true&yo.ac=true&ad=fw_test&ad.flags=+slcb+sltp+qtcb+emcr+fbad+dtrd+vicb&ad.csid=foxnow%2Fwebdesktop%2Flive%2Ffox&ad.prof=516429%3Ayospace_foxnow_webdesktop_live&fnl-affiliate=KTTV&fs-affiliate=KTTV&_fw_ae=1bca1f19874e40b3675ef125882715a5&_fw_us_privacy=1---&_fw_did_idfa=&_fw_did_google_advertising_id=&_fw_did_android_id=&_fw_did=&_fw_nielsen_app_id=&_fw_vcid2=ad8c2b8a-f2a0-424a-94be-d8ab1b324987&kuid=kppidff_N11omQkS&_fw_seg=386123%3A&ad._debug=tomf2313&exp=1608835585&ss.exp=20201225184526&ss.sig=98435b3bb79843366dd75482a23450f08efc93b5&yo.aas=true&yo.pk=true&yo.ad=true&yo.dnt=false&yo.up=/1608921926_5aa92beceaa136a13ba83c64aa29e69d6e519e52/*~/fast/tx712/&yo.ap=/1608921926_5aa92beceaa136a13ba83c64aa29e69d6e519e52/*~/fast/creatives/&externalId=tx712');
            expect(ext, 'Non URI compliant attributes 2').to.equal('m3u8');

            ext = extension('https://cf-edge.video.fox/fox_net_west/index.m3u8?ad_env=1&cdn=cf&__token__=st%3D1608845042~exp%3D1608845672~acl%3D%2F%2A~hmac%3D720dffc7934fcc23a15eaf724083dacd4f7d098e9444f37642dcf4fafcfc6c0e&Expires=1608845192&Signature=myZJmKw3LirOkVgXF3d-~siKO8pwYYfs13Wv0AXab6OjQWFPBT~s2IItbBCLqqVAQPNcdoJscS7112i5IlLs1Miliu-URxrVLpOLYSttkNDEwk4t-Ai5DDg7jccwfslnh5Wkd0enIpK3ZMM5ouoS7NqC2dfZYsEPlidlCNfqUuAzFm8lCbQze1F9KkxKhkOEoG4bBIca0GS6Pr85SM1fTZLkGjQCopu73khGIHuu4ToifwbSndEX9LU0~lsDkTi6o3obMWeM~d-KDPsbgquCiJ6atpmI9VCNFK1iBkmZrInPy3T56UjMfZ08pZi9LOGdjUbzuXfJ9neovTWL-l4fIsdx2Bg4z4t6wrqQZ9bCQSxeK21GDGJcZSFbdJxNiEog95RzuI6HEA3rhJUIONKLNlIoq1SCBMJ8BBhkVcdiLkAOdeRVVPuc8Xw5394e7w5DpX47Oxhxe0PUH3boInUqTId3noMUVuOSVXbNYLNGdQMi7F48EOSHqfiywGloas4P1J4cdQYG-ipyfzyJxPZ2l5ungVE07otuTOqJDkl185xXB6cYjBCutcp~BMZoqoHWSG0wSM6J46z8dZyM-cORNHm-xcVQsFX9p79jXdr8bj3mATuOI28nisxKyQHbeccxvSQn~sJDqKCKS08YyNgW6i~MZwUaa4FGg963SwvhFEY_&Key-Pair-Id=APKAIF5IP7PKW6MQMAGA');
            expect(ext, 'Non URI compliant attributes 3').to.equal('m3u8');

            ext = extension('https://foxvideo.akamaized.net/fox_net_west/index.m3u8?ad_env=1&cdn=ak&__token__=st%3D1608845087~exp%3D1608845717~acl%3D%2F%2A~hmac%3D9c4ae88b0dba27800376bc5aa1fac951b9af5e3479ab9be25b2083f4e95c2030&hdnts=exp%3D1608845237~acl%3D%2F*~hmac%3D874e0a7b00f52cbd4e0a8fc1e41cb31d08830ad454ae7b2b7aaf12e5ee11a9f6');
            expect(ext, 'Non URI compliant attributes 4').to.equal('m3u8');

            ext = extension('https://foxvideo.s.llnwi.net/fox_net_west/index.m3u8?ad_env=1&cdn=ll&__token__=st%3D1608845131~exp%3D1608845761~acl%3D%2F%2A~hmac%3D1affde764057691e5df3e041bc90c92693d7f45f742d5bc0efa93413338182a0&p=42&s=1608845161&e=1608931561&ci=120&h=mUqaV9f6LhvX2xuyGPIiSaYGyfcEWH6MUIcdaFmfO-A');
            expect(ext, 'Non URI compliant attributes 5').to.equal('m3u8');

            ext = extension('http://csm-e.cds1.yospace.com/csm/extlive/yospace02,hlssample.m3u8;test?test');
            expect(ext, 'Non URI compliant attributes 6').to.equal('m3u8');

            ext = extension('http://live.okradio.net:8020/;*.mp3');
            expect(ext, "asdasd").to.equal('mp3');
        });
    });

    it('seconds', function() {
        timeConversionTest(seconds);
    });

    it('offsetToSeconds', function () {
        timeConversionTest(offsetToSeconds);

        let sec = offsetToSeconds('50%', 100);
        expect(sec, 'percentage and duration inputs return seconds').to.equal(50);

        sec = offsetToSeconds('25%');
        expect(sec, 'percentage without duration returns null').to.equal(null);

        sec = offsetToSeconds('25%', 0);
        expect(sec, 'percentage with duration of 0 returns null').to.equal(null);

        sec = offsetToSeconds('25%', 'abc');
        expect(sec, 'percentage with NaN duration returns null').to.equal(null);

        sec = offsetToSeconds('50', 100);
        expect(sec, 'non-percentage numeric string with duration inputs return seconds').to.equal(50);

        sec = offsetToSeconds(null, 100);
        expect(sec, 'null and duration inputs return 0').to.equal(0);

        sec = offsetToSeconds(undefined, 100);
        expect(sec, 'undefined and duration inputs return 0').to.equal(0);

        sec = offsetToSeconds('', 100);
        expect(sec, 'empty string and duration inputs return 0').to.equal(0);

        sec = offsetToSeconds('abc', 100);
        expect(sec, 'alpha only strings and duration inputs return 0').to.equal(0);
    });

    function timeConversionTest(converter) {
        let sec = converter(5);
        expect(sec, 'number input returns input').to.equal(5);

        sec = converter('5s');
        expect(sec, 'seconds input returns seconds').to.equal(5);

        sec = converter('5m');
        expect(sec, 'minutes input returns seconds').to.equal(300);

        sec = converter('1h');
        expect(sec, 'hours input returns seconds').to.equal(3600);

        sec = converter('5');
        expect(sec, 'string number input returns number').to.equal(5);

        sec = converter('1:01');
        expect(sec, 'minute seconds input returns seconds').to.equal(61);

        sec = converter('01:01:01.111');
        expect(sec, 'hours minute seconds milliseconds input returns seconds').to.equal(3661.111);

        sec = converter('00:00:01:15');
        expect(sec, 'hours minute seconds frames input without frameRate returns seconds without frames').to.equal(1);

        if (converter === offsetToSeconds) {
            sec = converter('00:01:01:25', null, 50);
        } else {
            sec = converter('00:01:01:25', 50);
        }
        expect(sec, 'hours minute seconds frames input with frameRate returns seconds').to.equal(61.5);
    }

    it('hms', function() {
        let str = hms(3661);
        expect(str, 'hms gives correct time string format').to.equal('01:01:01.000');

        str = hms(1.11111);
        expect(str, 'hms gives milliseconds rounded to 3dp').to.equal('00:00:01.111');
    });

    it('prefix, suffix', function() {
        const pre = prefix(['1', '2'], '0');
        expect(pre[0], 'prefix with 0 index correct').to.equal('01');
        expect(pre[1], 'prefix with 1 index correct').to.equal('02');

        const suf = suffix(['1', '2'], '0');
        expect(suf[0], 'prefix suffix 0 index correct').to.equal('10');
        expect(suf[1], 'prefix suffix 1 index correct').to.equal('20');
    });
});
