
const app = global._wx.app
console.info(app)
test('app.js test', () => {
  expect(app.enUnicode("a")).toBe("97");
});
