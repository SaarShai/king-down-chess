/** The names of the ChatGPT plugin tools (src/plugin/server.ts). A new or renamed tool fails typecheck until it is here
 *  and in the tables of tools/plugin-tool-table.test.ts. A new or renamed tool also waits for the OpenAI review (docs/FORMS.md). */
export type PluginTool =
  | 'kingdown_open' | 'kingdown_create' | 'kingdown_resume' | 'kingdown_games' | 'kingdown_get' | 'kingdown_preview' | 'kingdown_seen'
  | 'kingdown_lobby' | 'kingdown_accept' | 'kingdown_find' | 'kingdown_cancel' | 'kingdown_choose' | 'kingdown_rematch' | 'kingdown_move'
  | 'kingdown_computer' | 'kingdown_say' | 'kingdown_draw' | 'kingdown_claim' | 'kingdown_resign' | 'kingdown_abort' | 'kingdown_invite'
  | 'kingdown_join' | 'kingdown_friends' | 'kingdown_decline_invite' | 'kingdown_block' | 'kingdown_report' | 'kingdown_handle'
  | 'kingdown_settings' | 'kingdown_profile';
