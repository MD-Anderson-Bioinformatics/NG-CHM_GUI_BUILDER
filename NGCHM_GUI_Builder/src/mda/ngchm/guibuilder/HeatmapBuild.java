package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import mda.ngchm.datagenerator.HeatmapDataGenerator;

/**
 * Servlet implementation class to build a heatmap using the HeatmapDataGenerator
 */
@WebServlet("/HeatmapBuild")
public class HeatmapBuild extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
	    final PrintWriter writer = response.getWriter();

	    try {
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();
	    	buildHeatMap(workingDir);
	    } catch (Exception e) {
	        writer.println("Error executing HeatmapDataGenerator to build Heat Map.");
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
	
	/*******************************************************************
	 * METHOD: buildHeatMap
	 *
	 * This method calls the heatmapDataGenerator in the NGCHM project 
	 * (viewer code) and builds a heatmap into the session directory.
	 ******************************************************************/
	public void buildHeatMap(String workingDir) throws Exception {
	    try {
			System.out.println("START Build Heatmap: " + new Date()); 

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
			String propsPath = workingDir + "/heatmapProperties.json";

	        File propFile = new File(propsPath);
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
			    //Call HeatmapDataGenerator to generate final heat map .ngchm file
			    String genArgs[] = new String[] {propsPath, "-NGCHM"};
				String errMsg = HeatmapDataGenerator.processHeatMap(genArgs);
	        }
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
			System.out.println("END Build Heatmap: " + new Date()); 
	    } catch (Exception e) {
	    	throw e;
	    }			
	}
	
}


