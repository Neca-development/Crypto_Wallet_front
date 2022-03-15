const path = require("path");
const webpack = require('webpack');

module.exports = {
    entry: path.resolve(__dirname, "lib/main.js"),
    output: {
        path: path.resolve(__dirname, "bundle"),
        library: {
            type: "umd",
            name: "cw-lib",
        },
        filename: "cw-lib.bundle.js",
        libraryTarget: "umd",
    },
    plugins: [
        // Work around for Buffer is undefined:
        // https://github.com/webpack/changelog-v5/issues/10
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    resolve: {
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "http": require.resolve("stream-http"),
            "crypto": require.resolve("crypto-browserify"),
            "https": require.resolve("https-browserify"),
            "os": require.resolve("os-browserify/browser"),
            "buffer": require.resolve("buffer")
        },
    },
    mode: "production",

}



// module.exports = {

//     entry: path.resolve(__dirname, "test/index.js"),
//     output: {
//         library: {
//             type: "umd",
//             name: "sdk",
//         },
//         filename: "sdk.js",
//     },
//     resolve: {
//         fallback: {
//             "stream": require.resolve("stream-browserify")
//         },
//     },
// };