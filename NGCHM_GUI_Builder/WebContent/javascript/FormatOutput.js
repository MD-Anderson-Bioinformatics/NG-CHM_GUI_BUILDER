//Define Namespace for NgChmGui Covariate File Page
NgChmGui.createNS('NgChmGui.FORMAT');
NgChmGui.isHalfScreen = true;
NgChmGui.tileWrite = false;

NgChmGui.FORMAT.userPalettes = "";

/**********************************************************************************
 * FUNCTION - loadData: This function will be executed when the format page
 * is opened for the first time.  It loads the header, sets up the left data 
 * entry panel, and calls functions that loads format preferences into data
 * entry panels.  
 **********************************************************************************/
NgChmGui.FORMAT.loadData =  function() {
	if (NgChmGui.UTIL.loadHeaderData()) {
		var prefsPanelDiv = document.getElementById("preferencesPanel");
		prefsPanelDiv.style.left = '0px';
		prefsPanelDiv.style.right = "";
		var formatPrefsDiv = NgChmGui.FORMAT.setupFormatTasks();
		NgChmGui.FORMAT.setFormatTaskOptions();
		NgChmGui.FORMAT.loadFormatView();
		formatPrefsDiv.style.display = '';
		prefsPanelDiv.style.display = '';
		NgChmGui.FORMAT.validateEntries(false);
		NgChmGui.FORMAT.setLabelTypeList(0);
		NgChmGui.FORMAT.loadColorPreviewDiv(0);
	}
	if (NgChmGui.UTIL.setUpAdvanced() === true) {
		NgChmGui.FORMAT.setAdvanced();
	}
	NgChmGui.PALETTE.getUserPalettes();
	NgChmGui.UTIL.setBuildProps();
	NgChmGui.UTIL.setFullPdfProps();
}

NgChmGui.FORMAT.setBuildProps = function(tileWrite) {
    NgChmGui.mapProperties.builder_config.targetScreen = "Format Heat Map";
	NgChmGui.UTIL.setBuildProps(tileWrite);
}

/**********************************************************************************
 * FUNCTION - setAdvanced: This function applies special advanced/standard function
 * display rules that apply to the Format Heat Map screen.
 **********************************************************************************/
NgChmGui.FORMAT.setAdvanced = function() {
	var taskList = document.getElementById('formatTask_list');
	if (NgChmGui.UTIL.showAdvanced === 'N') {
		if (taskList.selectedIndex === 3) {
			taskList.selectedIndex = 0;
			NgChmGui.FORMAT.showFormatSelection();
		}
		for (var i=0; i<taskList.length; i++){
			  if (taskList.options[i].value === 'map_gaps' ) {
				  taskList.remove(i);
			  }
		}
	} else {
		var gapsFound = false;
		for (var i=0; i<taskList.length; i++){
			  if (taskList.options[i].value === 'map_gaps' ) {
				  gapsFound = true;
			  }
		}
		if (gapsFound === false) {
		    var opt = document.createElement('option');
		    opt.value = 'map_gaps';
		    opt.innerHTML = 'Heat Map Gaps';
		    taskList.appendChild(opt);
		}
	}
}

/**********************************************************************************
 * FUNCTION - clusteringComplete: This function gets called when the ordering has
 * been changed and sent to the server to perform clustering.
 **********************************************************************************/
NgChmGui.FORMAT.applyComplete = function() {
	NgChmGui.FORMAT.validateEntries(false);
    NgChmGui.FORMAT.loadFormatView();
    NgChmGui.FORMAT.loadColorPreviewDiv(0);
}

/**********************************************************************************
 * FUNCTION - the validate function is called on page load, page exit, and when
 * user operations are performed.  It creates conditional messages in the message
 * area including errors and warnings.  It also returns false if errors are detected.  
 **********************************************************************************/
