const UPDATE_TYPES = {
    ADDK: "_ADD_",
    REMOVEK: "_REMOVE_",
    UPDATEK: "_UPDATE_",
    UPK: "_UP_",//交换位置
    TOK: "_TO_"//获取指定元素
}

var localSubjectIdArr=[],log = null, dbName = null,  subjectId = null, _SHOWMODAL = null, _SHOWACTIONSHEET = null,
    LOCAL_CACHE = {}, MY_YUN = null, MY_FILE = null


function info(inf1, inf2, inf3) {
    try {
        if (log == null) {
            console.info("mdb", inf1, inf2, inf3)
        } else log.info("mdb", inf1, inf2, inf3)
    } catch (e) {
        console.error(e)
    }
}

function err(e1, e2, e3) {
    try {
        if (log == null) {
            console.error("mdb", e1, e2, e3)
        } else log.err("mdb", e1, e2, e3)
    } catch (e) {
        console.error(e)
    }
}

function initDB(dbName1, log1, yun1, file1, showModal1, showActionSheet1) {
    try {
        if (log1 != null) {
            log = log1
        }
        info("init mdb...")
        if (dbName1 != null) {
            dbName = dbName1
            info("switch dbName is", dbName)
        }
        if (yun1 != null) {
            MY_YUN = yun1
        }
        if (file1 != null) {
            MY_FILE = file1
        }
        if (showModal1 != null) {
            _SHOWMODAL = showModal1
        }
        if (showActionSheet1 != null) {
            _SHOWACTIONSHEET = showActionSheet1
        }
    } catch (e) {
        err(e)
    }
}

/**
 *
 * @param geo (field不能使用多层{}；并且true和false不能混着用，必须是清一色) {field:{settings:true,times:false},where:{_id:"xxxx"}}
 * where为空时会自动补全
 * @param callback
 * @param isQueryAllSubject
 */
function queryYunDataSync(geo, callback, isShowLoading, isQueryAllSubject) {
    try {
        if (dbName == null || MY_YUN == null || (subjectId == null && false == isQueryAllSubject)) {
            err("db is not init.")
        } else {
            //init geo
            if (geo == null) {
                geo = {}
            }
            //init subjectid
            if (subjectId != null && isQueryAllSubject != true) {
                if (geo.where == null) {
                    geo.where = {_id: subjectId}
                } else if (geo.where._id == null) {
                    geo.where._id = subjectId
                }
            }
            MY_YUN.yunSync("database",
                {queryType: "query", geo: geo, dbName: dbName},
                callback, isShowLoading)//code,arr
        }
    } catch (e) {
        err(e)
    }
}

function queryLocalData(geo) {
    try {
        if (geo != null && geo.field != null) {
            const newCache = {}
            //正向选择
            Object.keys(geo.field).map(field => {
                if (geo.field[field] == true) {
                    if (LOCAL_CACHE[field] != null) {
                        newCache[field] = LOCAL_CACHE[field]
                    } else {
                        try {
                            //read local data to cache
                            const fPath = getSubjectPath() + field
                            if (MY_FILE.isExist(fPath) == false) {
                                MY_FILE.writeFile(fPath, "{}")
                            }
                            newCache[field] = LOCAL_CACHE[field] = JSON.parse(MY_FILE.readFile(fPath))
                        } catch (e) {
                            err("read local data is fail", e)
                        }
                    }
                }
            })
            //反向选择
            // if(Object.keys(newCache).length==0){
            //     Object.keys(_CACHE).map(field=>{
            //         if(geo.field[field]!=false){
            //             newCache[field]=_CACHE[field]
            //         }
            //     })
            // }
            return JSON.parse(JSON.stringify(newCache))
        } else {
            return JSON.parse(JSON.stringify(LOCAL_CACHE))
        }
    } catch (e) {
        err(e)
        return null
    }
}

