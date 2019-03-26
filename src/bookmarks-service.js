const ArticlesService = {
	getAllArticles(knex) {
		return knex('bookmark_links').select('*');
	},
	getById(knex, id) {
		return knex('bookmark_links')
			.select('*')
			.where({ id })
			.first();
	},
	insertArticle(knex, newLink) {
		return knex('bookmark_links')
			.insert(newLink)
			.returning('*')
			.then(rows => {
				return rows[0];
			});
	},
	updateArticle(knex, id, newLinksFields) {
		return knex('bookmark_links')
			.where({ id })
			.update(newLinksFields);
	},
	deleteArticle(knex, id) {
		return knex('bookmark_links')
			.where({ id })
			.delete();
	}
};

module.exports = ArticlesService;