NgChmGui.FORMAT.validateEntries = function(leavingPage) {
	var valid = true;
	var pageText = "";
	
	//Generate build error messages
	var buildErrors = NgChmGui.mapProperties.builder_config.buildErrors;
	if (buildErrors !== "") {
		pageText = pageText + "<b><font color='red'>" + buildErrors + "</font></b> Build error must be resolved to continue." + NgChmGui.UTIL.nextLine;
		valid = false;
	}
	
	//Generate data entry error messages
	pageText = pageText + NgChmGui.FORMAT.validateMatrixBreaks();
	pageText = pageText + NgChmGui.FORMAT.validateGapPrefs();
	pageText = pageText + NgChmGui.FORMAT.validateAttributes();
	valid = pageText === "" ? true : false;

	//Generate error messages
	if (leavingPage) {
		//Do nothing for Format Screen
	} 
	
	//Generate build warning messages
	var buildWarnings = NgChmGui.mapProperties.builder_config.buildWarnings;     
	if (buildWarnings.length > 0) {  
		for (var i=0; i< buildWarnings.length; i++) {
			pageText = pageText + NgChmGui.UTIL.warningPrefix + buildWarnings[i] + NgChmGui.UTIL.nextLine;
		}
	}
	
	//Add in page instruction text
    pageText = pageText + "Several tools are provided here to manipulate the appearance of your heatmap.  The Matrix Colors tool enables you to make changes to colors and threshold values that assign a color to each cell in the heatmap body.  Other advanced presentation settings include adding gaps in the heat map to separate specific sections, adding top level labels to show the position of a few key items in the summary heat map, choosing where to show dendorgrams and how big to make them, selecting label truncation lengths, and identifying the data type of labels to enable link-out capabilities." ;

    NgChmGui.UTIL.setScreenNotes(pageText);
	
	return valid;
}

NgChmGui.FORMAT.validateMatrixBreaks = function() {
	var errorMsgs = "";
	var colorMap = NgChmGui.FORMAT.getColorMapFromConfig();
    var thresholds = colorMap.getThresholds();
    var prevThresh = -2147483647;
	for (var i=0;i<thresholds.length;i++) {
		if (isNaN(thresholds[i])) {
			errorMsgs = errorMsgs + "<p class='error_message'>" +NgChmGui.UTIL.errorPrefix + "Color Thresholds contain non-numeric entry(s).</p>";
			break;
        }
        var currThresh = parseFloat(thresholds[i]);
        if (currThresh <= prevThresh) {
 			errorMsgs = errorMsgs + "<p class='error_message'>" +NgChmGui.UTIL.errorPrefix + "Color Thresholds are not entered in ascending order.</p>";
			break;
        }
        prevThresh = currThresh;
	}
	return errorMsgs;
}

/**********************************************************************************
 * FUNCTION - validateAttributes: This function performs validation on user 
 * heat map attribute entries.
 **********************************************************************************/
