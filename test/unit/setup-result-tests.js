import { setupResult } from 'api/Setup';
import { PlayerError } from 'api/errors';

describe('Setup result tests', function () {
    let allPromises;
    beforeEach(function () {
        allPromises = [() => {}];
    });

    it('sets core to the first item in the promises array', function () {
        allPromises.push(() => {});
        const actual = setupResult(allPromises);
        expect(actual.core).to.equal(allPromises[0]);
        expect(actual.warnings.length).to.equal(0);
    });

    it('sets core to null if the promise array is empty', function () {
        allPromises.pop();
        const actual = setupResult(allPromises);
        expect(actual.core).to.be.null;
        expect(actual.warnings.length).to.equal(0);
    });

    it('adds PlayerErrors found in the promises array as warnings', function () {
        allPromises.push({},
            new PlayerError('foo', 1),
            [new PlayerError('bar', 2), {}],
            [new PlayerError('baz', 3), new PlayerError('qux', 4)]
        );

        const actual = setupResult(allPromises).warnings;
        expect(actual.length).to.equal(4);
        expect(actual[0]).to.equal(allPromises[2]);
        expect(actual[1]).to.equal(allPromises[3][0]);
        expect(actual[2]).to.equal(allPromises[4][0]);
        expect(actual[3]).to.equal(allPromises[4][1]);
    });
});
