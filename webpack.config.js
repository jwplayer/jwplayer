'use strict';

/* eslint-env node */
/* eslint no-process-env: 0 */

const webpack = require('webpack');
const {merge} = require('webpack-merge');
const addNamed = require('@babel/helper-module-imports').addNamed;
const getBuildVersion = require('./build.version.js');
const licensesNotice = require('./jwplayer.license.notice.js');
const CleanCSSPlugin = require('less-plugin-clean-css');

const compileConstants = {
    __SELF_HOSTED__: true,
    __REPO__: `''`,
    __DEBUG__: false,
    __HEADLESS__: false,
    __BUILD_VERSION__: `'${getBuildVersion()}'`,
};

const webpackConfig = {
    mode: 'none',
    node: false,
    entry: {
        jwplayer: './src/js/jwplayer.js'
    },
    output: {
        filename: '[name].js',
        library: 'jwplayer',
        libraryExport: 'default',
        libraryTarget: 'window',
        umdNamedDefine: true
    },
    optimization: {
        splitChunks: false
    },
    resolve: {
        modules: [
            'src/js/',
            'src',
            'node_modules'
        ],
        extensions: ['.ts', '.js']
    },
    module: {
        strictExportPresence: true,
        rules: [
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    'postcss-loader',
                    {
                        loader: 'less-loader',
                        options: {
                            lessOptions: {
                                plugins: [
                                    new CleanCSSPlugin({compatibility: '*'})
                                ],
                                strictMath: true,
                                noIeCompat: true
                            }
                        }
                    }
                ]
            },
            {
                test: /\.svg$/,
                loader: 'svg-inline-loader'
            },
            {
                test: /\.(?:ts|js)$/,
                exclude: /\/node_modules\//,
                use: {
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        presets: [
                            ['@babel/preset-env', { loose: true, modules: false }],
                            ['@babel/preset-typescript', {
                                onlyRemoveTypeImports: true
                            }]
                        ],
                        plugins: [
                            {
                                visitor: {
                                    CallExpression: function(path) {
                                        if (path.get('callee').matchesPattern('Object.assign')) {
                                            path.node.callee = addNamed(path, 'extend', 'utils/underscore');
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: `/*!\n${licensesNotice}\n*/`,
            raw: true,
            include: /^.*.js$/
        })
    ]
};

const configVariants = [
    {
        name: 'debug',
        mode: 'development',
        devtool: 'cheap-module-source-map',
        output: {
            path: `${__dirname}/bin-debug/`,
            sourceMapFilename: '[name].[fullhash].map',
            pathinfo: true
        },
        plugins: [
            new webpack.DefinePlugin(Object.assign({}, compileConstants, {
                __DEBUG__: true
            }))
        ]
    },
    {
        name: 'release',
        mode: 'production',
        output: {
            path: `${__dirname}/bin-release/`
        },
        plugins: [
            new webpack.DefinePlugin(compileConstants)
        ]
    }
];

module.exports = (envArgs) => {
    if (envArgs) {

        const selectedVariants = []

        Object.keys(envArgs).forEach(function(envKey) {
            for (let i = 0; i < configVariants.length; i++) {
                const variant = configVariants[i];

                if (envKey === variant.name) {
                    selectedVariants.push(variant);
                }
            }
        });

        if (selectedVariants.length) {
            return selectedVariants.map(variant => merge(webpackConfig, variant));
        }
    }
    return configVariants.map(variant => merge(webpackConfig, variant));
};

