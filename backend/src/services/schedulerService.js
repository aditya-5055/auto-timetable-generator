const Department = require('../models/Department');
const Division = require('../models/Division');
const Batch = require('../models/Batch');
const Instructor = require('../models/Instructor');
const Room = require('../models/Room');
const Course = require('../models/Course');
const MeetingTime = require('../models/MeetingTime');
const Section = require('../models/Section');
const TimetableSlot = require('../models/TimetableSlot');
const sequelize = require('../config/db');

// ── Constants & Configuration ──
const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MAX_LABS_PER_DAY = 2;
const MAX_BACKTRACKS = 200000;
const MAX_EXECUTION_TIME_MS = 60000; // 60-second safety timeout

// ── Array & Utility Helpers ──
function _to_min(t) {
  try {
    const parts = t.trim().split(':');
    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    if (h >= 1 && h <= 7) {
      h += 12; // Afternoon offset
    }
    return h * 60 + m;
  } catch (error) {
    return 0;
  }
}

function _parse(timeStr) {
  try {
    const parts = timeStr.replace(/\s/g, '').split('-');
    return [_to_min(parts[0]), _to_min(parts[1])];
  } catch (error) {
    return [0, 0];
  }
}

function _get_slot_priority(timeStr) {
  if (timeStr.includes('08:45')) return 1;
  if (timeStr.includes('11:00')) return 2;
  if (timeStr.includes('13:45')) return 3;
  return 99;
}

function _is_lab_slot_consecutive(time1Str, time2Str) {
  const [s1, e1] = _parse(time1Str);
  const [s2, e2] = _parse(time2Str);
  return (e1 === s2) || (e2 === s1);
}

// ── Scheduled Class Representation ──
class SC {
  constructor(section, mt, room, instructor, override_division = null, override_batch = null) {
    this.section = section;
    this.course = section ? section.course : null;
    this.meeting_time = mt;
    this.room = room;
    this.instructor = instructor;
    this.division = override_division ? override_division : (section ? section.division : null);
    this.batch = override_batch ? override_batch : (section ? section.batch : null);
  }
}

// ── Timetable Data Loader ──
class TimetableData {
  constructor() {
    this.divisions = [];
    this.rooms = [];
    this.meetingTimes = [];
    this.sections = [];
    this.lecture_rooms = [];
    this.lab_rooms = [];
    this.lab_slots_by_day = {};
    this.lec_slots_by_day = {};
    this.elec_2h_by_day = {};
    this.elec_1h_by_day = {};
    this.eligible_teachers = {};
    this.elective_sections = [];
    this.regular_sections = [];
    this.lecture_sections = [];
    this.lab_sections = [];
    this.lecture_frequency = {};
    this.lab_frequency = {};
    this.div_lab_groups = {};
    this.batches_by_division = {};
    this.elective_group_divisions = {};
  }

  async initialize() {
    // 1. Fetch Divisions, Rooms, and Timeslots
    this.divisions = await Division.findAll({ order: [['divisionName', 'ASC']] });
    this.rooms = await Room.findAll({ order: [['rNumber', 'ASC']] });
    this.meetingTimes = await MeetingTime.findAll();

    // 2. Fetch Sections with associations
    this.sections = await Section.findAll({
      include: [
        { model: Course, as: 'course' },
        { model: Division, as: 'division' },
        { model: Batch, as: 'batch', include: [{ model: Division, as: 'division' }] }
      ]
    });

    // 3. Partition rooms by type
    this.lecture_rooms = this.rooms.filter(r => r.roomType === 'LECTURE');
    this.lab_rooms = this.rooms.filter(r => r.roomType === 'LAB');

    // 4. Group time slots by day
    for (const day of DAYS_ORDER) {
      this.lab_slots_by_day[day] = [];
      this.lec_slots_by_day[day] = [];
      this.elec_2h_by_day[day] = [];
      this.elec_1h_by_day[day] = [];
    }

    for (const mt of this.meetingTimes) {
      if (mt.slotType === 'LAB') {
        if (!this.lab_slots_by_day[mt.day]) this.lab_slots_by_day[mt.day] = [];
        this.lab_slots_by_day[mt.day].push(mt);
      } else {
        if (mt.pid && mt.pid.startsWith('E')) {
          if (!this.elec_2h_by_day[mt.day]) this.elec_2h_by_day[mt.day] = [];
          this.elec_2h_by_day[mt.day].push(mt);
        } else {
          if (!this.lec_slots_by_day[mt.day]) this.lec_slots_by_day[mt.day] = [];
          this.lec_slots_by_day[mt.day].push(mt);
          if (!this.elec_1h_by_day[mt.day]) this.elec_1h_by_day[mt.day] = [];
          this.elec_1h_by_day[mt.day].push(mt);
        }
      }
    }

    // Sort lab slots by time priority
    for (const day of DAYS_ORDER) {
      if (this.lab_slots_by_day[day]) {
        this.lab_slots_by_day[day].sort((a, b) => _get_slot_priority(a.time) - _get_slot_priority(b.time));
      }
    }

    // 5. Build eligible instructors map per course
    // make it like subject and all instructor 
    const coursesWithTeachers = await Course.findAll({
      include: [{ model: Instructor, as: 'instructors' }]
    });
    for (const course of coursesWithTeachers) {
      this.eligible_teachers[course.courseNumber] = course.instructors || [];
    }

    // 6. Partition sections
    this.elective_sections = this.sections.filter(s => s.isElective);
    this.regular_sections = this.sections.filter(s => !s.isElective);

    this.lecture_sections = this.regular_sections.filter(s => s.course && s.course.courseType === 'LECTURE');
    this.lab_sections = this.regular_sections.filter(s => s.course && s.course.courseType === 'LAB');

    // Build frequencies
    // create a something that store both the lecture of subject and wekly fequency
    for (const s of this.lecture_sections) {
      const code = s.course.courseNumber;
      this.lecture_frequency[code] = Math.max(this.lecture_frequency[code] || 0, s.numClassInWeek);
    }
    // lab frequency 
    for (const s of this.lab_sections) {
      if (s.batch && s.batch.divisionId) {
        const code = s.course.courseNumber;
        this.lab_frequency[code] = Math.max(this.lab_frequency[code] || 0, s.numClassInWeek);
      }
    }

    // Group lab sections by (division_id, course_number)
// Division A + DBMS Lab
// ↓
// Batch A1 → DBMS Lab
// Batch A2 → DBMS Lab
// Batch A3 → DBMS Lab
// Batch A4 → DBMS Lab
// group all the batches of the same division with same subject because our target is run all 4 nbatch at smae time for same lab 
    for (const s of this.lab_sections) {
      if (s.batch && s.batch.divisionId) {
        const key = `${s.batch.divisionId}_${s.course.courseNumber}`;
        if (!this.div_lab_groups[key]) this.div_lab_groups[key] = [];
        this.div_lab_groups[key].push(s);
      }
    }

    // Map batches to division
    
    // all division and their all batches
    const batches = await Batch.findAll({ 
      include: [{ model: Division, as: 'division' }],
      order: [['batchName', 'ASC']]
    });
    for (const b of batches) {
      if (!this.batches_by_division[b.divisionId]) this.batches_by_division[b.divisionId] = [];
      this.batches_by_division[b.divisionId].push(b);
    }

    // Map divisions by elective group
// make a group of same group division for elective
    for (const div of this.divisions) {
      if (div.electiveGroup) {
        if (!this.elective_group_divisions[div.electiveGroup]) this.elective_group_divisions[div.electiveGroup] = [];
        this.elective_group_divisions[div.electiveGroup].push(div);
      }
    }

    console.log(`✅ Loaded Data: ${this.sections.length} sections (${this.elective_sections.length} elective) | ${this.divisions.length} divisions | ${this.rooms.length} rooms.`);
  }
}

