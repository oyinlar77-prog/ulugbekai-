import { useState, useRef, useEffect, useCallback } from "react";

const ONE_HOUR = 60 * 60 * 1000;
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
const NOW = Date.now();

async function callAI(messages, system = "", maxTokens = 800) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: system || "Sen Ulug'bek AI — O'zbekistonning aqlli yordamchisi. O'zbek tilida qisqa, foydali javob ber.",
        messages,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, text: data.content?.[0]?.text || "" };
  } catch (e) {
    return { ok: false, text: "", error: e.message };
  }
}

const INIT_MODULES = [
  { id:"chat",     icon:"💬", name:"AI Chat",           cat:"ai",      desc:"Aqlli suhbat",          lastUsed:NOW, uses:0, locked:true  },
  { id:"voice",    icon:"🎙️", name:"Ovozli Yordamchi",  cat:"ai",      desc:"200+ til, STT+TTS",     lastUsed:NOW, uses:0, locked:true  },
  { id:"avatar",   icon:"🎭", name:"Avatar",            cat:"ai",      desc:"Animatsion yuz",         lastUsed:NOW, uses:0, locked:true  },
  { id:"video",    icon:"🎬", name:"Video Generator",   cat:"media",   desc:"AI video stsenariy",    lastUsed:NOW, uses:0, locked:false },
  { id:"image",    icon:"🖼️", name:"Rasm & Dizayn",    cat:"media",   desc:"AI rasm yaratish",       lastUsed:NOW, uses:0, locked:false },
  { id:"social",   icon:"📱", name:"Ijtimoiy Tarmoqlar",cat:"social",  desc:"SMM & kontent",          lastUsed:NOW, uses:0, locked:false },
  { id:"money",    icon:"💰", name:"Pul Ishlash",       cat:"finance", desc:"Online daromad yo'llari",lastUsed:NOW, uses:0, locked:false },
  { id:"code",     icon:"💻", name:"Dasturchi AI",      cat:"dev",     desc:"Kod yozish & debug",     lastUsed:NOW, uses:0, locked:false },
  { id:"nocode",   icon:"🛠️", name:"No-Code Builder",   cat:"dev",     desc:"Kodsiz ilovalar",        lastUsed:NOW, uses:0, locked:false },
  { id:"bank",     icon:"🏦", name:"Bank Operatori",    cat:"finance", desc:"Moliyaviy maslahat",     lastUsed:NOW, uses:0, locked:false },
  { id:"gov",      icon:"🏛️", name:"Davlat Xizmatlari",cat:"civic",   desc:"Hujjat & ariza",         lastUsed:NOW, uses:0, locked:false },
  { id:"logistic", icon:"🚚", name:"Logistika AI",      cat:"finance", desc:"Yetkazib berish",        lastUsed:NOW, uses:0, locked:false },
  { id:"shop",     icon:"🛍️", name:"Online Do'kon",     cat:"finance", desc:"E-commerce yordamchi",  lastUsed:NOW, uses:0, locked:false },
  { id:"doctor",   icon:"🏥", name:"Tibbiy Maslahat",   cat:"health",  desc:"Sog'liq ma'lumotlari",  lastUsed:NOW, uses:0, locked:false },
  { id:"lawyer",   icon:"⚖️", name:"Huquqiy Maslahat",  cat:"civic",   desc:"Qonun & huquq",          lastUsed:NOW, uses:0, locked:false },
  { id:"seo",      icon:"🔍", name:"SEO Optimizer",     cat:"dev",     desc:"Sayt optim & tahlil",   lastUsed:NOW, uses:0, locked:false },
  { id:"translate",icon:"🌐", name:"Tarjimon Pro",      cat:"ai",      desc:"200+ til tarjima",       lastUsed:NOW, uses:0, locked:false },
  { id:"edu",      icon:"🎓", name:"Ta'lim AI",         cat:"learn",   desc:"O'rgatish & dars",      lastUsed:NOW, uses:0, locked:false },
  { id:"news",     icon:"📰", name:"Tech Yangiliklari", cat:"learn",   desc:"Texnologiya lenta",      lastUsed:NOW, uses:0, locked:false },
  { id:"files",    icon:"📂", name:"Fayl Menejeri",     cat:"system",  desc:"Telefon fayllar",        lastUsed:NOW, uses:0, locked:false },
];

const SOCIAL_LIST = [
  { icon:"📸", name:"Instagram", color:"#e1306c", tasks:["Post yoz","Hashtag tavsiya","Reel script","Bio optim","Caption viral"] },
  { icon:"✈️", name:"Telegram",  color:"#0088cc", tasks:["Kanal post","Bot xabar","Announcement","Guruh qoidalari","Reklama matni"] },
  { icon:"🎵", name:"TikTok",    color:"#ff0050", tasks:["Video g'oyasi","Caption yoz","Trend tahlil","Hook yoz","Duet g'oya"] },
  { icon:"▶️", name:"YouTube",   color:"#ff0000", tasks:["Sarlavha yoz","Tavsif yoz","Skript","SEO teglari","Thumbnail g'oya"] },
  { icon:"in", name:"LinkedIn",  color:"#0077b5", tasks:["Post yoz","CV optim","Cover letter","Network post","Article"] },
  { icon:"🐦", name:"Twitter/X", color:"#1da1f2", tasks:["Tweet yoz","Thread","Bio yoz","Viral post","Reply yoz"] },
  { icon:"👻", name:"Snapchat",  color:"#FFFC00", tasks:["Story g'oya","Caption","DM matni","Filter g'oya"] },
  { icon:"📌", name:"Pinterest", color:"#e60023", tasks:["Pin tavsif","Board nomi","SEO","Kontent reja"] },
];

