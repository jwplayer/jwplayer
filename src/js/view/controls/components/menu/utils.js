const getColorValue = (option) => colorTable[option];
const getColorOption = (value) => {
    const colors = Object.keys(colorTable);
    let option;
    for (let i = 0; i < colors.length; i++) {
        if (colorTable[colors[i]] === value) {
            option = colors[i];
            break;
        }
    }
    return option;
};
const getPercentOption = (value) => value + '%';
const getPercentValue = (option) => parseInt(option);
export const captionStyleItems = [
    {
        name: 'color',
        options: ['White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'],
        defaultVal: 'White',
        getTypedValue: getColorValue,
        getOption: getColorOption
        
    },
    {
        name: 'fontOpacity',
        options: ['100%', '75%', '25%'],
        defaultVal: '100%',
        getTypedValue: getPercentValue,
        getOption: getPercentOption
        
    },
    {
        name: 'userFontScale',
        options: ['200%', '175%', '150%', '125%', '100%', '75%', '50%'],
        defaultVal: '100%',
        getTypedValue: (option) => parseInt(option) / 100,
        getOption: (value) => (value * 100) + '%'
    },
    {
        name: 'fontFamily',
        options: [
            'Arial', 
            'Courier', 
            'Georgia', 
            'Impact', 
            'Lucida Console', 
            'Tahoma', 
            'Times New Roman', 
            'Trebuchet MS', 
            'Verdana'
        ],
        defaultVal: 'Arial',
        getTypedValue: (option) => option,
        getOption: (value) => value
    },
    {
        name: 'edgeStyle',
        options: [ 'None', 'Raised', 'Depressed', 'Uniform', 'Drop Shadow'
        ],
        defaultVal: 'None',
        getTypedValue: (option) => /Drop Shadow/.test(option) ? 'dropShadow' : option.toLowerCase(),
        getOption: (value) => {
            const result = value.replace(/([A-Z])/g, ' $1');
            const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
            return finalResult;
        }
    },
    {
        name: 'backgroundColor',
        options: [
            'White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'
        ],
        defaultVal: 'Black',
        getTypedValue: getColorValue,
        getOption: getColorOption
    },
    {
        name: 'backgroundOpacity',
        options: ['100%', '75%', '50%', '25%', '0%'],
        defaultVal: '50%',
        getTypedValue: getPercentValue,
        getOption: getPercentOption
    },
    {
        name: 'windowColor',
        options: [
            'White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'
        ],
        defaultVal: 'Black',
        getTypedValue: getColorValue,
        getOption: getColorOption
    },
    {
        name: 'windowOpacity',
        options: ['100%', '75%', '50%', '25%', '0%'],
        defaultVal: '0%',
        getTypedValue: getPercentValue,
        getOption: getPercentOption
    },
];

const colorTable = {
    White: '#ffffff',
    Black: '#000000',
    Red: '#ff0000',
    Green: '#00ff00',
    Blue: '#0000ff',
    Yellow: '#ffff00',
    Magenta: 'ff00ff',
    Cyan: '#00ffff'
};

export const normalizeKey = (sourceEventKey) => sourceEventKey && sourceEventKey.replace(/(Arrow|ape)/, '');
