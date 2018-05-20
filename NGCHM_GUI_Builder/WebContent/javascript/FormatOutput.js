//Define Namespace for NgChmGui Covariate File Page
NgChmGui.createNS('NgChmGui.FORMAT');

/**********************************************************************************
 * FUNCTION - loadData: This function will be executed when the format page
 * is opened for the first time.  It loads the header, sets up the left data 
 * entry panel, and calls functions that loads format preferences into data
 * entry panels.  
 **********************************************************************************/
NgChmGui.FORMAT.loadData =  function() {
	if (NgChmGui.UTIL.loadHeaderData()) {
		var prefsPanelDiv = document.getElementById("preferencesPanel");
		prefsPanelDiv.style.left = 0;
		prefsPanelDiv.style.right = "";
		var formatPrefsDiv = NgChmGui.FORMAT.setupFormatTasks();
		NgChmGui.FORMAT.setFormatTaskOptions();
		NgChmGui.FORMAT.loadFormatView();
		formatPrefsDiv.style.display = '';
		prefsPanelDiv.style.display = '';
		NgChmGui.FORMAT.validateEntries(false);
	}
}

/**********************************************************************************
 * FUNCTION - clusteringComplete: This function gets called when the ordering has
 * been changed and sent to the server to perform clustering.
 **********************************************************************************/
NgChmGui.FORMAT.applyComplete = function() {
	NgChmGui.FORMAT.validateEntries(false);
	NgChmGui.UTIL.loadHeatMapView();
}

/**********************************************************************************
 * FUNCTION - the validate function is called on page load, page exit, and when
 * user operations are performed.  It creates conditional messages in the message
 * area including errors and warnings.  It also returns false if errors are detected.  
 **********************************************************************************/
NgChmGui.FORMAT.validateEntries = function(leavingPage) {
	var valid = true;
	var pageText = "";
	
	//Generate ERROR messages
	pageText = pageText + NgChmGui.FORMAT.validateMatrixBreaks();
	pageText = pageText + NgChmGui.FORMAT.validateGapPrefs();
	valid = pageText === "" ? true : false;

	//Generate error messages
	if (leavingPage) {
		//Do nothing for Format Screen
	} 
	
	//Generate warning messages
	//No Format Screen warnings
	
	//Add in page instruction text
    pageText = pageText + "Several tools are provided here to manipulate the appearance of your heatmap.  The Matrix Colors tool enables you to make changes to colors and threshold values that assign a color to each cell in the heatmap body.  Other advanced presentation settings include adding gaps in the heat map to seperate specific sections, adding top level labels to show the position of a few key items in the summary heat map, choosing where to show dendorgrams and how big to make them, selecting label truncation lengths, and identifying the data type of labels to enable link-out capabilities." ;

    NgChmGui.UTIL.setScreenNotes(pageText);
	
	return valid;
}

NgChmGui.FORMAT.validateMatrixBreaks = function() {
	var errorMsgs = "";
	var colorMap = NgChmGui.FORMAT.getColorMapFromConfig();
	var thresholds = colorMap.getThresholds();
	for (var i=0;i<thresholds.length;i++) {
		if (isNaN(thresholds[i])) {
			errorMsgs = errorMsgs + NgChmGui.UTIL.errorPrefix + "COLOR THRESHOLDS CONTAIN NON-NUMERIC ENTRY(S)." + NgChmGui.UTIL.nextLine;
			break;
		}
	}
	return errorMsgs;
}



/**********************************************************************************
 * FUNCTION - validateGapPrefs & validateGapPrefsByType: These functions perform
 * validations on user entries to the Gap Preferences Panel
 **********************************************************************************/
NgChmGui.FORMAT.validateGapPrefs = function() {
	var errorMsgs = NgChmGui.FORMAT.validateGapPrefsByType(NgChmGui.mapProperties.row_configuration, "ROW");
	errorMsgs = errorMsgs + NgChmGui.FORMAT.validateGapPrefsByType(NgChmGui.mapProperties.col_configuration, "COLUMN");
	return errorMsgs;
}
NgChmGui.FORMAT.validateGapPrefsByType = function(config, type) {
	var errorMsgs = "";
	var configCuts = config.cut_locations;
	var dupCut = false;
	var nanCut = false;
	if (typeof configCuts !== 'undefined') {
		for (var i=0;i<configCuts.length;i++) {
			var cutVal = configCuts[i];
			if (isNaN(cutVal)) {
				nanCut = true;
			}
			for (var j=0;j<configCuts.length;j++) {
				if ((i !== j) && (configCuts[j] === cutVal)) {
					dupCut = true;
				}
			}
		}
		if (nanCut) {
			errorMsgs = errorMsgs + NgChmGui.UTIL.errorPrefix + type + " GAP VALUES CONTAIN NON-NUMERIC ENTRY(S)." + NgChmGui.UTIL.nextLine;
		}
		if (dupCut) {
			errorMsgs = errorMsgs + NgChmGui.UTIL.errorPrefix + type + " GAP DUPLICATE VALUES FOUND." + NgChmGui.UTIL.nextLine;
		}
	}
	if ((isNaN(config.cut_width)) || (config.cut_width.indexOf(".") > -1)) {
		errorMsgs = errorMsgs + NgChmGui.UTIL.errorPrefix + type + " GAP LENGTH CONTAINS NON-INTEGER ENTRY." + NgChmGui.UTIL.nextLine;
	}
	if ((isNaN(config.tree_cuts)) || (config.tree_cuts.indexOf(".") > -1)) {
		errorMsgs = errorMsgs + NgChmGui.UTIL.errorPrefix + type + " TREE CUTS CONTAINS NON-INTEGER ENTRY." + NgChmGui.UTIL.nextLine;
	}
	return errorMsgs;
}

/**********************************************************************************
 * FUNCTION - setupFormatTasks: This function ...
 **********************************************************************************/
NgChmGui.FORMAT.setupFormatTasks = function(classes) {
	var prefsPanelDiv = document.getElementById("preferencesPanel");
	var classBars = classes;
	var formatPrefsDiv = NgChmGui.UTIL.getDivElement("formatPrefsDiv");
	var prefContents = document.createElement("TABLE");
	NgChmGui.UTIL.addBlankRow(prefContents)
	var formatTaskStr = "<select name='formatTask_list' id='formatTask_list' onchange='NgChmGui.FORMAT.showFormatSelection();'><option value='matrix_colors'>Matrix Colors/Breaks</option><option value='format_display'>Heat Map Display</option><option value='map_gaps'>Heat Map Gaps</option><option value='top_items'>Top Label Items</option><option value='link_outs'>Label Types</option></select>"
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;Format Tasks: ", formatTaskStr]);
	NgChmGui.UTIL.addBlankRow(prefContents, 2);
	formatPrefsDiv.appendChild(prefContents);
	prefsPanelDiv.appendChild(formatPrefsDiv);
	var colorPrefsDiv = NgChmGui.FORMAT.setupMatrixColorPrefs();
	formatPrefsDiv.appendChild(colorPrefsDiv);
	var formatDisplayPrefsDiv = NgChmGui.FORMAT.formatDisplayPrefs();
	formatPrefsDiv.appendChild(formatDisplayPrefsDiv);
	var gapPrefsDiv = NgChmGui.FORMAT.setupGapPrefs();
	formatPrefsDiv.appendChild(gapPrefsDiv);
	var topItemsPrefsDiv = NgChmGui.FORMAT.setupTopItemsPrefs()
	formatPrefsDiv.appendChild(topItemsPrefsDiv);
	var labelTypePrefsDiv = NgChmGui.FORMAT.setupLabelTypePrefs()
	formatPrefsDiv.appendChild(labelTypePrefsDiv);
	return formatPrefsDiv; 
}

