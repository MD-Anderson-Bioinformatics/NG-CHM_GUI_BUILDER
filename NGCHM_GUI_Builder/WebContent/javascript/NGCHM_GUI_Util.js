//
// MatrixManager is responsible for retrieving clustered heat map data.  Heat map
// data is available at different 'zoom' levels - Summary, Ribbon Vertical, Ribbon
// Horizontal, and Full.  To use this code, create MatrixManger by calling the 
// MatrixManager function.  The MatrixManager lets you retrieve a HeatmapData object
// given a heat map name and summary level.  The HeatMapData object has various
// attributes of the map including the size an number of tiles the map is broken up 
// into.  getTile() is called on the HeatmapData to get each tile of the data.  Tile
// retrieval is asynchronous so you need to provide a callback that is triggered when
// the tile is retrieved.
//

//Define Namespace for NgChm Application
var NgChmGui = NgChmGui || {
};

// Function: createNS
// This function is called from other JS files to define their individual namespaces.
NgChmGui.createNS = function (namespace) {
    var nsparts = namespace.split(".");
    var parent = NgChmGui;
 
    // we want to be able to include or exclude the root namespace so we strip
    // it if it's in the namespace
    if (nsparts[0] === "NgChmGui") {
        nsparts = nsparts.slice(1);
    }
 
    // loop through the parts and create a nested namespace if necessary
    for (var i = 0; i < nsparts.length; i++) {
        var partname = nsparts[i];
        // check if the current parent already has the namespace declared
        // if it isn't, then create it
        if (typeof parent[partname] === "undefined") {
            parent[partname] = {};
        }
        // get a reference to the deepest element in the hierarchy so far
        parent = parent[partname];
    }
    // the parent is now constructed with empty namespaces and can be used.
    // we return the outermost namespace
    return parent;
};

/**
 * General purpose javascript helper functions
 */

//Define Namespace for NgChm UTIL
NgChmGui.createNS('NgChmGui.UTIL');

NgChmGui.UTIL.maxValues = 2147483647;
NgChmGui.UTIL.minValues = -2147483647;
NgChmGui.UTIL.debug = false;
NgChmGui.UTIL.errorPrefix = "<b class='error_message'>ERROR: </b>&nbsp;&nbsp;";
NgChmGui.UTIL.warningPrefix = "<b class='warning_message'>Warning: </b>&nbsp;&nbsp;";
NgChmGui.UTIL.nextLine = "<br>";

/**********************************************************************************
 * FUNCTION - toURIString: The purpose of this function to convert a URI to a string.
 **********************************************************************************/
NgChmGui.UTIL.toURIString = function(form) {
	if (form){
		var urlString = "";
		var elements = form.querySelectorAll( "input, select, textarea");
		for( var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			var name = element.name;
			var value = element.value;
			if(name && ( element.type == "select-one" || // Is it a dropdown?
					((element.offsetParent) && (element.type == 'radio') && (element.checked == true)) || (element.type == "file"))){ // is it a radio button? 
				urlString = urlString + (urlString=="" ? "" : "&") + encodeURIComponent(name) + '=' + encodeURIComponent(value);
				if (((element.offsetParent) && (element.type == 'radio') && (element.checked == true))){ // this radio item is checked, check the next element to see if it is a text input associated with this?
					if (elements[i+1].type == "number" || elements[i+1].type == "text"){
						var nname = elements[i+1].name;
						var nvalue = elements[i+1].value;
						if (nvalue == "" || !NgChmGui.UTIL.isNumeric(nvalue)){
							return false;
						}
						urlString = urlString + (urlString=="" ? "" : "&") + encodeURIComponent(nname) + '=' + encodeURIComponent(nvalue);
					}
				}
			}
		}
	}

	return urlString;
}		

/**********************************************************************************
 * FUNCTION - formatInputNumber: This function performs a check of the just-entered
 * numeric input value and adds a leading zero or ending zero if the value 
 * begins/ends with a decimal point.
 **********************************************************************************/
NgChmGui.UTIL.formatInputNumber = function(item) {
    var itemValue = item.value;
     itemValue = itemValue.substring(0,1) === "." ? "0"+itemValue : itemValue.substring(itemValue.length-1) === "." ? itemValue+"0" : itemValue;
     itemValue = itemValue.replace(/,/g, '');
     item.value = itemValue;
}

NgChmGui.UTIL.formatInputPct = function(item) {
    var itemValue = item.value;
     itemValue = itemValue.replace('.','');
     itemValue = itemValue.replace(/,/g, '');
     item.value = itemValue;
}

/**********************************************************************************
 * FUNCTION - editWidgetForBuilder: The purpose of this function to hide various
 * parts of the embedded heatmap widget for the Cluster screen.
 **********************************************************************************/
NgChmGui.UTIL.editWidgetForBuilder = function() {
	document.getElementById('divider').style.display = 'none';
	document.getElementById('detail_chm').style.display = 'none';
	document.getElementById('summary_box_canvas').style.display = 'none';
	document.getElementById('bottom_buttons').style.display = 'none';
	document.getElementById('barMenu_btn').style.display = 'none';
	document.getElementById('colorMenu_btn').style.display = 'none';
	document.getElementById('mdaServiceHeader').style.border = 'none';
	document.getElementById('summary_box_canvas').style.display = 'none';
	document.getElementById('column_dendro_canvas').style.display = '';
	document.getElementById('row_dendro_canvas').style.display = '';
	document.getElementById('mapName').style.display = 'none';
}

/**********************************************************************************
 * FUNCTION - getHeatmapProperties: The purpose of this function to retrieve 
 * heatmapProperties for a given screen (it is called from multiple places) and 
 * then call that screen's "load" function.
 **********************************************************************************/
NgChmGui.UTIL.getHeatmapProperties = function(loadFunction) {
	var req = new XMLHttpRequest();
	req.open("GET", "MapProperties", true);
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to upload matrix '  + req.status);
	        } else {
	        	//Got corner of matrix data.
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	NgChmGui.mapProperties = JSON.parse(req.response);
	        	if (typeof loadFunction !== 'undefined') {
		        	loadFunction();
	        	}
		    }
		}
	};
	req.send();
}

/**********************************************************************************
 * FUNCTION - setHeatmapProperties: The purpose of this function to send heat map
 * properties to the client and save them.
 **********************************************************************************/
NgChmGui.UTIL.setHeatmapProperties = function(nextFunction) {
	var req = new XMLHttpRequest();
	var formData = JSON.stringify(NgChmGui.mapProperties);  
	req.open("POST", "MapProperties", true);
	req.setRequestHeader("Content-Type", "application/json");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to process properties changes '  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	NgChmGui.mapProperties = JSON.parse(req.response);
	        	if (NgChmGui.UTIL.validSession()) {
					if (typeof nextFunction !== 'undefined') {
						nextFunction();
					}
	        	}
			}
		};
	}
	NgChmGui.UTIL.showLoading();
	req.send(formData);
}

/**********************************************************************************
 * FUNCTION - getHeatmapProperties: The purpose of this function to retrieve 
 * heatmapProperties for a given screen (it is called from multiple places) and 
 * then call that screen's "load" function.
 **********************************************************************************/
