// Bundle files chunked by webpack
require('polyfills/promise');
require('polyfills/base64');
require('polyfills/vtt');
require('intersection-observer');
require('parsers/captions/vttparser');
require('view/controls/controls');
require('providers/html5');
require('providers/flash');
require('providers/youtube');

const testsContext = require.context('./test/unit', true);
testsContext.keys().forEach(testsContext);