/**********************************************************************************
 * FUNCTION - setFormatTaskOptions: This function loads dropdowns for each covariate
 * bar panel after those panels have been created
 **********************************************************************************/
NgChmGui.FORMAT.setFormatTaskOptions = function() {
	var rowConfig = NgChmGui.mapProperties.row_configuration;
	var colConfig = NgChmGui.mapProperties.col_configuration;
	var matrixConfig = NgChmGui.mapProperties.matrix_files[0];
	if (rowConfig.order_method === "Hierarchical") {
		document.getElementById('rowDendroShowPref').value = rowConfig.dendro_show;
		document.getElementById('rowDendroHeightPref').value = rowConfig.dendro_height;
	}
	if (colConfig.order_method === "Hierarchical") {
		document.getElementById('colDendroShowPref').value = colConfig.dendro_show;
		document.getElementById('colDendroHeightPref').value = colConfig.dendro_height;
	}
	document.getElementById('rowLabelSizePref').value = rowConfig.label_display_length;
	document.getElementById('colLabelSizePref').value = colConfig.label_display_length;
	document.getElementById('rowLabelAbbrevPref').value = rowConfig.label_display_abbreviation;
	document.getElementById('colLabelAbbrevPref').value = colConfig.label_display_abbreviation;
	document.getElementById('gridShowPref').value = matrixConfig.grid_show;
}



/**********************************************************************************
 * FUNCTION - showFormatSelection: This function toggles the format panels
 * when the user selects an item from the dropdown list of tasks.
 **********************************************************************************/
NgChmGui.FORMAT.showFormatSelection = function(selIndex) {
	var classList = document.getElementById("formatTask_list");
	NgChmGui.FORMAT.hideAllFormatDivs();
	if (typeof selIndex === 'undefined') {
		selIndex = classList.selectedIndex;
	}
	var key = classList.options[selIndex].value;
	document.getElementById(key).style.display="block";
}

/**********************************************************************************
 * FUNCTION - hideAllFormatDivs: This function hides all covariate panels in 
 * anticipation of a new one being displayed.
 **********************************************************************************/
NgChmGui.FORMAT.hideAllFormatDivs = function() {
	var classBtn = document.getElementById("formatTask_list");
	for (var i=0; i<classBtn.length; i++){
		var selectedDivId = classBtn.options[i].value;
		document.getElementById(selectedDivId).style.display = 'none';
	}
}

/**********************************************************************************
 * FUNCTION - formatDisplayPrefs: This function sets up the DIV panel for displaying
 * display format preferences.
 **********************************************************************************/
NgChmGui.FORMAT.formatDisplayPrefs = function() {
	var rowConfig = NgChmGui.mapProperties.row_configuration;
	var colConfig = NgChmGui.mapProperties.col_configuration;
	var matrixConfig = NgChmGui.mapProperties.matrix_files[0];
	var displayPrefs = NgChmGui.UTIL.getDivElement("format_display");
	var prefContents = document.createElement("TABLE");
	var colorMap = NgChmGui.mapProperties.matrix_files[0].color_map;
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["MATRIX DISPLAY OPTIONS"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	var showGrid = "<select name='gridShowPref' id='gridShowPref' onchange='NgChmGui.UTIL.setBuildProps();'><option value='Y'>YES</option><option value='N'>NO</option></select>";
	var colorGrid = "<input class='spectrumColor' type='color' name='gridColorPref' id='gridColorPref' onchange='NgChmGui.UTIL.setBuildProps();' value='"+matrixConfig.grid_color+"'>"; 
	var colorSelect = "<input class='spectrumColor' type='color' name='selectionColorPref' id='selectionColorPref'  onchange='NgChmGui.UTIL.setBuildProps();' value='"+matrixConfig.selection_color+"'>"; 
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Selection Color:",colorSelect]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Grid Color:",colorGrid]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Show Grid:",showGrid]);
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["ROW DISPLAY OPTIONS"], 2);
	if (rowConfig.order_method === "Hierarchical") {
		var dendroShowOptions = "<option value='ALL'>Summary and Detail</option><option value='SUMMARY'>Summary Only</option><option value='NONE'>Hide</option></select>";
		var dendroHeightOptions = "<option value='50'>50%</option><option value='75'>75%</option><option value='100'>100%</option><option value='125'>125%</option><option value='150'>150%</option><option value='200'>200%</option></select>";
		var rowDendroSelect = "<select name='rowDendroShowPref' id='rowDendroShowPref' onchange='NgChmGui.UTIL.setBuildProps();'>"
		rowDendroSelect = rowDendroSelect+dendroShowOptions;
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Show Dendrogram:",rowDendroSelect]);  
		var rowDendroHeightSelect = "<select name='rowDendroHeightPref' id='rowDendroHeightPref' onchange='NgChmGui.UTIL.setBuildProps();'>"
		rowDendroHeightSelect = rowDendroHeightSelect+dendroHeightOptions;
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Dendrogram Height:",rowDendroHeightSelect]); 
	}  
	var rowLabelSizeSelect = "<select name='rowLabelSizePref' id='rowLabelSizePref' onchange='NgChmGui.UTIL.setBuildProps();'><option value='10'>10 Characters</option><option value='15'>15 Characters</option><option value='20'>20 Characters</option><option value='25'>25 Characters</option><option value='30'>30 Characters</option><option value='35'>35 Characters</option><option value='40'>40 Characters</option>"
	var rowLabelAbbrevSelect = "<select name='rowLabelAbbrevPref' id='rowLabelAbbrevPref' onchange='NgChmGui.UTIL.setBuildProps();'><option value='START'>Beginning</option><option value='MIDDLE'>Middle</option><option value='END'>End</option>"
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Maximum Label Length:",rowLabelSizeSelect]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Trim Label Text From:",rowLabelAbbrevSelect]);
	
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["COLUMN DISPLAY OPTIONS"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	if (colConfig.order_method === "Hierarchical") {
		var dendroShowOptions = "<option value='ALL'>Summary and Detail</option><option value='SUMMARY'>Summary Only</option><option value='NONE'>Hide</option></select>";
		var dendroHeightOptions = "<option value='50'>50%</option><option value='75'>75%</option><option value='100'>100%</option><option value='125'>125%</option><option value='150'>150%</option><option value='200'>200%</option></select>";
		var colDendroSelect = "<select name='colDendroShowPref' id='colDendroShowPref' onchange='NgChmGui.UTIL.setBuildProps();'>"
		colDendroSelect = colDendroSelect+dendroShowOptions;
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Show Dendrogram:",colDendroSelect]);  
		var colDendroHeightSelect = "<select name='colDendroHeightPref' id='colDendroHeightPref' onchange='NgChmGui.UTIL.setBuildProps();'>"
		colDendroHeightSelect = colDendroHeightSelect+dendroHeightOptions;
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Dendrogram Height:",colDendroHeightSelect]); 
	}  
	var colLabelSizeSelect = "<select name='colLabelSizePref' id='colLabelSizePref' onchange='NgChmGui.UTIL.setBuildProps();'><option value='10'>10 Characters</option><option value='15'>15 Characters</option><option value='20'>20 Characters</option><option value='25'>25 Characters</option><option value='30'>30 Characters</option><option value='35'>35 Characters</option><option value='40'>40 Characters</option>"
	var colLabelAbbrevSelect = "<select name='colLabelAbbrevPref' id='colLabelAbbrevPref' onchange='NgChmGui.UTIL.setBuildProps();'><option value='START'>Beginning</option><option value='MIDDLE'>Middle</option><option value='END'>End</option>"
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Maximum Label Length:",colLabelSizeSelect]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Trim Label Text From:",colLabelAbbrevSelect]);

	displayPrefs.appendChild(prefContents);
	displayPrefs.className = 'preferencesSubPanel';
	displayPrefs.style.display='none';
	return displayPrefs;
}

