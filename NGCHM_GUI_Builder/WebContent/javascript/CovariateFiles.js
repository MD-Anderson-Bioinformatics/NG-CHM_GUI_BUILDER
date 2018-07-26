//Define Namespace for NgChmGui Covariate File Page
NgChmGui.createNS('NgChmGui.COV');

/**********************************************************************************
 * FUNCTION - loadData: This function will be executed when the covariates page
 * is opened for the first time.  It loads the header, sets up the left data 
 * entry panel, and calls functions that loads covariate preferences into data
 * entry panels.  
 **********************************************************************************/
NgChmGui.COV.loadData =  function() {
	if (NgChmGui.UTIL.loadHeaderData()) {
		var prefsPanelDiv = document.getElementById("preferencesPanel");
		prefsPanelDiv.style.left = 0;
		prefsPanelDiv.style.right = "";
		var classes = NgChmGui.mapProperties.classification_files;
		var classPrefsDiv = NgChmGui.COV.setupClassPrefs(classes);
		NgChmGui.COV.setClassPrefOptions(classes);
		NgChmGui.UTIL.loadHeatMapView();
		classPrefsDiv.style.display = '';
		prefsPanelDiv.style.display = '';
		NgChmGui.COV.validateEntries(false);
	}
}

/**********************************************************************************
 * FUNCTION - the validate function is called on page load, page exit, and when
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
			pageText = pageText + "<p class='error_message'>"+ NgChmGui.UTIL.errorPrefix + "Covariate <font color='red'>" + classItem.name.toUpperCase() + "</font> Height entry must be an integer between 1 and 99.</p>" + NgChmGui.UTIL.nextLine;
			valid = false;
		}
		if (classItem.bar_type !== 'color_plot') {
			if (isNaN(classItem.low_bound)) {
				pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Covariate <font color='red'>" + classItem.name.toUpperCase() + "</font> Lower Bound entry must be numeric.</p>" + NgChmGui.UTIL.nextLine;
				valid = false;
			}
			if (isNaN(classItem.high_bound)) {
				pageText = pageText + "<p class='error_message'>" + NgChmGui.UTIL.errorPrefix + "Covariate <font color='red'>" + classItem.name.toUpperCase() + "</font> Upper Bound entry must be numeric.</p>" + NgChmGui.UTIL.nextLine;
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
	   pageText = pageText + "This page can be used to modify the appearance of covariate bars.  Select the covarate bar you wish to customize from the dropdown and you may then change color settings, size, and indicate whether it should be displayed by default. For continuous covariate bars, you can also choose an alternate presentation option of bar or scatter plot. " ;
	} else {
	   pageText = pageText + "Covariate bars are extra descriptive information that can be added above columns or to the left of rows on a heatmap. Covariates fall into two types: 1. discrete categorical information like smoker/non-smoker and 2. continuous numerical information like age.  Covariate files are tab delimited files with two values on each row 1. a label that matches the matrix row or column labels and 2. a value.  Use the add button to insert covariate bars or just hit next if you don't want them." ;
	}
	NgChmGui.UTIL.setScreenNotes(pageText);
	
	return valid;
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
	var classSelectStr = "<select name='classPref_list' id='classPref_list' style='font-size: 12px;' onchange='NgChmGui.COV.showClassSelection();'></select>"
	var addButton = "<img id='add_covar_btn' src='images/addButton.png' alt='Add Covariate' style='vertical-align: bottom;' onclick='NgChmGui.COV.openCovarUpload()' />";
	var removeButton = "<img id='remove_covar_btn' src='images/removeButton.png' alt='Remove Covariate' style='vertical-align: bottom;display: none' onclick='NgChmGui.COV.openCovarRemoval()' />";
	NgChmGui.UTIL.setTableRow(prefContents,["Covariates: ", classSelectStr]);
	NgChmGui.UTIL.addBlankRow(prefContents)
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;",addButton +"&nbsp;"+ removeButton]);
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
		document.getElementById("remove_covar_btn").style.display = '';
		document.getElementById("classPref_list").style.display = '';
	} else {
		var noClassesDiv = NgChmGui.COV.getEmptyClassesPanel();
		classPrefsDiv.appendChild(noClassesDiv);
		document.getElementById("remove_covar_btn").style.display = 'none';
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
	var classSelect = document.getElementById('classPref_list');
	classSelect.options[classSelect.options.length] = new Option(classItem.name, key);
	var name = classItem.name;
	var colors = classItem.color_map.colors;
	var thresholds = classItem.color_map.thresholds;
	var classDiv = NgChmGui.UTIL.getDivElement(key);
	classDiv.className = 'preferencesSubPanel';
	var classContents = document.createElement("TABLE"); 
	NgChmGui.UTIL.addBlankRow(classContents);
	var barTypeOptionsSelect = "<select name='barTypePref_"+key+"' id='barTypePref_"+key+"' onchange='NgChmGui.COV.togglePlotTypeProperties(&quot;"+key+"&quot;)'>"; 
	var barTypeOptions = "<option value='color_plot'>Color Plot</option><option value='bar_plot'>Bar Plot</option><option value='scatter_plot'>Scatter Plot</option></select>";
	barTypeOptionsSelect = barTypeOptionsSelect+barTypeOptions;

	var barName = "<input name='namePref_"+key+"' id='namePref_"+key+"' value='"+classItem.name+"' maxlength='30' size='20' onchange='NgChmGui.UTIL.setBuildProps();'>&emsp;";
	NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Bar Name:", "<b>"+NgChmGui.UTIL.toTitleCase(classItem.name)+"</b>"]);
	NgChmGui.UTIL.setTableRow(classContents,["&nbsp;&nbsp;Bar Position: ","<b>"+NgChmGui.UTIL.toTitleCase(classItem.position)+"</b>"]);
	NgChmGui.UTIL.setTableRow(classContents,["&nbsp;&nbsp;Color Type: ","<b>"+NgChmGui.UTIL.toTitleCase(classItem.color_map.type)+"</b>"]);
	if (classItem.color_map.type === 'continuous') {
		NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Bar Type:", barTypeOptionsSelect]);
	} else {
		NgChmGui.UTIL.setTableRow(classContents,["&nbsp;&nbsp;Bar Type: ","<b>"+NgChmGui.UTIL.toTitleCase(classItem.bar_type)+"</b>"]);
	}
	NgChmGui.UTIL.addBlankRow(classContents);
	var barHeight = "<input name='heightPref_"+key+"' id='heightPref_"+key+"' value='"+classItem.height+"' onchange='NgChmGui.UTIL.setBuildProps();'  maxlength='2' size='2'>&emsp;";
	NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Height:", barHeight]);
	var showSelect = "<select name='showPref_"+key+"' id='showPref_"+key+"' value='"+classItem.show+"' onchange='NgChmGui.UTIL.setBuildProps();' ;>" // 
	var showOptions = "<option value='N'>No</option><option value='Y'>Yes</option></select>";
	showSelect = showSelect + showOptions;
	NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Show:", showSelect]);
	NgChmGui.UTIL.addBlankRow(classContents, 2);

	//Build color breaks sub panel for color_plot covariates
	var helpprefsCp = NgChmGui.UTIL.getDivElement("breakPrefsCp_"+key);
	var prefContentsCp = document.createElement("TABLE"); 
	NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;<u>Category</u>","<b><u>"+"Color"+"</b></u>"]); 
	for (var j = 0; j < thresholds.length; j++) {
		var threshold = thresholds[j];
		var color = colors[j];
		var threshId = j+"_breakPt_"+key;
		var colorId = j+"_color_"+key;
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"_colorPref' id='"+colorId+"_colorPref' value='"+color+"' onchange='NgChmGui.UTIL.setBuildProps();' >"; 
		NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;&nbsp;"+threshold, colorInput]);
	} 
	NgChmGui.UTIL.addBlankRow(prefContentsCp);
	NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_colorPrefCp_"+key+"' id='missing_colorPrefCp_"+key+"' value='"+classItem.color_map.missing+"' onchange='NgChmGui.UTIL.setBuildProps();' >"]);
	NgChmGui.UTIL.addBlankRow(prefContentsCp, 3);
	NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;<u>Choose a pre-defined color palette:</u>"],3);
	NgChmGui.UTIL.addBlankRow(prefContentsCp);
	if (classItem.color_map.type == "discrete"){
//		var scheme1 = "<div style='display:flex'><div class='preDefPalette' style='background: linear-gradient(to right, #1f77b4,#ff7f0e,#2ca02c,#d62728,#9467bd,#8c564b,#e377c2,#7f7f7f,#bcbd22,#17becf);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ",[\"#1f77b4\",\"#ff7f0e\",\"#2ca02c\", \"#d62728\", \"#9467bd\", \"#8c564b\", \"#e377c2\", \"#7f7f7f\", \"#bcbd22\", \"#17becf\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div><div class='preDefPaletteMissingColor' style='background:white'></div></div>";
		var scheme1 = "<div style='display:flex'><div class='preDefPalette' style='background: linear-gradient(to right, #2e1f54,#52057f,#bf033b,#f00a36,#ed3b21,#ffc719,#598c14,#335238, #4a8594,#706357);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ",[\"#1f77b4\",\"#ff7f0e\",\"#2ca02c\", \"#d62728\", \"#9467bd\", \"#8c564b\", \"#e377c2\", \"#7f7f7f\", \"#bcbd22\", \"#17becf\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div><div class='preDefPaletteMissingColor' style='background:white'></div></div>";
//		var scheme2 = "<div style='display:flex'><div class='preDefPalette' style='background: linear-gradient(to right, #1f77b4,#aec7e8,#ff7f0e,#ffbb78,#2ca02c,#98df8a,#d62728,#ff9896,#9467bd,#c5b0d5,#8c564b,#c49c94,#e377c2,#f7b6d2,#7f7f7f,#c7c7c7,#bcbd22,#dbdb8d,#17becf,#9edae5);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#1f77b4\",\"#aec7e8\",\"#ff7f0e\",\"#ffbb78\",\"#2ca02c\",\"#98df8a\",\"#d62728\",\"#ff9896\",\"#9467bd\",\"#c5b0d5\",\"#8c564b\",\"#c49c94\",\"#e377c2\",\"#f7b6d2\",\"#7f7f7f\",\"#c7c7c7\",\"#bcbd22\",\"#dbdb8d\",\"#17becf\",\"#9edae5\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div><div class='preDefPaletteMissingColor' style='background:white'></div></div>";
		var scheme2 = "<div style='display:flex'><div class='preDefPalette' style='background: linear-gradient(to right, #da5a47,#ffa500,#00a5dc,#004eaf,#2db928,#057855,#b1a24a,#ff2d37,#737373,#cdcdcd, #f0f0f0);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#1f77b4\",\"#aec7e8\",\"#ff7f0e\",\"#ffbb78\",\"#2ca02c\",\"#98df8a\",\"#d62728\",\"#ff9896\",\"#9467bd\",\"#c5b0d5\",\"#8c564b\",\"#c49c94\",\"#e377c2\",\"#f7b6d2\",\"#7f7f7f\",\"#c7c7c7\",\"#bcbd22\",\"#dbdb8d\",\"#17becf\",\"#9edae5\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div><div class='preDefPaletteMissingColor' style='background:white'></div></div>";
		var scheme3 = "<div style='display:flex'><div class='preDefPalette' style='background: linear-gradient(to right,#393b79, #637939, #8c6d31, #843c39, #7b4173, #5254a3, #8ca252, #bd9e39, #ad494a, #a55194, #6b6ecf, #b5cf6b, #e7ba52, #d6616b, #ce6dbd, #9c9ede, #cedb9c, #e7cb94, #e7969c, #de9ed6);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#393b79\", \"#637939\", \"#8c6d31\", \"#843c39\", \"#7b4173\", \"#5254a3\", \"#8ca252\", \"#bd9e39\", \"#ad494a\", \"#a55194\", \"#6b6ecf\", \"#b5cf6b\", \"#e7ba52\", \"#d6616b\", \"#ce6dbd\", \"#9c9ede\", \"#cedb9c\", \"#e7cb94\", \"#e7969c\", \"#de9ed6\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div><div class='preDefPaletteMissingColor' style='background:white'></div></div>";
		NgChmGui.UTIL.setTableRow(prefContentsCp, [scheme1,scheme2,scheme3]);
		NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;Palette1",  "&nbsp;<b>Palette2</b>","&nbsp;<b>Palette3</b>"]);
	} else {
		var rainbow = "<div style='display:flex'><div class='preDefPalette' style='background: linear-gradient(to right, red,orange,yellow,green,blue,violet);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#FF0000\",\"#FF8000\",\"#FFFF00\",\"#00FF00\",\"#0000FF\",\"#FF00FF\"],\"#000000\",\""+classItem.color_map.type+"\")' > </div><div class='preDefPaletteMissingColor' style='background:black'></div></div>";
		var greyscale = "<div style='display:flex'><div class='preDefPalette' style='background: linear-gradient(to right, white,black);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#FFFFFF\",\"#000000\"],\"#FF0000\",\""+classItem.color_map.type+"\")' > </div><div class='preDefPaletteMissingColor' style='background:red'></div></div>";
		var redBlackGreen = "<div style='display:flex'><div id='setRedBlackGreen' class='preDefPalette' style='background: linear-gradient(to right, green,black,red);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#00FF00\",\"#000000\",\"#FF0000\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div>" +
		"<div class='preDefPaletteMissingColor' style='background:white'></div></div>"
		NgChmGui.UTIL.setTableRow(prefContentsCp, [greyscale,rainbow,redBlackGreen]);
		NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;Greyscale",  "&nbsp;<b>Rainbow</b>","&nbsp;<b>Green Red</b>"]);
	}
	helpprefsCp.appendChild(prefContentsCp);
	
	//Build high/low bounds/colors sub panel for bar and scatter plot covariates
	var helpprefsBp = NgChmGui.UTIL.getDivElement("breakPrefsBp_"+key);
	var prefContentsBp = document.createElement("TABLE"); 
	var lowBoundInput = "<input name='low_bound_"+key+"' id='low_bound_"+key+"' value='"+classItem.low_bound+"' maxlength='10' size='5' onchange='NgChmGui.UTIL.setBuildProps();' >&emsp;";
	var highBoundInput = "<input name='high_bound_"+key+"' id='high_bound_"+key+"' value='"+classItem.high_bound+"' maxlength='10' size='5' onchange='NgChmGui.UTIL.setBuildProps();' >&emsp;";
	NgChmGui.UTIL.addBlankRow(prefContentsBp);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Lower Bound:", lowBoundInput]);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Upper Bound:", highBoundInput]);
	NgChmGui.UTIL.addBlankRow(prefContentsBp);
	var bgColorInput = "<input class='spectrumColor' type='color' name='bgColorPref_"+key+"' id='bgColorPref_"+key+"' value='"+classItem.bg_color+"' onchange='NgChmGui.UTIL.setBuildProps();' >"; 
	var fgColorInput = "<input class='spectrumColor' type='color' name='fgColorPref_"+key+"' id='fgColorPref_"+key+"' value='"+classItem.fg_color+"' onchange='NgChmGui.UTIL.setBuildProps();' >"; 
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Foreground Color:", fgColorInput]);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Background Color:", bgColorInput]);
	NgChmGui.UTIL.addBlankRow(prefContentsBp);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_colorPrefBp_"+key+"' id='missing_colorPrefBp_"+key+"' value='"+classItem.color_map.missing+"' onchange='NgChmGui.UTIL.setBuildProps();' >"]);
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
 * FUNCTION - applyClassPrefs: This function applies changes made in the covariate
 * panels to the mapProperties object in advance of saving the properties.
 **********************************************************************************/
