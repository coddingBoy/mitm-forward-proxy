const http = require('http');
const domain = require('domain');
const utils = require('./utils');
const fs = require('fs');
const url = require('url');
const path = require('path');
const https = require('https');
const through = require('through2');
const net = require('net');
const logColor = {
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    Reset: "\x1b[0m"
};

var d = domain.create();
d.on('error', function (err) {
    console.log(err.message);
});

module.exports = class MitmForwardProxy {
    constructor({configPath,port = 7777, https = false, maxHttpsFakeServer = 50}) {
        if (!configPath) {
            throw new Error('No configPath');
        }
        this.configPath = path.resolve(configPath);
        this.port = port;
        var server = new http.Server();
        server.listen(this.port, () => {
            console.log(logColor.FgGreen + '%s' + logColor.Reset, `代理启动端口: ${this.port}`);
            server.on('error', (e) => {
                console.error(e);
            });
            server.on('request', (req, res) => {
                d.run(() => {
                    this.forwardHttp(req, res);
                });
            });
            // tunneling for https
            server.on('connect', (req, cltSocket, head) => {
                d.run(() => {
                    // connect to an origin server
                    var srvUrl = url.parse(`http://${req.url}`);
                    // console.log(req.url);
                    var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
                        cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                        'Proxy-agent: SpyProxy\r\n' +
                        '\r\n');
                        srvSocket.write(head);
                        srvSocket.pipe(cltSocket);
                        cltSocket.pipe(srvSocket);
                    });
                });
            });
        });
    }
    forwardHttp (req, res) {
        var forwardObj = utils.getMatchUrlFromConfig(this.configPath, req.url);
        if (forwardObj && forwardObj.type && forwardObj.data) {
            var responseCB = () => {
                if (forwardObj.type === utils.UrlType.local) {
                    console.log(logColor.FgGreen + '%s' + logColor.Reset, `URL: ${req.url} 被代理到本地 ${forwardObj.data}，设置延迟：${forwardObj.timeout?forwardObj.timeout:0}毫秒`);
                    res.writeHead('200');
                    var rs = new fs.ReadStream(path.resolve(forwardObj.data));
                    rs.pipe(res);
                } else if (forwardObj.type === utils.UrlType.url){
                    var urlObject = url.parse(forwardObj.data);
                    console.log(logColor.FgGreen + '%s' + logColor.Reset, `URL: ${req.url} 被转发到 ${forwardObj.data}，设置延迟：${forwardObj.timeout?forwardObj.timeout:0}毫秒`);

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
                        }
                        this.proxyRequestHttps(rOptions, req, res);
                    } else {
                        var rOptions = {
                            protocol: urlObject.protocol,
                            hostname: urlObject.hostname,
                            method: req.method,
                            port: urlObject.port || 80,
                            path: urlObject.path,
                            headers: req.headers
                        }
                        this.proxyRequestHttp(rOptions, req, res);
                    }
                } else {
                    this.ignoreHttpRequest(req, res);
                }
            }

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
    ignoreHttpRequest (req, res) {
        var urlObject = url.parse(req.url);
        var rOptions = {
            protocol: urlObject.protocol,
            hostname: urlObject.hostname,
            method: req.method,
            port: urlObject.port || 80,
            path: urlObject.path,
            headers: req.headers
        }
        this.proxyRequestHttp (rOptions, req, res);
    }
    proxyRequestHttp (rOptions, req, res) {
        var proxyReq = new http.ClientRequest(rOptions, (proxyRes) => {
            Object.keys(proxyRes.headers).forEach(function(key) {
                if(proxyRes.headers[key] != undefined){
                    var newkey = key.replace(/^[a-z]|-[a-z]/g, (match) => {
                        return match.toUpperCase()
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
    proxyRequestHttps (rOptions, req, res) {
        var proxyReq = https.request(rOptions, (proxyRes) => {
            Object.keys(proxyRes.headers).forEach(function(key) {
                if(proxyRes.headers[key] != undefined){
                    var newkey = key.replace(/^[a-z]|-[a-z]/g, (match) => {
                        return match.toUpperCase()
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
}
