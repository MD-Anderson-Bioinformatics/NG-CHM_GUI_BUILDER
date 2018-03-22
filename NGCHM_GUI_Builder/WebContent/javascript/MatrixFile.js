//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.FILE');

/**********************************************************************************
 * FUNCTION - Matrix: This function creates a matrix file object for displaying the
 * user selected matrix on the Matrix screen.
 **********************************************************************************/
NgChmGui.FILE.Matrix = function(fileSrc) {
	this.getMatrixFile = function () {
		return  new NgChmGui.FILE.MatrixFile( );
	}	
};  

/**********************************************************************************
 * FUNCTION - loadData: This function populates the name and description fields
 * on the Matrix Screen
 **********************************************************************************/
NgChmGui.FILE.loadData =  function() {
	document.getElementById("mapNameValue").value = NgChmGui.mapProperties.chm_name;
	document.getElementById("mapDescValue").value = NgChmGui.mapProperties.chm_description;

}

/**********************************************************************************
 * FUNCTION - loadClusterData: This function populates the dropdowns for row
 * and column ordering on the cluster screen.
 **********************************************************************************/
NgChmGui.FILE.loadClusterData =  function() {
	NgChmGui.UTIL.loadHeaderData();
	if (typeof NgChmGui.mapProperties.col_configuration !== 'undefined') {
		document.getElementById("ColOrder").value = NgChmGui.mapProperties.col_configuration.order_method;
		if (document.getElementById("ColOrder").value !== "Hierarchical") {
			document.getElementById("ColDistance").value = "euclidean";
			document.getElementById("ColAgglomeration").value = "ward";
		} else {
			document.getElementById("ColDistance").value = NgChmGui.mapProperties.col_configuration.distance_metric;
			document.getElementById("ColAgglomeration").value = NgChmGui.mapProperties.col_configuration.agglomeration_method;
		}
		NgChmGui.FILE.setColOrderVisibility();
	}
	if (typeof NgChmGui.mapProperties.row_configuration !== 'undefined') {
		document.getElementById("RowOrder").value = NgChmGui.mapProperties.row_configuration.order_method;
		if (document.getElementById("RowOrder").value !== "Hierarchical") {
			document.getElementById("RowDistance").value = "euclidean";
			document.getElementById("RowAgglomeration").value = "ward";
		} else {
			document.getElementById("RowDistance").value = NgChmGui.mapProperties.row_configuration.distance_metric;
			document.getElementById("RowAgglomeration").value = NgChmGui.mapProperties.row_configuration.agglomeration_method;
		}
		NgChmGui.FILE.setRowOrderVisibility();
	}
}

/**********************************************************************************
 * FUNCTION - setColOrderVisibility: This function sets the visibility of the column
 * agglomeration and distance metric dropdowns, based on the order method selected.
 **********************************************************************************/
NgChmGui.FILE.setColOrderVisibility =  function() {
	var distance = document.getElementById("ColDistance");
	var agglom = document.getElementById("ColAgglomeration");
	if (document.getElementById("ColOrder").value !== "Hierarchical") {
		distance.style.display = 'none';
		agglom.style.display = 'none';
	} else {
		distance.style.display = '';
		agglom.style.display = '';
	}
}

/**********************************************************************************
 * FUNCTION - setRowOrderVisibility: This function sets the visibility of the row
 * agglomeration and distance metric dropdowns, based on the order method selected.
 **********************************************************************************/
NgChmGui.FILE.setRowOrderVisibility =  function(orderVal) {
	var distance = document.getElementById("RowDistance");
	var agglom = document.getElementById("RowAgglomeration");
	if (document.getElementById("RowOrder").value !== "Hierarchical") {
		distance.style.display = 'none';
		agglom.style.display = 'none';
	} else {
		distance.style.display = '';
		agglom.style.display = '';
	}
}


/**********************************************************************************
 * FUNCTION - clusterMatrixData: This function calls the servlet to cluster matrix 
 * data (from the Cluster Panel) and displays the resultant heatmap changes in 
 * the view panel on the cluster screen.
 **********************************************************************************/
