require(["esri/Map", "esri/views/MapView"], function (Map, MapView) {
  const myMap = new Map({
    basemap: "topo",
  });

  const myView = new MapView({
    container: "viewDiv",
    map: myMap,
  });
});