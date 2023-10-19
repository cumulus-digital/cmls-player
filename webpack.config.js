const path = require('path');
const fs = require('fs');

const browserslist = require('browserslist');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env) => {
	const isProduction = env.NODE_ENV === 'production';
	const mode = isProduction ? 'production' : 'development';
	const host = env.HOST || 'localhost';
	const port = 34687;

	const cssLoaders = [
		{
			loader: 'css-loader',
			options: {
				sourceMap: !isProduction,
			},
		},
		{
			loader: 'postcss-loader',
			options: {
				sourceMap: !isProduction,
				postcssOptions: {
					plugins: [
						'postcss-preset-env',
						{
							autoprefixer: { grid: true },
						},
						//isProduction && require('cssnano'),
					],
				},
			},
		},
		{
			loader: 'sass-loader',
			options: {
				sourceMap: !isProduction,
			},
		},
	];

	let target = 'browserslist';
	if (!browserslist.findConfig('.')) {
		target += ':' + './browserslistrc';
	}

	return {
		mode,
		target,
		entry: {
			bundle: './src/index.js',
		},
		output: {
			filename: '[name].js',
			path: path.resolve(__dirname, 'dist'),
		},
		resolve: {
			alias: {
				react: 'preact/compat',
				'react-dom': 'preact/compat',
				'react/jsx-runtime': 'preact/jsx-runtime',

				'@': path.resolve(__dirname, 'src'),
				Config: path.resolve(__dirname, 'src/config.json'),
				Consts: path.resolve(__dirname, 'src/consts.js'),
				Utils: path.resolve(__dirname, 'src/utils'),
				Store: path.resolve(__dirname, 'src/store'),
				Generics: path.resolve(__dirname, 'src/generics'),
			},
			extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '...'],
		},
		optimization: {
			minimize: isProduction,
			minimizer: [
				new TerserPlugin({
					extractComments: false,
					terserOptions: {
						sourceMap: !isProduction,
					},
				}),
			],
		},
		stats: {
			optimizationBailout: true,
		},
		module: {
			rules: [
				{
					test: /\.(j|t)sx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							sourceMap: !isProduction,
							presets: [
								'@babel/preset-react',
								[
									'@babel/preset-env',
									{
										debug: true,
										modules: false,
										useBuiltIns: 'usage',
										corejs: require('core-js/package.json')
											.version,
									},
								],
							],
							plugins: [
								['@babel/plugin-transform-runtime'],
								[
									'@babel/plugin-transform-react-jsx',
									{
										pragma: 'h',
										pragmaFrag: 'Fragment',
									},
								],
							],
						},
					},
				},
				{
					oneOf: [
						// Handle dynamic style injection
						{
							test: /.(c|sc|sa)ss$/,
							resourceQuery: /inline/,
							use: [
								{
									loader: 'style-loader',
									options: {
										injectType: 'lazyAutoStyleTag',
										insert: (element, options) => {
											const target =
												options && options.target
													? options.target
													: document.head;
											target.appendChild(element);
										},
									},
								},
								...cssLoaders,
							],
						},
						// Any other style compilation
						{
							test: /\.(c|sc|sa)ss$/,
							use: [
								{
									loader: MiniCssExtractPlugin.loader,
								},
								...cssLoaders,
							],
						},
					],
				},
				{
					oneOf: [
						{
							test: /\.svg$/,
							type: 'asset/inline',
							resourceQuery: /inline/,
						},
						{
							test: /\.svg$/,
							type: 'asset/source',
							resourceQuery: /source/,
						},
						{
							test: /\.svg$/,
							type: 'asset/resource',
						},
					],
				},
			],
		},
		plugins: [
			new CleanWebpackPlugin(),
			new MiniCssExtractPlugin({
				filename: '[name].css',
				chunkFilename: (pathData) => '[name].css',
			}),
		],

		devtool: isProduction ? false : 'source-map',
		devServer: {
			static: './',
			host,
			port,
			allowedHosts: 'all',
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods':
					'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Headers':
					'X-Requested-With, content-type, Authorization',
			},
		},
	};
};