function downloadYunMediaToLocalSync(infos, callback, isShowLoading) {
    const mcallback = (code1) => {
        if (isShowLoading) {
            wx.hideLoading()
        }
        if (typeof callback == "function") {
            callback(code1)
        }
    }
    try {
        if (isShowLoading) {
            wx.showLoading({
                title: 'down media...',
                mask: true//防止触摸
            })
        }
        const dbPath=getDBPath()
        const mediatypes = queryLocalData({field: {settings: true}}).settings.mediatypes
        const skcodeArr= Object.keys(infos)
        var downloadNumber = 0
        skcodeArr.map(skcode => {
            const infoData = infos[skcode]
            for (const mediaType in infoData) {
                //check info key is media type
                if (
                    mediatypes.indexOf(mediaType) >= 0
                    && typeof infoData[mediaType] == "string"
                    && infoData[mediaType].trim().length > 0
                ) {
                    const mediaPath = getMediaPathByMType(skcode, mediaType, infoData[mediaType], false)
                    //rm old media
                    if (MY_FILE.isExist(mediaPath)) {
                        MY_FILE.rmPath(mediaType)
                    }
                    downloadNumber += 1
                    MY_YUN.downloadFileSync(mediaPath.replace(dbPath, "").replace("/media/","/"),
                        mediaPath, (code) => {
                        downloadNumber -= 1
                        if (downloadNumber == 0) {
                            mcallback(code)
                        }
                    }, false)
                }
            }
        })
        if(skcodeArr.length==0){
            mcallback(true)
        }
    } catch (e) {
        err(e)
        mcallback(false)
    }
}

function downloadSubjectToLocalSync(callback, isShowLoading) {
    queryYunDataSync({}, (code, arr) => {
        const mcallback = (code1) => {
            if (typeof callback == "function") {
                callback(code1)
            }
        }
        try {
            if (code && arr != null && arr[0] != null) {
                const datas = arr[0]
                //write data to local file by field
                for (const field in datas) {
                    const wcode = MY_FILE.writeFile(getSubjectPath() + field, JSON.stringify(datas[field]))
                    if (!wcode) {
                        code = false
                        err("write data is err", field)
                    }
                }
                //download yun media
                downloadYunMediaToLocalSync(datas.infos, callback, isShowLoading)
            } else {
                err("read yun data is err")
                mcallback(false)
            }
        } catch (e) {
            err(e)
            mcallback(false)
        }
    }, isShowLoading)
}

function switchSubjectByYunSync(callback, isShowLoading) {
    queryYunDataSync({field: {_id: true, subject: true}}, (code, arr) => {
        const mcallback = (code) => {
            if (typeof callback == "function") {
                callback(code != null ? code : (subjectId != null))
            }
        }
        try {
            if (code) {
                if (arr.length == 0) {
                    err("subject arr length is 0.")
                    mcallback()
                } else {
                    _SHOWACTIONSHEET(arr.map(o => o.subject), (sval, sindex) => {
                        const downloadSubject = () => {
                            if (subjectId != arr[sindex]._id) {
                                subjectId = arr[sindex]._id
                                info("switch subjectid", subjectId)
                            }
                            //clean cache
                            LOCAL_CACHE = {}
                            //clean local data...
                            const subjectPath = getSubjectPath()
                            if (MY_FILE.isExist(subjectPath)) {
                                MY_FILE.rmPath(subjectPath)
                            }
                            MY_FILE.mkDir(subjectPath)
                            //download yun subject to local
                            downloadSubjectToLocalSync(callback, isShowLoading)
                        }
                        if (localSubjectIdArr.indexOf(arr[sindex]._id) >= 0) {
                            _SHOWMODAL("cover local subject?", downloadSubject, () => {
                            })
                        } else {
                            downloadSubject()
                        }
                    }, mcallback)
                }
            } else {
                mcallback()
            }
        } catch (e) {
            err(e)
            mcallback()
        }
    }, isShowLoading, true)
}

