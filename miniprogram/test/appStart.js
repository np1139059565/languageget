//
// class WxAPP {
//     constructor (options) {
//         this.data = options.data || {}
//         Object.keys(options).map(key => {
//             if (key !== 'data') {
//                 this[key] = options[key]
//             }
//         })
//     }
//     setData (newData, cb) {
//         setTimeout(() => {
//             Object.assign(this.data, newData)
//             cb && cb()
//         })
//     }
// }
//
// function App (options) {
//     global._wx.app = new WxAPP(options)
// }
//
// global._wx = {
//     app: null,
// }
// global.App = App
