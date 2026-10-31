import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {Icon} from "./ui.jsx";
export default function DetailEditor({ task, projects, dispatch, prepare, onClose }) {
  const [title, setTitle] = useState(task.title), [project, setProject] = useState(task.project || ""), [query, setQuery] = useState(""), [pending, setPending] = useState([]), [picker, setPicker] = useState(false), [confirm, setConfirm] = useState(false), [image, setImage] = useState(false), [actual, setActual] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const panel = useRef(), editor = useRef(), thumb = useRef(), ime = useRef(false), saving = useRef(false), combo = useRef();
  const dirty = title !== task.title || project !== (task.project || "");
  const options = [.../* @__PURE__ */ new Set([...projects, ...pending])].filter((p) => p.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const q = query.trim();
  prepare.current = async () => {
    if (dirty || saving.current) {
      setError("\u8BF7\u5148\u4FDD\u5B58\u6216\u53D6\u6D88\u5F53\u524D\u4FEE\u6539\uFF0C\u518D\u65B0\u5EFA\u4E8B\u9879\u3002");
      editor.current?.focus();
      return false;
    }
    return true;
  };
  useEffect(() => {
    const previous = document.activeElement;
    editor.current?.focus();
    return () => {
      prepare.current = null;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useLayoutEffect(() => {
    if (editor.current) {
      editor.current.style.height = "44px";
      editor.current.style.height = Math.min(116, editor.current.scrollHeight + 2) + "px";
    }
  }, [title]);
  useEffect(() => {
    const outside = (e) => {
      if (!e.target.closest(".nativeProject")) setPicker(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    if (confirm) panel.current?.querySelector(".editDecision .primary")?.focus();
    if (image) panel.current?.querySelector(".nativeImageViewer button")?.focus();
  }, [confirm, image]);
  function choose(value) {
    setProject(value);
    if (value && !projects.includes(value)) setPending((p) => [.../* @__PURE__ */ new Set([...p, value])]);
    setPicker(false);
    combo.current?.focus();
  }
  function close() {
    if (busy) return;
    if (dirty) setConfirm(true);
    else onClose();
  }
  async function save() {
    if (saving.current || ime.current) return;
    if (!title.trim() || Array.from(title).length > 100) {
      setError(!title.trim() ? "\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u8BF7\u586B\u5199\u540E\u518D\u4FDD\u5B58\u3002" : "\u6807\u9898\u4E0D\u80FD\u8D85\u8FC7100\u4E2A\u5B57\u7B26\u3002");
      editor.current?.focus();
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      await dispatch({ type: "edit", id: task.id, patch: { title, project } });
      onClose();
    } catch (e) {
      setError(e.message || "\u6CA1\u6709\u4FDD\u5B58\u6210\u529F\uFF0C\u4FEE\u6539\u4ECD\u5728\uFF0C\u8BF7\u91CD\u8BD5\u3002");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const fmt = (t) => new Date(t).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return <div className="detailBackdrop" onClick={(e) => e.target === e.currentTarget && close()} onKeyDown={(e) => {
    if (e.nativeEvent.isComposing || ime.current) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (image) {
        setImage(false);
        requestAnimationFrame(() => thumb.current?.focus());
      } else if (confirm) {
        setConfirm(false);
        editor.current?.focus();
      } else if (picker) {
        setPicker(false);
        combo.current?.focus();
      } else close();
    }
    if (e.key === "Tab") {
      const container = panel.current.querySelector(".nativeImageViewer") || panel.current.querySelector(".editDecision") || panel.current;
      const els = [...container.querySelectorAll('button:not(:disabled),textarea:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter((x) => !x.closest("[inert]"));
      const first = els[0], last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }}>
 <section className="detailFormPanel nativeDetail" ref={panel} role="dialog" aria-modal="true" aria-label="事项详情"><div inert={confirm || image ? true : void 0}><header><h2>事项详情</h2><button aria-label="关闭详情" disabled={busy} onClick={close}><Icon name="close"/></button></header><div className="detailBody"><div className="detailField"><label htmlFor="detail-title">标题</label><textarea ref={editor} id="detail-title" value={title} disabled={busy} aria-invalid={!!error} onChange={(e) => {
    setTitle(e.target.value);
    setError("");
  }} onCompositionStart={() => ime.current = true} onCompositionEnd={() => ime.current = false} /></div><div className="detailField nativeProject"><label htmlFor="detail-project">所属项目</label><div className="projectInputShell"><input ref={combo} id="detail-project" role="combobox" aria-label="搜索或新建项目" aria-expanded={picker} aria-controls="native-project-options" placeholder="搜索或新建项目…" value={picker ? query : project} disabled={busy} maxLength={40} onClick={() => {
    setQuery("");
    setPicker(true);
  }} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!picker) {
        setQuery("");
        setPicker(true);
        return;
      }
      panel.current.querySelector(".projectOption")?.focus();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (!picker) {
        setQuery("");
        setPicker(true);
        return;
      }
      choose(options[0] || q);
    }
  }} /><button aria-label="展开项目选项" disabled={busy} onClick={() => {
    setQuery("");
    setPicker(!picker);
  }}><Icon name="down"/></button></div>{picker && <div id="native-project-options" className="nativeProjectOptions" role="listbox">{options.map((p) => <button key={p} role="option" aria-selected={p === project} className="projectOption" onClick={() => choose(p)}>{p}{p === project && <small>已选</small>}</button>)}{q && !options.some((p) => p.toLocaleLowerCase() === q.toLocaleLowerCase()) && <button className="projectOption" onClick={() => choose(q)}>创建「{q}」</button>}{!q && project && <button className="projectOption" onClick={() => choose("")}>清除项目</button>}</div>}</div>{task.asset && <div className="nativeSource"><span>原始截图</span><button ref={thumb} className="detailThumb" aria-label="放大查看原始截图" onClick={() => {
    setImage(true);
    setActual(false);
    setPicker(false);
  }}><img src={task.asset.url} alt="原始截图缩略图" /></button></div>}<dl className="detailMetadata"><div><dt>状态</dt><dd>{{ inbox: "\u5F85\u6574\u7406", today: "\u4ECA\u5929\u8981\u505A", done: "\u5DF2\u5B8C\u6210" }[task.status]}</dd></div><div><dt>收下时间</dt><dd>{fmt(task.createdAt)}</dd></div>{task.completedAt && <div><dt>完成时间</dt><dd>{fmt(task.completedAt)}</dd></div>}</dl>{error && <p role="alert" className="fieldError">{error}</p>}</div><footer><button className="detailAction" disabled={busy} onClick={close}>取消</button><button className="primary" disabled={busy || !dirty} onClick={save}>{busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"}</button></footer></div>
 {confirm && <div className="nativeDecisionShade"><section className="editDecision" role="alertdialog" aria-label="未保存的修改"><h3>放弃这次修改？</h3><p>标题或项目有修改，还没有保存。</p><div><button className="detailAction" onClick={onClose}>放弃修改</button><button className="primary" onClick={() => {
    setConfirm(false);
    editor.current?.focus();
  }}>继续编辑</button></div></section></div>}
 {image && <section className="nativeImageViewer" role="dialog" aria-modal="true" aria-label="原始截图"><header><h2>原始截图</h2><button onClick={() => setActual(!actual)}>{actual ? "\u9002\u5E94\u7A97\u53E3" : "\u5B9E\u9645\u5927\u5C0F"}</button><button onClick={() => {
    setImage(false);
    requestAnimationFrame(() => thumb.current?.focus());
  }}>关闭</button></header><div className={"nativeImageViewport " + (actual ? "actual" : "")} tabIndex="0"><img src={task.asset.url} alt="事项原始截图" /></div></section>}
 </section></div>;
}
