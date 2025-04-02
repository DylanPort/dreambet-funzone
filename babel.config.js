
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: 'defaults',
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }],
    '@babel/preset-typescript'
  ]
};
