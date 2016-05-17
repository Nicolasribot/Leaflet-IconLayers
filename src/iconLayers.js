/*eslint-env commonjs, browser */
(function (factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('leaflet'));
    } else {
        window.L.control.iconLayers = factory(window.L);
        window.L.Control.IconLayers = window.L.control.iconLayers.Constructor;
    }
})(function (L) {
    function each(o, cb) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                cb(o[p], p, o);
            }
        }
    }

    function find(ar, cb) {
        if (ar.length) {
            for (var i = 0; i < ar.length; i++) {
                if (cb(ar[i])) {
                    return ar[i];
                }
            }
        } else {
            for (var p in ar) {
                if (ar.hasOwnProperty(p) && cb(ar[p])) {
                    return ar[p];
                }
            }
        }
    }

    function first(o) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                return o[p];
            }
        }
    }

    function length(o) {
        var length = 0;
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                length++;
            }
        }
        return length;
    }

    function prepend(parent, el) {
        if (parent.children.length) {
            parent.insertBefore(el, parent.children[0]);
        } else {
            parent.appendChild(el);
        }
    }

    var IconLayers = L.Control.extend({
        includes: L.Mixin.Events,
        _getActiveLayer: function () {
            if (this._activeLayerId) {
                return this._layers[this._activeLayerId];
            } else if (length(this._layers)) {
                return first(this._layers);
            } else {
                return null;
            }
        },
        _getPreviousLayer: function () {
            var activeLayer = this._getActiveLayer();
            if (!activeLayer) {
                return null;
            } else if (this._previousLayerId) {
                return this._layers[this._previousLayerId];
            } else {
                return find(this._layers, function (l) {
                    return l.id !== activeLayer.id;
                }.bind(this)) || null;
            }
        },
        _getInactiveLayers: function () {
            var ar = [];
            var activeLayerId = this._getActiveLayer() ? this._getActiveLayer().id : null;
            var previousLayerId = this._getPreviousLayer() ? this._getPreviousLayer().id : null;
            each(this._layers, function (l) {
                if ((l.id !== activeLayerId) && (l.id !== previousLayerId)) {
                    ar.push(l);
                }
            });
            return ar;
        },
        _arrangeLayers: function () {
            var behaviors = {};
            behaviors.previous = function () {
                var layers = this._getInactiveLayers();
                if (this._getActiveLayer()) {
                    layers.unshift(this._getActiveLayer());
                }
                if (this._getPreviousLayer()) {
                    layers.unshift(this._getPreviousLayer());
                }
                return layers;
            };
            behaviors.reorder = function () {
                // returns all layers, sorted according to reorder D&D action:
                // 2 cells can be sw
                var that = this;
                var layers = this._getInactiveLayers();
                if (this._getActiveLayer()) {
                    layers = layers.concat(this._getActiveLayer());
                }
                if (this._getPreviousLayer()) {
                    layers = layers.concat(this._getPreviousLayer());
                }
//                console.log('arrangingLayers with behavior: reorder');
                return layers.sort(function (a, b) {
                    return a.order < b.order;
                });
            };
            return behaviors[this.options.behavior].apply(this, arguments);
        },
        // reorders this._selectedLayers
        '_reorderLayers': function (idx1, idx2) {
            var src = this._layers[idx1], tgt = this._layers[idx2];
            var o = src.order;
            src.order = tgt.order;
            tgt.order = o;
//            console.log('new src: ' + src.id + '(' + src.order + ')' + ' new tgt: ' + tgt.id + '(' + tgt.order + ')');
        },
        _getLayerCellByLayerId: function (id) {
            var els = this._container.getElementsByClassName('leaflet-iconLayers-layerCell');
            for (var i = 0; i < els.length; i++) {
                if (els[i].getAttribute('data-layerid') == id) {
                    return els[i];
                }
            }
        },
        _createLayerElement: function (layerObj) {
            var el = L.DomUtil.create('div', 'leaflet-iconLayers-layer');

            if (layerObj.title) {
                var titleContainerEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerTitleContainer');
                var titleEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerTitle');
                var checkIconEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerCheckIcon');
                titleEl.innerHTML = layerObj.title;
                titleContainerEl.appendChild(titleEl);
                el.appendChild(titleContainerEl);
                el.appendChild(checkIconEl);
            }
            if (layerObj.icon) {
                // new theme bg property
                el.setAttribute('style', 'background-image: url(\'' + layerObj.icon + '\');'
                        + 'background-color: ' + this.options.theme);
            }
            if (layerObj.options) {
                var legendIconEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerLegendIcon');
                // sets internal id to be able to retrieve it on legend click.
                legendIconEl.setAttribute('data-layerid', layerObj.id);
                el.appendChild(legendIconEl);
            }
            return el;
        },
        _createLayerElements: function () {
            var currentRow, layerCell;
            var layers = this._arrangeLayers();
            var activeLayerId = this._getActiveLayer() && this._getActiveLayer().id;

            for (var i = 0; i < layers.length; i++) {
                if (i % this.options.maxLayersInRow === 0) {
                    currentRow = L.DomUtil.create('div', 'leaflet-iconLayers-layersRow');
                    if (this.options.position.indexOf('bottom') === -1) {
                        this._container.appendChild(currentRow);
                    } else {
                        prepend(this._container, currentRow);
                    }
                }
                layerCell = L.DomUtil.create('div', 'leaflet-iconLayers-layerCell');
                layerCell.setAttribute('data-layerid', layers[i].id);
                if (i !== 0) {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_hidden');
                }
                if (layers[i].id === activeLayerId) {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_active');
                }
                if (this._expandDirection === 'left') {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_expandLeft');
                } else {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_expandRight');
                }
                layerCell.appendChild(this._createLayerElement(layers[i]));

                if (this.options.position.indexOf('right') === -1) {
                    currentRow.appendChild(layerCell);
                } else {
                    prepend(currentRow, layerCell);
                }
            }
        },
        _createMultiLayerElements: function () {
//            console.log('creating multiLayerElems');
            var layers = this._arrangeLayers();
            for (var i = 0; i < layers.length; i++) {
                if (i % this.options.maxLayersInRow === 0) {
                    currentRow = L.DomUtil.create('div', 'leaflet-iconLayers-layersRow');
                    if (this.options.position.indexOf('bottom') === -1) {
                        this._container.appendChild(currentRow);
                    } else {
                        prepend(this._container, currentRow);
                    }
                }
                layerCell = L.DomUtil.create('div', 'leaflet-iconLayers-layerCell');
                layerCell.setAttribute('data-layerid', layers[i].id);

                if (i !== 0) {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_hidden');
                }
                // Manages new layers options: if options detected: Overlay 
                if (this._selectedLayers.indexOf(layers[i].id) > -1) {
                    // Applies check style for all selected layers
//                    console.log('setting selected style for: ' + layers[i].id);
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_mutli');
                }
                if (this._expandDirection === 'left') {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_expandLeft');
                } else {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_expandRight');
                }
                layerCell.appendChild(this._createLayerElement(layers[i]));

                if (this.options.position.indexOf('right') === -1) {
                    currentRow.appendChild(layerCell);
                } else {
                    prepend(currentRow, layerCell);
                }
            }

        },
        _onLayerClick: function (e) {
            e.stopPropagation();
            var layerId = e.currentTarget.getAttribute('data-layerid');
            var layer = this._layers[layerId];

            // manages multi mode: toggles check element
            if (this.options.multi === true) {
                var idx = this._selectedLayers.indexOf(Number(layerId));
//                console.log('clicked on: ' + layerId + ' (prev checked: ' + (idx > -1));
                if (idx > -1) {
//                    console.log('removing from selected: ' + layerId);
                    this._selectedLayers.splice(idx, 1);
                } else {
//                    console.log('pushing to selected: ' + layerId);
                    this._selectedLayers.push(Number(layerId));
                }
            }

            this.setActiveLayer(layer.layer);
            this.expand();
        },
        _onLegendClick: function (e) {
            e.stopPropagation();
            var layerId = e.target.getAttribute('data-layerid');
            var layer = this._layers[layerId];

            var legendClassName = 'leaflet-iconLayers-layerLegend';
            // set in a div to align vertically
            var div = L.DomUtil.create('div', legendClassName, this._container);
            var img = L.DomUtil.create('img', 'legendClassName', div);
            img.src = layer.options.legend;
            img.alt = layer.options.legend;
            this._map.openPopup(
                    div,
                    this._map.mouseEventToLatLng(e),
                    {autoPan: true, keepInView: true, maxHeight: 200}
            );
            this.collapse();
        },
        _attachEvents: function () {
            each(this._layers, function (l) {
                var e = this._getLayerCellByLayerId(l.id);
                if (e) {
                    e.addEventListener('click', this._onLayerClick.bind(this));
                    // legend click event
                    if (e.getElementsByClassName('leaflet-iconLayers-layerLegendIcon')[0]) {
                        e.getElementsByClassName('leaflet-iconLayers-layerLegendIcon')[0]
                                .addEventListener('click', this._onLegendClick.bind(this));
                    }
                    // drag/drop events in case of multi mode only
                    if (this.options.multi === true) {
                        // draggable attributes
                        e.draggable = true;
                        e.droppable = true;
                        e.addEventListener('dragstart', this._dragCell.bind(this));
                        e.addEventListener('drop', this._dropCell.bind(this));
                        e.addEventListener('dragover', this._allowDropCell.bind(this));
                        e.addEventListener('dragenter', this._dragEnterCell);
                        e.addEventListener('dragleave', this._dragLeaveCell);
                        e.addEventListener('dragend', this._dragEndCell.bind(this));
                    }
                }
            }.bind(this));
            var layersRowCollection = this._container.getElementsByClassName('leaflet-iconLayers-layersRow');

            var onMouseEnter = function (e) {
                e.stopPropagation();
                this.expand();
            }.bind(this);

            var onMouseLeave = function (e) {
                e.stopPropagation();
                this.collapse();
            }.bind(this);

            var onMouseOver = function (e) {
                this._map.dragging.disable();
            }.bind(this);

            var onMouseOut = function (e) {
                this._map.dragging.enable();
            }.bind(this);

            var stopPropagation = function (e) {
                e.stopPropagation();
            };

            //TODO Don't make functions within a loop.
            for (var i = 0; i < layersRowCollection.length; i++) {
                var el = layersRowCollection[i];
                el.addEventListener('mouseenter', onMouseEnter);
                el.addEventListener('mouseout', onMouseOut);
                el.addEventListener('mousemove', stopPropagation);
                if (this.options.multi) {
                    // to enable d&d on cells
                    el.addEventListener('mouseleave', onMouseLeave);
                    el.addEventListener('mouseover', onMouseOver);
                }
            }
        },
        _render: function () {
            this._container.innerHTML = '';
            if (this.options.multi === true) {
                this._createMultiLayerElements();
            } else {
                this._createLayerElements();
            }

            this._attachEvents();
        },
        // drag events
        '_dragEnterCell': function (e) {
            // this / e.target is the current hover target.
//            console.log('dragEnter');
            this.classList.add('over');
        },
        '_dragLeaveCell': function (e) {
            // this / e.target is the current hover target.
//            console.log('dragleave');
            this.classList.remove('over');
        },
        '_dropCell': function (event) {
            var elem = event.currentTarget !== undefined ? event.currentTarget : this;
            var targetId = elem.getAttribute('data-layerid');
            var sourceId = event.dataTransfer.getData("text/plain");
            if (sourceId !== undefined && targetId !== undefined && sourceId !== targetId) {
//                console.log('Dropping cell: ' + sourceId + ' on cell: ' + targetId);
                this._reorderLayers(sourceId, targetId);
                this.setActiveLayer(this._layers[sourceId]);
                //this._switchMultiMapLayers();
                this.expand();
            }
            return false;
        },
        '_dragCell': function (ev) {
//            console.log('dragOverCell');
            var elem = ev.currentTarget !== undefined ? ev.currentTarget : this;
            elem.style.opacity = '0.8';
            L.DomUtil.addClass(elem, 'moving');
//            console.log(elem.getAttribute('data-layerid'));
            var sourceId = elem.getAttribute('data-layerid');
            ev.dataTransfer.effectAllowed = 'move';
            ev.dataTransfer.setData("text/plain", sourceId);

        },
        '_dragEndCell': function (event) {
            // this/e.target is the source node.
            each(this._layers, function (l) {
                var e = this._getLayerCellByLayerId(l.id);
                L.DomUtil.removeClass(e, 'over');
                L.DomUtil.removeClass(e, 'moving');
            }.bind(this));
        },
        '_allowDropCell': function (event) {
            if (event.preventDefault) {
                event.preventDefault(); // Necessary. Allows us to drop.
            }
            event.dataTransfer.dropEffect = 'move';
            return false;
        },
        _switchMapLayers: function () {
            if (!this._map) {
                return;
            }
            var activeLayer = this._getActiveLayer();
            var previousLayer = this._getPreviousLayer();
            if (previousLayer) {
                this._map.removeLayer(previousLayer.layer);
            } else {
                each(this._layers, function (layerObject) {
                    var layer = layerObject.layer;
                    this._map.removeLayer(layer);
                }.bind(this));
            }
            if (activeLayer) {
                this._map.addLayer(activeLayer.layer);
            }
        },
        // switches selected layers, preserving their order
        _switchMultiMapLayers: function () {
            if (!this._map) {
                return;
            }
//            console.log('switching multi layers');
            // switches all layers except those in array, preserving display order
            // for each layer in order, if 
//            console.log(this._layers);
            Object.keys(this._layers).map(function (key) {
                return this._layers[key];
            }.bind(this)).sort(function (a, b) {
                return a.order < b.order;
            }).reverse().map(function(layerObject) {
                var layer = layerObject.layer;
                if (this._selectedLayers.indexOf(layerObject.id) > -1) {
//                    console.log('adding layer: ' + layerObject.id);
                    this._map.addLayer(layer);
                } else {
//                    console.log('removing layer: ' + layerObject.id);
                    this._map.removeLayer(layer);
                }
            }.bind(this));
        },
        options: {
            position: 'bottomleft', // one of expanding directions depends on this
            behavior: 'previous', // may be 'previous', 'expanded' or 'first'
            expand: 'horizontal', // or 'vertical'
            autoZIndex: true, // from L.Control.Layers
            maxLayersInRow: 5,
            manageLayers: true,
            multi: false, // true: handles overlays: several checks possible
            theme: '#fff' // bg color for layer icon, for ex: '#707070', 'transparent'
                    //(whose icons can be transparent)
        },
        initialize: function (layers, options) {
            if (!L.Util.isArray(arguments[0])) {
                // first argument is options
                options = layers;
                layers = [];
            }
            L.setOptions(this, options);
            this._expandDirection = (this.options.position.indexOf('left') != -1) ? 'right' : 'left';
            if (this.options.manageLayers) {
//                console.log(this.options);
                // new multi mode: specific handlers to keep existing code
                var evHandler = this._switchMapLayers;
                if (this.options.multi === true) {
                    evHandler = this._switchMultiMapLayers;
                    // forces nochange behavior
                    this.options.behavior = 'reorder';
                }
                this.on('activelayerchange', evHandler, this);
            }

            // multi management, with custom move operation
            this._selectedLayers = [];
            this.setLayers(layers);
        },
        onAdd: function (map) {
            this._container = L.DomUtil.create('div', 'leaflet-iconLayers');
            L.DomUtil.addClass(this._container, 'leaflet-iconLayers_' + this.options.position);
            this._render();
            map.on('click', this.collapse, this);
            if (this.options.manageLayers) {
                if (this.options.multi === true) {
                    this._switchMultiMapLayers();
                } else {
                    this._switchMapLayers();
                }
            }
            return this._container;
        },
        onRemove: function (map) {
            map.off('click', this.collapse, this);
        },
        setLayers: function (layers) {
            this._layers = {};
            var i = 0;
            layers.map(function (layer) {
                var id = L.stamp(layer.layer);
                // adds a order variable to manage layer order
                this._layers[id] = L.extend(layer, {
                    id: id,
                    order: i++
                });
//                console.log('treating id: ' + id);

                // multi management: all layers selected by default: todo: config to select layers
                if (this.options.multi === true) {
                    this._selectedLayers.push(id);
                }
            }.bind(this));

//            console.log('Adding layers ids: ' + this._selectedLayers.join(', '));
            if (this._container) {
                this._render();
            }
        },
        setActiveLayer: function (layer) {
//            console.log('setActiveLayer called...');
            var l = layer && this._layers[L.stamp(layer)];
            if (this.options.multi === true ) {
                if (this._container) {
                    this._render();
                }
                this.fire('activelayerchange', {
                    layer: layer
                });
            } else {
                if (!l || (l.id === this._activeLayerId)) {
                    return;
                }
                if (l) {
                    this._previousLayerId = this._activeLayerId;
                    this._activeLayerId = l.id;
                }
                this.fire('activelayerchange', {
                    layer: layer
                });
            }
        },
        expand: function () {
            var idx = this.options.multi ? 0 : 1;
            this._arrangeLayers().slice(idx).map(function (l) {
                var el = this._getLayerCellByLayerId(l.id);
                L.DomUtil.removeClass(el, 'leaflet-iconLayers-layerCell_hidden');
            }.bind(this));
        },
        collapse: function () {
            this._arrangeLayers().slice(1).map(function (l) {
                var el = this._getLayerCellByLayerId(l.id);
                L.DomUtil.addClass(el, 'leaflet-iconLayers-layerCell_hidden');
            }.bind(this));
        }
    });

    var iconLayers = function (layers, options) {
        return new IconLayers(layers, options);
    };

    iconLayers.Constructor = IconLayers;

    return iconLayers;
});

// TODO: clean: 
//  each iterator
// class setter/getter