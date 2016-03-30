const url = require('url');

module.exports.getMatchUrlFromConfig = function getMatchUrlFromConfig (configPath, reqUrl) {
    var configUrlsArr = require(configPath);
    for (let i = 0; i < configUrlsArr.length; i++) {
        var configUrl = configUrlsArr[i].url;
        var configUrlObj = url.parse(configUrl);
        var reqUrlObj = url.parse(reqUrl);
        if (url.format(configUrlObj) === url.format(reqUrlObj)) {
            return configUrlsArr[i];
        }
    }
    return null;
}