/**********************************************************************************
 * FUNCTION - setupGapPrefs: This function sets up the DIV panel for displaying/setting
 * heat map top item preferences.
 **********************************************************************************/
NgChmGui.FORMAT.setupTopItemsPrefs = function() {
	var topItemsPrefs = NgChmGui.UTIL.getDivElement("top_items");
	var prefContents = document.createElement("TABLE");
	var colorMap = NgChmGui.mapProperties.matrix_files[0].color_map;
	var rowConfig = NgChmGui.mapProperties.row_configuration;
	var colConfig = NgChmGui.mapProperties.col_configuration;
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["<b>List comma separated labels to highlight items on the Map</b>"]);
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["ROW LABEL TOP ITEMS"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	var topRowItemData = rowConfig.top_items.toString();
	var topRowItems = "<textarea name='rowTopItems' id='rowTopItems' style='font-family: sans-serif;font-size: 90%; resize: none;' ' rows='5', cols='50' onchange='NgChmGui.UTIL.setBuildProps();'>"+topRowItemData+"</textarea>";
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Rows Items:"]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;"+topRowItems],2);
	NgChmGui.UTIL.addBlankRow(prefContents,4);
	NgChmGui.UTIL.setTableRow(prefContents,["COLUMN LABEL TOP ITEMS"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	var topColItemData = colConfig.top_items.toString();
	var topColItems = "<textarea name='colTopItems' id='colTopItems' style='font-family: sans-serif;font-size: 90%;resize: none;' rows='5', cols='50' onchange='NgChmGui.UTIL.setBuildProps();'>"+topColItemData+"</textarea>"; 
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Column Items:"]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;"+topColItems],2);
	topItemsPrefs.appendChild(prefContents);
	topItemsPrefs.className = 'preferencesSubPanel';
	topItemsPrefs.style.display='none';

	return topItemsPrefs;
}

/**********************************************************************************
 * FUNCTION - setupLabelTypePrefs: This function sets up the DIV panel for displaying/
 * setting row/column data type preferences.
 **********************************************************************************/
NgChmGui.FORMAT.setupLabelTypePrefs = function() {
	var labelTypePrefs = NgChmGui.UTIL.getDivElement("link_outs");
	var prefContents = document.createElement("TABLE");
	var colorMap = NgChmGui.mapProperties.matrix_files[0].color_map;
	var rowConfig = NgChmGui.mapProperties.row_configuration;
	var colConfig = NgChmGui.mapProperties.col_configuration;
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["<b>List comma-separated row/column label types to enable map link outs.</b>"]);
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["ROW LABEL TYPES"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	var rowTypeData = rowConfig.data_type.toString();  //CHANGE ME
	var rowTypeItems = "<textarea name='rowLabelTypes' id='rowLabelTypes' style='font-family: sans-serif;font-size: 90%; resize: none;' rows='5', cols='50' onchange='NgChmGui.UTIL.setBuildProps();'>"+rowTypeData+"</textarea>";
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Label Types:"]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;"+rowTypeItems],2);
	NgChmGui.UTIL.addBlankRow(prefContents,4);
	NgChmGui.UTIL.setTableRow(prefContents,["COLUMN LABEL TYPES"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	var colTypeData = colConfig.data_type.toString(); //CHANGE ME
	var colTypeItems = "<textarea name='colLabelTypes' id='colLabelTypes' style='font-family: sans-serif;font-size: 90%; resize: none;' rows='5', cols='50' onchange='NgChmGui.UTIL.setBuildProps();'>"+colTypeData+"</textarea>"; 
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Label Types:"]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;"+colTypeItems],2);
	labelTypePrefs.appendChild(prefContents);
	labelTypePrefs.className = 'preferencesSubPanel';
	labelTypePrefs.style.display='none';

	return labelTypePrefs;
}

/**********************************************************************************
 * FUNCTION - setupGapPrefs: This function sets up the DIV panel for displaying
 * heat map gap preferences.
 **********************************************************************************/
NgChmGui.FORMAT.setupGapPrefs = function() {
	var rowConfig = NgChmGui.mapProperties.row_configuration;
	var colConfig = NgChmGui.mapProperties.col_configuration;
	var gapPrefs = NgChmGui.UTIL.getDivElement("map_gaps");
	var prefContents = document.createElement("TABLE");
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.FORMAT.setGapTable(prefContents, rowConfig, "row");
	NgChmGui.FORMAT.setGapTable(prefContents, colConfig, "col");
	gapPrefs.appendChild(prefContents);
	gapPrefs.className = 'preferencesSubPanel';
	gapPrefs.style.display='none';

	return gapPrefs;
}

/**********************************************************************************
 * FUNCTION - setGapTable: This function sets gap preferences for row or table
 * configurations based upon the type/config passed in.
 **********************************************************************************/
