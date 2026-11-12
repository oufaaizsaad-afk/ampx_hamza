// AMPX — site vitrine. Aucune dépendance.

// Envoi des demandes de démo via Web3Forms (https://web3forms.com).
// Colle ici la clé d'accès reçue sur contact@ampx.fr. Elle peut être publique :
// elle permet seulement d'envoyer des messages vers cette adresse.
const WEB3FORMS_KEY = "";
const CONTACT_EMAIL = "contact@ampx.fr";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Navigation */
const nav = $("#nav");
const links = $("#nav-links");
const toggle = $("#nav-toggle");
const closeMenu = () => { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
links.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

/* Apparitions au défilement */
$$("[data-delay]").forEach((el) => el.style.setProperty("--d", el.dataset.delay));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
$$(".reveal").forEach((el) => io.observe(el));

/* Texte du constat : mots révélés au fil du défilement */
const big = $("#big");
const wrapWords = (node) => {
  [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((t) => {
        if (!t.trim()) return frag.append(t);
        const s = document.createElement("span");
        s.className = "w"; s.textContent = t; frag.append(s);
      });
      n.replaceWith(frag);
    } else wrapWords(n);
  });
};
wrapWords(big);
const words = $$(".w", big);

/* Boucle de défilement : nav, parallaxe, mots */
const layers = $$("[data-parallax]");
let ticking = false;
const onScroll = () => {
  const y = scrollY;
  nav.classList.toggle("scrolled", y > 40);
  if (!reduced) {
    if (y < innerHeight * 1.4) layers.forEach((l) => { l.style.translate = `0 ${(y * +l.dataset.parallax).toFixed(1)}px`; });
    const r = big.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle("on", i < n));
  }
  ticking = false;
};
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

const fr = (n, d = 1) => n.toFixed(d).replace(".", ",");
const every = (ms, fn) => { if (!reduced) setInterval(() => { if (!document.hidden) fn(); }, ms); };

/* Puissance de la maquette */
const kws = $$(".kw-live");
let power = 86.4;
every(1800, () => { power = Math.min(92, Math.max(80, power + (Math.random() - 0.5) * 1.8)); kws.forEach((el) => { el.textContent = fr(power); }); });

/* Grille d'état des prises */
const cells = $("#cells");
const N = 39;
const state = Array.from({ length: N }, (_, i) => (i % 11 === 7 ? "off" : i % 3 === 0 ? "charge" : ""));
cells.innerHTML = state.map((s) => `<i class="${s}"></i>`).join("");
every(900, () => {
  const i = Math.floor(Math.random() * N);
  if (state[i] === "off") return;
  state[i] = state[i] ? "" : "charge";
  cells.children[i].className = state[i];
});

/* Partage de puissance : courbes de délestage (illustration) */
const LIMIT = 60, YMAX = 100, T0 = 6, T1 = 24, CW = 1000, CH = 320, CAR_KW = 11;
const gauss = (t, m, s) => Math.exp(-0.5 * ((t - m) / s) ** 2);
const smooth = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
const win = (t, a, b, c, d) => smooth(a, b, t) * (1 - smooth(c, d, t));
const building = (t) => 10 + 26 * gauss(t, 9.5, 1.3) + 14 * gauss(t, 13.2, 1.1) + 34 * gauss(t, 19, 1.4);
const demand = (t) => 33 * win(t, 7, 8, 16.6, 17.4) + 44 * win(t, 17.6, 18.6, 22.8, 23.6);
const at = (t) => { const b = building(t), d = demand(t), ev = Math.max(0, Math.min(d, LIMIT - b)); return { b, d, ev }; };
const cx = (t) => ((t - T0) / (T1 - T0)) * CW;
const cy = (k) => CH - (k / YMAX) * CH;

const chart = $("#lb-chart");
const pts = Array.from({ length: 241 }, (_, i) => { const t = T0 + (i / 240) * (T1 - T0); return { t, ...at(t) }; });
const line = (f) => pts.map((p, i) => `${i ? "L" : "M"}${cx(p.t).toFixed(1)} ${cy(f(p)).toFixed(1)}`).join("");
const back = (f) => [...pts].reverse().map((p) => `L${cx(p.t).toFixed(1)} ${cy(f(p)).toFixed(1)}`).join("");
const paths = {
  ".a-bat": `${line((p) => p.b)}L${CW} ${CH}L0 ${CH}Z`,
  ".a-ev": `${line((p) => p.b + p.ev)}${back((p) => p.b)}Z`,
  ".a-over": `${line((p) => Math.max(LIMIT, p.b + p.d))}${back(() => LIMIT)}Z`,
  ".l-raw": line((p) => p.b + p.d),
};
Object.entries(paths).forEach(([sel, d]) => $$(sel, chart).forEach((el) => el.setAttribute("d", d)));

