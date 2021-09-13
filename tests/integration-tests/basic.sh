#!/bin/bash

info() { printf "\033[1;31m\n   %s\033[0;33m$@\n\n";  }
error() { printf "\033[1;31m • $@\033[0;0m\n"; }
passed() { printf "\033[0;32m • $@\033[0;0m\n"; }

if [ -z "$URL_PREFIX" ]; then
    URL_PREFIX="http://web/some-path"
fi

sleep 10s

FAILED=""

#
# Curls a url and tests if the response contains a string.
# If it fails sets FAILED to true.
#
# Usage: expectResponseToContain "/_monitor" "active"
#
expectResponseToContain() {
    
    ENDPOINT="$1"
    PATTERN="$2"
    TEST_DESCRIPTION="$3"
    
    TEST_URL="$URL_PREFIX$ENDPOINT"

    curl -k -S --max-time 3 $TEST_URL > .curl.log 2>&1
    RESULT=$(cat .curl.log)
    
    if [[ "$RESULT" == *"$PATTERN"* ]]; then
        if [ ! -z "$TEST_DESCRIPTION" ]; then
            passed "$TEST_DESCRIPTION."
        else 
            passed "$TEST_URL contains $PATTERN"
        fi
 
    else
        if [ ! -z "$TEST_DESCRIPTION" ]; then
            error "$TEST_DESCRIPTION"
        fi
        info "'$TEST_URL' does not contain pattern '$PATTERN'."
        
        FAILED="true"
    fi

}

#
# Curls a url and tests if the response contains a string.
# If it fails sets FAILED to true.
#
# Usage: expectResponseToContain "/_monitor" "active"
#
expectResponseToContainHeader() {
    
    ENDPOINT="$1"
    PATTERN="$2"
    TEST_DESCRIPTION="$3"
    
    TEST_URL="$URL_PREFIX$ENDPOINT"

    curl -I -k -S --max-time 3 $TEST_URL > .curl.log 2>&1
    RESULT=$(cat .curl.log)
    
    if [[ "$RESULT" == *"$PATTERN"* ]]; then
        if [ ! -z "$TEST_DESCRIPTION" ]; then
            passed "$TEST_DESCRIPTION."
        else 
            passed "$TEST_URL contains $PATTERN"
        fi
 
    else
        if [ ! -z "$TEST_DESCRIPTION" ]; then
            error "$TEST_DESCRIPTION"
        fi
        info "'$TEST_URL' does not contain headers '$PATTERN'."

        cat .curl.log
        
        FAILED="true"
    fi

}

# ---------------- Tests ----------------

expectResponseToContain "/_monitor" "APPLICATION_STATUS: OK" "Default check APPLICATION_STATUS: OK"
expectResponseToContain "/_about" "Docker image" "The about page should show Docker images information"
expectResponseToContainHeader "/_about" "200 OK" "_about should return 200 Ok response"
expectResponseToContainHeader "/_monitor" "200 OK" "_monitor should return 200 Ok response"
expectResponseToContainHeader "/redirect/this/path" "301 Moved Permanently" "A redirect path should 307 Temporary"

# Result
if [[ "$FAILED" != *"true"* ]]; then
    info "All end-to-end tests passed."
    exit 0
else
    echo ""
    exit 1
fi


