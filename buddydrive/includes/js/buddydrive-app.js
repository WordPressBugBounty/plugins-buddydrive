/* globals buddydrive, _, Backbone */
window.buddydrive = window.buddydrive || {};

(function (exports, $) {

	/**
	 * Main App
	 * @type {Object}
	 */
	buddydrive.App = {

		start: function () {

			// Add a click handler to intercept links and let Backbone handle them:
			$(document).on('click', 'a[href*="/edit/"], a[href*="/folder/"]', function (e) {
				e.preventDefault();

				const href = $(this).attr('href');
				const path = new URL(href, window.location.origin).pathname;

				// Extract the last two parts of the path: e.g. edit/62
				const root = Backbone.history.options.root || '/';
				const routeFragment = path.replace(root, '').replace(/^\/+/, '');
				Backbone.history.navigate(routeFragment, { trigger: true });
			});

			this.views = new Backbone.Collection();
			this.items = new buddydrive.Collections.Items();
			this.router = new buddydrive.App.Router();
			this.Query = new buddydrive.Models.Query(_.pick(buddydrive.Settings, 'buddydrive_scope'));

			// Check available width
			if (1000 > $('#buddydrive-main').width()) {
				$('#buddydrive-main').addClass('mini');
			}

			if ($('body').hasClass('wp-admin')) {
				Backbone.history.start();
			} else {
				//Backbone.history.start({ pushState: true });
				const path = window.location.pathname;
				const rootMatch = path.match(/^(\/.*?buddydrive\/)/);
				const rootPath = rootMatch ? rootMatch[1] : '/';

				Backbone.history.start({
					pushState: true,
					root: rootPath
				});

				// Force route to run in case of direct page load
				Backbone.history.loadUrl(Backbone.history.fragment);
			}
		},

		listFiles: function () {
			this.cleanScreen();

			// Create the loop view
			var file_list = new buddydrive.Views.Main({ collection: this.items });

			this.views.add({ id: 'files', view: file_list });

			file_list.inject('#buddydrive-main');
		},

		editFile: function (id) {
			this.cleanScreen();

			var file_edit = new buddydrive.Views.EditForm({ model: this.items.get(id), item_id: id, collection: this.items });

			this.views.add({ id: 'edit', view: file_edit });

			file_edit.inject('#buddydrive-main');
		},

		cleanScreen: function () {
			if (!_.isUndefined(this.views.models)) {
				_.each(this.views.models, function (model) {
					model.get('view').remove();
				}, this);

				this.views.reset();
			}
		}
	};

	buddydrive.App.Router = Backbone.Router.extend({
		routes: {
			'edit/:id(/)': 'editItem',
			'folder/:id(/)': 'viewItem',
			'view/:id(/)': 'viewItem',
			'user/:id(/)': 'userFilter',
			[BuddyDrive_App.friends_slug + '/edit/:id(/)']: 'editItem',
			[BuddyDrive_App.friends_slug + '/folder/:id(/)']: 'viewItem',
			[BuddyDrive_App.friends_slug + '(/)']: 'listView',
			'members(/)': 'listView',
			'members/folder/:id(/)': 'viewItem',
			'members/edit/:id(/)': 'editItem',
			'': 'listView',
			'groups(/)': 'listView',
			'groups/folder/:id(/)': 'viewItem',
			'groups/edit/:id(/)': 'editItem',
		},

		editItem: function (item_id) {
			if (!item_id) {
				return;
			}

			buddydrive.App.editFile(item_id);
		},

		viewItem: function (folder_id) {
			if (!folder_id) {
				return;
			}

			buddydrive.App.Query.set({
				'buddydrive_parent': folder_id,
				paged: 1
			}, { silent: true });

			buddydrive.App.listFiles();
		},

		userFilter: function (user_id) {
			if (!user_id) {
				return;
			}

			buddydrive.App.Query.set({
				'user_id': user_id,
				paged: 1
			}, { silent: true });

			buddydrive.App.listFiles();
		},

		listView: function () {
			const fragment = Backbone.history.getFragment().replace(/\/+$/, ''); // remove trailing slash

			console.log('listView fragment:', fragment);

			let scope = 'public';

			if (fragment === 'members') {
				scope = 'members';
			} else if (fragment === 'groups') {
				scope = 'groups';
			} else if (fragment === BuddyDrive_App.friends_slug) {
				scope = BuddyDrive_App.friends_slug;
			}

			// Clear and set query
			buddydrive.App.Query.clear({ silent: true });

			buddydrive.App.Query.set({
				buddydrive_scope: scope,
				paged: 1
			}, { silent: true });

			buddydrive.App.listFiles();
		}
	});

	buddydrive.App.start();

})(buddydrive, jQuery);
