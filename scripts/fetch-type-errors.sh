#!/bin/bash

# Configuration
PROJECT_ROOT=$(pwd)
LOG_DIR="$PROJECT_ROOT/logs"
REPORT_FILE="$PROJECT_ROOT/type-errors-report.txt"
RAW_LOG="$LOG_DIR/tsc-output.log"

# Create logs directory
mkdir -p "$LOG_DIR"

echo "--------------------------------------------------------"
echo "🔍 SmartStore Type Error Fetcher"
echo "--------------------------------------------------------"
echo "🚀 Running TypeScript compiler check..."

# Run tsc and capture output
npx tsc --noEmit --skipLibCheck --pretty false > "$RAW_LOG" 2>&1

# Check if tsc succeeded
if [ $? -eq 0 ]; then
    echo "✅ Success! No type errors found."
    echo "Full Project Type Check - $(date)" > "$REPORT_FILE"
    echo "Status: PASSED" >> "$REPORT_FILE"
else
    # Count errors and files
    ERROR_COUNT=$(grep -c "error TS" "$RAW_LOG")
    FILE_COUNT=$(grep "error TS" "$RAW_LOG" | cut -d'(' -f1 | sort -u | wc -l | xargs)
    
    echo "❌ Found $ERROR_COUNT type errors across $FILE_COUNT files."
    
    # Generate the report
    echo "========================================================" > "$REPORT_FILE"
    echo "TYPESCRIPT ERROR REPORT - $(date)" >> "$REPORT_FILE"
    echo "========================================================" >> "$REPORT_FILE"
    echo "Total Errors: $ERROR_COUNT" >> "$REPORT_FILE"
    echo "Files Affected: $FILE_COUNT" >> "$REPORT_FILE"
    echo "========================================================" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "📂 TOP 20 FILES WITH MOST ERRORS:" >> "$REPORT_FILE"
    echo "--------------------------------------------------------" >> "$REPORT_FILE"
    grep "error TS" "$RAW_LOG" | cut -d'(' -f1 | sort | uniq -c | sort -nr | head -n 20 >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "📉 ERROR TYPES DENSITY:" >> "$REPORT_FILE"
    echo "--------------------------------------------------------" >> "$REPORT_FILE"
    grep -o "error TS[0-9]*" "$RAW_LOG" | sort | uniq -c | sort -nr >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "📑 DETAILED ERROR LOG (First 200 lines):" >> "$REPORT_FILE"
    echo "--------------------------------------------------------" >> "$REPORT_FILE"
    head -n 200 "$RAW_LOG" >> "$REPORT_FILE"
fi

echo "--------------------------------------------------------"
echo "✅ Report generated: $REPORT_FILE"
echo "📂 Raw log: $RAW_LOG"
echo "--------------------------------------------------------"
