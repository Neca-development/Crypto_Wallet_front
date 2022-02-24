module.exports = {
  presets: ["@vue/cli-plugin-babel/preset"],
  
};
module.exports = function override(config, env) {
  config.resolve.plugins = config.resolve.plugins.filter((plugin) => !(plugin instanceof ModuleScopePlugin));
  config.module.rules.push({
    test: /\.js$/,
    loader: require.resolve('@open-wc/webpack-import-meta-loader'),
  })

  return config;
};
