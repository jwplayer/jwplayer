
var webpack = require('webpack');
var path = require('path');
var env = process.env;
var _ = require('lodash');
var argv = require('minimist')(process.argv.slice(2));

var packageInfo = require('./package.json');
var flashVersion = 18;

function getBuildVersion(packageInfo) {
    // Build Version: {major.minor.revision}
    var metadata = '';
    if (env.BUILD_NUMBER) {
        var branch = env.GIT_BRANCH;
        metadata = 'opensource';
        if (branch) {
            metadata += '_' + branch.replace(/^origin\//, '').replace(/[^0-9A-Za-z-]/g, '-');
        }
        metadata += '.' + env.BUILD_NUMBER;
    } else {
        var now = new Date();
        now.setTime(now.getTime()-now.getTimezoneOffset()*60000);
        metadata = 'local.' + now.toISOString().replace(/[\.\-:T]/g, '-').replace(/Z|\.\d/g, '');
    }
    return packageInfo.version +'+'+ metadata;
}

var compileConstants =
{
    __SELF_HOSTED__: true,
    __REPO__ : '\'\'',
    __DEBUG__ : false,
    __BUILD_VERSION__: '\'' + getBuildVersion(packageInfo) + '\'',
    __FLASH_VERSION__: flashVersion
};

var uglifyJsOptions = {
    screwIE8: true,
    stats: true,
    compress: {
        warnings: false
    },
    mangle: {
        toplevel: true,
        eval: true,
        except: ['export', 'require']
    }
};

var multiConfig = _.compact(_.map([
    {
        name: 'debug',
        output: {
            path: 'bin-debug/',
            filename: '[name].js',
            chunkFilename:'[name].js',
            sourceMapFilename : '[name].[hash].map',
            library: 'jwplayer',
            libraryTarget: 'umd',
            pathinfo: true
        },
        debug: true,
        devtool: 'source-map',
        plugins: [
            new webpack.DefinePlugin(_.defaults({
                __DEBUG__ : true
            }, compileConstants))
        ]
    },
    {
        name: 'release',
        output: {
            path: 'bin-release/',
            filename: '[name].js',
            chunkFilename: '[name].js',
            sourceMapFilename : '[name].[hash].map',
            library: 'jwplayer',
            libraryTarget: 'umd'
        },
        watch: false,
        progress: false,
        plugins: [
            new webpack.DefinePlugin(compileConstants),
            new webpack.optimize.OccurrenceOrderPlugin(),
            new webpack.optimize.UglifyJsPlugin(uglifyJsOptions)
        ]
    }
], function(configuration) {
    // Use `webpack --only {CONFIG_NAME}` to filter out multiple configurations
    //  ex: `webpack --only debug` will only return and build the debug config
    if (argv.only) {
        if (configuration.name !== argv.only) {
            return;
        }
    }

    return _.defaultsDeep(configuration, {
        entry: {
            // the array notation is required due to bug in webpack :
            //    https://github.com/webpack/webpack/issues/300
            jwplayer: ['./src/js/jwplayer.js']
        },
        output: {
            // This would allow loading of modules from our CDN
            //crossOriginLoading: 'anonymous'
        },
        umdNamedDefine: true,
        stats: {
            timings: true
        },
        devtool: 'cheap-source-map',
        resolve: {
            modulesDirectories: [
                'src/js/',
                'src',
                'node_modules'
            ]
        },
        module: {
            loaders: [
                {
                    test: /\.less$/,
                    loaders: [
                        'simple-style-loader',
                        'css',
                        'postcss-loader',
                        'less?compress'
                    ]
                },
                {
                    test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'file-loader?name=[name].[ext]'
                },
                {
                    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'file-loader?name=[name].[ext]'
                },
                {
                    test: /\.js/,
                    exclude: /node_modules/,
                    query: {
                        presets: ['es2015']
                    },
                    loader: 'babel-loader'
                }
            ]
        }
    });
}));

// When only returning one config, return the object.
// This provides flat webpack output can be opened in the analyze tool.
// Example: `webpack --only debug -j > output.json`
//  and open output.json at http://webpack.github.io/analyse/
if (multiConfig.length === 1) {
    multiConfig = multiConfig[0];
}

module.exports = multiConfig;
