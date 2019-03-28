const express = require('express');
const xss = require('xss');
const BookmarkService = require('./bookmarks-service');

const bookmarkRouter = express.Router();
const jsonParser = express.json();

const serializeBookmark = bookmark => ({
	id: bookmark.id,
	title: xss(bookmark.title),
	url: bookmark.url,
	description: xss(bookmark.description),
	ratiing: bookmark.rating
});

bookmarkRouter
	.route('/')
	.get((req, res, next) => {
		BookmarkService.getAllBookmarks(req.app.get('db'))
			.then(bookmarks => {
				res.json(bookmarks);
			})
			.catch(next);
	})
	.post(jsonParser, (req, res, next) => {
		const { title, url, description, rating } = req.body;
		const newBookmark = { title, url, description, rating };

		for (const [key, value] of Object.entries(newBookmark)) {
			if (value == null) {
				return res
					.status(400)
					.json({ error: { message: `Missing '${key}' in request body` } });
			}
		}

		BookmarkService.insertBookmark(req.app.get('db'), newBookmark)
			.then(bookmark =>
				res
					.status(201)
					.location(`/bookmark/${bookmark.id}`)
					.json(bookmark)
			)
			.catch(next);
	});

bookmarkRouter
	.route('/:bookmark_id')
	.all((req, res, next) => {
		BookmarkService.getById(req.app.get('db'), req.params.bookmark_id)
			.then(bookmark => {
				if (!bookmark) {
					return res
						.status(404)
						.json({ error: { message: `Bookmark doesn't exist` } });
				}
				res.bookmark = bookmark;
				next();
			})
			.catch(next);
	})
	.get((req, res, next) => {
		res.json(serializeBookmark(res.bookmark));
	})
	.delete((req, res, next) => {
		BookmarkService.deleteBookmark(req.app.get('db'), req.params.bookmark_id)
			.then(() => {
				res.status(204).end();
			})
			.catch(next);
	})
	.patch(jsonParser, (req, res, next) => {
		const { title, url, description, rating } = req.body;
		const updateBookmark = { title, url, description, rating };
		const numberOfValues = Object.values(updateBookmark).filter(Boolean).length;

		if (numberOfValues === 0) {
			return res.status(400).json({
				error: {
					message: `Request must contain 'title', 'url', 'description', or 'rating'`
				}
			});
		}

		BookmarkService.updateBookmark(
			req.app.get('db'),
			req.params.bookmark_id,
			updateBookmark
		)
			.then(numRowsAffected => {
				res.status(204).end();
			})
			.catch(next);
	});

module.exports = bookmarkRouter;
