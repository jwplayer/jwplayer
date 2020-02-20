import { GenericObject } from 'types/generic.type';

export function browserVersion(browserEnvironment: GenericObject, agent: string): GenericObject {
    let version: string | undefined;
    let major: number | undefined;
    let minor: number | undefined;
    let ix: number | undefined;

    if (browserEnvironment.chrome) {
        // A Chrome UA either contains "Chrome" (desktop/android) or "CriOS" (iOS)
        if (agent.indexOf('Chrome') !== -1) {
            version = agent.substring(agent.indexOf('Chrome') + 7);
        } else {
            version = agent.substring(agent.indexOf('CriOS') + 6);
        }
    } else if (browserEnvironment.safari) {
        // Safari sets its version after the "Version" string in the agent
        version = agent.substring(agent.indexOf('Version') + 8);
    } else if (browserEnvironment.firefox) {
        version = agent.substring(agent.indexOf('Firefox') + 8);
    } else if (browserEnvironment.edge) {
        version = agent.substring(agent.indexOf('Edge') + 5);
    } else if (browserEnvironment.ie) {
        // Older versions of IE use MSIE; IE11 uses rv:
        if (agent.indexOf('rv:') !== -1) {
            version = agent.substring(agent.indexOf('rv:') + 3);
        } else if (agent.indexOf('MSIE') !== -1) {
            version = agent.substring(agent.indexOf('MSIE') + 5);
        }
    }

    if (version) {
        // trim the version string
        if ((ix = version.indexOf(';')) !== -1) {
            version = version.substring(0, ix);
        }
        if ((ix = version.indexOf(' ')) !== -1) {
            version = version.substring(0, ix);
        }
        if ((ix = version.indexOf(')')) !== -1) {
            version = version.substring(0, ix);
        }

        major = parseInt(version, 10);
        // Versions will always be in the d.d.d format
        minor = parseInt(version.split('.')[1], 10);
    }

    // Allow undefined to represent unknown agents
    return {
        version,
        major,
        minor
    };
}
