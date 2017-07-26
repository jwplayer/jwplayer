import { browserVersion } from 'environment/browser-version';

describe('os-version', function() {
    it('returns the browser version from a Chrome user agent', function() {
        const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36';
        const actual = browserVersion({ chrome: true }, agent);

        assert.equal(actual.version, '59.0.3071.115');
        assert.equal(actual.major, 59);
        assert.equal(actual.minor, 0);
    });

    it('returns the browser version from a CriOS user agent', function() {
        const agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1';
        const actual = browserVersion({ chrome: true }, agent);

        assert.equal(actual.version, '56.0.2924.75');
        assert.equal(actual.major, 56);
        assert.equal(actual.minor, 0);
    });

    it('returns the browser version from a Safari user agent', function() {
        const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30';
        const actual = browserVersion({ safari: true }, agent);

        assert.equal(actual.version, '10.1');
        assert.equal(actual.major, 10);
        assert.equal(actual.minor, 1);
    });

    it('returns the browser version from a Firefox user agent', function() {
        const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:10.0) Gecko/20100101 Firefox/10.0';
        const actual = browserVersion({ firefox: true }, agent);

        assert.equal(actual.version, '10.0');
        assert.equal(actual.major, 10);
        assert.equal(actual.minor, 0);
    });

    it('returns the browser version from a Microsoft user agent, rv', function() {
        const agent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko';
        const actual = browserVersion({ ie: true }, agent);

        assert.equal(actual.version, '11.0');
        assert.equal(actual.major, 11);
        assert.equal(actual.minor, 0);
    });

    it('returns the browser version from a Microsoft user agent, MSIE', function() {
        const agent = 'Mozilla/5.0 (compatible; MSIE 8.0; Windows CE; Trident/4.0)_vjnkx';
        const actual = browserVersion({ ie: true }, agent);

        assert.equal(actual.version, '8.0');
        assert.equal(actual.major, 8);
        assert.equal(actual.minor, 0);
    });

    it('returns the browser version from a Microsoft user agent, Edge', function() {
        const agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';
        const actual = browserVersion({ edge: true }, agent);

        assert.equal(actual.version, '13.10586');
        assert.equal(actual.major, 13);
        assert.equal(actual.minor, 10586);
    });
});
