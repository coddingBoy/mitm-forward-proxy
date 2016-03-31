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
        url: 'http://pa-milishop.com/elis.wealth.product.queryProductList.wealth2',
        forward: {
            // local: path.resolve(__dirname, '../test'), // higher priority
            url: 'https://test1-elis-pa18-smp.pingan.com.cn:8442/life_insurance/elis.wealth.product.queryProductList.wealth2',    // lower priority
            timeout: 0 // 配置延迟，单位秒
        }
    }

]
