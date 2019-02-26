//Define Namespace for NgChmGui Palette
NgChmGui.createNS('NgChmGui.PALETTE'); 

NgChmGui.PALETTE.userPalettes = "";
NgChmGui.PALETTE.config = null;
NgChmGui.PALETTE.workingColorMap = null;

/**********************************************************************************
 * FUNCTION - customColorPalette: This function builds the color palette screen
 * model screen.  It calls 2 other functions to build the Palette Selections and 
 * Palette Creation panels.
 **********************************************************************************/
NgChmGui.PALETTE.customColorPalette = function(type) {
	NgChmGui.PALETTE.config = type;
	var colorMap = null;
	if (NgChmGui.PALETTE.config.type === 'matrix') {
		NgChmGui.PALETTE.workingColorMap = Object.assign({}, NgChmGui.mapProperties.matrix_files[0].color_map);
	} else {
		NgChmGui.PALETTE.workingColorMap = Object.assign({}, NgChmGui.COV.getColorMapByIdx(NgChmGui.PALETTE.config.idx));
	}
	//Create a message box modal panel and set the title
	var msgBox = document.getElementById('message');
	msgBox.innerHTML = "<div class='messageHdr' id='messageHdr'></div><table style='width: 490px'><tbody><tr class='chmTR'><td><div id='messageTxt' width='490px' style='display: inherit;font-size: 12px; background-color: rgb(230, 240, 255);'></td></tr><tr><td><div id='messageError' width='490px' style='display: inherit;font-size: 12px; background-color: rgb(230, 240, 255);'></div></td></tr><table><tbody><tr><td align='left'><img id='messageBtnImg_1' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' align='top' style='display: inherit;'></td><td align='left'><img id='messageBtnImg_2' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' align='top' style='display: inherit;'></td><td><img id='messageBtnImg_3' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' align='top' style='display: inherit;'></td></tr></tbody></table></td></tr></tbody></table>";
	NgChmGui.UTIL.setMessageBoxHeader("Select Custom Color Palette");
	//Create panel for selecting from existing palettes
	var paletteSelectionDiv = NgChmGui.PALETTE.getPaletteSelectionPanel();
	messageTxt.appendChild(paletteSelectionDiv);
	document.getElementById('customPalette_list').selectedIndex = 0;
	//Create panel for creating new palettes. Structure: Outer DIV->Form->Inner Colors DIV
	var paletteAdd = NgChmGui.UTIL.getDivElement("paletteAdd");
	paletteAdd.style.display = 'none';
	var formElem = document.createElement("FORM");   	
	formElem.id = "palette_add";
	formElem.method = "POST";
	formElem.enctype = "multipart/form-data";
	formElem.onsubmit = "return false;"
	var colorPrefsDiv = NgChmGui.PALETTE.getPaletteColorsPanel();
	formElem.innerHTML = colorPrefsDiv.innerHTML;
	paletteAdd.appendChild(formElem);
	messageTxt.appendChild(paletteAdd);
	//Add action buttons to bottom of modal panel and display
	NgChmGui.UTIL.setMessageBoxButton(1, "images/cancelButtonRound.png", "", "NgChmGui.PALETTE.paletteCancel");
	NgChmGui.UTIL.setMessageBoxButton(2, "images/selectButtonRound.png", "", "NgChmGui.PALETTE.paletteApply");
	NgChmGui.UTIL.setMessageBoxButton(3, "images/saveButtonRound.png", "", "NgChmGui.PALETTE.paletteSave");
	document.getElementById('message').style.display = '';
	document.getElementById('messageBtnImg_3').style.display = 'none';
	NgChm.UTIL.dragElement(document.getElementById("message"));
}

/**********************************************************************************
 * FUNCTION - getPaletteSelectionPanel: This function builds the Palette Selections  
 * panel.  A DIV is created and populated with a TABLE containing a cell containing
 * a SELECT of all existing palettes and a cell containing information for the 
 * selected item in the list.
 **********************************************************************************/
