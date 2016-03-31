const url = require('url');
const _ = require('lodash');
const path = require('path');

const UrlType = {
    local: 'local',
    url: 'url'
}

exports.UrlType = UrlType;

exports.getMatchUrlFromConfig = function getMatchUrlFromConfig (configPath, reqUrl) {
    var result = {
        type: null,
        data: null
    };
    var configUrlsArr = require(configPath);
    var mappingUrls = [];
    for (let i = 0; i < configUrlsArr.length; i++) {
        var configUrl = configUrlsArr[i].url;
        var cUrl = url.format(url.parse(configUrl));
        var rUrl = url.format(url.parse(reqUrl));
        var cUrlRegExp = new RegExp(`^${cUrl.replace(/\*/g, '.*')}$`);
        if (cUrlRegExp.test(rUrl)) {
            mappingUrls.push({
                regexp: cUrlRegExp,
                condition: configUrlsArr[i]
            });
        }
    }

    if (mappingUrls.length === 0) {
        return result;
    }

    var mostMatch = _.maxBy(mappingUrls, u => u.condition.url.length);

    var mostMatchForward = mostMatch.condition.forward;
    var mostMatchUrl = mostMatch.condition.url;
    var mostMatchRegExp = mostMatch.regexp;
    if (mostMatchForward.local) {
        var newLocal = mostMatchForward.local +'/'+ reqUrl.replace(mostMatchUrl.replace('*', ''), '');
        return {
            type: UrlType.local,
            data: newLocal,
            timeout: mostMatchForward.timeout
        }
    } else if (mostMatchForward.url) {
        var newUrl =  mostMatchForward.url +'/'+ reqUrl.replace(mostMatchUrl.replace('*', ''), '');
        return {
            type: UrlType.url,
            data: newUrl,
            timeout: mostMatchForward.timeout
        }
    }

    return result;
}
