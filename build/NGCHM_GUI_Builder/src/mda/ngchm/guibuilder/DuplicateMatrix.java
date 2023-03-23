package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;


/**
 * Servlet implementation class CorrectMatrix
 */
@WebServlet("/DuplicateMatrix")
public class DuplicateMatrix extends HttpServlet {
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
			    String filter = request.getParameter("Duplicate");
			    if (filter.equals("Remove")){
			    	removeDuplicates(matrixFile, request);
			    } else if (filter.equals("Rename")){
			    	renameDuplicates(matrixFile, request);
			    } else if (filter.equals("Combine")){
			    	combineDuplicates(matrixFile, request);
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
        	String errJSON = "{\"error\": \"The selected duplicates process could not be applied to your matrix. "+ errmsg +"\"}";
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
	
	/*******************************************************************
	 * METHOD: removeDuplicates
	 *
	 * This method suports the Remove function for duplicate data rows/
	 * cols in the NG_CHM Builder.  Based upon the axis (row/col)
	 * and method (first, last, all), duplicate rows/cols will be removed
	 * from the data matrix.
	 ******************************************************************/
	private void removeDuplicates(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("drrowcol");
		String filterMethod = request.getParameter("rduplicatemethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
	    ActivityLog.logActivity(request, "Transform Matrix", "DuplicateMatrix", "Remove Duplicates for axis: " + axis);

	    try {
			if (axis.equals("row")) { // row filters
				//Retrieve a list containing all duplicate row labels and their position in the data matrix.
				ArrayList<String> dupeRowLabelValues = getDuplicateRowsList(tmpWorking);
				//Retrieve a list containing all row numbers to be deleted from the matrix.
				ArrayList<String> delRows = deleteList(dupeRowLabelValues, filterMethod);
				String line = rdr.readLine(); //Just write the header
				int lineNbr = 0;
				//Write out the new working matrix, removing any designated rows
				while (line != null ){
					if (!delRows.contains(String.valueOf(lineNbr))) {
						out.write(line + "\n");
					}
					lineNbr++;
					line = rdr.readLine();
				}  
		    } else if (axis.equals("col")) {
				//Retrieve a list containing all duplicate column labels and their position in the data matrix.
				ArrayList<String> dupeColLabelValues = getDuplicateColsList(tmpWorking);
				//Retrieve a list containing all column numbers to be deleted from the matrix.
				ArrayList<String> delCols = deleteList(dupeColLabelValues, filterMethod);
				//Write out the new working matrix, removing any designated columns
		    	String line = rdr.readLine(); 
				while (line != null ){
					String lineToks[] = line.split("\t",-1);
					StringBuffer outLine = new StringBuffer();
					outLine.append(lineToks[0]);
					for (int i = 1; i < lineToks.length; i++) {
						if (!delCols.contains(String.valueOf(i))) {
							outLine.append("\t" + lineToks[i]);
						}
					}
					out.write(outLine.toString() + "\n");
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
	
	/*******************************************************************
	 * METHOD: renameDuplicates
	 *
	 * This method suports the Replace function for duplicate data rows/
	 * cols in the NG_CHM Builder.  Based upon the axis (row/col)
	 * and method (underscore or hyphen), duplicate row/column labels
	 * will be renamed with an underscore/hyphen and a subscript number.
	 ******************************************************************/
 	private void renameDuplicates(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("dnrowcol");
		String method = request.getParameter("nduplicatemethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		
	    ActivityLog.logActivity(request, "Transform Matrix", "DuplicateMatrix", "Rename Duplicates for axis: " + axis);
		try {
			if (axis.equals("row")) {
				//Retrieve a list containing all duplicate row labels and their position in the data matrix.
				ArrayList<String> dupeRowLabelValues = getDuplicateRowsList(tmpWorking);
				//Retrieve a list containing all duplicate row labels, their position in the data matrix, 
				//and the suffix to be used in renaming them.
				ArrayList<String> renameList = getRenameCombineList(dupeRowLabelValues, method);
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				int rowNbr = 1;
				while (line != null ) {
					String toks[] = line.split("\t",-1);
					boolean found = false;
					for (int j=0;j<renameList.size();j++) {
						String renItem[] = renameList.get(j).split(":",-1);
						if (toks[0].contentEquals(renItem[0])) {
							found = true;
							break;
						}
					}
					if (found) {
						for (int i=0;i < renameList.size();i++) {
							String item = renameList.get(i);
							String renToks[] = item.split(":",-1);
							if (rowNbr == Integer.parseInt(renToks[1])) {
								toks[0] = renToks[0]+renToks[2];
								break;
							}
						}
						StringBuffer outLine = new StringBuffer();
						outLine.append(toks[0]);
						for (int i = 1; i < toks.length; i++) {
							outLine.append("\t" + toks[i]);
						}
						out.write(outLine.toString() + "\n");
					} else {
						out.write(line + "\n");
					}
					line = rdr.readLine();
					rowNbr++;
				}
			} else if (axis.equals("col")) {
				//Retrieve a list containing all duplicate column labels and their position in the data matrix.
				ArrayList<String> dupeColLabelValues = getDuplicateColsList(tmpWorking);
				//Retrieve a list containing all duplicate column labels, their position in the data matrix, 
				//and the suffix to be used in renaming them.
				ArrayList<String> renameList = getRenameCombineList(dupeColLabelValues, method);
				String line = rdr.readLine();
				String toks[] = line.split("\t",-1);
				for (int i=0;i<toks.length;i++) {
					for (int j=0;j<renameList.size();j++) {
						String renItem[] = renameList.get(j).split(":",-1);
						if (i == Integer.parseInt(renItem[1])) {
							toks[i] =  renItem[0]+renItem[2];
						}
					}
				}
				StringBuffer outLine = new StringBuffer();
				outLine.append(toks[0]);
				for (int i = 1; i < toks.length; i++) {
						outLine.append("\t" + toks[i]);
				}
				out.write(outLine.toString() + "\n");
				line = rdr.readLine();
				while (line != null ) {
					out.write(line + "\n");
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
 	
	/*******************************************************************
	 * METHOD: combineDuplicates
	 *
	 * This method supports the combination of duplicate row/col data. It
	 * functions as both a filter and a transform.  The first row is 
	 * kept and populated with values that are either the mean value for
	 * all instances of that row/col OR the median value.
	 ******************************************************************/
 	private void combineDuplicates(String matrixFile, HttpServletRequest request) throws Exception {
		String tmpWorking = Util.copyWorkingToTemp(matrixFile);
		String axis = request.getParameter("dcrowcol");
		String method = request.getParameter("cduplicatemethod");
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
	    BufferedWriter out = new BufferedWriter(new FileWriter(matrixFile));
		double[][] matrix = TransformMatrix.getFileAsMatrix(tmpWorking);
		
		ActivityLog.logActivity(request, "Transform Matrix", "DuplicateMatrix", "Combine Duplicates for axis: " + axis);
		try {
			if (axis.equals("row")) {
				//Retrieve a list containing all duplicate row labels and their position in the data matrix.
				ArrayList<String> dupeRowLabelValues = getDuplicateRowsList(tmpWorking);
				//Retrieve a list containing all duplicate row labels and their position in the data matrix.
				ArrayList<String> combineList = getRenameCombineList(dupeRowLabelValues, null);
				String prevLabel = "";
				ArrayList<Integer> intRay = new ArrayList<Integer>();
				ArrayList<double[]> changeArray = new ArrayList<double[]>();
				//Retrieve a list containing all duplicate columns combined into a single array with their values 
				//either summarized by the mean or the median.
				for (int i=0;i<combineList.size();i++) {
					String currItem = combineList.get(i);
					String toks[] = currItem.split(":",-1);
					if (((!toks[0].contentEquals(prevLabel)) && (i != 0)) || (i == combineList.size()-1)) {
						//add if last item in list
						if (i == combineList.size()-1) {
							intRay.add(Integer.valueOf(toks[1])-1);
						}
						double[] colMeanMed = null;
						if (method.contentEquals("mean")) {
							colMeanMed = getColMeansFromMatrix(matrix, intRay);
						} else {
							colMeanMed = getColMediansFromMatrix(matrix, intRay);
						}
						changeArray.add(colMeanMed);
						intRay = new ArrayList<Integer>();
						intRay.add(Integer.valueOf(toks[1])-1);
					} else {
						intRay.add(Integer.valueOf(toks[1])-1);
					}
					prevLabel = toks[0];
				}
				//Write out new working matrix with first duplicate row replaced with mean/median values and 
				//all other rows removed.
				String line = rdr.readLine(); //Just write the header
				out.write(line + "\n");
				line = rdr.readLine();
				Integer rowNbr = 1;
				ArrayList<String> remItems = new ArrayList<String>();
				while (line != null ) {
					boolean found = false;
					String toks[] = line.split("\t",-1);
					for (int j=0;j<changeArray.size();j++) {
						double[] changeItem = changeArray.get(j);
						if (rowNbr.doubleValue() == changeItem[0]) {
							remItems.add(toks[0]);
							found = true;
							StringBuffer outLine = new StringBuffer();
							outLine.append(toks[0]);
							for (int k = 1; k < changeItem.length; k++) {
								outLine.append("\t" + String.valueOf(changeItem[k]));
							}
							out.write(outLine.toString() + "\n");
						}
					}
					if (found == false) {
						if (!remItems.contains(toks[0])) {
							out.write(line + "\n");
						}
					}
					line = rdr.readLine();
					rowNbr++;
				}
			} else if (axis.equals("col")) {
				//Retrieve a list containing all duplicate column labels and their position in the data matrix.
				ArrayList<String> dupeColLabelValues = getDuplicateColsList(tmpWorking);
				//Retrieve a list containing all duplicate column labels and their position in the data matrix.
				ArrayList<String> combineList = getRenameCombineList(dupeColLabelValues, null);
				//Retrieve a list containing all duplicate columns to be deleted.
				ArrayList<String> delCols = deleteList(dupeColLabelValues, "first");
				String prevLabel = "";
				ArrayList<Integer> intRay = new ArrayList<Integer>();
				ArrayList<double[]> changeArray = new ArrayList<double[]>();
				//Retrieve a list containing all duplicate columns combined into a single array with their values 
				//either summarized by the mean or the median.
				for (int i=0;i<combineList.size();i++) {
					String currItem = combineList.get(i);
					String toks[] = currItem.split(":",-1);
					if (((!toks[0].contentEquals(prevLabel)) && (i != 0)) || (i == combineList.size()-1)) {
						//add if last item in list
						if (i == combineList.size()-1) {
							intRay.add(Integer.valueOf(toks[1])-1);
						}
						double[] colMeanMed = null;
						if (method.contentEquals("mean")) {
							colMeanMed = getRowMeansFromMatrix(matrix, intRay);
						} else {
							colMeanMed = getRowMediansFromMatrix(matrix, intRay);
						}
						changeArray.add(colMeanMed);
						intRay = new ArrayList<Integer>();
						intRay.add(Integer.valueOf(toks[1])-1);
					} else {
						intRay.add(Integer.valueOf(toks[1])-1);
					}
					prevLabel = toks[0];
				}
				//Write out new working matrix with first duplicate column replaced with mean/median values and 
				//all other columns removed.
				String line = rdr.readLine(); //Just write the header
				String hdrToks[] = line.split("\t",-1);
				StringBuffer outLine = new StringBuffer();
				outLine.append(hdrToks[0]);
				for (int i=1;i<hdrToks.length;i++) {
					if (!delCols.contains(Integer.toString(i))) {
						outLine.append("\t" + hdrToks[i]);
					}
				}
				out.write(outLine.toString() + "\n");
				line = rdr.readLine();
				int rowNbr = 1;
				while (line != null ) {
					String toks[] = line.split("\t",-1);
					boolean found = false;
					outLine = new StringBuffer();
					outLine.append(toks[0]);
					for (int i=1;i<toks.length;i++) {
						for (int j=0;j<changeArray.size();j++) {
							Integer intObj = Integer.valueOf(i);
							double[] changeItem = changeArray.get(j);
							if (intObj.doubleValue() == changeItem[0]) {
								outLine.append("\t" + String.valueOf(changeItem[rowNbr]));
								found = true;
								break;
							}
						}
						if ((!found) && (!delCols.contains(Integer.toString(i)))) {
							outLine.append("\t" + toks[i]);
						}
						found = false;
					}
					out.write(outLine.toString() + "\n");
					line = rdr.readLine();
					rowNbr++;
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
	
	//=============================
	// SUPPORTING LIST METHODS
	//=============================
	
	/*******************************************************************
	 * METHOD: getDuplicateRowsList
	 *
	 * This method produces and returns a String ArrayList list containing all the
	 * duplicate row labels in the matrix. It contains the column label
	 * and position. The values are colon-separated.
	 ******************************************************************/
	private static ArrayList<String> getDuplicateRowsList(String tmpWorking) throws Exception{ // TODO: may need to profile this for larger matrix sizes
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
		ArrayList<String> dupeRowLabelValues = new ArrayList<String>();
		try {
			//Create a list to contain all "read" labels
			ArrayList<String> readLabels = new ArrayList<String>();
			String line = rdr.readLine(); //Just write the header
			int lineNbr = 0;
			//Read thru the matrix row-by-row, comparing the current label to the 
			//list of read labels, capturing duplicates
			while (line != null ){
				String toks[] = line.split("\t",-1);
				String val = toks[0];
				if (readLabels.contains(val)) {
					String orig = val+":"+readLabels.indexOf(val);
					if (!dupeRowLabelValues.contains(orig)) {
						dupeRowLabelValues.add(orig);
					}
					dupeRowLabelValues.add(val+":"+lineNbr);
				}
				lineNbr++;
				readLabels.add(val);
				line = rdr.readLine();
			}
			rdr.close();
		} finally {
			rdr.close();
		}
		return dupeRowLabelValues;
	}
	
	/*******************************************************************
	 * METHOD: getDuplicateColsList
	 *
	 * This method produces and returns a String ArrayList list containing all the
	 * duplicate column labels in the matrix. It contains the column label
	 * and position. The values are colon-separated.
	 ******************************************************************/
	private static ArrayList<String> getDuplicateColsList(String tmpWorking) throws Exception { // TODO: may need to profile this for larger matrix sizes
		BufferedReader rdr = new BufferedReader(new FileReader(tmpWorking));
		ArrayList<String> dupeColLabelValues = new ArrayList<String>();
		try {
			String line = rdr.readLine(); //Just write the header
			String toks[] = line.split("\t",-1);
			//Create a list to contain all "read" labels
			ArrayList<String> readLabels = new ArrayList<String>();
			//Read thru the matrix label row, comparing the current column label to the 
			//list of read labels, capturing duplicates
			for (int i = 0; i < toks.length; i++) {
				String val = toks[i];
				if (readLabels.contains(val)) {
					String orig = val+":"+readLabels.indexOf(val);
					if (!dupeColLabelValues.contains(orig)) {
						dupeColLabelValues.add(orig);
					}
					dupeColLabelValues.add(val+":"+i);
				}
				readLabels.add(val);
			} 
			rdr.close();
		} finally {
			rdr.close();
		}
		return dupeColLabelValues;
	}
	
	/*******************************************************************
	 * METHOD: deleteList
	 *
	 * This method produces and returns a String ArrayList list containing 
	 * all the rows/cols to be deleted from the matrix. It will exclude
	 * the first, last, or none  of the duplicate row/col numbers based
	 * upon the input filter method
	 ******************************************************************/
	private static ArrayList<String> deleteList(ArrayList<String> dupeLabelValues, String filterMethod) throws Exception { 
		ArrayList<String> delItems = new ArrayList<String>(); 
		for (int j=0;j<dupeLabelValues.size();j++) {
			String item[] = dupeLabelValues.get(j).split(":",-1);
			//Create a list containing all duplicate row/col locations
			ArrayList<String> itemLocations = new ArrayList<String>();
			for (int k=0;k<dupeLabelValues.size();k++) {
				String item2[] = dupeLabelValues.get(k).split(":",-1);
				if (item[0].contentEquals(item2[0])) {
					if (!itemLocations.contains(item2[1])) {
						itemLocations.add(item2[1]);
					}
				}
			}
			//If not deleting all instances, loop through the item locations list 
			//retaining the first or last element in the list
			for (int l=0;l<itemLocations.size();l++) {
				String itemLoc = itemLocations.get(l);
				if (filterMethod.contentEquals("all")) {
						delItems.add(itemLoc);
				} else if ((filterMethod.contentEquals("first")) && (l != 0)) {
						delItems.add(itemLoc);
				} else if ((filterMethod.contentEquals("last")) && (l != itemLocations.size()-1)) {
						delItems.add(itemLoc);
				}
			}
		}
		ArrayList<String> distinctList = deleteDuplicates(delItems);
		return distinctList;
	}

	/*******************************************************************
	 * METHOD: getRenameCombineList
	 *
	 * This method produces a String ArrayList list containing all duplicate 
	 * row/column labels and their position in the data matrix. If it is
	 * called with a renaming method specified, the and the suffix to be
	 * used in renaming items is also included. The values are colon-separated.
	 ******************************************************************/
    private static ArrayList<String> getRenameCombineList(ArrayList<String> dupeLabelValues,String method) throws Exception { 
		ArrayList<String> renameList = new ArrayList<String>();
		for (int j=0;j<dupeLabelValues.size();j++) {
			String item[] = dupeLabelValues.get(j).split(":",-1);
			String currItem = item[0];
				int renameNbr = 1;
				for (int k=0;k<dupeLabelValues.size();k++) {
					String item2[] = dupeLabelValues.get(k).split(":",-1);
					if (currItem.contentEquals(item2[0])) {
						if (method != null) {
							renameList.add(item[0]+":"+item2[1]+":"+method+renameNbr);
						} else {
							renameList.add(item[0]+":"+item2[1]);
						}
						renameNbr++;
					}
				}
		}
		ArrayList<String> distinctList = deleteDuplicates(renameList);
		return distinctList;
	}

	//================================
	// SUPPORTING CALCULATION METHODS
	//================================
 	
	/*******************************************************************
	 * METHOD: getColMeansFromMatrix
	 *
	 * This method traverses an array of the matrix returning a double
	 * array containing the combined mean values for a given set of 
	 * column duplicates. This array will start with the column location 
	 * where the values will be substituted into the matrix and the mean 
	 * values to substitute.
	 ******************************************************************/
 	private static double[] getColMeansFromMatrix(double[][] matrix, ArrayList<Integer> intRay) throws Exception{
		int numCols = matrix[0].length;
		int numRows = matrix.length;
		double[] means = new double[numCols+1];
		int[] counts = new int[numCols+1];
		for (int i = 1; i < numCols; i++) {
			means[i] = Double.NaN;
			counts[i] = 0;
			for (int j = 0; j < numRows; j++) {
				if (intRay.contains(j)) {
					Double val = matrix[j][i-1];
					if (!val.isNaN()) {
						if (Double.isNaN(means[i])) {
							means[i] = val;
						} else {
							means[i] += matrix[j][i-1];
						}
						counts[i]++;
					}
				}
			}
			if (!Double.isNaN(means[i])) {
				means[i] = means[i]/counts[i];
			}
		}
		means[0] = intRay.get(0).doubleValue() + 1;
		return means;
	}
	
	/*******************************************************************
	 * METHOD: getRowMeansFromMatrix
	 *
	 * This method traverses an array of the matrix returning a double
	 * array containing the combined mean values for a given set of 
	 * row duplicates. This array will start with the row location 
	 * where the values will be substituted into the matrix and the mean 
	 * values to substitute.
	 ******************************************************************/
  	private static double[] getRowMeansFromMatrix(double[][] matrix, ArrayList<Integer> intRay) throws Exception{
		int numRows = matrix.length;
		double[] means = new double[numRows+1];
		for (int i = 0; i < numRows; i++) {
			double sum = Double.NaN;
			double tot = 0;
			for (int j = 1; j < matrix[i].length; j++) {
				if (intRay.contains(j)) {
					Double val = matrix[i][j];
					if (!val.isNaN()) {
						if (Double.isNaN(sum)) {
							sum = matrix[i][j];
						} else {
							sum += matrix[i][j];
						}
						tot++;
					}
				}
			}
			if (Double.isNaN(sum)) {
				means[i+1] = sum;
			} else {
				means[i+1] = sum/tot;
			}
		}
		means[0] = intRay.get(0).doubleValue() + 1;
		return means;
	}
	
	/*******************************************************************
	 * METHOD: getRowMediansFromMatrix
	 *
	 * This method traverses an array of the matrix returning a double
	 * array containing the median values for a given set of 
	 * row duplicates. This array will start with the row location 
	 * where the values will be substituted into the matrix and the median 
	 * values to substitute.
	 ******************************************************************/
	private static double[] getRowMediansFromMatrix(double[][] matrix, ArrayList<Integer> intRay) throws Exception{
		int numRows = matrix.length;
		double[] means = new double[numRows+1];
		for (int i = 0; i < numRows; i++) {
			ArrayList<Double> medValues = new ArrayList<Double>();
			for (int j = 1; j < matrix[i].length; j++) {
				if (intRay.contains(j)) {
					Double val = matrix[i][j];
					if (!val.isNaN()) {
						medValues.add(val);
					}
				}
			}
			means[i+1] = getMedianValue(medValues);
		}
		means[0] = intRay.get(0).doubleValue() + 1;
		return means;
	}
	
	/*******************************************************************
	 * METHOD: getColMediansFromMatrix
	 *
	 * This method traverses an array of the matrix returning a double
	 * array containing the median values for a given set of 
	 * column duplicates. This array will start with the column location 
	 * where the values will be substituted into the matrix and the median 
	 * values to substitute.
	 ******************************************************************/
	private static double[] getColMediansFromMatrix(double[][] matrix, ArrayList<Integer> intRay) throws Exception{
		int numCols = matrix[0].length;
		int numRows = matrix.length;
		double[] means = new double[numCols+1];
		for (int i = 1; i < numCols; i++) {
			ArrayList<Double> medValues = new ArrayList<Double>();
			for (int j = 0; j < numRows; j++) {
				if (intRay.contains(j)) {
					Double val = matrix[j][i-1];
					if (!val.isNaN()) {
						medValues.add(val);
					}
				}
			}
			means[i] = getMedianValue(medValues);
		}
		means[0] = intRay.get(0).doubleValue() + 1;
		return means;
	}

	//================================
	// ADDITIONNAL SUPPORTING METHODS
	//================================
 	
	/*******************************************************************
	 * METHOD: getMedianValue
	 *
	 * This method retrieves the median value from an array of values. 
	 * NaN is returned if the array is empty.
	 ******************************************************************/
	private static double getMedianValue(ArrayList<Double> medValues) throws Exception {
		double meanVal = Double.NaN;
		Collections.sort(medValues);
		if (medValues.size() > 0) {
			if (medValues.size()  % 2 == 0 ) {
				meanVal = (medValues.get(medValues.size()/2) + medValues.get((medValues.size()/2)-1))/2;
			} else {
				meanVal = medValues.get(medValues.size()/2);
			}
		}
		return meanVal;
	}
	
	/*******************************************************************
	 * METHOD: deleteDuplicates
	 *
	 * Method to remove duplicates from an ArrayList
	 ******************************************************************/
    private static ArrayList<String> deleteDuplicates(ArrayList<String> list) { 
        // Create a new ArrayList 
        ArrayList<String> newList = new ArrayList<String>(); 
        // Traverse through the first list 
        for (String element : list) { 
            // If this element is not present in newList then add it 
            if (!newList.contains(element)) { 
  
                newList.add(element); 
            } 
        } 
        // return the new list 
        return newList; 
    } 
	
	/*******************************************************************
	 * METHOD: arrayContains
	 *
	 * Method to return a boolean answering whether an given array
	 * contains a given value.
	 ******************************************************************/
	public static boolean arrayContains(int[] arr, int key) {
	    return Arrays.stream(arr).anyMatch(i -> i == key);
	}
	
}
