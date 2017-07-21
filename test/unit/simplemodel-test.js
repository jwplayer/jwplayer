import SimpleModel from 'model/simplemodel';

const sinon = require('sinon');

define([
    'utils/underscore'
], function (_) {

    describe('SimpleModel Mixin', function() {

        const model = _.extend({}, SimpleModel);

        it('returns undefined ', function() {
            assert.isNotOk(model.get('noExisting'), 'get with no attributes');
        });

        it('simplemodel', function() {
            assert.isNotOk(model.get('noExisting'), 'get with no attributes');

            model.set('attr', 'val');
            assert.equal(model.get('attr'), 'val', 'set attribute with value');

            const clone = model.clone();
            assert.equal(clone.attr, 'val', 'clone gets the same attributes');

            const spy = sinon.spy();
            model.change('attr', spy);
            assert.equal(spy.callCount, 1, 'change callback is invoked');
            assert.equal(spy.lastCall.args[1], 'val', 'change attribute with value');
        });

        it('simplemodel', function() {
            assert.isNotOk(model.get('noExisting'), 'get with no attributes');

            model.set('attr', 'val');
            assert.equal(model.get('attr'), 'val', 'set attribute with value');

            const clone = model.clone();
            assert.equal(clone.attr, 'val', 'clone gets the same attributes');

            const spy = sinon.spy();
            model.change('attr', spy);
            assert.equal(spy.callCount, 1, 'change callback is invoked');
            assert.equal(spy.lastCall.args[1], 'val', 'change attribute with value');
        });

    });
});
