import styleLoader from 'simple-style-loader/addStyles';

describe('style-loader-test', function() {

    const getLastInsertedElement = function() {
        const elements = document.getElementsByTagName('style');
        return elements[elements.length - 1];
    };

    it('cssUtils.css creates a new style tag if one for the playerId does not exist', function() {
        const countBeforeCall = document.getElementsByTagName('style').length;
        styleLoader.style([['#div1', '#div1{color: cyan;}']], 'style-loader-test-1');
        const countAfterCall = document.getElementsByTagName('style').length;
        expect(countBeforeCall + 1).to.equal(countAfterCall);
    });

    it('cssUtils.css adds player styles to style element unique to the playerId', function() {
        styleLoader.style([['#div1', '#div1{color: red;}']], 'style-loader-test-2');
        const actual = getLastInsertedElement();
        expect(actual.innerHTML.indexOf('#div1{color: red;}')).to.not.equal(-1);

        styleLoader.style([['#div2', '#div2{color: blue;}']], 'style-loader-test-2');
        expect(actual.innerHTML.indexOf('#div2{color: blue;}')).to.not.equal(-1, 'adds to existing style tag');
    });

    it('cssUtils.css replaces styles of the selector when it already exists', function() {
        styleLoader.style([['#div1', '#div1{color: green;}']], 'style-loader-test-3');

        const actual = getLastInsertedElement();
        expect(actual.innerHTML.indexOf('#div1{color: green;}')).to.not.equal(-1);

        styleLoader.style([['#div1', '#div1{color: rebeccapurple;}']], 'style-loader-test-3');

        expect(actual.innerHTML.indexOf('#div1{color: green;}')).to.equal(-1);
        expect(actual.innerHTML.indexOf('#div1{color: rebeccapurple;}')).to.not.equal(-1);
    });

    it('cssUtils.clear clears the style tag but does not remove it', function() {
        styleLoader.style([['#div1', '#div1{color: magenta;}']], 'style-loader-test-4');

        const actual = getLastInsertedElement();
        expect(actual.innerHTML.indexOf('#div1{color: magenta;}')).to.not.equal(-1);

        styleLoader.clear('style-loader-test-4');
        expect(actual.innerHTML.length).to.equal(0);
    });
});
