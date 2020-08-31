

function GoTopChart (divElement) {
  this.DivElement = divElement
  this.DivElement.className = "main-div"

  this.RightElement = document.createElement('div')
  this.TopToolContainer = new TopToolContainer()
  this.LeftToolContainer = new LeftToolContainer()
  this.WindowFrame = new WindowFrame()

  this.TopToolElement = this.TopToolContainer.Create(0)
  this.LeftToolElement = this.LeftToolContainer.Create(0)
  this.ChartElement = this.WindowFrame.onCreateFrame()

  this.DivElement.appendChild(this.LeftToolElement)
  this.DivElement.appendChild(this.RightElement)
  this.RightElement.appendChild(this.TopToolElement)
  this.RightElement.appendChild(this.ChartElement)

  this.KLineDatasFix = new KLineDatasFix()
  this.Cursor = new CrossCursor()
  this.DrawToolObjOptDialog = new DrawToolObjOptDialog()
  this.PeriodDialog = new PeriodDialog()
  this.ChartElement.appendChild(this.DrawToolObjOptDialog.Create())
  this.ChartElement.appendChild(this.PeriodDialog.Create())

  this.TitleToolList = []
  this.DrawToolList = []
  var curSelectDrawToolIndex = null
  var curSelectPoint = null
  this.Options = {}
  this.Status = 0 // 0光标模式、1数据拖动、2画图工具
  this.Drag = false
  let drag = {
    click: {

    },
    lastMove: {

    }
  }

  let self = this

  /**
   * @description 注册左侧工具栏 画图工具点击事件
   */
  this.LeftToolContainer.RegisterClickEvent(function (id) {
    if (self.Status != 2) {
      self.Status = 2
    } else {
      self.Status = 0
      return
    }
    switch (id) {
      case "line-tool":
        var lineEle = new LineElement()
        self.DrawToolList.push(lineEle)
        break;
      case "rect-tool":
        var rectEle = new RectElement()
        self.DrawToolList.push(rectEle)
        break;
    }
  })

  /**
   * @description 注册 画图工具optdialog 点击事件
   */
  this.DrawToolObjOptDialog.RegisterClickEvent(function (type) {
    switch (type) {
      case 'delete':
        if (curSelectDrawToolIndex) {
          self.DrawToolList.splice(curSelectDrawToolIndex, 1)
          curSelectDrawToolIndex != null && (curSelectDrawToolIndex = null)
          curSelectPoint != null && (curSelectPoint = null)
          self.DrawToolObjOptDialog.SetHide()
        }
        break;
    }
  })

  this.OnSize = function () {
    // chart 整体大小
    WindowSizeOptions.height = parseInt(this.DivElement.style.height.replace("px", ""));
    WindowSizeOptions.width = parseInt(this.DivElement.style.width.replace("px", ""))

    this.RightElement.style.width = WindowSizeOptions.width - WindowSizeOptions.leftToolContainerWidth - g_ThemeResource.BorderWidth[0] + 'px'
    this.RightElement.style.height = WindowSizeOptions.height + 'px'
    this.TopToolElement.style.width = this.RightElement.style.width
    this.LeftToolElement.style.height = WindowSizeOptions.height + 'px'

    WindowSizeOptions.chartContainerWidth = WindowSizeOptions.width - WindowSizeOptions.leftToolContainerWidth - g_ThemeResource.BorderWidth[0]
    WindowSizeOptions.chartContainerHeight = WindowSizeOptions.height - WindowSizeOptions.topToolContainerHeight - g_ThemeResource.BorderWidth[0]

    this.WindowFrame.onSetSize(WindowSizeOptions.chartContainerWidth, WindowSizeOptions.chartContainerHeight)
    this.PeriodDialog.SetPeriodElement()
    KNum = Math.ceil((WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth) / (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]))
  }

  this.SetOption = function (option) {
    for (let i in this.Options) {
      if (document.getElementById(i + '-title-tool')) {
        this.ChartElement.removeChild(document.getElementById(i + '-title-tool'))
      }
    }
    if (this.WindowFrame.Options) this.WindowFrame.onClearCanvas() // 已经进行绘制，需要线清除画布内容
    this.Options = option
    this.WindowFrame.onSetOptions(option)

    this.WindowFrame.onSetFrameList(WindowSizeOptions.chartContainerWidth, WindowSizeOptions.chartContainerHeight)
    this.KLineDatasFix.GetData(option)
    this.KLineDatasFix.SplitDatas()
    this.Draw()
  }

  this.Draw = function () {
    for (let key in this.WindowFrame.FrameList) {
      switch (key) {
        case 'xAxis':
          var xAxis = new XAxis()
          xAxis.Create(this.WindowFrame.Canvas, this.WindowFrame.OptCanvas, this.WindowFrame.FrameList[key], KLineDatas)
          break;
        case 'kLine':
          var yAxis = new YAxis()
          yAxis.Create(this.WindowFrame.Canvas, this.WindowFrame.OptCanvas, KLineDatas, this.WindowFrame.FrameList[key]['yAxis'], 'kLine', 16)
          this.WindowFrame.FrameList[key]['yAxis']['Min'] = yAxis.Min
          this.WindowFrame.FrameList[key]['yAxis']['Max'] = yAxis.Max
          this.WindowFrame.FrameList[key]['yAxis']['unitPricePx'] = yAxis.UnitPricePx
          var kLine = new KLine()
          kLine.Create(this.WindowFrame.Canvas, this.WindowFrame.OptCanvas, this.WindowFrame.FrameList, KLineDatas)
          var titleTool = new TitleToolContainer()
          var titleToolElement = titleTool.Create(this.WindowFrame.FrameList[key], key)
          this.ChartElement.appendChild(titleToolElement)
          titleTool.CreateValueBox()
          var curValue = {
            'open': KLineDatas[KLineDatas.length - 1]['open'],
            'high': KLineDatas[KLineDatas.length - 1]['high'],
            'low': KLineDatas[KLineDatas.length - 1]['low'],
            'close': KLineDatas[KLineDatas.length - 1]['close'],
          }
          curValue['rate'] = KLineDatas[KLineDatas.length - 1]['close'] - KLineDatas[KLineDatas.length - 1]['open']
          curValue['rate'] < 0 ? curValue['rate'] = curValue['rate'].toFixed(2) + '(-' + (Math.abs(curValue['rate']) / curValue['open'] * 100).toFixed(2) + '%)' : curValue['rate'] = curValue['rate'].toFixed(2) + '(+' + (Math.abs(curValue['rate']) / curValue['open'] * 100).toFixed(2) + '%)'
          titleTool.SetValue(curValue)
          this.TitleToolList.push(titleTool)
          break;
        case 'macd':
          var yAxis = new YAxis()
          yAxis.Create(this.WindowFrame.Canvas, this.WindowFrame.OptCanvas, this.KLineDatasFix.IndicatorDatasFix.Indicators[key].datas, this.WindowFrame.FrameList[key]['yAxis'], key, 8)
          this.WindowFrame.FrameList[key]['yAxis']['Min'] = yAxis.Min
          this.WindowFrame.FrameList[key]['yAxis']['Max'] = yAxis.Max
          this.WindowFrame.FrameList[key]['yAxis']['unitPricePx'] = yAxis.UnitPricePx
          var macd = new MACD()
          macd.Create(this.WindowFrame.Canvas, this.WindowFrame.FrameList[key], this.KLineDatasFix.IndicatorDatasFix.Indicators[key].datas)
          macd.Draw()
          var titleTool = new TitleToolContainer()
          var titleToolElement = titleTool.Create(this.WindowFrame.FrameList[key], key)
          this.ChartElement.appendChild(titleToolElement)
          titleTool.CreateValueBox()
          var curValue = {
            'MACD': this.KLineDatasFix.IndicatorDatasFix.Indicators[key].datas[this.KLineDatasFix.IndicatorDatasFix.Indicators[key].datas.length - 1]['MACD'],
            'DEA': this.KLineDatasFix.IndicatorDatasFix.Indicators[key].datas[this.KLineDatasFix.IndicatorDatasFix.Indicators[key].datas.length - 1]['DEA'],
            'DIFF': this.KLineDatasFix.IndicatorDatasFix.Indicators[key].datas[this.KLineDatasFix.IndicatorDatasFix.Indicators[key].datas.length - 1]['DIFF'],
          }
          titleTool.SetValue(curValue)
          this.TitleToolList.push(titleTool)
          break;
      }
    }
    this.Cursor.Create(this.WindowFrame.Canvas, this.WindowFrame.OptCanvas, this.WindowFrame.FrameList)
    for (let i in this.DrawToolList) {
      this.DrawToolList[i].Canvas && this.DrawToolList[i].Draw(null)
    }
  }

  this.ChartElement.onmousemove = function (e) {
    if (isLoadData) return
    if (!self.DrawToolObjOptDialog.isHide) return
    if ((e.offsetY) * pixelTatio < WindowSizeOptions.chartContainerHeight - WindowSizeOptions.xAxisContainerHeight && (e.offsetX) * pixelTatio < WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth) {
      self.WindowFrame.OptCanvas.clearRect(0, 0, WindowSizeOptions.chartContainerWidth, WindowSizeOptions.chartContainerHeight)
      // 光标移动
      if (self.Status == 0 && self.Drag == false) {
        // 处理画图工具IsSelect；select 和 hover
        // 0 也是 false
        if (curSelectDrawToolIndex != null) {
          self.DrawToolList[curSelectDrawToolIndex].IsSelect = true
        }

        var isPointInPath = -1
        for (let d in self.DrawToolList) {
          self.DrawToolList[d].IsSelect = false
          isPointInPath = self.DrawToolList[d].IsPointInPath(e.offsetX, e.offsetY)
          if (isPointInPath == -1) {
            continue
          }
          self.DrawToolList[d].IsSelect = true
          break
        }

        // 绘制光标 和 titleTool
        var kn = self.Cursor.Move((e.offsetX) * pixelTatio, (e.offsetY) * pixelTatio)
        var isUp = KLineDatas[kn]['close'] - KLineDatas[kn]['open'] > 0
        for (let i in self.TitleToolList) {
          if (self.TitleToolList[i].Option.name == 'kLine') {
            var curValue = {
              'open': KLineDatas[kn]['open'],
              'high': KLineDatas[kn]['high'],
              'low': KLineDatas[kn]['low'],
              'close': KLineDatas[kn]['close'],
            }
            curValue['rate'] = KLineDatas[kn]['close'] - KLineDatas[kn]['open']
            curValue['rate'] < 0 ? curValue['rate'] = curValue['rate'].toFixed(2) + '(-' + (Math.abs(curValue['rate']) / curValue['open'] * 100).toFixed(2) + '%)' : curValue['rate'] = curValue['rate'].toFixed(2) + '(+' + (Math.abs(curValue['rate']) / curValue['open'] * 100).toFixed(2) + '%)'
            self.TitleToolList[i].SetValue(curValue, isUp)
          } else if (self.TitleToolList[i].Option.name == 'MACD') {
            var curValue = {
              'MACD': self.KLineDatasFix.IndicatorDatasFix.Indicators['macd'].datas[kn]['MACD'],
              'DEA': self.KLineDatasFix.IndicatorDatasFix.Indicators['macd'].datas[kn]['DEA'],
              'DIFF': self.KLineDatasFix.IndicatorDatasFix.Indicators['macd'].datas[kn]['DIFF'],
            }
            self.TitleToolList[i].SetValue(curValue, isUp)
          }
        }
      }
      // 数据拖动
      if (self.Status == 0 && self.Drag == true && curSelectDrawToolIndex == null) {
        let moveStep = Math.abs(drag.lastMove.X - e.offsetX)
        let isLeft = true
        if (drag.lastMove.X < e.offsetX) isLeft = false
        if (self.KLineDatasFix.MoveDatas(moveStep, isLeft)) {
          self.SetOption(self.Options)
        }
        drag.lastMove.X = e.offsetX
        drag.lastMove.Y = e.offsetY
      }

      // 画图工具 整体 拖动
      if (curSelectDrawToolIndex != null && curSelectPoint == null && self.Drag == true) {
        if (self.DrawToolList[curSelectDrawToolIndex].Name == 'line' || self.DrawToolList[curSelectDrawToolIndex].Name == 'rect') {
          let moveY = e.offsetY - drag.lastMove.Y
          let lastIndex = Math.ceil(drag.lastMove.X / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0]))
          let offsetIndex = Math.ceil(e.offsetX / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0]))
          for (let i in self.DrawToolList[curSelectDrawToolIndex].Position) {
            self.DrawToolList[curSelectDrawToolIndex].UpdatePoint(i, offsetIndex - lastIndex, moveY)
          }
        }
        drag.lastMove.X = e.offsetX
        drag.lastMove.Y = e.offsetY
      }

      // 画图工具 某个点进行改动
      if (curSelectDrawToolIndex != null && curSelectPoint != null && self.Drag == true) {
        if (self.DrawToolList[curSelectDrawToolIndex].Name == 'line' || self.DrawToolList[curSelectDrawToolIndex].Name == 'rect') {
          let moveY = e.offsetY - drag.lastMove.Y
          let lastIndex = Math.ceil(drag.lastMove.X / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0]))
          let offsetIndex = Math.ceil(e.offsetX / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0]))
          self.DrawToolList[curSelectDrawToolIndex].UpdatePoint(curSelectPoint, offsetIndex - lastIndex, moveY)
        }
        drag.lastMove.X = e.offsetX
        drag.lastMove.Y = e.offsetY
      }
      for (let i in self.DrawToolList) {
        self.DrawToolList[i].Canvas && self.DrawToolList[i].Draw(e.offsetX, e.offsetY)
      }
    }
  }

  this.ChartElement.onmousewheel = function (e) {
    if (self.KLineDatasFix.ScaleKLine(e.wheelDelta)) {
      self.SetOption(self.Options)
    }
  }

  this.ChartElement.onmousedown = function (e) {
    if (self.DrawToolObjOptDialog.isHide == false && e.clientX >= self.DrawToolObjOptDialog.GetPosition().x + WindowSizeOptions.leftToolContainerWidth + WindowSizeOptions.chartLeft && e.offsetX <= self.DrawToolObjOptDialog.GetPosition().x + WindowSizeOptions.leftToolContainerWidth + WindowSizeOptions.chartLeft + WindowSizeOptions.drawToolOptDialogWidth
      && e.clientY >= self.DrawToolObjOptDialog.GetPosition().y + WindowSizeOptions.topToolContainerHeight + WindowSizeOptions.chartTop && e.offsetY <= self.DrawToolObjOptDialog.GetPosition().y + WindowSizeOptions.topToolContainerHeight + WindowSizeOptions.chartTop + self.DrawToolObjOptDialog.GetHeight()) {
      // 点击在 drawToolObjOpt 区域 内
      return
    } else if (!self.DrawToolObjOptDialog.isHide) {
      self.DrawToolObjOptDialog.SetHide()
    }

    drag.click.X = e.offsetX
    drag.click.Y = e.offsetY
    drag.lastMove.X = e.offsetX
    drag.lastMove.Y = e.offsetY
    self.Drag = true

    for (let d in self.DrawToolList) {
      self.DrawToolList[d].IsSelect = false
    }

    if (self.Status == 2) {
      if (!self.DrawToolList[self.DrawToolList.length - 1].Option) {
        for (let j in self.WindowFrame.FrameList) {
          if (j != 'xAxis' && self.WindowFrame.FrameList[j]['position'] && drag.click.Y > self.WindowFrame.FrameList[j].position.top && drag.click.Y < self.WindowFrame.FrameList[j].position.top + self.WindowFrame.FrameList[j].height) {
            option = self.WindowFrame.FrameList[j]
          }
        }
        if (!option) {
          return
        }
        self.DrawToolList[self.DrawToolList.length - 1].Create(self.WindowFrame.OptCanvas, option)
      }
      if (self.DrawToolList[self.DrawToolList.length - 1].Position.length < self.DrawToolList[self.DrawToolList.length - 1].PointCount) {
        self.DrawToolList[self.DrawToolList.length - 1].SetPoint(e.offsetX, e.offsetY)
        !self.DrawToolList[self.DrawToolList.length - 1].IsSelect && (self.DrawToolList[self.DrawToolList.length - 1].IsSelect = true, curSelectDrawToolIndex = self.DrawToolList.length - 1)
      }
    } else {
      var isPointInPath = -1
      for (let d in self.DrawToolList) {
        isPointInPath = self.DrawToolList[d].IsPointInPath(e.offsetX, e.offsetY)
        if (isPointInPath == -1) {
          curSelectDrawToolIndex = null
          curSelectPoint = null
          continue
        }
        if (isPointInPath != 100) {
          self.DrawToolList[d].IsSelect = true
          curSelectDrawToolIndex = d
          curSelectPoint = isPointInPath
          break
        }
        if (isPointInPath == 100) {
          self.DrawToolList[d].IsSelect = true
          curSelectDrawToolIndex = d
          curSelectPoint = null
          break
        }
      }
      // var isPointInPath = self.IsPointInLinePath(e.offsetX, e.offsetY)
      // if (isPointInPath != -1) {
      //   self.DrawToolList[isPointInPath].IsSelect = true
      //   curSelectDrawToolIndex = isPointInPath
      //   var isPointInPointPath = self.IsPointInPointPath(e.offsetX, e.offsetY)
      //   if (isPointInPointPath != -1) {
      //     curSelectPoint = isPointInPointPath
      //   } else {
      //     curSelectPoint = null
      //   }
      // } else {
      //   curSelectDrawToolIndex = null
      //   isPointInPointPath = null
      // }
    }
  }

  this.ChartElement.onmouseup = function (e) {
    if (!e) e = window.event;
    if (e.button == 2) {
      // 右键 弹出 画图对象 的opt弹窗
      if (curSelectDrawToolIndex) {
        self.DrawToolObjOptDialog.SetPosition(e.offsetX, e.offsetY)
        self.DrawToolObjOptDialog.SetShow()
      }
    }

    self.Drag = false
    if (self.Status == 2) {
      // 松开鼠标即画图结束
      if (self.DrawToolList[self.DrawToolList.length - 1].Position.length < self.DrawToolList[self.DrawToolList.length - 1].PointCount) {
        return
      } else if (self.DrawToolList[self.DrawToolList.length - 1].Position.length == self.DrawToolList[self.DrawToolList.length - 1].PointCount) {
        self.DrawToolList[self.DrawToolList.length - 1].IsFinished = true
        self.Status = 0
      }
    }
  }
  this.ChartElement.oncontextmenu = function (e) {
    e.preventDefault()
  }
}

