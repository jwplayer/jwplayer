define([
    'utils/dom'
], function(dom) {

    return function (elementContext) {
        var _focusFromClick = false;

        const onBlur = function () {
            _focusFromClick = false;
            dom.removeClass(elementContext, 'jw-no-focus');
        };

        const onMouseUp = function (e) {
            if (e.target && e.target.blur) {
                e.target.blur();
            }
        };

        const onMouseDown = function () {
            _focusFromClick = true;
            dom.addClass(elementContext, 'jw-no-focus');
        };

        const onFocus = function () {
            if (!_focusFromClick) {
                onBlur();
            }
        };

        elementContext.addEventListener('focus', onFocus);
        elementContext.addEventListener('blur', onBlur);
        elementContext.addEventListener('mousedown', onMouseDown);
        elementContext.addEventListener('mouseup', onMouseUp);

        return {
            destroy: function() {
                elementContext.removeEventListener('focus', onFocus);
                elementContext.removeEventListener('blur', onBlur);
                elementContext.removeEventListener('mousedown', onMouseDown);
                elementContext.removeEventListener('mouseup', onMouseUp);
            }
        };
    };
});
