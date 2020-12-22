var fs = require('fs');
//写入json文件选项
function writeJson () {
  //现将json文件读出来
  fs.readFile('./drawEleDatas.js', function (err, data) {
    if (err) {
      return console.error(err);
    }
    var eleDatas = data.toString();
    // eleDatas = JSON.parse(eleDatas)
    console.log(eleDatas.rect)
    // fs.writeFile('./mock/person.json', str, function (err) {
    //   if (err) {
    //     console.error(err);
    //   }
    //   console.log('----------新增成功-------------');
    // })
  })
}
writeJson()//执行一下;