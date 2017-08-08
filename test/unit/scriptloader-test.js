import { getScriptPath } from 'utils/parser';
import ScriptLoader, {
    SCRIPT_LOAD_STATUS_NEW
} from 'utils/scriptloader';

describe('ScriptLoader', function() {

    // TODO: ScriptLoader.load returns a promise

    it('ScriptLoader.getStatus', function() {
        // check status new
        const script = new ScriptLoader('/base/test/files/global.js');
        assert.equal(script.getStatus(), SCRIPT_LOAD_STATUS_NEW, 'newly created scriptloader has state new');

        script.load();
        assert.notEqual(script.getStatus(), SCRIPT_LOAD_STATUS_NEW, 'loading script causes status to change');
    });

    it('ScriptLoader load same script', function() {
        const script = new ScriptLoader('/base/test/files/global.js');
        script.load();

        // try to load a seconds script
        const script2 = new ScriptLoader('/base/test/files/global-2.js');
        script2.load();

        // try to load the same script
        const sameScript = new ScriptLoader('/base/test/files/global.js');
        sameScript.load();

        assert.isOk(document.getElementsByTagName('head')[0].firstChild.src.indexOf('global.js') >= 0,
            'adding same tag should not add the tag');
    });

    it('ScriptLoader with actual path', function() {
        const scriptPath = getScriptPath('sinon.js') + 'sinon.js';
        const script = new ScriptLoader(scriptPath);
        script.load();

        // loaded script should be added to head as first child
        const tag = document.getElementsByTagName('head')[0].firstChild;
        assert.isOk(tag.src.indexOf('sinon.js') >= 0, 'script is laded properly');
    });
});
