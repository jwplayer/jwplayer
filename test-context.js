// Bundle files chunked by webpack
import * as xo from 'intersection-observer';
import vtt from 'polyfills/webvtt';
import vttParser from 'parsers/captions/vttparser';
import ProvidersLoaded from 'providers/providers-loaded';
import * as html5 from 'providers/html5';
import * as youtube from 'providers/youtube';
import * as controls from 'view/controls/controls';
import * as controller from 'controller/controller';

ProvidersLoaded.html5 = html5.default;

const testsContext = require.context('./test/unit', true);
testsContext.keys().forEach(testsContext);

export default [
    xo,
    vtt,
    vttParser,
    html5,
    youtube,
    controls,
    controller,
    testsContext
];
