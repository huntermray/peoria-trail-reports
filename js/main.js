import Map from "esri/Map";
import MapView from "esri/views/MapView";
import FeatureLayer from "esri/layers/FeatureLayer";
import Graphic from "esri/Graphic";
import Expand from "esri/widgets/Expand";
import FeatureForm from "esri/widgets/FeatureForm";
import FeatureTemplates from "esri/widgets/FeatureTemplates";
import Home from "esri/widgets/Home";
import Locate from "esri/widgets/Locate";
import LayerList from "esri/widgets/LayerList";
import Legend from "esri/widgets/Legend";
import BasemapGallery from "esri/widgets/BasemapGallery";
import Search from "esri/widgets/Search";

let editFeature, highlight, reportsLayerView, reportsExpand, editExpand;

export const popupTemplateUtils = {
    // autocasts as new PopupTemplate()
    title: "{UTILITY_TYPE}"};
export const popupTemplateTrails = {
    // autocasts as new PopupTemplate()
    title: "{TRAIL_NAME} in {PARK_NAME} Park",
    content: [{
        // It is also possible to set the fieldInfos outside of the content
        // directly in the popupTemplate. If no fieldInfos is specifically set
        // in the content, it defaults to whatever may be set within the popupTemplate.
        type: "fields",
        fieldInfos: [
            {
                fieldName: "TRAIL_NAME",label: "Name"
            },{
                fieldName: "TRAIL_DIFF",label: "Difficulty"
            },{
                fieldName: "TRAIL_TYPE",label: "Trail Type"
            },{
                fieldName: "DISTANCE_FT",
                label: "Distance(Ft)",
                format: {
                    digitSeparator: true,
                    places: 0
                }
            },{
                fieldName: "DESCENT_FT",
                label: "Descent(Ft)",
                format: {
                    digitSeparator: true,
                    places: 0
                }
            },{
                fieldName: "ALT_CLIMB_FT",
                label: "Climb(Ft)",
                format: {
                    digitSeparator: true,
                    places: 0
                }
            },{
                fieldName: "GRADE",
                label: "Grade",
                format: {
                    digitSeparator: true,
                    places: 2
                }
            },{
                fieldName: "ALT_MAX_FT",
                label: "Max. Alt. (Ft)",
                format: {
                    digitSeparator: true,
                    places: 0
                }
            }
        ]
    }]
};

export const reportsLayer = new FeatureLayer({
    url:
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Peoria_Trail_Reports_3/FeatureServer/0",
    title: "Trail Reports",
    outFields: ["*"],
    popupEnabled: true,
    id: "reportsLayer",
    visible: true
});

export const utilitiesLayer = new FeatureLayer({
    url:
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/KinseyPark_Utilities/FeatureServer/0",
    title: "Access/Info",
    outFields: ["*"],
    popupEnabled: true,
    popupTemplate: popupTemplateUtils,
    id: "kpUtilities",
    visible: false
});

export const trailsLayer = new FeatureLayer({
    url:
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/KP_WPP_Trails/FeatureServer/0",
    title: "Trails",
    outFields: ["*"],
    popupEnabled: true,
    popupTemplate: popupTemplateTrails,
    id: "Trails",
    visible: true
});

export const map = new Map({
    basemap: "gray-vector",
    layers: [trailsLayer,reportsLayer,utilitiesLayer]
});

export const view = new MapView({
    container: "viewDiv",
    map: map,
    //center: [-89.7195, 40.750],
    //zoom: 15
});
// Sets the default center/zoom for map view to the extent of trailsLayer
trailsLayer.when(() => {
    view.goTo(trailsLayer.fullExtent);
});

export const homeBtn = new Home({
    view: view
});
//Add item to top left of map view
view.ui.add(homeBtn, "top-left");

export const locateBtn = new Locate({
    view: view
});
//Add item to top left of map view
view.ui.add(locateBtn, "top-left");

