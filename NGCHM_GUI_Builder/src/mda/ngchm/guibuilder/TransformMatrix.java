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
		    
		    String transform = request.getParameter("Transform");
		    
		    if (transform.equals("Log"))
		    	logTransform(matrixFile, request);
		    else if (transform.equals("MeanCenter"))
		    	meanCenterTransform(matrixFile, request);
		    else if (transform.equals("Z-Norm"))
		    	zNormTransform(matrixFile, request);
		    else if (transform.equals("Arithmetic"))
		    	arithmeticTransform(matrixFile, request);

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
				String toks[] = line.split("\t");
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
				String toks[] = line.split("\t");
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
				String toks[] = line.split("\t");
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
				String toks[] = line.split("\t");
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
				String toks[] = line.split("\t");
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
		String axis = request.getParameter("tmrowcol");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
		if (axis.equals("row")) {
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t");
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
				String toks[] = line.split("\t");
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
				String toks[] = line.split("\t");
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
		} else if (operation.equals("multiply")) {
			float multiVal = Float.parseFloat(request.getParameter("multiply_value"));
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			
			while (line != null ){
				String toks[] = line.split("\t");
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
		} 
		rdr.close();
		out.close();
		new File(tmpWorking).delete();
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
		int lineLength = mline.split("\t").length;
		
		double[] means = new double[lineLength];
		int[] counts = new int[lineLength];
		while (mline != null ){
			String toks[] = mline.split("\t");
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
		int lineLength = mline.split("\t").length;
		
		float[] mins = new float[lineLength];
		for (int i = 1; i < mins.length; i++) {
			mins[i] = Float.MAX_VALUE;
		}
		while (mline != null ){
			String toks[] = mline.split("\t");
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
	
	// Variance is standard deviation^2. Use Variances to save computing time
		private static double getRowVariance(String line) throws Exception{ 
			String toks[] = line.split("\t");
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
		int lineLength = mline.split("\t").length;
		
		//get the means
		float[] means = new float[lineLength];
		int[] counts = new int[lineLength];
		while (mline != null ){
			String toks[] = mline.split("\t");
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
			String toks[] = sline.split("\t");
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
}


