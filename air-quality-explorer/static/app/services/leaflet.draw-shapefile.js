/* 	Extension to Leaflet.draw 0.4.9.
	Dependencies: Leaflet.draw, Leaflet.shapefile w/ shp.js,
	Add a button to the draw toolbar to import a shapefile
*/

L.Control.DrawPlus = L.Control.Draw.extend({

    options: {
        draw: {
            shapefile: {
                stroke: true,
                color: '#3388ff',
                weight: 4,
                opacity: 0.5,
                fill: true,
                fillColor: null, //same as color by default
                fillOpacity: 0.2,
                clickable: true
            },
            geojson: {
                stroke: true,
                color: '#3388ff',
                weight: 4,
                opacity: 0.5,
                fill: true,
                fillColor: null, //same as color by default
                fillOpacity: 0.2,
                clickable: true
            },
        }
    },

    initialize: function(options) {
        this._setOptions(options);
        L.Control.Draw.prototype.initialize.call(this, options);
    },

    onAdd: function(map) {
        var container = L.Control.Draw.prototype.onAdd.call(this,map);
        var drawContainer = container.getElementsByClassName('leaflet-draw-toolbar-top')[0];

        if (this.options.draw.shapefile){
            this._addShapefileButton(map, drawContainer);
        }
        if (this.options.draw.admin){
            this._addWMSButton(map, drawContainer);
        }

        return container;
    },

    _addShapefileButton: function(map, drawContainer){

        var shapefileNode = document.createElement("a");
        shapefileNode.setAttribute('class','leaflet-draw-draw-shapefile');
        shapefileNode.setAttribute('href','#');
        shapefileNode.setAttribute('title','Upload a shapefile (.zip)');

        var inputNode = document.createElement('input');
        inputNode.setAttribute('type','file');
        inputNode.setAttribute('id','leaflet-draw-shapefile-selector');
        inputNode.setAttribute('accept','.zip,.json,.geojson');

        inputNode.addEventListener('change', function(e){
            var files = inputNode.files;
            if (files.length == 0) {
                return; //No file selected. Cancel.
            }

            var file = files[0];
            var reader = new FileReader();
            reader.onload = function() {
                if (reader.readyState !== 2 || reader.error) {
                    return;
                } else {
                    L.toolbar._handleShapefile(map, reader.result);
                }
            };
            reader.readAsArrayBuffer(file);
            inputNode.value = null;
        });

        var btnNode = document.createElement('div');
        btnNode.setAttribute('id','leaflet-draw-draw-shapefile-btn');
        btnNode.addEventListener('click',function(e){
            inputNode.click();
        });

        shapefileNode.appendChild(inputNode);
        shapefileNode.appendChild(btnNode);

        drawContainer.appendChild(shapefileNode);

    },

    //Want to fire one created event per shape in the zip. Handle multiple files inside the zip.
    _handleShapefile: function(map, buffer){
        var styleOptions = this.options.draw.shapefile.shapeOptions;
        shp(buffer).then(function(geojson){
            var layer = L.shapefile(geojson);
            map.fire(L.Draw.Event.CREATED, { layer: layer, layerType: 'shapefile'});
        });
    },


    //Merge my options for the shapefile if needed. Not sure how they do it normally
    _setOptions(options) {
        if (options.draw.shapefile){
            if (options.draw.shapefile == true){
                options.draw.shapefile = this.options.draw.shapefile;
            } else {
                Object.assign(options.draw.shapefile, this.options.draw.shapefile);
            }
        }

    }


});