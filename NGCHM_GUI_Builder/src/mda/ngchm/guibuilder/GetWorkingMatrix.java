package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.ArrayList;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import mda.ngchm.guibuilder.Util;

/**
 * Servlet implementation class Get Working Matrix - this servlet returns the top left corner of the 'working' 
 * version of the user's matrix data.  The working version is extracted from the original user matrix (junk
 * rows/columns and covariate rows/columns are removed) - the matrix has just row column headers and data.
 * The working matrix is also the end result of any filtering or transforms that have been done with the builder.
 * In addition to returing the top left corner of the matrix, it also calculates summary statistics about the 
 * matrix that are displayed on the transforms page.
 */
@WebServlet("/GetWorkingMatrix")
public class GetWorkingMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	private class MatrixCounts {
		public int numRows = 0;
		public int numCols = 0;
		public int numInvalid = 0;
		public int numMissing = 0;
		public double minVal = Double.POSITIVE_INFINITY;
		public double maxVal = Double.NEGATIVE_INFINITY;
		public double[] bins = new double[10];
		public int[] bin_count = new int[10];
		public double[] row_dev_bins = new double[10];
		public int[] row_dev_count = new int[10];
		public double[] col_dev_bins = new double[10];
		public int[] col_dev_count = new int[10];
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
	        String jsonMatrixCorner = Util.getTopOfMatrix(matrixFile, 20, 20);
		    MatrixCounts counts = getMatrixCounts(matrixFile);
		    
		    //convert data distribution bins for historgram to json
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
		    
		    //convert row stdev bins to json
		    StringBuffer rowStdJsonHisto = new StringBuffer();
		    rowStdJsonHisto.append("\"rowStdHistoBins\": [");
		    for (int i=0; i<counts.row_dev_bins.length; i++) {
		    	if (i>0) rowStdJsonHisto.append(",");
		    	rowStdJsonHisto.append("\""+nf.format(counts.row_dev_bins[i])+"\"");
		    }
		    rowStdJsonHisto.append("],\"rowStdHistoCounts\": [");
		    for (int i=0; i<counts.row_dev_count.length; i++) {
		    	if (i>0) rowStdJsonHisto.append(",");
		    	rowStdJsonHisto.append(counts.row_dev_count[i]);
		    }
		    rowStdJsonHisto.append("]");
		    
		    //convert column stdev bins to json
		    StringBuffer colStdJsonHisto = new StringBuffer();
		    colStdJsonHisto.append("\"colStdHistoBins\": [");
		    for (int i=0; i<counts.col_dev_bins.length; i++) {
		    	if (i>0) colStdJsonHisto.append(",");
		    	colStdJsonHisto.append("\""+nf.format(counts.col_dev_bins[i])+"\"");
		    }
		    colStdJsonHisto.append("],\"colStdHistoCounts\": [");
		    for (int i=0; i<counts.col_dev_count.length; i++) {
		    	if (i>0) colStdJsonHisto.append(",");
		    	colStdJsonHisto.append(counts.col_dev_count[i]);
		    }
		    colStdJsonHisto.append("]");
		    
