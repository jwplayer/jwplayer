import _ from 'utils/underscore';

// Copied over from https://github.com/jashkenas/underscore/tree/master/test
// and modified to use mocha/chai
describe('underscore', function() {

    describe('function functions', function() {

        it('partial', function() {
            const obj = {name: 'moe'};
            let func = function() {
                return this.name + ' ' + Array.prototype.slice.call(arguments).join(' ');
            };

            obj.func = _.partial(func, 'a', 'b');
            expect(obj.func('c', 'd'), 'can partially apply').to.equal('moe a b c d');

            obj.func = _.partial(func, _, 'b', _, 'd');
            expect(obj.func('a', 'c'), 'can partially apply with placeholders').to.equal('moe a b c d');

            func = _.partial(function() { return arguments.length; }, _, 'b', _, 'd');
            expect(func('a', 'c', 'e'), 'accepts more arguments than the number of placeholders').to.equal(5);
            expect(func('a'), 'accepts fewer arguments than the number of placeholders').to.equal(4);

            func = _.partial(function() { return typeof arguments[2]; }, _, 'b', _, 'd');
            expect(func('a'), 'unfilled placeholders are undefined').to.equal('undefined');
        });

        it('memoize', function() {
            let fib = function(n) {
                return n < 2 ? n : fib(n - 1) + fib(n - 2);
            };
            expect(fib(10), 'a memoized version of fibonacci produces identical results').to.equal(55);
            fib = _.memoize(fib); // Redefine `fib` for memoization
            expect(fib(10), 'a memoized version of fibonacci produces identical results').to.equal(55);

            const o = function(str) {
                return str;
            };
            const fastO = _.memoize(o);
            expect(o('toString'), 'checks hasOwnProperty').to.equal('toString');
            expect(fastO('toString'), 'checks hasOwnProperty').to.equal('toString');

            // Expose the cache.
            const upper = _.memoize(function(s) {
                return s.toUpperCase();
            });
            expect(upper('foo')).to.equal('FOO');
            expect(upper('bar')).to.equal('BAR');
        });

        it('delay', function(done) {
            let delayed = false;
            _.delay(function() {
                delayed = true;
            }, 100);

            setTimeout(function() {
                expect(delayed, "didn't delay the function quite yet").to.equal(false);
            }, 50);
            setTimeout(function() {
                expect(delayed, 'delayed the function').to.equal(true);
                done();
            }, 150);
        });

        it('defer', function(done) {
            let deferred = false;
            _.defer(function(bool) {
                deferred = bool;
            }, true);
            _.delay(function() {
                expect(deferred, 'deferred the function').to.equal(true);
                done();
            }, 50);
        });
    });

    describe('object functions', function() {
        it('isNumber', function() {
            expect(_.isNumber('string'), 'a string is not a number').to.equal(false);
            expect(_.isNumber(arguments), 'the arguments object is not a number').to.equal(false);
            expect(_.isNumber(void 0), 'undefined is not a number').to.equal(false);
            expect(_.isNumber(3 * 4 - 7 / 10), 'but numbers are').to.equal(true);
            expect(_.isNumber(NaN), 'NaN *is* a number').to.equal(true);
            expect(_.isNumber(Infinity), 'Infinity is a number').to.equal(true);
            expect(_.isNumber('1'), 'numeric strings are not numbers').to.equal(false);
        });

        it('isFinite', function() {
            expect(_.isFinite(void 0), 'undefined is not finite').to.equal(false);
            expect(_.isFinite(null), 'null is not finite').to.equal(false);
            expect(_.isFinite(NaN), 'NaN is not finite').to.equal(false);
            expect(_.isFinite(Infinity), 'Infinity is not finite').to.equal(false);
            expect(_.isFinite(-Infinity), '-Infinity is not finite').to.equal(false);
            expect(_.isFinite('12'), 'Numeric strings are numbers').to.equal(true);
            expect(_.isFinite('1a'), 'Non numeric strings are not numbers').to.equal(false);
            expect(_.isFinite(''), 'Empty strings are not numbers').to.equal(false);

            const obj = new Number(5);
            expect(_.isFinite(obj), 'Number instances can be finite').to.equal(true);
            expect(_.isFinite(0), '0 is finite').to.equal(true);
            expect(_.isFinite(123), 'Ints are finite').to.equal(true);
            expect(_.isFinite(-12.44), 'Floats are finite').to.equal(true);
        });

        it('isNaN', function() {
            expect(_.isNaN(void 0), 'undefined is not NaN').to.equal(false);
            expect(_.isNaN(null), 'null is not NaN').to.equal(false);
            expect(_.isNaN(0), '0 is not NaN').to.equal(false);
            expect(_.isNaN(new Number(0)), 'wrapped 0 is not NaN').to.equal(false);
            expect(_.isNaN('abc'), 'string is not NaN').to.equal(false);
            expect(_.isNaN(NaN), 'but NaN is').to.equal(true);
            expect(_.isNaN(new Number(NaN)), 'wrapped NaN is still NaN').to.equal(true);
        });

        it('isNull', function() {
            expect(_.isNull(void 0), 'undefined is not null').to.equal(false);
            expect(_.isNull(NaN), 'NaN is not null').to.equal(false);
            expect(_.isNull(null), 'but null is').to.equal(true);
        });

        it('isUndefined', function() {
            expect(_.isUndefined(1), 'numbers are defined').to.equal(false);
            expect(_.isUndefined(null), 'null is defined').to.equal(false);
            expect(_.isUndefined(false), 'false is defined').to.equal(false);
            expect(_.isUndefined(NaN), 'NaN is defined').to.equal(false);
            expect(_.isUndefined(), 'nothing is undefined').to.equal(true);
            expect(_.isUndefined(void 0), 'undefined is undefined').to.equal(true);
        });
    });
});
