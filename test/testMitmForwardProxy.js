var MitmForwardProxy = require('../lib');
var path = require('path');

new MitmForwardProxy({
    port: 7778,
    configPath: path.resolve(__dirname, './test.config.js')
});
