define([
    'simple-style-loader/addStyles'
], function (styleLoader) {
    /* jshint qunit: true */

    QUnit.module('style-loader-test');
    var test = QUnit.test.bind(QUnit);

    var getLastInsertedElement = function () {
        var elements = document.getElementsByTagName('style');
        return elements[elements.length - 1];
    };

    test('cssUtils.css creates a new style tag if one for the playerId does not exist', function (assert) {
        assert.expect(1);
        var countBeforeCall = document.getElementsByTagName('style').length;
        styleLoader.style([['#div1', '#div1{color: cyan;}']], 'style-loader-test-1');
        var countAfterCall = document.getElementsByTagName('style').length;
        assert.equal(countBeforeCall + 1, countAfterCall);
    });

    test('cssUtils.css adds player styles to style element unique to the playerId', function (assert) {
        assert.expect(3);
        styleLoader.style([['#div1', '#div1{color: red;}']], 'style-loader-test-2');
        var actual = getLastInsertedElement();
        assert.ok(actual);
        assert.notEqual(actual.innerHTML.indexOf('#div1{color: red;}'), -1);

        styleLoader.style([['#div2', '#div2{color: blue;}']], 'style-loader-test-2');
        assert.notEqual(actual.innerHTML.indexOf('#div2{color: blue;}'), -1, 'adds to existing style tag');
    });

    test('cssUtils.css replaces styles of the selector when it already exists', function (assert) {
        assert.expect(4);
        styleLoader.style([['#div1', '#div1{color: green;}']], 'style-loader-test-3');

        var actual = getLastInsertedElement();
        assert.ok(actual);
        assert.notEqual(actual.innerHTML.indexOf('#div1{color: green;}'), -1);

        styleLoader.style([['#div1', '#div1{color: rebeccapurple;}']], 'style-loader-test-3');

        assert.equal(actual.innerHTML.indexOf('#div1{color: green;}'), -1);
        assert.notEqual(actual.innerHTML.indexOf('#div1{color: rebeccapurple;}'), -1);
    });

    test('cssUtils.clear clears the style tag but does not remove it', function (assert) {
        assert.expect(4);
        styleLoader.style([['#div1', '#div1{color: magenta;}']], 'style-loader-test-4');

        var actual = getLastInsertedElement();
        assert.ok(actual);
        assert.notEqual(actual.innerHTML.indexOf('#div1{color: magenta;}'), -1);

        styleLoader.clear('style-loader-test-4');
        assert.ok(actual);
        assert.notOk(actual.innerHTML.length);
    });
});
