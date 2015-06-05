+ function() {
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

    L.Control.IconLayers = L.Control.extend({
        includes: L.Mixin.Events,
        _getActiveLayer: function() {
            if (this._activeLayerId) {
                return this._layers[this._activeLayerId];
            } else if (length(this._layers)) {
                return first(this._layers);
            } else {
                return null;
            }
        },
        _getPreviousLayer: function() {
            var activeLayer = this._getActiveLayer();
            if (!activeLayer) {
                return null;
            } else if (this._previousLayerId) {
                return this._layers[this._previousLayerId];
            } else {
                return find(this._layers, function(l) {
                    return l.id !== activeLayer.id;
                }.bind(this)) || null;
            }
        },
        _getInactiveLayers: function() {
            var ar = [];
            var activeLayerId = this._getActiveLayer() ? this._getActiveLayer().id : null;
            var previousLayerId = this._getPreviousLayer() ? this._getPreviousLayer().id : null;
            each(this._layers, function(l) {
                if ((l.id !== activeLayerId) && (l.id !== previousLayerId)) {
                    ar.push(l);
                }
            });
            return ar;
        },
        _arrangeLayers: function() {
            var behaviors = {};

            behaviors['previous'] = function() {
                var activeLayer = this._getActiveLayer();
                var previousLayer = this._getPreviousLayer();
                if (previousLayer) {
                    return [previousLayer, activeLayer].concat(this._getInactiveLayers());
                } else if (activeLayer) {
                    return [activeLayer].concat(this._getInactiveLayers());
                } else {
                    return null;
                }
            };

            return behaviors[this.options.behavior].apply(this, arguments);
        },
        _getElementByLayerId: function(id) {
            var els = this._container.getElementsByClassName('leaflet-iconLayers-layer');
            for (var i = 0; i < els.length; i++) {
                if (els[i].getAttribute('data-layerid') == id) {
                    return els[i];
                }
            }
        },
        _getLayerIdByElement: function(el) {
            return el.getAttribute('data-layerid') / 1;
        },
        _createLayerElement: function(layerObj) {
            var el = L.DomUtil.create('div', 'leaflet-iconLayers-layer');
            el.setAttribute('data-layerid', layerObj.id);
            if (layerObj.title) {
                var titleContainerEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerTitleContainer');
                var titleEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerTitle');
                var checkIconEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerCheckIcon');
                var shutterEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerShutter');
                //shutterEl.innerHTML = shutterContent;
                titleEl.innerHTML = layerObj.title;
                titleContainerEl.appendChild(titleEl);
                el.appendChild(titleContainerEl);
                el.appendChild(shutterEl);
                el.appendChild(checkIconEl);
            }
            if (layerObj.icon) {
                el.setAttribute('style', "background-image: url('" + layerObj.icon + "')");
            }
            return el;
        },
        _createLayersElements: function() {
            var currentRow, layerCell;
            var layers = this._arrangeLayers();
            var activeLayerId = this._getActiveLayer().id;

            for (var i = 0; i < layers.length; i++) {
                if (i % this.options.maxLayersInRow === 0) {
                    currentRow = L.DomUtil.create('div', 'leaflet-iconLayers-layersRow');
                    prepend(this._container, currentRow);
                }
                layerCell = L.DomUtil.create('div', 'leaflet-iconLayers-layerCell');
                var layerEl = this._createLayerElement(layers[i]);
                if (i !== 0) {
                    L.DomUtil.addClass(layerEl, 'leaflet-iconLayers-layer_hidden');
                }
                if (layers[i].id === activeLayerId) {
                    L.DomUtil.addClass(layerEl, 'leaflet-iconLayers-layer_active');
                }
                layerCell.appendChild(layerEl);
                currentRow.appendChild(layerCell);
            }
        },
        expand: function() {
            this._arrangeLayers().slice(1).map(function(l) {
                var el = this._getElementByLayerId(l.id);
                L.DomUtil.removeClass(el, 'leaflet-iconLayers-layer_hidden');
            }.bind(this));
        },
        collapse: function() {
            this._arrangeLayers().slice(1).map(function(l) {
                var el = this._getElementByLayerId(l.id);
                L.DomUtil.addClass(el, 'leaflet-iconLayers-layer_hidden');
            }.bind(this));
        },
        _attachEvents: function() {
            each(this._layers, function(l) {
                var e = this._getElementByLayerId(l.id);
                if (e) {
                    e.addEventListener('click', function(e) {
                        e.stopPropagation();
                        this.setActiveLayer(l.layer);
                        this.expand();
                    }.bind(this));
                }
            }.bind(this));
            var layersRowCollection = this._container.getElementsByClassName('leaflet-iconLayers-layersRow');
            for (var i = 0; i < layersRowCollection.length; i++) {
                var el = layersRowCollection[i];
                el.addEventListener('mouseenter', function(e) {
                    e.stopPropagation();
                    this.expand();
                }.bind(this));
                el.addEventListener('mouseleave', function(e) {
                    e.stopPropagation();
                    this.collapse();
                }.bind(this));
                el.addEventListener('mousemove', function(e) {
                    e.stopPropagation();
                });
            }
        },
        _render: function() {
            this._container.innerHTML = '';
            this._createLayersElements();
            this._attachEvents();
        },
        options: {
            position: 'bottomleft', // one of expanding directions depends on this
            behavior: 'previous', // may be 'previous', 'expanded' or 'first'
            expand: 'horizontal', // or 'vertical'
            autoZIndex: true, // from L.Control.Layers
            maxLayersInRow: 5
        },
        initialize: function(layers, options) {
            L.setOptions(this, options);
            this.setLayers(layers);
        },
        onAdd: function(map) {
            this._container = L.DomUtil.create('div', 'leaflet-iconLayers');
            L.DomUtil.addClass(this._container, 'leaflet-iconLayers_' + this.options.position);
            this._render();
            return this._container;
        },
        setLayers: function(layers) {
            this._layers = {};
            layers.map(function(layer) {
                var id = L.stamp(layer.layer)
                this._layers[id] = L.extend(layer, {
                    id: id
                });
            }.bind(this));
            this._container && this._render();
        },
        setActiveLayer: function(layer) {
            var l = layer && this._layers[L.stamp(layer)];
            if (!l || l.id === this._activeLayerId) {
                return;
            }
            this._previousLayerId = this._activeLayerId;
            this._activeLayerId = l.id;
            this._container && this._render();
            this.fire('activelayerchange', {
                layer: layer
            });
        },
        _setDisabledLayersStyle: function(layers) {
            var disabledLayerIds = layers.map(function(l) {
                return L.stamp(l) + '';
            });

            var els = this._container ? this._container.getElementsByClassName('leaflet-iconLayers-layer') : [];

            Array.prototype.slice.call(els).map(function(el) {
                var elId = el.getAttribute('data-layerid');
                if (disabledLayerIds.indexOf(elId) + 1) {
                    L.DomUtil.addClass(el, 'leaflet-iconLayers-layer_disabled');
                } else {
                    L.DomUtil.removeClass(el, 'leaflet-iconLayers-layer_disabled');
                }
            });
        }
    });
}();