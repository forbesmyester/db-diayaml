var q = {
    plugins: ['require-parts-babel']
};
module.exports = {
    entry: __dirname + "/web.js",
    module: {
        loaders: [
            {
                test: /\.js/,
                loader: "babel-loader",
                query: q
            }
        ]
    },
    lazy: true,
    output: {
        filename: "web.bin.js",
    },
    devtool: "inline-source-map"
};



