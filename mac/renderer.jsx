import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";



import { GatherMark } from "../brand-art.jsx";
import fluentRelieved from "./assets/fluent-relieved-animated.png";
import fluentRelievedStill from "./assets/fluent-relieved-still.png";
import { projectStyle as baseProjectStyle } from "../draft-theme.mjs";
const projectStyle = (name) => name === "\u4EA7\u54C1\u8BBE\u8BA1" ? { "--project-ink": "#7745c6", "--project-tint": "#eee7fc" } : name === "\u56E2\u961F\u534F\u4F5C" ? { "--project-ink": "#3970c6", "--project-tint": "#e1edfc" } : name === "\u6536\u6B3E\u4F53\u9A8C" ? { "--project-color": "#a3b5f2" } : name === "\u54C1\u724C\u8BBE\u8BA1" ? { "--project-color": "#d8b1a2" } : baseProjectStyle(name);
import CompletionConfetti from "../completion-confetti.jsx";

import "./tokens.css";
import "./figma-theme.css";
import "./components.css";
import "./onboarding.css";
import "./capture-story.css";
import {Icon as Glyph,IconButton} from "./ui.jsx";
import Onboarding from "./onboarding.jsx";
import StartupGate from "./startup.jsx";
import {exampleAsset,recognizeExample} from "./onboarding-example.mjs";
import Settings from "./settings.jsx";
import { Ambient, HomeHeading, CompletionPaper } from "./figma-home.jsx";
import DetailEditor from "./detail-editor.jsx";
import useBoardDrag from "./use-board-drag.jsx";
function timeLabel(time) {
  return new Date(time).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
const api = window.shouxia;
const formatShortcut = (value) => (value || "").replace("CommandOrControl", "\u2318").replace("Command", "\u2318").replace("Control", "\u2303").replace("Shift", "\u21E7").replace("Alt", "\u2325").replaceAll("+", " ");
const validTitle = (t) => !t.trim() ? "\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A" : Array.from(t).length > 100 ? "\u6807\u9898\u4E0D\u80FD\u8D85\u8FC7 100 \u4E2A\u5B57\u7B26" : "";
function useMotionSetting() {
  const [value, setValue] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)"), update = () => setValue(q.matches);
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return value;
}
function CompletionEmoji({ play, reduced }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!play || reduced) {
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const timer = setTimeout(() => setPlaying(false), 3100);
    return () => clearTimeout(timer);
  }, [play, reduced]);
  return <img className="completionEmoji" src={playing ? fluentRelieved : fluentRelievedStill} alt="" />;
}
function App() {
  const reduced = useMotionSetting();
  const pendingCompletions=useRef(new Set()),[completing,setCompleting]=useState({}),[firstArrival,setFirstArrival]=useState(null),arrivalTimers=useRef([]);
  const [celebration,setCelebration]=useState(null),[hover,setHover]=useState(null),[menu,setMenu]=useState(null);
  const [state, setState] = useState(null), [error, setError] = useState(""), [notice, setNotice] = useState(null), [guidance, setGuidance] = useState(null), [tab, setTab] = useState("inbox"), [detail, setDetail] = useState(null), [highlight, setHighlight] = useState(null), [captureActive, setCaptureActive] = useState(false);
  useEffect(()=>{if(state||error)window.dispatchEvent(new Event('tuck-ready'))},[!!state,!!error]);
  useEffect(() => {
    if (reduced) {
      setCelebration(null);
      document.querySelectorAll(".nativeCompletionFlight").forEach((el) => el.remove());
    }
  }, [reduced]);
  const kind = new URLSearchParams(location.search).get("window") || "main", prepare = useRef(null), noticeTimer = useRef(), guideTimer = useRef(), stateRef = useRef(), drag = useRef(null), newButton = useRef();
  useEffect(() => {
    if (!menu) return;
    const close = (e) => {
      if (!e.target.closest(".nativeCardMenu,.cardMore")) setMenu(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);
  const update = (s) => {
    if (s && (!stateRef.current || s.revision >= stateRef.current.revision)) {

      if (stateRef.current?.day !== s.day) drag.current = null;
      if (s.arrangedDays?.includes(s.day)) setGuidance(null);
      stateRef.current = s;
      setState(s);
    }
  };
  const showNotice = (text, token, expiresAt,meta={}) => {
    setNotice({ text, token,...meta });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), expiresAt ? Math.max(0, expiresAt - Date.now()) : 6500);
  };
  const showGuide = (g) => {
    if (!g) return;
    setTab("inbox");
    setGuidance(g);
    clearTimeout(guideTimer.current);
    guideTimer.current = setTimeout(() => setGuidance(null), 6e3);
  };
  async function dispatch(action) {
    try {
      const r = await api.dispatch(action);
      if (r.error) throw Error(r.error);
      if(r.presentation==='onboarding-handoff')return r;
      update(r.state);
      setError("");
      if(r.notice)showNotice(action.type==="complete"&&r.state.tasks.every(t=>t.status==="done")?"全部完成":typeof r.notice==="string"?r.notice:r.notice.text,r.undoToken,undefined,{kind:action.type,taskId:r.createdId});
      if (r.guidance && kind === "main") showGuide(r.guidance);
      if (action.type === "complete" && !reduced) setCelebration({ id: crypto.randomUUID(), taskId: action.id, allDone: !!r.celebration });
      if (["undo", "restore", "move", "delete"].includes(action.type)) setCelebration(null);
      if (r.celebration) {
        showNotice("\u4ECA\u65E5\u4E8B\u5DF2\u6BD5", r.undoToken);
        setTab("inbox");
      }
      return r;
    } catch (e) {
      setError(e.message || "\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
      throw e;
    }
  }
  useEffect(() => {
    api.snapshot().then(update).catch((e) => setError(e.message));
    const off = api.onState(update), offEvent = api.onEvent(async (e) => {
      if(e.type==='onboarding-handoff'&&kind==='main'){
        arrivalTimers.current.forEach(clearTimeout);setTab('inbox');setNotice(null);setGuidance(null);setFirstArrival({id:e.id,phase:'opening'});update(e.state);
        const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:620;
        arrivalTimers.current=[setTimeout(()=>{setFirstArrival({id:e.id,phase:'arriving'});setHighlight(e.id);showNotice('任务已收下',e.undoToken,e.expiresAt,{kind:'create',taskId:e.id})},delay),setTimeout(()=>{setFirstArrival(null);setHighlight(null)},delay+4000)];
      }
      if (e.type === "guidance" && kind === "main") showGuide(e.guidance);
      if (e.type === "capture-created" && kind === "main") {
        if(!stateRef.current?.tasks.some(t=>t.id===e.id&&t.status!=="done"))return;
        setTab("inbox");
        setHighlight(e.id);
        setTimeout(() => setHighlight(null), 2500);
        showNotice("任务已收下",e.undoToken,e.expiresAt,{kind:"create",taskId:e.id});
        if (e.source && !matchMedia("(prefers-reduced-motion: reduce)").matches) requestAnimationFrame(() => {
          const card2 = document.querySelector('[data-task="' + e.id + '"] .cardSurface');
          if (!card2) return;
          const rect = card2.getBoundingClientRect();
          const x = e.source.x - (rect.left + rect.width / 2), y = e.source.y - (rect.top + rect.height / 2);
          card2.animate([{ transform: `translate(${x}px,${y}px) scale(.75)`, opacity: 0.25 }, { transform: "translate(0,0) scale(1)", opacity: 1 }], { duration: 440, easing: "cubic-bezier(.16,1,.3,1)" });
        });
      }
      if (e.type === "capture-active") {
        setCaptureActive(!!e.active);
        if (e.active) setGuidance(null);
      }
      if (e.type === "error") setError(e.message);
      if (e.type === "capture-open" || e.type === "capture-opened") {
        setGuidance(null);
        setCaptureActive(true);
      }
      if (e.type === "capture-closed") {
        setCaptureActive(false);
        newButton.current?.focus();
      }
      if (e.type === "prepare-capture") {
        setGuidance(null);
        let ok = true;
        try {
          if (prepare.current) ok = await prepare.current();
        } catch {
          ok = false;
        }
        api.capturePrepared(e.requestId, ok);
      }
    });
    return () => {
      off?.();
      offEvent?.();
      clearTimeout(noticeTimer.current);
      clearTimeout(guideTimer.current);
      arrivalTimers.current.forEach(clearTimeout);
    };
  }, []);
  if (kind === "main") window.shouxiaFlush = async () => prepare.current ? await prepare.current() : true;
  const run = (a) => dispatch(a).catch(() => null);
  const boardDrag = useBoardDrag({ state, move: (id, status, index, expectedDay) => move(id, status, index, expectedDay), onStart: () => {
    setHover(null);
    setMenu(null);
  } });
  if(!state)return error?<div className="startupError" role="alert"><h1>未能打开 Tuck</h1><p>{error}</p><button onClick={()=>location.reload()}>重试</button></div>:null;
  if (kind === "capture") return <Capture state={state} dispatch={dispatch} error={error} setError={setError} />;
  if (kind === "settings") return <Settings state={state} dispatch={dispatch} error={error} />;
  const tasks = (state.tasks || []).filter(t=>!(firstArrival?.phase==='opening'&&t.id===firstArrival.id)), today = tasks.filter((t) => t.status === "today"), inbox = tasks.filter((t) => t.status === "inbox"), done = tasks.filter((t) => t.status === "done").sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)), selected = tasks.find((t) => t.id === detail);
  async function completeTask(t) {
    if(pendingCompletions.current.has(t.id))return;
    pendingCompletions.current.add(t.id);setCompleting(v=>({...v,[t.id]:true}));
    try {
    const el = document.querySelector('[data-task="' + t.id + '"]'), target = document.querySelector(".doneCount"), r = el?.getBoundingClientRect(), end = target?.getBoundingClientRect(), copy = el?.cloneNode(true);
    const result = await run({ type: "complete", id: t.id });
    if (result && !reduced && copy && r && end) {
      copy.className = "nativeCompletionFlight "+(t.project?"hasProject":"noProject");
      copy.removeAttribute("data-task");
      Object.assign(copy.style, { left: r.x + "px", top: r.y + "px", width: r.width + "px" });
      document.body.append(copy);
      copy.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${end.x + end.width / 2 - r.x - r.width / 2}px,${end.y + end.height / 2 - r.y - r.height / 2}px) scale(.08)`, opacity: 0 }], { duration: 420, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).finished.finally(() => copy.remove());
    }

    } finally {pendingCompletions.current.delete(t.id);setCompleting(v=>{const next={...v};delete next[t.id];return next})}
  }
  async function move(id, status, index, expectedDay) {
    setGuidance(null);
    const result = await run({ type: "move", id, status, ...index === void 0 ? {} : { index }, ...expectedDay === void 0 ? {} : { expectedDay } });
    if (result) requestAnimationFrame(() => document.querySelector('[data-task="' + id + '"] .cardTitle')?.focus({ preventScroll: true }));
  }
  function card(t, index) {
    return <motion.article layout='position' initial={reduced ? false : firstArrival?.id===t.id ? {opacity:0,y:-20,scale:.95} : { opacity: 0, y: 9, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0 } }} transition={reduced ? { duration: 0 } : { duration:firstArrival?.id===t.id ? .62 : .22, ease: [0.16, 1, 0.3, 1] }} className={"planCard "+(t.project?"hasProject ":"noProject ")+(t.status === "today" ? "todayCard " : "")+(t.status === "done" ? "completedCard " : "") + (highlight === t.id ? "newHighlight" : "")} key={t.id} data-task={t.id} data-order={t.status==="today"?index+1:undefined} data-arriving={firstArrival?.id===t.id?true:undefined} onKeyDown={(e) => {
      if (e.altKey && ["ArrowUp", "ArrowDown"].includes(e.key) && t.status !== "done") {
        e.preventDefault();
        move(t.id, t.status, Math.max(0, index + (e.key === "ArrowUp" ? -1 : 1)));
      }
    }}>
 <div className={"cardSurface " + (hover === t.id && !reduced ? "nativeHover" : "")} onMouseEnter={() => setHover(t.id)} onMouseLeave={() => setHover(null)} onPointerDown={e=>{if(t.status==='done'||e.target.closest('button,input,textarea,a,[role=menu]'))return;boardDrag.start(e,t)}}><button className={"completeTask " + (t.status === "done" ? "checked" : "")} aria-label={(t.status === "done" ? "\u6062\u590D\uFF1A" : "\u5B8C\u6210\uFF1A") + t.title} disabled={t.status === "done"||!!completing[t.id]} onClick={() => completeTask(t)}><Glyph name="check" /></button><button className="cardTitle" aria-describedby={t.status==='today'?'sequence-'+t.id:undefined} title={t.title} onPointerDown={(e) => boardDrag.start(e, t)} onClick={() => {
      if (boardDrag.clickBlocked()) return;
      setGuidance(null);
      setDetail(t.id);
    }}><span>{t.title}</span>{t.project && <small className="taskProject" title={t.project} style={projectStyle(t.project)}>{t.project}</small>}</button><button className={"cardMore "+(t.status==="today"?"hasSequence":"")} aria-label={"\u66F4\u591A\u64CD\u4F5C\uFF1A" + t.title} aria-expanded={menu === t.id} onClick={() => setMenu(menu === t.id ? null : t.id)}>{t.status==='today'&&<span className="taskSequenceSlot" style={{'--sequence-scale':Math.min(1,2/String(index+1).length)}} aria-hidden="true"><motion.span key={index+1} initial={reduced?false:{scale:.72,y:-4}} animate={{scale:1,y:0}} transition={{duration:reduced?0:.24,ease:[.16,1,.3,1]}}>{index+1}</motion.span></span>}<span className="moreGlyph"><Glyph name="more" /></span></button>{t.status==='today'&&<span className="srOnly" id={'sequence-'+t.id}>今天第 {index+1} 项</span>}{menu === t.id && <div className="nativeCardMenu" role="menu" popover="manual" ref={el=>{if(!el||el.matches(":popover-open"))return;const r=el.parentElement.querySelector(".cardMore").getBoundingClientRect();el.style.left=Math.max(8,Math.min(innerWidth-180,r.right-170))+"px";el.style.top=Math.min(innerHeight-160,r.bottom+6)+"px";el.showPopover();el.querySelector("button")?.focus()}} onKeyDown={(e) => {
      if (e.key === "Escape") {
        setMenu(null);
        e.currentTarget.parentElement.querySelector(".cardMore")?.focus();
      }
    }}>{t.status !== "done" && <><button role="menuitem" autoFocus onClick={async()=>{await move(t.id,t.status==="today"?"inbox":"today");setMenu(null)}}><Glyph name={t.status==="today"?"back":"arrow"}/>{t.status==="today"?"移回待整理":"移到今天"}</button><button role="menuitem" onClick={async()=>{await completeTask(t);setMenu(null)}}><Glyph name="check"/>完成事项</button></>}{t.status === "done" && <button role="menuitem" autoFocus onClick={async () => {
      const r = await run({ type: "restore", id: t.id });
      if (r) setMenu(null);
    }}><Glyph name="undo"/>恢复事项</button>}<button className="destructive" role="menuitem" autoFocus={false} onClick={async () => {
      const r = await run({ type: "delete", id: t.id });
      if (r) setMenu(null);
    }}><Glyph name="trash"/>删除事项</button></div>}</div></motion.article>;
  }
  const todayDone = done.filter((t) => new Date(t.completedAt).toDateString() === (/* @__PURE__ */ new Date()).toDateString()), earlier = done.filter((t) => !todayDone.includes(t));
  return <><Ambient /><section className={"planner "+(firstArrival?.phase==='opening'?'firstArrivalOpening':'')} data-first-arrival={firstArrival?.phase} aria-label="事项编排" inert={selected || captureActive || !state.settings?.onboardingCompleted ? true : void 0}>{celebration && !reduced && <CompletionConfetti event={celebration} onFinish={() => setCelebration(null)} />}<header className="plannerHeader"><HomeHeading count={today.length + inbox.length} name={state.settings?.displayName} reduced={reduced||firstArrival?.phase==='opening'} /><button ref={newButton} className="addTask" onClick={() => {
    setGuidance(null);
    api.openCapture();
  }}><Glyph name="plus" />新建事项</button></header><div className="plannerColumns"><section className="planColumn leftColumn"><header className="columnHeader"><div className="listSummary" role="tablist" aria-label="事项列表">{[["inbox", "\u5F85\u6574\u7406", inbox.length], ["done", "\u5DF2\u5B8C\u6210", done.length]].map(([key, label, count]) => <button key={key} className={key === "inbox" ? "inboxTab" : "doneCount"} role="tab" aria-pressed={tab === key} aria-selected={tab === key} onClick={() => setTab(key)}>{label}<span>{count}</span></button>)}</div></header><div className="cardList" hidden={tab !== "inbox"} data-zone="inbox"><AnimatePresence initial={false}>{inbox.map(card)}</AnimatePresence>{!inbox.length && <div className="listEmpty"><h3>暂无待整理事项</h3><button onClick={() => api.openCapture()}>新建事项</button></div>}</div><div className="cardList" hidden={tab !== "done"}>{todayDone.length > 0 && <h3 className="recordHeading">今天 · {todayDone.length}</h3>}<AnimatePresence initial={false}>{todayDone.map(card)}</AnimatePresence>{earlier.length > 0 && <h3 className="recordHeading">更早</h3>}<AnimatePresence initial={false}>{earlier.map(card)}</AnimatePresence>{!done.length && <div className="listEmpty">完成的事，会留在这里。</div>}</div></section><section className="planColumn todayColumn"><header className="columnHeader todayHeading"><h2><Glyph name="sun" />今天要做 <span>{today.length}</span></h2><span className="todayDate"><span>{(/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</span><span>{(/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN", { weekday: "long" })}</span></span></header><div className="guidanceSlot">{guidance && <aside className="dayGuidance" role="status"><div>{!(guidance.body || "").includes("\u672A\u5B8C\u6210") && <strong>{guidance.title || "\u4ECA\u5929\uFF0C\u60F3\u505A\u4E9B\u4EC0\u4E48\uFF1F"}</strong>}<p>{(guidance.body || guidance.message || guidance.description || "").replace("\u5DF2\u56DE\u5230\u5F85\u6574\u7406\uFF0C\u9009\u51E0\u4EF6\u5F00\u59CB\u5427\u3002", "\u5DF2\u79FB\u56DE\u5F85\u6574\u7406\u3002")}</p></div><button aria-label="关闭今日提示" onClick={() => setGuidance(null)}><Glyph name="close"/></button></aside>}</div><div className="cardList" data-zone="today"><AnimatePresence initial={false}>{today.map(card)}</AnimatePresence>{!today.length && <div className={"listEmpty todayEmpty " + (state.celebrated ? "dayComplete" : "")}>{state.celebrated ? <CompletionPaper /> : <span className="emptySymbol"><Glyph name="sun" /></span>}<h3>{state.celebrated ? "\u4ECA\u65E5\u4E8B\u5DF2\u6BD5" : tab === "done" ? "\u4ECA\u5929\u8FD8\u60F3\u505A\u4E9B\u4EC0\u4E48\uFF1F" : !tasks.length ? "\u5148\u6536\u4E0B\u4E00\u4EF6\u4E8B\u5427" : "\u6311\u4E00\u4EF6\uFF0C\u5F00\u59CB\u4ECA\u5929"}</h3>{!state.celebrated && <><p>{tab === "done" ? "\u53BB\u5F85\u6574\u7406\u4E2D\u6311\u4E00\u4EF6\uFF0C\u5F00\u59CB\u4ECA\u5929\u3002" : !tasks.length ? "\u6709\u4E86\u4E8B\u9879\uFF0C\u518D\u5B89\u6392\u4ECA\u5929\u3002" : "\u628A\u5DE6\u8FB9\u7684\u4E8B\u9879\u79FB\u5230\u8FD9\u91CC\u3002"}</p>{tab === "done" && <button onClick={() => setTab("inbox")}>查看待整理</button>}</>}</div>}</div></section></div></section>{!state.settings?.onboardingCompleted&&<Onboarding state={state} dispatch={dispatch} renderCapture={onConfigure=><Capture embedded onConfigure={onConfigure} state={state} dispatch={dispatch} error={error} setError={setError}/>}/>}{selected && <DetailEditor key={selected.id} task={selected} projects={[...new Set(tasks.map((t) => t.project).filter(Boolean))]} dispatch={dispatch} prepare={prepare} onClose={() => setDetail(null)} />} {error && <div className="errorBanner" role="alert">{error}<button onClick={() => setError("")}>关闭</button></div>}{!selected && !captureActive && <AnimatePresence>{notice && (notice.kind!=="create"||tasks.some(t=>t.id===notice.taskId&&t.status!=="done")) && <motion.div key="notice" className="undoToast" role="status" initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.16 } }}><span>{notice.text}</span>{notice.token && <button onClick={async () => {
    const r = await run({ type: "undo", token: notice.token });
    if (r) setNotice(null);
  }}>撤销</button>}<button aria-label="关闭提示" onClick={() => setNotice(null)}><Glyph name="close"/></button></motion.div>}</AnimatePresence>}</>;
}
function Capture({ state, dispatch, error, setError, embedded=false, onConfigure }) {
  const [recognition, setRecognition] = useState({ configured: false, loading: false, failed: false, empty: false, message: "" }), [draft, setDraft] = useState(state.draft || { title: "", asset: null }), [busy, setBusy] = useState(false), [expanded, setExpanded] = useState(false), [saved, setSaved] = useState(true), [success, setSuccess] = useState(false), [knowledgeCandidates, setKnowledgeCandidates] = useState([]), [knowledgeBusy, setKnowledgeBusy] = useState(false), [knowledgeError, setKnowledgeError] = useState("");
  const knowledgeTimer = useRef(), knowledgeContext = useRef(null), captureRoot = useRef(), input = useRef(), file = useRef(), ime = useRef(false), draftRef = useRef(draft), queue = useRef(Promise.resolve()), pending = useRef(0), request = useRef(null), imageVersion = useRef(0), dirty = useRef(false), successRef = useRef(false), editVersion = useRef(0);
  useLayoutEffect(() => {
    if (input.current) {
      input.current.style.height = "24px";
      input.current.style.height = Math.min(144, Math.max(24, input.current.scrollHeight)) + "px";
    }
    if(embedded)return;
    const el = captureRoot.current;
    if (!el) return;
    const resize = () => api.resizeCapture?.(Math.ceil(Math.max(el.scrollHeight, el.getBoundingClientRect().height)));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [draft.title, !!draft.asset, expanded, error, success, recognition.loading, knowledgeCandidates.length, knowledgeError]);
  useEffect(() => {
    const refresh = () => api.recognitionStatus().then((status) => setRecognition((current) => ({ ...current, configured: status.configured }))).catch(() => {
    });
    refresh();
    return api.onEvent((event) => {
      if (event.type === "recognition-configured") refresh();
    });
  }, []);
  useEffect(() => () => clearTimeout(knowledgeTimer.current), []);
  useEffect(()=>{if(embedded&&draftRef.current.asset)setExpanded(true)},[embedded]);
  useEffect(() => {
    if(!embedded)input.current?.focus();
    return api.onEvent((e) => {
      if (e.type === "capture-focus") {
        successRef.current = false;
        setSuccess(false);
        setBusy(false);
        request.current = null;
        requestAnimationFrame(() => input.current?.focus());
      }
    });
  }, []);
  useEffect(() => {
    if (!pending.current && !dirty.current) {
      setDraft(state.draft || { title: "", asset: null });
      draftRef.current = state.draft || { title: "", asset: null };
    }
  }, [state.revision]);
  function patch(p) {
    const next = { ...draftRef.current, ...p };
    draftRef.current = next;
    setDraft(next);
    setSaved(false);
    dirty.current = true;
    pending.current++;
    queue.current = queue.current.catch(() => {
    }).then(() => dispatch({ type: "draft", patch: next })).then(() => {
      pending.current--;
      if (!pending.current) {
        dirty.current = false;
        setSaved(true);
      }
    }).catch((e) => {
      pending.current--;
      setError(e.message);
      throw e;
    });
    queue.current.catch(() => {
    });
    return queue.current;
  }
  async function submit() {
    if (busy || ime.current) return;
    const issue = validTitle(draftRef.current.title);
    if (issue) {
      setError(issue);
      return;
    }
    setBusy(true);
    imageVersion.current++;
    try {
      if (!await window.shouxiaFlush()) throw Error("\u8349\u7A3F\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
      if (!saved) await dispatch({ type: "draft", patch: draftRef.current });
      request.current ||= crypto.randomUUID();
      await dispatch({ type: "create", requestId: request.current });
      request.current = null;
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  window.shouxiaFlush = async () => {
    try {
      await queue.current;
      return true;
    } catch {
      try {
        await dispatch({ type: "draft", patch: draftRef.current });
        dirty.current = false;
        setSaved(true);
        return true;
      } catch {
        return false;
      }
    }
  };
  async function close() {
    if (busy) return;
    try {
      if (!await window.shouxiaFlush()) throw Error("\u4FDD\u5B58\u5931\u8D25");
      await api.closeCapture();
    } catch (e) {
      setError("\u8349\u7A3F\u672A\u4FDD\u5B58\uFF0C\u4ECD\u4E3A\u4F60\u4FDD\u7559\u5728\u6B64\u7A97\u53E3\u3002\u8BF7\u91CD\u8BD5\u3002");
    }
  }
  async function analyze(url, version) {
    const edit = editVersion.current;
    setRecognition((current) => ({ ...current, loading: true, failed: false, empty: false, message: "\u6B63\u5728\u7406\u89E3\u622A\u56FE\u2026" }));
    try {
      const [result] = await Promise.all([(embedded&&url===exampleAsset.url&&!recognition.configured?recognizeExample():api.recognize(url)), new Promise((resolve) => setTimeout(resolve,embedded?0:2e3))]);
      if (version !== imageVersion.current) return;
      knowledgeContext.current = result.contextToken || null;
      let candidates = Array.isArray(result.candidates) ? result.candidates : [];
      if (edit === editVersion.current && !draftRef.current.title.trim() && result.title) await patch({ title: result.title });
      else if (knowledgeContext.current && draftRef.current.title.trim()) {
        try {
          const candidate = await api.knowledgePropose({ token: knowledgeContext.current, title: draftRef.current.title });
          if (candidate) candidates = [candidate, ...candidates.filter((item) => item.kind !== "person")];
        } catch {
        }
      }
      if (version !== imageVersion.current) return;
      setRecognition((current) => ({ ...current, loading: false, failed: false, empty: !result.title, contextToken: knowledgeContext.current, message: result.title ? "" : result.reason || "\u6CA1\u6709\u8BC6\u522B\u5230\u660E\u786E\u4E8B\u9879\uFF0C\u8BF7\u624B\u52A8\u586B\u5199\u3002" }));
      setKnowledgeCandidates(candidates);
      if (result.memoryUnavailable) setKnowledgeError("\u77E5\u8BC6\u8BB0\u5FC6\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u4E0D\u5F71\u54CD\u521B\u5EFA\u4E8B\u9879\u3002");
    } catch (error2) {
      if (version === imageVersion.current) {
        const raw = String(error2?.message || ""), allowed = ["\u8BC6\u522B\u670D\u52A1\u8FDE\u63A5\u5931\u8D25\u6216\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002", "\u65E0\u6CD5\u8BFB\u53D6\u8BC6\u522B\u914D\u7F6E\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u91CD\u65B0\u914D\u7F6E\u3002", "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u622A\u56FE\u8BC6\u522B\u3002", "\u56FE\u7247\u683C\u5F0F\u65E0\u6548\u3002", "\u8BC6\u522B\u7ED3\u679C\u683C\u5F0F\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5\u6216\u624B\u52A8\u586B\u5199\u3002"];
        const match = raw.match(/(识别请求无效|API Key 无效或与服务地区不匹配|账号或模型没有访问权限|图片或请求过大|服务无法处理这张图片|请求过于频繁或账号额度不足|识别服务暂时不可用|识别服务拒绝请求)（HTTP \d{3}）/);
        const message = match ? match[0] : allowed.find((x) => raw.includes(x)) || "\u8BC6\u522B\u672A\u5B8C\u6210\uFF0C\u53EF\u80FD\u662F\u670D\u52A1\u54CD\u5E94\u6216\u672C\u5730\u4FDD\u5B58\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5\u3002";
        setRecognition((current) => ({ ...current, loading: false, failed: true, empty: false, message }));
      }
    }
  }
  async function useExample(){
    if(busy)return;const version=++imageVersion.current;clearTimeout(knowledgeTimer.current);knowledgeContext.current=null;setKnowledgeCandidates([]);setKnowledgeError('');setError('');setExpanded(true);setRecognition(v=>({...v,loading:true,failed:false,empty:false,message:''}));
    try{await patch({asset:exampleAsset});await analyze(exampleAsset.url,version)}catch{setRecognition(v=>({...v,loading:false,failed:true,message:'示例未能载入，请重试。'}))}
  }
  async function addImage(f) {
    if (!f) return;
    const version = ++imageVersion.current;
    if (f.size > 20 * 1024 * 1024) {
      setError("\u56FE\u7247\u4E0D\u80FD\u8D85\u8FC7 20 MB");
      return;
    }
    if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type)) {
      setError("\u8BF7\u9009\u62E9 PNG\u3001JPEG\u3001WebP \u6216 GIF \u56FE\u7247");
      return;
    }
    try {
      const url = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(Error("\u56FE\u7247\u8BFB\u53D6\u5931\u8D25"));
        r.readAsDataURL(f);
      });
      const img = new Image();
      img.src = url;
      await img.decode();
      if (!img.naturalWidth || !img.naturalHeight) throw Error("\u56FE\u7247\u5DF2\u635F\u574F");
      if (version !== imageVersion.current) return;
      clearTimeout(knowledgeTimer.current);
      knowledgeContext.current = null;
      setKnowledgeCandidates([]);
      setKnowledgeError("");
      if (recognition.configured) setRecognition((current) => ({ ...current, loading: true, failed: false, empty: false, message: "\u6B63\u5728\u7406\u89E3\u622A\u56FE\u2026" }));
      setExpanded(embedded);
      await patch({ asset: { url, name: f.name || "\u7C98\u8D34\u7684\u56FE\u7247", width: img.naturalWidth, height: img.naturalHeight } });
      setError("");
      if (recognition.configured) analyze(url, version);
      else setRecognition((current) => ({ ...current, message: "\u8BC6\u522B\u5C1A\u672A\u914D\u7F6E\uFF0C\u53EF\u624B\u52A8\u586B\u5199\u4E8B\u9879\u3002" }));
    } catch (e) {
      if (version === imageVersion.current) {
        setRecognition((current) => ({ ...current, loading: false }));
        setError("\u65E0\u6CD5\u89E3\u7801\u6216\u4FDD\u5B58\u8FD9\u5F20\u56FE\u7247\uFF0C\u539F\u8349\u7A3F\u5DF2\u4FDD\u7559\u3002");
      }
    }
  }
  return <main ref={captureRoot} className={"captureApp "+(embedded?"embeddedCapture ":"")+(!state.settings?.onboardingCompleted?"firstRun":"")} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
    e.preventDefault();
    if (!busy) addImage(e.dataTransfer.files[0]);
  }} onPaste={(e) => {
    const f = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"))?.getAsFile();
    if (f) {
      e.preventDefault();
      if (!busy) addImage(f);
    }
  }} onKeyDown={(e) => {
    if (ime.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (expanded) setExpanded(false);
      else close();
    }
  }}><header className="captureHeader windowHeader"><span>{draft.asset ? "\u5DF2\u6DFB\u52A0\u622A\u56FE" : "\u65B0\u5EFA\u4E8B\u9879"}</span>{!state.settings?.onboardingCompleted && <span className="firstCaptureShortcut">随时按 <kbd>{formatShortcut(state.settings?.shortcut) || "\u5DF2\u505C\u7528"}</kbd> 唤醒</span>}</header>{success ? <div className="captureSuccess" role="status"><Glyph name="check"/>已收下</div> : <>{!draft.asset && <div className="emptyState"><div className="pasteGlyph"><Glyph name="imagePlus" size={24}/></div><h1>{embedded?"粘贴一张要做的事的截图":"把截图粘贴在这里"}</h1><p>{embedded?"也可以拖入图片，或":"配置识别后可自动提取事项。也可以拖入图片，或"}<button onClick={() => file.current.click()}>选择图片</button></p>{embedded&&<button className="useExample" type="button" onClick={useExample}>使用示例截图<Glyph name="arrow" size={14}/></button>}</div>}<div className="titleActionRow"><label className="srOnly" htmlFor="capture-title">事项标题</label><textarea id="capture-title" ref={input} value={draft.title} disabled={busy} placeholder="写下要做的事…" onChange={(e) => {
    editVersion.current++;
    request.current = null;
    setError("");
    const value = e.target.value, version = editVersion.current;
    setKnowledgeCandidates((current) => current.filter((item) => item.kind !== "person"));
    patch({ title: value });
    clearTimeout(knowledgeTimer.current);
    if (knowledgeContext.current && !ime.current) knowledgeTimer.current = setTimeout(async () => {
      try {
        const candidate = await api.knowledgePropose({ token: knowledgeContext.current, title: value });
        if (candidate && version === editVersion.current) setKnowledgeCandidates((current) => [candidate, ...current.filter((item) => item.kind !== "person")]);
      } catch {
      }
    }, 900);
  }} onCompositionStart={() => ime.current = true} onCompositionEnd={(e) => {
    ime.current = false;
    const value = e.currentTarget.value, token = knowledgeContext.current, version = editVersion.current;
    clearTimeout(knowledgeTimer.current);
    if (token) knowledgeTimer.current = setTimeout(async () => {
      try {
        const candidate = await api.knowledgePropose({ token, title: value });
        if (candidate && version === editVersion.current) setKnowledgeCandidates((current) => [candidate, ...current.filter((item) => item.kind !== "person")]);
      } catch {
      }
    }, 900);
  }} onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey && !ime.current && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      submit();
    }
  }} /><button className="primary" disabled={busy || !!validTitle(draft.title)} onClick={submit}>{busy ? "\u6B63\u5728\u4FDD\u5B58\u2026" : "\u6536\u4E0B"}<Glyph name="arrow" /></button></div>{draft.asset && <section className={"captureImage " + (expanded ? "expanded" : "") + (recognition.loading ? " scanning" : "")}><div className="captureImageVisual"><button className="imagePreview" onClick={() => !embedded&&setExpanded(!expanded)} aria-expanded={expanded} aria-label={expanded ? "\u6536\u8D77\u622A\u56FE" : "\u653E\u5927\u622A\u56FE"}><img src={draft.asset.url} alt="已添加的截图，点击展开" /></button>{recognition.loading && <span className="scanLine" aria-hidden="true" />}<button className="removeShot" aria-label="移除截图" disabled={busy} onClick={() => {
    imageVersion.current++;
    clearTimeout(knowledgeTimer.current);
    knowledgeContext.current = null;
    setKnowledgeCandidates([]);
    setRecognition((current) => ({ ...current, loading: false, failed: false, empty: false, contextToken: null, message: "" }));
    patch({ asset: null });
    setExpanded(false);
  }}><Glyph name="close"/></button>{recognition.loading ? <span className="srOnly" role="status">正在识别截图</span> : <>{!expanded && (recognition.failed || recognition.empty) && <span className="imageProblemBadge" role="status" title={recognition.message}>{recognition.failed ? "\u8BC6\u522B\u5931\u8D25" : "\u672A\u627E\u5230\u4E8B\u9879"}</span>}{expanded && <button className={"imageAction " + (recognition.failed || recognition.empty ? "imageActionProblem" : "")} title={recognition.message || void 0} aria-label={recognition.failed?"识别失败，重试":undefined} onClick={() => (embedded&&draft.asset.url===exampleAsset.url)||recognition.configured?analyze(draft.asset.url,++imageVersion.current):embedded?onConfigure?.():api.openSettings()}>{(embedded&&draft.asset.url===exampleAsset.url&&!draft.title)?"试试识别":!recognition.configured&&!(embedded&&draft.asset.url===exampleAsset.url)?"配置识别":recognition.failed ? (recognition.message.includes("超时")?"连接超时 · 重试":"识别失败 · 重试") : recognition.empty ? "\u672A\u627E\u5230\u4E8B\u9879 \xB7 \u91CD\u8BD5" : "\u91CD\u65B0\u8BC6\u522B"}</button>}<span className="srOnly" role="status">{recognition.message}</span></>}</div></section>}{(error || Array.from(draft.title).length > 100) && <p className="fieldError" role="alert">{error || "\u6807\u9898\u4E0D\u80FD\u8D85\u8FC7100\u4E2A\u5B57\u7B26\u3002"}</p>}<p className="captureHint">Enter 收下 · Shift + Enter 换行 · Esc 保留草稿并关闭</p></>}{knowledgeCandidates.length > 0 && (() => {
    const candidate = knowledgeCandidates[0], message = candidate.kind === "person" ? `\u8FD9\u4F4D\u53EF\u80FD\u662F ${candidate.name}\uFF0C\u8981\u8BB0\u4F4F\u5417\uFF1F` : candidate.kind === "self" ? `\u622A\u56FE\u4E2D\u7684 ${candidate.name} \u662F\u4F60\u5417\uFF1F` : candidate.kind === "project" ? `\u8BB0\u4F4F\u9879\u76EE\u300C${candidate.text}\u300D\uFF1F` : candidate.kind === "relation" ? `\u8BB0\u4F4F ${candidate.person} \u4E0E\u300C${candidate.project}\u300D\u6709\u5173\uFF1F` : candidate.kind === "project_hint" ? `\u8FD9\u4EF6\u4E8B\u53EF\u80FD\u548C\u300C${candidate.project}\u300D\u6709\u5173\uFF0C\u8981\u6DFB\u52A0\u5417\uFF1F` : `\u8BB0\u4F4F\u8FD9\u6761\u4FE1\u606F\u300C${candidate.text}\u300D\uFF1F`;
    const decide = async (decision) => {
      setKnowledgeBusy(true);
      setKnowledgeError("");
      try {
        const result = await api.knowledgeDecide({ id: candidate.id, decision });
        if (decision === "confirm" && result.kind === "project_hint" && draftRef.current.title === result.baseTitle) await patch({ title: result.baseTitle + "\uFF08" + result.project + "\uFF09" });
        if (decision === "confirm" && result.kind === "person" && draftRef.current.title.includes("\u5BF9\u65B9")) await patch({ title: draftRef.current.title.replace(/((?:转发|发送|发|分享|提交|提供|交付|交|寄)(?:给|至))对方/u, (_, prefix) => prefix + result.name) });
        setKnowledgeCandidates((current) => current.filter((item) => item.id !== candidate.id));
      } catch (e) {
        setKnowledgeError(e.message?.replace(/^.*?: Error: /, "") || "\u65E0\u6CD5\u4FDD\u5B58\uFF0C\u8BF7\u91CD\u8BD5\u3002");
      } finally {
        setKnowledgeBusy(false);
      }
    };
    return <div className="undoToast knowledgeToast" role="status"><span>{message}</span><button disabled={knowledgeBusy} onClick={() => decide("confirm")}>确认</button><button disabled={knowledgeBusy} onClick={() => decide("reject")}>不是</button><button aria-label="关闭提示" disabled={knowledgeBusy} onClick={() => setKnowledgeCandidates((current) => current.filter((item) => item.id !== candidate.id))}><Glyph name="close"/></button></div>;
  })()}{knowledgeError && <div className="undoToast knowledgeError" role="alert"><span>{knowledgeError}</span><button aria-label="关闭提示" onClick={() => setKnowledgeError("")}><Glyph name="close"/></button></div>}<input ref={file} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => {
    addImage(e.target.files[0]);
    e.target.value = "";
  }} /></main>;
}
createRoot(document.getElementById("root")).render(<StartupGate><App /></StartupGate>);
