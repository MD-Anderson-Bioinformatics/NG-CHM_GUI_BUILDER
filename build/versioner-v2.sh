#!/bin/bash

GUIBUILDER=/NGCHM_GUI_Builder
VIEWER_TAG=$1

# Update GUI Builder version string.
BUILDER_VERSION=$(cat $GUIBUILDER/VersionNumber)
SRCDIR=$GUIBUILDER/src/mda/ngchm/guibuilder
sed -e "s|BUILDERVERSION|${BUILDER_VERSION}|" -e "s|VERSIONSTRING|GUI Builder ${BUILDER_VERSION} w/ NG-CHM ${VIEWER_TAG}|" < $SRCDIR/BuilderVersion.template > $SRCDIR/BuilderVersion.java
sed -i -e "s/set-during-build/${BUILDER_VERSION}/" $GUIBUILDER/WebContent/javascript/NGCHM_GUI_Util.js

# Update ?v= values to files referenced in HTML files.
cd $GUIBUILDER/WebContent
FILES_TO_UPDATE=$(grep '?v=' *html | sed 's/:.*//'| uniq)

# Declare md5sums as an associative array so that we don't have
# to recompute the md5sums of files referenced in multiple
# HTML files.
declare -A md5sums=()

# Create a temporary file for containing file references during
# each HTML file check.
tmpfile=$(mktemp /tmp/filerefs.XXXXXX)

for file in $FILES_TO_UPDATE ; do
    echo Checking ${file}:
    # Find references in $file that have to be checked.
    grep '="[a-zA-Z][^"]*?v=.*"' $file > $tmpfile
    while read -r ref ; do
	# For each reference
	# Get the referenced file and its current ?v= value.
	subfile=$(echo $ref | sed -e 's/.*="//' -e 's/?v=.*//')
	currentv=$(echo $ref | sed -e 's/.*?v=//' -e 's/".*//')
	# Determine its md5sum if we haven't already
	if [ -z "${md5sums[$subfile]}" ] ; then
	    md5sums+=( [$subfile]=$(md5sum < "$subfile" | sed 's/ *-//') )
	fi
	# Update the ?v= value if the md5sum has changed
	if [ x$currentv != x${md5sums[$subfile]} ] ; then
	    sed -i 's:"'"$subfile?v="'[^"]*":"'"$subfile?v=${md5sums[$subfile]}"'":' $file
	fi
    done < $tmpfile
done

# Clean up the temporary file.
rm -f ${tmpfile}

exit 0
