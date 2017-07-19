define([
    'utils/simplemodel',
    'utils/underscore'
], function (simpleModel, _) {


    describe('simpleModel', function() {

        it('simplemodel', function() {
            var model = _.extend({}, simpleModel);
            assert.isNotOk(model.get('noExisting'), 'get with no attributes');

            model.set('attr', 'val');
            assert.equal(model.get('attr'), 'val', 'set attribute with value');

            var clone = model.clone();
            assert.equal(clone.attr, 'val', 'clone gets the same attributes');
        });


    });
});
