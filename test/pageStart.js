class WxApp {
    constructor (options) {
        this.data = options.data || {}
        Object.keys(options).map( key => {
            if (key !== 'data') {
                this[key] = options[key]
            }
        })
        this.data.rootPath="../miniprogram/"
        this.onLaunch()
    }

    setData (newData, cb) {
        setTimeout(() => {
            Object.assign(this.data, newData)
            cb && cb()
        })
    }
}
function getApp(){
    if(global._wx.app==null){
        require("../miniprogram/app")
    }
    return global._wx.app
}
function App(options){
    global._wx.app=new WxApp(options)
}

class WxPage {
    constructor (options) {
        this.data = options.data || {}
        Object.keys(options).map( key => {
            if (key !== 'data') {
                this[key] = options[key]
            }
        })
    }

    setData (newData, cb) {
        setTimeout(() => {
            Object.assign(this.data, newData)
            cb && cb()
        })
    }
}
function Page (options) {
    global._wx.page = new WxPage(options)
}

global._wx = {
    app: null,
    page: null
}
global.App = App
global.getApp =  getApp
global.Page = Page
