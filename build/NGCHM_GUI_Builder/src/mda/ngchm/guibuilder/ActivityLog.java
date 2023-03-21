package mda.ngchm.guibuilder;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Date;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionEvent;

/**
 * Servlet implementation class log activity from client
 */
@WebServlet("/ActivityLog")
public class ActivityLog extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	/*******************************************************************
	 * METHOD: setProperties
	 *
	 * This method re-loads the heatmapProperties map with a new version
	 * sent by JSON from the client.
	 ******************************************************************/
	private void logClientActivity(HttpServletRequest request, HttpServletResponse response) throws Exception {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    try {
			//Get heat map construction directory from session
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	    	String screen = request.getParameter("screen");
	    	String action = request.getParameter("action");
	    	String details = request.getParameter("details");
		    String propJSON = "{}";
	    	if (mySession == null) {
	        	propJSON = "{\"no_session\": 1}";
		       	response.setContentType("application/json");
		    	response.getWriter().write(propJSON.toString());
		    	return;
	    	}
	        workingDir = workingDir + "/" + mySession.getId();
	        if (new File(workingDir).exists()) {
		    	logActivity(request, screen, action, details);
	        } 
        	propJSON = "{\"done\": 1}";
	       	response.setContentType("application/json");
	    	response.getWriter().write(propJSON.toString());
		} catch (Exception e) {
			response.setStatus(0);
	    	System.out.println("ERROR logging client activity: "+ e.getMessage());
	    } finally {
	    }		
	}
	
	public static void logActivity(HttpSessionEvent event, String screen, String action, String details) throws Exception {
		HttpSession session = event.getSession();
		String sessID = session.getId();
		String workingDir = session.getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
		logActivity(sessID, workingDir, screen, action, details);
	}
	
	public static void logActivity(HttpServletRequest request, String screen, String action, String details) throws Exception {
		HttpSession mySession = request.getSession();
		String sessID = mySession.getId();
		String workingDir = mySession.getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
		logActivity(sessID, workingDir, screen, action, details);
	}

	private static void logActivity(String sessID, String workingDir, String screen, String action, String details) throws Exception {

	try  {
		if (!Util.logSysMessages) {
			return;
		}
		/* Returns the maximum amount of memory available to 
		   the Java Virtual Machine set by the '-mx' or '-Xmx' flags. */
 		long availableMemory = Runtime.getRuntime().maxMemory();

 		/* Returns the total memory allocated from the system 
 		   (which can at most reach the maximum memory value 
 		   returned by the previous function). */
 		long allocatedMemory = Runtime.getRuntime().totalMemory();

 		/* Returns the free memory *within* the total memory 
 		   returned by the previous function. */
 		long freeMemory = Runtime.getRuntime().freeMemory();
 		String memoryInfo = "   *** JVM Memory Stats - Available: " + availableMemory + " Allocated: " + allocatedMemory + " Free: " + freeMemory;
 		
 		SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
 		String eventDate = simpleDateFormat.format(new Date());
		
		boolean fileArchived = archiveLog(workingDir);

	    FileWriter fw = new FileWriter(workingDir + "/NG-CHM_BuilderActivity.log",true); 
	    if (fileArchived) {
    	    fw.write("Event Date\tSession ID\tBuilder Screen\tAction\tDetails\tMemory Information\n");
	    }
	    fw.write(eventDate + "\t"+ sessID + "\t" + screen + "\t" + action + "\t" + details + "\t" + memoryInfo + "\n");
	    fw.close();
	}  catch(Exception e)	{
	    System.err.println("Logging Exception: " + e.getMessage());
	}
	return;
}

private static boolean archiveLog(String workingDir) {
	boolean fileArchived = false;
	try {
		File logFile = new File(workingDir + "/NG-CHM_BuilderActivity.log");
		if (!logFile.exists()) {
			return true;
		}
		long modDate = logFile.lastModified();
 		SimpleDateFormat monDateFormat = new SimpleDateFormat("MMM");
 		SimpleDateFormat yrDateFormat = new SimpleDateFormat("yyyy");
 		String lastMon = monDateFormat.format(modDate);
 		String currMon = monDateFormat.format(new Date());
 		String lastYr = yrDateFormat.format(modDate);
		if (!lastMon.equals(currMon)) {
			Path source = Paths.get(workingDir + "/NG-CHM_BuilderActivity.log");
			Path dest = Paths.get(workingDir + "/NG-CHM_BuilderActivity_"+lastMon+lastYr+".log");
			Files.copy(source, dest);
			Files.delete(source);
			Files.createFile(source);
			fileArchived = true;
		}
	} catch (Exception e) {
	    System.err.println("Logging Exception: " + e.getMessage());
	}
	return fileArchived;
}

	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			logClientActivity(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			logClientActivity(request, response);
		} catch (Exception e) {
	        e.printStackTrace();
		}
	}
	

}


