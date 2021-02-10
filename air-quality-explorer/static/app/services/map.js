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

		service.getAirStations = function (options) {
			var config = {
				params: {
					action: 'get-stations',
					obs_date: options.obs_date
				}
			};
			var promise = $http.get('/api/mapclient/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		service.get24hStations = function () {
			var config = {
				params: {
					action: 'get-24hstations'
				}
			};
			var promise = $http.get('/api/mapclient/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		service.getChartData = function (options) {
			var config = {
				params: {
					action: 'get-chartData',
					variable: options.var_type,
					run_type_chart: options.run_type,
					freq_chart: options.freq,
					run_date_chart: options.run_date,
					interaction: options.interaction,
					geom_data: options.geom_data
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
