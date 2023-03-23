# This is a multistage Docker build.
# Requires Docker 17.06 CE or later
#
# Stage -1: Get Tomcat
FROM tomcat:10.1.6-jdk17-temurin-jammy

RUN apt-get update && apt-get -y upgrade
RUN apt autoremove && apt clean

# Stage 0: Build ant image
FROM eclipse-temurin:17.0.6_10-jdk as ant

RUN apt-get update && apt-get install -y ant

# Stage 1: Create WebBuilder App
FROM ant AS webbuilder

ARG VIEWER_REPO
ARG VIEWER_TAG

# Install required Tomcat jars into ant image
COPY --from=tomcat /usr/local/tomcat/lib/servlet-api.jar /usr/local/tomcat/lib/
COPY --from=tomcat /usr/local/tomcat/lib/tomcat-coyote.jar /usr/local/tomcat/lib/

## Copy builder source
COPY NGCHM_GUI_Builder /NGCHM_GUI_Builder/
## Insert NG-CHM artifacts:
ENV BUILDERSRC=/NGCHM_GUI_Builder
RUN curl -L \
    -o $BUILDERSRC/WebContent/WEB-INF/lib/MapGen.jar $VIEWER_REPO/raw/$VIEWER_TAG/NGCHM/buildermapgen/BuilderMapGen.jar \
    -o $BUILDERSRC/WebContent/ngChmApp.html $VIEWER_REPO/raw/$VIEWER_TAG/NGCHM/standalone/ngChmApp.html \
    -o $BUILDERSRC/WebContent/javascript/ngchmWidget-min.js $VIEWER_REPO/raw/$VIEWER_TAG/NGCHM/standalone/ngchmWidget-min.js

## Version include files.
COPY versioner-v2.sh /
RUN /versioner-v2.sh ${VIEWER_TAG}

## Build the GUI Builder.
ENV BUILDERDIR=/artifacts/builder.app
RUN mkdir -p ${BUILDERDIR} &&\
    ant -f NGCHM_GUI_Builder/ant_buildfile.xml -Dbuilder.app.war.path=${BUILDERDIR}/NGCHM-web-builder.war

# Final stage: copy artifacts from previous stages into a Tomcat container
FROM tomcat:10.0.22-jdk17-temurin-jammy

# Remove unused default apps
RUN rm -R -f /usr/local/tomcat/webapps.dist

COPY --from=webbuilder /artifacts/builder.app /usr/local/tomcat/webapps

# Run tomcat for a brief time to deploy the WAR file. Then remove it.
# This allows volumes to be mounted within Tomcat's directory for the webapp.
RUN catalina.sh start && sleep 10 && catalina.sh stop && rm /usr/local/tomcat/webapps/NGCHM-web-builder.war