NgChmGui.UTIL.cleanSession = function(loadFunction) {
	var req = new XMLHttpRequest();
	req.open("GET", "CleanSession", true);
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to clean up session '  + req.status);
	        } else {
	        	//Got corner of matrix data.
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	if (typeof loadFunction !== 'undefined') {
		        	loadFunction();
	        	}
		    }
		}
	};
	req.send();
}

/**********************************************************************************
 * FUNCTION - applySettings: The purpose of this function to apply any changes to 
 * the heat map properties to the heat map on the server.  It is a generic function
 * that is called from any screens that edit heatmapProperties data
 **********************************************************************************/
NgChmGui.UTIL.applySettings = function(applyFunction, nextFunction) {
	if (NgChmGui.UTIL.validSession()) {
		if (NgChmGui.UTIL.buildProps() === true) {
			//Reset builder warnings before calling a new build
			NgChmGui.UTIL.clearBuildErrors();
			NgChm.SUM.summaryHeatMapCache = {};
			if (applyFunction()) {
				NgChmGui.UTIL.setHeatmapProperties(nextFunction);
			} else {
				return;
			};
		} else {
			nextFunction();
		}
	}
}

/**********************************************************************************
 * FUNCTION - clearBuildErrors: The purpose of this function to reset the config 
 * values containing build warning and error messages.  These should display on 
 * page load but should be cleared prior to a new apply.
 **********************************************************************************/
NgChmGui.UTIL.clearBuildErrors = function() {
	NgChmGui.mapProperties.builder_config.buildErrors = "";
	NgChmGui.mapProperties.builder_config.buildWarnings = [];
}

/**********************************************************************************
 * FUNCTION - buildHeatMap: This function runs when any changes are applied and the
 * heatmap needs to be rebuilt for display.  *****NOT CURRENTLY USED*****
 **********************************************************************************/
NgChmGui.UTIL.buildHeatMap = function(nextFunction) {
	var req = new XMLHttpRequest();
	req.open("POST", "HeatmapBuild", true);
	req.setRequestHeader("Content-Type", "application/json");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to load heat map view to screen'  + req.status);
	            NgChmGui.UTIL.heatmapBuildError();
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	if (typeof nextFunction !== 'undefined') {
	        		nextFunction();
	        	}
		    }
		}
	};
	req.send();
}

/**********************************************************************************
 * FUNCTION - loadHeatMapView: This function runs when any panel, that displays
 * the heatmap at startup, is loaded.
 **********************************************************************************/
NgChmGui.UTIL.loadHeatMapView = function(hideDetail) {
	if (typeof hideDetail === 'undefined') {
		hideDetail = true;
	}
	var req = new XMLHttpRequest();
	req.open("POST", "HeatmapView", true);
	req.setRequestHeader("Content-Type", "application/json");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	NgChmGui.UTIL.hideLoading();
	            console.log('Failed to load heat map view to screen'  + req.status);
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	result = req.response;
	        	pieces = result.trim().split("|");
	        	NgChm.UTIL.embedCHM(pieces[1], pieces[0], hideDetail); NgChmGui.UTIL.hideLoading();
		    }
		}
	};
	req.send();
}

/**********************************************************************************
 * FUNCTION - loadHeaderData: The purpose of this function display header data
 * on all screens BUT the Matrix screen.  It will display the heatmap name and 
 * description OR text indicating that the user's session has expired
 **********************************************************************************/
NgChmGui.UTIL.loadHeaderData =  function() {
	if (NgChmGui.mapProperties !== null) {
		if (NgChmGui.UTIL.validSession()) {
			document.getElementById("ngchmName").innerHTML = "<b>Map Name:</b>&nbsp;&nbsp;"+NgChmGui.mapProperties.chm_name;
			return true;
		} else {
			return false;
		}
	} else {
		return true;
	}
    return true;
}

NgChmGui.UTIL.validSession =  function() {
	if ((NgChmGui.mapProperties.no_file === 1) || (NgChmGui.mapProperties.no_session === 1)) {
		var nameField = document.getElementById("ngchmName");
		if (nameField !== null) {
			document.getElementById("ngchmName").innerHTML = "<b>Your Session Has Expired</b>";
			setTimeout(function(){NgChmGui.UTIL.gotoMatrixScreen(); }, 2000);
		}
		NgChmGui.UTIL.hideLoading();
		return false;
	} else {
		return true;
	}
}

/**********************************************************************************
 * FUNCTION - setPropsChange: The purpose of this function is to mark the properties
 * as "dirty".
 **********************************************************************************/
NgChmGui.UTIL.setBuildProps =  function() {
	NgChmGui.mapProperties.builder_config.buildProps = "Y"
}

/**********************************************************************************
 * FUNCTION - setBuildCluster: The purpose of this function is to mark the properties
 * as "dirty" AND mark the properties as requiring clustering during the update
 * process.
 **********************************************************************************/
NgChmGui.UTIL.setBuildCluster =  function(type) {
	NgChmGui.UTIL.setBuildProps();
	var currCluster = NgChmGui.mapProperties.builder_config.buildCluster;
	if (currCluster !== "B") {
		if ((type === 'C') && (currCluster === 'R')) {
			NgChmGui.mapProperties.builder_config.buildCluster= "B";
		} else if ((type === 'R') && (currCluster === 'C')) {
			NgChmGui.mapProperties.builder_config.buildCluster= "B";
		} else {
			NgChmGui.mapProperties.builder_config.buildCluster= type;
		}
	}
}

/**********************************************************************************
 * FUNCTION - buildProps: The purpose of this function is query the build properties
 * to determine if an update is necessary.
 **********************************************************************************/
NgChmGui.UTIL.buildProps =  function() {
	var buildPropsInd = NgChmGui.mapProperties.builder_config.buildProps;
	if ((typeof buildPropsInd === 'undefined') || (buildPropsInd === "Y")) {
		return true;
	} else {
		return false;
	}
}


/**********************************************************************************
 * FUNCTIONS - MESSAGE BOX FUNCTIONS
 * 
 * We use a generic message box for most of the modal request windows in the 
 * application.  The following functions support this message box:
 * 1. initMessageBox - Initializes and hides the message box panel
 * 2. setMessageBoxHeader - Places text in the message box header bar.
 * 3. setMessageBoxText - Places text in the message box body.
 * 4. setMessageBoxButton - Configures and places a button on the message box.
 * 5. messageBoxCancel - Closes the message box when a Cancel is requested.  
 * 6. messageBoxConfigure - Adds the html for the message box to the screen's html.  
 **********************************************************************************/
NgChmGui.UTIL.initMessageBox = function() {
	var msgBox = document.getElementById('message');
	var headerpanel = document.getElementById('mdaServiceHeader');
	
	document.getElementById('message').style.display = 'none';
	document.getElementById('messageBtnImg_1').style.display = 'none';
	document.getElementById('messageBtnImg_1')['onclick'] = null;
	document.getElementById('messageBtnImg_2').style.display = 'none';
	document.getElementById('messageBtnImg_2')['onclick'] = null;
	if (document.getElementById('messageBtnImg_3') !== null) {
		document.getElementById('messageBtnImg_3').style.display = 'none';
		document.getElementById('messageBtnImg_3')['onclick'] = null;
	}
	if (document.getElementById('messageBtnImg_4') !== null) {
		document.getElementById('messageBtnImg_4').style.display = 'none';
		document.getElementById('messageBtnImg_4')['onclick'] = null;
	}
}

