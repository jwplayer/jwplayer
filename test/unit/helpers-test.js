import utils from 'utils/helpers';

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

    it('log will not thow if console is cleared', function() {
        var tmpConsole = window.console;

        window.console = null;
        // this should not break
        utils.log('testing');

        // restore actual window console
        window.console = tmpConsole;
    });
});

