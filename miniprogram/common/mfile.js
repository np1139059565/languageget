const FSM = wx.getFileSystemManager()
const USER_DIR = wx.env.USER_DATA_PATH
info("user dir is", USER_DIR)
// const JSZIP=require("../dsf/jszip/jszip.min")

var log = null

function info(inf1, inf2, inf3) {
    try {
        if (log == null) {
            console.info("mfile", inf1, inf2, inf3)
        } else log.info("mfile", inf1, inf2, inf3)
    } catch (e) {
        console.error(e)
    }
}

function err(e1, e2, e3) {
    try {
        if (log == null) {
            console.error("mfile", e1, e2, e3)
        } else log.err("mfile", e1, e2, e3)
    } catch (e) {
        console.error(e)
    }
}

/**
 *
 * @param dirPath /:代码包文件 ../languageget/miniprogram
 */
function readDir(dirPath) {
    try {
        info("read dir", dirPath)
        return isDir(dirPath) ? FSM.readdirSync(dirPath) : []//[p1,p2]
    } catch (e) {
        err("read dir is err", e)
        return []
    }
}

/**
 *
 * @param filePath
 * @param encoding binary
 * @returns {string|ArrayBuffer|void}
 */
function readFile(filePath, encoding) {
    try {
        info("read file", filePath)
        return FSM.readFileSync(filePath, encoding != null ? encoding : "UTF-8")
    } catch (e) {
        err("read file is err", e)
        return (encoding != null ? null : "")
    }
}

/**
 *
 * @param filePath
 * @param conter
 * @param isAppend false
 * @param encoding utf-8
 * @returns {boolean}
 */
function writeFile(filePath, conter, isAppend, encoding) {
    try {
        //check path
        const ppath = filePath.substr(0, filePath.lastIndexOf("/"))
        if (isDir(ppath) == false) {
            mkDir(ppath)
        }
        encoding = (encoding != null ? encoding : "utf8")
        const code = (isAppend && isExist(filePath) ? FSM.appendFileSync(filePath, conter, encoding) == null
            : FSM.writeFileSync(filePath, conter, encoding) == null)
        info((isAppend ? "append" : "write") + " " + filePath, encoding, code)
        return code
    } catch (e) {
        err("write file is err", e)
        return false
    }
}

/**
 *
 * @param path
 * @returns {void|*} Stats:
 * .mode:
 * .size:
 * .lastAccessedTime:
 * .lastModifiedTime:
 * .isDirectory() 判断当前文件是否一个目录
 * .isFile() 判断当前文件是否一个文件
 */
function getFInfo(path) {
    try {
        if (isExist(path)) {
            return FSM.statSync(path, false)
        } else {
            return null
        }
    } catch (e) {
        err("get file info is err", e)
        return null
    }
}

function isExist(path) {
    try {
        return typeof path == "string" && FSM.accessSync(path) == null
    } catch (e) {
        if (e.message.indexOf("no such file or directory") >= 0) {
            info(path, e.message)
        } else {
            err(e)
        }
        return false
    }
}

function isDir(path) {
    try {
        const pinfo = getFInfo(path)
        return pinfo != null && pinfo.isDirectory()
    } catch (e) {
        err("check is dir err", e)
    }
}

function removePath(path) {
    try {
        const pinfo = getFInfo(path)
        if (pinfo != null) {
            if (pinfo.isDirectory()) {
                info("rm dir:" + path)
                return FSM.rmdirSync(path, true) == null
            } else {
                info("rm file:" + path)
                return FSM.unlinkSync(path) == null
            }
        } else {
            info("rm is success:path is not find.")
            return true
        }
    } catch (e) {
        return err(e)
    }
}

function mkDir(dirPath) {
    try {
        const dinfo = getFInfo(dirPath)
        if (dinfo != null) {
            if (dinfo.isFile()) {
                err("file already exists")
                return false
            } else {
                info("dir already exists")
                return true
            }
        } else {
            const code = FSM.mkdirSync(dirPath, true) == null
            info("mkdir", dirPath, code)
            return code
        }
    } catch (e) {
        err("mkdir is err", e)
    }
}

function copyFile(srcFPath, dstFPath) {
    try {
        const sInfo = getFInfo(srcFPath)
        if (sInfo != null && sInfo.isFile()) {
            const dInfo = getFInfo(dstFPath)
            //check dst path
            if (dstFPath.endsWith("/")) {
                dstFPath = dstFPath.substr(0, dstFPath.length - 1)
            }
            if (dInfo != null) {
                if (dInfo.isDirectory()) {
                    err("dst path is dir", dstFPath)
                    return false
                }
            } else {
                mkDir(dstFPath.split("/").reverse().splice(1).reverse().join("/"))
            }
            const code = FSM.copyFileSync(srcFPath, dstFPath) == null
            info("copy file " + srcFPath, dstFPath, code)
            if(!code){
                err("copy file is fail",srcFPath,dstFPath)
            }
            return code
        } else {
            err("src path is not file")
            return false
        }
    } catch (e) {
        err(e)
        return false
    }
}

