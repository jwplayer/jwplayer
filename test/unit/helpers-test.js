import utils from 'utils/helpers';

describe('helpers', function() {

    it('helpers foreach test', function() {
        const aData = { hello: 'hi' };
        const tester = [];

        function fnEach(key, val) {
            tester.push(key);
            tester.push(val);
        }

        utils.foreach(aData, fnEach);

        expect(tester[0]).to.equal('hello');
        expect(tester[1]).to.equal('hi');
    });
});
