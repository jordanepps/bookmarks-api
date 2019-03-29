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
					.get('/api/bookmark')
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
					.get('/api/bookmark')
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(200, testBookmarks);
			});
		});
	});

	describe(`GET /api/bookmark/:bookmark_id`, () => {
		context('Given no bookmarks', () => {
			it('responds with 404', () => {
				const bookmarkId = 123456;
				return supertest(app)
					.get(`/api/bookmark/${bookmarkId}`)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(404, { error: { message: `Bookmark doesn't exist` } });
			});
		});

		context('Given there are bookmarks in the database', () => {
			const testBookmarks = makeBookmarksArray();

			beforeEach('insert bookmarks', () => {
				return db.into('bookmark_links').insert(testBookmarks);
			});

			it('responds with 200 and the specified bookmark', () => {
				const bookmarkId = 3;
				const expectedBookmark = testBookmarks[bookmarkId - 1];

				return supertest(app)
					.get(`/api/bookmark/${bookmarkId}`)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(200, expectedBookmark);
			});
		});
	});

	describe('POST /api/bookmark', () => {
		it('creates a bookmark, responding with 201 and the new bookmark', () => {
			const newBookmark = {
				title: 'Test new bookmark',
				url: 'test.com',
				description: 'test new bookmark description...',
				rating: '5'
			};
			return supertest(app)
				.post('/api/bookmark')
				.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
				.send(newBookmark)
				.expect(201)
				.expect(res => {
					expect(res.body.title).to.eql(newBookmark.title);
					expect(res.body.style).to.eql(newBookmark.style);
					expect(res.body.content).to.eql(newBookmark.content);
					expect(res.body).to.have.property('id');
					expect(res.headers.location).to.eql(`/api/bookmark/${res.body.id}`);
				});
		});

		const requiredFields = ['title', 'url', 'description', 'rating'];

		requiredFields.forEach(field => {
			const newBookmark = {
				title: 'Test new bookmark',
				url: 'test.com',
				description: 'test new bookmark description...',
				rating: '5'
			};
			it(`responds with 400 and an error message when the '${field}' is missing`, () => {
				delete newBookmark[field];
				return supertest(app)
					.post('/api/bookmark')
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.send(newBookmark)
					.expect(400, {
						error: { message: `Missing '${field}' in request body` }
					});
			});
		});
	});

	describe('PATCH /api/bookmark/:bookmark_id', () => {
		context('Given no bookmarks', () => {
			it('responds with 404', () => {
				const bookmarkId = 123456;
				return supertest(app)
					.patch(`/api/bookmark/${bookmarkId}`)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.expect(404, { error: { message: `Bookmark doesn't exist` } });
			});
		});

		context('Given there are bookmarks', () => {
			const testBookmarks = makeBookmarksArray();

			beforeEach('insert bookmarks', () => {
				return db.into('bookmark_links').insert(testBookmarks);
			});

			it('responds with 204 and updates bookmark', () => {
				const idToUpdate = 2;
				const updateBookmark = {
					title: 'updated title',
					url: 'updated url',
					description: 'updated description',
					rating: 'updated rating'
				};

				const expectedBookmark = {
					...testBookmarks[idToUpdate - 1],
					...updateBookmark
				};

				return supertest(app)
					.patch(`/api/bookmark/${idToUpdate}`)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.send(updateBookmark)
					.expect(204)
					.then(res => {
						supertest(app)
							.get(`/api/bookmark/${idToUpdate}`)
							.expect(expectedBookmark);
					});
			});

			it('responds with 400 when no required fields are supplied', () => {
				const idToUpdate = 2;

				return supertest(app)
					.patch(`/api/bookmark/${idToUpdate}`)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.send({ requiredField: 'not supplied' })
					.expect(400, {
						error: {
							message: `Request must contain 'title', 'url', 'description', or 'rating'`
						}
					});
			});

			it('responds with 204 when updating only a subset of feilds', () => {
				const idToUpdate = 2;
				const updateBookmark = { title: 'updated title only' };

				const expectedBookmark = {
					...testBookmarks[idToUpdate - 1],
					...updateBookmark
				};

				return supertest(app)
					.patch(`/api/bookmark/${idToUpdate}`)
					.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
					.send({
						...updateBookmark,
						fieldToIgnore: 'Should be ignored COMPLETELY'
					})
					.expect(204)
					.then(res => {
						supertest(app)
							.get(`/api/bookmark/${idToUpdate}`)
							.set('Authorization', `Bearer ${process.env.API_TOKEN}`)
							.expect(expectedBookmark);
					});
			});
		});
	});
});