NgChmGui.FORMAT.validateAttributes = function() {
	var errorMsgs = "";
	var attrValue = document.getElementById("mapAttributes").value;
	if (attrValue !== "") {
	  	var attributeItems = attrValue.split(/[;, \r\n]+/);
		for (var i=0;i<attributeItems.length;i++) {
			var attrElems = attributeItems[i].split(":");
			if (attrElems.length !== 2) {
				errorMsgs = errorMsgs + "<p class='error_message'>" +NgChmGui.UTIL.errorPrefix + "Bad Attribute value entered. Attributes must be entered as value pairs separated by a colon (:).</p>";
				break;
			}
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
			if ((isNaN(cutVal)) || (cutVal < 0)) {
				nanCut = true;
			}
			for (var j=0;j<configCuts.length;j++) {
				if ((i !== j) && (configCuts[j] === cutVal)) {
					dupCut = true;
				}
			}
		}
		if (nanCut) {
			errorMsgs = errorMsgs + "<p class='error_message'>"+ NgChmGui.UTIL.errorPrefix + type + " Gap values contain non-numeric or negative numeric entry(s).</p>";
		}
		if (dupCut) {
			errorMsgs = errorMsgs + "<p class='error_message'>"+ NgChmGui.UTIL.errorPrefix + type + " Duplicate Gap values found.</p>";
		}
	}
	if ((config.cut_width.trim() === "") || (isNaN(config.cut_width)) || (config.cut_width.indexOf(".") > -1) || (config.cut_width < 0)) {
		errorMsgs = errorMsgs + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + type + " Gap Length contains a non-integer or negative numeric entry.</p>";
	}
	if ((config.tree_cuts.trim() === "") || (isNaN(config.tree_cuts)) || (config.tree_cuts.indexOf(".") > -1)  || (config.tree_cuts < 0)) {
		errorMsgs = errorMsgs + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + type + " Tree Cuts contains a non-integer or negative numeric entry.</p>";
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
	var formatTaskStr = "<select name='formatTask_list' id='formatTask_list' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.showFormatSelection();'><option value='matrix_colors'>Matrix Colors/Breaks</option><option value='format_display'>Heat Map Display</option><option value='label_config'>Labels and Attributes</option><option value='map_gaps'>Heat Map Gaps</option></select>"
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
	var labelConfigPrefsDiv = NgChmGui.FORMAT.setupLabelConfigPrefs()
	formatPrefsDiv.appendChild(labelConfigPrefsDiv);
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
	document.getElementById('summaryWidth').value = NgChmGui.mapProperties.summary_width;
	if (document.getElementById('rowGapMethod_list') !== null) {
		document.getElementById('rowGapMethod_list').value = rowConfig.tree_cuts !== "0" ? "rowByTreeCuts" : "rowByLocations";
		NgChmGui.FORMAT.showRowGapMethodSelection();
	}
	if (document.getElementById('colGapMethod_list') !== null) {
		document.getElementById('colGapMethod_list').value = colConfig.tree_cuts !== "0" ? "colByTreeCuts" : "colByLocations";
		NgChmGui.FORMAT.showColGapMethodSelection();
	}
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
	var showGrid = "<select name='gridShowPref' id='gridShowPref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'><option value='Y'>YES</option><option value='N'>NO</option></select>";
	var colorGrid = "<input class='spectrumColor' type='color' name='gridColorPref' id='gridColorPref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);' value='"+matrixConfig.grid_color+"'>"; 
	var colorGaps = "<div class='advancedAction'><input class='spectrumColor' type='color' name='gapsColorPref' id='gapsColorPref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);' value='"+matrixConfig.cuts_color+"'></div>"; 
	var colorSelect = "<input class='spectrumColor' type='color' name='selectionColorPref' id='selectionColorPref'  onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);' value='"+matrixConfig.selection_color+"'>"; 
	var summaryWidth = "<select name='summaryWidth' id='summaryWidth' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'><option value='10'>10%</option><option value='20'>20%</option><option value='30'>30%</option><option value='40'>40%</option><option value='50'>50%</option><option value='60'>60%</option><option value='70'>70%</option><option value='80'>80%</option><option value='90'>90%</option></select>";
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Selection Color:",colorSelect]);
	NgChmGui.UTIL.setTableRow(prefContents,["<span class='advancedAction'>&nbsp;&nbsp;Gaps Color:</span>",colorGaps]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Grid Color:",colorGrid]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Show Grid:",showGrid]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Summary Display Width:",summaryWidth]);
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["ROW DISPLAY OPTIONS"], 2);
	if (rowConfig.order_method === "Hierarchical") {
		var dendroShowOptions = "<option value='ALL'>Summary and Detail</option><option value='SUMMARY'>Summary Only</option><option value='NONE'>Hide</option></select>";
		var dendroHeightOptions = "<option value='50'>50%</option><option value='75'>75%</option><option value='100'>100%</option><option value='125'>125%</option><option value='150'>150%</option><option value='200'>200%</option></select>";
		var rowDendroSelect = "<select name='rowDendroShowPref' id='rowDendroShowPref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>"
		rowDendroSelect = rowDendroSelect+dendroShowOptions;
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Show Dendrogram:",rowDendroSelect]);  
		var rowDendroHeightSelect = "<select name='rowDendroHeightPref' id='rowDendroHeightPref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>"
		rowDendroHeightSelect = rowDendroHeightSelect+dendroHeightOptions;
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Dendrogram Height:",rowDendroHeightSelect]); 
	}  
	var rowLabelSizeSelect = "<select name='rowLabelSizePref' id='rowLabelSizePref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'><option value='10'>10 Characters</option><option value='15'>15 Characters</option><option value='20'>20 Characters</option><option value='25'>25 Characters</option><option value='30'>30 Characters</option><option value='35'>35 Characters</option><option value='40'>40 Characters</option>"
	var rowLabelAbbrevSelect = "<select name='rowLabelAbbrevPref' id='rowLabelAbbrevPref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'><option value='START'>Beginning</option><option value='MIDDLE'>Middle</option><option value='END'>End</option>"
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Maximum Label Length:",rowLabelSizeSelect]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Trim Label Text From:",rowLabelAbbrevSelect]);
	
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["COLUMN DISPLAY OPTIONS"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	if (colConfig.order_method === "Hierarchical") {
		var dendroShowOptions = "<option value='ALL'>Summary and Detail</option><option value='SUMMARY'>Summary Only</option><option value='NONE'>Hide</option></select>";
		var dendroHeightOptions = "<option value='50'>50%</option><option value='75'>75%</option><option value='100'>100%</option><option value='125'>125%</option><option value='150'>150%</option><option value='200'>200%</option></select>";
		var colDendroSelect = "<select name='colDendroShowPref' id='colDendroShowPref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>"
		colDendroSelect = colDendroSelect+dendroShowOptions;
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Show Dendrogram:",colDendroSelect]);  
		var colDendroHeightSelect = "<select name='colDendroHeightPref' id='colDendroHeightPref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>"
		colDendroHeightSelect = colDendroHeightSelect+dendroHeightOptions;
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Dendrogram Height:",colDendroHeightSelect]); 
	}  
	var colLabelSizeSelect = "<select name='colLabelSizePref' id='colLabelSizePref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'><option value='10'>10 Characters</option><option value='15'>15 Characters</option><option value='20'>20 Characters</option><option value='25'>25 Characters</option><option value='30'>30 Characters</option><option value='35'>35 Characters</option><option value='40'>40 Characters</option>"
	var colLabelAbbrevSelect = "<select name='colLabelAbbrevPref' id='colLabelAbbrevPref' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'><option value='START'>Beginning</option><option value='MIDDLE'>Middle</option><option value='END'>End</option>"
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Maximum Label Length:",colLabelSizeSelect]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Trim Label Text From:",colLabelAbbrevSelect]);

	displayPrefs.appendChild(prefContents);
	displayPrefs.className = 'preferencesSubPanel';
	displayPrefs.style.display='none';
	return displayPrefs;
}

