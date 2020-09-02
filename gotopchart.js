
function GoTopChart (element) {
  this.DivElement = element
  this.DivElement.className = "main-div"

  this.RightElement = document.createElement('div')

  this.ChartElement = document.createElement('div')
  this.ChartElement.className = 'chart-container'

  this.TopToolContainer = new TopToolContainer()
  this.LeftToolContainer = new LeftToolContainer()

  this.DivElement.appendChild(this.LeftToolContainer.Create())
  this.DivElement.appendChild(this.RightElement)

  this.RightElement.appendChild(this.TopToolContainer.Create())
  this.RightElement.appendChild(this.ChartElement)

  ChartSize.getInstance() = new ChartSize()

  this.Options

  this.OnSize = function () {
    ChartSize.getInstance().TotalHeight = parseInt(this.DivElement.style.height.replace("px", ""))
    ChartSize.getInstance().TotalWidth = parseInt(this.DivElement.style.width.replace("px", ""))

    this.RightElement.style.width = ChartSize.getInstance().TotalWidth - ChartSize.getInstance().LeftToolWidthPx - g_GoTopChartResource.BorderWidth[0] + 'px'
    this.RightElement.style.height = ChartSize.getInstance().TotalHeight + 'px'

    this.TopToolContainer.SetWidth(this.RightElement.style.width)
    this.LeftToolContainer.SetHeight(this.RightElement.style.height)

    ChartSize.getInstance().ChartContentWidth = parseInt(this.RightElement.style.width.replace('px', ''))
    ChartSize.getInstance().ChartContentHeight = parseInt(this.RightElement.style.height.replace('px', '')) - ChartSize.getInstance().TopToolHeightPx - g_GoTopChartResource.BorderWidth[0]
  }

  this.SetOption = function (options) {
    this.Options = options
    this.Draw()
  }

  this.Draw = function () {
    var chart = new GoTopChartComponent()
    chart.ChartSize = ChartSize.getInstance()
    chart.Options = this.Options
    chart.ChartElement = this.ChartElement

    chart.CreateElement()
    chart.SetSize()
    chart.SetFrameOption()
    chart.SetChartFrameList()
    // 数据请求后进行回调
    chart.RequestNewData(ChartData.getInstance().Period, function (res) {
      chart.Loaded()
      chart.Draw()
    })
  }

  this.LeftToolContainer.RegisterClickEvent(function (e) {

  })

  this.TopToolContainer.RegisterClickEvent(function (e) {

  })
}

GoTopChart.Init = function (element) {
  var chart = new GoTopChart(element)
  return chart
}

