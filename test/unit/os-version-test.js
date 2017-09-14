import { osVersion } from 'environment/os-version';

describe('os-version', function() {
    it('returns the OS version from a Mac OS/OS X user agent, underscore separated', function() {
        const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36';
        expect(osVersion({ mac: true }, agent)).to.deep.equal({
            version: '10_12_4',
            major: 10,
            minor: 12
        });
    });

    it('returns the OS version from a Mac OS/OS X user agent, period separated', function() {
        const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0';
        expect(osVersion({ mac: true }, agent)).to.deep.equal({
            version: '10.12',
            major: 10,
            minor: 12
        });
    });

    it('returns the OS version from a Windows 10 user agent', function() {
        const agent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36';
        expect(osVersion({ windows: true }, agent)).to.deep.equal({
            version: '10.0',
            major: 10,
            minor: 0
        });
    });

    it('returns the OS version from a Windows 8.1 user agent', function() {
        const agent = 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';
        expect(osVersion({ windows: true }, agent)).to.deep.equal({
            version: '8.1',
            major: 8,
            minor: 1
        });
    });

    it('returns the OS version from a Windows 8 user agent', function() {
        const agent = 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2';
        expect(osVersion({ windows: true }, agent)).to.deep.equal({
            version: '8.0',
            major: 8,
            minor: 0
        });
    });

    it('returns the OS version from a Windows 7 user agent', function() {
        const agent = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36';
        expect(osVersion({ windows: true }, agent)).to.deep.equal({
            version: '7.0',
            major: 7,
            minor: 0
        });
    });

    it('returns the OS version from an Android user agent', function() {
        const agent = 'Mozilla/5.0 (Linux; Android 7.0; SM-G930T Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/121.0.0.20.69;]';
        expect(osVersion({ android: true }, agent)).to.deep.equal({
            version: '7.0',
            major: 7,
            minor: 0
        });
    });

    it('returns the OS version from an iOS user agent', function() {
        const agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_2_1 like Mac OS X) AppleWebKit/602.4.6 (KHTML, like Gecko) Version/10.0 Mobile/14D27 Safari/602.1';
        expect(osVersion({ iOS: true }, agent)).to.deep.equal({
            version: '10_2_1',
            major: 10,
            minor: 2
        });
    });
});
