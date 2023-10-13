const webpack = require('webpack');
const { basename, dirname, resolve } = require('path');
const browserslist = require('browserslist');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const postCSSPlugins = require('@wordpress/postcss-plugins-preset');
const jsonInSassImporter = require('node-sass-json-importer');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

module.exports = (env) => {
	const isProduction = env.NODE_ENV === 'production';
	const mode = isProduction ? 'production' : 'development';
	const fromConfigRoot = (fileName) =>
		path.join(path.dirname(__dirname), 'config', fileName);

	let target = 'browserslist';
	if (!browserslist.findConfig('.')) {
		target += ':' + fromConfigRoot('.browserslistrc');
	}

	// App directory
	const appDirectory = fs.realpathSync(process.cwd());

	// Gets absolute path of file within app directory
	const resolveAppPath = (relativePath) =>
		path.resolve(appDirectory, relativePath);

	const host = process.env.HOST || 'localhost';

	const cssLoaders = [
		{
			loader: require.resolve('css-loader'),
			options: {
				sourceMap: !isProduction,
				modules: {
					auto: true,
				},
			},
		},
		{
			loader: require.resolve('postcss-loader'),
			options: {
				postcssOptions: {
					ident: 'postcss',
					sourceMap: !isProduction,
					plugins: isProduction
						? [
								...postCSSPlugins,
								require('cssnano')({
									preset: [
										'default',
										{
											discardComments: {
												removeAll: true,
											},
										},
									],
								}),
						  ]
						: postCSSPlugins,
				},
			},
		},
		{
			loader: require.resolve('sass-loader'),
			options: {
				sourceMap: !isProduction,
				sassOptions: {
					webpackImporter: true,
					importer: jsonInSassImporter(),
				},
			},
		},
	];

	return {
		mode,
		target: target,
		entry: {
			bundle: './src/index.js',
			//outer: './src/outer.scss',
			//inner: './src/inner.scss',
		},
		output: {
			filename: '[name].js',
			path: resolve(process.cwd(), 'dist'),
		},
		resolve: {
			alias: {
				react: 'preact/compat',
				'react-dom': 'preact/compat',
				'react/jsx-runtime': 'preact/jsx-runtime',
				'lodash-es': 'lodash',
				'@': path.resolve(__dirname, 'src'),
				Config: path.resolve(__dirname, 'src/config.json'),
				Consts: path.resolve(__dirname, 'src/consts.js'),
				Utils: path.resolve(__dirname, 'src/utils'),
				Store: path.resolve(__dirname, 'src/store'),
			},
			extensions: ['.jsx', '.ts', '.tsx', '...'],
		},
		optimization: {
			// Only concatenate modules in production, when not analyzing bundles.
			concatenateModules: isProduction,
			minimize: isProduction,
			minimizer: [
				new TerserPlugin({
					parallel: true,
					terserOptions: {
						compress: {
							passes: 5,
						},
					},
					extractComments: false,
				}),
			],
		},
		module: {
			rules: [
				{
					test: /\.(j|t)sx?$/,
					exclude: /(node_modules|bower_components)/,
					use: {
						loader: 'babel-loader',
						options: {
							babelrc: true,
							configFile: true,
							presets: [
								'@babel/preset-react',
								'@babel/preset-env',
								/*
								[
									'@babel/preset-env',
									{
										loose: true,
										debug: true,
										useBuiltIns: 'usage',
										corejs: require('core-js/package.json')
											.version,
									},
								],
								*/
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
					test: /\.css$/,
					use: cssLoaders,
				},
				{
					oneOf: [
						{
							test: /\.(sc|sa)ss$/,
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
						{
							test: /\.(sc|sa)ss$/,
							use: [
								{
									loader: MiniCSSExtractPlugin.loader,
								},
								...cssLoaders,
							],
						},
					],
				},
				/*
				{
					test: /\.(sc|sa)ss$/,
					use: [
						...cssLoaders,
						{
							loader: require.resolve('sass-loader'),
							options: {
								sourceMap: !isProduction,
								sassOptions: {
									importer: jsonInSassImporter(),
								},
							},
						},
					],
				},
				*/
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
			new CleanWebpackPlugin({
				cleanAfterEveryBuildPatterns: ['!fonts/**', '!images/**'],
				// Prevent it from deleting webpack assets during builds that have
				// multiple configurations returned in the webpack config.
				cleanStaleWebpackAssets: false,
			}),
			new MiniCSSExtractPlugin({
				filename: '[name].css',
				chunkFilename: (pathData) => {
					return '[name].css';
				},
			}),
		],
		devtool: isProduction ? false : 'source-map',
		devServer: {
			// Serve index.html as the base
			static: resolveAppPath('./'),

			// Enable compression
			compress: true,

			// Enable hot reloading
			hot: false,

			host,

			port: 34687,

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
