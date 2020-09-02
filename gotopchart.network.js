
/**
 * 网络请求封装库
 */
function JSNetwork () {
  var apiSercet = "gIu5ec7EO6ziqUIyL6btfVSpHVvU77J17p9gQpkMexBL6FI94HBukLRhvB51a2Wz"
}

JSNetwork.HttpRequest = function (obj) {
  $.ajax({
    url: obj.url,
    headers: obj.headers,
    data: obj.data,
    type: obj.type,
    dataType: obj.dataType,
    async: obj.async,
    success: obj.success,
    error: obj.error,
  })
}