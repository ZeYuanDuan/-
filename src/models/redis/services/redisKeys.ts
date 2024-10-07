export const REDIS_KEYS = {
  // 儲存投票選項目前擁有的票數
  voteOption: (voteId: string, optionId: string) =>
    `vote:${voteId}:option:${optionId}`,

  // 儲存使用者投票的資料 (使用者名稱:投票選項ID)
  voteResponse: (voteId: string) => `vote:${voteId}:response`,

  // 儲存投票選項的集合 (投票選項ID)
  voteOptions: (voteId: string | number) => `vote:${voteId}:options`,

  // 儲存投票狀態
  voteStatus: (voteId: string | number) => `vote:${voteId}:status`,
};
