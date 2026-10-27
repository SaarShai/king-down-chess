// Static fake data. This module has no account, API or share integration.
const params = new URLSearchParams(location.search);
const screen = params.get('screen') || 'new-game';
const shell = document.querySelector('dialog');
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const portrait = (name = 'spirit') => `<span class="portrait"><img src="/ui/kings/${name}.webp" alt=""></span>`;
const button = (label, target, primary = false) => `<button type="button" class="${primary ? 'primary' : 'game-action'}" data-go="${target}">${label}</button>`;
const stage = `<div class="wait-stage" aria-hidden="true"><img class="title-floor" src="/ui/stone-board.webp" alt=""><div class="wait-kings"><img src="/ui/kings/spirit.webp" alt=""><img class="face-left" src="/ui/kings/shadow.webp" alt=""></div></div>`;
const summary = `<div class="summary"><p><b>Casual · Kings' powers</b></p><small>Daily · 3 days per move · You play White</small></div>`;
const row = (handle, note, art = 'spirit', target = 'sender-games') => `<button class="menu-row has-lead" type="button" data-go="${target}">${portrait(art)}<span class="row-title">${handle}</span><span class="line">${note}</span><i aria-hidden="true">›</i></button>`;
const choice = (handle, note, art, selected = false) => `<button type="button" class="menu-row has-lead choice" data-handle="${handle}" aria-pressed="${selected}">${portrait(art)}<span class="row-title">${handle}</span><span class="line">${note}</span><i class="choice-mark" aria-hidden="true">${selected ? 'Selected' : '›'}</i></button>`;
const inviteRow = (incoming, second = false) => `<article class="invitation" aria-label="${incoming ? 'Incoming' : 'Outgoing'} invitation"><div class="menu-row has-lead">${portrait(incoming ? 'spirit' : 'shadow')}<span class="row-title">Invitation ${incoming ? 'from mira' : 'to rowan'}</span><span class="line">Casual · ${second ? 'Chess' : "Kings' powers"} · Daily</span></div><p class="invite-time">Ends Nov 2 at ${second ? '6:40' : '6:30'} PM</p><div class="row-actions">${incoming ? button('Accept', 'accepted', true) + button('Decline', 'declined') : button('Share', 'named-share', true) + button('Cancel invitation', 'cancelled')}</div></article>`;
const games = `<h3 class="group-head">In play</h3>${row('cedar', 'Your turn · Move 12 · Daily', 'frost')}${row('rowan', 'Their turn · Move 8 · Daily', 'shadow')}`;
const notice = (title, text, action, target, extra = '') => `<div class="notice" role="status"><h3>${title}</h3><p>${text}</p>${extra ? `<p class="quiet-line">${extra}</p>` : ''}${button(action, target, true)}</div>`;
const picker = namedOnly => `<p class="sheet-lead">Choose a player or type their handle.</p><h3 class="group-head">Recent opponents</h3>${choice('rowan', 'Last game · Oct 24', 'shadow', true)}${choice('cedar', 'Last game · Oct 22', 'frost')}<h3 class="group-head">You follow</h3>${choice('lark', 'Followed player', 'flame')}<label class="handle-label" for="handle">Handle</label><form class="code-row" id="lookup"><input class="field name" id="handle" name="handle" placeholder="Enter a handle" autocomplete="off" maxlength="40"><button type="submit" class="game-action">Find player</button></form><div id="lookup-result" role="status"></div>${namedOnly ? '<p class="quiet-line">Your friend needs an account and a handle.</p>' : `<div class="link-choice">${row('Share a link', 'For a friend with no account yet', 'stratus', 'link-share')}</div>`}`;
const modes = `<fieldset class="modes"><legend class="sr-only">Choose a game</legend><label class="mode"><input type="radio" name="mode" checked>${icon('brain')}<span class="mode-text"><b>Artificial</b></span></label><label class="mode"><input type="radio" name="mode">${icon('crown')}<span class="mode-text"><b>Kings' powers</b></span></label><button type="button" class="mode" data-go="friend-setup">${icon('smiling-pawn')}<span class="mode-text"><b>A friend</b><small>Online</small></span></button></fieldset>`;
const seg = (title, values) => `<fieldset class="seg"><legend>${title}</legend><div class="seg-row">${values.map((value, i) => `<label><input type="radio" name="${title}" ${!i ? 'checked' : ''}><span>${value}</span></label>`).join('')}</div></fieldset>`;
const share = named => `${stage}<p class="sheet-lead">${named ? 'Invitation to rowan' : 'Your invitation is ready.'}</p>${summary}<p class="share-rule">${named ? 'Only rowan can accept this invitation.' : 'The first player to accept takes the seat.'}</p><p>${named ? 'The invitation is also in their Your games.' : 'They must sign in and choose a handle.'}</p><div class="share-code"><p>Game code</p><div class="game-code" aria-label="Game code K7QX2M">${[...'K7QX2M'].map(c => `<span aria-hidden="true">${c}</span>`).join('')}</div></div><p class="quiet-line">Ends Nov 2 at 6:30 PM</p><div class="friend-actions">${button('Share a link', 'share-demo', true)}${button('Copy code', 'copy-demo')}</div><p class="status" role="status"></p>${named ? '' : '<p class="quiet-line">1 of 2 open link invitations</p>'}`;
const localControls = `<h3 class="group-head">The game</h3>
        <fieldset class="seg colour-switch" id="side-choice">
          <legend class="sr-only">Colour</legend>
          <div class="seg-row">
            <label><input type="radio" name="side" value="0" id="side-white" checked /><span>White</span></label>
            <label><input type="radio" name="side" value="1" id="side-black" /><span>Black</span></label>
          </div>
        </fieldset>
        <div class="level-control"><label for="sample-level">Level<input id="sample-level" type="range" min="0" max="2" step="1" value="2" aria-valuetext="Club" aria-describedby="level-line"></label><div class="level-stops" aria-hidden="true"><span>Casual</span><span>Clever</span><span>Club</span></div></div>
        <p id="level-line">Plays well. Keep your pieces safe.</p>
        <label class="check" id="two-powers-row" hidden><input type="checkbox" id="two-powers" /><span>Play with kings' powers <small>Each king brings one power.</small></span></label>
        <div id="king-picker" hidden>
          <div class="king-pick" id="pick-0"></div>
          <div class="king-pick" id="pick-1"></div>
        </div>
        <label class="army" id="design-row">Bring a design <select id="design" aria-describedby="design-line"><option>None</option></select></label>
        <p id="design-line"></p>
        <details id="more-options">
          <summary><span id="side-army-label">Army</span><small id="side-army-value">Random</small></summary>
          <fieldset class="seg" id="army-choice">
            <legend>Army</legend>
            <div class="seg-row">
              <label><input type="radio" name="army" value="random" checked /><span>Random</span></label>
              <label><input type="radio" name="army" value="daily" /><span>Today's</span></label>
              <label><input type="radio" name="army" value="classic" /><span>Chess</span></label>
            </div>
          </fieldset>
          <div id="army-strip" aria-hidden="true"></div>
          <p id="army-line"></p>
          <details id="other-armies">
            <summary>More…</summary>
            <label class="army">Army <select id="army" aria-describedby="army-note">
              <option value="random">Random King Down army</option>
              <option value="daily" title="Every player gets the same army today">Today's army, the same for everyone</option>
              <option value="classic">Chess starting army</option>
              <option value="custom">Custom army…</option>
              <optgroup label="Example armies" id="army-examples">
                <option value="MMSSNBNK">MMSSNBNK</option><option value="KGBMSSMB">KGBMSSMB</option>
                <option value="NKBBMGQS">NKBBMGQS</option><option value="QNKMNRSG">QNKMNRSG</option>
                <option value="SQBKRSML">SQBKRSML</option><option value="ogre">Ogre practice</option>
              </optgroup>
            </select></label>
            <small id="army-note">Try an example army. Catapult is experimental.</small>
          </details>
        </details>`;
