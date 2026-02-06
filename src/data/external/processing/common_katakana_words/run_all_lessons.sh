#!/usr/bin/env bash
#
# Process all 40 common katakana word lessons.
# Runs the OpenAI processor, fixes YAML indentation, and creates lesson files.
# Manifests are pre-populated — this script only generates card + lesson YAMLs.
#
# Stops and waits for user input on any error.
#
# Usage: bash run_all_lessons.sh [start_lesson]
#   start_lesson: optional, resume from this lesson (default: 1)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
CARDS_DIR="$PROJECT_ROOT/src/data/cards/common_katakana_words"
LESSONS_DIR="$PROJECT_ROOT/src/data/lessons/common_katakana_words"

START=${1:-1}
END=40

pause_on_error() {
    echo ""
    echo "ERROR: $1"
    echo "Press Enter to retry this lesson, or Ctrl+C to abort."
    read -r
}

mkdir -p "$CARDS_DIR" "$LESSONS_DIR"

for i in $(seq "$START" "$END"); do
    NUM=$(printf "%02d" "$i")
    CARD_FILE="$CARDS_DIR/common_katakana_l${NUM}.yaml"
    LESSON_FILE="$LESSONS_DIR/lesson_common_katakana_${NUM}.yaml"

    echo ""
    echo "=========================================="
    echo "  Lesson $NUM / 40"
    echo "=========================================="

    # --- Card file ---
    if [[ -f "$CARD_FILE" ]]; then
        echo "Card file already exists, skipping processor."
    else
        while true; do
            if uv run "$SCRIPT_DIR/process_common_katakana_lesson.py" "$NUM" --batch-size 1; then
                break
            else
                pause_on_error "Processor failed for lesson $NUM"
            fi
        done

        # Fix YAML indentation (PyYAML puts list items at wrong indent)
        if [[ -f "$CARD_FILE" ]]; then
            perl -i -0777 -pe 's/(  answers:\n)(  - )/\1    - /g' "$CARD_FILE"
            perl -i -0777 -pe 's/(  - answers:\n)(    - )/\1      - /g' "$CARD_FILE"
            echo "Fixed YAML indentation."
        else
            pause_on_error "Card file not created: $CARD_FILE"
            continue
        fi
    fi

    # --- Lesson file ---
    if [[ -f "$LESSON_FILE" ]]; then
        echo "Lesson file already exists, skipping."
    else
        IDS=$(grep '^- id:' "$CARD_FILE" | sed 's/^- id: //')
        if [[ -z "$IDS" ]]; then
            pause_on_error "No card IDs found in $CARD_FILE"
            continue
        fi

        if [[ "$i" -eq 1 ]]; then
            STATUS="available"
            REQUIRES="requires: []"
        else
            PREV_NUM=$(printf "%02d" $((i - 1)))
            STATUS="locked"
            REQUIRES="requires:
  - common_katakana_$PREV_NUM"
        fi

        {
            echo "# Common Katakana Words - Lesson $NUM"
            echo ""
            echo "id: common_katakana_$NUM"
            echo "name: \"Common Katakana Words $NUM\""
            echo "status: $STATUS"
            echo "$REQUIRES"
            echo "supercedes: []"
            echo ""
            echo "ids:"
            echo "$IDS" | while read -r id; do
                echo "  - $id"
            done
        } > "$LESSON_FILE"
        echo "Created lesson file."
    fi

    echo "Lesson $NUM complete."
done

echo ""
echo "=========================================="
echo "  All 40 lessons processed!"
echo "=========================================="
echo ""
echo "Next: cd $PROJECT_ROOT && npm run build"
