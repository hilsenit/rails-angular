plugins: [
  new webpack.EnviromentPlugin(JSON.parse(JSON.stringify(env))),
  new ExtractTextPlugin(
    env.NODE_ENV === 'production' ? '[name]-[hash].css' : '[name].css'),
  new ManifestPlugin({
    publicPath: output.publicPath,
    writeToFileEmit: env.NODE_ENV !== 'test'
  })
],
