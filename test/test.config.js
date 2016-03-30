const path = require('path');
module.exports = [
    {
        url: 'http://www.163.com',
        forward: {
            // local: path.resolve(__dirname, './test.html'), // higher priority
            url: 'https://www.baidu.com',    // lower priority
            timeout: 1000 // 配置延迟，单位秒
        }
    },
    {
        url: 'http://www.baidu.com',
        forward: {
            local: path.resolve(__dirname, './test.html'), // higher priority
            // url: 'https://www.baidu.com',    // lower priority
            timeout: 0 // 配置延迟，单位秒
        }
    }

]
