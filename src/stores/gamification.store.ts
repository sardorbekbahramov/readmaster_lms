import { create } from "zustand"
interface Toast{id:string;amount:number;reason:string}
interface Store{
  toasts:Toast[];levelUpModal:{show:boolean;newLevel:number;newTitle:string}|null
  addToast:(amount:number,reason:string)=>void
  removeToast:(id:string)=>void
  showLevelUp:(l:number,t:string)=>void
  dismissLevelUp:()=>void
}
export const useGamificationStore=create<Store>((set)=>({
  toasts:[],levelUpModal:null,
  addToast:(amount,reason)=>{const id=Math.random().toString(36).slice(2);set((s)=>({toasts:[...s.toasts,{id,amount,reason}]}));setTimeout(()=>set((s)=>({toasts:s.toasts.filter((t)=>t.id!==id)})),3000)},
  removeToast:(id)=>set((s)=>({toasts:s.toasts.filter((t)=>t.id!==id)})),
  showLevelUp:(newLevel,newTitle)=>set({levelUpModal:{show:true,newLevel,newTitle}}),
  dismissLevelUp:()=>set({levelUpModal:null}),
}))
