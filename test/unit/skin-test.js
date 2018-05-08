import _ from 'test/underscore';
import { normalizeSkin, handleColorOverrides } from 'view/utils/skin';
import { clearCss } from 'utils/css';
import diff from 'fast-diff';

function getPlayerStyleText() {
    const head = document.head;
    return _.map(head.querySelectorAll('[data-jwplayer-id]'), styleElement => styleElement.innerHTML).join('');
}

function clearPlayerStyleSheets() {
    // TODO: clearCss should remove empty style elements from the DOM. Then we wouldn't need to modify the DOM here.
    // Clear styles from simple-style-loader and remove player style tags from the DOM
    clearCss('id');
    const head = document.head;
    _.each(head.querySelectorAll('[data-jwplayer-id]'), styleElement => {
        styleElement.innerHTML = '';
    });
}

function diffString(before, after) {
    /**
     * fast-diff returns an array of results [fast-diff](https://github.com/jhchen/fast-diff)
     *
     * result = diff('Good dog', 'Bad dog');
     * // [[-1, "Goo"], [1, "Ba"], [0, "d dog"]]
     *
     * This maps the results to an object:
     * // {-1: "Goo", 1: "Ba", 0: "d dog"}
     */

    return diff(before, after).reduce((reduced, item) => {
        reduced[item[0]] = (reduced[item[0]] || '') + '|' + item[1];
        return reduced;
    }, {});
}

describe('Skin Customization', function() {

    beforeEach(clearPlayerStyleSheets);

    after(clearPlayerStyleSheets);

    describe('normalizeSkin', function() {

        it('should normalize an empty skin config', function() {
            const skinColors = normalizeSkin({});

            expect(typeof skinColors).to.equal('object');
            expect(_.size(skinColors)).to.equal(4);
        });
    });

    describe('handleColorOverrides', function() {

        it('should not modify the DOM with an empty config', function() {
            const initialState = getPlayerStyleText();

            handleColorOverrides('id', {});

            const currentState = getPlayerStyleText();
            const domDiff = diffString(initialState, currentState);

            expect(currentState.length).to.equal(0);
            expect(domDiff[diff.INSERT], 'Text was inserted into the DOM').to.equal(undefined);
            expect(domDiff[diff.DELETE], 'Text was deleted from the DOM').to.equal(undefined);
        });

        it('should not modify the DOM with an undefined config', function() {
            const initialState = getPlayerStyleText();

            handleColorOverrides('id');

            const currentState = getPlayerStyleText();
            const domDiff = diffString(initialState, currentState);

            expect(currentState.length).to.equal(0);
            expect(domDiff[diff.INSERT], 'Text was inserted into the DOM').to.equal(undefined);
            expect(domDiff[diff.DELETE], 'Text was deleted from the DOM').to.equal(undefined);
        });

        it('should override controlbar text color', function() {
            handleColorOverrides('id', {
                controlbar: {
                    text: 'green'
                }
            });

            const cssText = getPlayerStyleText();

            expect(cssText).to.contain('#id .jw-controlbar .jw-icon-inline.jw-text');
            expect(cssText).to.contain('#id .jw-title-primary');
            expect(cssText).to.contain('#id .jw-title-secondary');
            expect(cssText).to.contain('color: green');
        });

        it('should override controlbar text and icon colors', function() {
            handleColorOverrides('id', {
                controlbar: {
                    text: 'green',
                    icons: 'blue'
                }
            });

            const cssText = getPlayerStyleText();

            expect(cssText).to.contain('#id .jw-controlbar .jw-icon-inline.jw-text');
            expect(cssText).to.contain('#id .jw-title-primary');
            expect(cssText).to.contain('#id .jw-title-secondary');
            expect(cssText).to.contain('color: green');
            expect(cssText).to.contain('#id .jw-button-color:not(.jw-icon-cast)');
            expect(cssText).to.contain('#id .jw-button-color.jw-toggle.jw-off:not(.jw-icon-cast)');
            expect(cssText).to.contain('color: blue');
        });
    });
});