// ── In-Memory CSP State Manager with Backtracking Undo Stack ──
class CSPState {
  constructor(data) {
    this.data = data;
    this.roomBusy = new Map();       // rNumber -> Array<[day, s, e]>
    this.teacherBusy = new Map();    // teacherUid -> Array<[day, s, e]>
    this.divBusy = new Map();        // divId -> Array<[day, s, e]>
    this.batchBusy = new Map();      // batchId -> Array<[day, s, e]>

    this.teacherLectureLoad = new Map(); // teacherUid -> count
    this.teacherLabLoad = new Map();     // teacherUid -> count

    this.divDayLabs = new Map();         // `${divId}_${day}` -> Array<timeString>
    this.divCourseDayLectures = new Map(); // `${divId}_${courseCode}_${day}` -> count
    this.divDayLectures = new Map();     // `${divId}_${day}` -> count

    this.divLecTeacher = new Map();      // `${divId}_${courseCode}` -> instructor
    this.batchLabTeacher = new Map();    // `${batchId}_${courseCode}` -> instructor
    this.batchLabRoom = new Map();       // `${batchId}_${courseCode}` -> room

    this.scheduledClasses = [];
  }

  isBusy(busyList, day, startMin, endMin) {
    if (!busyList) return false;
    for (let i = 0; i < busyList.length; i++) {
      const [bd, bs, be] = busyList[i];
      if (bd === day && Math.max(startMin, bs) < Math.min(endMin, be)) {
        return true;
      }
    }
    return false;
  }

  isRoomFree(mt, room) {
    const [s, e] = _parse(mt.time);
    return !this.isBusy(this.roomBusy.get(room.rNumber), mt.day, s, e);
  }

  isTeacherFree(mt, teacher) {
    const [s, e] = _parse(mt.time);
    return !this.isBusy(this.teacherBusy.get(teacher.uid), mt.day, s, e);
  }

  isDivFree(mt, divId) {
    const [s, e] = _parse(mt.time);
    return !this.isBusy(this.divBusy.get(divId), mt.day, s, e);
  }

  isBatchFree(mt, batchId) {
    const [s, e] = _parse(mt.time);
    return !this.isBusy(this.batchBusy.get(batchId), mt.day, s, e);
  }

  _pushBusy(map, key, day, s, e) {
    let list = map.get(key);
    if (!list) {
      list = [];
      map.set(key, list);
    }
    list.push([day, s, e]);
  }

  _popBusy(map, key) {
    const list = map.get(key);
    if (list) {
      list.pop();
      if (list.length === 0) map.delete(key);
    }
  }