NgChmGui.UTIL.setMessageBoxHeader = function(headerText) {
	var msgBoxHdr = document.getElementById('messageHdr');
	msgBoxHdr.innerHTML = headerText;
}

NgChmGui.UTIL.setMessageBoxText = function(text, rows) {
	var msgBox = document.getElementById('message');
	var msgBoxTxt = document.getElementById('messageTxt');
	var textBoxHeight = (rows * 9) + 95;
	msgBoxTxt.style.width = '490px';
	msgBox.style.height = textBoxHeight+ 'px';
	msgBoxTxt.innerHTML = text;
}

NgChmGui.UTIL.setMessageBoxButton = function(buttonId, imageSrc, altText, onClick) {
	var buttonImg = document.getElementById('messageBtnImg_'+buttonId);
	buttonImg.style.display = '';
	buttonImg.src = imageSrc;
	buttonImg.alt = altText;
	var fn = eval("(function() {"+onClick+"();})");
	buttonImg.onclick=fn;
}

NgChmGui.UTIL.messageBoxCancel = function() {
	NgChmGui.UTIL.initMessageBox();
}

NgChmGui.UTIL.messageBoxConfigure = function() {
	var msgBox = document.getElementById('message');
	msgBox.innerHTML = "<div class='messageHdr' id='messageHdr'></div><table style='width: 490px'><tbody><tr class='chmTR'><td><div id='messageTxt' width='490px' style='display: inherit;font-size: 12px; background-color: rgb(230, 240, 255);'></div><table><tbody><tr><td align='left'><img id='messageBtnImg_1' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' align='top' style='display: inherit;'></td><td align='left'><img id='messageBtnImg_2' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' align='top' style='display: inherit;'></td><td align='right'><img id='messageBtnImg_3' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' align='top' style='display: inherit;'></td><td align='right'><img id='messageBtnImg_4' onmouseout='NgChmGui.UTIL.hlpC();' onmouseover='NgChmGui.UTIL.hlp(this);' align='top' style='display: inherit;'></td></tr></tbody></table></td></tr></tbody></table>";
}

/**********************************************************************************
 * FUNCTION - matrixLoadingError: The purpose of this function display a message
 * box when system is unable to load a matrix file.
 **********************************************************************************/
NgChmGui.UTIL.matrixLoadingError = function() {
	NgChmGui.UTIL.initMessageBox();
	NgChmGui.UTIL.setMessageBoxHeader("Matrix Loading Error");
	NgChmGui.UTIL.setMessageBoxText("<br>Unable to load selected matrix.  Please try again.<br><br>", 2);
	NgChmGui.UTIL.setMessageBoxButton(3, "images/cancelButton.png", "", "NgChmGui.UTIL.messageBoxCancel");
	document.getElementById('message').style.display = '';
}

/**********************************************************************************
 * FUNCTION - heatmapBuildError: The purpose of this function display a message
 * box when system is unable to load a matrix file.
 **********************************************************************************/
NgChmGui.UTIL.heatmapBuildError = function() {
	NgChmGui.UTIL.initMessageBox();
	NgChmGui.UTIL.setMessageBoxHeader("Heatmap Build Error");
	NgChmGui.UTIL.setMessageBoxText("<br>Unable to load changes to heat map.  Please try again.<br><br>", 2);
	NgChmGui.UTIL.setMessageBoxButton(3, "images/cancelButton.png", "", "NgChmGui.UTIL.messageBoxCancel");
	document.getElementById('message').style.display = '';
}

NgChmGui.UTIL.newHeatMapNotice = function() {
	NgChmGui.UTIL.initMessageBox();
	NgChmGui.UTIL.setMessageBoxHeader("Build New Heat Map");
	NgChmGui.UTIL.setMessageBoxText("<br>If you choose to continue, the current map will be deleted and you will no longer have access to it in the NG-CHM Builder.<br><br>You may want to download the current map as an NG-CHM File or PDF first.<br><br>", 6);
	NgChmGui.UTIL.setMessageBoxButton(1, "images/prefCancel.png", "", "NgChmGui.UTIL.messageBoxCancel");
	NgChmGui.UTIL.setMessageBoxButton(3, "images/prefContinue.png", "Start all new Heat Map Build", "NgChmGui.MAP.newMapConfirm");
	document.getElementById('message').style.display = '';
}

/**********************************************************************************
 * FUNCTION - elemExist: The purpose of this function is evaluate the existence
 * of a given JS object and return true/false.
 **********************************************************************************/
NgChmGui.UTIL.elemExist = function(elem) {
	if ((elem !== null) && (typeof elem !== 'undefined')) {
		return true;
	} else {
		return false;
	}
}

/**********************************************************************************
 * FUNCTION - getDivElement: The purpose of this function is to create and 
 * return a DIV html element that is configured for a help pop-up panel.
 **********************************************************************************/
NgChmGui.UTIL.getDivElement = function(elemName) {
    var divElem = document.createElement('div');
    divElem.id = elemName;
    divElem.style.display="none";
    return divElem;
}

/**********************************************************************************
 * FUNCTION - setTableRow: The purpose of this function is to set a row into a help
 * or configuration html TABLE item for a given help pop-up panel. It receives text for 
 * the header column, detail column, and the number of columns to span as inputs.
 **********************************************************************************/
NgChmGui.UTIL.setTableRow = function(tableObj, tdArray, colSpan, align) {
	var tr = tableObj.insertRow();
	tr.className = "chmTR";
	for (var i = 0; i < tdArray.length; i++) {
		var td = tr.insertCell(i);
		if (typeof colSpan != 'undefined') {
			td.colSpan = colSpan;
		}
		if (i === 0) {
			td.style.fontWeight="bold";
		}
		td.innerHTML = tdArray[i];
		if (typeof align != 'undefined') {
			td.align = align;
		}
	}
}

/**********************************************************************************
 * FUNCTION - formatBlankRow: The purpose of this function is to return the html
 * text for a blank row.
 **********************************************************************************/
NgChmGui.UTIL.formatBlankRow = function() {
	return "<td style='line-height:4px;' colspan=2>&nbsp;</td>";
}

/**********************************************************************************
 * FUNCTION - addBlankRow: The purpose of this function is to return the html
 * text for a blank row.
 **********************************************************************************/
NgChmGui.UTIL.addBlankRow = function(addDiv, rowCnt) {
	addDiv.insertRow().innerHTML = NgChmGui.UTIL.formatBlankRow();
	if (typeof rowCnt !== 'undefined') {
		for (var i=1;i<rowCnt;i++) {
			Div.insertRow().innerHTML = NgChmGui.UTIL.formatBlankRow();
		}
	}
	return;
}

/**********************************************************************************
 * FUNCTION - toTitleCase: The purpose of this function is to change the case of
 * the first letter of the first word in each sentence passed in.
 **********************************************************************************/
