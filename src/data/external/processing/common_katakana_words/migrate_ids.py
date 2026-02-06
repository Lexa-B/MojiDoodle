#!/usr/bin/env python3
"""
Migrate common katakana word card IDs from rank-based to row-number-based.

The old IDs used the BCCWJ rank (which can have duplicates) as the suffix.
The new IDs use the TSV row number (which is unique).

This script:
1. Reads the TSV to build old_id -> new_id mapping (by matching lemma + lesson)
2. Updates all card YAML files in-place
3. Updates all lesson YAML files in-place
"""

import csv
import re
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent.parent
RAW_FILE = SCRIPT_DIR.parent.parent / "raw" / "BCCWJ_frequencylist_suw_ver1_0.tsv"
CARDS_DIR = PROJECT_ROOT / "src" / "data" / "cards" / "common_katakana_words"
LESSONS_DIR = PROJECT_ROOT / "src" / "data" / "lessons" / "common_katakana_words"

WORDS_PER_LESSON = 15


def build_id_mapping() -> dict[str, str]:
    """Build mapping from old ID (rank-based) to new ID (row-number-based).

    Returns dict of {old_id: new_id} for every card that changes.
    """
    # Load TSV: get all foreign words with both rank and row number
    rows = []
    with open(RAW_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row_num, row in enumerate(reader, start=1):
            if row["wType"] == "外":
                rows.append({
                    "rank": int(row["rank"]),
                    "row_num": row_num,
                    "lemma": row["lemma"],
                })

    # Sort by rank (same as extract_skeleton.py)
    rows.sort(key=lambda x: x["rank"])

    # Take top 600
    rows = rows[:WORDS_PER_LESSON * 40]

    # Build mapping: assign each word to its lesson, generate old and new IDs
    mapping = {}
    for i, word in enumerate(rows):
        lesson_num = (i // WORDS_PER_LESSON) + 1
        old_id = f"ckw-l{lesson_num:02d}-{word['rank']}"
        new_id = f"ckw-l{lesson_num:02d}-{word['row_num']}"

        if old_id != new_id:
            # Handle duplicate old_ids: if old_id already in mapping,
            # the first word got it; this is a collision we need to resolve
            if old_id in mapping:
                # The first occurrence already has a mapping; this is the duplicate
                # We need to figure out which card file entry matches this word
                # by looking at the answer (lemma)
                mapping[(old_id, word["lemma"])] = new_id
            else:
                mapping[old_id] = new_id

    return mapping, rows


def build_lemma_mapping(rows: list[dict]) -> dict[tuple[str, str], str]:
    """Build a (old_id, lemma) -> new_id mapping for ALL words (handles duplicates)."""
    mapping = {}
    for i, word in enumerate(rows):
        lesson_num = (i // WORDS_PER_LESSON) + 1
        old_id = f"ckw-l{lesson_num:02d}-{word['rank']}"
        new_id = f"ckw-l{lesson_num:02d}-{word['row_num']}"
        mapping[(old_id, word["lemma"])] = new_id
    return mapping


def build_positional_mapping(rows: list[dict]) -> list[tuple[str, str]]:
    """Build ordered list of (old_id, new_id) per lesson position."""
    result = []
    for i, word in enumerate(rows):
        lesson_num = (i // WORDS_PER_LESSON) + 1
        old_id = f"ckw-l{lesson_num:02d}-{word['rank']}"
        new_id = f"ckw-l{lesson_num:02d}-{word['row_num']}"
        result.append((old_id, new_id))
    return result


def update_card_files(lemma_mapping: dict[tuple[str, str], str]):
    """Update card YAML files, matching by (id, first answer)."""
    card_files = sorted(CARDS_DIR.glob("common_katakana_l*.yaml"))

    total_changes = 0
    for card_file in card_files:
        content = card_file.read_text(encoding="utf-8")
        lines = content.split("\n")
        new_lines = []
        changes = 0

        i = 0
        while i < len(lines):
            line = lines[i]

            # Match "- id: ckw-lNN-XXXX"
            id_match = re.match(r"^- id: (ckw-l\d+-\d+)$", line)
            if id_match:
                old_id = id_match.group(1)

                # Look ahead to find the first answer (lemma)
                lemma = None
                for j in range(i + 1, min(i + 10, len(lines))):
                    answer_match = re.match(r"^\s+- (.+)$", lines[j])
                    if answer_match and lines[j - 1].strip() == "answers:":
                        lemma = answer_match.group(1)
                        break

                key = (old_id, lemma)
                if key in lemma_mapping:
                    new_id = lemma_mapping[key]
                    if old_id != new_id:
                        new_lines.append(f"- id: {new_id}")
                        changes += 1
                        i += 1
                        continue

            new_lines.append(line)
            i += 1

        if changes > 0:
            card_file.write_text("\n".join(new_lines), encoding="utf-8")
            print(f"  {card_file.name}: {changes} IDs updated")
            total_changes += changes

    return total_changes


def update_lesson_files(positional_mapping: list[tuple[str, str]]):
    """Update lesson YAML files, matching IDs positionally within each lesson."""
    # Group by lesson
    lessons: dict[int, list[tuple[str, str]]] = {}
    for i, (old_id, new_id) in enumerate(positional_mapping):
        lesson_num = (i // WORDS_PER_LESSON) + 1
        lessons.setdefault(lesson_num, []).append((old_id, new_id))

    lesson_files = sorted(LESSONS_DIR.glob("lesson_common_katakana_*.yaml"))
    total_changes = 0

    for lesson_file in lesson_files:
        # Extract lesson number from filename
        match = re.search(r"_(\d+)\.yaml$", lesson_file.name)
        if not match:
            continue
        lesson_num = int(match.group(1))

        if lesson_num not in lessons:
            continue

        content = lesson_file.read_text(encoding="utf-8")

        # Build a replacement map for this lesson: old_id -> new_id
        # But old_id can appear twice (the duplicate!), so we need to replace
        # in order. Use positional replacement within the ids: section.
        pairs = lessons[lesson_num]

        # Parse the ids section
        lines = content.split("\n")
        new_lines = []
        in_ids = False
        id_index = 0
        changes = 0

        for line in lines:
            if line.strip() == "ids:" or line.strip().startswith("ids:"):
                in_ids = True
                new_lines.append(line)
                continue

            if in_ids:
                id_line_match = re.match(r"^(\s+- )(ckw-l\d+-\d+)$", line)
                if id_line_match:
                    indent = id_line_match.group(1)
                    old_id = id_line_match.group(2)
                    if id_index < len(pairs):
                        _, new_id = pairs[id_index]
                        if old_id != new_id:
                            new_lines.append(f"{indent}{new_id}")
                            changes += 1
                            id_index += 1
                            continue
                    id_index += 1
                elif line.strip() and not line.startswith(" "):
                    in_ids = False

            new_lines.append(line)

        if changes > 0:
            lesson_file.write_text("\n".join(new_lines), encoding="utf-8")
            print(f"  {lesson_file.name}: {changes} IDs updated")
            total_changes += changes

    return total_changes


def main():
    print("Building ID mapping from TSV...")
    _, rows = build_id_mapping()
    lemma_mapping = build_lemma_mapping(rows)
    positional_mapping = build_positional_mapping(rows)

    # Count how many IDs actually change
    changed = sum(1 for old, new in positional_mapping if old != new)
    print(f"  {len(positional_mapping)} total words, {changed} IDs will change")
    print()

    # Show duplicate ranks that caused the problem
    from collections import Counter
    old_ids = [old for old, _ in positional_mapping]
    dupes = {id: count for id, count in Counter(old_ids).items() if count > 1}
    if dupes:
        print(f"  Found {len(dupes)} duplicate rank-based IDs:")
        for dup_id, count in sorted(dupes.items()):
            print(f"    {dup_id} ({count}x)")
        print()

    print("Updating card files...")
    card_changes = update_card_files(lemma_mapping)
    print(f"  Total: {card_changes} card IDs updated")
    print()

    print("Updating lesson files...")
    lesson_changes = update_lesson_files(positional_mapping)
    print(f"  Total: {lesson_changes} lesson IDs updated")
    print()

    print("Done!")


if __name__ == "__main__":
    main()