  apply(variable, candidate) {
    const undoToken = {
      variable,
      candidate,
      classesAdded: [],
      newDivLecTeachers: [],
      newBatchLabTeachers: [],
      newBatchLabRooms: [],
      workloadDeltas: [],
      dailyDeltas: []
    };

    const mt = candidate.meetingTime;
    const [sMin, eMin] = _parse(mt.time);
    const day = mt.day;

    if (variable.type === 'ELECTIVE_GROUP') {
      const { assignments } = candidate;
      for (const assign of assignments) {
        const { section, room, instructor } = assign;
        this._pushBusy(this.roomBusy, room.rNumber, day, sMin, eMin);
        this._pushBusy(this.teacherBusy, instructor.uid, day, sMin, eMin);

        // Lock elective teacher for section if not already locked
        const key = `${section.sectionId}_ELECTIVE`;
        if (!this.divLecTeacher.has(key)) {
          this.divLecTeacher.set(key, instructor);
          undoToken.newDivLecTeachers.push(key);
        }

        const currentLecLoad = this.teacherLectureLoad.get(instructor.uid) || 0;
        this.teacherLectureLoad.set(instructor.uid, currentLecLoad + 1);
        undoToken.workloadDeltas.push({ type: 'lec', uid: instructor.uid });

        // Add SC for each division in this group
        const groupDivs = this.data.elective_group_divisions[section.electiveGroup] || 
                          (section.division ? [section.division] : []);
        for (const divObj of groupDivs) {
          const sc = new SC(section, mt, room, instructor, divObj);
          this.scheduledClasses.push(sc);
          undoToken.classesAdded.push(sc);
        }
      }

      // Mark all group divisions and batches busy
      for (const did of candidate.allDivIds) {
        this._pushBusy(this.divBusy, did, day, sMin, eMin);
        const batches = this.data.batches_by_division[did] || [];
        for (const b of batches) {
          this._pushBusy(this.batchBusy, b.id, day, sMin, eMin);
        }
      }
    } else if (variable.type === 'PARALLEL_LAB') {
      const div = variable.division;
      const courseCode = variable.courseNumber;
      const { assignments } = candidate;

      this._pushBusy(this.divBusy, div.id, day, sMin, eMin);

      const divDayKey = `${div.id}_${day}`;
      let dayLabs = this.divDayLabs.get(divDayKey);
      if (!dayLabs) {
        dayLabs = [];
        this.divDayLabs.set(divDayKey, dayLabs);
      }
      dayLabs.push(mt.time);
      undoToken.dailyDeltas.push({ type: 'divDayLab', key: divDayKey });

      for (const assign of assignments) {
        const { section, batch, room, instructor } = assign;
        this._pushBusy(this.roomBusy, room.rNumber, day, sMin, eMin);
        this._pushBusy(this.teacherBusy, instructor.uid, day, sMin, eMin);
        this._pushBusy(this.batchBusy, batch.id, day, sMin, eMin);

        // Teacher consistency lock
        const bltKey = `${batch.id}_${courseCode}`;
        if (!this.batchLabTeacher.has(bltKey)) {
          this.batchLabTeacher.set(bltKey, instructor);
          undoToken.newBatchLabTeachers.push(bltKey);
        }

        // Room consistency lock
        const blrKey = `${batch.id}_${courseCode}`;
        if (!this.batchLabRoom.has(blrKey)) {
          this.batchLabRoom.set(blrKey, room);
          undoToken.newBatchLabRooms.push(blrKey);
        }

        // Lab workload
        const currentLabLoad = this.teacherLabLoad.get(instructor.uid) || 0;
        this.teacherLabLoad.set(instructor.uid, currentLabLoad + 1);
        undoToken.workloadDeltas.push({ type: 'lab', uid: instructor.uid });

        const sc = new SC(section, mt, room, instructor, div, batch);
        this.scheduledClasses.push(sc);
        undoToken.classesAdded.push(sc);
      }
    } else if (variable.type === 'THEORY_LECTURE') {
      const div = variable.division;
      const courseCode = variable.courseNumber;
      const { section, room, instructor } = candidate;

      this._pushBusy(this.roomBusy, room.rNumber, day, sMin, eMin);
      this._pushBusy(this.teacherBusy, instructor.uid, day, sMin, eMin);
      this._pushBusy(this.divBusy, div.id, day, sMin, eMin);

      // Teacher consistency lock
      const dltKey = `${div.id}_${courseCode}`;
      if (!this.divLecTeacher.has(dltKey)) {
        this.divLecTeacher.set(dltKey, instructor);
        undoToken.newDivLecTeachers.push(dltKey);
      }

      // Lecture workload
      const currentLecLoad = this.teacherLectureLoad.get(instructor.uid) || 0;
      this.teacherLectureLoad.set(instructor.uid, currentLecLoad + 1);
      undoToken.workloadDeltas.push({ type: 'lec', uid: instructor.uid });

      // Daily lecture counts
      const divCourseDayKey = `${div.id}_${courseCode}_${day}`;
      const cCount = this.divCourseDayLectures.get(divCourseDayKey) || 0;
      this.divCourseDayLectures.set(divCourseDayKey, cCount + 1);
      undoToken.dailyDeltas.push({ type: 'divCourseDayLec', key: divCourseDayKey });

      const divDayKey = `${div.id}_${day}`;
      const dCount = this.divDayLectures.get(divDayKey) || 0;
      this.divDayLectures.set(divDayKey, dCount + 1);
      undoToken.dailyDeltas.push({ type: 'divDayLec', key: divDayKey });

      const sc = new SC(section, mt, room, instructor, div);
      this.scheduledClasses.push(sc);
      undoToken.classesAdded.push(sc);
    }

    return undoToken;
  }

