import { db, doc, getDoc } from "./firebase.js";
export let currentUser = null;
export async function login(username,password){const id=String(username||"").trim(); const pass=String(password||"").trim(); if(!id||!pass) throw new Error("Benutzername und Passwort eingeben."); const snap=await getDoc(doc(db,"users",id)); if(!snap.exists()) throw new Error("Benutzer nicht gefunden."); const user=snap.data(); if(user.active!==true) throw new Error("Dieser Benutzer ist deaktiviert."); if(String(user.password)!==pass) throw new Error("Passwort ist falsch."); currentUser={id,username:user.username||id,role:user.role||"Mitarbeiter"}; sessionStorage.setItem("lacasa_user",JSON.stringify(currentUser)); return currentUser;}
export function restoreUser(){const saved=sessionStorage.getItem("lacasa_user"); if(saved){currentUser=JSON.parse(saved); return currentUser;} return null;}
export function logout(){currentUser=null; sessionStorage.removeItem("lacasa_user");}
