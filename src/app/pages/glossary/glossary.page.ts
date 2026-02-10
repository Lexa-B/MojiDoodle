import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonAccordionGroup, IonAccordion, IonItem, IonLabel, IonList, IonNote } from '@ionic/angular/standalone';
import { CardsService } from '../../services/cards.service';

interface GlossaryCard {
  id: string;
  prompt: string;
  answer: string;
  hint: string | null;
  stage: number;
  stageColor: string;
  unlocks: string;
}

interface GlossaryLesson {
  id: string;
  name: string;
  cards: GlossaryCard[];
}

interface GlossaryCategory {
  id: string;
  label: string;
  lessons: GlossaryLesson[];
  totalCards: number;
}

@Component({
  selector: 'app-glossary',
  templateUrl: './glossary.page.html',
  styleUrls: ['./glossary.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonAccordionGroup, IonAccordion, IonItem, IonLabel, IonList, IonNote, DatePipe],
})
export class GlossaryPage implements OnInit {

  categories: GlossaryCategory[] = [];
  totalUnlockedCards = 0;

  private categoryLabels: Record<string, string> = {
    'hiragana': 'Hiragana',
    'katakana': 'Katakana',
    'genki': 'Genki Vocabulary',
    'wanikani': 'WaniKani Lessons',
    'joyo-kanji': 'Jōyō Kanji',
    'jinmeiyo-kanji': 'Jinmeiyō Kanji',
    'common-katakana-words': 'Common Katakana Words',
  };

  private categoryOrder = [
    'hiragana', 'katakana', 'genki', 'wanikani',
    'joyo-kanji', 'jinmeiyo-kanji', 'common-katakana-words'
  ];

  constructor(private cardsService: CardsService) {}

  async ngOnInit() {
    await this.cardsService.initialize();
    this.loadGlossary();
  }

  ionViewWillEnter() {
    this.loadGlossary();
  }

  private loadGlossary(): void {
    const rawData = this.cardsService.getGlossaryData();

    // Group: categoryId -> lessonId -> { name, cards[] }
    const categoryMap = new Map<string, Map<string, { name: string; cards: GlossaryCard[] }>>();

    for (const row of rawData) {
      const card: GlossaryCard = {
        id: row.card_id,
        prompt: row.prompt,
        answer: JSON.parse(row.answers)[0] ?? '',
        hint: row.hint,
        stage: row.stage,
        stageColor: this.cardsService.getStageColor(row.stage),
        unlocks: row.unlocks,
      };

      const catId = row.lesson_category ?? row.card_category;
      const lessonId = row.lesson_id ?? '__ungrouped__';
      const lessonName = row.lesson_name ?? 'Ungrouped';

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, new Map());
      }
      const lessonMap = categoryMap.get(catId)!;
      if (!lessonMap.has(lessonId)) {
        lessonMap.set(lessonId, { name: lessonName, cards: [] });
      }
      lessonMap.get(lessonId)!.cards.push(card);
    }

    this.totalUnlockedCards = 0;
    this.categories = [];

    for (const catId of this.categoryOrder) {
      const cat = this.buildCategory(catId, categoryMap.get(catId));
      if (cat) this.categories.push(cat);
    }

    // Handle any categories not in the predefined order
    for (const [catId, lessonMap] of categoryMap) {
      if (this.categoryOrder.includes(catId)) continue;
      const cat = this.buildCategory(catId, lessonMap);
      if (cat) this.categories.push(cat);
    }
  }

  private buildCategory(catId: string, lessonMap: Map<string, { name: string; cards: GlossaryCard[] }> | undefined): GlossaryCategory | null {
    if (!lessonMap) return null;

    const lessons: GlossaryLesson[] = [];
    let totalCards = 0;

    for (const [lessonId, data] of lessonMap) {
      data.cards.sort((a, b) => a.stage - b.stage);
      lessons.push({ id: lessonId, name: data.name, cards: data.cards });
      totalCards += data.cards.length;
    }

    lessons.sort((a, b) => {
      if (a.id === '__ungrouped__') return 1;
      if (b.id === '__ungrouped__') return -1;
      return a.name.localeCompare(b.name);
    });

    this.totalUnlockedCards += totalCards;

    return {
      id: catId,
      label: this.categoryLabels[catId] ?? catId,
      lessons,
      totalCards,
    };
  }
}
