//Define Namespace for NgChmGui Covariate File Page
NgChmGui.createNS('NgChmGui.FORMAT');

/**********************************************************************************
 * FUNCTION - loadData: This function will be executed when the covariates page
 * is opened for the first time.  It loads the header, sets up the left data 
 * entry panel, and calls functions that loads covariate preferences into data
 * entry panels.  
 **********************************************************************************/
NgChmGui.FORMAT.loadData =  function() {
	if (NgChmGui.UTIL.loadHeaderData()) {
		var prefsPanelDiv = document.getElementById("preferencesPanel");
		prefsPanelDiv.style.left = 0;
		prefsPanelDiv.style.right = "";
		var formatPrefsDiv = NgChmGui.FORMAT.setupFormatTasks();
//		NgChmGui.COV.setFormatTaskOptions();
		NgChmGui.UTIL.loadHeatMapView();
		formatPrefsDiv.style.display = '';
		prefsPanelDiv.style.display = '';
	}
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
	var formatTaskStr = "<select name='formatTask_list' id='formatTask_list' onchange='NgChmGui.FORMAT.showFormatSelection();'><option value='matrix_colors'>Matrix Colors/Breaks</option><option value='map_gaps'>Heat Map Gaps</option><option value='top_items'>Top Label Items</option></select>"
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;Format Tasks: ", formatTaskStr]);
	NgChmGui.UTIL.addBlankRow(prefContents, 2);
	formatPrefsDiv.appendChild(prefContents);
	prefsPanelDiv.appendChild(formatPrefsDiv);
	var colorMap = NgChmGui.FORMAT.getColorMapFromConfig();
	var colorPrefsDiv = NgChmGui.FORMAT.setupMatrixColorPrefs(colorMap)
	formatPrefsDiv.appendChild(colorPrefsDiv);
	var gapPrefsDiv = NgChmGui.FORMAT.setupGapPrefs()
	formatPrefsDiv.appendChild(gapPrefsDiv);
	var topItemsPrefsDiv = NgChmGui.FORMAT.setupTopItemsPrefs()
	formatPrefsDiv.appendChild(topItemsPrefsDiv);
	return formatPrefsDiv; 
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
 * FUNCTION - setupGapPrefs: This function sets up the DIV panel for displaying
 * heat map gap preferences.
 **********************************************************************************/
NgChmGui.FORMAT.setupGapPrefs = function() {
	var gapPrefs = NgChmGui.UTIL.getDivElement("map_gaps");
	var prefContents = document.createElement("TABLE");
	var colorMap = NgChmGui.mapProperties.matrix_files[0].color_map;
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;<b>No Gaps Assigned</b>"]);
	NgChmGui.UTIL.addBlankRow(prefContents);
	gapPrefs.appendChild(prefContents);
	gapPrefs.className = 'preferencesSubPanel';
	gapPrefs.style.display='none';
	return gapPrefs;
}

/**********************************************************************************
 * FUNCTION - setupGapPrefs: This function sets up the DIV panel for displaying
 * heat top item preferences.
 **********************************************************************************/
NgChmGui.FORMAT.setupTopItemsPrefs = function() {
	var topItemsPrefs = NgChmGui.UTIL.getDivElement("top_items");
	var prefContents = document.createElement("TABLE");
	var colorMap = NgChmGui.mapProperties.matrix_files[0].color_map;
	NgChmGui.UTIL.addBlankRow(prefContents);
	NgChmGui.UTIL.setTableRow(prefContents,["&nbsp;&nbsp;<b>No Top Items Assigned</b>"]);
	NgChmGui.UTIL.addBlankRow(prefContents);
	topItemsPrefs.appendChild(prefContents);
	topItemsPrefs.className = 'preferencesSubPanel';
	topItemsPrefs.style.display='none';
	return topItemsPrefs;
}

/**********************************************************************************
 * FUNCTION - setupGapPrefs: This function sets up the DIV panel for displaying
 * matrix breakpoint/color preferences.
 **********************************************************************************/
NgChmGui.FORMAT.setupMatrixColorPrefs = function(colorMap) {
	var matrixPrefs = NgChmGui.UTIL.getDivElement("matrix_colors");
	var breakpts = NgChmGui.FORMAT.getBreaksFromColorMap(colorMap);
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
NgChmGui.FORMAT.getBreaksFromColorMap = function(colorMap) {
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
		var breakPtInput = "&nbsp;&nbsp;<input name='"+threshId+"_breakPref' id='"+threshId+"_breakPref' value='"+threshold+"' maxlength='8' size='8'>";
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"_colorPref' id='"+colorId+"_colorPref' value='"+color+"'>"; 
		var addButton = "<img id='"+threshId+"_breakAdd' src='images/plusButton.png' alt='Add Breakpoint' onclick='NgChmGui.FORMAT.processLayerBreak("+j+",\"add\");' align='top'/>"
		var delButton = "<img id='"+threshId+"_breakDel' src='images/minusButton.png' alt='Remove Breakpoint' onclick='NgChmGui.FORMAT.processLayerBreak("+j+",\"delete\");' align='top'/>"
		if (j === 0) {
			NgChmGui.UTIL.setTableRow(breakpts, [breakPtInput, colorInput+"&nbsp;&nbsp;&nbsp;"+addButton]);
		} else {
			NgChmGui.UTIL.setTableRow(breakpts, [breakPtInput,  colorInput+"&nbsp;&nbsp;&nbsp;"+addButton+"&nbsp;"+delButton]);
		}
	} 
	NgChm.UHM.addBlankRow(breakpts)
	NgChm.UHM.setTableRow(breakpts, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_colorPref' id='missing_colorPref' value='"+missing+"'>"]);
	NgChmGui.UTIL.addBlankRow(breakpts)
	NgChmGui.UTIL.setTableRow(breakpts, ["&nbsp;<u>Choose a pre-defined color palette:</u>"],2);
	var rainbow = "<div style='display:flex'><div id='setROYGBV' class='presetPalette' style='background: linear-gradient(to right, red,orange,yellow,green,blue,violet);' onclick='NgChmGui.FORMAT.setBreaksToPreset([\"#FF0000\",\"#FF8000\",\"#FFFF00\",\"#00FF00\",\"#0000FF\",\"#FF00FF\"],\"#000000\")' > </div>" +
			"<div class='presetPaletteMissingColor' style='background:black'></div></div>";
	var redWhiteBlue = "<div style='display:flex'><div id='setRedWhiteBlue' class='presetPalette' style='background: linear-gradient(to right, blue,white,red);' onclick='NgChmGui.FORMAT.setBreaksToPreset([\"#0000FF\",\"#FFFFFF\",\"#ff0000\"],\"#000000\")'> </div>" +
			"<div class='presetPaletteMissingColor' style='background:black'></div></div>";
	var redBlackGreen = "<div style='display:flex'><div id='setRedBlackGreen' class='presetPalette' style='background: linear-gradient(to right, green,black,red);' onclick='NgChmGui.FORMAT.setBreaksToPreset([\"#00FF00\",\"#000000\",\"#FF0000\"],\"#ffffff\")'> </div>" +
			"<div class='presetPaletteMissingColor' style='background:white'></div></div>"
	NgChmGui.UTIL.setTableRow(breakpts, ["Blue Red", redWhiteBlue]);
	NgChmGui.UTIL.setTableRow(breakpts, ["Rainbow", rainbow]);
	NgChmGui.UTIL.setTableRow(breakpts, ["Green Red", redBlackGreen]);

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
 * FUNCTION - processLayerBreak: The purpose of this function is to add or remove
 * (based upon the type input parameter) a breakpoint row to a colorMap object based 
 * upon the table row item clicked on the matrix colors preferences. For adds, a new 
 * row is created using the preceding row as a template (i.e. breakpt value and color 
 * same as row clicked on).  For deletes, the selected row is removed. 
 **********************************************************************************/
NgChmGui.FORMAT.processLayerBreak = function(pos, type) {
	var colorMap = NgChmGui.FORMAT.getColorMapFromConfig();
	var newThresholds = NgChmGui.FORMAT.getNewBreakThresholds(colorMap, pos, type);
	var newColors = NgChmGui.FORMAT.getNewBreakColors(colorMap, pos, type);
	colorMap.setThresholds(newThresholds);
	colorMap.setColors(newColors);
	NgChmGui.FORMAT.reloadLayerBreaksColorMap(colorMap);
}

/**********************************************************************************
 * FUNCTION - reloadLayerBreaksColorMap: The purpose of this function is to reload
 * the colormap for a given data layer.  The add/deleteLayerBreak v call
 * this common function.  The layerPrefs DIV is retrieved and the setupLayerBreaks
 * method is called, passing in the newly edited colorMap. 
 **********************************************************************************/
NgChmGui.FORMAT.reloadLayerBreaksColorMap = function(colorMap) {
	var breakPrefs = document.getElementById("breakPrefsTable");
	if (breakPrefs){
		breakPrefs.remove();
	}
	var matrixColorPrefs = document.getElementById("matrix_colors");
	var breakPrefs = NgChmGui.FORMAT.getBreaksFromColorMap(colorMap);
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


/*

NgChm.UPM.setupLayerBreaks = function(e, mapName) {
	var colorMap = NgChm.heatMap.getColorMapManager().getColorMap("data",mapName);
	var thresholds = colorMap.getThresholds();
	var colors = colorMap.getColors();
	var helpprefs = NgChm.UHM.getDivElement("breakPrefs_"+mapName);
	var prefContents = document.createElement("TABLE"); 
	var dataLayers = NgChm.heatMap.getDataLayers();
	var layer = dataLayers[mapName];
	var gridShow = "<input name='"+mapName+"_gridPref' id='"+mapName+"_gridPref' type='checkbox' ";
	if (layer.grid_show == 'Y') {
		gridShow = gridShow+"checked"
	}
	gridShow = gridShow+ " >";
	var gridColorInput = "<input class='spectrumColor' type='color' name='"+mapName+"_gridColorPref' id='"+mapName+"_gridColorPref' value='"+layer.grid_color+"'>"; 
	var selectionColorInput = "<input class='spectrumColor' type='color' name='"+mapName+"_selectionColorPref' id='"+mapName+"_selectionColorPref' value='"+layer.selection_color+"'>"; 
	NgChm.UHM.addBlankRow(prefContents, 2)
	NgChm.UHM.setTableRow(prefContents, ["&nbsp;<u>Breakpoint</u>", "<u><b>Color</b></u>","&nbsp;"]); 
	var breakpts = document.createElement("TABLE"); 
	breakpts.id = "breakPrefsTable_"+mapName;
	for (var j = 0; j < thresholds.length; j++) {
		var threshold = thresholds[j];    
		var color = colors[j];
		var threshId = mapName+"_breakPt"+j;
		var colorId = mapName+"_color"+j;
		var breakPtInput = "&nbsp;&nbsp;<input name='"+threshId+"_breakPref' id='"+threshId+"_breakPref' value='"+threshold+"' maxlength='8' size='8'>";
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"_colorPref' id='"+colorId+"_colorPref' value='"+color+"'>"; 
		var addButton = "<img id='"+threshId+"_breakAdd' src='images/plusButton.png' alt='Add Breakpoint' onclick='NgChm.UPM.addLayerBreak("+j+",\""+mapName+"\");' align='top'/>"
		var delButton = "<img id='"+threshId+"_breakDel' src='images/minusButton.png' alt='Remove Breakpoint' onclick='NgChm.UPM.deleteLayerBreak("+j+",\""+mapName+"\");' align='top'/>"
		if (j === 0) {
			NgChm.UHM.setTableRow(breakpts, [breakPtInput, colorInput, addButton]);
		} else {
			NgChm.UHM.setTableRow(breakpts, [breakPtInput,  colorInput, addButton+ delButton]);
		}
	} 
	NgChm.UHM.setTableRow(prefContents, [breakpts.outerHTML],3);
	NgChm.UHM.addBlankRow(prefContents)
	NgChm.UHM.setTableRow(prefContents, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='"+mapName+"_missing_colorPref' id='"+mapName+"_missing_colorPref' value='"+colorMap.getMissingColor()+"'>"]);
	NgChm.UHM.addBlankRow(prefContents, 3)
	// predefined color schemes put here
	NgChm.UHM.setTableRow(prefContents, ["&nbsp;<u>Choose a pre-defined color palette:</u>"],3);
	NgChm.UHM.addBlankRow(prefContents);
	var rainbow = "<div style='display:flex'><div id='setROYGBV' class='presetPalette' style='background: linear-gradient(to right, red,orange,yellow,green,blue,violet);' onclick='NgChm.UPM.setupLayerBreaksToPreset(event, \""+ mapName+ "\", [\"#FF0000\",\"#FF8000\",\"#FFFF00\",\"#00FF00\",\"#0000FF\",\"#FF00FF\"],\"#000000\")' > </div>" +
			"<div class='presetPaletteMissingColor' style='background:black'></div></div>";
	var redWhiteBlue = "<div style='display:flex'><div id='setRedWhiteBlue' class='presetPalette' style='background: linear-gradient(to right, blue,white,red);' onclick='NgChm.UPM.setupLayerBreaksToPreset(event, \""+ mapName+ "\", [\"#0000FF\",\"#FFFFFF\",\"#ff0000\"],\"#000000\")'> </div>" +
			"<div class='presetPaletteMissingColor' style='background:black'></div></div>";
	var redBlackGreen = "<div style='display:flex'><div id='setRedBlackGreen' class='presetPalette' style='background: linear-gradient(to right, green,black,red);' onclick='NgChm.UPM.setupLayerBreaksToPreset(event, \""+ mapName+ "\", [\"#00FF00\",\"#000000\",\"#FF0000\"],\"#ffffff\")'> </div>" +
			"<div class='presetPaletteMissingColor' style='background:white'></div></div>"
	NgChm.UHM.setTableRow(prefContents, [ redWhiteBlue, rainbow, redBlackGreen ]);
	NgChm.UHM.setTableRow(prefContents, ["&nbsp;Blue Red",  "&nbsp;<b>Rainbow</b>","&nbsp;<b>Green Red</b>"]);
	NgChm.UHM.addBlankRow(prefContents, 3)
	NgChm.UHM.setTableRow(prefContents, ["&nbsp;Grid Lines:", gridColorInput, "<b>Show:&nbsp;&nbsp;</b>"+gridShow]); 
	NgChm.UHM.setTableRow(prefContents, ["&nbsp;Selection Color:", selectionColorInput]);
	
	NgChm.UHM.addBlankRow(prefContents, 3);
	NgChm.UHM.setTableRow(prefContents, ["&nbsp;Color Histogram:", "<button type='button' onclick='NgChm.UHM.loadColorPreviewDiv(\""+mapName+"\")'>Update</button>"]);
	var previewDiv = "<div id='previewWrapper"+mapName+"' style='display:flex; height: 100px; width: 110px;position:relative;' ></div>";//NgChm.UHM.loadColorPreviewDiv(mapName,true);
	NgChm.UHM.setTableRow(prefContents, [previewDiv]);
	NgChm.UHM.addBlankRow(prefContents, 3);
	helpprefs.style.height = prefContents.rows.length;
	helpprefs.appendChild(prefContents);
	setTimeout(function(mapName){NgChm.UHM.loadColorPreviewDiv(mapName,true)},100,mapName);
	return helpprefs;
}	






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

NgChmGui.COV.getClassKey = function (classItem) {
	return classItem.position+"_"+classItem.name;
}

NgChmGui.COV.setupCovariatePanel = function(classItem,classIdx) {
	var key =  NgChmGui.COV.getClassKey(classItem);
	var classSelect = document.getElementById('formatTask_list');
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

NgChmGui.COV.setClassPrefOptions = function(classes) {
	var classSelect = document.getElementById('formatTask_list');
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

NgChmGui.COV.openCovarUpload = function() {
	 document.getElementById("covarSelection").style.display = 'none';
	 document.getElementById("covarAdd").style.display = '';
}

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

NgChmGui.COV.loadNewCovariateBar = function() {
	document.getElementById('file-input').value = null;
	var classPrefsDiv = document.getElementById("classPrefsDiv");
	var classPrefsList = document.getElementById("formatTask_list");
	var classes = NgChmGui.mapProperties.classification_files;
	var classIdx = classes.length-1;
	var lastClass = classes[classIdx];
	var key =  NgChmGui.COV.getClassKey(lastClass);
	if (classPrefsList.options[0].value === 'classPref_NONE') {
		classPrefsList.remove(0);
		document.getElementById("classPref_NONE").style.display = 'none';
	}
	var classContentsDiv = NgChmGui.COV.setupCovariatePanel(lastClass,classIdx);
	classPrefsDiv.appendChild(classContentsDiv);
	document.getElementById('showPref_'+key).value = lastClass.show;
	if (lastClass.color_map.type === 'continuous') {
		document.getElementById('barTypePref_'+key).value = lastClass.bar_type;
	}
	classContentsDiv.style.display='none';
	NgChmGui.COV.hideCovarUpload();
	NgChmGui.COV.selectClassDropdown(key);
	NgChmGui.COV.showClassSelection();	        
}

NgChmGui.COV.selectClassDropdown = function (key) {
	var options= document.getElementById('formatTask_list').options;
	for (var i = 0;i < options.length; i++) {
	    if (options[i].value=== key) {
	        options[i].selected= true;
	        break;
	    }
	}
}

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

NgChmGui.COV.openCovarRemoval = function() {
	 var selectedBar = document.getElementById("formatTask_list");
	 var selectedBarVal = selectedBar.value; 
	 var selectedClass = NgChmGui.COV.getClassFromPanel(selectedBarVal);
	 var selectedText = selectedBar.options[selectedBar.selectedIndex].text;
	 var remLabel = document.getElementById("covarRemoveLabel").innerHTML = "Remove Covariate Bar:&nbsp;&nbsp;"+selectedClass.name+" - "+selectedClass.position;
	 document.getElementById("remCovName").value = selectedClass.name;
	 document.getElementById("remAxisType").value = selectedClass.position;
	 document.getElementById("covarSelection").style.display = 'none';
	 document.getElementById("covarRemoval").style.display = '';
	
}

NgChmGui.COV.hideCovarRemoval = function() {
	document.getElementById("covarRemoveLabel").innerHTML = "";
	document.getElementById("covarSelection").style.display = '';
	document.getElementById("covarRemoval").style.display = 'none';
}

NgChmGui.COV.removeCovariateBar = function() {
	var req = new XMLHttpRequest();
	var formData = new FormData( document.getElementById("covar_remove") );
	req.open("POST", "RemoveCovariate", true);
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	    		if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to remove covariate '  + req.status);
	        } else {
	        	NgChmGui.COV.removeCovariateBarFromScreen();
	        }
		}
	};
	req.send(formData);
}

NgChmGui.COV.removeCovariateBarFromScreen = function() {
	var classSelect = document.getElementById("formatTask_list");
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
	if (classSelect.length < 1) {
		var noClassesDiv = NgChmGui.COV.getEmptyClassesPanel();
		document.getElementById("classPrefsDiv").appendChild(noClassesDiv);
	}
	NgChmGui.COV.hideCovarRemoval();
	NgChmGui.COV.showClassSelection(0);
}

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

NgChmGui.COV.hideAllClassDivs = function() {
	var classBtn = document.getElementById("formatTask_list");
	for (var i=0; i<classBtn.length; i++){
		var selectedDivId = classBtn.options[i].value;
		document.getElementById(selectedDivId).style.display = 'none';
	}
}

NgChmGui.COV.loadCovariateView = function() {
	var req = new XMLHttpRequest();
	NgChmGui.COV.applyClassPrefs();
	req.open("POST", "HeatmapView", true);
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
	    					var sumCanvas = document.getElementById('summary_canvas');
	    					sumCanvas.style.left = '20%';
	    					sumCanvas.style.width = '55%';
	    					sumCanvas.style.height = '100%';
	    		   		 }
	    			});	
	    		};	
		    }
		}
	};
	req.send();
}

NgChmGui.COV.applyCovariateSettings = function(typ) {
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
				if (typ === 1) {
		        	result = req.response;
		        	pieces = result.trim().split("|");
		        	NgChm.UTIL.embedCHM(pieces[1], pieces[0]);
		    		NgChm.postLoad = function () {
		    			NgChm.heatMap.addEventListener(function (event, level) {
		    				if (event == NgChm.MMGR.Event_INITIALIZED) {
		    					document.getElementById('detail_chm').style.width = '4%';
		    					document.getElementById('summary_chm').style.width = '96%';
		    					NgChm.SUM.summaryResize();  
		    					var sumCanvas = document.getElementById('summary_canvas');
		    					sumCanvas.style.left = '20%';
		    					sumCanvas.style.width = '55%';
		    					sumCanvas.style.height = '100%';
		    		   		 }
		    			});	 
		    		};	
				} else {
					window.open("/NGCHM_GUI_Builder/NGCHMBuilder_Cluster.html","_self");
			    }
			}
		};
	}
	req.send(formData);
}

*/
