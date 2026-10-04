'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const START_CAPITAL = 10000;
const LEVERAGE = 200;
const ALLOCATION = 0.5;
const TRAIL_PCT = 0.003;
const LIQ_PCT = 0.0045;
const RES = '15m';
const WS = 'wss://public-socket.india.delta.exchange';

type Candle = { time:number; open:number; high:number; low:number; close:number; volume?:number };
type Leg = { symbol:string; side:'LONG'|'SHORT'; entry:number; qty:number; margin:number; best:number; trail:number|null; status:'OPEN'|'TRAIL'|'LIQUIDATED'|'CLOSED'; exit?:number; pnl?:number; reason?:string };
type Trade = { id:string; time:number; pair:string; legs:Leg[]; pnl:number; reason:string };

function money(v:number){ return '₹'+v.toLocaleString('en-IN',{maximumFractionDigits:2}); }
function price(v:number){ return v ? v.toLocaleString('en-US',{maximumFractionDigits:2}) : '—'; }
function ts(v:number){ return new Date(v*1000).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}); }

export default function Page(){
  const [mode,setMode]=useState<'PAPER'|'LIVE'>('PAPER');
  const [direction,setDirection]=useState<'BL_ES'|'BS_EL'>('BL_ES');
  const [tab,setTab]=useState<'live'|'backtest'>('live');
  const [prices,setPrices]=useState<Record<string,number>>({});
  const [candles,setCandles]=useState<Candle[]>([]);
  const [hist,setHist]=useState<Record<string,Candle[]>>({});
  const [loading,setLoading]=useState(false);
  const [progress,setProgress]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [paper,setPaper]=useState({equity:START_CAPITAL,realized:0,peak:START_CAPITAL,maxDD:0});
  const [open,setOpen]=useState<Leg[]>([]);
  const [trades,setTrades]=useState<Trade[]>([]);
  const [logs,setLogs]=useState<string[]>([]);
  const [message,setMessage]=useState('Ready — LIVE orders are disabled.');
  const timer=useRef<ReturnType<typeof setInterval>|null>(null);
  const idx=useRef(0);
  const stateRef=useRef({open:[] as Leg[],equity:START_CAPITAL,realized:0,peak:START_CAPITAL,maxDD:0,trades:[] as Trade[]});

  const addLog=(s:string)=>setLogs(x=>[new Date().toLocaleTimeString()+'  '+s,...x].slice(0,120));
  const sync=()=>{ const s=stateRef.current; setOpen([...s.open]); setTrades([...s.trades]); setPaper({equity:s.equity,realized:s.realized,peak:s.peak,maxDD:s.maxDD}); };

  useEffect(()=>{
    const ws=new WebSocket(WS);
    ws.onopen=()=>{ ws.send(JSON.stringify({type:'subscribe',payload:{channels:[{name:'candlestick_15m',symbols:['BTCUSD','ETHUSD']}]}})); addLog('Delta public WebSocket connected.'); };
    ws.onmessage=(e)=>{
      try{
        const d=JSON.parse(e.data);
        if(d.type==='candlestick_15m' && d.sy && d.c) setPrices(p=>({...p,[d.sy]:Number(d.c)}));
      }catch{}
    };
    ws.onerror=()=>addLog('WebSocket error — retry by refreshing the dashboard.');
    ws.onclose=()=>addLog('Delta WebSocket disconnected.');
    return ()=>ws.close();
  },[]);

  async function loadHistory(){
    setLoading(true); setMessage('6 ماہ کا 15m historical data load ہو رہا ہے…');
    const end=Math.floor(Date.now()/1000), start=end-183*86400, chunk=1999*900;
    const out:Record<string,Candle[]>={BTCUSD:[],ETHUSD:[]};
    try{
      for(const sym of ['BTCUSD','ETHUSD']){
        for(let a=start;a<end;a+=chunk){
          const b=Math.min(end,a+chunk);
          const r=await fetch('/api/candles?symbol='+sym+'&start='+a+'&end='+b+'&resolution=15m');
          if(!r.ok) throw new Error(await r.text());
          const j=await r.json();
          out[sym].push(...(j.result||[]).map((c:any)=>({time:Number(c.time),open:Number(c.open),high:Number(c.high),low:Number(c.low),close:Number(c.close),volume:Number(c.volume||0)})));
          setProgress(Math.round((Object.values(out).flat().length/35000)*100));
        }
        out[sym]=Array.from(new Map(out[sym].map(c=>[c.time,c])).values()).sort((a,b)=>a.time-b.time);
      }
      setHist(out);
      setCandles(out.BTCUSD||[]);
      setProgress(100);
      setMessage('Historical data ready. Play دبائیں۔');
      addLog('BTCUSD/ETHUSD six-month 15m dataset loaded.');
    }catch(e:any){ setMessage('Historical data load failed: '+e.message); addLog('History load failed.'); }
    finally{setLoading(false);}
  }

  function resetEngine(){
    stateRef.current={open:[],equity:START_CAPITAL,realized:0,peak:START_CAPITAL,maxDD:0,trades:[]};
    idx.current=0; setProgress(0); setCandles(hist.BTCUSD||[]); sync(); addLog('Paper engine reset to ₹10,000.');
  }

  function openPair(t:number, btc:Candle, eth:Candle){
    const s=stateRef.current; if(s.open.length) return;
    const specs=direction==='BL_ES'?[['BTCUSD','LONG',btc.close],['ETHUSD','SHORT',eth.close]]:[['BTCUSD','SHORT',btc.close],['ETHUSD','LONG',eth.close]];
    const legs=specs.map(([symbol,side,entry])=>{
      const margin=START_CAPITAL*ALLOCATION;
      const qty=(margin*LEVERAGE)/Number(entry);
      return {symbol,side:side as 'LONG'|'SHORT',entry:Number(entry),qty,margin,best:Number(entry),trail:null,status:'OPEN' as const};
    });
    s.open=legs as Leg[]; addLog('PAIR OPEN '+direction+' — BTC + ETH simultaneous at '+ts(t)); sync();
  }

  function process(t:number, btc:Candle, eth:Candle){
    const s=stateRef.current;
    if(!s.open.length){ openPair(t,btc,eth); return; }
    const next=s.open.map(l=>({...l}));
    for(const l of next){
      const c=l.symbol==='BTCUSD'?btc:eth;
      const favorable=l.side==='LONG'?c.high:c.low;
      const adverse=l.side==='LONG'?c.low:c.high;
      if(l.side==='LONG') l.best=Math.max(l.best,favorable); else l.best=Math.min(l.best,favorable);
      const liq=l.side==='LONG'?l.entry*(1-LIQ_PCT):l.entry*(1+LIQ_PCT);
      if((l.side==='LONG'&&adverse<=liq)||(l.side==='SHORT'&&adverse>=liq)){
        l.status='LIQUIDATED'; l.exit=liq; l.pnl=-l.margin*(LEVERAGE*LIQ_PCT); l.reason='liquidation';
        addLog(l.symbol+' LIQUIDATED @ '+price(liq));
        continue;
      }
      const profit=l.side==='LONG'?l.best/l.entry-1:l.entry/l.best-1;
      if(profit>=TRAIL_PCT){
        l.trail=l.side==='LONG'?l.best*(1-TRAIL_PCT):l.best*(1+TRAIL_PCT); l.status='TRAIL';
        const hit=l.side==='LONG'?adverse<=l.trail:adverse>=l.trail;
        if(hit){ l.exit=l.trail; l.pnl=l.side==='LONG'?l.qty*(l.exit-l.entry):l.qty*(l.entry-l.exit); l.status='CLOSED'; l.reason='trailing stop'; addLog(l.symbol+' TRAIL EXIT @ '+price(l.exit)); }
      }
    }
    s.open=next.filter(l=>l.status==='OPEN'||l.status==='TRAIL');
    const closed=next.filter(l=>l.status==='CLOSED'||l.status==='LIQUIDATED');
    if(closed.length){
      const realized=closed.reduce((a,l)=>a+(l.pnl||0),0);
      if(realized!==0){ s.realized+=realized; s.equity=START_CAPITAL+s.realized; s.peak=Math.max(s.peak,s.equity); s.maxDD=Math.max(s.maxDD,(s.peak-s.equity)/s.peak); }
      if(next.every(l=>['CLOSED','LIQUIDATED'].includes(l.status))){
        s.trades.unshift({id:'P'+Date.now(),time:t,pair:direction,legs:next,pnl:realized,reason:next.map(l=>l.reason).join(' + ')});
        s.open=[];
        addLog('PAIR CLOSED — '+money(realized));
      }
    }
    sync();
  }

  function play(){
    if(!hist.BTCUSD?.length||!hist.ETHUSD?.length){ setMessage('پہلے Load 6 Months دبائیں۔'); return; }
    if(playing){ setPlaying(false); if(timer.current) clearInterval(timer.current); return; }
    setPlaying(true); addLog('Playback started.');
    timer.current=setInterval(()=>{
      const i=idx.current;
      const b=hist.BTCUSD[i], e=hist.ETHUSD.find(x=>x.time===b?.time);
      if(!b||!e){ setPlaying(false); if(timer.current) clearInterval(timer.current); return; }
      setCandles(hist.BTCUSD.slice(Math.max(0,i-120),i+1)); process(b.time,b,e); idx.current=i+1;
      setProgress(Math.round((i/hist.BTCUSD.length)*100));
    },40);
  }

  function step(){
    if(!hist.BTCUSD?.length||!hist.ETHUSD?.length) return;
    const b=hist.BTCUSD[idx.current], e=hist.ETHUSD.find(x=>x.time===b?.time);
    if(!b||!e) return;
    setCandles(hist.BTCUSD.slice(Math.max(0,idx.current-120),idx.current+1)); process(b.time,b,e); idx.current++; setProgress(Math.round((idx.current/hist.BTCUSD.length)*100));
  }

  const unrealized=useMemo(()=>open.reduce((a,l)=>{const p=prices[l.symbol]||l.entry; return a+(l.side==='LONG'?l.qty*(p-l.entry):l.qty*(l.entry-p));},0),[open,prices]);
  const equity=paper.equity+unrealized;
  const chart=tab==='backtest'?candles:[];
  const last=chart[chart.length-1];

  return <main className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-20">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
        <div><div className="text-xl font-bold">Delta Opposite Pair Bot</div><div className="text-xs text-slate-400">15m • ₹10,000 paper • 200x • no indicators • LIVE orders OFF</div></div>
        <div className="flex gap-2"><span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs">PAPER MODE</span><button onClick={()=>setMode(mode==='PAPER'?'LIVE':'PAPER')} className="px-3 py-1 rounded bg-slate-800 text-xs">{mode}</button></div>
      </div>
    </header>
    <div className="mx-auto max-w-7xl p-4 space-y-4">
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {['BTCUSD','ETHUSD'].map(s=><div key={s} className="card"><div className="label">{s}</div><div className="big">{price(prices[s]||0)}</div><div className="muted">Live 15m feed</div></div>)}
        <div className="card"><div className="label">Equity</div><div className="big">{money(equity)}</div><div className="muted">ROI {(((equity/START_CAPITAL)-1)*100).toFixed(2)}%</div></div>
        <div className="card"><div className="label">Realized P&L</div><div className="big">{money(paper.realized)}</div><div className="muted">Max DD {(paper.maxDD*100).toFixed(2)}%</div></div>
        <div className="card"><div className="label">Open legs</div><div className="big">{open.length}/2</div><div className="muted">{direction==='BL_ES'?'BTC LONG / ETH SHORT':'BTC SHORT / ETH LONG'}</div></div>
        <div className="card"><div className="label">Trades</div><div className="big">{trades.length}</div><div className="muted">Pair cycles</div></div>
      </section>

      <section className="panel flex flex-wrap items-center gap-3">
        <button className="tab" onClick={()=>setTab('live')} data-on={tab==='live'}>Live Dashboard</button>
        <button className="tab" onClick={()=>setTab('backtest')} data-on={tab==='backtest'}>6-Month Playback</button>
        <select value={direction} onChange={e=>setDirection(e.target.value as any)} className="control"><option value="BL_ES">BTC LONG + ETH SHORT</option><option value="BS_EL">BTC SHORT + ETH LONG</option></select>
        {tab==='backtest'&&<><button className="btn" onClick={loadHistory} disabled={loading}>{loading?'Loading…':'Load 6 Months'}</button><button className="btn primary" onClick={play}>{playing?'Pause':'Play'}</button><button className="btn" onClick={step}>Step 15m</button><button className="btn" onClick={resetEngine}>Reset</button></>}
        <div className="text-sm text-slate-300 ml-auto">{message}</div>
      </section>

      {tab==='backtest'&&<div className="h-2 bg-slate-800 rounded overflow-hidden"><div className="h-full bg-emerald-500" style={{width:progress+'%'}}/></div>}

      <section className="panel">
        <div className="flex justify-between mb-3"><div><b>{tab==='live'?'Live Market':'Historical Playback'} — 15m</b><div className="muted">{last?ts(last.time):'Waiting for data'} </div></div><div className="muted">Real orders: <b className="text-red-400">OFF</b></div></div>
        <div className="chart">{chart.length?<svg viewBox="0 0 1000 420" preserveAspectRatio="none">{(()=>{const min=Math.min(...chart.map(c=>c.low)),max=Math.max(...chart.map(c=>c.high)),r=max-min||1,w=1000/chart.length;return chart.map((c,i)=>{const x=i*w+w/2,y=v=>390-(v-min)/r*350,up=c.close>=c.open;return <g key={c.time}><line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={up?'#34d399':'#fb7185'}/><rect x={x-w*.32} width={w*.64} y={Math.min(y(c.open),y(c.close))} height={Math.max(1,Math.abs(y(c.open)-y(c.close)))} fill={up?'#34d399':'#fb7185'}/></g>})})()}</svg>:<div className="chartEmpty">{tab==='live'?'Live chart is fed from Delta WebSocket. Open 6-Month Playback to load historical candles.':'Load historical candles to show the chart.'}</div>}</div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="panel"><h3>Open Legs</h3>{open.length?<div className="tableWrap"><table><thead><tr><th>Symbol</th><th>Side</th><th>Entry</th><th>Trail</th><th>P&L</th><th>Status</th></tr></thead><tbody>{open.map(l=>{const p=prices[l.symbol]||l.entry;const pnl=l.side==='LONG'?l.qty*(p-l.entry):l.qty*(l.entry-p);return <tr key={l.symbol}><td>{l.symbol}</td><td>{l.side}</td><td>{price(l.entry)}</td><td>{l.trail?price(l.trail):'—'}</td><td>{money(pnl)}</td><td>{l.status}</td></tr>})}</tbody></table></div>:<div className="empty">No open pair</div>}</div>
        <div className="panel"><h3>Trade History</h3>{trades.length?<div className="tableWrap"><table><thead><tr><th>Time</th><th>Pair</th><th>BTC</th><th>ETH</th><th>Net P&L</th><th>Reason</th></tr></thead><tbody>{trades.slice(0,30).map(t=><tr key={t.id}><td>{ts(t.time)}</td><td>{t.pair}</td><td>{t.legs.find(x=>x.symbol==='BTCUSD')?.status}</td><td>{t.legs.find(x=>x.symbol==='ETHUSD')?.status}</td><td>{money(t.pnl)}</td><td>{t.reason}</td></tr>)}</tbody></table></div>:<div className="empty">No completed trades yet</div>}</div>
      </section>

      <section className="panel"><h3>Event Log</h3><div className="log">{logs.map((x,i)=><div key={i}>{x}</div>)}</div></section>
      <section className="panel text-xs text-slate-400">Strategy exactly as requested: BTC and ETH opposite positions, 50% margin each, 200x simulated leverage. The profitable leg trails by 0.30%; the adverse leg uses a configurable 0.45% simulated liquidation threshold. This is paper simulation, not an exact exchange liquidation calculation. No indicator is used.</section>
    </div>
  </main>
}