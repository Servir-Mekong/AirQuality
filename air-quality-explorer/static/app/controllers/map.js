(function () {
	'use strict';
	angular.module('baseApp')
	.controller('airexplorer' ,function ($scope, $timeout, MapService, appSettings) {

		/* global variables to be tossed around like hot potatoes */
		$scope.initdate = '';
		$scope.stylesSelectors = appSettings.stylesSelectors;
		$scope.showTimeSlider = true;
		$scope.selectedDate_fire = '';
		$scope.selectedDate_aod = '';
		$scope.toggle_pcd = true;
		$scope.toggle_fire = false;
		$scope.toggle_aod = false;
		$scope.toggle_geos = true;
		$scope.showPlayButton = false;
		$scope.showPauseButton = false;
		$scope.var_type = 'PM 2.5';

		var map,
		add_wms,
		admin_layer,
		get_times,
		get_ts,
		compare,
		add_compare,
		int_type,
		opacity,
		wms_layer,
		lwmsLayer,
		rwmsLayer,
		tdWmsLayer,
		tdWmsFireLayer,
		tdWmsAODLayer,
		tdWmsGEOSLayer,
		drawnItems,
		drawing_polygon,
		distLayer,
		var_options,
		style_options,
		$modalCompare,
		$modalDisclaimer,
		$layers_element,
		thredds_options,
		stations,
		thredds_urls,
		threddss_wms_url,
		markersLayer,
		$modalChart,
		time_global, titleforst, coordinates, selectforGIF, guage_val, field_day1_avg, field_day2_avg, field_day3_avg,
		forecast_day1_avg, forecast_day2_avg, forecast_day3_avg, sum1 = 0, sum2 = 0,
		enableDates=[],
		enableDates_fire=[],
		enableDates_aod=[],
		sum3 = 0;

		var enableDatesArray=[];
		var enableMonthsFireArray=[];
		var enableYearsFireArray=[];
		var enableMonthsAODArray=[];
		var enableYearsAODArray=[];
		var enableDatesArraySlide=[];
		var default_forecastDate ='';

		var playLoop;
		var intervaltime;
		var fiveMinutes = 10 * 1;

		$modalCompare = $("#compare-modal");
		$modalDisclaimer= $("#disclaimer-modal");
		$modalChart = $("#chart-modal");
		var $meta_element = $("#metadata");
		threddss_wms_url = $meta_element.attr('data-wms-url');
		var_options = $meta_element.attr('data-var-options');
		var_options = JSON.parse(var_options);
		thredds_options = $meta_element.attr('data-thredds-options');
		thredds_options = JSON.parse(thredds_options);
		style_options = $meta_element.attr('data-style-options');
		style_options = JSON.parse(style_options);
		var admin_enabled = false;

		/**
		* Menu tab active class
		*/
		//add active class to ANALYSIS tab
		$("#menu-map").addClass("tab-active");
		//remove active class on HOME tab
		$("#menu-home").removeClass("tab-active");
		//remove active class on PM2.5 FORECASTING tab
		$("#menu-mapviewer").removeClass("tab-active");

		/**
		* initialize leaflet map
		*/
		map = L.map('map',{
			zoomControl: false,
			minZoom: 5,
			maxZoom: 16,
			maxBounds: [ [-10, 160],[50, 20]],
		}).setView([15.8700, 100.9925], 6);

		/**
		* set z-index of fire layer
		*/
		map.createPane('fire24Layer');
		map.createPane('fire48Layer');
		map.getPane('fire24Layer').style.zIndex = 500;
		map.getPane('fire48Layer').style.zIndex = 501;

		/**
		* initial white theme basemap
		*/
		var mbAttr = 'Map data &copy; <a href="https://www.mapbox.com/">MapBox</a> contributors';
		var mbUrl = 'https://api.mapbox.com/styles/v1/servirmekong/ckebgnyea0s8219ki3dfp8von/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic2VydmlybWVrb25nIiwiYSI6ImNrYWMzenhldDFvNG4yeXBtam1xMTVseGoifQ.Wr-FBcvcircZ0qyItQTq9g';
		var basemap_layer   = L.tileLayer(mbUrl, {id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1, attribution: mbAttr}),
		streets  = L.tileLayer(mbUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: mbAttr});
		basemap_layer.addTo(map);

		/**
		* adding administrative boundaries
		*/
		L.esri.dynamicMapLayer({
			url: 'https://wwf-sight-maps.org/arcgis/rest/services/Global/Administrative_Boundaries_GADM/MapServer',
			layers:[0,1],
			opacity: 0.7,
			zIndex:9999
		}).addTo(map);
		L.esri.tiledMapLayer({
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer',
			layers:[0],
			opacity: 0.7,
			zIndex:99999
		}).addTo(map);

		/**
		* adding Leaflet drawing tool
		*/
		var drawPluginOptions = {
			draw: {
				polygon: {
					allowIntersection: false, // Restricts shapes to simple polygons
					drawError: {
						color: '#e1e100', // Color the shape will turn when intersects
						message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
					},
					shapeOptions: {
						color: '#fd5a24',
						strokeWeight: 2,
						fillOpacity: 0
					}
				},
				polyline: false,
				circle: false,
				circlemarker: false,
				rectangle: {
					shapeOptions: {
						color: '#fd5a24',
						strokeWeight: 2,
						fillOpacity: 0
					}
				},
				marker: true,
			}
		};
		var drawControlFull = new L.Control.Draw(drawPluginOptions);
		map.addControl(drawControlFull);

		/**
		* getting fire layer options
		*/
		thredds_options['catalog']['fire']['monthly'].forEach(function (item, i) {
			var opt = item.split('/').reverse()[0];
			opt = opt.split('.')[1];
			var newdate = opt.substring(0, 4) + '-' + opt.substring(4, 6);
			enableDates_fire.push(newdate);
		});
		for (var i = 0; i < enableDates_fire.length; i++) {
			var dt = enableDates_fire[i];
			if(enableYearsFireArray.indexOf(parseInt(dt.split('-')[0])) < 0) {
				enableYearsFireArray.push(parseInt(dt.split('-')[0]));
			}
			var dd, mm, yyy;
			if (parseInt(dt.split('-')[1]) <= 9) {
				mm = parseInt(dt.split('-')[1]);
				yyy = dt.split('-')[0];
				enableMonthsFireArray.push(yyy + '-' + mm);
			}
			else {
				enableMonthsFireArray.push(dt);
			}
		}


		/**
		* menu tabs controller
		*/
		$(".map-panel__tabs a").click(function(){
			$(this).tab('show');
		});
		$(".map-panel__sidebar .map-panel__tabs .map-panel__tabs--item").click(function(){
			var tablinks = $('.map-panel__sidebar .map-panel__tabs .map-panel__tabs--item');
			for (var i = 0; i < tablinks.length; i++) {
				tablinks[i].className = tablinks[i].className.replace(" active", "");
			}
			$(this).addClass("active");
		});

		/**
		* Toggle layer visibility
		*/
		$("#btn_toggle_fire").on('change', function() {
			var opacity = $('#opacity-slider').val();
			if ($(this).is(':checked')) {
				tdWmsFireLayer.setOpacity(opacity);
				$("#opacity_fire").css("display","block");
			}
			else {
				tdWmsFireLayer.setOpacity(0);
				$("#opacity_fire").css("display","none");
			}
		});
		$("#btn_toggle_aod").on('change', function() {
			var opacity = $('#opacity-slider-aod').val();
			if ($(this).is(':checked')) {
				tdWmsAODLayer.setOpacity(opacity);
				$("#opacity_aod").css("display","block");
			}
			else {
				tdWmsAODLayer.setOpacity(0);
				$("#opacity_aod").css("display","none");
			}
		});
		$("#btn_toggle_geos").on('change', function() {
			var opacity = $('#opacity-slider-geos').val();
			if ($(this).is(':checked')) {
				tdWmsGEOSLayer.setOpacity(opacity);
				$("#opacity_geos").css("display","block");
			}
			else {
				tdWmsGEOSLayer.setOpacity(0);
				$("#opacity_geos").css("display","none");
			}
		});
		$("#btn_toggle_stations").on('change', function() {
			if ($(this).is(':checked')) {
				map.addLayer(markersLayer);
			}
			else {
				map.removeLayer(markersLayer);
			}
		});

		/**
		* Basemap control
		*/
		$("#btn_toggle_light").on('click', function() {

			if ($(this).is(':checked')) {
				basemap_layer.setUrl('https://api.mapbox.com/styles/v1/servirmekong/ckebgnyea0s8219ki3dfp8von/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic2VydmlybWVrb25nIiwiYSI6ImNrYWMzenhldDFvNG4yeXBtam1xMTVseGoifQ.Wr-FBcvcircZ0qyItQTq9g');
				$('#btn_toggle_dark').prop('checked', false); // Unchecks it
				$('#btn_toggle_satellite').prop('checked', false); // Unchecks it
			}
			else {
				$('#btn_toggle_satellite').trigger("click");
			}
		});
		$("#btn_toggle_dark").on('click', function() {
			if ($(this).is(':checked')) {
				basemap_layer.setUrl('https://api.mapbox.com/styles/v1/servirmekong/ckecoool62f6n19r9jrf3ldtd/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic2VydmlybWVrb25nIiwiYSI6ImNrYWMzenhldDFvNG4yeXBtam1xMTVseGoifQ.Wr-FBcvcircZ0qyItQTq9g');
				$('#btn_toggle_light').prop('checked', false); // Unchecks it
				$('#btn_toggle_satellite').prop('checked', false); // Unchecks it
			}
			else {
				$('#btn_toggle_light').trigger("click");
			}
		});

		$("#btn_toggle_satellite").on('click', function() {
			if ($(this).is(':checked')) {
				basemap_layer.setUrl('https://api.mapbox.com/styles/v1/servirmekong/ckecozln92fkk19mjhuoqxhuw/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic2VydmlybWVrb25nIiwiYSI6ImNrYWMzenhldDFvNG4yeXBtam1xMTVseGoifQ.Wr-FBcvcircZ0qyItQTq9g');
				$('#btn_toggle_light').prop('checked', false); // Unchecks it
				$('#btn_toggle_dark').prop('checked', false); // Unchecks it
			}
			else {
				$('#btn_toggle_light').trigger("click");
			}
		});

		/**
		* showing layers controller
		*/
		$('#toggle_layers').click(function(){
			$('#imagery_layer_box').css("display", "none");
			$('#legend_box').css("display", "none");
			$('#download_box').css("display", "none");
			$('#print_box').css("display", "none");
			$('#toggle_imagery').removeClass("active");
			$('#toggle_legend').removeClass("active");
			$('#toggle_download').removeClass("active");
			$('#toggle_print').removeClass("active");
			if($('#toggle_layer_box').css("display") === "none"){
				$('#toggle_layer_box').css("display", "block");
				$(this).addClass("active");
			}else{
				$('#toggle_layer_box').css("display", "none");
				$(this).removeClass("active");
			}
		});

		/**
		* opening downloading panel
		*/
		$('#toggle_download').click(function(){
			$('#toggle_layer_box').css("display", "none");
			$('#legend_box').css("display", "none");
			$('#imagery_layer_box').css("display", "none");
			$('#print_box').css("display", "none");
			$('#toggle_layers').removeClass("active");
			$('#toggle_legend').removeClass("active");
			$('#toggle_imagery').removeClass("active");
			$('#toggle_print').removeClass("active");
			if($('#download_box').css("display") === "none"){
				$('#download_box').css("display", "block");
				$(this).addClass("active");
			}else{
				$('#download_box').css("display", "none");
				$(this).removeClass("active");
			}
		});

		/**
		* opening basemap controller panel
		*/
		$('#toggle_imagery').click(function(){
			$('#toggle_layer_box').css("display", "none");
			$('#legend_box').css("display", "none");
			$('#download_box').css("display", "none");
			$('#print_box').css("display", "none");
			$('#toggle_layers').removeClass("active");
			$('#toggle_legend').removeClass("active");
			$('#toggle_download').removeClass("active");
			$('#toggle_print').removeClass("active");
			if($('#imagery_layer_box').css("display") === "none"){
				$('#imagery_layer_box').css("display", "block");
				$(this).addClass("active");
			}else{
				$('#imagery_layer_box').css("display", "none");
				$(this).removeClass("active");
			}
		});

		/**
		* opening map legends
		*/
		$('#toggle_legend').click(function(){
			$('#toggle_layer_box').css("display", "none");
			$('#imagery_layer_box').css("display", "none");
			$('#download_box').css("display", "none");
			$('#print_box').css("display", "none");
			$('#toggle_layers').removeClass("active");
			$('#toggle_imagery').removeClass("active");
			$('#toggle_download').removeClass("active");
			$('#toggle_print').removeClass("active");
			if($('#legend_box').css("display") === "none"){
				$('#legend_box').css("display", "block");
				$(this).addClass("active");
			}else{
				$('#legend_box').css("display", "none");
				$(this).removeClass("active");
			}
		});

		/**
		* opening a fire layer controller panel
		*/
		$('#fire_tab').click(function(){
			$("#opacity-slider").bootstrapSlider('setValue', 0.7);
			var opacity = $("#opacity-slider").val();
			tdWmsAODLayer.setOpacity(0);
			tdWmsFireLayer.setOpacity(opacity);
			tdWmsGEOSLayer.setOpacity(0);
			$scope.showTimeSlider = false;
			$scope.var_type = 'Fire';

			$scope.toggle_geos = false;
			$scope.toggle_fire = true;
			$scope.toggle_aod = false;
			$scope.$apply();
		});

		/**
		* opening a AOD layer controller panel
		*/
		$('#aod_tab').click(function(){
			$("#opacity-slider-aod").bootstrapSlider('setValue', 0.7);
			var opacity = $("#opacity-slider-aod").val();
			tdWmsAODLayer.setOpacity(opacity);
			tdWmsFireLayer.setOpacity(0);
			tdWmsGEOSLayer.setOpacity(0);
			$scope.showTimeSlider = false;
			$scope.var_type = 'AOD';
			$scope.toggle_geos = false;
			$scope.toggle_fire = false;
			$scope.toggle_aod = true;
			$scope.$apply();
		});

		/**
		* opening a GEOS layer controller panel
		*/
		$('#geos_tab').click(function(){
			var opacity = $("#opacity-slider-geos").val();
			tdWmsAODLayer.setOpacity(0);
			tdWmsFireLayer.setOpacity(0);
			tdWmsGEOSLayer.setOpacity(opacity);
			$scope.showTimeSlider = true;
			$scope.var_type = 'PM 2.5';
			$scope.toggle_geos = true;
			$scope.toggle_fire = false;
			$scope.toggle_aod = false;
			$scope.$apply();
		});

		$("#menu-burger").click(function() {
			if($('.map-panel__sidebar').css("display") === "none"){
				$('.map-panel__sidebar').css("display", "block");
			}else{
				$('.map-panel__sidebar').css("display", "none");
			}
		});

		/**
		* map zoom in
		*/
		$("#zoom-in").click(function() {
			map.zoomIn();
		});

		/**
		* map zoom out
		*/
		$("#zoom-out").click(function() {
			map.zoomOut();
		});

		/**
		* showing time slider bar
		*/
		$("#time-toggle").click(function() {
			if($scope.showTimeSlider){
				$scope.showTimeSlider = false;
				$scope.$apply();
			}else{
				if($scope.toggle_geos){
					$scope.showTimeSlider = true;
				}
				$scope.$apply();
			}
		});

		/**
		* polygon drawing
		*/
		$("#draw-tool").click(function() {
			new L.Draw.Rectangle(map, drawControlFull.options.draw.rectangle).enable();
		});

		/**
		* place a marker
		*/
		$("#draw-marker").click(function(){
			var event = document.createEvent('Event');
			event.initEvent('click', true, true);
			var cb = document.getElementsByClassName('leaflet-draw-draw-marker');
			/* jshint expr: true */
			!cb[0].dispatchEvent(event);
			return false;
		});

		/**
		* showing disclaimer panel
		*/
		$("#disclaimer").click(function(){
			$modalDisclaimer.modal('show');
			setTimeout(function(){ $modalDisclaimer.modal('hide'); }, 50000);
		});

		/**
		* reset map viewer to the default
		*/
		$("#reset-btn").click(function(){
			$("#date_selector").datepicker("setDate", default_forecastDate);
			map.setView([15.8700, 100.9925], 6);
		});

		/**
		* hide the logo banding and expand map full screen
		*/
		$("#full-screen").click(function() {
			if($(".container-fluid .container-wrapper").css("top") === "-8px"){
				$("nav").show();
				$(".container-fluid .container-wrapper").css("top", "100px");
				$(".map").css("height", "calc(100vh - 95px)");
				$(".map-panel__sidebar").css("top", "50px");
			}else{
				$("nav").hide();
				$(".container-fluid .container-wrapper").css("top", "-8px");
				$(".map").css("height", "101vh");
				$(".map-panel__sidebar").css("top", "50px");
			}
		});

		/**
		* hide the logo banding and expand map full screen
		*/
		$("#compare-layers").click(function() {
			if($modalCompare.modal('hide')){
				if(map.hasLayer(lwmsLayer)){
					$modalCompare.modal('hide');
					map.removeControl(compare);
					map.removeLayer(lwmsLayer);
					map.removeLayer(rwmsLayer);
					tdWmsFireLayer.addTo(map);
					tdWmsAODLayer.addTo(map);
					tdWmsGEOSLayer.addTo(map);
				}else{
					$modalCompare.modal('show');
				}
			}
		});

		// $("#admin-tool").click(function(){
		// 	if(!admin_enabled){
		// 		distLayer.setOpacity(0.5);
		// 		distLayer.addTo(map);
		// 		L.DomUtil.addClass(map._container, 'crosshair-cursor-enabled');
		// 		admin_enabled = true;
		// 	}else{
		// 		map.removeLayer(distLayer);
		// 		L.DomUtil.removeClass(map._container, 'crosshair-cursor-enabled');
		// 		admin_enabled = false;
		// 	}
		// });

		/**
		* showing printing option
		*/
		$('#toggle_print').click(function(){
			$('#toggle_layer_box').css("display", "none");
			$('#imagery_layer_box').css("display", "none");
			$('#download_box').css("display", "none");
			$('#legend_box').css("display", "none");
			$('#toggle_layers').removeClass("active");
			$('#toggle_imagery').removeClass("active");
			$('#toggle_download').removeClass("active");
			$('#toggle_legend').removeClass("active");
			if($('#print_box').css("display") === "none"){
				$('#print_box').css("display", "block");
				$(this).addClass("active");
			}else{
				$('#print_box').css("display", "none");
				$(this).removeClass("active");
			}
		});

		/**
		* initial dropdown list of all select input
		*/
		var init_dropdown = function () {
			$(".run_table").select2({minimumResultsForSearch: -1});
			$(".freq_table").select2({minimumResultsForSearch: -1});
			$(".rd_table").select2({minimumResultsForSearch: -1});
			$(".style_table").select2({minimumResultsForSearch: -1});
			$(".var_table").select2({minimumResultsForSearch: -1});
			$(".date_table").select2({minimumResultsForSearch: -1});
		};
		init_dropdown();

		/**
		* Alert
		*/
		$scope.closeAlert = function () {
			$('.custom-alert').addClass('display-none');
			$scope.alertContent = '';
		};

		var showErrorAlert = function (alertContent) {
			$scope.alertContent = alertContent;
			$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-success').addClass('alert-danger');
			$timeout(function () {
				$scope.closeAlert();
			}, 10000);
		};

		var showSuccessAlert = function (alertContent) {
			$scope.alertContent = alertContent;
			$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-danger').addClass('alert-success');
			$timeout(function () {
				$scope.closeAlert();
			}, 10000);
		};

		var showInfoAlert = function (alertContent) {
			$scope.alertContent = alertContent;
			$('.custom-alert').removeClass('display-none').removeClass('alert-success').removeClass('alert-danger').addClass('alert-info');
			$timeout(function () {
				$scope.closeAlert();
			}, 10000);

		};

		/**
		* initial style options
		*/
		style_options.forEach(function(item,i){
			var display_txt = Object.keys(item)[0];
			var value_txt = Object.values(item)[0];
			var roption = new Option(display_txt,value_txt);
			var loption = new Option(display_txt,value_txt);
			var fireoption = new Option(display_txt,value_txt);
			var aodoption = new Option(display_txt,value_txt);
			var geosoption = new Option(display_txt,value_txt);
			$("#rstyle_table").append(roption);
			$("#lstyle_table").append(loption);
			$("#fire_style_table").append(fireoption);
			$("#aod_style_table").append(aodoption);
			$("#geos_style_table").append(geosoption);
			if (value_txt.toUpperCase() === "PM25") {
				geosoption.selected = true;
				aodoption.selected = true;
				fireoption.selected = true;
			}
		});


		// --------------------------------------------------------------------------------------------------------------------------------------
		/**
		* Time Slider
		**/
		var timeSlider = document.getElementById('datePickerSlider');

		function converttimeZ(d){
			var BKKTimeOffset  = 7*60; //desired time zone, taken as GMT7
			d.setMinutes(d.getMinutes() + d.getTimezoneOffset() + BKKTimeOffset );
			return d;
		}

		// Create a string representation of the date.
		$scope.toFormat = function (v, handle) {
			// where is this string representation
			// values = "uipipes" ; default is "default"
			var date = new Date(v);
			handle = handle || $scope.defaultHandle;
			if (handle === 'uipipes') {
				return appSettings.months[date.getMonth()] + ' ' + date.getFullYear();
			} else if (handle === $scope.defaultHandle) {

				var mm = date.getMonth() + 1; // getMonth() is zero-based
				var dd = date.getDate();
				var hh = date.getHours();

				return [date.getFullYear() + '-' + (mm > 9 ? '' : '0') + mm +	'-' + (dd > 9 ? '' : '0') + dd + ' ' + (hh > 9 ? '' : '0') + hh + ':00:00'];
			}
		};

		var startdate = new Date();
		startdate.setTime(startdate.getTime());

		noUiSlider.create(timeSlider, {
			// Create two timestamps to define a range.
			range: {
				min: new Date('2020-01-01 08:00:00').getTime(),
				max: new Date().setDate(new Date().getDate() + 2)
			},

			// Handle starting positions.
			start:  converttimeZ(new Date()).getTime(),

			// Steps of 1 hours
			step: 3 * 60 * 60 * 1000,

			//tooltips: true,

			format: { to: $scope.toFormat, from: Number },

			connect: 'upper',

			// Show a scale with the slider
			pips: {
				mode: 'count',
				density: 3,
				values: 10,
				stepped: true,
				format: {
					to: function (value) {
						return $scope.toFormat(value, 'uipipes');
					},
					from: function (value) {
						return $scope.toFormat(value, 'uipipes');
					}
				}
			}
		});
		var stopPropagation = function (event) {
			event.stopPropagation();
		};

		var makeSliderToolTip = function (i, slider) {
			var tooltip = document.createElement('div'),
			input = document.createElement('input');

			// Add the input to the tooltip
			input.className = 'uitooltip-input';
			tooltip.className = 'noUi-tooltip';
			tooltip.appendChild(input);

			// On change, set the slider
			input.addEventListener('change', function () {
				if (this.value !== $scope.selectedDate) {
					$scope.selectedDate = this.value;
					slider.noUiSlider.set(new Date(this.value).getTime());
					$timeout(function () {
						//$scope.changeTimeSlider();
					}, 500);
				}

			});

			// Catch all selections and make sure they don't reach the handle
			input.addEventListener('mousedown', stopPropagation);
			input.addEventListener('touchstart', stopPropagation);
			input.addEventListener('pointerdown', stopPropagation);
			input.addEventListener('MSPointerDown', stopPropagation);

			// Find the lower slider handle and insert the tooltip
			document.getElementById('datePickerSlider').querySelector('.noUi-handle-lower').appendChild(tooltip);

			return input;
		};

		// An 0 indexed array of input elements
		var tooltipInput = makeSliderToolTip(0, timeSlider);
		var nowtime = converttimeZ(new Date());
		$scope.selectedDate = [
			nowtime.getFullYear() +	'-' + ((nowtime.getMonth() + 1) > 9 ? '' : '0') + (nowtime.getMonth() + 1) +	'-' + (nowtime.getDate() > 9 ? '' : '0') + nowtime.getDate() + ' ' + (nowtime.getHours() > 9 ? '' : '0') + nowtime.getHours() + ':00:00'
		];

		tooltipInput.value = $scope.selectedDate;

		// When the slider changes, update the tooltip
		timeSlider.noUiSlider.on('update', function (values, handle) {
			tooltipInput.value = values[handle];

		});

		// Event Handler for slider
		timeSlider.noUiSlider.on('set', function (values, handle) {
			if (values[handle] !== $scope.selectedDate) {
				$scope.selectedDate = values[handle];
				tooltipInput.value = values[handle];
				// trigger ajax only if it is coming from the default handle, not from input tooltip

				$timeout(function () {
					$scope.changeTimeSlider();
				}, 0);

			}
		});

		$scope.lastDateonNoUIslider = timeSlider.noUiSlider.get()[0];
		$scope.runDateonNoUIslider="";

		// --------------------------------------------------------------------------------------------------------------------------------------

		/**
		* get PCD data from the database
		**/
		$scope.getPCDStation = function () {
			var date = new Date($scope.selectedDate);
			$scope.selectedDate = [date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) +	'-' + (date.getDate() > 9 ? '' : '0') + date.getDate() + ' ' + (date.getHours() > 9 ? '' : '0') + date.getHours() + ':00:00'];
			var selected_date = $("#hour_table option:selected").text();
			selected_date = selected_date.replace(":30:00", ":00:00");
			// var selected_date = $("#date_selector").val();
			// selected_date = selected_date+" 23:59:59";
			var parameters = {
				obs_date: selected_date
			};
			MapService.getAirStations(parameters)
			.then(function (result){
				stations = result;
				addStations();
			});
		};

		/**
		* update dropdown list option when the time slider is changed
		**/
		$scope.changeTimeSlider = function () {
			var dd = document.getElementById('date_table');
			var date_arr = [];
			for (var i = 0; i < dd.options.length; i++) {
				date_arr.push(dd.options[i].text);
			}
			var checkDateTime = $scope.selectedDate[0].split(" ")[0];
			var date = new Date(checkDateTime);
			if(date_arr.includes(checkDateTime)){
				$("#date_selector").datepicker("setDate", checkDateTime);
			}
			else{
				if(new Date().getTimezoneOffset() <= 0){
					date.setDate(date.getDate() - 1);  //+ UTC
				}else{
					date.setDate(date.getDate()); //- UTC
				}
				checkDateTime = date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) +	'-' + (date.getDate() > 9 ? '' : '0') + date.getDate();
				$("#date_selector").datepicker("setDate", checkDateTime);
			}
			default_forecastDate = $("#date_selector").val();

			for (var j = 0; j < dd.options.length; j++) {
				if (dd.options[j].text === checkDateTime) {
					dd.selectedIndex = j;
					break;
				}
			}
		};


		/**
		*************************************************TIME SLIDER BAR**************************************************************************************
		**/

		/**
		* update fire map layer when fire time slider is changed
		**/
		$scope.changeTimeSlider_fire = function () {
			$("#fire_range-max").trigger('change');
		};

		/**
		* update AOD map layer when aod time slider is changed
		**/
		$scope.changeTimeSlider_aod = function () {
			$("#aod_range-max").trigger('change');
		};

		// Forward Slider
		$scope.slideForward = function () {
			var date = new Date($scope.selectedDate);
			date.setHours(date.getHours() + 3);
			$scope.selectedDate = [date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) +	'-' + (date.getDate() > 9 ? '' : '0') + date.getDate() + ' ' + (date.getHours() > 9 ? '' : '0') + date.getHours() + ':00:00'];
			tooltipInput.value = $scope.selectedDate;
			timeSlider.noUiSlider.set(new Date($scope.selectedDate).getTime());
		};

		// Backward Slider
		$scope.slideBackward = function () {
			var date = new Date($scope.selectedDate);
			date.setHours(date.getHours() - 3);
			$scope.selectedDate = [date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) +	'-' + (date.getDate() > 9 ? '' : '0') + date.getDate() + ' ' + (date.getHours() > 9 ? '' : '0') + date.getHours() + ':00:00'];
			tooltipInput.value = $scope.selectedDate;
			timeSlider.noUiSlider.set(new Date($scope.selectedDate).getTime());
		};

		function startTimer(duration) {
			var timer = duration, minutes, seconds;
			intervaltime = setInterval(function () {
				minutes = parseInt(timer / 60, 10);
				seconds = parseInt(timer % 60, 10);

				minutes = minutes < 10 ? "0" + minutes : minutes;
				seconds = seconds < 10 ? "0" + seconds : seconds;

				if (--timer < 0) {
					timer = duration;
				}
			}, 1000);
		}

		function stopINT(){
			clearInterval(intervaltime);
		}

		function playAnimation () {
			var time = 0;
			if(playLoop > 0){time = 2500;}else{time=0;} //every 10 s.
			setTimeout(function () {
				$scope.slideForward();
				playLoop++;
				if($scope.runDateonNoUIslider === $scope.lastDateonNoUIslider || timeSlider.noUiSlider.get()[0] === $scope.lastDateonNoUIslider){
					stopINT();
					$scope.showPlayButton = true;
					$scope.showPauseButton = false;
					$scope.$apply();
				}
				else{
					clearInterval(intervaltime);
					startTimer(fiveMinutes);
					playAnimation();
				}
			}, time);
		}

		// Forward Slider fire
		$scope.slideForward_fire = function () {
			var date = new Date($scope.selectedDate_fire);
			date.setMonth(date.getMonth() + 1);
			$scope.selectedDate_fire = [date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) + '-01'] ;
			tooltipInput_fire.value = $scope.selectedDate_fire;
			timeSlider_fire.noUiSlider.set(new Date($scope.selectedDate_fire).getTime());
			$timeout(function () {
				$scope.changeTimeSlider_fire();
			}, 500);
		};

		// Backward Slider fire
		$scope.slideBackward_fire = function () {
			//var date = new Date($scope.selectedDate_fire);
			var date = new Date($scope.selectedDate_fire);
			date.setMonth(date.getMonth() - 1);
			$scope.selectedDate_fire = [date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) + '-01'];
			tooltipInput_fire.value = $scope.selectedDate_fire;
			timeSlider_fire.noUiSlider.set(new Date($scope.selectedDate_fire).getTime());
			$timeout(function () {
				$scope.changeTimeSlider_fire();
			}, 500);
		};


		// Forward Slider AOD
		$scope.slideForward_aod = function () {
			var date = new Date($scope.selectedDate_aod);
			date.setMonth(date.getMonth() + 1);
			$scope.selectedDate_aod = [date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) + '-01'] ;
			tooltipInput_aod.value = $scope.selectedDate_aod;
			timeSlider_aod.noUiSlider.set(new Date($scope.selectedDate_aod).getTime());
			$timeout(function () {
				$scope.changeTimeSlider_aod();
			}, 500);
		};

		// Backward Slider fire
		$scope.slideBackward_aod = function () {
			//var date = new Date($scope.selectedDate_fire);
			var date = new Date($scope.selectedDate_aod);
			date.setMonth(date.getMonth() - 1);
			$scope.selectedDate_aod = [date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) + '-01'];
			tooltipInput_aod.value = $scope.selectedDate_aod;
			timeSlider_aod.noUiSlider.set(new Date($scope.selectedDate_aod).getTime());
			$timeout(function () {
				$scope.changeTimeSlider_aod();
			}, 500);
		};


		/**
		*******************************************************OPACITY SLIDER********************************************************************************
		**/

		var init_opacity_slider = function(){
			opacity = 1;
			$("#opacity").text(opacity);
			$( "#opacity-slider" ).bootstrapSlider({
				value: 0,
				min: 0.0,
				max: 1,
				step: 0.1,
				animate:"fast",
				slide: function( event, ui ){}
			});
			$( "#opacity-slider-aod" ).bootstrapSlider({
				value: 0,
				min: 0.0,
				max: 1,
				step: 0.1,
				animate:"fast",
				slide: function( event, ui ){}
			});
			$( "#opacity-slider-geos" ).bootstrapSlider({
				value: opacity,
				min: 0.0,
				max: 1,
				step: 0.1,
				animate:"fast",
				slide: function( event, ui ){}
			});
		};
		init_opacity_slider();

		/**
		***************************************************************************************************************************************
		**/

		var clear_coords = function(){
			$("#point-lat-lon").val('');
			$("#poly-lat-lon").val('');
			$("#shp-lat-lon").val('');
		};

		function find_var_index(item,data){
			var index = -1;
			for (var i = 0; i < data.length; ++i) {
				if (data[i]["id"] === item){
					index = i;
					break;
				}
			}
			return index;
		}

		function handleMouseMove(e,ctx,width,height){
			$('.tippy').removeClass('hidden');
			var offsetX,offsetY;
			function reOffset(){
				var BB=canvas.getBoundingClientRect();
				offsetX=BB.left;
				offsetY=BB.top;
			}
			reOffset();
			// tell the browser we're handling this event
			e.preventDefault();
			e.stopPropagation();

			var mouseX=parseInt(e.clientX-offsetX);
			var mouseY=parseInt(e.clientY-offsetY);
			var rmin = $("#range-min").val();
			var rmax = $("#range-max").val();

			var factor = Number( rmax - rmin) / Number(width);
			var htext = mouseX*factor;
			// console.log(rmin,rmax,factor,width,htext);
			var tipCanvas = document.getElementById("tip");
			var tipCtx = tipCanvas.getContext("2d");
			tipCanvas.style.left = (mouseX + 20) + "px";
			tipCanvas.style.top = (mouseY + 20) + "px";
			tipCtx.clearRect(0, 0, tipCanvas.width, tipCanvas.height);
			tipCtx.fillText(htext.toFixed(2), 5, 15);
		}

		var myIcon = L.ExtraMarkers.icon({
			icon: 'fa-number',
			markerColor: 'red',
			shape: 'square',
			prefix: 'fa'
		});

		function addStations(){
			if(map.hasLayer(markersLayer)){
				markersLayer.clearLayers();
			}
			var icon_src;
			markersLayer = L.featureGroup().addTo(map);
			for (var i = 0; i < stations.length; ++i) {
				var color="red";
				var pm2_val = stations[i].pm25;
				var aqi_level = stations[i].aqi_level;
				var aqi = stations[i].aqi;
				if(aqi_level === 1){
					icon_src = '/static/images/B1_Excellent.png';
				}else if(aqi_level === 2){
					icon_src = '/static/images/B2_Satisfactory.png';
				}else if(aqi_level === 3){
					icon_src = '/static/images/B3_Moderate.png';
				}else if(aqi_level === 4){
					icon_src = '/static/images/B4_Unhealthy.png';
				}else if(aqi_level === 5){
					icon_src = '/static/images/B5_V-Unhealthy.png';
				}

				if(pm2_val>90){
					color="#ed1e02";
					myIcon = L.ExtraMarkers.icon({
						icon: 'fa-number',
						number: pm2_val,
						markerColor: 'orange-dark',
						shape: 'square',
						prefix: 'fa'
					});
				}
				else if(pm2_val>50 && pm2_val<91){
					color="#eda702";
					myIcon = L.ExtraMarkers.icon({
						icon: 'fa-number',
						number: pm2_val,
						markerColor: 'orange',
						shape: 'square',
						prefix: 'fa'
					});
				}
				else if(pm2_val>37 && pm2_val<51){
					color="#eff213";
					myIcon = L.ExtraMarkers.icon({
						icon: 'fa-number',
						number: pm2_val,
						markerColor: 'yellow',
						shape: 'square',
						prefix: 'fa',
						iconColor: '#aaa'
					});

				}else if(pm2_val>25 && pm2_val<38){
					color="#24cf1b";
					myIcon = L.ExtraMarkers.icon({
						icon: 'fa-number',
						number: pm2_val,
						markerColor: 'green-light',
						shape: 'square',
						prefix: 'fa'
					});
				}else if(pm2_val>=0 && pm2_val<26){
					color="#6ef0ff";
					myIcon = L.ExtraMarkers.icon({
						icon: 'fa-number',
						number: pm2_val,
						markerColor: 'blue-dark',
						shape: 'square',
						prefix: 'fa'
					});
				}

				var oneMarker =
				L.marker([stations[i].lat, stations[i].lon], {
					icon: myIcon
				});
				oneMarker.bindTooltip("<b>Station:</b> "+stations[i].name+
				"<br><b>PM 2.5:</b> "+pm2_val+ " (µg<sup>-3</sup>)"+
				"<br><b>Data for:</b> "+stations[i].latest_date+ "<br> <i>All dates and times are in Indochina Time(ICT)</i>");
				oneMarker.station_id = stations[i].station_id;
				oneMarker.name = stations[i].name;
				oneMarker.lat = stations[i].lat;
				oneMarker.lon = stations[i].lon;
				oneMarker.pm25 = stations[i].pm25;
				oneMarker.aqi = stations[i].aqi;
				oneMarker.src = icon_src;
				oneMarker.latest_date = stations[i].latest_date;
				oneMarker.addTo(markersLayer);
			}
			markersLayer.on("click", markerOnClick);
			markersLayer.setZIndex(500);

			if ($("#btn_toggle_stations").is(':checked')) {
				map.addLayer(markersLayer);
			}
			else {
				map.removeLayer(markersLayer);
			}
		}

		function markerOnClick(e) {
			if ($("#geos_run_table option:selected").val() === "geos") {
				var attributes = e.layer;
				int_type = "Station";
				$("#station").val(attributes.station_id + ',' + attributes.lat + ',' + attributes.lon);
				titleforst = attributes.name;
				get_ts();

				$("#station_name").text(attributes.name);
				$("#aqi_txt").text("AQI: " + attributes.aqi );
				$("#aqi_img").attr('src',attributes.src);
				$("#obs_date").text(attributes.latest_date);
			} else {
				alert("Please select GEOS as the platform to see the chart for station.");

			}
		}

		/**
		*******************************************************ADDING WMS LAYER********************************************************************************
		**/
		add_wms = function (run_type, freq, run_date, var_type, rmin, rmax, styling, time = "") {
			var wmsUrl = threddss_wms_url+run_date;
			wms_layer=wmsUrl;
			run_type = run_type.toUpperCase();
			if(run_type === 'FIRE'){
				if(map.hasLayer(tdWmsFireLayer)){
					map.removeLayer(tdWmsFireLayer);
				}
			}else if(run_type === 'GEOS'){
				if(map.hasLayer(tdWmsGEOSLayer)){
					map.removeLayer(tdWmsGEOSLayer);
				}
			}else if(run_type !== 'GEOS' || run_type !== 'FIRE'){
				if(map.hasLayer(tdWmsAODLayer)){
					map.removeLayer(tdWmsAODLayer);
				}
			}

			var index = find_var_index(var_type,var_options);
			// gen_color_bar(var_options[index]["colors_list"],scale);
			var layer_id = var_options[index]["id"];
			var range = (rmin ? rmin : '0') + ',' + (rmax ? rmax : '5');

			var link = wmsUrl + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=" + layer_id + "&time=" + time + "&colorscalerange=" + range + "&PALETTE=" + styling + "&transparent=TRUE";
			var imgsrc = link;

			if (time === "") {

				link = wmsUrl + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=" + layer_id + "&colorscalerange=" + range + "&PALETTE=" + styling + "&transparent=TRUE";
				imgsrc = link;
			}
			var style = 'boxfill/'+styling;

			var opacity_fire = $('#opacity-slider').val();
			var opacity_aod = $('#opacity-slider-aod').val();
			var opacity_geos = Number($('#opacity-slider-geos').val());

			if(run_type === 'FIRE'){
				tdWmsFireLayer = L.tileLayer.wms(wmsUrl, {
					layers: var_type,
					format: 'image/png',
					transparent: true,
					styles: style,
					colorscalerange: range,
					opacity:opacity_fire,
					version:'1.3.0',
					zIndex:100,
					bounds: [[0, 90], [22, 120]],
				});
				tdWmsFireLayer.addTo(map);
				$('#img-legend-fire').attr('src',imgsrc);
			}else if(run_type === 'GEOS'){
				tdWmsGEOSLayer = L.tileLayer.wms(wmsUrl, {
					layers: var_type,
					format: 'image/png',
					time: time,
					transparent: true,
					styles: style,
					colorscalerange: range,
					opacity:opacity_geos,
					version:'1.3.0',
					zIndex:100,
					bounds: [[0, 90], [22, 120]],
					abovemaxcolor:'extend',
					belowmincolor:'extend'
				});
				tdWmsGEOSLayer.addTo(map);
				$('#img-legend-geos').attr('src',imgsrc);
			}else if(run_type !== 'GEOS' || run_type !== 'FIRE'){
				tdWmsAODLayer = L.tileLayer.wms(wmsUrl, {
					layers: var_type,
					format: 'image/png',
					transparent: true,
					styles: style,
					colorscalerange: range,
					opacity:opacity_aod,
					version:'1.3.0',
					zIndex:100,
					bounds: [[0, 90], [22, 120]],
					abovemaxcolor:'extend',
					belowmincolor:'extend'
				});
				tdWmsAODLayer.addTo(map);
				$('#img-legend-aod').attr('src',imgsrc);
			}

		};

		/**
		* layers comparing function
		*/
		add_compare = function(){
			map.removeLayer(tdWmsFireLayer);
			map.removeLayer(tdWmsAODLayer);
			map.removeLayer(tdWmsGEOSLayer);
			$modalCompare.modal('hide');
			var lstyle =  ($("#lstyle_table option:selected").val());
			var rstyle =  ($("#rstyle_table option:selected").val());
			var l_date = $("#lrd_table option:selected").val();
			var l_var = $("#lvar_table option:selected").val();
			var r_date = $("#rrd_table option:selected").val();
			var r_var = $("#rvar_table option:selected").val();


			var lwmsUrl = threddss_wms_url+l_date;
			var rwmsUrl = threddss_wms_url+r_date;

			var lrange = $("#lrange-min").val()+','+$("#lrange-max").val();
			var rrange = $("#rrange-min").val()+','+$("#rrange-max").val();
			var lstyling = 'boxfill/'+lstyle;
			var rstyling = 'boxfill/'+rstyle;

			lwmsLayer = L.tileLayer.wms(lwmsUrl, {
				layers: l_var,
				format: 'image/png',
				transparent: true,
				styles: lstyling,
				colorscalerange: lrange,
				opacity:1,
				version:'1.3.0',
				bounds: [[0, 90], [22, 120]],
			});

			rwmsLayer = L.tileLayer.wms(rwmsUrl, {
				layers: r_var,
				format: 'image/png',
				transparent: true,
				styles: rstyling,
				colorscalerange: rrange,
				opacity:1,
				version:'1.3.0',
				bounds: [[0, 90], [22, 120]],
			});

			lwmsLayer.addTo(map);
			rwmsLayer.addTo(map);
			compare = L.control.sideBySide(lwmsLayer,rwmsLayer);
			compare.addTo(map);

		};

		/**
		* open compare layers popup
		*/
		$("#btn-add-compare").on('click',add_compare);
		$("#btn-close-compare").on('click', function(){
			$modalCompare.modal('hide');
		});

		L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({
			onAdd: function (map) {
				// Triggered when the layer is added to a map.
				//   Register a click listener, then do all the upstream WMS things
				L.TileLayer.WMS.prototype.onAdd.call(this, map);
				map.on('click', this.getFeatureInfo, this);
			},

			onRemove: function (map) {
				// Triggered when the layer is removed from a map.
				//   Unregister a click listener, then do all the upstream WMS things
				L.TileLayer.WMS.prototype.onRemove.call(this, map);
				map.off('click', this.getFeatureInfo, this);
			},

			getFeatureInfo: function (evt) {
				// Make an AJAX request to the server and hope for the best
				var url = this.getFeatureInfoUrl(evt.latlng),
				showResults = L.Util.bind(this.showGetFeatureInfo, this);
				$.ajax({
					url: url,
					success: function (data, status, xhr) {
						var err = typeof data === 'string' ? null : data;
						showResults(err, evt.latlng, data);
					},
					error: function (xhr, status, error) {
						console.log('error');
						showResults(error);
					}
				});
			},

			getFeatureInfoUrl: function (latlng) {
				// Construct a GetFeatureInfo request URL given a point
				var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom()),
				size = this._map.getSize(),

				params = {
					request: 'GetFeatureInfo',
					service: 'WMS',
					srs: 'EPSG:4326',
					styles: this.wmsParams.styles,
					transparent: this.wmsParams.transparent,
					version: this.wmsParams.version,
					format: this.wmsParams.format,
					bbox: this._map.getBounds().toBBoxString(),
					height: size.y,
					width: size.x,
					layers: this.wmsParams.layers,
					query_layers: this.wmsParams.layers,
					info_format: 'application/json'
				};
				params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
				params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;

				return this._url + L.Util.getParamString(params, this._url, true);
			},

			showGetFeatureInfo: function (err, latlng, content) {
				var coords = content.features[0]["geometry"];
				$("#poly-lat-lon").val(JSON.stringify(coords));
				int_type = 'Polygon';
				var ccontent = '<table border="1" style="overflow-x:auto;" class="table table-sm"><tbody><tr><th>Country</th><th>Admin 1</th><th>Admin 2</th><th>Admin 3</th></tr>'+'<tr><td>'+content.features[0].properties.NAME_0 +'</td><td>'+ content.features[0].properties.NAME_1 + '</td><td>'+ content.features[0].properties.NAME_2 + '</td><td>'+ content.features[0].properties.NAME_3 + '</td></tr></tbody></table><button type="button" class="mod_link btn-primary" id="btn-get-wms-plot" data-geom="'+JSON.stringify(coords)+'">Get Plot</button>';
				// Otherwise show the content in a popup, or something.
				L.popup({ maxWidth: 800})
				.setLatLng(latlng)
				.setContent(ccontent)
				.openOn(this._map);

				//$('.mod_link').on('click',get_ts);
			}
		});

		L.tileLayer.betterWms = function (url, options) {
			return new L.TileLayer.BetterWMS(url, options);
		};


		var timeDimension = new L.TimeDimension();
		map.timeDimension = timeDimension;

		var player = new L.TimeDimension.Player({
			loop: true,
			startOver:true
		}, timeDimension);

		var timeDimensionControlOptions = {
			player:        player,
			timeDimension: timeDimension,
			position:      'bottomleft',
			autoPlay:      false,
			minSpeed:      1,
			speedStep:     0.5,
			maxSpeed:      20,
			timeSliderDragUpdate: true,
			loopButton:true,
			limitSliders:true
		};

		Date.prototype.format = function (mask, utc) {
			return dateFormat(this, mask, utc);
		};

		L.Control.TimeDimensionCustom = L.Control.TimeDimension.extend({
			_getDisplayDateFormat: function(date){
				return date.format("mmmm yyyy");
			}
		});

		L.Control.InfoControl = L.Control.extend({
			initialize: function (options) {
				L.Util.setOptions(this, options);
			},
			onAdd: function () {
				var container = L.DomUtil.create("div", "info-control leaflet-control-attribution");
				container.innerHTML = this.options.content;
				return container;
			},
			getContent: function () {
				return this.getContainer().innerHTML;
			},
			setContent: function (html) {
				this.getContainer().innerHTML = html;
			}
		});

		var leg = new L.Control.InfoControl({
			position: "topcenter",
			content: '<div><canvas id="canvas" style="width:20vw;height:4vh;"></canvas><canvas class="tippy hidden" id="tip" width=35 height=25></canvas></div>'
		});
		//map.addControl(leg);

		var nrt_date = new L.Control.InfoControl({
			position: "topright",
			content: '<div id="controls"><button id="prev">Previous Day</button><input id="date"><button id="next">Next Day</button></div>'
		});
		map.addControl(nrt_date);


		/**
		********************** SHOWING NEAR REAL TIME IMAGERY **********************
		*/
		var DATE_FORMAT = 'dd.mm.yy';
		var strToDateUTC = function (str) {
			var date = $.datepicker.parseDate(DATE_FORMAT, str);
			return new Date(date - date.getTimezoneOffset() * 60 * 1000);
		};
		var $date = $('#date');
		var now = new Date();
		var oneDay = 1000 * 60 * 60 * 24, // milliseconds in one day
		startTimestamp = now.getTime() - oneDay + now.getTimezoneOffset() * 60 * 1000,
		startDate = new Date(startTimestamp); //previous day

		$date.val($.datepicker.formatDate(DATE_FORMAT, startDate));
		var alterDate = function (delta) {
			var date = $.datepicker.parseDate(DATE_FORMAT, $date.val());
			$date.val($.datepicker.formatDate(DATE_FORMAT, new Date(date.valueOf() + delta * oneDay))).change();
		};

		var baselayers = {};
		var today = new Date();
		var day = new Date(today.getTime());
		day = $scope.selectedDate;
		day = day[0].split(' ');
		day = day[0];

		var overlays = {
			'MODIS_Terra_Aerosol_Optical_Depth':L.tileLayer( '//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
			'{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg', {
				layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 7,
				format: 'png',
				time: day,
				tileMatrixSet: 'GoogleMapsCompatible_Level9',
				opacity: 1,
				tileSize: 256,
				subdomains: 'abc',
				noWrap: true,
				continuousWorld: true
			}),
			'MODIS_Aqua_Aerosol_Optical_Depth':L.tileLayer( '//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
			'{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg', {
				layer: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 7,
				format: 'png',
				time: day,
				tileMatrixSet: 'GoogleMapsCompatible_Level9',
				opacity: 1,
				tileSize: 256,
				subdomains: 'abc',
				noWrap: true,
				continuousWorld: true
			}),
			'VIIRS_SNPP_CorrectedReflectance_TrueColor':L.tileLayer( '//gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/' +
			'{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg', {
				layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 7,
				format: 'png',
				time: day,
				tileMatrixSet: 'GoogleMapsCompatible_Level9',
				opacity: 1,
				tileSize: 256,
				subdomains: 'abc',
				noWrap: true,
				continuousWorld: true
			}),
			'MODIS_Terra_AOD_DB_Combined':L.tileLayer( "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
				layer: 'MODIS_Terra_AOD_Deep_Blue_Combined',
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 9,
				format: 'png',
				time: day,
				TileMatrixSet: 'GoogleMapsCompatible_Level6',
				opacity: 1,
				name:'MODIS_Terra_Aerosol_Optical_Depth',
				subdomains: 'abc',
				noWrap: true,
				continuousWorld: true
			}),
			'MODIS_Aqua_AOD_DB_Combined':L.tileLayer( "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
				layer: 'MODIS_Aqua_AOD_Deep_Blue_Combined',
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 9,
				format: 'png',
				time: day,
				TileMatrixSet: 'GoogleMapsCompatible_Level6',
				opacity: 1,
				name:'MODIS_Aqua_Aerosol_Optical_Depth',
				subdomains: 'abc',
				noWrap: true,
				continuousWorld: true
			}),
			'OMPS_Aerosol_Index':L.tileLayer( "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
				layer: 'OMPS_Aerosol_Index',
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 9,
				format: 'png',
				time: day,
				TileMatrixSet: 'GoogleMapsCompatible_Level6',
				opacity: 1,
				name:'OMPS_Aerosol_Index',
				subdomains: 'abc',
				noWrap: true,
				continuousWorld: true
			}),
			'MODIS_Terra_AOD_Deep_Blue_Land':L.tileLayer( "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
				layer: 'MODIS_Terra_AOD_Deep_Blue_Land',
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 9,
				format: 'png',
				time: day,
				TileMatrixSet: 'GoogleMapsCompatible_Level6',
				opacity: 1,
				name:'MODIS_Terra_AOD_Deep_Blue_Land',
				subdomains: 'abc',
				noWrap: true,
				continuousWorld: true
			}),
			'MODIS_Aqua_AOD_Deep_Blue_Land':L.tileLayer( "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{TileMatrixSet}/{z}/{y}/{x}.png", {
				layer: 'MODIS_Aqua_AOD_Deep_Blue_Land',
				bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
				minZoom: 1,
				maxZoom: 9,
				format: 'png',
				time: day,
				TileMatrixSet: 'GoogleMapsCompatible_Level6',
				opacity: 1,
				name:'MODIS_Aqua_AOD_Deep_Blue_Land',
				subdomains: 'abc',
				noWrap: true,
				continuousWorld: true
			}),
			'FIRES_VIIRS_24':L.tileLayer.wms("https://firms.modaps.eosdis.nasa.gov/wms/?MAP_KEY=c135d300c93ef6c81f32f095073a9a7d",{
				layers:'fires_viirs_24',
				format: 'image/png',
				time:day,
				transparent: true,
				pane: 'fire24Layer'
			}),
			'FIRES_VIIRS_48':L.tileLayer.wms("https://firms.modaps.eosdis.nasa.gov/wms/?MAP_KEY=37601af187a7c4054759a42043b19adc",{
				layers:'fires_viirs_48',
				format: 'image/png',
				time:day,
				transparent: true,
				pane: 'fire48Layer'
			}),

		};

		/**
		****************************************************************************
		*/

		// Control date navigation for GIBS WMS layers, adjust the options.time and redraw. Exclude FIRE VIIRS layers (not time-enabled)
		$date.datepicker({
			dateFormat: DATE_FORMAT
		}).change(function () {
			var date = strToDateUTC(this.value);
			for (var l in overlays) {
				if (!(l.includes('FIRES_VIIRS'))) {
					overlays[l].options.time = date.toISOString().split('T')[0];
					overlays[l].redraw();
				}

			}
		});
		document.getElementById("prev").onclick = alterDate.bind(null, -1);
		document.getElementById("next").onclick = alterDate.bind(null, 1);

		var layersControl = L.control.layers.minimap(baselayers, overlays, {
			collapsed: true
		}).addTo(map);

		drawnItems = new L.FeatureGroup();
		map.addLayer(drawnItems);
		distLayer = L.tileLayer.betterWms('https://tethys.servirglobal.net/geoserver/wms/', {
			layers: 'utils:adm',
			format: 'image/png',
			transparent: true,
			styles:'district',
			zIndex:1,
			cql_filter: "NAME_0 IN ('Thailand', 'Laos', 'Myanmar', 'Vietnam', 'Cambodia')"

		});

		/**
		* Control date navigation for GIBS WMS layers, adjust the options.time and redraw. Exclude FIRE VIIRS layers (not time-enabled)
		*/
		$date.datepicker({
			dateFormat: DATE_FORMAT,
			beforeShow: function() {
				setTimeout(function(){
					$('.ui-datepicker').css('z-index', 9999);
				}, 0);
			}
		}).change(function() {
			var date = strToDateUTC(this.value);
			for (var l in overlays) {
				if(!(l.includes('FIRES_VIIRS'))){
					overlays[l].options.time = date.toISOString().split('T')[0];
					overlays[l].redraw();
				}
			}
		});

		/**
		********************** PRINTING MAP **********************
		*/
		var customActionToPrint = function (context, mode) {
			return function () {
				//window.alert("Please check if any overlays are selected before you print..");
				context._printLandscape(mode);
			};
		};

		L.control.browserPrint({
			title: 'Air quality Print',
			documentTitle: 'Air quality App with data',
			printLayer: wms_layer,
			closePopupsOnPrint: false,
			printModes: [L.control.browserPrint.mode("Landscape", "Landscape", "A4", customActionToPrint, false)],
			manualMode: false
		}).addTo(map);
		/**
		****************************************************************************
		*/


		/**
		*******************************MAP EVENTS*********************************************
		*/
		map.on("draw:drawstart ", function (e) {
			clear_coords();
			drawnItems.clearLayers();
		});

		map.on("draw:created", function (e) {
			clear_coords();
			drawnItems.clearLayers();

			var layer = e.layer;
			layer.addTo(drawnItems);
			var feature = drawnItems.toGeoJSON();
			var type = feature.features[0].geometry.type;
			int_type = type;
			var coords;
			if (type === 'Point'){
				coords = feature["features"][0]["geometry"]["coordinates"];
				$("#point-lat-lon").val(coords);
				get_ts();
			} else if (type === 'Polygon'){
				coords = feature["features"][0]["geometry"];
				$("#poly-lat-lon").val(JSON.stringify(coords.coordinates[0]));
				get_ts();
			}
		});
		/**
		********************************************************************************
		*/


		var wmsUrl = "https://tethys.servirglobal.net/thredds/wms/tethys/HIWAT/hkhControl_20180329-1800_latlon.nc";
		var wmsLayer = L.tileLayer.wms(wmsUrl, {
			layers: 'APCP_surface',
			format: 'image/png',
			transparent: true,
			style:'boxfill/apcp_surface'
		});

		/**
		* Create and add a TimeDimension Layer to the map
		*/
		tdWmsFireLayer = L.timeDimension.layer.wms(wmsLayer);
		//tdWmsLayer.addTo(map);

		lwmsLayer = L.tileLayer.wms();

		rwmsLayer = L.tileLayer.wms();


		/**
		* Create a chart
		*/
		function gen_chart(field_val, forecast_val) {
			var myConfig = {
				type: "gauge",
				legend: {
					align: 'center',
					offsetY:260


				},
				scaleR: {
					"aperture": 200,
					"values": "0:99:3",
					center: {
						"size": 10,
						"background-color": "#66CCFF #FFCCFF",
						"border-color": "none"
					},
					labels: ['0', '', '', '', '12', '', '', '', '24', '', '', '', '36', '', '', '', '48', '', '', '', '60', '', '', '', '72', '', '', '', '84', '', '', '', '', 'Max'],
					item: {  //Scale Label Styling
						"font-color": "black",
						"font-family": "Arial",
						"font-size": 12,
						"font-weight": "bold",   //or "normal"
						"font-style": "normal",   //or "italic"
						"offset-r": 0,
						"angle": "auto"
					},

					ring: {  //Ring with Rules
						"size": 20,
						"rules": [
							{
								"rule": "%v >= 0 && %v < 25",
								"background-color": "#6ef0ff"
							},
							{
								"rule": "%v >= 25 && %v < 37",
								"background-color": "#24cf1b"
							},
							{
								"rule": "%v >= 37 && %v < 50",
								"background-color": "#eff213"
							},
							{
								"rule": "%v >= 50 && %v < 90",
								"background-color": "#eda702"
							},
							{
								"rule": "%v >= 90",
								"background-color": "#ed1e02"
							}
						]
					}
				},
				series: [
					{
						values: [Math.round(field_val) >= 99 ? 99 : Math.round(field_val)], // starting value
						// backgroundColor: 'black',
						// indicator: [5, 5, 5, 5, 0.75],
						animation: {
							effect: 2,
							method: 1,
							sequence: 4,
							speed: 900
						},
						csize: "7%",     //Needle Width
						size: "90%",    //Needle Length
						'background-color': "black",  //Needle Color
						text: "PM2.5 Measurement"
					},
					{
						values: [Math.round(forecast_val) >= 99 ? 99 : Math.round(forecast_val)],
						animation: {
							effect: 2,
							method: 1,
							sequence: 4,
							speed: 700
						},
						csize: "7%",
						size: "90%",
						'background-color': "green",
						text: "PM2.5 Forecast"
					}


				]
			};

			zingchart.render({
				id: 'guage_chart',
				data: myConfig,
				height: 350,
				width: '100%'
			});
		}

		/**
		*********************** Create a line chart when user draw a polygon or place a marker*************************************
		*/
		get_ts = function () {
			var interaction = int_type;
			if (interaction === "Station") {
			} else if ($("#poly-lat-lon").val() === "" && $("#point-lat-lon").val() === "" && $("#shp-lat-lon").val() === "") {
				// $('.error').html('<b>No feature selected. Please create a feature using the map interaction dropdown. Plot cannot be generated without a feature.</b>');
				return false;
			} else {
				$('.error').html('');
			}
			var run_type = '';
			var freq = '';
			var rd_type = '';
			var var_type = '';

			if($scope.toggle_geos){
				run_type = ($("#geos_run_table option:selected").val());
				freq = ($("#geos_freq_table option:selected").val());
				var_type = ($("#geos_var_table option:selected").val());

				rd_type = ($("#geos_rd_table option:selected").val());
				var z = rd_type.split('/').reverse()[0];
				var y = ($("#date_selector").val());
				rd_type = rd_type.replace(z, y.replace('-', '').replace('-', '') + '.nc');
				rd_type = rd_type.split('/').reverse()[0];
			}else if($scope.toggle_fire){
				run_type = 'fire';
				freq = ($("#fire_freq_table option:selected").val());
				rd_type = ($("#fire_rd_table option:selected").text());
				var_type = ($("#fire_var_table option:selected").val());
			}else if($scope.toggle_aod){
				run_type = ($("#aod_run_table option:selected").val());
				freq = ($("#aod_freq_table option:selected").val());
				rd_type = ($("#aod_rd_table option:selected").text());
				var_type = ($("#aod_var_table option:selected").val());
			}

			var geom_data = '';
			if (interaction === "Point") {
				geom_data = $("#point-lat-lon").val();
			} else if (interaction === "Polygon") {
				geom_data = $("#poly-lat-lon").val();
			} else if (interaction === "Station") {
				geom_data = $("#station").val();
				run_type = ($("#geos_run_table option:selected").val());
				freq = ($("#geos_freq_table option:selected").val());
				var_type = ($("#geos_var_table option:selected").val());
				rd_type = ($("#geos_rd_table option:selected").val());
				var _date = rd_type.split('/').reverse()[0];
				var _selected_date = ($("#date_selector").val());
				rd_type = rd_type.replace(_date, _selected_date.replace('-', '').replace('-', '') + '.nc');
				rd_type = rd_type.split('/').reverse()[0];
			}
			$('.forpm25').css("display", 'none');
			$modalChart.modal('show');
			$("#cube").removeClass('hidden');
			$("#plotter").addClass('hidden');
			var serieses = [];

			var parameters = {
				run_type: run_type,
				freq: freq,
				run_date: rd_type,
				var_type: var_type,
				interaction:interaction,
				geom_data: geom_data
			};

			MapService.getChartData(parameters)
			.then(function (result){
				if (interaction === "Station") {
					var values = result.data["field_data"];
					var forecast_values = result.data["bc_mlpm25"];
					var firstday = rd_type.substring(0, 4) + '-' + rd_type.substring(4, 6) + '-' + rd_type.substring(6, 8);
					var d1 = new Date(firstday);
					var date1 = d1.toISOString().split('T')[0];
					d1.setDate(d1.getDate() + 1);
					var d2 = new Date(firstday);
					d2.setDate(d2.getDate() + 2);
					var secondday = d1.toISOString().split('T')[0];
					var thirdday = d2.toISOString().split('T')[0];
					document.getElementById("day1_guage").innerHTML = date1;
					document.getElementById("day2_guage").innerHTML = secondday;
					document.getElementById("day3_guage").innerHTML = thirdday;

					field_day1_avg = 0;
					field_day2_avg = 0;
					field_day3_avg = 0;

					forecast_day1_avg = 0;
					forecast_day2_avg = 0;
					forecast_day3_avg = 0;
					var sum1 = 0;
					var sum2 = 0;
					var sum3 = 0;
					var count1 = 0, count2 = 0, count3 = 0;
					for (var i = 0; i < 8; i++) {
						if (values[i] !== -1) count1 = count1 + 1;
						if (values[i + 8] !== -1) count2 = count2 + 1;
						if (values[i + 16] !== -1) count3 = count3 + 1;

						sum1 = sum1 + (values[i] ? values[i][1] : 0);
						sum2 = sum2 + (values[i + 8] ? values[i + 8][1] : 0);
						sum3 = sum3 + (values[i + 16] ? values[i + 16][1] : 0);

					}
					field_day1_avg = sum1 / count1;
					field_day2_avg = sum2 / count2;
					field_day3_avg = sum3 / count3;
					sum1 = 0;
					sum2 = 0;
					sum3 = 0;
					count1 = 0;
					count2 = 0;
					count3 = 0;
					for (var j = 0; j < 8; j++) {
						if (j >= 2 && forecast_values[j] !== -1) {
							count1 = count1 + 1;
							sum1 = sum1 + (forecast_values[j] ? forecast_values[j][1] : 0);
						}
						if (forecast_values[j + 8] !== -1) count2 = count2 + 1;
						sum2 = sum2 + (forecast_values[j + 8] ? forecast_values[j + 8][1] : 0);
						if ((j + 16) < 22 && forecast_values[j + 16] !== -1) {
							count3 = count3 + 1;
							sum3 = sum3 + (forecast_values[j + 16] ? forecast_values[j + 16][1] : 0);
						}


					}
					forecast_day1_avg = sum1 / count1;
					forecast_day2_avg = sum2 / count2;
					forecast_day3_avg = sum3 / count3;

					gen_chart(field_day1_avg < 0 ? -1 : field_day1_avg, forecast_day1_avg < 0 ? -1 : forecast_day1_avg);
					document.getElementById("datevalue").innerHTML = document.getElementById("day1_guage").innerHTML;
					document.getElementById("fromd").innerHTML = document.getElementById("day1_guage").innerHTML+" 08:30";
					document.getElementById("tod").innerHTML = document.getElementById("day1_guage").innerHTML+" 23:30";
					$("#day1_guage").css("background-color", "#43a8c5");
					$("#day1_guage").css("color", "white");
					$("#day2_guage").css("background-color", "gray");
					$("#day2_guage").css("color", "white");
					$("#day3_guage").css("background-color", "gray");
					$("#day3_guage").css("color", "white");
				}

				var arr = [];
				var title = "";
				var index = find_var_index(var_type, var_options);
				var display_name = var_options[index]["display_name"] === "BC_MLPM25" ? "PM 2.5" : var_options[index]["display_name"];
				var units = var_options[index]["units"];
				if (units === 'mcgm-3') {
					units = '&micro;gm<sup>-3</sup>';
				}

				if (interaction === "Station") {
					document.getElementsByClassName("forpm25")[0].style.display = 'table';
					document.getElementsByClassName("forpm25")[1].style.display = 'table';
					document.getElementById("chartonly").style.width = '50%';
					document.getElementById("modalchart").style.width = "60%";
					document.getElementById("modalchart").style.display = "flex";
					document.getElementById("modalchart").style.alignItems = "center";
					document.getElementById("modalchart").style.justifyContent = "center";
					serieses = [
						{
							data: result.data["field_data"],
							name: "PM2.5 Measurement",
							color: "black"
						},
						{
							data: result.data["bc_mlpm25"],
							name: "PM2.5 Forecast",//
							color: "green"
						},
					];
					document.getElementById('pmlabel').style.display="block";
				} else {

					document.getElementsByClassName("forpm25")[0].style.display = 'none';
					document.getElementsByClassName("forpm25")[1].style.display = 'none';
					document.getElementById("chartonly").style.width = '100%';
					document.getElementById("modalchart").style.width = "";
					document.getElementById("modalchart").style.display = "";
					document.getElementById("modalchart").style.alignItems = "";
					document.getElementById("modalchart").style.justifyContent = "";
					serieses = [{
						data: result.data["plot"],
						name: display_name,
						color: "#2b5154",
						marker: {
							enabled: true,
							radius: 3
						}
					}];
					document.getElementById('pmlabel').style.display="none";
				}
				if (interaction === "Station") {

					arr = [{
						color: "#6ef0ff",
						from: 0,
						to: 25
					},
					{
						color: "#24cf1b",
						from: 25,
						to: 37
					},
					{
						color: "#eff213",
						from: 37,
						to: 50
					},
					{
						color: "#eda702",
						from: 50,
						to: 90
					},
					{
						color: "#ed1e02",
						from: 90,
						to: 200
					}];
					title = "PM2.5 values at " + titleforst;

				} else {
					arr = [];

					if(result.data["geom"][2]!==undefined)
					title = $scope.var_type + " values at Lat (min, max) - (" + result.data["geom"][0]+", "+result.data["geom"][2]+") and Lon (min, max) - ("+result.data["geom"][1]+", "+result.data["geom"][3] +")";
					else
					title = $scope.var_type + " values at Lat: " + result.data["geom"][0]+", Lon: "+result.data["geom"][1];

				}

				$('.error').html('');
				$('#plotter').highcharts({
					chart: {
						style: {
							fontFamily: 'Poppins'
						},
						type: 'spline',
						zoomType: 'x',
						events: {
							load: function () {
								var label = this.renderer.label("Graph dates and times are in Indochina Time(ICT)")
								.css({
									width: '400px',
									fontSize: '12px'
								})
								.attr({
									'stroke': 'silver',
									'stroke-width': 1,
									'r': 2,
									'padding': 5
								})
								.add();

								label.align(Highcharts.extend(label.getBBox(), {
									align: 'center',
									x: 20, // offset
									verticalAlign: 'bottom',
									y: 0 // offset
								}), null, 'spacingBox');

							}
						},
						paddingBottom: 50
					},
					credits: {
						enabled: false
					},
					tooltip: {
						backgroundColor: '#FCFFC5',
						borderColor: '#2b5154',
						borderRadius: 10,
						borderWidth: 3
					},
					title: {
						text: title,
						style: {
							fontSize: '14px'
						}
					},
					xAxis: {
						type: 'datetime',
						labels: {
							format: '{value: %Y-%m-%d}'
							// rotation: 45,
							// align: 'left'
						},
						title: {
							text: 'Date'
						}
					},
					legend: {
						align: 'center',
						verticalAlign: 'bottom',
						y: -25
					},
					yAxis: {
						title: {
							useHTML: true,
							text: units
						},
						plotBands: arr,

					},
					plotOptions: {
						series: {
							color: "#2b5154"
						}
					},
					exporting: {
						enabled: true
					},
					series: serieses

				});
				$("#cube").addClass('hidden');
				$("#plotter").removeClass('hidden');

			});

		};

		/**
		*********************** get time step*************************************
		*/
		get_times = function (rd_type) {
			$("#hour_table").html('');
			var freq = ($("#geos_freq_table option:selected").val());
			var run_type = ($("#geos_run_table option:selected").val());

			var parameters = {
				run_type: run_type,
				freq: freq,
				run_date: rd_type.split('/').reverse()[0]
			};

			MapService.get_time(parameters)
			.then(function (result){
				var times = result["times"];
				time_global = times[0];
				$("#hour_table").html('');
				times.forEach(function (time, i) {
					var date= new Date(time);
					date.setHours(date.getHours() + 7);
					var date_val = new Date(time);
					date_val.setHours(date_val.getHours());
					var date_value = date.setHours(date.getHours());
					var date_text = date.toISOString().replace('T', ' ').replace('.000Z', '');
					var opt = new Option(date_text, date_val.toISOString());

					date = converttimeZ(new Date($scope.selectedDate[0].split(" ")[0]));
					//var date = new Date($scope.selectedDate[0].split(" ")[0]);
					date.setDate(date.getDate());
					date = date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) +	'-' + (date.getDate() > 9 ? '' : '0') + date.getDate();
					var hour = date + ' ' + $scope.selectedDate[0].split(" ")[1].substring(0, 2) + ':30:00';
					var _time1 = new Date(date + ' ' +  $scope.selectedDate[0].split(" ")[1].substring(0, 2) + ':30:00');
					var _time2 = new Date(date + ' ' +  $scope.selectedDate[0].split(" ")[1].substring(0, 2) + ':30:00');
					_time1.setHours(_time1.getHours() - 1);
					_time2.setHours(_time2.getHours() + 1);

					_time1 = _time1.getFullYear() +	'-' + ((_time1.getMonth() + 1) > 9 ? '' : '0') + (_time1.getMonth() + 1) +	'-' + (_time1.getDate() > 9 ? '' : '0') + _time1.getDate() + ' ' + (_time1.getHours() > 9 ? '' : '0') + _time1.getHours()  + ':30:00';
					_time2 = _time2.getFullYear() +	'-' + ((_time2.getMonth() + 1) > 9 ? '' : '0') + (_time2.getMonth() + 1) +	'-' + (_time2.getDate() > 9 ? '' : '0') + _time2.getDate() + ' ' + (_time2.getHours() > 9 ? '' : '0') + _time2.getHours()  + ':30:00' ;
					//console.log(_time1, "  ", hour, "   ", _time2)
					if (date_text === _time1 || date_text === hour || date_text === _time2) {
						opt.selected = true;

						var run_type = ($("#geos_run_table option:selected").val());
						var freq = ($("#geos_freq_table option:selected").val());

						var rd_type = ($("#geos_rd_table option:selected").val());
						var z = rd_type.split('/').reverse()[0];
						var y = $("#date_selector").val();
						rd_type = rd_type.replace(z, y.replace('-', '').replace('-', '') + '.nc');

						var var_type = ($("#geos_var_table option:selected").val());
						var style = ($("#geos_style_table option:selected").val());
						var rmin = $("#geos_range-min").val();
						var rmax = $("#geos_range-max").val();
						add_wms(run_type, freq, rd_type, var_type, rmin, rmax, style, date_val.toISOString());
					}
					$("#hour_table").append(opt);
				});

				$("#hour_table").trigger('change');
			});
		};


		/**
		****************************************SELECT INPUTS are ON CHANGE***********************************************************************************
		*/

		$(function() {
			/**
			* AOD options
			*/
			$.each(thredds_options['catalog'],function(item,i){
				if(item.toUpperCase()!== "GEOS_TAVG1_2D_SLV_NX" && item.toUpperCase()!== "GEOS_TAVG3_2D_AER_NX" && item.toUpperCase()!== "GEOS" && item.toUpperCase()!== "FIRE"){
					var new_option = new Option(item.toUpperCase(),item);
					$("#aod_run_table").append(new_option);
				}
			});

			$("#aod_run_table").change(function(){
				var run_type = ($("#aod_run_table option:selected").val());
				$("#aod_freq_table").html('');
				$("#aod_var_table").html('');
				var_options.forEach(function(item,i){
					if(item["category"] === run_type){
						var option = new Option(item["display_name"],item["id"]);
						$("#aod_var_table").append(option);
					}
				});
				$.each(thredds_options['catalog'][run_type],function(item,i){
					if (item === 'combined'){
						var new_option = new Option(item,item);
						$("#aod_freq_table").append(new_option);
					}
				});
				$("#aod_freq_table").trigger('change');


				thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
					var opt = item.split('/').reverse()[0];
					opt = opt.split('.')[1];
					var newdate = opt.substring(0, 4) + '-' + opt.substring(4, 6);
					enableDates_aod.push(newdate);
				});

				for (var i = 0; i < enableDates_aod.length; i++) {
					var dt = enableDates_aod[i];
					if(enableYearsAODArray.indexOf(parseInt(dt.split('-')[0])) < 0) {
						enableYearsAODArray.push(parseInt(dt.split('-')[0]));
					}
					var dd, mm, yyy;
					if (parseInt(dt.split('-')[1]) <= 9) {
						mm = parseInt(dt.split('-')[1]);
						yyy = dt.split('-')[0];
						enableMonthsAODArray.push(yyy + '-' + mm);
					}
					else {
						enableMonthsAODArray.push(dt);
					}
				}

				$("#date_selector_aod").datepicker("destroy");
				$('#date_selector_aod').datepicker({
					beforeShowYear: function (date) {
						var yyyy = date.getFullYear();
						if (enableYearsAODArray.indexOf(yyyy) !== -1) {
							return {
								tooltip: 'There is data available',
								classes: 'active'
							};
						} else {
							return false;
						}
					},
					beforeShowMonth: function (date) {
						var mmyyyy = date.getFullYear() + '-' + (date.getMonth() + 1);
						if (enableMonthsAODArray.indexOf(mmyyyy) !== -1) {
							return {
								tooltip: 'There is data available',
								classes: 'active'
							};
						} else {
							return false;
						}
					}
				});
				$("#date_selector_aod").datepicker("setDate", enableMonthsAODArray[0]);


			}).change();

			$("#aod_freq_table").change(function(){
				var freq = ($("#aod_freq_table option:selected").val());
				var run_type = ($("#aod_run_table option:selected").val());
				$("#aod_rd_table").html('');
				$("#aod_var_table").html('');
				if(thredds_options['catalog'][run_type][freq]){
					thredds_options['catalog'][run_type][freq].forEach(function(item,i){
						var opt = item.split('/').reverse()[0];
						var new_option = new Option(opt,item);
						$("#aod_rd_table").append(new_option);
					});
				}
				$("#aod_rd_table").trigger('change');

			}).change();

			$("#aod_rd_table").change(function(){
				var freq = ($("#aod_freq_table option:selected").val());
				var run_type = ($("#aod_run_table option:selected").val());
				var rd_type = ($("#aod_rd_table option:selected").val());
				$("#aod_var_table").html('');
				var_options.forEach(function(item,i){
					if(item["category"] === run_type){
						var new_option = new Option(item["display_name"],item["id"]);
						$("#aod_var_table").append(new_option);
					}
				});
				$("#aod_var_table").trigger('change');
			}).change();

			$("#aod_var_table").change(function(){
				var var_type = ($("#aod_var_table option:selected").val());
				var index = find_var_index(var_type,var_options);
				$("#aod_range-min").val(var_options[index]["min"]);
				$("#aod_range-max").val(var_options[index]["max"]).trigger('change');
			}).change();

			$("#aod_range-max").on('change',function(){
				var run_type = ($("#aod_run_table option:selected").val());
				var freq = ($("#aod_freq_table option:selected").val());
				var datetime = $("#date_selector_aod").val().replace('-','');
				var var_type = ($("#aod_var_table option:selected").val());
				var style =  ($("#aod_style_table option:selected").val());
				var rmin = $("#aod_range-min").val();
				var rmax = $("#aod_range-max").val();
				time_global = "";
				var parameter_url = "";
				var rd_type = "";
				if(run_type.toUpperCase() === 'AOD_AQUA'){
					parameter_url = "mk_aqx/" + run_type;
					rd_type = parameter_url + "/MYD04_L2."+ datetime +".MEKONG.nc";
				}
				if(run_type.toUpperCase() === 'AOD_TERRA'){
					parameter_url = "mk_aqx/"+ run_type;
					rd_type = parameter_url + "/MOD04_L2."+ datetime +".MEKONG.nc";
				}
				add_wms(run_type,freq,rd_type,var_type,rmin,rmax,style);
			}).change();

			//update the AOD wms layer when user change the date selector
			$("#date_selector_aod").change(function(){
				$("#aod_range-max").trigger('change');
			});

			$("#aod_style_table").change(function () {
				var style = ($("#aod_style_table option:selected").val());
				$("#aod_range-max").trigger('change');
			}).change();

			/**
			* GEOS options
			*/
			$.each(thredds_options['catalog'],function(item,i){
				// if(item.toUpperCase() === "GEOS_TAVG1_2D_SLV_NX" || item.toUpperCase() === "GEOS_TAVG3_2D_AER_NX" || item.toUpperCase() === "GEOS" ){
				if(item.toUpperCase() === "GEOS" ){
					var new_option = new Option(item.toUpperCase(),item);
					$("#geos_run_table").append(new_option);
				}
			});

			$("#geos_run_table").change(function(){
				var run_type = ($("#geos_run_table option:selected").val());
				$("#geos_freq_table").html('');
				$("#geos_var_table").html('');
				$("#lrd_table").html('');
				$("#rrd_table").html('');
				$("#lvar_table").html('');
				$("#rvar_table").html('');
				var new_option = "";
				$.each(thredds_options['catalog'][run_type], function (item, i) {
					if ((item === '3dayrecent') && (run_type === "geos")) {

						new_option = new Option(item, item);
						$("#geos_freq_table").append(new_option);
					} else if (item === 'combined') {
						new_option = new Option(item, item);
						$("#geos_freq_table").append(new_option);
					}
				});
				$("#geos_freq_table").trigger('change');
				var runDateOption = thredds_options['catalog'][run_type]['3dayrecent'];
				if (runDateOption) {
					runDateOption.forEach(function (item, i) {
						var opt = item.split('/').reverse()[0];
						var new_option = new Option(opt, item);
						var noption = new Option(opt, item);
						$("#lrd_table").append(new_option);
						$("#rrd_table").append(noption);
					});
				}

				var_options.forEach(function (item, i) {
					var noption= "";
					var new_option ="";
					if (item["category"] === run_type) {

						if(item["display_name"] === "BC_MLPM25"){
							noption = new Option("PM 2.5", item["id"]);
							new_option = new Option(item["display_name"]);
						}else{
							noption = new Option(item["display_name"], item["id"]);
							new_option = new Option(item["display_name"]);
						}

						$("#lvar_table").append(new_option);
						$("#rvar_table").append(noption);
					}
				});
			}).change();

			$("#geos_freq_table").change(function(){
				var freq = $("#geos_freq_table option:selected").val();
				var run_type = $("#geos_run_table option:selected").val();
				$("#geos_rd_table").html('');
				$("#geos_var_table").html('');
				if(thredds_options['catalog'][run_type][freq]){
					thredds_options['catalog'][run_type][freq].forEach(function (item, i) {

						var opt = item.split('/').reverse()[0];
						var new_option = new Option(opt,item);
						$("#geos_rd_table").append(new_option);
					});
					$("#geos_rd_table").trigger('change');
				}
			}).change();

			$("#geos_rd_table").change(function(){
				$("#date_table").empty();
				$("#hour_table").empty();
				var freq = ($("#geos_freq_table option:selected").val());
				var run_type = ($("#geos_run_table option:selected").val());
				var rd_type = ($("#geos_rd_table option:selected").val());
				var str = rd_type.split('/').reverse()[0];

				thredds_options['catalog'][run_type][freq].forEach(function (item, i) {

					var opt = item.split('/').reverse()[0];
					var newdate = opt.substring(0, 4) + '-' + opt.substring(4, 6) + '-' + opt.substring(6, 8);
					enableDates.push(newdate);
					if (run_type === "geos") {
						var new_option2 = new Option(newdate, item);

						$("#date_table").append(new_option2);
					}
				});

				$("#geos_var_table").html('');

				var_options.forEach(function (item, i) {
					if (item["category"] === run_type) {
						var value = item["display_name"] === "BC_MLPM25" ? "PM 2.5" : item["display_name"];
						var new_option = new Option(value, item["id"]);
						$("#geos_var_table").append(new_option);
						if (item["id"].toUpperCase() === "BC_MLPM25") {
							new_option.selected = true;
						}
					}
				});

				$("#geos_var_table").trigger('change');
			}).change();


			var recent_date = enableDates[0];
			$("#date_selector_fire").datepicker("destroy");
			$('#date_selector_fire').datepicker({
				beforeShowYear: function (date) {
					var yyyy = date.getFullYear();
					if (enableYearsFireArray.indexOf(yyyy) !== -1) {
						return {
							tooltip: 'There is data available',
							classes: 'active'
						};
					} else {
						return false;
					}
				},
				beforeShowMonth: function (date) {
					var mmyyyy = date.getFullYear() + '-' + (date.getMonth() + 1);
					if (enableMonthsFireArray.indexOf(mmyyyy) !== -1) {
						return {
							tooltip: 'There is data available',
							classes: 'active'
						};
					} else {
						return false;
					}
				}
			});

			$("#date_selector_fire").datepicker("setDate", enableMonthsFireArray[0]);

			$("#date_selector").datepicker("destroy");
			for (var i = 0; i < enableDates.length; i++) {
				var dt = enableDates[i];
				var dd, mm, yyy;
				if (parseInt(dt.split('-')[0]) >= 2020 ){
					enableDatesArraySlide.push(dt);
				}
				if (parseInt(dt.split('-')[2]) <= 9 || parseInt(dt.split('-')[1]) <= 9) {
					dd = parseInt(dt.split('-')[2]);
					mm = parseInt(dt.split('-')[1]);
					yyy = dt.split('-')[0];
					enableDatesArray.push(yyy + '-' + mm + '-' + dd);
				}
				else {
					enableDatesArray.push(dt);
				}
			}

			$('#date_selector').datepicker({
				beforeShowDay: function (date) {
					var dt_ddmmyyyy = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() ;
					if (enableDatesArray.indexOf(dt_ddmmyyyy) !== -1) {
						return {
							tooltip: 'There is data available',
							classes: 'active'
						};
					} else {
						return false;
					}
				}
			});
			var ddate, mmonth, yyear, setDate;
			if (parseInt(recent_date.split('-')[2]) <= 9 || parseInt(recent_date.split('-')[1]) <= 9) {
				ddate = parseInt(recent_date.split('-')[2]);
				mmonth = parseInt(recent_date.split('-')[1]);
				yyear = recent_date.split('-')[0];
				setDate = yyear + '-' + mmonth + '-' + ddate;
			}
			$("#date_selector").datepicker("setDate", setDate);
			default_forecastDate = $("#date_selector").val();
			//$("#date_selector").trigger("change");

			$("#date_selector").change(function () {

				var run_type = ($("#geos_run_table option:selected").val());
				if (run_type === "geos") {
					var datestr = ($("#date_table option:selected").val().split('/').reverse()[0]);
					datestr = datestr.substring(0, 4) + '-' + datestr.substring(4, 6) + '-' + datestr.substring(6, 8);
					//$('#info').text("Displaying " + datestr + " data on the map..");

				}
				var freq = ($("#geos_freq_table option:selected").val());
				var rd_type = ($("#geos_rd_table option:selected").val());
				var z = rd_type.split('/').reverse()[0];
				var y = ($("#date_selector").val());
				rd_type = rd_type.replace(z, y.replace('-', '').replace('-', '') + '.nc');
				var var_type = ($("#geos_var_table option:selected").val());
				var style = ($("#geos_style_table option:selected").val());
				//update_style(style);
				var rmin = $("#geos_range-min").val();
				var rmax = $("#geos_range-max").val();
				//add_wms(run_type, freq, rd_type, var_type, rmin, rmax, style, datestr + 'T01:30:00Z');
				$("#hour_table").html('');
				get_times(rd_type);
				//$scope.changeTimeSlider();
			});

			$("#hour_table").change(function () {
				$scope.getPCDStation();
				var dd = document.getElementById('hour_table');
				var date_arr = [];
				for (var i = 0; i < dd.options.length; i++) {
					date_arr.push(dd.options[i].text);
				}
				var run_type = ($("#geos_run_table option:selected").val());
				var freq = ($("#geos_freq_table option:selected").val());
				var rd_type = ($("#geos_rd_table option:selected").val());
				var z = rd_type.split('/').reverse()[0];
				var y = ($("#date_selector").val());
				rd_type = rd_type.replace(z, y.replace('-', '').replace('-', '') + '.nc');
				var var_type = ($("#geos_var_table option:selected").val());
				var style = ($("#geos_style_table option:selected").val());
				var rmin = $("#geos_range-min").val();
				var rmax = $("#geos_range-max").val();
				add_wms(run_type, freq, rd_type, var_type, rmin, rmax, style, ($("#hour_table option:selected").val()));

			});

			$("#geos_var_table").change(function(){
				var var_type = ($("#geos_var_table option:selected").val());
				var index = find_var_index(var_type,var_options);
				$("#geos_range-min").val(var_options[index]["min"]);
				$("#geos_range-max").val(var_options[index]["max"]).trigger('change');

			}).change();

			$("#geos_range-max").on('change',function(){
				var run_type = ($("#geos_run_table option:selected").val());
				var freq = ($("#geos_freq_table option:selected").val());
				var rd_type = ($("#geos_rd_table option:selected").val());
				var var_type = ($("#geos_var_table option:selected").val());
				var style = ($("#geos_style_table option:selected").val());
				var rmin = $("#geos_range-min").val();
				var rmax = $("#geos_range-max").val();
				$scope.changeTimeSlider();

			});

			$("#geos_style_table").change(function () {
				var style = ($("#geos_style_table option:selected").val());
				$("#geos_range-max").trigger('change');
			}).change();

			/**
			* Fire options
			*/
			$.each(thredds_options['catalog']['fire'],function(item,i){
				if (item === 'combined'){
					var new_option = new Option(item,item);
					$("#fire_freq_table").append(new_option);
				}
			});
			$("#fire_freq_table").change(function(){
				var freq = ($("#fire_freq_table option:selected").val());
				$("#fire_rd_table").html('');
				if(thredds_options['catalog']['fire'][freq]){
					thredds_options['catalog']['fire'][freq].forEach(function(item,i){
						var opt = item.split('/').reverse()[0];
						var new_option = new Option(opt,item);
						$("#fire_rd_table").append(new_option);
					});
				}
				$("#fire_rd_table").trigger('change');

			}).change();

			$("#fire_freq_table").trigger('change');

			var_options.forEach(function(item,i){
				if(item["category"] === 'fire'){
					var new_option = new Option(item["display_name"],item["id"]);
					$("#fire_var_table").append(new_option);
				}
			});

			$("#fire_var_table").change(function(){
				var var_type = ($("#fire_var_table option:selected").val());
				var index = find_var_index(var_type,var_options);
				$("#fire_range-min").val(var_options[index]["min"]);
				$("#fire_range-max").val(var_options[index]["max"]).trigger('change');
			}).change();

			//update Fire WMS layer when fire range max value is change
			$("#fire_range-max").on('change',function(){
				var freq = ($("#fire_freq_table option:selected").val());
				var parameter_url = "mk_aqx/fire/";
				var datetime = $("#date_selector_fire").val().replace('-','');
				var rd_type = parameter_url + "MCD14ML."+ datetime +"..MEKONG.nc";
				var var_type = ($("#fire_var_table option:selected").val());
				var style =  ($("#fire_style_table option:selected").val());
				var rmin = $("#fire_range-min").val();
				var rmax = $("#fire_range-max").val();
				time_global = "";
				add_wms('fire',freq,rd_type,var_type,rmin,rmax,style);
			}).change();


			//update Fire WMS layer when user change the date selector
			$("#date_selector_fire").change(function(){
				$("#fire_range-max").trigger("change");
			});


			$("#fire_style_table").change(function () {
				var style = ($("#fire_style_table option:selected").val());
				$("#fire_range-max").trigger('change');
			}).change();


			$.each(thredds_options['catalog'], function(item,i){
				if (item.toUpperCase() !== "GEOS_TAVG1_2D_SLV_NX" && item.toUpperCase() !== "GEOS_TAVG3_2D_AER_NX") {
					var new_option = new Option(item.toUpperCase(),item);
					var noption = new Option(item.toUpperCase(),item);
					var noption2 = new Option(item.toUpperCase(),item);
					$("#lrun_table").append(noption);
					$("#rrun_table").append(noption2);
				}
			});

			$("#lrun_table").change(function(){
				var run_type = ($("#lrun_table option:selected").val());
				$("#lrd_table").html('');
				$("#lvar_table").html('');
				if(run_type==="geos"){
					if (thredds_options['catalog'][run_type]['3dayrecent']) {
						thredds_options['catalog'][run_type]['3dayrecent'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							var new_option = new Option(opt, item);
							$("#lrd_table").append(new_option);
						});
					}
				}else{
					if (thredds_options['catalog'][run_type]['monthly']) {
						thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							var new_option = new Option(opt, item);
							$("#lrd_table").append(new_option);
						});
					}
				}

				var_options.forEach(function (item, i) {
					var new_option = "";
					if (item["category"] === run_type) {
						if(item["display_name"] === "BC_MLPM25"){
							new_option = new Option("PM 2.5", item["id"]);
						}else{
							new_option = new Option(item["display_name"], item["id"]);
						}

						$("#lvar_table").append(new_option);
					}
				});
				$("#lvar_table").trigger('change');

			}).change();

			$("#rrun_table").change(function(){
				var run_type = ($("#rrun_table option:selected").val());
				$("#rrd_table").html('');
				$("#rvar_table").html('');
				if(run_type==="geos"){
					if (thredds_options['catalog'][run_type]['3dayrecent']) {
						thredds_options['catalog'][run_type]['3dayrecent'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							var new_option = new Option(opt, item);
							$("#rrd_table").append(new_option);
						});
					}
				}else{
					if (thredds_options['catalog'][run_type]['monthly']) {
						thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							var new_option = new Option(opt, item);
							$("#rrd_table").append(new_option);
						});
					}
				}
				var_options.forEach(function (item, i) {
					var new_option = "";
					if (item["category"] === run_type) {
						if(item["display_name"] === "BC_MLPM25"){
							new_option = new Option("PM 2.5", item["id"]);
						}else{
							new_option = new Option(item["display_name"], item["id"]);
						}
						$("#rvar_table").append(new_option);
					}
				});
				$("#rvar_table").trigger('change');

			}).change();

			$("#lvar_table").change(function(){
				var var_type = ($("#lvar_table option:selected").val());
				var index = find_var_index(var_type,var_options);
				$("#lrange-min").val(var_options[index]["min"]);
				$("#lrange-max").val(var_options[index]["max"]);
			}).change();

			$("#rvar_table").change(function(){
				var var_type = ($("#rvar_table option:selected").val());
				var index = find_var_index(var_type,var_options);
				$("#rrange-min").val(var_options[index]["min"]);
				$("#rrange-max").val(var_options[index]["max"]);
			}).change();

			/**
			***************************************************************************************************************************
			*/


			/**
			* Downloading Air Quality products
			*/
			$("#btn-download-fire").click(function(){
				var fileUrl = threddss_wms_url.replace('wms','fileServer');
				// /thredds/fileServer/mk_aqx/fire/MCD14ML.201810..MEKONG.nc
				var filename = 'MCD14ML.'+($("#date_selector_fire").val().replace('-',''))+'..MEKONG.nc';
				var downUrl = fileUrl+'mk_aqx/fire/'+filename;
				console.log(downUrl);
				window.location = (downUrl);
			});
			$("#btn-download-aod").click(function(){
				var fileUrl = threddss_wms_url.replace('wms','fileServer');
				var run_type = $("#aod_run_table option:selected").val();
				var filename = "";
				if(run_type==='aod_terra'){
					// /thredds/fileServer/mk_aqx/aod_aqua/MYD04_L2.201902.MEKONG.nc
					filename = 'MOD04_L2.'+($("#date_selector_aod").val().replace('-',''))+'.MEKONG.nc';
				}else{
					// /thredds/fileServer/mk_aqx/aod_terra/MOD04_L2.201801.MEKONG.nc
					filename = 'MYD04_L2.'+($("#date_selector_aod").val().replace('-',''))+'.MEKONG.nc';
				}

				var downUrl = fileUrl+'mk_aqx/'+run_type+'/'+filename;
				console.log(downUrl);
				window.location = (downUrl);
			});
			$("#btn-download-geos").click(function(){
				var fileUrl = threddss_wms_url.replace('wms','fileServer');
				var rd_type = ($("#geos_rd_table option:selected").val());
				var z = rd_type.split('/').reverse()[0];
				var y = ($("#date_selector").val());
				rd_type = rd_type.replace(z, y.replace('-', '').replace('-', '') + '.nc');
				var downUrl = fileUrl+rd_type;
				window.location = (downUrl);
			});


			/**
			*******************************Layers transparent *******************************
			*/
			$("#opacity-slider").on("slide", function(e) {
				$("#OpacityVal").text(e.value);
				opacity = e.value;
				tdWmsFireLayer.setOpacity(opacity);
			});

			$("#opacity-slider-aod").on("slide", function(e) {
				$("#OpacityVal2").text(e.value);
				opacity = e.value;
				tdWmsAODLayer.setOpacity(opacity);
			});

			$("#opacity-slider-geos").on("slide", function(e) {
				$("#OpacityVal3").text(e.value);
				opacity = e.value;
				tdWmsGEOSLayer.setOpacity(opacity);
			});

			/**
			******************************** legend controller *******************************
			*/
			$(".legend-info-button").click(function () {
				$(".legend-tabs").toggle();
				$("#legend-content").toggle();
				if ($("#legend-content").is(":visible") === true) {
					$("#legend-collapse").css("display","inline-block");
					$("#legend-expand").css("display","none");
				}
				else {
					$("#legend-collapse").css("display","none");
					$("#legend-expand").css("display","inline-block");
				}
			});
			$("#btn-print").click(function () {
				var modeToUse = L.control.browserPrint.mode.auto();
				map.printControl.print(modeToUse);
			});

			/**
			******************************** *******************************
			*/
			$("#day1_guage").click(function () {
				gen_chart(field_day1_avg < 0 ? -1 : field_day1_avg, forecast_day1_avg < 0 ? -1 : forecast_day1_avg);
				document.getElementById("datevalue").innerHTML = document.getElementById("day1_guage").innerHTML;
				document.getElementById("fromd").innerHTML = document.getElementById("day1_guage").innerHTML+" 08:30";
				document.getElementById("tod").innerHTML = document.getElementById("day1_guage").innerHTML+" 23:30";
				$(this).css("background-color", "#43a8c5");
				$("#day2_guage").css("background-color", "gray");
				$("#day3_guage").css("background-color", "gray");
			});
			/**
			**************************************************************
			*/
			$("#day2_guage").click(function () {
				gen_chart(field_day2_avg < 0 ? -1 : field_day2_avg, forecast_day2_avg < 0 ? -1 : forecast_day2_avg);
				document.getElementById("datevalue").innerHTML = document.getElementById("day2_guage").innerHTML;
				document.getElementById("fromd").innerHTML = document.getElementById("day2_guage").innerHTML+" 02:30";
				document.getElementById("tod").innerHTML = document.getElementById("day2_guage").innerHTML+" 23:30";
				$(this).css("background-color", "#43a8c5");
				$("#day1_guage").css("background-color", "gray");
				$("#day3_guage").css("background-color", "gray");
			});
			/**
			***************************************************************
			*/
			$("#day3_guage").click(function () {
				gen_chart(field_day3_avg < 0 ? -1 : field_day3_avg, forecast_day3_avg < 0 ? -1 : forecast_day3_avg);
				document.getElementById("datevalue").innerHTML = document.getElementById("day3_guage").innerHTML;
				document.getElementById("fromd").innerHTML = document.getElementById("day3_guage").innerHTML+" 02:30";
				document.getElementById("tod").innerHTML = document.getElementById("day3_guage").innerHTML+" 23:30";
				$(this).css("background-color", "#43a8c5");
				$("#day2_guage").css("background-color", "gray");
				$("#day1_guage").css("background-color", "gray");
			});


			/**
			* hide leaflet print controller
			*/
			$("a[title='Air quality Print']").css("display", "none");

			/**
			******************************** Animation controller (play/stop) *******************************
			*/
			$("#btn-play").click(function(){
				$scope.showPlayButton = false;
				$scope.showPauseButton = true;
				$scope.runDateonNoUIslider = '';
				$scope.$apply();
				playLoop = 0;
				playAnimation();
			});
			$("#btn-stop").click(function(){
				$scope.showPlayButton = true;
				$scope.showPauseButton = false;
				$scope.runDateonNoUIslider = $scope.lastDateonNoUIslider;
				$scope.$apply();

			});


			/**
			******************************** tab controller ********************************
			*/
			$("#tab-fire").click(function () {
				$("#legend-tab-fire").css("display", "block");
				$("#legend-tab-aod").css("display", "none");
				$("#legend-tab-geos").css("display", "none");
				$("#tab-fire").addClass("active");
				$("#tab-aod").removeClass("active");
				$("#tab-geos").removeClass("active");
			});
			$("#tab-aod").click(function () {
				$("#legend-tab-fire").css("display", "none");
				$("#legend-tab-aod").css("display", "block");
				$("#legend-tab-geos").css("display", "none");
				$("#tab-aod").addClass("active");
				$("#tab-fire").removeClass("active");
				$("#tab-geos").removeClass("active");
			});
			$("#tab-geos").click(function () {
				$("#legend-tab-geos").css("display", "block");
				$("#legend-tab-fire").css("display", "none");
				$("#legend-tab-aod").css("display", "none");
				$("#tab-geos").addClass("active");
				$("#tab-fire").removeClass("active");
				$("#tab-aod").removeClass("active");
			});

			/**
			********************************* tab defualt (showing GEOS panel as the defualt)********************************
			*/
			$("#tab-geos").click();
		});
	});
})();