// chart 实例化
GoTopChart.Init = function (divElement) {
  var chart = new GoTopChart(divElement)
  return chart
}

function WindowFrame () {
  this.Options
  this.FrameList = {

  } // 存放所有窗口框架的map
  this.Canvas
  this.OptCanvas
  this.CanvasElement
  this.OptCanvasElement
  this.ChartElement
  this.LoadElement // 数据加载的元素

  this.Width
  this.Height


  this.onCreateFrame = function () {
    this.ChartElement = document.createElement('div')
    this.ChartElement.className = "window-frame"
    this.ChartElement.style.backgroundColor = g_ThemeResource.BgColor
    this.CanvasElement = document.createElement('canvas')
    this.CanvasElement.className = "jschart-drawing"
    this.OptCanvasElement = document.createElement('canvas')
    this.OptCanvasElement.className = "jschart-opt-drawing"
    this.Canvas = this.CanvasElement.getContext('2d')
    this.OptCanvas = this.OptCanvasElement.getContext('2d')
    this.LoadElement = document.createElement('div')
    this.LoadElement.className = "load-ele"
    this.LoadElement.id = "load-ele"
    this.LoadElement.style.display = "none"
    var span = document.createElement('span')
    span.className = "iconfont icon-jiazai load-icon animationSlow"
    span.style.fontSize = "50px"


    this.LoadElement.appendChild(span)
    this.ChartElement.appendChild(this.LoadElement)
    this.ChartElement.appendChild(this.CanvasElement)
    this.ChartElement.appendChild(this.OptCanvasElement)

    return this.ChartElement
  }

  this.onSetOptions = function (options) {
    this.Options = options
    this.FrameList = this.Options
  }

  this.onSetFrameList = function (width, height) {
    const cw = (width - WindowSizeOptions.yAxisContainerWidth) * pixelTatio
    const ch = (height - WindowSizeOptions.xAxisContainerHeight) * pixelTatio
    // xAxis
    this.FrameList['xAxis']['width'] = cw
    this.FrameList['xAxis']['height'] = WindowSizeOptions.xAxisContainerHeight
    this.FrameList['xAxis']['position']['left'] = 0
    this.FrameList['xAxis']['position']['top'] = ch

    let icNum = 0
    for (let i in this.FrameList) {
      if (i != 'kLine' && i != 'xAxis') {
        icNum++
      }
    }
    const sch = ch / (icNum + WindowSizeOptions.chartScale)
    // kLine
    this.FrameList['kLine']['width'] = cw
    this.FrameList['kLine']['height'] = WindowSizeOptions.chartScale * sch
    this.FrameList['kLine']['position']['left'] = 0
    this.FrameList['kLine']['position']['top'] = 0

    this.FrameList['kLine']['yAxis']['width'] = WindowSizeOptions.yAxisContainerWidth
    this.FrameList['kLine']['yAxis']['height'] = WindowSizeOptions.chartScale * sch
    this.FrameList['kLine']['yAxis']['position']['left'] = cw
    this.FrameList['kLine']['yAxis']['position']['top'] = 0

    // indicators
    let ict = this.FrameList['kLine']['height']
    for (let i in this.FrameList) {
      if (i == 'kLine' || i == 'xAxis') {
        continue
      }
      this.FrameList[i].width = cw
      this.FrameList[i].height = sch
      this.FrameList[i].position.top = ict
      this.FrameList[i]['position']['left'] = 0

      this.FrameList[i]['yAxis']['width'] = WindowSizeOptions.yAxisContainerWidth
      this.FrameList[i]['yAxis']['height'] = sch
      this.FrameList[i]['yAxis']['position']['left'] = cw
      this.FrameList[i]['yAxis']['position']['top'] = ict
      ict += sch
    }
  }

  this.onSetSize = function (width, height) {
    this.Width = width
    this.Height = height
    this.ChartElement.style.height = height + 'px'
    this.ChartElement.style.width = width + 'px'
    this.LoadElement.style.height = height + 'px'
    this.LoadElement.style.width = width + 'px'
    if (this.CanvasElement && this.OptCanvasElement) {
      this.CanvasElement.style.width = width + 'px'
      this.CanvasElement.style.height = height + 'px'
      this.CanvasElement.width = width * pixelTatio
      this.CanvasElement.height = height * pixelTatio

      this.OptCanvasElement.style.width = width + 'px'
      this.OptCanvasElement.style.height = height + 'px'
      this.OptCanvasElement.width = width * pixelTatio
      this.OptCanvasElement.height = height * pixelTatio
    } else {
      throw "CanvasElement or OptCanvasElement is undefined"
    }
  }

  this.onClearCanvas = function () {
    if (this.Canvas && this.OptCanvas) {
      this.Canvas.clearRect(0, 0, WindowSizeOptions.chartContainerWidth, WindowSizeOptions.chartContainerHeight)
      this.OptCanvas.clearRect(0, 0, WindowSizeOptions.chartContainerWidth, WindowSizeOptions.chartContainerHeight)
    } else {
      throw "Canvas or OptCanvas is undefined"
    }
  }

}

