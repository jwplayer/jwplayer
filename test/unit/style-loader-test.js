define([
    'simple-style-loader/addStyles'
], function (styleLoader) {


    describe('style-loader-test', function() {

        var getLastInsertedElement = function() {
            var elements = document.getElementsByTagName('style');
            return elements[elements.length - 1];
        };

        it('cssUtils.css creates a new style tag if one for the playerId does not exist', function() {
            var countBeforeCall = document.getElementsByTagName('style').length;
            styleLoader.style([['#div1', '#div1{color: cyan;}']], 'style-loader-test-1');
            var countAfterCall = document.getElementsByTagName('style').length;
            assert.equal(countBeforeCall + 1, countAfterCall);
        });

        it('cssUtils.css adds player styles to style element unique to the playerId', function() {
            styleLoader.style([['#div1', '#div1{color: red;}']], 'style-loader-test-2');
            var actual = getLastInsertedElement();
            assert.isOk(actual);
            assert.notEqual(actual.innerHTML.indexOf('#div1{color: red;}'), -1);

            styleLoader.style([['#div2', '#div2{color: blue;}']], 'style-loader-test-2');
            assert.notEqual(actual.innerHTML.indexOf('#div2{color: blue;}'), -1, 'adds to existing style tag');
        });

        it('cssUtils.css replaces styles of the selector when it already exists', function() {
            styleLoader.style([['#div1', '#div1{color: green;}']], 'style-loader-test-3');

            var actual = getLastInsertedElement();
            assert.isOk(actual);
            assert.notEqual(actual.innerHTML.indexOf('#div1{color: green;}'), -1);

            styleLoader.style([['#div1', '#div1{color: rebeccapurple;}']], 'style-loader-test-3');

            assert.equal(actual.innerHTML.indexOf('#div1{color: green;}'), -1);
            assert.notEqual(actual.innerHTML.indexOf('#div1{color: rebeccapurple;}'), -1);
        });

        it('cssUtils.clear clears the style tag but does not remove it', function() {
            styleLoader.style([['#div1', '#div1{color: magenta;}']], 'style-loader-test-4');

            var actual = getLastInsertedElement();
            assert.isOk(actual);
            assert.notEqual(actual.innerHTML.indexOf('#div1{color: magenta;}'), -1);

            styleLoader.clear('style-loader-test-4');
            assert.isOk(actual);
            assert.isNotOk(actual.innerHTML.length);
        });
    });
});
