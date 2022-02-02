const fs = require('fs');
const path = require('path');
const notice = require('../jwplayer.license.notice.js');
const output = path.join(__dirname, '..', 'bin-release', 'notice.txt');

fs.writeFile(output, notice, function(err) {
  if (err) {
    throw err;
  }
  console.log('Wrote file', output);
});

