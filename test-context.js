// Bundle files chunked by webpack
import * as xo from 'intersection-observer';
import vtt from 'polyfills/webvtt';
import vttParser from 'parsers/captions/vttparser';
import * as html5 from 'providers/html5';
import * as youtube from 'providers/youtube';
import * as controls from 'view/controls/controls';
import * as controller from 'controller/controller';

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
