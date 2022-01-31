const path = require('path');
const http = require('http');
const serveStatic = require('serve-static');

const serve = serveStatic(path.resolve(__dirname, '..'), {
  // never cache requests
  setHeaders(res, path) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
});

const server = http.createServer(function(req, res) {
  return serve(req, res, function() {});
})

server.listen(3000, function() {
  console.log(`static server listening at http://localhost:3000`);
});