/**********************************************************************************
 * FUNCTION - setupLabelConfigPrefs: This function sets up the DIV panel for displaying/setting
 * heat map label configuration preferences.
 **********************************************************************************/
NgChmGui.FORMAT.setupLabelConfigPrefs = function() {
	var labelTypePrefs = NgChmGui.UTIL.getDivElement("label_config");
	var prefContents = document.createElement("TABLE");
	var colorMap = NgChmGui.mapProperties.matrix_files[0].color_map;
	var rowConfig = NgChmGui.mapProperties.row_configuration;
	var colConfig = NgChmGui.mapProperties.col_configuration;
	var rowLabelTypePref = "<select name='rowLabelType' id='rowLabelType' style='font-size: 12px;' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>";
	var colLabelTypePref = "<select name='colLabelType' id='colLabelType' style='font-size: 12px;' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>";
	var labelTypeOptions = "<option value='none'></option></select>";
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["ROW LABEL CONFIGURATION"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Label Type:  "+rowLabelTypePref+labelTypeOptions], 2);  
	NgChmGui.UTIL.addBlankRow(prefContents);
	var topRowItemData = rowConfig.top_items.toString();
	var topRowItems = "<div class='advancedAction'><textarea name='rowTopItems' id='rowTopItems' style='font-family: sans-serif;font-size: 90%; resize: none;' ' rows='3', cols='50' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>"+topRowItemData+"</textarea></div>";
	NgChmGui.UTIL.setTableRow(prefContents,["<span class='advancedAction'>&nbsp;&nbsp;Top Label Items:</span>"]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;"+topRowItems],2);
	NgChmGui.UTIL.setTableRow(prefContents,["<span class='advancedAction'>&nbsp;&nbsp;<b>Enter comma-separated labels to highlight on map</b></span>"]);
	NgChmGui.UTIL.addBlankRow(prefContents,2);
	NgChmGui.UTIL.setTableRow(prefContents,["COLUMN LABEL CONFIGURATION"], 2);
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;Label Type:  "+colLabelTypePref+labelTypeOptions], 2);  
	NgChmGui.UTIL.addBlankRow(prefContents);
	var topColItemData = colConfig.top_items.toString();
	var topColItems = "<div class='advancedAction'><textarea name='colTopItems' id='colTopItems' style='font-family: sans-serif;font-size: 90%;resize: none;' rows='3', cols='50' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>"+topColItemData+"</textarea></div>"; 
	NgChmGui.UTIL.setTableRow(prefContents,["<span class='advancedAction'>&nbsp;&nbsp;Top Label Items:</span>"]);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;"+topColItems],2);
	NgChmGui.UTIL.setTableRow(prefContents,["<span class='advancedAction'>&nbsp;&nbsp;<b>Enter comma-separated labels to highlight on map</b></span>"]);
	NgChmGui.UTIL.addBlankRow(prefContents,2);
	NgChmGui.UTIL.setTableRow(prefContents,["<span class='advancedAction'>HEAT MAP ATTRIBUTES</span>"], 2);
	var attributesData = "";
	if (NgChmGui.mapProperties.chm_attributes.length > 0) {
		for (var i=0;i<NgChmGui.mapProperties.chm_attributes.length;i++) {
			var attributePair = NgChmGui.mapProperties.chm_attributes[i];
			for (var key in attributePair){ 
				attributesData += key + ":" + attributePair[key];
				if (i<NgChmGui.mapProperties.chm_attributes.length-1) {
					attributesData += ","; 
				}
			}
		}
	}
	var mapAttributes = "<div class='advancedAction'><textarea name='mapAttributes' id='mapAttributes' rows='2', cols='40' style='font-family: sans-serif;font-size: 90%;resize: none' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>"+attributesData+"</textarea></div>";
	NgChmGui.UTIL.setTableRow(prefContents,["<span class='advancedAction'>&nbsp;Enter a colon-separated key/value pair (key:value).</span>"]);
	NgChmGui.UTIL.setTableRow(prefContents,[mapAttributes]);
	NgChmGui.UTIL.setTableRow(prefContents,["<span class='advancedAction'>&nbsp;Multiple attributes entries may be separated with a comma: </span>"]);
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
	gapPrefs.className = 'advancedAction';
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
	if (config.cut_locations.length > 0) {
		gapLocationsData = config.cut_locations.toString();
	}
	var gapLocations = "<textarea name='"+type+"GapLocations' id='"+type+"GapLocations' rows='2', cols='40' style='resize: none' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(true);'>"+gapLocationsData+"</textarea>";
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
		var gapMethodStr = "<select name='"+type+"GapMethod_list' id='"+type+"GapMethod_list' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='"+changeMethod+"'><option value='"+type+"ByLocations' onchange='NgChmGui.FORMAT.setBuildProps(true);'>Gaps By Location</option><option value='"+type+"ByTreeCuts'>Gaps By Cluster</option></select>"
		NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;Gap Method: ",gapMethodStr]);
		NgChmGui.UTIL.addBlankRow(prefContents);
		var treeCutsData = config.tree_cuts.toString();
		var treeCuts = "<input name='"+type+"TreeCuts'  id='"+type+"TreeCuts' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);'  onchange='NgChmGui.FORMAT.setBuildProps(true);' value='"+config.tree_cuts+"' maxlength='3' size='2'>&emsp;";
		var treeCutsDiv = NgChmGui.UTIL.getDivElement(type+"ByTreeCuts");
		var byTreeCutsContents = document.createElement("TABLE");
		NgChmGui.UTIL.setTableRow(byTreeCutsContents,["&nbsp;&nbsp;# of Clusters: ", treeCuts]);
		treeCutsDiv.append(byTreeCutsContents);
		NgChmGui.UTIL.setTableRow(prefContents,[gapLocationsDiv.outerHTML],2);
		NgChmGui.UTIL.setTableRow(prefContents,[treeCutsDiv.outerHTML],2);
		treeCutsDiv.style.display = 'none';
	} else {
		NgChmGui.UTIL.setTableRow(prefContents,[gapLocationsDiv.outerHTML],2);
	}
	var cutWidth = "<input name='"+type+"CutWidth' id='"+type+"CutWidth' value='"+config.cut_width+"' maxlength='2' size='2' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(true);'>&emsp;";
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
		var threshId = "breakPt_"+j;
		var colorId = "color"+j;
		var breakPtInput = "&nbsp;&nbsp;<input name='"+threshId+"_breakPref' id='"+threshId+"_breakPref' value='"+threshold+"' maxlength='8' size='8' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.formatInputNumber(this);NgChmGui.FORMAT.setBuildProps(false);'>";
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"_colorPref' id='"+colorId+"_colorPref' value='"+color+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>"; 
		var addButton = "<img id='breakAdd_"+threshId+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/plusButton.png' alt='Add Breakpoint' onclick='NgChmGui.FORMAT.processLayerBreak("+j+",\"add\");' align='top'/>"
		var delButton = "<img id='breakDel_"+threshId+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/minusButton.png' alt='Remove Breakpoint' onclick='NgChmGui.FORMAT.processLayerBreak("+j+",\"delete\");' align='top'/>"
		if (j < 2) {
			NgChmGui.UTIL.setTableRow(breakpts, [breakPtInput, colorInput+"&nbsp;&nbsp;&nbsp;"+addButton]);
		} else {
			NgChmGui.UTIL.setTableRow(breakpts, [breakPtInput,  colorInput+"&nbsp;&nbsp;&nbsp;"+addButton+"&nbsp;"+delButton]);
		}
	} 
	NgChmGui.UTIL.addBlankRow(breakpts);
	NgChmGui.UTIL.setTableRow(breakpts, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_colorPref' id='missing_colorPref' value='"+missing+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.FORMAT.setBuildProps(false);'>"]);
	NgChmGui.UTIL.addBlankRow(breakpts);
	NgChmGui.UTIL.setTableRow(breakpts, ["&nbsp;<b>Pre-defined Colors:</b>","<img id='selPaletteBtn' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/getPalettes.png' alt='Select custom palette' onclick='NgChmGui.PALETTE.customColorPalette({type: &quot;matrix&quot;,key: &quot;matrix&quot;, idx: 0});' align='top'/>"]);	NgChmGui.UTIL.addBlankRow(breakpts);
	var reloadButton = "<img id='reloadButton' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/button_reload.png' alt='Reload Preview' onclick='NgChmGui.FORMAT.loadColorPreviewDiv(0);' align='top'/>"
	NgChmGui.UTIL.setTableRow(breakpts, ["&nbsp;Color Histogram:", reloadButton]);
	var previewDiv = "<div id='previewWrapper' style='display:flex; height: 100px; width: 110px;position:relative;' ><canvas id='histo_canvas'></canvas></div>";//NgChmGui.FORMAT.loadColorPreviewDiv(mapName,true);
	NgChmGui.UTIL.setTableRow(breakpts, [previewDiv]);

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
 * FUNCTION - loadColorPreviewDiv: This function will update the color distribution
 * preview div to the current color palette in the gear panel
 **********************************************************************************/
NgChmGui.FORMAT.loadColorPreviewDiv = function(ctr){
	if (ctr > 10) {
		return;
	}
	if (!NgChm.API.heatMapLoaded()) {
		ctr++;
		setTimeout(function(){NgChmGui.FORMAT.loadColorPreviewDiv();},3000)
	} else {
		var colorMap = NgChmGui.FORMAT.getTempCM();
		var gradient = "linear-gradient(to right"
		var numBreaks = colorMap.thresholds.length;
		var highBP = parseFloat(colorMap.thresholds[numBreaks-1]);
		var lowBP = parseFloat(colorMap.thresholds[0]);
		var diff = highBP-lowBP;
		for (var i=0;i<numBreaks;i++){
			var bp = colorMap.thresholds[i];
			var col = colorMap.colors[i];
			var pct = Math.round((bp-lowBP)/diff*100);
			gradient += "," + col + " " + pct + "%";
		}
		gradient += ")";
		var wrapper = document.getElementById("previewWrapper");
		NgChm.API.getSummaryHist (colorMap.thresholds).then (hist => {
		    const cm = NgChmGui.FORMAT.getColorMapFromScreen();
		    const ctx = document.getElementById("histo_canvas").getContext("2d");
		    const graph = new BarGraph(ctx);
		    graph.margin = 2;
		    graph.width = 300;
		    graph.height = 150;
		    graph.gradient = false;

		    hist.bins.unshift (hist.nan); // Prepend nans to bins.
		    const colors = new Array(hist.bins.length);
		    colors[0] = cm.getMissingColor();
		    for (let i = 0; i < hist.breaks.length; i++){
			    colors[i+1] = cm.getRgbToHex(cm.getColor(hist.breaks[i]));
		    }

		    const breaksLabel = new Array(hist.bins.length+1).join(' ').split('');
		    breaksLabel[0] = "NA";
		    breaksLabel[1] = "<" + Number(Math.round(hist.breaks[0]+'e2')+'e-2')
		    breaksLabel[Math.floor(breaksLabel.length/2)] = hist.breaks[4].toFixed(2);
		    breaksLabel[breaksLabel.length - 1] = ">" + Number(Math.round(hist.breaks[hist.breaks.length-1]+'e2')+'e-2');

		    graph.colors = colors;
		    graph.xAxisLabelArr = breaksLabel;//["Missing Values", NgChmGui.TRANS.matrixInfo.histoBins];
		    graph.update(hist.bins);//[NgChmGui.TRANS.matrixInfo.numMissing,NgChmGui.TRANS.matrixInfo.histoCounts]);
		});
	}
}

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
		var bp = document.getElementById("breakPt_"+[i]+"_breakPref");
		var color = document.getElementById("color"+[i]+"_colorPref");
		while(bp && color){
			tempCM.colors.push(color.value);
			tempCM.thresholds.push(bp.value);
			i++;
			bp = document.getElementById("breakPt_"+[i]+"_breakPref");
			color = document.getElementById("color"+[i]+"_colorPref");
		}
		var missing = document.getElementById("missing_colorPref");
		tempCM.missing = missing.value;
	}
	return tempCM;
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
		var threshId = "breakPt_"+j;
		var colorId = "color"+j;
		thresholds[j] = document.getElementById(threshId+"_breakPref").value;
		colors[j] = document.getElementById(colorId+"_colorPref").value;
	} 
	colorMap.setMissingColor(document.getElementById("missing_colorPref").value);
	var colorScheme = {"missing": colorMap.getMissingColor(), "thresholds": colorMap.getThresholds(), "colors": colorMap.getColors(), "type": "continuous"};
	var colorMap = new NgChmGui.CM.ColorMap(colorScheme);

	return colorMap;
}
	
