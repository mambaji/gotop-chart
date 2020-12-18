## 未整理
## 数据
### K线数据
- 模式
  - 在线：实时更新当前最新数据
    - 功能：可设置每次最多加载多少条数据，分页加载，有refreshNew 和 loadMore 的功能，refreshNew需要实时获取最新数据，loadMore则需被动触发加载；
    - 场景：实盘
  - 离线：只加载当前指定数据范围的数据
    - 功能：可设置每次最多加载多少条数据，分页加载；
    - 场景：回测
- 周期数据
  1. 获取元数据时，开始和结束都要整点数；
  2. 1min -> 5min：从整点开始，每5根K线组成一条，时间为这5条K线中的第一条；最高价为5条K线中的Max(H),最低价为Min(L),开盘价为第一条K线的O,收盘价为最后一条K线的C；
  3. 每次切换周期，在没有缓存的情况下，都对现有的所有原数据进行计算合并；
  4. 获取更多K线数据也是需要整点获取，如果当前处在5min，获取更多数据获取的是1min的数据，然后再进行合并缓存；

### 指标数据
- 在线：随着K线的实时更新而更新
- 离线：随着K线的更新而更新
- 处理方式：
  - 连续性：
    - 计算
      - 客户端：对于当前指标数据会被历史数据影响的指标，就要把计算的K线数据往后移动一定周期，这样可以使得指标数据衔接平滑
      - 后端：直接传递一个要计算的K线的时间范围
    - 渲染：连续性的指标数据跟随K线的下标范围移动而移动，只要下标范围内的指标数据，直接渲染就可以，不需要进行遍历
  - 非连续性：
    - 计算
      - 客户端：同连续性计算一样
      - 后端：同连续性计算一样
    - 渲染：非连续性的指标数据因为数据数量跟K线数量不一致，所以无法使用下标范围来确认展示数据，必须使用到遍历，为了加快渲染速度，指标数据选择使用map的数据结构

- 计算方式：分为**系统内置指标**和**自定义指标**；系统内置指标则使用客户端计算，自定义指标则使用后端计算

### 图形数据
- 数据加载方式
  - 本地插入
  - 网络请求：网络请求出来的数据格式 要先转换成 客户端的绘图格式; 网络请求的方式支持websocket，满足实盘场景；历史数据则一次性获取，满足回测场景
- 数据格式
  - Array：目前使用Array存放所有的图形数据，每次K线有变动都需要进行遍历；后期如果数据量大的情况下，考虑渲染速度方面可能需要把Array改成map
- 持久化数据显示
  1. 数据格式 
  ```
   // 元件持久化数据格式
    1607661780000: {
      value: 27.1203,
      type: 'buy',
      orderId: 'StQOvk0YGyaaMr6X8oWmBVK2aX65oQFH',
      location: 'kLine'
    } 
  ```
  2. 处理逻辑
     - 遍历图表配置 drawEle
     - 遍历每一项 drawEle 的数据集
     - 判断元件属于哪个画图对象，创建对象
     - 判断元件数据的location在哪个图表，拿取ChartFramePaintingList中元素的Options
     - 将处理完的数据保存入DrawPictureToolList数据集中，并记录当前DrawPictureToolList的size
- 绘图元件持久化保存
  1. 保存的数据格式
   ```
   // 信号点
   var signals = {
      // 1min图表数据
      1:{
         1607661780000: {
            value: 27.1203,
            type: 'buy',
            orderId: 'StQOvk0YGyaaMr6X8oWmBVK2aX65oQFH',
            location: 'kLine'
         } 
      }
   }
   // 矩形数据
   var rect = {}
   // 线段数据
   var line = {}
   ```
   2. 处理逻辑
      - 首次显示时记录DrawPictureToolList的size为saveIndex
      - 保存元件：遍历DrawPictureToolList，下标从saveIndex开始，将数据保存如文件
      - 删除元件：将删除元件记录，判断saveIndex是否大于当前删除的元件下标，大于等于则将删除的元件保存进DrawPictureToolDeleteList 中，小于则不需要；遍历DrawPictureToolDeleteList，将datetime、value 与文件中的数据进行对比，相匹配上则删除掉文件的数据，最后操作完成要将 DrawPictureToolDeleteList 清空；
      - 用户操作 “保存” 按钮时，先拉去文件中的数据，遍历 DrawPictureToolDeleteList 删除掉元件，再遍历DrawPictureToolList，下标从saveIndex开始，将数据保存入文件
