import _ from 'underscore';
import Config from 'api/config';

describe('API Config', function() {

    const props = ['width', 'height', 'base'];

    describe('init', function() {

        it('should use default config for invalid options', function() {
            const defaultConfig = new Config();

            expect(new Config(undefined), 'options=undefined').to.deep.equal(defaultConfig);
            expect(new Config({}), 'options={}').to.deep.equal(defaultConfig);
            expect(new Config(true), 'options=true').to.deep.equal(defaultConfig);
            expect(new Config(false), 'options=false').to.deep.equal(defaultConfig);
        });
    });

    describe('aspect ratio/width', function() {

        function isNumber(val) {
            if (val.slice && val.slice(-1) === '%') {
                val = val.slice(0, -1);
            }

            return !_.isNaN(val);
        }

        function testConfig(obj) {
            const x = new Config(obj);

            expect(isNumber(x.width), 'width is a number ' + x.width).to.be.true;
            expect(isNumber(x.height), 'height is a number ' + x.height).to.be.true;
            _.each(props, function (a) {
                expect(_.has(x, a), 'Config has ' + a + ' attribute').to.be.true;
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
            expect(x.aspectratio).to.be.undefined;

            // aspectratio could be a string too since we "deserialize" numbers and bools < 6 chars in length
            x = testConfig({ width: '100%', aspectratio: 1.2 });
            expect(x.aspectratio).to.be.undefined;

            x = testConfig({ width: '100%', aspectratio: 'foo' });
            expect(x.aspectratio).to.be.undefined;

            x = testConfig({ width: '100%', aspectratio: ':0' });
            expect(x.aspectratio).to.be.undefined;
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
            expect(/.*\//.test(apiConfig.base)).to.be.true;

            apiConfig = new Config({ base: '.' });
            expect(/.*\//.test(apiConfig.base)).to.be.true;

            apiConfig = new Config({ base: CUSTOM_BASE });
            expect(apiConfig.base).to.equal(CUSTOM_BASE);
        });
    });
});
