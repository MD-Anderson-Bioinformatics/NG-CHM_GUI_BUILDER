//Define Namespace for NgChmGui Covariate File Page
NgChmGui.createNS('NgChmGui.COV');
NgChmGui.isHalfScreen = true;
NgChmGui.tileWrite = false;

/**********************************************************************************
 * FUNCTION - loadData: This function will be executed when the covariates page
 * is opened for the first time.  It loads the header, sets up the left data 
 * entry panel, and calls functions that loads covariate preferences into data
 * entry panels.  
 **********************************************************************************/
NgChmGui.COV.loadData =  function() {
	  NgChm.SUM.flagDrawClassBarLabels = true;
	if (NgChmGui.UTIL.loadHeaderData()) {
		var prefsPanelDiv = document.getElementById("preferencesPanel");
		prefsPanelDiv.style.left = '0px';
		prefsPanelDiv.style.right = "";
		var classes = NgChmGui.mapProperties.classification_files;
		NgChmGui.COV.clearPreferencesPanel();
		var classPrefsDiv = NgChmGui.COV.setupClassPrefs(classes);
		NgChmGui.COV.setClassPrefOptions(classes);
		NgChmGui.UTIL.loadHeatMapView();
		classPrefsDiv.style.display = '';
		prefsPanelDiv.style.display = '';
		NgChmGui.COV.validateEntries(false);
	}
	if (NgChmGui.UTIL.setUpAdvanced() === true) {
		NgChmGui.COV.setAdvanced();
	};
	NgChmGui.PALETTE.getUserPalettes();
}

/**********************************************************************************
 * FUNCTION - clearPreferencesPanel: this function clears all DOM elements
 * from the covariate preferences panel.  It is used when the panel is reloaded
 * after an apply.  
 **********************************************************************************/
NgChmGui.COV.clearPreferencesPanel =  function() {
	var myNode = document.getElementById("preferencesPanel");
	while (myNode.firstChild) {
	    myNode.removeChild(myNode.firstChild);
	}
}

/**********************************************************************************
 * FUNCTION - setAdvanced: This function applies special advanced/standard function
 * display rules that apply to the Covariates screen.
 **********************************************************************************/
NgChmGui.COV.setAdvanced = function() {
	if (NgChmGui.UTIL.showAdvanced === 'N') {
		var classes = NgChmGui.mapProperties.classification_files;
		if (classes.length > 0) {
			for (var i=0;i<classes.length;i++) {
				var classItem = classes[i];
				if (classItem.color_map.type === 'continuous') {
					var key =  NgChmGui.COV.getClassKey(classItem);
					var barTypeSelect = document.getElementById("barType_"+key);
					barTypeSelect.value = 'color_plot';
					NgChmGui.COV.togglePlotTypeProperties(key);
				}
			}
		}
	}
}

NgChmGui.COV.getColorMapByIdx = function(idx) {
	var classes = NgChmGui.mapProperties.classification_files;
	var classItem = classes[idx];
	return classItem.color_map;
}


/**********************************************************************************
 * FUNCTION - validateEntries: the validate function is called on page load, page exit, and when
 * user operations are performed.  It creates conditional messages in the message
 * area including errors and warnings.  It also returns false if errors are detected.  
 **********************************************************************************/
NgChmGui.COV.validateEntries = function(leavingPage, passedError) {
	var valid = true;
	var pageText = "";
	var classes = NgChmGui.mapProperties.classification_files;

	//Generate build error messages
	var buildErrors = NgChmGui.mapProperties.builder_config.buildErrors;
	if (buildErrors !== "") {
		pageText = pageText + "<b><font color='red'>" + buildErrors + "</font></b> Build error must be resolved to continue." + NgChmGui.UTIL.nextLine;
		valid = false;
	}
	
	if (typeof passedError != 'undefined') {
		pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + passedError+"</p>";
		valid = false;
	}
	
	//generate screen data entry errors
	for (var i=0; i< classes.length; i++) {
		var classItem = classes[i];
		if ((classItem.height.indexOf(".") > 0) || (classItem.height < 1) || isNaN(classItem.height)) {
			pageText = pageText + "<p class='error_message'>"+ NgChmGui.UTIL.errorPrefix + "Covariate <font color='red'>" + classItem.name.toUpperCase() + "</font> Height entry must be an integer between 1 and 99.</p>";
			valid = false;
		}
		if (classItem.bar_type !== 'color_plot') {
			if (isNaN(classItem.low_bound)) {
				pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Covariate <font color='red'>" + classItem.name.toUpperCase() + "</font> Lower Bound entry must be numeric.</p>";
				valid = false;
			}
			if (isNaN(classItem.high_bound)) {
				pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Covariate <font color='red'>" + classItem.name.toUpperCase() + "</font> Upper Bound entry must be numeric.</p>";
				valid = false;
			}
		}
	}
	
	//page exit processing
	if (leavingPage) {
		//Do nothing for this page
	} 
	
	//generate build warning messages
	var buildWarnings = NgChmGui.mapProperties.builder_config.buildWarnings;     
	if (buildWarnings.length > 0) {  
		for (var i=0; i< buildWarnings.length; i++) {
			pageText = pageText + NgChmGui.UTIL.warningPrefix + buildWarnings[i] + NgChmGui.UTIL.nextLine;
		}
	}
	
	//Add in page instruction text
	// Different message if we have 1 or more covariate already.
	if (classes.length > 0) {
	   pageText = pageText + "This page can be used to modify the appearance of covariate bars.  Select the covariate bar you wish to customize from the dropdown and you may then change color settings, size, and indicate whether it should be displayed by default. For continuous covariate bars, you can also choose an alternate presentation option of bar or scatter plot. " ;
	} else {
	   pageText = pageText + "Covariate bars are extra descriptive information that can be added above columns or to the left of rows on a heatmap. Covariates fall into two types: 1. discrete categorical information like smoker/non-smoker and 2. continuous numerical information like age.  Covariate files are tab delimited files with two values on each row 1. a label that matches the matrix row or column labels and 2. a value.  Use the add button to insert covariate bars or just hit next if you don't want them." ;
	}
	NgChmGui.UTIL.setScreenNotes(pageText);
	NgChmGui.UTIL.loadAdvanced();
	
	return valid;
}