function KLine () {
  this.UnitPricePx
  this.Canvas
  this.OptCanvas
  this.UpColor = g_ThemeResource.UpColor
  this.DownColor = g_ThemeResource.DownColor
  this.FrameList
  this.Option
  this.ValueHeight
  this.Create = function (canvas, optCanvas, options, datas) {
    this.Datas = datas
    this.Canvas = canvas
    this.OptCanvas = optCanvas
    this.FrameList = options
    this.Option = this.FrameList['kLine']
    this.UnitPricePx = this.Option['yAxis']['unitPricePx']
    this.ValueHeight = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom
    this.Draw()
    this.DrawCloseLine()
    this.DrawMaxHighAndMinLow()
  }
  this.Update = function (datas, options) {
    this.Datas = datas
    this.FrameList = options
    this.Option = this.FrameList['kLine']
    this.UnitPricePx = this.Optiont['yAxis']['unitPricePx']
    this.ValueHeight = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom
    this.Draw()
    this.DrawCloseLine()
    this.DrawMaxHighAndMinLow()
  }
  this.Draw = function () {
    this.Datas.forEach((item, index, list) => {
      this.DrawKLines(index, parseFloat(item.open), parseFloat(item.close), parseFloat(item.high), parseFloat(item.low))
    })
  }
  this.DrawKLines = function (i, open, close, high, low) {
    var startX, startY, endX, endY, lowpx, highpx
    this.Canvas.beginPath()
    // datawith<=4 只绘制竖线
    if (open < close) {
      this.Canvas.fillStyle = this.UpColor
      this.Canvas.strokeStyle = this.UpColor
      if (ZOOM_SEED[CurScaleIndex][0] > 2) {
        startY = this.Option.position.top + this.ValueHeight - (close - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
        endY = this.ValueHeight - (open - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
      }
    } else if (open > close) {
      this.Canvas.fillStyle = this.DownColor
      this.Canvas.strokeStyle = this.DownColor
      if (ZOOM_SEED[CurScaleIndex][0] > 2) {
        startY = this.Option.position.top + this.ValueHeight - (open - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
        endY = this.ValueHeight - (close - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
      }
    } else {
      this.Canvas.fillStyle = g_ThemeResource.FontColor
      this.Canvas.strokeStyle = g_ThemeResource.FontColor
      endY = this.Option.position.top + this.ValueHeight - (open - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
      startY = endY
    }
    startX = this.Option.position.left + WindowSizeOptions.padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * i
    endX = startX + ZOOM_SEED[CurScaleIndex][0]
    let h = endY - startY
    h < 1 && (h = 1)
    highpx = this.Option.position.top + this.ValueHeight - (high - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
    lowpx = this.Option.position.top + this.ValueHeight - (low - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
    this.Canvas.lineWidth = 1
    if (ZOOM_SEED[CurScaleIndex][0] > 2) {
      this.Canvas.fillRect(ToFixedRect(startX), ToFixedRect(startY), ToFixedRect(endX - startX), ToFixedRect(h))
    }
    this.Canvas.setLineDash([0, 0])
    this.Canvas.moveTo(ToFixedPoint(startX + ZOOM_SEED[CurScaleIndex][0] / 2), ToFixedPoint(highpx))
    this.Canvas.lineTo(ToFixedPoint(startX + ZOOM_SEED[CurScaleIndex][0] / 2), ToFixedPoint(lowpx))
    this.Canvas.stroke()
    this.Canvas.closePath()
  }
  /**
   * @description 绘制收盘价线
   */
  this.DrawCloseLine = function () {
    const closePrice = parseFloat(this.Datas[this.Datas.length - 1].close)
    const openPrice = parseFloat(this.Datas[this.Datas.length - 1].open)
    const y = this.ValueHeight - (closePrice - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
    this.Canvas.beginPath()
    if (closePrice < openPrice) {
      this.Canvas.strokeStyle = this.DownColor
    } else {
      this.Canvas.strokeStyle = this.UpColor
    }
    //绘制收盘线
    this.Canvas.lineWidth = 1.5
    this.Canvas.setLineDash([1.5, 1.5])
    this.Canvas.moveTo(0, y)
    this.Canvas.lineTo(this.Option.width, y)
    this.Canvas.stroke()
    this.Canvas.closePath()

    // 绘制Y轴上的标识
    this.Canvas.beginPath()
    this.Canvas.fillStyle = this.Canvas.strokeStyle
    this.Canvas.fillRect(ToFixedRect(this.Option.width), ToFixedRect(y - 10), ToFixedRect(WindowSizeOptions.yAxisContainerWidth), ToFixedRect(20))
    this.Canvas.font = '12px san-serif'
    this.Canvas.fillStyle = g_ThemeResource.FontLightColor
    this.Canvas.fillText(closePrice, this.Option.width + 10, y + 5)
    this.Canvas.lineWidth = 1
    this.Canvas.setLineDash([0, 0])
    this.Canvas.strokeStyle = g_ThemeResource.FontLightColor
    this.Canvas.moveTo(ToFixedPoint(this.Option.width), ToFixedPoint(y))
    this.Canvas.lineTo(ToFixedPoint(this.Option.width) + 5, ToFixedPoint(y))
    this.Canvas.stroke()
    this.Canvas.closePath()
  }
  /**
   * @description 绘制一屏中K线的最高点和最低点
   */
  this.DrawMaxHighAndMinLow = function () {
    let max = 0
    let maxIndex = 0
    let min = 0
    let minIndex = 0
    this.Datas.forEach((item, index) => {
      if (max < item.high) {
        max = item.high
        maxIndex = index
      }
      if (min == 0 || min > item.low) {
        min = item.low
        minIndex = index
      }
    })
    const maxX = WindowSizeOptions.padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * maxIndex
    const maxY = this.ValueHeight - (max - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
    const maxTW = this.OptCanvas.measureText(max).width

    const minX = WindowSizeOptions.padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * minIndex
    const minY = this.ValueHeight - (min - this.Option['yAxis'].Min) * this.UnitPricePx + WindowSizeOptions.padding.top
    const minTW = this.OptCanvas.measureText(min).width

    this.Canvas.fillStyle = g_ThemeResource.FontLightColor
    this.Canvas.font = '12px san-serif'
    if (maxIndex < (this.Datas.length - 1) / 2) {
      this.Canvas.fillText(max, maxX, maxY)
    } else {
      this.Canvas.fillText(max, maxX - maxTW, maxY)
    }
    if (minIndex < (this.Datas.length - 1) / 2) {
      this.Canvas.fillText(min, minX, minY + 10)
    } else {
      this.Canvas.fillText(min, minX - minTW, minY + 10)
    }
  }
}

function YAxis () {
  this.ChartName
  this.Datas
  this.Min
  this.Max
  this.LabelList = []
  this.PxList
  this.UnitValue = 0
  this.UnitSpacing = 0
  this.UnitPricePx = 0
  this.Symmetrical = false //是否要求正负刻度对称。默认为false，需要时请设置为true
  this.Deviation = false // 是否允许误差，即实际分出的段数不等于splitNumber
  this.SplitNumber = 16

  this.Canvas
  this.OptCanvas
  this.FrameList
  this.Option
  this.ValueHeight
  this.Create = function (canvas, optCanvas, datas, option, chartName, splitNumber) {
    this.ChartName = chartName
    this.Datas = datas
    this.Canvas = canvas
    this.OptCanvas = optCanvas
    this.Option = option
    this.ValueHeight = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom
    this.SplitNumber = splitNumber
    if (chartName == 'macd') {
      this.CalculationMinMaxValue('MACD', 'DEA', 'DIFF')
    } else {
      this.CalculationMinMaxValue()
    }
    this.CalculationUnitValue()
    this.CalculationUnitSpacing()
    this.CalculationLabelList()
    this.Draw()
  }
  /**
 * @description 数据更新，重新绘制
 */
  this.Update = function () {

  }
  /**
   * @description 计算最大值和最小值
   */
  this.CalculationMinMaxValue = function (...args) {
    if (this.Datas instanceof Array) {
      if (this.ChartName == 'kLine') {
        this.Min = Math.min.apply(Math, this.Datas.map(function (o) { return parseFloat(o.low) }))
        this.Max = Math.max.apply(Math, this.Datas.map(function (o) { return parseFloat(o.high) }))
      } else if (this.ChartName == 'macd') {
        var minArray = []
        var maxArray = []
        for (let i in args) {
          minArray.push(Math.min.apply(Math, this.Datas.map(function (o) { return parseFloat(o[args[i]]) })))
          maxArray.push(Math.max.apply(Math, this.Datas.map(function (o) { return parseFloat(o[args[i]]) })))
        }
        this.Min = Math.min.apply(Math, minArray)
        this.Max = Math.max.apply(Math, maxArray)
      }
    } else {
      let minArray = []
      let maxArray = []
      for (let i in this.Datas) {
        let minValue, maxValue
        minValue = Math.min.apply(Math, this.Datas[i])
        maxValue = Math.max.apply(Math, this.Datas[i])
        minArray.push(minValue)
        maxArray.push(maxValue)
      }
      this.Min = Math.min.apply(Math, minArray)
      this.Max = Math.max.apply(Math, maxArray)
    }
  }
  /**
 * @description 计算单位刻度值
 */
  this.CalculationUnitValue = function () {
    function fixedNum (num) {
      if (("" + num).indexOf('.') >= 0) num = parseFloat(num.toFixed(8));
      return num;
    }
    //1.初始化
    var symmetrical = false;//是否要求正负刻度对称。默认为false，需要时请设置为true
    var deviation = false;//是否允许误差，即实际分出的段数不等于splitNumber
    var magic = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];//魔数数组经过扩充，放宽魔数限制避免出现取不到魔数的情况。
    var max, min, splitNumber;
    splitNumber = this.SplitNumber;//理想的刻度间隔段数，即希望刻度区间有多少段
    max = this.Max;//调用js已有函数计算出最大值
    min = this.Min;//计算出最小值
    //2.计算出初始间隔tempGap和缩放比例multiple
    var tempGap = (max - min) / splitNumber;//初始刻度间隔的大小。
    //设tempGap除以multiple后刚刚处于魔数区间内，先求multiple的幂10指数，例如当tempGap为120，想要把tempGap映射到魔数数组（即处理为10到100之间的数），则倍数为10，即10的1次方。
    var multiple = Math.floor(Math.log10(tempGap) - 1);//这里使用Math.floor的原因是，当Math.log10(tempGap)-1无论是正负数都需要向下取整。不能使用parseInt或其他取整逻辑代替。
    multiple = Math.pow(10, multiple);//刚才是求出指数，这里求出multiple的实际值。分开两行代码避免有人看不懂
    //3.取出邻近较大的魔数执行第一次计算
    var tempStep = tempGap / multiple;//映射后的间隔大小
    var estep;//期望得到的间隔
    var lastIndex = -1;//记录上一次取到的魔数下标，避免出现死循环
    for (var i = 0; i < magic.length; i++) {
      if (magic[i] > tempStep) {
        estep = magic[i] * multiple;//取出第一个大于tempStep的魔数，并乘以multiple作为期望得到的最佳间隔
        break;
      }
    }
    //4.求出期望的最大刻度和最小刻度，为estep的整数倍
    var maxi, mini;
    function countDegree (estep) {
      //这里的parseInt是我无意中写出来的，本来我是想对maxi使用Math.floor，对mini使用Math.ceil的。这样能向下取到邻近的一格，不过后面发现用parseInt好像画出来图的比较好看
      maxi = parseInt(max / estep + 1) * estep;//最终效果是当max/estep属于(-1,Infinity)区间时，向上取1格，否则取2格。
      mini = parseInt(min / estep - 1) * estep;//当min/estep属于(-Infinity,1)区间时，向下取1格，否则取2格。
      //如果max和min刚好在刻度线的话，则按照上面的逻辑会向上或向下多取一格
      if (max === 0) maxi = 0;//这里进行了一次矫正，优先取到0刻度
      if (min === 0) mini = 0;
      if (symmetrical && maxi * mini < 0) {//如果需要正负刻度对称且存在异号数据
        var tm = Math.max(Math.abs(maxi), Math.abs(mini));//取绝对值较大的一方
        maxi = tm;
        mini = -tm;
      }
    }
    countDegree(estep);
    if (deviation) {//如果允许误差，即实际分段数可以不等于splitNumber，则直接结束
      var interval = fixedNum(estep);
      return;
    }
    //5.当正负刻度不对称且0刻度不在刻度线上时，重新取魔数进行计算//确保其中一条分割线刚好在0刻度上。
    else if (!symmetrical || maxi * mini > 0) {
      outter: do {
        //计算模拟的实际分段数
        var tempSplitNumber = Math.round((maxi - mini) / estep);
        //当趋势单调性发生变化时可能出现死循环，需要进行校正
        if ((i - lastIndex) * (tempSplitNumber - splitNumber) < 0) {//此处检查单调性变化且未取到理想分段数
          //此处的校正基于合理的均匀的魔数数组，即tempSplitNumber和splitNumber的差值较小如1和2，始终取大刻度
          while (tempSplitNumber < splitNumber) {//让maxi或mini增大或减少一个estep直到取到理想分段数
            if ((mini - min) <= (maxi - max) && mini != 0 || maxi == 0) {//在尽量保留0刻度的前提下，让更接近最值的一边扩展一个刻度
              mini -= estep;
            } else {
              maxi += estep;
            }
            tempSplitNumber++;
            if (tempSplitNumber == splitNumber)
              break outter;
          }
        }
        //当魔数下标越界或取到理想分段数时退出循环
        if (i >= magic.length - 1 || i <= 0 || tempSplitNumber == splitNumber) break;
        //记录上一次的魔数下标
        lastIndex = i;
        //尝试取符合趋势的邻近魔数
        if (tempSplitNumber > splitNumber) estep = magic[++i] * multiple;
        else estep = magic[--i] * multiple;
        //重新计算刻度
        countDegree(estep);
      } while (tempSplitNumber != splitNumber);
    }
    //6.无论计算始终把maxi-mini分成splitNumber段，得到间隔interval。不过前面的算法已经尽量的保证刻度最优了，即interval接近或等于理想刻度estep。
    this.Max = fixedNum(maxi);
    this.Min = fixedNum(mini);
    this.UnitValue = fixedNum((maxi - mini) / splitNumber);
  }
  /**
   * @description 计算单位间距
   */
  this.CalculationUnitSpacing = function () {
    this.UnitPricePx = this.ValueHeight / (this.Max - this.Min)
    this.UnitSpacing = this.UnitValue * this.UnitPricePx
  }
  /**
   * @description 计算Label数组
   */
  this.CalculationLabelList = function () {
    let label = this.Min
    while (label <= this.Max) {
      let item = {
        label: label,
        y: (this.Max - label) * this.UnitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
      }
      this.LabelList.push(item)
      label = label.add(this.UnitValue)
    }
  }
  /**
   * @description 开始绘制
   */
  this.Draw = function () {
    this.Canvas.beginPath()
    this.Canvas.fillStyle = g_ThemeResource.FontColor
    this.Canvas.font = '12px sans-serif'
    this.LabelList.forEach((item, index, list) => {
      this.Canvas.fillText(item.label, this.Option.position.left + 10, item.y + 5)
    })
    this.Canvas.stroke()
    this.Canvas.closePath()

    this.Canvas.strokeStyle = g_ThemeResource.BorderColor
    this.Canvas.beginPath()
    this.Canvas.lineWidth = 1
    this.Canvas.setLineDash([0, 0])
    this.Canvas.moveTo(this.Option.position.left, this.Option.position.top)
    this.Canvas.lineTo(this.Option.position.left, this.Option.position.top + this.Option.height)
    this.LabelList.forEach((item, index, list) => {
      this.Canvas.moveTo(this.Option.position.left, ToFixedPoint(item.y))
      this.Canvas.lineTo(this.Option.position.left + 5, ToFixedPoint(item.y))
    })
    this.Canvas.stroke()
    this.Canvas.closePath()

    // 网格线绘制
    this.Canvas.beginPath()
    this.Canvas.strokeStyle = g_ThemeResource.BorderColor
    this.Canvas.lineWidth = 0.5
    this.LabelList.forEach((item, index, list) => {
      this.Canvas.moveTo(0, ToFixedPoint(item.y))
      this.Canvas.lineTo(WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth, ToFixedPoint(item.y))
    })
    this.Canvas.stroke()
    this.Canvas.closePath()

    this.Canvas.beginPath()
    this.Canvas.strokeStyle = g_ThemeResource.BorderColor
    this.Canvas.lineWidth = 2
    this.Canvas.moveTo(0, this.Option.position.top + this.Option.height)
    this.Canvas.lineTo(WindowSizeOptions.chartContainerWidth, this.Option.position.top + this.Option.height)
    this.Canvas.stroke()
    this.Canvas.closePath()
  }
}

function XAxis () {
  this.Datas
  this.Height
  this.Width
  this.Min
  this.Max
  this.LabelList
  this.PxList
  this.UnitValue = 0
  this.UnitSpacing = 0
  this.XAxisCanvas
  this.OptXAxisCanvas
  this.XAxisElement
  this.OptXAxisElement
  this.XAxisDiv
  this.Option

  this.Create = function (canvas, optCanvas, option, datas) {
    this.XAxisCanvas = canvas
    this.OptXAxisCanvas = optCanvas
    this.Option = option
    this.Datas = datas

    this.Width = WindowSizeOptions.chartContainerWidth
    this.Height = WindowSizeOptions.xAxisContainerHeight
    this.Draw()
  }
  /**
   * @description 计算单位值
   */
  this.CalculationUnitValue = function () {

  }
  /**
   * @description 计算单位间距
   */
  this.CalculationUnitSpacing = function () {

  }
  /**
   * @description 计算Label数组
   */
  this.CalculationLabelList = function () {

  }
  /**
   * @description 计算Px数组
   */
  this.CalculationPxList = function () {

  }
  /**
   * @description 开始绘制
   */
  this.Draw = function () {
    this.XAxisCanvas.beginPath()
    this.XAxisCanvas.strokeStyle = g_ThemeResource.FontColor
    this.XAxisCanvas.lineWidth = 1
    this.XAxisCanvas.setLineDash([0, 0])
    this.XAxisCanvas.moveTo(0, this.Option.position.top)
    this.XAxisCanvas.lineTo(this.Option.width, this.Option.position.top)
    this.XAxisCanvas.stroke()
    this.XAxisCanvas.closePath()
  }
  /**
   * @description 数据更新，重新绘制
   */
  this.Update = function () {

  }

}

// 十字光标
function CrossCursor () {
  this.X
  this.Y
  this.Canvas
  this.OptCanvas
  this.FrameList
  let self = this
  this.Create = function (canvas, optCanvas, options) {
    this.Canvas = canvas
    this.OptCanvas = optCanvas
    this.FrameList = options
  }
  this.Move = function (x, y) {
    let kn = Math.ceil(x / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0]))
    let cursorX = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * kn - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1]
    this.OptCanvas.beginPath()
    this.OptCanvas.strokeStyle = g_ThemeResource.FontColor
    this.OptCanvas.lineWidth = 1
    this.OptCanvas.setLineDash([5, 5])
    this.OptCanvas.moveTo(ToFixedPoint(cursorX), ToFixedPoint(0))
    this.OptCanvas.lineTo(ToFixedPoint(cursorX), ToFixedPoint(WindowSizeOptions.chartContainerHeight - WindowSizeOptions.xAxisContainerHeight))
    this.OptCanvas.moveTo(ToFixedPoint(0), ToFixedPoint(y))
    this.OptCanvas.lineTo(ToFixedPoint(WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth), ToFixedPoint(y))
    this.OptCanvas.stroke()
    this.OptCanvas.closePath()
    this.DrawLabel(kn, cursorX, y)
    return kn
  }
  this.DrawLabel = function (index, x, y) {

    let itemData = KLineDatas[index]
    const xtw = this.OptCanvas.measureText(itemData.datetime).width

    this.OptCanvas.beginPath()
    this.OptCanvas.clearRect(0, this.FrameList['xAxis']['position']['top'], this.FrameList['xAxis']['width'], this.FrameList['xAxis']['height'])
    this.OptCanvas.fillStyle = g_ThemeResource.BorderColor
    if (x < xtw / 2 + 10) {
      this.OptCanvas.fillRect(ToFixedRect(0), ToFixedRect(this.FrameList['xAxis']['position']['top']), ToFixedRect(xtw + 20), ToFixedRect(this.FrameList['xAxis']['height'] - 5))
      this.OptCanvas.font = "12px sans-serif"
      this.OptCanvas.fillStyle = g_ThemeResource.FontLightColor
      this.OptCanvas.fillText(itemData.datetime, ToFixedPoint(10), this.FrameList['xAxis']['position']['top'] + 18)
    } else {
      this.OptCanvas.fillRect(ToFixedRect(x - xtw / 2 - 10), ToFixedRect(this.FrameList['xAxis']['position']['top']), ToFixedRect(xtw + 20), ToFixedRect(this.FrameList['xAxis']['height'] - 5))
      this.OptCanvas.font = "12px sans-serif"
      this.OptCanvas.fillStyle = g_ThemeResource.FontLightColor
      this.OptCanvas.fillText(itemData.datetime, ToFixedPoint(x - xtw / 2), this.FrameList['xAxis']['position']['top'] + 18)
    }

    this.OptCanvas.strokeStyle = g_ThemeResource.FontLightColor
    this.OptCanvas.lineWidth = 1
    this.OptCanvas.moveTo(ToFixedPoint(x), ToFixedPoint(this.FrameList['xAxis']['position']['top']))
    this.OptCanvas.lineTo(ToFixedPoint(x), this.FrameList['xAxis']['position']['top'] + 5)

    this.OptCanvas.stroke()
    this.OptCanvas.closePath()

    var drawYAxisLabel = function (option) {
      self.OptCanvas.beginPath()
      self.OptCanvas.fillStyle = g_ThemeResource.BorderColor
      self.OptCanvas.fillRect(ToFixedRect(WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth), ToFixedRect(y - 10), ToFixedRect(WindowSizeOptions.yAxisContainerWidth), ToFixedRect(20))
      self.OptCanvas.font = '12px san-serif'
      self.OptCanvas.fillStyle = g_ThemeResource.FontLightColor
      self.OptCanvas.fillText(((((option['height'] - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom) - (y - option['position']['top'] - WindowSizeOptions.padding.top)) / option['yAxis'].unitPricePx) + option['yAxis'].Min).toFixed(4), WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth + 10, y + 5)
      self.OptCanvas.lineWidth = 1
      self.OptCanvas.strokeStyle = g_ThemeResource.FontLightColor
      self.OptCanvas.moveTo(WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth, ToFixedPoint(y))
      self.OptCanvas.lineTo(WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth + 5, ToFixedPoint(y))
      self.OptCanvas.stroke()
      self.OptCanvas.closePath()
    }

    // 绘制Y轴上的标识
    for (let i in this.FrameList) {
      if (y < this.FrameList[i]['position']['top'] + this.FrameList[i]['height'] && y > this.FrameList[i]['position']['top']) {
        drawYAxisLabel(this.FrameList[i])
      }
    }
  }
  this.Clear = function () {

  }
}

function MACD () {
  this.Canvas
  this.Option
  this.Datas
  this.ZeroY = null


  this.Create = function (canvas, option, datas) {
    this.Canvas = canvas
    this.Option = option
    this.Datas = datas
    if (this.Option.yAxis.Min < 0) {
      this.ZeroY = this.Option.position.top + this.Option.height - Math.abs(this.Option.yAxis.Min * this.Option.yAxis.unitPricePx)
    }
  }

  this.Draw = function () {
    this.Canvas.beginPath()
    this.Canvas.strokeStyle = this.Option.style['DIFF']
    this.Canvas.lineWidth = 1
    for (var i = 0, j = this.Datas.length; i < j; i++) {
      this.DrawCurve(i, 'DIFF')
    }
    this.Canvas.stroke()
    this.Canvas.closePath()

    // DEA
    this.Canvas.beginPath()
    this.Canvas.strokeStyle = this.Option.style['DEA']
    this.Canvas.lineWidth = 1
    for (var i = 0, j = this.Datas.length; i < j; i++) {
      this.DrawCurve(i, 'DEA')
    }
    this.Canvas.stroke()
    this.Canvas.closePath()
    // macd
    this.Canvas.beginPath()
    this.Canvas.lineWidth = 2
    for (var i = 0, j = this.Datas.length; i < j; i++) {
      if (this.Datas[i]['MACD'] > 0) {
        this.DrawVerticalUpLine(i, 'MACD')
      }
    }
    this.Canvas.stroke()
    this.Canvas.closePath()

    this.Canvas.beginPath()
    this.Canvas.lineWidth = 2
    for (var i = 0, j = this.Datas.length; i < j; i++) {
      if (this.Datas[i]['MACD'] < 0) {
        this.DrawVerticalDownLine(i, 'MACD')
      }
    }
    this.Canvas.stroke()
    this.Canvas.closePath()
  }

  this.DrawCurve = function (i, attrName) {
    var StartY
    var StartX = WindowSizeOptions.padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * i + ZOOM_SEED[CurScaleIndex][0] / 2 + this.Option.position.left
    if (parseFloat(this.Datas[i][attrName]) >= 0) {
      this.ZeroY != null ? StartY = this.ZeroY - (parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx) : this.StartY = this.Option.position.top + this.Option.height - (parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx) - WindowSizeOptions.padding.top
    } else {
      StartY = this.ZeroY + (Math.abs(parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx))
    }
    if (i === 0) {
      this.Canvas.moveTo(StartX, StartY)
    }
    this.Canvas.lineTo(StartX, StartY)
  }

  this.DrawVerticalDownLine = function (i, attrName) {
    var StartX = WindowSizeOptions.padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * i + ZOOM_SEED[CurScaleIndex][0] / 2 + this.Option.position.left
    this.Canvas.strokeStyle = this.Option.style['MACD']['down']
    var StartY = this.ZeroY + (Math.abs(parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx))
    this.Canvas.moveTo(StartX, StartY)
    this.Canvas.lineTo(StartX, this.ZeroY)
  }

  this.DrawVerticalUpLine = function (i, attrName) {
    var StartY
    var StartX = WindowSizeOptions.padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * i + ZOOM_SEED[CurScaleIndex][0] / 2 + this.Option.position.left
    this.Canvas.strokeStyle = this.Option.style['MACD']['up']
    this.ZeroY != null ? StartY = this.ZeroY - (parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx) : StartY = this.Option.position.top + this.Option.height - (parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx) - WindowSizeOptions.padding.top
    this.Canvas.moveTo(StartX, StartY)
    this.Canvas.lineTo(StartX, this.ZeroY)
  }



}

// K线数据处理类
function KLineDatasFix () {
  this.Period
  this.Datas
  this.PeriodDatasMap
  this.ChartDatas = new ChartDatas()
  this.StepPixel = 4 // 移动多少个像素为一单元
  this.IndicatorDatasFix = new IndicatorDatasFix // 指标数据处理
  this.Options
  this.LoadStatus = 0 // 0 初始化、1 加载新数据，2 加载旧数据
  this.MetaLabelLists = [
    CONDITION_PERIOD.KLINE_MINUTE_ID,
    CONDITION_PERIOD.KLINE_60_MINUTE_ID,
    CONDITION_PERIOD.KLINE_DAY_ID
  ]

  this.GetData = function (options) {
    if (chartDatas.Datas) {
      return
    }
    this.Options = options
    chartDatas.Request()
    KLineDatas = chartDatas.Datas
    CurDataOffset = KLineDatas.length - 1
    self.GetIndicatorData()
  }
  /**
   * 
   * @param {新获取的数据} datas 
   * @param {类型：new / history} type 
   * @description 将新获取的数据跟已有数据进行合并
   */
  this.MergeData = function (datas, type) {
  }

  /**
   * @description 生成周期数据
   * @param {周期} period 
   */
  this.GeneratePeriodData = function (period) {
    if (period > 0 && period < 4) {

    } else if (period > 4 && period < 8) {

    }
  }

  /**
   * @description 要切换的周期
   * @param {周期} period 
   */
  this.SwitchPeriod = function (period) {
    if (this.PeriodDatasMap[period]) {
      this.Period = period
      this.Datas = this.PeriodDatasMap[period]
      return
    }
    if (period == CONDITION_PERIOD.KLINE_MINUTE_ID || period == CONDITION_PERIOD.KLINE_60_MINUTE_ID || period == CONDITION_PERIOD.KLINE_DAY_ID) {
      this.ChartDatas.RequestDatas(period)
      return
    }
    this.GeneratePeriodData(period)
  }

  var self = this
  this.MoveDatas = function (step, isLeft) {
    step = Math.ceil(8 / ZOOM_SEED[CurScaleIndex][0])
    if (isLeft) {
      if (Mode == 0 || Mode == 2) {
        if (CurDataOffset > chartDatas.Datas.length - 1) {
          self.LoadStatus = 1
          chartDatas.LoadNewDatas('new', res => {
            setTimeout(function () {
              self.GetIndicatorData()
              noLoadData()
            }, 2500)
          })
        } else {
          CurDataOffset += step
        }
      } else if (Mode == 1) {
        CurDataOffset += step
        if (CurDataOffset > chartDatas.Datas.length - 1) CurDataOffset = chartDatas.Datas.length - 1
      }
      return true
    } else {
      console.log(LeftDatasIndex)
      if (LeftDatasIndex <= 0) {
        self.LoadStatus = 2
        chartDatas.LoadNewDatas('more', res => {
          setTimeout(function () {
            self.GetIndicatorData()
            noLoadData()
          }, 2500)
        })
      } else {
        LeftDatasIndex -= step
        if (LeftDatasIndex < 0) {
          LeftDatasIndex += step
          self.LoadStatus = 2
          chartDatas.LoadNewDatas('more', res => {
            setTimeout(function () {
              self.GetIndicatorData()
              noLoadData()
            }, 2500)
          })
        } else {
          CurDataOffset -= Math.ceil(8 / ZOOM_SEED[CurScaleIndex][0])
        }
      }
      return true
    }
  }

  this.SplitDatas = function () {
    LeftDatasIndex = CurDataOffset + 1 - KNum
    if (LeftDatasIndex < 0 && CurDataOffset - LeftDatasIndex <= chartDatas.Datas.length - 1) {
      CurDataOffset -= LeftDatasIndex
      LeftDatasIndex = 0
    }
    KLineDatas = chartDatas.Datas.slice(LeftDatasIndex, CurDataOffset == chartDatas.Datas.length - 1 ? -1 : CurDataOffset)
    for (let i in this.Options) {
      if (i != 'xAxis' && i != 'kLine') {
        this.IndicatorDatasFix.SplitDatas(i)
      }
    }
  }

  this.ScaleKLine = function (e) {
    if (e > 0) {
      // 放大
      if (CurScaleIndex <= 0) {
        return false
      }
      CurScaleIndex--
    } else {
      // 缩小
      if (CurScaleIndex >= ZOOM_SEED.length - 1) {
        return false
      }
      CurScaleIndex++
    }
    KNum = Math.ceil((WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth) / (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]))
    return true
  }

  this.GetIndicatorData = function () {
    for (let i in this.Options) {
      if (i != 'xAxis' && i != 'kLine') {
        if (this.IndicatorDatasFix.OIndicators[i]) {
          // 有原数据
          this.IndicatorDatasFix.CalculationIndicator(i, this.LoadStatus)
        } else {
          // 无原数据
          this.IndicatorDatasFix.CalculationIndicator(i, this.LoadStatus)
        }
      }
    }
  }

}

function IndicatorDatasFix () {
  this.Indicators = {}
  this.OIndicators = {}

  this.CalculationIndicator = function (indicatorName, loadStatus) {
    var c = hxc3.IndicatorFormula.getClass(indicatorName);
    var indicator = new c();
    var refresh = true
    if (!this.OIndicators[indicatorName]) {
      this.OIndicators[indicatorName] = {}
    } else {
      if (this.OIndicators[indicatorName].datas.length < chartDatas.Datas.length) {
        refresh = false
      }
    }
    if (refresh) {
      // 指标数据初始化
      var iDatas = indicator.calculate(chartDatas.Datas);
      this.OIndicators[indicatorName].datas = iDatas
    } else {
      // 加载更多指标数据
      if (loadStatus == 1) {
        var iDatas = indicator.calculate(chartDatas.Datas.slice(chartDatas.Datas.length - 1 - Limit * 2, -1));
        this.OIndicators[indicatorName].datas = this.OIndicators[indicatorName].datas.concat(iDatas.slice(Limit - 1, -1))
      } else if (loadStatus == 2) {
        var iDatas = indicator.calculate(chartDatas.Datas.slice(0, Limit * 2));
        this.OIndicators[indicatorName].datas = this.OIndicators[indicatorName].datas.concat(iDatas.slice(0, Limit))
      }
    }
  }

  this.SplitDatas = function (indicatorName) {
    if (!this.Indicators[indicatorName]) {
      this.Indicators[indicatorName] = {}
    }
    this.Indicators[indicatorName].datas = this.OIndicators[indicatorName].datas.slice(LeftDatasIndex, CurDataOffset == chartDatas.Datas.length - 1 ? -1 : CurDataOffset)
  }
}

// 顶部工具栏容器
function TopToolContainer () {
  this.FeaturesList
  this.CurSelectIndex
  this.Width
  this.Height = 38

  this.Period
  this.Create = function (width) {
    this.Width = width
    this.DivElement = document.createElement('div')
    this.DivElement.id = Guid()
    this.DivElement.className = "top-container"
    this.DivElement.style.width = this.Width + 'px'
    this.DivElement.style.height = this.Height + 'px'
    this.DivElement.style.backgroundColor = g_ThemeResource.BgColor
    this.DivElement.style.borderBottom = g_ThemeResource.BorderWidth[0] + "px solid " + g_ThemeResource.BorderColor
    this.DivElement.innerHTML =
      ' <div id="goto-btn" class="item" ><span class="iconfont icon-lsh-jump" style="margin-right:2px;"></span>跳转到</div>\n' +
      ' <div id="period-btn" class="item">周 期</div>\n' +
      ' <div id="indicators-btn" class="item"><span class="iconfont icon-fx" style="margin-right:2px;"></span> 指 标</div>\n' +
      ' <div id="pre-signal-btn" class="item"><span class="iconfont icon-xiayiye1" style="margin-right:2px;"></span> 信号</div>\n' +
      ' <div id="next-signal-btn" class="item">信号<span class="iconfont icon-xiayiye" style="margin-left:2px;"></span> </div>\n' +
      ' <div style="flex-grow:1"></div>\n' +
      ' <div id="settings-btn" class="item" style="border-left:1.5px solid #353d5a"><span class="iconfont icon-shezhi"></span></div>\n' +
      ' <div id="scale-big-btn" class="item"><span class="iconfont icon-quanping"></span></div>\n' +
      ' <div id="shot-btn" class="item"><span class="iconfont icon-kuaizhao"></span></div>\n'
    return this.DivElement
  }

  this.CreatePeriodDialog = function () {

  }
}

// 左侧工具栏容器
function LeftToolContainer () {
  this.FeaturesList
  this.CurSelectIndex
  this.DivElement
  this.Width = 60
  this.Height
  this.Create = function (height) {
    this.Height = height
    this.DivElement = document.createElement('div')
    this.DivElement.id = Guid()
    this.DivElement.style.width = this.Width + 'px'
    this.DivElement.style.height = this.Height + 'px'
    this.DivElement.style.backgroundColor = g_ThemeResource.BgColor
    this.DivElement.style.borderRight = g_ThemeResource.BorderWidth[0] + "px solid " + g_ThemeResource.BorderColor

    this.DivElement.innerHTML =
      '<div style="text-align:center;height:40px;line-height:40px;width:60px;border-bottom:1px solid #353d5a"><span class="iconfont icon-caidan" style="font-size: 28px;color: #8d9bab;"></span></div>\n' +
      '<div id="line-tool" class="draw-tool-item" style="margin-top:10px"><span class="iconfont icon-xianduan1" style="font-size: 30px;"></span></div>\n' +
      '<div id="rect-tool" class="draw-tool-item"><span class="iconfont icon-juxing" style="font-size: 30px;"></span></div>'
    return this.DivElement
  }

  this.RegisterClickEvent = function (callback) {
    $("#line-tool").click(function (e) { callback('line-tool') })
    $("#rect-tool").click(function (e) { callback("rect-tool") })
  }
}

function TitleToolContainer () {
  this.Option
  this.Name
  this.DivElement
  this.CurValue = {}
  this.Create = function (option, key) {
    this.Name = key
    this.Option = option
    this.DivElement = document.createElement('div')
    this.DivElement.className = "title-tool"
    this.DivElement.id = this.Name + '-title-tool'
    this.DivElement.innerHTML =
      '<div id="' + this.Name + 'left-box" class="left-box">\n' +
      ' <div id="' + this.Name + 'name-box">\n' +
      '   <span id="' + this.Name + 'name" style="color:#8d9bab"></span>\n' +
      '   <span id="' + this.Name + 'show-hide" class="iconfont icon-xianshi icon" style="color:#8d9bab;font-size:18px;margin-left:5px"></span>\n' +
      '   <span id="' + this.Name + 'settings" class="iconfont icon-shezhi icon" style="color:#8d9bab;font-size:18px;margin-left:5px"></span>\n' +
      '   <span id="' + this.Name + 'close-icon" class="iconfont icon-guanbi icon" style="color:#8d9bab;font-size:18px;margin-left:5px"></span>\n' +
      ' </div>\n' +
      ' <div id="' + this.Name + 'value-box" style="margin-left:10px"></div>\n' +
      '</div>\n' +
      '<div style="flex-grow:1"></div>\n' +
      '<div id="' + this.Name + 'right-box">\n' +
      '   <span id="' + this.Name + 'show-hide" class="iconfont icon-xiajiangxiajiantouxiangxiadiexianxing icon" style="color:#8d9bab;font-size:20px;margin-left:5px"></span>\n' +
      '   <span id="' + this.Name + 'settings" class="iconfont icon-shangshengshangjiantouxiangshangzhangxianxing icon" style="color:#8d9bab;font-size:20px;margin-left:5px"></span>\n' +
      '   <span id="' + this.Name + 'scale" class="iconfont icon-quanping icon" style="color:#8d9bab;font-size:20px;margin-left:5px"></span>\n' +
      '   <span id="' + this.Name + 'close" class="iconfont icon-guanbi icon" style="color:#8d9bab;font-size:20px;margin-left:5px"></span>\n' +
      '<div>'
    this.DivElement.style.top = option.position.top + 10 + 'px'
    this.DivElement.style.left = option.position.left + 10 + 'px'
    this.DivElement.style.width = WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth - option.position.left - 20 + 'px'
    return this.DivElement
  }

  this.CreateValueBox = function () {
    var valueElement = document.getElementById(this.Name + 'value-box')
    if (this.Name == 'kLine') {
      $('#' + this.Name + 'name').text(this.Option.symbol).css('font-size', '18px')
      valueElement.innerHTML =
        '<span class="value-box_label">开=</span><span id="open" class="value-box_value"></span>\n' +
        '<span class="value-box_label">高=</span><span id="high" class="value-box_value"></span>\n' +
        '<span class="value-box_label">低=</span><span id="low" class="value-box_value"></span>\n' +
        '<span class="value-box_label">收=</span><span id="close" class="value-box_value"></span>\n' +
        '<span id="rate" class="value-box_value"></span>'
    } else {
      $('#' + this.Name + 'name').text(this.Option.name).css('font-size', '16px')
      for (let i in this.Option.style) {
        var span = document.createElement('span')
        span.id = i
        span.className = 'value-box_value'
        span.style.marginRight = 10 + 'px'
        valueElement.appendChild(span)
      }
    }
  }

  /**
   * @description 设置当前 titleTool 的值
   * @param {当前值} curValue 
   */
  this.SetValue = function (curValue, isUp) {
    if (this.Name == 'kLine') {
      var colorStyle
      if (curValue['open'] > curValue['close']) {
        colorStyle = g_ThemeResource.DownColor
      } else if (curValue['open'] < curValue['close']) {
        colorStyle = g_ThemeResource.UpColor
      } else {
        colorStyle = g_ThemeResource.FontColor
      }
      for (let i in curValue) {
        $('#' + i).css('color', colorStyle)
        $('#' + i).text(curValue[i])
      }
    } else if (this.Name == 'macd') {
      for (let i in curValue) {
        if (i == 'MACD') {
          curValue[i] > 0 ? $('#' + i).css('color', this.Option.style[i].up) : $('#' + i).css('color', this.Option.style[i].down)
        } else {
          $('#' + i).css('color', this.Option.style[i])
        }
        $('#' + i).text(curValue[i].toFixed(4))
      }
    }
  }


}

function DrawToolObjOptDialog () {
  this.DivElement
  this.isHide = true
  this.Create = function () {
    this.DivElement = document.createElement('div')
    this.DivElement.className = 'draw-tool-opt-dialog'
    this.DivElement.id = 'draw-tool-opt-dialog'
    this.DivElement.style.display = 'none'
    this.DivElement.style.width = WindowSizeOptions.drawToolOptDialogWidth + 'px'
    this.DivElement.innerHTML =
      '<div class="item" style="width:' + WindowSizeOptions.drawToolOptDialogWidth + 'px" id="draw-tool-opt_delete"><span class="iconfont icon-shanchu1"></span><span style="margin-left:10px">删除</span><span class="label">Del</span></div>'
    return this.DivElement
  }

  this.RegisterClickEvent = function (callback) {
    $('#draw-tool-opt_delete').click(function (e) {
      callback('delete')
      e.preventDefault()
    })
  }

  this.SetPosition = function (x, y) {
    this.DivElement.style.left = x + 'px'
    this.DivElement.style.top = y + 'px'
  }

  this.SetShow = function () {
    this.isHide = false
    this.DivElement.style.display = 'flex'
  }

  this.SetHide = function () {
    this.isHide = true
    this.DivElement.style.display = 'none'
  }

  this.GetPosition = function () {
    return {
      x: parseFloat(this.DivElement.style.left.replace('px', '')),
      y: parseFloat(this.DivElement.style.top.replace('px', ''))
    }
  }

  this.GetHeight = function () {
    return this.DivElement.offsetHeight
  }


}

function PeriodDialog () {
  this.DivElement
  this.CurSelectPeriod = CONDITION_PERIOD.KLINE_MINUTE_ID
  this.PeriodList = {
    'min': [
      {
        'text': '1 分钟',
        'ID': CONDITION_PERIOD.KLINE_MINUTE_ID
      },
      {
        'text': '5 分钟',
        'ID': CONDITION_PERIOD.KLINE_5_MINUTE_ID
      },
      {
        'text': '15 分钟',
        'ID': CONDITION_PERIOD.KLINE_15_MINUTE_ID
      },
      {
        'text': '30 分钟',
        'ID': CONDITION_PERIOD.KLINE_30_MINUTE_ID
      }
    ],
    'hour': [
      {
        'text': '1 小时',
        'ID': CONDITION_PERIOD.KLINE_60_MINUTE_ID
      },
    ],
    'day': [
      {
        'text': '1 日',
        'ID': CONDITION_PERIOD.KLINE_DAY_ID
      },
      {
        'text': '1 周',
        'ID': CONDITION_PERIOD.KLINE_WEEK_ID
      },
      {
        'text': '1 月',
        'ID': CONDITION_PERIOD.KLINE_MONTH_ID
      }
    ]
  }

  this.Create = function () {
    this.DivElement = document.createElement('div')
    this.DivElement.className = 'period-dialog'
    this.DivElement.innerHTML =
      '<div id="period-dialog_min_box" ><div class="period-item" style="width:100%;height:32px;line-height:32px;color:#787b86;font-size:12px">分</div></div>\n' +
      '<div id="period-dialog_hour_box" style="border-top:1px solid #787b86"><div class="period-item" style="width:100%;height:32px;line-height:32px;color:#787b86;font-size:12px">小时</div></div>\n' +
      '<div id="period-dialog_day_box" style="border-top:1px solid #787b86"><div class="period-item" style="width:100%;height:32px;line-height:32px;color:#787b86;font-size:12px">天</div></div>'
    return this.DivElement
  }

  this.SetPeriodElement = function () {
    for (let i in this.PeriodList) {
      var div
      if (i == 'min') {
        div = document.getElementById('period-dialog_min_box')
      } else if (i == 'hour') {
        div = document.getElementById('period-dialog_hour_box')
      } else if (i == 'day') {
        div = document.getElementById('period-dialog_day_box')
      }
      for (let j in this.PeriodList[i]) {
        var items = document.createElement('div')
        items.id = this.PeriodList[i][j].ID
        items.innerHTML = this.PeriodList[i][j].text
        items.className = "period-item"
        items.style.fontSize = '14px'
        items.style.color = '#d1d4dc'
        if (this.CurSelectPeriod == this.PeriodList[i][j].ID) {
          items.style.background = '#1976d2'
          items.style.color = '#ffffff'
        }
        div.appendChild(items)
      }
    }
    this.DivElement.style.left = WindowSizeOptions.chartContainerWidth / 2 - 50 + 'px'
    this.DivElement.style.top = WindowSizeOptions.chartContainerHeight / 2 - this.DivElement.offsetHeight / 2 + 'px'
  }



  this.RegisterClickEvent = function (callback) {
    for (let i in this.PeriodList) {
      for (let item in this.PeriodList[i]) {
        $('#' + item.ID).click(function (res) {
          callback(res)
        })
      }
    }
  }
}

function LineElement () {
  this.Name = 'line'
  this.Position = [
  ]
  this.Point = []
  this.PointCount = 2
  this.Color = g_ThemeResource.LineColor[0]
  this.LineWidth = 1
  this.Canvas
  this.Option
  this.IsFinished = false
  this.IsSelect = false

  this.Create = function (canvas, option) {
    this.Canvas = canvas
    this.Option = option
  }
  this.SetPoint = function (x, y) {
    if (this.IsFinished) return
    var index = Math.ceil(x / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0])) + LeftDatasIndex
    var price = ((((this.Option['height'] - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom) - (y - this.Option['position']['top'] - WindowSizeOptions.padding.top)) / this.Option['yAxis'].unitPricePx) + this.Option['yAxis'].Min)
    var item = [index, price]
    this.Position.push(item)
  }
  /**
   * @description update point axis
   * @param {update point is index} index 
   * @param {move hori px} xStep 
   * @param {move veri px} yStep 
   */
  this.UpdatePoint = function (i, moveIndex, yStep) {
    var y = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[i][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
    y += yStep
    this.Position[i][1] = ((((this.Option['height'] - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom) - (y - this.Option['position']['top'] - WindowSizeOptions.padding.top)) / this.Option['yAxis'].unitPricePx) + this.Option['yAxis'].Min)
    this.Position[i][0] += moveIndex
  }
  this.Draw = function (x, y) {
    if (this.Position.length == 0) return
    var startX, startY, endX, endY
    startX = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[0][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
    startY = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[0][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
    if (this.Position.length == this.PointCount) {
      endX = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[1][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
      endY = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[1][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
    } else {
      var index = Math.ceil(x / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0])) + LeftDatasIndex
      endX = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (index - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
      endY = y
    }
    this.ClipFrame()

    this.Canvas.beginPath()
    this.Canvas.setLineDash([0, 0])
    this.Canvas.strokeStyle = this.Color
    this.Canvas.lineWidth = this.LineWidth
    this.Canvas.moveTo(ToFixedPoint(startX), ToFixedPoint(startY))
    this.Canvas.lineTo(ToFixedPoint(endX), ToFixedPoint(endY))
    this.Canvas.stroke()
    this.DrawPoint()
    this.Canvas.restore();
  }

  this.DrawPoint = function () {
    if (this.Position.length > 0 && this.IsSelect) {
      for (var i in this.Position) {
        var x = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[i][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
        var y = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[i][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top

        this.Canvas.beginPath();
        this.Canvas.arc(ToFixedPoint(x), ToFixedPoint(y), 5, 0, 360, false);
        this.Canvas.fillStyle = '#000000';      //填充颜色
        this.Canvas.strokeStyle = this.Color
        this.Canvas.fill();                         //画实心圆
        this.Canvas.stroke()
        this.Canvas.closePath();
      }
    }
  }

  this.ClipFrame = function () {
    this.Canvas.save()
    this.Canvas.beginPath()
    this.Canvas.rect(this.Option.position.left, this.Option.position.top, this.Option.width, this.Option.height)
    this.Canvas.clip()
  }

  this.ClearCanvas = function () {
    this.Canvas.clearRect(this.Option.position.left, this.Option.position.top, this.Option.width, this.Option.height)
  }

  this.IsPointInPath = function (x, y) {
    if (!this.Option) return -1
    if (this.Position.length < this.PointCount) return -1

    for (let i in this.Position) {
      this.Canvas.beginPath();
      var ex = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[i][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
      var ey = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[i][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
      this.Canvas.arc(ex, ey, 5, 0, 360);
      if (this.Canvas.isPointInPath(x, y)) return i;
    }

    var x1 = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[0][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
    var y1 = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[0][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
    var x2 = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[1][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
    var y2 = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[1][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
    this.Canvas.beginPath()
    if (x1 == x2) {
      this.Canvas.moveTo(x1 - 5, y1);
      this.Canvas.lineTo(x1 + 5, y1);
      this.Canvas.lineTo(x2 + 5, y2);
      this.Canvas.lineTo(x2 - 5, y2);
    } else {
      this.Canvas.moveTo(x1, y1 + 5)
      this.Canvas.lineTo(x1, y1 - 5)
      this.Canvas.lineTo(x2, y2 - 5)
      this.Canvas.lineTo(x2, y2 + 5)
    }
    this.Canvas.closePath()
    if (this.Canvas.isPointInPath(x, y)) {
      return 100
    }
    return -1
  }
}

function RectElement () {
  this.Name = 'rect'
  this.Position = [
  ]
  this.Point = []
  this.PointCount = 2
  this.Color = g_ThemeResource.SelectColor
  this.FillColor = g_ThemeResource.RectBgColor
  this.LineWidth = 1
  this.Canvas
  this.Option
  this.IsFinished = false
  this.IsSelect = false
  this.Create = function (canvas, option) {
    this.Canvas = canvas
    this.Option = option
  }
  this.SetPoint = function (x, y) {
    if (this.IsFinished) return
    var index = Math.ceil(x / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0])) + LeftDatasIndex
    var price = ((((this.Option['height'] - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom) - (y - this.Option['position']['top'] - WindowSizeOptions.padding.top)) / this.Option['yAxis'].unitPricePx) + this.Option['yAxis'].Min)
    var item = [index, price]
    this.Position.push(item)
  }

  /**
   * @description update point axis
   * @param {update point is index} index 
   * @param {move hori px} xStep 
   * @param {move veri px} yStep 
   */
  this.UpdatePoint = function (i, moveIndex, yStep) {
    var y = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[i][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
    y += yStep
    this.Position[i][1] = ((((this.Option['height'] - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom) - (y - this.Option['position']['top'] - WindowSizeOptions.padding.top)) / this.Option['yAxis'].unitPricePx) + this.Option['yAxis'].Min)
    this.Position[i][0] += moveIndex
  }

  this.Draw = function (x, y) {
    if (this.Position.length == 0) return
    var startX, startY, endX, endY
    startX = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[0][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
    startY = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[0][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
    if (this.Position.length == this.PointCount) {
      endX = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[1][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
      endY = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[1][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
    } else {
      var index = Math.ceil(x / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0])) + LeftDatasIndex
      endX = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (index - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
      endY = y
    }
    this.ClipFrame()

    this.Canvas.beginPath()
    this.Canvas.strokeStyle = this.Color
    this.Canvas.setLineDash([0, 0])
    this.Canvas.fillStyle = this.FillColor
    this.Canvas.fillRect(ToFixedRect(startX), ToFixedRect(startY), ToFixedRect(endX - startX), ToFixedRect(endY - startY))
    this.Canvas.stroke()
    this.DrawPoint()
    this.Canvas.restore();
  }

  this.DrawPoint = function () {
    if (this.Position.length > 0 && this.IsSelect) {
      for (var i in this.Position) {
        var x = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[i][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
        var y = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[i][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top

        this.Canvas.beginPath();
        this.Canvas.arc(ToFixedPoint(x), ToFixedPoint(y), 5, 0, 360, false);
        this.Canvas.fillStyle = '#000000';      //填充颜色
        this.Canvas.strokeStyle = this.Color
        this.Canvas.fill();                         //画实心圆
        this.Canvas.stroke()
        this.Canvas.closePath();
      }
    }
  }

  this.ClipFrame = function () {
    this.Canvas.save()
    this.Canvas.beginPath()
    this.Canvas.rect(this.Option.position.left, this.Option.position.top, this.Option.width, this.Option.height)
    this.Canvas.clip()
  }

  this.IsPointInPath = function (x, y) {
    if (!this.Option) return -1
    if (this.Position.length < this.PointCount) return -1

    for (let i in this.Position) {
      this.Canvas.beginPath();
      var ex = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[i][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
      var ey = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[i][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
      this.Canvas.arc(ex, ey, 5, 0, 360);
      if (this.Canvas.isPointInPath(x, y)) return i;
    }

    var x1 = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[0][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
    var y1 = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[0][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top
    var x2 = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * (this.Position[1][0] - LeftDatasIndex) - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1] + this.Option.position.left
    var y2 = this.Option.height - WindowSizeOptions.padding.top - WindowSizeOptions.padding.bottom - (this.Position[1][1] - this.Option['yAxis'].Min) * this.Option['yAxis'].unitPricePx + WindowSizeOptions.padding.top + this.Option.position.top

    //是否在矩形边框上
    var linePoint = [{ X: x1, Y: y1 }, { X: x2, Y: y1 }];
    if (this.IsPointInLine(linePoint, x, y))
      return 100;

    linePoint = [{ X: x2, Y: y1 }, { X: x2, Y: y2 }];
    if (this.IsPointInLine2(linePoint, x, y))
      return 100;

    linePoint = [{ X: x2, Y: y2 }, { X: x1, Y: y2 }];
    if (this.IsPointInLine(linePoint, x, y))
      return 100;

    linePoint = [{ X: x1, Y: y2 }, { X: x1, Y: y1 }];
    if (this.IsPointInLine2(linePoint, x, y))
      return 100;

    return -1;
  }

  //点是否在线段上 水平线段
  this.IsPointInLine = function (aryPoint, x, y) {
    this.Canvas.beginPath();
    this.Canvas.moveTo(aryPoint[0].X, aryPoint[0].Y + 5);
    this.Canvas.lineTo(aryPoint[0].X, aryPoint[0].Y - 5);
    this.Canvas.lineTo(aryPoint[1].X, aryPoint[1].Y - 5);
    this.Canvas.lineTo(aryPoint[1].X, aryPoint[1].Y + 5);
    this.Canvas.closePath();
    if (this.Canvas.isPointInPath(x, y))
      return true;
  }

  //垂直线段
  this.IsPointInLine2 = function (aryPoint, x, y) {
    this.Canvas.beginPath();
    this.Canvas.moveTo(aryPoint[0].X - 5, aryPoint[0].Y);
    this.Canvas.lineTo(aryPoint[0].X + 5, aryPoint[0].Y);
    this.Canvas.lineTo(aryPoint[1].X + 5, aryPoint[1].Y);
    this.Canvas.lineTo(aryPoint[1].X - 5, aryPoint[1].Y);
    this.Canvas.closePath();
    if (this.Canvas.isPointInPath(x, y))
      return true;
  }
}
// 主题设置Dialog
function ThemeSettingsDialog () {
  this.BgColor = "#1f1f36"
  this.BorderColor = "#3c4564"
  this.FontColor = "#bfcbd9"
  this.FontLightColor = "#ffffff"
  this.RectBgColor = "#4985e780"
  this.SelectColor = "#4985e7"
  this.UpColor = "#26a69a"
  this.DownColor = "#ef5350"
  this.BorderWidth = [2, 1]
  this.SettingsList
  this.LineColor = ['#ffc400']

  this.Create = function () {

  }
  this.Close = function () {

  }
  /**
   * @description 设置K线颜色
   */
  this.SetKLineColor = function () {

  }
  /**
   * @description 设置涨跌颜色
   */
  this.SetUpDownColor = function () {

  }
  /**
   * @description 设置背景颜色
   */
  this.SetBgColor = function () {

  }
  /**
   * @description 设置字体颜色
   */
  this.SetFontColor = function () {

  }
  /**
   * @description 设置边框颜色
   */
  this.SetBorderColor = function () {

  }
  /**
   * @description 设置主题色
   */
  this.SetThemeColor = function () {

  }
  /**
   * @description 设置网格线
   */
  this.SetGridLine = function () {

  }
  /**
   * @description 设置图表画布边距
   */
  this.SetChartPadding = function () {

  }
  /**
   * @description 设置光标颜色
   */
  this.SetCursorColor = function () {

  }
}

// 图表数据获取类
function ChartDatas () {
  this.Datas
  this.Period
  this.Mode = 0 //0 离线、1 在线、2 限定

  this.isRefresh = true
  this.LeftIndex
  this.RightIndex
  this.Socket = function (period) {

  }
  /**
   * @description 请求数据
   * @param {周期}} period 
   */
  this.Request = function () {
    this.RightIndex = kLines.length - 1 - 200
    this.LeftIndex = this.RightIndex - 2000
    this.Datas = kLines.slice(this.LeftIndex, this.RightIndex + 1)
  }
  this.LoadNewDatas = function (type, callback) {
    if (type == 'more') {
      loadData()
      this.LeftIndex -= Limit
      this.Datas = kLines.slice(this.LeftIndex, this.RightIndex + 1)
      CurDataOffset += Limit
      LeftDatasIndex += Limit
    } else if (type == 'new') {
      loadData()
      // console.time('Array initialize')
      var newData = kLines.slice(this.RightIndex, this.RightIndex + Limit + 1)
      this.Datas = this.Datas.concat(newData)
      this.RightIndex += Limit

      // this.Datas = kLines.slice(this.LeftIndex, this.RightIndex)
      // console.timeEnd('Array initialize')
    }
    callback()
  }
  this.LoadMoreDatas = function () {

  }
}

function saveJsonToFile (oData, fileName) {
  // var data = Basic.OrignDatas.kline
  var data = oData
  var content = JSON.stringify(data)
  var blob = new Blob([content], {
    type: "text/plain;charset=utf-8"
  });
  saveAs(blob, fileName + '.json');
}

function loadData () {
  isLoadData = true
  $('#load-ele').css('display', 'flex')
}

function noLoadData () {
  isLoadData = false
  $('#load-ele').css('display', 'none')
}


ChartDatas.Init = function () {
  var datas = new ChartDatas()
  return datas
}

var chartDatas = ChartDatas.Init()
var KLineDatas
var CurDataOffset = 0 // 初始化开始，数据范围右游标为 -1
var LeftDatasIndex = 0
var KNum // 一屏可容纳的K线数量
var Mode = 0 // 0 离线、1 在线、2 限定
var isLoadData = false
var Limit = 100 // 每次加载100行数据
var g_ThemeResource = new ThemeSettingsDialog()

var pixelTatio = GetDevicePixelRatio();
var WindowSizeOptions = {
  windowHeight: 0,
  windowWidth: 0,
  topToolContainerHeight: 38,
  leftToolContainerWidth: 60,
  chartContainerWidth: 0,
  chartContainerHeight: 0,
  xAxisContainerHeight: 28,
  yAxisContainerWidth: 60,
  drawToolOptDialogWidth: 230,
  chartLeft: 0,
  chartTop: 0,
  chartScale: 2.3, // K线图表和指标图表的比例
  padding: {
    'top': 20,
    'bottom': 20,
    'left': 0,
    'right': 0
  }
}

//周期条件枚举
var CONDITION_PERIOD =
{
  MINUTE_ID: 101,            //分钟      走势图
  MULTIDAY_MINUTE_ID: 102,   //多日分钟  走势图
  HISTORY_MINUTE_ID: 103,    //历史分钟  走势图

  //K线周期  0=日线 1=周线 2=月线 3=年线 4=1分钟 5=5分钟 6=15分钟 7=30分钟 8=60分钟
  KLINE_DAY_ID: 0,
  KLINE_WEEK_ID: 1,
  KLINE_MONTH_ID: 2,
  KLINE_YEAR_ID: 3,
  KLINE_MINUTE_ID: 4,
  KLINE_5_MINUTE_ID: 5,
  KLINE_15_MINUTE_ID: 6,
  KLINE_30_MINUTE_ID: 7,
  KLINE_60_MINUTE_ID: 8
};

var CurScaleIndex = 8
var ZOOM_SEED =
[
    [48, 10], [44, 10],
    [40, 9], [36, 9],
    [32, 8], [28, 8],
    [24, 7], [20, 7],
    [18, 6], [16, 6],
    [14, 5], [12, 5],
    [8, 4], [6, 4],
    [6, 3], [3, 3],
    [3, 1], [2, 1],
    [1, 1], [1, 0.5],
    [1, 0.2], [1, 0.1],
    [0.8, 0.1], [0.6, 0.1],
    [0.5, 0.1], [0.4, 0.1],
    [0.3, 0.1], [0.2, 0.1]
  ];

function GetDevicePixelRatio () {
  if (typeof (window) == 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

function Guid () {
  function S4 () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function ToFixedPoint (value) {
  return parseInt(value) + 0.5;
}

function ToFixedRect (value) {
  var rounded;
  return rounded = (0.5 + value) << 0;
}

function accAdd (arg1, arg2) {
  var r1, r2, m;
  try {
    r1 = arg1.toString().split(".")[1].length
  } catch (e) {
    r1 = 0
  } try {
    r2 = arg2.toString().split(".")[1].length
  } catch (e) { r2 = 0 } m = Math.pow(10, Math.max(r1, r2))
  return (arg1 * m + arg2 * m) / m
}

Number.prototype.add = function (arg) {
  return accAdd(arg, this);
}


// Array.prototype.insert = function (index, item) {
//   this.splice(index, 0, item);
// }