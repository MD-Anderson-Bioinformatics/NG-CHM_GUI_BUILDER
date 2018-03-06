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
 * General purpose javascript helper funcitons
 */

//Define Namespace for NgChm UTIL
NgChmGui.createNS('NgChmGui.UTIL');

NgChmGui.UTIL.toURIString = function(form) {
	var urlString = "";
	var elements = form.querySelectorAll( "input, select, textarea");
	for( var i = 0; i < elements.length; ++i) {
		var element = elements[i];
		var name = element.name;
		var value = element.value;
		if(name) {
			urlString = urlString + (urlString=="" ? "" : "&") + encodeURIComponent(name) + '=' + encodeURIComponent(value)
		}
	}

	return urlString;
}		

NgChmGui.UTIL.editWidgetForBuilder = function() {
	document.getElementById('divider').style.display = 'none';
	document.getElementById('detail_chm').style.display = 'none';
	document.getElementById('summary_box_canvas').style.display = 'none';
	document.getElementById('bottom_buttons').style.display = 'none';
	document.getElementById('barMenu_btn').style.display = 'none';
}

NgChmGui.UTIL.getHeatmapProperties = function(loadFunction) {
	var req = new XMLHttpRequest();
	req.open("POST", "MapProperties", true);
	req.onreadystatechange = function () {
		console.log('state change');
		if (req.readyState == req.DONE) {
			console.log('done');
	        if (req.status != 200) {
	        	console.log('not 200');
	            console.log('Failed to upload matrix '  + req.status);
	        } else {
	        	//Got corner of matrix data.
	        	console.log('200');
	        	NgChmGui.mapProperties = JSON.parse(req.response);
	        	loadFunction();
		    }
		}
	};
	req.send();
}

NgChmGui.UTIL.loadHeaderData =  function() {
	document.getElementById("mapName").innerHTML = "<b>Heat Map Name:</b>&nbsp;&nbsp;"+NgChmGui.mapProperties.chm_name;
	document.getElementById("mapDesc").innerHTML = "<b>Heat Map Desc:</b>&nbsp;&nbsp;"+NgChmGui.mapProperties.chm_description;
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
 **********************************************************************************/
NgChmGui.UTIL.initMessageBox = function() {
	var msgBox = document.getElementById('msgBox');
	var headerpanel = document.getElementById('mdaServiceHeader');
	
	document.getElementById('msgBox').style.display = 'none';
	document.getElementById('msgBoxBtnImg_1').style.display = 'none';
	document.getElementById('msgBoxBtnImg_2').style.display = 'none';
	document.getElementById('msgBoxBtnImg_3').style.display = 'none';
	document.getElementById('msgBoxBtnImg_4').style.display = 'none';
	document.getElementById('msgBoxBtnImg_1')['onclick'] = null;
	document.getElementById('msgBoxBtnImg_2')['onclick'] = null;
	document.getElementById('msgBoxBtnImg_3')['onclick'] = null;
	document.getElementById('msgBoxBtnImg_4')['onclick'] = null;
}

NgChmGui.UTIL.setMessageBoxHeader = function(headerText) {
	var msgBoxHdr = document.getElementById('msgBoxHdr');
	msgBoxHdr.innerHTML = headerText;
}

NgChmGui.UTIL.setMessageBoxText = function(text, rows) {
	var msgBoxTxt = document.getElementById('msgBoxTxt');
	var textBoxHeight = (rows * 8) + 95;
	msgBoxTxt.style.width = '320px';
	msgBox.style.height = textBoxHeight+ 'px';
	msgBoxTxt.innerHTML = text;
}

NgChmGui.UTIL.setMessageBoxButton = function(buttonId, imageSrc, altText, onClick) {
	var buttonImg = document.getElementById('msgBoxBtnImg_'+buttonId);
	buttonImg.style.display = '';
	buttonImg.src = imageSrc;
	buttonImg.alt = altText;
	var fn = eval("(function() {"+onClick+"();})");
	buttonImg.onclick=fn;
}

NgChmGui.UTIL.messageBoxCancel = function() {
	NgChmGui.UTIL.initMessageBox();
}

NgChmGui.UTIL.matrixValidationError = function(msgText, rows) {
	NgChmGui.UTIL.initMessageBox();
	NgChmGui.UTIL.setMessageBoxHeader("Matrix Selection Error(s)");
	NgChmGui.UTIL.setMessageBoxText(msgText, rows);
	NgChmGui.UTIL.setMessageBoxButton(3, "images/cancelButton.png", "", "NgChmGui.UTIL.messageBoxCancel");
	document.getElementById('msgBox').style.display = '';
}