/**********************************************************************************
 * FUNCTION - checkCovariateNames/checkCovariateName: This function loops thru the 
 * covariate names entered on the Covariate panels and checks that there are no 
 * duplicates on a given axis.
 **********************************************************************************/
NgChmGui.COV.checkCovariateNames = function() {
	var valid = true;
	var classes = NgChmGui.mapProperties.classification_files;
	for (var i=0; i< classes.length; i++) {
		var classItem = classes[i];
		var classKey =  NgChmGui.COV.getClassKey(classItem);
		var className =  document.getElementById('covName_'+classKey).value;
		var dupFound = NgChmGui.COV.checkCovariateName(className,classItem.position);
		if (dupFound === true) {
			valid = false;
			break;
		}
	}
	return valid;
}

NgChmGui.COV.checkCovariateName = function(nameVal, axis) {
	var dupFound = false;
	var classBars = NgChmGui.mapProperties.classification_files;
	var errMsg = '';
	var nameFoundCnt = 0;
	for (var key in classBars) {
		var classItem = classBars[key];
		var classKey =  NgChmGui.COV.getClassKey(classItem);
		var className =  document.getElementById('covName_'+classKey).value;
		if ((classItem.position === axis) && (className === nameVal)) {
			nameFoundCnt++;
		}
	}
	if (nameFoundCnt > 1) {
		NgChmGui.COV.validateEntries(false, "Multiple "+axis+" covariate bars exist with the name: "+nameVal+". Please ensure that all Bar Names are unique on the "+axis+" axis.<br>");
		dupFound = true;
	}
	return dupFound;
}

/**********************************************************************************
 * FUNCTION - setupClassPrefs: This function begins the process of loading all
 * of the covariates into the left data entry pane. It creates the dropdown listing
 * of all covariates and calls the function that loads the individual covariate
 * panels.  
 **********************************************************************************/
NgChmGui.COV.setupClassPrefs = function(classes) {
	var prefsPanelDiv = document.getElementById("preferencesPanel");
	var classBars = classes;
	var classPrefsDiv = NgChmGui.UTIL.getDivElement("classPrefsDiv");
	var prefContents = document.createElement("TABLE");
	var classSelectStr = "<select name='classPref_list' id='classPref_list' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' style='font-size: 12px;' onchange='NgChmGui.COV.showClassSelection();'></select>"
	var addButton = "<img id='addCovar_btn' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/addButton.png' alt='Add Covariate' style='vertical-align: bottom;padding: 2px;' onclick='NgChmGui.COV.openCovarUpload()' />";
	var removeButton = "<img id='removeCovar_btn' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/removeButton.png' alt='Remove Covariate' style='vertical-align: bottom;display: none;padding: 2px;' onclick='NgChmGui.COV.openCovarRemoval()' />";
	var reorderButton = "<img id='reorderCovar_btn' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/reorderButton2.png' alt='Reorder Covariates' style='vertical-align: bottom;display: none;padding: 2px;' onclick='NgChmGui.COV.openCovarReorder()' />";
	NgChmGui.UTIL.setTableRow(prefContents,["Covariates: ", classSelectStr]);
	NgChmGui.UTIL.addBlankRow(prefContents)
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;",addButton +"&nbsp;"+ removeButton +"&nbsp;"+ reorderButton]);
	NgChmGui.UTIL.addBlankRow(prefContents, 2);
	classPrefsDiv.appendChild(prefContents);
	prefsPanelDiv.appendChild(classPrefsDiv);
	if (classes.length > 0) {
		for (var i=0;i<classes.length;i++) {
			var classItem = classes[i];
			var classContentsDiv = NgChmGui.COV.setupCovariatePanel(classItem, i);
			classPrefsDiv.appendChild(classContentsDiv);
			classContentsDiv.style.display='none';
		}
		if (NgChmGui.COV.showReorder()) {
			document.getElementById("reorderCovar_btn").style.display = '';
		}
		document.getElementById("removeCovar_btn").style.display = '';
		document.getElementById("classPref_list").style.display = '';
	} else {
		var noClassesDiv = NgChmGui.COV.getEmptyClassesPanel();
		classPrefsDiv.appendChild(noClassesDiv);
		document.getElementById("removeCovar_btn").style.display = 'none';
		document.getElementById("classPref_list").style.display = 'none';
	}
	return classPrefsDiv; 
}


/**********************************************************************************
 * FUNCTION - getEmptyClassesPanel: This function creates and returns an "EMPTY"
 * classes panel.  This panel is only displayed when there are no covariates to 
 * display for a given heat map.
 **********************************************************************************/
NgChmGui.COV.getEmptyClassesPanel = function () {
	var classSelect = document.getElementById("classPref_list");
	classSelect.options[classSelect.options.length] = new Option('', 'classPref_NONE');
	var noClassesDiv = NgChmGui.UTIL.getDivElement('classPref_NONE');
	noClassesDiv.className = 'preferencesSubPanel';
	var noClassesTbl = document.createElement('TABLE'); 
	NgChmGui.UTIL.addBlankRow(noClassesTbl);
	NgChmGui.UTIL.setTableRow(noClassesTbl,["&nbsp;&nbsp;<b>No Covariates Assigned</b>"]);
	NgChmGui.UTIL.addBlankRow(noClassesTbl);
	noClassesDiv.appendChild(noClassesTbl);
	noClassesDiv.style.display='none';
	return noClassesDiv;
}

/**********************************************************************************
 * FUNCTION - getClassFromPanel: This utility function returns a given class property
 * from mapProperties given a panel name (which is the class "key" value).
 **********************************************************************************/
NgChmGui.COV.getClassFromPanel = function (panel) {
	var classes = NgChmGui.mapProperties.classification_files;
	for (var i=0;i<classes.length;i++) {
		var classItem = classes[i];
		var key = NgChmGui.COV.getClassKey(classItem);
		if (key === panel) {
			return classItem;
		}
	} 
}

