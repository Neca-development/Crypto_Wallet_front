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
                use: "babel-loader",
            },
        ],
    },
    resolve: {
        fallback: {
            assert: false,
            crypto: false,
            http: false,
            https: false,
            os: false,
            stream: false,
        },
    },
    mode: "production",
}