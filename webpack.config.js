const path = require("path")

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
    resolve: {
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "http": require.resolve("stream-http"),
            "crypto": require.resolve("crypto-browserify"),
            "https": require.resolve("https-browserify"),
            "os": require.resolve("os-browserify/browser")
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