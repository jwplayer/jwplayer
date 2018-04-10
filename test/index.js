import ProvidersLoaded from 'providers/providers-loaded';
import * as html5 from 'providers/html5';
import * as controls from 'view/controls/controls';
import * as controller from 'controller/controller';

ProvidersLoaded.html5 = html5.default;

const testsContext = require.context('./unit', true);
testsContext.keys().forEach(testsContext);

export default [
    html5,
    controls,
    controller,
    testsContext
];
