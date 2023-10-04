# This is a multistage Docker build.
# Requires Docker 17.06 CE or later
#
FROM tomcat:10.1.13-jdk17-temurin-jammy as base

RUN apt-get update && apt-get -y upgrade
RUN apt autoremove && apt clean

# Remove unused default apps
RUN cd /usr/local/tomcat/webapps && rm -rf ROOT docs host-manager examples manager

# Stage 0: Build ant image
FROM base as ant

RUN apt-get update && apt-get install -y ant

# Stage 1: Create WebBuilder App
FROM ant AS webbuilder

# Install required Tomcat jars into ant image
COPY --from=tomcat /usr/local/tomcat/lib/servlet-api.jar /usr/local/tomcat/lib/
COPY --from=tomcat /usr/local/tomcat/lib/tomcat-coyote.jar /usr/local/tomcat/lib/

## Copy builder source
COPY NGCHM_GUI_Builder /NGCHM_GUI_Builder/
## Insert NG-CHM artifacts:
ENV BUILDERSRC=/NGCHM_GUI_Builder

ARG VIEWER_REPO
ARG VIEWER_TAG

RUN curl -L \
    -o $BUILDERSRC/WebContent/WEB-INF/lib/MapGen.jar $VIEWER_REPO/raw/$VIEWER_TAG/guibuildermapgen/GUIBuilderMapGen.jar \
    -o $BUILDERSRC/WebContent/ngChmApp.html $VIEWER_REPO/raw/$VIEWER_TAG/viewer.standalone/ngChmApp.html \
    -o $BUILDERSRC/WebContent/javascript/ngchmWidget-min.js $VIEWER_REPO/raw/$VIEWER_TAG/viewer.standalone/ngchmWidget-min.js

## Version include files.
COPY versioner-v2.sh /
RUN /versioner-v2.sh ${VIEWER_TAG}

## Build the GUI Builder.
ENV BUILDERDIR=/artifacts/builder.app
RUN mkdir -p ${BUILDERDIR} &&\
    ant -f /NGCHM_GUI_Builder/ant_buildfile.xml -Dbuilder.app.war.path=${BUILDERDIR}/NGCHM-web-builder.war

# Final stage: copy artifacts from previous stages into a Tomcat container
FROM base


ARG TOMCAT_UID=1000
ARG TOMCAT_GID=1000
ARG TOMCAT_USER=tomcat
ARG TOMCAT_GROUP=tomcat

RUN set -x ; \
  groupadd --gid ${TOMCAT_GID} ${TOMCAT_GROUP} ; \
  useradd -u ${TOMCAT_UID} -g ${TOMCAT_GROUP} ${TOMCAT_USER} && exit 0; exit 1

RUN chown -R ${TOMCAT_UID}:${TOMCAT_GID} /usr/local/tomcat/webapps ; \
    chmod 777 /usr/local/tomcat/conf ; \
    chmod 755 /usr/local/tomcat/bin /usr/local/tomcat/lib ; \
    chmod 755 /usr/local/tomcat/bin/* ; \
    chmod 644 /usr/local/tomcat/lib/* /usr/local/tomcat/conf/* ; \
    chmod 777 /usr/local/tomcat/logs /usr/local/tomcat/work /usr/local/tomcat/temp ;

# Set the amount of memory (default 4096M) used by Java when running Tomcat by creating a setenv.sh file.

ARG JAVA_MEMORY=4096M
RUN set -x ; \ 
    printf '#!/usr/bin/env bash\nexport CATALINA_OPTS="-Xms' >/usr/local/tomcat/bin/setenv.sh; \
    echo "${JAVA_MEMORY} -Xmx${JAVA_MEMORY}\"" >>/usr/local/tomcat/bin/setenv.sh;

USER ${TOMCAT_UID}

COPY --from=webbuilder /artifacts/builder.app /usr/local/tomcat/webapps

# Run tomcat for a brief time to deploy the WAR file. Then remove it.
# This allows volumes to be mounted within Tomcat's directory for the webapp.
RUN catalina.sh start && sleep 10 && catalina.sh stop && rm /usr/local/tomcat/webapps/NGCHM-web-builder.war
