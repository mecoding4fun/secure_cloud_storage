import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://100.100.100.100:8000"; //<------Set your IP
const KEY = "SETAPIKEY"; //<------Set your key

export default function App() {
  const [items, setItems] = useState([]);
  const [path, setPath] = useState("");
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);  


  async function load(p = "") {
    const res = await axios.get(`${API}/files?path=${p}&key=${KEY}`);
    setItems(res.data.items);
    setPath(p);
  }

  useEffect(() => { load(); }, []);
function toggleSelect(name) {
  setSelected(prev =>
    prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
  );
}

  // SINGLE clean open handler
  function open(item) {
    if (item.is_dir) {
      load(path ? `${path}/${item.name}` : item.name);
      return;
    }

    const fullPath = path ? `${path}/${item.name}` : item.name;
    const ext = fullPath.split(".").pop().toLowerCase();

    if (["png","jpg","jpeg","gif","webp",'cr2'].includes(ext)) {
      setPreview(fullPath);
      return;
    }
    if (["mp4","mkv","mov","webm"].includes(ext)) {
      setPreview({ type:"video", file: fullPath });
      return;
    }
    if (["pdf"].includes(ext)) {
      setPreview({ type:"pdf", file: fullPath });
      return;
    }

    if (["txt","md","log","json"].includes(ext)) {
      setPreview({ type:"text", file: fullPath });
      return;
    }

    if (["mp3","wav","m4a","aac"].includes(ext)) {
      setPreview({ type:"audio", file: fullPath });
      return;
    }


    window.open(`${API}/files/${fullPath}?key=${KEY}`);
  }

  async function upload(file, onProgress, subpath="") {
    const fullPath = subpath ? `${path}/${subpath}` : path;
    
    const form = new FormData();
    form.append("file", file);

    await axios.post(`${API}/upload?path=${fullPath}&key=${KEY}`, form, {
      headers:{ "Content-Type":"multipart/form-data" },
      onUploadProgress:(e)=>onProgress(Math.round((e.loaded*100)/e.total))
    });
}



  async function remove(name) {
    await axios.delete(`${API}/files?name=${name}&path=${path}&key=${KEY}`);
    load(path);
  }

  async function renameItem(oldName) {
    const newName = prompt("Rename to:", oldName);
    if (!newName || newName === oldName) return;
    await axios.put(`${API}/rename?old_name=${oldName}&new_name=${newName}&path=${path}&key=${KEY}`);
    load(path);
  }

  // BREADCRUMB Navbar
  function BreadCrumbs() {
    if (!path) return <span>/</span>;
    const parts = path.split("/");
    let cumulative = "";
    return (
      <span>
        <span style={{cursor:"pointer"}} onClick={() => load("")}>/</span>
        {parts.map((p,i) => {
          cumulative += (i===0 ? p : `/${p}`);
          return (
            <span key={i}>
              <span style={{cursor:"pointer"}} onClick={() => load(cumulative)}>{p}</span>
              {i<parts.length-1 && " / "}
            </span>
          );
        })}
      </span>
    );
  }
