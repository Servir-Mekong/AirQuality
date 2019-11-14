(function () {

	'use strict';

	angular.module('baseApp')
	.service('MapService', function ($http, $q) {
		var service = this;

		service.get_time = function (options) {
			var config = {
				params: {
					action: 'get-time',
					run_type: options.run_type,
					freq: options.freq,
					run_date: options.run_date
				}
			};
			var promise = $http.get('/api/mapclient/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};



	});

})();
