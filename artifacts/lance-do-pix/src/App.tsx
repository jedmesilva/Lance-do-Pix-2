import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, CircleHelp, Clock3, Moon, Pause, Play, Plus, Sun, Trophy, Wallet, X } from 'lucide-react';

type Bid = { name: string; price: number; at: number };
type Prize = { value: number; bonus: number };
type SceneKey = 'other' | 'outbid' | 'urgent' | 'lead' | 'ended' | 'won' | 'long' | 'open';
const DURATION = 60, STEP = 10, WAIT = 60;
const PRIZES: Prize[] = [{ value: 1000, bonus: 36 }, { value: 2500, bonus: 90 }, { value: 500, bonus: 18 }];
const namesFor = (names: string[]) => names.map((name, i) => ({ name, price: 130 - (names.length - 1 - i) * 10, at: 0 }));
const SCENES: { key: SceneKey; label: string; bids: Bid[]; secs: number }[] = [
  { key: 'other', label: 'Outro ganhando', bids: namesFor(['Ana Beatriz', 'Lucas', 'Maria', 'Pedro Henrique', 'Ana Beatriz', 'Lucas']), secs: 60 },
  { key: 'outbid', label: 'Você foi superado', bids: namesFor(['Lucas', 'Ana Beatriz', 'Pedro Henrique', 'Lucas', 'Você', 'Maria']), secs: 60 },
  { key: 'urgent', label: 'Reta final', bids: namesFor(['Ana Beatriz', 'Lucas', 'Maria', 'Pedro Henrique', 'Ana Beatriz', 'Lucas']), secs: 8 },
  { key: 'lead', label: 'Você ganhando', bids: namesFor(['Ana Beatriz', 'Lucas', 'Pedro Henrique', 'Lucas', 'Maria', 'Você']), secs: 60 },
  { key: 'ended', label: 'Encerrado', bids: namesFor(['Ana Beatriz', 'Lucas', 'Maria', 'Pedro Henrique', 'Ana Beatriz', 'Lucas']), secs: 0 },
  { key: 'won', label: 'Você ganhou', bids: namesFor(['Ana Beatriz', 'Lucas', 'Pedro Henrique', 'Lucas', 'Maria', 'Você']), secs: 0 },
  { key: 'long', label: 'Nome longo', bids: namesFor(['Ana Beatriz', 'Lucas', 'Pedro Henrique', 'Lucas', 'Ana Beatriz', 'Maria Fernanda de Albuquerque']), secs: 60 },
  { key: 'open', label: 'Disputa aberta', bids: [], secs: 60 },
];
const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const amount = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clock = (s: number) => s <= 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ldp-theme');
    return saved === 'dark' || saved === 'light' ? saved : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const [balance, setBalance] = useState(() => Number(localStorage.getItem('ldp-balance')) || 390);
  const [bids, setBids] = useState<Bid[]>([]);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [secs, setSecs] = useState(60);
  const [nextSecs, setNextSecs] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [bidValue, setBidValue] = useState(140);
  const [scene, setScene] = useState<SceneKey>('other');
  const [modal, setModal] = useState<'how' | 'balance' | null>(null);
  const [toast, setToast] = useState('');
  const endsAt = useRef(Date.now() + 60_000);
  const nextAt = useRef<number | null>(null);
  const pausedRemaining = useRef<number | null>(null);
  const prize = PRIZES[prizeIndex];
  const last = bids[bids.length - 1];
  const prev = bids[bids.length - 2];
  const isMe = last?.name === 'Você';
  const ended = secs === 0 && nextSecs !== null;
  const urgent = secs > 0 && secs <= 10;
  const empty = !last;
  const minimum = last ? last.price + STEP : STEP;
  const history = useMemo(() => bids.slice(0, -1).slice(-5).reverse(), [bids]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ldp-theme', theme);
  }, [theme]);
  useEffect(() => {
    setSceneNow('other');
  }, []);
  useEffect(() => {
    localStorage.setItem('ldp-balance', String(balance));
  }, [balance]);
  useEffect(() => {
    const tick = () => {
      if (paused) return;
      if (nextAt.current !== null) {
        const remaining = Math.max(0, Math.ceil((nextAt.current - Date.now()) / 1000));
        setNextSecs(remaining);
        if (remaining === 0) {
          nextAt.current = null;
          setNextSecs(null);
          setBids([]);
          setPrizeIndex(i => (i + 1) % PRIZES.length);
          endsAt.current = Date.now() + DURATION * 1000;
          setSecs(DURATION);
          setBidValue(STEP);
          setScene('open');
        }
      } else if (bids.length) {
        const remaining = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
        setSecs(remaining);
        if (remaining === 0) {
          setNextSecs(WAIT);
          nextAt.current = Date.now() + WAIT * 1000;
        }
      }
    };
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [bids.length, paused]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const message = empty ? 'Assuma o topo com o primeiro lance.' : ended ? (isMe ? 'Parabéns, o prêmio é seu.' : 'Disputa encerrada.') : isMe ? urgent ? 'Falta pouco! Continue no topo e o prêmio é seu.' : 'Continue no topo e o prêmio é seu.' : urgent ? 'Últimos segundos! Supere agora.' : prev?.name === 'Você' ? 'Você foi superado. Supere o lance para voltar ao topo.' : '';
  const setSceneNow = (key: SceneKey) => {
    const selected = SCENES.find(s => s.key === key)!;
    const now = Date.now();
    const elapsed = (DURATION - selected.secs) * 1000;
    const newBids = selected.bids.map((b, i, all) => ({ ...b, at: now - elapsed - (all.length - i - 1) * 11_000 }));
    setScene(key); setPrizeIndex(0); setBids(newBids); setSecs(selected.secs);
    setNextSecs(selected.secs === 0 ? WAIT : null);
    nextAt.current = selected.secs === 0 ? now + WAIT * 1000 : null;
    endsAt.current = now + selected.secs * 1000;
    pausedRemaining.current = null; setPaused(false);
    setBidValue(newBids.length ? newBids[newBids.length - 1].price + STEP : STEP);
  };
  const placeBid = () => {
    if (ended || isMe || paused) return;
    const nextBid = Math.max(minimum, bidValue);
    setBids(current => [...current, { name: 'Você', price: nextBid, at: Date.now() }]);
    endsAt.current = Date.now() + DURATION * 1000;
    nextAt.current = null; setNextSecs(null); setSecs(DURATION); setBidValue(nextBid + STEP);
    setScene('lead');
    setToast('Lance de demonstração registrado.');
  };
  const adjust = (delta: number) => setBidValue(value => Math.max(minimum, value + delta));
  const togglePause = () => {
    if (paused) {
      if (nextSecs !== null) nextAt.current = Date.now() + (pausedRemaining.current ?? nextSecs) * 1000;
      else endsAt.current = Date.now() + (pausedRemaining.current ?? secs) * 1000;
      pausedRemaining.current = null; setPaused(false);
    } else {
      pausedRemaining.current = nextSecs !== null ? nextSecs : secs; setPaused(true);
    }
  };
  const topName = empty ? 'Nenhum lance ainda' : last.name;
  const buttonLabel = ended ? `Próxima disputa em ${clock(nextSecs ?? WAIT)}` : isMe ? 'Seu lance está no topo' : empty ? `Dar o primeiro lance de ${fmt(bidValue)}` : `Superar com ${fmt(bidValue)}`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Lance do Pix início" data-testid="link-home">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 1.5 22.5 12 12 22.5 1.5 12z" /></svg></span>
          <span>Lance do Pix</span>
        </a>
        <div className="top-actions">
          <button className="balance-pill" onClick={() => setModal('balance')} aria-label={`Saldo demonstrativo ${fmt(balance)}. Adicionar saldo`} data-testid="button-add-balance">
            <Wallet size={15} /><span>{fmt(balance)}</span><span className="balance-add"><Plus size={15} /></span>
          </button>
          <div className="avatar" aria-label="Perfil de Marina" data-testid="avatar-profile">M<span /></div>
          <button className="icon-button theme-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} data-testid="button-theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      <div className="demo-strip">
        <div className="demo-label"><span className="live-dot" /> CENA DE DEMONSTRAÇÃO</div>
        <div className="scene-controls" role="group" aria-label="Cenas de demonstração">
          {SCENES.map(item => <button key={item.key} data-testid={`scene-${item.key}`} aria-pressed={scene === item.key} onClick={() => setSceneNow(item.key)}>{item.label}</button>)}
          <button data-testid="button-pause" aria-pressed={paused} onClick={togglePause}>{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? 'Retomar' : 'Pausar'}</button>
        </div>
      </div>
      {nextSecs !== null && <section className="next-game" data-testid="status-next-game">
        <div className="next-ring" style={{ '--progress': `${((WAIT - nextSecs) / WAIT) * 100}%` } as CSSProperties}><span>{nextSecs}</span></div>
        <div><strong>Próxima disputa</strong><p>Prêmio revelado ao começar</p></div>
      </section>}
      <div className="desktop-layout">
        <section className="game-column">
          <div className="intro">
            <div className="eyebrow"><span className="live-dot" /> DISPUTA AO VIVO <span className="demo-tag">DEMO</span></div>
            <h1>{ended ? isMe ? 'Você ganhou!' : 'Disputa encerrada' : 'Prêmio em disputa'}</h1>
            <p className="subhead">Dê um lance, fique no topo por 1 minuto e o prêmio é seu!</p>
            <div className="prize-line"><span>R$</span><strong data-testid="text-prize">{amount(prize.value)}</strong></div>
            <p className="bonus" data-testid="text-bonus"><Trophy size={16} /> {fmt(prize.bonus)} de bônus</p>
          </div>
          <section className={`leader-card ${urgent ? 'is-urgent' : ''} ${ended ? 'is-ended' : ''}`} aria-label="Lance no topo" data-testid="card-current-leader">
            <div className="leader-top">
              <div className="leader-copy">
                <div className="section-kicker">LANCE NO TOPO</div>
                <div className="leader-name" data-testid="text-leader-name">{topName}</div>
                <div className="leader-status" data-testid="status-leader">{empty ? 'A disputa está aberta' : isMe ? 'está no topo' : ended ? 'venceu a disputa' : 'está no topo'}</div>
              </div>
              <div className="timer-box">
                <span>{ended ? 'ENCERRADA' : 'VITÓRIA EM'}</span>
                <strong className="timer" aria-live="off" data-testid="text-countdown">{ended ? <Check size={24} /> : clock(secs)}</strong>
              </div>
            </div>
            <div className="leader-value" data-testid="text-leading-bid">{fmt(last?.price ?? 0)}</div>
            <div className="progress-track" aria-label={`Progresso: ${Math.max(0, Math.min(100, ((DURATION - secs) / DURATION) * 100)).toFixed(0)}%`}><span style={{ width: `${Math.max(0, Math.min(100, ((DURATION - secs) / DURATION) * 100))}%` }} /></div>
            {message && <p className={`leader-notice ${isMe && !ended ? 'good' : ''}`} role="status" data-testid="status-notice">{message}</p>}
          </section>
          {history.length > 0 && <>
            <div className="section-heading"><h2>Lances recentes</h2><span>ÚLTIMOS {history.length}</span></div>
            <div className="timeline" data-testid="list-recent-bids">
              {history.map((bid, i) => {
                const newer = bids[bids.length - 1 - i];
                const held = Math.max(0, Math.ceil((newer.at - bid.at) / 1000));
                return <div className="timeline-row" key={`${bid.at}-${i}`} data-testid={`row-recent-bid-${i}`}>
                  <span className="timeline-dot"><ArrowUpRight size={13} /></span>
                  <div className="timeline-person"><strong>{bid.name}</strong><span>{fmt(bid.price)}</span></div>
                  <span className="timeline-time">Superado aos {clock(held)}</span>
                </div>;
              })}
            </div>
          </>}
          {history.length === 0 && <div className="empty-history" data-testid="status-empty-history"><span className="empty-mark"><ArrowDownRight size={17} /></span><span>Os lances aparecem aqui.<br />Quem dá o primeiro?</span></div>}
          <p className="demo-disclaimer">Experiência demonstrativa. Lances e saldo são simulados e não envolvem pagamentos.</p>
        </section>
        <aside className="desktop-side">
          <BidPanel bidValue={bidValue} adjust={adjust} placeBid={placeBid} disabled={ended || isMe || paused} label={buttonLabel} openHow={() => setModal('how')} />
          <div className="side-note"><span className="note-icon"><Clock3 size={16} /></span><p>Uma disputa dura 60 segundos. Cada novo lance reinicia o relógio.</p></div>
        </aside>
      </div>
      <div className="mobile-panel">
        <BidPanel bidValue={bidValue} adjust={adjust} placeBid={placeBid} disabled={ended || isMe || paused} label={buttonLabel} openHow={() => setModal('how')} />
      </div>
      <div className="sr-only" aria-live="polite" data-testid="status-live-announcement">{empty ? 'Disputa aberta. Nenhum lance ainda.' : `${topName} ${ended ? 'venceu' : 'está no topo'} com ${fmt(last?.price ?? 0)}. ${message}`}</div>
      {toast && <div className="toast" role="status" data-testid="status-toast">{toast}</div>}
      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-testid={`dialog-${modal}`}>
          <button className="modal-close" onClick={() => setModal(null)} aria-label="Fechar" data-testid="button-close-modal"><X size={18} /></button>
          {modal === 'how' ? <>
            <div className="modal-symbol"><CircleHelp size={22} /></div><p className="eyebrow">É SIMPLES</p><h2 id="modal-title">Como funciona</h2>
            <ol className="how-list"><li><b>01</b><span><strong>Dê um lance maior</strong><small>Supere o lance do topo. O próximo lance sobe R$ 10.</small></span></li><li><b>02</b><span><strong>Segure a posição</strong><small>Cada lance reinicia a contagem de 60 segundos.</small></span></li><li><b>03</b><span><strong>Ganhe a disputa</strong><small>Se o relógio zerar com você no topo, o prêmio e o bônus são seus.</small></span></li></ol>
            <p className="modal-footnote">Esta é uma demonstração. Nenhum lance é cobrado e não há pagamentos reais.</p>
          </> : <>
            <div className="modal-symbol"><Wallet size={22} /></div><p className="eyebrow">SALDO DE DEMONSTRAÇÃO</p><h2 id="modal-title">Adicionar saldo</h2><p className="modal-description">Use créditos simulados para explorar a experiência. Nenhum pagamento será solicitado.</p>
            <div className="balance-options">{[50, 100, 200].map(value => <button key={value} onClick={() => { setBalance(v => v + value); setModal(null); setToast(`${fmt(value)} adicionados ao saldo demonstrativo.`); }} data-testid={`button-credit-${value}`}><Plus size={15} /> {fmt(value)}</button>)}</div>
            <p className="modal-footnote">Saldo atual: <strong>{fmt(balance)}</strong> · Apenas para demonstração</p>
          </>}
        </section>
      </div>}
    </main>
  );
}

