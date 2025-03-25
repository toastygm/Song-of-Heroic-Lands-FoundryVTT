#!/bin/bash
PACK=$1
PACKBASE=../assets/packs/$PACK
DATADIR=$PACKBASE/data
UNIQUEDIR=$PACKBASE/unique
BUILDDIR=build/$PACK
PACKDIR=../packs
GENFILE=generate-$PACK.py
PACKTYPE=$(grep "^type=" $PACKBASE/pack.properties| cut -d= -f2)
echo -e "\n>> Packing $PACK"
[ -d $BUILDDIR ] && rm -rf $BUILDDIR
mkdir -p $BUILDDIR
if [ -f "$GENFILE" ]; then
    python3 "$GENFILE" "$DATADIR" "$BUILDDIR"
    exit_status=$?
else
    exit_status=0
fi
if [ $exit_status -eq 0 ]; then
    [ -d $UNIQUEDIR -a ! -z "$( ls -A $UNIQUEDIR/*.json 2>/dev/null )" ] && cp $UNIQUEDIR/*.json $BUILDDIR
    fvtt package pack -n $PACK -v --type System --id sohl -t $PACKTYPE --in $BUILDDIR --out $PACKDIR
else
    echo -e "\033[0;31mERROR:\033[0m Build Failed!!"
    rm -rf $BUILDDIR
    exit 1
fi
