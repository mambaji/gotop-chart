'use strict'


function GoTopChart (divElement) {
  this.DivElement = divElement
  this.DivElement.style.display = "flex"

  this.RightElement = document.createElement('div')
  this.ChartContainerElement = document.createElement('div')
  this.ChartContainerElement.className = 'chart-container'
  this.ChartContainerElement.id = 'chart-container-id'
  this.TopToolContainer = new TopToolContainer()
  this.TopToolElement = this.TopToolContainer.Create(0)
  this.LeftToolContainer = new LeftToolContainer()
  this.LeftToolElement = this.LeftToolContainer.Create(0)
  this.XAxis = new XAxis()
  this.XAxisElement
  this.CrossCursor = new CrossCursor()
  this.KLineDatasFix = new KLineDatasFix()

  this.DivElement.appendChild(this.LeftToolElement)
  this.DivElement.appendChild(this.RightElement)
  this.RightElement.appendChild(this.TopToolElement)
  this.RightElement.appendChild(this.ChartContainerElement)

  this.WindowFrameList = []
  this.WindowFrameSort = []
  this.Options

  let isDrag = false
  let drag = {
    click: {

    },
    lastMove: {

    }
  }
  let downX = 0

  let self = this

  /**
   * @description 获取宽高
   */
  this.OnSize = function () {
    // chart 整体大小
    WindowSizeOptions.height = parseInt(this.DivElement.style.height.replace("px", ""));
    WindowSizeOptions.width = parseInt(this.DivElement.style.width.replace("px", ""))

    this.RightElement.style.width = WindowSizeOptions.width - WindowSizeOptions.leftToolContainerWidth - g_ThemeResource.BorderWidth[0] + 'px'
    this.RightElement.style.height = WindowSizeOptions.height + 'px'
    this.TopToolElement.style.width = this.RightElement.style.width
    this.LeftToolElement.style.height = WindowSizeOptions.height + 'px'
    // 画布窗口大小
    WindowSizeOptions.chartContainerWidth = WindowSizeOptions.width - WindowSizeOptions.leftToolContainerWidth - g_ThemeResource.BorderWidth[0]
    WindowSizeOptions.chartContainerHeight = WindowSizeOptions.height - WindowSizeOptions.topToolContainerHeight - g_ThemeResource.BorderWidth[0] - WindowSizeOptions.xAxisContainerHeight
    KNum = Math.ceil((WindowSizeOptions.chartContainerWidth - WindowSizeOptions.yAxisContainerWidth) / (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]))
    this.KLineDatasFix.SplitDatas()
  }
  /**
   * @description 初始化配置
   * @param {配置} option 
   */
  this.SetOption = function (option) {
    this.Options = option
    // 清除图标element 和 x轴element
    $("#" + this.ChartContainerElement.id).empty()
    this.WindowFrameList = []
    if (this.RightElement.lastChild.id == 'xaxis') {
      this.RightElement.removeChild(this.RightElement.lastChild)
    }

    var kLineWindow = new WindowFrame()
    var div = kLineWindow.CreateFrame('kline', 'kline', 1)
    this.ChartContainerElement.appendChild(div)
    this.WindowFrameList.push(kLineWindow)
    this.Draw()
  }
  /**
   * @description 绘制
   */
  this.Draw = function () {
    // 循环绘制窗口框架
    this.XAxisElement = this.XAxis.Create()
    this.RightElement.appendChild(this.XAxisElement)
    this.XAxis.Draw()
    this.CrossCursor.Create(this.WindowFrameList, this.XAxis)
    this.WindowFrameList.forEach((item, index, list) => {
      if (item.Name == 'kline') {
        var yAxis = new YAxis()
        yAxis.Create(item, KLineDatas)
        item.YAxis = yAxis
        var kline = new KLine(KLineDatas)
        kline.Create(item)
      }
    })
  }
  /**
   * @description 鼠标事件监听
   */
  this.ChartContainerElement.onmousemove = function (e) {
    if (!isDrag) {
      self.CrossCursor.Move((e.offsetX) * pixelTatio, (e.offsetY) * pixelTatio)
    }
  }
  this.ChartContainerElement.onmousewheel = function (e) {
    if (self.KLineDatasFix.ScaleKLine(e.wheelDelta)) {
      self.KLineDatasFix.SplitDatas()
      self.SetOption(self.Options)
    }
  }
  this.ChartContainerElement.onmousedown = function (e) {
    isDrag = true
    drag.click.X = e.clientX
    drag.click.Y = e.clientY
    drag.lastMove.X = e.clientX
    drag.lastMove.Y = e.clientY
    document.onmousemove = function (e) {
      let moveStep = Math.abs(drag.lastMove.X - e.clientX)
      if (isDrag) {
        if (moveStep < 5) return
        let isLeft = true
        if (drag.lastMove.X < e.clientX) isLeft = false
        if (self.KLineDatasFix.MoveDatas(moveStep, isLeft)) {
          self.KLineDatasFix.SplitDatas()
          self.SetOption(self.Options)
          drag.lastMove.X = e.clientX
          drag.lastMove.Y = e.clientY
        }
      }
    }
  }
  this.ChartContainerElement.onmouseup = function (e) {
    isDrag = false
  }

}

