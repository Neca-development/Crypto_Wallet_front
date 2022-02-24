const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');

// module.exports = {
//   assumptions: {
//     noDocumentAll: false,
//     pureGetters: true,
//     iterableIsArray: true
//   },
// }

const { addBabelPlugins, override, disableEsLint, addExternalBabelPlugins, addWebpackModuleRule, addBabelPlugin,
  addBabelPresets
} = require("customize-cra");
// module.exports = override(
//   ...addBabelPlugins(
//     "@babel/plugin-proposal-private-property-in-object"
//     /* Add plug-in names here (separate each value by a comma) */
//   )
// );
const addHandleBarsLoader = config => {
  // add handlebars-loader so that handlebars templates in
  // webpack-dev-server's served html files are parsed
  // (specifically the meta tags)
  config.module.rules.push({test: /\.js$/, loader: require.resolve('@open-wc/webpack-import-meta-loader')});
  console.log(config.resolve.plugins)
  config.resolve.plugins = config.resolve.plugins.filter((plugin) => !(plugin instanceof ModuleScopePlugin));
  return config
}
module.exports = override(
  addHandleBarsLoader,
  ...addBabelPresets("@babel/preset-env"),
  ...addBabelPlugins("@babel/plugin-proposal-private-methods",
    "@babel/plugin-proposal-class-properties", "@babel/plugin-proposal-private-property-in-object"),
  ...addExternalBabelPlugins("@babel/plugin-proposal-private-methods",
  "@babel/plugin-proposal-class-properties", "@babel/plugin-proposal-private-property-in-object" )
)
// module.exports = function override(config, env) {

//
//    // config.module.plugins.push(require("@babel/plugin-proposal-class-properties"))
//   // require("@babel/core").transformSync("code", {
//   //   plugins: ["@babel/plugin-proposal-private-property-in-object"],
//   // });
//   // config.resolve.plugins.makePlugins(require("@babel/plugin-proposal-class-properties"))
//   config.module.rules.push({
//     test: /\.js$/,
//     loader: require.resolve('@open-wc/webpack-import-meta-loader'),
//   })
//   console.log(config)
//   return config;
// };
