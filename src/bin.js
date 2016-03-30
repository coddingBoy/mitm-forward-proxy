#!/usr/bin/env node

const program = require('commander');
const MitmForwardProxy = require('./MitmForwardProxy');

program.version(require('../package.json').version)
.option('-p, --port [value]', 'start port')
.option('-c, --configPath [value]', 'spy iframe window')
.parse(process.argv);

new MitmForwardProxy({
    port: program.port,
    configPath: program.configPath
});
