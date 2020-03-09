export interface CaptionsLocalization {
    subtitleSettings: string;
    color: string;
    fontOpacity: string;
    userFontScale: string;
    fontFamily: string;
    edgeStyle: string;
    backgroundColor: string;
    backgroundOpacity: string;
    windowColor: string;
    windowOpacity: string;
    white: string;
    black: string;
    red: string;
    green: string;
    blue: string;
    yellow: string;
    magenta: string;
    cyan: string;
    none: string;
    raised: string;
    depressed: string;
    uniform: string;
    dropShadow: string;
}

const colorValues: string[] = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 'ff00ff', '#00ffff'];

const fontValues: string[] = [
    'Arial', 
    'Courier', 
    'Georgia', 
    'Impact', 
    'Lucida Console', 
    'Tahoma', 
    'Times New Roman', 
    'Trebuchet MS', 
    'Verdana'
];

const opacityOptions: string[] = ['100%', '75%', '50%', '25%', '0%'];
const opacityValues: number[] = [100, 75, 50, 25, 0];

let colors: string[] | undefined;
let fonts: string[] | undefined;

export const captionStyleItems = (localization: CaptionsLocalization) => [
    {
        name: 'color',
        label: localization.color,
        options: colors || colorOptions(localization),
        values: colorValues,
        defaultVal: '#ffffff',
        
    },
    {
        name: 'fontOpacity',
        label: localization.fontOpacity,
        options: ['100%', '75%', '25%'],
        values: [100, 75, 25],
        defaultVal: 100,
        
    },
    {
        name: 'userFontScale',
        label: localization.userFontScale,
        options: ['200%', '175%', '150%', '125%', '100%', '75%', '50%'],
        values: [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5],
        defaultVal: 1,
    },
    {
        name: 'fontFamily',
        label: localization.fontFamily,
        options: fontValues,
        values: fontValues,
        defaultVal: 'Arial',
    },
    {
        name: 'edgeStyle',
        label: localization.edgeStyle,
        options: fonts || fontOptions(localization),
        values: [ 'none', 'raised', 'depressed', 'uniform', 'dropShadow'
        ],
        defaultVal: 'none',
    },
    {
        name: 'backgroundColor',
        label: localization.backgroundColor,
        options: colors || colorOptions(localization),
        values: colorValues,
        defaultVal: '#000000',
    },
    {
        name: 'backgroundOpacity',
        label: localization.backgroundOpacity,
        options: opacityOptions,
        values: opacityValues,
        defaultVal: 50,
    },
    {
        name: 'windowColor',
        label: localization.windowColor,
        options: colors || colorOptions(localization),
        values: colorValues,
        defaultVal: '#000000',
    },
    {
        name: 'windowOpacity',
        label: localization.windowOpacity,
        options: ['100%', '75%', '50%', '25%', '0%'],
        values: opacityValues,
        defaultVal: 0,
    },
];

export const normalizeKey = (sourceEventKey?: string): string | undefined => 
    sourceEventKey && sourceEventKey.replace(/(Arrow|ape)/, '');

const colorOptions = (localization: CaptionsLocalization): string[] => {
    const { white, black, red, green, blue, yellow, magenta, cyan } = localization;
    colors = [ white, black, red, green, blue, yellow, magenta, cyan ];
    return colors;
};

const fontOptions = (localization: CaptionsLocalization): string[] => {
    const { none, raised, depressed, uniform, dropShadow } = localization;
    fonts = [ none, raised, depressed, uniform, dropShadow];
    return fonts;
};

