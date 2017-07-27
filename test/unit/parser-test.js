import * as parser from 'utils/parser';

describe('parser', function() {

    var testerGenerator = function (assert, method) {
        return function (left, right, message) {
            assert.strictEqual(method.apply(this, left), right, message);
        };
    };

    it('parser.getAbsolutePath', function() {
        var path = parser.getAbsolutePath(null, null);
        assert.isNotOk(path, 'passing null as path returns null');

        path = parser.getAbsolutePath('https://testingUrl', null);
        assert.equal(path, 'https://testingUrl', 'passing absolute path returns the path');

        path = parser.getAbsolutePath('path', 'base');
        assert.isOk(path.indexOf('path') >= 0, 'passing path and base returns correct url with path');
        assert.isOk(path.indexOf('base') >= 0, 'passing path and base returns correct url with base');

        var test = testerGenerator(assert, parser.getAbsolutePath);
        test(['.', 'https://example.com/alpha/beta/filename'], 'https://example.com/alpha/beta');
        test(['/', 'https://example.com/alpha/beta/filename'], 'https://example.com/');
        test(['../', 'https://example.com/alpha/beta/filename'], 'https://example.com/alpha');

        test(['./hello/', 'https://example.com/'], 'https://example.com/hello', 'Testing with adding a directory');
        test(['/', 'https://example.com/alpha/beta/filename?x=1&y=2'], 'https://example.com/',
            'Testing with GET arguments');
        test(['../../../../../', 'https://example.com/'], 'https://example.com/', 'Testing with extraneous ../');

        test(['hello.mp4', 'https://example.com/oh/hi.html'], 'https://example.com/oh/hello.mp4');
        test(['../hello.mp4', 'https://example.com/hi.html'], 'https://example.com/hello.mp4');
    });

    it('parser.serialize', function() {
        var array = [];
        var object = {};

        var test = testerGenerator(assert, parser.serialize);
        test([undefined], null, 'undefined returns null');
        test([null], null, 'null is passed through');
        test([array], array, 'arrays are passed through');
        test([object], object, 'objects are passed through');
        test([1], 1, 'numbers are passed through');
        test([true], true, 'booleans (true) are passed through');
        test([false], false, 'booleans (false) are passed through');
        test(['true'], true, 'string "true" returns true');
        test(['false'], false, 'string "false" returns false');
        test(['TRUE'], true, 'string "TRUE" returns true');
        test(['FALSE'], false, 'string "FALSE" returns false');
        test(['100.0'], 100, 'strings of 5 chars or less that can be coerced into a number are converted');
        test(['1000.0'], '1000.0', 'strings of 6 chars or more that can be coerced into a number are not converted');
        test(['1px'], '1px', 'css px values are not changed');
        test(['100%'], '100%', 'percentage values are not changed');
    });

    it.skip('parser.getScriptPath', function() {
        var path = parser.getScriptPath(null);
        assert.equal(path, '', 'returns an empty string when no file name is provided');

        var scriptPath = parser.getScriptPath('parser-test.js');
        assert.isOk(/\S+\:\/\/.+\/$/.it(scriptPath),
            'returns a directory url ending with a forward slash "' + scriptPath + '"');
    });

    it('parser.parseXML', function() {
        var xml = parser.parseXML('<input>');
        assert.isNotOk(xml);
        //
        var input = '<input><test>ToTest</test></input>';
        xml = parser.parseXML(input);
        assert.isOk(xml, 'xml should be returned');
    });

    it('parser.parseDimension', function() {
        var dimension = parser.parseDimension('');
        assert.equal(dimension, 0, 'dimension with empty string should be 0');

        dimension = parser.parseDimension('35%');
        assert.equal(dimension, '35%', 'dimension with percentage string should be the same');

        dimension = parser.parseDimension('35px');
        assert.equal(dimension, '35', 'dimension with px string should remove px');

        dimension = parser.parseDimension(35);
        assert.equal(dimension, 35, 'dimension with int should be itself');
    });

    it('parser.timeFormat', function() {
        var time;

        time = parser.timeFormat(3661);
        assert.equal(time, '1:01:01', 'timeFormat with hours minutes seconds');

        time = parser.timeFormat(610);
        assert.equal(time, '10:10', 'timeFormat with minutes seconds');

        time = parser.timeFormat('610');
        assert.equal(time, '10:10', 'timeFormat with minutes seconds');

        time = parser.timeFormat(-1);
        assert.equal(time, '00:00', 'timeFormat with negative number should be 00:00');

        time = parser.timeFormat(-1, true);
        assert.equal(time, '-00:01', 'timeFormat with negative numbers allowed should be -00:01');

        time = parser.timeFormat(0);
        assert.equal(time, '00:00', 'timeFormat with minutes seconds');

        time = parser.timeFormat();
        assert.equal(time, '00:00', 'timeFormat with minutes seconds');

        time = parser.timeFormat(NaN);
        assert.equal(time, '00:00', 'timeFormat with minutes seconds');

        time = parser.timeFormat(Infinity);
        assert.equal(time, '00:00', 'timeFormat with minutes seconds');

        time = parser.timeFormat(null);
        assert.equal(time, '00:00', 'timeFormat with minutes seconds');

        time = parser.timeFormat(false);
        assert.equal(time, '00:00', 'timeFormat with minutes seconds');

        time = parser.timeFormat('test');
        assert.equal(time, '00:00', 'timeFormat with minutes seconds');
    });
});