		    String jsonMatrixInfo = "{\"matrixsample\": " + jsonMatrixCorner + 
		    						",\"numRows\": " + counts.numRows  +
		    						",\"numCols\": " + counts.numCols  +
		    						",\"numInvalid\": " + counts.numInvalid  +
		    						",\"numMissing\": " + counts.numMissing +
		    						",\"maxValue\": " + "\"" + counts.maxVal + "\""+
		    						",\"minValue\": " + "\"" + counts.minVal + "\"" +
		    						"," + jsonHisto.toString() + 
		    						"," + rowStdJsonHisto.toString() +
									"," + colStdJsonHisto.toString() + "}";
	        
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
		try {
			String line = rdr.readLine(); //skip the header
			line = rdr.readLine();
			
			if (line != null) {
				int numCols = line.split("\t",-1).length;
				if (numCols == 1) { // 0 cols
					counts.numCols = 0;
					counts.numRows = 0;
					counts.numInvalid = 0;
					counts.numMissing = 0;
					counts.minVal = 0;
					counts.maxVal = 0;
					counts.bins = new double[10];
					counts.bin_count = new int[10];
					counts.row_dev_bins = new double[10];
					counts.row_dev_count = new int[10];
					counts.col_dev_bins = new double[10];
					counts.col_dev_count = new int[10];
				} else {
					//Array for mean of each row and each column.
					ArrayList<Double> rowMean = new ArrayList<Double>();
					double colMean[] = new double[numCols];
					int colCount[] = new int[numCols];
					
					while (line != null ){
						counts.numRows++;
						double rowSum = 0;
						int numRowValues = 0;
						String toks[] = line.split("\t",-1);
						if (counts.numRows == 1)
							counts.numCols = toks.length - 1;
						//skip the first column with row labels
						for (int i = 1; i < toks.length; i++) {
							String val = toks[i];
							if (Util.isNumeric(val)) {
								double dVal = Double.parseDouble(val);
								if (dVal < counts.minVal)
									counts.minVal = dVal;
								if (dVal > counts.maxVal)
									counts.maxVal = dVal;
								rowSum += dVal;
								numRowValues++;
								colMean[i] += dVal;
								colCount[i] += 1;
							} else if (Util.isMissing(val)) {
								counts.numMissing++;
							} else {
								counts.numInvalid++;
							}
						}
						
						if (numRowValues > 0) {
							rowMean.add(rowSum/numRowValues);
						} else {
							rowMean.add(null);
						}
						line = rdr.readLine();
					}	
					rdr.close();
					
					//Calculate column means
					for (int i = 0; i < colMean.length; i++) 
						if (colCount[i] > 0)
							colMean[i] = colMean[i] / colCount[i];
					
					
					//Second pass of the matrix is needed to bin distribution of data
					//and the row standard deviations.
					
					// correct any instance of infinity to +/-max value
					double maxRound = counts.maxVal;
					double minRound = counts.minVal;
					if (counts.maxVal == Double.POSITIVE_INFINITY) {
						maxRound = Double.MAX_VALUE;
					}
					if (counts.minVal == Double.NEGATIVE_INFINITY) {
						minRound = -Double.MAX_VALUE;
					}
					//Data Distribution Histogram Bins
					double binSize = (maxRound - minRound) / 10;
					for (int i = 0; i < 10; i++){
						counts.bins[i] = minRound + (i+1)*binSize;
					}
					
					//Array for standard deviation of each row.
					double rowStdev[] = new double[counts.numRows];
					
					rdr = new BufferedReader(new FileReader(matrixFile));
					line = rdr.readLine(); //skip the header
					line = rdr.readLine();
					
					int currentRow = 0;
					double colStdev[] = new double[numCols];
					while (line != null ){
						String toks[] = line.split("\t",-1);
						double rowStdevSum = 0;
						int numRowValues = 0;
			
						for (int i = 1; i < toks.length; i++) {
							String val = toks[i];
							if (Util.isNumeric(val)) {
								double dVal = Double.parseDouble(val);
								counts.bin_count[Math.max(9 - (int)((counts.maxVal - dVal) / binSize), 0)]++;
								rowStdevSum += Math.pow(dVal - rowMean.get(currentRow), 2);
								numRowValues++;
								colStdev[i] += Math.pow(dVal - colMean[i], 2);
							}	
						}
									
						//row standard deviation
						if (numRowValues > 0)
							rowStdev[currentRow] = Math.sqrt(rowStdevSum/numRowValues);
						currentRow++;
						line = rdr.readLine();
					}	
					rdr.close();
					
					//Calculate column standard deviation
					for (int i = 1; i < colStdev.length; i++) {
						if (colCount[i] > 0)
							colStdev[i] = Math.sqrt(colStdev[i] / colCount[i]);
					}
					
			
					//Now create binned data of row stdev values.
					double minStdev = Double.POSITIVE_INFINITY;
					double maxStdev = Double.NEGATIVE_INFINITY;
					for (int i = 0; i < rowStdev.length; i++) {
						if (rowStdev[i] < minStdev)
							minStdev = rowStdev[i];
						if (rowStdev[i] > maxStdev)
							maxStdev = rowStdev[i];
					}
					double stdevBinSize = (maxStdev - minStdev) / 10;
					for (int i = 0; i < 10; i++){
						counts.row_dev_bins[i] = minStdev + (i+1)*stdevBinSize;
					}
					for (int i = 0; i < rowStdev.length; i++) {
						counts.row_dev_count[Math.max(9 - (int)((maxStdev - rowStdev[i]) / stdevBinSize), 0)]++;
					}
			
					
					//Now create binned data of column stdev values.
					minStdev = Double.POSITIVE_INFINITY;
					maxStdev = Double.NEGATIVE_INFINITY;
					for (int i = 1; i < colStdev.length; i++) {
						if (colStdev[i] < minStdev)
							minStdev = colStdev[i];
						if (colStdev[i] > maxStdev)
							maxStdev = colStdev[i];
					}
					stdevBinSize = (maxStdev - minStdev) / 10;
					for (int i = 0; i < 10; i++){
						counts.col_dev_bins[i] = minStdev + (i+1)*stdevBinSize;
					}
					for (int i = 1; i < colStdev.length; i++) {
						counts.col_dev_count[Math.max(9 - (int)((maxStdev - colStdev[i]) / stdevBinSize), 0)]++;
					}
				}
			} else { // 0 rows 
				counts.numCols = 0;
				counts.numRows = 0;
				counts.numInvalid = 0;
				counts.numMissing = 0;
				counts.minVal = 0;
				counts.maxVal = 0;
				counts.bins = new double[0];
				counts.bin_count = new int[0];
				counts.row_dev_bins = new double[10];
				counts.row_dev_count = new int[10];
				counts.col_dev_bins = new double[10];
				counts.col_dev_count = new int[10];
			}
		} finally {
			rdr.close();
			rdr = null;
		}
		
		return counts;
	}
	

}