export const layersWidg = new LayerList({
    view: view,
    listItemCreatedFunction: function(event) {
      export const item = event.item;
      if (item.layer.id == "Trails") {
          // don't show legend twice
          item.panel = {
              content: "legend",
              open: true
          };
      } else if (item.layer.id != "Trails"){
          item.panel = {
              content: "legend",
              open: false
          };
      }
    }
});

// add the layerList widget inside of Expand widget
export const layersExpand = new Expand({
    expandIconClass: "esri-icon-layers",
    expandTooltip: "Layer List",
    collapseTooltip: "Collapse Layer window",
    view: view,
    content: layersWidg,
    expanded: true
});

// if layersExpand is clicked to expand while bgExpand/searchExpand are open
// close bgExpand/searchExpand to stop overlap
layersExpand.watch("expanded", function() {
    //export const layerExpandBool = layersExpand.expanded;
    //console.log(layerExpandBool);
    if (layersExpand.expanded === true){
      bgExpand.collapse();
      searchExpand.collapse();
    }
});
//Add item to top right of map view
view.ui.add(layersExpand, "top-right");

export const reportsNodes = document.querySelectorAll(".report-item");
export const reportsElement = document.getElementById("reports-filter");

// click event handler for seasons choices
reportsElement.addEventListener("click", filterByStatus);
// User clicked on Clear, Minor Issue, Major Issue, Closed
// set an attribute filter on trial reports layer view
// to display the reports with selected status
function filterByStatus(event) {
    export const selectedStatus = event.target.getAttribute("data-status");
    reportsLayerView.filter = {
      where: "STATUS = '" + selectedStatus + "'"
  };}

view.whenLayerView(reportsLayer).then(function(layerView) {
    // flash trail reports layer loaded
    // get a reference to the reports layerview
    reportsLayerView = layerView;
    // set up UI items
    reportsElement.style.visibility = "visible";

    reportsExpand = new Expand({
      expandTooltip: "Filter by Report Status",
      collapseTooltip:"Collapse to clear filters",
      view: view,
      content: reportsElement,
      expandIconClass: "esri-icon-filter",
      group: "top-left"
    });
    //clear the filters when user closes the expand widget
    reportsExpand.watch("expanded", function() {
      if (!reportsExpand.expanded) {
          reportsLayerView.filter = null;
      }
      if (reportsExpand.expanded === true) {
          editExpand.collapse();
          infoExpand.collapse();
      }
    });
    //Add item to top left of map view
    view.ui.add(reportsExpand, "top-left");
});

// Create a BasemapGallery widget instance and set
// its container to a div element

export const basemapGallery = new BasemapGallery({
    view: view,
    container: document.createElement("div")
});

// Create an Expand instance and set the content
// property to the DOM node of the basemap gallery widget
// Use an Esri icon font to represent the content inside
// of the Expand widget
export const bgExpand = new Expand({
    expandTooltip: "Basemap Selector",
    collapseTooltip:"Collapse Basemap window",
    view: view,
    content: basemapGallery
});

// if sxmall mobile device is being used then
// close the expand whenever a basemap is selected
// if basemap selction made, close expand
basemapGallery.watch("activeBasemap", function() {
    export const mobileSize =
      view.heightBreakpoint === "xsmall" ||
      view.widthBreakpoint === "xsmall";
    if (mobileSize) {
      bgExpand.collapse();
    }
    if (basemapGallery.activeBasemap !== ''){
      bgExpand.collapse();
    }
});


// if bgExpand is clicked to expand while layersExpand open
// close layersExpand to stop overlap
bgExpand.watch("expanded", function() {
    if (bgExpand.expanded === true){
      layersExpand.collapse();
      searchExpand.collapse();
    }
});

//Add item to top right of map view
view.ui.add(bgExpand, "top-right");

export const searchWidget = new Search({
    view: view,
    allPlaceholder: "Trail Name",
    includeDefaultSources: false,
    sources: [
      {
          layer: trailsLayer,
          searchFields: ["TRAIL_NAME"],
          displayField: "TRAIL_NAME",
          exactMatch: false,
          //outFields: ["NAME", "TRAIL_DIFF", "TRAIL_TYPE"],
          name: "Trails",
          placeholder: "example: Land of Oz"
      }
    ]
});

