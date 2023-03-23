package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/ClusterStatus")
public class ClusterStatus extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	public void getClusterStatus(HttpServletRequest request, HttpServletResponse response) throws Exception {
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
		        mgr.load();
			    HeatmapPropertiesManager.Heatmap map = mgr.getMap();
			    try {
				    //Return edited props
		        	propJSON = "{\"cluster_status\": "+ map.builder_config.clusterStatus +"}";
			       	response.setContentType("application/json");
			    	response.getWriter().write(propJSON.toString());
			    } catch (Exception e) {
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
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			getClusterStatus(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			doGet(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}
	
}


