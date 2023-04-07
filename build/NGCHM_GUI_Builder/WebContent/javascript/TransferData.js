'use strict';

//Define Namespace for NgChmGui TransferData
NgChmGui.createNS('NgChmGui.XFER');

// This file implements the "Upload data to Builder" functionality (see Upload_Matrix.html).
//
// It receives the NG-CHM data sent from the opening page (e.g. the NG-CHM viewer) via postMessage,
// reformats it, uploads it the GUI Builder server, and opens the builder's View_HeatMap.html page.
//
(function() {

    // The nonce specified as a URL parameter is used to identify the specific process within
    // the opening page that we should communicate with.
    const nonce = getURLParameter ('nonce');

    console.log ('Transfer.js version 0.0.13 nonce: ' + nonce);

    var ngchmData = null;	// The ngchmData received from the opening page.
    const tileMap = new Map();	// The tiles received from the opening page.
    var numTiles = 0;		// The number of tiles received from the opening page.

    // Show a progress message in the Upload_Matrix.html page.
    // For normal messages, leave level unspecified.  It can also
    // be set to 'warning' or 'error' to highlight messages.
    //
    function logProgress (message, level) {
	const progressLog = document.getElementById('progressLog');
	const el = document.createElement ('P');
	if (level) el.classList.add (level);
	el.innerText = message;
	progressLog.appendChild (el);
    }

    // Call this when page has initialized and is ready to listen for messages.
    NgChmGui.XFER.listenForMessages = function () {
	// Remove default error message.
	const progressLog = document.getElementById('progressLog');
	progressLog.removeChild (document.getElementById('loadError'));

	window.addEventListener ("message", messageListener);
    };

    // This function listens for messages, validates their source, and then dispatches
    // to handling process.
    //
    // Protocol:
    // - Opening page sends 'probe' messages until we are ready to accept.
    // - We respond with 'ready' message.
    // - Opening page sends 'ngchm' and 'ngchm-tile' messages.
    //   - When we have received 'ngchm' and all expected 'ngchm-tile' messages:
    //     - We no longer expect any communication to/from the opening page.
    //     - uploadDataToBuilder is called to upload data to the builder.
    function messageListener (ev) {
	const debug = false;

	if (ev.data.nonce !== nonce) {
	    // Totally ignore messages not meant for us.
	    return;
	}
	// Validate that the message was sent by the window.opener.
	if (ev.source !== window.opener) {
	    logProgress ('Got message from unexpected source', 'error');
	    console.error ('Got message from unexpected source', source, window.opener);
	    return;
	}
	if (ev.data.op == 'probe') {
	    if (debug) console.log ('Got probe message', ev);
	    logProgress ('Established communication with source');
	    // Respond to source to let them know we're ready to received data.
	    ev.source.postMessage ({ op: 'ready', nonce, }, ev.origin == 'null' ? "*" : ev.origin);
	}
	else if (ev.data.op == 'ngchm') {
	    if (debug) console.log ('Got NG-CHM data message', ev.data.ngchm);
	    ngchmData = ev.data.ngchm;
	    const mapDims = '' + selectionSize (ngchmData.rowSelection) + ' rows, ' + selectionSize (ngchmData.colSelection) + ' columns.';
	    logProgress ('Receiving data for map ' + ngchmData.mapName + ', with ' + mapDims);
	    checkAllDataReceived ();
	} else if (ev.data.op == 'ngchm-tile') {
	    if (debug) console.log ('Got NG-CHM tile message', ev.data.row, ev.data.col, ev.data.tile, );
	    tileMap.set (ev.data.row + '-' + ev.data.col, ev.data.tile);
	    numTiles++;
	    checkAllDataReceived ();
	} else {
	    logProgress ('Got unknown message', 'error');
	    console.error ('Got unknown message', ev);
	}
    }

    // Extract and return the URL parameter specified by name.
    function getURLParameter (name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||'';
    }

    // Check that we have received ngchmData and all expected data tiles from the source.
    // If so, call uploadDataToBuilder to upload appropriate data to the builder.
    function checkAllDataReceived () {
	const debug = false;
	if (!ngchmData) return;
	const expectedRows = ngchmData.tiles.endRowTile - ngchmData.tiles.startRowTile + 1;
	const expectedCols = ngchmData.tiles.endColTile - ngchmData.tiles.startColTile + 1;
	const expectedTiles = expectedRows * expectedCols;
	if (numTiles != expectedTiles) return;

	// All expected data has now been received.
	setTimeout (() => {
	    wrapUploadDataToBuilder ();
	}, debug ? 10000 : 0);
    }

    // Return the total number of elements in the selection.
    function selectionSize (selection) {
	return selection.map(range => range[1]-range[0]+1).reduce((acc,val) => acc+val);
    }

    // Wrap uploadDataToBuilder in a try/catch block
    // to catch unexpected errors.
    async function wrapUploadDataToBuilder () {
	try {
	    await uploadDataToBuilder();
	}
	catch (error) {
	    console.error (error);
	    logProgress ('Unexpected error encountered: ' + error, 'error');
	}
    }

    // Asynchronously upload the selected NG-CHM data to the Builder.
    //
    // - Create a FormData object containing all the NG-CHM files to upload.
    // - Send the FormData object to the Builder.
    // - Get MapProperties from the Builder.
    // - Modify the MapProperties and upload to the Builder.
    // - Advance to the View_HeatMap page.
    //
    async function uploadDataToBuilder () {

	const debug = false;
	const mapInfo = ngchmData.mapConfig.data_configuration.map_information;
	const dataLevel = mapInfo.levels.d || mapInfo.levels.s || mapInfo.levels.tn;
	const classificationFiles = [];

	console.log ('Upload:', ngchmData);
	const allRows = isFullSelection (ngchmData.rowSelection, dataLevel.total_rows);
	const allCols = isFullSelection (ngchmData.colSelection, dataLevel.total_cols);

	const addRowDendrogram = allRows && allCols && ngchmData.mapData.row_data.dendrogram;
	const addColDendrogram = allRows && allCols && ngchmData.mapData.col_data.dendrogram;

	logProgress ('Collecting the NG-CHM data to upload.');
	const formData = createUploadForm ();

	const baseURL = window.location.href.replace(/Upload_Matrix.*/, '');

	logProgress ('Uploading the NG-CHM data to the builder.');
	const uploadRes = await fetch (baseURL + 'UploadMatrix', { method: "POST", body: formData }).then (response => response.text());
	if (uploadRes[0] == 'E') {
	    console.error ('ERROR uploading data to builder: ' + uploadRes);
	    logProgress (uploadRes, 'error');
	    return;
	}
	if (debug) console.log ('POST.UploadMatrix.response ', JSON.parse (uploadRes));

	logProgress ('Processing the uploaded data.');
	const processData = getProcessMatrixData();
	const processRes = await fetch (baseURL + 'ProcessMatrix', { method: 'POST', body: processData }).then (response => response.text());
	if (processRes[0] == 'E') {
	    console.error ('ERROR processing the data: ' + processRes);
	    logProgress (processRes, 'error');
	    return;
	}
	const processJSON = JSON.parse(processRes);
	if (processJSON.return_code != 0) {
	    console.error ('ERROR processing the data: ' + processJSON.return_code);
	    logProgress (processJSON.return_code, 'error');
	}

	if (debug) console.log ('POST.ProcessMatrix.response', processJSON);

	// Get the initial MapProperties from the builder.
	const getPropsRes = await fetch (baseURL + 'MapProperties').then (response => response.text());
	if (getPropsRes[0] == 'E') {
	    console.error ('ERROR getting the new map properties: ' + getPropsRes);
	    logProgress (getPropsRes, 'error');
	    return;
	}
	const getPropsJSON = JSON.parse (getPropsRes);
	if (debug) console.log ('GET.MapProperties.response', getPropsJSON);

	// Verify that the matrix file was accepted.
	if (!getPropsJSON.matrix_files || getPropsJSON.matrix_files.length == 0) {
	    console.error ('No matrix files', getPropsJSON);
	    logProgress ('File upload was not accepted', 'error');
	    throw new Error ('File upload was not accepted');
	}

	// Update the MapProperties.
	logProgress ("Setting the new map's properties.");
	const newMapProperties = updateBuilderProperties (getPropsJSON, classificationFiles, addRowDendrogram, addColDendrogram);
	if (debug) console.log ('Updated MapProperties: ', newMapProperties);

	const setPropsRes = await fetch (baseURL + 'MapProperties', { method: 'POST', body: JSON.stringify (newMapProperties) }).then(response => response.text());
	if (setPropsRes[0] == 'E') {
	    console.error ('ERROR setting the new map properties: ' + setPropsRes);
	    logProgress (setPropsRes, 'error');
	    return;
	}
	const setPropsJSON = JSON.parse(setPropsRes);
	if (setPropsJSON.builder_config.buildErrors) {
	    console.error ('ERROR setting the new map properties: ' + setPropsJSON.builder_config.buildErrors);
	    logProgress (setPropsJSON.builder_config.buildErrors, 'error');
	    return;
	}
	if (debug) console.log ('POST.MapProperties.response', setPropsJSON);

	// Go to the Transform_Matrix.html page.
	logProgress ('Advancing to the View_HeatMap page.');
	setTimeout (() => {
	    window.open (baseURL + 'View_HeatMap.html?adv=Y', "_self");
	}, debug ? 10000 : 0);

	/////////////////////////////////////////////////////////////////////////////////////////////////

	// Return true iff selection is a single range that covers all elements from 1 to total.
	function isFullSelection (selection, total) {
	    return selection.length == 1 && selection[0][0] == 1 && selection[0][1] == total;
	}

	// Create and return a FormData object containing the following files:
	// - the matrix data
	// - row and column dendrogram and order files (if uploading)
	// - covariate data files for each row and column covariate.
	function createUploadForm () {
	    const debug = false;
	    const formData = new FormData();
	    logProgress (' - Adding the NG-CHM map data');
	    addMatrixDataToForm ();
	    if (addRowDendrogram) {
		logProgress (' - Adding the NG-CHM row dendrogram data');
		addDendrogramToForm ('row', ngchmData.mapData.row_data);
	    } else if (ngchmData.mapData.row_data.dendrogram) {
		logProgress (' - Excluding NG-CHM row dendrogram data because only a subset of data is selected', 'warning');
	    }
	    if (addColDendrogram) {
		logProgress (' - Adding the NG-CHM column dendrogram data');
		addDendrogramToForm ('col', ngchmData.mapData.col_data);
	    } else if (ngchmData.mapData.col_data.dendrogram) {
		logProgress (' - Excluding NG-CHM column dendrogram data because only a subset of data is selected', 'warning');
	    }
	    logProgress (' - Adding the NG-CHM covariate data');
	    addCovariatesToForm ('col', ngchmData.colSelection, ngchmData.mapConfig.col_configuration, ngchmData.mapData.col_data);
	    addCovariatesToForm ('row', ngchmData.rowSelection, ngchmData.mapConfig.row_configuration, ngchmData.mapData.row_data);
	    return formData;

	    // Add axis-dendro.tsv and axis-order.tsv to the Form for axis=row or axis=col.
	    function addDendrogramToForm (axis, axisData) {
		const dendroData = [ "A\tB\tHeight\n" ].concat (axisData.dendrogram.map (val => val.replaceAll(/,/g, '\t')+'\n'));
		formData.append (axis+'-dendro', new Blob ([dendroData.join('')], { type: 'text/tab-separated-values' }), ngchmData.mapName + '-' + axis + '-dendro.tsv');
		const orderData = [ "Id\tOrder\n" ].concat (axisData.label.labels.map ((val,idx) => val + '\t' + (idx+1) + '\n'));
		formData.append (axis+'-order', new Blob ([orderData.join('')], { type: 'text/tab-separated-values' }), ngchmData.mapName + '-' + axis + '-order.tsv');
	    }

	    // Add a file to the Form for every covariate on axis.
	    // axisConfig is the axis configuration in ngchmData.mapConfig.
	    // axisData is axis data in ngchmData.mapData.
	    function addCovariatesToForm (axis, selections, axisConfig, axisData) {
		if (debug) console.log ('AddCov', { axis, selections, axisConfig, axisData });
		const labels = getSelectedItems (selections, axisData.label.labels);
		axisConfig.classifications_order.forEach ((covName,idx) => {
		    const cov = axisConfig.classifications[covName];
		    const covData = getSelectedItems (selections, axisData.classifications[covName].values);
		    const lines = [ cov.color_map.type+'\n' ].concat (covData.map((val,idx) => labels[idx]+'\t'+val+'\n'));
		    formData.append (axis+'-cov-'+idx, new Blob ([lines.join('')], { type: 'text/tab-separated-values' }), ngchmData.mapName + '-' + axis + '-cov-' + idx + '.tsv');
		    const filename = axis + '-cov-' + idx + '.txt';
		    classificationFiles.push ({
			bar_type: cov.bar_type,
			bg_color: cov.bg_color,
			change_type: "N",
			color_map: cov.color_map,
			filename: filename,
			height: cov.height,
			high_bound: cov.high_bound,
			low_bound: cov.low_bound,
			name: covName,
			path: filename,  // Add path later once we know it.
			position: axis,
			show: cov.show,
		    });
		});
	    }

	    // Return an array of the selected items in data.
	    // data is a standard 0-indexed array of any type.
	    // selections is an array of 2-tuples: index of first and last item of a range (1 indexed).
	    // All indices in selections must be in the range 1 .. data.length.
	    function getSelectedItems (selections, data) {
		const selectedItems = [].concat.apply([], selections.map (select => data.slice(select[0]-1, select[1])));
		return selectedItems;
	    }

	    // Returns true iff index (1-based) is in one of the selections.
	    function indexInSelection (index, selections) {
		for (let i = 0; i < selections.length; i++) {
		    if (index >= selections[i][0] && index <= selections[i][1]) {
			return true;
		    }
		}
		return false;
	    }

	    // Return a Float32Array of the selected items in the Float32Array data.
	    // data is expected to be a slice of a much larger Float32Array.
	    // selections is an array of 2-tuples, each the indices of the first and last items in a range (1 indexed).
	    //
	    // The 'first' and 'last' parameters map the indices in selections to the data array.
	    // 'first' is the selection index for data[0] and 'last' is the selection index for data[data.length-1].
	    // first and last are both 1-indexed like the indices in selections.
	    //
	    // Any parts of selections outside the range first to last are ignored.
	    // Tuples partially overlapping the range are truncated to the range.
	    //
	    function getSelectedItemsInFloat32Array (selections, first, last, data) {
		// Filter out any selection tuples that don't overlap the range.
		const selectionsF = selections.filter (select => (select[1] >= first) && (select[0] <= last));
		// Truncate remaining selection tuples to the range and transform to 0-based indices.
		const selectionsM = selectionsF.map (select => [ Math.max (0, select[0]-first), Math.min ( last-first+1,  select[1]-first) ]);
		// Grab a slice of data for each selection tuple.
		const selectionsS = selectionsM.map (select => data.slice(select[0], select[1]+1));
		// Concatenate and return the data slices.
		return concatArrays (selectionsS);
	    }

	    // Concatenate and return an array of Float32Arrays.
	    function concatArrays (f32vec) {
		// Frequent common case.
		if (f32vec.length == 1) {
		    return f32vec[0];
		}
		// Allocate a Float32Array that can hold all the data.
		const totalLength = f32vec.reduce((total,vec) => total+vec.length, 0);
		const all = new Float32Array (totalLength);
		// Copy each Float32Array into the combined array.
		let pos = 0;
		for (let i = 0; i < f32vec.length; i++) {
		    all.set (f32vec[i], pos);
		    pos += f32vec[i].length;
		}
		// Return the combined array.
		return all;
	    }

	    // Add the matrix data to the Form.
	    function addMatrixDataToForm () {
		if (debug) console.log ('AddMapDataToForm', ngchmData);
		// Construct matrix: an array containing a header line plus one line for each selected row.
		// Each line is a string containing tab-separated-values for the label and the selected columns, terminated by a newline.
		const matrix = [];
		// Header: blank field followed by tab-separated labels for the selected columns.
		matrix.push ('\t' + getSelectedItems (ngchmData.colSelection, ngchmData.mapData.col_data.label.labels).join('\t') + '\n');
		// Go down every row of the matrix, keeping track of the current row tile.
		let tileRow = 1;
		let rowInTile = 0;
		for (let row = 0; row < dataLevel.total_rows; row++) {
		    if (rowInTile == dataLevel.rows_per_tile) {
			tileRow++;
			rowInTile = 0;
		    }
		    if (indexInSelection (row+1, ngchmData.rowSelection)) {
			// This row is selected.
			// Build a string array containing the row label and the tab-separated selected columns.
			const rowData = [];
			// Add the current row label.
			rowData.push (ngchmData.mapData.row_data.label.labels[row]);
			// Scan all columns, one tile at a time, keeping track of the current column tile.
			let tileCol = 1;
			for (let col = 0; col < dataLevel.total_cols; ) {
			    const colsInTile = Math.min (dataLevel.cols_per_tile, dataLevel.total_cols - col);
			    const tile = tileMap.get (tileRow + '-' + tileCol);
			    if (tile) {
				// This tile is available. Append any selected data to the row as a tab-separated string.
				const base = colsInTile * rowInTile;
				const selected = getSelectedItemsInFloat32Array (ngchmData.colSelection, col+1, col+colsInTile, tile.slice(base, base+colsInTile));
				if (selected.length > 0) rowData.push (selected.map(val => ''+val).join('\t'));
			    }
			    tileCol++;
			    col += colsInTile;
			}
			// Row complete. Join the parts of rowData together with tabs and push onto the matrix data.
			matrix.push (rowData.join('\t')+'\n');
		    }
		    rowInTile++;
		}
		// Matrix complete. Join the rows together, convert to a blob, and add to formData.
		const matrixFileName = ngchmData.mapName + '-' + ngchmData.currentLayer + '.tsv';
		formData.append ('matrix', new Blob ([matrix.join('')], { type: 'text/tab-separated-values' }), matrixFileName);
	    }
	}
    }

    // Copy as many map properties as possible from the NG-CHM into the builder's map properties.
    function updateBuilderProperties (builderProperties, covariateFiles, addRowDendrogram, addColDendrogram) {
	// Determine the data directory for this session on the server.
	const basePath = builderProperties.matrix_files[0].path.replace(/workingMatrix.txt/, '');

	// Copy the mapConfig data for the rows and columns to builderProperties.
	// Adjust the dendrogram data if we are not copying the dendrogram data to the builder.
	updateAxisConfig ("row", builderProperties.row_configuration, ngchmData.mapConfig.row_configuration, addRowDendrogram);
	updateAxisConfig ("col", builderProperties.col_configuration, ngchmData.mapConfig.col_configuration, addColDendrogram);
	// Copy the mapData data for the rows and columns to builderProperties.
	updateAxisData ("row", builderProperties.row_configuration, ngchmData.mapData.row_data);
	updateAxisData ("col", builderProperties.col_configuration, ngchmData.mapData.col_data);
	// Copy the data layer color map.
	setMapColors (builderProperties.matrix_files[0]);
	// Copy the map attributes.
	setMapAttributes ();
	// Fix the paths for the covariate files, now that we know basePath.
	for (let i = 0; i < covariateFiles.length; i++) {
	    covariateFiles[i].path = basePath + covariateFiles[i].path;
	}
	builderProperties.classification_files = covariateFiles;
	return builderProperties;

	// Copy the map colors from the current NG-CHM layer into the builder's data layer.
	function setMapColors (builderLayer) {
	    const ngchmLayer = ngchmData.mapConfig.data_configuration.map_information.data_layer[ngchmData.currentLayer];
	    builderLayer.color_map = ngchmLayer.color_map;
	    builderLayer.original_thresholds = ngchmLayer.color_map.thresholds;
	    builderLayer.cuts_color = ngchmLayer.cuts_color;
	    builderLayer.grid_color = ngchmLayer.grid_color;
	    builderLayer.grid_show = ngchmLayer.grid_show;
	    builderLayer.selection_color = ngchmLayer.selection_color;
	}

	// Copy the NG-CHM attributes to builderProperties.
	// - Filter out chm.info.build.time since it will be replaced by the builder.
	function setMapAttributes () {
	    // Convert attributes from { attr1: value1, attr2: value2 } to [ { attr1: value1 }, { attr2: value2 } ].
	    const attributes = ngchmData.mapConfig.data_configuration.map_information.attributes;
	    builderProperties.chm_attributes = Object.entries(attributes).filter(tuple => tuple[0] != 'chm.info.build.time').map(tuple => Object.fromEntries([tuple]));
	}

	// For axis, update the builder's builderAxisConfig using the originating NG-CHM's ngchmAxisConfig.
	function updateAxisConfig (axis, builderAxisConfig, ngchmAxisConfig, addDendrogram) {
	    // Update the dendrogram and clustering data.
	    builderAxisConfig.order_method = addDendrogram ? ngchmAxisConfig.organization.order_method : 'Original';
	    builderAxisConfig.agglomeration_method = ngchmAxisConfig.organization.agglomeration_method;
	    if (builderAxisConfig.agglomeration_method.startsWith('ward')) {
		builderAxisConfig.agglomeration_method = 'ward';
	    }
	    builderAxisConfig.distance_metric = ngchmAxisConfig.organization.distance_metric;
	    builderAxisConfig.dendro_show = ngchmAxisConfig.dendrogram.show;
	    builderAxisConfig.dendro_height = ngchmAxisConfig.dendrogram.height;
	    if (addDendrogram) {
		builderAxisConfig.dendro_file = basePath + axis + "Dendro.txt";
		builderAxisConfig.order_file = basePath + axis + "Order.txt";
	    }

	    // Copy the top items
	    builderAxisConfig.top_items = ngchmAxisConfig.top_items;
	}

	// For axis, update builder's builderAxisConfig using the originating NG-CHM's axisData.
	function updateAxisData (axis, builderAxisConfig, axisData) {
	    // Update the axis label types
	    builderAxisConfig.data_type = axisData.label.label_type;
	}
    }

    // Return a stringified JSON object specifying how to process the initial data upload.
    //
    function getProcessMatrixData () {
	const mapName = ngchmData.mapConfig.data_configuration.map_information.name;
	const matrixName = mapName + '_' + ngchmData.currentLayer;
	const processData =  {
	    mapName: mapName,
	    mapDesc: ngchmData.mapConfig.data_configuration.map_information.description,
	    matrixName: matrixName,
	    matrixSummaryMethod: 'average',  // Data from NG-CHM does not seem to include this.
	    firstDataRow: 0,	// Row and column in data file where the data matrix starts (0-index)
	    firstDataCol: 0,
	    dataStartRow: 1,	// Row and column in data file where the data starts (0-index)
	    dataStartCol: 1,
	    rowLabelRow: 0,	// Row and column in data file for the row and column labels (0-index)
	    colLabelCol: 0,
	    rowCovs: [],	// We'll add these later.
	    colCovs: [],
	    rowCovTypes: [],
	    colCovTypes: [],
	    rowCovNames: [],
	    colCovNames: [],
	    isSample: 'N',
	    matrixFileName: matrixName + '.tsv',
	};
	return JSON.stringify(processData);
    }
})();
