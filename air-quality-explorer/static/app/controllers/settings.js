(function () {

	'use strict';
	angular.module('baseApp')
	.controller('settingsCtrl', function ($scope, appSettings, $translate, $rootScope) {

		$scope.menus = appSettings.menus;
		$scope.language = appSettings.Languages;
		$scope.applicationName = appSettings.applicationName;
		$scope.footerLinks = appSettings.footerLinks;
		$scope.partnersHeader = appSettings.partnersHeader;
		$scope.partnersFooter = appSettings.partnersFooter;

		$scope.changeLanguage = function (key) {
			$rootScope.lang = key;
			$translate.use(key);
		};
		$('.dropdown-toggle').dropdown();
	});
	// A $( document ).ready() block.
	$( document ).ready(function() {
	    $(".pcd").css("display", "none");
			$(".gistda").css("display", "none");
	});

})();
