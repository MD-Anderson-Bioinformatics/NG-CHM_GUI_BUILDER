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

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/MapProperties")
public class MapProperties extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			getProperties(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
	private void getProperties(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    final PrintWriter writer = response.getWriter();

	    try {
			System.out.println("START Retrieving Properties: " + new Date()); 
			
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        String propJSON = "{}";
	    	if (mySession == null) {
		        propJSON = "{\"no_session\": 1}";
	    	} else {
		        workingDir = workingDir + "/" + mySession.getId();
	
		        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		        File propFile = new File(workingDir + "/heatmapProperties.json");
		        //Check for pre-existence of properties file.  If exists, load from properties manager
		        if (propFile.exists()) {
		        	propJSON = mgr.load();
		        } else {
		        	propJSON = "{\"nofile\": 1}";
		        }
	    	}
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
			
			System.out.println("END Retrieving Properties: " + new Date()); 
	    } catch (Exception e) {
	        writer.println("Error creating retrieving map properties.");
	        writer.println("<br/> ERROR: " + e.getMessage());
	    } finally {
	        if (writer != null) {
	            writer.close();
	        }
	    }		
		
	}



}


