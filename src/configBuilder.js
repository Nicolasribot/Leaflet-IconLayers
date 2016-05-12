// TODO: check if should local to leaflet
var iconLayersConfigBuilder = {
    // uses a leaflet-wms objct (see @https://github.com/Nicolasribot/leaflet.wms)
    'buildFromWMSSource': function (source) {
        console.log(source);
        var ret = [{}];
        if (source) {
            return source.getLayersForControl();
        }
        
        return ret;
    },
    
    // uses a classic WMS leaflet layer
    'buildFromWMS': function (wmsLayer) {
        console.log(wmsLayer);
    }
};