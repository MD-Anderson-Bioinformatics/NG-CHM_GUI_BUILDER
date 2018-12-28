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
	//NgChmGui.UTIL.setUpAdvanced();
}

/**********************************************************************************
 * FUNCTION - downloadMap: This function downloads the NG-CHM for the heat map
 * to an NGCHM file.
 **********************************************************************************/
NgChmGui.MAP.downloadMap = function() {
	window.open(NgChmGui.mapProperties.output_location.substring(NgChmGui.mapProperties.output_location.indexOf("MapBuildDir")) + "/" + NgChmGui.mapProperties.chm_name +  NgChmGui.mapProperties.builder_config.ngchmVersion + ".ngchm");
} 

/**********************************************************************************
 * FUNCTION - getChangeLog: This function downloads change log (user's selections
 * based upon transform log and heatmapProperties file) as a text file to the 
 * desktop.
 **********************************************************************************/
NgChmGui.MAP.getChangeLog = function() {
	var props = NgChmGui.mapProperties;
	var logText = "NG-CHM BUILDER HEAT MAP CREATION LOG\n\n";
	logText += "MATRIX SCREEN ENTRIES:\n";
	logText += "  Heat Map Name: " + props.chm_name + "\n";
	logText += "  Heat Map Desc: " + props.chm_description + "\n";
	logText += "  Matrix File Name: " + props.builder_config.matrix_grid_config.matrixFileName + "\n";
	logText += "  Matrix Summary Method: " + props.matrix_files[0].summary_method + "\n";
	var matrixGridConfig = props.builder_config.matrix_grid_config;
	logText += "  MATRIX GRID SELECTIONS:\n";
	logText += "    Matrix Beginning: Row - " + (matrixGridConfig.firstDataRow + 1) + " Column - " + (matrixGridConfig.firstDataCol + 1) + "\n";
	logText += "    Matrix Data Start: Row - " + (matrixGridConfig.dataStartRow + 1) + " Column - " + (matrixGridConfig.dataStartCol + 1) + "\n";
	if (matrixGridConfig.rowCovs.length > 0) {
		for (var i=0;i<matrixGridConfig.rowCovs.length;i++) {
			logText += "    Embedded Row Covariate: Row - " + (matrixGridConfig.rowCovs[i] + 1) + "  " + (matrixGridConfig.rowCovNames[i] + 1) + " (" + matrixGridConfig.rowCovTypes[i] + ")\n";
		}
	}
	if (matrixGridConfig.colCovs.length > 0) {
		for (var i=0;i<matrixGridConfig.colCovs.length;i++) {
			logText += "    Embedded Col Covariate: Column - " + (matrixGridConfig.colCovs[i] + 1) + "  " + matrixGridConfig.colCovNames[i] + " (" + matrixGridConfig.colCovTypes[i] + ")\n";
		}
	}
	logText += "\n";
	if (props.builder_config.transform_config !== undefined) {
		var transLog = props.builder_config.transform_config.logText;
		var transURI = props.builder_config.transform_config.Uri;
		if (transLog.length > 0) {
			logText += "TRANFORM SCREEN ENTRIES:\n";
			for (var i=0;i <transLog.length;i++) {
				var currUri = transURI[i];
				uriText = currUri.substring(0, currUri.indexOf("="));
				uriText2 = currUri.substring(currUri.indexOf("=") + 1, currUri.indexOf("&"));
				logText += "  Matrix Transformation " + (i+1) + ": " + uriText + "->" + uriText2 + " - " + transLog[i] + "\n";
			}	 
			logText += "\n";
		}
	}
	logText += "CLUSTER SCREEN ENTRIES:\n";
	logText += "  ROW OPTIONS:\n";
	var classFiles = props.classification_files;
	var rowClassClust = "    Cluster-Based Covariate: false\n";
	var colClassClust = "    Cluster-Based Covariate: false\n";
	for (var j=0;j<classFiles.length;j++) {
		var currClass = classFiles[j];
		if (currClass.path === "treecut") {
			if (currClass.position === "row") {
				rowClassClust = "    Cluster-Based Covariate: true\n";
				rowClassClust += "    Cluster Covariate Name: " + currClass.name + "\n";
				rowClassClust += "    Clusters: " + currClass.tree_cuts + "\n";
			} else {
				colClassClust = "    Cluster-Based Covariate: true\n";
				colClassClust += "    Cluster Covariate Name: " + currClass.name + "\n";
				colClassClust += "    Clusters: " + currClass.tree_cuts + "\n";
			}
		}
	}
	logText += "    Order: " + props.row_configuration.order_method + "\n";
	if (props.row_configuration.order_method === "Hierarchical") {
		logText += "    Agglomeration: " + props.row_configuration.agglomeration_method + "\n";
		logText += "    Distance: " + props.row_configuration.distance_metric + "\n";
		logText += rowClassClust;
	}
	logText += "  COLUMN OPTIONS:\n";
	logText += "    Order: " + props.col_configuration.order_method + "\n";
	if (props.col_configuration.order_method === "Hierarchical") {
		logText += "    Agglomeration: " + props.col_configuration.agglomeration_method + "\n";
		logText += "    Distance: " + props.col_configuration.distance_metric + "\n";
		logText += colClassClust;
	}
	logText += "\n";
	logText += "COVARIATE SCREEN ENTRIES:\n";
	for (var j=0;j<classFiles.length;j++) {
		var currClass = classFiles[j];
		logText += "  Bar Name: " + currClass.name + "\n";
		logText += "    File Name: " + currClass.filename + "\n";
		logText += "    Bar Type: " + currClass.bar_type + "\n";
		logText += "    Bar Position: " + currClass.position + "\n";
		logText += "    Show: " + currClass.show + "\n";
		logText += "    Height: " + currClass.height + "\n";
		logText += "    Color Type: " + currClass.color_map.type + "\n";
		var colorMap = "    Color Map:\n";
		for (var i=0;i<currClass.color_map.colors.length;i++) {
			var currColor = currClass.color_map.colors[i];
			var currThresh = currClass.color_map.thresholds[i];
			var colorName = NgChmGui.UTIL.getApproximatedColor(currColor);
			colorMap += "      Category " + (i+1) + ": " + currThresh + "  Color: " + colorName + "\n";
		}
		var missingColorName = NgChmGui.UTIL.getApproximatedColor(currClass.color_map.missing);
		colorMap += "      Missing Color: " + missingColorName + "\n";
		if (currClass.bar_type === "color_plot") {
			logText += colorMap;
		} else {
			logText += "    Foreground Color: " + currClass.fg_color + "\n";
			logText += "    Background Color: " + currClass.bg_color + "\n";
			logText += "    Lower Bound: " + currClass.low_bound + "\n";
			logText += "    Upper Bound: " + currClass.high_bound + "\n";
			logText += "    Missing Color: " + currClass.color_map.missing + "\n";
		}
		logText += "\n";
	}
	logText += "FORMAT SCREEN ENTRIES:\n";
	logText += "  Matrix Colors/Breaks: \n";
	colorMap = "    Color Map:\n";
	var matrixFile = props.matrix_files[0];
	for (var i=0;i<matrixFile.color_map.colors.length;i++) {
		var currColor = matrixFile.color_map.colors[i];
		var currThresh = matrixFile.color_map.thresholds[i];
		var colorName = NgChmGui.UTIL.getApproximatedColor(currColor);
		colorMap += "      Threshold " + (i+1) + ": " + currThresh + "  Color: " + colorName + "\n";
	}
	colorMap += "      Missing Color: " + NgChmGui.UTIL.getApproximatedColor(matrixFile.color_map.missing) + "\n";
	logText += colorMap;
	logText += "    Heat Map Display: \n";
	logText += "      Matrix Display Options: \n";
	logText += "        Selection Color: " + NgChmGui.UTIL.getApproximatedColor(matrixFile.selection_color) + "\n";
	logText += "        Grid Color: " + NgChmGui.UTIL.getApproximatedColor(matrixFile.grid_color) + "\n";
	logText += "        Gaps Color: " + NgChmGui.UTIL.getApproximatedColor(matrixFile.cuts_color) + "\n";
	logText += "        Show Grid: " + matrixFile.grid_show + "\n";
	logText += "        Summary Display Width: " + props.summary_width + "%\n";
	logText += "      Row Display Options: \n";
	logText += "        Show Dendrogram: " + props.row_configuration.dendro_show + "\n";
	logText += "        Dendrogram Height: " + props.row_configuration.dendro_height + "\n";
	logText += "        Maximum Label Length: " + props.row_configuration.label_display_length + "\n";
	logText += "        Trim Label Text From: " + props.row_configuration.label_display_abbreviation + "\n";
	logText += "      Column Display Options: \n";
	logText += "        Show Dendrogram: " + props.col_configuration.dendro_show + "\n";
	logText += "        Dendrogram Height: " + props.col_configuration.dendro_height + "\n";
	logText += "        Maximum Label Length: " + props.col_configuration.label_display_length + "\n";
	logText += "        Trim Label Text From: " + props.col_configuration.label_display_abbreviation + "\n";
	logText += "    Labels and Attributes: \n";
	logText += "      Row Label Configuration: \n";
	logText += "        Label Type: " + props.row_configuration.data_type[0] + "\n";
	logText += "        Top Label Items: " + props.row_configuration.top_items + "\n";
	logText += "      Column Label Configuration: \n";
	logText += "        Label Type: " + props.col_configuration.data_type[0] + "\n";
	logText += "        Top Label Items: " + props.col_configuration.top_items + "\n";
	logText += "      Heat Map Attributes: \n";
	for (var i=0;i<props.chm_attributes.length;i++) {
		var currAttr = props.chm_attributes[i];
		if (Object.keys(currAttr)[0] == undefined) {
			logText += "        No Attributes Defined\n";
		} else {
			logText += "        key: " + Object.keys(currAttr)[0] + " value: " + Object.values(currAttr)[0] +"\n";
		}
	}
	logText += "    Heat Map Gaps: \n";
	logText += "      Row Gap Options: \n";
	if (props.row_configuration.tree_cuts !== "0") {
		logText += "        Gaps By Cluster: " + props.row_configuration.tree_cuts + "\n";
		logText += "        Gap Length: " + props.row_configuration.cut_width + "\n";
	} else if (props.row_configuration.cut_locations.length > 0) {
		logText += "        Gaps By Location: " + props.row_configuration.cut_locations + "\n";
		logText += "        Gap Width: " + props.row_configuration.cut_width + "\n";
	}
	logText += "      Column Gap Options: \n";
	if (props.col_configuration.tree_cuts !== "0") {
		logText += "        Gaps By Cluster: " + props.col_configuration.tree_cuts + "\n";
		logText += "        Gap Length: " + props.col_configuration.cut_width + "\n";
	} else if (props.col_configuration.cut_locations.length > 0) {
		logText += "        Gaps By Location: " + props.col_configuration.cut_locations + "\n";
		logText += "        Gap Width: " + props.col_configuration.cut_width + "\n";
	}
	NgChm.PDF.getBuilderCreationLogPDF(props.chm_name, logText);
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
