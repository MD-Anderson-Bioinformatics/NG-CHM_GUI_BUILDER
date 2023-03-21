package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.regex.Pattern;
import java.util.Map;


import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import org.apache.tomcat.util.http.fileupload.FileUtils;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/CallNgChmBuilder")
@MultipartConfig
public class CallNgChmBuilder extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession();
		response.setContentType("application/json;charset=UTF-8");

	    // Create path components to save the file
	    final Part filePart = request.getPart("Matrix");
	    final String mapName = request.getParameter("MapName");
	    final String mapDesc = request.getParameter("MapDescription");
	    OutputStream out = null;
	    InputStream filecontent = null;
        ArrayList<String> errors = new ArrayList<String>();
	    final PrintWriter writer = response.getWriter();

	    try {
	        //Create a directory using the http session ID and clean out the directory if it exists
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    	workingDir = workingDir + "/" + mySession.getId();
		    File theDir = new File(workingDir);
			if (!theDir.mkdir()) {
				FileUtils.cleanDirectory(theDir);
			}
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    String inFile = filePart.getSubmittedFileName();
		    String matrixFile = workingDir + "/workingMatrix.txt";

	        //Upload the Matrix File
	        uploadMatrix(request, filePart, workingDir, errors);
	        if (errors.size() > 0) {
	        	writeOutErrors(errors, writer, response);
		        return;
	        }

	        //Process the Matrix File to construct a working matrix
		    HeatmapPropertiesManager.MatrixGridConfig matrixConfig = mgr.new MatrixGridConfig(mapName, mapDesc, inFile);
		    ProcessMatrix pm = new ProcessMatrix();
	        String[] longLabels = pm.buildFilteredMatrix(workingDir, matrixConfig, matrixFile, errors);
	        if (errors.size() > 0) {
	        	writeOutErrors(errors, writer, response);
		        return;
	        }
	        mgr.save();
	        
	        //Create and configure heatMap object
	        String clusterParam = loadParamsToMap(request, workingDir, matrixConfig, longLabels, inFile, errors);
	        boolean clusterRow = ((clusterParam.equals("B")) || (clusterParam.equals("R"))) ? true : false;
	        boolean clusterCol = ((clusterParam.equals("B")) || (clusterParam.equals("C"))) ? true : false;
	        if (errors.size() > 0) {
	        	writeOutErrors(errors, writer, response);
		        return;
	        }
			
			//Perform Clustering (if necessary)
		    if (!clusterParam.equals("N")) {
		    	processClustering(workingDir, errors);
		    }
	        if (errors.size() > 0) {
	        	writeOutErrors(errors, writer, response);
		        return;
	        }
		    
			//Upload and process covariate files
	        processCovariateFiles(request, workingDir, errors);
			if ((request.getParameter("CovarClusterRow") != null) && clusterRow) {
				processTreeCutCovariate(request, workingDir,"row", errors);	
			}
			if ((request.getParameter("CovarClusterCol") != null)  && clusterCol) {
				processTreeCutCovariate(request, workingDir,"column", errors);	
			}
	        if (errors.size() > 0) {
	        	writeOutErrors(errors, writer, response);
		        return;
	        }
	        
	        //Build the heat map 
		    HeatmapBuild builder = new HeatmapBuild();
		    builder.buildHeatMap(workingDir);
		    
	       	response.setContentType("application/json");
	    	response.getWriter().write("{}");
	    	response.flushBuffer();
	    } catch (Exception e) {
	        errors.add("ERROR: " + e.getMessage());
	        writeOutErrors(errors, writer, response);
	    } finally {
	        if (out != null) {out.close();out = null;}
	        if (filecontent != null) {filecontent.close(); filecontent = null;}
	        if (writer != null) {writer.close();}
	    }
	    
	}
	
