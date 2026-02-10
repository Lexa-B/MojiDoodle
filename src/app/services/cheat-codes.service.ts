import { Injectable } from '@angular/core';
import { CardsService } from './cards.service';

@Injectable({
  providedIn: 'root'
})
export class CheatCodesService {

  constructor(private cardsService: CardsService) {}

  /**
   * Sanitize input: strip non-letters, lowercase.
   */
  sanitize(input: string): string {
    return input.replace(/[^a-zA-Z]/g, '').toLowerCase();
  }

  /**
   * Hash the sanitized input using SHA-256.
   * Returns hex string.
   */
  async hash(input: string): Promise<string> {
    const sanitized = this.sanitize(input);
    const encoded = new TextEncoder().encode(sanitized);
    const buffer = await crypto.subtle.digest('SHA-256', encoded);
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Process a cheat code: sanitize, hash, and check against known codes.
   * Returns true if the code matched something.
   */
  async submit(input: string): Promise<boolean> {
    const hashed = await this.hash(input);
    console.log('Cheat code hash:', hashed);

    // Advance all stage 0-9 cards to stage 10
    if (hashed === '6a355f7a5c7b4dec7cbcda1296aa808d5d550f1d4da8453e9138e9aa10745544') {
      const count = this.cardsService.bulkSetStage(0, 9, 10);
      console.log(`Cheat applied: ${count} cards set to stage 10`);
      return true;
    }

    // Clear all future unlock times to now
    if (hashed === '7e98e6735eef295f92bb1492228a48724b1d9b1b8bde969c3b7ee33cd38ebc7e') {
      const count = this.cardsService.clearFutureUnlocks();
      console.log(`Cheat applied: ${count} cards unlocked immediately`);
      return true;
    }

    return false;
  }
}
