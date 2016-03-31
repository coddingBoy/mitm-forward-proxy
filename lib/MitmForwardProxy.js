'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var http = require('http');
var domain = require('domain');
var utils = require('./utils');
var fs = require('fs');
var url = require('url');
var path = require('path');
var https = require('https');
var through = require('through2');
var net = require('net');
var logColor = {
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    Reset: "\x1b[0m"
};

var d = domain.create();
d.on('error', function (err) {
    console.log(err.message);
});

module.exports = function () {
    function MitmForwardProxy(_ref) {
        var _this = this;

        var configPath = _ref.configPath;
        var _ref$port = _ref.port;
        var port = _ref$port === undefined ? 7777 : _ref$port;
        var _ref$https = _ref.https;
        var https = _ref$https === undefined ? false : _ref$https;
        var _ref$maxHttpsFakeServ = _ref.maxHttpsFakeServer;
        var maxHttpsFakeServer = _ref$maxHttpsFakeServ === undefined ? 50 : _ref$maxHttpsFakeServ;

        _classCallCheck(this, MitmForwardProxy);

        if (!configPath) {
            throw new Error('No configPath');
        }
        this.configPath = path.resolve(configPath);
        this.port = port;
        var server = new http.Server();
        server.listen(this.port, function () {
            console.log(logColor.FgGreen + '%s' + logColor.Reset, '代理启动端口: ' + _this.port);
            server.on('error', function (e) {
                console.error(e);
            });
            server.on('request', function (req, res) {
                d.run(function () {
                    _this.forwardHttp(req, res);
                });
            });
            // tunneling for https
            server.on('connect', function (req, cltSocket, head) {
                d.run(function () {
                    // connect to an origin server
                    var srvUrl = url.parse('http://' + req.url);
                    // console.log(req.url);
                    var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, function () {
                        cltSocket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: SpyProxy\r\n' + '\r\n');
                        srvSocket.write(head);
                        srvSocket.pipe(cltSocket);
                        cltSocket.pipe(srvSocket);
                    });
                });
            });
        });
    }

    _createClass(MitmForwardProxy, [{
        key: 'forwardHttp',
        value: function forwardHttp(req, res) {
            var _this2 = this;

            var forwardObj = utils.getMatchUrlFromConfig(this.configPath, req.url);
            if (forwardObj && forwardObj.type && forwardObj.data) {
                var responseCB = function responseCB() {
                    if (forwardObj.type === utils.UrlType.local) {
                        console.log(logColor.FgGreen + '%s' + logColor.Reset, 'URL: ' + req.url + ' 被代理到本地 ' + forwardObj.data + '，设置延迟：' + (forwardObj.timeout ? forwardObj.timeout : 0) + '毫秒');
                        res.writeHead('200');
                        var rs = new fs.ReadStream(path.resolve(forwardObj.data));
                        rs.pipe(res);
                    } else if (forwardObj.type === utils.UrlType.url) {
                        var urlObject = url.parse(forwardObj.data);
                        console.log(logColor.FgGreen + '%s' + logColor.Reset, 'URL: ' + req.url + ' 被转发到 ' + forwardObj.data + '，设置延迟：' + (forwardObj.timeout ? forwardObj.timeout : 0) + '毫秒');

                        req.headers['host'] = urlObject.hostname;
                        // req.headers['origin'] = urlObject.hostname;

                        if (/^https/i.test(urlObject.protocol)) {
                            var rOptions = {
                                protocol: urlObject.protocol,
                                hostname: urlObject.hostname,
                                method: req.method,
                                port: urlObject.port || 443,
                                path: urlObject.path,
                                headers: req.headers
                            };
                            _this2.proxyRequestHttps(rOptions, req, res);
                        } else {
                            var rOptions = {
                                protocol: urlObject.protocol,
                                hostname: urlObject.hostname,
                                method: req.method,
                                port: urlObject.port || 80,
                                path: urlObject.path,
                                headers: req.headers
                            };
                            _this2.proxyRequestHttp(rOptions, req, res);
                        }
                    } else {
                        _this2.ignoreHttpRequest(req, res);
                    }
                };

                if (forwardObj.timeout) {
                    setTimeout(function () {
                        responseCB();
                    }, forwardObj.timeout);
                } else {
                    responseCB();
                }
            } else {
                this.ignoreHttpRequest(req, res);
            }
        }
    }, {
        key: 'ignoreHttpRequest',
        value: function ignoreHttpRequest(req, res) {
            var urlObject = url.parse(req.url);
            var rOptions = {
                protocol: urlObject.protocol,
                hostname: urlObject.hostname,
                method: req.method,
                port: urlObject.port || 80,
                path: urlObject.path,
                headers: req.headers
            };
            this.proxyRequestHttp(rOptions, req, res);
        }
    }, {
        key: 'proxyRequestHttp',
        value: function proxyRequestHttp(rOptions, req, res) {
            var proxyReq = new http.ClientRequest(rOptions, function (proxyRes) {
                Object.keys(proxyRes.headers).forEach(function (key) {
                    if (proxyRes.headers[key] != undefined) {
                        var newkey = key.replace(/^[a-z]|-[a-z]/g, function (match) {
                            return match.toUpperCase();
                        });
                        var newkey = key;
                        res.setHeader(newkey, proxyRes.headers[key]);
                    }
                });
                res.writeHead(proxyRes.statusCode);
                proxyRes.pipe(res);
            });

            req.on('aborted', function () {
                proxyReq.abort();
            });
            req.pipe(proxyReq);
        }
    }, {
        key: 'proxyRequestHttps',
        value: function proxyRequestHttps(rOptions, req, res) {
            var proxyReq = https.request(rOptions, function (proxyRes) {
                Object.keys(proxyRes.headers).forEach(function (key) {
                    if (proxyRes.headers[key] != undefined) {
                        var newkey = key.replace(/^[a-z]|-[a-z]/g, function (match) {
                            return match.toUpperCase();
                        });
                        var newkey = key;
                        res.setHeader(newkey, proxyRes.headers[key]);
                    }
                });
                res.writeHead(proxyRes.statusCode);
                proxyRes.pipe(res);
            });

            req.on('aborted', function () {
                proxyReq.abort();
            });
            req.pipe(proxyReq);
        }
    }]);

    return MitmForwardProxy;
}();