NgChmGui.FORMAT.setGapTable = function (prefContents, config, type) {
	var typeDisp = "row";
	var changeMethod = "NgChmGui.FORMAT.showRowGapMethodSelection();";
	if (type === "col") {
		typeDisp = "column";
		changeMethod = "NgChmGui.FORMAT.showColGapMethodSelection();";
	}
	NgChmGui.UTIL.setTableRow(prefContents,[typeDisp.toUpperCase()+" GAP OPTIONS"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	var gapLocationsData = "";
	if (typeof config.cut_locations !== 'undefined') {
		gapLocationsData = config.cut_locations.toString();
	}
	var gapLocations = "<textarea name='"+type+"GapLocations' id='"+type+"GapLocations' rows='2', cols='40' style='resize: none' onchange='NgChmGui.UTIL.setBuildProps();'>"+gapLocationsData+"</textarea>";
	var gapLocationsDiv = NgChmGui.UTIL.getDivElement(type+"ByLocations");
	var byLocationContents = document.createElement("TABLE");
	NgChmGui.UTIL.setTableRow(byLocationContents,["&nbsp;Enter comma-separated "+typeDisp+" numbers: "]);
	NgChmGui.UTIL.setTableRow(byLocationContents,[gapLocations]);
	gapLocationsDiv.append(byLocationContents);
	gapLocationsDiv.style.display = '';
	if (config.order_method == 'Hierarchical') {
		var gapMethodDiv = NgChmGui.UTIL.getDivElement(type+"GapMethodDiv");
		var methodContents = document.createElement("TABLE");
		NgChmGui.UTIL.addBlankRow(methodContents)
		var gapMethodStr = "<select name='"+type+"GapMethod_list' id='"+type+"GapMethod_list' onchange='"+changeMethod+"'><option value='"+type+"ByLocations' onchange='NgChmGui.UTIL.setBuildProps();'>Gaps By Location</option><option value='"+type+"ByTreeCuts'>Dendrogram Tree Cut</option></select>"
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;Gap Method: ",gapMethodStr]);
		NgChmGui.UTIL.addBlankRow(prefContents);
		var treeCutsData = config.tree_cuts.toString();
		var treeCuts = "<input name='"+type+"TreeCuts'  id='"+type+"TreeCuts'  onchange='NgChmGui.UTIL.setBuildProps();' value='"+config.tree_cuts+"' maxlength='3' size='2'>&emsp;";
		var treeCutsDiv = NgChmGui.UTIL.getDivElement(type+"ByTreeCuts");
		var byTreeCutsContents = document.createElement("TABLE");
		NgChmGui.UTIL.setTableRow(byTreeCutsContents,["&nbsp;&nbsp;Dendrogram Tree Cuts: ", treeCuts]);
		treeCutsDiv.append(byTreeCutsContents);
		NgChmGui.UTIL.setTableRow(prefContents,[gapLocationsDiv.outerHTML],2);
		NgChmGui.UTIL.setTableRow(prefContents,[treeCutsDiv.outerHTML],2);
		treeCutsDiv.style.display = 'none';
	} else {
		NgChmGui.UTIL.setTableRow(prefContents,[gapLocationsDiv.outerHTML],2);
	}
	var cutWidth = "<input name='"+type+"CutWidth' id='"+type+"CutWidth' value='"+config.cut_width+"' maxlength='2' size='2' onchange='NgChmGui.UTIL.setBuildProps();'>&emsp;";
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;&nbsp;Gap Length: ", cutWidth]);
	if (type === "row") {
		NgChmGui.UTIL.addBlankRow(prefContents, 4);
	}
}

/**********************************************************************************
 * FUNCTION - showRowGapMethodSelection: This function toggles panels according to 
 * the row gap type dropdown (used for clustered maps only).
 **********************************************************************************/
NgChmGui.FORMAT.showRowGapMethodSelection = function() {
	var itemSelected = document.getElementById("rowGapMethod_list").value
	document.getElementById("rowByLocations").style.display = 'none';
	document.getElementById("rowByTreeCuts").style.display = 'none';
	if (itemSelected === "rowByLocations") {
		document.getElementById("rowTreeCuts").value = "0";
	} else {
		document.getElementById("rowGapLocations").value = "";
	}
	document.getElementById(itemSelected).style.display = '';
} 

/**********************************************************************************
 * FUNCTION - showColGapMethodSelection: This function toggles panels according to 
 * the column gap type dropdown (used for clustered maps only).
 **********************************************************************************/
NgChmGui.FORMAT.showColGapMethodSelection = function() {
		var itemSelected = document.getElementById("colGapMethod_list").value
		document.getElementById("colByLocations").style.display = 'none';
		document.getElementById("colByTreeCuts").style.display = 'none';
		if (itemSelected === "colByLocations") {
			document.getElementById("colTreeCuts").value = "0";
		} else {
			document.getElementById("colGapLocations").value = "";
		}
		document.getElementById(itemSelected).style.display = '';
}

/**********************************************************************************
 * FUNCTION - setupMatrixColorPrefs: This function sets up the DIV panel for displaying
 * matrix breakpoint/color preferences.
 **********************************************************************************/
NgChmGui.FORMAT.setupMatrixColorPrefs = function() {
	var matrixPrefs = NgChmGui.UTIL.getDivElement("matrix_colors");
	var breakpts = NgChmGui.FORMAT.getBreaksFromColorMap();
	matrixPrefs.appendChild(breakpts);
	matrixPrefs.style.display='';
	matrixPrefs.className = 'preferencesSubPanel';

	return matrixPrefs;
}

/**********************************************************************************
 * FUNCTION - getBreaksFromColorMap: This function sets up the an HTML Table 
 * containing the breakpoint and color setting controls for a provided colorMap obj.
 * This table is then inserted into the matrix breakpoint/color preferences panel.
 **********************************************************************************/
NgChmGui.FORMAT.getBreaksFromColorMap = function() {
	var colorMap = NgChmGui.FORMAT.getColorMapFromConfig();
	var breakpts = document.createElement("TABLE"); 
	NgChmGui.UTIL.addBlankRow(breakpts);
	breakpts.id = "breakPrefsTable";
	breakpts.className = "breakPrefsTable";
	var colors = colorMap.getColors();
	var thresholds = colorMap.getThresholds();
	var missing = colorMap.getMissingColor();
	var type = colorMap.getType();
	NgChmGui.UTIL.setTableRow(breakpts, ["&nbsp;<u>Threshold</u>", "<u><b>Color</b></u>","&nbsp;"]); 
	for (var j = 0; j < thresholds.length; j++) {
		var threshold = thresholds[j];    
		var color = colors[j];
		var threshId = "breakPt"+j;
		var colorId = "color"+j;
		var breakPtInput = "&nbsp;&nbsp;<input name='"+threshId+"_breakPref' id='"+threshId+"_breakPref' value='"+threshold+"' maxlength='8' size='8' onchange='NgChmGui.UTIL.setBuildProps();'>";
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"_colorPref' id='"+colorId+"_colorPref' value='"+color+"' onchange='NgChmGui.UTIL.setBuildProps();'>"; 
		var addButton = "<img id='"+threshId+"_breakAdd' src='images/plusButton.png' alt='Add Breakpoint' onclick='NgChmGui.FORMAT.processLayerBreak("+j+",\"add\");' align='top'/>"
		var delButton = "<img id='"+threshId+"_breakDel' src='images/minusButton.png' alt='Remove Breakpoint' onclick='NgChmGui.FORMAT.processLayerBreak("+j+",\"delete\");' align='top'/>"
		if (j === 0) {
			NgChmGui.UTIL.setTableRow(breakpts, [breakPtInput, colorInput+"&nbsp;&nbsp;&nbsp;"+addButton]);
		} else {
			NgChmGui.UTIL.setTableRow(breakpts, [breakPtInput,  colorInput+"&nbsp;&nbsp;&nbsp;"+addButton+"&nbsp;"+delButton]);
		}
	} 
	NgChmGui.UTIL.addBlankRow(breakpts)
	NgChmGui.UTIL.setTableRow(breakpts, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_colorPref' id='missing_colorPref' value='"+missing+"' onchange='NgChmGui.UTIL.setBuildProps();'>"]);
	NgChmGui.UTIL.addBlankRow(breakpts)
	NgChmGui.UTIL.setTableRow(breakpts, ["&nbsp;<u>Choose a pre-defined color palette:</u>"],2);
	var rainbow = "<div style='display:flex'><div id='setROYGBV' class='preDefPalette' style='background: linear-gradient(to right, red,orange,yellow,green,blue,violet);' onclick='NgChmGui.FORMAT.setBreaksToPreset([\"#FF0000\",\"#FF8000\",\"#FFFF00\",\"#00FF00\",\"#0000FF\",\"#FF00FF\"],\"#000000\")' > </div>" +
			"<div class='preDefPaletteMissingColor' style='background:black'></div></div>";
	var redWhiteBlue = "<div style='display:flex'><div id='setRedWhiteBlue' class='preDefPalette' style='background: linear-gradient(to right, blue,white,red);' onclick='NgChmGui.FORMAT.setBreaksToPreset([\"#0000FF\",\"#FFFFFF\",\"#ff0000\"],\"#000000\")'> </div>" +
			"<div class='preDefPaletteMissingColor' style='background:black'></div></div>";
	var redBlackGreen = "<div style='display:flex'><div id='setRedBlackGreen' class='preDefPalette' style='background: linear-gradient(to right, green,black,red);' onclick='NgChmGui.FORMAT.setBreaksToPreset([\"#00FF00\",\"#000000\",\"#FF0000\"],\"#ffffff\")'> </div>" +
			"<div class='preDefPaletteMissingColor' style='background:white'></div></div>"
	NgChmGui.UTIL.setTableRow(breakpts, ["Blue Red", redWhiteBlue]);
	NgChmGui.UTIL.setTableRow(breakpts, ["Rainbow", rainbow]);
	NgChmGui.UTIL.setTableRow(breakpts, ["Green Red", redBlackGreen]);
	//TO BE ADDED FOR COLOR PREVIEW PANEL
/*	NgChmGui.UTIL.setTableRow(breakpts, ["&nbsp;Color Histogram:", "<button type='button' onclick='NgChmGui.FORMAT.loadColorPreviewDiv()'>Update</button>"]);
	var previewDiv = "<div id='previewWrapper' style='display:flex; height: 100px; width: 110px;position:relative;' ></div>";//NgChm.UHM.loadColorPreviewDiv(mapName,true);
	NgChmGui.UTIL.setTableRow(breakpts, [previewDiv]);
	setTimeout(function(){NgChmGui.FORMAT.loadColorPreviewDiv(true)},100);
*/
	return breakpts;
}

/**********************************************************************************
 * FUNCTION - getColorMapFromConfig: This function creates a colorMap object from
 * the color map JSON stored for the matrix color map.
 **********************************************************************************/
NgChmGui.FORMAT.getColorMapFromConfig = function() {
	var colorConfig = NgChmGui.mapProperties.matrix_files[0].color_map;
	var colorScheme = {"missing": colorConfig.missing, "thresholds": colorConfig.thresholds, "colors": colorConfig.colors, "type": colorConfig.type};
	var colorMap = new NgChmGui.CM.ColorMap(colorScheme);
	return colorMap;
}

/**********************************************************************************
 * FUNCTION - setColorMapToConfig: This function resets the color map on the 
 * properties object whenever covariates are added/removed.
 **********************************************************************************/
NgChmGui.FORMAT.setColorMapToConfig = function(colorMap) {
	var colorConfig = NgChmGui.mapProperties.matrix_files[0].color_map;
	colorConfig.missing = colorMap.getMissingColor();
	colorConfig.thresholds = colorMap.getThresholds();
	colorConfig.colors = colorMap.getColors();
	colorConfig.type = colorMap.getType();
	return;
}

/**********************************************************************************
 * FUNCTION - getColorMapFromScreen: This function resets the values in the color
 * map stored in the config to values that are pulled from user screen entries.
 **********************************************************************************/
NgChmGui.FORMAT.getColorMapFromScreen = function() {
	var colorMap = NgChmGui.FORMAT.getColorMapFromConfig();
	var thresholds = colorMap.getThresholds();
	var colors = colorMap.getColors();
	for (var j = 0; j < thresholds.length; j++) {
		var threshId = "breakPt"+j;
		var colorId = "color"+j;
		thresholds[j] = document.getElementById(threshId+"_breakPref").value;
		colors[j] = document.getElementById(colorId+"_colorPref").value;
	} 
	colorMap.missing = document.getElementById("missing_colorPref").value;
	NgChmGui.FORMAT.getColorMapFromConfig(colorMap);
}
	
/**********************************************************************************
* FUNCTION - getFormatDisplayFromScreen: This function loads the heatmapProperties
* config from the values set on the Format Display panel.
**********************************************************************************/
NgChmGui.FORMAT.getFormatDisplayFromScreen = function() {
	//Get->set matrix config preferences
	var matrixConfig = NgChmGui.mapProperties.matrix_files[0];
	matrixConfig.grid_show = document.getElementById('gridShowPref').value;
	matrixConfig.grid_color = document.getElementById('gridColorPref').value;
	matrixConfig.selection_color = document.getElementById('selectionColorPref').value;
	//Get->set row config preferences
	var rowConfig = NgChmGui.mapProperties.row_configuration;
	if (rowConfig.order_method === "Hierarchical") {
		rowConfig.dendro_show = document.getElementById('rowDendroShowPref').value;
		rowConfig.dendro_height = document.getElementById('rowDendroHeightPref').value;
	}
	rowConfig.label_display_length = document.getElementById('rowLabelSizePref').value;
	rowConfig.label_display_abbreviation = document.getElementById('rowLabelAbbrevPref').value;
	//Get->set column config preferences
	var colConfig = NgChmGui.mapProperties.col_configuration;
	if (colConfig.order_method === "Hierarchical") {
		colConfig.dendro_show = document.getElementById('colDendroShowPref').value;
		colConfig.dendro_height = document.getElementById('colDendroHeightPref').value;
	}
	colConfig.label_display_length = document.getElementById('colLabelSizePref').value;
	colConfig.label_display_abbreviation = document.getElementById('colLabelAbbrevPref').value;
}

/**********************************************************************************
* FUNCTION - getFormatTopItemsFromScreen: This function loads the heatmapProperties
* config from the values set on the Top Items panel.
**********************************************************************************/
NgChmGui.FORMAT.getFormatTopItemsFromScreen = function() {
	var rowConfig = NgChmGui.mapProperties.row_configuration;
  	var rowTopItems = document.getElementById("rowTopItems").value.split(/[;, \r\n]+/);
	rowConfig.top_items = [];
	for (var i=0;i<rowTopItems.length;i++) {
		if (rowTopItems[i]!==""){
			rowConfig.top_items.push(rowTopItems[i]);
		}
	}
	var colConfig = NgChmGui.mapProperties.col_configuration;
  	var colTopItems = document.getElementById("colTopItems").value.split(/[;, \r\n]+/);
	colConfig.top_items = [];
	for (var i=0;i<colTopItems.length;i++) {
		if (colTopItems[i]!==""){
			colConfig.top_items.push(colTopItems[i]);
		}
	}
}

NgChmGui.FORMAT.getFormatLabelTypesFromScreen = function() {
	var rowConfig = NgChmGui.mapProperties.row_configuration;
  	var rowlabelItems = document.getElementById("rowLabelTypes").value.split(/[;, \r\n]+/);
	rowConfig.data_type = [];
	for (var i=0;i<rowlabelItems.length;i++) {
		if (rowlabelItems[i]!==""){
			rowConfig.data_type.push(rowlabelItems[i]);
		}
	}
	var colConfig = NgChmGui.mapProperties.col_configuration;
  	var colLabelItems = document.getElementById("colLabelTypes").value.split(/[;, \r\n]+/);
	colConfig.data_type = [];
	for (var i=0;i<colLabelItems.length;i++) {
		if (colLabelItems[i]!==""){
			colConfig.data_type.push(colLabelItems[i]);
		}
	}
}

/**********************************************************************************
* FUNCTION - getMapGapsFromScreen: This function loads the heatmapProperties
* config from the values set on the Heat Map Gaps Items panel.
**********************************************************************************/
NgChmGui.FORMAT.getMapGapsFromScreen = function() {
	var rowConfig = NgChmGui.mapProperties.row_configuration;
  	var rowGapLocations = document.getElementById("rowGapLocations").value.split(/[;, \r\n]+/);
	rowConfig.cut_locations = [];
	for (var i=0;i<rowGapLocations.length;i++) {
		if (rowGapLocations[i]!==""){
			rowConfig.cut_locations.push(parseInt(rowGapLocations[i]));
		}
	}
	if (rowConfig.order_method === "Hierarchical") {
		rowConfig.tree_cuts = document.getElementById("rowTreeCuts").value;
	}
	rowConfig.cut_width = document.getElementById("rowCutWidth").value;
	var colConfig = NgChmGui.mapProperties.col_configuration;
  	var colGapLocations = document.getElementById("colGapLocations").value.split(/[;, \r\n]+/);
	colConfig.cut_locations = [];
	for (var i=0;i<colGapLocations.length;i++) {
		if (colGapLocations[i]!==""){
			colConfig.cut_locations.push(parseInt(colGapLocations[i]));
		}
	}
	if (colConfig.order_method === "Hierarchical") {
		colConfig.tree_cuts = document.getElementById("colTreeCuts").value;
	}
	colConfig.cut_width = document.getElementById("colCutWidth").value;
}

/**********************************************************************************
 * FUNCTION - processLayerBreak: The purpose of this function is to add or remove
 * (based upon the type input parameter) a breakpoint row to a colorMap object based 
 * upon the table row item clicked on the matrix colors preferences. For adds, a new 
 * row is created using the preceding row as a template (i.e. breakpt value and color 
 * same as row clicked on).  For deletes, the selected row is removed. 
 **********************************************************************************/
NgChmGui.FORMAT.processLayerBreak = function(pos, type) {
	NgChmGui.UTIL.setBuildProps();
	var colorMap = NgChmGui.FORMAT.getColorMapFromConfig();
	var newThresholds = NgChmGui.FORMAT.getNewBreakThresholds(colorMap, pos, type);
	var newColors = NgChmGui.FORMAT.getNewBreakColors(colorMap, pos, type);
	colorMap.setThresholds(newThresholds);
	colorMap.setColors(newColors);
	NgChmGui.FORMAT.setColorMapToConfig(colorMap);
	NgChmGui.FORMAT.reloadLayerBreaksColorMap();
}

/**********************************************************************************
 * FUNCTION - reloadLayerBreaksColorMap: The purpose of this function is to reload
 * the colormap for a given data layer.  The add/deleteLayerBreak v call
 * this common function.  The layerPrefs DIV is retrieved and the setupLayerBreaks
 * method is called, passing in the newly edited colorMap. 
 **********************************************************************************/
NgChmGui.FORMAT.reloadLayerBreaksColorMap = function() {
	var breakPrefs = document.getElementById("breakPrefsTable");
	if (breakPrefs){
		breakPrefs.remove();
	}
	var matrixColorPrefs = document.getElementById("matrix_colors");
	var breakPrefs = NgChmGui.FORMAT.getBreaksFromColorMap();
	matrixColorPrefs.appendChild(breakPrefs);
}

/**********************************************************************************
 * FUNCTION - getNewBreakThresholds: The purpose of this function is to grab all user
 * data layer breakpoint entries for a given colormap and place them on a string array.  
 * It will  iterate thru the screen elements, pulling the current breakpoint entry for each 
 * element, placing it in a new array, and returning that array. This function is 
 * called by the prefsApplyBreaks function (only for data layers).  It is ALSO called 
 * from the data layer addLayerBreak and deleteLayerBreak functions with parameters 
 * passed in for the position to add/delete and the action to be performed (add/delete).
 **********************************************************************************/
NgChmGui.FORMAT.getNewBreakThresholds = function(colorMap, pos, action) {
	var colorMapName = NgChmGui.mapProperties.chm_name;
	var thresholds = colorMap.getThresholds();
	var newThresholds = [];
	for (var j = 0; j < thresholds.length; j++) {
		var breakElement = document.getElementById("breakPt"+j+"_breakPref");
		//In case there are now less elements than the thresholds list on Reset.
		if (breakElement !== null) {
			if (typeof pos !== 'undefined') {
				if (action === "add") {
					newThresholds.push(breakElement.value);
					if (j === pos) {
						//get next breakpoint value.  If none, add 1 to current breakpoint
						var nextBreakElement = document.getElementById("breakPt"+(j+1)+"_breakPref");
						var nextBreakVal = 0;
						if (nextBreakElement === null) {
							nextBreakVal = Number(breakElement.value)+1;
						} else {
							nextBreakVal = Number(nextBreakElement.value);
						}
						//calculate the difference between last and next breakpoint values and divide by 2 to get the mid-point between.
						var breakDiff = (Math.abs((Math.abs(nextBreakVal) - Math.abs(Number(breakElement.value))))/2);
						//add mid-point to last breakpoint.
						var calcdBreak = (Number(breakElement.value) + breakDiff).toFixed(4);
						newThresholds.push(calcdBreak);
					}
				} else {
					if (j !== pos) {
						newThresholds.push(breakElement.value);
					}
				}
			} else {
				newThresholds.push(breakElement.value);
			}
		}
	}
	//Potentially on a data layer reset, there could be more color points than contained in the thresholds object
	//because a user may have deleted a breakpoint and then hit "reset". So we check for up to 50 preferences.
	for (var k = thresholds.length; k < 50; k++) {
		var breakElement = document.getElementById("breakPt"+k+"_breakPref");
		if (breakElement !== null) {
			newThresholds.push(breakElement.value);
		}
	} 
	
	return newThresholds;
}

/**********************************************************************************
 * FUNCTION - getNewBreakColors: The purpose of this function is to grab all user
 * color entries for a given colormap and place them on a string array.  It will 
 * iterate thru the screen elements, pulling the current color entry for each 
 * element, placing it in a new array, and returning that array. This function is 
 * called by the prefsApplyBreaks function.  It is ALSO called from the data layer
 * addLayerBreak and deleteLayerBreak functions with parameters passed in for 
 * the position to add/delete and the action to be performed (add/delete).
 **********************************************************************************/
NgChmGui.FORMAT.getNewBreakColors = function(colorMap, pos, action) {
	var thresholds = colorMap.getThresholds();
	var newColors = [];
	for (var j = 0; j < thresholds.length; j++) {
		var colorElement = document.getElementById("color"+j+"_colorPref");
		//In case there are now less elements than the thresholds list on Reset.
		if (colorElement !== null) {
			//If being called from addLayerBreak or deleteLayerBreak
			if (typeof pos !== 'undefined') {
				if (action === "add") {
					newColors.push(colorElement.value);
					if (j === pos) {
						//get next breakpoint color.  If none, use black
						var nextColorElement = document.getElementById("color"+(j+1)+"_colorPref");
						var nextColorVal = "#000000";
						if (nextColorElement !== null) {
							nextColorVal = nextColorElement.value;
						}
						//Blend last and next breakpoint colors to get new color.
						var newColor =  NgChm.UTIL.blendTwoColors(colorElement.value, nextColorVal);   
						newColors.push(newColor);
					}
				} else {
					if (j !== pos) {
						newColors.push(colorElement.value);
					}
				}
			} else {
				newColors.push(colorElement.value);
			}
		}
	}
	
	//If this color map is for a row/col class bar AND that bar is a scatter or
	//bar plot (colormap will always be continuous), set the upper colormap color
	//to the foreground color set by the user for the bar/scatter plot. This is
	//default behavior that happens when a map is built but must be managed as
	//users change preferences and bar types.
	//Potentially on a data layer reset, there could be more color points than contained in the thresholds object
	//because a user may have deleted a breakpoint and then hit "reset". So we check for up to 50 preferences.
	for (var k = thresholds.length; k < 50; k++) {
		var colorElement = document.getElementById("color"+k+"_colorPref");
		if (colorElement !== null) {
			newColors.push(colorElement.value);
		} 
	} 
	return newColors;
}

/**********************************************************************************
 * FUNCTION - setBreaksToPreset: This function will be executed when the user
 * selects a predefined color scheme. It will fill the first and last breakpoints with the 
 * predefined colors and interpolate the breakpoints in between.
 * "preset" is an array of the colors in HEX of the predefined color scheme
 **********************************************************************************/
NgChmGui.FORMAT.setBreaksToPreset = function(preset, missingColor) {
	NgChmGui.UTIL.setBuildProps();
	var i = 0; // find number of breakpoints in the 
	while(document.getElementById("color"+ ++i+"_colorPref"));
	var lastShown = i-1;
	// create dummy colorScheme
	var thresh = [];
	var firstBP = document.getElementById("breakPt0_breakPref").value;
	var lastBP = document.getElementById("breakPt"+ lastShown +"_breakPref").value;
	var range = lastBP-firstBP;
	for (var j = 0; j < preset.length; j++){
		thresh[j] =Number(firstBP)+j*(range/(preset.length-1));
	}
	var colorScheme = {"missing": missingColor,"thresholds": thresh,"colors": preset,"type": "continuous"};
	var csTemp = new NgChmGui.CM.ColorMap(colorScheme);
	for (var j = 0; j < i; j++) {
		var threshId = "breakPt"+j;
		var colorId = "color"+j;
		var breakpoint = document.getElementById(threshId+"_breakPref").value;
		document.getElementById(colorId+"_colorPref").value = csTemp.getRgbToHex(csTemp.getColor(breakpoint)); 
	} 
	document.getElementById("missing_colorPref").value = csTemp.getRgbToHex(csTemp.getColor("Missing")); 
}	

/**********************************************************************************
 * FUNCTION - applySettings: This function calls functions for each sub-panel
 * (e.g. top items, display format, etc...) and applies values from those panels
 * to the heatmapProperties configuration.  It then reloads the current screen OR
 * calls the next depending upon the typ parameter passed in.
 **********************************************************************************/
NgChmGui.FORMAT.applySettings = function(typ) {
	NgChmGui.FORMAT.getColorMapFromScreen();
	NgChmGui.FORMAT.getFormatDisplayFromScreen();
	NgChmGui.FORMAT.getFormatTopItemsFromScreen();
	NgChmGui.FORMAT.getFormatLabelTypesFromScreen();
	NgChmGui.FORMAT.getMapGapsFromScreen();
	
	return NgChmGui.FORMAT.validateEntries(false);
}

/**********************************************************************************
 * FUNCTION - loadFormatView: This function runs when the format panel is
 * initially loading and drawing the heatmap image in the view panel.  It calls
 * a generic servlet for retrieving the heatmap into the widget viewer, but makes
 * a few minor display changes specific to the Format screen.
 **********************************************************************************/
NgChmGui.FORMAT.loadFormatView = function() {
	NgChmGui.UTIL.loadHeatMapView();
	//Show selection box to highlight pref changes to the box
	document.getElementById('summary_box_canvas').style.display = '';
	//Show examples of how row and column labels are length-limited and abbreviated
	var labelPrefDispDIV = document.getElementById('labelPrefExample');
	var exampleLabel = 'TCGA-DK-11R-A13Y-07';
	var rowText = "<b>Row Display Example: </b>&nbsp;&nbsp;" + NgChmGui.UTIL.getLabelText(exampleLabel,"ROW");
	var colText = "<b>Col Display Example: </b>&nbsp;&nbsp;" + NgChmGui.UTIL.getLabelText(exampleLabel,"COL");
	labelPrefDispDIV.innerHTML = rowText+"<BR>"+colText;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
//CODE BELOW THIS LINE NOT CURRENTLY USED EXAMPLE FUNCTIONS TO RETRIEVE BINS FOR COLOR PREVIEW DIV
///////////////////////////////////////////////////////////////////////////////////////////////////

NgChmGui.FORMAT.bins = null;  //TO BE USED LATER ON COLOR PREVIEW

/**********************************************************************************
 * FUNCTION - loadColorPreviewDiv: This function will update the color distribution
 * preview div to the current color palette in the gear panel
 **********************************************************************************/
NgChmGui.FORMAT.loadColorPreviewDiv = function(firstLoad){
	var numRow = NgChmGui.mapProperties.builder_config.matrix_grid_config.dataRows;
	var numCol = NgChmGui.mapProperties.builder_config.matrix_grid_config.dataCols;
	var cm = NgChmGui.FORMAT.getTempCM(firstLoad);
	var gradient = "linear-gradient(to right";
	var numBreaks = cm.thresholds.length;
	var highBP = parseFloat(cm.thresholds[numBreaks-1]);
	var lowBP = parseFloat(cm.thresholds[0]);
	var diff = highBP-lowBP;
	for (var i=0;i<numBreaks;i++){
		var bp = cm.thresholds[i];
		var col = cm.colors[i];
		var pct = Math.round((bp-lowBP)/diff*100);
		gradient += "," + col + " " + pct + "%";
	}
	gradient += ")";
	var wrapper = document.getElementById("previewWrapper");

	
	/* GET BINS HERE FROM SERVLET */
	
	
	var bins = NgChmGui.FORMAT.bins;
	var total = 0;
	var binMax = NgChmGui.FORMAT.numMissing;
	for (var i=0;i<bins.length;i++){
		if (bins[i]>binMax)
			binMax=bins[i];
		total+=bins[i];
	}

	var svg = "<svg id='previewSVG' width='110' height='100' style='position:absolute;left:10px;top:20px;'>"
	for (var i=0;i<bins.length;i++){
		var rect = "<rect x='" +i*10+ "' y='" +(1-bins[i]/binMax)*100+ "' width='10' height='" +bins[i]/binMax*100+ "' style='fill:rgb(0,0,0);fill-opacity:0;stroke-width:1;stroke:rgb(0,0,0)'> "/*<title>"+bins[i]+"</title>*/+ "</rect>";
		svg+=rect;
	}
	var missingRect = "<rect x='100' y='" +(1-nan/binMax)*100+ "' width='10' height='" +nan/binMax*100+ "' style='fill:rgb(255,255,255);fill-opacity:1;stroke-width:1;stroke:rgb(0,0,0)'> "/* <title>"+nan+"</title>*/+"</rect>";
	svg+= missingRect;
	svg+="</svg>";
	var binNums = "";//"<p class='previewLegend' style='position:absolute;left:0;top:100;font-size:10;'>0</p><p class='previewLegend' style='position:absolute;left:0;top:0;font-size:10;'>"+binMax+"</p>"
	var boundNums = "<p class='previewLegend' style='position:absolute;left:10;top:110;font-size:10;'>"+lowBP.toFixed(2)+"</p><p class='previewLegend' style='position:absolute;left:90;top:110;font-size:10;'>"+highBP.toFixed(2)+"</p>"
	
	var preview = "<div id='previewMainColor' style='height: 100px; width:100px;background:"+gradient+";position:absolute; left: 10px; top: 20px;'></div>"
		+"<div id='previewMissingColor'style='height: 100px; width:10px;background:"+cm.missing+";position:absolute;left:110px;top:20px;'></div>"
		+svg+binNums+boundNums;
	wrapper.innerHTML= preview;
}

//NOT CURRENTLY USED EXAMPLE FUNCTION TO RETRIEVE BINS FOR COLOR PREVIEW DIV
NgChmGui.FORMAT.getDataBins = function() {
	var req = new XMLHttpRequest();
	req.open("GET", "GetWorkingMatrix", true);
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to get working matrix '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	matrixInfo = JSON.parse(req.response);
	        	NgChmGui.FORMAT.bins = new Array();
	        	for (var j=0;j<matrixInfo.histoCounts.length;j++) {
        			NgChmGui.FORMAT.bins.push(matrixInfo.histoCounts[j]);
	        	}
	        	NgChmGui.FORMAT.bins.push(matrixInfo.numMissing);
		    }
		}
	};
	req.send();
}

//NOT CURRENTLY USED EXAMPLE FUNCTION TO RETRIEVE BINS FOR COLOR PREVIEW DIV
/**********************************************************************************
 * FUNCTION - getTempCM: This function  will create a dummy color map object to be 
 * used by loadColorPreviewDiv. If the gear menu has just been opened (firstLoad), the
 * saved values from the color map manager will be used. Otherwise, it will read the 
 * values stored in the input boxes, as these values may differ from the ones stored
 * in the color map manager.
 **********************************************************************************/
NgChmGui.FORMAT.getTempCM = function(firstLoad){
	var tempCM = {"colors":[],"missing":"","thresholds":[],"type":"linear"};
	if (firstLoad){
		var colorMap = NgChmGui.FORMAT.getColorMapFromConfig();
		tempCM.thresholds = colorMap.getThresholds();
		tempCM.colors = colorMap.getColors();
		tempCM.missing = colorMap.getMissingColor();
	} else {
		var i=0;
		var bp = document.getElementById("breakPt"+[i]+"_breakPref");
		var color = document.getElementById("color"+[i]+"_colorPref");
		while(bp && color){
			tempCM.colors.push(color.value);
			tempCM.thresholds.push(bp.value);
			i++;
			bp = document.getElementById("breakPt"+[i]+"_breakPref");
			color = document.getElementById("color"+[i]+"_colorPref");
		}
		var missing = document.getElementById("missing_colorPref");
		tempCM.missing = missing.value;
	}
	return tempCM;
}

/* Validate and go to next screen if everything is good */
NgChmGui.FORMAT.gotoHeatMapScreen = function() {
	if (NgChmGui.FORMAT.validateEntries(true)){
		NgChmGui.UTIL.gotoHeatMapScreen()
	}
}
