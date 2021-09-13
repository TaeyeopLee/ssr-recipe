const nodeExternals = require('webpack-node-externals');
const paths = require('./paths.js');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const webpack = require('webpack');
const getClientenvironment = require('./env');

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/

const env = getClientenvironment(paths.publicUrlOrPath.slice(0, -1));

module.exports = {
  mode: 'production',// 프로덕션 모드로 최적화 옵션 활성화
  entry: paths.ssrIndexjs,// 인덱스경로
  target: 'node',
  output: {
    path: paths.ssrBuild,
    filename: 'server.js',
    chunkFilename: 'js/[name].chunk.js',// 청크파일 이름
    publicPath: paths.publicUrlOrPath, // 정적 파일이 제공될 경로

  },
  module: {
    rules: [
      {
        oneOf:[
          // 자바스크립트를 위한 처리
          // 기존 webpack.config.js를 참고하여 작성
          {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: paths.appSrc,
            loader: require.resolve('babel-loader'),
            options: {
              customize: require.resolve(
                'babel-preset-react-app/webpack-overrides'
              ),
              presets: [
                [
                  require.resolve('babel-preset-react-app'),
                  {
                    runtime: 'automatic'
                  },
                ],
              ],
              plugins: [
                [
                  require.resolve('babel-plugin-named-asset-import'),
                  {
                    loaderMap: {
                      svg: {
                        ReactComponent:
                          '@svgr/webpack?-svgo,+titlePropt,+ref![path]'
                      }
                    },
                  },
                ],
              ],
              cacheDirectory: true,
              cacheCompression: false,
              compact: false,
            },
          },
          //css위한 처리
          {
            test: cssRegex,
            exclude: cssModuleRegex,
            // exportOnlyLocals: true 옵션을 설정해야 실제 css 파일을 생성하지 않습니다.
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
              modules: {
                exportOnlyLocals: true,
              }
            }
          },
          // css모듈을 위한 처리
          {
            test: cssModuleRegex,
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
              modules: {
                exportOnlyLocals: true,
                getLocalIdent: getCSSModuleLocalIdent,
              }
            }
          },
          // sass를 위한 처리
          {
            test: sassRegex,
            exclude: sassModuleRegex,
            use: [
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 3,
                  modules: {
                    exportOnlyLocals: true,
                  }
                }
              },
              require.resolve('sass-loader')
            ]
          },
          //sass + css module을 위한 처리
          {
            test: sassRegex,
            exclude: sassModuleRegex,
            use: [
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 3,
                  modules: {
                    exportOnlyLocals: true,
                    getLocalIdent: getCSSModuleLocalIdent,
                  }
                }
              },
              require.resolve('sass-loader'),
            ],
          },
          // url-loader를 위한 설정
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              emitFile: false, // 파일을 따로 저장하지 않는 옵션
              limit: 10000, // 원래 9.67KB가 넘어가면 파일로 저장하는데 emitFile이 false일때는 경로만 준비하고 저장안함
              name: 'static/media/[name][hash:8].[ext]',
            },
          },
          // 위에서 설정한 확장자를 제외하는 파일들은 
          // file-loader 를 사용합니다.
          {
            loader: require.resolve('file-loader'),
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
              emitFile: false,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      }
    ]
  },
  resolve: {
    modules: ['node_modules']
  },
  externals: [nodeExternals({
    allowlist: [/@babel/],
  })]
}