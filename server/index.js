process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.HTTP_PORT = process.env.HTTP_PORT || 3000;

const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const { resolve } = require('path');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const compression = require('compression');


const logger = require('./logger');

const app = express();


function onUnhandledError(err) {
    try {
        logger.error(err);
    } catch (e) {
        console.log('LOGGER ERROR:', e); //eslint-disable-line no-console
        console.log('APPLICATION ERROR:', err); //eslint-disable-line no-console
    }
    process.exit(1);
}

process.on('unhandledRejection', onUnhandledError);
process.on('uncaughtException', onUnhandledError);


var isDevelopment = process.env.NODE_ENV === 'development';
if (isDevelopment) {
    const webpackConfig = require('../webpack.config.dev');
    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler, { logger, publicPath: webpackConfig.output.publicPath, stats: { colors: true } }));
    app.use(webpackHotMiddleware(compiler));
    // all other requests be handled by UI itself
    app.get('*', (req, res) => res.sendFile(resolve(__dirname, 'build-dev', '..', '..', 'client', 'index.html')));
} else {
    const clientBuildPath = resolve(__dirname, '..', '..', 'client');
    app.use(compression());
    app.use('/', express.static(clientBuildPath));

    // all other requests be handled by UI itself
    app.get('*', (req, res) => res.sendFile(resolve(clientBuildPath, 'index.html')));

}

// require('./middlewares/development') : require('./middlewares/production');


app.set('env', process.env.NODE_ENV);
logger.info(`Application env: ${process.env.NODE_ENV}`);

app.use(logger.expressMiddleware);
app.use(bodyParser.json());


http.createServer(app).listen(process.env.HTTP_PORT, () => {
    logger.info(`HTTP server is now running on http://localhost:${process.env.HTTP_PORT}`);
});