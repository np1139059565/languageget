const YFILE_ID="cloud://yfwq1-4nvjm.7966-yfwq1-4nvjm-1302064482/"
var log = null
var yunAbility = false,MY_FILE=null

function info(inf1, inf2, inf3) {
    try {
        if (log == null) {
            console.info("myun",inf1, inf2, inf3)
        } else log.info("myun",inf1, inf2, inf3)
    } catch (e) {
        console.error(e)
    }
}

function err(e1, e2, e3) {
    try {
        if (log == null) {
            console.error("myun",e1, e2, e3)
        } else log.err("myun",e1, e2, e3)
    } catch (e) {
        console.error(e)
    }
}

/**
 *
 * @param eventName 云函数名 对应 ../appname/cloudfunctions/*
 * @param data 合并入云函数的event
 * @param callback
 */
function yunSync1(eventName, data, callback,isShowLoading) {
    const mcallback = (code1,data1) => {
        if(isShowLoading){
            wx.hideLoading()
        }
        if (typeof callback == "function") {
            callback(code1,data1)
        }
    }
    try {
        if (yunAbility) {
            if(isShowLoading){
                wx.showLoading({
                    title: '云...',
                    mask: true//防止触摸
                })
            }
            info("yun...", eventName,data)

            wx.cloud.callFunction({
                name: eventName,//云函数名 对应 ../appname/cloudfunctions/*
                data: data,//合并入云函数的event 如果包含大数据字段（建议临界值 256KB）建议使用 wx.cloud.CDN 标记大数据字段
                complete: (r) => {
                    //errMsg: "cloud.callFunction:ok"
                    // requestID: "a8c535b2-6b46-11eb-8a7e-525400549ebe"
                    // result:
                    //  data: [{…}]
                    //  errMsg: "collection.get:ok"
                    try {
                        var code = r.errMsg.endsWith(":ok")
                        if (!code) {
                            err(r.errMsg)
                        }else if(eventName=="database"){
                            //database res
                            if(code&&null!=r.result.code&&!r.result.code){
                                code=false
                                err("database err",r.result.errMsg)
                            }else{
                                r=r.result.data
                            }
                        }
                        mcallback(code, r)
                    } catch (e) {
                        err(e)
                        mcallback(false)
                    }
                }
            })
        } else {
            err("yunAbility is false")
            mcallback(false)
        }
    } catch (e) {
        if(isShowLoading){
            wx.hideLoading()
        }
        err(e)
        mcallback(false)
    }
}

/**
 *
 * @param yunPath image/...
 * @param localPath wxfile://usr/...
 * @param callback
 * @param isShowLoading
 */
function downloadFileSync(yunPath,localPath,callback,isShowLoading){
    const mcallback = (code1) => {
        if (typeof callback == "function") {
            callback(code1)
        }
    }
    try{
        if(isShowLoading){
            wx.showLoading({
                title: '下载云文件...',
                mask: true//防止触摸
            })
        }
        if(yunAbility){
            wx.cloud.downloadFile({
                fileID:YFILE_ID+ yunPath,
                complete: (res) => {
                    try {
                        const code = res.errMsg.endsWith(":ok")
                        if (code) {
                            info("down yun file",res.tempFilePath)
                            //copy cache to local
                            const parentPath = localPath.substr(0, localPath.lastIndexOf("/"))
                            if (MY_FILE.isDir(parentPath)== false){
                                MY_FILE.mkDir(parentPath)
                            }
                            const ccode = MY_FILE.copyFile(res.tempFilePath, localPath)
                            mcallback(ccode)
                        }else{
                            err("download yun file to cache is err.",yunPath)
                            mcallback(false)
                        }
                    } catch (e) {
                        err(e,yunPath)
                        mcallback(false)
                    }finally {
                        if(isShowLoading){
                            wx.hideLoading()
                        }
                    }
                }
            })
        } else {
            err("yunAbility is false")
            mcallback(false)
        }
    }catch (e){
        if(isShowLoading){
            wx.hideLoading()
        }
        err(e)
        mcallback(false)
    }
}
function uploadFileSync(localPath,yunPath,callback,isShowLoading){
    const mcallback = (code1) => {
        if(isShowLoading){
            wx.hideLoading()
        }
        if (typeof callback == "function") {
            callback(code1)
        }
    }
    try{
        if(isShowLoading){
            wx.showLoading({
                title: '上传文件到云...',
                mask: true//防止触摸
            })
        }
        if(yunAbility){
            wx.cloud.uploadFile({
                filePath:localPath,
                cloudPath: yunPath,
                complete: (res) => {
                    try {
                        const code = res.errMsg.endsWith(":ok")
                        if (code) {
                            info("up file to yun",res)
                        }else{
                            err("up file to yun is err.",yunPath)
                        }
                        mcallback(code)
                    } catch (e) {
                        err(e,yunPath)
                        mcallback(false)
                    }
                }
            })
        } else {
            err("yunAbility is false")
            mcallback(false)
        }
    }catch (e){
        err(e)
        mcallback(false)
    }
}
function delFileSync(yunPathArr,callback,isShowLoading){
    const mcallback = (code1) => {
        if(isShowLoading){
            wx.hideLoading()
        }
        if (typeof callback == "function") {
            callback(code1)
        }
    }
    try{
        if(isShowLoading){
            wx.showLoading({
                title: '删除云文件...',
                mask: true//防止触摸
            })
        }
        if(yunAbility){
            wx.cloud.deleteFile({
                fileList:yunPathArr.map(ypath=>YFILE_ID+ypath),
                complete: (res) => {
                    try {
                        const code = res.errMsg.endsWith(":ok")&&res.fileList.filter(fsta=>fsta.status==0).length==res.fileList.length
                        if (code) {
                            info("del yun file",res)
                        }else{
                            err("del yun file is err.",res)
                        }
                        mcallback(code)
                    } catch (e) {
                        err(e,yunPathArr)
                        mcallback(false)
                    }
                }
            })
        } else {
            err("yunAbility is false")
            mcallback(false)
        }
    }catch (e){
        err(e)
        mcallback(false)
    }
}

// ------------------open event----------------------
module.exports.init1 = (log1,mfile1) => {
    try {
        if (log1 != null) {
            log = log1
        }
        info("init myun...")
        if(mfile1!=null){
            MY_FILE=mfile1
        }
        if (!wx.cloud) {
            err("请使用 2.2.3 或以上的基础库以使用云能力")
            yunAbility = false
        } else {
            //init yun
            wx.cloud.init({
                // env 参数说明：
                //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
                //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
                //   如不填则使用默认环境（第一个创建的环境）
                env: 'yfwq1-4nvjm',
                traceUser: true,//将访问用户记录到云控制台的用户访问中
            })
            yunAbility = true
        }
    } catch (e) {
        err(e)
    }
}
module.exports.yunSync = yunSync1
module.exports.downloadFileSync=downloadFileSync
module.exports.uploadFileSync=uploadFileSync
module.exports.delFileSync=delFileSync
