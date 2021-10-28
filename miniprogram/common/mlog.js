var err = function (e1, e2, e3, e4) {
    console.error("default mlog", getMsg(e1), getMsg(e2), getMsg(e3), getMsg(e4))
}
var info = function (i1,i2,i3,i4) {
    console.info("default mlog", getMsg(i1), getMsg(i2), getMsg(i3), getMsg(i4))
}

function getMsg(e) {
    try {
        if (e == null) {
            return ""
        } else if (e instanceof TypeError||e.stack!=null) {
            return e.stack
        } else if (e instanceof Error||e.errMsg!=null||e.message!=null) {//yun err
            return e.errMsg||e.message
        }else {
            return e
        }
    } catch (e1) {
        console.error("getMsg is err",e1)
    }
}

// ------------------open event----------------------
module.exports.init1 = (info1, err1) => {
    try {
        if (info1 != null) {
            info = function (i1,i2,i3,i4) {
                console.info("used mlog",getMsg(i1), getMsg(i2), getMsg(i3), getMsg(i4))
                info1()
            }
        }
        if (err1 != null) {
            err = function (e1,e2,e3,e4){
                console.error("used mlog",getMsg(e1), getMsg(e2), getMsg(e3), getMsg(e4))
                err1(getMsg(e1), getMsg(e2), getMsg(e3), getMsg(e4))
            }
        }
        info("init log...")
    } catch (e) {
        err(e)
    }
}
module.exports.info = function(i1,i2,i3,i4){
    info(i1,i2,i3,i4)
}
module.exports.err = function(e1, e2, e3, e4) {
    err(e1, e2, e3, e4)
}