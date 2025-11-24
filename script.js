 require([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/FeatureLayer",
      "esri/request",
      "esri/Graphic"
    ], function (Map, MapView, FeatureLayer, esriRequest, Graphic) {

      // -------------------------------------------------------------------
      // 1. Create base map and view
      // -------------------------------------------------------------------
      const map = new Map({
        basemap: "satellite"
      });

      const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-95.3698, 29.7604], // Houston area (sample data location)
        zoom: 10
      });

      // -------------------------------------------------------------------
      // 2. Service layer (read-only) - sample ServiceRequest layer
      // -------------------------------------------------------------------
      const serviceLayerUrl =
        "https://sampleserver6.arcgisonline.com/arcgis/rest/services/ServiceRequest/FeatureServer/0";

      const serviceLayer = new FeatureLayer({
        url: serviceLayerUrl,
        title: "Service Requests (Sample Server)"
      });

      map.add(serviceLayer);

      // -------------------------------------------------------------------
      // 3. Global variables for local JSON storage
      // -------------------------------------------------------------------
      const LOCAL_STORAGE_KEY = "localServiceRequestsJSON";
      let featuresData = [];      // pure JSON representation
      let clientLayer = null;     // client-side FeatureLayer
      let addMode = false;        // click-to-add mode
      let featureIdCounter = 1;   // local OBJECTID counter

      const statusSelect = document.getElementById("statusSelect");
      const toggleAddBtn = document.getElementById("toggleAddBtn");
      const downloadJsonBtn = document.getElementById("downloadJsonBtn");
      const addModeInfo = document.getElementById("addModeInfo");

      // -------------------------------------------------------------------
      // 4. Once view & service layer are ready, initialize
      // -------------------------------------------------------------------
      Promise.all([view.when(), serviceLayer.load()])
        .then(() => {
          // 4a. Use esriRequest to get renderer JSON & populate dropdown
          return initRendererDropdownFromService();
        })
        .then(() => {
          // 4b. Create client-side FeatureLayer with same renderer
          createClientSideLayer();
          // 4c. Load any previously saved JSON features
          loadFromLocalStorage();
          // 4d. Wire up UI events
          setupUIEvents();
          // 4e. Setup map click handler for adding features
          setupMapClickHandler();
        })
        .catch((error) => {
          console.error("Error during initialization:", error);
        });

      // -------------------------------------------------------------------
      // 4a. Use esriRequest to get drawingInfo.renderer and fill dropdown
      // -------------------------------------------------------------------
      function initRendererDropdownFromService() {
        return esriRequest(serviceLayerUrl, {
          query: { f: "json" },
          responseType: "json"
        }).then((response) => {
          const layerJSON = response.data;
          const drawingInfo = layerJSON && layerJSON.drawingInfo;
          const rendererJSON = drawingInfo && drawingInfo.renderer;

          if (!rendererJSON || !rendererJSON.uniqueValueInfos) {
            console.warn("No UniqueValueRenderer found on layer.");
            return;
          }

          const uniqueValueInfos = rendererJSON.uniqueValueInfos;
          uniqueValueInfos.forEach((info) => {
            const option = document.createElement("option");
            option.value = info.value;
            option.textContent = info.label || info.value;
            statusSelect.appendChild(option);
          });
        });
      }

      // -------------------------------------------------------------------
      // 4b. Client-side FeatureLayer that uses the SAME renderer as the service
      // -------------------------------------------------------------------
      function createClientSideLayer() {
        // Copy renderer directly from the service layer
        const rendererClone = serviceLayer.renderer && serviceLayer.renderer.clone
          ? serviceLayer.renderer.clone()
          : serviceLayer.renderer;

        clientLayer = new FeatureLayer({
          title: "Local Requests (JSON)",
          source: [], // will be filled by applyEdits()
          fields: [
            {
              name: "OBJECTID",
              alias: "OBJECTID",
              type: "oid"
            },
            {
              name: "status",
              alias: "Status",
              type: "string"
            }
          ],
          objectIdField: "OBJECTID",
          geometryType: "point",
          spatialReference: view.spatialReference,
          renderer: rendererClone,
          popupTemplate: {
            title: "Local Request",
            content: [
              {
                type: "fields",
                fieldInfos: [
                  { fieldName: "OBJECTID", label: "Local ID" },
                  { fieldName: "status", label: "Status" }
                ]
              }
            ]
          }
        });

        map.add(clientLayer);
      }

      // -------------------------------------------------------------------
      // 4c. Load from localStorage and rebuild clientLayer
      // -------------------------------------------------------------------
      function loadFromLocalStorage() {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!stored) {
          console.info("No local JSON found in localStorage.");
          return;
        }

        try {
          const arr = JSON.parse(stored);
          if (!Array.isArray(arr)) {
            console.warn("Stored JSON is not an array.");
            return;
          }

          featuresData = arr;

          const graphics = arr.map((item) => {
            return new Graphic({
              geometry: item.geometry,  // a JSON geometry object
              attributes: {
                OBJECTID: item.OBJECTID,
                status: item.status
              }
            });
          });

          if (graphics.length) {
            clientLayer.applyEdits({
              addFeatures: graphics
            }).then(() => {
              console.log("Client-side layer rebuilt from localStorage.");
            });
          }

          // Set the counter to max OBJECTID + 1
          const maxId = arr.reduce((max, f) => {
            const oid = f.OBJECTID || 0;
            return oid > max ? oid : max;
          }, 0);
          featureIdCounter = maxId + 1;

        } catch (err) {
          console.error("Error parsing local JSON:", err);
        }
      }

      // -------------------------------------------------------------------
      // 4d. UI buttons: toggle add mode + download JSON
      // -------------------------------------------------------------------
      function setupUIEvents() {
        toggleAddBtn.addEventListener("click", () => {
          addMode = !addMode;
          if (addMode) {
            toggleAddBtn.textContent = "Stop Add Mode";
            toggleAddBtn.classList.add("add-mode-on");
            addModeInfo.textContent = "Add mode ON: click on the map to add a point.";
          } else {
            toggleAddBtn.textContent = "Start Add Mode";
            toggleAddBtn.classList.remove("add-mode-on");
            addModeInfo.textContent = "Add mode OFF.";
          }
        });

        downloadJsonBtn.addEventListener("click", () => {
          if (!featuresData.length) {
            alert("No local features to download.");
            return;
          }
          const jsonStr = JSON.stringify(featuresData, null, 2);
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = "local_service_requests.json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }

      // -------------------------------------------------------------------
      // 4e. Map click handler – add local feature using selected status
      // -------------------------------------------------------------------
      function setupMapClickHandler() {
        view.on("click", function (event) {
          if (!addMode) {
            return; // only add when addMode is ON
          }

          const selectedStatus = statusSelect.value;
          if (!selectedStatus) {
            alert("Please choose a status from the dropdown first.");
            return;
          }

          // Convert screen click to map point
          const point = view.toMap(event);

          // Create Graphic with attributes
          const newGraphic = new Graphic({
            geometry: point,
            attributes: {
              OBJECTID: featureIdCounter,
              status: selectedStatus
            }
          });

          // Add to client-side FeatureLayer
          clientLayer.applyEdits({
            addFeatures: [newGraphic]
          }).then((editResult) => {
            const addResults = editResult.addFeatureResults;
            if (addResults && addResults.length && addResults[0].objectId != null) {
              const assignedObjectId = addResults[0].objectId;

              // Store JSON record
              const record = {
                OBJECTID: assignedObjectId,
                status: selectedStatus,
                geometry: point.toJSON()
              };
              featuresData.push(record);
              saveToLocalStorage();

              featureIdCounter = assignedObjectId + 1;

              console.log("Feature added locally with OBJECTID:", assignedObjectId);
            } else {
              console.warn("No objectId returned from applyEdits; storing with local counter.");
              const record = {
                OBJECTID: featureIdCounter,
                status: selectedStatus,
                geometry: point.toJSON()
              };
              featuresData.push(record);
              saveToLocalStorage();
              featureIdCounter += 1;
            }
          }).catch((err) => {
            console.error("Error adding local feature:", err);
          });
        });
      }

      // -------------------------------------------------------------------
      // Save current featuresData array as JSON in localStorage
      // -------------------------------------------------------------------
      function saveToLocalStorage() {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(featuresData));
        } catch (err) {
          console.error("Error saving to localStorage:", err);
        }
      }
console.log("TEXT");
    });
