package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/RemoveCovariate")
@MultipartConfig
public class RemoveCovariate extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession();
		response.setContentType("application/json;charset=UTF-8");

	    // Create path components to save the file
	    final String covName = request.getParameter("remCovName");
	    final String axisType = request.getParameter("remAxisType");
	  
	    OutputStream out = null;
	    InputStream filecontent = null;
	    final PrintWriter writer = response.getWriter();

	    try {
	        //Create a directory using the http session ID
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    	workingDir = workingDir + "/" + mySession.getId();

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    String propJSON = "{}";
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        	mgr.resetBuildConfig();
	        	HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        	String covFileName = workingDir + "/covariate_"+ axisType+"_"+covName + ".txt";
	        	File covFile = new File(covFileName);
	        	long covFileSize = covFile.length();
	        	if (covFile.exists()) {
	        		covFile.delete();
	        	}
	        	int indexToRem = 0;
	        	for (int i=0;i < map.classification_files.size(); i++) {
	        		HeatmapPropertiesManager.Classification currClass = map.classification_files.get(i);
	        		if (currClass.name.equals(covName) && (currClass.position.equals(axisType))) {
	        			if (currClass.path.equals("treecut")) {
	        				if (currClass.position.equals("row")) {
	    	        			map.builder_config.rowCuts = "0";
	    	        			map.builder_config.rowCutsLabel = "Clusters";
	        				} else {
	    	        			map.builder_config.colCuts = "0";
	    	        			map.builder_config.colCutsLabel = "Clusters";
	        				}
	        			}
	        			indexToRem = i;
	        		}
	        	}
	        	map.classification_files.remove(indexToRem);
		        //Mark properties as "clean" for update.
	        	map.builder_config.buildProps = "N";
	        	map.write_tiles = "N";
	        	map.read_matrices = "N";
	        	mgr.save();
		        //Re-build the heat map 
			    HeatmapBuild builder = new HeatmapBuild();
			    builder.buildHeatMap(workingDir);
		    	ActivityLog.logActivity(request, "Process Covariates", "Remove Covariate", "Remove covariate file: " + covName + " File Size: " + covFileSize);
			    //Return edited props
	        	propJSON = mgr.load();
	        } else {
	        	propJSON = "{\"no_file\": 1}";
	        }
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
	    } catch (Exception e) {
	        writer.println("Error uploading covariate.");
	        writer.println("<br/> ERROR: " + e.getMessage());

	    } finally {
	        if (out != null) {
	            out.close();
	        }
	        if (filecontent != null) {
	            filecontent.close();
	        }
	        if (writer != null) {
	            writer.close();
	        }
	    }
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
}


