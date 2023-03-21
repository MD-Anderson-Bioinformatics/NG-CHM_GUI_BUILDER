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
		NgChm.API.editWidget(['noBuilderUploads']);
		NgChmGui.UTIL.loadHeatMapView(false);
	}
}

/**********************************************************************************
 * FUNCTION - downloadMap: This function downloads the NG-CHM for the heat map
 * to an NGCHM file.
 **********************************************************************************/
NgChmGui.MAP.downloadMap = function() {
	NgChmGui.UTIL.logClientActivity("Interactive Heat Map","Download NG-CHM File","File: " + NgChmGui.mapProperties.chm_name +  NgChmGui.mapProperties.builder_config.ngchmVersion + ".ngchm");
	window.open(NgChmGui.mapProperties.output_location.substring(NgChmGui.mapProperties.output_location.indexOf("MapBuildDir")) + "/" + NgChmGui.mapProperties.chm_name +  NgChmGui.mapProperties.builder_config.ngchmVersion + ".ngchm");
} 

/**********************************************************************************
 * FUNCTION - getPDF: This function calls the viewer PDF download the NG-CHM pdf heat map.
 **********************************************************************************/
NgChmGui.MAP.getPDF = function(button) {
	NgChmGui.UTIL.logClientActivity("Interactive Heat Map","Generate Heat Map PDF","Chm Name: " + NgChmGui.mapProperties.chm_name);
	NgChm.API.generatePDF(button);
};

/**********************************************************************************
 * FUNCTION - logViewerDownload: This function logs when a user downloads the stand-alone viewer
 **********************************************************************************/
NgChmGui.MAP.logViewerDownload = function() {
	NgChmGui.UTIL.logClientActivity("Interactive Heat Map","Download Heat Map Viewer","Chm Name: " + NgChmGui.mapProperties.chm_name);
}

/**********************************************************************************
 * FUNCTION - downloadThumbnail: This function calls the viewer PDF download the NG-CHM pdf heat map.
 **********************************************************************************/
NgChmGui.MAP.downloadThumbnail = function() {
	NgChmGui.UTIL.logClientActivity("Interactive Heat Map","Download Thumbnail Image","Chm Name: " + NgChmGui.mapProperties.chm_name);
	NgChm.API.downloadSummaryPng();
}

/**********************************************************************************
 * FUNCTION - getFullPDF: This function downloads the NG-CHM full pdf heat map.
 **********************************************************************************/
NgChmGui.MAP.getFullPDF = function() {
	NgChmGui.UTIL.logClientActivity("Interactive Heat Map","Get Expanded PDF File","File: " + NgChmGui.mapProperties.chm_name + "_exp.pdf");
	window.open(NgChmGui.mapProperties.output_location.substring(NgChmGui.mapProperties.output_location.indexOf("MapBuildDir")) + "/" + NgChmGui.mapProperties.chm_name + "_exp.pdf");
} 

/**********************************************************************************
 * FUNCTION - getChangeLog: This function downloads change log (user's selections
 * based upon transform log and heatmapProperties file) as a text file to the 
 * desktop.
 **********************************************************************************/
