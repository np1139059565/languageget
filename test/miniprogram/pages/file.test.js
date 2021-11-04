require("../../../miniprogram/pages/file/index")
const page=global._wx.page
test("Test file/index.js",()=>{
    expect(page.onLoad("aa")).toBe("aa")
})