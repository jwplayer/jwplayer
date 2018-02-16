import Config from 'api/config';

describe('API Config', function() {

    const props = [
        'autostart',
        'base',
        'controls',
        'playlist',
        'playbackRate',
        'qualityLabels',
        'width',
        'height',
    ];

    describe('init', function() {

        it('should use default config for invalid options', function() {
            const defaultConfig = new Config();

            expect(new Config(undefined), 'options=undefined').to.deep.equal(defaultConfig);
            expect(new Config({}), 'options={}').to.deep.equal(defaultConfig);
            expect(new Config(true), 'options=true').to.deep.equal(defaultConfig);
            expect(new Config(false), 'options=false').to.deep.equal(defaultConfig);
        });

        it('should deserialize string properties, except for "id"', function() {
            expect(new Config({ volume: '42' })).to.have.property('volume').which.is.a('number').which.equals(42);
            expect(new Config({ controls: 'true' })).to.have.property('controls').which.equals(true);
            expect(new Config({ id: 'abc' })).to.have.property('id').which.is.a('string').which.equals('abc');
            expect(new Config({ id: '123' })).to.have.property('id').which.is.a('string').which.equals('123');
        });

        describe('liveTimeout', function () {
            it('should default liveTimeout to 30 if between 1 and 30', function () {
                expect(new Config({ liveTimeout: 1 })).to.have.property('liveTimeout').which.equals(30);
                expect(new Config({ liveTimeout: 29 })).to.have.property('liveTimeout').which.equals(30);
                expect(new Config({ liveTimeout: -1 })).to.have.property('liveTimeout').which.equals(30);
            });

            it('should not change a config value of 0', function () {
                expect(new Config({ liveTimeout: 0 })).to.have.property('liveTimeout').which.equals(0);
            });

            it('should not change a config value of null', function () {
                expect(new Config({ liveTimeout: null })).to.have.property('liveTimeout').which.equals(null);
            });

            it('should change NaN to null', function () {
                expect(new Config({ liveTimeout: NaN })).to.have.property('liveTimeout').which.equals(null);
            });

            it('should change undefined to null', function () {
                expect(new Config({ liveTimeout: undefined })).to.have.property('liveTimeout').which.equals(null);
            });

            it('should change a non-number to to null', function () {
                expect(new Config({ liveTimeout: 'z' })).to.have.property('liveTimeout').which.equals(null);
                expect(new Config({ liveTimeout: {} })).to.have.property('liveTimeout').which.equals(null);
            });
        });
    });

    describe('aspect ratio/width', function() {

        function testConfig(obj) {
            const x = new Config(obj);

            props.forEach(function (key) {
                expect(x, `Config has ${key} attribute`).to.have.property(key);
            });
            return x;
        }

        it('should have default width of 640 and height of 360', function() {
            const x = testConfig();

            expect(x.width).to.equal(640);
            expect(x.height).to.equal(360);
        });

        it('should accept widths in different formats', function() {
            let x = testConfig({ width: '100px' });
            expect(x.width, 'pixel').to.equal('100');

            x = testConfig({ width: '100%' });
            expect(x.width, 'percent').to.equal('100%');

            x = testConfig({ width: '100' });
            expect(x.width, 'string').to.equal(100);

            x = testConfig({ width: 100 });
            expect(x.width, 'integer').to.equal(100);
        });

        it('should accept aspectratio in percentage and W:H formats', function() {
            let x = testConfig({ width: '10%', aspectratio: '4:3' });

            expect(x.aspectratio).to.equal('75%'); // 4:3 is 75% because of 3/4

            x = testConfig({ width: '100%', aspectratio: '58.25%' });
            expect(x.aspectratio).to.equal('58.25%');

            x = testConfig({ width: '100%', aspectratio: '75%' });
            expect(x.aspectratio).to.equal('75%');

            x = testConfig({ width: '200', aspectratio: '4:3' });
            expect(x, 'with fixed widths, aspectratio is ignored')
                .to.not.have.property('aspectratio');
            expect(x, 'with fixed widths, aspectratio is ignored, and default height is used')
                .to.have.property('height').which.equals(360);

            // aspectratio could be a string too since we "deserialize" numbers and bools < 6 chars in length
            x = testConfig({ width: '100%', aspectratio: 1.2 });
            expect(x).to.not.have.property('aspectratio');

            x = testConfig({ width: '100%', aspectratio: 'foo' });
            expect(x).to.not.have.property('aspectratio');

            x = testConfig({ width: '100%', aspectratio: ':0' });
            expect(x).to.not.have.property('aspectratio');
        });
    });

    describe('playlist', function() {

        it('should accept playlist values in different formats', function() {
            let x = new Config({ playlist: 'urlToLoad' });
            expect(x.playlist).to.equal('urlToLoad');

            x = new Config({ file: 'abc.mp4' });
            expect(x.playlist[0].file).to.equal('abc.mp4');
        });
    });

    describe('base url', function() {

        it('should update base to cdn or script location', function() {
            const CUSTOM_BASE = 'http://mywebsite.com/jwplayer/';
            let apiConfig;

            apiConfig = new Config({});
            expect(/.*\//.test(apiConfig.base)).to.equal(true);

            apiConfig = new Config({ base: '.' });
            expect(/.*\//.test(apiConfig.base)).to.equal(true);

            apiConfig = new Config({ base: CUSTOM_BASE });
            expect(apiConfig.base).to.equal(CUSTOM_BASE);
        });
    });
});
