(function () {
	'use strict';
	angular.module('baseApp')
	.controller('airexplorer' ,function ($scope, $timeout, MapService, appSettings) {

		/* global variables to be tossed around like hot potatoes */
		$scope.initdate = '';
		$scope.stylesSelectors = appSettings.stylesSelectors;

		var map,
        add_wms,
		add_wms_fire,
		add_wms_aod,
		selected_date,
		browse_layer,
		basemap_layer,
		precip_layer,
		historical_layer,
		sentinel1_layer,
		admin_layer,
		flood_layer,
		drawing_polygon,
		compare,
		int_type,
		opacity,
		public_interface,
        wms_layer,
		lwmsLayer,
		rwmsLayer,
		tdWmsLayer,
		tdWmsFireLayer,
		tdWmsAODLayer,
		drawnItems,
        distLayer,
		$layers_element,
		thredds_options,
        thredds_urls,
        threddss_wms_url,
		var_options,
		$modalCompare;

		$modalCompare = $("#compare-modal");
		var $meta_element = $("#metadata");
        threddss_wms_url = $meta_element.attr('data-wms-url');
		var_options = $meta_element.attr('data-var-options');
        var_options = JSON.parse(var_options);
		thredds_options = $meta_element.attr('data-thredds-options');
        thredds_options = JSON.parse(thredds_options);

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

		 $('#toggle_layers').click(function(){
			 $('#imagery_layer_box').css("display", "none");
			 $('#legend_box').css("display", "none");
			 $('#toggle_imagery').removeClass("active");
			 $('#toggle_legend').removeClass("active");
			 if($('#toggle_layer_box').css("display") === "none"){
				$('#toggle_layer_box').css("display", "block");
				$(this).addClass("active")
			}else{
				$('#toggle_layer_box').css("display", "none");
				$(this).removeClass("active")
			}

		  });
		  $('#toggle_imagery').click(function(){
			  $('#toggle_layer_box').css("display", "none");
			  $('#legend_box').css("display", "none");
			  $('#toggle_layers').removeClass("active");
 			 $('#toggle_legend').removeClass("active");
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
				$('#toggle_layers').removeClass("active");
   			 	$('#toggle_imagery').removeClass("active");
			if($('#legend_box').css("display") === "none"){
			   $('#legend_box').css("display", "block");
			   $(this).addClass("active")
		   }else{
			   $('#legend_box').css("display", "none");
			   $(this).removeClass("active")
		   }

		 });
		var init_dropdown = function () {
			$(".run_table").select2({minimumResultsForSearch: -1});
			$(".freq_table").select2({minimumResultsForSearch: -1});

			$(".model_table").select2({minimumResultsForSearch: -1});
			$(".rd_table").select2({minimumResultsForSearch: -1});
			$(".file_table").select2({minimumResultsForSearch: -1});
			$(".style_table").select2({minimumResultsForSearch: -1});
			$(".interval_table").select2({minimumResultsForSearch: -1});
			$(".var_table").select2({minimumResultsForSearch: -1});
			$(".date_table").select2({minimumResultsForSearch: -1});
			$(".year_table").select2({minimumResultsForSearch: -1});
		};
		init_dropdown();



				// $.each(style_options['colors'],function(item,i){
				// 	var new_option = new Option(item[0],item[1]);
		        //     var noption = new Option(item[0],item[1]);
		        //     $("#style_table").append(new_option);
		        //     $("#cstyle_table").append(noption);
				// });

            var init_opacity_slider = function(){
                opacity = 1;
                $("#opacity").text(opacity);
                $( "#opacity-slider" ).bootstrapSlider({
                    value: opacity,
                    min: 0.2,
                    max: 1,
                    step: 0.1, //Assigning the slider step based on the depths that were retrieved in the controller
                    animate:"fast",
                    slide: function( event, ui ) {

                    }
                });
				$( "#opacity-slider-aod" ).bootstrapSlider({
                    value: opacity,
                    min: 0.2,
                    max: 1,
                    step: 0.1, //Assigning the slider step based on the depths that were retrieved in the controller
                    animate:"fast",
                    slide: function( event, ui ) {

                    }
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

		map = L.map('map',{
			zoomControl: false
            // timeDimension: true,
            // timeDimensionControl: true
        }).setView([15.8700, 100.9925], 5);



		add_wms = function(run_type,freq,run_date,var_type,rmin,rmax,styling){
        //map.removeControl(legend);

        // var wmsUrl = threddss_wms_url+sdir+'/'+file_name;
        var wmsUrl = threddss_wms_url+run_date;
        wms_layer=wmsUrl;
		if(run_type === 'fire'){
			if(map.hasLayer(tdWmsFireLayer)){
				map.removeLayer(tdWmsFireLayer);
			}

		}else{
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

        var wmsLayer = L.tileLayer.wms(wmsUrl, {
            layers: var_type,
            format: 'image/png',
            transparent: true,
            styles: style,
            colorscalerange: range,
            opacity:opacity,
            version:'1.3.0',
            zIndex:100,
        });

		if(run_type === 'fire'){
			tdWmsFireLayer = L.timeDimension.layer.wms(wmsLayer,{
	            updateTimeDimension:true,
	            setDefaultTime:true,
	            cache:365,
	            zIndex:100,
	        });
	        tdWmsFireLayer.addTo(map);
		}else{
			tdWmsAODLayer = L.timeDimension.layer.wms(wmsLayer,{
	            updateTimeDimension:true,
	            setDefaultTime:true,
	            cache:365,
	            zIndex:100,
	        });
	        tdWmsAODLayer.addTo(map);
		}

        var imgsrc = wmsUrl + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER="+layer_id+"&colorscalerange="+range+"&PALETTE="+styling+"&transparent=TRUE";
        //console.log(imgsrc);

    };


	var add_compare = function(){
        map.removeLayer(tdWmsLayer);
        map.removeLayer(lwmsLayer);
        map.removeLayer(rwmsLayer);
        $modalCompare.modal('hide');
        var style =  ($("#cstyle_table option:selected").val());
        var l_date = $("#lrd_table option:selected").val();
        var l_var = $("#lvar_table option:selected").val();
        var r_date = $("#rrd_table option:selected").val();
        var r_var = $("#rvar_table option:selected").val();

        var lwmsUrl = threddss_wms_url+l_date;
        var rwmsUrl = threddss_wms_url+r_date;

        var range = $("#crange-min").val()+','+$("#crange-max").val();
        // map.removeLayer(wms_layer);
        // var lindex = find_var_index(l_var,var_options);
        // var rindex = find_var_index(r_var,var_options);

        // var layer_id = var_options[index]["id"];
        // var lrange = var_options[lindex]["min"]+','+var_options[lindex]["max"];
        // var rrange = var_options[rindex]["min"]+','+var_options[rindex]["max"];
        var styling = 'boxfill/'+style;
        opacity = $('#opacity-slider').slider("option", "value");

        lwmsLayer = L.tileLayer.wms(lwmsUrl, {
            layers: l_var,
            format: 'image/png',
            transparent: true,
            styles: styling,
            colorscalerange: range,
            opacity:opacity,
            version:'1.3.0'
        });

        rwmsLayer = L.tileLayer.wms(rwmsUrl, {
            layers: r_var,
            format: 'image/png',
            transparent: true,
            styles: styling,
            colorscalerange: range,
            opacity:opacity,
            version:'1.3.0'
        });

        lwmsLayer.addTo(map);
        rwmsLayer.addTo(map);
        compare = L.control.sideBySide(lwmsLayer,rwmsLayer);
        compare.addTo(map);

    };
    $("#btn-add-compare").on('click',add_compare);

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


        var nrt_date = new L.Control.InfoControl({
            position: "topright",
            content: '<div id="controls"><button id="prev">Previous Day</button><input id="date"><button id="next">Next Day</button></div>'
        });
        map.addControl(nrt_date);

        var leg = new L.Control.InfoControl({
            position: "topcenter",
            content: '<div><canvas id="canvas" style="width:20vw;height:4vh;"></canvas><canvas class="tippy hidden" id="tip" width=35 height=25></canvas></div>'
        });
        //map.addControl(leg);

        var baselayers = {};
        var today = new Date();
        var day = new Date(today.getTime());
        day = day.toISOString().split('T')[0];

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

		L.control.zoom({
		    position: 'topright'
		}).addTo(map);

		drawnItems = new L.FeatureGroup();
		map.addLayer(drawnItems);
		distLayer = L.tileLayer.betterWms('https://tethys.servirglobal.net/geoserver/wms/', {
			layers: 'utils:adm',
			format: 'image/png',
			transparent: true,
			styles:'district',
			zIndex:1,
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
			  /*  shapefile: {
					shapeOptions: {
						color: '#007df3',
						weight: 4,
						opacity: 1,
						fillOpacity: 0
					}
				}*/
			}
		});

		map.addControl(drawControlFull);

		compare = L.control.sideBySide({
			position: 'topright'
		});
		var stateChangingButton = L.easyButton({
			position: 'topright',
			states: [{
				stateName: 'enable-compare',        // name the state
				icon:      'glyphicon-resize-horizontal',               // and define its properties
				title:     'Enable side by side comparison',      // like its title
				onClick: function(btn, map) {       // and its callback
					$modalCompare.modal('show');
					map.removeControl(compare);
					// compare = L.control.sideBySide(wmsLayer,wmsLayer);
					// compare.addTo(map);
					btn.state('disable-compare');    // change state on click!
				}
			}, {
				stateName: 'disable-compare',
				icon:      'glyphicon-transfer',
				title:     'Disable side by side comparison',
				onClick: function(btn, map) {
					map.removeControl(compare);
					map.removeLayer(lwmsLayer);
					map.removeLayer(rwmsLayer);
					tdWmsLayer.addTo(map);
					btn.state('enable-compare');
				}
			}]
		});

		stateChangingButton.addTo(map);
		var crosshairs_enabled = false;

		var selectAdm = L.easyButton({
			position: 'topright',
			states: [{
				stateName: 'enable-compare',        // name the state
				icon:      'glyphicon-globe',               // and define its properties
				title:     'Select Admin Region',      // like its title
				onClick: function(btn, map) {       // and its callback
					btn.state('disable-compare');    // change state on click!
					distLayer.setOpacity(0.5);
					distLayer.addTo(map);

		//L.control.layers(baselayers, distLayer).addTo(map);

					L.DomUtil.addClass(map._container, 'crosshair-cursor-enabled');
					crosshairs_enabled = true;

				}
			}, {
				stateName: 'disable-compare',
				icon:      'glyphicon-dashboard',
				title:     'Disable Admin Region',
				onClick: function(btn, map) {
					btn.state('enable-compare');
					map.removeLayer(distLayer);
					L.DomUtil.removeClass(map._container, 'crosshair-cursor-enabled');
					crosshairs_enabled = false;

				}
			}]
		});

		selectAdm.addTo(map);

		var downloadFile = L.easyButton('glyphicon-download-alt', function(btn, map){

			var fileUrl = threddss_wms_url.replace('wms','fileServer');
			var rd_type = ($("#rd_table option:selected").val());

			var downUrl = fileUrl+rd_type;
			window.location = (downUrl);
		}, 'Download the NetCDF file for the current run', { position: 'topright' }).addTo(map);

        var alterDate = function(delta) {
            var date = $.datepicker.parseDate(DATE_FORMAT, $date.val());

            $date
                .val($.datepicker.formatDate(DATE_FORMAT, new Date(date.valueOf() + delta * oneDay)))
                .change();
        };


        // Control date navigation for GIBS WMS layers, adjust the options.time and redraw. Exclude FIRE VIIRS layers (not time-enabled)
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

        document.getElementById("prev").onclick = alterDate.bind(null, -1);
        document.getElementById("next").onclick = alterDate.bind(null, 1);
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


        var timeDimensionControl = new L.Control.TimeDimensionCustom(timeDimensionControlOptions);
        map.addControl(timeDimensionControl);

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

// Create and add a TimeDimension Layer to the map
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


    $(function() {

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

			 $("#fire_range-max").on('change',function(){
                var freq = ($("#fire_freq_table option:selected").val());
                var rd_type = ($("#fire_rd_table option:selected").val());
                var var_type = ($("#fire_var_table option:selected").val());
                //var style =  ($("#style_table option:selected").val());
                //update_style(style);
                var rmin = $("#fire_range-min").val();
                var rmax = $("#fire_range-max").val();
                add_wms('fire',freq,rd_type,var_type,rmin,rmax,'rianbow');
            }).change();



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
                    if (item === 'combined'){
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
				console.log(var_type);
                var index = find_var_index(var_type,var_options);
                $("#aod_range-min").val(var_options[index]["min"]);
                $("#aod_range-max").val(var_options[index]["max"]).trigger('change');

            }).change();

			 $("#aod_range-max").on('change',function(){
                var run_type = ($("#aod_run_table option:selected").val());
                var freq = ($("#aod_freq_table option:selected").val());
                var rd_type = ($("#aod_rd_table option:selected").val());
                var var_type = ($("#aod_var_table option:selected").val());
                //var style =  ($("#style_table option:selected").val());
                //update_style(style);
                var rmin = $("#aod_range-min").val();
                var rmax = $("#aod_range-max").val();
                add_wms(run_type,freq,rd_type,var_type,rmin,rmax,'fire');
            }).change();



            $.each(thredds_options['catalog'],function(item,i){
                if(item.toUpperCase()!== "GEOS_TAVG1_2D_SLV_NX" && item.toUpperCase()!== "GEOS_TAVG3_2D_AER_NX"){
                    var new_option = new Option(item.toUpperCase(),item);
                    var noption = new Option(item.toUpperCase(),item);
                    var noption2 = new Option(item.toUpperCase(),item);
                    $("#run_table").append(new_option);
                    $("#lrun_table").append(noption);
                    $("#rrun_table").append(noption2);
                }
            });

            $("#run_table").change(function(){
                var run_type = ($("#run_table option:selected").val());
                $("#freq_table").html('');
                $("#lrd_table").html('');
                $("#rrd_table").html('');
                $("#lvar_table").html('');
                $("#rvar_table").html('');
                $.each(thredds_options['catalog'][run_type],function(item,i){
                    if (item === 'combined'){
                        var new_option = new Option(item,item);
                        $("#freq_table").append(new_option);
                    }
                });
                $("#freq_table").trigger('change');

                thredds_options['catalog'][run_type]['monthly'].forEach(function(item,i){
                    var opt = item.split('/').reverse()[0];
                    var new_option = new Option(opt,item);
                    var noption = new Option(opt,item);
                    $("#lrd_table").append(new_option);
                    $("#rrd_table").append(noption);
                });

                var_options.forEach(function(item,i){
                    if(item["category"] === run_type){

                        var new_option = new Option(item["display_name"]);
                        // +' ('+item["units"]+')'
                        var noption = new Option(item["display_name"],item["id"]);
                        $("#lvar_table").append(new_option);
                        $("#rvar_table").append(noption);
                    }
                });

            }).change();

            $("#lrun_table").change(function(){
                var run_type = ($("#lrun_table option:selected").val());

                $("#lrd_table").html('');
                $("#lvar_table").html('');

                thredds_options['catalog'][run_type]['monthly'].forEach(function(item,i){
                    var opt = item.split('/').reverse()[0];
                    var new_option = new Option(opt,item);
                    $("#lrd_table").append(new_option);
                });

                var_options.forEach(function(item,i){
                    if(item["category"] === run_type){
                        var new_option = new Option(item["display_name"],item["id"]);
                        $("#lvar_table").append(new_option);
                    }
                });

            }).change();

            $("#rrun_table").change(function(){
                var run_type = ($("#rrun_table option:selected").val());

                $("#rrd_table").html('');
                $("#rvar_table").html('');

                thredds_options['catalog'][run_type]['monthly'].forEach(function(item,i){
                    var opt = item.split('/').reverse()[0];
                    var new_option = new Option(opt,item);
                    $("#rrd_table").append(new_option);
                });

                var_options.forEach(function(item,i){
                    if(item["category"] === run_type){
                        var new_option = new Option(item["display_name"],item["id"]);
                        $("#rvar_table").append(new_option);
                    }
                });

            }).change();

            $("#freq_table").change(function(){
                var freq = ($("#freq_table option:selected").val());
                var run_type = ($("#run_table option:selected").val());
                $("#rd_table").html('');
                $("#var_table").html('');
                	if(thredds_options['catalog'][run_type][freq]){
                		    thredds_options['catalog'][run_type][freq].forEach(function(item,i){
                			var opt = item.split('/').reverse()[0];
                			var new_option = new Option(opt,item);
                			$("#rd_table").append(new_option);
                		    });
                	}
                $("#rd_table").trigger('change');

            }).change();

            $("#rd_table").change(function(){
                var freq = ($("#freq_table option:selected").val());
                var run_type = ($("#run_table option:selected").val());
                var rd_type = ($("#rd_table option:selected").val());

                $("#var_table").html('');

                var_options.forEach(function(item,i){
                    if(item["category"] === run_type){
                        var new_option = new Option(item["display_name"],item["id"]);
                        $("#var_table").append(new_option);
                    }
                });

                $("#var_table").trigger('change');

            }).change();

            $("#var_table").change(function(){
                var var_type = ($("#var_table option:selected").val());
                var index = find_var_index(var_type,var_options);
                $("#range-min").val(var_options[index]["min"]);
                $("#range-max").val(var_options[index]["max"]).trigger('change');
                //$("#style_table").trigger('change');
                // if(typeof int_type !== 'undefined'){
                //     get_ts();
                // }
            }).change();

            $("#rvar_table").change(function(){
                var var_type = ($("#rvar_table option:selected").val());
                var index = find_var_index(var_type,var_options);
                $("#crange-min").val(var_options[index]["min"]);
                $("#crange-max").val(var_options[index]["max"]);
            }).change();

            // $("#style_table").change(function(){
            //     var style = ($("#style_table option:selected").val());
            //     update_style(style);
            //     $("#range-max").trigger('change');
            // }).change();

            $("#range-min").on('change',function(){
                $("#range-max").trigger('change');
            });

            $("#range-max").on('change',function(){
                var run_type = ($("#run_table option:selected").val());
                var freq = ($("#freq_table option:selected").val());
                var rd_type = ($("#rd_table option:selected").val());
                var var_type = ($("#var_table option:selected").val());
                var style =  ($("#style_table option:selected").val());
                //update_style(style);
                var rmin = $("#range-min").val();
                var rmax = $("#range-max").val();
                add_wms(run_type,freq,rd_type,var_type,rmin,rmax,style);
            }).change();

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
        });


		});

	})();
