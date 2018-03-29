package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/ReloadMatrix")
@MultipartConfig
public class ReloadMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession();
		response.setContentType("application/json;charset=UTF-8");
	    final PrintWriter writer = response.getWriter();
	    final String fileName = "originalMatrix.txt";
	    try {
	        //Create a directory using the http session ID
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    	workingDir = workingDir + "/" + mySession.getId();

	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        //Check for pre-existence of properties file.  If exists, load from properties manager
	        if (propFile.exists()) {
	        	mgr.load();
		        HeatmapPropertiesManager.Heatmap map = mgr.getMap();
		        HeatmapPropertiesManager.MatrixFile matrixFile = map.matrix_files.get(0);
		        String jsonMatrixCorner = Util.getTopOfMatrix(workingDir + "/" + fileName, 20, 20);
		        writer.println(jsonMatrixCorner);
	        } else {
	        	 writer.println("no_data");
	        }
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

	
}


