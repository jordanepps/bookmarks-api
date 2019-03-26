require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');

const app = express();

const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(cors());
app.use(helmet());

app.get('/bookmarks', (req, res, next) => {
	const knexInstance = req.app.get('db');
	ArticlesService.getAllArticles(knexInstance)
		.then(bookmarks => {
			res.json(articles);
		})
		.catch(next);
});

app.get('/bookmarks/:bookmark_id', (req, res, next) => {
	const knexInstance = req.app.get('db');
	ArticlesService.getById(knexInstance, req.params.bookmark_id)
		.then(bookmark => {
			if (!bookmark) {
				return res.status(404).json({
					error: { message: `Bookmark doesn't exist` }
				});
			}
			res.json(article);
		})
		.catch(next);
});

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
