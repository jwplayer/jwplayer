var env = process.env;
var fs = require('fs');

module.exports = function(grunt) {
    grunt.registerMultiTask('flash',
        'Compile Flash SWF files. Usage `grunt flash:player:debug|release|swc:air|flex`', function() {

            var done = this.async();

            var flashVersion = grunt.config('flashVersion');
            var swfTarget = grunt.config('swfTarget');
            var buildVersion = grunt.config('buildVersion');
            var options = this.options();
            var mainFile = options.main;
            var destinationFile = options.name;
            var outputFolder = options.output;

            var isDebug   = this.flags.debug;
            var isLibrary = this.flags.swc;
            var useFlex = this.flags.flex;

            var flashAirOrFlexSdk = (!useFlex && env.AIR_HOME) || env.FLEX_HOME;
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
                command.args.push('-include-sources='+ mainFile);
            } else {
                command.args.push(mainFile);
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

            if (isLibrary) {
                destinationFile.replace('swf', 'swc');
                outputFolder = 'libs-external';
            }
            if (isDebug) {
                command.args.push(
                    '-output='     + outputFolder +'/' + destinationFile,
                    '-link-report='+ outputFolder +'/' + destinationFile.slice(0, -4) + 'link.xml',
                    '-size-report='+ outputFolder +'/' + destinationFile.slice(0, -4) + 'size.xml',
                    '-strict=true',
                    '-debug=true',
                    '-define+=CONFIG::debugging,true',
                    '-define+=CONFIG::staging,true'
                );
            } else {
                command.args.push(
                    '-output='+ outputFolder +'/' + destinationFile,
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
};
