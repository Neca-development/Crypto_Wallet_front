const UglifyEsPlugin = require('uglify-es-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");


module.exports = {
    publicPath: "/",
    configureWebpack: {
        optimization: {
            minimizer: [
                new UglifyEsPlugin({
                    mangle: {
                        reserved: [
                            'Buffer',
                            'BigInteger',
                            'Point',
                            'ECPubKey',
                            'ECKey',
                            'sha512_asm',
                            'asm',
                            'ECPair',
                            'HDNode'
                        ]
                    }
                })
            ],
        },
    }
}
