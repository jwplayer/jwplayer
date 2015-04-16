// Code in this module uses code from jQuery
// jQuery v1.11.2 | (c) 2005, 2014 jQuery Foundation, Inc. | Released under the MIT license | jquery.org/license

define([], function() {
    var jqObj = {
        hasClass : function (element, searchClass) {
            var className = ' ' + searchClass + ' ',
                i = 0,
                l = this.length;
            for (; i < l; i++) {
                if (this[i].nodeType === 1 && (' ' + this[i].className + ' ')
                        .replace(/[\t\r\n\f]/g, ' ').indexOf(className) >= 0) {
                    return true;
                }
            }

            return false;
        }
    };

    return jqObj;
});
