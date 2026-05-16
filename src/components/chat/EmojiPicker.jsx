import { useState } from 'react';

const CATEGORIES = [
  { icon:'😀', name:'Smileys', emojis:['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😔','😪','🤤','😴','😷','🤒','🤕','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿'] },
  { icon:'👋', name:'People', emojis:['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁','👅','👄','💋','🫦','👤','👥'] },
  { icon:'🐶', name:'Animals', emojis:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦕','🦖','🦎','🐊','🦍','🦧','🦣'] },
  { icon:'🍎', name:'Food', emojis:['🍎','🍊','🍋','🍇','🍓','🫐','🍈','🍑','🍒','🍌','🍍','🥭','🍉','🍐','🥝','🍅','🫒','🥥','🥑','🍆','🥔','🥕','🌽','🌶','🥒','🥬','🧄','🧅','🥦','🫑','🍄','🥜','🌰','🍞','🥐','🥖','🥨','🥯','🧀','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕'] },
  { icon:'🏠', name:'Places', emojis:['🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩','🕋','⛲','⛺','🌁','🌃','🏙','🌄','🌅','🌆','🌇','🌉','♾','🎠','🎡','🎢','💈','🎪','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚌','🚍','🚎','🚐'] },
  { icon:'💡', name:'Objects', emojis:['💡','🔦','🕯','🪔','💰','💴','💵','💸','💳','💹','✉','📧','📨','📩','📪','📫','📬','📭','📮','🗳','✏','✒','🖊','🖋','📝','📁','📂','🗂','📅','📆','🗒','🗓','📇','📈','📉','📊','📋','📌','📍','🗺','📎','🖇','📏','📐','✂','🗃','🗄','🗑','🔒','🔓','🔏','🔐','🔑','🗝','🔨','🪓','⛏','⚒','🛠','🗡','⚔','🔫','🧨','💣','🪃','🏹'] },
  { icon:'❤️', name:'Symbols', emojis:['❤','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣','💕','💞','💓','💗','💖','💘','💝','💟','☮','✝','☪','🕉','☸','✡','🔯','🕎','☯','☦','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🆚','💯','✅','❌','❎','🔝','🆙','🆒','🆕','🆓','🔃','🔄','🔙','🔛','🔜','🔚'] },
];

export default function EmojiPicker({ onSelect, onClose }) {
  const [cat, setCat] = useState(0);
  const [search, setSearch] = useState('');

  const emojis = search
    ? CATEGORIES.flatMap((c) => c.emojis).filter((e) => e.includes(search))
    : CATEGORIES[cat].emojis;

  return (
    <div className="emoji-picker" onClick={(e) => e.stopPropagation()}>
      {/* Search */}
      <div style={{ padding:'8px 10px', borderBottom:'1px solid var(--divider)' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji…"
          style={{ width:'100%', padding:'6px 10px', background:'var(--input-bg)', border:'none', borderRadius:6, color:'var(--text)', fontFamily:'inherit', fontSize:'.82rem', outline:'none' }}
          autoFocus
        />
      </div>
      {/* Category tabs */}
      {!search && (
        <div className="emoji-picker__categories">
          {CATEGORIES.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`emoji-picker__cat-btn${cat === i ? ' emoji-picker__cat-btn--active' : ''}`}
              title={c.name}
              onClick={() => setCat(i)}
            >
              {c.icon}
            </button>
          ))}
        </div>
      )}
      {/* Emoji grid */}
      <div className="emoji-picker__grid">
        {emojis.map((emoji) => (
          <button key={emoji} type="button" className="emoji-picker__btn" onClick={() => onSelect(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
