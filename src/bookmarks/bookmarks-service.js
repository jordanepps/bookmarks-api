const BookmarkService = {
	getAllBookmarks(knex) {
		return knex('bookmark_links').select('*');
	},
	getById(knex, id) {
		return knex('bookmark_links')
			.select('*')
			.where({ id })
			.first();
	},
	insertBookmark(knex, newLink) {
		return knex('bookmark_links')
			.insert(newLink)
			.returning('*')
			.then(rows => {
				return rows[0];
			});
	},
	updateBookmark(knex, id, newLinksFields) {
		return knex('bookmark_links')
			.where({ id })
			.update(newLinksFields);
	},
	deleteBookmark(knex, id) {
		return knex('bookmark_links')
			.where({ id })
			.delete();
	}
};

module.exports = BookmarkService;