/**********************************************************************************
 * FUNCTION - getClassKey: This utility function returns the "key" value, used to
 * define data entry field names, for a given covariate bar.
 **********************************************************************************/
NgChmGui.COV.getClassKey = function (classItem) {
	return classItem.position+"_"+classItem.name;
}

/**********************************************************************************
 * FUNCTION - setupCovariatePanel: This function loads all the data elements for
 * an individual covariate into a panel.  
 **********************************************************************************/
NgChmGui.COV.setupCovariatePanel = function(classItem,classIdx) {
	var key =  NgChmGui.COV.getClassKey(classItem);
	var shortName = classItem.name;
	if (classItem.name.length > 30) {
		shortName = classItem.name.substring(0,30)+"...";
	}
	shortName = shortName+" ("+classItem.position+")";
	var classSelect = document.getElementById('classPref_list');
	classSelect.options[classSelect.options.length] = new Option(shortName, key);
	var name = classItem.name;
	var colors = classItem.color_map.colors;
	var thresholds = classItem.color_map.thresholds;
	var classDiv = NgChmGui.UTIL.getDivElement(key);
	classDiv.className = 'preferencesSubPanel';
	var classContents = document.createElement("TABLE"); 
	NgChmGui.UTIL.addBlankRow(classContents);
	var colorTypeOptionsSelect = "<select name='colorType_"+key+"' id='colorType_"+key+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.COV.toggleColorTypeProperties(&quot;"+key+"&quot;);'>"; 
	var colorTypeOptions = "<option value='continuous'>Continuous</option><option value='discrete'>Discrete</option></select>";
	colorTypeOptionsSelect = colorTypeOptionsSelect+colorTypeOptions;
	var barTypeOptionsSelect = "<select name='barType_"+key+"' id='barType_"+key+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.COV.togglePlotTypeProperties(&quot;"+key+"&quot;)'>"; 
	var barTypeOptions = "<option value='color_plot'>Color Plot</option><option value='bar_plot'>Bar Plot</option><option value='scatter_plot'>Scatter Plot</option></select>";
	barTypeOptionsSelect = barTypeOptionsSelect+barTypeOptions;
	var barName = "<input name='covName_"+key+"' id='covName_"+key+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/cancelButton.png' value='"+classItem.name+"' maxlength='30' size='20' onchange='NgChmGui.UTIL.setBuildProps(false);'>&emsp;";
	NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Bar Name:", "<b>"+barName+"</b>"]);
	NgChmGui.UTIL.setTableRow(classContents,["&nbsp;&nbsp;Bar Position: ","<b>"+NgChmGui.UTIL.toTitleCase(classItem.position)+"</b>"]);
	if (classItem.color_map.type === 'continuous') {
		NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Bar Type:", "<div class='advancedAction'>"+barTypeOptionsSelect+"</div><div class='standardAction'><b>Color Plot</b>"]);
	} else {
		NgChmGui.UTIL.setTableRow(classContents,["&nbsp;&nbsp;Bar Type: ","<b>"+NgChmGui.UTIL.toTitleCase(classItem.bar_type)+"</b>"]);
	}
	if (NgChmGui.COV.colorTypeChangeable(classItem) === true) {
		NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Color Type:", colorTypeOptionsSelect]);
	} else {
		NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Color Type:", "<b>"+NgChmGui.UTIL.toTitleCase(classItem.color_map.type)+"</b>"]);
	}
	NgChmGui.UTIL.addBlankRow(classContents);
	var barHeight = "<input name='heightPref_"+key+"' id='heightPref_"+key+"' value='"+classItem.height+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.setBuildProps(false);'  maxlength='2' size='2'>&emsp;";
	NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Height:", barHeight]);
	var showSelect = "<select name='showPref_"+key+"' id='showPref_"+key+"' value='"+classItem.show+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.setBuildProps(false);' ;>" // 
	var showOptions = "<option value='N'>No</option><option value='Y'>Yes</option></select>";
	showSelect = showSelect + showOptions;
	NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Show:", showSelect]);
	NgChmGui.UTIL.addBlankRow(classContents, 1);

	//Build color breaks sub panel for color_plot covariates
	var helpprefsCp = NgChmGui.UTIL.getDivElement("breakPrefsCp_"+key);
	var prefContentsCp = document.createElement("TABLE"); 
	NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;<u>Category</u>","<b><u>"+"Color"+"</b></u>"]); 
	for (var j = 0; j < thresholds.length; j++) {
		var threshold = thresholds[j]
		if (threshold.length > 27) {
			threshold = threshold.substring(0,27)+"...";
		} 
		threshold =  threshold + "&nbsp;&nbsp;&nbsp;";
		var color = colors[j];
		var threshId = j+"_breakPt_"+key;
		var colorId = j+"_color_"+key;
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"_colorPref' id='"+colorId+"_colorPref' value='"+color+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.setBuildProps(false);' >"; 
		NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;&nbsp;"+threshold, colorInput]);
	} 
	NgChmGui.UTIL.addBlankRow(prefContentsCp);
	NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_colorPrefCp_"+key+"' id='missing_colorPrefCp_"+key+"' value='"+classItem.color_map.missing+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.setBuildProps(false);' >"]);
	NgChmGui.UTIL.addBlankRow(prefContentsCp);
	NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;<b>Pre-defined Colors:</b>","<img id='selPaletteBtn' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/getPalettes.png' alt='Select custom palette' onclick='NgChmGui.PALETTE.customColorPalette({type: &quot;"+classItem.color_map.type+"&quot;,key: &quot;"+key+"&quot;, idx: "+classIdx+"});' align='top'/>"]);
	NgChmGui.UTIL.addBlankRow(prefContentsCp);
	helpprefsCp.appendChild(prefContentsCp);
	
	//Build high/low bounds/colors sub panel for bar and scatter plot covariates
	var helpprefsBp = NgChmGui.UTIL.getDivElement("breakPrefsBp_"+key);
	var prefContentsBp = document.createElement("TABLE"); 
	var lowBoundInput = "<input name='lowBound_"+key+"' id='lowBound_"+key+"' value='"+classItem.low_bound+"' maxlength='10' size='5' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.setBuildProps(false);' >&emsp;";
	var highBoundInput = "<input name='highBound_"+key+"' id='highBound_"+key+"' value='"+classItem.high_bound+"' maxlength='10' size='5' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.setBuildProps(false);' >&emsp;";
	NgChmGui.UTIL.addBlankRow(prefContentsBp);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Lower Bound:", lowBoundInput]);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Upper Bound:", highBoundInput]);
	NgChmGui.UTIL.addBlankRow(prefContentsBp);
	var bgColorInput = "<input class='spectrumColor' type='color' name='bgColorPref_"+key+"' id='bgColorPref_"+key+"' value='"+classItem.bg_color+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.setBuildProps(false);' >"; 
	var fgColorInput = "<input class='spectrumColor' type='color' name='fgColorPref_"+key+"' id='fgColorPref_"+key+"' value='"+classItem.fg_color+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.setBuildProps(false);' >"; 
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Foreground Color:", fgColorInput]);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Background Color:", bgColorInput]);
	NgChmGui.UTIL.addBlankRow(prefContentsBp);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_colorPrefBp_"+key+"' id='missing_colorPrefBp_"+key+"' value='"+classItem.color_map.missing+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.UTIL.setBuildProps(false);' >"]);
	helpprefsBp.appendChild(prefContentsBp);
	if (classItem.bar_type === 'color_plot') {
		helpprefsBp.style.display="none";
		helpprefsCp.style.display="block";
	} else {
		helpprefsCp.style.display="none";
		helpprefsBp.style.display="block";
	}

	classDiv.appendChild(classContents);
	classDiv.appendChild(helpprefsCp);
	classDiv.appendChild(helpprefsBp);
	
	return classDiv;
}	

