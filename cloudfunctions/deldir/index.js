// 云函数入口文件
const cloud = require('wx-server-sdk')

const CloudBase=require('@cloudbase/manager-node')
const storage=new CloudBase({
  envId: "yfwq1-4nvjm" //不写则使用默认云
}).storage;
async function test(dirName) {
  return await storage.deleteDirectory(dirName);
}
// 云函数入口函数
exports.main = async (event, context) => {
  // const wxContext = cloud.getWXContext()
  //
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
  try {
    return test(event.dirName)
  } catch (e) {
    return {code: 0, errMsg: e.stack}
  }
}