var fs = require('fs');
var webpack = require('webpack');
var env = process.env;

function getBuildVersion(packageInfo) {
    // Build Version: {major.minor.revision}
    var revision = env.BUILD_NUMBER;
    if (revision === undefined) {
        var now = new Date();
        now.setTime(now.getTime()-now.getTimezoneOffset()*60000);
        revision = now.toISOString().replace(/[\.\-:Z]/g, '').replace(/T/g, '');
    }

    return packageInfo.version.replace(/\.\d*$/, '.' + revision);
}

module.exports = function(grunt) {
    /* jshint node: true */

    require('load-grunt-tasks')(grunt);

    var packageInfo = grunt.file.readJSON('package.json');
    var buildVersion = getBuildVersion(packageInfo);

    grunt.initConfig({
        starttime: new Date(),
        pkg: packageInfo,

        jshint: {
            all : [
                'src/js/**/*.js',
                'Gruntfile.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        // Compiles and lints Less/CSS to CSS
        recess: {
            dist: {
                options: {
                    compile: false,     // Set to false to lint
                    compress: false,    // Set to false to lint
                    noIDs: true,
                    noJSPrefix: true,
                    noOverqualifying: false,
                    noUnderscores: true,
                    noUniversalSelectors: true,
                    prefixWhitespace: true,
                    strictPropertyOrder: true,
                    zeroUnits: false,   // Occasionally set this to true, but it will misinterpret some values.
                    includePaths: ['src/less', 'src/less/*']
                },
                files: {
					'bin-debug/jwplayer.css' : 'src/less/jwplayer.less'
                }
            }
		},

        uglify : {
            options: {
                // fails with node 0.12.0 and grunt-contrib-uglify 0.4.1
                // https://github.com/gruntjs/grunt-contrib-uglify/issues/302
                // report: 'gzip',
                mangle: true,
                compress: {
                    booleans: true,
                    cascade :true,
                    conditionals: true,
                    dead_code: true,
                    drop_console: true,
                    evaluate: true,
                    if_return: true,
                    join_vars: true,
                    pure_getters: true,
                    sequences: true,
                    unused: true,
                    warnings: false
                }
            },
            player : {
                files: {
                    'bin-release/jwplayer.js': 'bin-debug/jwplayer.js'
                }
            }
        },

        watch : {
            jshint: {
                files: [
                    '.jshintrc',
                    '.jshintignore'
                ],
                tasks: ['jshint']
            },
            player: {
                files : ['src/js/**/*.js', 'src/js/*.js'],
                tasks: ['build-js']
            },
            flash: {
                files : [
                    'src/flash/com/longtailvideo/jwplayer/{,*/}*.as',
                    'src/flash/com/wowsa/{,*/}*.as'
                ],
                tasks: ['flash:player:debug']
            },
			css: {
                files: [
                    'src/less/*.less',
                    'src/less/imports/*.less'],
                tasks: ['webpack']
            },
            grunt: {
                files: ['Gruntfile.js'],
                tasks: ['jshint']
            }
        },

        webpack : {
            build : {
                entry: {
                    jwplayer : './src/js/jwplayer.js'
                },
                output: {
                    path: 'bin-debug/',
                    filename: '[name].js'
                },
                resolve: {
                    modulesDirectories: [
                        'src/js/',
                        'src'
                    ],
                    alias: {
                        'underscore': 'utils/underscore'
                    }
                },
                devtool: 'source-map',
                plugins: [
                    new webpack.DefinePlugin({
                        __BUILD_VERSION__: '\'' + buildVersion + '\''
                    })
                ],
                module: {
                    loaders: [
						{
							test: /\.less$/,
							loader: 'style-loader!css-loader!less-loader'
						},
						{
							test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
							loader: 'url?limit=10000&minetype=application/font-woff'
						},
						{
							test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
							loader: 'url?limit=10000&minetype=application/octet-stream'
						},
						{
							test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
							loader: 'file'
						},
						{
							test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
							loader: 'url?limit=10000&minetype=image/svg+xml'
						}
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

    grunt.registerMultiTask('flash', 'Compile Flash SWF files. Usage `grunt flash:*|player|vast:debug|release|swc:air|flex`', function() {
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
            '-default-background-color=0x000000',
            '-default-frame-rate=30',
            '-target-player=11.1.0',
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

    grunt.registerTask('build-js', [
        'webpack',
        'uglify'
    ]);

    grunt.registerTask('default', [
        'clean',
        'build-js',
        'flash:player:debug',
        'flash:player:release'
    ]);
};