/**********************************************************************************
 * FUNCTION - colorTypeChangeable: Validate the type and threshold values of a 
 * given covariate bar to validate that the Color Type is editable.  If a true is
 * returned, a dropdown will be placed on the edit covariate panel to allow a change
 * in Color Type IF NOT a text item will be displayed.
 **********************************************************************************/
NgChmGui.COV.colorTypeChangeable = function (classItem) {
	var isChangeable = true;
	var colorMap = classItem.color_map;
	for (var j=0;j < colorMap.thresholds.length;j++) {
		var currThresh = colorMap.thresholds[j];
		if (!NgChmGui.UTIL.isNumeric(currThresh) && (currThresh !== 'NA') && (currThresh !== 'N/A')) {
			isChangeable = false;
			break;
		}
	}
	if (classItem.path === "treecut") {
		isChangeable = false;
	}
	return 	isChangeable;
}

/**********************************************************************************
 * FUNCTION - setNameOnMatrixConfig: This function is called when the user has changed
 * the name of an existing covariate bar.  In this case the name must be updated
 * on the matrix_grid_configuration as well as the covariate configuration.  This is
 * so that the appropriate name can be set on the Matrix screen when the user
 * returns to that screen.
 **********************************************************************************/
NgChmGui.COV.setNameOnMatrixConfig = function (classItem, newName) {
	var gridConfig = NgChmGui.mapProperties.builder_config.matrix_grid_config;
	var oldName = classItem.name;
	var classType = classItem.position;
	if (classType === "row") {
		for (var i=0;i<gridConfig.rowCovNames.length;i++) {
			var currCov = gridConfig.rowCovNames[i];
			if (currCov === oldName) {
				gridConfig.rowCovNames.splice(i,1,newName);
			}
		}
	} else {
		for (var i=0;i<gridConfig.colCovNames.length;i++) {
			var currCov = gridConfig.colCovNames[i];
			if (currCov === oldName) {
				gridConfig.colCovNames.splice(i,1,newName);
			}
		}
	}
	classItem.name = newName;
}

/**********************************************************************************
 * FUNCTION - setClassPrefOptions: This function loads dropdowns for each covariate
 * bar panel after those panels have been created
 **********************************************************************************/
NgChmGui.COV.setClassPrefOptions = function(classes) {
	var classSelect = document.getElementById('classPref_list');
	for (var i=0;i<classes.length;i++) {
		var classItem = classes[i];
		var key =  NgChmGui.COV.getClassKey(classItem);
		document.getElementById('showPref_'+key).value = classItem.show;
		if (classItem.color_map.type === 'continuous') {
			document.getElementById('barType_'+key).value = classItem.bar_type;
		}
		if (NgChmGui.COV.colorTypeChangeable(classItem) === true) {
			document.getElementById('colorType_'+key).value = classItem.color_map.type;
		}
	}
	NgChmGui.COV.showClassSelection(0);
}

/**********************************************************************************
 * FUNCTION - openCovarUpload: This function opens the add covariate upload panel.  
 **********************************************************************************/
NgChmGui.COV.openCovarUpload = function() {
	 document.getElementById("covarSelection").style.display = 'none';
	 if (NgChmGui.mapProperties.builder_config.matrix_grid_config.isSample === 'Y') {
		 document.getElementById("covarAddSample").style.display = '';
	 } else {
		 document.getElementById("covarAdd").style.display = '';
	 }
}

/**********************************************************************************
 * FUNCTION - readyUpload: This function executes when the user has selected a 
 * covariate file from the file select popup window.  It places the name of the file
 * on the screen and, if the name data entry field is NOT populated, places a 
 * truncated version of the selected filename in the name data entry field.  Finally,
 * it enables the upload button by making it visible.
 **********************************************************************************/
NgChmGui.COV.readyUpload = function() {
	var textSpan = document.getElementById('covarNameText');
	while(textSpan.firstChild) {
		textSpan.removeChild( textSpan.firstChild );
	}
	var filePath = document.getElementById('covar').value;
	var fileNameTxt = filePath.substring(12,filePath.length);
	textSpan.appendChild(document.createTextNode(fileNameTxt));
	//If Name field not populated by user, use filename (less suffix)
	var covName = document.getElementById('covName');
	if ((covName.value.trim() === '') || (covName.value === null)) {
		var idxDot = fileNameTxt.indexOf('.');
		covName.value = fileNameTxt.substring(0,idxDot);
	}
	document.getElementById('covUploadApply_btn').style.display = '';
}

