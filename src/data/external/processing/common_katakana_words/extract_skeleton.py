#!/usr/bin/env python3
"""
Extract common katakana words from BCCWJ frequency list and generate skeleton YAML cards.

Source: BCCWJ (Balanced Corpus of Contemporary Written Japanese) by NINJAL
https://clrd.ninjal.ac.jp/bccwj/en/index.html
https://repository.ninjal.ac.jp/records/3234
"""

import csv
from pathlib import Path

# Paths
RAW_FILE = Path(__file__).parent.parent.parent / "raw" / "BCCWJ_frequencylist_suw_ver1_0.tsv"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "processed" / "common_katakana_words"

# Config
WORDS_PER_LESSON = 15
NUM_LESSONS = 40
TOTAL_WORDS = WORDS_PER_LESSON * NUM_LESSONS  # 600

# POS to English hint mapping
POS_TO_HINT = {
    "名詞-普通名詞-一般": "noun",
    "名詞-普通名詞-サ変可能": "verbal noun (する verb)",
    "名詞-普通名詞-助数詞可能": "noun/counter",
    "名詞-普通名詞-形状詞可能": "noun (な-adj)",
    "形状詞-一般": "な-adjective",
    "名詞-普通名詞-サ変形状詞可能": "verbal noun (な-adj)",
    "名詞-数詞": "numeral",
}


def generate_yaml(words: list[dict], lesson_num: int) -> str:
    """Generate YAML content for skeleton cards."""
    lines = []

    for word in words:
        lemma = word['lemma']
        pos = word['pos']
        rank = word['rank']
        hint = POS_TO_HINT.get(pos, "")

        # Generate ID: ckw-l{lesson}-{rank}
        card_id = f"ckw-l{lesson_num:02d}-{rank}"

        lines.append(f"- id: {card_id}")
        lines.append(f'  prompt: ""')
        lines.append(f"  answers:")
        lines.append(f"    - {lemma}")
        lines.append(f'  hint: "{hint}"')
        lines.append(f"  stage: -1")
        lines.append(f"  unlocks: '9999-12-31T23:59:59+00:00'")
        lines.append(f"  befuddlers: []")
        lines.append("")  # Blank line between entries

    return "\n".join(lines)


def main():
    # Load TSV and filter
    rows = []
    with open(RAW_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            # Filter to foreign words only (wType=外)
            if row['wType'] == '外':
                rows.append({
                    'rank': int(row['rank']),
                    'lemma': row['lemma'],
                    'pos': row['pos']
                })

    # Sort by rank
    rows.sort(key=lambda x: x['rank'])

    # Take top 600 words
    rows = rows[:TOTAL_WORDS]

    print(f"Extracted {len(rows)} words")

    # Check for unknown POS
    unknown_pos = set()
    for row in rows:
        if row['pos'] not in POS_TO_HINT:
            unknown_pos.add(row['pos'])
    if unknown_pos:
        print(f"WARNING: Unknown POS values: {unknown_pos}")

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Split into lessons and save as YAML
    for i in range(NUM_LESSONS):
        start_idx = i * WORDS_PER_LESSON
        end_idx = start_idx + WORDS_PER_LESSON
        lesson_words = rows[start_idx:end_idx]

        if len(lesson_words) == 0:
            break

        lesson_num = i + 1
        yaml_content = generate_yaml(lesson_words, lesson_num)

        output_file = OUTPUT_DIR / f"common_katakana_skeleton_l{lesson_num:02d}.yaml"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(yaml_content)

        print(f"Saved {output_file.name}: {len(lesson_words)} words (ranks {lesson_words[0]['rank']}-{lesson_words[-1]['rank']})")


if __name__ == "__main__":
    main()
