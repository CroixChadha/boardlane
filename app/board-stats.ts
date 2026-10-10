import type { Bucket, Card, ChecklistItem } from "./board";

export type CardProgress = {
  card: Card;
  bucketName: string;
  done: number;
  total: number;
};

export type BucketProgress = {
  bucket: Bucket;
  cardCount: number;
  done: number;
  total: number;
};

// A whole number from 0 to 100; 0 when there is nothing to complete.
export function percent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// Works out the numbers the Home and Progress pages show from the same three
// lists the board uses, so the pages can never disagree with the board.
export function boardStats(
  buckets: Bucket[],
  cards: Card[],
  checklistItems: ChecklistItem[],
) {
  const itemsByCard = new Map<string, ChecklistItem[]>();
  for (const item of checklistItems) {
    const list = itemsByCard.get(item.cardId) ?? [];
    list.push(item);
    itemsByCard.set(item.cardId, list);
  }
  const bucketNames = new Map(buckets.map((bucket) => [bucket._id, bucket.name]));

  const cardProgress: CardProgress[] = cards.map((card) => {
    const items = itemsByCard.get(card._id) ?? [];
    return {
      card,
      bucketName: bucketNames.get(card.bucketId) ?? "",
      done: items.filter((item) => item.isDone).length,
      total: items.length,
    };
  });

  const bucketProgress: BucketProgress[] = buckets.map((bucket) => {
    const inBucket = cardProgress.filter((entry) => entry.card.bucketId === bucket._id);
    return {
      bucket,
      cardCount: inBucket.length,
      done: inBucket.reduce((sum, entry) => sum + entry.done, 0),
      total: inBucket.reduce((sum, entry) => sum + entry.total, 0),
    };
  });

  const done = checklistItems.filter((item) => item.isDone).length;
  return {
    done,
    total: checklistItems.length,
    completion: percent(done, checklistItems.length),
    bucketProgress,
    // Cards with at least one checklist item still unticked, in board order.
    unfinished: cardProgress.filter((entry) => entry.done < entry.total),
    // Cards whose whole checklist is ticked.
    finishedCards: cardProgress.filter((entry) => entry.total > 0 && entry.done === entry.total).length,
    cardsWithoutChecklist: cardProgress.filter((entry) => entry.total === 0).length,
  };
}
