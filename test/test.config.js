const path = require('path');
module.exports = [
    {
        url: 'http://pa-milishop.com/*',
        forward: {
            // local: path.resolve(__dirname, './test.html'), // higher priority
            url: 'http://localhost:7777',    // lower priority
            timeout: 0 // 配置延迟，单位秒
        }
    },
    {
        url: 'http://www.baidu.com',
        forward: {
            // local: path.resolve(__dirname, '../test'), // higher priority
            url: 'http://www.163.com',    // lower priority
            timeout: 0 // 配置延迟，单位秒
        }
    }

]
