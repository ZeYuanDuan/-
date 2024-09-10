export const WEB_SOCKET_CHANNELS = {
  // 後端接收投票
  VOTE_FOR_TOPIC: (voteId: string) => `voteForTopic:${voteId}`,
  // 後端接收投票錯誤
  VOTE_FOR_TOPIC_ERROR: (voteId: string) => `voteForTopic:${voteId}:error`,
  // 後端接收投票成功
  VOTE_FOR_TOPIC_SUCCESS: (voteId: string) => `voteForTopic:${voteId}:success`,
  // 後端發送投票結果
  VOTE_RESULT: (voteId: string) => `voteResult:${voteId}`,
  // 後端發送投票結果錯誤
  VOTE_RESULT_ERROR: (voteId: string) => `voteResult:${voteId}:error`,
};