NgChmGui.FILE.clusterMatrixData =  function() {
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("cluster_frm") );
	req.open("POST", "Cluster", true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
	    		if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to upload matrix '  + req.status);
	        } else {
	    		if (NgChmGui.UTIL.debug) {console.log('200');}
	        	result = req.response;
	        	pieces = result.trim().split("|");
	        	NgChm.UTIL.embedCHM(pieces[1], pieces[0]);
	        	document.getElementById('clusterNextButton').style.display = '';
	    		NgChm.postLoad = function () {
	    			NgChm.heatMap.addEventListener(function (event, level) {
	    				if (event == NgChm.MMGR.Event_INITIALIZED) {
	    					document.getElementById('detail_chm').style.width = '4%';
	    					document.getElementById('summary_chm').style.width = '96%';
	    					NgChm.SUM.summaryResize();  
	    		   		 }
	    			});	
	    		};	
		    }
		}
	};
	req.send(formData);
}

/**********************************************************************************
 * FUNCTION - loadClusterView: This function runs when the cluster panel is
 * initially loading and drawing the heatmap image in the view panel.
 **********************************************************************************/
NgChmGui.FILE.loadClusterView = function() {
	var req = new XMLHttpRequest();
	req.open("GET", "Cluster", true);
	req.setRequestHeader("Content-Type", "application/json");
	req.onreadystatechange = function () {
		if (NgChmGui.UTIL.debug) {console.log('state change');}
		if (req.readyState == req.DONE) {
			if (NgChmGui.UTIL.debug) {console.log('done');}
	        if (req.status != 200) {
			if (NgChmGui.UTIL.debug) {console.log('not 200');}
	            console.log('Failed to load cluster view changes '  + req.status);
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
		    }
		}
	};
	req.send();
}

/**********************************************************************************
 * FUNCTION - addCovarDataEntry: This function will add a covariate file
 * color type preference panel to the data entry (left) panel on the Matrix
 * screen when a user adds a covariate bar by clicking on  on the matrix display 
 * handsontable.
 **********************************************************************************/
NgChmGui.FILE.addCovarDataEntry = function(item, id, name, itemCtr) {
	var prefsPanelDiv = document.getElementById("matrixCovsPanel");
	if (itemCtr === 0) {
	   	var covarTitle = NgChmGui.UTIL.getDivElement("covarPrefsTitle");
	   	covarTitle.className = 'sec-header';
	   	covarTitle.innerHTML = "Enter Color Type for Covariates"
   		covarTitle.style.display = '';
		prefsPanelDiv.appendChild(covarTitle);
	}
   	var covarDiv = NgChmGui.UTIL.getDivElement(item+"Div_"+id);
   	covarDiv.className = 'pref-header';
	var colorTypeOptionsSelect = "<select name='"+item+"Pref_"+id+"' id='"+item+"Pref_"+id+"';>" 
	var colorTypeOptions = "<option value='discrete'>Discrete</option><option value='continuous'>Continuous</option></select>";
	colorTypeOptionsSelect = colorTypeOptionsSelect+colorTypeOptions;
	covarDiv.innerHTML = "&nbsp;&nbsp;"+name+":&nbsp;&nbsp;"+colorTypeOptionsSelect;
	prefsPanelDiv.appendChild(covarDiv);
	covarDiv.style.display = '';
}

/**********************************************************************************
 * FUNCTION - removeCovarDataEntry: This function will remove a covariate file
 * color type preference panel from the data entry (left) panel on the Matrix
 * screen when a user removes a covariate bar by clicking on it for a second time
 * on the matrix display handsontable.
 **********************************************************************************/
NgChmGui.FILE.removeCovarDataEntry = function(item, id, itemCtr) {
	var itemDiv = document.getElementById(item+"Div_"+id); 
	itemDiv.remove();
	if (itemCtr === 1) {
		document.getElementById("covarPrefsTitle").remove(); 
	}
}

/**********************************************************************************
 * FUNCTION - MatrixFile: This function defines the MatrixFile object.
 **********************************************************************************/
