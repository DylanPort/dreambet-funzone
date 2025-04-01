
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { 
        browsers: [
          'last 2 versions',
          '> 1%',
          'not dead'
        ]
      }
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }],
    '@babel/preset-typescript'
  ]
};