/****************************************************************************************************	
 ****************************************************************************************************	
 ** HEATMAP PROCESSING METHODS - These methods are used in performing specific tasks in the heat
 **                              map building process.	
 ****************************************************************************************************	
 ****************************************************************************************************/	

	private void uploadMatrix(HttpServletRequest request, Part filePart, String workingDir, ArrayList<String> errors) throws Exception {
		//Upload the Matrix File
		UploadMatrix um = new UploadMatrix();
		String inFile = filePart.getSubmittedFileName();
		String inType = inFile.substring(inFile.lastIndexOf(".")+1, inFile.length()).toUpperCase();
	    InputStream filecontent = filePart.getInputStream();
		try {
			if (filePart.getSize() > 0) {
				um.uploadMatrixFile(workingDir, filecontent, inType);
			} else {
		        errors.add("ERROR: Matrix file is empty.");
			}
		} catch (Exception e) {
	        errors.add("ERROR: " + e.getMessage());
		} finally {
		    if (filecontent != null) {
		        filecontent.close();
		    }
		}	
		return;
	}

	private String loadParamsToMap(HttpServletRequest request, String workingDir, HeatmapPropertiesManager.MatrixGridConfig matrixConfig, String[] longLabels, String inFile, ArrayList<String> errors) {
		String clusterProp ="N";
	    try {
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	        mgr.load();
	    	HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        String matrixFile = workingDir + "/workingMatrix.txt";

	        //Set Map-wide parameters on map
			map.chm_name = request.getParameter("MapName");
			if (request.getParameter("MapDescription") != null) {map.chm_description = request.getParameter("MapDescription");}
			if (request.getParameter("MapSummaryWidth") != null) {map.summary_width = request.getParameter("MapSummaryWidth");}
			//Create and populate builder_config object and set on  map
			map.builder_config = (mgr.new BuilderConfig(matrixConfig,longLabels[0], longLabels[1]));
			map.builder_config.matrix_grid_config.matrixFileName = inFile;
			map.matrix_files.add(mgr.new MatrixFile(matrixConfig.matrixName, matrixFile, "average", null));  
			//Process array of Attributes
			if (request.getParameter("MapAttributes") != null) {
				ArrayList<String> attrStr = buildArrayFromDelimited(request.getParameter("MapAttributes"));
				ArrayList<Map<String,String>> attrMap = new ArrayList<Map<String,String>>();
				for(int i=0;i<attrStr.size();i++){
					Map<String,String> attrM = splitToMap(attrStr.get(i));
					attrMap.add(attrM);
				}
				map.chm_attributes = attrMap;
			}
			//If color map info provided, build color map
			if (request.getParameter("MatrixColors") != null) {
				map.matrix_files.get(0).color_map =	buildColorMapFromDelimited(mgr, request.getParameter("MatrixColors"));
			}
			//Set matrix_files parameters on map
			if (request.getParameter("MatrixSummaryMethod") != null) {map.matrix_files.get(0).summary_method = request.getParameter("MatrixSummaryMethod");}
			if (request.getParameter("MatrixGridColor") != null ) {map.matrix_files.get(0).grid_color = request.getParameter("MatrixGridColor");}
			if (request.getParameter("MatrixGridShow") != null ) {map.matrix_files.get(0).grid_show = request.getParameter("MatrixGridShow");}
			if (request.getParameter("MatrixSelectionColor") != null ) {map.matrix_files.get(0).selection_color = request.getParameter("MatrixSelectionColor");}
			if (request.getParameter("MatrixGapColor") != null ) {map.matrix_files.get(0).cuts_color = request.getParameter("MatrixGapColor");}
			if (request.getParameter("MatrixSummaryMethod") != null ) {map.matrix_files.get(0).summary_method = request.getParameter("MatrixSummaryMethod");}
			//Create Row Order Object and set on map
			String rowOrder = request.getParameter("RowOrder") == null ? "Original" : request.getParameter("RowOrder");
			if (map.row_configuration == null) {
				map.row_configuration = mgr.new Order(rowOrder, request.getParameter("RowDistance"), request.getParameter("RowAgglomeration"));
				if (rowOrder.equals("Hierarchical")) {
					clusterProp = "R";
				}
			}
			//Set additional Row Order parameters
			if (request.getParameter("RowDendroShow") != null ) {map.row_configuration.dendro_show = request.getParameter("RowDendroShow");}
			if (request.getParameter("RowDendroHeight") != null ) {map.row_configuration.dendro_height = request.getParameter("RowDendroHeight");}
			if (request.getParameter("RowLabelLength") != null ) {map.row_configuration.label_display_length = request.getParameter("RowLabelLength");}
			if (request.getParameter("RowLabelAbbreviation") != null ) {map.row_configuration.label_display_abbreviation = request.getParameter("RowLabelAbbreviation");}
			if (request.getParameter("RowGapWidth") != null ) {map.row_configuration.cut_width = request.getParameter("RowGapWidth");}
			if (request.getParameter("RowDendroTreeCuts") != null ) {map.row_configuration.tree_cuts = request.getParameter("RowDendroTreeCuts");}
			if (request.getParameter("RowTopItems") != null ) {
				ArrayList<String> attrStr = buildArrayFromDelimited(request.getParameter("RowTopItems"));
				for (int i=0;i<attrStr.size();i++) {
					map.row_configuration.top_items.add(attrStr.get(i));
				}
			}
			if (request.getParameter("RowDataType") != null ) {
				ArrayList<String> attrStr = buildArrayFromDelimited(request.getParameter("RowDataType"));
				if (attrStr.size() > 0) {
					map.row_configuration.data_type.remove(0);
				}
				for (int i=0;i<attrStr.size();i++) {
					map.row_configuration.data_type.add(attrStr.get(i));
				}
			}
			if (request.getParameter("RowGapLocations") != null ) {
				String[] toks = request.getParameter("RowGapLocations").split(",");
				map.row_configuration.cut_locations = new int[toks.length];
				for (int i=0;i<toks.length;i++) {
					map.row_configuration.cut_locations[i] = Integer.parseInt(toks[i]);
				}
			}

			//Create Column Order Object and set on map
			String colOrder = request.getParameter("ColOrder") == null ? "Original" : request.getParameter("ColOrder");
			if (map.col_configuration == null) {
				map.col_configuration = mgr.new Order(colOrder, request.getParameter("ColDistance"), request.getParameter("ColAgglomeration"));
				if (colOrder.equals("Hierarchical")) {
					clusterProp = clusterProp.equals("R") ? "B" : "C";
				}
			}
			//Set additional Column Order parameters
			if (request.getParameter("ColDendroShow") != null ) {map.col_configuration.dendro_show = request.getParameter("ColDendroShow");}
			if (request.getParameter("ColDendroHeight") != null ) {map.col_configuration.dendro_height = request.getParameter("ColDendroHeight");}
			if (request.getParameter("ColLabelLength") != null ) {map.col_configuration.label_display_length = request.getParameter("ColLabelLength");}
			if (request.getParameter("ColLabelAbbreviation") != null ) {map.col_configuration.label_display_abbreviation = request.getParameter("ColLabelAbbreviation");}
			if (request.getParameter("ColGapWidth") != null ) {map.col_configuration.cut_width = request.getParameter("ColGapWidth");}
			if (request.getParameter("ColDendroTreeCuts") != null ) {map.col_configuration.tree_cuts = request.getParameter("ColDendroTreeCuts");}
			if (request.getParameter("ColTopItems") != null ) {
				ArrayList<String> attrStr = buildArrayFromDelimited(request.getParameter("ColTopItems"));
				for (int i=0;i<attrStr.size();i++) {
					map.col_configuration.top_items.add(attrStr.get(i));
				}
			}
			if (request.getParameter("ColDataType") != null ) {
				ArrayList<String> attrStr = buildArrayFromDelimited(request.getParameter("ColDataType"));
				if (attrStr.size() > 0) {
					map.col_configuration.data_type.remove(0);
				}
				for (int i=0;i<attrStr.size();i++) {
					map.col_configuration.data_type.add(attrStr.get(i));
				}
			}
			if (request.getParameter("ColGapLocations") != null ) {
				String[] toks = request.getParameter("ColGapLocations").split(",");
				if (!toks[0].equals("")) {
					map.col_configuration.cut_locations = new int[toks.length];
					for (int i=0;i<toks.length;i++) {
						map.col_configuration.cut_locations[i] = Integer.parseInt(toks[i]);
					}
				}
			}
			//Set buildCluster parameter on map for later use in clustering
			map.builder_config.buildCluster = clusterProp;
			//Set Output Location to session directory
			map.output_location = workingDir  + "/" + matrixConfig.mapName;
			mgr.save();
	    } catch (Exception e) {
	        errors.add("ERROR: " + e.getMessage());
	    }
	    return clusterProp;
	}
	
	private void processCovariateFiles(HttpServletRequest request, String workingDir, ArrayList<String> errors) {
		//Upload and process covariate files
	    try {
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	    	Collection<Part> fileParts = request.getParts();
			Iterator<Part> itr = fileParts.iterator(); 
			UploadCovariate uc = new UploadCovariate();
			int itrPos = 0;
			while (itr.hasNext()) { 
			  Part i = (Part) itr.next(); 
			  String incomingFileName = i.getSubmittedFileName();
			  String iName = i.getName();
			  if ((incomingFileName != null) && (!incomingFileName.equals("")) && (iName.contains("Covar"))) {
				  String covarName = request.getParameter(iName+"Name");
				  String axisType = request.getParameter(iName+"AxisType");
				  String colorMap = request.getParameter(iName+"Colors");
				  HeatmapPropertiesManager.ColorMap cMap = buildColorMapFromDelimited(mgr, colorMap);
				  uc.processCovariateUpload(workingDir, i, covarName, cMap.type, axisType);
			      mgr.load();
			      HeatmapPropertiesManager.Heatmap covMap = mgr.getMap();
			      HeatmapPropertiesManager.Classification thisClass = covMap.classification_files.get(itrPos);
				  if (request.getParameter(iName+"Show") != null ) {thisClass.show = request.getParameter(iName+"Show");}
				  if (request.getParameter(iName+"BarType") != null ) {thisClass.bar_type = request.getParameter(iName+"BarType");}
				  if (request.getParameter(iName+"Height") != null ) {thisClass.height = request.getParameter(iName+"Height");}
				  if (request.getParameter(iName+"FgColor") != null ) {thisClass.fg_color = request.getParameter(iName+"FgColor");}
				  if (request.getParameter(iName+"BgColor") != null ) {thisClass.bg_color = request.getParameter(iName+"BgColor");}
				  if (request.getParameter(iName+"LowBound") != null ) {thisClass.low_bound = request.getParameter(iName+"LowBound");}
				  if (request.getParameter(iName+"HighBound") != null ) {thisClass.high_bound = request.getParameter(iName+"HighBound");}
			      if (cMap.colors.size() > 0) { 
			    	  thisClass.color_map = cMap;
			      }
		    	  mgr.save();
			      itrPos++;
			  }
			} 
	    } catch (Exception e) {
	        errors.add("ERROR: " + e.getMessage());
	    }
	}

	private void processTreeCutCovariate(HttpServletRequest request, String workingDir, String type, ArrayList<String> errors) {
		//Upload and process covariate files
	    try {
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    ProcessCovariate cov = new ProcessCovariate();
		    String paramVal = type.equals("row") ? "CovarClusterRow" : "CovarClusterCol";
			String clusterCovar = request.getParameter(paramVal);
			int clusterCnt = clusterCovar.matches("\\d+") ? Integer.parseInt(clusterCovar) : 0;
			if (clusterCnt > 0) {
					mgr.load();
				    HeatmapPropertiesManager.Heatmap covMap = mgr.getMap();
		        	HeatmapPropertiesManager.Classification classJsonObj = cov.constructTreeCutCovariate(mgr, "Cluster", "treecut", type, "discrete", clusterCovar);
					covMap.classification_files.add(classJsonObj);	 
			    	mgr.save();
		    }
	    } catch (Exception e) {
	        errors.add("ERROR: " + e.getMessage());
	    }
	}

	private void processClustering(String workingDir, ArrayList<String> errors) {
		try {
		    Cluster clusterer = new Cluster();
		    clusterer.clusterHeatMap(workingDir);
		} catch (Exception e) {
		    errors.add("ERROR: " + e.getMessage());
		}
		return;
	}
	