NgChmGui.PALETTE.getPaletteSelectionPanel = function() {
	var paletteSelection = NgChmGui.UTIL.getDivElement("paletteSelection");
	paletteSelection.style.display = '';
	var paletteSelectionTable = document.createElement("TABLE"); 
	NgChmGui.UTIL.addBlankRow(paletteSelectionTable);
	paletteSelectionTable.id = "paletteSelectionTable";
	paletteSelectionTable.className = "breakPrefsTable";
	var newPaletteButton = "<img id='newPaletteButton' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/createColorPalette.png' alt='Create new color palette' onclick='NgChmGui.PALETTE.showPalettes();' align='top'/>"

	if (NgChmGui.PALETTE.userPalettes.length > 0) {
		    var palettePreview = "";
		    var previewColors = "";
		    var paletteOptions = "";
		    var validPaletteCtr = 0;
			for (var i = 0;i < NgChmGui.PALETTE.userPalettes.length; i++) {
				var currPalette = NgChmGui.PALETTE.userPalettes[i];
				if (currPalette.type === NgChmGui.PALETTE.config.type) {
					if (validPaletteCtr === 0) {
						palettePreview = "<div id='palettePreview' style='display:flex'><div id='palettePreviewColors' class='preDefPalette' style='background: linear-gradient(to right, "+NgChmGui.PALETTE.paletteColorList(currPalette)+");' > </div>" +
						"<div class='preDefPaletteMissingColor' style='background:"+currPalette.missing+"'></div></div>";
						var palettePreviewTable = "<table><tr class='chmTR'><td><b>Palette Name:</b></td><td><div id='paletteName'>"+currPalette.name+"</div></td></tr><tr class='chmTR'><td><b>Preview:</b></td><td>"+palettePreview+"</td></tr><tr class='chmTR'><td><b>Color Type:</b></td><td>"+NgChmGui.PALETTE.config.type+"</td></tr><tr class='chmTR'><td><b>Number of Colors:</b></td><td><div id='paletteColorCnt'>"+currPalette.colors.length+"</div></td></tr>";
					}
					paletteListItem = "style='background: linear-gradient(to right, "+ NgChmGui.PALETTE.paletteColorList(currPalette) + ");'";
					paletteOptions += "<option value='"+currPalette.name+"'"+paletteListItem+">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</option>";
					validPaletteCtr++;
				}
			}
		    var dropSize = validPaletteCtr < 2 ? 2 : validPaletteCtr;
		    dropSize = dropSize > 8 ? 8 : validPaletteCtr;
		    var paletteSelect = "<select name='customPalette_list' id='customPalette_list' size='"+dropSize+"' style='font-size: 12px;' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.PALETTE.setPalettePreview(this.value)'>"
			paletteSelect = paletteSelect+paletteOptions+"</select>";
			NgChmGui.UTIL.setTableRow(paletteSelectionTable, ["Choose a Palette:"]);
			NgChmGui.UTIL.setTableRow(paletteSelectionTable, [paletteSelect, palettePreviewTable]);
			
	}
	NgChmGui.UTIL.addBlankRow(paletteSelectionTable);
	NgChmGui.UTIL.setTableRow(paletteSelectionTable, [newPaletteButton]);
	paletteSelection.appendChild(paletteSelectionTable);

	return paletteSelection;
}

/**********************************************************************************
 * FUNCTION - getPaletteColorsPanel: This function builds the Palette Creation  
 * panel.  A DIV is created and populated with a TABLE containing the colors of
 * the selected color palette on the Selection panel.  Buttons are added so that 
 * the user may add/remove colors from the palette.
 **********************************************************************************/
