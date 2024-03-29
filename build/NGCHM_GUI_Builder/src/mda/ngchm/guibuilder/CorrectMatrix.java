package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

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
    	String workingDir = getServletContext().getRealPath("MapBuildDir").replace("\\", "/");
        workingDir = workingDir + "/" + mySession.getId();
	    String matrixFile = workingDir  + "/workingMatrix.txt";

	    try {
	        HeatmapPropertiesManager mgr = new HeatmapPropertiesManager(workingDir);
		    String propJSON = "{}";
	        File propFile = new File(workingDir + "/heatmapProperties.json");
	        if (propFile.exists()) {
				Util.backupWorking(matrixFile);
			    String correction = request.getParameter("Correction");
			    if (correction.equals("ReplaceInvalid"))
			    	replaceNonNumeric(matrixFile, request);
			    else if (correction.equals("FillMissing"))
			    	fillMissing(matrixFile, request);
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
        	String errJSON = "{\"error\": \"The selected correction could not be applied to your matrix. "+ errmsg +"\"}";
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

	private void replaceNonNumeric(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String replaceMethod = request.getParameter("nreplace");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
	    
	    try {
	    	ActivityLog.logActivity(request, "Transform Matrix", "CorrectMatrix", "Replace non-numeric values with: " + replaceMethod);
	
			if (replaceMethod.equals("N/A") || replaceMethod.equals("zero")) {
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				String replacement = replaceMethod.equals("zero") ? "0" : "N/A";
				
				while (line != null ){
					String toks[] = line.split("\t",-1);
					out.write(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (Util.isNumeric(toks[i])) {
							out.write("\t" + toks[i]);
						} else if (Util.isMissing(toks[i])) {
							out.write("\t" + toks[i]);
						} else {
							out.write("\t" + replacement);
						}
					}
					out.write("\n");
					line = rdr.readLine();
				}	
			} else if (replaceMethod.equals("rowmean")) {
	
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				
				while (line != null ){
					String toks[] = line.split("\t",-1);
					out.write(toks[0]);
					float mean = getRowMean(toks);
					
					for (int i = 1; i < toks.length; i++) {
						if (Util.isNumeric(toks[i])) {
							out.write("\t" + toks[i]);
						} else if (Util.isMissing(toks[i])) {
							out.write("\t" + toks[i]);
						} else {
							out.write("\t" + mean);
						}
					}
					out.write("\n");
					line = rdr.readLine();
				}	
			} else if (replaceMethod.equals("colmean")) {
	
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				float[] means = getColMeans(tmpWorking);
				
				while (line != null ){
					String toks[] = line.split("\t",-1);
					out.write(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (Util.isNumeric(toks[i])) {
							out.write("\t" + toks[i]);
						} else if (Util.isMissing(toks[i])) {
							out.write("\t" + toks[i]);
						} else {
							out.write("\t" + means[i]);
						}
					}
					out.write("\n");
					line = rdr.readLine();
				}	
			}
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
	
	private void fillMissing(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String replaceMethod = request.getParameter("mreplace");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
	    ActivityLog.logActivity(request, "Transform Matrix", "CorrectMatrix", "Fill Missing Values with: " + replaceMethod);
		try {

			if (replaceMethod.equals("zero") || replaceMethod.equals("N/A")) {
				String replacement = replaceMethod.equals("zero") ? "0" : "N/A";
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				
				while (line != null ){
					String toks[] = line.split("\t",-1);
					out.write(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (Util.isMissing(toks[i])) {
							out.write("\t" + replacement);
						} else {
							out.write("\t" + toks[i]);
						}
					}
					out.write("\n");
					line = rdr.readLine();
				}	
			} else if (replaceMethod.equals("rowmean")) {
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				
				while (line != null ){
					String toks[] = line.split("\t",-1);
					out.write(toks[0]);
					float mean = getRowMean(toks);
					
					for (int i = 1; i < toks.length; i++) {
						if (Util.isMissing(toks[i])) {
							out.write("\t" + mean);
						} else {
							out.write("\t" + toks[i]);
						}
					}
					out.write("\n");
					line = rdr.readLine();
				}	
			} else if (replaceMethod.equals("colmean")) {
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				float[] means = getColMeans(tmpWorking);
				
				while (line != null ){
					String toks[] = line.split("\t",-1);
					out.write(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (Util.isMissing(toks[i])) {
							out.write("\t" + means[i]);
						} else {
							out.write("\t" + toks[i]);
						}
					}
					out.write("\n");
					line = rdr.readLine();
				}
			} else if (replaceMethod.equals("rowmin")) {
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				
				while (line != null ){
					String toks[] = line.split("\t",-1);
					out.write(toks[0]);
					float min = getRowMin(toks);
					
					for (int i = 1; i < toks.length; i++) {
						if (Util.isMissing(toks[i])) {
							out.write("\t" + min);
						} else {
							out.write("\t" + toks[i]);
						}
					}
					out.write("\n");
					line = rdr.readLine();
				}	
			} else if (replaceMethod.equals("colmin")) {
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				float[] mins = getColMins(tmpWorking);
				
				while (line != null ){
					String toks[] = line.split("\t",-1);
					out.write(toks[0]);
					for (int i = 1; i < toks.length; i++) {
						if (Util.isMissing(toks[i])) {
							out.write("\t" + mins[i]);
						} else {
							out.write("\t" + toks[i]);
						}
					}
					out.write("\n");
					line = rdr.readLine();
				}	
			} 
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
	
	private static float getRowMean(String[] toks) throws Exception{
		float tot = 0;
		int count = 0;  // exclude the empty cells from the average
		for (int i = 1; i < toks.length; i++) {
			if (Util.isNumeric(toks[i])){
				tot += Float.parseFloat(toks[i]);
				count++;
			}
		}
		float mean = tot/count;
		return mean;
	}
	
	private static float[] getColMeans(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader mrdr = new BufferedReader(new FileReader(tmpWorking));
		String mline = mrdr.readLine(); // skip headers
		mline = mrdr.readLine();
		int lineLength = mline.split("\t",-1).length;
		
		float[] means = new float[lineLength];
		int[] counts = new int[lineLength];
		while (mline != null ){
			String toks[] = mline.split("\t",-1);
			for (int i = 1; i < toks.length; i++) {
				if (Util.isNumeric(toks[i])) {
					means[i] += Float.parseFloat(toks[i]);
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
	
}


