module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: [
          '>0.25%',
          'not ie 11',
          'not op_mini all'
        ],
        node: 'current'
      },
      modules: process.env.BABEL_ENV === 'node' ? 'commonjs' : false
    }]
  ],
  plugins: [
    process.env.BABEL_ENV === 'node' ? '@babel/plugin-transform-modules-commonjs' : null
  ].filter(Boolean)
};
