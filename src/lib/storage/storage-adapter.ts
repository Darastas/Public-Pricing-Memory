export type RawHtmlStorageInput = {
  productId: string;
  snapshotId: string;
  fetchedAt: Date;
  html: string;
};

export type RawHtmlStorageResult = {
  rawHtml: string | null;
  rawHtmlStorageKey: string | null;
};

export type StorageAdapter = {
  putRawHtml(input: RawHtmlStorageInput): Promise<RawHtmlStorageResult>;
};

export const databaseStorageAdapter: StorageAdapter = {
  async putRawHtml(input) {
    return {
      rawHtml: input.html,
      rawHtmlStorageKey: null
    };
  }
};
