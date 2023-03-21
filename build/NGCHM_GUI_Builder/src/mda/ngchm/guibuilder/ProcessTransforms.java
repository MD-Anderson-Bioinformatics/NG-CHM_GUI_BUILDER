package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import com.google.gson.Gson;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/ProcessTransforms")
public class ProcessTransforms extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			processTransforms(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
	private void processTransforms(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    final PrintWriter writer = response.getWriter();

	    try {
			
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);

			//Get/set matrix configuration data from request
	        HeatmapPropertiesManager.TransformConfig transformConfig = getTransformConfigData(request);
	    	
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        }
	        
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        HeatmapPropertiesManager.BuilderConfig builder_config = map.builder_config;
	        builder_config.transform_config = transformConfig;
			mgr.save();
		    String propJSON = "{}";
		    propJSON = mgr.load();
		    response.getWriter().write(propJSON.toString());

	    } catch (Exception e) {
	        writer.println("Error creating initial heat map properties.");
	        writer.println("<br/> ERROR: " + e.getMessage());
	    } finally {
	        if (writer != null) {
	            writer.close();
	        }
	    }		
		
	}

	/*******************************************************************
	 * METHOD: getMatrixConfigData
	 *
	 * This method retrieves the matrix configuration information from
	 * the heatmapProperties.json.  It is used to re-draw the 
	 * handsontable grid when the screen is re-loaded.
	 ******************************************************************/
	private HeatmapPropertiesManager.TransformConfig getTransformConfigData(HttpServletRequest request) throws Exception {
		StringBuilder buffer = new StringBuilder();
	    BufferedReader reader = request.getReader();
	    String line;
	    while ((line = reader.readLine()) != null) {
	        buffer.append(line);
	    }
	    String data = buffer.toString();
	    // Parse payload into JSON Object
	    HeatmapPropertiesManager.TransformConfig transformConfig = new Gson().fromJson(data, HeatmapPropertiesManager.TransformConfig.class);
	    
	    return transformConfig; 
	}

}


