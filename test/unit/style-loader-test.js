define([
    'utils/css',
    'simple-style-loader/addStyles'
], function (cssUtils, styleLoader) {
    /* jshint qunit: true */

    QUnit.module('style-loader-test');

    test('cssUtils loads styles', function (assert) {
        expect(0);
        var start, end;

        start = performance.now();
        cssUtils.css('foo', {
            color: 'red'
        });
        end = performance.now();
        console.log('css utils: first styling ' + (end - start) + ' ms');

        start = performance.now();
        for (var i = 0; i < 1000; i += 1) {
            cssUtils.css(i, i);
        }
        end = performance.now();
        var time = end - start;
        console.log('css utils: total ' + time + 'ms ' +  'average ' + (time / i) + ' ms');

    });

    test('style-loader loads styles', function (assert) {
        expect(0);
        var start, end;

        start = performance.now();
        styleLoader(['foo', 'color: red']);
        end = performance.now();
        console.log('style-loader: first styling ' + (end - start) + ' ms');

        start = performance.now();
        for (var i = 0; i < 1000; i += 1) {
            styleLoader([i, i]);
        }
        end = performance.now();
        var time = end - start;
        console.log('style-loader: total ' + time + 'ms ' +  'average ' + (time / i) + ' ms');
    });
});