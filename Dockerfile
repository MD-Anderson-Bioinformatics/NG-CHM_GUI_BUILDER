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

ARG TOMCAT_UID=1000
ARG TOMCAT_GID=1000
ARG TOMCAT_USER=tomcat
ARG TOMCAT_GROUP=tomcat
RUN set -x ; \
    addgroup -g ${TOMCAT_GID} -S ${TOMCAT_GROUP} ; \
    adduser -u ${TOMCAT_UID} -S -G ${TOMCAT_GROUP} ${TOMCAT_USER} && exit 0; exit 1

RUN chown -R ${TOMCAT_UID}:${TOMCAT_GID} /usr/local/tomcat/webapps ; \
    chmod 777 /usr/local/tomcat/conf ; \
    chmod 755 /usr/local/tomcat/bin /usr/local/tomcat/lib ; \
    chmod 755 /usr/local/tomcat/bin/* ; \
    chmod 644 /usr/local/tomcat/lib/* /usr/local/tomcat/conf/* ; \
    chmod 777 /usr/local/tomcat/logs /usr/local/tomcat/work /usr/local/tomcat/temp

USER ${TOMCAT_UID}

COPY --from=webbuilder /artifacts/builder.app /usr/local/tomcat/webapps
