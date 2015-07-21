/* jshint node: true */

var fs = require('fs');
var webpack = require('webpack');
var env = process.env;

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

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    var packageInfo = grunt.file.readJSON('package.json');
    var buildVersion = getBuildVersion(packageInfo);
    // both flashVersion and swfTarget are needed to force flex to build using the right version
    var flashVersion = 11.2;
    var swfTarget = 15;

    var webpackCompilers = {};
    var autoprefixBrowsers = encodeURIComponent('> 1%');

    console.log('%s v%s', packageInfo.name, buildVersion);

    grunt.initConfig({
        starttime: new Date(),
        pkg: packageInfo,

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            player : [
                'src/js/**/*.js'
            ],
            tests : [
                'test/{,*/}*.js'
            ],
            grunt : [
                'Gruntfile.js'
            ]
        },

        // lints Less
        recess: {
            lint: {
                options: {
                    // Set compile and compress to false to lint
                    compile: false,
                    compress: false,
                    noIDs: true,
                    noJSPrefix: true,
                    noOverqualifying: false,
                    noUnderscores: true,
                    noUniversalSelectors: false,// true,
                    strictPropertyOrder: false, // true,
                    zeroUnits: false,
                    includePaths: ['src/css', 'src/css/*']
                },
                files: [{
                    expand: true,
                    ext: '.css',
                    dest: 'bin-debug/skins/',
                    cwd: 'src/css/',
                    src: '{,*/}*.less'
                }]
            },
            'generate-test-css': {
                options: {
                    compile: true,
                    compress: false,
                    noIDs: true,
                    noJSPrefix: true,
                    noOverqualifying: false,
                    noUnderscores: true,
                    noUniversalSelectors: false,// true,
                    strictPropertyOrder: false, // true,
                    zeroUnits: false,
                    includePaths: ['src/css', 'src/css/*']
                },
                files: {
                    'bin-debug/jwplayer.css': 'src/css/jwplayer.less'
                }
            },
            skins: {
                options: {
                    compile: true,
                    compress: false,
                    noIDs: true,
                    noJSPrefix: true,
                    noOverqualifying: false,
                    noUnderscores: true,
                    noUniversalSelectors: false,// true,
                    strictPropertyOrder: false, // true,
                    zeroUnits: false,
                    includePaths: ['src/css', 'src/css/*']
                },
                files: [{
                    expand: true,
                    ext: '.css',
                    dest: 'bin-debug/skins/',
                    cwd: 'src/css/skins/',
                    src: '*.less'
                }]
            }
        },

        watch : {
            options: {
                livereload: true
            },
            jshint: {
                files: [
                    '.jshintrc',
                    '.jshintignore'
                ],
                tasks: ['jshint']
            },
            player: {
                files : ['src/js/**/*.js'],
                tasks: ['webpack:debug', 'jshint:player', 'karma:local'],
                options: {
                    spawn: false
                }
            },
            css: {
                files: ['src/css/{,*/}*.less'],
                tasks: ['webpack:debug', 'recess:lint'],
                options: {
                    spawn: false
                }
            },
            tests: {
                files : ['test/{,*/}*.js'],
                tasks: ['jshint:tests', 'karma:local']
            },
            flash: {
                files : [
                    'src/flash/com/longtailvideo/jwplayer/{,*/}*.as',
                    'src/flash/com/wowsa/{,*/}*.as'
                ],
                tasks: ['flash:player:debug']
            },
            grunt: {
                files: ['Gruntfile.js'],
                tasks: ['jshint:grunt']
            }
        },

        connect: {
            options: {
                port: 3000,
                // change this to '0.0.0.0' to access the server from outside
                // change this to 'localhost' to restrict access to the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    open: true,
                    livereload: true,
                    base: [
                        '.'
                    ]
                }
            }
        },

        webpack : {
            options: {
                stats: {
                    timings: true
                },
                resolve: {
                    modulesDirectories: [
                        'src/js/',
                        'src'
                    ]
                },
                devtool: 'cheap-source-map',
                //devtool: 'cheap-eval-source-map',
                module: {
                    loaders: [
                        {
                            test: /\.less$/,
                            loader: 'style!css!autoprefixer?browsers=' + autoprefixBrowsers +
                                    '!less?compress'
                        },
                        {
                            test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                            loader: 'url?limit=10000&mimetype=application/font-woff'
                        },
                        {
                            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                            loader: 'url?limit=10000&mimetype=application/octet-stream'
                        }
                    ]
                }
            },
            debug : {
                options: {
                    entry: {
                        jwplayer : './src/js/jwplayer.js'
                    },
                    output: {
                        path: 'bin-debug/',
                        filename: 'jwplayer.js',
                        library: 'jwplayer',
                        libraryTarget: 'umd',
                        pathinfo: true
                    },
                    plugins: [
                        new webpack.DefinePlugin({
                            __DEBUG__ : true,
                            __BUILD_VERSION__: '\'' + buildVersion + '\'',
                            __FLASH_VERSION__: flashVersion
                        })
                    ]
                }
            },
            release : {
                options: {
                    entry: {
                        jwplayer: './src/js/jwplayer.js'
                    },
                    output: {
                        path: 'bin-release/',
                        filename: 'jwplayer.js',
                        library: 'jwplayer',
                        libraryTarget: 'umd'
                    },
                    plugins: [
                        new webpack.DefinePlugin({
                            __DEBUG__ : false,
                            __BUILD_VERSION__: '\'' + buildVersion + '\'',
                            __FLASH_VERSION__: flashVersion
                        }),
                        new webpack.optimize.UglifyJsPlugin()
                    ]
                }
            }
        },

        flash: {
            player: {
                dest: 'jwplayer.flash.swf',
                main: 'src/flash/com/longtailvideo/jwplayer/player/Player.as'
            }
        },

        karma: {
            options: {
                configFile: './test/karma/karma.conf.js'
            },
            local : {},
            browserstack : {}
        },

        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        'bin-debug',
                        'bin-release'
                    ]
                }]
            }
        }
    });

    grunt.registerMultiTask('flash',
            'Compile Flash SWF files. Usage `grunt flash:player:debug|release|swc:air|flex`', function() {
        var done = this.async();

        var data = this.data;

        var flags = this.flags;
        var isDebug   = !!flags.debug;
        var isLibrary = !!flags.swc;

        var flashAirOrFlexSdk = (!flags.flex && env.AIR_HOME) || env.FLEX_HOME;
        if (!flashAirOrFlexSdk) {
            grunt.fail.warn('To compile ActionScript, you must set environment '+
            'variable $AIR_HOME or $FLEX_HOME for this task to locate mxmlc.');
        }
        var isFlex = /flex/.test(flashAirOrFlexSdk);

        var command = {
            cmd: flashAirOrFlexSdk + '/bin/'+ (isLibrary ? 'compc' : 'mxmlc'),
            args: []
        };

        if (isLibrary) {
            command.args.push('-include-sources='+data.main);
        } else {
            command.args.push(data.main);
        }

        command.args.push(
            '-compiler.source-path=src/flash',
            '-compiler.library-path+=' + flashAirOrFlexSdk + '/frameworks/libs',
            '-target-player=' + flashVersion,
            '-swf-version=' + swfTarget,
            '-use-network=false'
        );

        // Framework specific optimizations
        if (isFlex) {
            command.args.push(
                '-static-link-runtime-shared-libraries=true'
            );
        } else {
            command.args.push(
                '-show-multiple-definition-warnings=true',
                '-compiler.inline=true',
                '-compiler.remove-dead-code=true'
            );

            if (!isLibrary) {
                // ActionScript Compiler 2.0 Shell https://github.com/jcward/ascsh
                var ascshd = fs.existsSync(flashAirOrFlexSdk + '/bin/ascshd');
                if (ascshd) {
                    command.cmd = command.cmd.replace('bin/mxmlc', 'bin/ascshd');
                    command.args.unshift(
                        '-p', 11122 + (isDebug?100:0),
                        'mxmlc'
                    );
                }
            }
        }

        var extension = 'swf';
        var outputFolder = isDebug ? 'bin-debug' : 'bin-release';
        if (isLibrary) {
            extension = 'swc';
            outputFolder = 'libs-external';
        }
        if (isDebug) {
            command.args.push(
                '-output='     + outputFolder +'/' + data.dest.replace('swf', extension),
                '-link-report='+ outputFolder +'/' + data.dest.replace('swf', 'link.xml'),
                '-size-report='+ outputFolder +'/' + data.dest.replace('swf', 'size.xml'),
                '-strict=true',
                '-debug=true',
                '-define+=CONFIG::debugging,true',
                '-define+=CONFIG::staging,true'
            );
        } else {
            command.args.push(
                '-output='+ outputFolder +'/' + data.dest.replace('swf', extension),
                '-optimize=true',
                '-omit-trace-statements=true',
                '-warnings=false',
                '-define+=CONFIG::debugging,false',
                '-define+=CONFIG::staging,false'
            );
        }

        command.args.push(
            '-define+=JWPLAYER::version,\''+ buildVersion +'\''
        );

        // Print the mxmlc / ascshd command. Formatted to run in bash.
        grunt.log.writeln(command.cmd +' '+ command.args.join(' ').replace(/(version,'[^']*')/, '"$1"'));

        var stdout = [];
        var proc = grunt.util.spawn(command, function(error, result, code) {
            grunt.log.subhead(result.stdout);

            if (error) {
                grunt.log.error(error.message, code);
            }
            done(!error);
        });

        proc.stdout.setEncoding('utf-8');
        proc.stdout.on('data', function(data) {
            stdout.push(data);
        });

        var checkIntervalHandle = setInterval(function() {
            if (/Starting aschd server/.test(stdout.join())) {
                clearInterval(checkIntervalHandle);
                grunt.log.ok(command.cmd);

                grunt.log.subhead(stdout.join());

                done();
            }
        }, 500);
    });

    grunt.registerMultiTask('webpack', 'Spawn a webpack compiler', function() {
        var done = this.async();
        var target = this.target;
        var compiler = webpackCompilers[target];
        if (!compiler) {
            compiler = webpackCompilers[target] = webpack(this.options());
        }
        compiler.run(function(err, stats) {
            var fail = false;
            if (err) {
                fail = true;
                grunt.log.writeln(err.toString());
            } else {
                // Fail build when errors are found
                if (stats.compilation.errors.length) {
                    fail = true;
                }
                grunt.log.writeln(stats.toString({
                    chunks: false
                }));
            }
            if (fail) {
                webpackCompilers[target] = null;
                done(false);
                return;
            }
            done();
        });
    });

    grunt.registerTask('test', [
        'karma'
    ]);

    grunt.registerTask('build-js', [
        'webpack:debug',
        'webpack:release',
        'jshint:player',
        'recess'
    ]);

    grunt.registerTask('build-flash', [
        'flash:player:debug',
        'flash:player:release'
    ]);

    grunt.registerTask('build', [
        'clean',
        'build-js',
        'build-flash',
        'karma:local'
    ]);

    grunt.registerTask('serve', [
        'connect:livereload',
        'watch'
    ]);

    grunt.registerTask('default', 'build');
};
