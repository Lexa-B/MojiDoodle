#!/usr/bin/env python3
"""
Split genki_vocab.csv into separate files by lesson number.
Each item goes only into its first appearing lesson.
"""

import csv
import os
import re
from collections import defaultdict

INPUT_FILE = "../raw/genki_vocab.csv"
OUTPUT_DIR = "../processed"

def extract_first_lesson(lesson_field):
    """
    Extract the first lesson identifier from the 課数 field.
    Examples:
        "会L3" -> "L03"
        "読L10-II" -> "L10"
        "会L4(e)" -> "L04"
        "会L9, 会L9(e)" -> "L09"
        "会G" -> "L00"
    Returns tuple: (lesson_key, warning_message or None)
    """
    # Handle empty
    if not lesson_field or not lesson_field.strip():
        return (None, "empty lesson field")

    # Get just the first lesson if multiple (comma-separated)
    first = lesson_field.split(",")[0].strip()

    # Extract lesson number with regex
    # Matches: 会L3, 読L10-II, 会L4(e), etc.
    match = re.search(r'L(\d+)', first)
    if match:
        num = int(match.group(1))
        return (f"L{num:02d}", None)

    # Handle special cases like 会G (greetings)
    if "G" in first:
        return ("L00", None)

    return (None, f"unrecognized format: '{lesson_field}'")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_FILE)
    output_base = os.path.join(script_dir, OUTPUT_DIR)

    # Create output directory
    os.makedirs(output_base, exist_ok=True)

    # Group rows by lesson
    lessons = defaultdict(list)
    unsorted = []  # (row, reason)
    header = None

    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # No.,単語,漢字表記,品詞,英訳,課数

        for row in reader:
            if len(row) < 6:
                unsorted.append((row, "row has fewer than 6 columns"))
                continue
            lesson_field = row[5]  # 課数 column
            lesson_key, warning = extract_first_lesson(lesson_field)
            if lesson_key is None:
                unsorted.append((row, warning))
            else:
                lessons[lesson_key].append(row)

    # Write each lesson to its own file
    for lesson_key, rows in sorted(lessons.items()):
        output_path = os.path.join(output_base, f"genki_vocab_{lesson_key}.csv")
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(rows)

        print(f"{lesson_key}: {len(rows)} items -> genki_vocab_{lesson_key}.csv")

    # Write unsorted items to separate file
    if unsorted:
        print(f"\n⚠ {len(unsorted)} unsorted items:")
        unsorted_path = os.path.join(output_base, "genki_vocab_unsorted.csv")
        with open(unsorted_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(header + ["_sort_error"])
            for row, reason in unsorted:
                # Pad row if needed
                padded = row + [''] * (6 - len(row)) if len(row) < 6 else row
                writer.writerow(padded + [reason])
                word = row[1] if len(row) > 1 else "(unknown)"
                print(f"  - {word}: {reason}")
        print(f"  -> genki_vocab_unsorted.csv")

    print(f"\nTotal lessons: {len(lessons)}")
    print(f"Output directory: {output_base}")

if __name__ == "__main__":
    main()