function BidPanel({ bidValue, adjust, placeBid, disabled, label, openHow }: { bidValue: number; adjust: (n: number) => void; placeBid: () => void; disabled: boolean; label: string; openHow: () => void }) {
  return <section className="bid-panel" aria-label="Seu próximo lance">
    <div className="panel-head"><h2>SEU PRÓXIMO LANCE</h2><button className="how-button" onClick={openHow} data-testid="button-how-it-works"><CircleHelp size={16} /> Como funciona</button></div>
    <div className="bid-stepper">
      <button className="step-button" onClick={() => adjust(-STEP)} aria-label="Diminuir lance em 10 reais" data-testid="button-bid-minus">−</button>
      <div className="bid-field"><span>R$</span><output aria-label="Valor do lance" data-testid="text-bid-value">{amount(bidValue)}</output></div>
      <button className="step-button" onClick={() => adjust(STEP)} aria-label="Aumentar lance em 10 reais" data-testid="button-bid-plus">+</button>
    </div>
    <div className="quick-add">{[50, 100, 200].map(value => <button key={value} onClick={() => adjust(value)} data-testid={`button-bid-add-${value}`}>+{value}</button>)}</div>
    <button className="bid-cta" onClick={placeBid} disabled={disabled} data-testid="button-place-bid">{label}</button>
    <p className="panel-disclaimer">Lance simulado · Sem cobrança real</p>
  </section>;
}
