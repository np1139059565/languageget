//index.js
const app = getApp(), FILTER_FZK = "filterFZK", IMAGE = "image"
var SETTINGS = {}, FZK_MAX = 22

Page({
    data: {
        dProgress: {
            skeyIArr: [],//skey index
            reviewSIArr: [],
            time: "",
            saveProgress: -1,
            thisProgress: -1
        },
        errProgressArr: [],//这不是skey index 是进度条的下标
        errStyle: "background:rgba(255,0,0,0.2)",//background:rgba(255,0,0,0.2)
        dMode: {
            name: "mode-01",
            //mode1 data
            mode1Options: [
                {
                    skcode: "145653",
                    // text:"null",
                    imgPath: "/images/inull.jpg",
                    maskPath: "/images/succ.svg"
                },
                {
                    skcode: "145653",
                    // text:"null",
                    imgPath: "/images/inull.jpg",
                    maskPath: "/images/succ.svg"
                },
                {
                    skcode: "145653",
                    // text:"null",
                    imgPath: "/images/inull.jpg",
                    maskPath: "/images/succ.svg"
                },
                {
                    skcode: "145653",
                    // text:"null",
                    imgPath: "/images/inull.jpg",
                    maskPath: "/images/succ.svg"
                }
            ],
            //mode2 data
            mode2Edits: [
                {
                    type: "input",
                    val: "a",

                    inputStr: "",
                    style: "width:6vw",
                    ev: "checkEdit",
                    evData: "index",
                }
            ]
        },
        dAnswer: {
            sindex: -1,
            count: 0,
            skcode: "145653",
            // text:"a",
            ev: "clickPlayVoice",
            ev2: "toTablePage",
            imgPath: "/images/inull.jpg"
        },
        dTools: {
            pri: {
                isShow: true,
                text: "<",
                // imgPath: "/images/mac1.svg",
                ev: "clickPri"
            },
            mac: {
                // text:"play",
                isShow: false,
                imgPath: "/images/mac1.svg",
                ev2: "startRecordVoice",
                ev3: "stopRecordVoice"
            },
            play: {
                // text: "play2",
                isShow: false,
                imgPath: "/images/voice.svg",
                ev: "playAnswer",
                evData: ""
            },
            next: {
                isShow: true,
                text: ">",
                // imgPath: "/images/mac1.svg",
                ev: "clickNext"
            },
            last: {
                isShow: true,
                text: ">>",
                // imgPath: "/images/mac1.svg",
                ev: "clickLast"
            }
        },
        dMask: {
            isShow: false,
            interval: -1,
            callback: function () {
            }
        }
    },
    onLoad: function (options) {
        try {

            //init settings
            SETTINGS = app.data.mdb.query1({field: {settings: true}}).settings
            SETTINGS.lasts = SETTINGS.lasts.map(l => parseInt(l))//to int
            FZK_MAX = SETTINGS.lasts[SETTINGS.lasts.length - 1]
            //check options
            if (typeof options.skey == "string") {
                this.refushMode(0, options.skey, [options.viewType1, options.viewType2])
                //refush title
                const infoData = app.data.mdb.query1({field: {infos: true}}).infos[this.data.dAnswer.skcode]
                wx.setNavigationBarTitle({
                    title: infoData.c + "/" + infoData.e
                })
            } else {
                //refush progress...
                this.refushProgress()
                this.next1()
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    refushProgress: function (isAddReview) {
        try {
            //read local progress
            const ppath = app.data.mdb.getSubjectPath() + "progress"
            if (app.data.mfile.isExist(ppath)) {
                var pconter = app.data.mfile.readFile(ppath)
                if (pconter.trim().length > 0) {
                    this.data.dProgress = JSON.parse(pconter)
                } else {
                    app.data.mlog.err("progress conter is err", pconter)
                }
            }
            //check progress is end
            if (this.data.dProgress.skeyIArr.length - 1 > this.data.dProgress.thisProgress) {
                app.data.mlog.info("used old progress", this.data.dProgress)
            } else {
                const tday = app.getDayStrByOldLen()
                if (isAddReview) {
                    //review add progress
                    const newReviewArr = this.getReviewIArr()
                    newReviewArr.map(i => this.data.dProgress.skeyIArr.push(i))
                    this.setData(this.data)
                    //write progress to local
                    app.data.mfile.writeFile(ppath, JSON.stringify(this.data.dProgress))
                    app.data.mlog.info("new review arr", newReviewArr)
                } else if (tday != this.data.dProgress.time) {
                    wx.showLoading({
                        title: '生成新的进度条...',
                        mask: true//防止触摸
                    })
                    //clean
                    this.data.dProgress.skeyIArr = []
                    this.data.dProgress.reviewSIArr = []
                    const count0IArr = []
                    const IArrByFZK = {}//{7:[0,2,4]...}
                    SETTINGS.lasts.map(l => IArrByFZK[l] = [])
                    //query cache
                    const alldata = app.data.mdb.query1({field: {keys: true, infos: true}})
                    const keys = alldata.keys
                    const infos = alldata.infos
                    //Classified by count
                    keys.map((skey, i) => {
                        const skcode = app.enUnicode(skey)
                        const count = infos[skcode].c > 0 ? parseInt(infos[skcode].c) : 0
                        if (count == 0) {
                            //count is 0
                            count0IArr.push(i)
                        } else if (count >= FZK_MAX) {
                            //count is max
                            this.data.dProgress.reviewSIArr.push(i)
                        } else {
                            //count is fzk
                            IArrByFZK[SETTINGS.lasts[SETTINGS.lasts.findIndex(l => count < l)] + ""].push(i)
                        }
                    })

                    // 提示新单词太少
                    if (count0IArr.length < SETTINGS.jobLength) {
                        app.showModal("新单词太少，需要补充！")
                    }
                    //get iarr
                    const IArr2Arr = []//[[1,2,3],[2,3,4]]
                    SETTINGS.lasts.map(l => {
                        const iarr = IArrByFZK[l]
                        for (var i = 0; i < iarr.length; i++) {
                            IArr2Arr.push([])
                            const skcode = app.enUnicode(keys[iarr[i]])
                            const wc = (infos[skcode].c > 0 ? parseInt(infos[skcode].c) : 0)
                            for (var j = 0; j < (l - wc); j++) {
                                IArr2Arr[IArr2Arr.length - 1].push(iarr[i])
                            }
                        }
                    })

                    //get count 0 index
                    for (var i = 0; i < SETTINGS.jobLength; i++) {
                        if (i < count0IArr.length) {
                            IArr2Arr.push([])
                            for (var j = 0; j < SETTINGS.lasts[0]; j++) {
                                IArr2Arr[IArr2Arr.length - 1].push(count0IArr[i])
                            }
                        }
                    }
                    //get count max index:default review
                    IArr2Arr.push(this.getReviewIArr())
                    //iarr2arr to progress
                    IArr2Arr.sort((iarr1, iarr2) => {
                        //sort by desc
                        return iarr2.length - iarr1.length
                    }).filter(iarr => iarr.length > 0).map((iarr, i) => {
                        if (i == 0) {
                            this.data.dProgress.skeyIArr = JSON.parse(JSON.stringify(iarr))
                        } else {
                            const len = parseInt(this.data.dProgress.skeyIArr.length / iarr.length)
                            for (var j = iarr.length - 1; j >= 0; j--) {
                                this.data.dProgress.skeyIArr.splice(j * len, 0, iarr[j])
                            }
                        }
                    })

                    //新单词不要挤在一起
                    this.data.dProgress.skeyIArr.map((ski1, i1) => {
                        if (i1 > 0) {
                            const skcode0 = app.enUnicode(keys[this.data.dProgress.skeyIArr[i1 - 1]])
                            const skcode1 = app.enUnicode(keys[ski1])
                            if (infos[skcode0].c == infos[skcode1].c && false == (infos[skcode0].c > 0)) {
                                for (var i3 = this.data.dProgress.skeyIArr.length - 1; i3 > 0; i3--) {
                                    const ski3 = this.data.dProgress.skeyIArr[i3]
                                    const skcode2 = app.enUnicode(keys[this.data.dProgress.skeyIArr[i3 - 1]])
                                    const skcode3 = app.enUnicode(keys[ski3])
                                    if (ski1 >= 0 && infos[skcode2].c > 0 && infos[skcode3].c > 0 && Math.random() > 0.5) {
                                        this.data.dProgress.skeyIArr[i1] = this.data.dProgress.skeyIArr[i3]
                                        this.data.dProgress.skeyIArr[i3] = ski1
                                        ski1 = -1
                                    }
                                }
                            }
                        }
                    })
                    this.data.dProgress.skeyIArr.sort(() => {
                        return parseInt(Math.random() * 3) - 1
                    })
                    app.data.mlog.info("new progress arr", this.data.dProgress.skeyIArr,
                        this.data.dProgress.skeyIArr.map(ski => infos[app.enUnicode(keys[ski])].c))
                    this.data.dProgress.thisProgress = -1
                    this.data.dProgress.saveProgress = -1
                    this.data.dProgress.time = tday
                    //write progress to local
                    app.data.mfile.writeFile(ppath, JSON.stringify(this.data.dProgress))
                    wx.hideLoading()
                }
            }
            this.setData(this.data)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    getReviewIArr: function () {
        const grIArr = []
        try {
            while (this.data.dProgress.reviewSIArr.length > 0 && SETTINGS.jobLength > grIArr.length) {
                const ri = parseInt(this.data.dProgress.reviewSIArr.length * Math.random())
                const skindex = this.data.dProgress.reviewSIArr.splice(ri, 1)[0]
                grIArr.push(skindex)
            }
            this.setData(this.data)
        } catch (e) {
            app.data.mlog.err(e)
        }
        return grIArr
    },
    clickPri: function () {
        try {
            if (this.data.errStyle == "" && this.data.dProgress.thisProgress > 0) {
                this.data.dProgress.thisProgress -= 1
                this.setData(this.data)
                this.refushMode()
            }
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    clickNext: function () {
        try {
            if (this.data.errStyle == "" && this.data.dProgress.thisProgress <= this.data.dProgress.saveProgress) {
                this.data.dProgress.thisProgress += 1
                this.setData(this.data)
                this.refushMode()
            }
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    clickLast: function () {
        try {
            if (this.data.errStyle == "" && this.data.dProgress.thisProgress <= this.data.dProgress.saveProgress) {
                this.data.dProgress.thisProgress = this.data.dProgress.saveProgress + 1
                this.setData(this.data)
                this.refushMode()
            }
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    next1: function () {
        try {
            this.data.errStyle = ""//clean err style
            const skeyIArr = this.data.dProgress.skeyIArr
            //get err progress
            var progress = this.data.errProgressArr[parseInt(this.data.errProgressArr.length * Math.random())]
            //下个单词正好跟错误单词相同
            var coverErr = false
            if (this.data.errProgressArr.filter(p => skeyIArr[p] == skeyIArr[this.data.dProgress.thisProgress + 1]).length > 0) {
                progress = (this.data.dProgress.thisProgress + 1)
                coverErr = true
            }
            if (progress >= 0
                //除非是最后，否则不能重复
                && false == (this.data.dProgress.thisProgress < skeyIArr.length - 1 && skeyIArr[this.data.dProgress.thisProgress] == skeyIArr[progress])
                && (Math.random() > 0.5 //50%随机
                    || this.data.errProgressArr.length > 3//错误列表太长
                    || coverErr//下个单词正好跟错误单词相同
                    || this.data.dProgress.thisProgress == skeyIArr.length - 1)//进度条即将结束
            ) {
                //to err progress
                this.data.dProgress.thisProgress = progress
                this.data.errStyle = "background:rgba(255,0,0,0.2)"
                this.setData(this.data)
            } else if (skeyIArr.length - 1 > this.data.dProgress.thisProgress) {
                //next
                progress = this.data.dProgress.thisProgress += 1
                this.setData(this.data)
            } else {
                const randomTo = () => {
                    //三期复习结束,进入随机学习模式,不会记录分数
                    app.showModal(msg + " 是否随机读取进度?", () => {
                        this.data.dProgress.thisProgress = parseInt(Math.random() * skeyIArr.length)
                        this.setData(this.data)
                        this.next1()
                    }, () => {
                    })
                }
                //end
                progress = -1
                const msg = "is end."
                if (this.data.dProgress.reviewSIArr.length > 0) {
                    app.showModal(msg + " 是否继续复习?", () => {
                        this.refushProgress(true)
                        this.next1()
                    }, () => {
                    })
                } else {
                    randomTo()
                }
            }

            //refush view
            if (progress >= 0) {
                //refush mode
                this.refushMode()
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    refushMode: function (skeyIndex, skey, viewType2) {
        try {
            //query data
            const alldata = app.data.mdb.query1({field: {keys: true, infos: true}})
            const keys = alldata.keys
            const infos = alldata.infos
            //check skey index
            if (skeyIndex == null) {
                skeyIndex = this.data.dProgress.skeyIArr[this.data.dProgress.thisProgress]
            }
            //check skey
            if (typeof skey == "string") {
                skeyIndex = keys.indexOf(skey)
            }
            //def refush title
            wx.setNavigationBarTitle({
                title: (this.data.dProgress.thisProgress + 1) + "/" + this.data.dProgress.skeyIArr.length
            })
            skey = keys[skeyIndex]
            if (skey != null) {
                const skcode = app.enUnicode(skey)
                const wcount = (infos[skcode].c > 0 ? parseInt(infos[skcode].c) : 0)
                const fl = (this.data.errStyle != "" ? wcount - 1 : wcount)//err:c-1
                //get view type by c
                if (viewType2 == null) {
                    var viewTypeArr = SETTINGS.fzkts
                    var VLMax = FZK_MAX
                    //get view type by filterFZK "image->en;en->zhvoice"
                    if (typeof infos[skcode][FILTER_FZK] == "string" && infos[skcode][FILTER_FZK].trim() != "") {
                        viewTypeArr = infos[skcode][FILTER_FZK].split(";").map(vt2 => vt2.split("->"))
                        VLMax = viewTypeArr.length
                    }
                    viewType2 = viewTypeArr[fl > VLMax ? parseInt(viewTypeArr.length * Math.random()) : fl]
                }
                //check spelling is null
                var srcType = viewType2[0]
                const srcVal = infos[skcode][srcType]
                if (typeof srcVal == "string" && srcVal.trim().length > 0) {

                } else {
                    srcType = SETTINGS.learnkey2
                }

                //refush dAnswer
                this.data.dAnswer = this.getOptionInfo(infos[skcode], skcode, srcType)
                this.data.dAnswer.count = wcount
                this.data.dAnswer.skeyIndex = skeyIndex

                //check view type 2 is edit
                if (viewType2[1].toUpperCase().startsWith("EDI")) {
                    //mode2
                    this.data.dMode.name = "mode-02"
                    this.data.dMode.mode2Edits = this.getEditInfoArr(skey, viewType2[1],
                        fl / SETTINGS.lasts[SETTINGS.lasts.length - 1])
                } else {
                    this.data.dMode.name = "mode-01"
                    // //def play
                    // if (viewType2[1] != SETTINGS.learnkey) {
                    //     app.data.mvoice.playSync(this.data.dAnswer.evData)
                    // } else {
                    //     this.data.dAnswer.ev = ""
                    // }
                    //refush mode1 options
                    this.data.dMode.mode1Options = []
                    //find word
                    const firstWordIArr = keys.map((skey1, ski) => {
                        const skcode1=app.enUnicode(skey1)
                        return (skey1 != skey
                        //by filterWT
                        && (typeof infos[skcode].filterWT == "string" && infos[skcode].filterWT.trim() != ""
                            && infos[skcode1].wordtype == infos[skcode].filterWT ||
                            !(typeof infos[skcode].filterWT == "string" && infos[skcode].filterWT.trim() != ""))
                        && (
                            skey1.startsWith(skey.split("")[0])//by first word
                            || (skey.length > 3 && skey1.endsWith(skey.substr(skey.length - 3)))//by last word
                        ) ? ski : -1)
                    }).filter(ski => ski >= 0)
                    console.info("firstWordIArr....",firstWordIArr)
                    while (firstWordIArr.length < 3) {
                        const ski = parseInt(Math.random() * keys.length)
                        if (firstWordIArr.indexOf(ski) < 0 && ski != skeyIndex) {
                            firstWordIArr.push(ski)
                        }
                    }
                    console.info("firstWordIArr....2",firstWordIArr)
                    //add other option
                    for (var i = 0; i < 3; i++) {
                        if (firstWordIArr.length > 0) {
                            const OSkeyIndex = firstWordIArr.splice(parseInt(Math.random() * firstWordIArr.length), 1)[0]
                            const OSkcode = app.enUnicode(keys[OSkeyIndex])
                            const OOptionInfo = this.getOptionInfo(infos[OSkcode], OSkcode, viewType2[1])
                            OOptionInfo.ev = "checkSelected"
                            OOptionInfo.evData = OSkcode
                            this.data.dMode.mode1Options.push(OOptionInfo)
                        } else {
                            this.data.dMode.mode1Options.push(this.data.dMode.mode1Options[this.data.dMode.mode1Options.length - 1])
                        }
                    }
                    //first option
                    const optionInfo1 = this.getOptionInfo(infos[skcode], skcode, viewType2[1])
                    optionInfo1.ev = "checkSelected"
                    optionInfo1.evData = skcode
                    //add answer option
                    this.data.dMode.mode1Options.splice(parseInt(this.data.dMode.mode1Options.length * Math.random()), 0, optionInfo1)
                }
                //edit type open mac
                if (viewType2[1] == "edit") {
                    this.data.dTools.mac.isShow = true
                    this.data.dTools.play.isShow = true
                } else {
                    this.data.dTools.mac.isShow = false
                    this.data.dTools.play.isShow = false
                }
                this.setData(this.data)
            }
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    getOptionInfo: function (infoData, skcode, viewType) {
        try {
            const modeInfo = {
                skcode: skcode,
                text: null,
                ev: "",
                evData: "",
                ev2: "toTablePage",
                evData2: infoData[SETTINGS.learnkey],
                imgPath: null// "/images/inull.jpg"
            }
            const mediaPath = app.data.mdb.getMediaPathByMType(skcode, viewType, infoData[viewType], true)
            if (viewType == IMAGE) {
                modeInfo.imgPath = mediaPath != null ? mediaPath : "/images/inull.jpg"
            } else if (SETTINGS.voicetypes.indexOf(viewType) >= 0) {
                modeInfo.imgPath = "/images/" + (mediaPath != null ? "voice.svg" : "vnull.svg")
                modeInfo.ev = "clickPlayVoice"
                modeInfo.evData = mediaPath
            } else {
                modeInfo.text = infoData[viewType]
            }
            return modeInfo
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    getEditInfoArr: function (skey, edType, ratio) {
        //0.1-0.5
        if (ratio > 0.5) {
            ratio = 0.5
        }
        const wordArr = edType == "edi" ? skey.split("") : [skey]
        var inputTotal = parseInt(wordArr.length * ratio)
        if (inputTotal < 1) {
            inputTotal = 1
        }
        var inputSUM = 0
        //tmp word to edit text info
        const editInfoArr = wordArr.map(w => {
            return {
                type: "text",
                val: w,

                inputStr: "",
                style: "",
                ev: "",
                evData: "",
            }
        })
        const wordPattr = /[a-zA-Z]/
        while (inputSUM < inputTotal) {
            editInfoArr.map((editInfo, i) => {
                if (wordArr.length == 1 //edit
                    || i > 0 && inputSUM < inputTotal && wordPattr.test(editInfo.val) && Math.random() >= 0.5//edi
                ) {
                    //type to input
                    inputSUM += 1
                    // if(inputSUM==1){
                    //     editInfo.focus=true
                    // }else{
                    //     editInfo.focus=false
                    // }
                    editInfo.type = "input"
                    editInfo.inputStr = ""
                    editInfo.style = "width:" + (editInfo.val.length > 1 ? "100%" : ((3 + editInfo.val.length * 10) + "vw"))
                    editInfo.ev = "checkEdit"
                    editInfo.evData = i
                }
            })
        }
        return editInfoArr
    },
    checkSelected: function (e) {
        try {
            const selectedIndex = this.data.dMode.mode1Options.findIndex(o => o.skcode == e.currentTarget.dataset.event1Data1)
            const isCorrect = e.currentTarget.dataset.event1Data1 == this.data.dAnswer.skcode
            //show option mask
            if (isCorrect) {
                this.data.dMode.mode1Options[selectedIndex].maskPath = "/images/succ.svg"
            } else {
                this.data.dMode.mode1Options[selectedIndex].maskPath = "/images/err.svg"
            }
            this.setData(this.data)
            this.saveCorrect(isCorrect)//save correct
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    checkEdit: function (e) {
        try {
            var i = e.currentTarget.dataset.event1Data1
            const IMLength = this.data.dMode.mode2Edits[i].val.length
            //substr first
            this.data.dMode.mode2Edits[i].inputStr = e.detail.value.substr(0, IMLength)
            const inputInfoArr = this.data.dMode.mode2Edits.filter(editInfo => editInfo.type == "input")
            if (this.data.dMode.mode2Edits.length > 1 && e.detail.value.length > IMLength) {
                const nextIndex = inputInfoArr.findIndex(editInfo => editInfo.evData > i && editInfo.inputStr == "")
                //substr next
                if (nextIndex >= 0) {
                    // this.data.dMode.mode2Edits[i].focus=false
                    // inputInfoArr[nextIndex].focus=true
                    inputInfoArr[nextIndex].inputStr = e.detail.value.substr(IMLength, 1)
                    app.data.mlog.info("auto next focus", inputInfoArr, nextIndex)
                    i = inputInfoArr[nextIndex].evData
                }
            }
            this.setData(this.data)
            //check is end
            if (
                //所有输入都正确可以判定为结束
                inputInfoArr.filter(inputInfo => inputInfo.inputStr == inputInfo.val).length == inputInfoArr.length ||
                //所有输入框不为空并且最后一个输入框输入时可以判定为结束
                (i == inputInfoArr[inputInfoArr.length - 1].evData
                    && inputInfoArr.filter(inputInfo => inputInfo.inputStr.length == inputInfo.val.length).length == inputInfoArr.length)) {
                const inputRStr = this.data.dMode.mode2Edits.map(editInfo => {
                    //re color
                    if (editInfo.inputStr != editInfo.val) {
                        editInfo.style += ";color:red"
                    } else {
                        editInfo.style = "width:" + ((editInfo.val.length > 1 ? 10 : 0) + editInfo.val.length * 10) + "vw"
                    }
                    //return input str
                    if (editInfo.type == "input") {
                        return editInfo.inputStr
                    } else {
                        return editInfo.val
                    }
                }).join("")
                const isCorrect = this.data.dAnswer.skcode == app.enUnicode(inputRStr)
                this.saveCorrect(isCorrect)//save correct
            } else {

            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    errTip: function () {
        try {
            const infoData = app.data.mdb.query1({field: {infos: true}}).infos[this.data.dAnswer.skcode]
            if (this.data.dAnswer.text != null) {
                if (infoData.spelling != null) {
                    //tip by spelling
                    const spelling = infoData.spelling.split(",").join("+")
                    if (this.data.dAnswer.text != spelling) {
                        this.data.dAnswer.text = spelling
                    }
                }
            } else if (this.data.dAnswer.imgPath.endsWith("voice.svg")) {
                //tip by skey
                this.data.dAnswer.text = infoData[SETTINGS.learnkey]
            } else {
                //tip by img
                const mediaPath = app.data.mdb.getMediaPathByMType(this.data.dAnswer.skcode, IMAGE, infoData[IMAGE])
                if (mediaPath != null) {
                    this.data.dAnswer.imgPath = mediaPath
                }
            }
            this.setData(this.data)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    hideMask: function () {
        try {
            //close mask
            this.data.dMask.isShow = false
            if (this.data.dMask.interval >= 0) {
                clearInterval(this.data.dMask.interval)
                this.data.dMask.interval = -1
            }
            this.data.dMode.mode1Options.map(option => option.maskPath = "")
            this.setData(this.data)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    clickPlayVoice: function (e) {
        try {
            if (e.currentTarget.dataset.event1Data1 != null) {
                app.data.mvoice.playSync(e.currentTarget.dataset.event1Data1)
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    playAnswer: function () {
        try {
            const mediaPath = app.data.mdb.getMediaPathByMType(this.data.dAnswer.skcode, SETTINGS.learnvoice, "mp3")
            if (mediaPath != null) {
                app.data.mvoice.playSync(mediaPath)
            }
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    saveCorrect: function (isCorrect) {
        try {
            //play voice
            if (isCorrect) {
                app.data.mvoice.playSync("/voices/ok.mp3")
            } else {
                app.data.mvoice.playSync("/voices/no.mp3")
                const eProgress = this.data.dProgress.thisProgress
                //check is ee
                if (this.data.errProgressArr[0] == eProgress) {
                    //tip err
                    this.errTip()
                } else {
                    //save err progress
                    this.data.errProgressArr.splice(0, 0, eProgress)
                    this.setData(this.data)
                }
            }
            //show mask
            this.data.dMask.isShow = true
            this.data.dMask.callback = () => {
                this.hideMask()
                //correct to next
                if (isCorrect) {
                    this.next1()
                }
            }
            if (this.data.dMask.interval == -1) {
                this.data.dMask.interval = setInterval(this.data.dMask.callback, 1000)
            }
            this.setData(this.data)

            //check is this progress
            if ((this.data.dProgress.thisProgress - 1) == this.data.dProgress.saveProgress) {
                //save to local
                this.data.dProgress.saveProgress = this.data.dProgress.thisProgress
                this.setData(this.data)
                //save progress
                app.data.mfile.writeFile(app.data.mdb.getSubjectPath() + "progress", JSON.stringify(this.data.dProgress))
                //save data to local
                const alldata = app.data.mdb.query1({field: {counts: true, infos: true}})
                const counts = alldata.counts
                const infos = alldata.infos
                const skcode = this.data.dAnswer.skcode
                const tDay = app.getDayStrByOldLen()
                const tWeek = app.getYWeekStr()
                const tMonth = app.getYMonthStr()
                const getCSTTD = (countsData, skcode1, timeType, time, dateType) => {
                    if (countsData[skcode1] == null) {
                        countsData[skcode1] = {}
                    }
                    if (countsData[skcode1][timeType] == null) {
                        countsData[skcode1][timeType] = {}
                    }
                    if (countsData[skcode1][timeType][time] == null) {
                        countsData[skcode1][timeType][time] = {}
                    }
                    if (countsData[skcode1][timeType][time][dateType] == null) {
                        countsData[skcode1][timeType][time][dateType] = 0
                    }
                    return parseInt(countsData[skcode1][timeType][time][dateType])
                }
                app.data.mdb.update1({
                    infos: {
                        [skcode]: {
                            c: (infos[skcode].c > 0 ? parseInt(infos[skcode].c) : 0) + 1,
                            e: (infos[skcode].e > 0 ? parseInt(infos[skcode].e) : 0) + (isCorrect ? 0 : 1)
                        }
                    },
                    counts: {
                        [skcode]: {
                            d: {
                                [tDay]: {
                                    c: getCSTTD(counts, skcode, "d", tDay, "c") + 1,
                                    e: getCSTTD(counts, skcode, "d", tDay, "e") + (isCorrect ? 0 : 1)
                                }
                            },
                            w: {
                                [tWeek]: {
                                    c: getCSTTD(counts, skcode, "w", tWeek, "c") + 1,
                                    e: getCSTTD(counts, skcode, "w", tWeek, "e") + (isCorrect ? 0 : 1)
                                }
                            },
                            m: {
                                [tMonth]: {
                                    c: getCSTTD(counts, skcode, "m", tMonth, "c") + 1,
                                    e: getCSTTD(counts, skcode, "m", tMonth, "e") + (isCorrect ? 0 : 1)
                                }
                            }
                        }
                    }
                })
            } else if (isCorrect && this.data.errStyle != "") {
                //find first progress
                const asi = this.data.dAnswer.skeyIndex
                const fprogress = this.data.dProgress.skeyIArr.map((ski, i) => ski == asi ? i : -1)//find all answer progress [p1,p2...]
                    .filter(p => this.data.errProgressArr.indexOf(p) >= 0)[0]//find all err answer index
                if (fprogress >= 0) {
                    //remove correct progress
                    this.data.errProgressArr.splice(this.data.errProgressArr.indexOf(fprogress), 1)
                    this.data.errStyle = ""
                    //to last
                    this.data.dProgress.thisProgress = this.data.dProgress.saveProgress
                    this.setData(this.data)
                }
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    toTablePage: function (e) {
        try {
            const keys = app.data.mdb.query1({field: {keys: true}}).keys
            const skey = e.currentTarget.dataset.event1Data2
            const ski = keys.indexOf(skey)
            const parrByski = this.data.dProgress.skeyIArr.map((ski1, i) => ski1 == ski ? i : -1).filter(i => i >= 0)
            const skcode = app.enUnicode(skey)
            if (this.data.dAnswer.skcode == skcode && parrByski.filter(progress => this.data.errProgressArr.indexOf(progress) >= 0).length == 0) {
                //只有答错才能看答案
            } else {
                app.openPage(null, "/pages/table/index?search=" + skey)
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    startRecordVoice: function () {
        try {
            if (this.data.dTools.mac.imgPath == "/images/mac1.svg") {
                this.data.dTools.mac.imgPath = "/images/mac2.svg"
                app.data.mvoice.startRecordRecognitionSync((code, res) => {
                    if (code) {
                        const rval = res.result.toLowerCase().split(".")[0]
                        this.data.dMode.mode2Edits[0].inputStr = rval
                        this.setData(this.data)
                        this.checkEdit({currentTarget: {dataset: {event1Data1: 0}}, detail: {value: rval}})
                    }
                })
            } else {
                this.data.dTools.mac.imgPath = "/images/mac1.svg"
            }
            this.setData(this.data)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    stopRecordVoice: function () {
        try {
            if (this.data.dMode.name == "mode-02") {
                this.data.dTools.mac.imgPath = "/images/mac1.svg"
                this.setData(this.data)
                app.data.mvoice.stopRecordRecognitionSync()
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    }

})
