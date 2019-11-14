package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;

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
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    String propJSON = "{}";
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        if (propFile.exists()) {
			    String matrixFile = workingDir  + "/workingMatrix.txt";
			    String filter = request.getParameter("Filter");
			    if (filter.equals("Range")){
			    	filterRange(matrixFile, request);
			    } else if (filter.equals("Variation")){
			    	filterVariation(matrixFile, request);
			    } else if (filter.equals("MissingData")){
			    	filterMissing(matrixFile, request);
			    }
			    propJSON = mgr.load();
	        } else {
	        	propJSON = "{\"no_file\": 1}";
	        }
	    	response.getWriter().write(propJSON.toString());
	    	response.flushBuffer();
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
		
	    if (axis.equals("row")) { // row filters
	    	if (filterMethod.equals("onegreater")) {

				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				double threshold = Double.parseDouble(request.getParameter("1range_max"));
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					boolean skip = false;
					for (int i = 1; i < toks.length; i++) {
						if (Util.isNumeric(toks[i])) {
							if (Double.parseDouble(toks[i]) > threshold){
								skip = true;
								break;
							}	
						}
						outLine.append("\t" + toks[i]);
					}
					if (!skip){
						out.write(outLine.toString() + "\n");
					}
					line = rdr.readLine();
				}	
			} else if (filterMethod.equals("oneless")) {

				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				double threshold = Double.parseDouble(request.getParameter("1range_min"));
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					boolean skip = false;
					for (int i = 1; i < toks.length; i++) {
						if (Util.isNumeric(toks[i])) {
							if (Double.parseDouble(toks[i]) < threshold){
								skip = true;
								break;
							}	
						}
						outLine.append("\t" + toks[i]);
					}
					if (!skip){
						out.write(outLine.toString() + "\n");
					}
					line = rdr.readLine();
				}	
			} else if (filterMethod.equals("allgreater")) {

				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				double threshold = Double.parseDouble(request.getParameter("arange_max"));
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					boolean skip = true;
					for (int i = 1; i < toks.length; i++) {
						if (Util.isNumeric(toks[i])) {
							if (Double.parseDouble(toks[i]) < threshold){
								skip = false;
								break;
							}	
						}
					}
					if (!skip){
						out.write(line.toString() + "\n");
					}
					line = rdr.readLine();
				}	
			} else if (filterMethod.equals("allless")) {

				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				double threshold = Double.parseDouble(request.getParameter("arange_min"));
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					boolean skip = true;
					for (int i = 1; i < toks.length; i++) {
						if (Util.isNumeric(toks[i])) {
							if (Double.parseDouble(toks[i]) > threshold){
								skip = false;
								break;
							}	
						}
					}
					if (!skip){
						out.write(line.toString() + "\n");
					}
					line = rdr.readLine();
				}
			} else if (filterMethod.equals("oneval")) {

				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				double threshold = Double.parseDouble(request.getParameter("range_max"));
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					boolean skip = true;
					for (int i = 1; i < toks.length; i++) {
						if (Util.isNumeric(toks[i])) {
							if (Double.parseDouble(toks[i]) > threshold){
								skip = false;
								break;
							}	
						}
					}
					if (!skip){
						out.write(line.toString() + "\n");
					}
					line = rdr.readLine();
				}
			}
	    } else if (axis.equals("col")) {
	    	if (filterMethod.equals("onegreater")) {
	    		float[] maxs = getColMaxs(tmpWorking);
	    		double threshold = Double.parseDouble(request.getParameter("1range_max"));
	    		boolean[] skip = new boolean[maxs.length];
	    		for (int i = 1; i < maxs.length; i++){
	    			if (maxs[i] > threshold){
	    				skip[i] = true;
	    			}
	    		}
	    		String line = rdr.readLine();
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (!skip[i]){ 
							outLine.append("\t" + toks[i]);
						}
					}
					out.write(outLine.toString() + "\n");
					line = rdr.readLine();
				}	
			} else if (filterMethod.equals("oneless")) {
				float[] mins = getColMins(tmpWorking);
	    		double threshold = Double.parseDouble(request.getParameter("1range_min"));
	    		boolean[] skip = new boolean[mins.length];
	    		for (int i = 1; i < mins.length; i++){
	    			if (mins[i] < threshold){
	    				skip[i] = true;
	    			}
	    		}
	    		String line = rdr.readLine();
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (!skip[i]){ 
							outLine.append("\t" + toks[i]);
						}
					}
					out.write(outLine.toString() + "\n");
					line = rdr.readLine();
				}
			} else if (filterMethod.equals("allgreater")) {
				float[] mins = getColMins(tmpWorking);
	    		double threshold = Double.parseDouble(request.getParameter("arange_max"));
	    		boolean[] skip = new boolean[mins.length];
	    		for (int i = 1; i < mins.length; i++){
	    			if (mins[i] > threshold){
	    				skip[i] = true;
	    			}
	    		}
	    		String line = rdr.readLine();
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (!skip[i]){ 
							outLine.append("\t" + toks[i]);
						}
					}
					out.write(outLine.toString() + "\n");
					line = rdr.readLine();
				}
			} else if (filterMethod.equals("allless")) {
				float[] maxs = getColMaxs(tmpWorking);
	    		double threshold = Double.parseDouble(request.getParameter("arange_min"));
	    		boolean[] skip = new boolean[maxs.length];
	    		for (int i = 1; i < maxs.length; i++){
	    			if (maxs[i] < threshold){
	    				skip[i] = true;
	    			}
	    		}
	    		String line = rdr.readLine();
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (!skip[i]){ 
							outLine.append("\t" + toks[i]);
						}
					}
					out.write(outLine.toString() + "\n");
					line = rdr.readLine();
				}
			} else if (filterMethod.equals("oneval")) {
				float[] maxs = getColMaxs(tmpWorking);
	    		double threshold = Double.parseDouble(request.getParameter("range_max"));
	    		boolean[] skip = new boolean[maxs.length];
	    		for (int i = 1; i < maxs.length; i++){
	    			if (maxs[i] < threshold){
	    				skip[i] = true;
	    			}
	    		}
	    		String line = rdr.readLine();
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (!skip[i]){ 
							outLine.append("\t" + toks[i]);
						}
					}
					out.write(outLine.toString() + "\n");
					line = rdr.readLine();
				}	
			}
	    }
		
		rdr.close();
		out.close();
		new File(tmpWorking).delete();
	}
	
	private void filterVariation(String matrixFile, HttpServletRequest request) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("vrowcol");
		String filterMethod = request.getParameter("vfiltermethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
	    if (axis.equals("row")) { // row filters
	    	if (filterMethod.equals("std_value")) {
	    		double threshold = Double.parseDouble(request.getParameter("std_limit"));
//	    		threshold = threshold*threshold; // we compare variances to cut down computation time
	    		String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				while (line != null ){
					double variance = getRowDeviation(line);
					if (variance > threshold){
						out.write(line.toString() + "\n");
					}
					line = rdr.readLine();
				}	
			} else if (filterMethod.equals("pct") || filterMethod.equals("fixednum")) {
	    		double[] deviations = getAllRowDeviations(tmpWorking);
	    		int numKeep = 0;
				if (filterMethod.equals("pct")){
					double numKeepD = (deviations.length-1) * Double.parseDouble(request.getParameter("std_pct"))/100;
					numKeep = (int)numKeepD;
				} else {
					numKeep = Integer.parseInt(request.getParameter("std_num_keep"));
				}
	    		boolean[] skip = new boolean[deviations.length];
	    		if (numKeep > deviations.length) {
	    			numKeep = deviations.length;
	    		}
	    		double[] sortDevs = deviations.clone();
	    		Arrays.sort(sortDevs);
	    		double threshold = sortDevs[sortDevs.length-numKeep];
	    		
	    		String line = rdr.readLine();
	    		out.write(line + "\n");
				line = rdr.readLine();
				int index = 0;
				while (line != null ){
					if (deviations[index] >= threshold) {
						out.write(line.toString() + "\n");
					}
					index++;

					line = rdr.readLine();
				}	
			}
	    } else if (axis.equals("col")) {
	    	if (filterMethod.equals("std_value")) {
	    		double threshold = Double.parseDouble(request.getParameter("std_limit"));
//	    		threshold = threshold*threshold; // we compare variances to cut down computation time
	    		double[] variances = getColDeviations(tmpWorking);
	    		boolean[] skip = new boolean[variances.length];
	    		
	    		for (int i = 1; i < variances.length; i++){
	    			if (variances[i] < threshold){
	    				skip[i] = true;
	    			}
	    		}
	    		
	    		String line = rdr.readLine();
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (!skip[i]){ 
							outLine.append("\t" + toks[i]);
						}
					}
					out.write(outLine.toString() + "\n");
					line = rdr.readLine();
				}	
			} else if (filterMethod.equals("pct") || filterMethod.equals("fixednum")) {
	    		double[] deviations = getColDeviations(tmpWorking);
	    		int numKeep = 0;
				if (filterMethod.equals("pct")){
					double numKeepD = (deviations.length-1) * Double.parseDouble(request.getParameter("std_pct"))/100;
					numKeep = (int)numKeepD;
				} else {
					numKeep = Integer.parseInt(request.getParameter("std_num_keep"));
				}
	    		if (numKeep > deviations.length) {
	    			numKeep = deviations.length;
	    		}
	    		boolean[] skip = new boolean[deviations.length];
	    		double[] sortDevs = deviations.clone();
	    		Arrays.sort(sortDevs);
	    		double threshold = sortDevs[sortDevs.length-numKeep];
	    		
	    		for (int i = 1; i < deviations.length; i++){
	    			if (deviations[i] < threshold){
	    				skip[i] = true;
	    			}
	    		}
	    		
	    		String line = rdr.readLine();
				while (line != null ){
					String toks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (!skip[i]){ 
							outLine.append("\t" + toks[i]);
						}
					}
					out.write(outLine.toString() + "\n");
					line = rdr.readLine();
				}	
			} 
	    }
		
		rdr.close();
		out.close();
		new File(tmpWorking).delete();
	}
	
	private void filterMissing(String matrixFile, HttpServletRequest request) throws Exception {
		Util.backupWorking(matrixFile);
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("mrowcol");
		String filterMethod = request.getParameter("mfiltermethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
	    
		if (axis.equals("row")) { // row filters
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
			String headers[] = line.split("\t",-1);
			int thresh = 0;
			if (filterMethod.equals("pctgreater")){
				double numKeepD = (headers.length-1) * Double.parseDouble(request.getParameter("std_pct_missing"))/100;
				thresh = (int)numKeepD;
			} else {
				thresh = Integer.parseInt(request.getParameter("std_num_missing"));
			}
			while (line != null ){
				String toks[] = line.split("\t",-1);
				StringBuffer outLine = new StringBuffer();
				outLine.append(toks[0]);
				int missingNo = 0;
				for (int i = 1; i < toks.length; i++) {
					if (Util.isMissing(toks[i])) {
						missingNo++;
					}
				}
				if (missingNo <= thresh) {
					out.write(line.toString() + "\n");
				}
				line = rdr.readLine();
			}
	    } else if (axis.equals("col")) {
	    	int[] missingNos = getNumMissingCol(tmpWorking);
	    	String line = rdr.readLine(); //Just write the header
			String headers[] = line.split("\t",-1);
			int thresh = 0;
			if (filterMethod.equals("pctgreater")){
				double numKeepD = (headers.length-1) * Double.parseDouble(request.getParameter("std_pct_missing"))/100;
				thresh = (int)numKeepD;
			} else {
				thresh = Integer.parseInt(request.getParameter("std_num_missing"));
			}
			boolean[] skip = new boolean[missingNos.length];
			for (int i = 1; i < missingNos.length; i++) {
				if (missingNos[i] > thresh) {
					skip[i] = true;
				}
			}
			while (line != null ){
				String toks[] = line.split("\t",-1);
				StringBuffer outLine = new StringBuffer();
				outLine.append(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (!skip[i]) {
						outLine.append("\t" + toks[i]);
					}
				}
				out.write(outLine.toString() + "\n");
				line = rdr.readLine();
			}
	    }
		
		rdr.close();
		out.close();
		new File(tmpWorking).delete();
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
	
	private static float[] getColMaxs(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader mrdr = new BufferedReader(new FileReader(tmpWorking));
		String mline = mrdr.readLine(); // skip headers
		mline = mrdr.readLine();
		int lineLength = mline.split("\t",-1).length;
		
		float[] mins = new float[lineLength];
		for (int i = 1; i < mins.length; i++) {
			mins[i] = -Float.MAX_VALUE;
		}
		while (mline != null ){
			String toks[] = mline.split("\t",-1);
			for (int i = 1; i < toks.length; i++) {
				if (Util.isNumeric(toks[i]) && Float.parseFloat(toks[i]) > mins[i]) {
					mins[i] = Float.parseFloat(toks[i]);
				}
			}
			mline = mrdr.readLine();
		}
		mrdr.close();
		return mins;
	}
	
	// Variance is standard deviation^2. Use Variances to save computing time
	private static double getRowDeviation(String line) throws Exception{ 
		String toks[] = line.split("\t",-1);
		double tot = 0;
		int count = 0;  // exclude the empty cells from the average
		int total = 0;
		for (int i = 1; i < toks.length; i++) {
			if (Util.isNumeric(toks[i])){
				tot += Double.parseDouble(toks[i]);
				count++;
			}
			total++;
		}
		double mean = tot/count;
		
		double deviation = 0;
		for (int i = 1; i < toks.length; i++) {
			if (Util.isNumeric(toks[i])) {
				double diff = Double.parseDouble(toks[i]) - mean;
				deviation += diff*diff/(count-1);
			}
		}
		deviation = Math.sqrt(deviation);
		return deviation;
	}
	
	private static double[] getColDeviations(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader mrdr = new BufferedReader(new FileReader(tmpWorking));
		String mline = mrdr.readLine(); // skip headers
		mline = mrdr.readLine();
		int lineLength = mline.split("\t",-1).length;
		
		//get the means
		double[] means = new double[lineLength];
		int[] counts = new int[lineLength];
		int total = 0;
		while (mline != null ){
			String toks[] = mline.split("\t",-1);
			for (int i = 1; i < toks.length; i++) {
				if (Util.isNumeric(toks[i])) {
					means[i] += Double.parseDouble(toks[i]);
					counts[i]++;
				}
			}
			total++;
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
		double[] deviations = new double[lineLength];
		while (sline != null ){
			String toks[] = sline.split("\t",-1);
			for (int i = 1; i < toks.length; i++) {
				if (Util.isNumeric(toks[i])) {
					double diff = Double.parseDouble(toks[i]) - means[i];
					deviations[i] += diff*diff/(counts[i]-1);
				}
			}
			sline = srdr.readLine();
		}
		srdr.close();
		
		for (int i = 1; i < deviations.length; i++){
			deviations[i] = Math.sqrt(deviations[i]);
		}
		return deviations;
	}

	private static double[] getAllRowDeviations(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader mrdr = new BufferedReader(new FileReader(tmpWorking));
		String mline = mrdr.readLine(); // skip headers
		mline = mrdr.readLine();
		int numRows = 0;
		
		//get the means
		while (mline != null ){
			numRows++;
			mline = mrdr.readLine();
		}
		mrdr.close();
		
		BufferedReader srdr = new BufferedReader(new FileReader(tmpWorking));
		String sline = srdr.readLine(); // skip headers
		sline = srdr.readLine();
		
		double[] devs = new double[numRows];
		int count = 0;
		//get the means
		while (sline != null ){
			double dev = getRowDeviation(sline);
			devs[count] = dev;
			count++;
			sline = srdr.readLine();
		}
		srdr.close();
		
		return devs;
	}
	
	private static int[] getNumMissingCol(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader mrdr = new BufferedReader(new FileReader(tmpWorking));
		String mline = mrdr.readLine(); // skip headers
		mline = mrdr.readLine();
		int lineLength = mline.split("\t",-1).length;
		
		//get the means
		int[] missingNos = new int[lineLength];
		while (mline != null ){
			String toks[] = mline.split("\t",-1);
			for (int i = 1; i < toks.length; i++) {
				if (Util.isMissing(toks[i])) {
					missingNos[i] ++;
				}
			}
			mline = mrdr.readLine();
		}
		mrdr.close();
		
		return missingNos;
	}
}
