## 未整理
## 数据
### K线数据
- 模式
  - 在线：实时更新当前最新数据
  - 离线：只加载当前数据库已有的数据
  - 限定：只加载指定范围的数据
- 在线
  - 功能：可设置每次最多加载多少条数据，分页加载，有refreshNew 和 loadMore 的功能，refreshNew需要实时获取最新数据，loadMore则需被动触发加载；
  - 场景：实盘
- 离线
  - 功能：可设置每次最多加载多少条数据，分页加载；如果不需要分页加载，加载更多的接口配置 **loadMoreConfig** 不需要进行配置
  - 场景：回测记录
- 功能实现
  1. 获取元数据时，开始和结束都要整点数；
  2. 1min -> 5min：从整点开始，每5根K线组成一条，时间为这5条K线中的第一条；最高价为5条K线中的Max(H),最低价为Min(L),开盘价为第一条K线的O,收盘价为最后一条K线的C；
  3. 每次切换周期，在没有缓存的情况下，都对现有的所有原数据进行计算合并；
  4. 获取更多K线数据也是需要整点获取，如果当前处在5min，获取更多数据获取的是1min的数据，然后再进行合并缓存；

### 实时数据
#### 可优化
- 问题：每次实时更新数据，canvas 和 optcanvas 都会进行重置，此时光标消失，鼠标的坐标也会变成0，0，如果绘图没有完成，会导致坐标错乱
  1.  绘图未完成也保存当前正在绘制的点的坐标
  2.  保存光标的状态

### 画图工具
- 基础元件：线条、字体、矩形

1. 线条
   - name：line
   - attr：color,lineWidth
   - position：price1,kIndex1 & price2,kIndex2 
   - level

2. 字体
   - name: text
   - attr: color,fontSize,backgroundColor,border
   - position:price,kIndex
   - level
3. 矩形
   - name: rect
   - attr: backgroundColor,border
   - position: price1,kIndex1 & price2,kIndex2 & price3,kIndex3 & price4,kIndex4 
   - level

- 层级：所有的元件通过list进行存放，list中的顺序即是元件层级的顺序；不采用数值大小来进行排序，考虑到元件非常多的情况下，改动一个元件的顺序，其他部分元件的顺序都要进行改动。
- 问题
1. 当元件一部分在可视范围内，一部分在不可视范围外的时候，要如何进行处理
     - 通过对元件可视与不可视范围边界求值，对于不可视范围的内容不要进行绘制，不过这种方式对于字体元件则需要计算元件起点到边界的距离，算出可视范围可以显示多少个字体，然后绘制其中一部分字体
     - 通过添加多个canvas，进行遮盖；为每一个图表设置单独一个drawCanvas，这样超出drawCanvas部分的内容则自动不会显示，这种方式可能会出现卡顿的现象


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

#### 指标
1. 计算方式
   1. 对现有全部数据源进行计算：对于更新数据或加载更多的情况，就需要进行重新计算，如果可以把之前的指标数据保存下来，只计算更新的部分，可以节省计算的时间
   2. 针对当前显示的K线进行计算：每次移动改变当前显示的数据时都要进行计算，对于需要历史周期较远的指标，计算出来的结果就会不精确

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

> 结果输出和画图的区别在于，结果输出

### 数据
  plot 对应的是指标输出值，也对应指标配置项中的绘图方式；
  绘制指标多个结果的时候，有多少个结果就得遍历多少次，如果绘制图形类型是不连续性的（图标、矩形、文字），就可以集中在K线的遍历中进行绘制。如果绘图类型是连续性的（曲线），那么必须放置在单独的循环遍历中进行绘制。不过对于不连续性图形的绘制方式，会导致canvas不断的begin和close。如果全部绘图类型都采用单独的循环遍历进行绘制的话，每次就必须要先确定好当前屏幕显示的K线数据对应的指标结果，而不是所有的，这样就可以控制好数据量的大小，来保证绘制的效率，**所以如何快速确定好对应的指标结果就是一个突破点**
  ： （1. **数据集的长度跟K线一致，这样就能跟随K线的偏移量来快速定位要显示的数据集范围**；2. **除了这种方式之外，快速定位就必须要求数据集是字典类型，在遍历K线的时候，通过datetime为键来寻找对应的指标数据**。
  
  1. 所以**不管后端返回的结果数据集**是合并还是拆分，对图表的绘制影响都不大。
  
  2. 对于**数据集量比较小**的，通过遍历数据集来判断当前遍历对象是否存在屏幕内来进行绘制效率会更高。

  3. 对于**数据集量大**的，就需要通过遍历显示的K线数据来查找对应的数据集这种方式的效率更高。

  4. 对于**数据集长度跟K线数据长度一致**的指标结果，偏移量截取，并针对自身遍历绘制的方式效率会更高。

  5. 对于**区分不连续性和连续性图形**来决定是多次遍历绘制还是单次遍历统一绘制，可以提供一定效率。
  6. 对于不连续性的图形（排除图标），必须该图形涉及范围的K线数据都显示出来才会显示，不然就无法显示，这种体验效果就差很多。对于这些不连续图形的数据集，是无法获取到上一个数据的，因为map是无序的，如果使用list，处理方式会比较麻烦，编写效果不友好。对于目前来说，线段和矩形这种不连续性图形，使用已有的drawPicture对象来表示会比较方便合理。但是如果把指标结果处理为drawPicture，数据量一大，每次都需要对所有的drawpicture进行绘制，会导致效率降低，除非能够判断当前显示的K线对应的drawPicture有哪些，这种方式也不是说无法实现，而是实现起来比较复杂。


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