function switchSubjectSync(callback, isShowLoading, isDefaultSelected, defSubjectId) {
    try {
        const dbPath = getDBPath()
        //check local subject is not null
        if (((localSubjectIdArr = MY_FILE.readDir(dbPath)).length > 0) == false) {
            //clean data
            subjectId = null
            LOCAL_CACHE = {}
            switchSubjectByYunSync(callback, isShowLoading)
        } else {
            const mcallback = () => {
                LOCAL_CACHE = {}//clean data
                if (typeof callback == "function") {
                    callback(localSubjectIdArr.indexOf(subjectId) >= 0)//if subjectid is null throw err
                }
            }
            //def select
            if (isDefaultSelected) {
                //check def subjectId
                if (defSubjectId != null && localSubjectIdArr.indexOf(defSubjectId) >= 0) {
                    subjectId = defSubjectId
                    info("switch subjectid", subjectId)
                }
                //check old subjectId
                else if (localSubjectIdArr.indexOf(subjectId) < 0) {
                    subjectId = localSubjectIdArr[0]
                    info("def selected first subjectid", subjectId)
                } else {
                    info("def old subjectid", subjectId)
                }
                mcallback()
            } else {
                //user select
                const subjectNameArr = localSubjectIdArr.map(subjectid => MY_FILE.readFile(getSubjectPath(subjectid) + "subject"))
                subjectNameArr.push("yun")
                _SHOWACTIONSHEET(subjectNameArr, (sval, sindex) => {
                    if (sval == "yun") {
                        //switch by yun
                        switchSubjectByYunSync(callback, isShowLoading)
                    } else {
                        subjectId = localSubjectIdArr[sindex]
                        info("selected subjectid", subjectId)
                        mcallback()
                    }
                }, mcallback)
            }
        }
    } catch (e) {
        if (isShowLoading) {
            wx.hideLoading()
        }
        if (typeof callback == "function") {
            callback(false)
        }
        err(e)
    }
}


function getSubjectId() {
    return subjectId
}

function getDBPath(){
    return MY_FILE.getUserDir() + dbName + "/"
}
function getSubjectPath(subjectid1) {
    return getDBPath() + (subjectid1 != null ? subjectid1 : subjectId) + "/"
}

function getMediaDir() {
    return getSubjectPath() + "media/"
}

function getMediaPathByMType(skcode, mediaType, suffix, isCheckExist, infoData) {
    try {
        if (suffix == null && infoData != null && typeof infoData[mediaType] == "string") {
            suffix = infoData[mediaType]
        }
        const mediaPath = getMediaDir() + mediaType + "/" + skcode + "." + suffix
        return isCheckExist == false || MY_FILE.isExist(mediaPath) ? mediaPath : null
    } catch (e) {
        err(e)
    }
}

/**
 *
 * @param updateGeo {counts:{k1:"_REMOVE_",k2:"_UPDATE_newk0"},
 *                   keys:[number,_ADD_newv1,_REMOVE_oldv2_i2,_UPDATE_newv3_oldv3_i3,{_TO_:i4,v:v4}...]}
 *                   object的ADD和UPDATE只要带上新的值即可
 * @param data1
 * @param dk1
 */
