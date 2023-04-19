package mda.ngchm.guibuilder;

import java.io.IOException;

import javax.script.ScriptEngine;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import mda.ngchm.guibuilder.BuilderVersion;

/**
 * Servlet implementation class for index page
 */
@WebServlet("/index.html")
public class IndexPage extends HttpServlet {

	protected void doGet(HttpServletRequest request, HttpServletResponse response)
	    throws ServletException, IOException {
		response.setStatus (HttpServletResponse.SC_FOUND); // 302
		response.setHeader ("Location", "Select_Matrix.html?v=" + BuilderVersion.builderVersion);
	}
}


