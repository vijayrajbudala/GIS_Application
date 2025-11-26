require(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer"], function (Map, MapView, FeatureLayer) {
  const myMap = new Map({
    basemap: "topo",
  });

  const myView = new MapView({
    container: "viewDiv",
    map: myMap,
  });

    const fLayer = new FeatureLayer({
        url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/ServiceRequest/FeatureServer/0"
    });

    myMap.add(fLayer);
    fLayer.when(() => {
        myView.goTo(fLayer.fullExtent);
    });
});