export const searchExpand = new Expand({
    expandTooltip: "Trail Search",
    collapseTooltip: "Collapse search window",
    view: view,
    expanded: false,
    content: searchWidget
});

// if searchExpand is clicked to expand while layersExpand open
// close layersExpand to stop overlap
searchExpand.watch("expanded", function() {
    if (searchExpand.expanded === true){
        layersExpand.collapse();
        bgExpand.collapse();
    }
});

//Add item to top right of map view
view.ui.add(searchExpand, {position: "top-right"});

// New FeatureForm and set its layer to 'TrailReports' FeatureLayer.
// FeatureForm displays attributes of fields specified in fieldConfig.
export const featureForm = new FeatureForm({
  container: "formDiv",
  layer: reportsLayer,
  fieldConfig:[
      {
          name: "PARKNAME",
          label: "Choose Park"
      },{
          name: "TRAILNAME",
          label: "Choose Trail"
      },{
          name: "STATUS",
          label: "Choose Status"
      },{
          name: "CONDITION",
          label: "Condition"
      },{
          name: "DESCRIPTION1",
          label: "Pick description"
      },{
          name: "DESCRIPTION2",
          label: "Enter comments"
      },{
          name: "ACTIVITY",
          label: "Choose trail activity"
      }
  ]
});

// Listen to the feature form's submit event.
// Update feature attributes shown in the form.
featureForm.on("submit", function() {
  if (editFeature) {
      // Grab updated attributes from the form.
      export const updated = featureForm.getValues();

      // Loop through updated attributes and assign
      // the updated values to feature attributes.
      Object.keys(updated).forEach(function(name) {
          editFeature.attributes[name] = updated[name];
      });

      // Setup the applyEdits parameter with updates.
      export const edits = {
          updateFeatures: [editFeature]
      };
      applyEditsToIncidents(edits);
      document.getElementById("viewDiv").style.cursor = "auto";
  }
});

// Check if the user clicked on the existing feature
selectExistingFeature();

// The FeatureTemplates widget uses the 'addTemplatesDiv'
// element to display feature templates from reportsLayer
export const templates = new FeatureTemplates({
  container: "addTemplatesDiv",
  layers: [reportsLayer]
});

// Listen for when a template item is selected
templates.on("select", function(evtTemplate) {
  // Access the template item's attributes from the event's
  // template prototype.
  attributes = evtTemplate.template.prototype.attributes;
  unselectFeature();
  document.getElementById("viewDiv").style.cursor = "crosshair";

  // With the selected template item, listen for the view's click event and create feature
  export const handler = view.on("click", function(event) {
      // remove click event handler once user clicks on the view
      // to create a new feature
      handler.remove();
      event.stopPropagation();
      featureForm.feature = null;

      if (event.mapPoint) {
          point = event.mapPoint.clone();
          point.z = undefined;
          point.hasZ = false;

          // Create a new feature using one of the selected
          // template items.
          editFeature = new Graphic({
              geometry: point,
              attributes: {
                  STATUS: attributes.STATUS
              }
          });

          // Setup the applyEdits parameter with adds.
          export const edits = {
              addFeatures: [editFeature]
          };
          applyEditsToIncidents(edits);
          document.getElementById("viewDiv").style.cursor = "auto";
      } else {
          console.error("event.mapPoint is not defined");
      }
  });
});
// Call FeatureLayer.applyEdits() with specified params.
function applyEditsToIncidents(params) {
  // unselectFeature();
  reportsLayer
      .applyEdits(params)
      .then(function(editsResult) {
      // Get the objectId of the newly added feature.
      // Call selectFeature function to highlight the new feature.
      if (
          editsResult.addFeatureResults.length > 0 ||
          editsResult.updateFeatureResults.length > 0
      ) {
          unselectFeature();
          let objectId;
          if (editsResult.addFeatureResults.length > 0) {
              objectId = editsResult.addFeatureResults[0].objectId;
          } else {
              featureForm.feature = null;
              objectId = editsResult.updateFeatureResults[0].objectId;
          }
          selectFeature(objectId);
          if (addFeatureDiv.style.display === "block") {
              toggleEditingDivs("none", "block");
          }
      }
      // show FeatureTemplates if user deleted a feature
      else if (editsResult.deleteFeatureResults.length > 0) {
          toggleEditingDivs("block", "none");
      }
  })
      .catch(function(error) {
      console.log("===============================================");
      console.error(
          "[ applyEdits ] FAILURE: ",
          error.code,
          error.name,
          error.message
      );
      console.log("error = ", error);
  });
}