### 可优化
- 问题：每次实时更新数据，canvas 和 optcanvas 都会进行重置，此时光标消失，鼠标的坐标也会变成0，0，如果绘图没有完成，会导致坐标错乱
  1.  绘图未完成也保存当前正在绘制的点的坐标
  2.  保存光标的状态

## 画图工具
- 基础元件：线条、字体、矩形、信号点

1. 线条
   - name：line
   - attr：color,lineWidth
   - position：price1,datetime1 & price2,datetime2 
   - level
2. 字体
   - name: text
   - attr: color,fontSize,backgroundColor,border
   - position:price,datetime
   - level
3. 矩形
   - name: rect
   - attr: backgroundColor,border
   - position: price1,datetime1 & price2,datetime2
   - level
4. 信号
   - name:signal
   - attr: color,text,type,value
   - position:price,datetime1

- 层级：所有的元件通过list进行存放，list中的顺序即是元件层级的顺序；不采用数值大小来进行排序，考虑到元件非常多的情况下，改动一个元件的顺序，其他部分元件的顺序都要进行改动。
- 问题
1. 当元件一部分在可视范围内，一部分在不可视范围外的时候，要如何进行处理?
     - 1. 必须已知当前元件所有 position 对应的KIndex才可以满足；通过计算各个datetime的差值来求出单独一个元件中position kIndex 的差值可以实现，不过必须只要当前所展示的K线品种的时间周期，品种繁多的话就比较复杂；比较好的方式是要保存每个元件中position Kindex 的差值
     - 2. 计算渲染的K线数据要比真实渲染出来的K线数据范围要更大，其实就是渲染出的K线数据可以是1000条，但是展现给用户看只展现900条，这样1000条K线都可以被遍历到，此时展现出来的K线的边界对应的元件也就能显示出来；


#### HQ绘图方式
1. **光标模式**
  在该模式下，最先开始会对背景静态图 进行 截图，然后每次移动光标，都会重新将 截图 覆盖给canvas，然后再绘制光标
2. **数据拖动模式**
  每次拖动都会 clearRect，draw，getImageData，drawLine,putImageData
3. **画图模式**
  每次移动都会 putImageData（不包括画图），drawLine（所有图形重新绘制）
> 由于hq是单张canvas，所以保存静态的imageData，可以避免静态部分的内容多次重复绘制。
> 对于画图对象不进行截图，主要是因为每个画图对象都可以进行重新的位置和大小的调整，所以还是属于动态对象。
> 每次 mousemove 都会对动态对象进行重绘。
> 也可以用两张canvas，一张绘制动态，一张绘制静态。对于画图对象的部分绘制在动态canvas上面，每次mousemove都对于动态canvas进行重绘。

#### 绘图方案
1. 目前使用两张canvas，在画图对象比较多的情况下，光标的移动会导致卡顿，因为每次光标移动都会导致canvas重绘。
   1. 可以再增加一张画布，主要用来放置画图工具对象的
2. 超出画布的部分可以很自然的 覆盖掉，但是因为我使用的是一张画布进行多个区域的绘制，就必须要实现超出区域的部分不显示。
   1. 绘图的时候限制 画图对象 只能在对应的坐标系上面，超出部分将自动调整回坐标系中来。
   2. 通过线rect clip 可以确定绘制的区域，然后再进行画图

