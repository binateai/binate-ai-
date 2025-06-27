#!/bin/bash

# Script to run all Slack integration tests with proper error handling
# Usage: ./run-slack-tests.sh

# Print with colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===============================================${NC}"
echo -e "${YELLOW}  RUNNING ALL SLACK INTEGRATION TESTS${NC}"
echo -e "${YELLOW}===============================================${NC}"

# Initialize counters
total_tests=3
passed_tests=0
failed_tests=0

# Function to run a test and handle errors
run_test() {
  test_file="$1"
  test_name="$2"
  
  echo -e "\n\n${YELLOW}Running ${test_name}...${NC}"
  
  if tsx "$test_file"; then
    echo -e "${GREEN}✅ ${test_name} completed successfully.${NC}"
    passed_tests=$((passed_tests + 1))
    return 0
  else
    echo -e "${RED}❌ ${test_name} failed with errors.${NC}"
    failed_tests=$((failed_tests + 1))
    return 1
  fi
}

# Run the tests
run_test "test/slack-error-tests.ts" "Error Handling Tests"
run_test "test/slack-notification-tests.ts" "Notification Tests"
run_test "test/slack-edge-case-tests.ts" "Edge Case Tests"

# Print summary
echo -e "\n\n${YELLOW}===============================================${NC}"
echo -e "${YELLOW}  TEST SUMMARY: ${passed_tests}/${total_tests} PASSED${NC}"
echo -e "${YELLOW}===============================================${NC}"

if [ $failed_tests -gt 0 ]; then
  echo -e "${RED}⚠️ ${failed_tests} test(s) failed.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All tests passed successfully!${NC}"
  exit 0
fi