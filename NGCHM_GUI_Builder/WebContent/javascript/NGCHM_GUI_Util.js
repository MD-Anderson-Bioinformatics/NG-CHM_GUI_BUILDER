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
NgChmGui.UTIL.errorPrefix = "<b><font color='red'>ERROR: </font></b>&nbsp;&nbsp;";
NgChmGui.UTIL.warningPrefix = "<b><font color='orange'>Warning: </font></b>&nbsp;&nbsp;";
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
					((element.offsetParent) && (element.type == 'radio') && (element.checked == true)))){ // is it a radio button? 
				urlString = urlString + (urlString=="" ? "" : "&") + encodeURIComponent(name) + '=' + encodeURIComponent(value);
				if (((element.offsetParent) && (element.type == 'radio') && (element.checked == true))){ // this radio item is checked, check the next element to see if it is a text input associated with this?
					if (elements[i+1].type == "number" || elements[i+1].type == "text"){
						var nname = elements[i+1].name;
						var nvalue = elements[i+1].value;
						urlString = urlString + (urlString=="" ? "" : "&") + encodeURIComponent(nname) + '=' + encodeURIComponent(nvalue);
					}
				}
			}
		}
	}

	return urlString;
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
				if (NgChmGui.UTIL.debug) {console.log('not 200');}
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
			NgChmGui.UTIL.hideLoading();
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to process properties changes '  + req.status);
	            NgChmGui.UTIL.matrixLoadingError();
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	NgChmGui.mapProperties = JSON.parse(req.response);
				if (typeof nextFunction !== 'undefined') {
					nextFunction();
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
				if (NgChmGui.UTIL.debug) {console.log('not 200');}
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
	if (NgChmGui.UTIL.buildProps() === true) {
		if (applyFunction()) {
			NgChmGui.UTIL.setHeatmapProperties(nextFunction);
		} else {
			return;
		};
	} else {
		nextFunction();
	}
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
	        	if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to load heat map view to screen'  + req.status);
	            NgChmGui.UTIL.heatmapBuildError();
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	if (typeof nextFunction !== 'undefined') {
	        		nextFunction();
	        	}
		    }
	        NgChmGui.UTIL.showLoading();
		}
	};
	NgChmGui.UTIL.showLoading();
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
			NgChmGui.UTIL.hideLoading();
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	        	if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to load heat map view to screen'  + req.status);
	            NgChmGui.UTIL.matrixLoadingError();
	        } else {
				if (NgChmGui.UTIL.debug) {console.log('200');}
	        	result = req.response;
	        	pieces = result.trim().split("|");
	        	NgChm.UTIL.embedCHM(pieces[1], pieces[0], hideDetail);
		    }
		}
	};
	NgChmGui.UTIL.showLoading();
	req.send();
}

/**********************************************************************************
 * FUNCTION - loadHeaderData: The purpose of this function display header data
 * on all screens BUT the Matrix screen.  It will display the heatmap name and 
 * description OR text indicating that the user's session has expired
 **********************************************************************************/