NgChmGui.PALETTE.getPaletteColorsPanel = function() {
	//Create outer DIV for the PaletteColors panel
	var paletteColors = NgChmGui.UTIL.getDivElement("paletteColors");
	//Create a TABLE object to hold the colors/buttons grid
	var paletteColorsTable = document.createElement("TABLE"); 
	NgChmGui.UTIL.addBlankRow(paletteColorsTable);
	paletteColorsTable.id = "paletteColorsTable";
	paletteColorsTable.className = "breakPrefsTable";
	var colors = NgChmGui.PALETTE.workingColorMap.colors;
	var missing = NgChmGui.PALETTE.workingColorMap.missing;
	var categories = NgChmGui.PALETTE.workingColorMap.thresholds;
	//Create HTML for palette name data input and add it to TABLE
	var nameInput = "<input id='newPaletteName'  name='newPaletteName' maxlength='40' size='40' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.PALETTE.clearErrorMessage();'></input>";
	NgChmGui.UTIL.setTableRow(paletteColorsTable, ["Palette Name:", nameInput]); 
	
	//Build the palette colors/buttons table rows and add to TABLE
	NgChmGui.UTIL.setTableRow(paletteColorsTable, ["<div class='catDiv' style='display: none'><u><b>Categories</b></u></div>","<u><b>Palette Colors</b></u>","&nbsp;"]); 
	for (var j = 0; j < colors.length; j++) {
		var color = colors[j];
		var colorId = "paletteColor_"+j;
		var categoryId = "paletteCategory_"+j;
		var categoryInput = "<div class='catDiv' id='"+categoryId+"'style='display: none'>"+categories[j]+"</div>";
		var colorInput = "<input class='spectrumColor' type='color' name='"+colorId+"' id='"+colorId+"' value='"+color+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.PALETTE.changePaletteColor();'>"; 
		var addButton = "<img id='paletteColorAdd_"+colorId+"' class='colorButton' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/plusButton.png' alt='Add Color' onclick='NgChmGui.PALETTE.addPaletteColor("+j+");' align='top'/>";
		var delButton = "<img id='paletteColorDel_"+colorId+"' class='colorButton' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' src='images/minusButton.png' alt='Remove Color' onclick='NgChmGui.PALETTE.delPaletteColor("+j+");' align='top'/>";
		if (NgChmGui.PALETTE.config.type !== 'continuous') {
			if (j === 0) {
				NgChmGui.UTIL.setTableRow(paletteColorsTable, [categoryInput, colorInput+"&nbsp;&nbsp;&nbsp;"+addButton]);
			} else {
				NgChmGui.UTIL.setTableRow(paletteColorsTable, [categoryInput, colorInput+"&nbsp;&nbsp;&nbsp;"+addButton+"&nbsp;"+delButton]);
			}
		} else {
			NgChmGui.UTIL.setTableRow(paletteColorsTable, [categoryInput, colorInput]);
		}
	} 
	NgChmGui.UTIL.addBlankRow(paletteColorsTable);
	NgChmGui.UTIL.setTableRow(paletteColorsTable, ["&nbsp;Missing Color:",  "<input class='spectrumColor' type='color' name='missing_paletteColor' id='missing_paletteColor' value='"+missing+"' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onchange='NgChmGui.PALETTE.changeMissingColor();'>"]);
	var showCategory = "<div id='showCategoryDiv' class='chmTR'><b>Set Category Colors:&nbsp;&nbsp;&nbsp;</b><input type='checkbox' id='showCategory' name='showCategory' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' onclick='NgChmGui.PALETTE.showHideCategories();' unchecked></input></div>";
	if (NgChmGui.PALETTE.config.type === 'discrete') {
		NgChmGui.UTIL.setTableRow(paletteColorsTable, [showCategory],2);
	}
	//Hidden input for storing color map JSON
	var paletteType = "<input id='paletteType' name='paletteType' style='display: none' ></input>";
	NgChmGui.UTIL.setTableRow(paletteColorsTable, [paletteType]);
	var paletteInput = "<input id='paletteContent' name='paletteContent' style='display: none' ></input>";
	NgChmGui.UTIL.setTableRow(paletteColorsTable, [paletteInput]);
	paletteColors.appendChild(paletteColorsTable);

	return paletteColors;
}

