if (process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "staging") {
  module.exports = require("./keys-env");
} else {
  module.exports = require("./keys-dev");
}