/**********************************************************************************
 * FUNCTION - addCovariateBar: This function runs when the upload button is pressed.
 * It calls the UploadCovariate servlet, waits for the result, and then calls a 
 * function to add a new covariate bar panel.  
 **********************************************************************************/
NgChmGui.COV.addCovariateBar = function(nextFunction) {
	var req = new XMLHttpRequest();
	//Validate Covar name and axis
	var covNameValue = document.getElementById('covName').value;
	var axisValue = document.getElementById('axisType').value;
	var typeValue = document.getElementById('colorType').value;
	var key = axisValue+"_"+covNameValue;
	document.getElementById(key);
	if (document.getElementById(key) !== null) {
		NgChmGui.COV.validateEntries(false, "A "+axisValue+" covariate already exists with the name:  "+covNameValue+". Please select a different name if you still wish to add this bar.<br>");
		return;
	}
	if (axisValue === 'none') {
		NgChmGui.COV.validateEntries(false, "Missing Axis Type entry for new covariate: "+covNameValue+". Please select an axis type (row/column).<br>");
		return;
	}
	if (typeValue === 'none') {
		NgChmGui.COV.validateEntries(false, "Missing Color Type entry for new covariate: "+covNameValue+". Please select a color type (discrete/continuous).<br>");
		return;
	}
	document.getElementById('covUploadApply_btn').style.display = 'none';
	//Proceed
	var formData = new FormData( document.getElementById("covar_add") );
	req.open("POST", "UploadCovariate", true);
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	    		NgChmGui.UTIL.hideLoading();
	            console.log('Failed to upload covariate '  + req.status);
	        } else {
	        	NgChmGui.mapProperties = JSON.parse(req.response);
	        	if (NgChmGui.UTIL.validSession()) {
	        		nextFunction();
	    	        NgChmGui.COV.validateEntries(false);
	        	}
	        }
		}
	};
	NgChmGui.UTIL.showLoading();
	req.send(formData);
}

/**********************************************************************************
 * FUNCTION - addSampleCovariateBar: This function runs when the upload button is pressed
 * for a map that was built using the sample matrix. It calls the UploadSampleCovariate servlet, 
 * waits for the result, and then calls a  function to add a new covariate bar panel.  
 **********************************************************************************/
NgChmGui.COV.addSampleCovariateBar = function(nextFunction) {
	var selFile = document.getElementById('selFile');
	var selItem;
	if (document.getElementById('AgeCovar').checked) {
		selFile.value = "SampleAgeCovariate.txt";
		selItem = "column_Age";
	} else if (document.getElementById('GleasonCovar').checked) {
		selFile.value = "SampleGleasonCovariate.txt";
		selItem = "column_Gleason_Score";
	} else if (document.getElementById('PsaCovar').checked) {
		selFile.value = "SamplePsaCovariate.txt";
		selItem = "column_PSA";
	} else {
		selFile.value = "SampleRaceCovariate.txt";
		selItem = "column_Race";
	}
	//Check to see if sample covariate has already been loaded
	var continueAdd = true;
	var options= document.getElementById('classPref_list').options;
	for (var i = 0;i < options.length; i++) {
	    if (options[i].value=== selItem) {
	        continueAdd = false;
	        break;
	    }
	}
	//If already loaded, skip upload process entirely BUT toggle to the selected covariate panel.
	if (continueAdd) {
		var formData = new FormData(document.getElementById("covar_add_sample") );
		var req = new XMLHttpRequest();
		req.open("POST", "UploadSampleCovariate", true);
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		    		NgChmGui.UTIL.hideLoading();
		            console.log('Failed to upload covariate '  + req.status);
		        } else {
		        	NgChmGui.mapProperties = JSON.parse(req.response);
		        	if (NgChmGui.UTIL.validSession()) {
		        		nextFunction();
		    	        NgChmGui.COV.validateEntries(false);
		        	}
		        }
			}
		};
		NgChmGui.UTIL.showLoading();
		req.send(formData);
	} else {
		NgChmGui.COV.hideCovarUpload();
		NgChmGui.COV.selectClassDropdown(selItem);
	}
	
}

/**********************************************************************************
 * FUNCTION - loadNewCovariateBar: This function closes the add covariate upload panel,
 * reloads the screen, and displays the newly added covariate's data entry panel.  
 **********************************************************************************/
NgChmGui.COV.loadNewCovariateBar = function() {
	NgChmGui.COV.hideCovarUpload();
	var oldClassPanel = document.getElementById("classPrefsDiv");
	if (oldClassPanel !== null) {
		oldClassPanel.remove();
	}
	var classes = NgChmGui.mapProperties.classification_files;
	var classIdx = classes.length-1;
	var lastClass = classes[classIdx];
	var key =  NgChmGui.COV.getClassKey(lastClass);
	NgChmGui.COV.loadData();
	NgChmGui.COV.selectClassDropdown(key);
	NgChmGui.COV.showClassSelection();	
	NgChmGui.UTIL.loadAdvanced();
}

/**********************************************************************************
 * FUNCTION - selectClassDropdown: This function sets the state of the covariate
 * dropdown to whatever key (i.e. covar panel) that is passed in.  
 **********************************************************************************/
NgChmGui.COV.selectClassDropdown = function (key) {
	var options= document.getElementById('classPref_list').options;
	for (var i = 0;i < options.length; i++) {
	    if (options[i].value=== key) {
	        options[i].selected= true;
	        break;
	    }
	}
}

/**********************************************************************************
 * FUNCTION - hideCovarUpload: This function closes the add covariate upload panel
 * and displays the covariates data entry panel.  
 **********************************************************************************/
NgChmGui.COV.hideCovarUpload = function() {
	var textSpan = document.getElementById('covarNameText');
	while( textSpan.firstChild) {
		textSpan.removeChild( textSpan.firstChild );
	}
	document.getElementById('covName').value = '';
	textSpan.appendChild(document.createTextNode(""));
	document.getElementById("axisType").value = 'none';
	document.getElementById("colorType").value = 'none';
	document.getElementById("covarSelection").style.display = '';
	document.getElementById("covarAdd").style.display = 'none';
	document.getElementById("covarAddSample").style.display = 'none';
	document.getElementById("covar").value = "";
	NgChmGui.COV.validateEntries(false);
}

