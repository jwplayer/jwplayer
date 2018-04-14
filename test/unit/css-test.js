import { css, clearCss, style, transform, getRgba } from 'utils/css';

describe('css', function() {

    it('css() and clearCss()', function() {
        const playerId = 'css-testplayer';
        const count = document.getElementsByTagName('style').length;

        const testSelector = 'test-selector';
        const stylesBlue = {
            'background-color': 'blue'
        };

        const stylesRed = {
            backgroundColor: 'red'
        };

        css(testSelector, stylesBlue, playerId);

        // check that css() accepts a style object and that a new style sheet has been added since
        // this is the first time calling css().
        const newCount = document.getElementsByTagName('style').length;
        expect(newCount, 'css adds a new style sheet').to.equal(count + 1);

        // check that style sheet is correctly included to the end of head
        const styleSheet = document.getElementsByTagName('head')[0].lastChild;
        expect(/test-selector{background-color: ?blue;?}/.test(styleSheet.innerHTML), 'css object correctly included').to.be.true;

        // check that css() accepts a style object and css will be replaced
        css(testSelector, stylesRed, playerId);
        expect(!/test-selector{background-color: ?blue;?}/.test(styleSheet.innerHTML), 'css object correctly replaced').to.be.true;
        expect(/test-selector{background-color: ?red;?}/.test(styleSheet.innerHTML), 'css object correctly replaced').to.be.true;

        clearCss(playerId);

        // check clearCss() works correctly
        expect(!/test-selector{background-color: ?red;?}/.test(styleSheet.innerHTML), 'css correctly removed').to.be.true;

        // check that css() accepts css style as a string
        css(testSelector, '{test-selector{background-color: blue}', playerId);
        expect(/test-selector{background-color: ?blue;?}/.test(styleSheet.innerHTML), 'css text correctly inserted').to.be.true;
    });

    it('style', function() {
        const element = document.createElement('div');
        const element2 = document.createElement('div');

        const styles = {
            'background-color': 'white',
            'z-index': 10,
            'background-image': 'images/image.jpg',
            color: '123456'
        };

        const styles2 = {
            backgroundColor: 'white',
            backgroundImage: 'images/image.jpg'
        };

        // this should not break
        style(null, styles);
        style(element, null);

        style(element, styles);
        expect(element.getAttribute('style').indexOf('background-color: white') >= 0, 'css style background').to.be.true;
        expect(element.getAttribute('style').indexOf('z-index: 10') >= 0, 'css style z index').to.be.true;
        expect(element.getAttribute('style').indexOf('background-image: url(') >= 0, 'css style img').to.be.true;
        expect(element.getAttribute('style').indexOf('color: rgb(18, 52, 86)') >= 0, 'css style color').to.be.true;

        // test camelCases
        style(element2, styles2);
        expect(element2.getAttribute('style').indexOf('background-color: white') >= 0, 'camelCase style background').to.be.true;
        expect(element2.getAttribute('style').indexOf('background-image: url(') >= 0, 'camelCase style img').to.be.true;
    });

    it('transform', function() {
        const element = document.createElement('div');

        // this should not break
        transform(null, 'none');
        transform(element, null);

        transform(element, 'none');

        expect(element.style.transform, 'css transform').to.equal('none');
        expect(element.style.msTransform, 'css transform ms').to.equal('none');
        expect(element.style.mozTransform, 'css transform moz').to.equal('none');
        expect(element.style.oTransform, 'css transform o').to.equal('none');

        transform(element, '');

        expect(element.style.transform, 'css transform').to.equal('');
        expect(element.style.msTransform, 'css transform ms').to.equal('');
        expect(element.style.mozTransform, 'css transform moz').to.equal('');
        expect(element.style.oTransform, 'css transform o').to.equal('');
    });

    it('getRgba', function() {
        // this should not break
        getRgba(null, null);

        let rgba = getRgba('123456', 0.5);
        expect(rgba, 'css getRgba test').to.equal('rgba(18, 52, 86, 0.005)');

        rgba = getRgba('123', 0);
        expect(rgba, 'css getRgba test with length 3').to.equal('rgba(17, 34, 51, 0)');

        rgba = getRgba('', 0);
        expect(rgba, 'css getRgba test with invalid value').to.equal('rgba(0, 0, 0, 0)');

        rgba = getRgba('red');
        expect(rgba, 'css getRgba test with color value and no alpha').to.equal('rgb(255, 0, 0)');
    });
});