// chart 实例化
GoTopChart.Init = function (divElement) {
  var chart = new GoTopChart(divElement)
  return chart
}

function WindowFrame () {
  this.Width
  this.Height
  // 数据宽度
  this.DataWidth
  // 数据距离
  this.DistanceWidth
  this.YAxisWidth
  this.Top
  this.Left
  this.Padding = {
    top: 20,
    bottom: 20,
    left: 0,
    right: 0
  }
  this.Name
  this.Type
  this.MainCanvas
  this.YAxis
  this.YAxisCanvas
  this.OptMainCanvas
  this.OptYAxisCanvas
  this.TitleTool
  this.OptTool
  this.SortIndex
  this.WindowFrameDiv
  this.MainCanvasElement
  this.OptMainCanvasElement
  this.YAxisCanvasElement
  this.OptYAxisCanvasElement

  /**
   * @description 创建窗口框架
   * @param {*} name 
   * @param {*} type 
   * @param {*} width 
   * @param {*} height 
   * @param {*} yAxisWidth 
   * @param {*} sortIndex 
   */
  this.CreateFrame = function (name, type, sortIndex) {
    this.Width = WindowSizeOptions.chartContainerWidth
    this.Height = WindowSizeOptions.chartContainerHeight
    this.YAxisWidth = WindowSizeOptions.yAxisContainerWidth
    this.Name = name
    this.Type = type
    this.SortIndex = sortIndex

    this.WindowFrameDiv = document.createElement("div")
    this.MainCanvasElement = document.createElement("canvas")
    this.OptMainCanvasElement = document.createElement("canvas")
    this.YAxisCanvasElement = document.createElement("canvas")
    this.OptYAxisCanvasElement = document.createElement("canvas")

    this.WindowFrameDiv.id = Guid()
    this.MainCanvasElement.id = Guid()
    this.YAxisCanvasElement.id = Guid()
    this.OptMainCanvasElement.id = Guid()
    this.OptYAxisCanvasElement.id = Guid()

    this.WindowFrameDiv.style.backgroundColor = g_ThemeResource.BgColor
    this.WindowFrameDiv.className = "window-frame"
    this.MainCanvasElement.className = "jschart-drawing"
    this.OptMainCanvasElement.className = "jschart-drawing-opt"
    this.YAxisCanvasElement.className = "y-axis"
    this.OptYAxisCanvasElement.className = "y-axis-opt"

    this.calculationSize(this.Height, this.Width)

    // 事件绑定
    this.OptMainCanvasElement.onmousemove = function (e) {

    }
    this.OptMainCanvasElement.onmousewheel = function (e) {

    }
    this.OptMainCanvasElement.ondblclick = function (e) {

    }
    this.OptMainCanvasElement.onmousedown = function (e) {

    }
    this.OptMainCanvasElement.onmouseup = function (e) {

    }

    this.WindowFrameDiv.appendChild(this.MainCanvasElement)
    this.WindowFrameDiv.appendChild(this.OptMainCanvasElement)
    this.WindowFrameDiv.appendChild(this.YAxisCanvasElement)
    this.WindowFrameDiv.appendChild(this.OptYAxisCanvasElement)

    this.MainCanvas = this.MainCanvasElement.getContext('2d')
    this.OptMainCanvas = this.OptMainCanvasElement.getContext('2d')
    this.YAxisCanvas = this.YAxisCanvasElement.getContext('2d')
    this.OptYAxisCanvas = this.OptYAxisCanvasElement.getContext('2d')

    return this.WindowFrameDiv
  }

  /**
   * @description 为canvas的 height 和 width 赋值
   * @param {高度} height 
   * @param {宽度} width 
   */
  this.calculationSize = function (height, width) {
    //获取设备的分辨率，物理像素与css像素的比值
    this.WindowFrameDiv.style.height = height + 'px'
    this.WindowFrameDiv.style.width = width + 'px'
    this.MainCanvasElement.width = (width - (this.YAxisWidth)) * pixelTatio
    this.OptMainCanvasElement.width = (width - (this.YAxisWidth)) * pixelTatio
    this.MainCanvasElement.height = height * pixelTatio
    this.OptMainCanvasElement.height = height * pixelTatio
    this.MainCanvasElement.style.width = (width - (this.YAxisWidth)) + 'px'
    this.OptMainCanvasElement.style.width = (width - (this.YAxisWidth)) + 'px'
    this.MainCanvasElement.style.height = height + 'px'
    this.OptMainCanvasElement.style.height = height + 'px'
    this.YAxisCanvasElement.width = (this.YAxisWidth) * pixelTatio
    this.OptYAxisCanvasElement.width = (this.YAxisWidth) * pixelTatio
    this.YAxisCanvasElement.height = height * pixelTatio
    this.OptYAxisCanvasElement.height = height * pixelTatio
    this.YAxisCanvasElement.style.width = (this.YAxisWidth) + 'px'
    this.OptYAxisCanvasElement.style.width = (this.YAxisWidth) + 'px'
    this.YAxisCanvasElement.style.height = height + 'px'
    this.OptYAxisCanvasElement.style.height = height + 'px'
    this.MainCanvasElement.style.left = 0 + 'px'
    this.MainCanvasElement.style.top = 0 + 'px'
    this.OptMainCanvasElement.style.left = 0 + 'px'
    this.OptMainCanvasElement.style.top = 0 + 'px'
    this.YAxisCanvasElement.style.left = this.MainCanvasElement.style.width
    this.OptYAxisCanvasElement.style.left = this.MainCanvasElement.style.width
    this.YAxisCanvasElement.style.top = 0 + 'px'
    this.OptYAxisCanvasElement.style.top = 0 + 'px'
  }

  this.CanvasMove = function () {

  }


}