NgChmGui.UTIL.toTitleCase = function(string) {
    // \u00C0-\u00ff for a happy Latin-1
    return string.toLowerCase().replace(/_/g, ' ').replace(/\b([a-z\u00C0-\u00ff])/g, function (_, initial) {
        return initial.toUpperCase();
    }).replace(/(\s(?:de|a|o|e|da|do|em|ou|[\u00C0-\u00ff]))\b/ig, function (_, match) {
        return match.toLowerCase();
    });
}

NgChmGui.UTIL.getLabelText = function(text,type) { 
	var rowConfig = NgChmGui.mapProperties.row_configuration;
	var colConfig = NgChmGui.mapProperties.col_configuration;
	var size = colConfig.label_display_length;
	var elPos = colConfig.label_display_abbreviation;
	if (type === "ROW") {
		size = rowConfig.label_display_length;
		elPos = rowConfig.label_display_abbreviation;
	}
	if (text.length > size) {
		if (elPos === 'END') {
			text = text.substr(0,size - 3)+"...";
		} else if (elPos === 'MIDDLE') {
			text = text.substr(0,(size/2 - 1))+"..."+text.substr(text.length-(size/2 - 2),text.length);
		} else {
			text = "..."+text.substr(text.length - (size - 3), text.length);
		}
	}
	return text;
}

NgChmGui.UTIL.showLoading = function() { 
	var loadingDiv = document.getElementById("loadOverlay");
	if (loadingDiv === null) {
		loadingDiv = document.createElement("div");
		loadingDiv.id = "loadOverlay";
		var spinner = document.createElement("div");
		spinner.classList.add("loader");
		loadingDiv.appendChild(spinner);
		document.body.appendChild(loadingDiv);
	}
}

NgChmGui.UTIL.hideLoading = function() { 
	var loadingDiv = document.getElementById("loadOverlay");
	if (loadingDiv !== null) {
		loadingDiv.parentElement.removeChild(loadingDiv);
	}
}

/**********************************************************************************
 * FUNCTION - goto...Screen: These function navigate to the specified screen.  
 * They are used to navigate to the next screen from a previous screen
 **********************************************************************************/
NgChmGui.UTIL.gotoMatrixScreen = function() {
	window.open("Select_Matrix.html?adv="+NgChmGui.UTIL.showAdvanced,"_self");
}
NgChmGui.UTIL.gotoTransformScreen = function() {
	window.open("Transform_Matrix.html?adv="+NgChmGui.UTIL.showAdvanced,"_self");
}
NgChmGui.UTIL.gotoCovariatesScreen = function() {
	window.open("Edit_Covariates.html?adv="+NgChmGui.UTIL.showAdvanced,"_self");
}
NgChmGui.UTIL.gotoClusterScreen = function() {
	window.open("Cluster_Matrix.html?adv="+NgChmGui.UTIL.showAdvanced,"_self");
}
NgChmGui.UTIL.gotoFormatScreen = function() {
	window.open("Format_Display.html?adv="+NgChmGui.UTIL.showAdvanced,"_self");
}
NgChmGui.UTIL.gotoHeatMapScreen = function() {
	window.open("View_HeatMap.html?adv="+NgChmGui.UTIL.showAdvanced,"_self");
}

NgChmGui.UTIL.isClean = function(inStr) {
	var dirty = inStr.toLowerCase().match(/(shit|piss|cunt|cocksuck|cockhead|fuck|penis|bitch|goddamn|godamm|nigger|twat|prick|blowjob|dickhead|dickweed|pussy|hitler|masterbate|orgasm|rimjob|pussie|scrotum|tittie|turd|whore)/);
	return dirty === null;
}

/**********************************************************************************
 * FUNCTION - urlParam: This function is used to retrieve the set the advanced/standard
 * functionality off of the URL param value.
 **********************************************************************************/
NgChmGui.UTIL.urlParam = function(name){
    var w =window;
    var rx = new RegExp('[\&|\?]'+name+'=([^\&\#]+)'),
        val = w.location.search.match(rx);
    return !val ? '':val[1];
}

/**********************************************************************************
 * FUNCTION - downloadViewer: This function downloads the NG-CHM viewer software
 * html file.
 **********************************************************************************/
NgChmGui.UTIL.downloadViewer = function() {
	  var dl = document.createElement('a');
	  dl.setAttribute('href', NgChmGui.mapProperties.output_location.substring(0,NgChmGui.mapProperties.output_location.indexOf("MapBuildDir")));
	  dl.setAttribute('download', 'ngChmApp.html');
	  dl.click();
}

/**********************************************************************************
 * FUNCTION - setScreenNotes: This function loads notes to the viewer-side panel
 * of the screen.  It is called from all screens.
 **********************************************************************************/
NgChmGui.UTIL.setScreenNotes = function(text,narrowNotes) {
	if (typeof text === 'undefined') {
		text = " ";
	} else {
		var notes = document.getElementById("screenNotesDisplay");
		if (typeof narrowNotes !== 'undefined') {
			notes.style.width = '97%';
		} else {
			notes.style.width = '100%';
		}
		notes.innerHTML = text;
	}
}

/**********************************************************************************
 * FUNCTION - newlines: This function determines the number of lines in a text block.
 **********************************************************************************/
NgChmGui.UTIL.newlines = function(text) {
	var textUpper = text.toUpperCase();
	//Count new line character occurrences.  These will be counted as lines and
	//represent the rows for error and warning messages in the text.
    var n = 0, pos = 0;prevpos = 0;
    while (true) {
        pos = textUpper.indexOf("<BR>", pos);
        if (pos >= 0) {
            ++n;
            pos += 4;
        } else break;
        var msglen = Math.ceil(text.substring(prevpos, pos).length / 100);
        if (msglen > 1) {
        	n = n + (msglen-1);
        }
        prevpos = pos;
    }
    //Count the lines required for displaying the last section of text.
    var remainingRows = Math.ceil(text.substring(prevpos, text.length).length / 100);
    n = n + remainingRows;
    return n;
}

/**********************************************************************************
 * FUNCTION - isAlphaNumeric: This function tests whether an input value is alpa-
 * numeric and returns a boolean.
 **********************************************************************************/
NgChmGui.UTIL.isAlphaNumeric = function(str) {
	  var code, i, len;
	
	  for (i = 0, len = str.length; i < len; i++) {
	    code = str.charCodeAt(i);
	    if (!(code > 47 && code < 58) && // allow numeric (0-9)
		    !(code === 32) && // allow spaces
	    	!(code === 45) && // allow hyphen
	    	!(code === 95) && // allow underscore
	        !(code > 64 && code < 91) && // allow upper alpha (A-Z)
	        !(code > 96 && code < 123)) { // allow lower alpha (a-z)
	      return false;
	    }
	  }
	  return true;
};

/**********************************************************************************
 * FUNCTION - isNumeric: This function tests whether an input value is numeric and
 * returns a boolean.
 **********************************************************************************/
