#!/bin/bash
# Build Items first
for i in characteristics mysteries possessions macros journals; do
    ./build-pack.sh $i
    [ $? ] || exit 1
done

# Build Actors last
for i in characters creatures; do
    ./build-pack.sh $i
    [ $? ] || exit 1
done
