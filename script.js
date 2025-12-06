require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/ScaleBar",
  "esri/widgets/Bookmarks",
  "esri/widgets/Expand",
  "esri/widgets/FeatureTable",
  "esri/widgets/BasemapToggle",
  "esri/widgets/LayerList",
  "esri/request"
], function (
  Map,
  MapView,
  FeatureLayer,
  ScaleBar,
  Bookmarks,
  Expand,
  FeatureTable,
  BasemapToggle,
  LayerList,
  esriRequest
) {
  const myMap = new Map({
    basemap: "topo",
  });

  const myView = new MapView({
    container: "viewDiv",
    map: myMap,
    center: [-98.5795, 39.8283],
    zoom: 4,
  });

  const layerURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/BLS_Monthly_Unemployment_Current_14_Months/FeatureServer/1";

  const fLayer = new FeatureLayer({
    url: layerURL,
  });

  myMap.add(fLayer);

  fLayer.when(() => {
    myView.goTo(fLayer.fullExtent);
  });

  const scaleBar = new ScaleBar({
    view: myView,
    unit: "metric",
  });
  myView.ui.add(scaleBar, "bottom-left");

  const bookmarks = new Bookmarks({
    view: myView,
  });

  const bkExpand = new Expand({
    view: myView,
    content: bookmarks,
    expanded: false,
  });
  myView.ui.add(bkExpand, "top-right");

  const featureTable = new FeatureTable({
    view: myView,
    layer: fLayer,
    container: "tableDiv",
  });

  const basemapToggle = new BasemapToggle({
    view: myView,
    nextBasemap: "satellite",
  });

  myView.ui.add(basemapToggle, "bottom-right");

  const layerList = new LayerList({
    view: myView,
  });

  myView.ui.add(layerList, {
    position: "top-left",
  });


  // Populate state select dropdown
  const stateSelect = document.getElementById("stateSelect");

  function loadStates() {
    esriRequest(layerURL + "/query", {
      query: {
        where: "1=1",
        outFields: "NAME",
        orderByFields: "NAME ASC",
        f: "json"
      },
      responseType: "json"
    }).then(function (response) {
      const features = response.data.features;
      console.log("this is the response from the esri Request", features);
      features.forEach(function (feature) {
        const name = feature.attributes.NAME;
        if (!name) return;
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        stateSelect.appendChild(option);
      })
    })

    //when state is selected, zoom to state
    stateSelect.addEventListener("change", function () {
      const selectedState = stateSelect.value;
      const where = "NAME = '" + selectedState + "'";
      fLayer.definitionExpression = where;
      fLayer.queryExtent({
        where: where
      }).then(function (result) {
        if (result.extent) {
          myView.goTo(result.extent);
        }
      })
    });
  }
  // loadStates();
  myView.when(function(){
    loadStates();
  })
});
