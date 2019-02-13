import instances from 'api/players';
import Api from 'api/api';
import modelProperties from 'data/model-properties';
import sinon from 'sinon';

describe('Api.getConfig', function() {

    const sandbox = sinon.createSandbox();

    beforeEach(() => {
        const container = document.createElement('div');
        container.id = 'player';
        document.body.appendChild(container);
        sandbox.spy(console, 'error');
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
        sandbox.restore();
    });

    it('has expected model members', function() {
        const container = document.querySelector('#player');
        const api = new Api(container);

        return new Promise((resolve) => {
            api.setup({}).on('ready setupError', resolve);

            const config = api.getConfig();

            Object.keys(modelProperties).forEach((property) => {
                expect(config).to.have.property(property);
            });

            Object.keys(config).forEach((property) => {
                const value = config[property];
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
