const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmark Endpoints', function() {
	let db;

	before('make knex instnace', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DB_URL
		});
		app.set('db', db);
	});

	after('disconnect from db', () => db.destroy());

	before('clean the table', () => db('bookmark_links').truncate());

	afterEach('cleanup', () => db('bookmark_links').truncate());

	describe(`GET /bookmarks`, () => {
		context('Given no bookmark', () => {
			it('responds with 200 and an empty list', () => {
				return supertest(app)
					.get('/bookmarks')
					.expect(200, []);
			});
		});

		context('Given there are bookmarks in the database', () => {
			const testBookmarks = makeBookmarksArray();

			beforeEach('insert bookmark', () => {
				return db.into('bookmark_links').insert(testBookmarks);
			});

			it('responds with 200 and all of the bookmarks', () => {
				return supertest(app)
					.get('/bookmarks')
					.expect(200, testBookmarks);
			});
		});
	});

	describe(`GET /bookmarks/:article_id`, () => {
		context('Given no bookmarks', () => {
			it('responds with 404', () => {
				const bookmarkId = 123456;
				return supertest(app)
					.get(`/bookmarks/${bookmarkId}`)
					.expect(404, { error: { message: `Bookmark doesn't exist` } });
			});
		});

		context('Given there are bookmarks in the database', () => {
			const testBookmarks = makeBookmarksArray();

			beforeEach('insert bookmarks', () => {
				return db.into('bookmark_links').insert(testBookmarks);
			});

			it('responds with 200 and the specified article', () => {
				const bookmarkId = 2;
				const expectedArticle = testBookmarks[bookmarkId - 1];
				return supertest(app)
					.get(`/bookmarks/${bookmarkId}`)
					.expect(200, expectedArticle);
			});
		});
	});

	describe.only('POST /bookmarks', () => {
		it('creates a bookmark, responding with 201 and the new bookmark', function() {
			const newBookmark = {
				title: 'Test new bookmark',
				url: 'test.com',
				description: 'test new bookmark description...',
				rating: '5'
			};
			return supertest(app)
				.post('/bookmarks')
				.send(newBookmark)
				.expect(201)
				.expect(res => {
					expect(res.body.title).to.eql(newBookmark.title);
					expect(res.body.style).to.eql(newBookmark.style);
					expect(res.body.content).to.eql(newBookmark.content);
					expect(res.body).to.have.property('id');
					expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
				})
				.then(postRes => supertest(app).get(`/articles/${postRes.body.id}`))
				.expect(postRes.body);
		});

		const requiredFields = ['title', 'url', 'description', 'rating'];

		requiredFields.forEach(field => {
			const newBookmark = {
				title: 'Test new bookmark',
				url: 'test.com',
				description: 'test new bookmark description...',
				rating: '5'
			};
			it(`responds with 400 and an error message when the '${field} is missing`, () => {
				delete newBookmark[field];
				return supertest(app)
					.post('/bookmarks')
					.send(newBookmark)
					.expect(400, {
						error: { message: `Missing '${field}' in request body` }
					});
			});
		});
	});
});
