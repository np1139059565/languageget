//index.js
const app = getApp()
var SETTINGS=null
var KEYS=[]
var INFOS={}
Page({
    data: {
        dProgress: {
            skeyIArr: [],//skey index
            // reviewSIArr: [],
            // time: "",
            // saveProgress: -1,
            thisProgress: -1
        },
        dropInfo:{
            interval:-1,
            speed:0,
            appleArr:[],//{{skey,right,bottom}}
        },
        dInputInfo:{
            ev:"checkInput",
            inputStr:""
        }
    },
    onLoad: function (options) {
        try {
            //read local progress
            const ppath = app.data.mdb.getSubjectPath() + "progress"
            if (app.data.mfile.isExist(ppath)) {
                var pconter = app.data.mfile.readFile(ppath)
                if (pconter.trim().length > 0) {
                    this.data.dProgress = JSON.parse(pconter)
                    this.dropApple()
                }else{
                    app.showModal("没有找到单词列表",()=>{})
                }
            }
            //
            SETTINGS=app.data.mdb.query1({field:{settings:true}}).settings
            KEYS=app.data.mdb.query1({field:{keys:true}}).keys
            INFOS=app.data.mdb.query1({field:{infos:true}}).infos
        } catch (e1) {
            app.data.mlog.err(e1)
        }
    },
    onUnload:function (){
        try{
            clearInterval(this.data.dropInfo.interval)
            this.data.dropInfo.interval=-1
            this.setData(this.data)
        }catch (e){
            app.data.mlog.err(e)
        }
    },
    dropApple(){
      try{
          this.data.dropInfo.interval=setInterval(()=>{
              //find right
              const rightArr=[10,30,50,70].filter(r=>-1==this.data.dropInfo.appleArr.findIndex(appleInfo=>appleInfo.right==r
                  &&appleInfo.bottom>30))
              if(rightArr.length>0&&this.data.dropInfo.appleArr.length<10){
                  //refush progress
                  if(this.data.dProgress.skeyIArr.length-1<this.data.dProgress.thisProgress){
                      this.data.dProgress.thisProgress=-1
                  }
                  this.data.dProgress.thisProgress+=1
                  this.setData(this.data)
                  //drop
                  const skey=KEYS[this.data.dProgress.skeyIArr[this.data.dProgress.thisProgress]]
                  const skcode=app.enUnicode(skey)
                  const infoData=INFOS[skcode]
                  var mediaPath=app.data.mdb.getMediaPathByMType(skcode,"image",infoData["image"])
                  if(mediaPath==null){
                      mediaPath="/images/inull.jpg"
                  }
                  this.data.dropInfo.appleArr.push({
                      skey:skey,
                      text:skey,
                      imgPath:mediaPath,
                      right:rightArr[parseInt(Math.random()*rightArr.length)],
                      bottom:50
                  })
              }
              // fall
              this.data.dropInfo.appleArr=this.data.dropInfo.appleArr.filter(appleInfo=>{
                  const isFall=appleInfo.bottom>0
                  if(!isFall){
                      app.data.mvoice.playSync("/voices/no2.mp3")
                  }
                  return isFall
              }).map(appleInfo=>{
                  appleInfo.bottom-=(0.6+(this.data.dropInfo.speed/15))
                  return appleInfo
              })
              this.setData(this.data)
          },500)
          this.setData(this.data)
      } catch (e) {
          app.data.mlog.err(e)
      }
    },
    checkInput(e){
        try{
            //save input
            this.data.dInputInfo.inputStr=e.detail.value
            this.setData(this.data)
            //check input
            const fIndex=this.data.dropInfo.appleArr.findIndex(appleInfo=>appleInfo.skey==e.detail.value)
            if(fIndex>=0){
                //play voice
                const skcode=app.enUnicode(this.data.dropInfo.appleArr[fIndex].skey)
                const voicePath=app.data.mdb.getMediaPathByMType(skcode,SETTINGS.learnvoice,INFOS[skcode][SETTINGS.learnvoice])
                if(voicePath!=null){
                    app.data.mvoice.playSync(voicePath)
                }
                //speed+=1
                this.data.dropInfo.speed+=1
                //remove drop
                this.data.dropInfo.appleArr.splice(fIndex,1)
                this.data.dInputInfo.inputStr=""
                this.setData(this.data)
            }
        }catch (e1) {
            app.data.mlog.err(e1)
        }
    }
})
