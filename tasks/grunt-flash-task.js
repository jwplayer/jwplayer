var fs = require('fs');
var env = process.env;

/*
"SWF Version" | "Flash Player Version"
 ========================================
 9       |          9
 10       |      10.0, 10.1
 11       |         10.2
 12       |         10.3
 13       |         11.0
 14       |         11.1
 15       |         11.2
 16       |         11.3
 17       |         11.4
 18       |         11.5
 19       |         11.6
 20       |         11.7
 21       |         11.8
 22       |         11.9
 23       |         12.0
 24       |         13.0
 25       |         14.0
 26       |         15.0
 27       |         16.0
 28       |         17.0
 Src: http://sleepydesign.blogspot.com/2012/04/flash-swf-version-meaning.html
 */
function executeCmd(grunt, command, done) {

    // Print the command formatted to run in bash
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

    // Recognize when the action-script-compiler-daemon is running
    //  which sometimes halts grunt
    var checkIntervalHandle = setInterval(function() {
        if (/Starting aschd server/.test(stdout.join())) {
            clearInterval(checkIntervalHandle);
            grunt.log.ok(command.cmd);

            grunt.log.subhead(stdout.join());

            done();
        }
    }, 500);
}

module.exports = function(grunt) {

    var description = 'Compile Flash SWF files. Usage `grunt flash:player:debug|release|swc:air|flex`';
    grunt.registerMultiTask('flash', description, function() {

        var task = this;

        var options = this.options({
            flashVersion: 11.2,
            swfTarget: 15,
            sdk: env.FLEX_HOME
        });

        // A common failure is forgetting so set an environment variable
        if (!options.sdk) {
            grunt.fail.warn('To compile ActionScript, you must set environment ' +
                'variable $AIR_HOME or $FLEX_HOME for this task to locate mxmlc.');
        }

        this.files.forEach(function(file) {
            // If a flag tells us to build the library file
            if (options.swc) {
                buildLibrary(file.src[0], file.dest, task, options);
            } else {
                compileFile(file.src[0], file.dest, task, options);
            }
        });
    });


    function generateArgs(options) {
        var arr = [
            '-compiler.source-path=src/flash',
            '-compiler.library-path+=' + options.sdk + '/frameworks/libs',
            '-default-background-color=0x000000',
            '-default-frame-rate=30',
            '-target-player=' + options.flashVersion,
            '-swf-version=' + options.swfTarget,
            '-use-network=true',
            '-define+=JWPLAYER::version,\'' + options.buildVersion + '\''
        ];

        if (options.compilerLibraryPath) {
            arr.push(
                '-compiler.library-path+='+ options.compilerLibraryPath
            );
        }
        if (options.externalLibraryPath) {
            arr.push(
                '-external-library-path+=' + options.externalLibraryPath
            );
        }
        if (options.extraSourcePath) {
            arr.push(
                    '-compiler.source-path+=' + options.extraSourcePath
            );
        }
        return arr;
    }

    /**
     * Compile a swc for other projects to link against
     */
    function buildLibrary(src, dest, task, options) {
        var done = task.async();

        var args = generateArgs(options);

        var command = {
            cmd: options.sdk + '/bin/compc',
            args: args.concat(
                '-output=' + dest,
                '-include-sources=' + src,
                '-show-multiple-definition-warnings=true',
                '-compiler.inline=true',
                '-compiler.remove-dead-code=true',
                '-optimize=true',
                '-omit-trace-statements=true',
                '-warnings=false',
                '-define+=CONFIG::debugging,false',
                '-define+=CONFIG::staging,false'
            )
        };

        executeCmd(grunt, command, done);
    }

    function compileFile(src, dest, task, options) {
        var done = task.async();

        var args = generateArgs(options);
        var command = {
            cmd: options.sdk + '/bin/mxmlc',
            args: args.concat(
                '-output=' + dest,
                src
            )
        };

        var isAir = /air/.test(options.sdk.toLowerCase());
        if (isAir) {
            // ActionScript Compiler 2.0 Shell https://github.com/jcward/ascsh
            var ascshd = fs.existsSync(options.sdk + '/bin/ascshd');
            if (ascshd) {
                command.cmd = command.cmd.replace('bin/mxmlc', 'bin/ascshd');
                command.args.unshift(
                    '-p', options.ascshdPort + (options.debug ? 100 : 0),
                    'mxmlc'
                );
            }
        }


        // Framework specific optimizations
        var isFlex = /flex/.test(options.sdk);
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
        }


        if (options.debug) {
            command.args.push(
                '-link-report=' + dest.slice(0, -4) + 'link.xml',
                '-size-report=' + dest.slice(0, -4) + 'size.xml',
                '-strict=true',
                '-debug=true',
                '-define+=CONFIG::debugging,true',
                '-define+=CONFIG::staging,true'
            );
        } else {
            command.args.push(
                '-optimize=true',
                '-omit-trace-statements=true',
                '-warnings=false',
                '-define+=CONFIG::debugging,false',
                '-define+=CONFIG::staging,false'
            );
        }

        executeCmd(grunt, command, done);
    }
};
