require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
], function (Map, MapView, FeatureLayer) {
  const myMap = new Map({
    basemap: "topo",
  });

  const myView = new MapView({
    container: "viewDiv",
    map: myMap,
  });
  const FeatureLayer_1 = new FeatureLayer({
    url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/Landscape_Trees/FeatureServer/0",
  });

  myMap.add(FeatureLayer_1);
  FeatureLayer_1.when(() => {
    console.log("Layer loaded");
    myView.goTo(FeatureLayer_1.fullExtent);
  });
});
