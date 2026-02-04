#!/bin/bash
# Process all Genki lessons (00-23) into MojiDoodle card format

set -e  # Exit on error (but we handle missing files gracefully)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

PROCESSED_DIR="$SCRIPT_DIR/../processed"
CARDS_DIR="$PROJECT_ROOT/data/cards/genki"

# Ensure output directory exists
mkdir -p "$CARDS_DIR"

echo "Processing Genki lessons 00-23..."
echo "Source: $PROCESSED_DIR"
echo "Target: $CARDS_DIR"
echo ""

SUCCESS=0
SKIPPED=0
FAILED=0

for i in $(seq -w 0 23); do
    LESSON_NUM="$i"
    # Format with leading zero for 0-9
    if [[ ${#LESSON_NUM} -eq 1 ]]; then
        LESSON_NUM="0$LESSON_NUM"
    fi

    SOURCE_FILE="$PROCESSED_DIR/genki_vocab_L${LESSON_NUM}.csv"
    TARGET_FILE="$CARDS_DIR/genki_vocab_${LESSON_NUM}.yaml"
    PREFIX="g-${LESSON_NUM}-"

    echo "=== Lesson $LESSON_NUM ==="

    # Check if source file exists
    if [[ ! -f "$SOURCE_FILE" ]]; then
        echo "  Skipping: source file not found ($SOURCE_FILE)"
        ((SKIPPED++))
        echo ""
        continue
    fi

    # Check if source file is empty (just header or no content)
    LINE_COUNT=$(wc -l < "$SOURCE_FILE" | tr -d ' ')
    if [[ "$LINE_COUNT" -le 1 ]]; then
        echo "  Skipping: source file is empty or only has header"
        ((SKIPPED++))
        echo ""
        continue
    fi

    echo "  Source: $SOURCE_FILE"
    echo "  Target: $TARGET_FILE"
    echo "  Prefix: $PREFIX"
    echo ""

    # Run the processor
    if uv run "$SCRIPT_DIR/process_genki_lesson.py" "$SOURCE_FILE" "$TARGET_FILE" --prefix "$PREFIX"; then
        ((SUCCESS++))
    else
        echo "  ERROR: Failed to process lesson $LESSON_NUM"
        ((FAILED++))
    fi

    echo ""
done

echo "========================================="
echo "Done!"
echo "  Success: $SUCCESS"
echo "  Skipped: $SKIPPED"
echo "  Failed:  $FAILED"
echo "========================================="

# Exit with error if any failed
if [[ $FAILED -gt 0 ]]; then
    exit 1
fi