const MONEY_LIST = [
  { icon:"📹", name:"YouTube Shorts AI",  earn:"$300-2000/oy", diff:"Oson",  how:"AI video → monetizatsiya → AdSense" },
  { icon:"✍️", name:"AI Blog/Maqola",    earn:"$100-800/oy",  diff:"Oson",  how:"ChatGPT/Claude → blog → Google reklama" },
  { icon:"🎨", name:"AI Rasm Sotish",    earn:"$200-1500/oy", diff:"O'rta", how:"Midjourney → Etsy/Gumroad → sotish" },
  { icon:"🤖", name:"Telegram Bot",      earn:"$50-500/oy",   diff:"O'rta", how:"Bot yaratish → kanalga ulash → to'lov" },
  { icon:"📱", name:"SMM Xizmati",       earn:"$300-1200/oy", diff:"Oson",  how:"AI kontent → mahalliy bizneslar → oylik" },
  { icon:"💻", name:"No-Code Ilovalar",  earn:"$500-5000/oy", diff:"O'rta", how:"Bubble/Glide → mijoz topish → loyiha" },
  { icon:"🎓", name:"Online Kurs Sotish",earn:"$300-3000/oy", diff:"O'rta", how:"AI kurs yozish → Udemy/Teachable" },
  { icon:"📈", name:"Crypto AI Signal",  earn:"$100-2000/oy", diff:"Qiyin", how:"AI tahlil → signal kanal → obuna" },
  { icon:"🚀", name:"Dropshipping",      earn:"$200-1500/oy", diff:"O'rta", how:"AI mahsulot → Shopify → reklama" },
  { icon:"🎧", name:"AI Podcast",        earn:"$50-600/oy",   diff:"Oson",  how:"AI skript → ElevenLabs → Spotify" },
  { icon:"📧", name:"Email Marketing",   earn:"$200-1000/oy", diff:"O'rta", how:"AI email → Mailchimp → mijoz" },
  { icon:"🔗", name:"Affiliate Marketing",earn:"$100-3000/oy",diff:"Oson",  how:"AI review → link → komissiya" },
];

function Avatar({ talking, thinking, color, size = 120 }) {
  const [blink, setBlink] = useState(false);
  const [tilt, setTilt] = useState(0);
  const [mouthH, setMouthH] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 2800 + Math.random() * 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (talking) {
      const t = setInterval(() => {
        setTilt((Math.random() - 0.5) * 6);
        setMouthH(Math.random() * 12);
      }, 220);
      return () => clearInterval(t);
    }
    setTilt(0);
    setMouthH(0);
  }, [talking]);

  const sc = size / 160;
  const eyeRy = blink ? 1 : 10;
  const mouthD = talking
    ? `M 58 122 Q 80 ${134 + mouthH} 102 122`
    : thinking
    ? "M 62 123 Q 80 120 98 123"
    : "M 60 121 Q 80 131 100 121";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {talking && [1, 2, 3].map(i => (
        <div key={i} style={{
          position: "absolute", inset: -10 * i,
          borderRadius: "50%",
          border: `1.5px solid ${color}`,
          animation: `ripR 1.5s ease ${i * 0.3}s infinite`,
          opacity: 0,
          pointerEvents: "none",
        }} />
      ))}
      <div style={{
        transform: `rotate(${tilt}deg) scale(${sc})`,
        transformOrigin: "center bottom",
        filter: `drop-shadow(0 0 18px ${color}66)`,
        animation: "avatarFloat 4s ease-in-out infinite",
      }}>
        <svg width="160" height="180" viewBox="0 0 160 180">
          <rect x="56" y="148" width="48" height="22" rx="12" fill={color} opacity=".85" />
          <rect x="68" y="138" width="24" height="16" rx="8" fill="#e8c9a0" />
          <ellipse cx="80" cy="90" rx="48" ry="52" fill="#f5d5a8" />
          <ellipse cx="80" cy="44" rx="48" ry="22" fill="#2a1a0e" />
          <ellipse cx="32" cy="72" rx="10" ry="24" fill="#2a1a0e" />
          <ellipse cx="128" cy="72" rx="10" ry="24" fill="#2a1a0e" />
          <rect x="32" y="42" width="96" height="30" fill="#2a1a0e" rx="4" />
          <ellipse cx="32" cy="92" rx="9" ry="13" fill="#e8c9a0" />
          <ellipse cx="128" cy="92" rx="9" ry="13" fill="#e8c9a0" />
          <ellipse cx="32" cy="92" rx="5" ry="8" fill="#d4a882" />
          <ellipse cx="128" cy="92" rx="5" ry="8" fill="#d4a882" />
          <path d={thinking ? "M 50 74 Q 62 68 70 74" : "M 50 72 Q 62 66 70 72"}
            stroke="#2a1a0e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d={thinking ? "M 90 74 Q 98 68 110 74" : "M 90 72 Q 98 66 110 72"}
            stroke="#2a1a0e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="62" cy="94" rx="13" ry={eyeRy} fill="white" />
          <ellipse cx="98" cy="94" rx="13" ry={eyeRy} fill="white" />
          {!blink && <>
            <ellipse cx="62" cy="96" rx="8" ry="8" fill={color} />
            <ellipse cx="98" cy="96" rx="8" ry="8" fill={color} />
            <ellipse cx="63" cy="97" rx="4.5" ry="4.5" fill="#0a0500" />
            <ellipse cx="99" cy="97" rx="4.5" ry="4.5" fill="#0a0500" />
            <circle cx="65" cy="95" r="2.2" fill="white" opacity=".9" />
            <circle cx="101" cy="95" r="2.2" fill="white" opacity=".9" />
          </>}
          <path d="M 77 106 Q 74 116 80 118 Q 86 116 83 106" stroke="#c09070" strokeWidth="1.5" fill="none" />
          <path d={mouthD} stroke="#8B4513" strokeWidth="2.5"
            fill={talking ? "#cc5555" : "none"} strokeLinecap="round" />
          {talking && <ellipse cx="80" cy="130" rx="8" ry="5" fill="#aa2222" />}
          {(talking || thinking) && <>
            <ellipse cx="46" cy="108" rx="11" ry="7" fill="#ffaaaa" opacity=".25" />
            <ellipse cx="114" cy="108" rx="11" ry="7" fill="#ffaaaa" opacity=".25" />
          </>}
          {thinking && [0, 1, 2].map(i => (
            <circle key={i} cx={108 + i * 12} cy={66 - i * 6} r="4.5" fill={color}
              style={{ animation: `tDotA 1s ease ${i * 0.25}s infinite alternate` }} />
          ))}
        </svg>
      </div>
      <div style={{
        position: "absolute", bottom: 6, right: 6,
        width: 13, height: 13, borderRadius: "50%",
        background: talking ? "#ff6b6b" : thinking ? "#ffd166" : "#06d6a0",
        border: "2px solid #070b16",
        animation: (talking || thinking) ? "blink 1s infinite" : "none",
      }} />
    </div>
  );
}

