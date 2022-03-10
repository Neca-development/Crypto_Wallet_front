const path = require("path")

module.exports = {

    entry: path.resolve(__dirname, "lib/main.js"),
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "index_bundle.js",
        library: "$",
        libraryTarget: "umd",
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: "babel-loader",
            },
        ],
    },
    resolve: {
        fallback: {
            assert: require.resolve('assert'),
            crypto: require.resolve('crypto-browserify'),
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            os: require.resolve('os-browserify/browser'),
            stream: require.resolve('stream-browserify'),
        },
    },
    mode: "development",
}