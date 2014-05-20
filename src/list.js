define(['sprout/util', 'sprout/collection', 'sprout/data', 'sprout/database'], function (_, collection, data, database) {
	'use strict';

	/**
	 * Handler for sync errors.
	 * @private
	 * @param {Object} xhr The jQuery xhr object for the sync.
	 * @param {String} status The status text for the error ("timeout", "error", "abort", or "parsererror").
	 * @param {String} error The error thrown. When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
	 */
	function onSyncFailed (xhr, status, error)
	{
		this.fire('error', { xhr: xhr, status: _.trim(status), error: _.trim(error) });
	}

	return collection.extend({
		/**
		 * Initializes the list.
		 */
		constructor: function ()
		{
			collection.constructor.call(this);
			this.db = null;
			this.set('db', database.defaultDatabaseName);
		},

		/**
		 * Deinitializes the list.
		 */
		destructor: function ()
		{
			this.db = null;
			collection.destructor.call(this);
		},

		/**
         * The attributes for the list.
         * @property
         * @type Object
         */
        attributes:
        {
            /**
             * @cfg {String} db The name of the database that contains the list's data.
             */
            db: {
                value: '',
                validator: _.isString
            }
        },

		/**
		 * Lists are sparse array collections.
		 * @property
		 * @type Boolean
		 */
		sparse: true,

		/**
		 * The name of the repository for the items in this collection.
		 * @property
		 * @type String
		 */
		repoName: '',

		/**
		 * The name of the attribute that contains the item ids that were just parsed.
		 * @property
		 * @type String
		 */
		itemIdsName: 'itemIds',

		/**
         * Handles changing of the db attribute. Takes care of getting a reference to the list's database.
         * @private
         * @param {String} db The new value of the db attribute.
         */
        dbChanged: function (db)
        {
            this.db = database.get(db || database.defaultDatabaseName);
        },

		/**
		 * Parses a JSON object representation of the list's attributes.
		 * The attributes must include a value for offset which is the index that the parsed items begin at.
		 * THe attributes must also include a value for list.itemIdsName which is an array of ids for the parsed items.
		 * Override to parse new data. The list should fill itself out at this point. By parsing the json data from the new data the list can determine what models to add to itself.
		 * Usually you override this function and first call list.parse to read in the json data. Then you use that data to grab more data from the database.
		 * @param {Object} json A JSON object of the list's new data.
		 */
		parse: function (json)
		{
			// Grab the repo for the items in this list
			var repo = this.db.get(this.repoName);
			
			// Add the new items to the list
			this.add(_.map(json[this.itemIdsName], function (id) {
				return repo.getById(id);
			}), {
				at: json.offset
			});
		},

		/**
		 * Retrieves a collection of models from the its resource.
		 * @param {Object} options (Optional) Equivalent to the option parameter for jQuery's ajax function.
		 * @options
		 * {String} url list.url() Overrides the url used to sync the list with its resource. The default url is list.url().
		 * @return {Promise} Returns a promise for the fetch request.
		 */
		fetch: function (options)
		{
			return this.db.sync('read', this, options).done(_.bind(this.parse, this)).fail(_.bind(onSyncFailed, this));
		}
	});
});