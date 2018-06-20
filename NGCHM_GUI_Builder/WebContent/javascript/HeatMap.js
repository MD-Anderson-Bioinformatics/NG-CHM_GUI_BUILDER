//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.MAP'); 

NgChmGui.MAP.pageText1 = "Your NG-CHM has been created.  You can make change using the Prev button to go back to any build step.  You can explore the map here but will need to save it locally to view it later.  Use the Get Heat Map PDF button to save a local copy of the heat map as a PDF.  Note it will capture the detail panel as it is on the screen so set the zoom level and position of interest before making the PDF.  Better yet, download the NG-CHM and save it locally.  You can then get a local copy of the heat map viewer and use it to dynamically explore your heat map at any time.";

/**********************************************************************************
 * FUNCTION - heatmapLoad: This function performs load functions for the HeatMap
 * screen.
 **********************************************************************************/
NgChmGui.MAP.loadData = function() {
	if (NgChmGui.UTIL.loadHeaderData()) {
		NgChmGui.UTIL.setScreenNotes(NgChmGui.MAP.pageText1);
		NgChmGui.UTIL.loadHeatMapView(false);
	}
}

/**********************************************************************************
 * FUNCTION - downloadMap: This function downloads the NG-CHM for the heat map
 * to an NGCHM file.
 **********************************************************************************/
NgChmGui.MAP.downloadMap = function() {
	window.open(NgChmGui.mapProperties.output_location.substring(NgChmGui.mapProperties.output_location.indexOf("MapBuildDir")) + "/" + NgChmGui.mapProperties.chm_name +  NgChmGui.mapProperties.builder_config.ngchmVersion + ".ngchm");
} 

/**********************************************************************************
 * FUNCTION - newMapRequest: This function loads an modal notice that a new
 * map has been requested.  User may choose to stay on screen.
 **********************************************************************************/
NgChmGui.MAP.newMapRequest = function() {
	NgChmGui.UTIL.newHeatMapNotice();
}

NgChmGui.MAP.newMapConfirm = function() {
	NgChmGui.UTIL.cleanSession(NgChmGui.UTIL.gotoMatrixScreen);
}
