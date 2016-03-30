# 关于mitm-forward-proxy


## 安装
Windows 下
```
    npm install mitm-forward-proxy -g
```

Mac 下
```
    sudo npm install mitm-forward-proxy -g
```

## 使用

#### 设置配置文件路径(必选)
```
mitm-forward-proxy -c <配置文件路径>
```
<a href="test/test.config.js">参考配置</a>

#### 设置端口(可选，默认7777)
```
mitm-forward-proxy -p 7778
```
