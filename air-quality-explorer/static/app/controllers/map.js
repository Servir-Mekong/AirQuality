(function () {
	'use strict';
	angular.module('baseApp')
	.controller('airexplorer' ,function ($scope, $timeout, MapService, appSettings) {

		/* global variables to be tossed around like hot potatoes */
		$scope.initdate = '';
		$scope.stylesSelectors = appSettings.stylesSelectors;
		$scope.showTimeSlider = true;

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
		time_global,
		style_options,
		$modalCompare,
		$layers_element,
		thredds_options,
		stations,
		thredds_urls,
		threddss_wms_url,
		markersLayer;

		$modalCompare = $("#compare-modal");
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
		* initialize leaflet map
		*/
		map = L.map('map',{
			zoomControl: false,
			maxBounds: [ [-10, 160],[50, 20]],
		}).setView([15.8700, 100.9925], 5);

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
				$(this).addClass("active")
			}else{
				$('#toggle_layer_box').css("display", "none");
				$(this).removeClass("active")
			}

		});
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
				$(this).addClass("active")
			}else{
				$('#download_box').css("display", "none");
				$(this).removeClass("active")
			}

		});
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
				$(this).addClass("active")
			}else{
				$('#imagery_layer_box').css("display", "none");
				$(this).removeClass("active")
			}

		});
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
				$(this).addClass("active")
			}else{
				$('#legend_box').css("display", "none");
				$(this).removeClass("active")
			}

		});

		$("#full-extent").click(function(){
			$("nav").hide();
			$("body").css("margin-top", "-15px");
			$(".map").css("height", "100vh");
			$(".map-panel__sidebar").css("top", "20px");
		});
		$("#show-branner").click(function(){
			$("nav").show();
			$("body").css("margin-top", "100px");
			$(".map").css("height", "calc(100vh - 115px)");
			$(".map-panel__sidebar").css("top", "125px");
		});

		$("#zoom-in").click(function() {
			map.zoomIn();
		});
		$("#zoom-out").click(function() {
			map.zoomOut();
		});
		$("#time-toggle").click(function() {
			if($scope.showTimeSlider){
				$scope.showTimeSlider = false;
				$scope.$apply();
			}else{
				$scope.showTimeSlider = true;
				$scope.$apply();
			}
		});
		$("#full-screen").click(function() {
			if($("body").css("margin-top") === "-15px"){
				$("nav").show();
				$("body").css("margin-top", "100px");
				$(".map").css("height", "calc(100vh - 115px)");
				$(".map-panel__sidebar").css("top", "125px");
			}else{
				$("nav").hide();
				$("body").css("margin-top", "-15px");
				$(".map").css("height", "100vh");
				$(".map-panel__sidebar").css("top", "20px");
			}
		});

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

			}else{
				// $modalCompare.modal('hide');
				// map.removeControl(compare);
				// map.removeLayer(lwmsLayer);
				// map.removeLayer(rwmsLayer);
				// tdWmsFireLayer.addTo(map);
				// tdWmsAODLayer.addTo(map);
				// tdWmsGEOSLayer.addTo(map);
			}
		});

		$("#admin-tool").click(function(){
			if(!admin_enabled){
				distLayer.setOpacity(0.5);
				distLayer.addTo(map);
				L.DomUtil.addClass(map._container, 'crosshair-cursor-enabled');
				admin_enabled = true;
			}else{
				map.removeLayer(distLayer);
				L.DomUtil.removeClass(map._container, 'crosshair-cursor-enabled');
				admin_enabled = false;
			}
		});

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
				$(this).addClass("active")
			}else{
				$('#print_box').css("display", "none");
				$(this).removeClass("active")
			}

		});
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
		* set style options
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
		});

		// Date Range Slider
		$scope.broadcastTimeSlider = function () {
			$timeout(function () {
				$scope.$broadcast('rzSliderForceRender');
			});
		};

		/**
		 * Time Slider
		 **/
		var timeSlider = document.getElementById('datePickerSlider');

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

				return [date.getFullYear(),
						(mm > 9 ? '' : '0') + mm,
						(dd > 9 ? '' : '0') + dd
				].join('-');
			}
		};

		noUiSlider.create(timeSlider, {
			// Create two timestamps to define a range.
			range: {
				min: new Date('2000').getTime(),
				max: new Date().setMonth(new Date().getMonth() + 3)
			},

			// Steps of one day
			step: 1 * 24 * 60 * 60 * 1000,

			// Handle starting positions.
			start: new Date().getTime(),

			//tooltips: true,

			format: { to: $scope.toFormat, from: Number },

			connect: 'lower',

			// Show a scale with the slider
			pips: {
				mode: 'count',
				density: 2,
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
						$scope.changeTimeSlider();
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
		$scope.selectedDate = [
			new Date().getFullYear(),
			((new Date().getMonth() + 1) > 9 ? '' : '0') + (new Date().getMonth() + 1) ,
			(new Date().getDate() > 9 ? '' : '0') + new Date().getDate()
		].join('-');
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
				if (event.target.className.startsWith('noUi')) {
					$timeout(function () {
						$scope.changeTimeSlider();
					}, 500);
				}
			}
		});

		// get PCD station
		$scope.getPCDStation = function () {
			var parameters = {
				obs_date: $scope.selectedDate
			};
			MapService.getAirStations(parameters)
			.then(function (result){
				var date = $scope.selectedDate;
				for (var l in overlays) {
					if(!(l.includes('FIRES_VIIRS'))){
						overlays[l].options.time = date;
						overlays[l].redraw();
					}
				}
				stations = result;
				addStations();
			}), function (error){
				console.log(error);
			};
		};

		$scope.changeTimeSlider = function () {
			$("#fire_range-max").trigger('change');
			$("#aod_range-max").trigger('change');
			$scope.getPCDStation();

			//$scope.updateMap(true);
		};
		$scope.getPCDStation();
		// Forward Slider
		$scope.slideForward = function () {
			var date = new Date($scope.selectedDate);
			date.setDate(date.getDate() + 1);
			$scope.selectedDate = [
				date.getFullYear(), ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) , ((date.getDate()) > 9 ? '' : '0') + (date.getDate())
			].join('-');
			tooltipInput.value = $scope.selectedDate;
			timeSlider.noUiSlider.set(new Date($scope.selectedDate).getTime());
			$timeout(function () {
				$scope.changeTimeSlider();
			}, 500);
		};

		// Backward Slider
		$scope.slideBackward = function () {
			var date = new Date($scope.selectedDate);
			date.setDate(date.getDate() - 1);
			$scope.selectedDate = [
				date.getFullYear(), ((date.getMonth() + 1) > 9 ? '' : '0') + (date.getMonth() + 1) , ((date.getDate()) > 9 ? '' : '0') + (date.getDate())
			].join('-');
			tooltipInput.value = $scope.selectedDate;
			timeSlider.noUiSlider.set(new Date($scope.selectedDate).getTime());
			$timeout(function () {
				$scope.changeTimeSlider();
			}, 500);
		};



		var init_opacity_slider = function(){
			opacity = 1;
			$("#opacity").text(opacity);
			$( "#opacity-slider" ).bootstrapSlider({
				value: opacity,
				min: 0.2,
				max: 1,
				step: 0.1, //Assigning the slider step based on the depths that were retrieved in the controller
				animate:"fast",
				slide: function( event, ui ){}
			});
			$( "#opacity-slider-aod" ).bootstrapSlider({
				value: opacity,
				min: 0.2,
				max: 1,
				step: 0.1, //Assigning the slider step based on the depths that were retrieved in the controller
				animate:"fast",
				slide: function( event, ui ){}
			});
			$( "#opacity-slider-geos" ).bootstrapSlider({
				value: opacity,
				min: 0.2,
				max: 1,
				step: 0.1, //Assigning the slider step based on the depths that were retrieved in the controller
				animate:"fast",
				slide: function( event, ui ){}
			});
		};
		init_opacity_slider();


		var clear_coords = function(){
			$("#point-lat-lon").val('');
			$("#poly-lat-lon").val('');
			$("#shp-lat-lon").val('');
		};


		function find_var_index(item,data){
			var index = -1;
			for (var i = 0; i < data.length; ++i) {
				if (item.includes(data[i]["id"])) {
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

		var myIcon = L.icon({
			iconUrl: 'static/images/loc2.png',
			iconRetinaUrl: 'static/images/loc2.png',
			iconSize: [35, 35],
			iconAnchor: [9, 21],
			popupAnchor: [0, -14]
		});

		function addStations(){
			//markersLayer.clearLayers();
			var icon_src;
			markersLayer = L.featureGroup().addTo(map);


			for (var i = 0; i < stations.length; ++i) {
				 	var color="red";
					if(stations[i].pm25>90){
				 		color="#ed1e02";
						icon_src = 'static/images/red.png';
				 		myIcon = L.icon({
							iconUrl: icon_src,
							iconRetinaUrl: 'static/images/loc2.png',
							iconSize: [35, 35],
							iconAnchor: [9, 21],
							popupAnchor: [0, -14]
						});
					}
					else if(stations[i].pm25>50 && stations[i].pm25<91){
				 		color="#eda702";
						icon_src = 'static/images/orange.png';
				 		myIcon = L.icon({
							iconUrl: icon_src,
							iconRetinaUrl: 'static/images/loc2.png',
							iconSize: [35, 35],
							iconAnchor: [9, 21],
							popupAnchor: [0, -14]
						});
					}
					else if(stations[i].pm25>37 && stations[i].pm25<51){
				 		color="#eff213";
						icon_src = 'static/images/yellow.png';
				 		myIcon = L.icon({
							iconUrl: icon_src,
							iconRetinaUrl: 'static/images/loc2.png',
							iconSize: [35, 35],
							iconAnchor: [9, 21],
							popupAnchor: [0, -14]
						});

					}else if(stations[i].pm25>25 && stations[i].pm25<38){
				 		color="#24cf1b";
						icon_src = 'static/images/green.png';
				 		myIcon = L.icon({
							iconUrl: icon_src,
							iconRetinaUrl: 'static/images/loc2.png',
							iconSize: [35, 35],
							iconAnchor: [9, 21],
							popupAnchor: [0, -14]
						});
					}else if(stations[i].pm25>=0 && stations[i].pm25<26){
				 		color="#6ef0ff";
						icon_src = 'static/images/tt.png';
				 		myIcon = L.icon({
							iconUrl: icon_src,
							iconRetinaUrl: 'static/images/loc2.png',
							iconSize: [35, 35],
							iconAnchor: [9, 21],
							popupAnchor: [0, -14]
						});
					}
				  var oneMarker =
					 L.marker([stations[i].lat, stations[i].lon], {
					icon: myIcon
				});
					 oneMarker.bindTooltip("<b>Station:</b> "+stations[i].name+
					 "<br><b>PM 2.5:</b> "+stations[i].pm25+ " (µg<sup>-3</sup>)"+
					 "<br><b>Data for:</b> "+stations[i].latest_date);
				oneMarker.name = stations[i].name;
				oneMarker.lat = stations[i].lat;
				oneMarker.lon = stations[i].lon;
				oneMarker.aqi = stations[i].aqi;
				oneMarker.src = icon_src;
				oneMarker.latest_date = stations[i].latest_date
				oneMarker.addTo(markersLayer);
			}
			markersLayer.on("click", markerOnClick);
			markersLayer.setZIndex(500);
		};

		function markerOnClick(e) {
			var attributes = e.layer;
			int_type = "Station";
			$("#station").val(attributes.name+','+attributes.lat+','+attributes.lon);
			$("#station_name").text(attributes.name);
			$("#aqi_txt").text("AQI: " + attributes.aqi);
			$("#aqi_img").attr('src',attributes.src);
			$("#obs_date").text(attributes.latest_date);
			//get_ts();
			// do some stuff…
		}



		add_wms = function(run_type,freq,run_date,var_type,rmin,rmax,styling,time = ""){

			var wmsUrl = threddss_wms_url+run_date;
			wms_layer=wmsUrl;
			run_type = run_type.toUpperCase();
			if(run_type === 'FIRE'){
				if(map.hasLayer(tdWmsFireLayer)){
					map.removeLayer(tdWmsFireLayer);
				}
			}else if(run_type === 'GEOS_TAVG1_2D_SLV_NX' || run_type === 'GEOS_TAVG3_2D_AER_NX'){
				if(map.hasLayer(tdWmsGEOSLayer)){
					map.removeLayer(tdWmsGEOSLayer);
				}
			}else if(run_type !== 'GEOS_TAVG1_2D_SLV_NX' || run_type !== 'GEOS_TAVG3_2D_AER_NX' || run_type !== 'FIRE'){
				if(map.hasLayer(tdWmsAODLayer)){
					map.removeLayer(tdWmsAODLayer);
				}

			}

			var index = find_var_index(var_type,var_options);
			// gen_color_bar(var_options[index]["colors_list"],scale);
			var layer_id = var_options[index]["id"];
			var range = rmin+','+rmax;

			var style = 'boxfill/'+styling;
			opacity = $('#opacity-slider').val();

			var link = wmsUrl + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=" + layer_id + "&time=" + time + "&colorscalerange=" + range + "&PALETTE=" + styling + "&transparent=TRUE";
			if (time == "") {
				link = wmsUrl + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER=" + layer_id + "&colorscalerange=" + range + "&PALETTE=" + styling + "&transparent=TRUE";
			}
			var imgsrc = link;

			var wmsLayer = L.tileLayer.wms(wmsUrl, {
				layers: var_type,
				format: 'image/png',
				time: time,
				transparent: true,
				styles: style,
				colorscalerange: range,
				opacity:opacity,
				version:'1.3.0',
				zIndex:100,
				bounds: [[0, 100], [25, 110]],
			});

			if(run_type === 'FIRE'){
				tdWmsFireLayer = L.tileLayer.wms(wmsUrl, {
					layers: var_type,
					format: 'image/png',
					transparent: true,
					styles: style,
					colorscalerange: range,
					opacity:opacity,
					version:'1.3.0',
					zIndex:100,
					bounds: [[0, 100], [25, 110]],
				});
				tdWmsFireLayer.addTo(map);
				$('#img-legend-fire').attr('src',imgsrc);
			}else if(run_type === 'GEOS_TAVG1_2D_SLV_NX' || run_type === 'GEOS_TAVG3_2D_AER_NX' || run_type === 'GEOS'){
				tdWmsGEOSLayer = L.tileLayer.wms(wmsUrl, {
					layers: var_type,
					format: 'image/png',
					transparent: true,
					styles: style,
					colorscalerange: range,
					opacity:opacity,
					version:'1.3.0',
					zIndex:100,
					bounds: [[0, 100], [25, 110]],
				});
				tdWmsGEOSLayer.addTo(map);
				$('#img-legend-geos').attr('src',imgsrc);
			}else if(run_type !== 'GEOS_TAVG1_2D_SLV_NX' || run_type !== 'GEOS_TAVG3_2D_AER_NX' || run_type !== 'FIRE'){
				tdWmsAODLayer = L.tileLayer.wms(wmsUrl, {
					layers: var_type,
					format: 'image/png',
					transparent: true,
					styles: style,
					colorscalerange: range,
					opacity:opacity,
					version:'1.3.0',
					zIndex:100,
					bounds: [[0, 100], [25, 110]],
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
			// map.removeLayer(wms_layer);
			// var lindex = find_var_index(l_var,var_options);
			// var rindex = find_var_index(r_var,var_options);

			// var layer_id = var_options[index]["id"];
			// var lrange = var_options[lindex]["min"]+','+var_options[lindex]["max"];
			// var rrange = var_options[rindex]["min"]+','+var_options[rindex]["max"];
			var lstyling = 'boxfill/'+lstyle;
			var rstyling = 'boxfill/'+rstyle;
			//opacity = $('#opacity-slider').slider("option", "value");

			lwmsLayer = L.tileLayer.wms(lwmsUrl, {
				layers: l_var,
				format: 'image/png',
				transparent: true,
				styles: lstyling,
				colorscalerange: lrange,
				opacity:1,
				version:'1.3.0',
				bounds: [[0, 100], [25, 110]],
			});

			rwmsLayer = L.tileLayer.wms(rwmsUrl, {
				layers: r_var,
				format: 'image/png',
				transparent: true,
				styles: rstyling,
				colorscalerange: rrange,
				opacity:1,
				version:'1.3.0',
				bounds: [[0, 100], [25, 110]],
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
		})


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

		var baselayers = {};
		var today = new Date();
		var day = new Date(today.getTime());
		day = $scope.selectedDate;

		var DATE_FORMAT = 'dd.mm.yy';
		var strToDateUTC = function(str) {
			var date = $.datepicker.parseDate(DATE_FORMAT, str);
			return new Date(date - date.getTimezoneOffset()*60*1000);
		};
		var $date = $('#date');
		var now = new Date();
		var oneDay = 1000*60*60*24, // milliseconds in one day
		startTimestamp = now.getTime() - oneDay + now.getTimezoneOffset()*60*1000,
		startDate = new Date(startTimestamp); //previous day

		$date.val($.datepicker.formatDate(DATE_FORMAT, startDate));

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
				transparent: true
			}),
			'FIRES_VIIRS_48':L.tileLayer.wms("https://firms.modaps.eosdis.nasa.gov/wms/?MAP_KEY=c135d300c93ef6c81f32f095073a9a7d",{
				layers:'fires_viirs_48',
				format: 'image/png',
				transparent: true
			}),

		};

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

		var drawControlFull = new L.Control.DrawPlus({
			position: 'topright',
			edit: {
				featureGroup: drawnItems,
				edit: false,
			},
			draw: {
				polyline: false,
				circlemarker:false,
				rectangle:{shapeOptions: {  color: '#007df3', weight: 4}},
				circle:false,
				polygon:false,
			}
		});

		map.addControl(drawControlFull);


		var customActionToPrint = function (context, mode) {
			return function () {
				//window.alert("Please check if any overlays are selected before you print..");
				context._printLandscape(mode);
			}
		}

		L.control.browserPrint({
			title: 'Air quality Print',
			documentTitle: 'Air quality App with data',
			printLayer: wms_layer,
			closePopupsOnPrint: false,
			printModes: [L.control.browserPrint.mode("Landscape", "Landscape", "A4", customActionToPrint, false)],
			manualMode: false
		}).addTo(map);

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
				// get_ts();
			} else if (type === 'Polygon'){
				coords = feature["features"][0]["geometry"];
				$("#poly-lat-lon").val(JSON.stringify(coords.coordinates[0]));
				// get_ts();
			}
		});


		// var timeDimensionControl = new L.Control.TimeDimensionCustom(timeDimensionControlOptions);
		// map.addControl(timeDimensionControl);

		var mapLink =
		'<a href="http://openstreetmap.org">OpenStreetMap</a>';
		L.tileLayer(
			'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; ' + mapLink + ' Contributors',
				maxZoom: 18,
			}).addTo(map);

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


			// var init_events = function(){
			// 	map.on("mousemove", function (event) {
			// 		document.getElementById('mouse-position').innerHTML = 'Latitude:'+event.latlng.lat.toFixed(5)+', Longitude:'+event.latlng.lng.toFixed(5);
			// 	});
			// };
			// init_events();

			get_ts = function () {
				if ($("#poly-lat-lon").val() == "" && $("#point-lat-lon").val() == "" && $("#shp-lat-lon").val() == "") {
					$('.error').html('<b>No feature selected. Please create a feature using the map interaction dropdown. Plot cannot be generated without a feature.</b>');
					return false;
				} else {
					$('.error').html('');
				}

				var interaction = int_type;

				var run_type = ($("#run_table option:selected").val());
				var freq = ($("#freq_table option:selected").val());
				var rd_type = ($("#rd_table option:selected").text());
				var var_type = ($("#var_table option:selected").val());

				if (interaction == "Point") {
					var geom_data = $("#point-lat-lon").val();
				} else if (interaction == "Polygon") {
					var geom_data = $("#poly-lat-lon").val();
				}
				$modalChart.modal('show');
				$("#cube").removeClass('hidden');
				$("#plotter").addClass('hidden');

			};

			$(function() {

				/**
				* AOD options
				*/
				$.each(thredds_options['catalog'],function(item,i){
					if(item.toUpperCase()!== "GEOS_TAVG1_2D_SLV_NX" && item.toUpperCase()!== "GEOS_TAVG3_2D_AER_NX" && item.toUpperCase()!== "FIRE"){
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
						if (item !== 'combined'){
							var new_option = new Option(item,item);
							$("#aod_freq_table").append(new_option);
						}
					});
					$("#aod_freq_table").trigger('change');
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
					var rd_type = ($("#aod_rd_table option:selected").val());
					var parameter_url = rd_type.slice(0, -17);
					var datetime = $scope.selectedDate.replace("-","").substring(0, 6);

					//var datetime = "201801";
					var rd_type = parameter_url + "."+ datetime +".MEKONG.nc";
					var var_type = ($("#aod_var_table option:selected").val());
					var style =  ($("#aod_style_table option:selected").val());
					var rmin = $("#aod_range-min").val();
					var rmax = $("#aod_range-max").val();
					add_wms(run_type,freq,rd_type,var_type,rmin,rmax,style);
				}).change();

				$("#aod_style_table").change(function () {
					var style = ($("#aod_style_table option:selected").val());
					$("#aod_range-max").trigger('change');
				}).change();

				/**
				* GEOS options
				*/
				$.each(thredds_options['catalog'],function(item,i){
					if(item.toUpperCase() === "GEOS_TAVG1_2D_SLV_NX" || item.toUpperCase() === "GEOS_TAVG3_2D_AER_NX" || item.toUpperCase() === "GEOS" ){
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
					$.each(thredds_options['catalog'][run_type], function (item, i) {
						if ((item == '3daytoday' || item == '3dayrecent') && (run_type == "geos_tavg1_2d_slv_Nx" || run_type == "geos_tavg3_2d_aer_Nx" || run_type == "geos")) {

							var new_option = new Option(item, item);
							$("#geos_freq_table").append(new_option);
						} else if (item == 'combined') {

							var new_option = new Option(item, item);
							$("#geos_freq_table").append(new_option);
						}
					});
					$("#geos_freq_table").trigger('change');
					if (thredds_options['catalog'][run_type]['monthly']) {
						thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							var new_option = new Option(opt, item);
							var noption = new Option(opt, item);
							$("#lrd_table").append(new_option);
							$("#rrd_table").append(noption);
						});
					}

					var_options.forEach(function (item, i) {
						if (item["category"] == run_type) {
							var new_option = new Option(item["display_name"]);
							// +' ('+item["units"]+')'
							var noption = new Option(item["display_name"], item["id"]);
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

				get_times = function (rd_type) {
					$("#hour_table").html('');
					var freq = ($("#geos_freq_table option:selected").val());
					var run_type = ($("#geos_run_table option:selected").val());
					var parameters = {
						run_type: run_type,
						freq: freq,
						run_date: rd_type
					};
					MapService.get_time(parameters)
					.then(function (result){
						var times = result["times"];
						time_global = times[0];
						times.forEach(function (time, i) {
							var opt = new Option(time, time);
							$("#hour_table").append(opt);
						});
					}), function (error){
						console.log(error);
					};
				};

				$("#geos_rd_table").change(function(){
					$("#date_table").empty();
					$("#hour_table").empty();
					var freq = ($("#geos_freq_table option:selected").val());
					var run_type = ($("#geos_run_table option:selected").val());
					var rd_type = ($("#geos_rd_table option:selected").val());

					var str = rd_type.split('/').reverse()[0];
					var newt = str.substring(0, 4) + '-' + str.substring(4, 6) + '-' + str.substring(6, 8);
					thredds_options['catalog'][run_type][freq].forEach(function (item, i) {

						var opt = item.split('/').reverse()[0];
						if (run_type == "geos_tavg1_2d_slv_Nx" || run_type == "geos_tavg3_2d_aer_Nx" || run_type == "geos") {
							$('#info').text("Displaying " + newt + " data on the map..");
							var new_option2 = new Option(opt, item);
							$("#date_table").append(new_option2);
						}
					});
					$("#geos_var_table").html('');
					var_options.forEach(function (item, i) {
						if (item["category"] == run_type) {
							var new_option = new Option(item["display_name"], item["id"]);
							$("#geos_var_table").append(new_option);
						}
					});
					$("#geos_var_table").trigger('change');
				}).change();


				$("#date_table").change(function () {
					var run_type = ($("#geos_run_table option:selected").val());
					if (run_type == "geos_tavg1_2d_slv_Nx" || run_type == "geos_tavg3_2d_aer_Nx" || run_type == "geos") {
						$('#info').text("Displaying " + ($("#date_table option:selected").val().split('/').reverse()[0]) + " data on the map..");

					}
					var freq = ($("#geos_freq_table option:selected").val());
					var rd_type = ($("#geos_rd_table option:selected").val());
					var z = rd_type.split('/').reverse()[0];
					var y = ($("#date_table option:selected").val());
					rd_type = rd_type.replace(z, y.split('/').reverse()[0]);
					var var_type = ($("#geos_var_table option:selected").val());
					var style = ($("#geos_style_table option:selected").val());
					//update_style(style);
					var rmin = $("#geos_range-min").val();
					var rmax = $("#geos_range-max").val();
					add_wms(run_type, freq, rd_type, var_type, rmin, rmax, style, time_global);
					$("#hour_table").html('');
					get_times(rd_type.split('/').reverse()[0]);
				});

				$("#hour_table").change(function () {
					var run_type = ($("#geos_run_table option:selected").val());
					var freq = ($("#geos_freq_table option:selected").val());
					var rd_type = ($("#geos_rd_table option:selected").val());
					var z = rd_type.split('/').reverse()[0];
					if (z.includes("_")) {
						var y = ($("#date_table option:selected").val());
						rd_type = rd_type.replace(z, y.split('/').reverse()[0]);
						var var_type = ($("#geos_var_table option:selected").val());
						var style = ($("#geos_style_table option:selected").val());
						//update_style(style);
						var rmin = $("#geos_range-min").val();
						var rmax = $("#geos_range-max").val();
						add_wms(run_type, freq, rd_type, var_type, rmin, rmax, style, ($("#hour_table option:selected").val()));
					}

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
					var rmin = $("#geos_range-min").val();
					var rmax = $("#geos_range-max").val();
					$("#date_table").trigger('change');

				}).change();
				$("#geos_style_table").change(function () {
					var style = ($("#geos_style_table option:selected").val());
					$("#geos_range-max").trigger('change');
				}).change();

				/**
				* Fire options
				*/
				$.each(thredds_options['catalog']['fire'],function(item,i){
					if (item !== 'combined'){
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

				$("#fire_range-max").on('change',function(){
					var freq = ($("#fire_freq_table option:selected").val());
					var rd_type = ($("#fire_rd_table option:selected").val());
					var parameter_url = "tethys/MK_AQX/fire/";
					var datetime = $scope.selectedDate.replace("-","").substring(0, 6);

					//var datetime = "201801";
					var rd_type = parameter_url + "MCD14ML."+ datetime +"..MEKONG.nc";
					var var_type = ($("#fire_var_table option:selected").val());
					var style =  ($("#fire_style_table option:selected").val());
					var rmin = $("#fire_range-min").val();
					var rmax = $("#fire_range-max").val();
					add_wms('fire',freq,rd_type,var_type,rmin,rmax,style);
				}).change();

				$("#fire_style_table").change(function () {
					var style = ($("#fire_style_table option:selected").val());
					$("#fire_range-max").trigger('change');
				}).change();


				$.each(thredds_options['catalog'],function(item,i){
					var new_option = new Option(item.toUpperCase(),item);
					var noption = new Option(item.toUpperCase(),item);
					var noption2 = new Option(item.toUpperCase(),item);
					$("#lrun_table").append(noption);
					$("#rrun_table").append(noption2);
				});

				$("#lrun_table").change(function(){
					var run_type = ($("#lrun_table option:selected").val());
					$("#lrd_table").html('');
					$("#lvar_table").html('');
					if (thredds_options['catalog'][run_type]['monthly']) {
						thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							var new_option = new Option(opt, item);
							$("#lrd_table").append(new_option);
						});
					}
					var_options.forEach(function (item, i) {
						if (item["category"] == run_type) {
							var new_option = new Option(item["display_name"], item["id"]);
							$("#lvar_table").append(new_option);
						}
					});
					$("#lvar_table").trigger('change');

				}).change();

				$("#rrun_table").change(function(){
					var run_type = ($("#rrun_table option:selected").val());
					$("#rrd_table").html('');
					$("#rvar_table").html('');
					if (thredds_options['catalog'][run_type]['monthly']) {
						thredds_options['catalog'][run_type]['monthly'].forEach(function (item, i) {
							var opt = item.split('/').reverse()[0];
							var new_option = new Option(opt, item);
							$("#rrd_table").append(new_option);
						});
					}
					var_options.forEach(function (item, i) {
						if (item["category"] == run_type) {
							var new_option = new Option(item["display_name"], item["id"]);
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
				* Downloading Air Quality products
				*/
				$("#btn-download-fire").click(function(){
					var fileUrl = threddss_wms_url.replace('wms','fileServer');
					var rd_type = ($("#fire_rd_table option:selected").val());
					var downUrl = fileUrl+rd_type;
					window.location = (downUrl);
				});
				$("#btn-download-aod").click(function(){
					var fileUrl = threddss_wms_url.replace('wms','fileServer');
					var rd_type = ($("#aod_rd_table option:selected").val());
					var downUrl = fileUrl+rd_type;
					window.location = (downUrl);
				});
				$("#btn-download-geos").click(function(){
					var fileUrl = threddss_wms_url.replace('wms','fileServer');
					var rd_type = ($("#geos_rd_table option:selected").val());
					var downUrl = fileUrl+rd_type;
					window.location = (downUrl);
				});

				/**
				* Layers transparent
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

				/**
				* hide leaflet print controller
				*/
				$("a[title='Air quality Print']").css("display", "none");

				/**
				* tab controller
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
				* tab defualt
				*/
				$("#tab-fire").click();
			});
		});
	})();
