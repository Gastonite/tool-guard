


export type MatchResult<TMatch, TFailure> = (
  | { matched: true; match: TMatch }
  | { matched: false; failure: TFailure }
)
