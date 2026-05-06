import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import { getApiBase } from './apiBase';

const bulkSearchStyles = `
  .bulk-wrapper { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  .stagger-fade-in { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

  /* Top Control Bar & Sections */
  .control-bar {
    background-color: var(--card-bg); border: 1px solid var(--border-color);
    border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-sm);
  }

  .modern-form-select {
    background-color: var(--input-bg); border: 1px solid var(--border-color);
    color: var(--text-main); padding: 0.75rem 1rem; border-radius: 12px;
    outline: none; width: 100%; font-weight: 600; font-size: 1.05rem;
  }
  .modern-form-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }

  /* Query List Items */
  .query-list-container { max-height: 250px; overflow-y: auto; padding-right: 5px; }
  .query-list-item {
    background-color: var(--input-bg); border-left: 3px solid var(--primary);
    padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 0.5rem;
    font-size: 0.95rem; color: var(--text-main); font-weight: 500;
    display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
  }

  /* Grouped Results Headers */
  .group-header {
    background-color: var(--input-bg); border-left: 4px solid var(--primary);
    border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1.25rem; box-shadow: var(--shadow-sm);
  }

  /* Results Grid & Cards */
  .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
  .result-card-modern {
    background-color: var(--card-bg); border-radius: 16px; border: 1px solid var(--border-color);
    overflow: hidden; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer;
    display: flex; flex-direction: column; box-shadow: var(--shadow-sm); position: relative;
  }
  .result-card-modern:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); border-color: var(--primary); }
  .result-card-modern::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--primary);
    transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease; z-index: 2;
  }
  .result-card-modern:hover::before { transform: scaleX(1); }

  .thumb-wrapper-modern { position: relative; aspect-ratio: 16/9; background-color: #000; overflow: hidden; }
  .thumb-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; transition: transform 0.5s ease, opacity 0.3s ease; }
  .result-card-modern:hover .thumb-img { transform: scale(1.08); opacity: 0.6; }

  .play-overlay-modern {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.8); opacity: 0;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px); border-radius: 50%; width: 50px; height: 50px;
    display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }
  .result-card-modern:hover .play-overlay-modern { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  .timestamp-badge {
    position: absolute; bottom: 8px; right: 8px; background: rgba(0, 0, 0, 0.75); color: white;
    padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; backdrop-filter: blur(4px); letter-spacing: 0.5px;
  }

  /* Badges & Buttons */
  .badge-soft-modern { padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px; }
  .badge-db { background-color: var(--primary-light); color: var(--primary); }
  .badge-score { background-color: var(--warning-light); color: var(--warning); }

  .btn-primary-custom { background-color: var(--primary); color: #fff; border: none; font-weight: 600; border-radius: 10px; transition: all 0.2s; padding: 0.6rem 1.2rem; display: inline-flex; align-items: center; gap: 8px; }
  .btn-primary-custom:hover:not(:disabled) { box-shadow: 0 4px 15px var(--primary-light); transform: translateY(-2px); color: white;}
  .btn-primary-custom:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-adaptive { background-color: var(--card-bg); color: var(--text-main); border: 1px solid var(--border-color); padding: 0.6rem 1.2rem; border-radius: 10px; transition: all 0.2s ease; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; }
  .btn-adaptive:hover { background-color: var(--input-bg); border-color: var(--border-color); color: var(--primary); }

  /* SweetAlert Customizations */
  div:where(.swal2-container) div:where(.swal2-popup) { background-color: var(--card-bg); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 20px;}
  div:where(.swal2-container) h2:where(.swal2-title) { color: var(--text-main); }
  .swal2-input, .swal2-textarea { background-color: var(--input-bg) !important; color: var(--text-main) !important; border: 1px solid var(--border-color) !important; border-radius: 10px !important;}
  .swal2-input:focus, .swal2-textarea:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-light) !important; }
  .btn-cancel-adaptive { background-color: var(--input-bg) !important; color: var(--text-main) !important; border: 1px solid var(--border-color) !important; border-radius: 10px !important;}
  .btn-confirm-danger { background-color: var(--danger) !important; color: white !important; border-radius: 10px !important;}

  .cinematic-header { background: var(--card-bg); border-bottom: 1px solid var(--border-color); padding: 1.5rem 2rem; }
  .modal-detail-badge { background-color: var(--input-bg); color: var(--text-main); border: 1px solid var(--border-color); }
  
  /* Scrollbar */
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--border-color); border-radius: 20px; }
`;