>1. 清空canvas
>再绘制每一帧动画之前，需要清空所有。清空所有最简单的做法就是clearRect()方法
>2. 保存canvas状态
>如果在绘制的过程中会更改canvas的状态(颜色、移动了坐标原点等),又在绘制每一帧时都是原始状态的话，则最好保存下canvas的状态
>3. 绘制动画图形
>这一步才是真正的绘制动画帧
>4. 恢复canvas状态
>如果你前面保存了canvas状态，则应该在绘制完成一帧之后恢复canvas状态

#### 点击事件
- client：针对浏览器可视区域，不包括border
- page：在client 的基础上加上滚动条的滚动距离
- offset：针对自身内容的有效区域 ，包括border
- screen：针对显示器窗口
- layer：如果元素有设置相对或绝对定位，参考点以页面为参考点，没有设置则以元素本身为参考点，包括border

##### 有mousedown的情况下监听某个元素的区域点击事件
需求：因为使用了mousedown，不管是点击哪个元素区域，都会触发到该事件；目前 画图工具对象 右键触发的弹窗 的点击事件越 mousedown 中的执行方法有冲突，所以必须实现当点击 画图工具对象弹窗的 时候，不要触发到mousedown事件。这样就需要监听当前点击的坐标是否存在于 画图工具对象弹窗 之中，此时 画图工具对象弹窗 的位置已经可以获取到。
分析：offset 是针对元素本身的，所以不能使用，layer也一样，其他几个都是针对页面级的，要使用的话就必须知道chart的具体位置。还有另外一种方式就是监听点击事件中的path，遍历其中是否有 画图工具对象弹窗 这个元素。
解决：使用offset，所以chart必须要有具体的位置。

## 设计
1. 图表的内容创建与更新的流程需要清楚，并且二者的流程应该尽可能统一，只要理清楚每次创建和更新的流程，把这些流程封装成统一的函数，那么逻辑上和维护性上面都是清晰的
   1. 创建图表流程
      1. 创建Element
      2. 设置Element大小
      3. 加载数据
      4. 初始化配置Option
      5. 创建FrameList
      6. 绘制FrameList
   2. 更新图表流程
      1. Size 的改变。图表主窗口Size的改变
         1. 设置Element大小
         2. 初始化配置Option
         3. 创建FrameList
         4. 绘制FrameList
      2. 画布上图形的改变（CrossCursor、DrawPicture）
         1. 清空OptCanvas画布
         2. CrossCursor绘制
         3. DrawPicture绘制
      3. FrameList的改变
         1. 清空所有画布
         2. 创建FrameList
         3. 绘制FrameList
      4. 数据的改变
         1. 加载数据
         2. 截取数据
         3. 绘制FrameList
2. 把创建和赋值拆分开来，后面再封装函数的时候更容易去调用

## 自定义绘图
此调用会在主数据列上指定点位创建一个形状。
```js
createMultipointShape(points, options, callback)
1. point: object {time, [price], [channel]}
   1. time: unix time. 唯一的强制性参数。
   2. price: 如果您指定price, 如果您指定“price”，则您的图标将被放置在其水平之上。 如果没有指定，则图标会在相应的时间粘贴到K线上。
   3. channel: 要保持价格水平线，要使用channel 参数 (open, high, low, close)。如果未指定则以’open’为默认值。
2. options: object {shape, [text], [lock], [overrides]}
   1. shape 可能的值为[‘arrow_up’, ‘arrow_down’, ‘flag’, ‘vertical_line’, ‘horizontal_line’]，’flag’为默认值。
   2. text 图形的内容
   3. lock 是否锁定图形
   4. disableSelection (since 1.3) 禁用选择
   5. disableSave (since 1.3) 禁用保存
   6. disableUndo (since 1.4) 禁用撤销
   7. overrides (since 1.2). 它是一个对象，包含为新图形设置的属性。
   8. zOrder (since 1.3) 可能的值为[top, bottom]. top 将线工具放在所有其他资源之上, bottom 将线工具放在所有其他资源之下, ‘top’为默认值。
   9. showInObjectsTree: true为默认值。在“对象树”对话框中显示图形。
3. callback: function(entityId)
```
## 自定义指标模板
1. 基本属性
   1. 名称、id、描述、版本
