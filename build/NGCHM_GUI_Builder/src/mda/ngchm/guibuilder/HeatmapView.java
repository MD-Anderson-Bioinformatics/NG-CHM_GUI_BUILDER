package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/HeatmapView")
public class HeatmapView extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
	    final PrintWriter writer = response.getWriter();
	    try {
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
	        }
	        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
	        
	        //Double check just in case ngchm is not versioned.
	        String heatmapDir = workingDir+"/"+map.chm_name;
		    String ngchmFile = map.chm_name+map.builder_config.ngchmVersion +".ngchm";
		    if (!new File(heatmapDir+"/"+ngchmFile).exists()) {
		    	ngchmFile = map.chm_name+".ngchm";
		    }
	        
			writer.println("MapBuildDir/" + mySession.getId() + "/" + map.chm_name + "|" + ngchmFile);
		} catch (Exception e) {
	        writer.println("Error producing heat map view.");
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
}