function loopUpdateCache(updateGeo, data1, dk1) {
    //get new cache data
    if (data1 == null) {
        const qGeo = {field: {}}
        Object.keys(updateGeo).map(field => qGeo.field[field] = true)
        LOCAL_CACHE = {}//clean cache data
        queryLocalData(qGeo)
        data1 = LOCAL_CACHE
    }

    if (updateGeo instanceof Array && data1 instanceof Array) {
        updateGeo.map(geov => {
            if (typeof geov != "string") {
                //geov:{_TO_:3,v:obj}
                if (geov[UPDATE_TYPES.TOK] >= 0 && typeof geov.v == "object" && typeof data1[geov[UPDATE_TYPES.TOK]] == "object") {
                    info("cache arr to", geov[UPDATE_TYPES.TOK])
                    loopUpdateCache(geov.v, data1[geov[UPDATE_TYPES.TOK]], geov[UPDATE_TYPES.TOK])
                } else {
                    //直接添加非字符串基本类型
                    info("cache arr add", geov)
                    data1.push(geov)
                }
            } else if (geov.startsWith(UPDATE_TYPES.ADDK)) {
                //geov:_ADD_newv1
                const v1 = geov.split(UPDATE_TYPES.ADDK)[1]
                info("cache arr add", v1)
                data1.push(v1)
            } else if (geov.startsWith(UPDATE_TYPES.REMOVEK)) {
                //geov:_REMOVE_oldv2_i2
                const tmp = geov.split(UPDATE_TYPES.REMOVEK)[1].split("_")
                const oldv = tmp[0]
                var i = parseInt(tmp[1])
                if (i >= 0) {
                    if (data1[i] == oldv) {
                        info("cache arr remove by index", oldv, i, oldv)
                        data1.splice(i, 1)
                    } else {
                        err("cache arr data is not find", i, oldv)
                    }
                } else if ((i = data1.indexOf(oldv)) >= 0) {//不准确，如果数组元素存在重复则可能删除错误
                    info("cache arr remove by old val", oldv)
                    data1.splice(i, 1)
                } else {
                    err("cache arr is not find", oldv)
                }
            } else if (geov.startsWith(UPDATE_TYPES.UPDATEK)) {
                //geov:_UPDATE_newv3_oldv3_i3
                const tmp = geov.split(UPDATE_TYPES.UPDATEK)[1].split("_")
                const newVal = tmp[0]
                const oldVal = tmp[1]
                var i = parseInt(tmp[2])
                if (i >= 0) {
                    if (data1[i] == oldVal) {
                        info("cache arr node update by index", oldVal, i, newVal)
                        data1.splice(i, 1, newVal)
                    } else {
                        err("cache arr data is not find", i, oldVal)
                    }
                } else if ((i = data1.indexOf(oldVal)) >= 0) {
                    //不准确，如果数组元素存在重复则可能修改错误
                    info("cache arr node update by old val", oldVal, newVal)
                    data1.splice(i, 1, newVal)
                } else {
                    err("cache arr node is not find", oldVal, i)
                }
            } else if (geov.startsWith(UPDATE_TYPES.UPK)) {
                //geoVale:_UP_i4
                const i = parseInt(geov.split(UPDATE_TYPES.UPK)[1])
                if (data1[i] != null && data1.length - i >= 2) {
                    info("cache arr up by index", i)
                    data1.splice(i, 2, data1[i + 1], data1[i])
                } else {
                    err("cache arr up is err", i)
                }
            } else {
                err("cache arr update type is not find", geov)
            }
        })
    } else if (updateGeo instanceof Object && data1 instanceof Object) {
        Object.keys(updateGeo).map(objk => {
            if (typeof updateGeo[objk] == "object" && typeof data1[objk] == "object") {
                loopUpdateCache(updateGeo[objk], data1[objk], objk)
            } else {
                if (updateGeo[objk] == UPDATE_TYPES.REMOVEK) {
                    info("cache object remove", objk)
                    delete data1[objk]
                } else if (typeof updateGeo[objk] == "string" && updateGeo[objk].startsWith(UPDATE_TYPES.UPDATEK)) {
                    //updateGeo[k]:_UPDATE_newk0
                    const nobjk = updateGeo[objk].split(UPDATE_TYPES.UPDATEK)[1]
                    //check is cover
                    if (data1[nobjk] != null) {
                        err("cache object new key is cover", nobjk)
                    } else {
                        info("cache object update key", objk, nobjk, nobjk)
                        data1[nobjk] = data1[objk]
                        delete data1[objk]
                    }
                } else {
                    info("cache object update val", objk, updateGeo[objk])
                    data1[objk] = updateGeo[objk]
                }
            }
        })
    } else {
        err("loop is err", updateGeo, data1)
    }
}

function updateLocalData(updateGeo) {
    try {
        //update cache
        loopUpdateCache(updateGeo)
        const subjectPath = getSubjectPath()
        var code = true
        Object.keys(LOCAL_CACHE).map(field => {
            const wcode = MY_FILE.writeFile(subjectPath + field, JSON.stringify(LOCAL_CACHE[field]))
            if (wcode != true) {
                code = false
            }
            info("update local data", field, wcode)
        })
        removeProgress()
        return code
    } catch (e) {
        err(e)
        return false
    }
}
function removeProgress(){
    try{
        //remove progress
        const proPath = getSubjectPath() + "progress"
        if (MY_FILE.isExist(proPath)) {
            const prObj = JSON.parse(MY_FILE.readFile(proPath))
            if (prObj.thisProgress < 0
                // ||prObj.saveProgress>=prObj.skeyArr.length-1
            ) {
                MY_FILE.rmPath(getSubjectPath() + "progress")
            }
        }
    }catch (e){
        err(e)
    }
}

