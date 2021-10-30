//index.js
const app = getApp()
var SETTINGS = {}
var MEDIA_TYPE_ARR = ["image", "zhvoice", "envoice"]
var VOICE_TYPE_ARR = ["zhvoice", "envoice"]
var SORT_TYPE_ARR = ["e", "c", "updatetime"]
Page({
    data: {
        dProgress:{
            isShow:false,
            pro:0,
        },
        dButtons: {
            loopPlay: {
                text: "loopPlay",
                ev: "loopPlay",
                style: ""
            }
        },
        dTable: {
            search: {
                stype: {
                    text: "en",
                    ev: "tableSwitchSearchType",
                },
                ev: "tableSearch",
                text: ""
            },
            heads: [],//[{text,style},..]
            sortType: "createtime",
            sortDesc: true,
            lineArr: [],//[{en:apple,...},...]
            options: {
                pageLength: {
                    text: 10,
                    ev: "tableSwitchPageLength",
                    evData: ["5", "10", "20", "30", "5000"],
                    style: "padding:0 5vw"
                },
                first: {text: "first", ev: "tableToPage", evData: -999},
                pri: {text: "pri", ev: "tableToPage", evData: -1},
                thisPage: {text: 1, ev: "tableToPage", type: "input", inputType: "number", style: "text-align:right"},
                sp: {text: "/"},
                maxPage: {text: 1},
                next: {text: "next", ev: "tableToPage", evData: 1},
                last: {text: "last", ev: "tableToPage", evData: 999},
            },
            editInfo: {
                isShow: false,
                index: -1
            },
        },
        playInfo: {
            progress: 0
        },
        dLongAdd: {
            isShow: false,
            inputs: [],//[{tip:headStr,inputStr:"",ev:"saveInputStr",evData:i}]
            cancel: {
                text: "cancel",
                ev: "closeAddLongDialog"
            },
            ok: {
                text: "ok",
                ev: "addLongSubmit"
            }
        },
        defLineEditCallback: null//edit的callback
    },
    onLoad: function (options) {
        try {
            //refush title
            wx.setNavigationBarTitle({
                title: app.data.mdb.query1({field: {subject: true}}).subject
            })
            //init search data
            if (typeof options.search == "string") {
                this.data.dTable.search.text = options.search
            }
            //init settings
            SETTINGS = app.data.mdb.query1({field: {settings: true}}).settings
            MEDIA_TYPE_ARR = SETTINGS.mediatypes
            VOICE_TYPE_ARR = SETTINGS.voicetypes
            SORT_TYPE_ARR = SETTINGS.sorttypes
            this.data.dTable.sortType = SORT_TYPE_ARR[0]
            this.data.dTable.search.stype.text = SETTINGS.learnkey

            //init loop play type
            VOICE_TYPE_ARR.map(voiceType => this.data.dButtons[voiceType] = {
                text: voiceType,
                ev: "refushPlayType",
                evData: voiceType,
                style: "color:green"
            })
            //init table head
            this.data.dTable.heads = SETTINGS.heads.map(h => {
                return {text: h, style: ""}
            })
            this.setData(this.data)
            this.tableUpdata()
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    uploadProgress:function (total,p){
        try{
            //up pro
            this.data.dProgress.pro=(p/total*100)
            //0<=pro<100 show
            if(this.data.dProgress.pro>=0&&this.data.dProgress.pro<100){
                this.data.dProgress.isShow=true
            }else{
                this.data.dProgress.isShow=false
            }
            this.setData(this.data)
        }catch (e){
            this.data.dProgress.isShow=false
            this.setData(this.data)
            app.data.mlog.err(e)
        }
    },
    onHide: function () {
        try {
            this.loopPlay(true)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    onUnload: function () {
        try {
            this.loopPlay(true)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    tableSearch: function (e) {
        this.data.dTable.search.text = e.detail.value
        this.data.dTable.options.thisPage.text = 1
        this.setData(this.data)
        this.tableUpdata()
    },
    tableUpdata() {
        try {
            wx.showLoading({
                title: 'load...',
                mask: true//防止触摸
            })
            //close edit
            this.data.dTable.editInfo.index = -1
            this.data.dTable.editInfo.isShow = false
            //clean
            this.data.dTable.lineArr.splice(0, 999)
            //search
            const infos = app.data.mdb.query1({field: {infos: true}}).infos
            const searchType = this.data.dTable.search.stype.text
            const searchText = this.data.dTable.search.text.trim()
            const searchRes = Object.keys(infos).filter(kcode => {
                const infoData = infos[kcode]
                var filterRes = (searchText == "")
                if (searchType == "auto") {
                    //auto filter all value
                    filterRes = Object.values(infoData).filter(v => typeof v == "string"
                        && (v.indexOf(searchText) >= 0 || v.startsWith(searchText))).length > 0
                } else {
                    //filter by serarch type
                    if (searchText.indexOf(",") > 0) {
                        //filter arr by ','
                        filterRes = searchText.split(",").indexOf(infoData[searchType].toString()) >= 0
                    } else {
                        filterRes = infoData[searchType].toString().startsWith(searchText)
                    }
                }

                return filterRes
            })
                //sort
                .sort((kcode1, kcode2) => {
                    var sortType = this.data.dTable.sortType
                    var v1 = infos[kcode1][sortType]
                    //string sort
                    // if (typeof v1 != "string") {
                    //     v1 = ""
                    // }
                    // if(this.data.dTable.sortDesc){
                    //     return v1.localeCompare(infos[kcode2][sortType])
                    // }else{
                    //     var v2 = infos[kcode2][sortType]
                    //     if (typeof v2 != "string") {
                    //         v2 = ""
                    //     }
                    //     return v2.localeCompare(v1)
                    // }

                    //number sort
                    if ((v1 >= 0) == false) {
                        v1 = -1
                    }
                    var v2 = infos[kcode2][sortType]
                    if ((v2 >= 0) == false) {
                        v2 = -1
                    }
                    if (this.data.dTable.sortDesc) {
                        return v2 - v1
                    } else {
                        return v1 - v2
                    }
                })
            this.data.dTable.heads = this.data.dTable.heads.map(head => {
                head.style = head.text == this.data.dTable.sortType ? "color:green" : ""
                return head
            })
            var newMaxPage = this.data.dTable.options.maxPage.text = searchRes.length / this.data.dTable.options.pageLength.text
            if (newMaxPage % 1 > 0) {
                newMaxPage += 1
            }
            this.data.dTable.options.maxPage.text = parseInt(newMaxPage)

            //page by length
            const minIndex = (this.data.dTable.options.thisPage.text - 1) * this.data.dTable.options.pageLength.text
            const maxIndex = this.data.dTable.options.thisPage.text * this.data.dTable.options.pageLength.text
            searchRes.filter((kcode, i) => i >= minIndex && i <= maxIndex).map(skcode =>
                this.data.dTable.lineArr.push(this.getLineInfo(skcode, infos[skcode])))
            this.setData(this.data)
            wx.hideLoading()
        } catch (e) {
            wx.hideLoading()
            app.data.mlog.err(e)
        }
    },
    getLineInfo: function (skcode, infoData) {
        const lineInfo = {
            mediaInfo: {},
            inputInfo: {}
        }
        try {
            this.data.dTable.heads.map(headInfo => {
                const headStr = headInfo.text
                lineInfo[headStr] = infoData[headStr]
                //media to view
                if (MEDIA_TYPE_ARR.indexOf(headStr) >= 0) {
                    lineInfo.mediaInfo[headStr] = {
                        ev: "",
                        evData: (this.data.dTable.lineArr.length + ";" + headStr),
                        ev2: "",
                        imgPath: ""
                    }

                    const mediaPath = app.data.mdb.getMediaPathByMType(skcode, headStr, infoData[headStr], true)
                    //voice
                    if (VOICE_TYPE_ARR.indexOf(headStr) >= 0) {
                        if (skcode != "") {
                            lineInfo.mediaInfo[headStr].ev2 = "switchLocalVoice"
                        }
                        if (mediaPath != null) {
                            lineInfo.mediaInfo[headStr].imgPath = "/images/voice.svg"
                            lineInfo.mediaInfo[headStr].ev = "playVoice"
                        } else {
                            lineInfo.mediaInfo[headStr].imgPath = "/images/vnull.svg"
                        }
                    }
                    //image
                    if (headStr == "image") {
                        if (skcode != "") {
                            lineInfo.mediaInfo[headStr].evData2 = skcode
                            lineInfo.mediaInfo[headStr].ev2 = "switchLocalImage"
                        }
                        if (mediaPath != null) {
                            lineInfo.mediaInfo[headStr].imgPath = mediaPath
                        } else {
                            lineInfo.mediaInfo[headStr].imgPath = "/images/inull.jpg"
                        }
                    }
                } else if (SETTINGS.inputs.indexOf(headStr) >= 0) {
                    //input info
                    lineInfo.inputInfo[headStr] = {
                        text: infoData[headStr],
                        ev: "saveEditInputStr",
                        evData: (this.data.dTable.lineArr.length + ";" + headStr),
                        style: "color:green"
                    }
                }
            })
        } catch (e) {
            app.data.mlog.err(e)
        }
        return lineInfo
    },
    showLineMenus: function (e) {
        try {
            const lineIndex = e.currentTarget.dataset.event1Data1
            const optionArr = ["remove", "trend", "check null voice", "en-image", "image-en", "image-edi", "image-edit"]
            //编辑状态下才能save，但是不能add,edit
            if (this.data.dTable.editInfo.index >= 0) {
                if (lineIndex == this.data.dTable.editInfo.index) {
                    optionArr.splice(0, 1)//正在编辑的不能删除
                }
                optionArr.splice(0, 999, "save")
            } else {
                optionArr.splice(0, 0, "add")
                optionArr.splice(2, 0, "edit")
            }
            const skey = this.data.dTable.lineArr[lineIndex][SETTINGS.learnkey]
            app.showActionSheet(optionArr, (sval) => {
                switch (sval) {
                    case "add":
                        this.showAddMenus()
                        break;
                    case "remove":
                        app.showActionSheet([skey, "page"], (sval, sindex) => {
                            if (sindex == 0) {
                                this.removeLineBySKEY(skey, true)
                                this.tableUpdata()
                            } else {
                                wx.showLoading({
                                    title: 'remove...',
                                    mask: true//防止触摸
                                })
                                this.data.dTable.lineArr.map((info1,i) => {
                                    this.uploadProgress(this.data.dTable.lineArr.length,i)
                                    this.removeLineBySKEY(info1[SETTINGS.learnkey], false)
                                })
                                //end
                                this.uploadProgress(this.data.dTable.lineArr.length,this.data.dTable.lineArr.length)
                                wx.hideLoading()
                                this.tableUpdata()
                            }
                        })
                        break;
                    case "edit":
                        this.openLineEdit(lineIndex)
                        break;
                    case "save":
                        this.closeLineEdit(false, null, true)
                        this.tableUpdata()
                        break;
                    case "trend":
                        app.openPage(null, "/pages/trend/index?skeyArr[0]=" + skey)
                        break;
                    case "check null voice":
                        this.checkNullVoiceByTTS()
                        break;
                    case "en-image":
                        app.openPage(null, "/pages/learn/index?skey=" + skey + "&viewType1=en&viewType2=image")
                        break;
                    case "image-en":
                        app.openPage(null, "/pages/learn/index?skey=" + skey + "&viewType1=image&viewType2=en")
                        break;
                    case "image-edi":
                        app.openPage(null, "/pages/learn/index?skey=" + skey + "&viewType1=image&viewType2=edi")
                        break;
                    case "image-edit":
                        app.openPage(null, "/pages/learn/index?skey=" + skey + "&viewType1=image&viewType2=edit")
                        break;
                }
            }, () => {
            })
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    showAddMenus: function () {
        try {
            app.showActionSheet(["one", "long", "for image", "for zip"], (sval) => {
                switch (sval) {
                    case "one":
                        this.openLineEdit()
                        break;
                    case "for image":
                        this.selectImage((imgPath) => {
                            this.data.defLineEditCallback = (code, newSkey) => {
                                if (code) {
                                    //clean callback
                                    this.data.defLineEditCallback = null
                                    this.setData(this.data)
                                    //save img info
                                    const skcode = app.enUnicode(newSkey)
                                    this.switchLocalImage(null, imgPath, skcode)
                                }
                            }
                            this.setData(this.data)
                            //open edit
                            const imgName = imgPath.split("/").reverse()[0]
                            const tmp = imgName.substr(0, imgName.lastIndexOf(".")).split("_")
                            const skey = tmp[0]
                            const OIInfo = {}
                            SETTINGS.inputs.map((head, i) => OIInfo[head] = tmp[i])
                            this.openLineEdit(null, skey, OIInfo)
                        })
                        break;
                    case "for zip":
                        this.addNewLineByZip()
                        break;
                    case "long":
                        this.data.dLongAdd.isShow = true
                        this.data.dLongAdd.inputs = SETTINGS.inputs.map((headStr, i) => {
                            return {
                                tip: headStr,
                                inputStr: "",
                                ev: "saveInputStr",
                                evData: i
                            }
                        })
                        this.data.dLongAdd.ok.ev="addLongSubmit"
                        this.setData(this.data)
                        break;
                }
            })
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    closeAddLongDialog: function () {
        try {
            this.data.dLongAdd.isShow = false
            this.setData(this.data)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    saveInputStr(e) {
        try {
            this.data.dLongAdd.inputs[e.currentTarget.dataset.event1Data1].inputStr = e.detail.value
            this.setData(this.data)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    addLongSubmit: function () {
        try {
            const skeyInputIndex = this.data.dLongAdd.inputs.findIndex(inputInfo => inputInfo.tip == SETTINGS.learnkey)
            const inputSkeyStr = this.data.dLongAdd.inputs[skeyInputIndex].inputStr
            var inputSkeyArr = inputSkeyStr.split(",")
            //suffix by _
            if (inputSkeyStr.indexOf("_") >= 0 && inputSkeyStr.indexOf("\r\n") >= 0) {
                inputSkeyStr.split("\r\n").map((tmpStr, i) => {
                    const tmp = tmpStr.split("_")
                    this.data.dLongAdd.inputs.map((inputInfo, j) => {
                        tmp[j]= (tmp[j]!=null?tmp[j]:"")
                        if (i == 0) {
                            this.data.dLongAdd.inputs[j].inputStr =tmp[j]
                        } else {
                            this.data.dLongAdd.inputs[j].inputStr += ("," + tmp[j])
                        }
                    })
                })
                this.setData(this.data)
                inputSkeyArr = this.data.dLongAdd.inputs[skeyInputIndex].inputStr.split(",")
            }
            const keys = app.data.mdb.query1({field: {keys: true}}).keys
            //check is cover
            const coverArr = inputSkeyArr.filter((skey, i) => keys.indexOf(skey) >= 0//不能跟keys重复
                || inputSkeyArr.indexOf(skey) != i || inputSkeyArr.lastIndexOf(skey) != i)//不能跟新增的列表重复

            //check is null
            if (inputSkeyArr.filter(skey => skey.trim() == "").length > 0) {
                app.showModal("skey is not \"\"!!")
            } else {
                const addNew = (callback) => {
                    app.showModal("add " + (inputSkeyArr.map((skey, i) => {
                        var msg = ""
                        if (coverArr.indexOf(skey) < 0) {
                            msg = "'" + skey
                            this.data.dLongAdd.inputs.filter(inputInfo => inputInfo.tip != SETTINGS.learnkey)
                                .map((inputInfo) => {
                                    const inputStrArr = inputInfo.inputStr.split(",")
                                    msg += ("_" + (inputStrArr.length == 1 ? inputStrArr[0] : inputStrArr[i]))
                                })
                            msg += "'"
                        }
                        return msg
                    }).filter(msg => msg != "").join(",")) + "?", () => {
                        wx.showLoading({
                            title: 'add...',
                            mask: true//防止触摸
                        })
                        //add new
                        inputSkeyArr.map((skey, i) => {
                            if (coverArr.indexOf(skey) < 0) {
                                const otherInputInfo = {}
                                this.data.dLongAdd.inputs.filter(inputInfo => inputInfo.tip != SETTINGS.learnkey)
                                    .map(inputInfo => {
                                        const inputArr = inputInfo.inputStr.split(",")
                                        otherInputInfo[inputInfo.tip] = inputArr.length == 1 ? inputArr[0] : inputArr[i]
                                    })
                                this.openLineEdit(null, skey, otherInputInfo)
                                this.closeLineEdit(true)
                            }
                        })
                        if (typeof callback == "function") {
                            wx.hideLoading()
                            callback()
                        }
                    }, () => {
                    })
                }
                const reOld = (callback) => {
                    const infos = app.data.mdb.query1({field: {infos: true}}).infos
                    const msgArr = (inputSkeyArr.map((skey, i) => {
                        var msg = ""
                        if (coverArr.indexOf(skey) >= 0) {
                            const skcode = app.enUnicode(skey)
                            this.data.dLongAdd.inputs.filter(inputInfo => inputInfo.tip != SETTINGS.learnkey)
                                .map((inputInfo) => {
                                    const inputStrArr = inputInfo.inputStr.split(",")
                                    if (typeof inputStrArr[i] == "string" && infos[skcode][inputInfo.tip] != inputStrArr[i]) {
                                        msg += ("'" + skey + "." + inputInfo.tip + ":" + infos[skcode][inputInfo.tip] + ">" + inputStrArr[i])
                                    }
                                })
                            if (msg != "") {
                                msg += "',"
                            }
                        }
                        return msg
                    })).filter(msg => msg != "")
                    if (msgArr.length > 0) {
                        app.showModal("re " + msgArr.join(";") + "?", () => {
                            wx.showLoading({
                                title: 're...',
                                mask: true//防止触摸
                            })
                            inputSkeyArr.map((skey, i) => {
                                if (coverArr.indexOf(skey) >= 0) {
                                    const skcode = app.enUnicode(skey)
                                    const otherInputInfo = {}
                                    this.data.dLongAdd.inputs.filter(inputInfo => inputInfo.tip != SETTINGS.learnkey)
                                        .map(inputInfo => {
                                            const inputStrArr = inputInfo.inputStr.split(",")
                                            otherInputInfo[inputInfo.tip] = (typeof inputStrArr[i] == "string" && infos[skcode][inputInfo.tip] != inputStrArr[i] ?
                                                inputStrArr[i] : infos[skcode][inputInfo.tip])
                                        })
                                    this.openLineEdit(null, skey, otherInputInfo)
                                    this.closeLineEdit(true)
                                }
                            })
                            if (typeof callback == "function") {
                                wx.hideLoading()
                                callback()
                            }
                        }, () => {
                        })
                    } else {
                        app.showModal("is cover all!")
                    }
                }
                const mcb = () => {
                    this.closeAddLongDialog()
                    this.tableUpdata()
                    wx.hideLoading()
                }
                //check cover arr is null
                if (inputSkeyArr.length > coverArr.length) {
                    addNew(coverArr.length > 0 ? () => {
                        reOld(mcb)
                    } : mcb)
                } else if (!(coverArr.length == 1 && coverArr[0] == "")) {
                    reOld(mcb)
                }
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    addNewLineByZip: function () {
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
                    if (filePath.endsWith(".zip") && fInfo != null && fInfo.isFile()) {
                        app.data.mfile.unzipSync(filePath, tmpPath, (code) => {
                            try {
                                if (code) {
                                    const narr = app.data.mfile.readDir(tmpPath)
                                    app.showModal("re imgs '" + narr.join(","), () => {
                                        //
                                        wx.showLoading({
                                            title: 're imgs...',
                                            mask: true//防止触摸
                                        })
                                        //clean callback
                                        this.data.defLineEditCallback = null
                                        this.setData(this.data)
                                        //add all
                                        narr.map((fname, i) => {
                                            const tmp = narr[i].substr(0, narr[i].lastIndexOf(".")).split("_")
                                            const skey = tmp[0]
                                            const OIInfo = {}
                                            SETTINGS.inputs.map((head, i) => OIInfo[head] = tmp[i])
                                            this.openLineEdit(null, skey, OIInfo)
                                            this.closeLineEdit(true, (code1, skey, imgPath = (tmpPath + fname)) => {
                                                if (code1) {
                                                    //save img info
                                                    const skcode = app.enUnicode(skey)
                                                    this.switchLocalImage(null, imgPath, skcode, true)
                                                }
                                            })
                                        })
                                        this.tableUpdata()
                                        app.data.mfile.rmPath(tmpPath)
                                        app.showModal("add is end.")
                                        wx.hideLoading()
                                    }, () => {
                                        app.data.mfile.rmPath(tmpPath)
                                    })
                                } else {
                                    app.data.mfile.rmPath(tmpPath)
                                }
                            } catch (e2) {
                                app.data.mlog.err(e2)
                                app.data.mfile.rmPath(tmpPath)
                            }
                        })
                    } else {
                        app.showModal(filePath + " is not zip file")
                        app.data.mfile.rmPath(tmpPath)
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
    checkNullVoiceByTTS: function () {
        try {
            this.data.dTable.lineArr.map(lineInfo => {
                const skey = lineInfo[SETTINGS.learnkey]
                if (skey != "") {
                    const skcode = app.enUnicode(skey)
                    VOICE_TYPE_ARR.map(voiceType => {
                        const voicePath = app.data.mdb.getMediaPathByMType(skcode, voiceType, "mp3", false)
                        if (app.data.mfile.isExist(voicePath) != true) {
                            const langType = voiceType.toLowerCase().split("voice")[0]
                            this.downMP3ByTTSSync(skey, lineInfo[langType], langType, voicePath, true)
                        }
                    })
                }
            })
            this.tableUpdata()
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    playVoice: function (e) {
        try {
            //tmp:lineIndex;voiceType
            const tmp = e.currentTarget.dataset.event1Data1.split(";")
            const skcode = app.enUnicode(this.data.dTable.lineArr[parseInt(tmp[0])][SETTINGS.learnkey])
            const voiceType = tmp[1]
            const infoData = app.data.mdb.query1({field: {infos: true}}).infos[skcode]
            const mediaPath = app.data.mdb.getMediaPathByMType(skcode, voiceType, infoData[voiceType])
            if (mediaPath != null) {
                app.data.mvoice.playSync(mediaPath)
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    switchLocalVoice: function (e) {
        try {
            //tmp:lineIndex;voiceType
            const tmp = e.currentTarget.dataset.event1Data1.split(";")
            const skey = this.data.dTable.lineArr[parseInt(tmp[0])][SETTINGS.learnkey]
            const skcode = app.enUnicode(skey)
            const infoData = app.data.mdb.query1({field: {infos: true}}).infos[skcode]
            const langType = tmp[1].split("voice")[0]
            const voicePath = app.data.mdb.getMediaPathByMType(skcode, tmp[1], "mp3", false)
            //use selected get type
            app.showActionSheet(["TTS", "SELECT","BY URL"], (sval) => {
                switch (sval) {
                    case "SELECT":
                        this.selectVoice(skey, tmp[1])
                        break;
                    case "TTS":
                        this.downMP3ByTTSSync(skey, infoData[langType], langType, voicePath, null, (dcode) => {
                            if (dcode) {
                                app.data.mvoice.playSync(voicePath)
                            }
                        })
                        break;
                    case "BY URL":
                        this.data.dLongAdd.isShow = true
                        this.data.dLongAdd.inputs = [{
                            tip: "url",
                            inputStr: "",
                            ev: "saveInputStr",
                            evData: 0
                        }]
                        this.data.dLongAdd.ok.ev="downloadVoidByUrl"
                        this.data.dLongAdd.ok.evData=e.currentTarget.dataset.event1Data1
                        this.setData(this.data)
                        break;
                }
            }, () => {
            })
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    downloadVoidByUrl(e){
      try{
          //tmp:lineIndex;voiceType
          const tmp = e.currentTarget.dataset.event1Data1.split(";")
          const skey = this.data.dTable.lineArr[parseInt(tmp[0])][SETTINGS.learnkey]
          const skcode = app.enUnicode(skey)
          const langType = tmp[1].split("voice")[0]
          const voicePath = app.data.mdb.getMediaPathByMType(skcode, tmp[1], "mp3", false)
          const inpStr=this.data.dLongAdd.inputs[0].inputStr
          if(typeof inpStr=="string"&&inpStr.trim().startsWith("http")){
              app.data.mfile.downUrlFileSync(inpStr, voicePath, (dcode) => {
                  if (dcode) {
                      //close dialog
                      this.data.dLongAdd.isShow = false
                      this.setData(this.data)
                      //save to local
                      app.data.mvoice.playSync(voicePath)
                      app.data.mdb.update1({
                          infos: {[app.enUnicode(skey)]: {[langType + "voice"]: "mp3"}}
                      })
                  }
                  app.showModal("download is "+dcode)
              })
          }else{
              app.showModal("url is err")
          }
      }  catch (e1){
          app.data.mlog.err(e1)
      }
    },
    selectVoice: function (skey, voiceType) {
        try {
            //select voice file
            wx.chooseMessageFile({
                count: 1,
                type: 'file',
                success: (res) => {
                    // res.tempFiles[0]:{size,path}
                    const skcode = app.enUnicode(skey)
                    const suffix = res.tempFiles[0].path.split(".").reverse()[0]
                    const voicePath = app.data.mdb.getMediaPathByMType(skcode, voiceType, suffix, false)
                    const ccode = app.data.mfile.copyFile(res.tempFiles[0].path, voicePath)
                    if (ccode) {
                        app.data.mvoice.playSync(voicePath, (pcode) => {
                            app.data.mdb.update1({
                                infos: {[app.enUnicode(skey)]: {[voiceType]: suffix}}
                            })
                            app.showModal("copy " + res.tempFiles[0].path + " to " + voicePath + " is "
                                + pcode)
                        })
                    }
                },
                fail: e1 => {
                    app.data.mlog.err(e1, "select voice is fail.")
                }
            })
        } catch (e2) {
            app.data.mlog.err(e2)
        }
    },
    downMP3ByTTSSync(skey, text, langType, voicePath, isShowLoading, callback) {
        const mcallback = (code) => {
            if (typeof callback == "function") {
                callback(code)
            }
        }
        try {
            app.data.mvoice.downloadVoiceByTTSSync(text, langType, (gcode, vurl) => {
                if (gcode) {
                    app.data.mfile.downUrlFileSync(vurl, voicePath, (dcode) => {
                        if (dcode) {
                            app.data.mdb.update1({
                                infos: {[app.enUnicode(skey)]: {[langType + "voice"]: "mp3"}}
                            })
                        }
                        mcallback(dcode)
                    })
                } else {
                    mcallback(gcode)
                }
            }, isShowLoading)
        } catch (e) {
            app.data.mlog.err(e)
            mcallback(false)
        }
    },
    selectImage: function (callback) {
        try {
            //select image
            wx.chooseImage({
                count: 1,//可选图片个数
                sizeType: ['compressed'],//图片处理方式:压缩
                sourceType: ['album', 'camera'],//选择图片方式:相册,相机
                success: (res) => {
                    // res.tempFiles[0]:{size,path}
                    const selectedPath = res.tempFiles[0].path
                    callback(selectedPath)
                },
                fail: e1 => {
                    app.data.mlog.err(e1, "select image is fail.")
                }
            })
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    switchLocalImage: function (e, imgPath, skcode, isAutoSave) {
        try {
            const callback = (imgPath1) => {
                const imgSuffix = imgPath1.split(".").reverse()[0]
                const mediaPath = app.data.mdb.getMediaPathByMType(skcode, "image", imgSuffix, false)
                if (app.data.mfile.copyFile(imgPath1, mediaPath)) {
                    const code = app.data.mdb.update1({infos: {[skcode]: {image: imgSuffix}}})
                    if (isAutoSave != true) {
                        app.showModal("copy " + imgPath1 + " to " + mediaPath + " is " + code)
                    }
                } else {
                    app.showModal("copy " + imgPath1 + " to " + mediaPath + " is err")
                }
                this.tableUpdata()
            }
            //def select image
            if (e != null) {
                skcode = e.currentTarget.dataset.event2Data2
                this.selectImage(callback)
            } else {
                callback(imgPath)
            }
        } catch (e2) {
            app.data.mlog.err(e2)
        }
    },
    saveEditInputStr: function (e) {
        try {
            const lineInfo = this.data.dTable.lineArr[this.data.dTable.editInfo.index]
            const headStr = e.currentTarget.dataset.event1Data1.split(";")[1]
            if (lineInfo[headStr] != e.detail.value) {
                lineInfo.inputInfo[headStr].style = "color:red"
            } else {
                lineInfo.inputInfo[headStr].style = "color:green"
            }
            lineInfo.inputInfo[headStr].text = e.detail.value
            this.setData(this.data)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    openLineEdit: function (lineIndex, skey, otherInputInfo) {
        try {
            if (typeof lineIndex == "number" && this.data.dTable.lineArr.length > lineIndex) {

            } else {
                //find line info
                lineIndex = -1
                var skcode = ""
                var infoData = {}
                if (typeof skey == "string" && skey.trim().length > 0) {
                    skcode = app.enUnicode(skey)
                    lineIndex = this.data.dTable.lineArr.findIndex(linfo => linfo[SETTINGS.learnkey] == skey)
                    const infos = app.data.mdb.query1({field: {infos: true}}).infos
                    if (infos[skcode] != null) {
                        infoData = infos[skcode]
                    }
                } else {
                    skey = ""
                }

                //re line info
                const lineInfo = this.getLineInfo(skcode, infoData)
                lineInfo.inputInfo[SETTINGS.learnkey].text = skey
                if (otherInputInfo != null) {
                    Object.keys(otherInputInfo).map(headStr => {
                        if (otherInputInfo[headStr] != null) {
                            lineInfo.inputInfo[headStr].text = otherInputInfo[headStr]
                        }
                    })
                }

                if (lineIndex < 0) {
                    //add new line
                    lineIndex = 0
                    this.data.dTable.lineArr.splice(0, 0, lineInfo)
                } else {
                    this.data.dTable.lineArr.splice(lineIndex, 1, lineInfo)
                }
            }
            //open input
            this.data.dTable.editInfo.index = lineIndex
            this.data.dTable.editInfo.isShow = true
            this.setData(this.data)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    closeLineEdit: function (isAutoClose, callback, isShowLoading) {
        try {
            const mcallback = (code, skey) => {
                //close input
                this.data.dTable.editInfo.index = -1
                this.data.dTable.editInfo.isShow = false
                this.setData(this.data)

                //callback
                if (typeof callback == "function") {
                    callback(code, skey)
                } else if (typeof this.data.defLineEditCallback == "function") {
                    this.data.defLineEditCallback(code, skey)
                }
            }
            //check is open edit
            if (this.data.dTable.editInfo.index >= 0) {
                const lineInfo = this.data.dTable.lineArr[this.data.dTable.editInfo.index]
                const RHStrArr = SETTINGS.inputs.filter(headStr => lineInfo.inputInfo[headStr].text != lineInfo[headStr])
                if (RHStrArr.length > 0) {
                    const keys = app.data.mdb.query1({field: {keys: true}}).keys
                    const inputSkey = lineInfo.inputInfo[SETTINGS.learnkey].text.trim()
                    //check skey
                    if (inputSkey == "") {
                        app.showModal("skey is null!")
                    } else if (inputSkey != lineInfo[SETTINGS.learnkey] && keys.indexOf(inputSkey) >= 0) {
                        app.showModal("skey is repeat!")
                    } else if (keys.indexOf(lineInfo[SETTINGS.learnkey]) < 0) {//new skey
                        const addNewLine = () => {
                            //add new line
                            this.saveLineToLocal(lineInfo, inputSkey, null, isShowLoading)
                            mcallback(true, inputSkey)
                        }
                        if (isAutoClose) {
                            addNewLine()
                        } else {
                            app.showModal("add " + inputSkey + "?", addNewLine, mcallback)
                        }
                    } else {
                        const reLine = () => {
                            //re line
                            if (inputSkey != lineInfo[SETTINGS.learnkey]) {
                                //re skey
                                this.saveLineToLocal(lineInfo, inputSkey, lineInfo[SETTINGS.learnkey], isShowLoading)
                            } else {
                                //re other key
                                this.saveLineToLocal(lineInfo, null, null, isShowLoading)
                            }
                            mcallback(true, inputSkey)
                        }
                        if (isAutoClose) {
                            reLine()
                        } else {
                            app.showModal("re " + RHStrArr
                                .map(HStr => HStr + ":" + lineInfo[HStr] + ">" + lineInfo.inputInfo[HStr].text + ",") + "?"
                                , reLine, mcallback)
                        }
                    }
                } else {
                    mcallback(0)
                }
            } else {
                mcallback(false)
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    saveLineToLocal: function (lineInfo, newSkey, oldSkey, isShowLoading) {
        try {
            const updateGeo = {
                keys: [],
                infos: {},
                counts: {}
            }
            //check new skcode
            if (newSkey != null) {
            }
            //check old skey
            if (oldSkey != null) {
                var oldSKCode = app.enUnicode(oldSkey)
                var newSKCode = app.enUnicode(newSkey)
                //update skey
                updateGeo.keys.push(app.data.mdb.UPDATE_TYPES.UPDATEK + newSkey + "_" + oldSkey)
                //update count
                updateGeo.counts[oldSKCode] = app.data.mdb.UPDATE_TYPES.UPDATEK + newSKCode
                //remove old info
                updateGeo.infos[oldSKCode] = app.data.mdb.UPDATE_TYPES.REMOVEK
                //update media path
                MEDIA_TYPE_ARR.map(mtype => {
                    const oldMediaPath = app.data.mdb.getMediaPathByMType(oldSKCode, mtype, lineInfo[mtype])
                    if (oldMediaPath != null) {
                        const newMediaPath = app.data.mdb.getMediaPathByMType(newSKCode, mtype, lineInfo[mtype], false)
                        app.data.mfile.copyFile(oldMediaPath, newMediaPath)
                        app.data.mfile.rmPath(oldMediaPath)
                    }
                })
            } else if (newSkey != null) {
                //add new skey
                updateGeo.keys.push(app.data.mdb.UPDATE_TYPES.ADDK + newSkey)
            }
            //find info data
            var infoData = {}
            if (false == (oldSkey == null && newSkey != null)) {
                infoData = app.data.mdb.query1({field: {infos: true}}).infos[app.enUnicode(lineInfo[SETTINGS.learnkey])]
            }
            //update infos by lineinfo
            SETTINGS.inputs.map(headStr => {
                var ival = lineInfo[headStr]
                const inputInfo = lineInfo.inputInfo[headStr]
                //check input
                if (inputInfo != null) {
                    if (["string", "number"].indexOf(typeof inputInfo.text) >= 0) {
                        ival = inputInfo.text
                    }
                }
                infoData[headStr] = ival
            })
            //updatetime
            infoData["updatetime"] = new Date().getTime()
            //check skcode
            const skey = (newSkey != null ? newSkey : lineInfo[SETTINGS.learnkey])
            var skcode = app.enUnicode(skey)
            //save to local
            updateGeo.infos[skcode] = infoData
            app.data.mdb.update1(updateGeo)
            //auto download voice by tts
            const VSuffix = "mp3"
            VOICE_TYPE_ARR.map(headStr => {
                //check media path
                const voicePath = app.data.mdb.getMediaPathByMType(skcode, headStr, lineInfo[headStr], false)
                const langType = headStr.toLowerCase().split("voice")[0]
                //check voice
                if (app.data.mfile.isExist(voicePath) == false || lineInfo[langType] != lineInfo.inputInfo[langType].text) {
                    this.downMP3ByTTSSync(skey, lineInfo.inputInfo[langType].text, langType, voicePath,
                        isShowLoading, (dcode) => {
                            app.data.mlog.info("auto download voice by tts is " + dcode)
                        })
                }
            })
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    removeLineBySKEY(skey, isShowLoading) {
        try {
            if (isShowLoading) {
                wx.showLoading({
                    title: 'remove...',
                    mask: true//防止触摸
                })
            }
            const skcode = app.enUnicode(skey)
            //remove media
            const infoData = app.data.mdb.query1({field: {infos: true}}).infos[skcode]
            MEDIA_TYPE_ARR.map(mediaType => {
                const mediaPath = app.data.mdb.getMediaPathByMType(skcode, mediaType, infoData[mediaType])
                if (mediaPath != null) {
                    app.data.mfile.rmPath(mediaPath)
                }
            })
            //remove data
            const updateGeo = {
                infos: {},
                keys: [],
                counts: {}
            }
            updateGeo.keys.push(app.data.mdb.UPDATE_TYPES.REMOVEK + skey)
            updateGeo.infos[skcode] = app.data.mdb.UPDATE_TYPES.REMOVEK
            updateGeo.counts[skcode] = app.data.mdb.UPDATE_TYPES.REMOVEK
            app.data.mdb.update1(updateGeo)
            if (isShowLoading) {
                wx.hideLoading()
            }
        } catch (e) {
            if (isShowLoading) {
                wx.hideLoading()
            }
            app.data.mlog.err(e)
        }
    },
    tableToPage: function (e, addIndex) {
        try {
            if (e != null) {
                if (e.type == "input") {
                    addIndex = e.detail.value
                    //检查输入的合法性
                    if (addIndex > 0) {
                        this.data.dTable.options.thisPage.text = 0
                    } else {
                        addIndex = 0
                    }
                } else {
                    addIndex = e.currentTarget.dataset.event1Data1
                }
            }
            var newPage = this.data.dTable.options.thisPage.text + addIndex
            //check indexOf
            if (newPage < 1) {
                newPage = 1
            } else if (newPage > this.data.dTable.options.maxPage.text) {
                newPage = this.data.dTable.options.maxPage.text
            }

            this.data.dTable.options.thisPage.text = newPage
            this.setData(this.data)
            this.tableUpdata()
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    tableSwitchSearchType: function (e) {
        try {
            app.showActionSheet(
                this.data.dTable.heads.filter(head => head.text != this.data.dTable.search.stype.text).map(head => head.text),
                (sval) => {
                    try {
                        this.data.dTable.search.stype.text = sval
                        this.data.dTable.options.thisPage.text = 1
                        this.setData(this.data)
                        this.tableUpdata()
                    } catch (e2) {
                        app.data.mlog.err(e2)
                    }
                }, () => {
                    this.data.dTable.search.stype.text = "auto"
                    this.data.dTable.options.thisPage.text = 1
                    this.setData(this.data)
                    this.tableUpdata()
                })
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    tableSwitchPageLength: function (e) {
        try {
            app.showActionSheet(
                this.data.dTable.options.pageLength.evData,
                (sval) => {
                    try {
                        this.data.dTable.options.pageLength.text = sval
                        this.setData(this.data)
                        this.tableToPage(null, -999)
                    } catch (e2) {
                        app.data.mlog.err(e2)
                    }
                }, () => {
                })
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    sortByNumb: function (e) {
        try {
            const sortType = e.currentTarget.dataset.event1Data1
            if (SORT_TYPE_ARR.indexOf(sortType) >= 0) {
                if (this.data.dTable.sortType == sortType) {
                    this.data.dTable.sortDesc = !this.data.dTable.sortDesc
                } else {
                    this.data.dTable.sortType = sortType
                }
                this.setData(this.data)
                this.tableUpdata()
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    loopPlay: function (isClose) {
        try {
            //check is start
            if (this.data.dButtons.loopPlay.style == "" && isClose != true && this.data.dTable.lineArr.length > 0) {
                app.data.mlog.info("start loop play...")
                this.data.dButtons.loopPlay.style = "color:green"
                this.data.playInfo.progress = 0

                const loopPlay1 = (voiceTypeArr, i) => {
                    if (voiceTypeArr.length > i) {
                        if (this.data.dButtons[voiceTypeArr[i]].style != "") {
                            //check is stop
                            if (this.data.dButtons.loopPlay.style != "") {
                                //tmp:lineIndex;voiceType
                                const tmp = this.data.dTable.lineArr[this.data.playInfo.progress].mediaInfo[voiceTypeArr[i]].evData.split(";")
                                const skcode = app.enUnicode(this.data.dTable.lineArr[parseInt(tmp[0])][SETTINGS.learnkey])
                                const voiceType = tmp[1]
                                const infoData = app.data.mdb.query1({field: {infos: true}}).infos[skcode]
                                const mediaPath = app.data.mdb.getMediaPathByMType(skcode, voiceType, infoData[voiceType])
                                app.data.mvoice.playSync(mediaPath,
                                    (code) => {
                                        //next col
                                        loopPlay1(voiceTypeArr, i + 1)
                                    })
                            }
                        } else {
                            //next col
                            loopPlay1(voiceTypeArr, i + 1)
                        }
                    } else {
                        //next line
                        if (this.data.playInfo.progress < this.data.dTable.lineArr.length - 1) {
                            this.data.playInfo.progress += 1
                        } else {
                            this.data.playInfo.progress = 0
                        }
                        setTimeout(() => {
                            loopPlay1(voiceTypeArr, 0)
                        }, 1000)
                    }
                }
                loopPlay1(VOICE_TYPE_ARR, 0)
            } else {
                app.data.mlog.info("stop loop play...")
                this.data.dButtons.loopPlay.style = ""
            }
            this.setData(this.data)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    refushPlayType: function (e) {
        try {
            const playType = e.target.dataset.event1Data1
            this.data.dButtons[playType].style = (this.data.dButtons[playType].style == "" ? "color:green" : "")
            this.setData(this.data)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    }
})