const LOCAL_STORAGE_KEY = 'gyrus_js_bulk_configs';

export default function BulkSearch({ backendConfig }) {
  // 1. Synchronously initialize from LocalStorage to PREVENT the "blank on reload" bug.
  const [dbRecords, setDbRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading localStorage", e);
      return [];
    }
  });
  
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [groupedResults, setGroupedResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [videoModal, setVideoModal] = useState({ open: false, url: '', title: '', startTime: 0, endTime: 0, dbName: '', meta: {} });
  const [isDownloading, setIsDownloading] = useState(false);
  const videoRef = useRef(null);
  const videoBlobUrlRef = useRef(null);

  const apiBase = useMemo(() => getApiBase(backendConfig), [backendConfig]);

  // 2. Automatically sync to LocalStorage whenever records change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbRecords));
  }, [dbRecords]);

  // 3. Group records by keyword locally in JS
  const groupedData = useMemo(() => {
    const groups = {};
    dbRecords.forEach(record => {
      const kw = (record.keywords || 'Uncategorized').trim();
      if (!groups[kw]) groups[kw] = [];
      groups[kw].push(record);
    });
    return groups;
  }, [dbRecords]);

  // Auto-select first keyword if none selected
  useEffect(() => {
    const keys = Object.keys(groupedData);
    if (keys.length > 0 && (!selectedKeyword || !keys.includes(selectedKeyword))) {
      setSelectedKeyword(keys[0]);
    } else if (keys.length === 0) {
      setSelectedKeyword('');
    }
  }, [groupedData, selectedKeyword]);

  const handleAddNewPopup = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'New Query Configuration',
      html:
        '<input id="swal-kw" class="swal2-input" placeholder="Keyword (e.g. Test, Movie)" style="width: 80%;">' +
        '<textarea id="swal-q" class="swal2-textarea" placeholder="Describe the semantic query..." rows="3" style="width: 80%; resize: vertical; margin-top:15px;"></textarea>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-save me-2"></i> Save Config',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-primary-custom ms-2', cancelButton: 'btn btn-adaptive me-2' },
      preConfirm: () => {
        const kw = document.getElementById('swal-kw').value;
        const q = document.getElementById('swal-q').value;
        if (!kw.trim() || !q.trim()) Swal.showValidationMessage('Both Keyword and Query are required');
        return { keywords: kw.trim(), query: q.trim() };
      }
    });

    if (formValues) {
      // 100% JS logic: Create new record and prepend it to the list
      const newRecord = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        keywords: formValues.keywords,
        query: formValues.query,
        created_at: new Date().toISOString()
      };

      setDbRecords(prev => [newRecord, ...prev]);
      setSelectedKeyword(formValues.keywords); // Switch view to the new keyword group
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Configuration Saved Locally', showConfirmButton: false, timer: 2000 });
    }
  };

  const handleDeleteQuery = (id, e) => {
    e.stopPropagation();
    setDbRecords(prev => prev.filter(r => r.id !== id));
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Query Deleted', showConfirmButton: false, timer: 1500 });
  };

  const handleDeleteKeywordGroup = () => {
    Swal.fire({
      title: `Delete '${selectedKeyword}'?`,
      text: "This will locally remove the keyword and all its associated queries.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Group',
      buttonsStyling: false,
      customClass: { confirmButton: 'btn btn-confirm-danger ms-2 px-4 py-2', cancelButton: 'btn btn-cancel-adaptive me-2 px-4 py-2' }
    }).then((result) => {
      if (result.isConfirmed) {
        // Filter out all records matching the selected keyword
        setDbRecords(prev => prev.filter(r => r.keywords !== selectedKeyword));
        setGroupedResults([]); 
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Group Deleted', showConfirmButton: false, timer: 1500 });
      }
    });
  };

  const handleExecuteSearch = async () => {
    const queriesToRun = groupedData[selectedKeyword];
    if (!queriesToRun || queriesToRun.length === 0) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'No queries to run for this keyword', showConfirmButton: false, timer: 2000 });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setGroupedResults([]);

    try {
      // Extract just the query strings to send to your Flask vector search backend
      const queryStrings = queriesToRun.map(q => q.query);

      const res = await fetch(`${apiBase}/bulk-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: queryStrings, limit: 10 }) 
      });

      if (!res.ok) throw new Error('Search execution failed');

      const data = await res.json();
      let parsedGroups = [];

      // Link results back to the original JS record objects
      if (data.searchResults && Array.isArray(data.searchResults)) {
        queriesToRun.forEach((dbRecord, idx) => {
          const resItem = data.searchResults[idx];
          const items = resItem?.results || resItem || [];
          parsedGroups.push({
            keyword: selectedKeyword,
            queryRecord: dbRecord,
            items: Array.isArray(items) ? items : []
          });
        });
      }
      setGroupedResults(parsedGroups);
    } catch (e) {
      Swal.fire({ title: 'Execution Failed', text: "Failed to communicate with search API.", icon: 'error', customClass: { popup: 'rounded-4 shadow-lg' } });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Video Player Modal Logic ---
  const formatTime = (s) => {
    if (s == null) return '--:--';
    const sec = Math.floor(s);
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm}:${String(ss).padStart(2, '0')}`;
  };

  const openPlayer = async (r) => {
    const meta = r.metadata || r; 
    const videoPath = meta.video_path_relative;
    if (!videoPath) { Swal.fire({ text: 'No video path found', icon: 'error', customClass: { popup: 'rounded-4 shadow-lg' } }); return; }

    const start = meta.start_time_sec || 0;
    const end = meta.end_time_sec || 0;
    const dbName = meta.database || meta.database_name || '';
    const title = meta.video_filename || 'Indexed Video';

    if (videoBlobUrlRef.current) { URL.revokeObjectURL(videoBlobUrlRef.current); videoBlobUrlRef.current = null; }

    let clipUrl = '';
    if (videoPath.startsWith('http')) {
      clipUrl = videoPath;
    } else {
      const cleanPath = videoPath.startsWith('/') ? videoPath.slice(1) : videoPath;
      const endpoint = `${apiBase}/video/${cleanPath.split('/').map(encodeURIComponent).join('/')}`;
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start, end, db: dbName }) });
        if (!response.ok) throw new Error(`Server error`);
        const blob = await response.blob();
        clipUrl = URL.createObjectURL(blob);
        videoBlobUrlRef.current = clipUrl;
      } catch (err) {
        Swal.fire({ text: 'Failed to load clip.', icon: 'error', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false }); return;
      }
    }
    setVideoModal({ open: true, url: clipUrl, title: title, startTime: start, endTime: end, dbName: dbName, meta: meta });
  };

  const handleDownloadClip = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(videoModal.url);
      const blob = await response.blob();
      const suggestedFilename = `${videoModal.title}_clip_${videoModal.startTime}_${videoModal.endTime}.mp4`;

      if (window.showSaveFilePicker) {
        const fileHandle = await window.showSaveFilePicker({ suggestedName: suggestedFilename, types: [{ description: 'Video File', accept: { 'video/mp4': ['.mp4'] } }]});
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const a = document.createElement('a'); a.href = videoModal.url; a.download = suggestedFilename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (err) { } finally { setIsDownloading(false); }
  };

  const handleCloseVideoModal = () => {
    if (videoBlobUrlRef.current) { URL.revokeObjectURL(videoBlobUrlRef.current); videoBlobUrlRef.current = null; }
    setVideoModal({ open: false, url: '', title: '', startTime: 0, endTime: 0, dbName: '', meta: {} });
  };

  return (
    <>
      <style>{bulkSearchStyles}</style>
      <div className="bulk-wrapper container-fluid px-0">

        {/* Top Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
          <div>
            <h2 className="fw-bolder mb-1" style={{ color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Bulk Search</h2>
            <p className="mb-0 fw-medium" style={{ color: 'var(--text-muted)' }}>Configure semantic queries locally and execute them in batches.</p>
          </div>
          <button className="btn btn-adaptive rounded-pill px-3 shadow-sm" onClick={handleAddNewPopup} title="Add New Configuration">
            <i className="bi bi-plus-lg me-2"></i> Add Keyword/Query
          </button>
        </div>

        {/* Control Bar (Dropdown & Query List) */}
        <div className="control-bar mb-5 stagger-fade-in">
          <div className="row w-100 m-0">
            
            {/* Left: Keyword Selector & Execution */}
            <div className="col-12 col-md-4 p-0 pe-md-4 mb-4 mb-md-0 border-md-end" style={{ borderColor: 'var(--border-color)' }}>
              <label className="small fw-bold text-muted mb-2 d-block text-uppercase">Select Keyword Filter</label>
              <select 
                className="modern-form-select" 
                value={selectedKeyword} 
                onChange={(e) => setSelectedKeyword(e.target.value)}
                disabled={Object.keys(groupedData).length === 0}
              >
                {Object.keys(groupedData).length === 0 && <option value="">No configurations found</option>}
                {Object.keys(groupedData).map(kw => (
                  <option key={kw} value={kw}>{kw} ({groupedData[kw].length} Queries)</option>
                ))}
              </select>

              <div className="mt-4 d-flex flex-column gap-2">
                <button 
                  className="btn-primary-custom w-100 justify-content-center" 
                  onClick={handleExecuteSearch} 
                  disabled={isLoading || !selectedKeyword}
                >
                  {isLoading ? <><span className="spinner-border spinner-border-sm"></span> Processing...</> : <><i className="bi bi-play-fill fs-5 lh-1"></i> Execute Batch</>}
                </button>
                
                {selectedKeyword && (
                  <button className="btn btn-adaptive text-danger border-danger w-100 justify-content-center" onClick={handleDeleteKeywordGroup}>
                    <i className="bi bi-trash3-fill"></i> Delete Keyword Group
                  </button>
                )}
              </div>
            </div>

            {/* Right: List of Queries for the Selected Keyword */}
            <div className="col-12 col-md-8 p-0 ps-md-4 d-flex flex-column">
              <label className="small fw-bold text-muted mb-2 d-block text-uppercase">
                Active Queries for "{selectedKeyword || '...'}"
              </label>
              
              <div className="query-list-container custom-scrollbar flex-grow-1">
                {!selectedKeyword ? (
                   <p className="text-muted fst-italic">Select a keyword to view its queries.</p>
                ) : (
                  groupedData[selectedKeyword]?.map(record => (
                    <div key={record.id} className="query-list-item shadow-sm">
                      <div className="pe-3" style={{ wordBreak: 'break-word' }}>
                        {record.query}
                      </div>
                      <button 
                        className="btn btn-sm btn-link text-danger p-0 m-0 fs-5" 
                        onClick={(e) => handleDeleteQuery(record.id, e)} 
                        title="Delete Query"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Grouped Results Display Area */}
        <div className="results-container">
          {isLoading && (
            <div className="py-5 d-flex flex-column align-items-center justify-content-center stagger-fade-in text-primary gap-3">
              <div className="spinner-border" style={{ width: '3rem', height: '3rem', borderWidth: '0.25em' }} role="status"></div>
              <span className="fw-bold fs-5">Processing Bulk Semantic Search...</span>
            </div>
          )}

          {!isLoading && hasSearched && groupedResults.length === 0 && (
            <div className="text-center py-5 rounded-4 stagger-fade-in" style={{ border: '2px dashed var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
               <i className="bi bi-search text-muted opacity-50 d-block mb-3" style={{ fontSize: '3rem' }}></i>
               <h5 className="fw-bold" style={{ color: 'var(--text-main)' }}>No Matches Found</h5>
            </div>
          )}

          {!isLoading && groupedResults.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-5 stagger-fade-in" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
              
              {/* Filter / Group Header */}
              <div className="group-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <span className="badge-soft-modern bg-primary-light text-primary mb-2 shadow-sm fs-6 px-3 py-1">
                    <i className="bi bi-tag-fill me-2"></i>{group.keyword}
                  </span>
                  <p className="mb-0 fw-medium" style={{ color: 'var(--text-main)' }}>
                    <i className="bi bi-chat-quote text-muted me-2"></i> "{group.queryRecord.query}"
                  </p>
                </div>
                <div className="text-end">
                  <span className="badge rounded-pill px-3 py-2 fs-6" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                    {group.items.length} Matches
                  </span>
                </div>
              </div>

              {/* Group Video Results Grid */}
              {group.items.length === 0 ? (
                <p className="text-muted fst-italic ms-3">No videos matched this specific query.</p>
              ) : (
                <div className="results-grid pb-2">
                  {group.items.map((r, idx) => {
                    const meta = r.metadata || r;
                    const score = Math.round((r.score || r.confidence || 0) * 100) / 100;
                    const timeStr = `${formatTime(meta.start_time_sec)} - ${formatTime(meta.end_time_sec)}`;
                    
                    const thumbnailUrl = meta.video_filename 
                      ? `${apiBase}/thumbnail/${encodeURIComponent(meta.video_filename)}${meta.start_time_sec != null ? `?t=${meta.start_time_sec}` : ''}`
                      : null;

                    return (
                      <div key={idx} className="result-card-modern" onClick={() => openPlayer(r)}>
                        <div className="thumb-wrapper-modern">
                          <img className="thumb-img" src={thumbnailUrl || r.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSIjZjFmNWY5Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiAvPjwvc3ZnPg=='} alt="thumbnail" onError={(e) => e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSIjZjFmNWY5Ij48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiAvPjwvc3ZnPg=='} />
                          <div className="timestamp-badge shadow-sm"><i className="bi bi-clock-history me-1 text-warning"></i>{timeStr}</div>
                          <div className="play-overlay-modern"><i className="bi bi-play-fill"></i></div>
                        </div>

                        <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                          <div>
                            <h6 className="fw-bold text-truncate mb-2" title={meta.video_filename} style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              {meta.video_filename || 'Unknown Video'}
                            </h6>
                            <div className="d-flex flex-wrap gap-2 mb-2">
                              {meta.database_name && <span className="badge-soft-modern badge-db"><i className="bi bi-database text-primary"></i>{meta.database_name}</span>}
                            </div>
                          </div>
                          
                          {meta.text_content && (
                            <div className="mb-3 p-2 rounded-3 bg-opacity-10 bg-primary border" style={{ borderColor: 'var(--border-color)' }}>
                              <p className="mb-0 small fst-italic" style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                "{meta.text_content}"
                              </p>
                            </div>
                          )}
                          
                          <div className="d-flex align-items-center justify-content-between mt-auto">
                            {score > 0 && <span className="badge-soft-modern badge-score"><i className="bi bi-stars"></i> Match: {score}</span>}
                            <button 
                              className="btn btn-sm btn-adaptive rounded-pill px-2 py-1 shadow-sm ms-auto" title="Open Folder"
                              onClick={async (e) => { e.stopPropagation(); try { await fetch(`${apiBase}/api/open-file-location`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: meta.video_path_relative }) }); } catch (err) { } }}
                            >
                              <i className="bi bi-folder2-open text-primary"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Initial State (Before search) */}
          {!hasSearched && !isLoading && (
            <div className="text-center py-5 opacity-50 mt-5">
              <i className="bi bi-boxes fs-1 mb-3 d-block"></i>
              <h5 className="fw-bold" style={{ color: 'var(--text-main)' }}>Ready for Bulk Analysis</h5>
              <p className="text-muted">Select a keyword group and execute to see results.</p>
            </div>
          )}
        </div>

      </div>

      {/* Cinematic Video Modal */}
      {videoModal.open && ReactDOM.createPortal(
        <div onClick={(e) => { if (e.target === e.currentTarget) handleCloseVideoModal(); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(1px)', padding: '1rem' }}>
          <div className="stagger-fade-in" style={{ width: '100%', maxWidth: '1100px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
            <div className="cinematic-header" style={{ flexShrink: 0 }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h4 className="modal-title fw-bolder text-truncate pe-3" style={{ color: 'var(--text-main)' }}>{videoModal.title}</h4>
                <button type="button" className="btn-close shadow-none opacity-75" style={{ filter: 'var(--bs-btn-close-color)', flexShrink: 0 }} onClick={handleCloseVideoModal}></button>
              </div>
              <div className="d-flex flex-wrap gap-3 small fw-medium align-items-center" style={{ color: 'var(--text-muted)' }}>
                <span className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill modal-detail-badge"><i className="bi bi-play-circle-fill text-primary"></i> Scene {videoModal.startTime?.toFixed(2)}s – {videoModal.endTime?.toFixed(2)}s</span>
                {videoModal.meta.source_id && <span className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill modal-detail-badge"><i className="bi bi-fingerprint text-success"></i> {videoModal.meta.source_id}</span>}
                {videoModal.dbName && <span className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill modal-detail-badge"><i className="bi bi-database-fill text-info"></i> {videoModal.dbName}</span>}
                <button onClick={handleDownloadClip} disabled={isDownloading} className="btn btn-sm btn-adaptive rounded-pill ms-auto d-flex align-items-center gap-2 px-3">
                  {isDownloading ? <><span className="spinner-border spinner-border-sm text-primary" role="status"></span> Saving...</> : <><i className="bi bi-download text-primary"></i> Download Clip</>}
                </button>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video ref={videoRef} src={videoModal.url} controls autoPlay style={{ width: '100%', maxHeight: 'calc(95vh - 160px)', outline: 'none' }} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}