const lb = $("#lb");
lb.innerHTML = [1, 2, 3, 4].map((n) => `<div class="lb-row idle"><span>Véhicule ${n}</span><div class="track"><i></i></div><b>—</b></div>`).join("");
const ui = { clip: $("#lb-clip-rect"), head: $("#lb-head"), dot: $("#lb-dot"), time: $("#lb-time"), state: $("#lb-state"), bat: $("#lb-bat"), ev: $("#lb-ev"), free: $("#lb-free") };
const drawPower = (t) => {
  const { b, d, ev } = at(t), x = cx(t);
  ui.clip.setAttribute("width", x.toFixed(1));
  ui.head.setAttribute("d", `M${x.toFixed(1)} 0V${CH}`);
  ui.dot.style.left = `${(x / CW) * 100}%`;
  ui.dot.style.top = `${(cy(b + ev) / CH) * chart.clientHeight}px`;
  const h = Math.floor(t) % 24, m = Math.floor((t % 1) * 60);
  ui.time.textContent = `${String(h).padStart(2, "0")}:${String(m - (m % 5)).padStart(2, "0")}`;
  ui.bat.textContent = Math.round(b); ui.ev.textContent = Math.round(ev); ui.free.textContent = Math.max(0, Math.round(LIMIT - b - ev));
  const cars = Math.round(d / CAR_KW), shed = d - ev > 1;
  ui.state.textContent = !cars ? "Aucun véhicule branché" : shed ? "Délestage en cours" : "Pleine puissance";
  ui.state.className = `state${!cars ? " idle" : shed ? " shed" : ""}`;
  [...lb.children].forEach((row, i) => {
    const on = i < cars, share = on ? ev / cars : 0;
    row.classList.toggle("idle", !on);
    $("i", row).style.width = `${(share / CAR_KW) * 100}%`;
    $("b", row).textContent = on ? `${fr(share)} kW` : "—";
  });
};
if (reduced) drawPower(19.2);
else {
  const LOOP = 20000, HOLD = 1400;
  let start = null, visible = false, raf = 0;
  const frame = (now) => {
    if (start === null) start = now;
    const e = (now - start) % (LOOP + HOLD);
    drawPower(T0 + Math.min(1, e / LOOP) * (T1 - T0 - 0.01));
    raf = visible ? requestAnimationFrame(frame) : 0;
  };
  drawPower(T0);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }, { threshold: 0.2 }).observe(chart);
}

/* Menu déroulant « Taille du parc » */
const sel = $("#parc");
const selBtn = $(".select-btn", sel), selList = $(".select-list", sel), selOpts = $$("li", selList);
const selValue = $("#parc-value"), selInput = $("input", sel);
let active = 0;
const setActive = (i) => { active = (i + selOpts.length) % selOpts.length; selOpts.forEach((o, k) => o.classList.toggle("active", k === active)); };
const openSel = (open) => {
  sel.classList.toggle("open", open);
  selBtn.setAttribute("aria-expanded", String(open));
  if (open) { setActive(selOpts.findIndex((o) => o.getAttribute("aria-selected") === "true")); selList.focus(); }
};
const setChoice = (i) => {
  selOpts.forEach((o, k) => o.setAttribute("aria-selected", String(k === i)));
  selValue.textContent = selInput.value = selOpts[i].textContent;
};
const choose = (i) => { setChoice(i); openSel(false); selBtn.focus(); };
selBtn.addEventListener("click", () => openSel(!sel.classList.contains("open")));
selOpts.forEach((o, i) => { o.addEventListener("click", () => choose(i)); o.addEventListener("mousemove", () => setActive(i)); });
selBtn.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openSel(true); } });
selList.addEventListener("keydown", (e) => {
  const k = e.key;
  if (k === "ArrowDown") setActive(active + 1);
  else if (k === "ArrowUp") setActive(active - 1);
  else if (k === "Home") setActive(0);
  else if (k === "End") setActive(selOpts.length - 1);
  else if (k === "Enter" || k === " ") choose(active);
  else if (k === "Escape") { openSel(false); selBtn.focus(); }
  else if (k === "Tab") { openSel(false); return; }
  else return;
  e.preventDefault();
});
document.addEventListener("click", (e) => { if (!sel.contains(e.target)) openSel(false); });

/* Formulaire de démo : envoi direct sur contact@ampx.fr via Web3Forms */
const form = $("#demo-form");
const note = $("#form-note");
const submitBtn = $('button[type="submit"]', form);
const submitLabel = $(".t", submitBtn);
const setNote = (text, kind = "") => {
  note.textContent = text;
  note.classList.toggle("err", kind === "err");
  note.classList.toggle("ok", kind === "ok");
};
const setSending = (on) => {
  const label = on ? "Envoi en cours…" : "Demander une démo";
  submitBtn.disabled = on;
  submitLabel.textContent = label;
  submitLabel.dataset.t = label;
};
const FAIL = `L'envoi a échoué. Réessayez dans un instant ou écrivez-nous à ${CONTACT_EMAIL}.`;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (submitBtn.disabled) return;
  const f = form.elements;
  const bad = [f.nom, f.email].filter((el) => !el.value.trim() || !el.checkValidity());
  [f.nom, f.email].forEach((el) => el.classList.toggle("err", bad.includes(el)));
  if (bad.length) {
    setNote("Renseignez votre nom et un e-mail valide.", "err");
    bad[0].focus();
    return;
  }
  if (!WEB3FORMS_KEY) {
    console.warn("AMPX : WEB3FORMS_KEY est vide dans main.js, la demande ne peut pas être envoyée.");
    setNote(FAIL, "err");
    return;
  }

  const nom = f.nom.value.trim(), email = f.email.value.trim(), societe = f.societe.value.trim();
  const data = {
    access_key: WEB3FORMS_KEY,
    subject: `Demande de démo AMPX — ${societe || nom}`,
    from_name: "Site AMPX",
    replyto: email,
    "Nom": nom,
    "E-mail": email,
    "Société": societe || "—",
    "Taille du parc": f.parc.value,
  };
  if (f.botcheck.checked) data.botcheck = true;

  setSending(true);
  setNote("Envoi de votre demande…");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);
    form.reset();
    setChoice(0);
    setNote("Merci, votre demande est bien envoyée. Nous revenons vers vous très vite.", "ok");
  } catch (err) {
    console.error("AMPX : échec de l'envoi du formulaire", err);
    setNote(FAIL, "err");
  } finally {
    clearTimeout(timer);
    setSending(false);
  }
});

$("#year").textContent = new Date().getFullYear();
