const config = require('./.eslintrc.js');

// eslint rules conflic with typescript rules as of eslint@8
// so we have to turn of eslint rules and turn on the typescript counterpart
['no-shadow', 'no-redeclare'].forEach(function(ruleName) {
  config.rules[ruleName] = 'off';
  config.rules[`@typescript-eslint/${ruleName}`] = 'error';
});

// type definitions do not play well with this rule
config.rules['no-restricted-globals'] = 'off';

module.exports = config;