NgChmGui.UTIL.loadHeaderData =  function() {
	if (NgChmGui.mapProperties !== null) {
		if ((NgChmGui.mapProperties.no_file === 1) || (NgChmGui.mapProperties.no_session === 1)) {
			document.getElementById("ngchmName").innerHTML = "<b>Your Session Has Expired</b>";
			setTimeout(function(){NgChmGui.UTIL.gotoMatrixScreen(); }, 2000);
			return false;
		} else {
			document.getElementById("ngchmName").innerHTML = "<b>Map Name:</b>&nbsp;&nbsp;"+NgChmGui.mapProperties.chm_name;
			return true;
		}
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
	if ((type === 'C') && (currCluster === 'R')) {
		NgChmGui.mapProperties.builder_config.buildCluster= "B";
	} else if ((type === 'R') && (currCluster === 'C')) {
		NgChmGui.mapProperties.builder_config.buildCluster= "B";
	} else {
		NgChmGui.mapProperties.builder_config.buildCluster= type;
	}
}

/**********************************************************************************
 * FUNCTION - buildProps: The purpose of this function is query the build properties
 * to determine if an update is necessary.
 **********************************************************************************/
NgChmGui.UTIL.buildProps =  function() {
	if (NgChmGui.mapProperties.builder_config.buildProps === "Y") {
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
	document.getElementById('messageBtnImg_2').style.display = 'none';
	document.getElementById('messageBtnImg_3').style.display = 'none';
	document.getElementById('messageBtnImg_4').style.display = 'none';
	document.getElementById('messageBtnImg_1')['onclick'] = null;
	document.getElementById('messageBtnImg_2')['onclick'] = null;
	document.getElementById('messageBtnImg_3')['onclick'] = null;
	document.getElementById('messageBtnImg_4')['onclick'] = null;
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
	msgBox.innerHTML = "<div class='messageHdr' id='messageHdr'></div><table style='width: 490px'><tbody><tr class='chmTR'><td><div id='messageTxt' width='490px' style='display: inherit;font-size: 12px; background-color: rgb(230, 240, 255);'></div><table><tbody><tr><td align='left'><img id='messageBtnImg_1' align='top' style='display: inherit;'></td><td align='left'><img id='messageBtnImg_2' align='top' style='display: inherit;'></td><td align='right'><img id='messageBtnImg_3' align='top' style='display: inherit;'></td><td align='right'><img id='messageBtnImg_4' align='top' style='display: inherit;'></td></tr></tbody></table></td></tr></tbody></table>";
}

/**********************************************************************************
 * FUNCTION - matrixLoadingError: The purpose of this function display a message
 * box when system is unable to load a matrix file.
 **********************************************************************************/
NgChmGui.UTIL.matrixLoadingError = function() {
	NgChmGui.UTIL.initMessageBox();
	NgChmGui.UTIL.setMessageBoxHeader("Matrix Loading Error");
	NgChmGui.UTIL.setMessageBoxText("<br>Unable to load selected matrix.  Please try again.<br><br>", 2);
	NgChmGui.UTIL.setMessageBoxButton(3, "images/closeButton.png", "", "NgChmGui.UTIL.messageBoxCancel");
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
	NgChmGui.UTIL.setMessageBoxButton(3, "images/closeButton.png", "", "NgChmGui.UTIL.messageBoxCancel");
	document.getElementById('message').style.display = '';
}

NgChmGui.UTIL.newHeatMapNotice = function() {
	NgChmGui.UTIL.initMessageBox();
	NgChmGui.UTIL.setMessageBoxHeader("Build New Heat Map");
	NgChmGui.UTIL.setMessageBoxText("<br>If you choose to continue, the current map will be deleted and you will no longer have access to it in the NG-CHM Builder.<br><br>You may want to download the current map as an NG-CHM File or PDF first.<br><br>", 6);
	NgChmGui.UTIL.setMessageBoxButton(1, "images/continueButton.png", "Start all new Heat Map Build", "NgChmGui.MAP.newMapConfirm");
	NgChmGui.UTIL.setMessageBoxButton(3, "images/closeButton.png", "", "NgChmGui.UTIL.messageBoxCancel");
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
			addDiv.insertRow().innerHTML = NgChmGui.UTIL.formatBlankRow();
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
	var loadingDiv = document.createElement("div");
	loadingDiv.id = "loadOverlay";
	var spinner = document.createElement("div");
	spinner.classList.add("loader");
	loadingDiv.appendChild(spinner);
	document.body.appendChild(loadingDiv);
	
}

NgChmGui.UTIL.hideLoading = function() { 
	var loadingDiv = document.getElementById("loadOverlay");
	loadingDiv.parentElement.removeChild(loadingDiv);
}


/**********************************************************************************
 * FUNCTION - goto...Screen: These function navigate to the specified screen.  
 * They are used to navigate to the next screen from a previous screen
 **********************************************************************************/
NgChmGui.UTIL.gotoMatrixScreen = function() {
	window.open("NGCHMBuilder_Matrix.html","_self");
}
NgChmGui.UTIL.gotoTransformScreen = function() {
	window.open("NGCHMBuilder_Transform.html","_self");
}
NgChmGui.UTIL.gotoCovariatesScreen = function() {
	window.open("NGCHMBuilder_Covariates.html","_self");
}
NgChmGui.UTIL.gotoClusterScreen = function() {
	window.open("NGCHMBuilder_Cluster.html","_self");
}
NgChmGui.UTIL.gotoFormatScreen = function() {
	window.open("NGCHMBuilder_Format.html","_self");
}
NgChmGui.UTIL.gotoHeatMapScreen = function() {
	window.open("NGCHMBuilder_HeatMap.html","_self");
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
NgChmGui.UTIL.setScreenNotes = function(text) {
	if (typeof text === 'undefined') {
		text = " ";
	}
	var notes = document.getElementById("screenNotesDisplay");
	var newLineCnt = NgChmGui.UTIL.newlines(text);
	var noteHeight = newLineCnt * 18;
	notes.innerHTML = text;
	notes.style.height = noteHeight > 90 ? 90 + "px" : noteHeight + "px";
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




