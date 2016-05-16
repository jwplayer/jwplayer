define([
    'utils/css'
], function (css) {
    /* jshint qunit: true */

    QUnit.module('style-loader-test');

    test('it loads styles', function (assert) {
        expect(1);
        var element = document.createElement('div');
        css.style(element, {
            color: 'red'
        });

        assert.equal(element.style.color, 'red');
    });
});