function uploadLocalSubjectToYun(subjectid1, callback, isShowLoading) {
    const mcallback = (code1) => {
        if (typeof callback == "function") {
            callback(code1)
        }
    }
    try {
        const subjectPath = getSubjectPath(subjectid1)
        const newSubject = {}
        //filter field
        const filterField = [
            // "counts","golds","progress"
        ]
        MY_FILE.readDir(subjectPath).filter(fname => MY_FILE.isDir(subjectPath + fname) == false)
            .map(field => {
                const jsonObj = JSON.parse(MY_FILE.readFile(getSubjectPath() + field))
                if (filterField.indexOf(field) < 0) {
                    newSubject[field] = jsonObj
                } else {
                    if (jsonObj instanceof Array) {
                        newSubject[field] = []
                    } else {
                        switch (typeof jsonObj) {
                            case "object":
                                newSubject[field] = {}
                                break;
                            case "string":
                                newSubject[field] = ""
                                break;
                            case "number":
                                newSubject[field] = -1
                                break;
                            case "boolean":
                                newSubject[field] = false
                                break;
                        }
                    }
                }
            })
        //up to yun
        MY_YUN.yunSync("database",
            {queryType: "mupdate", geo: {where: {_id: subjectid1}}, newSubject: newSubject, dbName: dbName},
            (code2) => {
                if (code2) {
                    //show loading
                    if (isShowLoading) {
                        wx.showLoading({
                            title: 'delYFile...',
                            mask: true//防止触摸
                        })
                    }
                    //del yun file...
                    MY_YUN.yunSync("deldir",
                        {dirName: getSubjectId()},
                        (code) => {
                            wx.hideLoading()
                            //upload yun file...
                            if (code) {
                                uploadLocalMediaToYunSync(newSubject.infos, newSubject.settings.mediatypes, mcallback, isShowLoading)
                            }
                        }, false)
                }
            }, isShowLoading)//code,arr
    } catch (e) {
        err(e)
        mcallback(false)
    }
}

function uploadLocalMediaToYunSync(infos, mediatypes, callback, isShowLoading) {
    const mcallback = (code1) => {
        if (typeof callback == "function") {
            callback(code1)
        }
    }
    try {
        if (isShowLoading) {
            wx.showLoading({
                title: 'upload...',
                mask: true//防止触摸
            })
        }

        var isUpload = false
        var uploadNumber = 0
        const dbPath=getDBPath()
        Object.keys(infos).map(skcode => {
            const infoData = infos[skcode]
            for (const mediaType in infoData) {
                if (
                    mediatypes.indexOf(mediaType) >= 0
                    && typeof infoData[mediaType] == "string"
                    && infoData[mediaType].trim().length > 0
                ) {
                    const localPath = getMediaPathByMType(skcode, mediaType, infoData[mediaType], true)
                    //check media is exist
                    if (localPath != null) {
                        isUpload = true
                        uploadNumber += 1
                        MY_YUN.uploadFileSync(localPath, localPath.replace(dbPath, "")
                            .replace("/media/","/"), (code) => {
                            uploadNumber -= 1
                            if (uploadNumber == 0) {
                                if (isShowLoading) {
                                    wx.hideLoading()
                                }
                                mcallback(code)
                            }
                        }, false)
                    }
                }
            }
        })
        if (isUpload == false) {
            if (isShowLoading) {
                wx.hideLoading()
            }
            mcallback(true)
        }
    } catch (e) {
        if (isShowLoading) {
            wx.hideLoading()
        }
        err(e)
        mcallback(false)
    }
}

// ------------------open event----------------------
module.exports.init1 = initDB

module.exports.switchSubjectSync = switchSubjectSync
module.exports.switchSubjectByYunSync = switchSubjectByYunSync

module.exports.query1 = queryLocalData

module.exports.UPDATE_TYPES = UPDATE_TYPES
module.exports.update1 = updateLocalData
module.exports.uploadLocalSubjectToYun = uploadLocalSubjectToYun

module.exports.getSubjectId = getSubjectId
module.exports.getSubjectPath = getSubjectPath
module.exports.getMediaPathByMType = getMediaPathByMType


