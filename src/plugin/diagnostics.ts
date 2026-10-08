/** Fixed categories only: error messages can contain connection URLs or tokens. */
export function diagnostic(error: unknown) {
  const value = error as { name?: unknown; code?: unknown } | null;
  const name = typeof value?.name === 'string' && ['Error','TypeError','RangeError','SyntaxError','MatchError','MatchServiceError'].includes(value.name) ? value.name : 'Error';
  const code = typeof value?.code === 'string' && (/^[0-9A-Z]{5}$/.test(value.code) || ['ECONNRESET','ECONNREFUSED','ETIMEDOUT','ENOTFOUND','UNAVAILABLE','SCHEMA_REQUIRED','CONFIG_REQUIRED','SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_VERIFY_LEAF_SIGNATURE','CERT_HAS_EXPIRED','ERR_TLS_CERT_ALTNAME_INVALID','DEPTH_ZERO_SELF_SIGNED_CERT'].includes(value.code)) ? value.code : 'UNKNOWN';
  return { name, code };
}
