import type { OSEnvironment, EnvironmentVersion } from './environment';

function execResult(regex: RegExp, str: string): string | undefined {
    const array: RegExpExecArray | null = regex.exec(str);
    if (array && array.length > 1) {
        return array[1];
    }
}

export function osVersion(osEnvironment: OSEnvironment, agent: string): EnvironmentVersion {
    let version: string | undefined;
    let major: number | undefined;
    let minor: number | undefined;

    if (osEnvironment.windows) {
        version = execResult(/Windows(?: NT|)? ([._\d]+)/, agent);
        // Map the Windows NT version to the canonical Windows version
        switch (version) {
            case '6.1':
                version = '7.0';
                break;
            case '6.2':
                version = '8.0';
                break;
            case '6.3':
                version = '8.1';
                break;
            default:
                break;
        }
    } else if (osEnvironment.android) {
        version = execResult(/Android ([._\d]+)/, agent);
    } else if (osEnvironment.iOS) {
        version = execResult(/OS ([._\d]+)/, agent);
    } else if (osEnvironment.mac) {
        version = execResult(/Mac OS X ([._\d]+)/, agent);
    } else if (osEnvironment.tizen) {
        version = execResult(/Tizen ([._\d]+)/, agent);
    }

    if (version) {
        major = parseInt(version, 10);
        // Versions may be in the d.d.d or d_d_d format
        const versionNumbers: string[] = version.split(/[._]/);
        if (versionNumbers) {
            minor = parseInt(versionNumbers[1], 10);
        }
    }

    // Allow undefined to represent unknown agents
    return {
        version,
        major,
        minor
    };
}
