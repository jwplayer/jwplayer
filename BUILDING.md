# Building the Player
We use `grunt` and a few `npm scripts` to build the player, lint code, and run tests. Debug code is built to `/bin-debug`, while minified & uglified code is built to `/bin-release`. Code is built with `webpack`, linted with `eslint` and `flow`, and tested with `karma` and `qunit`.

1. Fork the project, clone your fork, and set up the remotes:
````
# Clone your fork of the repo into the current directory
git clone https://github.com/<your-username>/jwplayer
# Navigate to the newly cloned directory
cd jwplayer
# Assign the original repo to a remote called "upstream"
git remote add upstream https://github.com/jwplayer/jwplayer
````

2. Install the dependencies:
````
# Install grunt globally
npm install -g grunt
npm install
# Optionally, install webpack-dev-server
npm install -g webpack-dev-server
````

3. Build the player:
````
# Build once, Flash and JS
grunt
# Complete Watch - builds FLash and JS, lints, and tests on each change
grunt serve
# Quick JS Watch - build only. Requires webpack-dev-server to be installed globally
 webpack-dev-server --only debug -w --port 8888 --output-public-path /bin-debug/
````

4. Test your code:
```
# All browsers
grunt test
# Individual browsers - chrome, firefox, ie11, ie10, ie9
grunt karma:{BROWSER} e.g. grunt karma:chrome
```

5. Lint your code:
````
npm run lint
npm run flow
````