function previewImage(i) {
  const ext = i.name.split(".").pop().toLowerCase();
  if(["png","jpg","jpeg","webp","gif","cr2"].includes(ext)) 
    return <img src={`${API}/files/${path?path+"/":""}${i.name}?key=${KEY}`}
      style={{width:22,height:22,objectFit:"cover",borderRadius:4}}/>;
  return "📄";
}


  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>

      <h2 style={{display:"flex", alignItems:"center", gap:"10px"}}>📁 <BreadCrumbs/></h2>
      <div
        onDrop={async (e)=>{
          e.preventDefault();
          setUploading(true);

          async function handleItem(item, currentPath="") {
            if (item.kind !== "file") return;

            const entry = item.webkitGetAsEntry();
            if (!entry) return;

            // FOLDER
            if (entry.isDirectory) {
              await axios.post(`${API}/mkdir?name=${entry.name}&path=${path}/${currentPath}&key=${KEY}`);
              
              const reader = entry.createReader();
              const readEntries = () =>
                new Promise(resolve => reader.readEntries(resolve));

              let entries;
              while(entries = await readEntries(), entries.length){
                for(const ent of entries){
                  await handleItem(
                    {kind:"file", webkitGetAsEntry:()=>ent}, 
                    currentPath ? `${currentPath}/${entry.name}` : entry.name
                  );
                }
              }
            }

            // FILE
            else if (entry.isFile) {
              entry.file(async file=>{
                await upload(file, p=>setProgress(p), currentPath);
              });
            }
          }

          const items = e.dataTransfer.items;
          for(const item of items){
            await handleItem(item);
          }

          setUploading(false);
          setProgress(0);
          load(path);
        }}

        onDragOver={(e)=>e.preventDefault()}
        style={{
          border:"2px dashed #4c525a",
          padding:"30px",
          textAlign:"center",
          borderRadius:"10px",
          marginBottom:"20px",
          background:"#2a2e33",
          opacity: uploading ? 0.6:1
        }}
      >
        {uploading 
          ? `Uploading... ${progress}%` 
          : "📤 Drag & Drop files here to upload"}
      </div>

      <div style={{display:"flex", gap:"10px", marginBottom:"15px"}}>
        <input 
          type="file" 
          multiple 
          onChange={async (e)=>{
            setUploading(true);
            for(let f of e.target.files){
              await upload(f, p=>setProgress(p));
            }
            setUploading(false);
            setProgress(0);
          }}
        />
        <button
          onClick={()=>{
            if(selected.length === items.length) setSelected([]);     // unselect
            else setSelected(items.map(i=>i.name));                   // select all
          }}
          style={{background:"#3a3f47",padding:"8px 16px",borderRadius:"8px",color:"white",border:"none"}}
        >
          {selected.length === items.length ? "Unselect All" : "Select All"}
        </button>

        <button onClick={()=>load(path)} style={btnStyle}>🔄 Refresh</button>
        <button onClick={()=>{
          const name = prompt("Folder name:");
          if(name) axios.post(`${API}/mkdir?name=${name}&path=${path}&key=${KEY}`).then(()=>load(path))
        }} style={btnStyle}>📁 New Folder</button>
        <button
          disabled={selected.length===0}
          onClick={async ()=>{
            for (const name of selected) {
              await axios.delete(`${API}/files?name=${name}&path=${path}&key=${KEY}`);
            }
            setSelected([]);
            load(path);
          }}
          style={{
            background: selected.length ? "#b94c4c" : "#444",
            padding:"8px 16px",
            borderRadius:"8px",
            border:"none",
            color:"white",
            cursor:selected.length?"pointer":"not-allowed"
          }}
        >🗑 Delete Selected</button>
        <button
          disabled={selected.length === 0}
          onClick={async ()=>{
            const prefix = prompt("Rename prefix (files become prefix_1, prefix_2, ...):");
            if(!prefix) return;

            let n=1;
            for(const name of selected){
              await axios.put(`${API}/rename?old_name=${name}&new_name=${prefix}_${n}${name.slice(name.lastIndexOf("."))}&path=${path}&key=${KEY}`);
              n++;
            }

            setSelected([]);
            load(path);
          }}
          style={{
            background:selected.length?"#3a8df7":"#444",
            padding:"8px 16px",
            borderRadius:"8px",
            border:"none",
            color:"white",
            marginLeft:"10px",
            cursor:selected.length?"pointer":"not-allowed"
          }}
        >
        ✏️ Batch Rename
        </button>

      </div>

      <ul style={{listStyle:"none", paddingLeft:0}}>
        {items.filter(i => !i.name.startsWith("._"))
        .map(i => (
          <li key={i.name}
            style={{
              display:"grid",
              gridTemplateColumns:"1fr 120px 200px 90px", // NAME | SIZE | DATE | ACTIONS
              alignItems:"center",
              background:"#1c1f23",
              margin:"6px 0",
              padding:"10px 14px",
              borderRadius:"8px",
              transition:"0.15s",
              cursor:"pointer"
            }}
            onMouseEnter={e=>e.currentTarget.style.background="#2a2e33"}
            onMouseLeave={e=>e.currentTarget.style.background="#1c1f23"}
            onClick={()=>open(i)}
          >

            {/* NAME */}
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <input
                type="checkbox"
                checked={selected.includes(i.name)}
                onChange={(e)=>{e.stopPropagation(); toggleSelect(i.name);}}
                onClick={(e)=>e.stopPropagation()}   // extra safety
              />

              {i.is_dir ? "📂" : previewImage(i)}
              {i.name}
            </span>

            {/* SIZE */}
            <span style={{opacity:0.8,fontSize:"13px"}}>
              {!i.is_dir ? (i.size/1024/1024).toFixed(2) + " MB" : "—"}
            </span>

            {/* DATE */}
            <span style={{opacity:0.7,fontSize:"12px"}}>
              {new Date(i.modified*1000).toLocaleString()}
            </span>

            {/* ACTION BUTTONS */}
            <div style={{display:"flex",gap:"6px",justifyContent:"flex-end"}}>
              <button onClick={(e)=>{e.stopPropagation(); renameItem(i.name)}}>✎</button>
              <button onClick={(e)=>{e.stopPropagation(); remove(i.name)}}>🗑</button>

            </div>

          </li>

        ))}
      </ul>

      {path && <button onClick={()=>{
        const parts = path.split("/").slice(0,-1);
        load(parts.join("/"));
      }}>⬅ Back</button>}

      {/* IMAGE PREVIEW MODAL INSIDE RETURN */}
      {preview && (
  <div style={modalBg} onClick={()=>setPreview(null)}>

    {/* IMAGE */}
    {typeof preview === "string" && (
      <img
        src={`${API}/files/${preview}?key=${KEY}`}
        style={modalImg}
        onClick={e=>e.stopPropagation()}
      />
    )}

    {/* VIDEO */}
    {preview?.type === "video" && (
      <video
        controls autoPlay
        style={{maxWidth:"90%", maxHeight:"90%"}}
        onClick={e=>e.stopPropagation()}
      >
        <source src={`${API}/stream/${preview.file}?key=${KEY}`} type="video/mp4" />
      </video>
    )}

    {/* PDF */}
    {preview?.type === "pdf" && (
      <iframe
        src={`${API}/files/${preview.file}?key=${KEY}`}
        style={{width:"90%", height:"90%", background:"white", border:"none"}}
        onClick={e=>e.stopPropagation()}
      />
    )}

    {/* TEXT */}
    {preview?.type === "text" && (
      <iframe
        src={`${API}/files/${preview.file}?key=${KEY}`}
        style={{width:"70%", height:"80%", background:"#111", color:"#fff", border:"none"}}
        onClick={e=>e.stopPropagation()}
      />
    )}

    {/* AUDIO */}
    {preview?.type === "audio" && (
      <audio
        controls autoPlay
        style={{width:"60%"}}
        onClick={e=>e.stopPropagation()}
      >
        <source src={`${API}/files/${preview.file}?key=${KEY}`} />
      </audio>
    )}

  </div>
)}


    </div>
  );
}

// styles
const rowStyle = {
  display:"flex", justifyContent:"space-between", alignItems:"center",
  background:"#1c1f23", padding:"8px 14px", borderRadius:"8px",
  margin:"6px 0", cursor:"pointer", transition:"0.15s"
};
const btnStyle = {background:"#3a3f47", padding:"8px 16px", borderRadius:"8px", color:"white", border:"none", cursor:"pointer"};
const renameBtn = {background:"#3a3f47", border:"none", borderRadius:"6px", padding:"4px 8px", color:"#d8d8d8"};
const deleteBtn = {background:"#b94c4c", border:"none", borderRadius:"6px", padding:"4px 8px", color:"white"};
const modalBg = {position:"fixed",top:0,left:0,width:"100%",height:"100%",background:"rgba(0,0,0,0.85)",
                 display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:9999};
const modalImg = {maxWidth:"90%",maxHeight:"90%",borderRadius:"12px"};
