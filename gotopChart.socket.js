function JSWebSocket () {
}

JSWebSocket.Connect = function (obj) {
  const socket = new WebSocket(obj.url)
  socket.addEventListener('open', function (event) {
    console.log("链接成功")
    var s = {
      "method": "SUBSCRIBE",
      "params":
        [
          "bnbusdt@kline_1m",
        ],
      "id": 1
    }
    socket.send(JSON.stringify(s))
  })
  socket.addEventListener('close', function (event) {
    console.log("关闭成功")
  })
  socket.addEventListener('message', function (event) {
    console.log("接收到消息", event.data)
  })
  socket.addEventListener('error', function (event) {
    console.log("发生错误", event.data)
  })
}

