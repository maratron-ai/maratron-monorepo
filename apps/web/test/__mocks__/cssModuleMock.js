// Mock CSS modules for Jest tests
module.exports = new Proxy({}, {
  get: function getter(target, key) {
    if (key === '__esModule') {
      // We need to return a truthy value here to indicate that this is an ES module
      return true;
    }
    // Return the key as the value for CSS class names
    return key;
  },
});