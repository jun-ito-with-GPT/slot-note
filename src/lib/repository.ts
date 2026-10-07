import { createClient } from '@supabase/supabase-js';
import { Entry, EntryInput } from './records';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url,key) : null;
const STORAGE = 'slot-bankroll-demo-v1';
export interface Repository { list(): Promise<Entry[]>; save(input: EntryInput, id?: string): Promise<void>; remove(id: string): Promise<void> }
export const demoRepository: Repository = {
  async list() { const value = localStorage.getItem(STORAGE); return value ? JSON.parse(value) : []; },
  async save(input,id) { const entries = await this.list(); const record = {...input,id:id ?? crypto.randomUUID()}; localStorage.setItem(STORAGE,JSON.stringify(id ? entries.map(e=>e.id===id?record:e) : [record,...entries])); },
  async remove(id) { localStorage.setItem(STORAGE,JSON.stringify((await this.list()).filter(e=>e.id!==id))); }
};
export function userRepository(userId: string): Repository {
  const client = supabase!;
  return {
    async list() { const {data,error} = await client.from('entries').select('id,played_on,store,machine,investment,returned,memo').eq('user_id',userId).order('played_on',{ascending:false}); if(error) throw error; return data as Entry[]; },
    async save(input,id) { const query = id ? client.from('entries').update(input).eq('id',id).eq('user_id',userId).select('id').single() : client.from('entries').insert({...input,user_id:userId}).select('id').single(); const {error} = await query; if(error) throw error; },
    async remove(id) { const {error} = await client.from('entries').delete().eq('id',id).eq('user_id',userId).select('id').single(); if(error) throw error; }
  };
}
