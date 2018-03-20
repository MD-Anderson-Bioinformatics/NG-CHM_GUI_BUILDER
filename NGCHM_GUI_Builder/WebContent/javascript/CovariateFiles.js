//Define Namespace for NgChmGui Covariate File Page
NgChmGui.createNS('NgChmGui.COV');

/**********************************************************************************
 * FUNCTION - loadData: This function will be executed when the covariates page
 * is opened for the first time.  It loads the header, sets up the left data 
 * entry panel, and calls functions that loads covariate preferences into data
 * entry panels.  
 **********************************************************************************/
NgChmGui.COV.loadData =  function() {
	NgChmGui.UTIL.loadHeaderData();
	var prefsPanelDiv = document.getElementById("preferencesPanel");
	prefsPanelDiv.style.left = 0;
	prefsPanelDiv.style.right = "";
	var classes = NgChmGui.mapProperties.classification_files;
	var classPrefsDiv = NgChmGui.COV.setupClassPrefs(classes);
	NgChmGui.COV.setClassPrefOptions(classes);
	classPrefsDiv.style.display = '';
	prefsPanelDiv.style.display = '';
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
	NgChmGui.UTIL.addBlankRow(prefContents)
	var classSelectStr = "<select name='classPref_list' id='classPref_list' onchange='NgChmGui.COV.showClassSelection();'></select>"
	var addButton = "<img id='apply_btn' src='images/addButton.png' alt='Add Covariate' style='vertical-align: bottom;' onclick='NgChmGui.COV.openCovarUpload()' />";
	var removeButton = "<img id='apply_btn' src='images/removeButton.png' alt='Remove Covariate' style='vertical-align: bottom;' onclick='NgChmGui.COV.openCovarRemoval()' />";
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;Covariate Bars: ", classSelectStr, addButton, removeButton]);
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
	} else {
		var noClassesDiv = NgChmGui.COV.getEmptyClassesPanel();
		classPrefsDiv.appendChild(noClassesDiv);
		noClassesDiv.style.display='none';
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
	classSelect.options[classSelect.options.length] = new Option('NONE', 'classPref_NONE');
	var noClassesDiv = NgChmGui.UTIL.getDivElement('classPref_NONE');
	noClassesDiv.className = 'preferencesSubPanel';
	var noClassesTbl = document.createElement('TABLE'); 
	NgChmGui.UTIL.addBlankRow(noClassesTbl);
	NgChmGui.UTIL.setTableRow(noClassesTbl,["&nbsp;&nbsp;<b>No Covariates Assigned</b>"]);
	NgChmGui.UTIL.addBlankRow(noClassesTbl);
	noClassesDiv.appendChild(noClassesTbl);
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

	var barName = "<input name='namePref_"+key+"' id='namePref_"+key+"' value='"+classItem.name+"' maxlength='30' size='20'>&emsp;";
	NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Bar Name:", "<b>"+NgChmGui.UTIL.toTitleCase(classItem.name)+"</b>"]);
	NgChmGui.UTIL.setTableRow(classContents,["&nbsp;&nbsp;Bar Position: ","<b>"+NgChmGui.UTIL.toTitleCase(classItem.position)+"</b>"]);
	NgChmGui.UTIL.setTableRow(classContents,["&nbsp;&nbsp;Color Type: ","<b>"+NgChmGui.UTIL.toTitleCase(classItem.color_map.type)+"</b>"]);
	if (classItem.color_map.type === 'continuous') {
		NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Bar Type:", barTypeOptionsSelect]);
	} else {
		NgChmGui.UTIL.setTableRow(classContents,["&nbsp;&nbsp;Bar Type: ","<b>"+NgChmGui.UTIL.toTitleCase(classItem.bar_type)+"</b>"]);
	}
	NgChmGui.UTIL.addBlankRow(classContents);
	var barHeight = "<input name='heightPref_"+key+"' id='heightPref_"+key+"' value='"+classItem.height+"' maxlength='2' size='2'>&emsp;";
	NgChmGui.UTIL.setTableRow(classContents, ["&nbsp;&nbsp;Height:", barHeight]);
	var showSelect = "<select name='showPref_"+key+"' id='showPref_"+key+"' value='"+classItem.show+"';>" // 
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
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"_colorPref' id='"+colorId+"_colorPref' value='"+color+"'>"; 
		NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;&nbsp;"+threshold, colorInput]);
	} 
	NgChmGui.UTIL.addBlankRow(prefContentsCp);
	NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_colorPrefCp_"+key+"' id='missing_colorPrefCp_"+key+"' value='"+classItem.color_map.missing+"'>"]);
	NgChmGui.UTIL.addBlankRow(prefContentsCp, 3);
	NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;<u>Choose a pre-defined color palette:</u>"],3);
	NgChmGui.UTIL.addBlankRow(prefContentsCp);
	if (classItem.color_map.type == "discrete"){
		var scheme1 = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right, #1f77b4,#ff7f0e,#2ca02c,#d62728,#9467bd,#8c564b,#e377c2,#7f7f7f,#bcbd22,#17becf);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ",[\"#1f77b4\",\"#ff7f0e\",\"#2ca02c\", \"#d62728\", \"#9467bd\", \"#8c564b\", \"#e377c2\", \"#7f7f7f\", \"#bcbd22\", \"#17becf\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div><div class='presetPaletteMissingColor' style='background:white'></div></div>";
		var scheme2 = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right, #1f77b4,#aec7e8,#ff7f0e,#ffbb78,#2ca02c,#98df8a,#d62728,#ff9896,#9467bd,#c5b0d5,#8c564b,#c49c94,#e377c2,#f7b6d2,#7f7f7f,#c7c7c7,#bcbd22,#dbdb8d,#17becf,#9edae5);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#1f77b4\",\"#aec7e8\",\"#ff7f0e\",\"#ffbb78\",\"#2ca02c\",\"#98df8a\",\"#d62728\",\"#ff9896\",\"#9467bd\",\"#c5b0d5\",\"#8c564b\",\"#c49c94\",\"#e377c2\",\"#f7b6d2\",\"#7f7f7f\",\"#c7c7c7\",\"#bcbd22\",\"#dbdb8d\",\"#17becf\",\"#9edae5\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div><div class='presetPaletteMissingColor' style='background:white'></div></div>";
		var scheme3 = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right,#393b79, #637939, #8c6d31, #843c39, #7b4173, #5254a3, #8ca252, #bd9e39, #ad494a, #a55194, #6b6ecf, #b5cf6b, #e7ba52, #d6616b, #ce6dbd, #9c9ede, #cedb9c, #e7cb94, #e7969c, #de9ed6);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#393b79\", \"#637939\", \"#8c6d31\", \"#843c39\", \"#7b4173\", \"#5254a3\", \"#8ca252\", \"#bd9e39\", \"#ad494a\", \"#a55194\", \"#6b6ecf\", \"#b5cf6b\", \"#e7ba52\", \"#d6616b\", \"#ce6dbd\", \"#9c9ede\", \"#cedb9c\", \"#e7cb94\", \"#e7969c\", \"#de9ed6\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div><div class='presetPaletteMissingColor' style='background:white'></div></div>";
		NgChmGui.UTIL.setTableRow(prefContentsCp, [scheme1,scheme2,scheme3]);
		NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;Palette1",  "&nbsp;<b>Palette2</b>","&nbsp;<b>Palette3</b>"]);
	} else {
		var rainbow = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right, red,orange,yellow,green,blue,violet);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#FF0000\",\"#FF8000\",\"#FFFF00\",\"#00FF00\",\"#0000FF\",\"#FF00FF\"],\"#000000\",\""+classItem.color_map.type+"\")' > </div><div class='presetPaletteMissingColor' style='background:black'></div></div>";
		var greyscale = "<div style='display:flex'><div class='presetPalette' style='background: linear-gradient(to right, white,black);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#FFFFFF\",\"#000000\"],\"#FF0000\",\""+classItem.color_map.type+"\")' > </div><div class='presetPaletteMissingColor' style='background:red'></div></div>";
		var redBlackGreen = "<div style='display:flex'><div id='setRedBlackGreen' class='presetPalette' style='background: linear-gradient(to right, green,black,red);' onclick='NgChmGui.COV.setBreaksToPalette(\""+ key+ "\", "+ classIdx+ ", [\"#00FF00\",\"#000000\",\"#FF0000\"],\"#ffffff\",\""+classItem.color_map.type+"\")'> </div>" +
		"<div class='presetPaletteMissingColor' style='background:white'></div></div>"
		NgChmGui.UTIL.setTableRow(prefContentsCp, [greyscale,rainbow,redBlackGreen]);
		NgChmGui.UTIL.setTableRow(prefContentsCp, ["&nbsp;Greyscale",  "&nbsp;<b>Rainbow</b>","&nbsp;<b>Green Red</b>"]);
	}
	helpprefsCp.appendChild(prefContentsCp);
	
	//Build high/low bounds/colors sub panel for bar and scatter plot covariates
	var helpprefsBp = NgChmGui.UTIL.getDivElement("breakPrefsBp_"+key);
	var prefContentsBp = document.createElement("TABLE"); 
	var lowBoundInput = "<input name='low_bound_"+key+"' id='low_bound_"+key+"' value='"+classItem.low_bound+"' maxlength='10' size='5'>&emsp;";
	var highBoundInput = "<input name='high_bound_"+key+"' id='high_bound_"+key+"' value='"+classItem.high_bound+"' maxlength='10' size='5'>&emsp;";
	NgChmGui.UTIL.addBlankRow(prefContentsBp);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Lower Bound:", lowBoundInput]);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Lower Bound:", highBoundInput]);
	NgChmGui.UTIL.addBlankRow(prefContentsBp);
	var bgColorInput = "<input class='spectrumColor' type='color' name='bgColorPref_"+key+"' id='bgColorPref_"+key+"' value='"+classItem.bg_color+"'>"; 
	var fgColorInput = "<input class='spectrumColor' type='color' name='fgColorPref_"+key+"' id='fgColorPref_"+key+"' value='"+classItem.fg_color+"'>"; 
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Foreground Color:", fgColorInput]);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;&nbsp;Background Color:", bgColorInput]);
	NgChmGui.UTIL.addBlankRow(prefContentsBp);
	NgChmGui.UTIL.setTableRow(prefContentsBp, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_colorPrefBp_"+key+"' id='missing_colorPrefBp_"+key+"' value='"+classItem.color_map.missing+"'>"]);
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
 * FUNCTION - applyClassPrefs: This function applys changes made in the covariate
 * panels to the mapProperties object in advance of saving the properties.
 **********************************************************************************/
NgChmGui.COV.applyClassPrefs = function() {
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
	 document.getElementById("covarAdd").style.display = '';
}

/**********************************************************************************
 * FUNCTION - readyUpload: This function excutes when the user has selected a 
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
	var filePath = document.getElementById('file-input').value;
	var fileNameTxt = filePath.substring(12,filePath.length);
	textSpan.appendChild(document.createTextNode(fileNameTxt));
	//If Name field not populated by user, use filename (less suffix)
	var covName = document.getElementById('covName');
	if ((covName.value.trim() === '') || (covName.value === null)) {
		var idxDot = fileNameTxt.indexOf('.') > 25 ? 25 : fileNameTxt.indexOf('.');
		covName.value = fileNameTxt.substring(0,idxDot);
	}
	document.getElementById('covUpload_apply_btn').style.display = '';
}

/**********************************************************************************
 * FUNCTION - addCovariateBar: This function runs when the upload button is pressed.
 * It calls the UploadCovariate servlet, waits for the result, and then calls a 
 * function to adds a new covariate bar panel.  
 **********************************************************************************/
NgChmGui.COV.addCovariateBar = function() {
	var req = new XMLHttpRequest();
	//Validate Covar name and axis
	var covNameValue = document.getElementById('covName').value;
	var axisValue = document.getElementById('axisType').value;
	var key = axisValue+"_"+covNameValue;
	document.getElementById(key);
	if (document.getElementById(key) !== null) {
		NgChmGui.UTIL.duplicateCovarError(axisValue,covNameValue);
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
	    		if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to upload covariate '  + req.status);
	        } else {
	        	NgChmGui.UTIL.getHeatmapProperties(NgChmGui.COV.loadNewCovariateBar);
	        }
		}
	};
	req.send(formData);
}