/**********************************************************************************
 * FUNCTION - openCovarRemoval: This function opens the covariate bar removal panel
 * and hides the covariates data entry panel.  It also places the name of the 
 * covariate bar selected for deletion on the removal panel.
 **********************************************************************************/
NgChmGui.COV.openCovarRemoval = function() {
	 var selectedBar = document.getElementById("classPref_list");
	 var selectedBarVal = selectedBar.value; 
	 var selectedClass = NgChmGui.COV.getClassFromPanel(selectedBarVal);
	 var selectedText = selectedBar.options[selectedBar.selectedIndex].text;
	 var remLabel = document.getElementById("covarRemoveLabel").innerHTML = "Remove Covariate Bar:&nbsp;&nbsp;"+selectedClass.name+" - "+selectedClass.position;
	 document.getElementById("remCovName").value = selectedClass.name;
	 document.getElementById("remAxisType").value = selectedClass.position;
	 document.getElementById("covarSelection").style.display = 'none';
	 document.getElementById("covarRemoval").style.display = '';
	
}

/**********************************************************************************
 * FUNCTION - hideCovarRemoval: This function closes the covariate removal panel
 * and displays the covariates data entry panel.  
 **********************************************************************************/
NgChmGui.COV.hideCovarRemoval = function() {
	document.getElementById("covarRemoveLabel").innerHTML = "";
	document.getElementById("covarSelection").style.display = '';
	document.getElementById("covarRemoval").style.display = 'none';
}

/**********************************************************************************
 * FUNCTION - removeCovariateBar: This function calls a servlet to remove a covariate
 * bar from the heatmapProperties configuration for a heat map on the server and then
 * calls the function that cleans up the Covariate screen.
 **********************************************************************************/
NgChmGui.COV.removeCovariateBar = function(nextFunction) {
	if (NgChmGui.UTIL.validSession()) {
		var req = new XMLHttpRequest();
		var formData = new FormData( document.getElementById("covar_remove") );
		req.open("POST", "RemoveCovariate", true);
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		    		NgChmGui.UTIL.hideLoading();
		            console.log('Failed to remove covariate '  + req.status);
		        } else {
		        	NgChmGui.mapProperties = JSON.parse(req.response);
		        	if (NgChmGui.UTIL.validSession()) {
			        	nextFunction();
		        	}
		        }
			}
		};
		NgChmGui.UTIL.showLoading();
		req.send(formData);
	}
}

/**********************************************************************************
 * FUNCTION - removeCovariateBar: This function removes a covariate panel from
 * the covariate data entry panel, reloads the screen, and selects the first
 * covariate bar for display. 
 **********************************************************************************/
NgChmGui.COV.removeCovariateBarFromScreen = function() {
	NgChmGui.COV.hideCovarRemoval();
	var oldClassPanel = document.getElementById("classPrefsDiv");
	if (oldClassPanel !== null) {
		oldClassPanel.remove();
	}
	NgChmGui.COV.loadData();
	NgChmGui.COV.showClassSelection(0);	
}

/**********************************************************************************
 * FUNCTION - openCovarReorder: This function loads and opens up the covariate
 * reorder panel.
 **********************************************************************************/
NgChmGui.COV.openCovarReorder = function() {
	var classes = NgChmGui.mapProperties.classification_files;
	var reorderColsDiv = document.getElementById("reorderColumnsDiv");
	var colCovars = document.getElementById("colCovarMove_list");
	NgChmGui.UTIL.removeOptions(colCovars);
	var colCovarsCtr = -1;
	var colCovarOptions = "";
	var reorderRowsDiv = document.getElementById("reorderRowsDiv");
	var rowCovars = document.getElementById("rowCovarMove_list");
	NgChmGui.UTIL.removeOptions(rowCovars);
	var rowCovarsCtr = -1;
	var rowCovarOptions = "";
	for (var i=0;i<classes.length;i++) {
		var classItem = classes[i];
		var option = document.createElement("option");
		option.text = classItem.name;
		if (classItem.position === 'row') {
			rowCovarsCtr++;
			option.value = rowCovarsCtr;
			if (rowCovarsCtr === 0) {
				option.selected = true;
			}
			rowCovars.add(option); 
		} else {
			colCovarsCtr++;
			option.value = colCovarsCtr;
			if (colCovarsCtr === 0) {
				option.selected = true;
			}
			colCovars.add(option); 
		}
	}
	if (rowCovarsCtr > 0) {
		if (rowCovarsCtr > 11) {
			rowCovars.size = 10;
		} else {
			rowCovars.size = rowCovarsCtr + 1;
		}
		reorderRowsDiv.style.display = ''
	} else {
		colCovars.size = colCovarsCtr + 1;
		reorderRowsDiv.style.display = 'none'
	}
	if (colCovarsCtr > 0) {
		if (colCovarsCtr > 11) {
			colCovars.size = 10;
		} else {
			colCovars.size = colCovarsCtr + 1;
		}
		colCovars.focus();
		reorderColsDiv.style.display = ''
	} else {
		reorderColsDiv.style.display = 'none'
	}
	document.getElementById("covarSelection").style.display = 'none';
	document.getElementById("covarReOrder").style.display = '';
}

/**********************************************************************************
 * FUNCTION - covarOrderUp: This function moves a selected covariate upward
 * in the list box, for a given axis, when the user presses the up button.
 **********************************************************************************/
NgChmGui.COV.covarOrderUp = function(type) {
	var selectList = document.getElementById("colCovarMove_list");
	if (type === 'row') {
		selectList = document.getElementById("rowCovarMove_list");
	}
	var selectOptions = selectList.getElementsByTagName('option');
	for (var i = 1; i < selectOptions.length; i++) {
		var opt = selectOptions[i];
		if (opt.selected) {
			selectList.removeChild(opt);
			selectList.insertBefore(opt, selectOptions[i - 1]);
		}
   }
}

/**********************************************************************************
 * FUNCTION - covarOrderDown: This function moves a selected covariate downward
 * in the list box, for a given axis, when the user presses the down button.
 **********************************************************************************/
