define([
    'utils/helpers'
], function (utils) {


    describe('helpers', function() {


        it('helpers foreach test', function() {
            var aData = { hello: 'hi' };
            var tester = [];

            function fnEach(key, val) {
                tester.push(key);
                tester.push(val);
            }

            utils.foreach(aData, fnEach);

            assert.equal(tester[0], 'hello');
            assert.equal(tester[1], 'hi');
        });

        it('helpers log with fake console', function() {
            var tmpConsole = window.console;
            var m = [];

            window.console = null;
            // this should not break
            utils.log('testing');

            // test window console called with utils.log
            window.console = {
                log: function (message) {
                    m.push(message);
                }
            };
            utils.log('testing');
            assert.equal(m[0], 'testing');

            // restore actual window console
            window.console = tmpConsole;
        });
    });
});

