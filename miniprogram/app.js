//app.js
App({
    data: {
        rootPath:""
    },
    onLaunch: function () {
        //这个函数里不能有弹框之类的初始化操作
        try {
            //init log
            this.data.mlog= require(this.data.rootPath+"common/mlog.js")
            console.info("init mlog...")
            this.data.mlog.init1(
            //     null,
            //     (str1,str2,str3,str4)=>{
            //     this.showModal(str1+str2+str3+str4)
            // }
            )
            try {
                this.data.mfile= require(this.data.rootPath+"common/mfile.js")
                this.data.myun=require(this.data.rootPath+"common/myun.js")
                this.data.mdb= require(this.data.rootPath+"common/mdb.js")
                this.data.mvoice=require(this.data.rootPath+"common/mvoice.js")
                this.setData(this.data)
                this.data.mlog.info("init common events...")
                this.data.mfile.init1(this.data.mlog)
                this.data.myun.init1(this.data.mlog,this.data.mfile)
                this.data.mvoice.init1(this.data.mlog)
                this.data.mdb.init1("languageget",this.data.mlog,this.data.myun,this.data.mfile,this.showModal,this.showActionSheet)
            } catch (e) {
                this.data.mlog.err(e)
            }
        } catch (e) {
            console.error(e)
        }
    },
    /**
     *
     * @param conter
     * @param okcallback
     * @param cancelcallback
     */
    showModal: function(conter, okcallback, cancelcallback) {
        //ok,cancel
        wx.showModal({
            // title: conter,//titile 无换行
            content:conter,
            showCancel: typeof cancelcallback == "function",
            confirmText: "确认",
            cancelText: "取消",
            success: (res) => {
                try {
                    if (res.confirm) {
                        if (typeof okcallback == "function") {
                            okcallback()
                        }
                    } else if (res.cancel) {
                        if (typeof cancelcallback == "function") {
                            cancelcallback()
                        }
                    }
                } catch (e) {
                    this.data.mlog.err(e)
                }
            }
        })
    },
    /**
     *
     * @param itemList 必须是字符串
     * @param selectedCallback (selectVal,selectIndex)
     */
    showActionSheet: function(itemList, selectedCallback, cancelcallback) {
        // // select
        // wx.showActionSheet({
        //     itemList: itemList,//['A', 'B', 'C'],长度不能超过6
        //     complete: (res) => {
        //         try {
        //             if (res.errMsg.endsWith(":ok")) {
        //                 this.data.mlog.info("selected", itemList[res.tapIndex])
        //                 if (typeof selectedCallback == "function") {
        //                     selectedCallback(itemList[res.tapIndex], res.tapIndex)
        //                 }
        //             } else {
        //                 if (typeof cancelcallback == "function") {
        //                     this.data.mlog.info("not selected.")
        //                     cancelcallback()
        //                 }else{
        //                     this.data.mlog.err("not selected.")
        //                 }
        //             }
        //         } catch (e) {
        //             this.data.mlog.err(e)
        //         }
        //     }
        // })

        const MyShowActionSheet = function (config) {
            if (config.itemList.length > 6) {
                var myConfig = {};
                for (var i in config) { //for in 会遍历对象的属性，包括实例中和原型中的属性。（需要可访问，可枚举属性）
                    myConfig[i] = config[i];
                }
                myConfig.page = 1;
                myConfig.itemListBak = config.itemList;
                myConfig.itemList = [];
                var completeFun = config.complete;
                myConfig.complete = function (res) {
                    if (res.tapIndex == 5) {//下一页
                        myConfig.page++;
                        MyShowActionSheet(myConfig);
                    } else {
                        res.tapIndex = res.tapIndex + 5 * (myConfig.page-1);
                        completeFun(res);
                    }
                }
                MyShowActionSheet(myConfig);
                return ;
            }
            if (!config.page) {
                wx.showActionSheet(config);
            }else{
                var page = config.page;
                var itemListBak = config.itemListBak;
                var itemList = [];
                for (var i = 5 * (page - 1); i < 5 * page && i < itemListBak.length; i++) {
                    itemList.push(itemListBak[i]);
                }
                if (5 * page < itemListBak.length) {
                    itemList.push('下一页');
                }
                config.itemList = itemList;
                wx.showActionSheet(config);
            }
        }
        MyShowActionSheet({
                itemList: itemList,//['A', 'B', 'C'],长度不能超过6
                complete: (res) => {
                    try {
                        if (res.errMsg.endsWith(":ok")) {
                            this.data.mlog.info("selected", itemList[res.tapIndex])
                            if (typeof selectedCallback == "function") {
                                selectedCallback(itemList[res.tapIndex], res.tapIndex)
                            }
                        } else {
                            if (typeof cancelcallback == "function") {
                                // this.data.mlog.info("not selected.")
                                cancelcallback()
                            }else{
                                // this.data.mlog.err("not selected.")
                            }
                        }
                    } catch (e) {
                        this.data.mlog.err(e)
                    }
                }
            })
    },
    /**
     * {}里不能使用=>定义函数,否则会导致this不可用
     * @param callback
     */
    enUnicode:function (str,delim){
        return typeof str=="string"?str.split("").map(_ => {
            var c=_.charCodeAt()
            // if(c<10){
            //     c="0"+c
            // }
            // if(c<100){
            //     c="0"+c
            // }
            return c
        }).join(delim!=null?delim:""):null
    },
    deUnicode:function (str,delim){
        return typeof str=="string"?str.split(delim).map(u => String.fromCharCode(u)).join(""):null
    },
    openPage: function (e, url) {
        wx.navigateTo({
            url: e == null ? url : e.currentTarget.dataset.event1Data1,
        })
    },
    getDayStrByOldLen(olen = 0,tday) {
        const thisDay = (["string","number"].indexOf(tday)>=0?new Date(tday):new Date())
        if(false==(thisDay.setHours(12, 0, 0, 0)>=0)){
            this.data.mlog.err("tday is err")
        }
        return new Date(thisDay.getTime() - (olen * 24 * 60 * 60 * 1000)).toJSON().split("T")[0]
    },
    getYWeekStr(olen = 0,tdayStr) {
        if(tdayStr==null){
            tdayStr=this.getDayStrByOldLen(0)
        }
        const tmp = tdayStr.split("-")
        const yearStr=tmp[0]
        const tday = new Date(yearStr, parseInt(tmp[1]) - 1, tmp[2])//this day
        const yearFirstDay = new Date(yearStr, 0, 1)//今年第一天
        const dayCount = Math.round((tday.valueOf() - yearFirstDay.valueOf()) / 86400000)
        const weekNumber = Math.ceil((dayCount + ((yearFirstDay.getDay() + 1) - 1)) / 7) - olen
        if(weekNumber>0){
            return yearStr + "-w-" + weekNumber
        }else{
            const yj1day=new Date(new Date(yearStr+"-01-01").getTime()-24*60*60*1000)
            return this.getYWeekStr(-weekNumber,yj1day.toJSON().split("T")[0])
        }
    },
    getYMonthStr(olen = 0,tdayStr) {
        if(tdayStr==null){
            tdayStr=this.getDayStrByOldLen(0)
        }
        const tmp = tdayStr.split("-")
        const monthNumber=(parseInt(tmp[1]) - olen)
        if(monthNumber>0){
            return tmp[0] + "-m-" + monthNumber
        }else {
            return this.getYMonthStr(-monthNumber,(tmp[0]-1)+"-12-01")
        }
    },
})