/****************************************************************************************************	
 ****************************************************************************************************	
 ** UTILITY METHODS - These methods perform utility functions for the servlet	
 ****************************************************************************************************	
 ****************************************************************************************************/	
	
	private ArrayList<String> buildArrayFromDelimited(String param) throws Exception {
		ArrayList<String> al = new ArrayList<String>();
		String toks[] = param.split(",",-1);
		for (int i = 0; i < toks.length; i++) {
			al.add(toks[i]);
		}
		return al;
	}

	private HeatmapPropertiesManager.ColorMap buildColorMapFromDelimited(HeatmapPropertiesManager mgr, String param) throws Exception {
		HeatmapPropertiesManager.ColorMap cMap = null;
		String toks[] = param.split(Pattern.quote("|"));
		String type = toks[0];
		if (toks.length == 1) {
			cMap =	mgr.new ColorMap(type);
		} else {
			String colorToks[] = toks[1].split(",",-1);
			ArrayList<String> colors = new ArrayList<String>();
			for (int i = 0; i < colorToks.length; i++) {
				colors.add(colorToks[i]);
			}
			String thresToks[] = toks[2].split(",",-1);
			ArrayList<String> thresholds = new ArrayList<String>();
			for (int i = 0; i < thresToks.length; i++) {
				thresholds.add(thresToks[i]);
			}
			String missing = toks[3];
			cMap =	mgr.new ColorMap(type,colors, thresholds,missing);
		}
		return cMap;
	}

	private Map<String,String> splitToMap(String in) {
		Map<String,String> map = new HashMap<>();
		String toks[] = in.split(":");
	    for (int i=0; i<toks.length-1; ) map.put(toks[i++], toks[i++]);
	    return map;
	}

	private void writeOutErrors(ArrayList<String> errors, PrintWriter writer, HttpServletResponse response) {
		try {
			for (int i=0;i<errors.size();i++) {
				writer.println(errors.get(i));
			}
		   	response.setContentType("application/json");
			response.flushBuffer();
		} catch (Exception e) {
			//do nothing
		}
	}
	
}