const Dots = ({ color }) => (
  <span style={{ display: "inline-flex", gap: 5, alignItems: "center", padding: "2px 0" }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 7, height: 7, borderRadius: "50%", background: color,
        animation: `tdot 1.2s ease ${i * 0.2}s infinite`,
      }} />
    ))}
  </span>
);

function MsgBubble({ msg, color, onSpeak }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 10, animation: "fadeUp .25s ease",
    }}>
      <div style={{
        maxWidth: "80%",
        padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
        background: isUser
          ? `linear-gradient(135deg, ${color}ee, ${color}aa)`
          : "rgba(255,255,255,0.08)",
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
        color: isUser ? "#080c18" : "#e8e8e8",
        fontSize: 14, lineHeight: 1.65,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        position: "relative",
        boxShadow: isUser ? `0 4px 14px ${color}33` : "none",
      }}>
        {msg.typing ? <Dots color={color} /> : msg.content}
        {!isUser && !msg.typing && (
          <button onClick={() => onSpeak(msg.content)} style={{
            position: "absolute", bottom: 4, right: 8,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, opacity: .4, padding: 2,
          }}>🔊</button>
        )}
      </div>
    </div>
  );
}

function timeLeft(lastUsed) {
  const deadline = lastUsed + ONE_YEAR;
  const rem = deadline - Date.now();
  if (rem <= 0) return "O'chirish vaqti!";
  const days = Math.floor(rem / 86400000);
  if (days > 60) return `${Math.floor(days / 30)} oy qoldi`;
  return `${days} kun qoldi`;
}

