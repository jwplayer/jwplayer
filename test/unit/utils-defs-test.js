import utils from 'utils/helpers';

describe('utils definitions', function() {

    it('defines util functions ', function() {
        // functions in helpers
        expect(typeof utils.log, 'log function is defined').to.equal('function');
        expect(typeof utils.between, 'between function is defined').to.equal('function');
        expect(typeof utils.foreach, 'foreach function is defined').to.equal('function');

        // inherit from parser
        expect(typeof utils.getAbsolutePath, 'getAbsolutePath function is defined').to.equal('function');
        expect(typeof utils.getScriptPath, 'getScriptPath function is defined').to.equal('function');
        expect(typeof utils.parseXML, 'parseXML function is defined').to.equal('function');
        expect(typeof utils.serialize, 'serialize function is defined').to.equal('function');
        expect(typeof utils.parseDimension, 'parseDimension function is defined').to.equal('function');
        expect(typeof utils.timeFormat, 'timeFormat function is defined').to.equal('function');

        // inherit from validator
        expect(typeof utils.exists, 'exists function is defined').to.equal('function');
        expect(typeof utils.isHTTPS, 'isHTTPS function is defined').to.equal('function');
        expect(typeof utils.isRtmp, 'isRtmp function is defined').to.equal('function');
        expect(typeof utils.isYouTube, 'isYouTube function is defined').to.equal('function');
        expect(typeof utils.typeOf, 'typeOf function is defined').to.equal('function');

        // inherit from ajax
        expect(typeof utils.ajax, 'ajax function is defined').to.equal('function');

        // inherit from dom
        expect(typeof utils.createElement, 'createElement function is defined').to.equal('function');
        expect(typeof utils.styleDimension, 'styleDimension function is defined').to.equal('function');
        expect(typeof utils.classList, 'classList function is defined').to.equal('function');
        expect(typeof utils.hasClass, 'hasClass function is defined').to.equal('function');
        expect(typeof utils.addClass, 'addClass function is defined').to.equal('function');
        expect(typeof utils.removeClass, 'removeClass function is defined').to.equal('function');
        expect(typeof utils.toggleClass, 'toggleClass function is defined').to.equal('function');
        expect(typeof utils.emptyElement, 'emptyElement function is defined').to.equal('function');
        expect(typeof utils.addStyleSheet, 'addStyleSheet function is defined').to.equal('function');
        expect(typeof utils.bounds, 'bounds function is defined').to.equal('function');

        // inherit from css
        expect(typeof utils.css, 'css function is defined').to.equal('function');
        expect(typeof utils.style, 'style function is defined').to.equal('function');
        expect(typeof utils.clearCss, 'clearCss function is defined').to.equal('function');
        expect(typeof utils.transform, 'transform function is defined').to.equal('function');
        expect(typeof utils.getRgba, 'getRgba function is defined').to.equal('function');

        // inherit from playerutils
        expect(typeof utils.repo, 'repo function is defined').to.equal('function');
        expect(typeof utils.versionCheck, 'versionCheck function is defined').to.equal('function');
        expect(typeof utils.loadFrom, 'loadFrom function is defined').to.equal('function');

        // inherit from trycatch
        expect(typeof utils.tryCatch, 'tryCatch function is defined').to.equal('function');
        expect(typeof utils.Error, 'Error function is defined').to.equal('function');
    });
});
