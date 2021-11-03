
const app = global._wx.app
console.info(app)
test('app.js test1', () => {
  expect(app.enUnicode("a")).toBe("97");
});
