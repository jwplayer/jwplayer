import { css, clearCss, style, transform, getRgba } from 'utils/css';

describe('css', function() {

    it('css() and clearCss()', function() {
        var playerId = 'css-testplayer';
        var count = document.getElementsByTagName('style').length;

        var testSelector = 'test-selector';
        var stylesBlue = {
            'background-color': 'blue'
        };

        var stylesRed = {
            backgroundColor: 'red'
        };

        css(testSelector, stylesBlue, playerId);

        // check that css() accepts a style object and that a new style sheet has been added since
        // this is the first time calling css().
        var newCount = document.getElementsByTagName('style').length;
        assert.equal(newCount, count + 1, 'css adds a new style sheet');

        // check that style sheet is correctly included to the end of head
        var styleSheet = document.getElementsByTagName('head')[0].lastChild;
        assert.isOk(/test-selector{background-color: ?blue;?}/.test(styleSheet.innerHTML),
            'css object correctly included');

        // check that css() accepts a style object and css will be replaced
        css(testSelector, stylesRed, playerId);
        assert.isOk(!/test-selector{background-color: ?blue;?}/.test(styleSheet.innerHTML),
            'css object correctly replaced');
        assert.isOk(/test-selector{background-color: ?red;?}/.test(styleSheet.innerHTML),
            'css object correctly replaced');

        clearCss(playerId);

        // check clearCss() works correctly
        assert.isOk(!/test-selector{background-color: ?red;?}/.test(styleSheet.innerHTML), 'css correctly removed');

        // check that css() accepts css style as a string
        css(testSelector, '{test-selector{background-color: blue}', playerId);
        assert.isOk(/test-selector{background-color: ?blue;?}/.test(styleSheet.innerHTML),
            'css text correctly inserted');
    });

    it('style', function() {
        var element = document.createElement('div');
        var element2 = document.createElement('div');

        var styles = {
            'background-color': 'white',
            'z-index': 10,
            'background-image': 'images/image.jpg',
            color: '123456'
        };

        var styles2 = {
            backgroundColor: 'white',
            backgroundImage: 'images/image.jpg'
        };

        // this should not break
        style(null, styles);
        style(element, null);

        style(element, styles);
        assert.isOk(element.getAttribute('style').indexOf('background-color: white') >= 0, 'css style background');
        assert.isOk(element.getAttribute('style').indexOf('z-index: 10') >= 0, 'css style z index');
        assert.isOk(element.getAttribute('style').indexOf('background-image: url(') >= 0, 'css style img');
        assert.isOk(element.getAttribute('style').indexOf('color: rgb(18, 52, 86)') >= 0, 'css style color');

        // test camelCases
        style(element2, styles2);
        assert.isOk(element2.getAttribute('style').indexOf('background-color: white') >= 0, 'camelCase style background');
        assert.isOk(element2.getAttribute('style').indexOf('background-image: url(') >= 0, 'camelCase style img');
    });

    it('transform', function() {
        var element = document.createElement('div');

        // this should not break
        transform(null, 'none');
        transform(element, null);

        transform(element, 'none');

        assert.equal(element.style.transform, 'none', 'css transform');
        assert.equal(element.style.msTransform, 'none', 'css transform ms');
        assert.equal(element.style.mozTransform, 'none', 'css transform moz');
        assert.equal(element.style.oTransform, 'none', 'css transform o');

        transform(element, '');

        assert.equal(element.style.transform, '', 'css transform');
        assert.equal(element.style.msTransform, '', 'css transform ms');
        assert.equal(element.style.mozTransform, '', 'css transform moz');
        assert.equal(element.style.oTransform, '', 'css transform o');
    });

    it('getRgba', function() {
        // this should not break
        getRgba(null, null);

        var rgba = getRgba('123456', 0.5);
        assert.equal(rgba, 'rgba(18, 52, 86, 0.005)', 'css getRgba test');

        rgba = getRgba('123', 0);
        assert.equal(rgba, 'rgba(17, 34, 51, 0)', 'css getRgba test with length 3');

        rgba = getRgba('', 0);
        assert.equal(rgba, 'rgba(0, 0, 0, 0)', 'css getRgba test with invalid value');

        rgba = getRgba('red');
        assert.equal(rgba, 'rgb(255, 0, 0)', 'css getRgba test with color value and no alpha');
    });
});
