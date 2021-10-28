//index.js
const app = getApp()

// add index.json
import * as echarts from 'ec-canvas/echarts.min'
var echartClass = null
var SETTINGS=null
Page({
    data: {
        dButtons: {
            // switchSubject: {text: "subject", ev: "switchSubjectSync1"},
            learn: {
                text: "learn",
                ev: "openPage",
                evData: "/pages/learn/index",style:""
            },
            apple: {
                text: "apple",
                ev: "openPage",
                evData: "/pages/apple/index",style:""
            },
            setting: {
                text: "setting",
                ev: "openPage",
                evData: "/pages/setting/index",
                style:""
            },
            // trend: {text: "trend", ev: "openPage", evData: "/pages/trend/index",style:""}
        },
        dGolds:null,//{total}
        // trend
        wCount:0,
        dTrend: {
            ec1: {//def key
                onInit: (canvas, width, height, dpr) => {
                    const eobj = echarts.init(canvas, null, {
                        width: width,
                        height: height,
                        devicePixelRatio: dpr // 像素
                    })
                    canvas.setChart(eobj)

                    eobj.setOption({})
                    echartClass = eobj
                    return eobj
                },
            },
            clickInit:false,
            style: "",
            dButtons: {
                c: {
                    text: "count",
                    ev: "",
                    evData: "c",
                    style: "color:green"
                },
                e: {
                    text: "error",
                    ev: "",
                    evData:"e",
                    style: "color:green"
                },
                d: {
                    text: "day",
                    ev: "",
                    evData: "d",
                    style: "color:green"
                },
                w: {
                    text: "week",
                    ev: "",
                    evData: "w",
                    style: ""
                },
                m: {
                    text: "month",
                    ev: "",
                    evData: "m",
                    style: ""
                },
            },
            line: {
                offset: 0,
                timeType: "d",
                dataTypeArr: ["c", "e"]
            },
            dButtons2: {
                //first:{text: "<<", vtype: "button", tapEvent: "fTrendFirst", style: ""},
                pri: {
                    text: "<",
                    vtype: "button",
                    ev: "",
                    style: ""
                },
                len: {
                    text: 7,
                    type: "input",
                    ev: "",
                    style: "text-align: center;width:20vw;"
                },
                next: {
                    text: ">",
                    vtype: "button",
                    ev: "",
                    style: ""
                },
                last: {
                    text: ">>",
                    vtype: "button",
                    ev: "",
                    style: ""
                }
            }
        },
    },
    onLoad: function (option) {
        try {
            //def data
            this.data.dTrend.skeyArr=Object.values(option)
            //从table跳转过来禁止打开setting
            if(this.data.dTrend.skeyArr.length>0){
                this.data.dButtons.setting.text=""
            }else{
                this.data.dButtons.setting.text="setting"
            }
            this.setData(this.data)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    onShow:function (){
        try {
            this.switchSubjectSync1(true)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    switchSubjectSync1: function (isDefaultSelected) {
        try {
            app.data.mdb.switchSubjectSync((code) => {
                if(code){
                    //init settings
                    SETTINGS = app.data.mdb.query1({field: {settings: true}}).settings
                    //query golds
                    this.data.dGolds=app.data.mdb.query1({field:{golds:true}}).golds
                    //refush title
                    wx.setNavigationBarTitle({
                        title: app.data.mdb.query1({field:{subject:true}}).subject
                    })
                    this.openButtons()
                    //init line
                    this.refushLineSync()
                }else if(app.data.mdb.getSubjectId()==null){
                    this.closeButtons()
                }
            },true,isDefaultSelected==true)
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    closeButtons:function (){
        try{
            const addStyle=(buttionInfo)=>{
                buttionInfo.style=(buttionInfo.style+";color:#CCC")
            }
            //open click
            addStyle(this.data.dButtons.learn)
            this.data.dButtons.learn.ev=""
            // addStyle(this.data.dButtons.files)
            // this.data.dButtons.files.ev=""
            // addStyle(this.data.dButtons.table)
            // this.data.dButtons.table.ev=""
            // addStyle(this.data.dButtons.setting)
            // this.data.dButtons.setting.ev=""

            addStyle(this.data.dTrend.dButtons.c)
            this.data.dTrend.dButtons.c.ev=""
            addStyle(this.data.dTrend.dButtons.e)
            this.data.dTrend.dButtons.e.ev=""
            addStyle(this.data.dTrend.dButtons.d)
            this.data.dTrend.dButtons.d.ev=""
            addStyle(this.data.dTrend.dButtons.w)
            this.data.dTrend.dButtons.w.ev=""
            addStyle(this.data.dTrend.dButtons.m)
            this.data.dTrend.dButtons.m.ev=""

            addStyle(this.data.dTrend.dButtons2.pri)
            this.data.dTrend.dButtons2.pri.ev=""
            addStyle(this.data.dTrend.dButtons2.len)
            this.data.dTrend.dButtons2.len.ev=""
            addStyle(this.data.dTrend.dButtons2.next)
            this.data.dTrend.dButtons2.next.ev=""
            addStyle(this.data.dTrend.dButtons2.last)
            this.data.dTrend.dButtons2.last.ev=""
            this.setData(this.data)
        }catch (e){
            app.data.mlog.err(e)
        }
    },
    openButtons:function (){
        try{
            const cleanStyle=(buttionInfo)=>{
                buttionInfo.style=buttionInfo.style.replace("color:#CCC","")
            }
            //open click
            cleanStyle(this.data.dButtons.learn)
            this.data.dButtons.learn.ev="openPage"
            // cleanStyle(this.data.dButtons.files)
            // this.data.dButtons.files.ev="openPage"
            // cleanStyle(this.data.dButtons.table)
            // this.data.dButtons.table.ev="openPage"
            // cleanStyle(this.data.dButtons.setting)
            // this.data.dButtons.setting.ev="openPage"

            cleanStyle(this.data.dTrend.dButtons.c)
            this.data.dTrend.dButtons.c.ev="switchDataType"
            cleanStyle(this.data.dTrend.dButtons.e)
            this.data.dTrend.dButtons.e.ev="switchDataType"
            cleanStyle(this.data.dTrend.dButtons.d)
            this.data.dTrend.dButtons.d.ev="switchTimeType"
            cleanStyle(this.data.dTrend.dButtons.w)
            this.data.dTrend.dButtons.w.ev="switchTimeType"
            cleanStyle(this.data.dTrend.dButtons.m)
            this.data.dTrend.dButtons.m.ev="switchTimeType"

            cleanStyle(this.data.dTrend.dButtons2.pri)
            this.data.dTrend.dButtons2.pri.ev="linePri"
            cleanStyle(this.data.dTrend.dButtons2.len)
            this.data.dTrend.dButtons2.len.ev="upLineLen"
            cleanStyle(this.data.dTrend.dButtons2.next)
            this.data.dTrend.dButtons2.next.ev="lineNext"
            cleanStyle(this.data.dTrend.dButtons2.last)
            this.data.dTrend.dButtons2.last.ev="lineLast"
            this.setData(this.data)
        }catch (e){
            app.data.mlog.err(e)
        }
    },
    openPage: function (e) {
        wx.navigateTo({
            url: e.currentTarget.dataset.event1Data1,
        })
    },

    switchDataType:function (e){
      try{
          const dataType=e.currentTarget.dataset.event1Data1
          if(this.data.dTrend.dButtons[dataType].style==""){
              this.data.dTrend.dButtons[dataType].style="color:green"
              this.data.dTrend.line.dataTypeArr.push(dataType)
          }else{
              this.data.dTrend.dButtons[dataType].style=""
              const dti=this.data.dTrend.line.dataTypeArr.indexOf(dataType)
              this.data.dTrend.line.dataTypeArr.splice(dti,1)
          }
          this.setData(this.data)
          this.refushLineSync()
      }  catch (e){
          app.data.mlog.err(e)
      }
    },
    switchTimeType:function (e){
        try{
            const timeType=e.currentTarget.dataset.event1Data1
            if(this.data.dTrend.dButtons[timeType].style==""){
                //clean
                const timeTypes=["d","w","m"]
                timeTypes.map(t=>this.data.dTrend.dButtons[t].style="")
                //set style
                this.data.dTrend.dButtons[timeType].style="color:green"
                this.data.dTrend.line.timeType=timeType
                this.setData(this.data)
                this.refushLineSync()
            }

        }  catch (e){
            app.data.mlog.err(e)
        }
    },
    refushLineSync: function (callback) {
        //init time
        const timeArr = []
        var getTimeMethod = app.getDayStrByOldLen
        switch (this.data.dTrend.line.timeType) {
            case "w":
                getTimeMethod = app.getYWeekStr
                break;
            case "m":
                getTimeMethod = app.getYMonthStr
                break;
        }
        for (var i = 0; i < this.data.dTrend.dButtons2.len.text; i++) {
            timeArr.splice(0,0,getTimeMethod(i + this.data.dTrend.line.offset))
        }
        //init data
        const counts=app.data.mdb.query1({field: {counts: true}}).counts
        var name=null
        var countInfoArr=[]
        if(this.data.dTrend.skeyArr.length>0){
            this.data.dTrend.skeyArr.map(skey=>{
                var countInfo=counts[app.enUnicode(skey)]
                if(countInfo==null){
                    countInfo={}
                }
                countInfoArr.push(countInfo)
            })
        }else {
            name="all"
            countInfoArr=Object.values(counts)
        }

        const serieArr = []
        this.data.dTrend.line.dataTypeArr.map(dataType => {
            const serie = {
                // name: name + "-" + dataType,
                lineStyle: {
                    color: dataType == "c" ? "green" : "red"
                },
                type: "line",
                data: [],
                markPoint:{
                    itemStyle:{
                        color:"#ffd700",//f6e34f/ffd700/fbf006
                    },
                    data:[]
                }
            }
            timeArr.map(time => {
                var serieVal = 0
                countInfoArr.map((countInfo,i) => {
                    serie.name=(name!=null?name:this.data.dTrend.skeyArr[i])+"-"+dataType
                    const timeCount = countInfo[this.data.dTrend.line.timeType]
                    var v = 0
                    if (timeCount != null && timeCount[time] != null&&timeCount[time][dataType]>0) {
                        v = parseInt(timeCount[time][dataType])
                    }
                    if (v >= 0) {
                        serieVal += v
                    }
                })
                //金币系统
                if(serie.name=="all-c"&&this.data.dTrend.line.timeType=="d"){
                    const markData=this.getGold(serieVal,time)
                    if(markData!=null){
                        markData.value="$"
                        markData.coord=[time,serieVal]
                        serie.markPoint.data.push(markData)
                    }
                }
                serie.data.push(serieVal)
            })
            serieArr.push(serie)
        })

        //init echart
        const setOption1=()=>{
            if(echartClass!=null){
                echartClass.setOption({
                    tooltip: {
                        show: true,
                        trigger: 'axis'
                    },
                    xAxis: {
                        type: 'category',
                        data: timeArr
                    },
                    yAxis: {
                        type: 'value',
                        splitLine: {
                            lineStyle: {
                                type: 'dashed'
                            }
                        }
                    },
                    series: serieArr.reverse()
                },true)
                if(!this.data.dTrend.clickInit){
                    this.data.dTrend.clickInit=true
                    this.setData(this.data)
                    echartClass.on("click","series.line",this.receiveGold)
                }
                if(typeof callback=="function"){
                    callback(true)
                }
            }else {
                if(this.data.wCount<20){
                    this.data.wCount+=1
                    this.setData(this.data)
                    app.data.mlog.info("wait echart class init...")
                    setTimeout(setOption1,100)
                }else{
                    app.data.mlog.err("echart is not init.")
                }

            }
        }
        setOption1()
    },
    receiveGold:function (e){
        try{
            if(e.data!=null&&e.data.tooltip!=null){
                app.showModal(e.data.tooltip,()=>{
                    app.data.mvoice.playSync("/voices/gold.mp3")
                    const total=parseInt(this.data.dGolds.total>0?this.data.dGolds.total:0)
                    const gold=parseInt(e.data.gold)
                    const record=e.data.record
                    app.data.mdb.update1({
                        golds:{
                            total:total+gold,
                            [e.data.time]:record
                        }
                    })
                    //update golds
                    this.data.dGolds=app.data.mdb.query1({field:{golds:true}}).golds
                    this.setData(this.data)
                    app.data.mlog.info("gold total",this.data.dGolds.total)
                    this.refushLineSync()
                })
            }
        }catch (e1){
            app.data.mlog.err(e1)
        }
    },
    getGold:function(count,dayStr){
        try{
            var addGold=0
            var tooltip=""
            var record=this.data.dGolds[dayStr]//{loginGold:30,jobGold,seriesJGold,reviewGold}
            if(record==null){
                record={}
            }
            //登录奖励
            if(count>0&&false==(record.loginGold>0)){
                addGold+=(record.loginGold=15)
                tooltip+="登录奖励+15;"
            }
            const maxJobCount=(SETTINGS.jobLength*SETTINGS.lasts[0]
                +SETTINGS.jobLength*(SETTINGS.lasts[1]-SETTINGS.lasts[0])
                +SETTINGS.jobLength*(SETTINGS.lasts[2]-SETTINGS.lasts[1])
                +SETTINGS.jobLength*(SETTINGS.lasts[3]-SETTINGS.lasts[2])
                +SETTINGS.jobLength*(SETTINGS.lasts[4]-SETTINGS.lasts[3]))//7*7+7*5*2+7*3+7*2=154
            //任务奖励
            if(count>=SETTINGS.jobLength*SETTINGS.lasts[0]){
                var jobGold=25
                if(count>=(SETTINGS.jobLength*SETTINGS.lasts[0]
                    +SETTINGS.jobLength*(SETTINGS.lasts[1]-SETTINGS.lasts[0]))){
                    jobGold+=30
                }
                if(count>=(SETTINGS.jobLength*SETTINGS.lasts[0]
                    +SETTINGS.jobLength*(SETTINGS.lasts[1]-SETTINGS.lasts[0])
                    +SETTINGS.jobLength*(SETTINGS.lasts[2]-SETTINGS.lasts[1]))){
                    jobGold+=35
                }
                if(count>=(SETTINGS.jobLength*SETTINGS.lasts[0]
                    +SETTINGS.jobLength*(SETTINGS.lasts[1]-SETTINGS.lasts[0])
                    +SETTINGS.jobLength*(SETTINGS.lasts[2]-SETTINGS.lasts[1])
                    +SETTINGS.jobLength*(SETTINGS.lasts[3]-SETTINGS.lasts[2]))){
                    jobGold+=40
                }

                if(count>=maxJobCount){
                    jobGold+=50
                    //连续完成任务奖励
                    const o1day=app.getDayStrByOldLen(1,dayStr)
                    const o2day=app.getDayStrByOldLen(2,dayStr)
                    const o3day=app.getDayStrByOldLen(3,dayStr)
                    const o4day=app.getDayStrByOldLen(4,dayStr)
                    if(false==(record.seriesJGold>0)
                        &&this.data.dGolds[o1day]!=null&&this.data.dGolds[o1day].loginGold>=jobGold
                        &&this.data.dGolds[o2day]!=null&&this.data.dGolds[o2day].loginGold>=jobGold
                        &&this.data.dGolds[o3day]!=null&&this.data.dGolds[o3day].loginGold>=jobGold
                        &&this.data.dGolds[o4day]!=null&&this.data.dGolds[o4day].loginGold>=jobGold){
                        addGold+=(record.seriesJGold=300)
                        tooltip+="连续完成任务奖励+300;"
                    }
                }
                if(typeof record.jobGold!="number"){
                    record.jobGold=0
                }
                if(jobGold>record.jobGold){
                    addGold+=(jobGold-record.jobGold)
                    tooltip+=("任务奖励+"+(jobGold-record.jobGold)+";")
                    record.jobGold=jobGold
                }
            }
            //复习奖励
            if(count>=maxJobCount+SETTINGS.jobLength*2){
                var reviewGold=20

                if(count>=maxJobCount+SETTINGS.jobLength*3){
                    reviewGold+=30
                }
                if(count>=maxJobCount+SETTINGS.jobLength*4){
                    reviewGold+=45
                }
                //undefined>=0 is false
                if(typeof record.reviewGold!="number"){
                    record.reviewGold=0
                }
                if(reviewGold>record.reviewGold){
                    addGold+=(reviewGold-record.reviewGold)
                    tooltip+=("复习奖励+"+(reviewGold-record.reviewGold)+";")
                    record.reviewGold=reviewGold;
                }
            }
            if(addGold>0){
                return {
                    // symbol:"pin",
                    // symbol:"image://data:image/png;base64,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",
                    // symbolSize:50,
                    // itemStyle:{
                    //     color:"#ffd700"//f6e34f/ffd700/fbf006
                    // },
                    //my data
                    tooltip:tooltip,
                    time:dayStr,
                    record:record,
                    gold:addGold
                }
            }
        }catch (e){
            app.data.mlog.err(e)
        }
        return null
    },
    linePri: function () {
        try {
            this.data.dTrend.line.offset += this.data.dTrend.dButtons2.len.text
            this.setData(this.data)
            this.refushLineSync()
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    upLineLen: function (e) {
        const inputv = e.detail.value
        if (inputv > 0) {
            this.data.dTrend.dButtons2.len.text = parseInt(inputv)
            this.setData(this.data)
            this.refushLineSync()
        }
    },
    lineNext: function () {
        try {
            if (this.data.dTrend.line.offset > 0) {
                this.data.dTrend.line.offset -= this.data.dTrend.dButtons2.len.text
                if (this.data.dTrend.line.offset < 0) {
                    this.data.dTrend.line.offset = 0
                }
                this.setData(this.data)
                this.refushLineSync()
            }
        } catch (e) {
            app.data.mlog.err(e)
        }
    },
    lineLast: function () {
        try {
            if (this.data.dTrend.line.offset > 0) {
                this.data.dTrend.line.offset = 0
                this.setData(this.data)
                this.refushLineSync()
            }
        } catch (e) {
            app.data.mlog.err(e)
        }
    }


})
