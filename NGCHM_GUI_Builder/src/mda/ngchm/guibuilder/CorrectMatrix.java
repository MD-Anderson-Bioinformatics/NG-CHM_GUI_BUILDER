package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.script.ScriptEngine;


/**
 * Servlet implementation class CorrectMatrix
 */
@WebServlet("/CorrectMatrix")
public class CorrectMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    final PrintWriter writer = response.getWriter();

	    try {
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();
		    String matrixFile = workingDir  + "/workingMatrix.txt";
		    
		    String correction = request.getParameter("Correction");
		    
		    if (correction.equals("ReplaceNonNumeric"))
		    	replaceNonNumeric(matrixFile, request);
		    else if (correction.equals("FillMissing"))
		    	fillMissing(matrixFile, request);

		    //Return something?
	    } catch (Exception e) {
	        writer.println("Error correcting matrix.");
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

   

	private void replaceNonNumeric(String matrixFile, HttpServletRequest request) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String replaceMethod = request.getParameter("nreplace");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
		if (replaceMethod.equals("N/A")) {

			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t");
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						out.write("\t" + toks[i]);
					} else if (Util.isMissing(toks[i])) {
						out.write("\t" + toks[i]);
					} else {
						out.write("\t" + "N/A");
					}
				}
				out.write("\n");
				line = rdr.readLine();
			}	
		}
		
		rdr.close();
		out.close();
		new File(tmpWorking).delete();
	}
	
	private void fillMissing(String matrixFile, HttpServletRequest request) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String replaceMethod = request.getParameter("mreplace");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
		if (replaceMethod.equals("zero")) {

			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t");
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (toks[i].equals("") || toks[i].equals("N/A") || toks[i].equals("NA")) {
						out.write("\t0");
					} else {
						out.write("\t" + toks[i]);
					}
				}
				out.write("\n");
				line = rdr.readLine();
			}	
		}
		
		rdr.close();
		out.close();
		new File(tmpWorking).delete();
	}
	

}