  undo(undoToken) {
    const { variable, candidate, classesAdded, newDivLecTeachers, newBatchLabTeachers, newBatchLabRooms, workloadDeltas, dailyDeltas } = undoToken;
    const mt = candidate.meetingTime;

    // 1. Pop classes added
    for (let i = 0; i < classesAdded.length; i++) {
      this.scheduledClasses.pop();
    }

    // 2. Undo busy entries
    if (variable.type === 'ELECTIVE_GROUP') {
      for (const assign of candidate.assignments) {
        this._popBusy(this.roomBusy, assign.room.rNumber);
        this._popBusy(this.teacherBusy, assign.instructor.uid);
      }
      for (const did of candidate.allDivIds) {
        this._popBusy(this.divBusy, did);
        const batches = this.data.batches_by_division[did] || [];
        for (const b of batches) {
          this._popBusy(this.batchBusy, b.id);
        }
      }
    } else if (variable.type === 'PARALLEL_LAB') {
      this._popBusy(this.divBusy, variable.division.id);
      for (const assign of candidate.assignments) {
        this._popBusy(this.roomBusy, assign.room.rNumber);
        this._popBusy(this.teacherBusy, assign.instructor.uid);
        this._popBusy(this.batchBusy, assign.batch.id);
      }
    } else if (variable.type === 'THEORY_LECTURE') {
      this._popBusy(this.roomBusy, candidate.room.rNumber);
      this._popBusy(this.teacherBusy, candidate.instructor.uid);
      this._popBusy(this.divBusy, variable.division.id);
    }

    // 3. Remove newly created consistency locks
    for (const key of newDivLecTeachers) this.divLecTeacher.delete(key);
    for (const key of newBatchLabTeachers) this.batchLabTeacher.delete(key);
    for (const key of newBatchLabRooms) this.batchLabRoom.delete(key);

    // 4. Revert workload deltas
    for (const wd of workloadDeltas) {
      if (wd.type === 'lec') {
        const cur = this.teacherLectureLoad.get(wd.uid) || 1;
        if (cur <= 1) this.teacherLectureLoad.delete(wd.uid);
        else this.teacherLectureLoad.set(wd.uid, cur - 1);
      } else if (wd.type === 'lab') {
        const cur = this.teacherLabLoad.get(wd.uid) || 1;
        if (cur <= 1) this.teacherLabLoad.delete(wd.uid);
        else this.teacherLabLoad.set(wd.uid, cur - 1);
      }
    }

    // 5. Revert daily deltas
    for (const dd of dailyDeltas) {
      if (dd.type === 'divDayLab') {
        const list = this.divDayLabs.get(dd.key);
        if (list) {
          list.pop();
          if (list.length === 0) this.divDayLabs.delete(dd.key);
        }
      } else if (dd.type === 'divCourseDayLec') {
        const cur = this.divCourseDayLectures.get(dd.key) || 1;
        if (cur <= 1) this.divCourseDayLectures.delete(dd.key);
        else this.divCourseDayLectures.set(dd.key, cur - 1);
      } else if (dd.type === 'divDayLec') {
        const cur = this.divDayLectures.get(dd.key) || 1;
        if (cur <= 1) this.divDayLectures.delete(dd.key);
        else this.divDayLectures.set(dd.key, cur - 1);
      }
    }
  }
}

// ── Domain Generation & Constraint Propagation ──
class CSPDomainEngine {
  static getCandidates(variable, state, data, limit = Infinity) {
    if (variable.type === 'ELECTIVE_GROUP') {
      return this._getElectiveCandidates(variable, state, data, limit);
    } else if (variable.type === 'PARALLEL_LAB') {
      return this._getParallelLabCandidates(variable, state, data, limit);
    } else if (variable.type === 'THEORY_LECTURE') {
      return this._getTheoryLectureCandidates(variable, state, data, limit);
    }
    return [];
  }

  static hasAnyCandidate(variable, state, data) {
    const candidates = this.getCandidates(variable, state, data, 1);
    return candidates.length > 0;
  }