/**********************************************************************************
* FUNCTION - getFormatDisplayFromScreen: This function loads the heatmapProperties
* config from the values set on the Format Display panel.
**********************************************************************************/
NgChmGui.FORMAT.getFormatDisplayFromScreen = function() {
	//Get->set matrix config preferences
	var matrixConfig = NgChmGui.mapProperties.matrix_files[0];
	matrixConfig.grid_show = document.getElementById('gridShowPref').value;
	NgChmGui.mapProperties.summary_width = document.getElementById('summaryWidth').value;
	matrixConfig.grid_color = document.getElementById('gridColorPref').value;
	matrixConfig.cuts_color = document.getElementById('gapsColorPref').value;
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
* FUNCTION - getFormatLabelConfigFromScreen: This function loads the heatmapProperties
* config from the values set on the Top Items panel.
**********************************************************************************/
NgChmGui.FORMAT.getFormatLabelConfigFromScreen = function() {
	var attrConfig = [];
  	var attributeItems = document.getElementById("mapAttributes").value.split(/[;, \r\n]+/);
	for (var i=0;i<attributeItems.length;i++) {
		var attrelems = attributeItems[i].split(":");
		var attrObj = {};
		attrObj[attrelems[0]] = attrelems[1];
		attrConfig.push(attrObj);
	}
	NgChmGui.mapProperties.chm_attributes = attrConfig;
	var rowConfig = NgChmGui.mapProperties.row_configuration;
  	var rowlabelType = document.getElementById("rowLabelType").value;
	rowConfig.data_type = [];
	rowConfig.data_type.push(rowlabelType);
  	var rowTopItems = document.getElementById("rowTopItems").value.split(/[;, \r\n]+/);
	rowConfig.top_items = [];
	for (var i=0;i<rowTopItems.length;i++) {
		if (rowTopItems[i]!==""){
			rowConfig.top_items.push(rowTopItems[i]);
		}
	}
	var colConfig = NgChmGui.mapProperties.col_configuration;
  	var collabelType = document.getElementById("colLabelType").value;
  	colConfig.data_type = [];
  	colConfig.data_type.push(collabelType);
 	var colTopItems = document.getElementById("colTopItems").value.split(/[;, \r\n]+/);
	colConfig.top_items = [];
	for (var i=0;i<colTopItems.length;i++) {
		if (colTopItems[i]!==""){
			colConfig.top_items.push(colTopItems[i]);
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
	NgChmGui.FORMAT.setBuildProps(false);
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
		var breakElement = document.getElementById("breakPt_"+j+"_breakPref");
		//In case there are now less elements than the thresholds list on Reset.
		if (breakElement !== null) {
			if (typeof pos !== 'undefined') {
				if (action === "add") {
					newThresholds.push(breakElement.value);
					if (j === pos) {
						//get next breakpoint value.  If none, add 1 to current breakpoint
						var nextBreakElement = document.getElementById("breakPt_"+(j+1)+"_breakPref");
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
		var breakElement = document.getElementById("breakPt_"+k+"_breakPref");
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
						const nextColorElement = document.getElementById("color"+(j+1)+"_colorPref");
						const nextColorVal = nextColorElement !== null ? nextColorElement.value : "#000000";
						//Blend last and next breakpoint colors to get new color.
						const newColor =  blendTwoColors(colorElement.value, nextColorVal);
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

	function blendTwoColors (color1, color2) {
	    // check input
	    color1 = color1 || '#000000';
	    color2 = color2 || '#ffffff';
	    const percentage = 0.5;

	    //convert colors to rgb
	    color1 = color1.substring(1);
	    color2 = color2.substring(1);
	    color1 = [parseInt(color1[0] + color1[1], 16), parseInt(color1[2] + color1[3], 16), parseInt(color1[4] + color1[5], 16)];
	    color2 = [parseInt(color2[0] + color2[1], 16), parseInt(color2[2] + color2[3], 16), parseInt(color2[4] + color2[5], 16)];

	    //blend colors
	    var color3 = [
		(1 - percentage) * color1[0] + percentage * color2[0],
		(1 - percentage) * color1[1] + percentage * color2[1],
		(1 - percentage) * color1[2] + percentage * color2[2]
	    ];

	    //Convert to hex
	    color3 = '#' + UTIL.intToHex(color3[0]) + UTIL.intToHex(color3[1]) + UTIL.intToHex(color3[2]);

	    // return hex
	    return color3;
	}
}

/**********************************************************************************
 * FUNCTION - setBreaksToPreset: This function will be executed when the user
 * selects a predefined color scheme. It will fill the first and last breakpoints with the 
 * predefined colors and interpolate the breakpoints in between.
 * "preset" is an array of the colors in HEX of the predefined color scheme
 **********************************************************************************/
NgChmGui.FORMAT.setBreaksToPreset = function(preset, missingColor) {
	NgChmGui.FORMAT.setBuildProps(false);
	var i = 0; // find number of breakpoints in the 
	while(document.getElementById("color"+ ++i+"_colorPref"));
	var lastShown = i-1;
	// create dummy colorScheme
	var thresh = [];
	var firstBP = document.getElementById("breakPt_0_breakPref").value;
	var lastBP = document.getElementById("breakPt_"+ lastShown +"_breakPref").value;
	var range = lastBP-firstBP;
	for (var j = 0; j < preset.length; j++){
		thresh[j] =Number(firstBP)+j*(range/(preset.length-1));
	}
	var colorScheme = {"missing": missingColor,"thresholds": thresh,"colors": preset,"type": "continuous"};
	var csTemp = new NgChmGui.CM.ColorMap(colorScheme);
	for (var j = 0; j < i; j++) {
		var threshId = "breakPt_"+j;
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
	NgChmGui.UTIL.setTileWrite();
	NgChmGui.tileWrite = false;
	var colorMap = NgChmGui.FORMAT.getColorMapFromScreen();
	NgChmGui.FORMAT.setColorMapToConfig(colorMap);
	NgChmGui.FORMAT.getFormatDisplayFromScreen();
	NgChmGui.FORMAT.getMapGapsFromScreen();
	NgChmGui.FORMAT.getFormatLabelConfigFromScreen();
	NgChmGui.UTIL.setFullPdfProps();
	
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
	var rowText = "<b>Trimmed Row Label Display: </b>&nbsp;&nbsp;" + NgChmGui.UTIL.getLabelText(NgChmGui.mapProperties.builder_config.longRowLabel,"ROW");
	var colText = "<b>Trimmed Col Label Display: </b>&nbsp;&nbsp;" + NgChmGui.UTIL.getLabelText(NgChmGui.mapProperties.builder_config.longColLabel,"COL");
	labelPrefDispDIV.innerHTML = rowText+"&nbsp;&nbsp;&nbsp;&nbsp;"+colText;
}

/**********************************************************************************
 * FUNCTION - gotoHeatMapScreen: This function Validates and go to next screen 
 * if no errors are found.
 **********************************************************************************/
NgChmGui.FORMAT.gotoHeatMapScreen = function() {
	if (NgChmGui.FORMAT.validateEntries(true)){
		NgChmGui.UTIL.logClientActivity("Format Heat Map","Build Heat Map","Build final heat map for display and build Expanded PDF.");
		NgChmGui.UTIL.gotoHeatMapScreen()
	}
}

/**********************************************************************************
 * FUNCTION - setLabelTypeList: This function is DEPENDENT on the embeddedChm being
 * fully loaded with a heatmap.  It queries the linkouts and custom.js for the 
 * embedded map and makes a list of all DISTINCT label types (linkout.typeName).  It 
 * contains special logic for processing TCGA linkouts differently from the rest.
 **********************************************************************************/

NgChmGui.FORMAT.setLabelTypeList = function(ctr) {
    NgChm.API.getLinkoutTypes()
    .then (linkoutTypes => {
	const rowLabelSelect = document.getElementById('rowLabelType');
	const colLabelSelect = document.getElementById('colLabelType');
	//Extract option display and value from linkoutTypes as pipe delimited pairs in array
	const labelTypeList = [];
	for (let i=0; i < linkoutTypes.length; i++) {
		const linkTyp = linkoutTypes[i];
		labelTypeList.push(linkTyp.displayName+"|"+linkTyp.typeName);
	}
	//Sort the label type list by display name
	labelTypeList.sort();
	//Construct option items for both row and label type select DOM elements.
	for (let k=0;k<labelTypeList.length;k++) {
	    const labelItem = labelTypeList[k];
	    const labelDisplay = labelItem.substring(0,labelItem.lastIndexOf("|"));
	    const labelValue = labelItem.substring(labelItem.lastIndexOf("|")+1,labelItem.length);
	    const option = document.createElement('option');
	    option.setAttribute('value', labelValue);
	    option.appendChild(document.createTextNode(labelDisplay));
	    rowLabelSelect.appendChild(option);
	    const option2 = option.cloneNode(true);
	    colLabelSelect.appendChild(option2);
	}
	//Set value of row and column selects to values stored in mapProperties
	document.getElementById("rowLabelType").value = NgChmGui.mapProperties.row_configuration.data_type;
	document.getElementById("colLabelType").value = NgChmGui.mapProperties.col_configuration.data_type;
    });
} 

