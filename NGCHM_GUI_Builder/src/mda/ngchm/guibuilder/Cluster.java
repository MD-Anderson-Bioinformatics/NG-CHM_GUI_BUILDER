package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.script.ScriptEngine;
import org.renjin.script.RenjinScriptEngineFactory;

import mda.ngchm.datagenerator.HeatmapDataGenerator;


/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/Cluster")
public class Cluster extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static final ThreadLocal<ScriptEngine> ENGINE = new ThreadLocal<>();
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
		// Obtain R script engine for this thread
		ScriptEngine engine = getScriptEngine();

	    final PrintWriter writer = response.getWriter();

	    try {
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();

	        //Retrieve heat map properties
		    HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    mgr.load();
		    HeatmapPropertiesManager.Heatmap map = mgr.getMap();
		    
		    //Get first matrix file for clustering 
		    String matrixFile = map.matrix_files.get(0).path;
		    
		    //Create paths for clustering output files
		    String rowOrder = workingDir  + "/rowOrder.txt";
		    String colOrder = workingDir  + "/colOrder.txt";
		    String rowDendro = workingDir  + "/rowDendro.txt";
		    String colDendro = workingDir  + "/colDendro.txt";
		    
		    //Cluster heat map data
		    performOrdering(engine, matrixFile, request.getParameter("ColOrder"), "column", request.getParameter("ColDistance"), request.getParameter("ColAgglomeration"), colOrder, colDendro);
		    performOrdering(engine, matrixFile, request.getParameter("RowOrder"), "row", request.getParameter("RowDistance"), request.getParameter("RowAgglomeration"), rowOrder, rowDendro);
	        
		    //Add clustering entries to heatmapProperties file
		    map.row_configuration = mgr.new Order(request.getParameter("RowOrder"), request.getParameter("RowDistance"), request.getParameter("RowAgglomeration"), rowOrder, rowDendro);
		    map.col_configuration = mgr.new Order(request.getParameter("ColOrder"), request.getParameter("ColDistance"), request.getParameter("ColAgglomeration"), colOrder, colDendro);
		    
		    //Save changes to heatmapProperties file
		    String propFile = mgr.save();
		    
		    //Call HeatmapDataGenerator to generate final heat map .ngchm file
		    String genArgs[] = new String[] {propFile, "-NGCHM"};
			String errMsg = HeatmapDataGenerator.processHeatMap(genArgs);
		    //ToDo: Check for errors
		    writer.println("MapBuildDir/" + mySession.getId() + "/" + map.chm_name + "|" + map.chm_name + ".ngchm");

	    } catch (Exception e) {
	        writer.println("Error uploading matrix.");
	        writer.println("<br/> ERROR: " + e.getMessage());

	    } finally {
	        if (writer != null) {
	            writer.close();
	        }
	    }
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
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
	
	
	private void performOrdering(ScriptEngine engine, String matrixFile, String orderMethod, String direction, String distanceMeasure, String agglomerationMethod, String orderFile, String clusterFile) throws Exception {
		engine.eval("dataMatrix = read.table(\"" + matrixFile + "\", header=TRUE, sep = \"\t\", row.names = 1, as.is=TRUE, na.strings=c(\"NA\",\"N/A\",\"-\",\"?\"));");
		engine.eval("ordering <- NULL; "); 
		if (orderMethod.equals("Hierarchical")) {
			if (direction.equals("row")){
				//Todo  "      if (distanceMeasure == \"correlation\") { geneGeneCor <- cor(t(matrixData), use=\"pairwise\");  distVals <- as.dist((1-geneGeneCor)/2);
				engine.eval("distVals <- dist(dataMatrix, method=\"" + distanceMeasure + "\");");
			} else {
				//Todo:if (distanceMeasure == \"correlation\") { geneGeneCor <- cor(matrixData, use=\"pairwise\"); distVals <- as.dist((1-geneGeneCor)/2);
				engine.eval("distVals <- dist(t(dataMatrix), method=\"" + distanceMeasure + "\");");
			}
			engine.eval("ordering <- hclust(distVals, method=\"" + agglomerationMethod + "\");");
			writeHCDataTSVs(engine, "ordering", clusterFile, orderFile);
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

}