/**********************************************************************************
 * FUNCTION - showHideCategories: This function shows/hides category data entry
 * fields for categorical discrete color palettes.
 **********************************************************************************/
NgChmGui.PALETTE.showHideCategories = function () {
	var isChecked = document.getElementById("showCategory").checked;
	var elements = document.getElementsByClassName('catDiv');
	var remElems = new Array();
	var paletteTable = document.getElementById("paletteColorsTable");
	for (var i=0;i<elements.length;i++) {
		var currElem = elements[i];
		if (isChecked === true) {
			currElem.style.display = '';
			//If there is no category value for table row, mark for later deletion
			if (currElem.innerHTML === 'undefined') {
				remElems.push(currElem.parentElement.parentElement.rowIndex);
			}
		} else {
			currElem.style.display = 'none';
		}
	}
	var elements = document.getElementsByClassName('colorButton');
	for (var i=0;i<elements.length;i++) {
		var currElem = elements[i];
		if (isChecked === true) {
			currElem.style.display = 'none';
		} else {
			currElem.style.display = '';
		}
	}
	//If categorical, remove color entry rows for categories that exceed length of available categories
	for (var j=0;j<remElems.length;j++) {
		var paletteTable = document.getElementById("paletteColorsTable");
		paletteTable.deleteRow((remElems[j] - j));
	}
}

/**********************************************************************************
 * FUNCTION - showPalettes: This function shows the appropriate panel SELECTION/CREATION
 * based upon the visibility when the "create palette" or create palette panel's
 * cancel button are pressed.  IF coming from Selection Panel we show the Creation 
 * Panel. If coming from Creation (cancel), we show Selection Panel.
 **********************************************************************************/
NgChmGui.PALETTE.showPalettes = function () {
	var selectionDiv = document.getElementById('paletteSelection');
	var colorsDiv = document.getElementById('paletteAdd');
	if (NgChmGui.PALETTE.isPaletteAdd() === true) {
		NgChmGui.UTIL.getDivElement("paletteColors");
		NgChmGui.UTIL.setMessageBoxHeader("Select Custom Color Palette");
		selectionDiv.style.display = '';
		colorsDiv.style.display = 'none';
		document.getElementById('messageBtnImg_2').style.display = '';
		document.getElementById('messageBtnImg_3').style.display = 'none';
	} else {
		NgChmGui.UTIL.setMessageBoxHeader("Create Custom Color Palette");
		selectionDiv.style.display = 'none';
		colorsDiv.style.display = '';
		document.getElementById('messageBtnImg_2').style.display = 'none';
		document.getElementById('messageBtnImg_3').style.display = '';
	}
}

/**********************************************************************************
 * FUNCTION - isPaletteAdd: This function checks to see if we are on the Create
 * Palette panel and returns a boolean.
 **********************************************************************************/
NgChmGui.PALETTE.isPaletteAdd = function () {
	if (document.getElementById('paletteSelection').style.display === 'none') {
		return true;
	} else {
		return false;
	}
}

/**********************************************************************************
 * FUNCTION - clearErrorMessage: This function clears out any error messages on
 * the modal window.
 **********************************************************************************/
NgChmGui.PALETTE.clearErrorMessage = function () {
	var msgDiv = document.getElementById('messageError');
	msgDiv.innerHTML = "";
}

/**********************************************************************************
 * FUNCTION - paletteApply: This function applies the selected color palette to the
 * color palette displayed on the calling (FORMAT/COVARIATE) screen and closes the
 * modal palette window.
 **********************************************************************************/
NgChmGui.PALETTE.paletteApply = function () {
	NgChmGui.PALETTE.clearErrorMessage();
	var currPalette = NgChmGui.PALETTE.getSelectedPalette();
	if (NgChmGui.PALETTE.config.type === 'matrix') {
		NgChmGui.FORMAT.setBreaksToPreset(currPalette.colors,currPalette.missing);
	} else {
		NgChmGui.COV.setBreaksToPalette(NgChmGui.PALETTE.config.key, NgChmGui.PALETTE.config.idx, currPalette.colors, currPalette.missing, NgChmGui.PALETTE.config.type);
	}
	NgChmGui.UTIL.messageBoxCancel();	
}

