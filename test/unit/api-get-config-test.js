import instances from 'api/players';
import Api from 'api/api';
import modelProperties from 'data/model-properties';
import {
    install as installVideoPolyfill,
    uninstall as uninstallVideoPolyfill
} from 'mock/video-element-polyfill';
import _ from 'underscore';

describe('Api.getConfig', function() {

    before(installVideoPolyfill);

    after(uninstallVideoPolyfill);

    beforeEach(() => {
        const container = document.createElement('div');
        container.id = 'player';
        document.body.appendChild(container);
    });

    afterEach(() => {
        // remove fixture and player instances
        const container = document.querySelector('#player');
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        for (let i = instances.length; i--;) {
            instances[i].remove();
        }
    });

    it('has expected model members', function() {
        const container = document.querySelector('#player');
        const api = new Api(container);
        api.setup({});

        const config = api.getConfig();

        _.each(modelProperties, (value, property) => {
            expect(config).to.have.property(property);
        });

        _.each(config, (value, property) => {
            const sampleValue = modelProperties[property];
            const type = getTypeOf(sampleValue);
            if (sampleValue && sampleValue.tagName) {
                expect(value.tagName).to.equal(sampleValue.tagName, `getConfig().${property} = ${value}`);
            } else {
                expect(value).to.be.a(type, `getConfig().${property} = ${value}`);
            }
        });
    });
});

function getTypeOf(value) {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    if (value && value.tagName) {
        return value.tagName;
    }
    if (value && typeof value.then === 'function' && typeof value.catch === 'function') {
        return 'promise';
    }
    return typeof value;
}