NgChmGui.COV.covarOrderDown = function(type) {
	var selectList = document.getElementById("colCovarMove_list");
	if (type === 'row') {
		selectList = document.getElementById("rowCovarMove_list");
	}
	var selectOptions = selectList.getElementsByTagName('option');
	for (var i = selectOptions.length - 2; i >= 0; i--) {
		var opt = selectOptions[i];
		if (opt.selected) {
		   var nextOpt = selectOptions[i + 1];
		   opt = selectList.removeChild(opt);
		   nextOpt = selectList.replaceChild(opt, nextOpt);
		   selectList.insertBefore(nextOpt, opt);
		}
    }
}

/**********************************************************************************
 * FUNCTION - showReorder: This function determines whether the reorder button should
 * be shown.  There must be at least 2 covariates on at least one axis.
 **********************************************************************************/
NgChmGui.COV.showReorder = function() {
	var classes = NgChmGui.mapProperties.classification_files;
	var rowCovarsCtr = 0;
	var colCovarsCtr = 0;
	for (var i=0;i<classes.length;i++) {
		var classItem = classes[i];
		if (classItem.position === 'row') {
			rowCovarsCtr++;
		} else {
			colCovarsCtr++;
		}
	}
	if ((rowCovarsCtr > 1) || (colCovarsCtr > 1)) {
		return true;
	} else {
		return false;
	}
}

/**********************************************************************************
 * FUNCTION - applyCovarOrder: This function reorders the covariates for a given
 * map according to the order set in the reorder panel.
 **********************************************************************************/
NgChmGui.COV.applyCovarOrder = function() {
	var classes = NgChmGui.mapProperties.classification_files;
	var colCovarList = document.getElementById("colCovarMove_list");
	var rowCovarList = document.getElementById("rowCovarMove_list");
	var colOptions = colCovarList.getElementsByTagName('option');
	var newColOrder = [];
	for (var i = 0; i < colOptions.length; i++) {
		var opt = colOptions[i];
		newColOrder.push(opt.text);
	}
	var rowOptions = rowCovarList.getElementsByTagName('option');
	var newRowOrder = [];
	for (var i = 0; i < rowOptions.length; i++) {
		var opt = rowOptions[i];
		newRowOrder.push(opt.text);
	}
	var newOrderClasses = [];
	for (var i=0;i<newColOrder.length;i++) {
		var newOrderItem = newColOrder[i];
		for (var j=0;j<classes.length;j++) {
			var classItem = classes[j];
			if ((classItem.position === "column") && (classItem.name.toUpperCase() === newOrderItem.toUpperCase())) {
				newOrderClasses.push(classItem);
				break;
			}
		}
	}
	for (var i=0;i<newRowOrder.length;i++) {
		var newOrderItem = newRowOrder[i];
		for (var j=0;j<classes.length;j++) {
			var classItem = classes[j];
			if ((classItem.position === "row") && (classItem.name.toUpperCase() === newOrderItem.toUpperCase())) {
				newOrderClasses.push(classItem);
				break;
			}
		}
	}
	NgChmGui.mapProperties.classification_files = newOrderClasses;
	document.getElementById("preferencesPanel").innerHTML = "";
	NgChmGui.COV.loadData();
	NgChmGui.UTIL.setBuildProps(false);
	NgChmGui.UTIL.applySettings(NgChmGui.COV.applySettings, NgChmGui.UTIL.loadHeatMapView);
	document.getElementById("covarReOrder").style.display = 'none';
	document.getElementById("covarSelection").style.display = '';
}

/**********************************************************************************
 * FUNCTION - closeCovarReorder: This function closes the covariate reorder panel.
 * It fires at the end of applying reorders OR when the user presses the cancel
 * button on the reorder panel.
 **********************************************************************************/
NgChmGui.COV.closeCovarReorder = function() {
	 document.getElementById("covarReOrder").style.display = 'none';
	 document.getElementById("covarSelection").style.display = '';
}

/**********************************************************************************
 * FUNCTION - togglePlotTypeProperties: This function will be executed when the user
 * selects bar type (e.g. color plot, bar plot).  Its purpose is to toggle the 
 * color panel defined for the map depending on the bar type.  
 **********************************************************************************/
NgChmGui.COV.togglePlotTypeProperties = function(key) {
	var barType = document.getElementById("barType_"+key);
	var barTypeVal = barType.value;
	var bbDiv = document.getElementById("breakPrefsBp_"+key);
	var cbDiv = document.getElementById("breakPrefsCp_"+key);
	if (barTypeVal === 'color_plot') {
		bbDiv.style.display="none";
		cbDiv.style.display="block";
	} else {
		cbDiv.style.display="none";
		bbDiv.style.display="block";
	}
	NgChmGui.UTIL.setBuildProps(false);
}

/**********************************************************************************
 * FUNCTION - toggleColorTypeProperties: This function will be executed when the user
 * selects color type (e.g. discrete or continuous).  Its purpose is to handle the 
 * scenario where a user changes a continuous bar to discrete. It will toggle any
 * continuous specific panels off and set the bar type value to color_plot.  This 
 * is done because discrete bars cannot have any other bar type.
 **********************************************************************************/
NgChmGui.COV.toggleColorTypeProperties = function(keyItem) {
	var colorType = document.getElementById("colorType_"+keyItem);
	var colorTypeVal = colorType.value;
	var bbDiv = document.getElementById("breakPrefsBp_"+keyItem);
	var cbDiv = document.getElementById("breakPrefsCp_"+keyItem);
	if (colorTypeVal === 'discrete') {
		var classBars = NgChmGui.mapProperties.classification_files;
		for (var key in classBars) {
			var classItem = classBars[key];
			var classKey =  NgChmGui.COV.getClassKey(classItem);
			if (classKey === keyItem) {
				classItem.bar_type = "color_plot";
			}
		}
		var barType = document.getElementById("barType_"+keyItem);
		barType.value = "color_plot";
		barType.disabled = true;
		bbDiv.style.display="none";
		cbDiv.style.display="block";
	}
	NgChmGui.UTIL.setBuildProps(false);
}

