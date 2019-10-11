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

		$scope.toggleSidePanel = function () {
			if($('.map-panel__sidebar').css("display") === "none"){
			   $('.map-panel__sidebar').css("display", "block");
		   }else{
			   $('.map-panel__sidebar').css("display", "none");
		   }
		};
		$scope.changeLanguage = function (key) {
			$rootScope.lang = key;
			$translate.use(key);
		};
		$('.dropdown-toggle').dropdown();
	});

})();
