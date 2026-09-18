#!/bin/sh
set -eu
export LC_ALL=C TZ=UTC SOURCE_DATE_EPOCH=0 ZERO_AR_DATE=1
unset CFLAGS CPPFLAGS CXXFLAGS LDFLAGS LD_LIBRARY_PATH LD_PRELOAD GCC_EXEC_PREFIX COMPILER_PATH LIBRARY_PATH CPATH C_INCLUDE_PATH
exec /usr/bin/gcc -std=c11 -O2 -fPIE -static-pie -fno-ident -ffile-prefix-map="$PWD"=. -fdebug-prefix-map="$PWD"=. -Wl,--build-id=none -Wl,-z,relro,-z,now -o "$2" "$1"
