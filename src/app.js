require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');

const bookmarkRouter = require('./bookmarks/bookmarks-router');

const app = express();

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(cors());
app.use(helmet());

app.use(function validateBearerToken(req, res, next) {
	const apiToken = process.env.API_TOKEN;
	const authToken = req.get('Authorization');

	if (!authToken || authToken.split(' ')[1] !== apiToken) {
		logger.error(`Unauthorized request to path : ${req.path}`);
		return res.status(401).json({ error: 'Unauthorized request' });
	}

	next();
});

app.use('/api/bookmark', bookmarkRouter);

app.get('/', (req, res) => {
	res.send('Hello, boilerplate!');
});

app.use(function errorHandler(error, req, res, next) {
	let response =
		NODE_ENV === 'production'
			? { error: { message: 'server error' } }
			: { message: error.message, error };
	res.status(500).json(response);
});

module.exports = app;
