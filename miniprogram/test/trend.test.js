require("../app")
require("../pages/file/index")
const trend = global._wx.page
test('app.js test', () => {
  expect(trend.t("a")).toBe("97");
});