/**********************************************************************************
 * FUNCTION - hideCovarUpload: This function closes the add covariate upload panel
 * and displays the covariates data entry panel.  
 **********************************************************************************/
NgChmGui.COV.loadNewCovariateBar = function() {
	var classPrefsDiv = document.getElementById("classPrefsDiv");
	var classPrefsList = document.getElementById("classPref_list");
	var classes = NgChmGui.mapProperties.classification_files;
	var classIdx = classes.length-1;
	var lastClass = classes[classIdx];
	var key =  NgChmGui.COV.getClassKey(lastClass);
	if (classPrefsList.options[0].value === 'NONE') {
		classPrefsList.remove(0);
	}
	var classContentsDiv = NgChmGui.COV.setupCovariatePanel(lastClass,classIdx);
	classPrefsDiv.appendChild(classContentsDiv);
	classContentsDiv.style.display='none';
	NgChmGui.COV.hideCovarUpload();
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
	document.getElementById("axisType").value = 'column';
	document.getElementById("colorType").value = 'discrete';
	document.getElementById("covarSelection").style.display = '';
	document.getElementById("covarAdd").style.display = 'none';
}

/**********************************************************************************
 * FUNCTION - openCovarRemoval: This function opens the covariate bar removal panel
 * and hides the covariates data entry panel.  It also places the name of the 
 * covariate bar selected for deletion on the removal panel.
 **********************************************************************************/
