function JSWebSocket (url, msgCallBack, data, name = 'default') {
  this.url = url
  this.msgCallBack = msgCallBack
  this.name = name
  this.ws = null
  this.status = null
  this.connectData = data
  var s = {
    "method": "SUBSCRIBE",
    "params":
      [
        "bnbusdt@kline_1m",
      ],
    "id": 1
  }

  this.connect = function () {
    this.ws = new WebSocket(this.url)
    this.ws.onopen = e => {
      this.status = 'open'
      console.log(`${this.name}连接成功`, e)
      this.heartCheck()
      if (this.connectData !== undefined) {
        return this.ws.send(this.connectData)
      }
    }

    this.ws.onmessage = e => {
      if (e.data === 'ping') {
        this.pingPong = 'ping'
      }
      return this.msgCallBack(e.data)
    }

    this.ws.onclose = e => {
      this.closeHandle(e)
    }

    this.ws.onerror = e => {
      this.closeHandle(e)
    }
  }

  this.heartCheck = function () {
    // 心跳机制的时间可以自己与后端约定
    this.pingPong = 'pong'; // ws的心跳机制状态值
    this.pingInterval = setInterval(() => {
      if (this.ws.readyState === 1) {
        // 检查ws为链接状态 才可发送
        this.ws.send('pong'); // 客户端发送ping
      }
    }, 300000)
    this.pongInterval = setInterval(() => {
      if (this.pingPong === 'pong') {
        this.closeHandle('pingPong没有改变为ping');
      }
      console.log('返回pong')
      this.pingPong = 'pong'
    }, 600000)
  }

  this.sendHandle = function (data) {
    console.log(`${this.name}发送消息给服务器:`, data)
    return this.ws.send(data);
  }

  this.closeHandle = function (e = 'err') {
    // 因为webSocket并不稳定，规定只能手动关闭(调closeMyself方法)，否则就重连
    if (this.status !== 'close') {
      console.log(`${this.name}断开，重连websocket`, e)
      if (this.pingInterval !== undefined && this.pongInterval !== undefined) {
        // 清除定时器
        clearInterval(this.pingInterval);
        clearInterval(this.pongInterval);
      }
      this.connect(); // 重连
    } else {
      console.log(`${this.name}websocket手动关闭`)
    }
  }

  this.closeMySelf = function () {
    console.log(`关闭${this.name}`)
    this.status = 'close'
    return this.ws.close()
  }
}