NgChmGui.COV.applySettings = function() {
    //reset builder errors
	NgChmGui.mapProperties.builder_config.buildErrors = "";
	NgChmGui.mapProperties.builder_config.buildWarnings = [];
	var classBars = NgChmGui.mapProperties.classification_files;
	for (var key in classBars) {
		var classItem = classBars[key];
		var classKey =  NgChmGui.COV.getClassKey(classItem);
		classItem.height = document.getElementById('heightPref_'+classKey).value;
		classItem.show = document.getElementById('showPref_'+classKey).value;
		if (classItem.color_map.type === 'continuous') {
			classItem.bar_type = document.getElementById('barTypePref_'+classKey).value;
		}
		classItem.low_bound = document.getElementById('low_bound_'+classKey).value;
		classItem.high_bound = document.getElementById('high_bound_'+classKey).value;
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

/**********************************************************************************
 * FUNCTION - setClassPrefOptions: This function loads dropdowns for each covariate
 * bar panel after those panels have been created
 **********************************************************************************/
NgChmGui.COV.setClassPrefOptions = function(classes) {
	var classSelect = document.getElementById('classPref_list');
	for (var i=0;i<classes.length;i++) {
		var classItem = classes[i];
		var key =  NgChmGui.COV.getClassKey(classItem);
		NgChmGui.COV.getClassFromPanel()
		document.getElementById('showPref_'+key).value = classItem.show;
		if (classItem.color_map.type === 'continuous') {
			document.getElementById('barTypePref_'+key).value = classItem.bar_type;
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
	document.getElementById('covUpload_apply_btn').style.display = '';
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
	if (document.getElementById('Age_Covar').checked) {
		selFile.value = "SampleAgeCovariate.txt";
	} else if (document.getElementById('Gleason_Covar').checked) {
		selFile.value = "SampleGleasonCovariate.txt";
	} else if (document.getElementById('Psa_Covar').checked) {
		selFile.value = "SamplePsaCovariate.txt";
	} else {
		selFile.value = "SampleRaceCovariate.txt";
	}
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
 * FUNCTION - togglePlotTypeProperties: This function will be executed when the user
 * selects bar type (e.g. color plot, bar plot).  Its purpose is to toggle the 
 * color panel defined for the map depending on the bar type.  
 **********************************************************************************/
NgChmGui.COV.togglePlotTypeProperties = function(key) {
	var barType = document.getElementById("barTypePref_"+key);
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
	NgChmGui.UTIL.setBuildProps();
}

/**********************************************************************************
 * FUNCTION - setBreaksToPalette: This function will be executed when the user
 * selects a predefined color scheme. It will fill the first and last breakpoints with the 
 * predefined colors and interpolate the breakpoints in between.
 * "preset" is an array of the colors in HEX of the predefined color scheme
 **********************************************************************************/
NgChmGui.COV.setBreaksToPalette = function(key, id, preset, missingColor, type) {
	NgChmGui.UTIL.setBuildProps();
	var i = 0; // find number of breakpoints in the 
	while(document.getElementById(++i+"_color_"+key+"_colorPref"));
	var lastShown = i-1;
	// create dummy colorScheme
	var thresh = [];
		if (type == "discrete"){ // if colors can be mapped directly
			for (var j = 0; j < i; j++) {
				var colorId = j+"_color_"+key;
				if (j > preset.length){ // in case there are more breakpoints than predef colors, we cycle back
					document.getElementById(colorId+"_colorPref").value = preset[j%preset.length];
				}else{
					document.getElementById(colorId+"_colorPref").value = preset[j];
				} 
			} 
			document.getElementById("missing_colorPrefCp_"+key).value = missingColor; 
		} else { // if colors need to be blended
			var classItem = NgChmGui.mapProperties.classification_files[id];
			var thresholds = classItem.color_map.thresholds;
			var range = thresholds[thresholds.length-1]-thresholds[0];
			for (var j = 0; j < preset.length; j++){
				thresh[j] = Number(thresholds[0])+j*(range/(preset.length-1));
			}
			var colorScheme = {"missing": missingColor,"thresholds": thresh,"colors": preset,"type": "continuous"};
			var csTemp = new NgChmGui.CM.ColorMap(colorScheme);
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

/*Run validation to see if we can leave the screen.*/
NgChmGui.COV.gotoClusterScreen = function() {
	if (NgChmGui.COV.validateEntries(true)) {
		NgChmGui.UTIL.gotoClusterScreen();
	}
}