NgChmGui.MAP.getChangeLog = function() {
	var props = NgChmGui.mapProperties;
	NgChmGui.UTIL.logClientActivity("Interactive Heat Map","Generate Change Log","Chm Name: " + props.chm_name);
	var logText = "NG-CHM BUILDER HEAT MAP CREATION LOG\n\n";
	logText += "MATRIX SCREEN ENTRIES:\n";
	logText += "*  Heat Map Name: " + props.chm_name + "\n";
	var desc = props.chm_description;
	if (desc.length > 70) {
		desc = desc.substr(0,67)+"...";
	}
	logText += "*  Heat Map Description: " + desc + "\n";
	logText += "*  Matrix File Name: " + props.builder_config.matrix_grid_config.matrixFileName + "\n";
	var changed = props.matrix_files[0].summary_method !== "average" ? "*" : ""; 
	logText += changed + "  Pixel Summary Method: " + props.matrix_files[0].summary_method + "\n";
	var matrixGridConfig = props.builder_config.matrix_grid_config;
	logText += "  MATRIX GRID SELECTIONS:\n";
	changed = (matrixGridConfig.firstDataRow !== 0 || matrixGridConfig.firstDataCol !== 0) ? "*" : "";
	logText += changed + "    Matrix Beginning: Row - " + (matrixGridConfig.firstDataRow + 1) + " Column - " + (matrixGridConfig.firstDataCol + 1) + "\n";
	changed = (matrixGridConfig.dataStartRow !== 1 || matrixGridConfig.dataStartCol !== 1) ? "*" : "";
	logText += changed + "    Matrix Data Start: Row - " + (matrixGridConfig.dataStartRow + 1) + " Column - " + (matrixGridConfig.dataStartCol + 1) + "\n";
	if (matrixGridConfig.rowCovs.length > 0) {
		for (var i=0;i<matrixGridConfig.rowCovs.length;i++) {
			logText += "*    Embedded Row Covariate: Row - " + (matrixGridConfig.rowCovs[i] + 1) + "  " + (matrixGridConfig.rowCovNames[i] + 1) + " (" + matrixGridConfig.rowCovTypes[i] + ")\n";
		}
	}
	if (matrixGridConfig.colCovs.length > 0) {
		for (var i=0;i<matrixGridConfig.colCovs.length;i++) {
			logText += "*    Embedded Col Covariate: Column - " + (matrixGridConfig.colCovs[i] + 1) + "  " + matrixGridConfig.colCovNames[i] + " (" + matrixGridConfig.colCovTypes[i] + ")\n";
		}
	}
	logText += "\n";
	if (props.builder_config.transform_config !== undefined) {
		var transLog = props.builder_config.transform_config.logText;
		var transURI = props.builder_config.transform_config.Uri;
		if (transLog.length > 0) {
			logText += "TRANSFORM SCREEN ENTRIES:\n";
			for (var i=0;i <transLog.length;i++) {
				var currUri = transURI[i];
				uriText = currUri.substring(0, currUri.indexOf("="));
				uriText2 = currUri.substring(currUri.indexOf("=") + 1, currUri.indexOf("&"));
				logText += "*  Matrix Transformation " + (i+1) + ": " + uriText + "->" + uriText2 + " - " + transLog[i] + "\n";
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
				rowClassClust = "*    Cluster-Based Covariate: true\n";
				rowClassClust += "*    Cluster Covariate Name: " + currClass.name + "\n";
				rowClassClust += "*    Clusters: " + currClass.tree_cuts + "\n";
			} else {
				colClassClust = "*    Cluster-Based Covariate: true\n";
				colClassClust += "*    Cluster Covariate Name: " + currClass.name + "\n";
				colClassClust += "*    Clusters: " + currClass.tree_cuts + "\n";
			}
		}
	}
	
	changed = props.row_configuration.order_method !== "Original" ? "*" : ""; 
	logText += changed + "    Order: " + props.row_configuration.order_method + "\n";
	if (props.row_configuration.order_method === "Hierarchical") {
		logText += "*    Agglomeration: " + props.row_configuration.agglomeration_method + "\n";
		logText += "*    Distance: " + props.row_configuration.distance_metric + "\n";
		logText += rowClassClust;
	}
	logText += "  COLUMN OPTIONS:\n";
	changed = props.col_configuration.order_method !== "Original" ? "*" : ""; 
	logText += changed + "    Order: " + props.col_configuration.order_method + "\n";
	if (props.col_configuration.order_method === "Hierarchical") {
		logText += "*    Agglomeration: " + props.col_configuration.agglomeration_method + "\n";
		logText += "*    Distance: " + props.col_configuration.distance_metric + "\n";
		logText += colClassClust;
	}
	logText += "\n";
	logText += "COVARIATE SCREEN ENTRIES:\n";
	for (var j=0;j<classFiles.length;j++) {
		var currClass = classFiles[j];
		logText += "*  Bar Name: " + currClass.name + "\n";
		logText += "*    File Name: " + currClass.filename + "\n";
		changed = currClass.bar_type !== "color_plot" ? "*" : ""; 
		logText += changed + "    Bar Type: " + currClass.bar_type + "\n";
		logText += "*    Bar Position: " + currClass.position + "\n";
		changed = currClass.show !== "Y" ? "*" : ""; 
		logText += changed + "    Show: " + currClass.show + "\n";
		changed = currClass.height !== "15" ? "*" : ""; 
		logText += changed + "    Height: " + currClass.height + "\n";
		logText += "*    Color Type: " + currClass.color_map.type + "\n";
		var colorMap = "    Color Map:\n";
		for (var i=0;i<currClass.color_map.colors.length;i++) {
			var currColor = currClass.color_map.colors[i];
			var currThresh = currClass.color_map.thresholds[i];
			var colorName = NgChmGui.UTIL.getApproximatedColor(currColor);
			changed = NgChmGui.MAP.checkDefaultColor(currColor);
			colorMap += changed + "      Category " + (i+1) + ": " + currThresh + "  Color: " + colorName + "\n";
		}
		var missingColorName = NgChmGui.UTIL.getApproximatedColor(currClass.color_map.missing);
		changed = NgChmGui.MAP.checkDefaultColor(currClass.color_map.missing);
		colorMap += changed + "      Missing Color: " + missingColorName + "\n";
		if (currClass.bar_type === "color_plot") {
			logText += colorMap;
		} else {
			changed = currClass.fg_color !== "#000000" ? "*" : "";
			logText += changed + "    Foreground Color: " + NgChmGui.UTIL.getApproximatedColor(currClass.fg_color) + "\n";
			changed = currClass.bg_color.toUpperCase() !== "#FFFFFF" ? "*" : "";
			logText += changed + "    Background Color: " + NgChmGui.UTIL.getApproximatedColor(currClass.bg_color) + "\n";
			changed = currClass.low_bound !== currClass.orig_low_bound ? "*" : "";
			logText += changed + "    Lower Bound: " + currClass.low_bound + "\n";
			changed = currClass.high_bound !== currClass.orig_high_bound ? "*" : "";
			logText += changed + "    Upper Bound: " + currClass.high_bound + "\n";
			changed = NgChmGui.MAP.checkDefaultColor(currClass.color_map.missing);
			logText += changed + "    Missing Color: " + NgChmGui.UTIL.getApproximatedColor(currClass.color_map.missing) + "\n";
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
		changed = (matrixFile.original_thresholds.indexOf(currThresh) < 0) ? "*" : "";
		colorMap += changed + "      Threshold " + (i+1) + ": " + currThresh + "\n";
		changed = NgChmGui.MAP.checkDefaultColor(currColor);
		colorMap += changed + "      Color " + (i+1) + ": " + colorName + "\n";
	}
	changed = NgChmGui.MAP.checkDefaultColor(matrixFile.color_map.missing);
	colorMap += changed + "      Missing Color: " + NgChmGui.UTIL.getApproximatedColor(matrixFile.color_map.missing) + "\n";
	logText += colorMap;
	logText += "    Heat Map Display: \n";
	logText += "      Matrix Display Options: \n";
	changed = matrixFile.selection_color.toUpperCase() !== "#00FF38" ? "*" : "";
	logText += changed + "        Selection Color: " + NgChmGui.UTIL.getApproximatedColor(matrixFile.selection_color) + "\n";
	changed = matrixFile.grid_color.toUpperCase() !== "#FFFFFF" ? "*" : "";
	logText += changed + "        Grid Color: " + NgChmGui.UTIL.getApproximatedColor(matrixFile.grid_color) + "\n";
	changed = matrixFile.grid_show !== "N" ? "*" : "";
	logText += changed + "        Gaps Color: " + NgChmGui.UTIL.getApproximatedColor(matrixFile.cuts_color) + "\n";
	logText += "        Show Grid: " + matrixFile.grid_show + "\n";
	changed = props.summary_width !== "40" ? "*" : "";
	logText += changed + "        Summary Display Width: " + props.summary_width + "%\n";
	logText += changed + "      Row Display Options: \n";
	changed = (props.row_configuration.dendro_show !== "NA" && props.row_configuration.dendro_show !== "ALL") ? "*" : "";
	logText += changed + "        Show Dendrogram: " + props.row_configuration.dendro_show + "\n";
	changed = (props.row_configuration.dendro_height !== "10" && props.row_configuration.dendro_height !== "100") ? "*" : "";
	logText += changed + "        Dendrogram Height: " + props.row_configuration.dendro_height + "\n";
	changed = props.row_configuration.label_display_length !== "20" ? "*" : "";
	logText += changed + "        Maximum Label Length: " + props.row_configuration.label_display_length + "\n";
	changed = props.row_configuration.label_display_abbreviation !== "END" ? "*" : "";
	logText += changed + "        Trim Label Text From: " + props.row_configuration.label_display_abbreviation + "\n";
	logText += "      Column Display Options: \n";
	changed = (props.col_configuration.dendro_show !== "NA" && props.col_configuration.dendro_show !== "ALL") ? "*" : "";
	logText += changed + "        Show Dendrogram: " + props.col_configuration.dendro_show + "\n";
	changed = (props.col_configuration.dendro_height !== "10" && props.col_configuration.dendro_height !== "100") ? "*" : "";
	logText += changed + "        Dendrogram Height: " + props.col_configuration.dendro_height + "\n";
	changed = props.col_configuration.label_display_length !== "20" ? "*" : "";
	logText += changed + "        Maximum Label Length: " + props.col_configuration.label_display_length + "\n";
	changed = props.col_configuration.label_display_abbreviation !== "END" ? "*" : "";
	logText += changed + "        Trim Label Text From: " + props.col_configuration.label_display_abbreviation + "\n";
	logText += "    Labels and Attributes: \n";
	logText += "      Row Label Configuration: \n";
	changed = props.row_configuration.data_type[0] !== "none" ? "*" : "";
	logText += changed + "        Label Type: " + props.row_configuration.data_type[0] + "\n";
	changed = props.row_configuration.top_items.length > 0 ? "*" : "";
	logText += changed + "        Top Label Items: " + props.row_configuration.top_items + "\n";
	logText += "      Column Label Configuration: \n";
	changed = props.col_configuration.data_type[0] !== "none" ? "*" : "";
	logText += changed + "        Label Type: " + props.col_configuration.data_type[0] + "\n";
	changed = props.col_configuration.top_items.length > 0 ? "*" : "";
	logText += changed + "        Top Label Items: " + props.col_configuration.top_items + "\n";
	if (props.chm_attributes.length > 0) {
		logText += "      Heat Map Attributes: \n";
		for (var i=0;i<props.chm_attributes.length;i++) {
			var currAttr = props.chm_attributes[i];
			if (Object.keys(currAttr)[0] == undefined) {
				logText += "        No Attributes Defined\n";
			} else {
				logText += "*        Key-Value Pair: " + Object.keys(currAttr)[0] + " : " + Object.values(currAttr)[0] +"\n";
			}
		}
	} else {
		logText += "      Heat Map Attributes:  No Attributes Defined\n";
	}
	logText += "    Heat Map Gaps: \n";
	logText += "      Row Gap Options: \n";
	if (props.row_configuration.tree_cuts !== "0") {
		logText += "*        Gaps By Cluster: " + props.row_configuration.tree_cuts + "\n";
		changed = props.row_configuration.cut_width !== "5" ? "*" : "";
		logText += changed + "        Gap Length: " + props.row_configuration.cut_width + "\n";
	} else if (props.row_configuration.cut_locations.length > 0) {
		logText += "*        Gaps By Location: " + props.row_configuration.cut_locations + "\n";
		changed = props.row_configuration.cut_width !== "5" ? "*" : "";
		logText += changed + "        Gap Width: " + props.row_configuration.cut_width + "\n";
	} else {
		logText += "        Gaps: None\n";
	}
	logText += "      Column Gap Options: \n";
	if (props.col_configuration.tree_cuts !== "0") {
		logText += "*        Gaps By Cluster: " + props.col_configuration.tree_cuts + "\n";
		changed = props.col_configuration.cut_width !== "5" ? "*" : "";
		logText += changed + "        Gap Length: " + props.col_configuration.cut_width + "\n";
	} else if (props.col_configuration.cut_locations.length > 0) {
		logText += "        Gaps By Location: " + props.col_configuration.cut_locations + "\n";
		changed = props.col_configuration.cut_width !== "5" ? "*" : "";
		logText += changed + "        Gap Width: " + props.col_configuration.cut_width + "\n";
	} else {
		logText += "        Gaps: None\n";
	}
	getBuilderCreationLogPDF(props.chm_name, logText);

    /**********************************************************************************
     * FUNCTION - getBuilderCreationLogPDF: This function is called from the NG-CHM
     * GUI Builder.  It is provided with a heat map name and a text string pre-built for
     * printing.  It takes that string and loops thru it applying font and style
     * formatting to the string and downloads the resulting PDF file to the desktop.
     **********************************************************************************/
    function getBuilderCreationLogPDF (name, text) {
	const doc = NgChm.API.jsPDF ("p", "pt", [792, 612]);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(15);
	var lineEndPos = text.indexOf("\n");
	var headtx = text.substring(0, lineEndPos);
	doc.text(140,30,headtx);
	headtx += " (cont)"
	text = text.substring(lineEndPos + 1, text.length);
	doc.setFontSize(10);
	var pos = 40;
	var pageNbr = 1;
	while (text.indexOf("\n") >= 0) {
		lineEndPos = text.indexOf("\n");
		setBuilderLogText(doc, text, pos, lineEndPos);
		text = text.substring(lineEndPos + 1, text.length);
		if ((pos + 15) > 760) {
			doc.text(20,780,"* Bold-italicized responses represent changes from NG-CHM defaults");
			doc.text(550,780,"page " + pageNbr);
			pageNbr++;
			addBuilderLogPage(doc, headtx);
			pos = 60;
		} else {
			pos += 15;
		}
	}
	doc.text(20,780,"* Bold-italicized responses represent changes from NG-CHM defaults");
	if (pageNbr > 1) {
		doc.text(550,780,"page " + pageNbr);
	}
	doc.save(name+'_HeatMapCreationLog.pdf');
    }

    /**********************************************************************************
     * FUNCTION - addBuilderLogPage: This function adds a page to the NG-CHM Builder
     * Creation Log and writes a header onto the page.
     **********************************************************************************/
    function addBuilderLogPage (doc, headtx) {
	doc.addPage();
	doc.setFont(undefined, "bold");
	doc.setFontSize(15);
	doc.text(120,30,headtx);
	doc.setFont(undefined, "normal");
	doc.setFontSize(10);
    }

    /**********************************************************************************
     * FUNCTION - setBuilderLogText: This function writes out a builder log entry to
     * the NG-CHM GUI Builder creation log pdf.
     **********************************************************************************/
    function setBuilderLogText (doc, text, pos, end) {
	var isChanged =  text.substring(0,1) === "*" ? true : false;
	var temptx = text.substring(0, end);
	if (isChanged === true) {
		temptx = text.substring(1, end);
	}
	var textHeader = temptx.substring(0,temptx.indexOf(":") + 1);
	var textValue = temptx.substring(temptx.indexOf(":") + 2, temptx.length);
	doc.setFont(undefined, "bold");
	doc.text(20,pos,textHeader);
	if (isChanged === true) {
		doc.setFont(undefined, "bolditalic");
	} else {
		doc.setFont(undefined, "normal");
	}
	doc.text(165,pos,textValue);
	doc.setFont(undefined, "normal");
    }
};  // END: NgChmGui.MAP.getChangeLog

/**********************************************************************************
 * FUNCTION - checkDefaultColor: This function checks a given color against the
 * set of default colors defined to the builder.  It returns an asterisk if the 
 * color is NOT a default color.
 **********************************************************************************/
NgChmGui.MAP.checkDefaultColor = function(color) {
	var retVal = "";
	var colorVal = color.toUpperCase();
	var defaultColors = ["#B3B3B3","#0000FF","#FFFFFF","#FF0000", "#1F77B4", "#AEC7E8", "#FF7F0E", "#FFBB78", "#2CA02C", "#98DF8A", "#D62728", "#FF9896", "#9467BD", "#C5B0D5", "#8C564B", "#C49C94", "#E377C2", "#F7B6D2", "#7F7F7F", "#C7C7C7", "#BCBD22", "#DBDB8D", "#17BECF", "#9EDAE5","#F0F0F0"];
	if (defaultColors.indexOf(colorVal) < 0) {
		retVal = "*";
	}
	return retVal; 
}

/**********************************************************************************
 * FUNCTION - newMapRequest: This function loads an modal notice that a new
 * map has been requested.  User may choose to stay on screen.
 **********************************************************************************/
NgChmGui.MAP.newMapRequest = function() {
	NgChmGui.UTIL.newHeatMapNotice();
	NgChmGui.UTIL.dragElement(document.getElementById("message"));
}

/**********************************************************************************
 * FUNCTION - newMapConfirm: This function cleans up the session and returns to the
 * matrix screen when the user requests an all new map.
 **********************************************************************************/
NgChmGui.MAP.newMapConfirm = function() {
	NgChmGui.UTIL.logClientActivity("Interactive Heat Map","Start New Heat Map","Clean session and start new map");
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
	viewPanel.classList.replace('collapsed', 'expanded');
	mapPanel.classList.replace('collapsed', 'expanded');
	NgChm.API.chmResize();
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
//	viewPanel.classList.replace('expanded', 'collapsed');
//	mapPanel.classList.replace('expanded', 'collapsed');
	NgChm.API.chmResize();
}
