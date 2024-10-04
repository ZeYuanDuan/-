module.exports = {
  generateOptionId: function (context, events, done) {
    context.vars.optionId = Math.random() < 0.5 ? "68" : "69";
    return done();
  },
};
