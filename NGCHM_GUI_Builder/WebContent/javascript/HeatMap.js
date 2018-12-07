//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.MAP'); 

NgChmGui.MAP.pageText1 = "Your NG-CHM has been created.  You can make change using the Prev button to go back to any build step.  You can explore the map here but will need to save it locally to view it later.  Use the Get Heat Map PDF button to save a local copy of the heat map as a PDF.  Note it will capture the detail panel as it is on the screen so set the zoom level and position of interest before making the PDF.  Better yet, download the NG-CHM and save it locally.  You can get a local copy of the heat map viewer and use it to dynamically explore your map at any time.";

/**********************************************************************************
 * FUNCTION - heatmapLoad: This function performs load functions for the HeatMap
 * screen.
 **********************************************************************************/
NgChmGui.MAP.loadData = function() {
	if (NgChmGui.UTIL.loadHeaderData()) {
		NgChmGui.UTIL.setScreenNotes(NgChmGui.MAP.pageText1, true);
		NgChmGui.UTIL.loadHeatMapView(false);
	}
	NgChmGui.UTIL.setUpAdvanced();
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

/**********************************************************************************
 * FUNCTION - newMapConfirm: This function cleans up the session and returns to the
 * matrix screen when the user requests an all new map.
 **********************************************************************************/
NgChmGui.MAP.newMapConfirm = function() {
	NgChmGui.UTIL.cleanSession(NgChmGui.UTIL.gotoMatrixScreen);
}

/**********************************************************************************
 * FUNCTION - expandMap: This function expands the heat map view portion of the
 * screen to "full screen" mode.
 **********************************************************************************/
NgChmGui.MAP.expandMap = function() {
	var headerPanel = document.getElementById('serviceHeader');
	var leftPanel = document.getElementById('formatSelection');
	var notesContainer = document.getElementById('screenNotesContainer');
	var notesPanel = document.getElementById('screenNotesDisplay');
	var viewPanel = document.getElementById('heatMapView');
	var mapPanel = document.getElementById('NGCHMEmbed');
	var expandBtn = document.getElementById('expandMap');
	var collapseBtn = document.getElementById('collapseMap');
	expandBtn.style.display = 'none';
	collapseBtn.style.display = '';
	headerPanel.style.display = 'none';
	leftPanel.style.display = 'none';
	notesPanel.style.display = 'none';
	viewPanel.style.width = '98%';
	viewPanel.style.height = '98%';
	mapPanel.style.width = '98%';
	mapPanel.style.height = '98%';
	NgChm.SUM.summaryResize();
	NgChm.DET.detailResize();
}

/**********************************************************************************
 * FUNCTION - collapseMap: This function collapses the heat map view portion of the
 * screen back to regular screen mode.
 **********************************************************************************/
NgChmGui.MAP.collapseMap = function() {
	var headerPanel = document.getElementById('serviceHeader');
	var leftPanel = document.getElementById('formatSelection');
	var notesContainer = document.getElementById('screenNotesContainer');
	var notesPanel = document.getElementById('screenNotesDisplay');
	var viewPanel = document.getElementById('heatMapView');
	var mapPanel = document.getElementById('NGCHMEmbed');
	var expandBtn = document.getElementById('expandMap');
	var collapseBtn = document.getElementById('collapseMap');
	expandBtn.style.display = '';
	collapseBtn.style.display = 'none';
	headerPanel.style.display = '';
	leftPanel.style.display = '';
	notesPanel.style.display = '';
	viewPanel.style.width = '75%';
	viewPanel.style.height = '90%';
	mapPanel.style.height = '90%';
	NgChm.SUM.summaryResize();
	NgChm.DET.detailResize(); 
}