/**********************************************************************************
 * FUNCTION - paletteSave: This function saves the user edited palette to the server
 * and returns control to the palette selection panel.
 **********************************************************************************/
NgChmGui.PALETTE.paletteSave = function () {
	NgChmGui.PALETTE.clearErrorMessage();
	var paletteName = document.getElementById('newPaletteName').value;
	var msgDiv = document.getElementById('messageError');
	var isValid = NgChmGui.PALETTE.validatePaletteName(paletteName);
	if (isValid === 'duplicate') {
		msgDiv.innerHTML = "ERROR: Duplicate Palette Name. Please enter a different name for the palette.";
		return;
	} else if (isValid === 'empty') {
		msgDiv.innerHTML = "ERROR: No Palette Name. Please enter a name for the palette.";
		return;
	}
	NgChmGui.PALETTE.buildPaletteJSON();
	NgChmGui.PALETTE.saveColorPalette(NgChmGui.UTIL.messageBoxCancel);
	
}

/**********************************************************************************
 * FUNCTION - paletteCancel: This function forks processing for the cancel button
 * depending upon the panel that is visible. If Selection, clear the modal dialog
 * ELSE return to the Selection Panel.
 **********************************************************************************/
NgChmGui.PALETTE.paletteCancel = function () {  
	NgChmGui.PALETTE.clearErrorMessage()
	if (NgChmGui.PALETTE.isPaletteAdd() === true) {
		NgChmGui.PALETTE.showPalettes();
	} else {
		NgChmGui.UTIL.messageBoxCancel();
	}
}

/**********************************************************************************
 * FUNCTION - getSelectedPalette: This function returns the palette object for the
 * palette that has been in the palette list on the Selection Panel.
 **********************************************************************************/
NgChmGui.PALETTE.getSelectedPalette = function () {
	var paletteList = document.getElementById('customPalette_list'); 
	var selPalette = paletteList.options[paletteList.selectedIndex].value;
	var currPalette = NgChmGui.PALETTE.getPalette(selPalette);
	return currPalette;
}

/**********************************************************************************
 * FUNCTION - setSelectedPalette: This function sets the selected palette on the
 * palette selection screen to that of the name passed in.
 **********************************************************************************/
NgChmGui.PALETTE.setSelectedPalette = function (name) {
	var paletteList = document.getElementById('customPalette_list'); 
	for (var i=0;i<paletteList.options.length;i++) {
		var currOpt = paletteList.options[i];
		if (currOpt.value === name) {
			paletteList.options[i].selected = true;
			break;
		}
	}
}

/**********************************************************************************
 * FUNCTION - paletteColorList: This function get the colors list from the palette 
 * and returns it as a comma-delimited string.
 **********************************************************************************/
NgChmGui.PALETTE.paletteColorList = function (palette) {
	var colorList = "";
	for (var j=0;j<palette.colors.length;j++) {
		var currColor = palette.colors[j];
		colorList += currColor + ",";
	}
 return colorList.substring(0,colorList.length - 1);
}

/**********************************************************************************
 * FUNCTION - getPalette: This function returns a palette object using the palette
 * name.
 **********************************************************************************/
NgChmGui.PALETTE.getPalette = function (paletteName) {
	var currPalette = null;
	for (var i = 0;i < NgChmGui.PALETTE.userPalettes.length; i++) {
		currPalette = NgChmGui.PALETTE.userPalettes[i];
		if ((currPalette.name === paletteName) && (currPalette.type === NgChmGui.PALETTE.config.type)){
			break;
		}
	}
	return currPalette;
}

/**********************************************************************************
 * FUNCTION - changeMissingColor: This function adjusts the missing color in the working
 * palette when a user changes missing color. 
 **********************************************************************************/
