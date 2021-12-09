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
import javax.servlet.http.Part;

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
    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
    	workingDir = workingDir + "/" + mySession.getId();
	    String matrixFile = workingDir  + "/workingMatrix.txt";

	    try {
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    String propJSON = "{}";
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        if (propFile.exists()) {
				Util.backupWorking(matrixFile);
			    String filter = request.getParameter("Filter");
			    int[] counts;
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
	    	try {
	    		Util.restoreWorking(matrixFile);
	    	} catch (Exception f) {
	    		//do nothing
	    	}
	    	String errmsg = e.getMessage().trim();
	    	if (errmsg.length() < 3 ) { errmsg ="";} else {errmsg = errmsg + ".";}
        	String errJSON = "{\"error\": \"The selected filter could not be applied to your matrix. \"}";
	        writer.println(errJSON);
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
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("rrowcol");
		String filterMethod = request.getParameter("rfiltermethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
		try {
		    int[] retVal = new int[2];
		    if (axis.equals("row")) { // row filters
		    	if (filterMethod.equals("onegreater")) {
	
					String line = rdr.readLine(); //Just write the header
					out.write(line + "\n");
					line = rdr.readLine();
					double threshold = Double.parseDouble(request.getParameter("1range_max"));
					while (line != null ){
						retVal[0]++;
						String toks[] = line.split("\t",-1);
						StringBuffer outLine = new StringBuffer();
						outLine.append(toks[0]);
						boolean skip = false;
						for (int i = 1; i < toks.length; i++) {
							if (Util.isNumeric(toks[i])) {
								if (Double.parseDouble(toks[i]) > threshold){
									retVal[1]++;
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
						retVal[0]++;
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
							retVal[1]++;
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
						retVal[0]++;
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
							retVal[1]++;
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
						retVal[0]++;
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
							retVal[1]++;
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
						retVal[0]++;
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
						retVal[0]++;
		    			if (maxs[i] > threshold){
		    				skip[i] = true;
		    			} else {
							retVal[1]++;
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
						retVal[0]++;
		    			if (mins[i] < threshold){
		    				skip[i] = true;
		    			} else {
							retVal[1]++;
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
						retVal[0]++;
		    			if (mins[i] > threshold){
		    				skip[i] = true;
		    			} else {
							retVal[1]++;
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
						retVal[0]++;
		    			if (maxs[i] < threshold){
		    				skip[i] = true;
		    			} else {
							retVal[1]++;
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
						retVal[0]++;
		    			if (maxs[i] < threshold){
		    				skip[i] = true;
		    			} else {
							retVal[1]++;
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
			long outSize = new File(matrixFile).length();
			long inSize = new File(tmpWorking).length();
			String axisTitle = axis.contentEquals("row") ? "Rows" : "Columns";
		    ActivityLog.logActivity(request, "Transform Matrix", "FilterMatrix", "Filter " + axisTitle + " by Range using " + filterMethod + ". " + axisTitle + " Bef/Aft: " + retVal[0] + "/" + retVal[1] + ". File Size Bef/Aft: " + inSize + "/" + outSize);
		} catch (Exception e) {
			rdr.close();
			out.close();
			throw e;
		} finally {
			rdr.close();
			out.close();
			new File(tmpWorking).delete();
		}
		
	}
	
	private void filterVariation(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("vrowcol");
		String filterMethod = request.getParameter("vfiltermethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
		try {
		    int[] retVal = new int[2];
		    if (axis.equals("row")) { // row filters
		    	if (filterMethod.equals("std_value")) {
		    		double threshold = Double.parseDouble(request.getParameter("std_limit"));
		    		String line = rdr.readLine(); //Just write the header
					out.write(line + "\n");
					line = rdr.readLine();
					while (line != null ){
						retVal[0]++;
						double variance = getRowDeviation(line);
						if (variance > threshold){
							retVal[1]++;
							out.write(line.toString() + "\n");
						}
						line = rdr.readLine();
					}	
				} else if (filterMethod.equals("pct") || filterMethod.equals("fixednum")) {
		    		double[] deviations = getAllRowDeviations(tmpWorking);
		    		int numKeep = 0;
					if (filterMethod.equals("pct")){
						double numKeepD = Math.ceil((deviations.length-1) * Double.parseDouble(request.getParameter("std_pct"))/100);
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
						retVal[0]++;
						if (deviations[index] >= threshold) {
							retVal[1]++;
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
						retVal[0]++;
		    			if (variances[i] < threshold){
		    				skip[i] = true;
		    			} else {
							retVal[1]++;
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
						double numKeepD = Math.ceil((deviations.length-1) * Double.parseDouble(request.getParameter("std_pct"))/100);
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
						retVal[0]++;
		    			if (deviations[i] < threshold){
		    				skip[i] = true;
		    			} else {
							retVal[1]++;
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
			long outSize = new File(matrixFile).length();
			long inSize = new File(tmpWorking).length();
			String axisTitle = axis.contentEquals("row") ? "Rows" : "Columns";
		    ActivityLog.logActivity(request, "Transform Matrix", "FilterMatrix", "Filter " + axisTitle + " Variation using " + filterMethod + ". " + axisTitle + " Bef/Aft: " + retVal[0] + "/" + retVal[1] + ". File Size Bef/Aft: " + inSize + "/" + outSize);
		} catch (Exception e) {
			rdr.close();
			out.close();
			throw e;
		} finally {
			rdr.close();
			out.close();
			new File(tmpWorking).delete();
		}
		
	}
	
	private void filterMissing(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("mrowcol");
		String filterMethod = request.getParameter("mfiltermethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));

		try {
		    int[] retVal = new int[2];
			if (axis.equals("row")) { // row filters
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				String headers[] = line.split("\t",-1);
				int thresh = 0;
				if (filterMethod.equals("pctgreater")){
					double numKeepD = Math.ceil((headers.length-1) * Double.parseDouble(request.getParameter("std_pct_missing"))/100);
					thresh = (int)numKeepD;
				} else {
					thresh = Integer.parseInt(request.getParameter("std_num_missing"));
				}
				while (line != null ){
					retVal[0]++;
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
						retVal[1]++;
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
					double numKeepD = Math.ceil((headers.length-1) * Double.parseDouble(request.getParameter("std_pct_missing"))/100);
					thresh = (int)numKeepD;
				} else {
					thresh = Integer.parseInt(request.getParameter("std_num_missing"));
				}
				boolean[] skip = new boolean[missingNos.length];
				for (int i = 1; i < missingNos.length; i++) {
					retVal[0]++;
					if (missingNos[i] > thresh) {
						skip[i] = true;
					} else {
						retVal[1]++;
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
			out.close();
			long outSize = new File(matrixFile).length();
			long inSize = new File(tmpWorking).length();
			String axisTitle = axis.contentEquals("row") ? "Rows" : "Columns";
		    ActivityLog.logActivity(request, "Transform Matrix", "FilterMatrix", "Filter Missing value" + axisTitle + " using " + filterMethod + ". " + axisTitle + " Bef/Aft: " + retVal[0] + "/" + retVal[1] + ". File Size Bef/Aft: " + inSize + "/" + outSize);
		} catch (Exception e) {
			rdr.close();
			out.close();
			throw e;
		} finally {
			rdr.close();
			out.close();
			new File(tmpWorking).delete();
		}
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
		for (int i = 1; i < toks.length; i++) {
			if (Util.isNumeric(toks[i])){
				tot += Double.parseDouble(toks[i]);
				count++;
			}
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
