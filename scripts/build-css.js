const util = require('util');
const path = require('path');
const chokidar = require('chokidar');
const execPromise = util.promisify(require('child_process').exec);
const lessDir = path.dirname(require.resolve('less/package.json'));
const lesscBin = path.join(lessDir, require('less/package.json').bin.lessc);
const watch = process.argv.some(arg => arg === '--watch');
const BASE = path.resolve(__dirname, '..');

const buildList = [{
  src: path.join(BASE, 'src', 'css', 'jwplayer.less'),
  dest: path.join(BASE, 'bin-debug', 'css', 'jwplayer.css')
}, {
  src: path.join(BASE, 'src', 'css', 'controls.less'),
  dest: path.join(BASE, 'bin-debug', 'css', 'controls.css')
}];

const lessc = ({src, dest}) =>
  execPromise(`node ${lesscBin} --line-numbers=comments ${src} ${dest}`, {stdio: 'inherit', cwd: BASE}).then(function() {
    console.log(`lessc ${path.relative(BASE, src)} -> ${path.relative(BASE, dest)}`);

    return execPromise(`postcss ${dest} --use autoprefixer --replace`, {stdio: 'inherit', cwd: BASE});
  }).then(function() {
    console.log(`ran autoprefixer on ${path.relative(BASE, dest)}`);
    return Promise.resolve();
  });

const run = function() {
  if (!watch) {
    return Promise.all(buildList.map(lessc)).catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }

  buildList.forEach(function(build) {
    const watcher = chokidar.watch(build.src);

    watcher.on('add', () => lessc(build));
    watcher.on('change', () => lessc(build));
  });
};

run();
