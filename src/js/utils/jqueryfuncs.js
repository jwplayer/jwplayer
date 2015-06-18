// Code in this module uses code from jQuery
// jQuery v1.11.2 | (c) 2005, 2014 jQuery Foundation, Inc. | Released under the MIT license | jquery.org/license

define([], function() {
    return {
        hasClass : function (element, searchClass) {
            var className = ' ' + searchClass + ' ';

            return (element.nodeType === 1 && (' ' + element.className + ' ')
                    .replace(/[\t\r\n\f]/g, ' ').indexOf(className) >= 0);
        }
    };
});
