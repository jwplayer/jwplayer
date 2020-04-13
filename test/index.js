// Bundle files chunked by webpack
import { ProvidersLoaded } from 'providers/providers-loaded';
import html5 from 'providers/html5';
import 'parsers/captions/vttparser';
import 'view/controls/controls';
import 'controller/controller';

// For unknown reasons importing xo causes webpack to split the chunks we need bundled
// This polyfill will be embeded on the page by karma for IE
// import xo from 'intersection-observer';

// This should prevent us from attempting to load a chunk with 'intersection-observer'
if (!('intersectionRatio' in window.IntersectionObserverEntry.prototype)) {
    window.IntersectionObserverEntry.prototype.intersectionRatio = 1;
}

ProvidersLoaded.html5 = html5;

const testsContext = require.context('./unit', true);
testsContext.keys().forEach(testsContext);

export default testsContext;
