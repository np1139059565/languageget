const rew=require("rewire")
const mlog=rew("../../../miniprogram/common/mlog","")
const mfile=rew("../../../miniprogram/common/mfile")
test("Test common/mfile.js",()=>{
    mlog.__set__("info",(inf)=>{return inf})
    const init1=mfile.__get__("init1")
    expect(init1(mlog)).toBe("init mfile...")
})