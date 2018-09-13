'use strict';

/* eslint-env node */
/* eslint no-process-env: 0 */

const webpack = require('webpack');
const env = process.env;
const packageInfo = require('./package.json');
const flashVersion = 18;
const licensesNotice = require('./jwplayer.license.notice.js');

const bannerOptions = {
    banner: `/*!\n${licensesNotice}\n*/`,
    raw: true,
    include: /^.*.js$/
};

function getBuildVersion(build) {
    // Build Version: {major.minor.revision}
    let metadata = '';
    if (env.BUILD_NUMBER) {
        const branch = env.GIT_BRANCH;
        metadata = 'opensource';
        if (branch) {
            metadata += '_' + branch.replace(/^origin\//, '').replace(/[^0-9A-Za-z-]/g, '-');
        }
        metadata += '.' + env.BUILD_NUMBER;
    } else {
        const now = new Date();
        now.setTime(now.getTime() - now.getTimezoneOffset() * 60000);
        metadata = 'local.' + now.toISOString().replace(/[.\-:T]/g, '-').replace(/Z|\.\d/g, '');
    }
    return `${build.version}+${metadata}`;
}

const compileConstants = {
    __SELF_HOSTED__: true,
    __REPO__: `''`,
    __DEBUG__: false,
    __BUILD_VERSION__: `'${getBuildVersion(packageInfo)}'`,
    __FLASH_VERSION__: flashVersion
};

const multiConfig = [
    {
        name: 'debug',
        mode: 'development',
        output: {
            path: `${__dirname}/bin-debug/`,
            filename: '[name].js',
            chunkFilename:'[name].js',
            sourceMapFilename : '[name].[hash].map',
            library: 'jwplayer',
            libraryExport: 'default',
            libraryTarget: 'window',
            pathinfo: true,
            umdNamedDefine: true
        },
        devtool: 'source-map',
        plugins: [
            new webpack.DefinePlugin(Object.assign({}, compileConstants, {
                __DEBUG__: true
            })),
            new webpack.BannerPlugin(bannerOptions)
        ]
    },
    {
        name: 'release',
        mode: 'production',
        output: {
            path: `${__dirname}/bin-release/`,
            filename: '[name].js',
            chunkFilename: '[name].js',
            library: 'jwplayer',
            libraryExport: 'default',
            libraryTarget: 'window',
            umdNamedDefine: true
        },
        watch: false,
        plugins: [
            new webpack.DefinePlugin(compileConstants),
            new webpack.BannerPlugin(bannerOptions)
        ]
    }
].map(configuration =>
    Object.assign({}, configuration, {
        node: false,
        entry: {
            jwplayer: './src/js/jwplayer.js'
        },
        optimization: {
            splitChunks: false
        },
        resolve: {
            modules: [
                'src/js/',
                'src',
                'node_modules'
            ]
        },
        module: {
            strictExportPresence: true,
            rules: [
                {
                    test: /\.less$/,
                    use: [
                        'simple-style-loader',
                        'css-loader',
                        'postcss-loader',
                        {
                            loader: 'less-loader',
                            options: {
                                compress: true,
                                strictMath: true,
                                noIeCompat: true
                            }
                        }
                    ]
                },
                {
                    test: /\.js$/,
                    exclude: /\/node_modules\//,
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        presets: [
                            ['env', {
                                // Output the babel targets/plugins used
                                // https://babeljs.io/docs/plugins/preset-env/#debug
                                // debug: true,
                                modules: false,
                                targets: {
                                    browsers: [
                                        'chrome >= 55',
                                        'firefox >= 51',
                                        'ie >= 11',
                                        'safari >= 8',
                                        'ios >= 8',
                                        'android >= 4'
                                    ]
                                }
                            }]
                        ],
                        plugins: [
                            {
                                visitor: {
                                    CallExpression: function(espath, file) {
                                        if (espath.get('callee').matchesPattern('Object.assign')) {
                                            espath.node.callee = file.addImport('utils/underscore', 'extend');
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    test: /\.svg$/,
                    loader: 'svg-inline-loader'
                },
                {
                    type: 'javascript/auto',
                    test: /\.json$/,
                    loader: 'file-loader'
                }
            ]
        }
    })
).filter(item => !!item);

module.exports = (envArgs) => {
    if (!envArgs) {
        return multiConfig;
    }

    const enabledConfig = Object.keys(envArgs).find(envName => envArgs[envName]);
    return multiConfig.find(c => c.name === enabledConfig) || multiConfig;
};

