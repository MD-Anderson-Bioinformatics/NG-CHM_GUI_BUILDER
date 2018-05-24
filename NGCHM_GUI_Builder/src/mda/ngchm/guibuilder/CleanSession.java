package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.tomcat.util.http.fileupload.FileUtils;

/**
 * Servlet implementation class Upload Data Matrix
 */
@WebServlet("/CleanSession")
@MultipartConfig
public class CleanSession extends HttpServlet {
	private static final long serialVersionUID = 1L;
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		cleanSessionFiles(request, response);
	}
	
	public void cleanSessionFiles(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession();
		response.setContentType("application/json;charset=UTF-8");

	    try {
	        //Get session directory and remove contents
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    	workingDir = workingDir + "/" + mySession.getId();
	    	File sessionDir = new File(workingDir);
	    	if (sessionDir.exists()) {
		    	FileUtils.cleanDirectory(sessionDir); 
	    	}
	    } catch (Exception e) {
	        System.out.println("Error cleaning session directory.");
	    }
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
}