NgChmGui.PALETTE.changeMissingColor = function () {
	NgChmGui.PALETTE.workingColorMap.missing = document.getElementById('missing_paletteColor').value;
}

/**********************************************************************************
 * FUNCTION - changePaletteColor: This function adjusts the colors in the working
 * palette when a user changes a color. 
 **********************************************************************************/
NgChmGui.PALETTE.changePaletteColor = function () {
	var colorCtr = 0;
	var newColors = [];
	var colorItem = document.getElementById('paletteColor_'+colorCtr);
	while (colorItem !== null) {
		newColors.push(colorItem.value);
		colorCtr++;
		colorItem = document.getElementById('paletteColor_'+colorCtr);
	}
	NgChmGui.PALETTE.workingColorMap.colors = newColors;
}

/**********************************************************************************
 * FUNCTION - addPaletteColor: This function adds a color to the Palette Creation Panel
 * when the user pressed the "+" button.
 **********************************************************************************/
NgChmGui.PALETTE.addPaletteColor = function (idx) {
	var formElem = document.getElementById('palette_add');
	var colors = NgChmGui.PALETTE.workingColorMap.colors;
	var colorScheme = {"missing": "#000000","thresholds": ["1"],"colors": ["#FFFFFF"],"type": "continuous"};
	var csTemp = new NgChmGui.CM.ColorMap(colorScheme);
	var newColors = [];
	for (var i=0;i<colors.length;i++) {
		var color = colors[i];
		newColors.push(color);
		if (i === idx) {
			//Darken new color to be added using color next to add button
			var newColorVal = csTemp.darkenColor(color);
			newColors.push(newColorVal);
		}
	}
	NgChmGui.PALETTE.workingColorMap.colors = newColors;
	formElem.innerHTML = "";
	var colorPrefsDiv = NgChmGui.PALETTE.getPaletteColorsPanel();
	formElem.innerHTML = colorPrefsDiv.innerHTML;
}

/**********************************************************************************
 * FUNCTION - delPaletteColor: This function removes a color to the Palette Creation 
 * Panel when the user pressed the "-" button.
 **********************************************************************************/
NgChmGui.PALETTE.delPaletteColor = function (idx) {
	var formElem = document.getElementById('palette_add');
	var colors = NgChmGui.PALETTE.workingColorMap.colors;
	var newColors = [];
	for (var i=0;i<colors.length;i++) {
		var color = colors[i];
		if (i !== idx) {
			newColors.push(color);
		}
	}
	NgChmGui.PALETTE.workingColorMap.colors = newColors;
	formElem.innerHTML = "";
	var colorPrefsDiv = NgChmGui.PALETTE.getPaletteColorsPanel();
	formElem.innerHTML = colorPrefsDiv.innerHTML;
}

/**********************************************************************************
 * FUNCTION - setPalettePreview: This function resets the contents of the Palette 
 * Preview (right side) on the Palette Selection Panel.  It fires when the user
 * clicks on the list on the left side of the panel.
 **********************************************************************************/
NgChmGui.PALETTE.setPalettePreview = function (nameVal) {
	var preview = document.getElementById('palettePreview');
	var paletteDesc = document.getElementById('paletteName');
	var paletteDesc = document.getElementById('paletteName');
	var paletteColors = document.getElementById('paletteColorCnt');
	var paletteName = nameVal;
	var currPalette = NgChmGui.PALETTE.getPalette(paletteName);
	var palettePreview = "<div id='palettePreviewColors' class='preDefPalette' style='background: linear-gradient(to right, "+NgChmGui.PALETTE.paletteColorList(currPalette)+");' > </div>" +
	"<div class='preDefPaletteMissingColor' style='background:"+currPalette.missing+"'></div>";
	paletteDesc.innerHTML = currPalette.name;
	paletteColors.innerHTML = currPalette.colors.length;
	preview.innerHTML =  palettePreview;
}