  static _getElectiveCandidates(variable, state, data, limit) {
    const results = [];
    const { group, sections, allDivIds, neededRooms } = variable;

    // Check both 2h and 1h elective slot pools
    const slotPools = [data.elec_2h_by_day, data.elec_1h_by_day];

    for (const pool of slotPools) {
      for (const day of DAYS_ORDER) {
        const slots = pool[day] || [];
        for (const mt of slots) {
          // Check all divisions in group free
          if (!allDivIds.every(did => state.isDivFree(mt, did))) continue;

          // Check all batches in group free
          let allBatchesFree = true;
          for (const did of allDivIds) {
            const batches = data.batches_by_division[did] || [];
            if (!batches.every(b => state.isBatchFree(mt, b.id))) {
              allBatchesFree = false;
              break;
            }
          }
          if (!allBatchesFree) continue;

          // Find available lecture rooms
          const freeLectureRooms = data.lecture_rooms.filter(r => state.isRoomFree(mt, r));
          if (freeLectureRooms.length < neededRooms) continue;

          // Match each elective section to an eligible, free teacher
          const teacherAssignments = [];
          const usedTeacherUids = new Set();
          let teachersValid = true;

          for (const sec of sections) {
            const pool = data.eligible_teachers[sec.course.courseNumber] || [];
            // Check consistency lock first
            const lockKey = `${sec.sectionId}_ELECTIVE`;
            if (state.divLecTeacher.has(lockKey)) {
              const locked = state.divLecTeacher.get(lockKey);
              if (state.isTeacherFree(mt, locked) && !usedTeacherUids.has(locked.uid)) {
                teacherAssignments.push(locked);
                usedTeacherUids.add(locked.uid);
              } else {
                teachersValid = false;
                break;
              }
            } else {
              // Find free teacher within workload limit
              const eligibleFree = pool.filter(t => 
                state.isTeacherFree(mt, t) && 
                !usedTeacherUids.has(t.uid) &&
                (state.teacherLectureLoad.get(t.uid) || 0) < t.maxLecturesPerWeek
              );

              if (eligibleFree.length === 0) {
                teachersValid = false;
                break;
              }

              // Sort by workload balance
              eligibleFree.sort((a, b) => {
                const loadA = state.teacherLectureLoad.get(a.uid) || 0;
                const loadB = state.teacherLectureLoad.get(b.uid) || 0;
                return (loadA / a.maxLecturesPerWeek) - (loadB / b.maxLecturesPerWeek);
              });

              const chosen = eligibleFree[0];
              teacherAssignments.push(chosen);
              usedTeacherUids.add(chosen.uid);
            }
          }

          if (!teachersValid || teacherAssignments.length < neededRooms) continue;

          // Assign distinct rooms
          const assignments = [];
          for (let i = 0; i < sections.length; i++) {
            assignments.push({
              section: sections[i],
              room: freeLectureRooms[i],
              instructor: teacherAssignments[i]
            });
          }

          results.push({
            meetingTime: mt,
            allDivIds,
            assignments
          });

          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  }

  static _getParallelLabCandidates(variable, state, data, limit) {
    const results = [];
    const div = variable.division;
    const courseCode = variable.courseNumber;
    const sections = variable.batchSections;
    const batchCount = sections.length;

    for (const day of DAYS_ORDER) {
      const divDayKey = `${div.id}_${day}`;
      const existingDayLabs = state.divDayLabs.get(divDayKey) || [];
      if (existingDayLabs.length >= MAX_LABS_PER_DAY) continue;

      const slots = data.lab_slots_by_day[day] || [];
      for (const mt of slots) {
        // Prevent consecutive lab slots if already assigned
        if (existingDayLabs.some(e => _is_lab_slot_consecutive(e, mt.time))) continue;

        // Division must be free
        if (!state.isDivFree(mt, div.id)) continue;

        // All batches in division must be free
        const batches = data.batches_by_division[div.id] || [];
        if (!batches.every(b => state.isBatchFree(mt, b.id))) continue;

        // Check and assign distinct free lab rooms (respecting consistency locks)
        const roomAssignments = [];
        const usedRoomNumbers = new Set();
        let roomsValid = true;

        for (const sec of sections) {
          const batch = sec.batch;
          const blrKey = `${batch.id}_${courseCode}`;
          if (state.batchLabRoom.has(blrKey)) {
            const lockedRoom = state.batchLabRoom.get(blrKey);
            if (state.isRoomFree(mt, lockedRoom) && !usedRoomNumbers.has(lockedRoom.rNumber)) {
              roomAssignments.push(lockedRoom);
              usedRoomNumbers.add(lockedRoom.rNumber);
            } else {
              roomsValid = false;
              break;
            }
          } else {
            const freeLabRooms = data.lab_rooms.filter(r => 
              state.isRoomFree(mt, r) && !usedRoomNumbers.has(r.rNumber)
            );
            if (freeLabRooms.length === 0) {
              roomsValid = false;
              break;
            }
            const chosen = freeLabRooms[0];
            roomAssignments.push(chosen);
            usedRoomNumbers.add(chosen.rNumber);
          }
        }
        if (!roomsValid || roomAssignments.length < batchCount) continue;

        // Check and assign distinct eligible free instructors (respecting consistency locks)
        const teacherAssignments = [];
        const usedTeacherUids = new Set();
        let teachersValid = true;

        for (const sec of sections) {
          const batch = sec.batch;
          const bltKey = `${batch.id}_${courseCode}`;
          if (state.batchLabTeacher.has(bltKey)) {
            const lockedTeacher = state.batchLabTeacher.get(bltKey);
            if (state.isTeacherFree(mt, lockedTeacher) && !usedTeacherUids.has(lockedTeacher.uid)) {
              teacherAssignments.push(lockedTeacher);
              usedTeacherUids.add(lockedTeacher.uid);
            } else {
              teachersValid = false;
              break;
            }
          } else {
            const pool = data.eligible_teachers[courseCode] || [];
            const freeCandidates = pool.filter(t => 
              state.isTeacherFree(mt, t) &&
              !usedTeacherUids.has(t.uid) &&
              (state.teacherLabLoad.get(t.uid) || 0) < t.maxLabsPerWeek
            );

            if (freeCandidates.length === 0) {
              teachersValid = false;
              break;
            }

            // Balance lab workload
            freeCandidates.sort((a, b) => {
              const loadA = state.teacherLabLoad.get(a.uid) || 0;
              const loadB = state.teacherLabLoad.get(b.uid) || 0;
              return (loadA / a.maxLabsPerWeek) - (loadB / b.maxLabsPerWeek);
            });

            const chosen = freeCandidates[0];
            teacherAssignments.push(chosen);
            usedTeacherUids.add(chosen.uid);
          }
        }
        if (!teachersValid || teacherAssignments.length < batchCount) continue;

        // Form full parallel assignment
        const assignments = [];
        for (let i = 0; i < sections.length; i++) {
          assignments.push({
            section: sections[i],
            batch: sections[i].batch,
            room: roomAssignments[i],
            instructor: teacherAssignments[i]
          });
        }

        results.push({
          meetingTime: mt,
          assignments
        });

        if (results.length >= limit) return results;
      }
    }
    return results;
  }

  static _getTheoryLectureCandidates(variable, state, data, limit) {
    const results = [];
    const div = variable.division;
    const courseCode = variable.courseNumber;
    const section = variable.section;

    // 1. Determine teacher (check consistency lock first)
    const dltKey = `${div.id}_${courseCode}`;
    let candidateTeachers = [];

    if (state.divLecTeacher.has(dltKey)) {
      candidateTeachers = [state.divLecTeacher.get(dltKey)];
    } else {
      const pool = data.eligible_teachers[courseCode] || [];
      candidateTeachers = pool.filter(t => 
        (state.teacherLectureLoad.get(t.uid) || 0) < t.maxLecturesPerWeek
      );
      if (candidateTeachers.length === 0) candidateTeachers = pool;

      candidateTeachers.sort((a, b) => {
        const loadA = state.teacherLectureLoad.get(a.uid) || 0;
        const loadB = state.teacherLectureLoad.get(b.uid) || 0;
        return (loadA / a.maxLecturesPerWeek) - (loadB / b.maxLecturesPerWeek);
      });
    }

    if (candidateTeachers.length === 0) return results;

    for (const teacher of candidateTeachers) {
      for (const day of DAYS_ORDER) {
        // Enforce max 2 lectures of this course per day for this division
        const divCourseDayKey = `${div.id}_${courseCode}_${day}`;
        const currentCourseLecturesOnDay = state.divCourseDayLectures.get(divCourseDayKey) || 0;
        if (currentCourseLecturesOnDay >= 2) continue;

        const slots = data.lec_slots_by_day[day] || [];
        for (const mt of slots) {
          // Check division free
          if (!state.isDivFree(mt, div.id)) continue;

          // Check teacher free
          if (!state.isTeacherFree(mt, teacher)) continue;

          // Find free lecture room
          const freeRooms = data.lecture_rooms.filter(r => state.isRoomFree(mt, r));
          if (freeRooms.length === 0) continue;

          // Pick least congested lecture room
          const room = freeRooms[0];

          results.push({
            meetingTime: mt,
            section,
            room,
            instructor: teacher
          });

          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  }
}

// ── CSP Solver with Dynamic MRV & Forward Checking ──
class CSPScheduler {
  constructor(data) {
    this.data = data;
    this.state = new CSPState(data);
    this.variables = [];
    this.backtrackCount = 0;
    this.maxDepth = 0;
    this.nodesVisited = 0;
    this.startTime = 0;
  }

  buildVariables() {
    this.variables = [];

    // 1. Elective Group Variables (Highest constraint degree)
    for (const [group, divs] of Object.entries(this.data.elective_group_divisions)) {
      const groupSections = this.data.elective_sections.filter(s => s.electiveGroup === group);
      if (groupSections.length === 0) continue;

      const allDivIds = divs.map(d => d.id);
      const neededSessions = Math.max(...groupSections.map(s => s.numClassInWeek || 2));

      for (let sIdx = 1; sIdx <= neededSessions; sIdx++) {
        this.variables.push({
          id: `ELEC_${group}_${sIdx}`,
          type: 'ELECTIVE_GROUP',
          group,
          sessionIndex: sIdx,
          divisions: divs,
          allDivIds,
          sections: groupSections,
          neededRooms: groupSections.length,
          priorityWeight: 1000 // Highest priority in MRV tie-breaking
        });
      }
    }

    // 2. Parallel Lab Variables (Division parallel batches)
    for (const div of this.data.divisions) {
      for (const [courseCode, neededSessions] of Object.entries(this.data.lab_frequency)) {
        const key = `${div.id}_${courseCode}`;
        const sections = this.data.div_lab_groups[key] || [];
        if (sections.length === 0) continue;

        for (let sIdx = 1; sIdx <= neededSessions; sIdx++) {
          this.variables.push({
            id: `LAB_${div.id}_${courseCode}_${sIdx}`,
            type: 'PARALLEL_LAB',
            division: div,
            courseNumber: courseCode,
            sessionIndex: sIdx,
            batchSections: sections,
            priorityWeight: 500 // Medium-high priority
          });
        }
      }
    }

    // 3. Theory Lecture Variables
    for (const section of this.data.lecture_sections) {
      if (!section.divisionId) continue;
      const div = this.data.divisions.find(d => d.id === section.divisionId);
      if (!div) continue;

      const course = section.course;
      const courseCode = course.courseNumber;
      const neededSessions = section.numClassInWeek || this.data.lecture_frequency[courseCode] || 3;

      for (let sIdx = 1; sIdx <= neededSessions; sIdx++) {
        this.variables.push({
          id: `LEC_${section.sectionId}_${sIdx}`,
          type: 'THEORY_LECTURE',
          division: div,
          course,
          courseNumber: courseCode,
          section,
          sessionIndex: sIdx,
          priorityWeight: 100 + neededSessions
        });
      }
    }

    console.log(`📋 Total CSP Variables Formulated: ${this.variables.length}`);
  }

  solve() {
    this.startTime = Date.now();
    this.backtrackCount = 0;
    this.maxDepth = 0;
    this.nodesVisited = 0;
    // it will be a memory help to tell the next time does it is already assigned or not
    
    this.state = new CSPState(this.data);
// get all thing need to shedule
    this.buildVariables();
// this.variables
// ↓
// All things that need to be scheduled
// “These are the variables that have NOT been scheduled yet.”
/***
  Why Set?
Because we need to easily:

* remove a variable when it is assigned
* add it back when backtracking happens
* check how many variables are still unassigned
 */
    const unassigned = new Set(this.variables);
    // “Start the backtracking search from the beginning and store whether it successfully found a complete timetable.”
    const success = this._backtrack(unassigned, 0);

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`⏱️  CSP Solver Finished in ${elapsed}s | Nodes: ${this.nodesVisited} | Backtracks: ${this.backtrackCount} | Max Depth: ${this.maxDepth}/${this.variables.length}`);
// result we store in state in sceduled_classes array           
    return {
      success,
      schedule: success ? this.state.scheduledClasses : [],
      timeTaken: parseFloat(elapsed),
      backtracks: this.backtrackCount,
      nodesVisited: this.nodesVisited,
      maxDepth: this.maxDepth,
      totalVariables: this.variables.length
    };
  }

  _selectNextVariable(unassignedSet) {
    let bestVar = null;
    let minDomainSize = Infinity;
    let bestCandidates = [];

    for (const variable of unassignedSet) {
      const candidates = CSPDomainEngine.getCandidates(variable, this.state, this.data);
      const domainSize = candidates.length;

      // Forward Checking dead-end detection: if any domain size is 0, backtrack immediately!
      if (domainSize === 0) {
        return { variable: null, domainWipeout: true, deadEndVar: variable, candidates: [] };
      }

      if (domainSize < minDomainSize || 
         (domainSize === minDomainSize && variable.priorityWeight > (bestVar ? bestVar.priorityWeight : 0))) {
        minDomainSize = domainSize;
        bestVar = variable;
        bestCandidates = candidates;
      }
    }

    return { variable: bestVar, domainWipeout: false, candidates: bestCandidates };
  }

  _orderCandidates(candidates, variable) {
    if (variable.type === 'THEORY_LECTURE') {
      const div = variable.division;
      // Sort candidates by day spread and instructor utilization
      return candidates.sort((a, b) => {
        const divDayA = this.state.divDayLectures.get(`${div.id}_${a.meetingTime.day}`) || 0;
        const divDayB = this.state.divDayLectures.get(`${div.id}_${b.meetingTime.day}`) || 0;
        if (divDayA !== divDayB) return divDayA - divDayB;

        const loadA = this.state.teacherLectureLoad.get(a.instructor.uid) || 0;
        const loadB = this.state.teacherLectureLoad.get(b.instructor.uid) || 0;
        return (loadA / a.instructor.maxLecturesPerWeek) - (loadB / b.instructor.maxLecturesPerWeek);
      });
    }

    if (variable.type === 'PARALLEL_LAB') {
      // Prioritize standard lab slot timings
      return candidates.sort((a, b) => {
        return _get_slot_priority(a.meetingTime.time) - _get_slot_priority(b.meetingTime.time);
      });
    }

    return candidates;
  }

  _forwardCheck(unassignedSet) {
    for (const variable of unassignedSet) {
      if (!CSPDomainEngine.hasAnyCandidate(variable, this.state, this.data)) {
        return false; // Domain wipeout
      }
    }
    return true;
  }

  _backtrack(unassignedSet, depth) {
    this.nodesVisited++;
    if (depth > this.maxDepth) this.maxDepth = depth;

    // Safety timeout / bounds
    if (this.backtrackCount >= MAX_BACKTRACKS || (Date.now() - this.startTime) > MAX_EXECUTION_TIME_MS) {
      return false;
    }

    // Base Case: All variables successfully assigned
    if (unassignedSet.size === 0) {
      return true;
    }

    // Dynamic Variable Selection using MRV
    // here we se;ect the variable to assign by using mrv
    // no possible assignment go back
    const { variable, domainWipeout, candidates } = this._selectNextVariable(unassignedSet);
    if (domainWipeout || !variable) {
      this.backtrackCount++;
      return false;
    }

    // Candidate Value Ordering
    const orderedCandidates = this._orderCandidates(candidates, variable);

    unassignedSet.delete(variable);

    for (const candidate of orderedCandidates) {
      // 1. Apply Assignment
      const undoToken = this.state.apply(variable, candidate);

      // 2. Forward Checking
      const forwardCheckPassed = this._forwardCheck(unassignedSet);

      if (forwardCheckPassed) {
        // 3. Recurse
        const reachedSolution = this._backtrack(unassignedSet, depth + 1);
        if (reachedSolution) {
          return true;
        }
      }

      // 4. Backtrack & Undo
      this.state.undo(undoToken);
      this.backtrackCount++;
    }

    // Restore unassigned set
    unassignedSet.add(variable);
    return false;
  }
}

// ── Verification Check Logic (7-Point Strict Safety Verifier) ──
function verifyTimetable(solution) {
  const conflicts = [];

  // 1. Room conflicts (No two classes in same room at same time)
  const roomTimeMap = {};
  for (const sc of solution) {
    const [s, e] = _parse(sc.meeting_time.time);
    const key = `${sc.room.rNumber}_${sc.meeting_time.day}_${s}_${e}`;
    if (!roomTimeMap[key]) roomTimeMap[key] = [];
    roomTimeMap[key].push(sc);
  }
  for (const [key, slots] of Object.entries(roomTimeMap)) {
    const uniqueSections = new Set(slots.map(sc => sc.section.sectionId));
    if (uniqueSections.size > 1) {
      const [room, day, s, e] = key.split('_');
      const details = slots.map(sc => {
        const name = sc.division ? sc.division.divisionName : (sc.batch ? sc.batch.batchName : 'Unknown');
        return `${name} ${sc.course ? sc.course.courseNumber : ''}`;
      });
      conflicts.push(`Room ${room} conflict on ${day} ${s}-${e}: [${details.join(', ')}]`);
    }
  }

  // 2. Teacher time conflicts (No double-booking)
  const teacherTimeMap = {};
  for (const sc of solution) {
    const [s, e] = _parse(sc.meeting_time.time);
    const key = `${sc.instructor.uid}_${sc.meeting_time.day}`;
    if (!teacherTimeMap[key]) teacherTimeMap[key] = [];
    teacherTimeMap[key].push({ s, e, sc });
  }
  for (const [key, slots] of Object.entries(teacherTimeMap)) {
    const [teacherUid, day] = key.split('_');
    for (let i = 0; i < slots.length; i++) {
      const { s: s1, e: e1, sc: sc1 } = slots[i];
      for (let j = i + 1; j < slots.length; j++) {
        const { s: s2, e: e2, sc: sc2 } = slots[j];
        if (Math.max(s1, s2) < Math.min(e1, e2)) {
          if (sc1.section.sectionId === sc2.section.sectionId) continue;
          const teacherName = sc1.instructor.name || teacherUid;
          conflicts.push(`Teacher ${teacherName} (${teacherUid}) conflict on ${day}: ${sc1.course.courseNumber} vs ${sc2.course.courseNumber}`);
        }
      }
    }
  }

  // 3. Lecture teacher consistency (same division + course -> same teacher)
  const divSubjectTeachers = {};
  for (const sc of solution) {
    if (sc.course && sc.course.courseType === 'LECTURE' && sc.division && !sc.section.isElective) {
      const key = `${sc.division.id}_${sc.course.courseNumber}`;
      if (!divSubjectTeachers[key]) divSubjectTeachers[key] = new Set();
      divSubjectTeachers[key].add(sc.instructor.uid);
    }
  }
  for (const [key, teachers] of Object.entries(divSubjectTeachers)) {
    if (teachers.size > 1) {
      const [divId, courseNumber] = key.split('_');
      conflicts.push(`Multiple teachers for division ID ${divId} course ${courseNumber}: [${Array.from(teachers).join(', ')}]`);
    }
  }

  // 4. Lab teacher consistency (same batch + course -> same teacher)
  const batchSubjectTeachers = {};
  for (const sc of solution) {
    if (sc.course && sc.course.courseType === 'LAB' && sc.batch) {
      const key = `${sc.batch.id}_${sc.course.courseNumber}`;
      if (!batchSubjectTeachers[key]) batchSubjectTeachers[key] = new Set();
      batchSubjectTeachers[key].add(sc.instructor.uid);
    }
  }
  for (const [key, teachers] of Object.entries(batchSubjectTeachers)) {
    if (teachers.size > 1) {
      const [batchId, courseNumber] = key.split('_');
      conflicts.push(`Multiple teachers for batch ID ${batchId} course ${courseNumber}: [${Array.from(teachers).join(', ')}]`);
    }
  }

  // 5. Room consistency for labs (same batch + course -> same room)
  const batchSubjectRooms = {};
  for (const sc of solution) {
    if (sc.course && sc.course.courseType === 'LAB' && sc.batch) {
      const key = `${sc.batch.id}_${sc.course.courseNumber}`;
      if (!batchSubjectRooms[key]) batchSubjectRooms[key] = new Set();
      batchSubjectRooms[key].add(sc.room.rNumber);
    }
  }
  for (const [key, rooms] of Object.entries(batchSubjectRooms)) {
    if (rooms.size > 1) {
      const [batchId, courseNumber] = key.split('_');
      conflicts.push(`Batch ID ${batchId} course ${courseNumber} uses multiple rooms: [${Array.from(rooms).join(', ')}]`);
    }
  }

  // 6. Elective same-slot consistency
  const elecGroupSlots = {};
  for (const sc of solution) {
    if (sc.section && sc.section.isElective && sc.section.electiveGroup) {
      const [s, e] = _parse(sc.meeting_time.time);
      const key = sc.section.electiveGroup;
      if (!elecGroupSlots[key]) elecGroupSlots[key] = [];
      elecGroupSlots[key].push({ day: sc.meeting_time.day, s, e });
    }
  }
  for (const [group, slotList] of Object.entries(elecGroupSlots)) {
    const byDay = {};
    for (const item of slotList) {
      if (!byDay[item.day]) byDay[item.day] = new Set();
      byDay[item.day].add(`${item.s}-${item.e}`);
    }
    for (const [day, times] of Object.entries(byDay)) {
      if (times.size > 1) {
        conflicts.push(`Elective group ${group} on ${day} has mismatched slots: [${Array.from(times).join(', ')}]`);
      }
    }
  }

  // 7. Division and Batch double-booking checks
  const divTimeMap = {};
  for (const sc of solution) {
    if (sc.division) {
      const [s, e] = _parse(sc.meeting_time.time);
      const key = `${sc.division.id}_${sc.meeting_time.day}`;
      if (!divTimeMap[key]) divTimeMap[key] = [];
      divTimeMap[key].push({ s, e, sc });
    }
  }
  for (const [key, slots] of Object.entries(divTimeMap)) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const s1 = slots[i];
        const s2 = slots[j];
        if (Math.max(s1.s, s2.s) < Math.min(s1.e, s2.e)) {
          // If different batches in the same parallel lab slot, it's allowed
          if (s1.sc.batch && s2.sc.batch && s1.sc.batch.id !== s2.sc.batch.id) {
            continue;
          }
          // If elective choices in the same elective group, they run concurrently for the division
          if (s1.sc.section && s2.sc.section && s1.sc.section.isElective && s2.sc.section.isElective && s1.sc.section.electiveGroup === s2.sc.section.electiveGroup) {
            continue;
          }
          conflicts.push(`Division conflict on ${key}: ${s1.sc.course.courseNumber} vs ${s2.sc.course.courseNumber}`);
        }
      }
    }
  }

  return conflicts;
}

// ── Runner Function ──
async function runScheduler() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 INITIALIZING CSP CONSTRAINT-SATISFACTION ENGINE');
  console.log('='.repeat(70));

  const data = new TimetableData();
  await data.initialize();

  const scheduler = new CSPScheduler(data);
  const result = scheduler.solve();

  if (result.success) {
    const conflicts = verifyTimetable(result.schedule);
    console.log(`\n🔍 Post-Verification Check: ${conflicts.length} hard conflicts detected.`);

    if (conflicts.length === 0) {
      console.log(`\n✅ PERFECT 100% CONFLICT-FREE TIMETABLE GENERATED!`);
      console.log(`   Scheduled Classes: ${result.schedule.length}`);
      console.log(`   Backtracks: ${result.backtracks}`);
      console.log(`   Time Taken: ${result.timeTaken}s`);
      console.log('='.repeat(70));

      return {
        success: true,
        schedule: result.schedule,
        conflicts: [],
        timeTaken: result.timeTaken,
        backtracks: result.backtracks,
        nodesVisited: result.nodesVisited
      };
    } else {
      console.error('🔴 Verification found unexpected hard conflicts:', conflicts);
      return {
        success: false,
        schedule: [],
        conflicts,
        timeTaken: result.timeTaken,
        backtracks: result.backtracks
      };
    }
  } else {
    console.log('\n❌ NO FEASIBLE TIMETABLE EXISTS UNDER GIVEN CONSTRAINTS.');
    console.log(`   Backtracks: ${result.backtracks}`);
    console.log(`   Time Taken: ${result.timeTaken}s`);
    console.log('='.repeat(70));

    return {
      success: false,
      schedule: [],
      conflicts: ['No mathematically feasible timetable exists without violating hard constraints.'],
      timeTaken: result.timeTaken,
      backtracks: result.backtracks
    };
  }
}

// ── Database Save Helper ──
async function saveScheduleToDatabase(solution) {
  const transaction = await sequelize.transaction();
  try {
    console.log('💾 Saving generated CSP schedule to MySQL database...');
    // 1. Clear previous slots
    await TimetableSlot.destroy({ where: {}, truncate: false, transaction });

    // 2. Insert new slots
    for (const sc of solution) {
      await TimetableSlot.create({
        sectionId: sc.section.sectionId,
        divisionId: sc.division ? sc.division.id : null,
        batchId: sc.batch ? sc.batch.id : null,
        courseNumber: sc.course ? sc.course.courseNumber : null,
        meetingTimeId: sc.meeting_time.pid,
        roomId: sc.room.id,
        instructorId: sc.instructor.id
      }, { transaction });
    }
    await transaction.commit();
    console.log(`✅ Successfully saved ${solution.length} timetable slots into MySQL timetable_slots table.`);
  } catch (error) {
    await transaction.rollback();
    console.error('🔴 Failed to save timetable to database:', error);
    throw error;
  }
}

module.exports = {
  TimetableData,
  SC,
  CSPScheduler,
  verifyTimetable,
  runScheduler,
  saveScheduleToDatabase
};