////////////////////////////////////////////
// 
//             图表组件
//
////////////////////////////////////////////
function GoTopChartComponent () {
  this.ChartData = ChartData.getInstance()
  this.Options
  this.XOption = {}         // X轴的配置，一个图标库中只有一个X轴，所以独立出来
  this.KLineOption = {}     // K线图表的配置
  this.IndicatorDataList = {}          // 存放指标数据的list，如果指标窗口删除，则删除指定的指标

  this.ChartFramePaintingList = new Array()     // 存放图表框架绘制对象
  this.FrameList = new Array()                  // 存放图表框架
  this.DrawPictureList = new Array()            // 存放画图对象
  this.IndicatorList = new Array()              // 存放使用的指标名称

  this.CrossCursor = new CrossCursor()          // 光标


  // canvas
  this.ChartElement
  this.CanvasElement = document.createElement('canvas')
  this.CanvasElement.className = "jschart-drawing"
  this.OptCanvasElement = document.createElement('canvas')
  this.OptCanvasElement.className = "jschart-opt-drawing"
  this.Canvas = this.CanvasElement.getContext('2d')
  this.OptCanvas = this.OptCanvasElement.getContext('2d')

  this.XAxis

  this.DataOffSet             // 当前数据偏移量：右游标
  this.ScreenKNum             //一屏显示多少跟K线
  this.Mode                   // 模式：0 离线、1 在线（实时获取数据）
  this.IsLoadData = false     //判断是否加载数据中，如果是则不允许任何图表触摸操作


  this.KLinesUrl = g_GoTopChartResource.Domain + '/api/v3/klines'

  var self = this

  this.CreateElement = function () {

    // 加载loading element
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


  }

  this.SetSize = function () {
    const width = ChartSize.getInstance().ChartContentWidth
    const height = ChartSize.getInstance().ChartContentHeight

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

  this.SetFrameOption = function () {
    // period
    ChartData.getInstance().Period = this.Options.KLine.Period
    // xAxis
    this.XOption.height = ChartSize.getInstance().XAxisHeight
    this.XOption.width = ChartSize.getInstance().ChartContentWidth - ChartSize.getInstance().YAxisWidth
    this.XOption.position = {}
    this.XOption.position.left = 0
    this.XOption.position.top = ChartSize.getInstance().ChartContentHeight - ChartSize.getInstance().XAxisHeight

    const ch = ChartSize.getInstance().ChartContentHeight - ChartSize.getInstance().XAxisHeight
    const cw = ChartSize.getInstance().ChartContentWidth - ChartSize.getInstance().YAxisWidth
    const sch = ch / (this.Options.Window.length + ChartSize.getInstance().ChartScale)
    // kline
    this.KLineOption.name = 'kLine'
    this.KLineOption.symbol = this.Options.Symbol
    this.KLineOption.width = cw
    this.KLineOption.height = ChartSize.getInstance().ChartScale * sch
    this.KLineOption.position = {
      left: 0,
      top: 0
    }
    this.KLineOption.yAxis = {
      width: ChartSize.getInstance().YAxisWidth,
      height: this.KLineOption.height,
      position: {
        left: cw,
        top: 0
      }
    }
    this.FrameList.push(this.KLineOption)
    // indicators
    var ict = this.KLineOption.height
    for (var i in this.Options.Window) {
      var option = {
        name: this.Options.Window[i].Index,
        params: this.Options.Window[i].Params,
        key: this.Options.Window[i].Key,
        style: this.Options.Window[i].Style,
        width: cw,
        height: sch,
        position: {
          left: 0,
          top: ict
        },
        yAxis: {
          width: ChartSize.getInstance().YAxisWidth,
          height: sch,
          position: {
            left: cw,
            top: ict
          }
        }
      }
      this.FrameList.push(option)
      this.IndicatorData.push(option.name)
      ict += sch
    }
  }

  this.SetChartFrameList = function () {
    for (var i in this.FrameList) {
      var chartFramePaint = new ChartFramePainting()
      chartFramePaint.Name = this.FrameList[i].name
      chartFramePaint.Option = this.FrameList[i]
      chartFramePaint.ChartData = this.ChartData
      chartFramePaint.ChartSize = ChartSize.getInstance()
      chartFramePaint.ChartElement = this.ChartElement
      this.ChartFramePaintingList.push(chartFramePaint)
    }
  }

  this.Loading = function () {
    this.IsLoadData = true
    this.LoadElement.style.display = "flex"
  }

  this.Loaded = function () {
    this.IsLoadData = false
    this.LoadElement.style.display = "none"
  }

  this.Draw = function () {
    // xAxis
    var xAxis = new XAxis()
    xAxis.Create(this.Canvas, this.OptCanvas, this.XOption)
    this.XAxis = xAxis
    // window
    console.log(this.ChartFramePaintingList)
    for (let i in this.ChartFramePaintingList) {
      switch (this.ChartFramePaintingList[i].Name) {
        case 'kLine':
          this.DrawKLineChart(i)
          break;
        case 'macd':

          break;
      }
    }
  }

  this.OptCanvasElement.onmousemove = function (e) {

  }

  this.OptCanvasElement.onmousedown = function (e) {

  }

  this.OptCanvasElement.onmouseup = function (e) {

  }

  this.OptCanvasElement.onmousewheel = function (e) {

  }

  this.OptCanvasElement.oncontextmenu = function (e) {

  }

  this.RequestHistoryData = function () {

  }

  this.RequestNewData = function (period, callback, start = 1577808000000, end) {
    this.Loading()
    // 判断数据是否存在，不存在则调用接口获取
    if (ChartData.getInstance().PeriodData[period]
      && ChartData.getInstance().PeriodData[period].Data.length > 0
      && start >= ChartData.getInstance().GetStartTimeOfPeriodData()
      && start <= ChartData.getInstance().GetEndTimeOfPeriodData()) {

      if (end
        && end >= ChartData.getInstance().GetStartTimeOfPeriodData()
        && end <= ChartData.getInstance().GetEndTimeOfPeriodData()) {
        // start 和 end 都存在已有的数据集中
        callback()
        return
      } else {
        // start 存在 已有数据集中，end 不存在以后数据集中
        start = ChartData.getInstance().GetEndTimeOfPeriodData()
      }
    }
    JSNetwork.HttpRequest({
      url: this.KLinesUrl,
      headers: {
        // "X-MBX-APIKEY": "gIu5ec7EO6ziqUIyL6btfVSpHVvU77J17p9gQpkMexBL6FI94HBukLRhvB51a2Wz"
      },
      data: {
        "symbol": "BNBUSDT",
        "interval": "1m",
        "limit": 1000,
        "startTime": start,
        // "endTime": end
      },
      type: "get",
      dataType: "json",
      async: true,
      success: function (data) {
        self.ProcessNewData(data, period, callback)
      }
    })
  }

  this.RequestRealTimeData = function () {

  }

  this.ProcessNewData = function (data, period, callback) {
    // 判断是否已有加载的数据
    var isExist = false
    if (ChartData.getInstance().PeriodData[period] && ChartData.getInstance().PeriodData[period].Data.length > 0) {
      isExist = true
    } else {
      ChartData.getInstance().PeriodData[period] = {}
      ChartData.getInstance().PeriodData[period].Data = new Array()
    }
    // 对数据进行处理
    for (let i in data) {
      var dataItem = new DataObj()
      dataItem['datetime'] = data[i][0]
      dataItem['open'] = data[i][1]
      dataItem['high'] = data[i][2]
      dataItem['low'] = data[i][3]
      dataItem['close'] = data[i][4]
      dataItem['volume'] = data[i][5]
      dataItem['closetime'] = data[i][6]

      if (i === 0 && isExist) continue

      ChartData.getInstance().PeriodData[period].Data.push(dataItem)
    }
    // 数据加载完成 执行回调
    callback()
  }

  this.LoadIndicatorData = function () {

  }

  this.RequestNewIndicatorData = function () {
    for (let i in this.IndicatorList) {
      if (this.IndicatorDataList[i]            // 该指标是否存在 
        && this.IndicatorDataList[i].PeriodData[this.IndicatorDataList[i].Period] // 是否存在对应的周期对象
        && this.IndicatorDataList[i].PeriodData[this.IndicatorDataList[i].Period].Data  // 是否存在对应的周期数据
      ) {

      }
    }
  }

  this.RequestHistoryIndicatorData = function () {

  }

  this.CalculationIndicator = function (indicatorName, kLineData) {
    var c = hxc3.IndicatorFormula.getClass(indicatorName);
    var indicator = new c();
    var iDatas = indicator.calculate(kLineData);
    return iDatas
  }

  this.ScaleKLine = function (e) {
    if (e > 0) {
      // 放大
      if (ChartSize.getInstance().CurScaleIndex <= 0) {
        return false
      }
      ChartSize.getInstance().CurScaleIndex--
    } else {
      // 缩小
      if (ChartSize.getInstance().CurScaleIndex >= ZOOM_SEED.length - 1) {
        return false
      }
      ChartSize.getInstance().CurScaleIndex++
    }
    this.ScreenKNum =
      Math.ceil((ChartSize.getInstance().ChartContentWidth - ChartSize.getInstance().YAxisWidth)
        / (ZOOM_SEED[ChartSize.getInstance().CurScaleIndex][0] + ZOOM_SEED[ChartSize.getInstance().CurScaleIndex][1]))
    return true
  }

  this.MoveData = function (step, isLeft) {

  }

  this.SplitData = function () {
    // 游标计算
    var leftDatasIndex = ChartData.getInstance().DataOffSet + 1 - this.ScreenKNum
    if (leftDatasIndex < 0 && ChartData.getInstance().DataOffSet - leftDatasIndex <= ChartData.getInstance().GetCurPeriodDataLength()) {
      ChartData.getInstance().DataOffSet -= leftDatasIndex
      leftDatasIndex = 0
    }
    // K线数据
    ChartData.getInstance().Data = ChartData.getInstance().GetCurPeriodData().slice(leftDatasIndex, ChartData.getInstance().DataOffSet == ChartData.getInstance().GetCurPeriodDataLength() ? -1 : ChartData.getInstance().DataOffSet)
    // 指标数据
  }

  this.DrawKLineChart = function (i) {
    this.ChartFramePaintingList[i].DrawChartFramePaint()
    this.ChartFramePaintingList[i].DrawChartPaint(function () {
      var yAxis = new YAxis()
      yAxis.Create(self.Canvas, self.OptCanvas, ChartData.getInstance().Data, self.ChartFramePaintingList[i].Option.yAxis)

      self.ChartFramePaintingList[i].Option.yAxis.unitPricePx = yAxis.UnitPricePx
      self.ChartFramePaintingList[i].Option.yAxis.Min = yAxis.Min
      self.ChartFramePaintingList[i].Option.yAxis.Max = yAxis.Max
      self.ChartFramePaintingList[i].XAxis = xAxis

      var kLine = new KLine()
      kLine.Create(self.Canvas, self.OptCanvas, self.ChartFramePaintingList[i].Option, self.ChartData.Data)

    })
    this.ChartFramePaintingList[i].DrawPicture()
  }
}

////////////////////////////////////////////
// 
//             图表Size
//
////////////////////////////////////////////
function ChartSize () {
  this.Instance = null
  //四周间距
  this.Left = 50;
  this.Right = 80;
  this.Top = 50;
  this.Bottom = 50;
  this.TitleHeight = 24;    //标题高度

  this.ChartScale = 2.3     //K线图表与指标图表的比例

  this.LeftToolWidthPx = 60
  this.TopToolHeightPx = 38

  this.YAxisWidth = 60
  this.XAxisHeight = 28

  this.ChartContentWidth
  this.ChartContentHeight

  this.TotalHeight
  this.TotalWidth

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

  this.GetTotalWidth = function () {
    return this.TotalWidth
  }

  this.GetTotalHeight = function () {
    return this.TotalHeight
  }

  this.GetChartWidth = function () {
    return this.ChartContentWidth
  }

  this.GetChartHeight = function () {
    return this.ChartContentHeight
  }

  this.GetChartRealHeight = function () {
    return this.ChartContentHeight - this.Top - this.Bottom
  }

  this.GetChartRealWidth = function () {
    return this.ChartContentWidth - this.Left - this.Right
  }

  this.GetLeft = function () {
    return this.Left
  }

  this.GetRight = function () {
    return this.Right
  }

  this.GetBottom = function () {
    return this.Bottom
  }

  this.GetTop = function () {
    return this.Top
  }

  this.GetTitleHeight = function () {
    return this.TitleHeight
  }
}

ChartSize.getInstance = function () {
  if (!this.Instance) {
    this.Instance = new ChartSize()
  }
  return this.Instance
}

////////////////////////////////////////////
// 
//             图形画法
//
////////////////////////////////////////////
function ChartPainting () {
  this.Canvas
  this.OptCanvas
  this.Option
  this.ChartData
}

// K线画法
function KLine () {
  this.newMethod = ChartPainting
  this.newMethod()
  delete this.newMethod

  this.ValueHeight        // 绘图区域的实际高度
  this.UnitPricePx        // 单位价格占据多少px
  this.UpColor = g_GoTopChartResource.UpColor
  this.DownColor = g_GoTopChartResource.DownColor

  this.Datas

  this.Create = function (canvas, optCanvas, option, datas) {
    this.Datas = datas
    this.Canvas = canvas
    this.OptCanvas = optCanvas
    this.Option = option

    this.UnitPricePx = this.Option['yAxis']['unitPricePx']
    this.ValueHeight = this.Option.height - ChartSize.getInstance().GetTop() - ChartSize.getInstance().GetTitleHeight() - ChartSize.getInstance().GetBottom()

    this.Draw()
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
        startY = this.Option.position.top + this.ValueHeight - (close - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
        endY = this.ValueHeight - (open - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
      }
    } else if (open > close) {
      this.Canvas.fillStyle = this.DownColor
      this.Canvas.strokeStyle = this.DownColor
      if (ZOOM_SEED[CurScaleIndex][0] > 2) {
        startY = this.Option.position.top + this.ValueHeight - (open - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
        endY = this.ValueHeight - (close - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
      }
    } else {
      this.Canvas.fillStyle = g_ThemeResource.FontColor
      this.Canvas.strokeStyle = g_ThemeResource.FontColor
      endY = this.Option.position.top + this.ValueHeight - (open - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
      startY = endY
    }
    startX = this.Option.position.left + WindowSizeOptions.padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * i
    endX = startX + ZOOM_SEED[CurScaleIndex][0]
    let h = endY - startY
    h < 1 && (h = 1)
    highpx = this.Option.position.top + this.ValueHeight - (high - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
    lowpx = this.Option.position.top + this.ValueHeight - (low - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
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

  this.DrawCloseLine = function () {
    const closePrice = parseFloat(this.Datas[this.Datas.length - 1].close)
    const openPrice = parseFloat(this.Datas[this.Datas.length - 1].open)
    const y = this.ValueHeight - (closePrice - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
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
    this.Canvas.fillRect(ToFixedRect(this.Option.width), ToFixedRect(y - 10), ToFixedRect(ChartSize.getInstance().YAxisWidth), ToFixedRect(20))
    this.Canvas.font = '12px san-serif'
    this.Canvas.fillStyle = g_GoTopChartResource.FontLightColor
    this.Canvas.fillText(closePrice, this.Option.width + 10, y + 5)
    this.Canvas.lineWidth = 1
    this.Canvas.setLineDash([0, 0])
    this.Canvas.strokeStyle = g_GoTopChartResource.FontLightColor
    this.Canvas.moveTo(ToFixedPoint(this.Option.width), ToFixedPoint(y))
    this.Canvas.lineTo(ToFixedPoint(this.Option.width) + 5, ToFixedPoint(y))
    this.Canvas.stroke()
    this.Canvas.closePath()
  }

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
    const maxX = ChartSize.getInstance().GetLeft() + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * maxIndex
    const maxY = this.ValueHeight - (max - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop()
    const maxTW = this.OptCanvas.measureText(max).width

    const minX = WindowSizeOptions.padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * minIndex
    const minY = this.ValueHeight - (min - this.Option['yAxis'].Min) * this.UnitPricePx + ChartSize.getInstance().GetTop()
    const minTW = this.OptCanvas.measureText(min).width

    this.Canvas.fillStyle = g_GoTopChartResource.FontLightColor
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

// X轴画法
function XAxis () {
  this.newMethod = ChartPainting
  this.newMethod()
  delete this.newMethod

  this.Data

  this.Create = function (canvas, optCanvas, option, data) {
    this.Canvas = canvas
    this.OptCanvas = optCanvas
    this.Option = option
    this.Data = data
    this.Draw()
  }

  /**
 * @description 开始绘制
 */
  this.Draw = function () {
    this.Canvas.beginPath()
    this.Canvas.strokeStyle = g_GoTopChartResource.FontColor
    this.Canvas.lineWidth = 1
    this.Canvas.setLineDash([0, 0])
    this.Canvas.moveTo(0, this.Option.position.top)
    this.Canvas.lineTo(this.Option.width, this.Option.position.top)
    this.Canvas.stroke()
    this.Canvas.closePath()
  }
}

// Y轴画法
function YAxis () {
  this.newMethod = ChartPainting
  this.newMethod()
  delete this.newMethod

  this.Min                    // Y轴上的最小值
  this.Max                    // Y轴上的最大值

  this.LabelList = new Array()

  this.ValueHeight            // Y轴实际高度范围
  this.UnitValue = 0          // Y轴上每段是多少
  this.UnitSpacing = 0        // Y轴上每段的间距是多少
  this.UnitPricePx = 0        // 单位值是多少px

  this.SplitNumber = 16       // Y轴要分为多少段
  this.Symmetrical = false    // 是否要求正负刻度对称
  this.Deviation = false      // 是否允许误差，即实际分出的段数不等于splitNumber

  this.Data
  this.Width = 60

  this.Create = function (canvas, optCanvas, datas, option, splitNumber) {
    this.Canvas = canvas
    this.OptCanvas = optCanvas
    this.Data = datas
    this.Option = option
    this.SplitNumber = splitNumber

    this.ValueHeight = this.Option.height - ChartSize.getInstance().GetTop() - ChartSize.getInstance().GetBottom() - ChartSize.getInstance().GetTitleHeight()

    this.CalculationMinMaxValue(this.Option.Key)
    this.CalculationUnitValue()
    this.CalculationUnitSpacing()
    this.CalculationLabelList()
    this.Draw()
  }

  /**
   * @description 计算最大值和最小值
   */
  this.CalculationMinMaxValue = function (...args) {
    if (this.Option.name === 'kLine') {
      this.Min = Math.min.apply(Math, this.Datas.map(function (o) { return parseFloat(o.low) }))
      this.Max = Math.max.apply(Math, this.Datas.map(function (o) { return parseFloat(o.high) }))
    } else {
      var minArray = []
      var maxArray = []

      for (let i in args) {
        minArray.push(Math.min.apply(Math, this.Datas.map(function (o) { return parseFloat(o[args[i]]) })))
        maxArray.push(Math.max.apply(Math, this.Datas.map(function (o) { return parseFloat(o[args[i]]) })))
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
        y: (this.Max - label) * this.UnitPricePx + ChartSize.getInstance().GetTitleHeight() + ChartSize.getInstance().GetTop() + this.Option.position.top
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
    this.Canvas.fillStyle = g_GoTopChartResource.FontColor
    this.Canvas.font = '12px sans-serif'
    this.LabelList.forEach((item, index, list) => {
      this.Canvas.fillText(item.label, this.Option.position.left + 10, item.y + 5)
    })
    this.Canvas.stroke()
    this.Canvas.closePath()

    this.Canvas.strokeStyle = g_GoTopChartResource.BorderColor
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
    this.Canvas.strokeStyle = g_GoTopChartResource.BorderColor
    this.Canvas.lineWidth = 0.5
    this.LabelList.forEach((item, index, list) => {
      this.Canvas.moveTo(0, ToFixedPoint(item.y))
      this.Canvas.lineTo(ChartSize.getInstance().GetChartWidth() - ChartSize.getInstance().YAxisWidth, ToFixedPoint(item.y))
    })
    this.Canvas.stroke()
    this.Canvas.closePath()

    this.Canvas.beginPath()
    this.Canvas.strokeStyle = g_GoTopChartResource.BorderColor
    this.Canvas.lineWidth = 2
    this.Canvas.moveTo(0, this.Option.position.top + this.Option.height)
    this.Canvas.lineTo(ChartSize.getInstance().GetChartWidth(), this.Option.position.top + this.Option.height)
    this.Canvas.stroke()
    this.Canvas.closePath()
  }
}

// MACD画法
function MACD () {
  this.newMethod = ChartPainting
  this.newMethod()
  delete this.newMethod

  this.Datas
  this.ZeroY = null

  this.Create = function (canvas, option, datas) {
    this.Canvas = canvas
    this.Option = option
    this.Datas = datas

    if (this.Option.yAxis.Min < 0) {
      this.ZeroY = this.Option.position.top + this.Option.height + ChartSize.getInstance().GetTitleHeight() - Math.abs(this.Option.yAxis.Min * this.Option.yAxis.unitPricePx)
    }

    this.Draw()
  }

  this.Draw = function () {
    this.Canvas.beginPath()
    this.Canvas.strokeStyle = this.Option.Style['DIFF']
    this.Canvas.lineWidth = 1
    for (var i = 0, j = this.Datas.length; i < j; i++) {
      this.DrawCurve(i, 'DIFF')
    }
    this.Canvas.stroke()
    this.Canvas.closePath()

    // DEA
    this.Canvas.beginPath()
    this.Canvas.strokeStyle = this.Option.Style['DEA']
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
    var StartX = ChartSize.getInstance().GetLeft() + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * i + ZOOM_SEED[CurScaleIndex][0] / 2 + this.Option.position.left
    if (parseFloat(this.Datas[i][attrName]) >= 0) {
      this.ZeroY != null ? StartY = this.ZeroY - (parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx) : this.StartY = this.Option.position.top + this.Option.height + ChartSize.getInstance().GetTitleHeight() - (parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx) - ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
    } else {
      StartY = this.ZeroY + (Math.abs(parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx))
    }
    if (i === 0) {
      this.Canvas.moveTo(StartX, StartY)
    }
    this.Canvas.lineTo(StartX, StartY)
  }

  this.DrawVerticalDownLine = function (i, attrName) {
    var StartX = ChartSize.getInstance().GetLeft() + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * i + ZOOM_SEED[CurScaleIndex][0] / 2 + this.Option.position.left
    this.Canvas.strokeStyle = this.Option.style['MACD']['down']
    var StartY = this.ZeroY + (Math.abs(parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx))
    this.Canvas.moveTo(StartX, StartY)
    this.Canvas.lineTo(StartX, this.ZeroY)
  }

  this.DrawVerticalUpLine = function (i, attrName) {
    var StartY
    var StartX = ChartSize.getInstance().GetLeft() + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * i + ZOOM_SEED[CurScaleIndex][0] / 2 + this.Option.position.left
    this.Canvas.strokeStyle = this.Option.style['MACD']['up']
    this.ZeroY != null ? StartY = this.ZeroY - (parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx) : StartY = this.Option.position.top + this.Option.height + ChartSize.getInstance().GetTitleHeight() - (parseFloat(this.Datas[i][attrName]) * this.Option.yAxis.unitPricePx) - ChartSize.getInstance().GetTop() + ChartSize.getInstance().GetTitleHeight()
    this.Canvas.moveTo(StartX, StartY)
    this.Canvas.lineTo(StartX, this.ZeroY)
  }
}

////////////////////////////////////////////
// 
//             图表框架框架画法
//
////////////////////////////////////////////
function ChartFramePainting () {
  this.ChartElement
  this.Option
  this.ChartTitlePainting
  this.DrawPictureList = new Array()
  this.Canvas
  this.OptCanvas
  this.XAxis
  this.YAxis
  this.Name
  this.ChartData

  this.DrawChartFramePaint = function () {
    // window title
    this.ChartTitlePainting = new ChartTitlePainting()
    this.ChartTitlePainting.ChartSize = ChartSize.getInstance()
    this.ChartElement.appendChild(this.ChartTitlePainting.Create(this.Option))
    this.ChartTitlePainting.CreateValueBoX()
  }

  this.DrawChartPaint = function (callback) {
    callback()
  }

  this.DrawPicture = function () {
    for (let i in this.DrawPictureList) {

    }
  }
}

////////////////////////////////////////////
// 
//             拓展图形画法
//
////////////////////////////////////////////
function ChartExtendPainting () {
  this.DivElement
  this.ParentDivElement
  this.FeaturesList = new Array()
  this.CurSelectIndex
}

// 顶部工具栏
function TopToolContainer () {
  this.newMethod = ChartExtendPainting
  this.newMethod()
  delete this.newMethod

  this.Width
  this.FeaturesList = [
    { id: 'goto_btn', divClass: 'item', divStyle: '', spanClass: 'iconfont icon-lsh-jump', spanStyle: 'margin-right:2px;', text: '跳转到' },
    { id: 'period-btn', divClass: 'item', divStyle: '', spanClass: '', spanStyle: '', text: '周 期' },
    { id: 'indicators-btn', divClass: 'item', divStyle: '', spanClass: 'iconfont icon-fx', spanStyle: 'margin-right:2px;', text: '指 标' },
    { id: 'pre-signal-btn', divClass: 'item', divStyle: '', spanClass: 'iconfont icon-xiayiye1', spanStyle: 'margin-right:2px;', text: '信 号' },
    { id: 'next-signal-btn', divClass: 'item', divStyle: '', spanClass: 'iconfont icon-xiayiye', spanStyle: 'margin-right:2px;', text: '' },
    { id: null, divClass: '', divStyle: 'flex-grow:1', spanClass: '', spanStyle: '', text: '' },
    { id: 'settings-btn', divClass: 'item', divStyle: 'border-left:1.5px solid #353d5a', spanClass: 'iconfont icon-shezhi', spanStyle: '', text: '' },
    { id: 'scale-big-btn', divClass: 'item', divStyle: '', spanClass: 'iconfont icon-quanping', spanStyle: '', text: '' },
    { id: 'shot-btn', divClass: 'item', divStyle: '', spanClass: 'iconfont icon-kuaizhao', spanStyle: '', text: '' },
  ]

  this.Create = function () {
    this.DivElement = document.createElement('div')
    this.DivElement.id = Guid()
    this.DivElement.className = "top-container"

    this.DivElement.style.width = this.Width + 'px'
    this.DivElement.style.height = g_GoTopChartResource.TopToolHeightPx + 'px'
    this.DivElement.style.backgroundColor = g_GoTopChartResource.BgColor
    this.DivElement.style.borderBottom = g_GoTopChartResource.BorderWidth[0] + "px solid " + g_GoTopChartResource.BorderColor

    this.HTML = ''

    for (let i in this.FeaturesList) {
      this.HTML +=
        '<div id="' + this.FeaturesList[i].id + '" class="' + this.FeaturesList[i].divClass + '" style="' + this.FeaturesList[i].divStyle + '"><span class="' + this.FeaturesList[i].spanClass + '" style="' + this.FeaturesList[i].spanStyle + '"></span>' + this.FeaturesList[i].text + '</div>'
    }

    this.DivElement.innerHTML = this.HTML
    return this.DivElement
  }

  this.SetWidth = function (width) {
    this.DivElement.style.width = width
  }

  this.RegisterClickEvent = function (callback) {
    for (let i in this.FeaturesList) {
      $('#' + this.FeaturesList[i].id).click(function (e) {
        callback(e)
      })
    }
  }
}

// 左侧工具栏
function LeftToolContainer () {
  this.newMethod = ChartExtendPainting
  this.newMethod()
  delete this.newMethod

  this.FeaturesList = [
    { id: 'cursor-tool', divClass: "draw-tool-item", divStyle: 'margin-top:10px', spanClass: 'iconfont icon-icongb', spanStyle: 'font-size: 30px;' },
    { id: 'line-tool', divClass: "draw-tool-item", divStyle: '', spanClass: 'iconfont icon-xianduan1', spanStyle: 'font-size: 30px;' },
    { id: 'rect-tool', divClass: "draw-tool-item", divStyle: '', spanClass: 'iconfont icon-juxing', spanStyle: 'font-size: 30px;' },
  ]

  this.Height

  this.Create = function () {
    this.DivElement = document.createElement('div')
    this.DivElement.id = Guid()
    this.DivElement.style.width = g_GoTopChartResource.LeftToolWidthPx + 'px'
    this.DivElement.style.height = this.Height + 'px'
    this.DivElement.style.backgroundColor = g_GoTopChartResource.BgColor
    this.DivElement.style.borderRight = g_GoTopChartResource.BorderWidth[0] + "px solid " + g_GoTopChartResource.BorderColor

    this.HTML = '<div style="text-align:center;height:40px;line-height:40px;width:60px;border-bottom:1px solid #353d5a"><span class="iconfont icon-caidan" style="font-size: 28px;color: #8d9bab;"></span></div>'

    for (let i in this.FeaturesList) {
      this.HTML += '<div id="' + this.FeaturesList[i].id + '" class="' + this.FeaturesList[i].divClass + '" style="' + this.FeaturesList[i].divStyle + '"><span class="' + this.FeaturesList[i].spanClass + '" style="' + this.FeaturesList[i].spanStyle + '"></span></div>'
    }

    this.DivElement.innerHTML = this.HTML
    return this.DivElement
  }

  this.SetHeight = function (height) {
    this.DivElement.style.height = height
  }

  this.RegisterClickEvent = function (callback) {
    for (let i in this.FeaturesList) {
      $('#' + this.FeaturesList[i].id).click(function (e) { callback(e) })
    }
  }
}

////////////////////////////////////////////
// 
//             画图工具
//
////////////////////////////////////////////
function ChartDrawPicture () {
  this.Canvas
  this.Position
  this.PointCount
  this.Color
  this.IsFinished
  this.IsSelect
  this.IsHover

  this.Create = function () {

  }

  this.SetPoint = function () {

  }

  this.UpdatePoint = function () {

  }

  this.Draw = function () {

  }

  this.DrawPoint = function () {

  }

  this.ClipFrame = function () {

  }

  this.IsPointInPath = function () {

  }

  this.IsPointInLine = function () {

  }

  this.IsPointInLine2 = function () {

  }
}

// 线段画法
function LineElement () {
  this.newMethod = ChartDrawPicture()
  this.newMethod()
  delete this.newMethod
}

// 矩形画法
function LineElement () {
  this.newMethod = ChartDrawPicture()
  this.newMethod()
  delete this.newMethod
}

////////////////////////////////////////////
// 
//             窗口基类
//
////////////////////////////////////////////
function DivDialog () {
  this.DivElement
  this.ParentDivElement
  this.IsHide

  this.Create = function () {

  }

  this.SetPosition = function () {

  }

  this.SetShow = function () {

  }

  this.SetHide = function () {

  }

  this.GetPosition = function () {

  }

  this.GetHeight = function () {

  }

  this.GetWidth = function () {

  }

  this.RegisterClickEvent = function () {

  }
}

// 画图右键操作窗口
function DrawPictureOptDialog () {
  this.newMethod = DivDialog()
  this.newMethod()
  delete this.newMethod
}

// 周期选择创库
function PeriodDialog () {
  this.newMethod = DivDialog()
  this.newMethod()
  delete this.newMethod
}

////////////////////////////////////////////
// 
//             标题画法
//
////////////////////////////////////////////
function ChartTitlePainting () {
  this.Name
  this.Option
  this.DivElement
  this.CurValue

  this.Create = function (option) {
    this.Name = option.name
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
    this.DivElement.style.width = ChartSize.getInstance().ChartContentWidth - ChartSize.getInstance().YAxisWidth - ChartSize.getInstance().GetLeft() - 20 + 'px'
    return this.DivElement
  }

  this.CreateValueBoX = function () {
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

  this.SetValue = function (curValue) {
    if (this.Name == 'kLine') {
      var colorStyle
      if (curValue['open'] > curValue['close']) {
        colorStyle = g_GoTopChartResource.DownColor
      } else if (curValue['open'] < curValue['close']) {
        colorStyle = g_GoTopChartResource.UpColor
      } else {
        colorStyle = g_GoTopChartResource.FontColor
      }
      for (let i in curValue) {
        $('#' + i).css('color', colorStyle)
        $('#' + i).text(curValue[i])
      }
    } else if (this.Name == 'macd') {
      for (let i in curValue) {
        if (i == 'MACD') {
          curValue[i] > 0 ? $('#' + i).css('color', this.Option.style[i].UP) : $('#' + i).css('color', this.Option.style[i].DOWN)
        } else {
          $('#' + i).css('color', this.Option.style[i])
        }
        $('#' + i).text(curValue[i].toFixed(4))
      }
    }
  }
}

////////////////////////////////////////////
// 
//             十字光标
//
////////////////////////////////////////////
function CrossCursor () {
  this.Canvas
  this.OptCanvas
  this.XAxisOption
  this.ChartFramePaintingList
  this.IsShow
  this.ChartData

  this.Create = function (canvas, optCanvas, frameList, xAxisOption) {
    this.Canvas = canvas
    this.OptCanvas = optCanvas
    this.ChartFramePaintingList = frameList
    this.XAxisOption = xAxisOption
  }

  this.Move = function (x, y) {
    let kn = Math.ceil(x / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0]))
    let cursorX = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * kn - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1]
    this.OptCanvas.beginPath()
    this.OptCanvas.strokeStyle = g_GoTopChartResource.FontColor
    this.OptCanvas.lineWidth = 1
    this.OptCanvas.setLineDash([5, 5])
    this.OptCanvas.moveTo(ToFixedPoint(cursorX), ToFixedPoint(0))
    this.OptCanvas.lineTo(ToFixedPoint(cursorX), ToFixedPoint(ChartSize.getInstance().ChartContentHeight - ChartSize.getInstance().XAxisHeight))
    this.OptCanvas.moveTo(ToFixedPoint(0), ToFixedPoint(y))
    this.OptCanvas.lineTo(ToFixedPoint(ChartSize.getInstance().ChartContentWidth - ChartSize.getInstance().YAxisWidth), ToFixedPoint(y))
    this.OptCanvas.stroke()
    this.OptCanvas.closePath()
    this.DrawLabel(kn, cursorX, y)
    return kn
  }

  this.DrawLabel = function (index, x, y) {

    let itemData = this.ChartData[index]
    const xtw = this.OptCanvas.measureText(itemData.datetime).width

    this.OptCanvas.beginPath()
    this.OptCanvas.clearRect(0, this.XAxisOption['position']['top'], this.XAxisOption['width'], this.XAxisOption['height'])
    this.OptCanvas.fillStyle = g_GoTopChartResource.BorderColor
    if (x < xtw / 2 + 10) {
      this.OptCanvas.fillRect(ToFixedRect(0), ToFixedRect(this.XAxisOption['position']['top']), ToFixedRect(xtw + 20), ToFixedRect(this.XAxisOption['height'] - 5))
      this.OptCanvas.font = "12px sans-serif"
      this.OptCanvas.fillStyle = g_GoTopChartResource.FontLightColor
      this.OptCanvas.fillText(itemData.datetime, ToFixedPoint(10), this.XAxisOption['position']['top'] + 18)
    } else {
      this.OptCanvas.fillRect(ToFixedRect(x - xtw / 2 - 10), ToFixedRect(this.XAxisOption['position']['top']), ToFixedRect(xtw + 20), ToFixedRect(this.XAxisOption['height'] - 5))
      this.OptCanvas.font = "12px sans-serif"
      this.OptCanvas.fillStyle = g_GoTopChartResource.FontLightColor
      this.OptCanvas.fillText(itemData.datetime, ToFixedPoint(x - xtw / 2), this.XAxisOption['position']['top'] + 18)
    }

    this.OptCanvas.strokeStyle = g_GoTopChartResource.FontLightColor
    this.OptCanvas.lineWidth = 1
    this.OptCanvas.moveTo(ToFixedPoint(x), ToFixedPoint(this.XAxisOption['position']['top']))
    this.OptCanvas.lineTo(ToFixedPoint(x), this.XAxisOption['position']['top'] + 5)

    this.OptCanvas.stroke()
    this.OptCanvas.closePath()

    var drawYAxisLabel = function (option) {
      self.OptCanvas.beginPath()
      self.OptCanvas.fillStyle = g_GoTopChartResource.BorderColor
      self.OptCanvas.fillRect(ToFixedRect(ChartSize.getInstance().ChartContentWidth - ChartSize.getInstance().YAxisWidth), ToFixedRect(y - 10), ToFixedRect(ChartSize.getInstance().YAxisWidth), ToFixedRect(20))
      self.OptCanvas.font = '12px san-serif'
      self.OptCanvas.fillStyle = g_GoTopChartResource.FontLightColor
      self.OptCanvas.fillText(((((option['height'] - ChartSize.getInstance().GetTop() - ChartSize.getInstance().GetBottom() - ChartSize.getInstance().GetTitleHeight()) - (y - option['position']['top'] - ChartSize.getInstance().GetTop() - ChartSize.getInstance().GetTitleHeight())) / option['yAxis'].unitPricePx) + option['yAxis'].Min).toFixed(4), ChartSize.getInstance().ChartContentWidth - ChartSize.getInstance().YAxisWidth + 10, y + 5)
      self.OptCanvas.lineWidth = 1
      self.OptCanvas.strokeStyle = g_GoTopChartResource.FontLightColor
      self.OptCanvas.moveTo(ChartSize.getInstance().ChartContentWidth - ChartSize.getInstance().YAxisWidth, ToFixedPoint(y))
      self.OptCanvas.lineTo(ChartSize.getInstance().ChartContentWidth - ChartSize.getInstance().YAxisWidth + 5, ToFixedPoint(y))
      self.OptCanvas.stroke()
      self.OptCanvas.closePath()
    }

    // 绘制Y轴上的标识
    for (let i in this.ChartFramePaintingList) {
      if (y < this.ChartFramePaintingList[i].Option['position']['top'] + this.ChartFramePaintingList[i].Option['height'] && y > this.ChartFramePaintingList[i].Option['position']['top']) {
        drawYAxisLabel(this.ChartFramePaintingList[i].Option)
      }
    }
  }
}

////////////////////////////////////////////
// 
//             图表数据处理基类
//
////////////////////////////////////////////
function DataObj () {
  var datetime
  var open
  var high
  var low
  var close         // 当前K线未结束则为最新价
  var volumn
  var closetime     // 收盘时间
}

function ChartData () {
  this.Instance = null
  this.Data = new Array()
  this.NewData
  this.DataOffSet
  this.Period
  this.Symbol
  this.PeriodData = {}

  this.AddHistoryData = function () {

  }

  this.AddRealTimeData = function () {

  }

  this.GetMinutePeriodData = function (period) {

  }

  this.GetDayPeriodData = function (period) {

  }

  this.GetPeriodData = function (period) {
  }

  this.GetCurPeriodData = function () {
    return this.PeriodData[this.Period].Data
  }

  this.GetCurShowData = function () {
    return Data
  }

  this.GetCurPeriodDataLength = function () {
    return this.PeriodData[this.Period].Data.length
  }

  this.GetEndTimeOfPeriodData = function () {
    return this.PeriodData[this.Period].Data[this.PeriodData[this.Period].Data.length - 1].datetime
  }

  this.GetStartTimeOfPeriodData = function () {
    return this.PeriodData[this.Period].Data[0].datetime
  }
}

ChartData.getInstance = function () {
  if (!this.Instance) {
    this.Instance = new ChartData()
  }
  return this.Instance
}

function IndicatorData () {
  this.newMethod = ChartData
  this.newMethod()
  delete this.newMethod

  this.Name
  this.KLineData

}

////////////////////////////////////////////
// 
//             全局颜色配置
//
////////////////////////////////////////////
function GoTopChartResource () {
  this.TopToolHeightPx = 38
  this.LeftToolWidthPx = 60

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

  this.Domain = "https://api.binance.com"
}

var g_GoTopChartResource = new GoTopChartResource()
var pixelTatio = GetDevicePixelRatio();
//周期条件枚举
var CONDITION_PERIOD =
{
  //K线周期  1d=日线 1w=周线 1M=月线 1y=年线 1m=1分钟 5m=5分钟 15m=15分钟 30m=30分钟 1h=60分钟
  KLINE_DAY_ID: "1d",
  KLINE_WEEK_ID: "1w",
  KLINE_MONTH_ID: "1M",
  KLINE_YEAR_ID: "1y",
  KLINE_MINUTE_ID: "1m",
  KLINE_5_MINUTE_ID: "5m",
  KLINE_15_MINUTE_ID: "15m",
  KLINE_30_MINUTE_ID: "30m",
  KLINE_60_MINUTE_ID: "1h"
};

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