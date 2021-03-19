(function () {
	'use strict';
	angular.module('baseApp')
	.controller('pm25-airexplorer' ,function ($scope, $timeout, MapService, appSettings) {

		/* global variables to be tossed around like hot potatoes */
		$scope.initdate = '';
		$scope.stylesSelectors = appSettings.stylesSelectors;
		$scope.showTimeSlider = true;
		$scope.toggle_pcd = true;
		$scope.toggle_geos = true;
		$scope.showPlayButton = false;
		$scope.showPauseButton = false;
		$scope.var_type = 'PM 2.5';
		$scope.showLoader = true;

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
		fire_24,
		fire_48,
		time_global, titleforst, coordinates, selectforGIF, guage_val, field_day1_avg, field_day2_avg, field_day3_avg,
		forecast_day1_avg, forecast_day2_avg, forecast_day3_avg, sum1 = 0, sum2 = 0,
		enableDates=[],
		sum3 = 0;

		var enableDatesArray=[];
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
		var initStation = false;

		/**
		* Menu tab active class
		*/
		//add active class to PM2.5 FORECASTING tab
		$("#menu-mapviewer").addClass("tab-active");
		//remove active class on HOME tab
		$("#menu-home").removeClass("tab-active");
		$("#analysis-tab").hide();
		//remove active class on  ANALYSIS tab
		$("#menu-map").removeClass("tab-active");

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

				// disable toolbar item by setting it to false
				polyline: false,
				circle: false, // Turns off this drawing tool
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


		//Active Fire Firms icon_src
		var firmIcon = "https://earthdata.nasa.gov/media/firms-google-earth-fire-icon.png";
		var firmCustomIcon = "https://aqatmekong-servir.adpc.net/static/images/fire-firms.png";





		/**
		* tabs controller
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
		$("#btn_toggle_stations_avg24hr").on('change', function() {
			$scope.showLoader = true;
			if ($(this).is(':checked')) {
				map.removeLayer(markersLayer);
				$scope.get24hoursPCDStation();
				$('#btn_toggle_stations_hourly').prop('checked', false); // Unchecks btn_toggle_stations_hourly
				$('.pm25-legendnew').css('display', 'block');
				$('.geos-legend').css('display', 'none');
				$("#geos_style_table").val("pm25");

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

			}
			else {
				map.removeLayer(markersLayer);
			}
		});

		$("#btn_toggle_stations_hourly").on('change', function() {
			$scope.showLoader = true;
			if ($(this).is(':checked')) {
				map.removeLayer(markersLayer);
				$('#btn_toggle_stations_avg24hr').prop('checked', false); // Unchecks btn_toggle_stations_avg24hr
				$('.pm25-legendnew').css('display', 'none');
				$('.geos-legend').css('display', 'block');
				$("#geos_style_table").val("browse");
				$("#hour_table").trigger('change');

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

		$("#toggle_fire_24").on('click', function() {
			if(map.hasLayer(fire_24)){
				map.removeControl(fire_24);
			}
			if ($(this).is(':checked')) {
				$scope.showLoader = true;
				map.addLayer(fire_24);
			}
		});
		$("#toggle_fire_48").on('click', function() {
			if(map.hasLayer(fire_48)){
				map.removeControl(fire_48);
			}
			if ($(this).is(':checked')) {
				map.addLayer(fire_48);
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

		$('#geos_tab').click(function(){
			var opacity = $("#opacity-slider-geos").val();
			tdWmsGEOSLayer.setOpacity(opacity);
			$scope.showTimeSlider = true;
			$scope.var_type = 'PM 2.5';
			$scope.toggle_geos = true;
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
			$scope.showLoader = true;
			initStation = false;
			if(map.hasLayer(markersLayer)){
				markersLayer.clearLayers();
			}
			if(map.hasLayer(tdWmsGEOSLayer)){
				map.removeLayer(tdWmsGEOSLayer);
			}
			$('.pm25-legendnew').css('display', 'block');
			$('.geos-legend').css('display', 'none');
			$("#geos_style_table").val("pm25");
			$("#date_selector").datepicker("setDate", default_forecastDate);

			map.setView([15.8700, 100.9925], 6);
		});

		/**
		* hide the logo banding and expand map to full screen mode
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
				}else{
					$modalCompare.modal('show');
				}
			}
		});

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
		* set style options
		*/
		style_options.forEach(function(item,i){
			var display_txt = Object.keys(item)[0];
			var value_txt = Object.values(item)[0];
			var roption = new Option(display_txt,value_txt);
			var loption = new Option(display_txt,value_txt);
			var geosoption = new Option(display_txt,value_txt);
			$("#rstyle_table").append(roption);
			$("#lstyle_table").append(loption);
			$("#geos_style_table").append(geosoption);
			if (value_txt.toUpperCase() === "PM25") {
				geosoption.selected = true;
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

		// --------------------------------------------------------------------------------------------------------------------------------------

		/**
		* get 24 average PCD data from the database
		**/

		$scope.get24hoursPCDStation = function () {
			initStation = true;
			MapService.get24hStations()
			.then(function (result){
				var pcdstations = JSON.parse(result);
				stations = [];
				for(var i=0; i<pcdstations.length; i++){
					stations.push({
						'rid': i,
						'aqi': pcdstations[i]["AQILast"]["AQI"]["aqi"],
						'aqi_level': pcdstations[i]["AQILast"]["AQI"]["color_id"],
						'lat':  pcdstations[i]["lat"],
						'lon': pcdstations[i]["long"],
						'latest_date':pcdstations[i]["AQILast"]["date"]+ " " + pcdstations[i]["AQILast"]["time"],
						'name':pcdstations[i]["nameEN"],
						'pm25':pcdstations[i]["AQILast"]["PM25"]["value"],
						'station_id':pcdstations[i]["stationID"],
					});
				}
				addStations('24hr');
			});
		};

		/**
		* get PCD data from the database
		**/
		$scope.getPCDStation = function () {
			var date = new Date($scope.selectedDate);
			$scope.selectedDate = [date.getFullYear() +	'-' + ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) +	'-' + (date.getDate() > 9 ? '' : '0') + date.getDate() + ' ' + (date.getHours() > 9 ? '' : '0') + date.getHours() + ':00:00'];
			var selected_date = $("#hour_table option:selected").text();
			selected_date = selected_date.replace(":30:00", ":00:00");
			var parameters = {
				obs_date: selected_date
			};
			MapService.getAirStations(parameters)
			.then(function (result){
				stations = result;
				addStations('hourly');
			});
		};

		/**
		* update dropdown list option when the time slider is changed
		**/
		$scope.changeTimeSlider = function () {
			//$scope.getPCDStation();
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
		*******************************************************OPACITY SLIDER********************************************************************************
		**/
		var init_opacity_slider = function(){
			opacity = 1;
			$("#opacity").text(opacity);
			$( "#opacity-slider-geos" ).bootstrapSlider({
				value: opacity,
				min: 0.0,
				max: 1,
				step: 0.1, //Assigning the slider step based on the depths that were retrieved in the controller
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

		function addStations(type){
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

				if(type === 'hourly'){
					if(pm2_val>90){
						color="#ed1e02";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'pink',
							shape: 'penta',
							prefix: 'fa'
						});
					}
					else if(pm2_val>80 && pm2_val<=90){
						color="#eda702";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'violet',
							shape: 'penta',
							prefix: 'fa'
						});
					}
					else if(pm2_val>70 && pm2_val<=80){
						color="#eff213";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'purple',
							shape: 'penta',
							prefix: 'fa',
						});

					}else if(pm2_val>60 && pm2_val<=70){
						color="#24cf1b";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'cyan',
							shape: 'penta',
							prefix: 'fa'
						});
					}else if(pm2_val>50 && pm2_val<=60){
						color="#6ef0ff";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'blue',
							shape: 'penta',
							prefix: 'fa'
						});
					}
					else if(pm2_val>40 && pm2_val<=50){
						color="#6ef0ff";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'blue-dark',
							shape: 'penta',
							prefix: 'fa'
						});
					}
					else if(pm2_val>30 && pm2_val<=40){
						color="#6ef0ff";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'yellow',
							shape: 'penta',
							prefix: 'fa'
						});
					}
					else if(pm2_val>20 && pm2_val<=30){
						color="#6ef0ff";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'orange',
							shape: 'penta',
							prefix: 'fa',
						});
					}
					else if(pm2_val>10 && pm2_val<=20){
						color="#6ef0ff";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'orange-dark',
							shape: 'penta',
							prefix: 'fa',
							iconColor: '#333'
						});
					}
					else if(pm2_val>=0 && pm2_val<=10){
						color="#6ef0ff";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'red',
							shape: 'penta',
							prefix: 'fa',
							iconColor: '#333'
						});
					}
				}else{
					if(pm2_val>90){
						color="#ed1e02";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'orange-dark',
							shape: 'square',
							prefix: 'fa',
						});
					}
					else if(pm2_val>50 && pm2_val<91){
						color="#eda702";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'orange',
							shape: 'square',
							prefix: 'fa',
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
							iconColor: '#333'
						});

					}else if(pm2_val>25 && pm2_val<38){
						color="#24cf1b";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'green-light',
							shape: 'square',
							prefix: 'fa',
						});
					}else if(pm2_val>=0 && pm2_val<26){
						color="#6ef0ff";
						myIcon = L.ExtraMarkers.icon({
							icon: 'fa-number',
							number: pm2_val,
							markerColor: 'blue-dark',
							shape: 'square',
							prefix: 'fa',
							iconColor: '#333'
						});
					}
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

			map.addLayer(markersLayer);
			$scope.showLoader = false;
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
			$("#btn_toggle_geos").prop('checked', true);
			var wmsUrl = threddss_wms_url+run_date;
			wms_layer=wmsUrl;
			run_type = run_type.toUpperCase();
			if(run_type === 'GEOS'){
				if(map.hasLayer(tdWmsGEOSLayer)){
					map.removeLayer(tdWmsGEOSLayer);
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

			var opacity_geos = Number($('#opacity-slider-geos').val());

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

		};

		/**
		* layers comparing function
		*/
		add_compare = function(){
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
			//	compare.addTo(map);

		};

		/**
		* open compare layers popup
		*/
		$("#btn-add-compare").on('click',add_compare);
		$("#btn-close-compare").on('click', function(){
			$modalCompare.modal('hide');
		});


		//add_wms('fire','freq',rd_type,'Number_Of_Fires_All',0,50,'rainbow');
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
		//map.addControl(nrt_date);
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

			$date
			.val($.datepicker.formatDate(DATE_FORMAT, new Date(date.valueOf() + delta * oneDay)))
			.change();
		};


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
		* Create and add a TimeDimension Layer to the map
		*/

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

			var run_type = "";
			var freq = "";
			var var_type = "";
			var rd_type = "";
			var z = "";
			var y = "";
			if($scope.toggle_geos){
				run_type = ($("#geos_run_table option:selected").val());
				freq = ($("#geos_freq_table option:selected").val());
				var_type = ($("#geos_var_table option:selected").val());
				rd_type = ($("#geos_rd_table option:selected").val());
				z = rd_type.split('/').reverse()[0];
				y = ($("#date_selector").val());
				rd_type = rd_type.replace(z, y.replace('-', '').replace('-', '') + '.nc');
				// var y = ($("#date_table option:selected").val());
				// if (($("#date_table option:selected").val()) != undefined)
				// rd_type = rd_type.replace(z, y.split('/').reverse()[0]);
				rd_type = rd_type.split('/').reverse()[0];
			}

			var geom_data= "";
			if (interaction === "Point") {
				geom_data = $("#point-lat-lon").val();
			} else if (interaction === "Polygon") {
				geom_data = $("#poly-lat-lon").val();
			} else if (interaction === "Station") {
				geom_data = $("#station").val();
				run_type = ($("#geos_run_table option:selected").val());
				freq = ($("#geos_freq_table option:selected").val());
				rd_type = ($("#geos_rd_table option:selected").text());
				var_type = ($("#geos_var_table option:selected").val());
				rd_type = ($("#geos_rd_table option:selected").val());
				z = rd_type.split('/').reverse()[0];
				y = ($("#date_selector").val());
				rd_type = rd_type.replace(z, y.replace('-', '').replace('-', '') + '.nc');
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
					// document.getElementById("firstday").innerHTML = date1;
					// document.getElementById("secondday").innerHTML = secondday;
					// document.getElementById("thirdday").innerHTML = thirdday;
					document.getElementById("day1_guage").innerHTML = date1;
					document.getElementById("day2_guage").innerHTML = secondday;
					document.getElementById("day3_guage").innerHTML = thirdday;

					//     populateValues(values);
					field_day1_avg = 0;
					field_day2_avg = 0;
					field_day3_avg = 0;

					forecast_day1_avg = 0;
					forecast_day2_avg = 0;
					forecast_day3_avg = 0;
					var sum1 = 0, sum2 = 0, sum3 = 0;
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
						if (i >= 2 && forecast_values[j] !== -1) {
							count1 = count1 + 1;
							sum1 = sum1 + (forecast_values[j] ? forecast_values[j][1] : 0);
						}
						if (forecast_values[j + 8] !== -1) count2 = count2 + 1;
						sum2 = sum2 + (forecast_values[j + 8] ? forecast_values[j + 8][1] : 0);
						if ((i + 16) < 22 && forecast_values[j + 16] !== -1) {
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
					// document.getElementsByClassName("forpm25")[2].style.display = 'table';
					// document.getElementsByClassName("forpm25")[2].style.width = 'inherit';
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
					//          document.getElementsByClassName("forpm25")[2].style.display = 'none';
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

					if(result.data["geom"][2]!== undefined)
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
						// var rd_type = ($("#geos_rd_table option:selected").val());
						// var z = rd_type.split('/').reverse()[0];
						// var y = ($("#date_table option:selected").val());
						// rd_type = rd_type.replace(z, y.split('/').reverse()[0]);

						var rd_type = ($("#geos_rd_table option:selected").val());
						var z = rd_type.split('/').reverse()[0];
						var y = $("#date_selector").val();
						rd_type = rd_type.replace(z, y.replace('-', '').replace('-', '') + '.nc');


						var var_type = ($("#geos_var_table option:selected").val());
						var style = ($("#geos_style_table option:selected").val());
						//update_style(style);
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
				var new_option  = "";
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
				var noption ="";
				var runDateOption = thredds_options['catalog'][run_type]['3dayrecent'];
				if (runDateOption) {
					runDateOption.forEach(function (item, i) {
						var opt = item.split('/').reverse()[0];
						new_option = new Option(opt, item);
						noption = new Option(opt, item);
						$("#lrd_table").append(new_option);
						$("#rrd_table").append(noption);
					});
				}

				var_options.forEach(function (item, i) {

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
				$scope.showLoader = true;
				// if(map.hasLayer(markersLayer)){
				// 	markersLayer.clearLayers();
				// }
				if(initStation){
					$scope.getPCDStation();
					$('#btn_toggle_stations_hourly').prop('checked', true); // checks btn_toggle_stations_hourly
					$('#btn_toggle_stations_avg24hr').prop('checked', false); // Unchecks btn_toggle_stations_avg24hr
					$("#geos_style_table").val("browse");
					$('.pm25-legendnew').css('display', 'none');
					$('.geos-legend').css('display', 'block');
				}else{
					$scope.get24hoursPCDStation();
					$('#btn_toggle_stations_hourly').prop('checked', false); // checks btn_toggle_stations_hourly
					$('#btn_toggle_stations_avg24hr').prop('checked', true); // Unchecks btn_toggle_stations_avg24hr
				}
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
				var new_option = "";
				if(run_type==="geos"){
					if (thredds_options['catalog'][run_type]['3dayrecent']) {
						thredds_options['catalog'][run_type]['3dayrecent'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							new_option = new Option(opt, item);
							$("#lrd_table").append(new_option);
						});
					}
				}else{
					if (thredds_options['catalog'][run_type]['monthly']) {
						thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							new_option = new Option(opt, item);
							$("#lrd_table").append(new_option);
						});
					}
				}

				var_options.forEach(function (item, i) {
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
				var new_option = "";
				if(run_type==="geos"){
					if (thredds_options['catalog'][run_type]['3dayrecent']) {
						thredds_options['catalog'][run_type]['3dayrecent'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							new_option = new Option(opt, item);
							$("#rrd_table").append(new_option);
						});
					}
				}else{
					if (thredds_options['catalog'][run_type]['monthly']) {
						thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							new_option = new Option(opt, item);
							$("#rrd_table").append(new_option);
						});
					}
				}
				var_options.forEach(function (item, i) {
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
			* Layers transparent
			*/

			$("#opacity-slider-geos").on("slide", function(e) {
				$("#OpacityVal3").text(e.value);
				opacity = e.value;
				tdWmsGEOSLayer.setOpacity(opacity);
			});

			/**
			* legend controller
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

			$("#day1_guage").click(function () {
				gen_chart(field_day1_avg < 0 ? -1 : field_day1_avg, forecast_day1_avg < 0 ? -1 : forecast_day1_avg);
				document.getElementById("datevalue").innerHTML = document.getElementById("day1_guage").innerHTML;
				document.getElementById("fromd").innerHTML = document.getElementById("day1_guage").innerHTML+" 08:30";
				document.getElementById("tod").innerHTML = document.getElementById("day1_guage").innerHTML+" 23:30";
				$(this).css("background-color", "#43a8c5");
				$("#day2_guage").css("background-color", "gray");
				$("#day3_guage").css("background-color", "gray");
			});
			$("#day2_guage").click(function () {
				gen_chart(field_day2_avg < 0 ? -1 : field_day2_avg, forecast_day2_avg < 0 ? -1 : forecast_day2_avg);
				document.getElementById("datevalue").innerHTML = document.getElementById("day2_guage").innerHTML;
				document.getElementById("fromd").innerHTML = document.getElementById("day2_guage").innerHTML+" 02:30";
				document.getElementById("tod").innerHTML = document.getElementById("day2_guage").innerHTML+" 23:30";
				$(this).css("background-color", "#43a8c5");
				$("#day1_guage").css("background-color", "gray");
				$("#day3_guage").css("background-color", "gray");
			});
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
			* tab controller
			*/

			$("#tab-geos").click(function () {
				$("#legend-tab-geos").css("display", "block");
				$("#tab-geos").addClass("active");
			});

			/**
			* tab defualt
			*/
			$("#tab-geos").click();

			$( document ).ready(function() {
				// Load VIIRS active fire 24kml file
				fetch('/static/data/active_fire/SUOMI_VIIRS_C2_SouthEast_Asia_24h.kml')
				.then(res => res.text())
				.then(kmltext => {
					// Create new kml overlay
					var parser = new DOMParser();
					//change firms icon
					kmltext = kmltext.replace(firmIcon, firmCustomIcon).replace(firmIcon, firmCustomIcon);
					var kml = parser.parseFromString(kmltext, 'text/xml');
					fire_24 = new L.KML(kml);
				});

				// Load VIIRS active fire 48 kml file
				fetch('/static/data/active_fire/SUOMI_VIIRS_C2_SouthEast_Asia_48h.kml')
				.then(res => res.text())
				.then(kmltext => {
					// Create new kml overlay
					var parser = new DOMParser();
					//change firms icon
					kmltext = kmltext.replace(firmIcon, firmCustomIcon).replace(firmIcon, firmCustomIcon);
					var kml = parser.parseFromString(kmltext, 'text/xml');
					fire_48 = new L.KML(kml);

				});

				$("#changeLangTH").click();
				$(".pcd").css("display", "block");
				$(".gistda").css("display", "block");
			});

		});
	});
})();
