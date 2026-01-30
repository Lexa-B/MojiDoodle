module.exports = (config) => {
  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: false,
    crypto: false
  };
  return config;
};