/**********************************************************************************
 * FUNCTION - setBreaksToPalette: This function will be executed when the user
 * selects a predefined color scheme. It will fill the first and last breakpoints with the 
 * predefined colors and interpolate the breakpoints in between.
 * "preset" is an array of the colors in HEX of the predefined color scheme
 **********************************************************************************/
NgChmGui.COV.setBreaksToPalette = function(key, id, preset, missingColor, type) {
	NgChmGui.UTIL.setBuildProps(false);
	var i = 0; // find number of breakpoints in the 
	while(document.getElementById(++i+"_color_"+key+"_colorPref"));
	var lastShown = i-1;
	// create dummy colorScheme
	var thresh = [];
	var classItem = NgChmGui.mapProperties.classification_files[id];
	var thresholds = classItem.color_map.thresholds;
	var range = thresholds[thresholds.length-1]-thresholds[0];
	for (var j = 0; j < preset.length; j++){
		thresh[j] = Number(thresholds[0])+j*(range/(preset.length-1));
	}
	var colorScheme = {"missing": missingColor,"thresholds": thresh,"colors": preset,"type": "continuous"};
	var csTemp = new NgChmGui.CM.ColorMap(colorScheme);
	var lastColor = preset[preset.length - 1];
		if (type == "discrete"){ // if colors can be mapped directly
			for (var j = 0; j < i; j++) {
				var colorId = j+"_color_"+key;
				if (j >= preset.length){ // in case there are more categories than predef colors, we darken last color (as many times as necessary)
					var nextColor = csTemp.darkenColor(lastColor);
					document.getElementById(colorId+"_colorPref").value = nextColor;
					lastColor = nextColor;
				}else{
					document.getElementById(colorId+"_colorPref").value = preset[j];
				} 
			} 
			document.getElementById("missing_colorPrefCp_"+key).value = missingColor; 
		} else { // if colors need to be blended
			for (var j = 0; j < thresholds.length; j++) {
				var colorId = j+"_color_"+key;
				var breakpoint = thresholds[j];
				document.getElementById(colorId+"_colorPref").value = csTemp.getRgbToHex(csTemp.getColor(breakpoint)); 
			} 
			document.getElementById("missing_colorPrefCp_"+key).value = csTemp.getRgbToHex(csTemp.getColor("Missing")); 
		}
}	

/**********************************************************************************
 * FUNCTION - showClassSelection: This function toggles the covariate panels
 * when the user selects an item from the dropdown list of covariates.
 **********************************************************************************/
NgChmGui.COV.showClassSelection = function(selIndex) {
	var classList = document.getElementById("classPref_list");
	NgChmGui.COV.hideAllClassDivs();
	if (typeof selIndex === 'undefined') {
		selIndex = classList.selectedIndex;
	}
	var key = classList.options[selIndex].value;
	document.getElementById(key).style.display="block";
}

/**********************************************************************************
 * FUNCTION - hideAllClassDivs: This function hides all covariate panels in 
 * anticipation of a new one being displayed.
 **********************************************************************************/
NgChmGui.COV.hideAllClassDivs = function() {
	var classBtn = document.getElementById("classPref_list");
	for (var i=0; i<classBtn.length; i++){
		var selectedDivId = classBtn.options[i].value;
		document.getElementById(selectedDivId).style.display = 'none';
	}
}

/**********************************************************************************
 * FUNCTION - applySettings: This function applies changes made in the covariate
 * panels to the mapProperties object in advance of saving the properties.
 **********************************************************************************/
NgChmGui.COV.applySettings = function() {
	//Must pre-validate user covariate name entries because field names are
	//constructed using the name when the screen is loaded.
	if (NgChmGui.COV.checkCovariateNames() === false) {
		return;
	}
	NgChmGui.UTIL.setTileWrite();
	NgChmGui.tileWrite = false;
	//reset builder errors
	NgChmGui.mapProperties.builder_config.buildErrors = "";
	NgChmGui.mapProperties.builder_config.buildWarnings = [];
	var classBars = NgChmGui.mapProperties.classification_files;
	for (var key in classBars) {
		var classItem = classBars[key];
		var classKey =  NgChmGui.COV.getClassKey(classItem);
		var className =  document.getElementById('covName_'+classKey).value;
		if (className !== classItem.name) {
			NgChmGui.COV.setNameOnMatrixConfig(classItem, className);
		}
		classItem.height = document.getElementById('heightPref_'+classKey).value;
		classItem.show = document.getElementById('showPref_'+classKey).value;
		if (NgChmGui.COV.colorTypeChangeable(classItem) === true) {
			if (classItem.color_map.type !== document.getElementById('colorType_'+classKey).value) {
				classItem.color_map.type = document.getElementById('colorType_'+classKey).value;
				classItem.change_type = "Y";
			}
		}
		if (classItem.color_map.type === 'continuous') {
			if (document.getElementById('barType_'+classKey) !== null) {
				classItem.bar_type = document.getElementById('barType_'+classKey).value;
			}
		}
		classItem.low_bound = document.getElementById('lowBound_'+classKey).value;
		classItem.high_bound = document.getElementById('highBound_'+classKey).value;
		classItem.bg_color = document.getElementById('bgColorPref_'+classKey).value;
		classItem.fg_color = document.getElementById('fgColorPref_'+classKey).value;
		var colors = classItem.color_map.colors;
		for (var j = 0; j < colors.length; j++) {
			classItem.color_map.colors[j] = document.getElementById(j+'_color_'+classKey+'_colorPref').value;   
			var color = colors[j];
		} 
		if (classItem.bar_type !== 'color_plot') {
			classItem.color_map.missing = document.getElementById('missing_colorPrefBp_'+classKey).value
		} else {
			classItem.color_map.missing = document.getElementById('missing_colorPrefCp_'+classKey).value
		}
	}
	return NgChmGui.COV.validateEntries(false);
}

/*Run validation to see if we can leave the screen.*/
NgChmGui.COV.gotoClusterScreen = function() {
	if (NgChmGui.COV.validateEntries(true)) {
		NgChmGui.UTIL.gotoFormatScreen();
	}
}



