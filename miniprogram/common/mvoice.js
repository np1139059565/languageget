
var log = null,
    VOICE_CALLBACK,_CIAC=null,
    _APLUGIN=null,
    _VRRM=null,VRRM_CALLBACK//add app.json


function info(inf1, inf2, inf3) {
    try {
        if (log == null) {
            console.info("mvoice",inf1, inf2, inf3)
        } else log.info("mvoice",inf1, inf2, inf3)
    } catch (e) {
        console.error(e)
    }
}

function err(e1, e2, e3) {
    try {
        if (log == null) {
            console.error("mvoice",e1, e2, e3)
        } else log.err("mvoice",e1, e2, e3)
    } catch (e) {
        console.error(e)
    }
}

/**
 *
 * @param voicePath
 */
function playSync(voicePath,callback1){
    try {
        VOICE_CALLBACK=callback1
        if (_CIAC!=null) {
            _CIAC.stop()
            _CIAC.src = voicePath
            _CIAC.play()
        }else{
            err("ciac is not init.")
            callback1(0)
        }
    } catch (e) {
        err(e)
        callback1(0)
    }
}
function downloadVoiceByTTSSync(text, langType, callback,isShowLoading) {
    try{
        if(isShowLoading){
            wx.showLoading({
                title: 'tts...',
                mask: true//防止触摸
            })
        }
        switch (langType) {
            case "en":
                langType = "en_US"
                break;
            default:
                langType = "zh_CN"
        }
        _APLUGIN.textToSpeech({
            lang: langType,
            tts: true,
            content: text,
            success: (res) => {
                //{expired_time: 1604594472
                // filename: "https://ae.weixin.qq.com/cgi-bin/mmasrai-bin/getmedia?filename=1604583675_7bdd6baf1dce5ce32a0627e70a8721a1&filekey=105816812&source=miniapp_plugin"
                // origin: "survey"
                // retcode: 0}
                info("to tts is "+(res.retcode==0),res)
                if (typeof callback == "function") {
                    callback(res.retcode==0, res.filename)
                }
            },
            fail: (res) => {
                //{msg: "please check out language option."
                // retcode: -20001}
                err(res, "to tts is fail.")
                if (typeof callback == "function") {
                    callback(0)
                }
            },
            complete: (a,b) => {
                if(isShowLoading){
                    wx.hideLoading()
                }
            }
        })
    }catch (e){
        if(isShowLoading){
            wx.hideLoading()
        }
        err(e)
        if (typeof callback == "function") {
            callback(0)
        }
    }
}
function startRecordRecognitionSync(callback1){
    try{
        if (_VRRM!=null) {
            _VRRM.stop()
            VRRM_CALLBACK=callback1
            _VRRM.start({duration:30000, lang: "en_US"})
        }else{
            err("vrrm is not init.")
            if(typeof callback1=="function"){
                callback1(0)
            }
        }
    }catch (e){
        err(e)
        callback1(0)
    }
}
function stopRecordRecognitionSync(callback1){
    try{
        if (_VRRM!=null) {
            if(typeof callback1=="function"){
                VRRM_CALLBACK=callback1
            }
            _VRRM.stop()
        }else{
            err("vrrm is not init.")
            if(typeof callback1=="function"){
                callback1(0)
            }
        }
    }catch (e){
        err(e)
        callback1(0)
    }
}
// ------------------open event----------------------
module.exports.init1 = (log1) => {
    try {
        if (log1 != null) {
            log = log1
        }
        info("init mvoice...")
        _CIAC=wx.createInnerAudioContext()
        const voiceCallback=(code)=>{
            if(typeof VOICE_CALLBACK=="function"){
                VOICE_CALLBACK(code)
                VOICE_CALLBACK=null
            }
        }
        //end
        _CIAC.onEnded(()=>{
            info("play voice is end.")
            voiceCallback(1)
        })
        _CIAC.onStop(()=>{
            info("play voice is stop.")
            voiceCallback(2)
        })
        //err
        _CIAC.onError((res) => {
            err(res, "player voice is fail.")
            voiceCallback(0)
        })
        //tts
        _APLUGIN = requirePlugin("WechatSI")
        //voice record recognition
        _VRRM=_APLUGIN.getRecordRecognitionManager()
        const recordCallback=(code,res)=>{
            if(typeof VRRM_CALLBACK=="function"){
                VRRM_CALLBACK(code,res)
                VRRM_CALLBACK=null
            }
        }
        _VRRM.onRecognize = (res)=> {
            info("current result", res)
        }
        _VRRM.onStop = (res) =>{
            info("record file path", res)
            recordCallback(1,res)
        }
        _VRRM.onStart = (res)=> {
            info("成功开始录音识别", res)
        }
        _VRRM.onError = (res)=> {
            info("error msg", res)
            recordCallback(0,res)
        }
    } catch (e) {
        err(e)
    }
}
module.exports.playSync=playSync
module.exports.downloadVoiceByTTSSync=downloadVoiceByTTSSync
module.exports.startRecordRecognitionSync=startRecordRecognitionSync
module.exports.stopRecordRecognitionSync=stopRecordRecognitionSync