NgChmGui.FILE.MatrixFile = function() {
	var dataTable = [];
	var colLabelCol = 0;
	var rowLabelRow = 0;
	var dataStartPos = [1,1];
	var rowCovs = [];
	var colCovs = [];
	var firstDataPos = [0,0];

	/**********************************************************************************
	 * FUNCTION - sendMatrix: This function executes when a user uploads a matrix file
	 * by selecting a matrix file.  It calls a servlet that uploads the matrix file
	 * to the session directory for the current heat map, receives a grid (portion) of
	 * that matrix file, and displays that grid in a handsontable object.
	 **********************************************************************************/
	this.sendMatrix = function() {
		var req = new XMLHttpRequest();
		var formData = new FormData( document.getElementById("matrix_frm") );
		req.open("POST", "UploadMatrix", true);
		req.onreadystatechange = function () {
			if (NgChmGui.UTIL.debug) {console.log('state change');}
			if (req.readyState == req.DONE) {
				if (NgChmGui.UTIL.debug) {console.log('done');}
		        if (req.status != 200) {
		    		if (NgChmGui.UTIL.debug) {console.log('not 200');}
		            console.log('Failed to upload matrix '  + req.status);
		        } else {
		        	//Display file name to right of file open button
		        	displayFileName();
		        	//Remove any previous dtat from matrix display box
		        	clearDisplayBox();
		        	//Got corner of matrix data.
		    		if (NgChmGui.UTIL.debug) {console.log('200');}
		        	topMatrixString = JSON.parse(req.response);
		        	var matrixBox = document.getElementById('matrix');
		        	var matrixDisplayBox = document.getElementById('matrixDisplay');
		        	matrixBox.style.display = '';
		        	matrixDisplayBox.style.display = '';
		        	document.getElementById('matrixNextButton').style.display = ''
		        	dataTable = Object.keys(topMatrixString).map(function(k) { return topMatrixString[k] });
		        	loadDataFromFile();
			    }
			}
		};
		req.send(formData);
	}
	
	/**********************************************************************************
	 * FUNCTION - processMatrix: This function executes when a user presses the next
	 * button on the Matrix screen.  It processes the matrix to create a working matrix
	 * based upon user inputs from the Matrix screen and calls the next screen
	 * in the build process.
	 **********************************************************************************/
	this.processMatrix = function() {
		var req = new XMLHttpRequest();
		var validMatrix = validateMatrixEntries();
		if (validMatrix) {
			var matrixJson = getJsonData();
			req.open("POST", "ProcessMatrix", true);
			req.setRequestHeader("Content-Type", "application/json");
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
			        	window.open("/NGCHM_GUI_Builder/NGCHMBuilder_Covariates.html","_self")
				    }
				}
			};
			req.send(matrixJson);
		}
	}
	
	/**********************************************************************************
	 * FUNCTION - validateMatrixEntries: This function validates user entries for 
	 * name and description on the Matrix screen returning a boolean for validity.
	 **********************************************************************************/
	function validateMatrixEntries() {
		var valid = true;
		var msgText = "";
		var bullet = "<br><b>-</b>";
		if (document.getElementById('mapNameValue').value.trim() === "") {
			msgText = msgText + bullet + " Missing Heat Map Name entry";
		}
		if (document.getElementById('mapDescValue').value.trim() === "") {
			msgText = msgText + bullet + " Missing Heat Map Description entry";
		}
		if (document.getElementById('matrixNameValue').value.trim() === "") {
			msgText = msgText + bullet + " Missing Matrix Name entry";
		}
		if (rowLabelRow < 0) {
			msgText = msgText + bullet + " Missing row label selection (in red)";
		}
		if (colLabelCol < 0) {
			msgText = msgText + bullet + " Missing column label selection (in red)";
		}
		
		if (msgText !== "") {
			msgText = "<br>The following data entry errors were found on the page:<br>" + msgText + "<br><br>";
			var rows = msgText.split("<br>").length;
			NgChmGui.UTIL.matrixValidationError(msgText, rows);
			valid = false;
		}
		return valid;
	}
	
	/**********************************************************************************
	 * FUNCTION - clearDisplayBox: This function clears all contents of the handsontable
	 * object.
	 **********************************************************************************/
	function clearDisplayBox() {
		colLabelCol = 0;
		rowLabelRow = 0;
		dataStartPos = [1,1];
		rowCovs = [];
		colCovs = [];
    	var container = document.getElementById('matrixDisplay');
    	while (container.hasChildNodes()) {
    		container.removeChild(container.lastChild);
    	}
	}
	
	/**********************************************************************************
	 * FUNCTION - displayFileName: This function displays the file name selected next
	 * to the "Open Matrix File" button.
	 **********************************************************************************/
	function displayFileName() {
    	var textSpan = document.getElementById('fileNameText');
    	while( textSpan.firstChild) {
    		textSpan.removeChild( textSpan.firstChild );
    	}
    	var filePath = document.getElementById('file-input').value;
    	var fileNameTxt = "  "+filePath.substring(12,filePath.length);
    	textSpan.appendChild(document.createTextNode(fileNameTxt));
	}
	
	/**********************************************************************************
	 * FUNCTION - getJsonData: This function create a JSON data object of all the 
	 * user entries in the Matrix screen to be passed to the ProcessMatrix servlet.
	 **********************************************************************************/
	 function getJsonData() { 
		var colCovTypes = [];
		var rowCovTypes = [];
		for (var i=0;i<colCovs.length;i++) {
			var covPos = colCovs[i];
			colCovTypes.push(document.getElementById("colColorTypePref_"+covPos).value);
		}
		for (var i=0;i<rowCovs.length;i++) {
			var covPos = rowCovs[i];
			rowCovTypes.push(document.getElementById("rowColorTypePref_"+covPos).value);
		}
		var someData =  {MapName: document.getElementById('mapNameValue').value,
		                 MapDesc: document.getElementById('mapDescValue').value,
		                 MatrixName: document.getElementById('matrixNameValue').value,
		                 FirstDataRow: firstDataPos[0],
		                 FirstDataCol: firstDataPos[1],
		                 DataStartRow: dataStartPos[0],
		                 DataStartCol: dataStartPos[1],
		                 RowLabelRow: rowLabelRow,
		                 ColLabelCol: colLabelCol,
		                 RowCovs: rowCovs,
		                 ColCovs: colCovs,
				         RowCovTypes: rowCovTypes,
				         ColCovTypes: colCovTypes};
		return JSON.stringify(someData);
	}

	/**********************************************************************************
	 * FUNCTION - loadDataFromFile: This function loads the handsontable object with
	 * data retrieved from the user selected input matrix.
	 **********************************************************************************/
	function loadDataFromFile() {
		var getData = (function () {
			return function () {
				    var page = parseInt(window.location.hash.replace('#', ''), 10) || 1,
					limit = 50,
					row = (page - 1) * limit,
					count = page * limit,
					part = dataTable;
				    return part;
				};
		    })();

	    	var container = document.getElementById('matrixDisplay');
		    var hot = new Handsontable(container, {
				data: getData(),
			    cells: function(row, col, prop) {
			        var cellProperties = {};
			        return cellProperties;
			      }
		    });
	   	 	Handsontable.hooks.add('afterOnCellMouseDown', function(evt, data){
				var rowLabelRadio  = document.getElementById('rowlabelPos');
				var colLabelRadio  = document.getElementById('collabelPos');
				var rowCovRadio  = document.getElementById('rowCovPos');
				var colCovRadio  = document.getElementById('colCovPos');
				var dataStartRadio  = document.getElementById('dataStart');
				var selColor;
		      	var row = data.row;
		      	var col = data.col;
		      	var covCtr = colCovs.length+rowCovs.length;
				var rowMeta = hot.getCellMeta(row, 0);
				var colMeta = hot.getCellMeta(0, col);
				var changeType = 'lab';
				if (rowLabelRadio.checked) {
					rowLabelRow = row;
					var rowPos = colCovs.indexOf(row);
					if (rowPos >= 0) {
						colCovs.splice(rowPos, 1);
					}
				} else if (colLabelRadio.checked) {
					colLabelCol = col;
					var colPos = rowCovs.indexOf(col);
					if (colPos >= 0) {
						rowCovs.splice(colPos, 1);
					}
				} else if (rowCovRadio.checked) {
					changeType = 'cov';
					var colPos = rowCovs.indexOf(col);
					if (col == colLabelCol) {
						colLabelCol = -1;
					}
					if (colPos < 0) {
						rowCovs.push(col);
						NgChmGui.FILE.addCovarDataEntry("rowColorType", col, hot.getDataAtCell(rowLabelRow,col),covCtr); 
					} else {
						rowCovs.splice(colPos, 1);
						NgChmGui.FILE.removeCovarDataEntry("rowColorType", col, covCtr);
					}
				} else if (colCovRadio.checked) {
					changeType = 'cov';
					var rowPos = colCovs.indexOf(row);
					if (row == rowLabelRow) {
						rowLabelRow = -1;
					}
					if (rowPos < 0) {
						colCovs.push(row);
						NgChmGui.FILE.addCovarDataEntry("colColorType", row, hot.getDataAtCell(row,colLabelCol),covCtr); 
					} else {
						colCovs.splice(rowPos, 1);
						NgChmGui.FILE.removeCovarDataEntry("colColorType", row, covCtr); 
					}
				} else if (dataStartRadio.checked) {
					changeType = 'ds';
					dataStartPos = [row,col]
				}   
				clearAllSelections(hot);
				setAllSelections(hot,changeType);
		        hot.render();
		      },hot);

		    Handsontable.dom.addEvent(window, 'hashchange', function(event){
			hot.loadData(getData());
			
	    });
		setAllSelections(hot,'lab')
        hot.render();
		return hot;
	}

	function selectDataStartSelection(hot,row,col) {
	    for(var i = row; i < hot.countRows(); i++){
		    for(var j = col; j < hot.countCols(); j++){
	        	hot.setCellMeta(i, j, 'className', 'green');
			}
	    }
	}
	  
	function clearCovArray(array,value) {
		var removalItems = [];
		for (var i=0;i<array.length;i++) {
			var currItem = array[i];
			if (currItem >= value) {
				removalItems.push(i);
			}
		}
		for (var j=removalItems.length;j>0;j--) {
			var ridMe = removalItems[j-1];
			array.splice(ridMe);
		}
	}
	  
	function applyCovSelections(hot) {
	    var selColor = 'yellow';
		for (var i=0;i<colCovs.length;i++) {
			var row = colCovs[i];
	        for(var j = 0; j < hot.countCols(); j++){
	        	if (j >= firstDataPos[1]) {
	        		hot.setCellMeta(row, j, 'className', selColor);
	        	}
	        }
		}
		for (var i=0;i<rowCovs.length;i++) {
			var col = rowCovs[i];
	        for(var j = 0; j < hot.countRows(); j++){
	        	if (j >= firstDataPos[0]) {
	        		hot.setCellMeta(j, col, 'className', selColor);
	        	}
	        }
		}
	}
	  
	function applyDataStartSelection(hot) {
	    var dsRow = dataStartPos[0];
	    var dsCol = dataStartPos[1];
	    for(var i = dsRow; i < hot.countRows(); i++){
		    for(var j = dsCol; j < hot.countCols(); j++){
	          hot.setCellMeta(i, j, 'className', 'green');
		    }
	    }
	}
	  
	function applyLabelSelections(hot) {
	    var selColor = 'red';
        for(var j = 0; j < hot.countCols(); j++){
        	if (j >= firstDataPos[1]) {
    			hot.setCellMeta(rowLabelRow, j, 'className', selColor);
        	}
        }
        for(var j = 0; j < hot.countRows(); j++){
        	if (j >= firstDataPos[0]) {
    			hot.setCellMeta(j, colLabelCol, 'className', selColor);
        	}
        }
	}
	  
	function setFirstDataPos(hot) {
		  var firstRowCov = 100;
		  var firstColCov = 100;
		  for (var i=0;i<colCovs.length;i++) {
			  var row = colCovs[i];
			  if (row < firstColCov) {
				  firstColCov = row;
			  }
		  }
		  for (var i=0;i<rowCovs.length;i++) {
			  var col = rowCovs[i];
			  if (col < firstRowCov) {
				  firstRowCov = col;
			  }
		  }
		  if (rowLabelRow < firstColCov) {
			  firstColCov = rowLabelRow;
		  }
		  if (colLabelCol < firstRowCov) {
			  firstRowCov = colLabelCol;
		  }
		  firstDataPos[0] = firstColCov;
		  firstDataPos[1] = firstRowCov;
	}
	  
	function adjustDataStart(hot) {
		  var lastRowCov = 0;
		  var lastColCov = 0;
		  for (var i=0;i<colCovs.length;i++) {
			  var row = colCovs[i];
			  if (row > lastColCov) {
				  lastColCov = row;
			  }
		  }
		  for (var i=0;i<rowCovs.length;i++) {
			  var col = rowCovs[i];
			  if (col > lastRowCov) {
				  lastRowCov = col;
			  }
		  }
		  if (colLabelCol > lastRowCov) {
			  lastRowCov = colLabelCol;
		  }
		  if (rowLabelRow > lastColCov) {
			  lastColCov = rowLabelRow;
		  }
		  if (dataStartPos[0] <= lastColCov) {
			  dataStartPos[0] = lastColCov+1;
		  }
		  if (dataStartPos[1] <= lastRowCov) {
			  dataStartPos[1] = lastRowCov+1;
		  }
	}
	  
	function setAllSelections(hot,change) {
		  if (change === 'ds') {
			  clearCovArray(colCovs,dataStartPos[0]);
			  clearCovArray(rowCovs,dataStartPos[1]);
		  } else {
			  adjustDataStart(hot);
		  }
		  setFirstDataPos(hot);
		  applyCovSelections(hot);
		  applyDataStartSelection(hot);
		  applyLabelSelections(hot) 
	}
	  
	function clearAllSelections(hot) {
		    for(var i = 0; i < hot.countRows(); i++){
			    for(var j = 0; j < hot.countCols(); j++){
		        	hot.setCellMeta(i, j, 'className', undefined);
			    }
		    }
	}

};
