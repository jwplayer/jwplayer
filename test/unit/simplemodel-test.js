import sinon from 'sinon';
import SimpleModel from 'model/simplemodel';

describe('SimpleModel Mixin', function() {

    const model = new SimpleModel();

    it('returns undefined ', function() {
        expect(model.get('noExisting'), 'get with no attributes').to.be.undefined;
    });

    it('simplemodel', function() {
        expect(model.get('noExisting'), 'get with no attributes').to.be.undefined;

        model.set('attr', 'val');
        expect(model.get('attr'), 'set attribute with value').to.equal('val');

        const clone = model.clone();
        expect(clone.attr, 'clone gets the same attributes').to.equal('val');

        const spy = sinon.spy();
        model.change('attr', spy);
        expect(spy.callCount, 'change callback is invoked').to.equal(1);
        expect(spy.lastCall.args[1], 'change attribute with value').to.equal('val');
    });

    it('simplemodel', function() {
        expect(model.get('noExisting'), 'get with no attributes').to.be.undefined;

        model.set('attr', 'val');
        expect(model.get('attr'), 'set attribute with value').to.equal('val');

        const clone = model.clone();
        expect(clone.attr, 'clone gets the same attributes').to.equal('val');

        const spy = sinon.spy();
        model.change('attr', spy);
        expect(spy.callCount, 'change callback is invoked').to.equal(1);
        expect(spy.lastCall.args[1], 'change attribute with value').to.equal('val');
    });
});
