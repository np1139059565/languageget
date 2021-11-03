//index.js
const app = getApp()

Page({
    data: {
        dButtons: {
            refush: {
                text: "refush",
                ev: "refushDir"
            }
        },
        absolutePath: null,
        childArr: [],//[{text:dir1,eventData:dir1}]
        editFileName: null,
        editorCtx:null,
        editConter:""
    },
    t:function (g){
        app.data.mlog.info(g)
    },
    onLoad: function () {
        try {
            //init dir
            this.data.absolutePath = app.data.mfile.getUserDir()
            app.data.mlog.info("absolutePath",this.data.absolutePath)
            this.setData(this.data)
            this.refushDir()
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    refushDir: function () {
        try {
            this.data.childArr = app.data.mfile.readDir(this.data.absolutePath).map(childName => {
                var childInfo = "permission"
                const stat = app.data.mfile.getFInfo(this.data.absolutePath  + childName)
                if(stat!=null){
                    if (stat.isDirectory()) {
                        childInfo = "dir"
                    }else{
                        childInfo = "file:" + stat.size
                    }
                }
                return {text: childName + ":" + childInfo, eventData: childName}
            })
            this.data.childArr.splice(0, 0, {text: "..", eventData: ".."})
            this.setData(this.data)
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    editFile: function () {
        try {
            const ftext = app.data.mfile.readFile(this.data.absolutePath+this.data.editFileName)
            if(this.data.editorCtx!=null){
                this.data.editorCtx.setContents({
                    html: ftext
                });
            }else{
                wx.createSelectorQuery().select("#i-edit").context( (res) =>{
                    //这里使用function会没办法使用this
                    res.context.setContents({
                        html: ftext
                    })
                    this.data.editorCtx = res.context
                    this.setData(this.data)
                }).exec()
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    saveFile:function (){
        try {
            const editFilePath=this.data.absolutePath+this.data.editFileName
            if(app.data.mfile.isExist(editFilePath)){
                app.showModal("保存?",()=>{
                    const wcode=app.data.mfile.writeFile(editFilePath,this.data.editConter.replaceAll(" "," "))
                    app.showModal("保存文件结果："+wcode)
                },()=>{
                    //刷新文件内容
                    // this.editFile()
                })
            }else {
                //not find;clear
                this.data.editFileName=null
                this.data.editorCtx.setContents({
                    html: ""
                })
                this.setData(this.data)
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    refushEditConter:function (e){
      this.data.editConter=e.detail.text
      this.setData(this.data)
    },
    clickChild: function (e) {
        try {
            const childName = e.currentTarget.dataset.event1Data1
            switch (childName) {
                case "..":
                    // back wxfile://usr/
                    if (this.data.absolutePath.split("/").length>4) {
                        const absoluteArr = this.data.absolutePath.split("/").filter((child,i)=>i==1||child!="")
                        this.data.absolutePath = absoluteArr.splice(0, absoluteArr.length - 1).join("/")+"/"
                        this.setData(this.data)
                        this.refushDir()
                    } else {
                        app.data.mlog.err("is root dir:" + this.data.absolutePath)
                    }
                    break;
                default:
                    // next
                    const childPath = this.data.absolutePath  + childName
                    const stat = app.data.mfile.getFInfo(childPath)
                    if (stat!=null&&stat.isDirectory()) {
                        // open dir
                        this.data.absolutePath = childPath+"/"
                        this.setData(this.data)
                        this.refushDir()
                    } else if (stat.isFile()) {
                        //save file
                        if(childName==this.data.editFileName){
                            this.saveFile()
                        }else{
                            // open file
                            const callback = () => {
                                this.data.editFileName = childName
                                this.setData(this.data)
                                this.editFile()
                            }
                            if (stat.size > 1024) {
                                app.showModal("文件过大，任然打开?", callback, () => {})
                            } else callback()
                        }
                    }
                    break;
            }
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    removeChild: function (e) {
        try {
            const fPath = this.data.absolutePath + e.currentTarget.dataset.event1Data1
            app.showModal("确定删除 " + fPath + "?", () => {
                if (app.data.mfile.rmPath(fPath)) {
                    this.refushDir()
                }
            }, () => {
            })
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
})