NgChmGui.COV.openCovarRemoval = function() {
	 var selectedBar = document.getElementById("classPref_list");
	 var selectedText = selectedBar.options[selectedBar.selectedIndex].text;
	 var remLabel = document.getElementById("covarRemoveLabel").innerHTML = "Remove Covariate Bar:&nbsp;&nbsp;"+selectedText;
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
 * FUNCTION - removeCovariateBar: This function removes a covariate panel from
 * the covariate data entry panel and dropdown.  
 **********************************************************************************/
NgChmGui.COV.removeCovariateBar = function() {
	var classSelect = document.getElementById("classPref_list");
	var selectedBarIdx = classSelect.selectedIndex;
	var selectedValue = classSelect.value;
	var classProps = NgChmGui.mapProperties.classification_files;
	var classPropIdx = -99;
	for (var i=0;i<classProps.length;i++) {
		var classItem = classProps[i];
		var selectedAxis = selectedValue.substring(0,selectedValue.indexOf("_"));
		var selectedName = selectedValue.substring(selectedValue.indexOf("_")+1,selectedValue.length);
		if ((classItem.position === selectedAxis) && (classItem.name === selectedName)) {
			classPropIdx = i;
			break;
		}
	}
	NgChmGui.mapProperties.classification_files.splice(classPropIdx, 1);
	var mapProp2 = NgChmGui.mapProperties.classification_files;
	var selectedDiv = document.getElementById(selectedValue);
	selectedDiv.parentNode.removeChild(selectedDiv);
	classSelect.remove(selectedBarIdx);
	if (classSelect.length > 0) {
		NgChmGui.COV.showClassSelection(0);	        
	} else {
		classSelect.options[classSelect.options.length] = new Option('NONE', 'NONE');
	}
	NgChmGui.COV.hideCovarRemoval();
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
}

/**********************************************************************************
 * FUNCTION - setBreaksToPalette: This function will be executed when the user
 * selects a predefined color scheme. It will fill the first and last breakpoints with the 
 * predefined colors and interpolate the breakpoints in between.
 * "preset" is an array of the colors in HEX of the predefined color scheme
 **********************************************************************************/
NgChmGui.COV.setBreaksToPalette = function(key, id, preset, missingColor, type) {
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
			document.getElementById("missing_colorPref_"+key).value = missingColor; 
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
			document.getElementById("missing_colorPref_"+key).value = csTemp.getRgbToHex(csTemp.getColor("Missing")); 
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
	if (key !== 'NONE') {
		document.getElementById(key).style.display="block";
	}
}

/**********************************************************************************
 * FUNCTION - hideAllClassDivs: This function hides all covariate panels in 
 * anticipation of a new one being displayed.
 **********************************************************************************/
NgChmGui.COV.hideAllClassDivs = function() {
	var classBtn = document.getElementById("classPref_list");
	for (var i=0; i<classBtn.length; i++){
		var selectedDivId = classBtn.options[i].value;
		if (selectedDivId !== 'NONE') {
			document.getElementById(selectedDivId).style.display = 'none';
		}
	}
}

NgChmGui.COV.applyCovariateSettings = function() {
	var req = new XMLHttpRequest();
	NgChmGui.COV.applyClassPrefs();
	var formData = JSON.stringify(NgChmGui.mapProperties);  
	req.open("POST", "ProcessCovariate", true);
	req.setRequestHeader("Content-Type", "application/json");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
			if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to process covariate changes '  + req.status);
	            NgChmGui.UTIL.matrixLoadingError();
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	result = req.response;
	        	pieces = result.trim().split("|");
	        	NgChm.UTIL.embedCHM(pieces[1], pieces[0]);
	    		NgChm.postLoad = function () {
	    			NgChm.heatMap.addEventListener(function (event, level) {
	    				if (event == NgChm.MMGR.Event_INITIALIZED) {
	    					document.getElementById('detail_chm').style.width = '4%';
	    					document.getElementById('summary_chm').style.width = '96%';
	    					NgChm.SUM.summaryResize();  
	    		   		 }
	    			});	
	    		};	
//	        	window.open("/NGCHM_GUI_Builder/NGCHMBuilder_Cluster.html","_self")
		    }
		}
	};
	req.send(formData);
}

NgChmGui.COV.processCovariates = function() {
/*	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("covar_frm") );
	if (validMatrix) {
		req.open("POST", "Cluster", true);
		req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		req.onreadystatechange = function () {
    		if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
    			if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
    			if (NgChmGui.UTIL.debug) {console.log('not 200');}
		            console.log('Failed to process matrix '  + req.status);
		            NgChmGui.UTIL.matrixLoadingError();
		        } else {
    				if (NgChmGui.UTIL.debug) {console.log('200');}
		        	window.open("/NGCHM_GUI_Builder/NGCHMBuilder_Cluster.html","_self")
			    }
			}
		};
		req.send(matrixJson);
	}  */
	window.open("/NGCHM_GUI_Builder/NGCHMBuilder_Cluster.html","_self")
}