function KLine (datas) {
  this.Datas = datas
  this.ScaleList
  this.WindowFrame
  this.NumOfPeriodOneScreen
  this.UnitPricePx
  this.WindowFrame
  this.Canvas
  this.OptCanvas
  this.UpColor = g_ThemeResource.UpColor
  this.DownColor = g_ThemeResource.DownColor
  this.MaxHigh
  this.MinLow
  this.Create = function (windowFrame) {
    this.WindowFrame = windowFrame
    this.Canvas = this.WindowFrame.MainCanvas
    this.OptCanvas = this.WindowFrame.OptMainCanvas
    this.UnitPricePx = this.WindowFrame.YAxis.UnitPricePx
    this.Draw()
    this.DrawCloseLine()
    this.DrawMaxHighAndMinLow()
  }
  this.Update = function (windowFrame) {
    this.WindowFrame = windowFrame
    this.Canvas = this.WindowFrame.Canvas
    this.Draw()
  }
  this.Draw = function () {
    this.Datas.forEach((item, index, list) => {
      this.DrawKLines(index, parseFloat(item.open), parseFloat(item.close), parseFloat(item.high), parseFloat(item.low))
    })
  }
  this.DrawKLines = function (i, open, close, high, low) {
    var startX, startY, endX, endY, lowpx, highpx
    const valueHeight = this.WindowFrame.Height - this.WindowFrame.Padding.top - this.WindowFrame.Padding.bottom
    this.Canvas.beginPath()
    // datawith<=4 只绘制竖线
    if (open < close) {
      this.Canvas.fillStyle = this.UpColor
      this.Canvas.strokeStyle = this.UpColor
      if (ZOOM_SEED[CurScaleIndex][0] > 2) {
        startY = valueHeight - (close - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
        endY = valueHeight - (open - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
      }
    } else if (open > close) {
      this.Canvas.fillStyle = this.DownColor
      this.Canvas.strokeStyle = this.DownColor
      if (ZOOM_SEED[CurScaleIndex][0] > 2) {
        startY = valueHeight - (open - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
        endY = valueHeight - (close - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
      }
    } else {
      this.Canvas.fillStyle = g_ThemeResource.FontColor
      this.Canvas.strokeStyle = g_ThemeResource.FontColor
      endY = valueHeight - (open - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
      startY = endY
    }
    startX = this.WindowFrame.Padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * i
    endX = startX + ZOOM_SEED[CurScaleIndex][0]
    var h = endY - startY
    h < 1 && (h = 1)
    highpx = valueHeight - (high - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
    lowpx = valueHeight - (low - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
    this.Canvas.lineWidth = 1
    if (ZOOM_SEED[CurScaleIndex][0] > 2) {
      this.Canvas.fillRect(ToFixedRect(startX), ToFixedRect(startY), ToFixedRect(endX - startX), ToFixedRect(h))
    }
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
    const valueHeight = this.WindowFrame.Height - this.WindowFrame.Padding.top - this.WindowFrame.Padding.bottom
    const y = valueHeight - (closePrice - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
    // if (closePrice < openPrice) {
    //   this.Canvas.strokeStyle = this.DownColor
    // } else {
    //   this.Canvas.strokeStyle = this.UpColor
    // }
    // 绘制收盘线
    // this.Canvas.lineWidth = 1.5
    // this.Canvas.setLineDash([1.5, 1.5])
    // this.Canvas.moveTo(0, y)
    // this.Canvas.lineTo(this.WindowFrame.Width - this.WindowFrame.YAxisWidth, y)
    // this.Canvas.stroke()
    // this.Canvas.closePath()
    // 绘制Y轴上的标识
    this.WindowFrame.YAxisCanvas.fillStyle = this.Canvas.strokeStyle
    this.WindowFrame.YAxisCanvas.fillRect(ToFixedRect(0), ToFixedRect(y - 10), ToFixedRect(this.WindowFrame.YAxisWidth), ToFixedRect(20))
    this.WindowFrame.YAxisCanvas.font = '12px san-serif'
    this.WindowFrame.YAxisCanvas.fillStyle = g_ThemeResource.FontLightColor
    this.WindowFrame.YAxisCanvas.fillText(closePrice, 10, y + 5)
    this.WindowFrame.YAxisCanvas.lineWidth = 1
    this.WindowFrame.YAxisCanvas.strokeStyle = g_ThemeResource.FontLightColor
    this.WindowFrame.YAxisCanvas.moveTo(0, ToFixedPoint(y))
    this.WindowFrame.YAxisCanvas.lineTo(5, ToFixedPoint(y))
    this.WindowFrame.YAxisCanvas.stroke()
  }
  /**
   * @description 绘制一屏中K线的最高点和最低点
   */
  this.DrawMaxHighAndMinLow = function () {
    const valueHeight = this.WindowFrame.Height - this.WindowFrame.Padding.top - this.WindowFrame.Padding.bottom
    let max = 0
    let maxIndex = 0
    let min = 0
    let minIndex = 0
    this.Datas.forEach((item, index, list) => {
      if (max < item.high) {
        max = item.high
        maxIndex = index
      }
      if (min == 0 || min > item.low) {
        min = item.low
        minIndex = index
      }
    })
    const maxX = this.WindowFrame.Padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * maxIndex
    const maxY = valueHeight - (max - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
    const maxTW = this.OptCanvas.measureText(max).width

    const minX = this.WindowFrame.Padding.left + (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * minIndex
    const minY = valueHeight - (min - this.WindowFrame.YAxis.Min) * this.UnitPricePx + this.WindowFrame.Padding.top
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
  this.WindowFrame
  this.Canvas
  this.Create = function (windowFrame, datas) {
    this.Datas = datas
    this.WindowFrame = windowFrame
    this.Canvas = this.WindowFrame.YAxisCanvas
    this.CalculationMinMaxValue()
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
  this.CalculationMinMaxValue = function () {
    if (this.WindowFrame.Type == 'kline') {
      this.Min = Math.min.apply(Math, this.Datas.map(function (o) { return parseFloat(o.low) }))
      this.Max = Math.max.apply(Math, this.Datas.map(function (o) { return parseFloat(o.high) }))
    } else if (this.WindowFrame.Type == 'indicator') {
      let minArray, maxArray = []
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
    splitNumber = 16;//理想的刻度间隔段数，即希望刻度区间有多少段
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
    const valueHeight = this.WindowFrame.Height - this.WindowFrame.Padding.top - this.WindowFrame.Padding.bottom
    this.UnitPricePx = valueHeight / (this.Max - this.Min)
    this.UnitSpacing = this.UnitValue * this.UnitPricePx
  }
  /**
   * @description 计算Label数组
   */
  this.CalculationLabelList = function () {
    const valueHeight = this.WindowFrame.Height - this.WindowFrame.Padding.top - this.WindowFrame.Padding.bottom
    let label = this.Min
    while (label <= this.Max) {
      let item = {
        label: label,
        y: (this.Max - label) * this.UnitPricePx + this.WindowFrame.Padding.top
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
    this.Canvas.strokeStyle = g_ThemeResource.FontColor
    this.Canvas.lineWidth = 1
    this.Canvas.moveTo(0, 0)
    this.Canvas.lineTo(0, this.WindowFrame.Height)
    this.Canvas.fillStyle = g_ThemeResource.FontColor
    this.Canvas.font = '12px sans-serif'
    this.LabelList.forEach((item, index, list) => {
      this.Canvas.moveTo(0, ToFixedPoint(item.y))
      this.Canvas.lineTo(5, ToFixedPoint(item.y))
      this.Canvas.fillText(item.label, 10, item.y + 5)
      this.WindowFrame.MainCanvas.moveTo(0, ToFixedPoint(item.y))
      this.WindowFrame.MainCanvas.lineTo(this.WindowFrame.Width - this.WindowFrame.YAxisWidth, ToFixedPoint(item.y))
    })
    this.Canvas.stroke()
    this.Canvas.closePath()

    // 网格线绘制
    this.WindowFrame.MainCanvas.beginPath()
    this.WindowFrame.MainCanvas.strokeStyle = g_ThemeResource.BorderColor
    this.WindowFrame.MainCanvas.lineWidth = 0.5
    this.LabelList.forEach((item, index, list) => {
      this.WindowFrame.MainCanvas.moveTo(0, ToFixedPoint(item.y))
      this.WindowFrame.MainCanvas.lineTo(this.WindowFrame.Width - this.WindowFrame.YAxisWidth, ToFixedPoint(item.y))
    })
    this.WindowFrame.MainCanvas.stroke()
    this.WindowFrame.MainCanvas.closePath()
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

  this.Create = function () {
    this.Width = WindowSizeOptions.chartContainerWidth
    this.Height = WindowSizeOptions.xAxisContainerHeight
    this.XAxisDiv = document.createElement('div')
    this.XAxisDiv.id = 'xaxis'
    this.XAxisDiv.style.position = 'relative'
    this.XAxisDiv.style.height = this.Height + 'px'
    this.XAxisDiv.style.width = this.Width + 'px'
    this.XAxisDiv.style.backgroundColor = g_ThemeResource.BgColor

    this.XAxisElement = document.createElement('canvas')
    this.OptXAxisElement = document.createElement('canvas')
    this.XAxisElement.className = 'jschart-drawing'
    this.OptXAxisElement.className = 'jschart-opt-drawing'

    this.XAxisElement.width = this.Width * pixelTatio
    this.XAxisElement.height = this.Height * pixelTatio
    this.XAxisElement.style.width = this.Width + 'px'
    this.XAxisElement.style.height = this.Height + 'px'
    this.XAxisCanvas = this.XAxisElement.getContext('2d')

    this.OptXAxisElement.width = this.Width * pixelTatio
    this.OptXAxisElement.height = this.Height * pixelTatio
    this.OptXAxisElement.style.width = this.Width + 'px'
    this.OptXAxisElement.style.height = this.Height + 'px'
    this.OptXAxisCanvas = this.OptXAxisElement.getContext('2d')

    this.XAxisDiv.appendChild(this.XAxisElement)
    this.XAxisDiv.appendChild(this.OptXAxisElement)
    return this.XAxisDiv
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
    this.XAxisCanvas.moveTo(0, 0)
    this.XAxisCanvas.lineTo(this.Width, 0)
    this.XAxisCanvas.stroke()
    this.XAxisCanvas.closePath()
  }
  /**
   * @description 数据更新，重新绘制
   */
  this.Update = function () {

  }

}

function Indicator () {
  this.Name
  // 指标运算数据
  this.IndicatorData
  this.Option
  this.UnitValueInPx
  this.WindowFrame

  this.Create = function (name, indicatorData, option, unitValueInPx, windowFrame) {

  }
  this.Draw = function () {

  }
  this.Update = function (indicatorData, option, unitValueInPx) {

  }
}

// 十字光标
function CrossCursor () {
  this.X
  this.Y
  this.WindowFrameList
  this.XAxis
  this.Create = function (windowFrameList, xAxis) {
    this.WindowFrameList = windowFrameList
    this.XAxis = xAxis
  }
  this.Move = function (x, y) {
    let kn = Math.ceil(x / (ZOOM_SEED[CurScaleIndex][1] + ZOOM_SEED[CurScaleIndex][0]))
    let cursorX = (ZOOM_SEED[CurScaleIndex][0] + ZOOM_SEED[CurScaleIndex][1]) * kn - ZOOM_SEED[CurScaleIndex][0] / 2 - ZOOM_SEED[CurScaleIndex][1]
    let self = this
    this.WindowFrameList.forEach((item, index, list) => {
      item.OptMainCanvas.beginPath()
      item.OptMainCanvas.clearRect(0, 0, item.Width - item.YAxisWidth, item.Height)
      item.OptMainCanvas.strokeStyle = g_ThemeResource.FontColor
      item.OptMainCanvas.lineWidth = 1
      item.OptMainCanvas.setLineDash([5, 5])
      item.OptMainCanvas.moveTo(ToFixedPoint(cursorX), ToFixedPoint(0))
      item.OptMainCanvas.lineTo(ToFixedPoint(cursorX), ToFixedPoint(item.Height))
      item.OptMainCanvas.moveTo(ToFixedPoint(0), ToFixedPoint(y))
      item.OptMainCanvas.lineTo(ToFixedPoint(item.Width - item.YAxisWidth), ToFixedPoint(y))
      item.OptMainCanvas.stroke()
      item.OptMainCanvas.closePath()
      self.DrawLabel(kn, item, cursorX, y)
    })
  }
  this.DrawLabel = function (index, item, x, y) {

    let itemData = KLineDatas[index]
    const xtw = this.XAxis.OptXAxisCanvas.measureText(itemData.datetime).width

    this.XAxis.OptXAxisCanvas.beginPath()
    this.XAxis.OptXAxisCanvas.clearRect(0, 0, this.XAxis.Width, this.XAxis.Height)
    this.XAxis.OptXAxisCanvas.fillStyle = g_ThemeResource.BorderColor
    if (x < xtw / 2 + 10) {
      this.XAxis.OptXAxisCanvas.fillRect(ToFixedRect(0), ToFixedRect(0), ToFixedRect(xtw + 20), ToFixedRect(this.XAxis.Height - 5))
      this.XAxis.OptXAxisCanvas.font = "12px sans-serif"
      this.XAxis.OptXAxisCanvas.fillStyle = g_ThemeResource.FontLightColor
      this.XAxis.OptXAxisCanvas.fillText(itemData.datetime, ToFixedPoint(10), 18)
    } else {
      this.XAxis.OptXAxisCanvas.fillRect(ToFixedRect(x - xtw / 2 - 10), ToFixedRect(0), ToFixedRect(xtw + 20), ToFixedRect(this.XAxis.Height - 5))
      this.XAxis.OptXAxisCanvas.font = "12px sans-serif"
      this.XAxis.OptXAxisCanvas.fillStyle = g_ThemeResource.FontLightColor
      this.XAxis.OptXAxisCanvas.fillText(itemData.datetime, ToFixedPoint(x - xtw / 2), 18)
    }

    this.XAxis.OptXAxisCanvas.strokeStyle = g_ThemeResource.FontLightColor
    this.XAxis.OptXAxisCanvas.lineWidth = 1
    this.XAxis.OptXAxisCanvas.moveTo(ToFixedPoint(x), ToFixedPoint(0))
    this.XAxis.OptXAxisCanvas.lineTo(ToFixedPoint(x), 5)

    this.XAxis.OptXAxisCanvas.stroke()
    this.XAxis.OptXAxisCanvas.closePath()

    // 绘制Y轴上的标识
    item.OptYAxisCanvas.beginPath()
    item.OptYAxisCanvas.clearRect(0, 0, item.YAxisWidth, item.Height)
    item.OptYAxisCanvas.fillStyle = g_ThemeResource.BorderColor
    item.OptYAxisCanvas.fillRect(ToFixedRect(0), ToFixedRect(y - 10), ToFixedRect(item.YAxisWidth), ToFixedRect(20))
    item.OptYAxisCanvas.font = '12px san-serif'
    item.OptYAxisCanvas.fillStyle = g_ThemeResource.FontLightColor
    item.OptYAxisCanvas.fillText(((((item.Height - item.Padding.top - item.Padding.bottom) - (y - item.Padding.top)) / item.YAxis.UnitPricePx) + item.YAxis.Min).toFixed(4), 10, y + 5)
    item.OptYAxisCanvas.lineWidth = 1
    item.OptYAxisCanvas.strokeStyle = g_ThemeResource.FontLightColor
    item.OptYAxisCanvas.moveTo(0, ToFixedPoint(y))
    item.OptYAxisCanvas.lineTo(5, ToFixedPoint(y))
    item.OptYAxisCanvas.stroke()
    item.OptYAxisCanvas.closePath()

  }
  this.Clear = function () {

  }
}

function BasicCurve () {

}


function BasicRect () {

}

// windowFrame 左上角标题工具栏
function TitleTool () {
  this.Name
  this.Value = {

  }
  this.IsHide = false
  this.WindowFrame
  /**
   * @description 创建组件
   * @param {名称} name 
   * @param {初始值} value 
   * @param {窗口框架} windowFrame 
   */
  this.Create = function (name, value, windowFrame) {

  }
  /**
   * @description 更新
   * @param {名称} name 
   * @param {更新值} value 
   */
  this.Update = function (name, value) {

  }
  /**
   * @description 隐藏组件
   */
  this.Hide = function () {

  }
  /**
   * @description 整个窗口框架关闭
   */
  this.Close = function () {

  }
  /**
   * @description 指标设置
   */
  this.Settings = function () {

  }
}

// 顶部工具栏容器
function TopToolContainer () {
  this.FeaturesList
  this.CurSelectIndex
  this.Width
  this.Height = 60
  this.Create = function (width) {
    this.Width = width
    this.DivElement = document.createElement('div')
    this.DivElement.id = Guid()
    this.DivElement.style.width = this.Width + 'px'
    this.DivElement.style.height = this.Height + 'px'
    this.DivElement.style.backgroundColor = g_ThemeResource.BgColor
    this.DivElement.style.borderBottom = g_ThemeResource.BorderWidth[0] + "px solid " + g_ThemeResource.BorderColor
    return this.DivElement
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
    return this.DivElement
  }
}

// 周期选择Dialog
function PeriodDialog () {
  this.PeriodList
  this.CurSelectIndex
  this.Create = function () {

  }
}

// 指标选择Dialog
function IndicatorSelectDialog () {
  this.IndicatorLists
  this.CategoryLists
  this.CurSelectCategoryIndex
  this.CurSelectIndicatorIndex
  this.Create = function () {

  }
}

// 指标配置Dialog
function IndicatorConfigDialog () {
  this.Name
  this.Params
  this.Style
  this.TabList = [
    '参数',
    '样式'
  ]
  this.CurTabIndex
  this.OriginalConfig = {}
  this.ChangeConfig = {}

  this.Create = function () {

  }
  this.Close = function () {

  }
  this.ConfigStyle = function () {

  }
  this.ConfigParams = function () {

  }
  this.CancelDialog = function () {

  }
  this.ComfirmDialog = function () {

  }
}

// 跳转时间Dialog
function GoToTimeDialog () {
  this.CurTime
  this.CurDate
  this.ToTime
  this.ToDate

  this.GoTo = function () {

  }
}

// 主题设置Dialog
function ThemeSettingsDialog () {
  this.BgColor = "#1f1f36"
  this.BorderColor = "#3c4564"
  this.FontColor = "#bfcbd9"
  this.FontLightColor = "#ffffff"
  this.UpColor = "#26a69a"
  this.DownColor = "#ef5350"
  this.BorderWidth = [3, 1]
  this.SettingsList

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

// K线数据处理类
function KLineDatasFix () {
  this.Period
  this.Datas
  this.PeriodDatasMap
  this.ChartDatas = new ChartDatas()
  this.StepPixel = 4 // 移动多少个像素为一单元
  this.MetaLabelLists = [
    CONDITION_PERIOD.KLINE_MINUTE_ID,
    CONDITION_PERIOD.KLINE_60_MINUTE_ID,
    CONDITION_PERIOD.KLINE_DAY_ID
  ]
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

  this.MoveDatas = function (step, isLeft) {
    if (isLeft) {
      CurDataOffset != chartDatas.Datas.length - 1 && (CurDataOffset += Math.ceil(8 / ZOOM_SEED[CurScaleIndex][0]))
    } else {
      LeftDatasIndex != 0 && (CurDataOffset -= Math.ceil(8 / ZOOM_SEED[CurScaleIndex][0]))
    }
    return true
    // step = parseInt(step / this.StepPixel)
    // if (step <= 0) return false
    // if (isLeft) {
    //   if (CurDataOffset >= chartDatas.Datas.length - 1) return false
    //   CurDataOffset += step
    //   if (CurDataOffset > chartDatas.Datas.length - 1) CurDataOffset = chartDatas.Datas.length - 1
    //   return true
    // } else {
    //   if (LeftDatasIndex <= 0) return false
    //   LeftDatasIndex -= step
    //   if (LeftDatasIndex < 0) CurDataOffset -= LeftDatasIndex
    //   else CurDataOffset -= step
    //   return true
    // }
  }

  this.SplitDatas = function () {
    LeftDatasIndex = CurDataOffset + 1 - KNum
    if (LeftDatasIndex < 0 && CurDataOffset - LeftDatasIndex <= chartDatas.Datas.length - 1) {
      CurDataOffset -= LeftDatasIndex
      LeftDatasIndex = 0
    }
    KLineDatas = chartDatas.Datas.slice(LeftDatasIndex, CurDataOffset == chartDatas.Datas.length - 1 ? -1 : CurDataOffset)
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
}

// 指标数据处理类
function IndicatorDatasFix (kLineDatas) {

  this.KLineDatas = kLineDatas
  // map类型，存放多个指标数据和配置
  this.IndicatorDatas = {
    // 指标名称
    name: {
      config: {
        params: {},
        styles: {}
      },
      datas: {
        // 周期
        1: {
          'macd': [],
          'dif': [],
          'dea': []
        }
      }
    }
  }

  /**
   * @description 指标运算
   * @param {指标名称} indicatorName 
   * @param {数据类型：new / old} type
   */
  this.Operating = function (indicatorName, type) {

  }


  /**
   * @description 指标数据合并
   * @param {指标数据} datas 
   * @param {数据类型：new / old} type 
   */
  this.MergeData = function (datas, type) {

  }

}

// 图表数据获取类
function ChartDatas () {
  this.Datas = kLines
  this.Period
  this.isOnline

  this.RequestDatas = function (period) {

  }
  this.LoadNewDatas = function () {

  }
  this.LoadMoreDatas = function () {

  }
}

ChartDatas.Init = function () {
  var datas = new ChartDatas()
  return datas
}

var chartDatas = ChartDatas.Init()
var KLineDatas = chartDatas.Datas
var CurDataOffset = chartDatas.Datas.length - 1 // 初始化开始，数据范围右游标为 -1
var LeftDatasIndex = 0
var KNum // 一屏可容纳的K线数量
var g_ThemeResource = new ThemeSettingsDialog()
var pixelTatio = GetDevicePixelRatio();

var WindowSizeOptions = {
  windowHeight: 0,
  windowWidth: 0,
  topToolContainerHeight: 60,
  leftToolContainerWidth: 60,
  chartContainerWidth: 0,
  chartContainerHeight: 0,
  xAxisContainerHeight: 28,
  yAxisContainerWidth: 60
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
    [1, 1], [0, 1]
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

