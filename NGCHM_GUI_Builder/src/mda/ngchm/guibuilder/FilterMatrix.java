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


/**
 * Servlet implementation class CorrectMatrix
 */
@WebServlet("/FilterMatrix")
public class FilterMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    final PrintWriter writer = response.getWriter();

	    try {
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();
		    String matrixFile = workingDir  + "/workingMatrix.txt";
		    
		    String filter = request.getParameter("Filter");
		    
		    if (filter.equals("Range"))
		    	filterRange(matrixFile, request);
		    //else if (filter.equals("Variation"))
		    //	filterVariation(matrixFile, request);
		    //else if (filter.equals("Missing"))
		    //	filterMissing(matrixFile, request);

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

   

	private void filterRange(String matrixFile, HttpServletRequest request) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("rrowcol");
		String filterMethod = request.getParameter("rfiltermethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
		if (filterMethod.equals("onegreater") && axis.equals("row")) {

			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			double threshold = Double.parseDouble(request.getParameter("1range_max"));
			while (line != null ){
				String toks[] = line.split("\t");
				StringBuffer outLine = new StringBuffer();
				outLine.append(toks[0]);
				boolean skip = false;
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) 
						if (Double.parseDouble(toks[i]) > threshold){
							skip = true;
							break;
						}	
					outLine.append("\t" + toks[i]);
				}
				if (!skip)
					out.write(outLine.toString() + "\n");
				line = rdr.readLine();
			}	
		}
		
		rdr.close();
		out.close();
		new File(tmpWorking).delete();
	}
	
	

}