// Check if a user clicked on an incident feature.
function selectExistingFeature() {
  view.on("click", function(event) {

      // clear previous feature selection
      unselectFeature();
      if (
          document.getElementById("viewDiv").style.cursor != "crosshair"
      ) {
          view.hitTest(event).then(function(response) {
              // If a user clicks on an incident feature, select the feature.
              if (response.results.length === 0) {
                  toggleEditingDivs("block", "none");
              } else if (
                  response.results[0].graphic &&
                  response.results[0].graphic.layer.id == "reportsLayer"
              ) {
                  if (addFeatureDiv.style.display === "block") {
                      toggleEditingDivs("none", "block");
                  }
                  selectFeature(
                      response.results[0].graphic.attributes[
                          reportsLayer.objectIdField
                      ]
                  );}
          });
      }
  });
};

// Highlights the clicked feature and display
// the feature form with the incident's attributes.
function selectFeature(objectId) {
  // query feature from the server
  reportsLayer
      .queryFeatures({
      objectIds: [objectId],
      outFields: ["*"],
      returnGeometry: true
  })
      .then(function(results) {
      if (results.features.length > 0) {
          editExpand.expand();
          editFeature = results.features[0];
          // display the attributes of selected feature in the form
          featureForm.feature = editFeature;
          // highlight the feature on the view
          view.whenLayerView(editFeature.layer).then(function(layerView) {
              highlight = layerView.highlight(editFeature);
          });
      }
  }
           );
};

// Expand widget for the editArea div.
editExpand = new Expand({
  expandIconClass: "esri-icon-edit",
  expandTooltip: "Expand Edit",
  expanded: false,
  view: view,
  content: document.getElementById("editArea")
});

// if editExpand is clicked to expand while reportsExpand open
// close reportsExpand to stop overlap
editExpand.watch("expanded", function() {
  if (editExpand.expanded === true){
      reportsExpand.collapse();
      infoExpand.collapse();
  }
});
//Add item to top left of map view
view.ui.add(editExpand, "top-left");

// input boxes for the attribute editing
export const addFeatureDiv = document.getElementById("addFeatureDiv");
export const attributeEditing = document.getElementById("featureUpdateDiv");

// Controls visibility of addFeature or attributeEditing divs
function toggleEditingDivs(addDiv, attributesDiv) {
  addFeatureDiv.style.display = addDiv;
  attributeEditing.style.display = attributesDiv;
  document.getElementById(
      "updateInstructionDiv"
  ).style.display = addDiv;
};

// Remove the feature highlight and remove attributes
// from the feature form.
function unselectFeature() {
  if (highlight) {
      highlight.remove();
  }
};

// Update attributes of the selected feature.
document.getElementById("btnUpdate").onclick = function() {
  // Fires feature form's submit event.
  featureForm.submit();
};

// Expand widget for the information div.
export const infoExpand = new Expand({
  expandIconClass: "esri-icon-notice-round",
  expandTooltip: "Expand for Park Information",
  expanded: false,
  view: view,
  content: document.getElementById("text-info")
});

// if editExpand is clicked to expand while reportsExpand open
// close reportsExpand to stop overlap
infoExpand.watch("expanded", function() {
  if (infoExpand.expanded === true){
      editExpand.collapse();
      reportsExpand.collapse();
  }
});
//Add item to bottom left of map view
view.ui.add(infoExpand, "bottom-left");