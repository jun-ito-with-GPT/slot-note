'use client';
import { useEffect, useMemo, useState } from 'react';
import { Entry, EntryInput, localDate, monthlySummary, profit, validateEntry } from '@/lib/records';
import { demoRepository, Repository, supabase, userRepository } from '@/lib/repository';
const yen = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}¥${Math.abs(n).toLocaleString('ja-JP')}`;
const amount = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const blank = (): EntryInput => ({played_on:localDate(),store:'',machine:'',investment:0,returned:0,memo:''});
export default function Bankroll() {
  const [userId,setUserId] = useState<string|null>(null);
  const [ready,setReady] = useState(!supabase);
  const [entries,setEntries] = useState<Entry[]>([]);
  const [month,setMonth] = useState('');
  const [form,setForm] = useState<EntryInput>(blank);
  const [investment,setInvestment] = useState('');
  const [returned,setReturned] = useState('');
  const [editing,setEditing] = useState<string>();
  const [tab,setTab] = useState<'input'|'history'>('input');
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const [email,setEmail] = useState('');
  const repository: Repository | null = useMemo(()=>supabase ? userId ? userRepository(userId) : null : demoRepository,[userId]);
  useEffect(()=>{
    setMonth(localDate().slice(0,7)); setForm(blank());
    if(!supabase) return;
    let active = true;
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session)=>{ if(active) {setUserId(session?.user.id??null);setReady(true);setEntries([]);} });
    void supabase.auth.getSession().then(({data,error})=>{if(active) {if(error)setError('ログイン状態を確認できませんでした。再読み込みしてください。');setUserId(data.session?.user.id??null);setReady(true);}});
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);
  useEffect(()=>{
    let active=true;
    if(!repository){setLoading(false);return;}
    setLoading(true);
    void repository.list().then(data=>{if(active)setEntries(data);}).catch(()=>{if(active)setError('記録を読み込めませんでした。接続を確認して再読み込みしてください。');}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[repository]);
  const summary = monthlySummary(entries,month);
  const draft = {...form,investment:Number(investment),returned:Number(returned)};
  const stores = [...new Set(entries.map(e=>e.store))];
  const machines = [...new Set(entries.map(e=>e.machine))];
  async function save(event: React.FormEvent) {
    event.preventDefault(); if(!repository || busy)return;
    setError('');setMessage('');
    if(!investment.trim() || !returned.trim() || !/^\d+$/.test(investment) || !/^\d+$/.test(returned)){setError('投資額と回収額を入力してください。回収なしは0円です。');return;}
    const input={...draft,store:form.store.trim(),machine:form.machine.trim(),memo:form.memo.trim()};
    const invalid=validateEntry(input); if(invalid){setError(invalid);return;}
    setBusy(true);
    try { await repository.save(input,editing); const data=await repository.list();setEntries(data);setMonth(input.played_on.slice(0,7));setForm({...blank(),store:input.store,machine:input.machine});setInvestment('');setReturned('');setEditing(undefined);setMessage('記録を保存しました。'); }
    catch {setError('保存を確認できませんでした。再読み込みして記録を確認してください。');}
    finally {setBusy(false);}
  }
  function edit(entry:Entry){setForm(entry);setInvestment(String(entry.investment));setReturned(String(entry.returned));setEditing(entry.id);setTab('input');setError('');setMessage('');window.scrollTo({top:0,behavior:'smooth'});}
  async function remove(id:string){if(!repository || busy || !window.confirm('この記録を削除しますか？'))return;setBusy(true);setError('');setMessage('');try{await repository.remove(id);setEntries(await repository.list());setMessage('記録を削除しました。');}catch{setError('削除を確認できませんでした。再読み込みして確認してください。');}finally{setBusy(false);}}
  async function login(event:React.FormEvent){event.preventDefault();if(!supabase)return;setBusy(true);setError('');setMessage('');try{const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin}});if(error)throw error;setMessage('ログインリンクを送信しました。メールをこの端末で開いてください。');}catch{setError('メールを送信できませんでした。メールアドレスと認証設定を確認してください。');}finally{setBusy(false);}}
  return <main className="shell">
    <header><a className="brand" href="/">SLOT<span>NOTE</span><i>●</i></a><span className="header-label">MY PERSONAL LOG</span></header>
    <div className="intro"><p className="eyebrow">一日の結果を、次の記録に。</p><h1>今日の実戦を、<br className="mobile"/>さっと記録。</h1><p className="muted">お店を出たら、あとは数字を入れるだけ。</p></div>
    {!supabase && <p className="demo">デモモード · このブラウザに保存されます。Supabase設定後は別のデータになります。</p>}
    {error && <p className="notice error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
    {!ready ? <p role="status">ログイン状態を確認中…</p> : supabase && !userId ? <section className="card login"><p className="eyebrow">WELCOME BACK</p><h2>自分だけの収支ノート</h2><p className="muted">メールのリンクからログイン。記録は端末を変えても引き継げます。</p><form onSubmit={login}><label>メールアドレス<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button className="primary" disabled={busy}>{busy?'送信中…':'ログインリンクを送る →'}</button></form></section> : <>
    <section className="summary"><div className="summary-top"><span>月間収支</span><label className="month-label"><span className="sr-only">表示する月</span><input aria-label="表示する月" type="month" required value={month} onChange={e=>{if(e.target.value)setMonth(e.target.value);}}/></label></div><div className={`total ${summary.profit<0?'negative':''}`}>{yen(summary.profit)}</div><div className="summary-bottom"><span>投資 <b>{amount(summary.investment)}</b></span><span>回収 <b>{amount(summary.returned)}</b></span><span><b>{summary.records.length}</b> 件の実戦</span></div></section>
    <nav className="tabs" aria-label="表示切り替え"><button aria-pressed={tab==='input'} className={tab==='input'?'active':''} onClick={()=>setTab('input')}>＋ 記録する</button><button aria-pressed={tab==='history'} className={tab==='history'?'active':''} onClick={()=>setTab('history')}>実戦履歴 <span>{summary.records.length}</span></button></nav>
    {tab==='input' ? <section className="card"><div className="section-title"><h2>{editing?'記録を編集':'実戦を記録'}</h2><span>すべて円単位</span></div><form onSubmit={save}><fieldset disabled={busy||loading}>
      <label>日付<input type="date" required value={form.played_on} onChange={e=>setForm({...form,played_on:e.target.value})}/></label>
      <label>店舗名<input list="stores" required maxLength={100} placeholder="例：マイホール" value={form.store} onChange={e=>setForm({...form,store:e.target.value})}/><datalist id="stores">{stores.map(s=><option key={s} value={s}/>)}</datalist></label>
      <label>機種名<input list="machines" required maxLength={100} placeholder="例：マイジャグラーV" value={form.machine} onChange={e=>setForm({...form,machine:e.target.value})}/><datalist id="machines">{machines.map(s=><option key={s} value={s}/>)}</datalist></label>
      <div className="amount-grid"><label>投資額<div className="money-input"><span>¥</span><input aria-label="投資額" inputMode="numeric" pattern="[0-9]+" required maxLength={9} placeholder="0" value={investment} onChange={e=>setInvestment(e.target.value)}/></div></label><label>回収額<div className="money-input"><span>¥</span><input aria-label="回収額" inputMode="numeric" pattern="[0-9]+" required maxLength={9} placeholder="0" value={returned} onChange={e=>setReturned(e.target.value)}/></div></label></div>
      <div className="quick"><span>投資に追加</span>{[1000,5000,10000].map(n=><button key={n} type="button" onClick={()=>setInvestment(String((Number(investment)||0)+n))}>＋{n.toLocaleString()}</button>)}<button type="button" onClick={()=>setReturned('0')}>回収なし</button></div>
      <div className="preview"><span>今回の収支</span><strong className={profit(draft)<0?'negative':'positive'}>{Number.isFinite(profit(draft))?yen(profit(draft)):'—'}</strong></div>
      <label>メモ <span className="optional">任意</span><textarea maxLength={2000} rows={2} placeholder="設定の感触や、次回のためのひとこと" value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})}/></label>
      <button className="primary" type="submit">{busy?'保存中…':loading?'読み込み中…':editing?'変更を保存する →':'この実戦を保存する →'}</button>
      {editing && <button className="cancel" type="button" onClick={()=>{setEditing(undefined);setForm(blank());setInvestment('');setReturned('');}}>編集をキャンセル</button>}
    </fieldset></form><p className="hint">次の入力では、店舗名と機種名をそのまま使えます。</p></section> : <section className="history"><div className="section-title"><h2>実戦履歴</h2><span>{month.replace('-','年 ')}月</span></div>{loading?<p role="status">読み込み中…</p>:summary.records.length===0?<div className="empty"><span>✎</span><h3>この月の記録はまだありません</h3><p className="muted">最初の実戦を記録してみましょう。</p><button onClick={()=>setTab('input')}>＋ 記録する</button></div>:summary.records.map(entry=><article className="record" key={entry.id}><div className="record-top"><time dateTime={entry.played_on}>{entry.played_on.slice(5).replace('-',' / ')}</time><strong className={profit(entry)<0?'negative':'positive'}>{yen(profit(entry))}</strong></div><h3>{entry.machine}</h3><p className="muted">{entry.store}</p><div className="record-money">投資 {amount(entry.investment)}<span>回収 {amount(entry.returned)}</span></div>{entry.memo&&<p className="memo">{entry.memo}</p>}<div className="record-actions"><button disabled={busy} onClick={()=>edit(entry)}>編集</button><button disabled={busy} onClick={()=>remove(entry.id)}>削除</button></div></article>)}</section>}
    {supabase && userId && <button className="logout" disabled={busy} onClick={async()=>{setBusy(true);setError('');setMessage('');try{const {error}=await supabase!.auth.signOut();if(error)throw error;setEditing(undefined);setForm(blank());setInvestment('');setReturned('');}catch{setError('ログアウトできませんでした。もう一度お試しください。');}finally{setBusy(false);}}}>ログアウト</button>}
    </>}<footer>SLOT NOTE <span>記録を、あなたの習慣に。</span></footer>
  </main>;
}
