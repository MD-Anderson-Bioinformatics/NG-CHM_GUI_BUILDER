# This is a multistage Docker build.
# Requires Docker 17.06 CE or later
#
# Stage -1: Get Tomcat
FROM tomcat:8-jre8-alpine AS tomcat

# Stage 0: Build ant image
FROM openjdk:8-jdk AS ant

RUN apt-get update && apt-get install -y ant

# Stage 1: Create WebBuilder App
FROM ant AS webbuilder
# Install required Tomcat jars into ant image
COPY --from=tomcat /usr/local/tomcat/lib/servlet-api.jar /usr/local/tomcat/lib/
COPY --from=tomcat /usr/local/tomcat/lib/tomcat-coyote.jar /usr/local/tomcat/lib/

COPY NGCHM_GUI_Builder /NGCHM_GUI_Builder/

ENV BUILDERDIR=/artifacts/builder.app
RUN mkdir -p ${BUILDERDIR} &&\
    ant -f NGCHM_GUI_Builder/ant_buildfile.xml -Dbuilder.app.war.path=${BUILDERDIR}/NGCHM-web-builder.war

# Final stage: copy artifacts from previous stages into a Tomcat container
FROM tomcat:8-jre8-alpine

# Remove unused default apps
RUN cd /usr/local/tomcat/webapps && rm -rf ROOT docs host-manager examples manager

COPY --from=webbuilder /artifacts/builder.app /usr/local/tomcat/webapps
