package mda.ngchm.guibuilder;

import java.io.File;
import java.io.IOException;
import java.util.Date;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;
import org.apache.tomcat.util.http.fileupload.FileUtils;

public class SessionManager implements HttpSessionListener {
 
	public void sessionCreated(HttpSessionEvent event) {
		HttpSession session = event.getSession();
		String sessID = session.getId();
		System.out.println("A new session is created: " + sessID + " - " + new Date());
		try {
			ActivityLog.logActivity(event, "Session Manager", "Create Session", "Create new session: " + sessID);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}
 
	public void sessionDestroyed(HttpSessionEvent event) {
		HttpSession session = event.getSession();
		String sessID = session.getId();
		try {
	    	String workingDir = session.getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    	workingDir = workingDir + "/" + sessID;
	    	cleanseSession(workingDir); 
		} catch (Exception e) {
			System.out.println("Error cleaning session: " + e.getMessage());
		}
		System.out.println("Existing session is destroyed: " + sessID + " - " + new Date());
		try {
			ActivityLog.logActivity(event, "Session Manager", "Destroy Session", "Destroy existing session: " + sessID);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}
	
	private void cleanseSession(String workingDir) throws ServletException, IOException {
	    try {
	        //Get session directory and remove contents
	    	File sessionDir = new File(workingDir);
	    	if (sessionDir.exists()) {
		    	FileUtils.cleanDirectory(sessionDir); 
		    	FileUtils.deleteDirectory(sessionDir);
	    	}
	    } catch (Exception e) {
	        System.out.println("Error cleaning session directory.");
	    }
	}


 
}