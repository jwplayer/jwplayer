import { addClass, removeClass } from 'utils/dom';


export default function (elementContext) {
    var _focusFromClick = false;

    const onBlur = function () {
        _focusFromClick = false;
        removeClass(elementContext, 'jw-no-focus');
    };

    const onMouseDown = function () {
        _focusFromClick = true;
        addClass(elementContext, 'jw-no-focus');
    };

    const onFocus = function () {
        if (!_focusFromClick) {
            onBlur();
        }
    };

    elementContext.addEventListener('focus', onFocus);
    elementContext.addEventListener('blur', onBlur);
    elementContext.addEventListener('mousedown', onMouseDown);

    return {
        destroy: function() {
            elementContext.removeEventListener('focus', onFocus);
            elementContext.removeEventListener('blur', onBlur);
            elementContext.removeEventListener('mousedown', onMouseDown);
        }
    };
}
