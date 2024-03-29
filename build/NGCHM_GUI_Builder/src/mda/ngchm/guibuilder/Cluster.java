package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;

import javax.script.ScriptEngine;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.renjin.script.RenjinScriptEngineFactory;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/Cluster")
public class Cluster extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static final ThreadLocal<ScriptEngine> ENGINE = new ThreadLocal<>();
	
	public class ClusterThread implements Runnable {
		private String workingDir = "";

		//This embedded class will perform clustering in a seperate thread.
		public ClusterThread(String workingDir) {
			this.workingDir = workingDir;
		}

		public void run() {
			try {
				clusterHeatMap(workingDir);
				//Re-build the heat map 
			    HeatmapBuild builder = new HeatmapBuild();
			    builder.buildHeatMap(workingDir);
			} catch (Exception e) {
				System.out.println("ERROR Clustering large matrix: "+ e.getMessage());
				e.printStackTrace();
			}
		}
	}
	
	public void clusterHeatMap(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
	    try {
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
		    String propJSON = "{}";
	    	if (mySession == null) {
	        	propJSON = "{\"no_session\": 1}";
		       	response.setContentType("application/json");
		    	response.getWriter().write(propJSON.toString());
		    	return;
	    	}
	        //Get properties and update them to the new config data
	        workingDir = workingDir + "/" + mySession.getId();
	        if (new File(workingDir).exists()) {
		        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	        	MapProperties mp = new MapProperties();
		        HeatmapPropertiesManager.Heatmap mapConfig = mp.getConfigDataFromRequest(request);
		        //Get properties and update them to the new config data
	        	mgr.setMap(mapConfig);
		        //Mark properties as "clean" for update.
	        	mgr.resetBuildConfig();
			    HeatmapPropertiesManager.Heatmap map = mgr.getMap();
			    mgr.save();
			    try {
				    String clusterProp = map.builder_config.buildCluster;
				    String ordDistAggl = (map.row_configuration.order_method.equals("Hierarchical")) ? map.row_configuration.order_method + "/" + map.row_configuration.distance_metric + "/" + map.row_configuration.agglomeration_method : map.row_configuration.order_method + "/NA/NA";
				    if (clusterProp.equals("R")) {
						ActivityLog.logActivity(request, "Cluster Matrix", "Cluster Large Matrix File Rows", "Clustering rows for chm: " + map.chm_name + " Order/Distance/Agglomeration: " + ordDistAggl);
				    } else if (clusterProp.equals("C")) {
						ActivityLog.logActivity(request, "Cluster Matrix", "Cluster Large Matrix File Columns", "Clustering columns for chm: " + map.chm_name + " Order/Distance/Agglomeration: " + ordDistAggl);
				    } else {
						ActivityLog.logActivity(request, "Cluster Matrix", "Cluster Large Matrix File Rows", "Clustering rows for chm: " + map.chm_name + " Order/Distance/Agglomeration: " + ordDistAggl);
						ActivityLog.logActivity(request, "Cluster Matrix", "Cluster Large Matrix File Columns", "Clustering columns for chm: " + map.chm_name + " Order/Distance/Agglomeration: " + ordDistAggl);
				    }
			        mp.processTreeCutCovariates(request, mgr, mapConfig);
			        //Cluster the heat map in a thread
			        Runnable r = new Cluster.ClusterThread(workingDir);
			        new Thread(r).start();
			        
			        //Return response immediately to prevent timeout - javascript will poll clustering status.
			    	response.getWriter().write("Clustering started in a thread");
			    } catch (Exception e) {
			    	map.builder_config.buildErrors = "ERROR occurred starting clustering. Please try again.";
		        	propJSON = "{\"no_session\": 1}";
			       	response.setContentType("application/json");
			    	response.getWriter().write(propJSON.toString());
			    }
	        }
		} catch (Exception e) {
			response.setStatus(0);
	    	System.out.println("ERROR Clustering large matrix: "+ e.getMessage());
	    } finally {
	    }		
	}
	
	public void clusterHeatMap(String workingDir) throws Exception {
		// Obtain R script engine for this thread
		ScriptEngine engine = getScriptEngine();

        //Retrieve heat map properties
	    HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	    mgr.load();
	    HeatmapPropertiesManager.Heatmap map = mgr.getMap();
		writeClusterStatus(mgr, 99);
	    
	    //Get first matrix file for clustering 
	    String matrixFile = map.matrix_files.get(0).path;
	    String clusterProp = map.builder_config.buildCluster;
	    boolean clusterRows = (clusterProp.equals("R") || clusterProp.equals("B")) ? true : false;
	    boolean clusterCols = (clusterProp.equals("C") || clusterProp.equals("B")) ? true : false;
	    if (clusterRows) {
		    //Create paths for clustering output files
		    String rowOrder = workingDir  + "/rowOrder.txt";  
		    String rowDendro = workingDir  + "/rowDendro.txt";  
		    String rowOrderMethod = map.row_configuration.order_method;
		    if (rowOrderMethod.equals("Hierarchical")) {   
		    	try {
				    performOrdering(engine, matrixFile, rowOrderMethod, "row", map.row_configuration.distance_metric, map.row_configuration.agglomeration_method, rowOrder, rowDendro, mgr);  //Get from props
			    	map.row_configuration.order_file = rowOrder;  
			    	map.row_configuration.dendro_file = rowDendro; 
			    	if (map.row_configuration.dendro_show.equals("NA"))	{	 	    	
		    			map.row_configuration.dendro_show = "ALL";  
		    			map.row_configuration.dendro_height = "100";  
			    	}
		    	} catch (Exception e) {
			    	map.row_configuration.order_file = null;  
			    	map.row_configuration.dendro_file = null; 
		    		map.row_configuration.order_method = "Original";
			    	map.builder_config.buildWarnings.add("An error occurred while clustering rows using Distance: " + map.row_configuration.distance_metric + " and Agglomeration: " + map.row_configuration.agglomeration_method + ". Row order has been reset to Original.  Please try a different row Distance Measure and/or Agglomeration Method.");
		    	}
		    } else {
		    	map.row_configuration.order_file = null;  
		    	map.row_configuration.dendro_file = null;  
		    	map.row_configuration.dendro_show = "NA";  
		    	map.row_configuration.dendro_height = "10";
		    }
	    }
	    if (clusterCols) {
		    String colOrder = workingDir  + "/colOrder.txt";  
		    String colDendro = workingDir  + "/colDendro.txt";  
			String colOrderMethod = map.col_configuration.order_method;
		    if (colOrderMethod.equals("Hierarchical")) {   
		    	try {
		    		performOrdering(engine, matrixFile, colOrderMethod, "column", map.col_configuration.distance_metric, map.col_configuration.agglomeration_method, colOrder, colDendro, mgr);  //Get from props
			    	map.col_configuration.order_file = colOrder;  
			    	map.col_configuration.dendro_file = colDendro; 
			    	if (map.col_configuration.dendro_show.equals("NA"))	{	 	    	
		    			map.col_configuration.dendro_show = "ALL";  
		    			map.col_configuration.dendro_height = "100";  
			    	}
		    	} catch (Exception e) {
			    	map.col_configuration.order_file = null;  
			    	map.col_configuration.dendro_file = null; 
		    		map.col_configuration.order_method = "Original";
			    	map.builder_config.buildWarnings.add("An error occurred while clustering columns using Distance: " + map.col_configuration.distance_metric + " and Agglomeration: " + map.col_configuration.agglomeration_method + ". Column order has been reset to Original.  Please try a different column Distance Measure and/or Agglomeration Method.");
				    mgr.save();
		    	}
		    } 
		    if (!colOrderMethod.equals("Hierarchical")) {   
		    	map.col_configuration.order_file = null;  
		    	map.col_configuration.dendro_file = null;  
		    	map.col_configuration.dendro_show = "NA";  
		    	map.col_configuration.dendro_height = "10";
		    }
	    }
	    //Save changes to heatmapProperties file
	    mgr.save();
	}

	private ScriptEngine getScriptEngine() {
    	ScriptEngine engine = ENGINE.get();
    	if(engine == null) {
    		// Create a new ScriptEngine for this thread if one does not exist.
    		RenjinScriptEngineFactory factory = new RenjinScriptEngineFactory();
    		engine = factory.getScriptEngine();
    		ENGINE.set(engine);
    	}
    	return engine;
    }
	
	
	private void performOrdering(ScriptEngine engine, String matrixFile, String orderMethod, String direction, String distanceMeasure, String agglomerationMethod, String orderFile, String clusterFile, HeatmapPropertiesManager mgr) throws Exception {
		engine.eval("dataMatrix = read.table(\"" + matrixFile + "\", header=TRUE, sep = \"\t\", check.names=FALSE, row.names = 1, as.is=TRUE, na.strings=c(\"NA\",\"N/A\",\"-\",\"?\"));");
		engine.eval("ordering <- NULL; "); 
		if (orderMethod.equals("Hierarchical")) {
			if (direction.equals("row")){
				writeClusterStatus(mgr, 1);
				if (distanceMeasure.equals("correlation")) { 
					engine.eval("distVals <- as.dist(1-cor(t(dataMatrix), use=\"pairwise.complete.obs\"))");
				} else {
					engine.eval("distVals <- dist(dataMatrix, method=\"" + distanceMeasure + "\");");
				}	
				writeClusterStatus(mgr, 2);
				engine.eval("ordering <- hclust(distVals, method=\"" + agglomerationMethod + "\");");
				writeHCDataTSVs(engine, "ordering", clusterFile, orderFile);
				writeClusterStatus(mgr, 3);
			} else {
				writeClusterStatus(mgr, 4);
				if (distanceMeasure.equals("correlation")) { 
					engine.eval("distVals <- as.dist(1-cor(dataMatrix, use=\"pairwise.complete.obs\"))");
				} else {
					engine.eval("distVals <- dist(t(dataMatrix), method=\"" + distanceMeasure + "\");");
				}
				writeClusterStatus(mgr, 5);
				engine.eval("ordering <- hclust(distVals, method=\"" + agglomerationMethod + "\");");
				writeHCDataTSVs(engine, "ordering", clusterFile, orderFile);
				writeClusterStatus(mgr, 6);
			}
		}  else if (orderMethod.equals("Random")){
			if (direction.equals("row")){
				engine.eval("headerList <- rownames(dataMatrix);");
			} else {
				engine.eval("headerList <- colnames(dataMatrix);");
			}
			engine.eval("ordering <- sample(headerList, length(headerList));");
			writeOrderTSVs(engine, "ordering", "headerList", orderFile);		
		} else if (orderMethod.equals("Original")){
			engine.eval("headerList <- colnames(dataMatrix);");
			writeOrderTSVs(engine, "headerList", "headerList", orderFile);		
		}
	}
	
	private void writeClusterStatus(HeatmapPropertiesManager mgr, int status) throws Exception {
	    HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	    map.builder_config.clusterStatus = status;
	    mgr.save();
	    return;
	}

	private void writeHCDataTSVs(ScriptEngine engine, String hclustOrder, String clusterFile, String orderFile) throws Exception {
		engine.eval("data<-cbind(" + hclustOrder + "$merge, " + hclustOrder + "$height, deparse.level=0);");
		engine.eval("colnames(data)<-c(\"A\", \"B\", \"Height\");");
		engine.eval("write.table(data, file = \"" + clusterFile + "\", append = FALSE, quote = FALSE, sep = \"\t\", row.names=FALSE);");
		engine.eval("data=matrix(,length(" + hclustOrder + "$labels),2);" );
		engine.eval("for (i in 1:length(" + hclustOrder + "$labels)) { data[i,1] = " + hclustOrder + "$labels[i]; data[i,2] = which(" + hclustOrder + "$order==i); }");
		engine.eval("colnames(data)<-c(\"Id\", \"Order\");" );
		engine.eval("write.table(data, file = \"" + orderFile + "\", append = FALSE, quote = FALSE, sep = \"\t\", row.names=FALSE); ");
	}
	
	private void writeOrderTSVs(ScriptEngine engine, String newOrderVar, String origOrderVar, String orderFile) throws Exception {
		engine.eval("data=matrix(,length(" + origOrderVar + "),2);" );
		engine.eval("for (i in 1:length(" + origOrderVar + ")) { data[i,1] = " + origOrderVar + "[i]; data[i,2] = which(" + newOrderVar + " == " + origOrderVar + "[i]); }");
		engine.eval("colnames(data)<-c(\"Id\", \"Order\");" );
		engine.eval("write.table(data, file = \"" + orderFile + "\", append = FALSE, quote = FALSE, sep = \"\t\", row.names=FALSE); ");
	}	

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			doPost(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			clusterHeatMap(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}
	
}
