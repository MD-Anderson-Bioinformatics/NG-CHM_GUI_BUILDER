package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.tomcat.util.http.fileupload.FileUtils;

import com.google.gson.Gson;

/**
 * Servlet implementation class CorrectMatrix
 */
@WebServlet("/TransformMatrix")
public class TransformMatrix extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		HttpSession mySession = request.getSession(false);
		response.setContentType("application/json;charset=UTF-8");
		
	    final PrintWriter writer = response.getWriter();

	    try {
	    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
	        workingDir = workingDir + "/" + mySession.getId();
		    String matrixFile = workingDir  + "/workingMatrix.txt";
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    String propJSON = "{}";
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        if (propFile.exists()) {
	        	propJSON = mgr.load();
	        	mgr.save();
			    String transform = request.getParameter("Transform");
			    if (transform.equals("Log"))
			    	logTransform(matrixFile, request);
			    else if (transform.equals("MeanCenter"))
			    	meanCenterTransform(matrixFile, request);
			    else if (transform.equals("Z-Norm"))
			    	zNormTransform(matrixFile, request);
			    else if (transform.equals("Arithmetic"))
			    	arithmeticTransform(matrixFile, request);
			    else if (transform.equals("Correlation"))
			    	correlationTransform(matrixFile, request, mgr);
			    propJSON = mgr.load();
	        } else {
	        	propJSON = "{\"no_file\": 1}";
	        }
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
	    } catch (Exception e) {
	        writer.println("Error transforming matrix.");
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

   

	private void logTransform(String matrixFile, HttpServletRequest request) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String logBase = request.getParameter("tlfiltermethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
	    // TODO : need to correct negative values before log
		if (logBase.equals("log10")) {
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						out.write("\t" + Math.log10(Float.parseFloat(toks[i])));
					} else {
						out.write("\t" + toks[i]);
					}
				}
				out.write("\n");
				line = rdr.readLine();
			}	
		} else if (logBase.equals("naturalLog")) {

			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						out.write("\t" + Math.log(Float.parseFloat(toks[i])));
					} else {
						out.write("\t" + toks[i]);
					}
				}
				out.write("\n");
				line = rdr.readLine();
			}	
		} else if (logBase.equals("log2")) {
			double log10of2 = Math.log(2);
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						out.write("\t" + Math.log(Float.parseFloat(toks[i]))/log10of2);
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
	
	private void meanCenterTransform(String matrixFile, HttpServletRequest request) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("tmrowcol");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
		if (axis.equals("row")) {
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				double mean = getRowMean(toks);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						double val = Double.parseDouble(toks[i]) - mean;
						out.write("\t" + val);
					} else {
						out.write("\t" + toks[i]);
					}
				}
				out.write("\n");
				line = rdr.readLine();
			}	
		} else if (axis.equals("col")) {
			double[] means = getColMeans(tmpWorking);
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						double val = Double.parseDouble(toks[i]) - means[i];
						out.write("\t" + val);
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
	
	
	private void zNormTransform(String matrixFile, HttpServletRequest request) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("tzrowcol");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
		if (axis.equals("row")) {
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				double mean = getRowMean(toks);
				double variance = getRowVariance(line);
				double stdDev = Math.sqrt(variance);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						double val = (Double.parseDouble(toks[i]) - mean)/stdDev;
						out.write("\t" + val);
					} else {
						out.write("\t" + toks[i]);
					}
				}
				out.write("\n");
				line = rdr.readLine();
			}	
		} else if (axis.equals("col")) {
			double[] means = getColMeans(tmpWorking);
			double[] variances = getColVariances(tmpWorking);
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						double stdDev = Math.sqrt(variances[i]);
						double val = (Float.parseFloat(toks[i]) - means[i])/stdDev;
						out.write("\t" + val);
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
	
	private void arithmeticTransform(String matrixFile, HttpServletRequest request) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String operation = request.getParameter("tatransformmethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
	    // TODO : need to correct negative values before log
		if (operation.equals("add")) {
			float addVal = Float.parseFloat(request.getParameter("add_value"));
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						float val = Float.parseFloat(toks[i]) + addVal;
						out.write("\t" + val);
					} else {
						out.write("\t" + toks[i]);
					}
				}
				out.write("\n");
				line = rdr.readLine();
			}	
		} else if (operation.equals("subtract")) {
			float subVal = Float.parseFloat(request.getParameter("subtract_value"));
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						float val = Float.parseFloat(toks[i]) - subVal;
						out.write("\t" + val);
					} else {
						out.write("\t" + toks[i]);
					}
				}
				out.write("\n");
				line = rdr.readLine();
			}	
		} else if (operation.equals("multiply")) {
			float multiVal = Float.parseFloat(request.getParameter("multiply_value"));
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						float val = Float.parseFloat(toks[i]) * multiVal;
						out.write("\t" + val);
					} else {
						out.write("\t" + toks[i]);
					}
				}
				out.write("\n");
				line = rdr.readLine();
			}	
		} else if (operation.equals("divide")) {
			float divVal = Float.parseFloat(request.getParameter("divide_value"));
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (Util.isNumeric(toks[i])) {
						float val = Float.parseFloat(toks[i]) / divVal;
						out.write("\t" + val);
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
	
	private void correlationTransform(String matrixFile, HttpServletRequest request, HeatmapPropertiesManager mgr) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String operation = request.getParameter("tctransformmethod");
		if (operation.equals("transpose")) {
			BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
			BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
			String[][] matrix1 = getFileAsStringMatrix(tmpWorking);
			String[][] matrix2 = getTransposeString(matrix1);
			List<String> rowLabels = getRowLabels(tmpWorking);
			List<String> colLabels = getColLabels(tmpWorking);
			for (int i = 0; i < rowLabels.size(); i++) {
				out.write("\t" + rowLabels.get(i));
			}
			for (int i = 0; i < matrix2.length; i++) {
				out.write("\n");
				out.write(colLabels.get(i));
				for (int j = 0; j < matrix2[i].length; j++) {
					out.write("\t" + matrix2[i][j]);
				}
			}
			rdr.close();
			out.close();
			new File(tmpWorking).delete();
		} else {
			BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
			String line = rdr.readLine();
			List<String> rowLabels = getRowLabels(tmpWorking);
			line = rdr.readLine();
			double[][] matrix1 = getFileAsMatrix(tmpWorking);
			if (operation.equals("col_self") || operation.equals("col_matrix")) {
				matrix1 = getTranspose(matrix1);
				rowLabels = getColLabels(tmpWorking);
			}
			int numRows1 = matrix1.length;
			int numCols1 = matrix1[0].length;
			double[] rowMeans1 = getRowMeansFromMatrix(matrix1);
			double[] rowStdDevs1 = getRowStdDevsFromMatrix(matrix1);
			
			List<String> colLabels = rowLabels;
			double[][] matrix2 = null;
			String compatible = "";
			String appropriateSize = "";
			String errMsg = "Correlation against selected file not done. ";
			String corrMatrix;
			if (operation.equals("row_self") || operation.equals("col_self")) {
				matrix2 = getTranspose(matrix1);
			} else {// if (operation.equals("matrix")){
				corrMatrix = tmpWorking.replace("workingMatrix.txt.tmp", "correlationMatrix.txt");
				compatible = checkMatrixCompatibility(tmpWorking, corrMatrix, mgr, operation);
				if (compatible.equals("")) {
					colLabels = getColLabels( corrMatrix);
					matrix2 = getFileAsMatrix(corrMatrix);
				}
			}
			
			// currently not checking size. logic retained in case size becomes issue.
//			if (operation.equals("self")) {
//				if (numRows1 > 2000 || numCols1 > 2000) {
//					appropriateSize = "Dimensions of the matrix are too large.";
//				}
//			} else {// if (operation.equals("matrix")){
//				if (numRows1 > 2000 || numCols1 > 2000){ 
//					appropriateSize = "Dimensions of the original matrix are too large.";
//				} else if (numRows2 > 2000 || numCols2 > 2000) {
//					appropriateSize = "Dimensions of the selected matrix are too large.";
//				}
//			}
			if (!appropriateSize.equals("") || !compatible.equals("")) {
				errMsg += compatible;
				System.out.println(errMsg);
				mgr.getMap().builder_config.buildProps = "Y";
				mgr.getMap().builder_config.buildErrors = errMsg;
				mgr.save();
				Util.restoreWorkingFromTemp(matrixFile);
				return;
			}
			
			int numRows2 = matrix2.length;
			int numCols2 = matrix2[0].length;
			
			BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
			for (String label : colLabels) {
				out.write("\t" + label);
			}
			out.write("\n");
			
			double[] colMeans2 = getColMeansFromMatrix(matrix2);
			double[] colStdDevs2 = getColStdDevsFromMatrix(matrix2);
			for (int i = 0; i < numRows1; i++) { // for every row of the original matrix...
				double[] vecM1 = matrix1[i];
				double mean1 = rowMeans1[i];
				double stdDev1 = rowStdDevs1[i];
				boolean lowStdDev1 = false;
				if (stdDev1 < .000001) {
					lowStdDev1 = true;
				}
				double[] correlation = new double[numCols2];
				for (int j = 0; j < numCols2; j++) { // for every column of the second matrix...
					double[] vecM2 = new double[numRows2];
					for (int cc = 0; cc < numRows2; cc++) {
						vecM2[cc] = matrix2[cc][j];
					}
					double mean2 = colMeans2[j];
					double stdDev2 = colStdDevs2[j];
					boolean lowStdDev2 = false;
					if (stdDev2 < .000001) {
						lowStdDev2 = true;
					}
					if (!lowStdDev1 && !lowStdDev2) {
						double covar = 0;
						int numCol = 0;
						double firstVal1 = vecM1[0];// used to detect if row/col only has the same value
						double firstVal2 = vecM2[0];
						boolean sameVal1 = true;
						boolean sameVal2 = true;
						for (int k = 0; k < numRows1; k++) { // for every value that needs to be correlated against...
							Double val1 = vecM1[k];
							Double val2 = vecM2[k];
							if (!val1.isNaN() && !val2.isNaN()) {
								if (val1 != firstVal1) {
									sameVal1 = false;
								}
								if (val2 != firstVal2) {
									sameVal2 = false;
								}
								covar += ((vecM1[k] - mean1)/(stdDev1))*((vecM2[k] - mean2) / (stdDev2));
								numCol++;
							}
						}
						if (numCol < 3 && !sameVal1 && !sameVal2) { // 3 points is the min number of values needed to do a valid correlation
							correlation[j] = Double.NaN;
						} else {
							correlation[j] = covar/(numCol-1);
						}
					} else {
						correlation[j] = Double.NaN;
					}
				}	
				out.write(rowLabels.get(i));
				for (int ii = 0; ii < numCols2; ii++) {
					out.write("\t");
					out.write(Double.toString(correlation[ii]));
				}
				out.write("\n");
				line = rdr.readLine();
			}
			if (operation.equals("row_matrix") || operation.equals("col_matrix")) {
				
				mgr.getMap().builder_config.buildProps = "Y";
				if (mgr.getMap().builder_config.transform_config == null) {
						mgr.getMap().builder_config.transform_config = mgr.new TransformConfig(false, null, null, null);
				}
				mgr.getMap().builder_config.transform_config.correlationDone = true;
				mgr.save();
			}
			

			rdr.close();
			out.close();
			new File(tmpWorking).delete();
		}    
	}
	
	
	private static double getRowMean(String[] toks) throws Exception{
		double tot = 0;
		int count = 0;  // exclude the empty cells from the average
		for (int i = 1; i < toks.length; i++) {
			if (Util.isNumeric(toks[i])){
				tot += Double.parseDouble(toks[i]);
				count++;
			}
		}
		double mean = tot/count;
		return mean;
	}
	
	
	private static double[] getColMeans(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader mrdr = new BufferedReader(new FileReader(tmpWorking));
		String mline = mrdr.readLine(); // skip headers
		mline = mrdr.readLine();
		int lineLength = mline.split("\t",-1).length;
		
		double[] means = new double[lineLength];
		int[] counts = new int[lineLength];
		while (mline != null ){
			String toks[] = mline.split("\t",-1);
			for (int i = 1; i < toks.length; i++) {
				if (Util.isNumeric(toks[i])) {
					means[i] += Double.parseDouble(toks[i]);
					counts[i]++;
				}
			}
			mline = mrdr.readLine();
		}
		mrdr.close();
		
		for (int i = 0; i < means.length; i++){
			means[i] = means[i]/counts[i];
		}
		return means;
	}
	
	private static float getRowMin(String[] toks) throws Exception{
		float min = Float.MAX_VALUE;
		for (int i = 1; i < toks.length; i++) {
			if (Util.isNumeric(toks[i]) && Float.parseFloat(toks[i]) < min){
				min = Float.parseFloat(toks[i]);
			}
		}
		return min;
	}
	
	private static float[] getColMins(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader mrdr = new BufferedReader(new FileReader(tmpWorking));
		String mline = mrdr.readLine(); // skip headers
		mline = mrdr.readLine();
		int lineLength = mline.split("\t",-1).length;
		
		float[] mins = new float[lineLength];
		for (int i = 1; i < mins.length; i++) {
			mins[i] = Float.MAX_VALUE;
		}
		while (mline != null ){
			String toks[] = mline.split("\t",-1);
			for (int i = 1; i < toks.length; i++) {
				if (Util.isNumeric(toks[i]) && Float.parseFloat(toks[i]) < mins[i]) {
					mins[i] = Float.parseFloat(toks[i]);
				}
			}
			mline = mrdr.readLine();
		}
		mrdr.close();
		return mins;
	}
	
	// num rows without the header
	private static int getNumRows(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader mrdr = new BufferedReader(new FileReader(tmpWorking));
		String mline = mrdr.readLine(); // skip headers
		mline = mrdr.readLine();
		int numRows = 0;
		while (mline != null ){
			numRows++;
			mline = mrdr.readLine();
		}
		mrdr.close();
		return numRows;
	}
	
	// Variance is standard deviation^2. Use Variances to save computing time
		private static double getRowVariance(String line) throws Exception{ 
			String toks[] = line.split("\t",-1);
			double tot = 0;
			int count = 0;  // exclude the empty cells from the average
			for (int i = 1; i < toks.length; i++) {
				if (Util.isNumeric(toks[i])){
					tot += Double.parseDouble(toks[i]);
					count++;
				}
			}
			double mean = tot/count;
			
			double variance = 0;
			for (int i = 1; i < toks.length; i++) {
				if (Util.isNumeric(toks[i])) {
					double diff = Double.parseDouble(toks[i]) - mean;
					variance += diff*diff/count;
				}
			}
			return variance;
		}
	
	private static double[] getColVariances(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader mrdr = new BufferedReader(new FileReader(tmpWorking));
		String mline = mrdr.readLine(); // skip headers
		mline = mrdr.readLine();
		int lineLength = mline.split("\t",-1).length;
		
		//get the means
		float[] means = new float[lineLength];
		int[] counts = new int[lineLength];
		while (mline != null ){
			String toks[] = mline.split("\t",-1);
			for (int i = 1; i < toks.length; i++) {
//				counts[i]++;
				if (Util.isNumeric(toks[i])) {
					means[i] += Double.parseDouble(toks[i]);
					counts[i]++;
				}
			}
			mline = mrdr.readLine();
		}
		mrdr.close();
		
		for (int i = 0; i < means.length; i++){
			means[i] = means[i]/counts[i];
		}
		
		// get the variances
		BufferedReader srdr = new BufferedReader(new FileReader(tmpWorking));
		String sline = srdr.readLine(); // skip headers
		sline = srdr.readLine();
		double[] variances = new double[lineLength];
		while (sline != null ){
			String toks[] = sline.split("\t",-1);
			for (int i = 1; i < toks.length; i++) {
				if (Util.isNumeric(toks[i])) {
					double diff = Double.parseDouble(toks[i]) - means[i];
					variances[i] += diff*diff/counts[i];
				}
			}
			sline = srdr.readLine();
		}
		srdr.close();
		return variances;
	}
	
	// This function will return the given file as a data matrix. 
	// The matrix returned will not include any labels
	// Assumption: given matrix will not have any excess rows or columns before/after 
	//				the data matrix, aside from labels
	//				ie: the data begins at 1,1
	private static double[][] getFileAsMatrix(String matrixFile) throws Exception{ 
		BufferedReader rdr = new BufferedReader(new FileReader(matrixFile));
		String line = rdr.readLine(); // skip headers
		line = rdr.readLine();
		int numRows = getNumRows(matrixFile);
		int numCols = line.split("\t",-1).length-1; 
		double[][] matrix = new double[numRows][numCols];
		int i = 0;
		while (line != null) {
			String toks[] = line.split("\t",-1);
			for (int j = 1; j < toks.length; j++) {
				if (Util.isNumeric(toks[j])) {
					double val = Double.parseDouble(toks[j]);
					matrix[i][j-1] = val;
				} else {
					matrix[i][j-1] = Double.NaN;
				}
			}
			i++;
			line = rdr.readLine();
		}
		rdr.close();
		return matrix;
	}
	
	// special case matrix used for "transpose" option of correlation. Avoids converting NaN cells.
	private static String[][] getFileAsStringMatrix(String matrixFile) throws Exception{ 
		BufferedReader rdr = new BufferedReader(new FileReader(matrixFile));
		String line = rdr.readLine(); // skip headers
		line = rdr.readLine();
		int numRows = getNumRows(matrixFile);
		int numCols = line.split("\t",-1).length-1; 
		String[][] matrix = new String[numRows][numCols];
		int i = 0;
		while (line != null) {
			String toks[] = line.split("\t",-1);
			for (int j = 1; j < toks.length; j++) {
				matrix[i][j-1] = toks[j];
			}
			i++;
			line = rdr.readLine();
		}
		rdr.close();
		return matrix;
	}
	
	private static double[] getRowMeansFromMatrix(double[][] matrix) throws Exception{
		int numRows = matrix.length;
		double[] means = new double[numRows];
		for (int i = 0; i < numRows; i++) {
			double sum = 0;
			double tot = 0;
			for (int j = 0; j < matrix[i].length; j++) {
				Double val = matrix[i][j];
				if (!val.isNaN()) {
					sum += matrix[i][j];
					tot++;
				}
			}
			means[i] = sum/tot;
		}
		return means;
	}
	
	private static double[] getRowStdDevsFromMatrix(double[][] matrix) throws Exception{ 
		int numRows = matrix.length;
		double[] stdDevs = new double[numRows];
		double[] means = getRowMeansFromMatrix(matrix);
		int[] counts = new int[numRows];
		for (int i = 0; i < numRows; i++) {
			stdDevs[i] = 0;
			counts[i] = 0;
			for (int j = 0; j < matrix[i].length; j++) {
				Double val = matrix[i][j];
				if (!val.isNaN()) {
					stdDevs[i] += Math.pow((matrix[i][j]-means[i]),2);
					counts[i]++;
				}
			}
			stdDevs[i] = Math.sqrt(stdDevs[i]/(counts[i]-1));
		}
		return stdDevs;
	}
	
	private static double[] getColMeansFromMatrix(double[][] matrix) throws Exception{
		int numCols = matrix[0].length;
		int numRows = matrix.length;
		double[] means = new double[numCols];
		int[] counts = new int[numCols];
		for (int i = 0; i < numCols; i++) {
			means[i] = 0;
			counts[i] = 0;
			for (int j = 0; j < numRows; j++) {
				Double val = matrix[j][i];
				if (!val.isNaN()) {
					means[i] += matrix[j][i];
					counts[i]++;
				}
			}
			means[i] = means[i]/counts[i];
		}
		return means;
	}
	
	private static double[] getColStdDevsFromMatrix(double[][] matrix) throws Exception{ 
		int numRows = matrix.length;
		int numCols = matrix[0].length;
		double[] stdDevs = new double[numCols];
		double[] means = getColMeansFromMatrix(matrix);
		int[] counts = new int[numCols];
		for (int i = 0; i < numCols; i++) {
			stdDevs[i] = 0;
			counts[i] = 0;
			for (int j = 0; j < numRows; j++) {
				Double val = matrix[j][i];
				if (!val.isNaN()) {
					stdDevs[i] += Math.pow((matrix[j][i]-means[i]),2);
					counts[i]++;
				}
			}
			stdDevs[i] = Math.sqrt(stdDevs[i]/(counts[i]-1));
		}
		return stdDevs;
	}
	
	private static double[][] getTranspose(double[][] matrix) throws Exception{
		int numRows = matrix.length;
		int numCols = matrix[0].length;
		double[][] transpose = new double[numCols][numRows];
		for (int i = 0; i < numRows; i++) {
			String ts = "";
			for (int j = 0; j < numCols; j++) {
				transpose[j][i] = matrix[i][j];
			}
		}
		return transpose;
	}
	
	private static String[][] getTransposeString(String[][] matrix) throws Exception{
		int numRows = matrix.length;
		int numCols = matrix[0].length;
		String[][] transpose = new String[numCols][numRows];
		for (int i = 0; i < numRows; i++) {
			String ts = "";
			for (int j = 0; j < numCols; j++) {
				transpose[j][i] = matrix[i][j];
			}
		}
		return transpose;
	}
	
	private static List<String> getRowLabels(String file) throws Exception{
		List<String> labels = new ArrayList<String>();
		BufferedReader rdr = new BufferedReader(new FileReader(file));
		String line = rdr.readLine(); // skip headers/col labels
		line = rdr.readLine();
		while(line != null) {
			String[] toks = line.split("\t",-1);
			String label = toks[0];
			if (!label.equals(null) && !label.equals("")) {
				labels.add(toks[0]);
			}
			line = rdr.readLine();
		}
		rdr.close();
		return labels;
	}
	
	private static List<String> getColLabels(String file) throws Exception{
		List<String> labels = new ArrayList<String>(); // or LinkedList<String>();
		BufferedReader rdr = new BufferedReader(new FileReader(file));
		String line = rdr.readLine();
		String[] toks = line.split("\t",-1);
		for (int i = 0; i < toks.length; i++) {
			String label = toks[i];
			if (!label.equals("") && !label.equals(null)) {
				labels.add(toks[i]);
			}
		}
		rdr.close();
		return labels;
	}
	
	// returns 0 if it is compatible, 1 if the label sizes don't match, 2 if the label order don't match
	private static String checkMatrixCompatibility (String matrixFile1, String matrixFile2, HeatmapPropertiesManager mgr, String operation) throws Exception{
		File corrFile = new File(matrixFile2);
		if (!corrFile.exists()) {
			System.out.println("Correlation Matrix File not found.");
			return "Correlation Matrix not found.";
		}
		if (mgr.getMap().builder_config.transform_config != null) {
			if (mgr.getMap().builder_config.transform_config.correlationDone){
				return "Only one correlation with an additional matrix is allowed.";
			}
		}
		List<String> colLabels1 = getColLabels(matrixFile1);
		if (operation.equals("col_matrix")) {
			colLabels1 = getRowLabels(matrixFile1);
		}
		List<String> rowLabels2 = getRowLabels(matrixFile2);
		if (colLabels1.size() != rowLabels2.size()) {
			System.out.println("Label size mismatch");
			return "Number of columns in original matrix ("+colLabels1.size()+") does not match number of rows in correlation matrix ("+rowLabels2.size()+").";
		}
		for (int i = 0; i < colLabels1.size(); i++) {
			String colLabel = colLabels1.get(i);
			String rowLabel = rowLabels2.get(i);
			if (!colLabel.equals(rowLabel)) {
				System.out.println("Label order mismatch at index: " + i);
				return "Label order does not match at index: " + i;
			}
		}
		return "";
	}
}


