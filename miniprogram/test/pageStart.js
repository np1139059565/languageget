
class WxPage {
    constructor (options) {
        this.data = options.data || {}
        Object.keys(options).map(key=> {
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
class WXApp{
    constructor (options) {
        this.data = options.data || {}
        Object.keys(options).map(key=> {
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

function App(options){
    global._wx.app = new WXApp(options)
}
function getApp(){
    return require("../app.js")
}
function Page (options) {
    global._wx.page = new WxPage(options)
}


global._wx = {
    app: null,
    page: null
}
global.Page = Page
// global.App = App
global.getApp = getApp//() => global._wx.app