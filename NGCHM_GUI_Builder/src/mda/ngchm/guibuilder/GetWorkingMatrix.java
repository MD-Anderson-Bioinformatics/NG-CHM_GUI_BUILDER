package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.text.DecimalFormat;
import java.text.NumberFormat;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import mda.ngchm.guibuilder.Util;

/**
 * Servlet implementation class Get Working Matrix
 */
@WebServlet("/GetWorkingMatrix")
public class GetWorkingMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	private class MatrixCounts {
		public int numRows = 0;
		public int numCols = 0;
		public int numInvalid = 0;
		public int numMissing = 0;
		public double[] bins = new double[10];
		public int[] bin_count = new int[10];
	}
       
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession();
		response.setContentType("application/json;charset=UTF-8");

	    OutputStream out = null;
	    InputStream filecontent = null;
	    final PrintWriter writer = response.getWriter();

	    try {
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();
		    String matrixFile = workingDir  + "/workingMatrix.txt";
	        
		    NumberFormat nf = new DecimalFormat("#,###.00");
	        String jsonMatrixCorner = Util.getTopOfMatrix(matrixFile, 20, 11);
		    MatrixCounts counts = getMatrixCounts(matrixFile);
		    StringBuffer jsonHisto = new StringBuffer();
		    jsonHisto.append("\"histoBins\": [");
		    for (int i=0; i<counts.bins.length; i++) {
		    	if (i>0) jsonHisto.append(",");
		    	jsonHisto.append("\""+nf.format(counts.bins[i])+"\"");
		    }
		    jsonHisto.append("],\"histoCounts\": [");
		    for (int i=0; i<counts.bin_count.length; i++) {
		    	if (i>0) jsonHisto.append(",");
		    	jsonHisto.append(counts.bin_count[i]);
		    }
		    jsonHisto.append("]");
		    
		    String jsonMatrixInfo = "{\"matrixsample\": " + jsonMatrixCorner + 
		    						",\"numRows\": " + counts.numRows  +
		    						",\"numCols\": " + counts.numCols  +
		    						",\"numInvalid\": " + counts.numInvalid  +
		    						",\"numMissing\": " + counts.numMissing +
		    						"," + jsonHisto.toString() + "}";
	        
	        writer.println(jsonMatrixInfo);
	    } catch (Exception e) {
	        writer.println("Error getting working matrix.");
	        writer.println("<br/> ERROR: " + e.getMessage());

	    } finally {
	        if (out != null) {
	            out.close();
	        }
	        if (filecontent != null) {
	            filecontent.close();
	        }
	        if (writer != null) {
	            writer.close();
	        }
	    }
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
	//Get stats about the working matrix (e.g. num rows and columns)
	private MatrixCounts getMatrixCounts(String matrixFile) throws Exception {
		MatrixCounts counts = new MatrixCounts();
		BufferedReader rdr = new BufferedReader(new FileReader(matrixFile));
		double minVal = Double.POSITIVE_INFINITY;
		double maxVal = Double.NEGATIVE_INFINITY;
		String line = rdr.readLine(); //skip the header
		line = rdr.readLine();
		
		while (line != null ){
			counts.numRows++;
			String toks[] = line.split("\t");
			if (counts.numRows == 1)
				counts.numCols = toks.length - 1;
			//skip the first column with row labels
			for (int i = 1; i < toks.length; i++) {
				String val = toks[i].trim();
				if (Util.isNumeric(val.trim())) {
					double dVal = Double.parseDouble(val);
					if (dVal < minVal)
						minVal = dVal;
					if (dVal > maxVal)
						maxVal = dVal;
					continue;
				}	
				if (val.equals("") || val.equals("N/A") || val.equals("NA")) {
					counts.numMissing++;
				} else {
					counts.numInvalid++;
				}
			}
			line = rdr.readLine();
		}	
		rdr.close();
		
		//Histogram Bins
		double binSize = (maxVal - minVal) / 10;
		for (int i = 0; i < 10; i++){
			counts.bins[i] = minVal + (i+1)*binSize;
		}
		
		rdr = new BufferedReader(new FileReader(matrixFile));
		line = rdr.readLine(); //skip the header
		line = rdr.readLine();
		
		while (line != null ){
			String toks[] = line.split("\t");

			for (int i = 1; i < toks.length; i++) {
				String val = toks[i].trim();
				if (Util.isNumeric(val.trim())) {
					double dVal = Double.parseDouble(val);
					counts.bin_count[Math.max(9 - (int)((maxVal - dVal) / binSize), 0)]++;
				}	
			}
			line = rdr.readLine();
		}	
		rdr.close();
		

		return counts;
	}
	

}


