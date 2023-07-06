# NG-CHM GUI Builder

This repository holds the source code of the GUI Builder for the [Next-Generation Clustered Heat Map (NG-CHM)](https://bioinformatics.mdanderson.org/public-software/ngchm/) system.

The GUI Builder aims to provide an intuitive graphical user interface (GUI) that enables non-experts to create NG-CHMs.

## Using the NG-CHM GUI Builder

A public instance of NG-CHM GUI Builder is available at [https://build.ngchm.net/NGCHM-web-builder/](https://build.ngchm.net/NGCHM-web-builder/).

## Configuring the NG-CHM GUI Builder

The NG-CHM GUI Builder is built and deployed using `docker compose`.

Clone this repository to your build environment.

If needed, customize the following environment variables by adding them to the `.env` file in the top-level directory/folder.

### `VIEWER_REPO`

The Github repository containing the NG-CHM artifacts to use. Defaults to our [NG-CHM-Artifacts](https://github.com/MD-Anderson-Bioinformatics/NG-CHM-Artifacts) repository.

### `VIEWER_TAG`

The github tag that specifies the specific version of the NG-CHM artifacts to include. No default value is provided.

### `REGNAME`

The docker registry and name to use for the generated builder image.  Defaults to [ngchm/builder](https://hub.docker.com/r/ngchm/builder).

### `TAGNAME`

The tag to use for the generated builder image.  Defaults to latest.

### `PORT`

The port on which the generated builder image will listen. Defaults to 8080.

### `LOGDIR`

The host directory to use for the builder's access log. Defaults to ./builder_data/logs.

### `BUILDDIR`

The host directory to use for the builder's build log. Defaults to ./builder_data/map_build_dir.

### `JAVA_MEMORY`

The amount of memory to provide for the Java Virtual Machine running in the Docker container.  Defaults to 4000M.  Must include the unit in the specification.

### `TOMCAT_UID`

The numeric user id to run the Tomcat process as in the Docker container. Defaults to user 1000. Corresponding Group name is tomcat. Temporary files and log files in the BUILDDIR and LOGDIR directories will be owned by this user.

### `TOMCAT_GID`

The numeric group id to run the Tomcat process as in the Docker container. Defaults to group 1000. Corresponding Group name is tomcat. Temporary files and log files in the BUILDDIR and LOGDIR directories will be owned by this group.

## Building

To build the GUI Builder:

```sh
docker compose build
```

## Deploying

To deploy the GUI Builder:

```sh
docker compose up -d
```

To stop the GUI Builder:

```sh
docker compose down
```
The GUI Builder will be available at `http://hostname:PORT/NGCHM-web-builder/`, where `hostname` is the host name of the deployment system.