2. 计算参数
3. 显示窗口：主图或副图
4. 结果输出：指标输出的结果数值进行图表展现
   1. 结果对象id、结果对象名称
   2. 结果绘图类型（线段or直方图
   3. 结果绘制样式
5. 画图：通过画图工具对象进行绘制


- ```json
  data:{
     datetime:{
        plot0:{   // 矩形
           value:[12,23,16,43]
        },
        plot1:{   // 曲线
           value:12
        },
        plot2:{   // 文字
           value:13,
           text:"高点"
        },
        plot3:{   // 图表
           value:14,
           icon:1
        }
     }
  }
  ```
- ```json
   data:[
      {
        datetime:"2020-01-15 14:23:25",
        plot0:{   // 矩形
           value:[12,23,16,43]
        },
        plot1:{   // 曲线
           value:12
        },
        plot2:{   // 文字
           value:13,
           text:"高点"
        },
        plot3:{   // 图表
           value:14,
           icon:1
        }
      }
   ]
  ```

- ```json
  plot0:{
     datetime:{
         value:11,
         text:"高点"
      },
      datetime:{
         value:12,
         text:"低点"
      }
   }
   plot1:{
      datetime:{
         value:11
      },
      datetime:{
         value:12
      }
   }
   plot2:{
      datetime:{
         value:14,
         icon:1
      },
      datetime:{
         value:12,
         icon:2
      }
   }
   plot3:{
      datetime:{
         value:[12,32,16,44]
      }
   }
  ```
   
```json
{
    // 将<study name>替换为您的指标名称
    // 它将由图表库内部使用
    name: "<study name>",
    metainfo: {
        "_metainfoVersion": 40,
        "id": "<study name>@tv-basicstudies-1",
        "scriptIdPart": "",
        "name": "<study name>",
        // 此说明将显示在指标窗口中
        // 当调用createStudy方法时，它也被用作“name”参数
        "description": "<study description>",
        // 该描述将显示在图表上
        "shortDescription": "<short study description>",

        "is_hidden_study": true,
        "is_price_study": true,
        "isCustomIndicator": true,

        "plots": [{"id": "plot_0", "type": "line"}],
        "defaults": {
            "styles": {
                "plot_0": {
                    "linestyle": 0,
                    "visible": true,

                    // 绘图线宽度
                    "linewidth": 2,

                    // 绘制类型:
                    //    1 - 直方图
                    //    2 - 线形图
                    //    3 - 十字指针
                    //    4 - 山形图
                    //    5 - 柱状图
                    //    6 - 圆圈图
                    //    7 - 中断线
                    //    8 - 中断区块
                    "plottype": 2,

                    // 显示价格线?
                    "trackPrice": false,

                    // 绘制透明度，百分比。
                    "transparency": 40,

                    // 以#RRGGBB格式绘制颜色
                    "color": "#0000FF"
                }
            },

            // 指标输出值的精度
            // (小数点后的位数)。
            "precision": 2,

            "inputs": {}
        },
        "styles": {
            "plot_0": {
                // 输出的名字将在样式窗口显示
                "title": "-- output name --",
                "histogramBase": 0,
            }
        },
        "inputs": [],
    },
```


## 易错点
1. return 只会返回到上一个方法，如果是多个方法嵌套的，它不会返回到最上层的方法，需要写多个return
2. Number 类型 判断是否为null 的时候，不能直接 if(Number) 而要 if(Number!=null)，因为Number = 0 时，也是false


