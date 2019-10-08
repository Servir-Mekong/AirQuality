(function () {
	'use strict';
	angular.module('baseApp')
	.controller('airexplorer' ,function ($scope, $timeout, MapService, appSettings,) {

		/* global variables to be tossed around like hot potatoes */
		$scope.initdate = '';
		$scope.stylesSelectors = appSettings.stylesSelectors;

		var map,
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
		lwmsLayer,
		rwmsLayer,
		tdWmsLayer,
		drawnItems,
        distLayer,
		$layers_element;

		var init_opacity_slider = function(){
	        opacity = 1;
	        $("#opacity").text(opacity);
	        $( "#opacity-slider" ).bootstrapSlider({
	            value:opacity,
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

		map = L.map('map',{
            // timeDimension: true,
            // timeDimensionControl: true
        }).setView([15.8700, 100.9925], 5);

		var add_wms = function(run_type,freq,run_date,var_type,rmin,rmax,styling){
        //map.removeControl(legend);

        // var wmsUrl = threddss_wms_url+sdir+'/'+file_name;
        var wmsUrl = threddss_wms_url+run_date;
        // map.removeLayer(wms_layer);
        map.removeLayer(tdWmsLayer);
        //var index = find_var_index(var_type,var_options);
        // gen_color_bar(var_options[index]["colors_list"],scale);
        var layer_id = 'AOD_550_STD';
        var range = rmin+','+rmax;

        var style = 'boxfill/'+styling;
        opacity = $('#opacity-slider').bootstrapSlider("option", "value");

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


        tdWmsLayer = L.timeDimension.layer.wms(wmsLayer,{
            updateTimeDimension:true,
            setDefaultTime:true,
            cache:365,
            zIndex:100,
        });
        tdWmsLayer.addTo(map);
        var imgsrc = wmsUrl + "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&LAYER="+layer_id+"&colorscalerange="+range+"&PALETTE="+styling+"&transparent=TRUE";
        //console.log(imgsrc);

    };

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

		            $('.mod_link').on('click',get_ts);
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

        compare = L.control.sideBySide();
        var stateChangingButton = L.easyButton({
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

        L.Control.InfoControl = L.Control.extend({
            initialize: function (options) {
                "use strict";
                L.Util.setOptions(this, options);
            },
            onAdd: function () {
                "use strict";
                var container = L.DomUtil.create("div", "info-control leaflet-control-attribution");
                container.innerHTML = this.options.content;
                return container;
            },
            getContent: function () {
                "use strict";
                return this.getContainer().innerHTML;
            },
            setContent: function (html) {
                "use strict";
                this.getContainer().innerHTML = html;
            }
        });

        var downloadFile = L.easyButton('glyphicon-download-alt', function(btn, map){
            var fileUrl = threddss_wms_url.replace('wms','fileServer');
            var rd_type = ($("#rd_table option:selected").val());

            var downUrl = fileUrl+rd_type;
            window.location = (downUrl);
        },'Download the NetCDF file for the current run').addTo(map);

        var nrt_date = new L.Control.InfoControl({
            position: "topright",
            content: '<div id="controls"><button id="prev">Previous Day</button><input id="date"><button id="next">Next Day</button></div>'
        });
        map.addControl(nrt_date);

        var baselayers = {};
        var today = new Date();
        var day = new Date(today.getTime());
        var day = day.toISOString().split('T')[0];

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


        var alterDate = function(delta) {
            var date = $.datepicker.parseDate(DATE_FORMAT, $date.val());

            $date
                .val($.datepicker.formatDate(DATE_FORMAT, new Date(date.valueOf() + delta * oneDay)))
                .change();
        }


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
            if (type == 'Point'){
                var coords = feature["features"][0]["geometry"]["coordinates"];
                $("#point-lat-lon").val(coords);
                // get_ts();

            } else if (type == 'Polygon'){

                var coords = feature["features"][0]["geometry"];
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
        tdWmsLayer = L.timeDimension.layer.wms(wmsLayer);
		//tdWmsLayer.addTo(map);

        lwmsLayer = L.tileLayer.wms();

        rwmsLayer = L.tileLayer.wms();


		var init_events = function(){
			map.on("mousemove", function (event) {
				document.getElementById('mouse-position').innerHTML = 'Latitude:'+event.latlng.lat.toFixed(5)+', Longitude:'+event.latlng.lng.toFixed(5);
			});
		};
		init_events();

		var init_dropdown = function () {
			$(".run_table").select2({minimumResultsForSearch: -1});
			$(".style_table").select2({minimumResultsForSearch: -1});
			$(".var_table").select2({minimumResultsForSearch: -1});
		};
		init_dropdown();


		});

	})();
