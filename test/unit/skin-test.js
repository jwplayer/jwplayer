import _ from 'test/underscore';
import sinon from 'sinon';
import { normalizeSkin, handleColorOverrides } from 'view/utils/skin';
import * as cssUtils from 'utils/css';

describe('Skin Customization', function() {

    describe('normalizeSkin', function() {

        it('should normalize an empty skin config', function() {
            const skinColors = normalizeSkin({});

            expect(typeof skinColors).to.equal('object');
            expect(_.size(skinColors)).to.equal(4);
        });
    });

    describe('handleColorOverrides', function() {
        let cssStub;

        before(function() {
            cssStub = sinon.stub(cssUtils, 'css');
        });

        after(function() {
            cssStub.restore();
        });

        it('should not style any element with an empty config', function() {
            handleColorOverrides('id', {});

            expect(cssUtils.css.callCount).to.equal(0);
        });

        it('should not style any element with an undefined config', function() {
            handleColorOverrides('id');

            expect(cssUtils.css.callCount).to.equal(0);
        });

        it('should override controlbar text color', function() {
            cssStub.reset();

            handleColorOverrides('id', {
                controlbar: {
                    text: 'green'
                }
            });

            expect(cssUtils.css.args[0]).to.eql([
                '#id .jw-controlbar .jw-text, ' +
                '#id .jw-title-primary, ' +
                '#id .jw-title-secondary',
                { color: 'green' },
                'id'
            ]);
        });

        it('should override controlbar text and icon colors', function() {
            cssStub.reset();

            handleColorOverrides('id', {
                controlbar: {
                    text: 'green',
                    icons: 'blue'
                }
            });

            expect(cssUtils.css.args[0]).to.eql([
                '#id .jw-controlbar .jw-text, ' +
                '#id .jw-title-primary, ' +
                '#id .jw-title-secondary',
                { color: 'green' },
                'id'
            ]);

            expect(cssUtils.css.args[1]).to.eql([
                '#id .jw-button-color:not(.jw-icon-cast), ' +
                '#id .jw-button-color.jw-toggle.jw-off:not(.jw-icon-cast)',
                { color: 'blue' },
                'id'
            ]);
        });
    });
});
