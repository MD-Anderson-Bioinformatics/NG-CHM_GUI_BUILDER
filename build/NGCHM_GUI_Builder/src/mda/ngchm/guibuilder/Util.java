package mda.ngchm.guibuilder;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;

import org.apache.poi.ss.usermodel.*;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class Util {
	
	public static boolean logSysMessages = true;
	
	/*******************************************************************
	 * METHOD: toSignificantFiguresString
	 *
	 * Helper function that takes a double and returns a string version but
	 * formated to have just 3 significant digits if the number is small.
	 ******************************************************************/
	public static String toSignificantFiguresString(double value, int significantFigures ){
		NumberFormat nf = new DecimalFormat("#,##0");
		String valueStr = "";
		if (value < 100) {
			BigDecimal bd = new BigDecimal(value);
			valueStr = String.format("%."+significantFigures+"G", bd);
			
			//Trim trailing 0s - probably a better way to do this
			while (valueStr.contains(".") && valueStr.endsWith("0")) {
				valueStr = valueStr.substring(0, valueStr.length() - 1);
			}
			if (valueStr.endsWith(".")) {
				valueStr = valueStr.substring(0, valueStr.length() - 1);
			}
		} else {
			// For large numbers just return them with no decimal places.
			valueStr = nf.format(value);
		}
	    return valueStr;
	}


	/*******************************************************************
	 * METHOD: getTopOfMatrix
	 *
	 * This method opens the uploaded matrix and return the top left 
	 * corner of it as a json string.
	 ******************************************************************/
	public static String getTopOfMatrix(String matrixFile, int numRows, int numCols) throws Exception {
		Gson gson = new GsonBuilder().create();
		String [][] topMatrix = new String[numRows][numCols];
		
		BufferedReader rdr = new BufferedReader(new FileReader(matrixFile));
		int rowNum = 0;
		String line = rdr.readLine();
		while (line != null && rowNum < numRows){
			String toks[] = line.split("\t");
			int colNum = 0;
			while (colNum < toks.length && colNum < numCols) {
				boolean parseMe = isNumeric(toks[colNum]) && !isInteger(toks[colNum]);
				//Format value to three decimal places if it is numeric 
				topMatrix[rowNum][colNum] = parseMe ? toSignificantFiguresString(Double.parseDouble(toks[colNum]), 3) : toks[colNum];
				colNum++;
			}
			line = rdr.readLine();
			rowNum++;
		}
		rdr.close();
		
		String jsonMatrixTop = gson.toJson(topMatrix); 
		return jsonMatrixTop;
	}
	
	/*******************************************************************
	 * METHOD: restoreWorking
	 *
	 * This method creates a backup copy of a working matrix file.
	 ******************************************************************/
	public static void backupWorking(String workingMatrix) throws Exception {
		String saveWorking = workingMatrix + ".sav";
		if (new File(saveWorking).exists())
			return;
		Files.copy(Paths.get(workingMatrix), Paths.get(saveWorking));
	}

	/*******************************************************************
	 * METHOD: restoreWorking
	 *
	 * This method restores a working matrix file.
	 ******************************************************************/
	public static void restoreWorking(String workingMatrix) throws Exception {
		String saveWorking = workingMatrix + ".sav";
		File workingFile = new File(workingMatrix);
		if (workingFile.exists()) {
			try {
				workingFile.delete();
			} catch (Exception e) {
				//do nothing
			}
		}
		Files.copy(Paths.get(saveWorking), Paths.get(workingMatrix));
	}
	
	/*******************************************************************
	 * METHOD: restoreWorkingFromTemp
	 *
	 * This method restores a working matrix file.
	 ******************************************************************/
	public static void restoreWorkingFromTemp(String workingMatrix) throws Exception {
		String tempWorking = workingMatrix + ".tmp";
		new File(workingMatrix).delete();
		Files.copy(Paths.get(tempWorking), Paths.get(workingMatrix));
	}
	
	/*******************************************************************
	 * METHOD: copyWorkingToTemp
	 *
	 * This method copies a working matrix file to a temporary file.
	 ******************************************************************/
	public static String copyWorkingToTemp(String workingMatrix) throws Exception {
		String tmpWorking = workingMatrix + ".tmp";
		if (new File(tmpWorking).exists())
			new File(tmpWorking).delete();
		new File(workingMatrix).renameTo(new File(tmpWorking));
		return tmpWorking;
	}

	/*******************************************************************
	 * METHOD: isNumeric
	 *
	 * This method inspects an input string to determine if that string
	 * contains a numeric entry.
	 ******************************************************************/
	public static boolean isNumeric(String str)	{
	  try  {  
	    @SuppressWarnings("unused")
		double d = Double.parseDouble(str);
	    if (Double.isNaN(d) || d == Double.NEGATIVE_INFINITY || d == Double.POSITIVE_INFINITY)
	       	return false;
	  }   catch(Exception e)  { 
	    return false;  
	  }  
	  return true;  
	}
	
	public static boolean isInteger(String s) {
	    try {
	        Integer.parseInt(s);
	        return true;
	    } catch (NumberFormatException ex) {
	        return false;
	    }
	}
	
	/*******************************************************************
	 * METHOD: isMissing
	 *
	 * This method inspects an input string to determine if that string
	 * is a missing values entry.
	 ******************************************************************/
	public static boolean isMissing(String str) {
		String val = str.trim().toUpperCase();
		if (val.equals("") || val.equals("N/A") || val.equals("NA") || val.equals(" ") ||  val.equals("?") || val.equals("-"))
			return true;
		return false;
	}
	
	/*******************************************************************
	 * METHOD: uploadTSV
	 *
	 * This method uploads a tab separated matrix file to the session
	 * directory.
	 ******************************************************************/
	public static void uploadTSV(String outFile, InputStream filecontent) throws Exception { 
		OutputStream out = new FileOutputStream(new File(outFile));
	    try {
	        int read = 0;
	        final byte[] bytes = new byte[1024];
	        while ((read = filecontent.read(bytes)) != -1) {
	            out.write(bytes, 0, read);
	        }
		    out.close();
	    } finally {
	        if (out != null) {
	            out.close();
	        }
	    }
	}
	
	/*******************************************************************
	 * METHOD: uploadCSV
	 *
	 * This method uploads a comma separated matrix file to the session
	 * directory as a tab separated file.
	 ******************************************************************/
	public static void uploadCSV(String outFile, InputStream filecontent) throws IOException {
	    FileWriter fw = new FileWriter(new File(outFile));
	    Reader fr = new InputStreamReader(filecontent);
	    BufferedReader br = new BufferedReader(fr);
	    try {
		    while(br.ready()) {
		        fw.write(br.readLine().replaceAll(",", "\t"));
		        fw.write("\n");
		    }
	    } finally {
			if (fw != null) {fw.close();fw = null;}
			if (br != null) {br.close();br = null;}
			if (fr != null) {fr.close();fr = null;}
	    }
	}

	/*******************************************************************
	 * METHOD: uploadXLS
	 *
	 * This method uploads an Excel matrix workbook to the session directory.
	 * It iterates thru the pages of an Excel workbook calling a method
	 * that processes the first sheet as the matrix.
	 ******************************************************************/
	public static void uploadXLS(String outFile, InputStream filecontent) throws Exception {
		//Crate workbook from file contents
		Workbook workbook = WorkbookFactory.create(filecontent); 
        //Create output stream for workingMatrix.txt
		try {
	        // Iterate thru all the sheets in the workbook
	        Iterator<Sheet> sheetIterator = workbook.sheetIterator();
	        int sheetCtr = 0;
	        while (sheetIterator.hasNext()) {
	            Sheet sheet = sheetIterator.next();
	            if (sheetCtr == 0) {
	            	uploadDataSheet(outFile, sheet);
	            } else {
	            	//DO NOTHING NOW.  Later: Call covariate or flick upload here (e.g. uploadCovariateSheet)
	            }
	            sheetCtr++;
	        }
		} catch (Exception e) {
			System.out.println("\n\nERROR WRITING OUTPUT FILE\n");
			throw e;
		}

	}
	
	/*******************************************************************
	 * METHOD: uploadDataSheet
	 *
	 * This method uploads an Excel sheet's contents to the session 
	 * directory as a tab separated file.
	 ******************************************************************/
	private static void uploadDataSheet(String matrixFile, Sheet sheet) throws Exception {
        //Create output stream for workingMatrix.txt
		OutputStream out = new FileOutputStream(new File(matrixFile));
	    OutputStreamWriter osw = new OutputStreamWriter(out, "UTF8");
	    BufferedWriter bw = new BufferedWriter(osw);
		try {
	        // Create a DataFormatter to format and get each cell's value as String
	        DataFormatter dataFormatter = new DataFormatter();
	        // Iterate thru the data rows in the sheet
	        Iterator<Row> rowIterator = sheet.rowIterator();
	        while (rowIterator.hasNext()) {
	            Row row = rowIterator.next();
	            // Now let's iterate over the columns of the current row
	            Iterator<Cell> cellIterator = row.cellIterator();
	            while (cellIterator.hasNext()) {
	                Cell cell = cellIterator.next();
	                String cellValue = dataFormatter.formatCellValue(cell);
		            bw.write(cellValue);
		            if (!cellIterator.hasNext()) {
		            	bw.newLine();
		            } else {
		            	bw.write("\t");
		            }
	            }
	        }
		} catch (Exception e) {
			System.out.println("\n\nERROR WRITING OUTPUT FILE\n");
			throw e;
		} finally {
			if (bw != null) {bw.flush();bw.close();bw = null;}
			if (osw != null) {osw.close();osw = null;}
			if (out != null) {out.close();out = null;}
		}
	}
	
	/*******************************************************************
	 * METHOD: logStatus
	 *
	 * This sysouts status with date time if logging turned on.
	 ******************************************************************/
	public static void logStatus(String message) throws Exception {
		/* Returns the maximum amount of memory available to 
		   the Java Virtual Machine set by the '-mx' or '-Xmx' flags. */
		long availableMemory = Runtime.getRuntime().maxMemory();

		/* Returns the total memory allocated from the system 
		   (which can at most reach the maximum memory value 
		   returned by the previous function). */
		long allocatedMemory = Runtime.getRuntime().totalMemory();

		/* Returns the free memory *within* the total memory 
		   returned by the previous function. */
		long freeMemory = Runtime.getRuntime().freeMemory();
		String memoryInfo = "   *** JVM Memory Stats - Available: " + availableMemory + " Allocated: " + allocatedMemory + " Free: " + freeMemory;
		
		SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String eventDate = simpleDateFormat.format(new Date());
		
		if (logSysMessages) {
			System.out.println(eventDate + ": " + message + memoryInfo);
		}
		return;
	}
	

	
	
}