/**
 *
 * @param srcPath wxfile://usr/tmp/dgg3efh573hj73js5sc5/
 * @param dstPath wxfile://usr/languageget/
 */
function copyDir(srcPath, dstPath,upProgressEvent) {
    try{
        // check dst path
        if (!dstPath.endsWith("/")) {
            dstPath += "/"
        }
        //check is exist
        if (isExist(srcPath)) {
            //check is dir
            if (isDir(srcPath)) {
                // check src path
                if (!srcPath.endsWith("/")) {
                    srcPath += "/"
                }
                const pName = srcPath.split("/").reverse()[1]
                const cNameArr = readDir(srcPath)
                return cNameArr.map((cname,i) =>{
                    //up progress
                    if(typeof upProgressEvent=="function"){
                        upProgressEvent(cNameArr.length,i)
                    }
                    return copyDir(srcPath + cname, dstPath + pName,upProgressEvent)
                }).filter(code => code).length == cNameArr.length
            } else{
                return copyFile(srcPath, dstPath + srcPath.split("/").reverse()[0])
            }
        } else {
            err("not find src path",srcPath)
            return false
        }
    }catch (e){
        err(e)
        return false
    }
}

function downUrlFileSync(url, localPath, callback, isShowLoading) {
    const mcallback = (code) => {
        if (typeof callback == "function") {
            callback(code)
        }
    }
    try {
        if (isShowLoading) {
            wx.showLoading({
                title: 'down...',
                mask: true//防止触摸
            })
        }
        removePath(localPath)
        wx.downloadFile({
            url: url,
            complete(a,b) {
               try{
                   var code = a.errMsg.endsWith(":ok")
                   if (!code) {
                       err(a.errMsg)
                   }
                   if (isShowLoading) {
                       wx.hideLoading()
                   }
               }catch (e){
                   err(e)
               }
            },
            success(res) {
                //res:{statusCode,tempFilePath}
                const code = res.statusCode === 200
                if (code) {
                    //copy cache to local
                    const parentPath = localPath.substr(0, localPath.lastIndexOf("/"))
                    if (isDir(parentPath) == false) {
                        mkDir(parentPath)
                    }
                    info("download url file is "+code, url, res)
                    mcallback(copyFile(res.tempFilePath, localPath))
                } else {
                    err("download url file to cache is err.", url)
                    mcallback(code)
                }
            }
        })
    } catch (e) {
        if (isShowLoading) {
            wx.hideLoading()
        }
        err(e)
        mcallback(false)
    }
}

function unzipSync(zipPath, dstPath, callback, isShowLoading) {
    const mcallback = (code) => {
        if (typeof callback == "function") {
            callback(code)
        }
    }
    try {
        if (isShowLoading) {
            wx.showLoading({
                title: 'unzip...',
                mask: true//防止触摸
            })
        }
        //check dst path
        const ppath = dstPath.substr(0, dstPath.lastIndexOf("/"))
        if (isDir(ppath) == false) {
            mkDir(ppath)
        }
        if (false == dstPath.endsWith("/")) {
            dstPath += "/"
        }
        // const jszip=new JSZIP()
        // const iconv=require("../dsf/iconv-lite/index")
        // jszip.loadAsync(readFile(zipPath,"binary"),{decodeFileName: (arraybuffer)=>{
        //     return String.fromCharCode.apply(null, new Uint16Array(arraybuffer));
        //     }}).then(res=>{
        //     //res:{a.txt:{dir:false}}
        //     Object.keys(res.files).map(fname=>{
        //         const dstPath1=dstPath+fname
        //         if(res.files[fname].dir==false){
        //             res.file(res.files[fname].name).async("arraybuffer").then(conter=>{
        //                 writeFile(dstPath1,conter,false,"binary")
        //             })
        //         }
        //     })
        // })

        FSM.unzip({
            zipFilePath: zipPath,
            targetPath: dstPath,
            complete(a,b) {
                if (isShowLoading) {
                    wx.hideLoading()
                }
            },
            success(res) {
                //res:{errMsg:unzip:ok}
                mcallback(res.errMsg.endsWith(":ok"))
            }
        })
    } catch (e) {
        err(e)
    }
}

// ------------------open event----------------------
module.exports.init1 = (log1) => {
    try {
        if (log1 != null) {
            log = log1
        }
        info("init mfile...")
    } catch (e) {
        err(e)
    }

}
module.exports.getUserDir = () => {
    //wxfile://usr/
    return USER_DIR + "/"
}
module.exports.mkDir = mkDir
module.exports.readDir = readDir
module.exports.readFile = readFile
module.exports.writeFile = writeFile
module.exports.getFInfo = getFInfo
module.exports.isExist = isExist
module.exports.isDir = isDir
module.exports.rmPath = removePath
module.exports.downUrlFileSync = downUrlFileSync
module.exports.copyFile = copyFile
module.exports.copyDir = copyDir
module.exports.unzipSync = unzipSync