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
@WebServlet("/TransformMatrix")
public class TransformMatrix extends HttpServlet {
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
	        	propJSON = mgr.load();
	        	mgr.save();
				Util.backupWorking(matrixFile);
			    String transform = request.getParameter("Transform");
			    if (transform.equals("Log"))
			    	logTransform(matrixFile, request);
			    else if (transform.equals("MeanCenter"))
			    	meanCenterTransform(matrixFile, request);
			    else if (transform.equals("Z-Norm"))
			    	zNormTransform(matrixFile, request);
			    else if (transform.equals("Arithmetic"))
			    	arithmeticTransform(matrixFile, request);
			    else if (transform.equals("Threshold"))
			    	thresholdTransform(matrixFile, request);
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
        	String errJSON = "{\"error\": \"The selected transformation could not be applied to your matrix. "+ errmsg +"\"}";
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
	
	private void logTransform(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String logBase = request.getParameter("tlfiltermethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
    	Util.logStatus("TransformMatrix - Begin Log Transform for (" + logBase + ") "); 
    	try {
	
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
	
	private void meanCenterTransform(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("tmrowcol");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
    	Util.logStatus("TransformMatrix - Begin Mean Center Transform for (" + axis + ") axis. ");
    	try {
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
	
	private void zNormTransform(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("tzrowcol");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
    	Util.logStatus("TransformMatrix - Begin Z-Normalize Transform for (" + axis + ") axis. ");
    	try {
	
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
	
	private void arithmeticTransform(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String operation = request.getParameter("tatransformmethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
    	Util.logStatus("TransformMatrix - Begin Arithmetic Transform for (" + operation + ") axis. ");
    	try {
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
	
	// Servlet method for threshold transforms.  The threshold is either a maximum or minimum value and 
	// matrix values that are above or below the respective threshold are set to NA or the threshold value.
	private void thresholdTransform(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String operation = request.getParameter("thresholdmethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
    	Util.logStatus("TransformMatrix - Begin Threshold Transform for (" + operation + ") axis. ");
    	try {
			boolean lowThreshold = false;
			boolean setNA = false;
		    float threshold = 0F;
			if (operation.equals("min")) {
				threshold = Float.parseFloat(request.getParameter("min_value"));
				lowThreshold = true;
			} else if (operation.equals("max")) {
				threshold = Float.parseFloat(request.getParameter("max_value"));
			} else if (operation.equals("lowcut")) {
				threshold = Float.parseFloat(request.getParameter("low_value"));
				lowThreshold = true;
				setNA = true;
			} else if (operation.equals("highcut")) {
				threshold = Float.parseFloat(request.getParameter("high_value"));
				setNA = true;
			}
			String line = rdr.readLine(); //Just write the header
			out.write(line + "\n");
			line = rdr.readLine();
	
			while (line != null ){
				String toks[] = line.split("\t",-1);
				out.write(toks[0]);
				for (int i = 1; i < toks.length; i++) {
					if (!Util.isNumeric(toks[i])) {
						//Not a number - just write it out
						out.write("\t" + toks[i]);
					} else {
						//For numbers - check either the high or low threshold based on user selection
						float val = Float.parseFloat(toks[i]);
						if ((lowThreshold && val < threshold) || (!lowThreshold && val > threshold))
							//Value is above or below threshold set it to NA or the threshold based on user selection
							if (setNA)
								out.write("\tNA");
							else
								out.write("\t" + threshold);
						else
							out.write("\t" + val);
					} 
				}
				out.write("\n");
				line = rdr.readLine();
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
	public static double[][] getFileAsMatrix(String matrixFile) throws Exception{ 
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
	
}


