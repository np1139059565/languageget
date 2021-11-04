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
global.Page = Page
global.getApp = () => global._wx.app