
//Define Namespace for NgChmGui MatrixFile
NgChmGui.createNS('NgChmGui.FILE');

//Create a MatrixManager to retrieve heat maps. 
//Need to specify a fileSrc of heat map data - 
//web server or local file.
NgChmGui.FILE.Matrix = function(fileSrc) {
	this.getMatrixFile = function () {
		return  new NgChmGui.FILE.MatrixFile( );
	}	
};  

NgChmGui.FILE.loadData =  function() {
	document.getElementById("mapNameValue").value = NgChmGui.mapProperties.chm_name;
	document.getElementById("mapDescValue").value = NgChmGui.mapProperties.chm_description;

}

NgChmGui.FILE.loadClusterData =  function() {
	NgChmGui.UTIL.loadHeaderData();
	if (typeof NgChmGui.mapProperties.col_configuration !== 'undefined') {
		document.getElementById("ColOrder").value = NgChmGui.mapProperties.col_configuration.order_method;
		document.getElementById("ColDistance").value = NgChmGui.mapProperties.col_configuration.distance_metric;
		document.getElementById("ColAgglomeration").value = NgChmGui.mapProperties.col_configuration.agglomeration_method;
	}
	if (typeof NgChmGui.mapProperties.row_configuration !== 'undefined') {
		document.getElementById("RowOrder").value = NgChmGui.mapProperties.row_configuration.order_method;
		document.getElementById("RowDistance").value = NgChmGui.mapProperties.row_configuration.distance_metric;
		document.getElementById("RowAgglomeration").value = NgChmGui.mapProperties.row_configuration.agglomeration_method;
	}
}

NgChmGui.FILE.clusterMatrixData =  function() {
	var req = new XMLHttpRequest();
	var formData = NgChmGui.UTIL.toURIString( document.getElementById("cluster_frm") );
	req.open("POST", "Cluster", true);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	req.onreadystatechange = function () {
		console.log('state change');
		if (req.readyState == req.DONE) {
			console.log('done');
	        if (req.status != 200) {
	        	console.log('not 200');
	            console.log('Failed to upload matrix '  + req.status);
	        } else {
	        	console.log('200');
	        	result = req.response;
	        	pieces = result.trim().split("|");
	        	NgChm.UTIL.embedCHM(pieces[1], pieces[0]);
	        	document.getElementById('clusterView').style.display = '';
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


NgChmGui.FILE.MatrixFile = function() {
	var dataTable = [];
	var colLabelCol = 0;
	var rowLabelRow = 0;
	var dataStartPos = [1,1];
	var rowCovs = [];
	var colCovs = [];
	var firstDataPos = [0,0];

	this.sendMatrix = function() {
		var req = new XMLHttpRequest();
		var formData = new FormData( document.getElementById("matrix_frm") );
		req.open("POST", "UploadMatrix", true);
		req.onreadystatechange = function () {
			console.log('state change');
			if (req.readyState == req.DONE) {
				console.log('done');
		        if (req.status != 200) {
		        	console.log('not 200');
		            console.log('Failed to upload matrix '  + req.status);
		        } else {
		        	//Display file name to right of file open button
		        	displayFileName();
		        	//Remove any previous dtat from matrix display box
		        	clearDisplayBox();
		        	//Got corner of matrix data.
		        	console.log('200');
		        	topMatrixString = JSON.parse(req.response);
		        	var matrixBox = document.getElementById('matrix');
		        	var matrixDisplayBox = document.getElementById('matrixDisplay');
		        	matrixBox.style.display = '';
		        	matrixDisplayBox.style.display = '';
		        	dataTable = Object.keys(topMatrixString).map(function(k) { return topMatrixString[k] });
		        	loadDataFromFile();
			    }
			}
		};
		req.send(formData);
	}
	
	this.processMatrix = function() {
		var req = new XMLHttpRequest();
		var validMatrix = validateMatrixEntries();
		if (validMatrix) {
			var matrixJson = getJsonData();
			req.open("POST", "ProcessMatrix", true);
			req.setRequestHeader("Content-Type", "application/json");
			req.onreadystatechange = function () {
				console.log('state change');
				if (req.readyState == req.DONE) {
					console.log('done');
			        if (req.status != 200) {
			        	console.log('not 200');
			            console.log('Failed to process matrix '  + req.status);
			        } else {
			        	console.log('200');
				    }
				}
			};
			req.send(matrixJson);
		}
	}
	
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
	
	function displayFileName() {
    	var textSpan = document.getElementById('fileNameText');
    	while( textSpan.firstChild) {
    		textSpan.removeChild( textSpan.firstChild );
    	}
    	var filePath = document.getElementById('file-input').value;
    	var fileNameTxt = "  "+filePath.substring(12,filePath.length);
    	textSpan.appendChild(document.createTextNode(fileNameTxt));
	}
	
	 function getJsonData() {     
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
		                 ColCovs: colCovs};
		return JSON.stringify(someData);
	}

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
				var rowMeta = hot.getCellMeta(row, 0);
				var colMeta = hot.getCellMeta(0, col);
				var changeType = 'lab';
				if (rowLabelRadio.checked) {
					rowLabelRow = row;
					var rowPos = rowCovs.indexOf(row);
					if (rowPos >= 0) {
						rowCovs.splice(rowPos, 1);
					}
				} else if (colLabelRadio.checked) {
					colLabelCol = col;
					var colPos = colCovs.indexOf(col);
					if (colPos >= 0) {
						colCovs.splice(colPos, 1);
					}
				} else if (rowCovRadio.checked) {
					changeType = 'cov';
					var colPos = rowCovs.indexOf(col);
					if (col == colLabelCol) {
						colLabelCol = -1;
					}
					if (colPos < 0) {
						rowCovs.push(col);
					} else {
						rowCovs.splice(colPos, 1);
					}
				} else if (colCovRadio.checked) {
					changeType = 'cov';
					var rowPos = colCovs.indexOf(row);
					if (row == rowLabelRow) {
						rowLabelRow = -1;
					}
					if (rowPos < 0) {
						colCovs.push(row);
					} else {
						colCovs.splice(rowPos, 1);
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
