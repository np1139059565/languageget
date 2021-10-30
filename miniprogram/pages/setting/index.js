//index.js
const app = getApp()
var SETTINGS = null
Page({
    data: {
        dProgress: {
            isShow: false,
            pro: 0,
        },
        dTrArr: [
            // {k,tdArr:[{type,pickerval,rangeArr,ev,evData,coverVal,pickerval,text}]}
        ]
    },
    onLoad: function () {
        try {
            //init default button
            this.data.dTrArr = [
                {
                    k: "to page",
                    tdArr: [
                        {
                            type: "button",
                            text: "table",
                            ev: "openPage",
                            evData: "/pages/table/index",
                        },
                        //ttttttttttt
                        {
                            type: "button",
                            text: "files",
                            ev: "openPage",
                            evData: "/pages/file/index",
                        }
                    ]
                },
                {
                    k: "subject",
                    tdArr: [
                        {
                            type: "button",
                            text: "↑",
                            ev: "uploadSubjectToLocal",
                            // evData:i,
                        },
                        {
                            type: "button",
                            text: "↓",
                            ev: "downYunSubject",
                            // evData:i,
                        }
                    ]
                }
            ]
            const dbPath = app.data.mdb.getDBPath()
            //get subject arr
            app.data.mfile.readDir(dbPath).map(subjectId => this.data.dTrArr.push({
                k: "",
                tdArr: [{
                    type: "button",
                    text: app.data.mfile.readFile(dbPath + subjectId + "/subject"),//subject name
                    ev: "showSubjectMenu",
                    evData: subjectId,
                    ev2: "saveEditSubjectName",
                    evData2: "0;" + this.data.dTrArr.length + ";0"
                }]
            }))
            this.setData(this.data)
            this.switchSubjectSync1(true)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },

    uploadProgress: function (total, p) {
        try {
            //up pro
            this.data.dProgress.pro = (p / total * 100)
            //0<=pro<100 show
            if (this.data.dProgress.pro >= 0 && this.data.dProgress.pro < 100) {
                this.data.dProgress.isShow = true
            } else {
                this.data.dProgress.isShow = false
            }
            this.setData(this.data)
        } catch (e) {
            this.data.dProgress.isShow = false
            this.setData(this.data)
            app.data.mlog.err(e)
        }
    },
    openPage: function (e) {
        wx.navigateTo({
            url: e.currentTarget.dataset.event1Data1,
        })
    },
    showSubjectMenu: function (e) {
        try {
            const subjectId = e.currentTarget.dataset.event1Data1
            var tdInfo=null
            this.data.dTrArr.filter(trInfo =>
                trInfo.tdArr.filter(tdInfo1 =>{
                    if(tdInfo1.evData == subjectId){
                        tdInfo=tdInfo1
                    }
                }))
            //check is open edit
            if(tdInfo!=null&&tdInfo.type!="input"){
                //show menu
                app.showActionSheet([
                    ///ttttttttttt
                    "upload",
                    "remove",
                    "edit",
                    "download"
                ], (sval) => {
                    switch (sval) {
                        case "upload":
                            this.uploadSubjectToYun(subjectId)
                            break;
                        case "remove":
                            this.removeSubject(subjectId)
                            break;
                        case "edit":
                            //open edit
                            tdInfo.type = "input"
                            this.setData(this.data)
                            break;
                        case "download":
                            this.downLocalSubject(subjectId)
                            break;
                    }
                })
            }else{
                this.changeInputStr(e)
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    saveEditSubjectName:function (e){
        try{
            const subjectId = e.currentTarget.dataset.event1Data1
            const subjectName=app.data.mfile.readFile(app.data.mdb.getDBPath() + subjectId + "/subject").toLowerCase()//subject name
            var newSubjectName=null
            this.data.dTrArr.filter(trInfo =>
                trInfo.tdArr.filter(tdInfo => {
                        if (tdInfo.evData == subjectId) {
                            newSubjectName=tdInfo.text.trim().toLowerCase()
                        }
                    }))
            if(newSubjectName!=subjectName){
                app.showModal("re '"+subjectName+"' to '"+newSubjectName+"'?",()=>{
                    app.data.mfile.writeFile(app.data.mdb.getDBPath() + subjectId + "/subject",newSubjectName)
                    this.onLoad()
                },()=>{})
            }
        }catch (e1){
            app.data.mlog.err(e1)
        }
    },
    switchSubjectSync1: function (isDefaultSelected) {
        try {
            app.data.mdb.switchSubjectSync((code) => {
                if (code) {
                    this.data.dTrArr[0].tdArr.filter(td => td.text == "table")[0].type = "button"//open table button
                    //refush title
                    wx.setNavigationBarTitle({
                        title: app.data.mdb.query1({field: {subject: true}}).subject
                    })

                    //query settings
                    try {
                        SETTINGS = app.data.mdb.query1({field: {settings: true}}).settings
                        this.getTrInfoByHeadArr(JSON.parse(JSON.stringify(SETTINGS.heads)))
                        this.getTrInfoByFZKTS(JSON.parse(JSON.stringify(SETTINGS.fzkts)))
                        this.getTrInfoByByINPUTS(JSON.parse(JSON.stringify(SETTINGS.inputs)))
                        //parse setting
                        Object.keys(SETTINGS).map(k => this.getViewInfo(k, SETTINGS[k]))
                    } catch (e2) {
                        app.data.mlog.err(e2)
                    }
                } else if (app.data.mdb.getSubjectId() == null) {
                    this.data.dTrArr[0].tdArr.filter(td => td.text == "table")[0].type = ""//close table button
                    wx.setNavigationBarTitle({
                        title: "settings"
                    })
                }
                this.setData(this.data)
            }, true, isDefaultSelected == true)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    getViewInfo(settingk, settingv) {
        if (settingk == "heads") {
            // this.getTrInfoByHeadArr(settingv)
        } else if (settingk == "fzkts") {
            // this.getTrInfoByFZKTS(settingv)
        } else if (settingk == "inputs") {
            // this.getTrInfoByByINPUTS(settingv)
        } else if (typeof settingv == "string" || settingv >= 0 || settingv < 0) {
            //string to picker
            const pickerInfo = {
                type: "picker",
                ev: "changePicker",
                evData: this.data.dTrArr.length,
                rangeArr: SETTINGS.heads
            }
            if (SETTINGS.heads.indexOf(settingv) < 0 && (settingv >= 0 || settingv < 0)) {
                settingv = parseInt(settingv)
                pickerInfo.rangeArr = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(p => settingv + p)
            }
            pickerInfo.pickerval = pickerInfo.rangeArr.indexOf(settingv)
            if (pickerInfo.pickerval < 0) {
                //找不到对应的val只显示
                pickerInfo.text = settingv
                pickerInfo.type = ""
                pickerInfo.ev = ""
            }
            this.data.dTrArr.push({
                k: settingk,
                tdArr: [pickerInfo]
            })
        } else if (settingv instanceof Array) {
            if (settingv.filter(v => typeof v == "string" || v >= 0 || v < 0).length == settingv.length) {
                //arr to picker
                this.data.dTrArr.push({
                    k: settingk,
                    tdArr: settingv.map((v1, j) => {
                        const pickerInfo = {
                            // pickerval:SETTINGS.heads.indexOf(v1),
                            type: "picker",
                            ev: "changePickerArr1",
                            evData: settingk + ";" + this.data.dTrArr.length + ";" + j,
                            rangeArr: SETTINGS.heads
                        }
                        if (SETTINGS.heads.indexOf(v1) < 0) {
                            v1 = parseInt(v1)
                            pickerInfo.rangeArr = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(p => v1 + p)
                        }
                        pickerInfo.pickerval = pickerInfo.rangeArr.indexOf(v1)
                        if (pickerInfo.pickerval < 0) {
                            //找不到对应的val只显示
                            pickerInfo.text = settingv
                            pickerInfo.type = ""
                            pickerInfo.ev = ""
                        }
                        return pickerInfo
                    })
                })
            }
        }
    },
    getTrInfoByHeadArr(headArr) {
        try {
            headArr.map((h, dataIndex) => {
                const trIndex = this.data.dTrArr.length
                const trInfo = {
                    k: dataIndex > 0 ? dataIndex : "heads",
                    tdArr: [
                        {
                            text: h
                        },
                        {
                            type: "button",
                            text: "↑",
                            ev: "upArrIndex",
                            evData: "heads;" + trIndex + ";" + (dataIndex - 1)
                        },
                        {
                            type: "button",
                            text: "↓",
                            ev: "upArrIndex",
                            evData: "heads;" + trIndex + ";" + dataIndex
                        },
                        {
                            type: "button",
                            text: "x",
                            ev: "removeArrNodeByIndex",
                            evData: "heads;" + trIndex + ";" + dataIndex
                        }
                    ]
                }
                //remove up
                if (dataIndex == 0) {
                    trInfo.tdArr[1].type = ""
                    trInfo.tdArr[1].text = ""
                }
                //remove down
                if (dataIndex >= headArr.length - 1) {
                    trInfo.tdArr[2].type = ""
                    trInfo.tdArr[2].text = ""
                }
                this.data.dTrArr.push(trInfo)
            })
            //add new head button
            this.data.dTrArr.push({
                k: "add head",
                tdArr: [
                    {
                        type: "input",
                        text: "",
                        ev: "changeInputStr",
                        evData: "heads;" + this.data.dTrArr.length + ";0"
                    },
                    {
                        type: "button",
                        text: "+",
                        ev: "addHead",
                        evData: "heads;" + this.data.dTrArr.length + ";0"
                    }
                ]
            })
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    getTrInfoByFZKTS(FZKTSA2A) {
        try {
            FZKTSA2A.map((fzk2arr, dataIndex) => {
                fzk2arr.push("↑", "↓", "x");
                const trInfo = {
                    k: dataIndex > 0 ? dataIndex : "fzkts",
                    tdArr: fzk2arr.map((h, tdIndex) => {
                        var pickerInfo = {
                            type: "picker",
                            pickerval: SETTINGS.heads.indexOf(h),
                            ev: "changePickerArr2",
                            evData: "fzkts" + ";" + this.data.dTrArr.length + ";" + tdIndex,
                            rangeArr: SETTINGS.heads
                        }
                        //找不到对应的val只显示
                        if (pickerInfo.pickerval < 0) {
                            pickerInfo.text = h
                            pickerInfo.type = ""
                            pickerInfo.ev = ""
                        }
                        if (["↑", "↓", "x"].indexOf(h) >= 0) {
                            pickerInfo = {
                                type: "button",
                                text: h,
                                ev: "upArrIndex",
                                evData: "fzkts;" + this.data.dTrArr.length + ";" + dataIndex
                            }
                            if (h == "↑") {
                                pickerInfo.evData = ("fzkts;" + this.data.dTrArr.length + ";" + (dataIndex - 1))
                            }
                            if (h == "x") {
                                pickerInfo.ev = "removeArrNodeByIndex"
                            }
                        }
                        return pickerInfo
                    })
                }
                if (dataIndex == 0) {
                    trInfo.tdArr[trInfo.tdArr.length - 2].type = ""
                    trInfo.tdArr[trInfo.tdArr.length - 2].text = ""
                }
                if (dataIndex >= FZKTSA2A.length - 1) {
                    trInfo.tdArr[trInfo.tdArr.length - 2].type = ""
                    trInfo.tdArr[trInfo.tdArr.length - 2].text = ""
                }
                this.data.dTrArr.push(trInfo)

            })
            //add new fzk button
            this.data.dTrArr.push({
                k: "add fzk",
                tdArr: [
                    {
                        type: "button",
                        text: "+",
                        ev: "addFZK2"
                    }
                ]
            })
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    getTrInfoByByINPUTS(inputArr) {
        try {
            inputArr.map((h, dataIndex) => {
                const trIndex = this.data.dTrArr.length
                const trInfo = {
                    k: dataIndex > 0 ? dataIndex : "inputs",
                    tdArr: [
                        {
                            text: h
                        },
                        {
                            type: "button",
                            text: "↑",
                            ev: "upArrIndex",
                            evData: "inputs;" + trIndex + ";" + (dataIndex - 1)
                        },
                        {
                            type: "button",
                            text: "↓",
                            ev: "upArrIndex",
                            evData: "inputs;" + trIndex + ";" + dataIndex
                        },
                        {
                            type: "button",
                            text: "x",
                            ev: "removeArrNodeByIndex",
                            evData: "inputs;" + trIndex + ";" + dataIndex
                        }
                    ]
                }
                //remove up
                if (dataIndex == 0) {
                    trInfo.tdArr[1].type = ""
                    trInfo.tdArr[1].text = ""
                }
                //remove down
                if (dataIndex >= inputArr.length - 1) {
                    trInfo.tdArr[2].type = ""
                    trInfo.tdArr[2].text = ""
                }
                this.data.dTrArr.push(trInfo)
            })

            this.data.dTrArr.push({
                k: "add input",
                tdArr: [{
                    pickerval: 0,
                    type: "picker",
                    coverVal: "+",
                    ev: "addInputHead",
                    evData: this.data.dTrArr.length,
                    rangeArr: SETTINGS.heads
                }]
            })
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    changeInputStr: function (e) {
        try {
            const tmp = e.currentTarget.dataset.event1Data1.split(";")
            const trIndex = parseInt(tmp[1])
            const tdIndex = parseInt(tmp[2])
            this.data.dTrArr[trIndex].tdArr[tdIndex].text = e.detail.value
            this.setData(this.data)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    addHead: function (e) {
        try {
            const trIndex = e.currentTarget.dataset.event1Data1.split(";")[1]
            const newHead = this.data.dTrArr[trIndex].tdArr[0].text.trim()
            if (SETTINGS.heads.indexOf(newHead) >= 0) {
                app.showModal("head is cover!")
            } else if (newHead.length > 0) {
                app.showModal("add " + newHead + "?", () => {
                    //save to local
                    app.data.mdb.update1({
                        settings: {
                            heads: [app.data.mdb.UPDATE_TYPES.ADDK + newHead]
                        }
                    })
                    this.onLoad()
                }, () => {
                })
            } else {
                app.showModal("head is not null~")
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    addFZK2: function () {
        try {
            app.showModal("add new fzk?", () => {
                //save to local
                app.data.mdb.update1({
                    settings: {
                        fzkts: [SETTINGS.fzkts[SETTINGS.fzkts.length - 1]]
                    }
                })
                this.onLoad()
            }, () => {
            })
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    addInputHead: function (e) {
        try {
            const trIndex = e.currentTarget.dataset.event1Data1
            const sindex = e.detail.value
            const newInputStr = this.data.dTrArr[trIndex].tdArr[this.data.dTrArr[trIndex].tdArr.length - 1].rangeArr[sindex]
            if (SETTINGS.inputs.indexOf(newInputStr) < 0) {
                app.showModal("add " + newInputStr + "?", () => {
                    //save to local
                    app.data.mdb.update1({
                        settings: {
                            inputs: [app.data.mdb.UPDATE_TYPES.ADDK + newInputStr]
                        }
                    })
                    this.onLoad()
                }, () => {
                })
            } else {
                app.showModal("is cover!")
            }

        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },

    removeArrNodeByIndex: function (e, settingk, dataIndex) {
        try {
            if (e != null) {
                const tmp = e.currentTarget.dataset.event1Data1.split(";")
                settingk = tmp[0]
                dataIndex = parseInt(tmp[2])
            }
            const oldv = SETTINGS[settingk][dataIndex]
            app.showModal("remove " + JSON.stringify(oldv), () => {
                //save to local
                app.data.mdb.update1({
                    settings: {
                        [settingk]: [app.data.mdb.UPDATE_TYPES.REMOVEK + oldv + "_" + dataIndex]
                    }
                })
                this.onLoad()
            }, () => {
            })
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    upArrIndex: function (e) {
        try {
            //settingk;trIndex,dataIndex
            const tmp = e.currentTarget.dataset.event1Data1.split(";")
            const settingk = tmp[0]
            const trIndex = parseInt(tmp[1])
            var dataIndex = parseInt(tmp[2])
            //save to local
            app.data.mdb.update1({
                settings: {
                    [settingk]: [app.data.mdb.UPDATE_TYPES.UPK + dataIndex]
                }
            })
            SETTINGS = app.data.mdb.query1({field: {settings: true}}).settings
            const firstIndex = this.data.dTrArr.findIndex(trInfo => trInfo.k == settingk)
            if (settingk == "heads") {
                this.data.dTrArr.splice(firstIndex, SETTINGS.heads.length + 1)
                this.getTrInfoByHeadArr(SETTINGS.heads)
            } else if (settingk == "fzkts") {
                this.data.dTrArr.splice(firstIndex, SETTINGS.fzkts.length)
                this.getTrInfoByFZKTS(SETTINGS.fzkts)
            } else if (settingk == "inputs") {
                this.data.dTrArr.splice(firstIndex, SETTINGS.inputs.length + 1)
                this.getTrInfoByByINPUTS(SETTINGS.inputs)
            }
            this.setData(this.data)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    changePicker: function (e) {
        try {
            const trIndex = e.currentTarget.dataset.event1Data1
            const sindex = e.detail.value
            const pickerInfo = this.data.dTrArr[trIndex].tdArr[0]
            if (sindex != pickerInfo.pickerval) {
                //save to local
                app.data.mdb.update1({settings: {[this.data.dTrArr[trIndex].k]: this.data.dTrArr[trIndex].tdArr[0].rangeArr[sindex]}})
                //change view data
                pickerInfo.pickerval = sindex
                this.setData(this.data)
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    changePickerArr1: function (e) {
        try {
            const tmp = e.currentTarget.dataset.event1Data1.split(";")
            const settingk = tmp[0]
            const trIndex = tmp[1]
            const tdIndex = tmp[2]
            const sindex = e.detail.value
            const pickerInfo = this.data.dTrArr[trIndex].tdArr[tdIndex]
            const rangeArr = this.data.dTrArr[trIndex].tdArr[tdIndex].rangeArr
            if (sindex != pickerInfo.pickerval) {
                //save to local
                const updateGeo = {
                    settings: {
                        [settingk]: [
                            app.data.mdb.UPDATE_TYPES.UPDATEK
                            + rangeArr[sindex] + "_" + rangeArr[pickerInfo.pickerval] + "_" + tdIndex
                        ]
                    }
                }
                app.data.mdb.update1(updateGeo)
                //change view data
                this.data.dTrArr[trIndex].tdArr[tdIndex].pickerval = sindex
                this.setData(this.data)
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    changePickerArr2: function (e) {
        try {
            const sindex = e.detail.value
            const tmp = e.currentTarget.dataset.event1Data1.split(";")
            const settingk = tmp[0]
            const trIndex = parseInt(tmp[1])
            const tdIndex = parseInt(tmp[2])

            const trInfo = this.data.dTrArr[trIndex]
            const toIndex = trInfo.k != settingk ? parseInt(trInfo.k) : 0
            const pickerInfo = trInfo.tdArr[tdIndex]
            const rangeArr = this.data.dTrArr[trIndex].tdArr[tdIndex].rangeArr
            if (sindex != pickerInfo.pickerval) {
                //save to local
                const updateGeo = {
                    settings: {
                        [settingk]: [{
                            [app.data.mdb.UPDATE_TYPES.TOK]: toIndex,
                            v: [app.data.mdb.UPDATE_TYPES.UPDATEK + rangeArr[sindex] + "_" + rangeArr[pickerInfo.pickerval] + "_" + tdIndex]
                        }]
                    }
                }
                app.data.mdb.update1(updateGeo)
                //change view data
                this.data.dTrArr[trIndex].tdArr[tdIndex].pickerval = sindex
                this.setData(this.data)
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    downLocalSubject: function (subjectId) {
        try {
            // check is this subject
            if (subjectId == app.data.mdb.getSubjectId()) {
                const subjectName = app.data.mdb.query1({field: {subject: true}}).subject
                app.showModal("dowmload " + subjectName + "?", () => {
                    const tmpPath = app.data.mfile.getUserDir() + "tmp/"
                    const mzipName = subjectId + ".mzip"
                    try {
                        //clean tmp path
                        if (app.data.mfile.isExist(tmpPath)) {
                            app.data.mfile.rmPath(tmpPath)
                        }
                        //show progress
                        this.data.dProgress.isShow = true
                        this.setData(this.data)
                        //package media
                        const dbPath = app.data.mdb.getDBPath()
                        this.packMZIPSync(dbPath + subjectId, tmpPath, (code) => {
                            try {
                                //hide progress
                                this.data.dProgress.isShow = false
                                this.setData(this.data)
                                if (code) {
                                    wx.openDocument({
                                        filePath: tmpPath + mzipName,
                                        showMenu: true,
                                        fileType: "xls",
                                        success(res) {
                                            app.data.mlog.info(res)
                                        },
                                        fail(e2) {
                                            app.data.mlog.err(e2)
                                            app.data.mfile.rmPath(tmpPath)
                                        }
                                    })
                                }
                            } catch (e2) {
                                app.data.mlog.err(e2)
                            }
                        }, mzipName)
                    } catch (e1) {
                        app.data.mlog.err(e1)
                        app.data.mfile.rmPath(tmpPath)
                    }
                }, () => {
                })
            }
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    downYunSubject: function () {
        try {
            app.data.mdb.switchSubjectByYunSync((code) => {
                this.uploadProgress(1, 1)
                this.onLoad()
            }, true, this.uploadProgress)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    uploadSubjectToLocal: function () {
        wx.chooseMessageFile({
            count: 1,
            type: 'file',
            success: (res) => {
                const tmpPath = app.data.mfile.getUserDir() + "tmp/"
                try {
                    //clean tmp
                    if (app.data.mfile.isExist(tmpPath)) {
                        app.data.mfile.rmPath(tmpPath)
                    }
                    const filePath = res.tempFiles[0].path
                    const fInfo = app.data.mfile.getFInfo(filePath)
                    if (fInfo != null && fInfo.isFile()) {
                        this.unmzipSync(filePath, tmpPath, (code) => {
                            try {
                                if (code) {
                                    const dbPath = app.data.mdb.getDBPath()
                                    const subjectId = app.data.mfile.readDir(tmpPath)[0]
                                    const idPath = tmpPath + subjectId + "/_id"
                                    //check id
                                    if (app.data.mfile.isExist(idPath) && JSON.parse(app.data.mfile.readFile(idPath)) == subjectId) {
                                        const copySubject = (subjectName) => {
                                            wx.showLoading({
                                                title: 'copy...',
                                                mask: true//防止触摸
                                            })
                                            //copy file
                                            const ccode = app.data.mfile.copyDir(tmpPath + subjectId, dbPath, this.uploadProgress)
                                            //end hide loading,progress
                                            wx.hideLoading()
                                            this.uploadProgress(100, 100)
                                            app.showModal("copy " + subjectName
                                                + " is " + ccode)
                                            //clean tmp
                                            app.data.mfile.rmPath(tmpPath)
                                            if (ccode) {
                                                app.data.mdb.switchSubjectSync(() => {
                                                    this.onLoad()
                                                }, false, true, subjectId)
                                            }
                                        }
                                        //check is repeated
                                        const subjectName = app.data.mfile.readFile(tmpPath + subjectId + "/subject")
                                        if (app.data.mfile.isExist(dbPath + subjectId)) {
                                            app.showModal("subject is repeated, do you cover it?", () => {
                                                app.data.mfile.rmPath(dbPath + subjectId)
                                                copySubject(subjectName)
                                            }, () => {
                                                app.data.mfile.rmPath(tmpPath)
                                            })
                                        } else {
                                            copySubject(subjectName)
                                        }
                                    } else {
                                        app.data.mfile.rmPath(tmpPath)
                                        app.showModal("file is not subject zip")
                                    }
                                } else {
                                    app.data.mfile.rmPath(tmpPath)
                                }
                            } catch (e2) {
                                app.data.mlog.err(e2)
                                app.data.mfile.rmPath(tmpPath)
                            }
                        })
                    } else {
                        app.showModal(filePath + " is not mzip")
                    }
                } catch (e1) {
                    app.data.mfile.rmPath(tmpPath)
                    app.data.mlog.err(e1)
                }
            },
            fail: e1 => {
                app.data.mlog.err(e1, "select file is fail.")
            }
        })
    },
    removeSubject: function (subjectId) {
        try {
            // const subjectId = e.currentTarget.dataset.event1Data1
            app.showModal("remove " + subjectId + "?", () => {
                try {
                    if (app.data.mfile.rmPath(app.data.mdb.getDBPath() + subjectId)) {
                        app.data.mdb.switchSubjectSync(this.onLoad, false, true)
                    }
                } catch (e2) {
                    app.data.mlog.err(e2)
                }
            }, () => {
            })
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    uploadSubjectToYun: function (subjectId) {
        try {
            app.showModal("upload subject to yun?", () => {
                app.data.mdb.uploadLocalSubjectToYunSync(subjectId, (code) => {
                    app.showModal("upload local subject to yun is " + code)
                }, true, this.uploadProgress)
            }, () => {
            })
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    /**
     *
     * @param subjectPath wxfile://usr/languageget/5dg55e82d85s5s
     * @param dstPath wxfile://usr/tmp/
     * @param callback
     * @param mzipName 5dg55e82d85s5s.mzip
     */
    packMZIPSync: function (subjectPath, dstPath, callback, mzipName) {
        try {
            wx.showLoading({
                title: 'cmzip...',
                mask: true//防止触摸
            })
            //check subject path path
            if (subjectPath.endsWith("/") == false) {
                subjectPath += "/"
            }
            //check dst path
            if (dstPath.endsWith("/") == false) {
                dstPath += "/"
            }
            if (dstPath.endsWith(".mzip")) {
                dstPath = dstPath.split("/").reverse().splice(1).reverse().join("/") + "/"
            }
            //check zip name
            if (mzipName == null) {
                if (dstPath.endsWith(".mzip")) {
                    mzipName = dstPath.split("/").reverse()[0]
                } else {
                    mzipName = subjectPath.split("/").reverse()[0].split(".")[0] + ".mzip"
                }
            }
            const subjectId = subjectPath.split("/").reverse()[1]
            const loopReadFile = (path) => {
                const FInfo = app.data.mfile.getFInfo(path)
                if (FInfo != null) {
                    if (FInfo.isDirectory()) {
                        const nodeArr = app.data.mfile.readDir(path)
                        nodeArr.map((childName, i) => {
                            this.uploadProgress(nodeArr.length, i)
                            const cpath = path + childName
                            const CFInfo = app.data.mfile.getFInfo(cpath)
                            if (CFInfo != null) {
                                loopReadFile(cpath + (CFInfo.isDirectory() ? "/" : ""))
                            }
                        })
                    } else if (FInfo.isFile()) {
                        const base64Conter = app.data.mfile.readFile(path, "base64")
                        const linePath = app.enUnicode(subjectId + "/" + path.replace(subjectPath, ""), " ")
                        const conterLine = (linePath + ":" + base64Conter + "\r\n")
                        app.data.mfile.writeFile(dstPath + mzipName, conterLine, true)
                    }
                } else {
                    app.data.mlog.err("not find path", path)
                }
            }
            loopReadFile(subjectPath)
            wx.hideLoading()
            if (typeof callback == "function") {
                callback(true)
            }
        } catch (e) {
            app.data.mlog.err(e)
            wx.hideLoading()
            if (typeof callback == "function") {
                callback(false)
            }
        }
    },
    unmzipSync: function (mzipPath, dstPath, callback) {
        try {
            wx.showLoading({
                title: 'unmzip...',
                mask: true//防止触摸
            })
            const lineArr = app.data.mfile.readFile(mzipPath).split("\r\n")
            lineArr.map((lineConter, i) => {
                this.uploadProgress(lineArr.length, i)
                //check conter is not null
                if (lineConter != "") {
                    const tmp = lineConter.split(":")
                    const linePath = app.deUnicode(tmp[0], " ")
                    const base64Conter = tmp[1]
                    if (base64Conter != null) {
                        app.data.mfile.writeFile(dstPath + "/" + linePath, wx.base64ToArrayBuffer(base64Conter))
                    }
                }
            })
            wx.hideLoading()
            if (typeof callback == "function") {
                callback(true)
            }
        } catch (e) {
            wx.hideLoading()
            app.data.mlog.err(e)
            if (typeof callback == "function") {
                callback(false)
            }
        }
    },
})