/**********************************************************************************
 * FUNCTION - buildPaletteJSON: This function builds the JSON for a palette that 
 * has been constructed on the palette Creation Panel. It is called when the user
 * hits the Apply button when that panel is visible. 
 **********************************************************************************/
NgChmGui.PALETTE.buildPaletteJSON = function() {
	var palette = NgChmGui.PALETTE.workingColorMap;
	var paletteName = document.getElementById('newPaletteName').value;
	paletteName.name = paletteName;
	var paletteJSON = "{ \"name\": \"" + paletteName + "\", \"type\": \"" + NgChmGui.PALETTE.config.type + "\",\"colors\": ";
	var paletteContents = "[";
	for (var i=0;i<palette.colors.length;i++) {
		var currColor = palette.colors[i];
		if (i > 0) {
			paletteContents += ",";
		}
		paletteContents += "\""+currColor+"\"";
	}
	paletteJSON += paletteContents + "], \"missing\": \"" + palette.missing + "\"}";
	document.getElementById('paletteContent').value = paletteJSON;
	document.getElementById('paletteType').value = NgChmGui.PALETTE.config.type;
	return;
}

/**********************************************************************************
 * FUNCTION - getUserPalettes: This function calls the ProcessColorPalette servlet,
 * using GET, to retrieve a list of saved color palettes on the server.
 **********************************************************************************/
NgChmGui.PALETTE.getUserPalettes = function (selection) {
	var req = new XMLHttpRequest();
	req.open("GET", "ProcessColorPalette", true);
	req.onreadystatechange = function () {
  	NgChmGui.UTIL.hideLoading();
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	    		NgChmGui.UTIL.hideLoading();
	            console.log('Failed to upload covariate '  + req.status);
	        } else {
	        	NgChmGui.PALETTE.userPalettes = JSON.parse(req.response);
	        	if (selection !== undefined) {
	        		NgChmGui.PALETTE.customColorPalette(NgChmGui.PALETTE.config);
	        		NgChmGui.PALETTE.setSelectedPalette(selection);
	        		NgChmGui.PALETTE.setPalettePreview(selection);
	        	}
	        }
		}
	};
	req.send();
}

/**********************************************************************************
 * FUNCTION - validatePaletteName: This function checks for a duplicate palette name. 
 **********************************************************************************/
NgChmGui.PALETTE.validatePaletteName = function(name) {
	var isValid = 'valid';
	name = name.trim();
	if (name === '') {
		return 'empty';
	}
	for (var i=0;i<NgChmGui.PALETTE.userPalettes.length;i++) {
		var currPalette = NgChmGui.PALETTE.userPalettes[i];
		if ((name === currPalette.name) && (currPalette.type === NgChmGui.PALETTE.config.type)) {
			return 'duplicate';
		}
	}
	return 'valid';
}

/**********************************************************************************
 * FUNCTION - saveColorPalette: This function calls the ProcessColorPalette servlet,
 * using POST, to save a user created color palette. 
 **********************************************************************************/
NgChmGui.PALETTE.saveColorPalette = function(nextFunction) {
	var req = new XMLHttpRequest();
	var paletteName = document.getElementById('newPaletteName').value;
	var paletteContent = document.getElementById('paletteContent').value;
	var formElem = document.getElementById("palette_add");
	var formData = new FormData(formElem);
	req.open("POST", "ProcessColorPalette", true);
	req.onreadystatechange = function () {
  	NgChmGui.UTIL.hideLoading();
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	    		NgChmGui.UTIL.hideLoading();
	            console.log('Failed to upload covariate '  + req.status);
	        } else {
	        	var props = JSON.parse(req.response);
	        	if (NgChmGui.UTIL.validSession()) {
	        		nextFunction();
	        		NgChmGui.PALETTE.userPalettes = null;
	        		NgChmGui.PALETTE.getUserPalettes(paletteName);
	        	}
	        }
		}
	};
	NgChmGui.UTIL.showLoading();
	req.send(formData);
}

