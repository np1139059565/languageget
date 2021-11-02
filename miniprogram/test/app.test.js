
require("../common/mlog.js"),
require("../common/mfile.js"),
require("../common/myun.js"),
require("../common/mdb.js"),
require("../common/mvoice.js")
require('../app.js');
const app = global._wx.app
test('app.js test', () => {
  expect(app.enUnicode("a")).toBe("97");
});