NgChmGui.UTIL.isNumeric = function(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

/**********************************************************************************
 * FUNCTION - download: This function downloads a given file (downloadPath) to a 
 * given output file name (fileName).
 **********************************************************************************/
NgChmGui.UTIL.download = function(downloadPath, fileName) {
    var element = document.createElement('a');
    element.href = downloadPath;
    element.setAttribute('target','_blank');
    element.download = fileName;
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**********************************************************************************
 * FUNCTION - removeOptions: This function clears out all of the options in an
 * html select dropdown or list.
 **********************************************************************************/
NgChmGui.UTIL.removeOptions = function(selectbox) {
    for (var i = selectbox.options.length - 1; i >= 0; i--) {
        selectbox.remove(i);
    }
}

/**********************************************************************************
 * VARIABLE - showAdvanced: UTIL variable for storing/passing show advanced setting 
 **********************************************************************************/
NgChmGui.UTIL.showAdvanced = 'INIT';

/**********************************************************************************
 * FUNCTION - setUpAdvanced: This function sets the showAdvanced variable based 
 * upon the URL-based "adv" parameter passed to the screen.  If no parameter is found
 * the value is set to NO.
 **********************************************************************************/
NgChmGui.UTIL.setUpAdvanced = function() {
	var urlAdv = NgChmGui.UTIL.urlParam('adv');
	if (NgChmGui.UTIL.showAdvanced === 'INIT') {
		NgChmGui.UTIL.showAdvanced = ((urlAdv === null) || (urlAdv === '') || (urlAdv === 'INIT')) ? 'N' : urlAdv;
		NgChmGui.UTIL.loadAdvanced();
		return true;
	}
	return false;
}

/**********************************************************************************
 * FUNCTION - toggleAdvanced: This function toggles the advanced/standard functionality
 * setting when the user clicks on the advanced settings button on the menu bar.
 **********************************************************************************/
NgChmGui.UTIL.toggleAdvanced = function() {
	var optionsBtn = document.getElementById("optionsCheck");
	NgChmGui.UTIL.showAdvanced = optionsBtn.checked === true ? 'Y' : 'N';
	NgChmGui.UTIL.loadAdvanced();
}

/**********************************************************************************
 * FUNCTION - loadAdvanced: This function loads the screen and shows/hides advanced/
 * standard features based upon the NgChmGui.UTIL.showAdvanced setting value.
 **********************************************************************************/
NgChmGui.UTIL.loadAdvanced = function() {
	var optionsBtn = document.getElementById("optionsCheck");
	if (NgChmGui.UTIL.showAdvanced === 'N') {
		optionsBtn.checked = false;
	} else {
		optionsBtn.checked = true;
		
	}
	var advElements = document.getElementsByClassName("advancedAction");
	for (var i = 0; i < advElements.length; i++) {
		if (NgChmGui.UTIL.showAdvanced === 'N') {
			advElements[i].style.display = 'none';
		} else {
			advElements[i].style.display = '';
		}
	}
	var stdElements = document.getElementsByClassName("standardAction");
	for (var i = 0; i < stdElements.length; i++) {
		if (NgChmGui.UTIL.showAdvanced === 'N') {
			stdElements[i].style.display = '';
		} else {
			stdElements[i].style.display = 'none';
		}
	}
}

/**********************************************************************************
 * FUNCTION - getHexToRgb: This function converts a hex color to an rgb value.
 **********************************************************************************/
NgChmGui.UTIL.getHexToRgb = function(hex) { // I didn't write this function. I'm not that clever. Thanks stackoverflow
    var rgbColor = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return rgbColor ? {
        r: parseInt(rgbColor[1], 16),
        g: parseInt(rgbColor[2], 16),
        b: parseInt(rgbColor[3], 16),
        a: 255
    } : null;
}

/**********************************************************************************
 * FUNCTION - getApproximatedColor: This function converts an hex color value to an
 * rgb color value and then uses that value to generate an approximated color name
 * based upon calculated Hue, Saturation, and Luminance values.
 **********************************************************************************/
NgChmGui.UTIL.getApproximatedColor = function(hexCode) {
	var rgb = NgChmGui.UTIL.getHexToRgb(hexCode);
	var colorVal = 'Unknown';
	var rCalc = rgb.r/255;
	var gCalc = rgb.g/255;
	var bCalc = rgb.b/255;
	var minVal =  rCalc;
	if (gCalc < minVal) {
		minVal = gCalc;
	}
	if (bCalc < minVal) {
		minVal = bCalc;
	}
	var maxVal =  rCalc;
	if (gCalc > maxVal) {
		maxVal = gCalc;
	}
	if (bCalc > maxVal) {
		maxVal = bCalc;
	}
	//Calculate luminance
	var luminance = Math.round(((minVal+maxVal)/2)*100);
	//Calculate saturation
	var saturation = 0;
	if (luminance <= .5) {
		saturation = (maxVal-minVal)/(maxVal+minVal);
	} else {
		saturation = (maxVal-minVal)/(2.0-maxVal-minVal);
	}
	saturation = saturation * 100;
	//Calculate hue
	var hue = 0;
	if (rCalc === maxVal) {
		hue = (gCalc-bCalc)/(maxVal-minVal);
	} else if (gCalc === maxVal) {
		hue = 2.0 + (bCalc-rCalc)/(maxVal-minVal);
	} else {
		hue = 4.0 + (rCalc-gCalc)/(maxVal-minVal);
	}
	//Convert hue to degrees on a 360 degree scale
	var hueDegrees = hue*60;
	if (hueDegrees < 0) {
		hueDegrees = hueDegrees + 360;
	}
	hueDegrees = Math.round(hueDegrees);
	//Use hue degrees to calculate color family
	var hueColor = 'Black';
	if ((hueDegrees > 340) || (hueDegrees < 11)) {
		hueColor = 'Red'
	} else if ((hueDegrees > 10) && (hueDegrees < 46)) {
		hueColor = 'Orange';
	} else if ((hueDegrees > 45) && (hueDegrees < 71)) {
		hueColor = 'Yellow';
	} else if ((hueDegrees > 70) && (hueDegrees < 170)) {
		hueColor = 'Green';
	} else if ((hueDegrees > 169) && (hueDegrees < 186)) {
		hueColor = 'Cyan';
	} else if ((hueDegrees > 185) && (hueDegrees < 265)) {
		hueColor = 'Blue';
	} else if ((hueDegrees > 264) && (hueDegrees < 286)) {
		hueColor = 'Purple';
	} else {
		hueColor = 'Magenta';
	}
	//Use saturation and luminance to adjust color family (light/dark/gray/black/white)
	//for final color value
	if (saturation < 15) {
		colorVal = 'Gray';
	} else if (luminance < 13) {
		colorVal = 'Black';
	} else if (luminance > 97) {
		colorVal = 'White';
	} else if ((luminance > 12) && (luminance < 40)) {
		colorVal = 'Dark' + hueColor;
	} else if (luminance > 60) {
		colorVal = 'Light' + hueColor;
	} else {
		colorVal = hueColor;
	}
	//Add RGB values to color value returned for display
	colorVal += " (rgb: " + rgb.r + "," + rgb.g + "," + rgb.b + ")";
	return colorVal
}

/**********************************************************************************
 * FUNCTION - helpOpen: This function opens the NgChm Builder help html page.  If
 * an anchor is passed in, it opens the html document to that anchor.  It is 
 * called from the  right-justified help icon on the header bar of each screen.
 **********************************************************************************/
NgChmGui.UTIL.helpOpen = function(anchor) {
	var shortPath = location.pathname.substring(0,(location.pathname.lastIndexOf("/")+1));
	var url = location.origin+shortPath;
	url += "ngChmBuilderHelp.html";
	if (anchor !== undefined) {
		url += "#"+anchor;
	}
	window.open(url,'_blank');
}

/**********************************************************************************
 * FUNCTION - hlp: This function displays a bubble help box on the screen.  It is
 * activated when the user hovers over a control on the screen. It uses the control's
 * ID to retrieve text and display width from a help text array and then draws
 * that text into the bubble help box.  The box is displayed to the right of the
 * control unless a value is passed in to the "reverse" parameter (which causes
 * the box to be displayed to the left of the control).
 **********************************************************************************/
NgChmGui.UTIL.hlp = function(e,reverse) {
	NgChmGui.UTIL.hlpC();
    var helptext = NgChmGui.UTIL.getDivElement("bubbleHelp");

    NgChmGui.UTIL.detailPoint = setTimeout(function(){
		var itemId = NgChmGui.UTIL.hlpGetItem(e);
	    var helpItem = NgChmGui.UTIL.hoverGetHelpItem(itemId);
	    var elemPos = NgChmGui.UTIL.getElemPosition(e);
	    var bodyElem = document.getElementsByTagName('body')[0];
	    if (bodyElem) {
	    	bodyElem.appendChild(helptext);
	    }
	    if (reverse !== undefined) {
	    	helptext.style.left = elemPos.left - 50 - helpItem[1] + 'px';
	    } else {
	    	helptext.style.left = elemPos.left + e.clientWidth + 20 + 'px';
	    }
    	helptext.style.top = elemPos.top - 10;
	    helptext.style.width = helpItem[1];
		var htmlclose = "</font></b>";
		helptext.innerHTML = "<b><font size='2' color='#0843c1'>"+helpItem[0]+"</font></b>";
		helptext.style.display="inherit"; 
	},1500);
}

/**********************************************************************************
 * FUNCTION - hlpGetItem: This function performs a help text lookup, based upon
 * a DOM element's Id, and returns the corresponding help text ID.  It handles
 * special cases where a given element's id is NOT used as the id for its help text.
 **********************************************************************************/
NgChmGui.UTIL.hlpGetItem = function (item) {
	var itemName = item.id.indexOf("_") < 0 ? item.id : item.id.substring(0,item.id.indexOf("_"));
	if (item.id.indexOf("_color_") > 0) {
		itemName = "covColor";
	} else if (item.id.startsWith("color")) {
		itemName = "matrixColor";
	} 
	if (itemName === 'messageBtnImg') {
	    var eSrc = item.src.toLowerCase();
		if (eSrc.indexOf('cancel') > 0) {
			itemName = 'cancelButton';
		} else if (eSrc.indexOf('select') > 0) {
			itemName = 'selectButton'
		} else if (eSrc.indexOf('continue') > 0) {
			itemName = 'continueButton'
		} else if (eSrc.indexOf('apply') > 0) {
			itemName = 'applyButton'
		} else if (eSrc.indexOf('save') > 0) {
			itemName = 'saveButton'
		} else if (eSrc.indexOf('close') > 0) {
			itemName = 'closeButton'
		}
	}
    return itemName;
}

/**********************************************************************************
 * FUNCTION - hlpC: This function clears any bubble help box displayed on the screen.
 **********************************************************************************/
NgChmGui.UTIL.hlpC = function() {
	clearTimeout(NgChmGui.UTIL.detailPoint);
	var helptext = document.getElementById('bubbleHelp');
	if (helptext){
		helptext.remove();
	}
}

/**********************************************************************************
 * FUNCTION - getElemPosition: This function finds the help element selected's 
 * position on the screen and passes it back to the help function for display. 
 * The position returned is the position on the entire screen (not the panel that
 * the control is embedded in).  In this way, the help text bubble may be placed
 * on the document body.
 **********************************************************************************/
NgChmGui.UTIL.getElemPosition = function(el) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

/**********************************************************************************
 * FUNCTION - hoverGetHelpItem: This function uses the element id to retrieve
 * help text and text width from a 2 dimensional array containing all of the 
 * application's help text.
 **********************************************************************************/
NgChmGui.UTIL.hoverGetHelpItem = function(id) {
	var helpItem = ['Unknown help item.',50];
	for (var i=0;i<NgChmGui.UTIL.helpItems.length;i++) {
		if (NgChmGui.UTIL.helpItems[i][0] === id) {
			helpItem = [NgChmGui.UTIL.helpItems[i][1],NgChmGui.UTIL.helpItems[i][2]];
			break;
		}
	}
	return helpItem;
}

/**********************************************************************************
 * ARRAY - helpItems: This 2 dimensional array contains all of the bubble help text 
 * for the NgChm Builder application.  Each array row contains 3 values: The id
 * name of a control; the help text for that control; and the display width for 
 * the box holding the text.
 **********************************************************************************/
NgChmGui.UTIL.helpItems = [
	  //Matrix Screen
	  ["getMatrix", "Press this button to select a data matrix file and begin building the heat map.", 300],
	  ["sampleMatrix", "Press this button to select the sample data matrix. This matrix can be used to explore all of the features of the NG-CHM Builder. By proceeding through the screens, and making configuration selections, you may construct the sample heat map and view it interactively.", 400],
	  ["mapNameValue", "Enter a Name for the heat map. This name will be displayed in the NG-CHM Viewer and be used as the file name for the map when downloaded.", 400],
	  ["mapDescValue", "Enter an optional free-form description for the heat map. This description will appear in the NG-CHM Viewer.", 300],
	  ["matrixSummaryMethod", "Select a Pixel Summary Method.  This method will be used to summarize values for pixel representation on the summary panel (left side) of the NG-CHM Viewer.", 400],
	  ["optionsCheck", "Check this box to expand builder options to show advanced system features. Uncheck the box to see a streamlined set of standard builder options.", 400],
	  ["rowlabelPos", "Select this button to choose the label row of the matrix by then clicking a row on the grid below.", 300],
	  ["collabelPos", "Select this button to choose the label column of the matrix by then clicking a column on the grid below.", 300],
	  ["rowCovPos", "Select this button to choose the row covariates in the matrix by then clicking column(s) on the grid below.", 300],
	  ["colCovPos", "Select this button to choose the column covariates in the matrix by then clicking row(s)on the grid below.", 300],
	  ["colColorTypePref", "Select a color type (discrete or continuous) for this column covariate.", 220],
	  ["rowColorTypePref", "Select a color type (discrete or continuous) for this row covariate.", 220],
	  ["dataStart", "Select this button to choose the row/column position where matrix data begins by then clicking a cell on the grid below.", 300],
	  ["matrixNextButton", "Press this button to proceed to the Transform Matrix screen.", 300],
	  ["barHelp", "Open the NG-CHM Builder help page.", 180],

	  //Transform Screen
	  ["transPref", "Select a type for the Transformation action that you wish to perform.", 220],
	  ["Correction", "Select a missing/invalid data correction type to apply to the matrix.", 220],
	  ["nreplace", "Select this button to choose the value to be used in replacing invalid values.", 300],
	  ["mreplace", "Select this button to choose the value to be used in replacing missing values.", 300],
	  ["Filter", "Select a filter type to apply to the matrix.", 200],
	  ["vfiltermethod", "Select this button to choose a Standard Deviation filtering method from the available options.", 300],
	  ["rfiltermethod", "Select this button to choose a Range filtering method from the available options.", 300],
	  ["mfiltermethod", "Select this button to choose a Missing Data filtering method from the available options.", 300],
	  ["Transform", "Select a Transformation type to apply to the matrix.", 200],
	  ["tlfiltermethod", "Select this button to choose a Logarithmic transformation method from the available options.", 300],
	  ["tmrowcol", "Select this button to choose a Mean Centering transformation method from the available options.", 300],
	  ["tzrowcol", "Select this button to choose a Z-Normalization transformation method from the available options.", 300],
	  ["tatransformmethod", "Select this button to choose an Arithmetic transformation method from the available options.", 300],
	  ["thresholdmethod", "Select a method of applying a upper or lower threshold to the matrix values.", 300],
	  ["Correlations", "Select this button to choose a Correlation type to apply to the matrix.", 300],
	  ["tctransformmethod", "Select this button to choose a Matrix Operation method from the available options.", 300],
	  ["trans", "Press this button to apply Transformation selections and reload the matrix.", 300],
	  ["correlation", "Press this button to apply Matrix Operation selections and reload the matrix.", 300],
	  ["filter", "Press this button to apply Filter selections and reload the matrix.", 300],
	  ["correct", "Press this button to apply Missing/Invalid data correction selections and reload the matrix.", 300],
	  ["restore", "Press this button to restore the matrix to a previous step, or back to the original version, by selecting a row from the box above.", 400],
	  ["changeSelect", "This box contains the transform change history for this data matrix. You may revert the matrix to any point in the history by selecting a row and clicking the Reset button (below).", 400],
	  ["transPrevButton", "Press this button to return to the Select Matrix screen.", 180],
	  ["transNextButton", "Press this button apply any changes made and proceed to the Cluster Matrix screen.", 220],
	  ["Histogram", "Select the distribution method for the histogram displayed below.", 180],
	  ["dowloadMatrix", "Press this button to download a matrix text file containing transformed data matrix.", 230],
	  
	  //Cluster Screen
	  ["RowOrder", "Select the row Ordering Method to be applied to the heat map.", 300],
	  ["RowDistance", "Select the Distance Metric to be applied to hierarchically clustered rows.", 200],
	  ["RowAgglomeration", "Select the Agglomeration Method to be applied to hierarchically clustered rows.", 200],
	  ["rowAddCuts", "Check this box to add a cluster-based row covariate bar to the heat map.", 200],
	  ["rowCutsName", "Enter a display name for the cluster-based row covariate bar.", 220],
	  ["rowCuts", "Select the number of clusters to be included in the cluster-based row covariate bar.", 250],
	  ["ColOrder", "Select the column Ordering Method to be applied to the heat map.", 300],
	  ["ColDistance", "Select the Distance Metric to be applied to hierarchically clustered columns.", 200],
	  ["ColAgglomeration", "Select the Agglomeration Method to be applied to hierarchically clustered columns.", 220],
	  ["colAddCuts", "Check this box to add a cluster-based column covariate bar to the heat map.", 200],
	  ["colCutsName", "Enter a display name for the cluster-based column covariate bar.", 220],
	  ["colCuts", "Select the number of clusters to be included in the cluster-based column covariate bar.", 250],
	  ["clusterApply", "Press this button to apply any clustering changes, rebuild, and reload the displayed heat map.", 300],
	  ["clusterPrevButton", "Press this button to return to the Transform Matrix screen.", 180],
	  ["clusterNextButton", "Press this button to apply any changes and proceed to the Process Covariates screen.", 230],
	  
	  //Covariate Screen
	  ["classPref", "Select an existing covariate bar to edit (in the panel below).", 300],
	  ["addCovar", "Press this button to add a covariate bar to the heat map.", 250],
	  ["removeCovar", "Press this button to remove the selected covariate bar from the heat map.", 250],
	  ["reorderCovar", "Press this button to reorder the display of covariate bars on the heat map", 250],
	  ["heightPref", "Enter a value for the display height of this covariate bar.", 210],
	  ["barType", "Select a display type for this continuous covariate bar.", 230],
	  ["showPref", "Choose whether this covariate bar will be displayed (or hidden) on the heat map.", 250],
	  ["colCovarMove", "Select a row covariate bar to relocate from this display box.", 300],
	  ["colCovarUp", "Press this button to move the selected column covariate bar up the list.  This will result in the covariate moving up when displayed.", 400],
	  ["colCovarDown", "Press this button to move the selected column covariate down the list.  This will result in the covariate moving down when displayed.", 400],
	  ["rowCovarMove", "Select a column covariate bar to relocate from this display box.", 200],
	  ["rowCovarUp", "Press this button to move the selected row covariate up the list.  This will result in the covariate moving to the left when displayed.", 400],
	  ["rowCovarDown", "Press this button to move the selected row covariate down the list.  This will result in covariate moving to the right when displayed.", 400],
	  ["covReorderCancel", "Press this button to cancel any covariate reordering changes made and return to the covariate edit panel.", 300],
	  ["covReorderApply", "Press this button to apply all covariate reordering changes, rebuild, and return to the heat map and return to the covariate edit panel.", 400],
	  ["AgeCovar", "Select the sample Age covariate bar for addition to the sample heat map.", 250],
	  ["RaceCovar", "Select the sample Gleason Score covariate bar for addition to the sample heat map.", 250],
	  ["RaceCovar", "Select the sample PSA covariate bar for addition to the sample heat map.", 250],
	  ["RaceCovar", "Select the sample Race covariate bar for addition to the sample heat map.", 250],
	  ["covSampUploadCancel", "Press this button to cancel any sample covariate bar selection made and return to the covariate edit panel.", 300],
	  ["covSampUploadApply", "Press this button to add the selected sample covariate bar, rebuild the heat map, and return to the covariate edit panel.", 300],
	  ["covarFileSelect", "Press this button to select a covariate file for the heat map.", 300],
	  ["covName", "Enter the label that you want to appear displayed with the covariate bar.", 250],
	  ["axisType", "Select the axis (row/column) upon which the covariate bar will appear in the heat map.", 250],
	  ["colorType", "Select the color type (continuous/discrete) for the values in the covariate bar.", 300],
	  ["covUploadCancel", "Press this button to cancel the covariate file upload and return to the covariate edit panel.", 300],
	  ["covUploadApply", "Press this button to upload the selected covariate bar, rebuild the heat map, and return to the covariate edit panel.", 400],
	  ["covRemoveCancel", "Press this button to cancel the removal of the covariate bar and return to the covariate edit panel.", 300],
	  ["covRemoveApply", "Press this button to remove the covariate bar, rebuild the heat map, and return to the covariate edit panel.", 400],
	  ["covColor", "Select a color for this category on the covariate bar.", 250],
	  ["missing", "Select a color for missing values.", 170],
	  ["covPalette", "Select a pre-defined set of colors for the covariate bar.", 200],
	  ["bgColorPref", "Select a foreground color for scatter/bar plot display.", 300],
	  ["fgColorPref", "Select a background color for scatter/bar plot display.", 300],
	  ["lowBound", "Select a lower boundary value for the scatter/bar plot range.", 300],
	  ["highBound", "Select an upper boundary value for the scatter/bar plot range.", 300],
	  ["covarApply", "Press this button to apply any covariate changes, rebuild, and reload the displayed heat map.", 300],
	  ["covarPrevButton", "Press this button to return to the Cluster Matrix screen.", 180],
	  ["covarNextButton", "Press this button to apply any changes and proceed to the Format Heat Map screen.", 230],
	  
	  // Format Screen	  
	  ["formatTask", "Select the type of heat map formatting task that you wish to perform.", 330],
	  ["breakPt", "Enter/Edit a value for this threshold.", 200],
	  ["breakAdd", "Press this button to add a new threshold below this item.", 280],
	  ["breakDel", "Press this button to remove this threshhold item.", 280],
	  ["matrixColor", "Select a color for display of data points that fall within this threshold in the matrix.", 300],
	  ["matrixPalette", "Select a pre-defined set of colors for the display of the matrix bar.", 250],
	  ["reloadButton", "Press this button to reload the color histogram.", 250],
	  ["gridShowPref", "Choose whether a grid will be displayed on the detail side of the heat map.", 360],
	  ["gridColorPref", "Select a color for the grid displayed on the detail side of the heat map.", 350],
	  ["gapsColorPref", "Select a color for the display of any heat map gaps.", 250],
	  ["selectionColorPref", "Select a color for the display of the selection box.", 250],
	  ["summaryWidth", "Select a display percentage for the summary side of the heat map view.", 250],
	  ["rowDendroShowPref", "Select if and where the row dendrogram will be displayed in the heat map view.", 300],
	  ["rowDendroHeightPref", "Select the display height for the row dendrogram.", 250],
	  ["rowLabelSizePref", "Select the maximum displayed label length for row labels in the heat map view.", 300],
	  ["rowLabelAbbrevPref", "Select where (beginning/middle/end) to abbreviate row labels that exceed the maximum displayed length.", 400],
	  ["colDendroShowPref", "Select if and where the column dendrogram will be displayed in the heat map view.", 300],
	  ["colDendroHeightPref", "Select the display height for the column dendrogram.", 250],
	  ["colLabelSizePref", "Select the maximum displayed length for columns labels in the heat map view.", 300],
	  ["colLabelAbbrevPref", "Select where (beginning/middle/end) to abbreviate column labels that exceed the maximum displayed length.", 400],
	  ["rowLabelType", "Select a label type for all row labels. Label type is used to link labels to active plug-ins defined for the heat map.", 400],
	  ["rowTopItems", "Enter a comma-delimited string of row labels as top items. These items will be highlighted, for easy access, on the summary side of the heat map view.", 400],
	  ["colLabelType", "Select a label type for all column labels. Label type is used to link labels to active plug-ins defined for the heat map.", 400],
	  ["colTopItems", "Enter a comma-delimited string of column labels as top items. These items will be highlighted, for easy access, on the summary side of the heat map view.", 400],
	  ["mapAttributes", "Enter a comma-delimited list of colon-separated key/value pairs as additional attributes for this heat map.", 350],
	  ["rowGapMethod", "Select a row gap method (location/cluster) for gaps to be added to rows in the the heat map.", 350],
	  ["rowGapLocations", "Enter a comma-delimited list of numeric gap locations. A row gap will be placed in the heat map at each of these locations.", 400],
	  ["rowTreeCuts", "Enter a numeric value for the the number of hierarchical row clusters to break the heat map into using gaps.", 350],
	  ["rowCutWidth", "Enter a numeric value for the height (in rows) of all row gaps displayed in the heat map.", 300],
	  ["colGapMethod", "Select a column gap method (location/cluster) for gaps to be added to columns in the heat map.", 350],
	  ["colGapLocations", "Enter a comma-delimited list of numeric gap locations. A column gap will be placed in the heat map at each of these locations.", 400],
	  ["colTreeCuts", "Enter a numeric value for the number of hierarchical column clusters to break the heat map into using gaps.", 350],
	  ["colCutWidth", "Enter a numeric value for the width (in columns) of all column gaps displayed in the heat map.", 300],
	  ["formatApply", "Press this button to apply any format changes, rebuild, and reload the displayed heat map.", 300],
	  ["formatPrevButton", "Press this button to return to the Process Covariates screen.", 180],
	  ["formatNextButton", "Press this button to apply any formatting changes and proceed to the Interactive Heat Map screen.", 300],

	  // Interactive Heat Map Screen
	  ["downloadMap", "Press this button to download a portable (.NGCHM) file containing this heat map.  This file may be opened in the stand-alone NG-CHM File Viewer application which may also be downloaded from this screen.", 400],
	  ["downloadPdf", "Press this button to create a configurable PDF document for this heat map. This PDF is the best source for publication quality images of the heat map.", 400],
	  ["downloadViewer", "Press this button to download a .HTML file containing the NG-CHM File Viewer application. This application may be used to open saved .NGCHM files containing heat maps.", 400],
	  ["downloadChangeLog", "Press this button to generate a PDF document containing the creation log for this heat map.  This log contains a listing of all of the configuration setting changes that were made during the creation of the heat map and may be used to recreate the map at a later date.", 400],
	  ["downloadThumb", "Press this button to download a small .PNG image of the summary side of this heat map. This image may be used as a small 'overview' image for the map in publications or as a click-able thumbnail to be displayed on pages with embedded heat maps.", 400],
	  ["newHeatMap", "Press this button to delete the current heat map configuration and return to the Matrix Selection screen to create a new heat map. Please note that any entries for the current heat map will be lost.  You may want to save a .NGCHM for the map before proceeding.", 400],
	  ["expandMap", "Press this button to expand the size of the heat map view panel to full screen mode.", 300],
	  ["collapseMap", "Press this button to collapse the size of the heat map view panel back to normal size.", 300],
	  ["viewHeatMapPrev", "Press this button to return to the Format Heat Map screen.", 300],
	  ["returnToMatrix", "Press this button to return to the Matrix Selection screen at the beginning of the heat map creation process. All settings for your current heat map will be retained.", 300],

	  //Custom Palette screens
	  ["selPaletteBtn", "Choose from the available pre-defined color palettes created for this system.", 250],
	  ["paletteColor", "Select a color for this position in the color palette.", 250],
	  ["paletteColorAdd", "Add a new color below this item in the color palette.", 250],
	  ["paletteColorDel", "Remove this color item from the palette.", 200],
	  ["customPalette", "Select from this box to pick a custom color palette from the available options on the server.", 300],
	  ["newPaletteName", "Enter a name for your new color palette.", 200],
	  ["newPaletteButton", "Press this button to create your own custom color palette.", 300],
	  ["showCategory", "Select this box to create a reusable custom color palette for this categorical covariate bar with a specific color for each category.", 300],
	  
	  //Modal screen buttons
	  ["cancelButton", "Cancel any changes and close window.", 200],
	  ["continueButton", "Proceed with this action and close window.", 250],
	  ["selectButton", "Select the chosen item and close window.", 200],
	  ["applyButton", "Apply any changes and close window.", 200],
	  ["saveButton", "Save any changes and close window.", 200],
	  ["closeButton", "Close window.", 150]
];


