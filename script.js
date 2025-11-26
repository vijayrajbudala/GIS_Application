require(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer", "esri/widgets/FeatureTable"], function (Map, MapView, FeatureLayer, FeatureTable) {
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
    const featureTable = new FeatureTable({
        view: myView,
        layer: fLayer,
        container: "tableDiv"
    });
});