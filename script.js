require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/ScaleBar",
  "esri/widgets/Bookmarks",
    "esri/widgets/Expand",
    "esri/widgets/Measurement",
  "esri/widgets/FeatureTable"

], function (Map, MapView, FeatureLayer, ScaleBar, Bookmarks, Expand, Measurement, FeatureTable) {

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
  
  const scaleBar = new ScaleBar({
    view: myView,
    unit: "metric" 
  });
  myView.ui.add(scaleBar, "bottom-left");

  const bookmarks = new Bookmarks({
    view: myView
  });

  const bkExpand = new Expand({
    view: myView,
    content: bookmarks,
    expanded: false
  });

    myView.ui.add(bkExpand, "top-right");

    const measurement = new Measurement({
        view: myView,
        activeTool: "distance"
    });
    myView.ui.add(measurement, "top-left");

    const featureTable = new FeatureTable({
        view: myView,
        layer: fLayer,
        container: "tableDiv"
    });

});
