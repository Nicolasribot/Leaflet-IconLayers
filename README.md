# Leaflet-IconLayers

![](demo.gif)

![](demo-multi1.gif)

Leaflet base **and overlay** layers switching control with icons ([example](https://Nicolasribot.github.com/Leaflet-IconLayers/examples))

Displays layer icon and legend directly from WMS server if used with leaflet.wms (fork)

*Requires Leaflet 0.7.3 or newer; IE9+*

Extends `L.Control`.

## Using Control

Copy files from `src` dir and include them to your project.

Basic usage:

```javascript
// base layers switching
L.control.iconLayers(layers).addTo(map);

// overlays layers switching
L.control.iconLayers(overlayLayers, {multi: true}).addTo(map);
// 
```

In order to interact with layers Leaflet-IconLayers uses an array of layer objects, that have following fields:
- `icon` - icon url (typically 80x80)
- `title` - a short string that is displayed at the bottom of each icon
- `layer` - any Leaflet `ILayer`
- `options` - an optional object with currently one field: legend: the legend URL. Ex: `{legend: '/path/to/the/legend.png'}`


You can pass this array to construtor or use `setLayers` method.

The second constructor argument may be `options` hash. It is also ok if it is the only one.

## Options

- `maxLayersInRow` - the number of layers, that a row can contain
- `manageLayers` - by default control manages map layers. Pass `false` if you want to manage layers manually.
- `multi` - Multiple selection mode. Pass `true` if you want to manage overlay layers: multi-selection of layers with fixed layers positions in the component. Default to `false`
- `behavior` - the behavior controlling layers display. `previous` (default): previous layer is always displayed. `reorder`: layers can be reordered by D&D (to come...) and displayed in the defined order. (Default mode if `multi=true`)
- `theme` - the layer icon background color. Default to '#FFF'. Pass `'transparent'` to remove background. (useful for layers with transparent icons, like WMS layers)

plus `L.Control` options (`position`)

## Methods

- `setLayers(<Array> layers)` - replace layers array with a new one
- `setActiveLayer(<ILayer> layer)` - set active layer
- `collapse()` - hide secondary layers
- `expand()` - show hidden layers

## Events

- `activelayerchange` - fires when user changes active layer (clicks one of layer icons). The changed layer is passed in `layer` key of an event object (see an example).

## Detailed example
```javascript
var iconLayersControl = new L.Control.IconLayers(
    [
        {
            title: 'Map', // use any string
            layer: mapLayer, // any ILayer
            icon: 'img/mapIcon.png' // 80x80 icon
        },
        {
            title: 'Satellite',
            layer: satLayer,
            icon: 'img/mapIcon.png'
        }
    ], {
        position: 'bottomleft',
        maxLayersInRow: 5
    }
);

// new L.Control.IconLayers(layers)
// new L.Control.IconLayers(options)
// are also ok

iconLayersControl.addTo(map);

// we can modify layers list
iconLayersControl.setLayers(layers);

iconLayersControl.on('activelayerchange', function(e) {
    console.log('layer switched', e.layer);
});

// Advanced usage: 
// leaflet.wms (fork) WMS layers switching, with legends and layer icons available from WMS server.
// leaflet.wms is configured in auto mode: layers are loaded from getCapabilities WMS request
wmsSource = L.WMS.source(
"http://demo.opengeo.org/geoserver/wms?", {
    'format': 'image/png'}
);
wmsSource.addTo(map).loadFromWMS(function () {
    var opt = {
        multi: true,
        position: 'bottomleft',
        maxLayersInRow: 3,
        theme: '#707070'
    };
    L.control.iconLayers(this.getLayersForControl(), opt).addTo(map);
});
```