const screens = {
  'new-game': { title: 'New game', body: `${modes}<p class="quiet-line">A friend: send an online invitation.</p>${localControls}`, foot: button('Start game', 'local-demo', true), back: 'new-game' },
  'friend-setup': { title: 'A friend', body: `${stage}<p class="sheet-lead">Set up the game. Then choose a friend.</p>${summary}<details id="setup-options"><summary>Game options</summary>${seg('Your colour', ['White', 'Black'])}<label class="check toggle"><input type="checkbox"><span class="grow">Fairy pieces</span></label><label class="check toggle"><input type="checkbox" checked><span class="grow">Classic chess<small>The normal start, castling, en passant.</small></span></label><label class="check toggle"><input type="checkbox"><span class="grow">Cards</span></label><label class="check toggle"><input type="checkbox" checked><span class="grow">King powers<small>Each king brings one power.</small></span></label></details><h3 class="group-head">Join with a code</h3><div class="code-row"><input class="field" aria-label="Game code" placeholder="K7QX2M">${button('Join', 'join-demo')}</div>`, foot: button('Choose a friend', 'friend-picker', true), back: 'new-game' },
  'friend-picker': { title: 'Choose a friend', body: picker(false), foot: '<p id="selected-name">To rowan · Kings’ powers · Daily</p>' + button('Send invitation', 'sender-games', true), back: 'friend-setup' },
  'picker-named-only': { title: 'Choose a friend', body: picker(true), foot: '<p id="selected-name">To rowan · Kings’ powers · Daily</p>' + button('Send invitation', 'sender-games', true), back: 'friend-setup', note: 'Named invites only. Sample alternative.' },
  'sender-games': { title: 'Your games', body: `<p class="sheet-lead">mira</p><h3 class="group-head">Invitations you send</h3>${inviteRow(false)}<p class="quiet-line">rowan can accept when they next open King Down.</p>${games}`, foot: button('New game', 'new-game', true), back: 'new-game' },
  'recipient-games': { title: 'Your games', body: `<p class="sheet-lead">rowan</p><h3 class="group-head">Invitations for you</h3>${inviteRow(true)}<h3 class="group-head">In play</h3>${row('lark', 'Your turn · Move 6 · Daily', 'flame')}`, foot: button('New game', 'new-game', true), back: 'new-game' },
  'game-limit-send': { title: 'Send invitation', body: `${summary}${notice('Finish a game first', 'You have 5 games with rowan. Finish one of them first.', 'View your games', 'sender-games')}<h3 class="group-head">Your choice</h3>${row('rowan', 'Your setup stays here', 'shadow', 'friend-picker')}<p class="quiet-line">No invitation is sent.</p>`, foot: button('Choose another friend', 'friend-picker'), back: 'friend-picker' },
  'game-limit-accept': { title: 'Your games', body: `<p class="sheet-lead">rowan</p>${notice('Finish a game first', 'You have 5 games with mira. Finish one to accept this invitation.', 'View your games', 'recipient-games')}<h3 class="group-head">Invitations for you</h3>${inviteRow(true)}<p class="quiet-line">This invitation stays open.</p>`, back: 'recipient-games' },
  'invite-limit': { title: 'Send invitation', body: `${notice('Two invitations are open', 'You sent rowan 2 invitations. Wait until they accept one.', 'View invitations', 'sender-games', 'A decline, cancellation or expiry frees a slot.')}<h3 class="group-head">Invitations to rowan</h3>${inviteRow(false)}${inviteRow(false, true)}`, foot: button('Choose another friend', 'friend-picker'), back: 'friend-picker' },
  'open-link-limit': { title: 'Share a link', body: `${stage}${notice('Two links are open', 'You have 2 open link invitations. Cancel one or wait for it to end.', 'View invitations', 'sender-games')}`, foot: button('Choose a friend', 'friend-picker'), back: 'friend-picker' },
  'link-share': { title: 'Share a link', body: share(false), foot: button('Your games', 'sender-games'), back: 'friend-picker' },
  'named-share': { title: 'Share with rowan', body: share(true), foot: button('Your games', 'sender-games'), back: 'sender-games' },
  'sign-in': { title: 'A friend', body: `${stage}<h3>Sign in to invite a friend.</h3><p>Set up the game after you sign in.</p><p class="quiet-line">Your local game stays saved.</p>${button('Sign in', 'signin-demo', true)}<p class="status" role="status"></p>`, back: 'new-game' },
};
const current = screens[screen] ?? screens['new-game'];
shell.innerHTML = `<p class="sample-note">${current.note ?? 'Sample only. All names and games are fake.'}</p><section class="sample-screen" data-sample="${screen}"><header class="new-game-head"><button class="game-action" type="button" data-go="${current.back}" aria-label="Back">${icon('return')}</button><h2 id="sample-title">${current.title}</h2></header><div class="new-game-body">${current.body}</div>${current.foot ? `<footer class="new-game-foot">${current.foot}</footer>` : ''}</section>`;
document.title = `${current.title} — King Down sample`;
function say(message) {
  let status = document.querySelector('.status');
  if (!status) { status = document.createElement('p'); status.className = 'status'; status.setAttribute('role', 'status'); document.querySelector('.new-game-body').append(status); }
  status.textContent = message;
  status.scrollIntoView({ block: 'nearest' });
}
document.addEventListener('click', event => {
  const pick = event.target.closest('[data-handle]');
  if (pick) {
    for (const candidate of document.querySelectorAll('[data-handle]')) { const selected = candidate === pick; candidate.setAttribute('aria-pressed', String(selected)); candidate.querySelector('.choice-mark').textContent = selected ? 'Selected' : '›'; }
    document.querySelector('#selected-name').textContent = `To ${pick.dataset.handle} · Kings’ powers · Daily`;
  }
  const target = event.target.closest('[data-go]')?.dataset.go;
  if (!target) return;
  if (screens[target]) { location.search = `?screen=${target}`; return; }
  const messages = { accepted: 'Sample: the game opens after acceptance.', declined: 'Sample: the invitation closes.', cancelled: 'Sample: the invitation closes.', 'share-demo': 'Sample only. No link is shared.', 'copy-demo': 'Sample code: K7QX2M. No code is copied.', 'join-demo': 'Sample only. No game opens.', 'local-demo': 'Sample only. No game starts.', 'signin-demo': 'Sample only. Sign-in does not start.' };
  say(messages[target] || 'Sample only.');
});
document.querySelector('#lookup')?.addEventListener('submit', event => {
  event.preventDefault();
  const handle = document.querySelector('#handle').value.trim().toLowerCase();
  document.querySelector('#lookup-result').innerHTML = handle === 'finch' ? choice('finch', 'Player found', 'mud') : '<p>Player not found. Check the handle.</p>';
});
