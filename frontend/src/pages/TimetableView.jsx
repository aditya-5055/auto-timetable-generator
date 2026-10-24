import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Calendar, RefreshCw, Download, AlertCircle, CheckCircle2, BookOpen, Building, GraduationCap, DoorOpen, Layers } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const GRID_ROWS = [
  { type: 'slot', label: '08:45 - 09:45', start: '08:45', end: '09:45' },
  { type: 'slot', label: '09:45 - 10:45', start: '09:45', end: '10:45' },
  { type: 'break', label: 'BREAK', duration: '10:45 - 11:00' },
  { type: 'slot', label: '11:00 - 12:00', start: '11:00', end: '12:00' },
  { type: 'slot', label: '12:00 - 01:00', start: '12:00', end: '01:00' },
  { type: 'break', label: 'LUNCH', duration: '01:00 - 01:45' },
  { type: 'slot', label: '01:45 - 02:45', start: '01:45', end: '02:45' },
  { type: 'slot', label: '02:45 - 03:45', start: '02:45', end: '03:45' }
];

const TimetableView = () => {
  const [schedule, setSchedule] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [instructors, setInstructors] = useState([]);

  const [activeTab, setActiveTab] = useState('division'); // 'division' | 'room' | 'lab' | 'instructor'
  const [selectedEntity, setSelectedEntity] = useState('all'); // 'all' or entity ID string
  
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const printAreaRef = useRef();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetableRes, divRes, roomRes, instRes] = await Promise.all([
        api.get('/timetable'),
        api.get('/divisions'),
        api.get('/rooms'),
        api.get('/instructors')
      ]);
      
      setSchedule(timetableRes.data);
      setDivisions(divRes.data);
      setRooms(roomRes.data);
      setInstructors(instRes.data);
    } catch (err) {
      setError('Failed to load timetable data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update dropdown selection when tabs change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedEntity('all');
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      
      await api.post('/timetable/generate');
      
      setSuccess('Timetable successfully generated with zero conflicts!');
      fetchData(); // Reload scheduled sections
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred during timetable generation.');
    } finally {
      setGenerating(false);
    }
  };

  // Get list of active entities for current tab
  const getTabEntities = () => {
    if (activeTab === 'division') return divisions;
    if (activeTab === 'room') return rooms.filter(r => r.roomType === 'LECTURE');
    if (activeTab === 'lab') return rooms.filter(r => r.roomType === 'LAB');
    if (activeTab === 'instructor') return instructors;
    return [];
  };

  // Entities to display (either all entities in tab, or selected single entity)
  const getEntitiesToDisplay = () => {
    const all = getTabEntities();
    if (selectedEntity === 'all') return all;
    return all.filter(e => e.id.toString() === selectedEntity);
  };

  // Download / Print PDF handler (supports single timetable or entire multi-page booklet)
  const handleDownloadPDF = () => {
    if (downloading) return;
    const element = printAreaRef.current;
    if (!element) return;

    setDownloading(true);

    try {
      let filenameSuffix = 'all';
      if (selectedEntity !== 'all') {
        if (activeTab === 'division') {
          filenameSuffix = divisions.find(d => d.id.toString() === selectedEntity)?.divisionName || 'division';
        } else if (activeTab === 'room' || activeTab === 'lab') {
          filenameSuffix = rooms.find(r => r.id.toString() === selectedEntity)?.rNumber || 'room';
        } else if (activeTab === 'instructor') {
          filenameSuffix = instructors.find(i => i.id.toString() === selectedEntity)?.name || 'instructor';
        }
      } else {
        filenameSuffix = `All_${activeTab}s_Master_Booklet`;
      }

      const pageTitle = `Timetable_${filenameSuffix}`;

      // Create an isolated invisible iframe to avoid any main-thread UI blocking
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${pageTitle}</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 8mm;
              }
              *, *::before, *::after {
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #0f172a;
                font-size: 11px;
                line-height: 1.3;
              }
              .timetable-page {
                page-break-after: always;
                break-after: page;
                margin-bottom: 24px;
                padding: 10px;
                background: #ffffff;
              }
              .timetable-page:last-child {
                page-break-after: avoid;
                break-after: avoid;
                margin-bottom: 0;
              }
              .college-header {
                text-align: center;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 6px;
                margin-bottom: 8px;
              }
              .college-header h3 {
                margin: 0;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 700;
              }
              .college-header h2 {
                margin: 2px 0 0 0;
                font-size: 15px;
                text-transform: uppercase;
                color: #312e81;
                font-weight: 800;
              }
              .college-header p {
                margin: 3px 0 0 0;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                color: #475569;
              }
              .meta-row {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                border-bottom: 1px solid #94a3b8;
                padding-bottom: 4px;
                margin-bottom: 8px;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                color: #334155;
              }
              .meta-row .text-right {
                text-align: right;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #0f172a;
                text-align: center;
                font-size: 10px;
                margin-bottom: 10px;
              }
              th, td {
                border: 1px solid #0f172a;
                padding: 4px 6px;
                vertical-align: middle;
              }
              th {
                background-color: #f1f5f9;
                font-weight: 800;
                text-transform: uppercase;
              }
              .time-col {
                width: 105px;
                font-weight: 700;
                font-family: monospace;
                background-color: #f8fafc;
              }
              .break-row {
                background-color: #f1f5f9;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-size: 10px;
              }
              .lab-cell {
                background-color: #eef2ff;
              }
              .course-code {
                font-weight: 800;
                font-size: 11px;
              }
              .sub-detail {
                font-size: 9px;
                color: #64748b;
                margin-top: 1px;
              }
              .batch-tag {
                color: #4338ca;
                font-weight: 700;
              }
              .bottom-tables {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 16px;
                margin-top: 8px;
                text-align: left;
              }
              .bottom-tables.single-col {
                grid-template-columns: 1fr;
              }
              .bottom-tables h4 {
                margin: 0 0 4px 0;
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                border-bottom: 1px solid #94a3b8;
                padding-bottom: 2px;
              }
              .bottom-tables table {
                font-size: 9px;
                margin-bottom: 0;
              }
              .signatures {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                margin-top: 24px;
                font-size: 10px;
                font-weight: 700;
                text-align: center;
              }
              .sig-line {
                width: 180px;
                margin: 0 auto;
                border-top: 1px solid #0f172a;
                padding-top: 3px;
                text-transform: uppercase;
              }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (printErr) {
          console.error('Print error:', printErr);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            setDownloading(false);
          }, 600);
        }
      }, 200);
    } catch (err) {
      console.error('Download PDF error:', err);
      setDownloading(false);
    }
  };

  // Helper to filter schedule for a specific entity
  const getScheduleForEntity = (entityObj) => {
    if (!entityObj) return [];
    const entityId = entityObj.id?.toString();
    return schedule.filter(sc => {
      if (activeTab === 'division') {
        return sc.divisionId?.toString() === entityId || sc.batch?.divisionId?.toString() === entityId;
      } else if (activeTab === 'room' || activeTab === 'lab') {
        return sc.roomId?.toString() === entityId;
      } else if (activeTab === 'instructor') {
        return sc.instructorId?.toString() === entityId;
      }
      return false;
    });
  };

  // Cell Content Renderer grouping duplicate combined sections
  const renderCellContent = (items) => {
    if (items.length === 0) return null;
    
    const grp = {};
    items.forEach(e => {
      const k = e.course?.courseNumber || e.courseNumber;
      if (!grp[k]) grp[k] = { ...e, batches: new Set(), divs: new Set() };
      if (e.batch?.batchName) grp[k].batches.add(e.batch.batchName);
      if (e.division?.divisionName) grp[k].divs.add(e.division.divisionName);
    });

    return (
      <div className="space-y-1 text-center font-medium">
        {Object.values(grp).map((g, idx) => {
          const courseCode = g.course?.courseNumber || g.courseNumber;
          const roomNum = g.room?.rNumber;
          const teacherName = g.instructor?.name;
          const divisionName = [...g.divs].sort().join(', ');
          const batchStr = g.batches.size ? `(${[...g.batches].sort().join(', ')})` : '';

          return (
            <div key={idx} className="border-b border-slate-200 last:border-0 pb-0.5 last:pb-0">
              <div className="course-code font-extrabold text-slate-900 text-xs">
                {courseCode} {batchStr && <span className="batch-tag text-indigo-700 font-semibold">{batchStr}</span>}
              </div>
              
              {activeTab === 'division' && (
                <div className="sub-detail text-[10px] text-slate-500">
                  {roomNum} / {teacherName}
                </div>
              )}

              {(activeTab === 'room' || activeTab === 'lab') && (
                <div className="sub-detail text-[10px] text-slate-600">
                  {divisionName} / {teacherName}
                </div>
              )}

              {activeTab === 'instructor' && (
                <div className="sub-detail text-[10px] text-slate-600">
                  {divisionName} / Room: {roomNum}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render bottom detail summary tables for a single entity's schedule
  const renderEntityBottomTables = (entitySchedule) => {
    if (activeTab === 'division') {
      const theoryLectures = entitySchedule.filter(s => s.course?.courseType === 'LECTURE');
      const uniqueLectures = [];
      const seenLectures = new Set();
      for (const s of theoryLectures) {
        if (!seenLectures.has(s.courseNumber)) {
          seenLectures.add(s.courseNumber);
          uniqueLectures.push(s);
        }
      }

      const practicalLabs = entitySchedule.filter(s => s.course?.courseType === 'LAB');

      return (
        <div className="bottom-tables mt-6 grid grid-cols-2 gap-6 text-left">
          <div>
            <h4 className="font-bold text-slate-900 border-b border-slate-400 pb-1 mb-2 uppercase text-[11px] tracking-wider">
              Theory Staff Assignment
            </h4>
            <table className="w-full border-collapse border border-slate-350 text-[10px] text-slate-800">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-slate-300 px-2 py-1">Course</th>
                  <th className="border border-slate-300 px-2 py-1">Instructor</th>
                </tr>
              </thead>
              <tbody>
                {uniqueLectures.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-2 py-0.5 font-semibold">{it.course?.courseNumber} - {it.course?.courseName}</td>
                    <td className="border border-slate-300 px-2 py-0.5">{it.instructor?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 border-b border-slate-400 pb-1 mb-2 uppercase text-[11px] tracking-wider">
              Practical Batches Assignment
            </h4>
            <table className="w-full border-collapse border border-slate-350 text-[10px] text-slate-800">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-slate-300 px-2 py-1">Course</th>
                  <th className="border border-slate-300 px-2 py-1">Batch</th>
                  <th className="border border-slate-300 px-2 py-1">Staff</th>
                  <th className="border border-slate-300 px-2 py-1">Lab Room</th>
                </tr>
              </thead>
              <tbody>
                {practicalLabs.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-2 py-0.5 font-semibold">{it.course?.courseNumber}</td>
                    <td className="border border-slate-300 px-2 py-0.5 text-center font-bold text-indigo-700">{it.batch?.batchName}</td>
                    <td className="border border-slate-300 px-2 py-0.5">{it.instructor?.name}</td>
                    <td className="border border-slate-300 px-2 py-0.5 text-center font-mono">{it.room?.rNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Room, Lab, or Teacher usage summary
    let tableHeader = [];
    let tableRows = [];
    let tableName = '';

    if (activeTab === 'room' || activeTab === 'lab') {
      tableName = 'Room Occupancy Usage Summary';
      tableHeader = ['Course Code', 'Associated Division / Batch', 'Assigned Staff Member'];
      
      const usageMap = {};
      entitySchedule.forEach(c => {
        const k = c.courseNumber;
        if (!usageMap[k]) usageMap[k] = { name: c.course?.courseName, targets: new Set(), insts: new Set() };
        if (c.batch?.batchName) {
          usageMap[k].targets.add(c.batch.batchName);
        } else if (c.division?.divisionName) {
          usageMap[k].targets.add(c.division.divisionName);
        }
        if (c.instructor?.name) usageMap[k].insts.add(c.instructor.name);
      });

      tableRows = Object.entries(usageMap).map(([code, info]) => [
        `${code} - ${info.name}`,
        [...info.targets].sort().join(', '),
        [...info.insts].join(', ')
      ]);
    } else if (activeTab === 'instructor') {
      tableName = 'Faculty Load Summary';
      tableHeader = ['Course Code', 'Taught Division / Batch', 'Assigned Room', 'Weekly Slots'];
      
      const loadMap = {};
      entitySchedule.forEach(c => {
        const k = `${c.courseNumber}_${c.roomId}`;
        if (!loadMap[k]) {
          loadMap[k] = {
            course: c.courseNumber,
            room: c.room?.rNumber,
            targets: new Set(),
            slots: []
          };
        }
        if (c.batch?.batchName) {
          loadMap[k].targets.add(c.batch.batchName);
        } else if (c.division?.divisionName) {
          loadMap[k].targets.add(c.division.divisionName);
        }
        if (c.meetingTime) {
          loadMap[k].slots.push(`${c.meetingTime.day} ${c.meetingTime.time}`);
        }
      });

      tableRows = Object.values(loadMap).map(row => [
        row.course,
        [...row.targets].sort().join(', '),
        row.room,
        row.slots.join(' | ')
      ]);
    }

    return (
      <div className="bottom-tables single-col mt-6 text-left">
        <h4 className="font-bold text-slate-900 border-b border-slate-400 pb-1 mb-2 uppercase text-[11px] tracking-wider">
          {tableName}
        </h4>
        <table className="w-full border-collapse border border-slate-350 text-[10px] text-slate-800">
          <thead>
            <tr className="bg-slate-100 font-bold">
              {tableHeader.map((h, i) => (
                <th key={i} className="border border-slate-300 px-3 py-1 text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className={`border border-slate-300 px-3 py-1 ${cIdx === 0 ? 'font-semibold' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {tableRows.length === 0 && (
              <tr>
                <td colSpan={tableHeader.length} className="border border-slate-300 px-3 py-3 text-center text-slate-400 italic">
                  No classes assigned to this item.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render a Single Timetable Sheet for one Entity
  const renderSingleTimetableSheet = (entityObj) => {
    const entitySchedule = getScheduleForEntity(entityObj);

    // Group items by day and slot start time for lookup
    const scheduleLookup = {};
    for (const item of entitySchedule) {
      if (!item.meetingTime) continue;
      const day = item.meetingTime.day;
      let timeStart = item.meetingTime.time.split('-')[0].trim();
      
      const parts = timeStart.split(':');
      let h = parseInt(parts[0], 10);
      if (h > 12) h -= 12;
      timeStart = `${h.toString().padStart(2, '0')}:${parts[1]}`;

      const key = `${day}_${timeStart}`;
      if (!scheduleLookup[key]) scheduleLookup[key] = [];
      scheduleLookup[key].push(item);
    }

    let metaLeft = [];
    let metaRight = [];

    if (activeTab === 'division') {
      metaLeft = [['Academic Year', '2026-27'], ['Department', 'Computer Engineering'], ['Class Room', 'A1-309 / Designated']];
      metaRight = [['Semester', 'II'], ['Class / Division', entityObj.divisionName], ['W.E.F.', '01/08/2026']];
    } else if (activeTab === 'room' || activeTab === 'lab') {
      metaLeft = [['Academic Year', '2026-27'], ['Department', 'Computer Engineering'], ['Room No.', entityObj.rNumber]];
      metaRight = [['Semester', 'II'], ['Room Type', entityObj.roomType === 'LECTURE' ? 'Lecture Hall' : 'Lab Room'], ['W.E.F.', '01/08/2026']];
    } else if (activeTab === 'instructor') {
      metaLeft = [['Academic Year', '2026-27'], ['Department', 'Computer Engineering'], ['Staff Name', entityObj.name]];
      metaRight = [['Semester', 'II'], ['Staff ID', entityObj.uid], ['W.E.F.', '01/08/2026']];
    }

    const spannedCells = {};

    return (
      <div key={entityObj.id} className="timetable-page p-6 bg-white text-slate-900 border border-slate-300 shadow-sm rounded-lg">
        {/* PICT College Header */}
        <div className="college-header flex flex-col items-center justify-center border-b-2 border-slate-800 pb-3 mb-3">
          <h3 className="text-sm font-bold tracking-tight uppercase text-center text-slate-900">
            Society for Computer Technology & Research's
          </h3>
          <h2 className="text-base font-extrabold tracking-wide uppercase text-center text-indigo-900 mt-0.5">
            Pune Institute of Computer Technology
          </h2>
          <p className="text-[10px] font-semibold uppercase text-slate-600 tracking-wider mt-0.5">
            Department of Computer Engineering
          </p>
        </div>

        {/* Meta information row */}
        <div className="meta-row grid grid-cols-4 border-b border-slate-400 pb-2 mb-3 text-[10px] font-bold text-slate-700 uppercase">
          {metaLeft.map(([label, val], idx) => (
            <div key={idx}>{label}: <span className="font-extrabold text-slate-900">{val}</span></div>
          ))}
          {metaRight.map(([label, val], idx) => (
            <div key={idx} className="text-right">{label}: <span className="font-extrabold text-slate-900">{val}</span></div>
          ))}
        </div>

        {/* The Calendar Grid */}
        <table className="w-full table-layout border-collapse border border-slate-800 text-[10px] text-slate-900 text-center">
          <thead>
            <tr className="bg-slate-100 border border-slate-800">
              <th className="time-col border border-slate-800 px-2 py-2 font-extrabold uppercase w-28">Time</th>
              {DAYS.map(day => (
                <th key={day} className="border border-slate-800 px-2 py-2 font-extrabold uppercase">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRID_ROWS.map((row, rowIndex) => {
              if (row.type === 'break') {
                return (
                  <tr key={row.label} className="break-row bg-slate-100 font-bold border border-slate-800 tracking-wider text-slate-700 text-[10px]">
                    <td className="border border-slate-800 py-1 font-mono">{row.duration}</td>
                    <td colSpan={DAYS.length} className="border border-slate-800 py-1 uppercase font-extrabold">
                      {row.label}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={row.label} className="h-14">
                  <td className="time-col border border-slate-800 bg-slate-50 font-semibold font-mono p-1 text-center">
                    {row.label}
                  </td>
                  
                  {DAYS.map(day => {
                    const lookupKey = `${day}_${row.start}`;
                    const spannedKey = `${day}_${row.start}`;
                    
                    if (spannedCells[spannedKey]) {
                      return null;
                    }

                    const items = scheduleLookup[lookupKey] || [];
                    
                    if (items.length === 0) {
                      return (
                        <td key={day} className="border border-slate-800 p-1 text-slate-300 italic text-[9px]">
                          Free
                        </td>
                      );
                    }

                    const isLabSlot = items[0].course?.courseType === 'LAB';
                    
                    if (isLabSlot) {
                      const nextRowIndex = rowIndex + 1;
                      if (nextRowIndex < GRID_ROWS.length && GRID_ROWS[nextRowIndex].type === 'slot') {
                        const nextRow = GRID_ROWS[nextRowIndex];
                        const nextSpannedKey = `${day}_${nextRow.start}`;
                        spannedCells[nextSpannedKey] = true;
                      }

                      return (
                        <td 
                          key={day} 
                          rowSpan={2} 
                          className="lab-cell border border-slate-800 bg-indigo-50/60 p-1.5 font-medium align-middle"
                        >
                          {renderCellContent(items)}
                        </td>
                      );
                    }

                    return (
                      <td key={day} className="border border-slate-800 p-1.5 align-middle">
                        {renderCellContent(items)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Bottom detail tables summary */}
        {renderEntityBottomTables(entitySchedule)}

        {/* Head of Department & Principal Signatures */}
        <div className="signatures mt-8 grid grid-cols-2 text-center text-[9px] font-bold text-slate-800">
          <div className="flex flex-col items-center">
            <div className="sig-line w-44 border-t border-slate-800 pt-1 uppercase">
              Head of CE Department
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="sig-line w-44 border-t border-slate-800 pt-1 uppercase">
              Principal, PICT
            </div>
          </div>
        </div>
      </div>
    );
  };

  const entitiesToDisplay = getEntitiesToDisplay();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Timetable Grid</h2>
          <p className="text-sm text-slate-400">Generate, view individual or master division timetables, and download printable PDFs.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Navigation Menu */}
          <div className="flex border border-slate-800 bg-slate-950 p-1 rounded-lg mr-2">
            {[
              { id: 'division', label: '🎓 Division', icon: BookOpen },
              { id: 'room', label: '🏛️ Lecture Hall', icon: Building },
              { id: 'lab', label: '🔬 Laboratory', icon: DoorOpen },
              { id: 'instructor', label: '🧑‍🏫 Teacher', icon: GraduationCap }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeTab === t.id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={12} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Context Selector Dropdown with ALL option */}
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 font-medium focus:border-indigo-500 focus:outline-none"
          >
            {activeTab === 'division' && (
              <>
                <option value="all">📚 All Divisions (Combined Master Booklet)</option>
                {divisions.map(d => (
                  <option key={d.id} value={d.id}>Class: {d.divisionName}</option>
                ))}
              </>
            )}
            {activeTab === 'room' && (
              <>
                <option value="all">🏛️ All Lecture Halls (Combined Master Booklet)</option>
                {rooms.filter(r => r.roomType === 'LECTURE').map(r => (
                  <option key={r.id} value={r.id}>Lecture Room: {r.rNumber}</option>
                ))}
              </>
            )}
            {activeTab === 'lab' && (
              <>
                <option value="all">🔬 All Laboratories (Combined Master Booklet)</option>
                {rooms.filter(r => r.roomType === 'LAB').map(r => (
                  <option key={r.id} value={r.id}>Lab Room: {r.rNumber}</option>
                ))}
              </>
            )}
            {activeTab === 'instructor' && (
              <>
                <option value="all">🧑‍🏫 All Teachers (Combined Master Booklet)</option>
                {instructors.map(i => (
                  <option key={i.id} value={i.id}>Teacher: {i.name} ({i.uid})</option>
                ))}
              </>
            )}
          </select>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Generating...' : 'Generate Timetable'}
          </button>

          {schedule.length > 0 && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Generating download...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>
                    {selectedEntity === 'all' 
                      ? `Download All ${activeTab === 'division' ? 'Divisions' : (activeTab === 'room' ? 'Rooms' : (activeTab === 'lab' ? 'Labs' : 'Teachers'))} PDF`
                      : 'Download PDF'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-950/30 border border-red-900/30 p-4 text-sm text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-950/30 border border-emerald-900/30 p-4 text-sm text-emerald-400">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-400">
          Loading timetable data...
        </div>
      ) : schedule.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500">
          No schedule has been generated yet. Click "Generate Timetable" to start the scheduler.
        </div>
      ) : (
        /* Timetables Container */
        <div className="space-y-6">
          {/* Header pill showing active view mode */}
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-indigo-400" />
              <span>
                {selectedEntity === 'all'
                  ? `Viewing Master Booklet (${entitiesToDisplay.length} ${activeTab === 'division' ? 'Divisions' : (activeTab === 'room' ? 'Lecture Halls' : (activeTab === 'lab' ? 'Labs' : 'Faculty Members'))})`
                  : `Viewing Single Schedule for ${activeTab.toUpperCase()}`}
              </span>
            </div>
            <div className="text-slate-400">
              Total Scheduled Slots: <span className="text-indigo-400 font-bold">{schedule.length}</span>
            </div>
          </div>

          {/* Printable Container */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-6 overflow-x-auto">
            <div 
              ref={printAreaRef} 
              id="timetable-print-container" 
              className="space-y-8 min-w-[950px]"
            >
              {entitiesToDisplay.map(entityObj => renderSingleTimetableSheet(entityObj))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableView;
