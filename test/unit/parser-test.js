import * as parser from 'utils/parser';

describe('parser', function() {

    var testerGenerator = function (method) {
        return function (left, right, message) {
            expect(method.apply(this, left), message).to.equal(right);
        };
    };

    it('parser.getAbsolutePath', function() {
        var path = parser.getAbsolutePath(null, null);
        expect(path, 'passing null as path returns null').to.be.undefined;

        path = parser.getAbsolutePath('https://testingUrl', null);
        expect(path, 'passing absolute path returns the path').to.equal('https://testingUrl');

        path = parser.getAbsolutePath('path', 'base');
        expect(path.indexOf('path') >= 0, 'passing path and base returns correct url with path').to.be.true;
        expect(path.indexOf('base') >= 0, 'passing path and base returns correct url with base').to.be.true;

        var test = testerGenerator(parser.getAbsolutePath);
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

        var test = testerGenerator(parser.serialize);
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

    it('parser.parseXML', function() {
        var xml = parser.parseXML('<input>');
        expect(xml).to.equal(null);

        var input = '<input><test>ToTest</test></input>';
        xml = parser.parseXML(input);
        expect(!!xml, 'xml should be returned').to.be.true;
    });

    it('parser.parseDimension', function() {
        var dimension = parser.parseDimension('');
        expect(dimension, 'dimension with empty string should be 0').to.equal(0);

        dimension = parser.parseDimension('35%');
        expect(dimension, 'dimension with percentage string should be the same').to.equal('35%');

        dimension = parser.parseDimension('35px');
        expect(dimension, 'dimension with px string should remove px').to.equal(35);

        dimension = parser.parseDimension(35);
        expect(dimension, 'dimension with int should be itself').to.equal(35);
    });

    it('parser.timeFormat', function() {
        var time;

        time = parser.timeFormat(3661);
        expect(time, 'timeFormat with hours minutes seconds').to.equal('1:01:01');

        time = parser.timeFormat(610);
        expect(time, 'timeFormat with minutes seconds').to.equal('10:10');

        time = parser.timeFormat('610');
        expect(time, 'timeFormat with minutes seconds').to.equal('10:10');

        time = parser.timeFormat(-1);
        expect(time, 'timeFormat with negative number should be 00:00').to.equal('00:00');

        time = parser.timeFormat(-1, true);
        expect(time, 'timeFormat with negative numbers allowed should be -00:01').to.equal('-00:01');

        time = parser.timeFormat(0);
        expect(time, 'timeFormat with minutes seconds').to.equal('00:00');

        time = parser.timeFormat();
        expect(time, 'timeFormat with minutes seconds').to.equal('00:00');

        time = parser.timeFormat(NaN);
        expect(time, 'timeFormat with minutes seconds').to.equal('00:00');

        time = parser.timeFormat(Infinity);
        expect(time, 'timeFormat with minutes seconds').to.equal('00:00');

        time = parser.timeFormat(null);
        expect(time, 'timeFormat with minutes seconds').to.equal('00:00');

        time = parser.timeFormat(false);
        expect(time, 'timeFormat with minutes seconds').to.equal('00:00');

        time = parser.timeFormat('test');
        expect(time, 'timeFormat with minutes seconds').to.equal('00:00');
    });
});