export default function App() {
  const [modules, setModules]       = useState(INIT_MODULES);
  const [removedMods, setRemoved]   = useState([]);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [sending, setSending]       = useState(false);
  const [talking, setTalking]       = useState(false);
  const [thinking, setThinking]     = useState(false);
  const [bubble, setBubble]         = useState("Salom! Men har soatda yangi narsa o'rganaman 🌟");
  const [tab, setTab]               = useState("chat");
  const [learnLog, setLearnLog]     = useState([]);
  const [discovering, setDiscover]  = useState(false);
  const [countdown, setCountdown]   = useState(ONE_HOUR);
  const [notifs, setNotifs]         = useState([]);
  const [showNotif, setShowNotif]   = useState(false);
  const [videoP, setVideoP]         = useState("");
  const [videoRes, setVideoRes]     = useState(null);
  const [videoLoad, setVideoLoad]   = useState(false);
  const [listening, setListening]   = useState(false);
  const [ttsOn, setTtsOn]           = useState(true);
  const [agentId, setAgentId]       = useState("chat");
  const [lastLearn, setLastLearn]   = useState(Date.now());

  const endRef    = useRef(null);
  const inputRef  = useRef(null);
  const synthRef  = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const recogRef  = useRef(null);
  const talkTimer = useRef(null);

  const color = "#C8A96E";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(Math.max(0, ONE_HOUR - (Date.now() - lastLearn)));
    }, 1000);
    return () => clearInterval(t);
  }, [lastLearn]);

  useEffect(() => {
    const t = setInterval(() => {
      discoverNew();
    }, ONE_HOUR);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      removeOldModules();
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNotif = useCallback((text, type = "info") => {
    const n = { id: Date.now(), text, type };
    setNotifs(p => [n, ...p].slice(0, 20));
    setShowNotif(true);
    setTimeout(() => setShowNotif(false), 4500);
  }, []);

  const animTalk = useCallback((ms = 3500) => {
    setTalking(true);
    clearTimeout(talkTimer.current);
    talkTimer.current = setTimeout(() => setTalking(false), ms);
  }, []);

  const speakText = useCallback((text) => {
    if (!ttsOn || !synthRef.current) return;
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 450));
    u.lang = "uz-UZ"; u.rate = 0.93; u.pitch = 1.05;
    u.onstart = () => setTalking(true);
    u.onend = () => setTalking(false);
    u.onerror = () => setTalking(false);
    synthRef.current.speak(u);
  }, [ttsOn]);

  const removeOldModules = useCallback(() => {
    const cutoff = Date.now() - ONE_YEAR;
    setModules(prev => {
      const active = [], removed = [];
      prev.forEach(m => {
        if (!m.locked && m.lastUsed < cutoff) {
          removed.push({ ...m, removedAt: Date.now() });
          addNotif(`🗑️ "${m.name}" — 1 yil ishlatilmadi, o'chirildi`, "warn");
          setLearnLog(p => [{
            time: new Date().toLocaleTimeString(),
            type: "remove",
            icon: m.icon,
            text: `"${m.name}" o'chirildi — 1 yil ishlatilmagan`,
          }, ...p].slice(0, 60));
        } else {
          active.push(m);
        }
      });
      if (removed.length) setRemoved(p => [...removed, ...p].slice(0, 30));
      return active;
    });
  }, [addNotif]);

  const discoverNew = useCallback(async () => {
    if (discovering) return;
    setDiscover(true);
    setLastLearn(Date.now());
    setBubble("🌐 Internet orqali yangi texnologiya qidiryapman...");

    const result = await callAI(
      [{
        role: "user",
        content: `2025-2026 yillardagi eng yangi, trend AI yoki texnologiya funksiyasidan BITTA tanlang va JSON qaytaring:
{"id":"unique_snake_case","icon":"emoji","name":"O'zbek tilida nom","cat":"ai|media|finance|dev|social|health|learn","desc":"Qisqa ta'rif O'zbek tilida","earning":"$X-Y/oy yoki bo'sh","tech":"Asosiy texnologiya"}

Faqat JSON. Hech qanday izoh, markdown yoki qo'shimcha matn yo'q.`,
      }],
      "Faqat toza JSON qaytargin. Hech qanday qo'shimcha matn yo'q.",
      250
    );

    if (result.ok && result.text) {
      try {
        const clean = result.text.replace(/```[\w]*|```/g, "").trim();
        const parsed = JSON.parse(clean);
        if (parsed?.name && parsed?.icon) {
          const newMod = {
            id:       `auto_${Date.now()}`,
            icon:     parsed.icon,
            name:     parsed.name,
            cat:      parsed.cat || "ai",
            desc:     parsed.desc || "",
            earning:  parsed.earning || "",
            tech:     parsed.tech || "",
            lastUsed: Date.now(),
            uses:     0,
            locked:   false,
            auto:     true,
            addedAt:  Date.now(),
          };
          setModules(prev => {
            if (prev.find(m => m.name === newMod.name)) return prev;
            return [...prev, newMod];
          });
          setLearnLog(p => [{
            time: new Date().toLocaleTimeString(),
            type: "add",
            icon: newMod.icon,
            text: `"${newMod.name}" qo'shildi${newMod.earning ? ` — ${newMod.earning}` : ""}`,
            tech: newMod.tech,
          }, ...p].slice(0, 60));
          addNotif(`✨ Yangi: ${newMod.name}`, "success");
          setBubble(`✨ Yangi funksiya: ${newMod.name}!`);
          setTimeout(() => setBubble(""), 5000);
        }
      } catch { setBubble(""); }
    } else {
      setBubble("");
    }
    setDiscover(false);
  }, [discovering, addNotif]);

  const sendMessage = useCallback(async (txtArg) => {
    const text = (txtArg || input).trim();
    if (!text || sending) return;

    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setSending(true);
    setThinking(true);
    setBubble("O'ylamoqda...");

    setModules(prev => prev.map(m =>
      m.id === agentId ? { ...m, lastUsed: Date.now(), uses: m.uses + 1 } : m
    ));

    const systemPrompts = {
      chat:      `Sen Ulug'bek AI — foydalanuvchining aqlli yordamchisi. Samimiy, qisqa, foydali javob ber. O'zbek tilida gapir.`,
      code:      "Sen ekspert dasturchi. Kodlarni ```kod_tili\n...\n``` formatida yoz. O'zbek tilida tushuntir.",
      bank:      `Sen bank operatorisan. Hisob, karta, kredit, o'tkazma, foiz bo'yicha aniq ma'lumot ber. O'zbek tilida.`,
      gov:       `Sen davlat xizmatlari ekspertisan. Hujjatlar, ariza berish, muddatlar, portallar haqida aniq gapir. O'zbek tilida.`,
      doctor:    `Sen tibbiy ma'lumot beruvchi. Faqat umumiy ma'lumot ber, shifokorga murojaat qilishni tavsiya et. O'zbek tilida.`,
      lawyer:    `Sen huquqiy maslahatchi. O'zbekiston qonunlari, huquqlar, jarayonlar haqida tushuntir. O'zbek tilida.`,
      translate: `Sen tarjimonsan. Berilgan matnni so'ralgan tilga aniq tarjima qil. Kerakli izohlarni qo'sh.`,
      social:    `Sen SMM mutaxassis. Viral, kreativ, O'zbek auditoriyasiga mos kontent yarat. O'zbek tilida.`,
      money:     `Sen online pul ishlash ekspertisan. Amaliy, qadamba-qadam yo'l xaritasi ber. O'zbek tilida.`,
      edu:       `Sen sabr-toqatli o'qituvchi. Har qanday mavzuni oddiy, misollar bilan tushuntir. O'zbek tilida.`,
    };
    const sys = systemPrompts[agentId] || `Sen Ulug'bek AI yordamchi. O'zbek tilida qisqa, foydali javob ber.`;

    const result = await callAI(history, sys);

    if (result.ok) {
      const reply = result.text;
      setMessages([...history, { role: "assistant", content: reply }]);
      setBubble("");
      setThinking(false);
      animTalk(Math.min(reply.length * 28, 5000));
      if (ttsOn) speakText(reply);
    } else {
      const errMsg = `❌ Ulanish xatosi: ${result.error || "Noma'lum xato"}\n\nIltimos:\n• Internet aloqasini tekshiring\n• Sahifani yangilang (F5)\n• Qayta urinib ko'ring`;
      setMessages([...history, { role: "assistant", content: errMsg }]);
      setBubble("");
      setThinking(false);
    }

    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [input, messages, sending, agentId, animTalk, speakText, ttsOn]);

  const toggleListen = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      addNotif("⚠️ Chrome yoki Edge brauzerida ishlating", "warn");
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.lang = "uz-UZ";
    r.interimResults = false;
    r.onstart  = () => setListening(true);
    r.onresult = e => {
      const t = e.results[0][0].transcript;
      sendMessage(t);
    };
    r.onend   = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start();
  }, [listening, sendMessage, addNotif]);

  const genVideo = async () => {
    if (!videoP.trim()) return;
    setVideoLoad(true);
    setModules(prev => prev.map(m =>
      m.id === "video" ? { ...m, lastUsed: Date.now(), uses: m.uses + 1 } : m
    ));
    const result = await callAI(
      [{
        role: "user",
        content: `Video mavzusi: "${videoP}"\n\nFaqat JSON qaytargin (hech qanday qo'shimcha matn yo'q):\n{"title":"...","duration":"...s","style":"...","platform":"TikTok/YouTube/Instagram","scenes":[{"time":"0-5s","visual":"...","voiceover":"..."},{"time":"5-12s","visual":"...","voiceover":"..."},{"time":"12-20s","visual":"...","voiceover":"..."}],"music":"...","hook":"...","cta":"...","tips":"..."}`,
      }],
      "Faqat toza JSON qaytargin. Hech qanday izoh, markdown yo'q.",
      700
    );
    if (result.ok) {
      try {
        const clean = result.text.replace(/```[\w]*|```/g, "").trim();
        setVideoRes(JSON.parse(clean));
      } catch {
        setVideoRes({ title: "Qayta urining", scenes: [], tips: result.text.slice(0, 200) });
      }
    } else {
      setVideoRes({ title: "Ulanish xatosi", scenes: [], tips: result.error });
    }
    setVideoLoad(false);
  };

  const hh = String(Math.floor(countdown / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((countdown % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((countdown % 60000) / 1000)).padStart(2, "0");
  const cdStr = `${hh}:${mm}:${ss}`;

  const activeMods = modules.filter(m => m);
  const autoMods   = modules.filter(m => m.auto);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", background: "#070b16",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes tdot{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-8px);opacity:1}}
        @keyframes avatarFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes ripR{0%{transform:scale(.8);opacity:.5}100%{transform:scale(2.4);opacity:0}}
        @keyframes tDotA{from{transform:translateY(0);opacity:.3}to{transform:translateY(-9px);opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes glow{0%,100%{box-shadow:0 0 10px #C8A96E33}50%{box-shadow:0 0 24px #C8A96E77}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:3px}
        input,textarea{outline:none;font-family:inherit}
        textarea{resize:none}
        button{font-family:inherit;cursor:pointer;transition:all .18s}
        button:active{transform:scale(.95)}
      `}</style>

      <div style={{
        position: "fixed", inset: 0,
        background: `radial-gradient(ellipse at 15% 10%, ${color}14 0%, transparent 45%),
                     radial-gradient(ellipse at 85% 85%, #60a5fa0a 0%, transparent 45%)`,
        pointerEvents: "none", zIndex: 0,
      }} />

      {showNotif && notifs[0] && (
        <div style={{
          position: "fixed", top: 72, right: 10, zIndex: 500,
          animation: "slideDown .3s ease", maxWidth: 290,
        }}>
          <div style={{
            background: "#0c1220",
            border: `1px solid ${notifs[0].type === "success" ? "#06d6a0" : notifs[0].type === "warn" ? "#ff6b6b" : color}55`,
            borderRadius: 13, padding: "10px 14px", backdropFilter: "blur(14px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}>
            <div style={{ color: "#e8e8e8", fontSize: 12.5 }}>{notifs[0].text}</div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{
        position: "relative", zIndex: 20,
        padding: "10px 13px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 9,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(16px)",
      }}>
        <div style={{
          width: 35, height: 35, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${color}, #7a5810)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 19, animation: "glow 3s infinite",
        }}>⭐</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color, fontWeight: 800, fontSize: 14, letterSpacing: .3 }}>ULUG'BEK AI</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9.5, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: "#06d6a0", fontSize: 8 }}>●</span>
            <span style={{ color }}>{activeMods.length}</span> modul aktiv
            {autoMods.length > 0 && <span style={{ color: "#06d6a0" }}>· +{autoMods.length} AI qo'shgan</span>}
          </div>
        </div>

        <div style={{
          padding: "5px 10px", borderRadius: 9,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${color}33`, textAlign: "center", flexShrink: 0,
        }}>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 8, letterSpacing: .4 }}>KEYINGI</div>
          <div style={{
            color: discovering ? "#06d6a0" : color,
            fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums",
            animation: discovering ? "blink .6s infinite" : "none",
          }}>
            {discovering ? "🌐 ..." : cdStr}
          </div>
        </div>

        <button onClick={discoverNew} disabled={discovering} title="Hozir yangi funksiya qo'shish" style={{
          background: `${color}18`, border: `1px solid ${color}44`,
          borderRadius: 9, width: 33, height: 33, color: discovering ? "rgba(255,255,255,0.25)" : color,
          fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ display: "inline-block", animation: discovering ? "spin 1s linear infinite" : "none" }}>🔄</span>
        </button>

        <button onClick={() => { synthRef.current?.cancel(); setTtsOn(!ttsOn); }} style={{
          background: ttsOn ? "rgba(6,214,160,0.12)" : "rgba(255,107,107,0.12)",
          border: `1px solid ${ttsOn ? "rgba(6,214,160,0.3)" : "rgba(255,107,107,0.3)"}`,
          borderRadius: 9, width: 33, height: 33,
          color: ttsOn ? "#06d6a0" : "#ff6b6b",
          fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {ttsOn ? "🔊" : "🔇"}
        </button>

        <button onClick={() => setShowNotif(!showNotif)} style={{
          position: "relative", background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 9, width: 33, height: 33,
          color: "rgba(255,255,255,0.45)", fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          🔔
          {notifs.length > 0 && (
            <span style={{
              position: "absolute", top: 5, right: 5,
              width: 7, height: 7, borderRadius: "50%",
              background: "#ff6b6b", border: "1px solid #070b16",
            }} />
          )}
        </button>
      </div>

      {/* AVATAR + TABS */}
      <div style={{
        position: "relative", zIndex: 5,
        display: "flex", alignItems: "center", gap: 11,
        padding: "10px 13px 8px",
        background: "rgba(0,0,0,0.14)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ flexShrink: 0 }}>
          <Avatar talking={talking} thinking={thinking} color={color} size={105} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {bubble && (
            <div style={{
              background: `${color}1a`, border: `1.5px solid ${color}44`,
              borderRadius: "12px 12px 12px 3px",
              padding: "7px 11px", marginBottom: 7,
              color: "#e8e8e8", fontSize: 11.5, lineHeight: 1.55,
              animation: "fadeUp .3s ease",
            }}>
              {bubble}
            </div>
          )}

          <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
            {[
              { id: "chat",    icon: "💬", label: "Chat"    },
              { id: "video",   icon: "🎬", label: "Video"   },
              { id: "social",  icon: "📱", label: "Social"  },
              { id: "money",   icon: "💰", label: "Pul"     },
              { id: "modules", icon: "🧩", label: "Modullar"},
              { id: "learn",   icon: "🧠", label: "Log"     },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "5px 9px", borderRadius: 14, whiteSpace: "nowrap",
                border: `1px solid ${tab === t.id ? color : "rgba(255,255,255,0.09)"}`,
                background: tab === t.id ? `${color}22` : "rgba(255,255,255,0.04)",
                color: tab === t.id ? color : "rgba(255,255,255,0.38)",
                fontSize: 10.5, fontWeight: tab === t.id ? 700 : 400,
                display: "flex", alignItems: "center", gap: 3,
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 5 }}>

        {/* CHAT TAB */}
        {tab === "chat" && (
          <div style={{ padding: "12px 13px" }}>
            <div style={{ display: "flex", gap: 5, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
              {[
                { id:"chat",     icon:"💬", name:"Umumiy"   },
                { id:"code",     icon:"💻", name:"Kod"      },
                { id:"bank",     icon:"🏦", name:"Bank"     },
                { id:"gov",      icon:"🏛️", name:"Davlat"   },
                { id:"doctor",   icon:"🏥", name:"Tibbiy"   },
                { id:"lawyer",   icon:"⚖️", name:"Huquq"    },
                { id:"translate",icon:"🌐", name:"Tarjima"  },
                { id:"edu",      icon:"🎓", name:"Ta'lim"   },
              ].map(a => (
                <button key={a.id} onClick={() => setAgentId(a.id)} style={{
                  padding: "4px 10px", borderRadius: 12, whiteSpace: "nowrap",
                  border: `1px solid ${agentId === a.id ? color : "rgba(255,255,255,0.08)"}`,
                  background: agentId === a.id ? `${color}22` : "rgba(255,255,255,0.04)",
                  color: agentId === a.id ? color : "rgba(255,255,255,0.35)",
                  fontSize: 11, display: "flex", alignItems: "center", gap: 4,
                }}>
                  {a.icon} {a.name}
                </button>
              ))}
            </div>

            {messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.22)", fontSize: 13 }}>
                <div style={{ fontSize: 34, marginBottom: 10 }}>💬</div>
                <div style={{ marginBottom: 16 }}>Suhbat boshlang!</div>
                <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                  {[
                    "Salom! Nima qila olasan?",
                    "Pul ishlash usullari",
                    "Python kodi yoz",
                    "AI yangiliklari",
                    "O'zbekiston qonunlari",
                  ].map(h => (
                    <button key={h} onClick={() => sendMessage(h)} style={{
                      background: `${color}18`, border: `1px solid ${color}33`,
                      borderRadius: 18, padding: "6px 13px", color, fontSize: 11.5,
                    }}>{h}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <MsgBubble key={i} msg={m} color={color} onSpeak={speakText} />
              ))
            )}
            <div ref={endRef} />
          </div>
        )}

        {/* VIDEO TAB */}
        {tab === "video" && (
          <div style={{ padding: "13px" }}>
            <div style={{ color, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>🎬 AI Video Generator</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, marginBottom: 12 }}>
              Mavzuni kiriting — stsenariy, kadrlar, ovoz matni, maslahat
            </div>
            <div style={{ display: "flex", gap: 7, marginBottom: 9 }}>
              <input
                value={videoP} onChange={e => setVideoP(e.target.value)}
                onKeyDown={e => e.key === "Enter" && genVideo()}
                placeholder="Masalan: O'zbek oshxonasida viral TikTok..."
                style={{
                  flex: 1, background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${color}44`, borderRadius: 10,
                  padding: "9px 13px", color: "#e8e8e8", fontSize: 13,
                }}
              />
              <button onClick={genVideo} disabled={videoLoad || !videoP.trim()} style={{
                padding: "9px 14px", borderRadius: 10,
                background: videoLoad || !videoP.trim() ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${color}, ${color}99)`,
                border: "none",
                color: videoLoad || !videoP.trim() ? "rgba(255,255,255,0.25)" : "#080c18",
                fontWeight: 700, fontSize: 12, whiteSpace: "nowrap",
              }}>
                {videoLoad ? "⏳..." : "🎬 Yaratish"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
              {["TikTok Viral 🔥", "YouTube Short", "Instagram Reel", "Mahsulot Reklama", "Motivatsiya"].map(p => (
                <button key={p} onClick={() => setVideoP(p + " uchun video")} style={{
                  background: `${color}12`, border: `1px solid ${color}33`,
                  borderRadius: 13, padding: "4px 10px", color, fontSize: 11,
                }}>{p}</button>
              ))}
            </div>
            {videoRes && (
              <div style={{
                background: "rgba(255,255,255,0.04)", border: `1px solid ${color}33`,
                borderRadius: 13, padding: "13px", animation: "fadeUp .3s ease",
              }}>
                <div style={{ color, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                  🎬 {videoRes.title} {videoRes.duration && `· ${videoRes.duration}`}
                </div>
                {videoRes.hook && (
                  <div style={{ background: `${color}15`, borderRadius: 8, padding: "7px 10px", marginBottom: 8, color: color, fontSize: 12 }}>
                    🎣 Hook: {videoRes.hook}
                  </div>
                )}
                {videoRes.scenes?.map((s, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 9, marginBottom: 7,
                    padding: "8px 10px", background: "rgba(255,255,255,0.04)",
                    borderRadius: 8, borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ color, fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1, minWidth: 36 }}>{s.time}</div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{s.visual}</div>
                      {s.voiceover && <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3, fontStyle: "italic" }}>🗣️ {s.voiceover}</div>}
                    </div>
                  </div>
                ))}
                {videoRes.music    && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 5 }}>🎵 Musiqa: {videoRes.music}</div>}
                {videoRes.platform && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>📲 Platform: {videoRes.platform}</div>}
                {videoRes.cta      && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>👉 CTA: {videoRes.cta}</div>}
                {videoRes.tips     && (
                  <div style={{ marginTop: 8, padding: "8px 11px", background: `${color}12`, borderRadius: 8, color, fontSize: 11.5 }}>
                    💡 {videoRes.tips}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SOCIAL TAB */}
        {tab === "social" && (
          <div style={{ padding: "13px" }}>
            <div style={{ color, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>📱 Ijtimoiy Tarmoqlar AI</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, marginBottom: 12 }}>
              Platforma tanlang va kontent turini bosing
            </div>
            {SOCIAL_LIST.map(p => (
              <div key={p.name} style={{
                marginBottom: 10, padding: "12px 13px", borderRadius: 13,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: p.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, color: "#fff",
                  }}>{p.icon}</div>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {p.tasks.map(t => (
                    <button key={t} onClick={() => {
                      setModules(prev => prev.map(m => m.id === "social" ? { ...m, lastUsed: Date.now(), uses: m.uses + 1 } : m));
                      sendMessage(`${p.name} uchun ${t} — viral, kreativ, O'zbek auditoriyasiga mos`);
                      setTab("chat");
                    }} style={{
                      background: `${p.color}22`, border: `1px solid ${p.color}44`,
                      borderRadius: 13, padding: "5px 10px", color: p.color, fontSize: 11,
                    }}>{t}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MONEY TAB */}
        {tab === "money" && (
          <div style={{ padding: "13px" }}>
            <div style={{ color, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>💰 Online Pul Ishlash</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, marginBottom: 12 }}>
              Bosing → AI qadama-qadam yo'l xaritasi beradi
            </div>
            {MONEY_LIST.map((idea, i) => (
              <div key={i} onClick={() => {
                setModules(prev => prev.map(m => m.id === "money" ? { ...m, lastUsed: Date.now(), uses: m.uses + 1 } : m));
                sendMessage(`"${idea.name}" usuli bilan pul ishlash bo'yicha qadama-qadam yo'l xaritasi ber. O'zbekiston uchun mos, amaliy.`);
                setTab("chat");
              }} style={{
                display: "flex", alignItems: "center", gap: 11,
                padding: "11px 13px", marginBottom: 7, borderRadius: 12,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer",
              }}>
                <div style={{ fontSize: 26, flexShrink: 0 }}>{idea.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "rgba(255,255,255,0.82)", fontWeight: 600, fontSize: 13 }}>{idea.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{idea.how}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: "#06d6a0", fontWeight: 700, fontSize: 12 }}>{idea.earn}</div>
                  <div style={{
                    color: idea.diff === "Oson" ? "#06d6a0" : idea.diff === "O'rta" ? "#ffd166" : "#ff6b6b",
                    fontSize: 10, marginTop: 2,
                  }}>{idea.diff}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODULES TAB */}
        {tab === "modules" && (
          <div style={{ padding: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ color, fontWeight: 700, fontSize: 14 }}>🧩 Modullar — {activeMods.length} aktiv</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
                  Bosganda — AI shu modul bo'yicha javob beradi
                </div>
              </div>
              <button onClick={discoverNew} disabled={discovering} style={{
                background: `${color}18`, border: `1px solid ${color}44`,
                borderRadius: 8, padding: "5px 11px", color, fontSize: 11,
              }}>
                {discovering ? "⏳..." : "🔄 Yangilash"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {modules.map(m => {
                const age = Date.now() - m.lastUsed;
                const danger = !m.locked && age > ONE_YEAR * 0.85;
                return (
                  <div key={m.id} onClick={() => {
                    setAgentId(m.id);
                    setModules(prev => prev.map(x => x.id === m.id ? { ...x, lastUsed: Date.now(), uses: x.uses + 1 } : x));
                    setTab("chat");
                  }} style={{
                    padding: "10px 11px", borderRadius: 11, cursor: "pointer",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${m.auto ? color + "44" : danger ? "rgba(255,107,107,0.35)" : "rgba(255,255,255,0.09)"}`,
                    transition: "all .2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 20 }}>{m.icon}</span>
                      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                        {m.auto   && <span style={{ background: `${color}22`, color, fontSize: 8, padding: "1px 5px", borderRadius: 5 }}>AI</span>}
                        {m.locked && <span style={{ background: "rgba(6,214,160,0.15)", color: "#06d6a0", fontSize: 8, padding: "1px 5px", borderRadius: 5 }}>🔒</span>}
                        {danger   && <span style={{ background: "rgba(255,107,107,0.2)", color: "#ff6b6b", fontSize: 8, padding: "1px 5px", borderRadius: 5 }}>⚠️</span>}
                      </div>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>{m.desc}</div>
                    {m.earning && <div style={{ color: "#06d6a0", fontSize: 10, marginTop: 2 }}>{m.earning}</div>}
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, marginTop: 3 }}>
                      {m.locked ? "Himoyalangan" : m.uses > 0 ? `👆 ${m.uses}x · ${timeLeft(m.lastUsed)}` : timeLeft(m.lastUsed)}
                    </div>
                  </div>
                );
              })}
            </div>

            {removedMods.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 700, marginBottom: 7, textTransform: "uppercase", letterSpacing: .8 }}>
                  🗑️ O'chirilgan modullar ({removedMods.length})
                </div>
                {removedMods.map((m, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 10px", borderRadius: 8, marginBottom: 4,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                    opacity: .55,
                  }}>
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{m.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>1 yil ishlatilmadi</div>
                    </div>
                    <button onClick={() => {
                      setRemoved(p => p.filter((_, j) => j !== i));
                      setModules(prev => [...prev, { ...m, active: true, lastUsed: Date.now() }]);
                    }} style={{
                      background: `${color}15`, border: `1px solid ${color}33`,
                      borderRadius: 6, padding: "3px 9px", color, fontSize: 10,
                    }}>Tiklash</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEARN LOG TAB */}
        {tab === "learn" && (
          <div style={{ padding: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ color, fontWeight: 700, fontSize: 14 }}>🧠 O'z-o'zini O'rganish</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
                  Har 1 soatda yangi · 1 yil ishlatilmagan o'chiriladi
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, marginBottom: 2 }}>KEYINGI</div>
                <div style={{ color, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{cdStr}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Aktiv",      val: activeMods.length,  color: "#06d6a0", icon: "🟢" },
                { label: "AI qo'shdi", val: autoMods.length,    color,            icon: "✨" },
                { label: "O'chirildi", val: removedMods.length, color: "#ff6b6b", icon: "🗑️" },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "10px", borderRadius: 10, textAlign: "center",
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${s.color}22`,
                }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{s.icon}</div>
                  <div style={{ color: s.color, fontWeight: 800, fontSize: 20 }}>{s.val}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{
              padding: "11px 13px", borderRadius: 11,
              background: `${color}0f`, border: `1px solid ${color}33`, marginBottom: 14,
            }}>
              <div style={{ color, fontWeight: 600, fontSize: 12, marginBottom: 7 }}>⚙️ Avtomatik qoidalar:</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11.5, lineHeight: 1.75 }}>
                ⏰ <b style={{ color }}>Har 1 soatda</b> — internet orqali yangi funksiya qo'shiladi<br />
                📅 <b style={{ color: "#ff6b6b" }}>1 yil</b> ishlatilmagan funksiyalar o'chiriladi<br />
                🔒 <b style={{ color: "#06d6a0" }}>Chat, Ovoz, Avatar</b> — hech qachon o'chirilmaydi<br />
                ♻️ O'chirilgan funksiyalarni istalgan vaqt tiklash mumkin
              </div>
            </div>

            {learnLog.length > 0 ? learnLog.map((log, i) => (
              <div key={i} style={{
                padding: "9px 11px", marginBottom: 6, borderRadius: 9, animation: "fadeUp .2s ease",
                background: log.type === "add" ? "rgba(6,214,160,0.07)" : log.type === "remove" ? "rgba(255,107,107,0.07)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${log.type === "add" ? "rgba(6,214,160,0.2)" : log.type === "remove" ? "rgba(255,107,107,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}>
                <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 9.5, marginBottom: 3 }}>🕐 {log.time}</div>
                <div style={{ color: log.type === "add" ? "#06d6a0" : log.type === "remove" ? "#ff6b6b" : "rgba(255,255,255,0.55)", fontSize: 12 }}>
                  {log.icon} {log.text}
                </div>
                {log.tech && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10.5, marginTop: 3 }}>🔧 {log.tech}</div>}
              </div>
            )) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12.5, padding: "24px 0" }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>🧠</div>
                O'rganish logi hali bo'sh.<br />
                Har 1 soatda yangi funksiya qo'shiladi.
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM INPUT */}
      <div style={{
        position: "relative", zIndex: 20,
        padding: "8px 12px 14px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)",
      }}>
        <div style={{
          display: "flex", gap: 7,
          background: "rgba(255,255,255,0.05)",
          border: `1.5px solid ${sending ? color + "66" : "rgba(255,255,255,0.09)"}`,
          borderRadius: 14, padding: "9px 11px",
          transition: "border-color .25s",
          boxShadow: sending ? `0 0 16px ${color}22` : "none",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ulug'bek AI ga yozing..."
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none",
              color: "#e8e8e8", fontSize: 14, lineHeight: 1.5,
              maxHeight: 96, overflowY: "auto",
            }}
          />

          <button onClick={toggleListen} title="Ovozli kiritish" style={{
            width: 36, height: 36, borderRadius: 9, alignSelf: "flex-end",
            background: listening ? `${color}30` : "rgba(255,255,255,0.07)",
            border: `1.5px solid ${listening ? color : "rgba(255,255,255,0.1)"}`,
            color: listening ? color : "rgba(255,255,255,0.4)",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            animation: listening ? "blink 1s infinite" : "none",
          }}>🎙️</button>

          <button onClick={() => sendMessage()} disabled={sending || !input.trim()} style={{
            width: 36, height: 36, borderRadius: 9, alignSelf: "flex-end",
            background: sending || !input.trim()
              ? "rgba(255,255,255,0.07)"
              : `linear-gradient(135deg, ${color}, ${color}99)`,
            border: "none",
            color: sending || !input.trim() ? "rgba(255,255,255,0.2)" : "#080c18",
            fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: sending || !input.trim() ? "none" : `0 4px 12px ${color}44`,
          }}>
            {sending
              ? <span style={{ width: 14, height: 14, border: `2px solid ${color}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
              : "➤"}
          </button>
        </div>

        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.12)", fontSize: 9.5, marginTop: 5 }}>
          ⏰ Har 1 soatda yangilanadi · 📅 1 yil ishlatilmagan o'chiriladi · 🇺🇿 Ulug'bek AI v5
        </div>
      </div>
    </div>
  );
}
