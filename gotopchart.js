
function GoTopChart (element) {
  this.DivElement = element

  this.ChartElement = document.createElement('div')
  this.ChartElement.className = 'chart-container'

  this.RightElement = document.createElement('div')

  this.TopToolContainer = new TopToolContainer()
  this.LeftToolContainer = new LeftToolContainer()

  this.DivElement.appendChild(this.LeftToolContainer.Create())
  this.DivElement.appendChild(this.RightElement)

  this.RightElement.appendChild(this.TopToolContainer.Create())
  this.RightElement.appendChild(this.ChartElement)

  this.SetSize = function () {

  }

  this.SetOption = function () {

  }

  this.Draw = function () {

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

}

////////////////////////////////////////////
// 
//             图表边距
//
////////////////////////////////////////////
function ChartBorder () {
  this.ChartElement

  //四周间距
  this.Left = 50;
  this.Right = 80;
  this.Top = 50;
  this.Bottom = 50;
  this.TitleHeight = 24;    //标题高度

  this.GetChartWidth = function () {
    return this.ChartElement.width;
  }

  this.GetChartHeight = function () {
    return this.ChartElement.height;
  }
}

////////////////////////////////////////////
// 
//             图形画法
//
////////////////////////////////////////////
function ChartPainting () {

}

// K线画法
function KLine () {
  this.newMethod = ChartPainting()
  this.newMethod()
  delete this.newMethod
}

// X轴画法
function XAxis () {
  this.newMethod = ChartPainting()
  this.newMethod()
  delete this.newMethod
}

// Y轴画法
function YAxis () {
  this.newMethod = ChartPainting()
  this.newMethod()
  delete this.newMethod
}

// MACD画法
function MACD () {
  this.newMethod = ChartPainting()
  this.newMethod()
  delete this.newMethod
}

////////////////////////////////////////////
// 
//             图表框架框架画法
//
////////////////////////////////////////////
function ChartFramePainting () {

  this.Option
  this.ChartTitlePainting
  this.ChartBorder
  this.Canvas
  this.OptCanvas
  this.XAxis
  this.YAxis

  this.Create = function () {

  }

  this.SetOption = function () {

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

  this.Create = function () {

  }

  this.RegisterClickEvent = function () {

  }
}

// 顶部工具栏
function TopToolContainer () {
  this.newMethod = ChartExtendPainting()
  this.newMethod()
  delete this.newMethod
}

// 左侧工具栏
function LeftToolContainer () {
  this.newMethod = ChartExtendPainting()
  this.newMethod()
  delete this.newMethod
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
  this.ParentDivElement
  this.DivElement
  this.CurValue

  this.Create = function () {

  }

  this.CreateValueBoX = function () {

  }

  this.SetValue = function () {

  }
}

////////////////////////////////////////////
// 
//             十字光标
//
////////////////////////////////////////////
function CrossCursor () {
  this.Canvas
  this.IsShow

  this.Create = function () {

  }

  this.Move = function () {

  }

  this.Draw = function () {

  }
}

////////////////////////////////////////////
// 
//             图表数据处理基类
//
////////////////////////////////////////////
function ChartData () {
  this.Data
  this.NewData
  this.DataOffSet
  this.Period
  this.Symbol

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
}

////////////////////////////////////////////
// 
//             全局颜色配置
//
////////////////////////////////////////////
function GoTopChartResource () {

}