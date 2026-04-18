"""
ttgen/views.py
==============
ZERO-CONFLICT + FULLY DYNAMIC + ROOM LOCKING + LOAD BALANCING + ELECTIVES

Phase 0 → Electives
Phase 1 → Labs
Phase 2 → Lectures

ELECTIVE RULES:
  • CC and IS run in PARALLEL for the same group (G1 or G2) at the SAME slot
  • Group 1 = TE-I + TE-II,   Group 2 = TE-III + TE-IV
  • ALL 4 divisions are blocked during every elective slot
  • Each elective week needs 2 sessions on DIFFERENT days:
        Session A → 2-hour slot  (MeetingTime pid starts with 'E')
        Session B → 1-hour slot  (MeetingTime pid starts with 'L')
  • Both CC and IS for the same group are placed in the SAME slot
    (they run simultaneously in different rooms — students choose one)

CHANGES FROM PREVIOUS WORKING VERSION:
  1. TimetableData separates elective_sections / regular_sections
  2. SC.__init__ accepts optional override_division
  3. TimetableGenerator gets _reset(), Phase 0 (assign_electives),
     _get_elective_teacher_for_section(), _mark_div_only()
  4. generate() calls assign_electives() FIRST
  5. verify_timetable() adds elective same-group same-slot check
  6. lecture_frequency and lab_frequency remain DYNAMIC (built from DB)
  7. assign_labs() keeps len(sections)==0 check (not hardcoded ==4)
  8. All UI views are preserved exactly from working original
     (stats/actions dicts, messages.success calls, existing-records in context)
"""

import random
import time as time_module
from collections import defaultdict

from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from .forms import *
from .models import *

# ── Constants ─────────────────────────────────────────────────────────────────
LAB_SLOT_PRIORITY       = ['08:45', '11:00', '13:45']
DAYS_ORDER              = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
MAX_LABS_PER_DAY        = 2
MAX_RETRIES             = 100
# NOTE: Elective group → divisions mapping is now read DYNAMICALLY from the
# Division.elective_group field in the database.  No hardcoded names here.
# For SY  → leave Division.elective_group blank  (elective phase auto-skipped)
# For TE  → set Division.elective_group = 'G1' or 'G2' via Django admin/seed
# NOTE: MAX_BATCHES_PER_TEACHER removed — each teacher now has their own
# max_labs_per_week and max_lectures_per_week stored in the DB (Instructor model).

# ── Time helpers ──────────────────────────────────────────────────────────────

def _to_min(t):
    try:
        h, m = map(int, t.strip().split(':'))
        if 1 <= h <= 7:
            h += 12
        return h * 60 + m
    except Exception:
        return 0

def _parse(time_str):
    try:
        parts = time_str.replace(' ', '').split('-')
        return _to_min(parts[0]), _to_min(parts[1])
    except Exception:
        return 0, 0

def _get_slot_priority(time_str):
    if '08:45' in time_str: return 1
    if '11:00' in time_str: return 2
    if '13:45' in time_str: return 3
    return 99

def _is_lab_slot_consecutive(time1_str, time2_str):
    s1, e1 = _parse(time1_str)
    s2, e2 = _parse(time2_str)
    return (e1 == s2) or (e2 == s1)

def _times_overlap(time1_str, time2_str):
    s1, e1 = _parse(time1_str)
    s2, e2 = _parse(time2_str)
    return max(s1, s2) < min(e1, e2)


# ── Data loader ───────────────────────────────────────────────────────────────

class TimetableData:
    def __init__(self):
        self.divisions     = list(Division.objects.all().order_by('division_name'))
        self.rooms         = list(Room.objects.all())
        self.meeting_times = list(MeetingTime.objects.all())
        self.sections      = list(
            Section.objects.select_related(
                'course', 'division', 'batch', 'batch__division'
            ).all()
        )

        self.lecture_rooms = [r for r in self.rooms if r.room_type == 'LECTURE']
        self.lab_rooms     = [r for r in self.rooms if r.room_type == 'LAB']

        # ── Slot pools ────────────────────────────────────────────────────
        # lab_slots_by_day   → slot_type == 'LAB'
        # lec_slots_by_day   → slot_type == 'LECTURE' with pid NOT starting 'E'
        # elec_2h_by_day     → slot_type == 'LECTURE' with pid starting 'E'
        #                       (these are the 2-hour elective slots)
        # elec_1h_by_day     → same as lec_slots_by_day
        #                       (electives can also use normal 1-hour slots)
        self.lab_slots_by_day  = defaultdict(list)
        self.lec_slots_by_day  = defaultdict(list)
        self.elec_2h_by_day    = defaultdict(list)
        self.elec_1h_by_day    = defaultdict(list)

        for mt in self.meeting_times:
            if mt.slot_type == 'LAB':
                self.lab_slots_by_day[mt.day].append(mt)
            else:
                # LECTURE slot
                if mt.pid.startswith('E'):
                    # 2-hour elective slot
                    self.elec_2h_by_day[mt.day].append(mt)
                else:
                    # Normal 1-hour lecture slot
                    self.lec_slots_by_day[mt.day].append(mt)
                    self.elec_1h_by_day[mt.day].append(mt)

        # Sort lab slots by priority
        for day in self.lab_slots_by_day:
            self.lab_slots_by_day[day].sort(
                key=lambda mt: _get_slot_priority(mt.time))

        # Eligible teachers per course (from DB)
        self.eligible_teachers = {}
        for course in Course.objects.prefetch_related('instructors').all():
            self.eligible_teachers[course.course_number] = list(
                course.instructors.all())

        # ── Split sections into elective vs regular ───────────────────────
        self.elective_sections = [s for s in self.sections if s.is_elective]
        self.regular_sections  = [s for s in self.sections if not s.is_elective]

        self.lecture_sections  = [
            s for s in self.regular_sections
            if s.course and s.course.course_type == 'LECTURE'
        ]
        self.lab_sections      = [
            s for s in self.regular_sections
            if s.course and s.course.course_type == 'LAB'
        ]

        # ── Build lecture_frequency DYNAMICALLY from DB ───────────────────
        self.lecture_frequency = {}
        for s in self.lecture_sections:
            code = s.course.course_number
            self.lecture_frequency[code] = max(
                self.lecture_frequency.get(code, 0), s.num_class_in_week)
        print(f"📚 Lecture courses from DB: {self.lecture_frequency}")

        # ── Build lab_frequency DYNAMICALLY from DB ───────────────────────
        self.lab_frequency = {}
        for s in self.lab_sections:
            if s.batch and s.batch.division_id:
                code = s.course.course_number
                self.lab_frequency[code] = max(
                    self.lab_frequency.get(code, 0), s.num_class_in_week)
        print(f"🔬 Lab courses from DB: {self.lab_frequency}")

        # Lab sections grouped by (division_id, course_number)
        self.div_lab_groups = defaultdict(list)
        for s in self.lab_sections:
            if s.batch and s.batch.division_id:
                key = (s.batch.division_id, s.course.course_number)
                self.div_lab_groups[key].append(s)

        # Batches grouped by division
        self.batches_by_division = defaultdict(list)
        for batch in Batch.objects.all().select_related('division'):
            self.batches_by_division[batch.division_id].append(batch)

        # Division name → Division object (used by elective scheduler)
        self.div_by_name = {d.division_name: d for d in self.divisions}

        # ── Build elective_group_divisions DYNAMICALLY from DB ────────────
        # Reads Division.elective_group field — works for ANY year.
        # SY divisions → elective_group=None → empty dict → Phase 0 skipped
        # TE divisions → elective_group='G1'/'G2' → groups auto-built
        self.elective_group_divisions = defaultdict(list)   # group → [Division]
        for div in self.divisions:
            if div.elective_group:
                self.elective_group_divisions[div.elective_group].append(div)

        print(f"✅ Loaded: {len(self.sections)} sections "
              f"({len(self.elective_sections)} elective) "
              f"| {len(self.divisions)} divisions "
              f"| {len(self.lecture_frequency)} lecture courses "
              f"| {len(self.lab_frequency)} lab courses "
              f"| {len(self.elective_group_divisions)} elective groups")


# ── Scheduled class ───────────────────────────────────────────────────────────

class SC:
    __slots__ = ['section', 'course', 'meeting_time', 'room',
                 'instructor', 'division', 'batch']

    def __init__(self, section, mt, room, instructor, override_division=None):
        self.section      = section
        self.course       = section.course
        self.meeting_time = mt
        self.room         = room
        self.instructor   = instructor
        # override_division: lets one elective section produce an SC for each
        # division in the group, so all divisions show the elective slot.
        self.division     = override_division if override_division else section.division
        self.batch        = section.batch


# ── Generator ─────────────────────────────────────────────────────────────────

class TimetableGenerator:
    def __init__(self, data: TimetableData):
        self.data = data
        self._reset()

    def _reset(self):
        self.result = []

        self.room_busy    = defaultdict(list)   # room_number → [(day, s, e)]
        self.teacher_busy = defaultdict(list)   # teacher_uid → [(day, s, e)]
        self.div_busy     = defaultdict(list)   # division_id → [(day, s, e)]
        self.batch_busy   = defaultdict(list)   # batch_id    → [(day, s, e)]

        # Teacher locks
        self.div_lec_teacher   = {}   # (div_id, course_code) → Instructor
        self.batch_lab_teacher  = {}   # (batch_id, course_code) → Instructor

        # Room locking for labs
        self.batch_lab_room     = {}   # (batch_id, course_code) → Room

        self.div_day_labs         = defaultdict(list)   # (div_id, day) → [time_str]
        self.batch_lab_count      = defaultdict(int)
        self.teacher_batch_count  = defaultdict(int)
        self.teacher_lecture_load = defaultdict(int)

    # ── Busy helpers ──────────────────────────────────────────────────────────

    def _is_busy(self, busy_list, day, start_min, end_min):
        for bd, bs, be in busy_list:
            if bd == day and max(start_min, bs) < min(end_min, be):
                return True
        return False

    def _mark_busy(self, busy_list, day, start_min, end_min):
        busy_list.append((day, start_min, end_min))

    def _room_free(self, mt, room):
        s, e = _parse(mt.time)
        return not self._is_busy(self.room_busy[room.r_number], mt.day, s, e)

    def _teacher_free(self, mt, teacher):
        s, e = _parse(mt.time)
        return not self._is_busy(self.teacher_busy[teacher.uid], mt.day, s, e)

    def _div_free(self, mt, div_id):
        s, e = _parse(mt.time)
        return not self._is_busy(self.div_busy[div_id], mt.day, s, e)

    def _batch_free(self, mt, batch_id):
        s, e = _parse(mt.time)
        return not self._is_busy(self.batch_busy[batch_id], mt.day, s, e)

    def _mark(self, mt, room, teacher, div_id=None, batch_id=None):
        s, e = _parse(mt.time)
        day  = mt.day
        self._mark_busy(self.room_busy[room.r_number], day, s, e)
        self._mark_busy(self.teacher_busy[teacher.uid], day, s, e)
        if div_id:
            self._mark_busy(self.div_busy[div_id], day, s, e)
        if batch_id:
            self._mark_busy(self.batch_busy[batch_id], day, s, e)

    def _mark_div_only(self, mt, div_id):
        """Block a division slot WITHOUT marking a room/teacher.
        Used to block all divisions during an elective slot."""
        s, e = _parse(mt.time)
        self._mark_busy(self.div_busy[div_id], mt.day, s, e)

    # ── Teacher selection helpers ─────────────────────────────────────────────

    def _get_lecture_teacher(self, div_id, course_code, mt=None):
        """
        Load-balanced teacher selection for lectures.
        Hard cap: teacher_lecture_load must be < t.max_lectures_per_week.
        """
        key = (div_id, course_code)
        if key in self.div_lec_teacher:
            teacher = self.div_lec_teacher[key]
            if mt is None or self._teacher_free(mt, teacher):
                return teacher
            return None

        pool = self.data.eligible_teachers.get(course_code, [])
        if not pool:
            return None

        if mt:
            available = [
                t for t in pool
                if self._teacher_free(mt, t)
                # Hard cap: don't exceed teacher's own max lectures per week
                and self.teacher_lecture_load.get(t.uid, 0) < t.max_lectures_per_week
            ]
            if not available:
                # Fallback: relax the cap — still find someone free
                available = [t for t in pool if self._teacher_free(mt, t)]
            if not available:
                return None
            available.sort(key=lambda t: (
                self.teacher_lecture_load.get(t.uid, 0),
                self.teacher_batch_count.get(t.uid, 0)
            ))
            chosen = available[0]
        else:
            candidates = [
                t for t in pool
                if self.teacher_lecture_load.get(t.uid, 0) < t.max_lectures_per_week
            ] or pool
            chosen = sorted(candidates, key=lambda t: (
                self.teacher_lecture_load.get(t.uid, 0),
                self.teacher_batch_count.get(t.uid, 0)
            ))[0]

        self.div_lec_teacher[key] = chosen
        self.teacher_lecture_load[chosen.uid] += 1
        return chosen

    def _get_lab_teacher_for_batch(self, batch_id, course_code, mt,
                                   assigned_teachers_cache):
        """
        Returns a lab teacher for the batch.
        assigned_teachers_cache: set of teacher uids already used this slot.
        """
        key = (batch_id, course_code)
        if key in self.batch_lab_teacher:
            teacher = self.batch_lab_teacher[key]
            if self._teacher_free(mt, teacher):
                assigned_teachers_cache[batch_id] = teacher
                return teacher
            return None

        pool = self.data.eligible_teachers.get(course_code, [])
        if not pool:
            return None

        candidates = [
            t for t in pool
            if self._teacher_free(mt, t)
            # Hard cap: use per-teacher max_labs_per_week (from DB)
            and self.teacher_batch_count[t.uid] < t.max_labs_per_week
            and t.uid not in [x.uid for x in assigned_teachers_cache.values()]
        ]
        if not candidates:
            # Fallback: only check time-free + no double-booking this slot
            candidates = [
                t for t in pool
                if self._teacher_free(mt, t)
                and t.uid not in [x.uid for x in assigned_teachers_cache.values()]
            ]
        if not candidates:
            return None

        candidates.sort(key=lambda t: (
            self.teacher_batch_count.get(t.uid, 0),
            self.teacher_lecture_load.get(t.uid, 0)
        ))
        chosen = candidates[0]

        assigned_teachers_cache[batch_id] = chosen
        self.batch_lab_teacher[key]        = chosen
        self.teacher_batch_count[chosen.uid] += 1
        return chosen

    def _get_lab_room_for_batch(self, batch_id, course_code, mt,
                                assigned_rooms_cache):
        """Room locking — same batch always gets the same lab room."""
        key = (batch_id, course_code)
        if key in self.batch_lab_room:
            locked = self.batch_lab_room[key]
            if (self._room_free(mt, locked) and
                    locked.r_number not in assigned_rooms_cache):
                assigned_rooms_cache.add(locked.r_number)
                return locked
            return None

        available = [
            r for r in self.data.lab_rooms
            if r.r_number not in assigned_rooms_cache
            and self._room_free(mt, r)
        ]
        if not available:
            return None

        room = random.choice(available)
        self.batch_lab_room[key] = room
        assigned_rooms_cache.add(room.r_number)
        return room

    # =========================================================================
    # PHASE 0 — ELECTIVES
    # =========================================================================

    def _get_elective_teacher_for_section(self, section, mt):
        """
        Pick a free teacher for this elective section at the given slot.
        Uses the same div_lec_teacher lock dict so the same teacher is used
        across both sessions for the same section.
        """
        key = (section.section_id, 'ELECTIVE')
        if key in self.div_lec_teacher:
            teacher = self.div_lec_teacher[key]
            if self._teacher_free(mt, teacher):
                return teacher
            return None

        pool = self.data.eligible_teachers.get(section.course.course_number, [])
        free = [t for t in pool if self._teacher_free(mt, t)]
        if not free:
            return None

        free.sort(key=lambda t: (
            self.teacher_lecture_load.get(t.uid, 0),
            self.teacher_batch_count.get(t.uid, 0)
        ))
        chosen = free[0]
        self.div_lec_teacher[key] = chosen
        self.teacher_lecture_load[chosen.uid] += 1
        return chosen

    def assign_electives(self):
        """
        PHASE 0: Schedule elective sessions BEFORE labs and lectures.

        KEY RULE: ALL 4 divisions must share the SAME day + SAME time slot
        for every elective session.

        Layout at each elective slot:
          G1 → CC-G1 (room A) + IS-G1 (room B)   ← parallel choice for G1 students
          G2 → CC-G2 (room C) + IS-G2 (room D)   ← parallel choice for G2 students
          All 4 divisions blocked simultaneously.

        Two sessions per week on DIFFERENT days:
          Session A → 2-hour slot (pid starts with 'E')
          Session B → 1-hour slot (pid starts with 'L')
        """
        data = self.data
        print("\n📊 PHASE 0: Assigning electives")

        all_elective_sections = data.elective_sections
        if not all_elective_sections:
            print("  ℹ️  No elective sections found — skipping Phase 0")
            return

        # ── Build group → [Division] map from DB (Division.elective_group) ─
        group_divs = dict(data.elective_group_divisions)   # grp → [Division]
        if not group_divs:
            print("  ⚠️  Elective sections exist but no Division.elective_group "
                  "values found — skipping Phase 0. "
                  "Set Division.elective_group in admin or seed data.")
            return

        # Collect ALL division ids that will be blocked
        all_div_ids = [
            div.id
            for divs in group_divs.values()
            for div in divs
        ]

        # Need 1 lecture room per elective section (CC-G1, IS-G1, CC-G2, IS-G2)
        needed_rooms = len(all_elective_sections)

        # group_divs already built above from Division.elective_group

        # Track which days elective sessions are placed on
        # (the 2-hour and 1-hour sessions must be on DIFFERENT days)
        elective_days_used = []

        for session_label, slot_pool_attr in [
            ('2-hour', 'elec_2h_by_day'),
            ('1-hour', 'elec_1h_by_day'),
        ]:
            slot_pool = getattr(data, slot_pool_attr)
            scheduled = False
            days = DAYS_ORDER.copy()
            random.shuffle(days)

            for day in days:
                if day in elective_days_used:
                    continue

                slots = slot_pool.get(day, [])
                random.shuffle(slots)

                for mt in slots:
                    # 1. All 4 divisions must be free
                    if not all(self._div_free(mt, did) for did in all_div_ids):
                        continue

                    # 2. Enough free lecture rooms
                    free_rooms = [
                        r for r in data.lecture_rooms
                        if self._room_free(mt, r)
                    ]
                    if len(free_rooms) < needed_rooms:
                        continue

                    # 3. Every elective section has a free teacher
                    teacher_map = {}
                    valid = True
                    for sec in all_elective_sections:
                        teacher = self._get_elective_teacher_for_section(sec, mt)
                        if teacher is None:
                            valid = False
                            break
                        teacher_map[sec.section_id] = teacher
                    if not valid:
                        continue

                    # 4. Assign one unique room per section
                    room_map = {}
                    random.shuffle(free_rooms)
                    for idx, sec in enumerate(all_elective_sections):
                        if idx >= len(free_rooms):
                            valid = False
                            break
                        room_map[sec.section_id] = free_rooms[idx]
                    if not valid:
                        continue

                    # ── COMMIT ────────────────────────────────────────────
                    s_min, e_min = _parse(mt.time)

                    print(f"\n  📅 Elective {session_label} → "
                          f"{day} {mt.time[:13]}  "
                          f"[ALL {len(all_div_ids)} DIVISIONS BLOCKED]")

                    for sec in all_elective_sections:
                        teacher = teacher_map[sec.section_id]
                        room    = room_map[sec.section_id]

                        # Mark room and teacher busy
                        self._mark_busy(self.room_busy[room.r_number],
                                        mt.day, s_min, e_min)
                        self._mark_busy(self.teacher_busy[teacher.uid],
                                        mt.day, s_min, e_min)

                        # Create one SC per division in this section's group
                        # so ALL divisions show the elective in their timetable
                        divs_for_group = group_divs.get(
                            sec.elective_group, [sec.division] if sec.division else [])
                        for div_obj in divs_for_group:
                            sc = SC(sec, mt, room, teacher,
                                    override_division=div_obj)
                            self.result.append(sc)

                        print(f"    ✓ {sec.section_id} "
                              f"({sec.course.course_number}) "
                              f"[{sec.elective_group}] "
                              f"| Room: {room.r_number} "
                              f"| Teacher: {teacher.name}")

                    # Block ALL 4 divisions for this slot
                    for did in all_div_ids:
                        self._mark_div_only(mt, did)

                    # Block all batches inside those divisions
                    for did in all_div_ids:
                        for batch in data.batches_by_division.get(did, []):
                            self._mark_busy(self.batch_busy[batch.id],
                                            mt.day, s_min, e_min)

                    elective_days_used.append(day)
                    scheduled = True
                    break

                if scheduled:
                    break

            if not scheduled:
                print(f"  ⚠️  Could not schedule elective {session_label} "
                      f"session for all {len(all_div_ids)} divisions!")

    # =========================================================================
    # PHASE 1 — LABS
    # =========================================================================

    def assign_labs(self):
        """
        Assigns all lab sessions.
        ✅ Uses dynamic lab_frequency from DB.
        ✅ Uses actual section count per (div, course) — no hardcoded number.
        ✅ Room locking via batch_lab_room.
        ✅ Load balancing via teacher_batch_count + teacher_lecture_load.
        """
        data = self.data
        print(f"\n📊 PHASE 1: Assigning labs")

        tasks = []
        for div in data.divisions:
            for course_code, needed in data.lab_frequency.items():
                key      = (div.id, course_code)
                sections = data.div_lab_groups.get(key, [])
                if len(sections) == 0:
                    continue   # No sections for this combination — skip
                tasks.append({
                    'division':    div,
                    'course_code': course_code,
                    'sections':    sections,
                    'needed':      needed,
                })

        random.shuffle(tasks)

        for task in tasks:
            div         = task['division']
            course_code = task['course_code']
            sections    = task['sections']
            needed      = task['needed']
            assigned    = 0

            for _ in range(500):
                if assigned >= needed:
                    break

                days = DAYS_ORDER.copy()
                random.shuffle(days)

                for day in days:
                    if assigned >= needed:
                        break

                    div_day_key = (div.id, day)
                    if len(self.div_day_labs[div_day_key]) >= MAX_LABS_PER_DAY:
                        continue

                    for mt in data.lab_slots_by_day.get(day, []):
                        existing_times = self.div_day_labs[div_day_key]
                        if any(_is_lab_slot_consecutive(e, mt.time)
                               for e in existing_times):
                            continue
                        if not self._div_free(mt, div.id):
                            continue

                        batches = data.batches_by_division.get(div.id, [])
                        if not all(self._batch_free(mt, b.id) for b in batches):
                            continue

                        # Per-slot caches
                        teacher_cache = {}   # batch_id → teacher
                        room_cache    = set()
                        teacher_valid = True
                        room_valid    = True

                        for section in sections:
                            t = self._get_lab_teacher_for_batch(
                                section.batch.id, course_code,
                                mt, teacher_cache)
                            if t is None:
                                teacher_valid = False
                                break
                        if not teacher_valid:
                            continue

                        room_assignments = {}
                        for section in sections:
                            r = self._get_lab_room_for_batch(
                                section.batch.id, course_code,
                                mt, room_cache)
                            if r is None:
                                room_valid = False
                                break
                            room_assignments[section.batch.id] = r
                        if not room_valid:
                            continue

                        # Commit
                        for section in sections:
                            batch   = section.batch
                            teacher = teacher_cache[batch.id]
                            room    = room_assignments[batch.id]
                            sc      = SC(section, mt, room, teacher)
                            self.result.append(sc)
                            self._mark(mt, room, teacher,
                                       div_id=div.id, batch_id=batch.id)
                            self.batch_lab_count[(batch.id, course_code)] += 1

                        self.div_day_labs[div_day_key].append(mt.time)
                        assigned += 1
                        print(f"    ✓ {div.division_name} {course_code} "
                              f"on {day} at {mt.time[:13]}")
                        break

            if assigned < needed:
                print(f"  ⚠️  {div.division_name} {course_code}: "
                      f"{assigned}/{needed}")

    # =========================================================================
    # PHASE 2 — LECTURES
    # =========================================================================

    def assign_lectures(self):
        """
        Assigns all lecture sessions.
        ✅ Uses dynamic lecture_frequency from DB.
        ✅ Reads sessions/week from each Section's num_class_in_week.
        ✅ Load-balanced teacher assignment.
        """
        data = self.data
        print(f"\n📊 PHASE 2: Assigning lectures (load-balanced)")

        lecture_by_division = defaultdict(list)
        for section in data.lecture_sections:
            if section.division:
                lecture_by_division[section.division.id].append(section)

        for div_id, sections in lecture_by_division.items():
            div = Division.objects.get(id=div_id)
            for section in sections:
                course      = section.course
                course_code = course.course_number

                needed = section.num_class_in_week or \
                         data.lecture_frequency.get(course_code, 3)

                teacher = self._get_lecture_teacher(div.id, course_code)
                if not teacher:
                    print(f"  ⚠️  No teacher for "
                          f"{div.division_name} {course_code}")
                    continue

                assigned  = 0
                days_used = defaultdict(int)

                for _ in range(300):
                    if assigned >= needed:
                        break

                    days = DAYS_ORDER.copy()
                    random.shuffle(days)

                    for day in days:
                        if assigned >= needed:
                            break
                        if days_used[day] >= 2:
                            continue

                        for mt in data.lec_slots_by_day.get(day, []):
                            if not self._div_free(mt, div.id):
                                continue
                            if not self._teacher_free(mt, teacher):
                                continue

                            free_rooms = [
                                r for r in data.lecture_rooms
                                if self._room_free(mt, r)
                            ]
                            if not free_rooms:
                                continue

                            room = random.choice(free_rooms)
                            sc   = SC(section, mt, room, teacher)
                            self.result.append(sc)
                            self._mark(mt, room, teacher, div_id=div.id)
                            days_used[day] += 1
                            assigned += 1
                            print(f"    ✓ {div.division_name} {course_code} "
                                  f"on {day} at {mt.time[:11]}")
                            break

                if assigned < needed:
                    print(f"  ⚠️  {div.division_name} {course_code}: "
                          f"{assigned}/{needed}")

    # =========================================================================
    # GENERATE
    # =========================================================================

    def generate(self):
        # ORDER MATTERS: electives first so labs and lectures
        # automatically respect the blocked slots.
        self.assign_electives()
        self.assign_labs()
        self.assign_lectures()

        # Load distribution summary
        print("\n" + "=" * 60)
        print("📊 TEACHER LECTURE LOAD DISTRIBUTION")
        print("=" * 60)
        by_course = defaultdict(list)
        for (div_id, course_code), teacher in self.div_lec_teacher.items():
            if course_code == 'ELECTIVE':
                continue
            try:
                div = Division.objects.get(id=div_id)
                by_course[course_code].append(
                    (div.division_name, teacher.name))
            except Division.DoesNotExist:
                pass
        for code in sorted(by_course.keys()):
            print(f"\n  {code}:")
            for div_name, t_name in sorted(by_course[code]):
                print(f"    {div_name} → {t_name}")
        print("=" * 60)

        return self.result


# ── Verification ──────────────────────────────────────────────────────────────

def verify_timetable(solution):
    conflicts = []

    # 1. Room conflicts
    room_time_map = defaultdict(list)
    for sc in solution:
        s, e = _parse(sc.meeting_time.time)
        room_time_map[(sc.room.r_number, sc.meeting_time.day, s, e)].append(sc)
    for key, slots in room_time_map.items():
        if len(slots) > 1:
            room, day, s, e = key
            details = [
                f"{sc.division.division_name if sc.division else sc.batch.batch_name} "
                f"{sc.course.course_number}"
                for sc in slots
            ]
            conflicts.append(
                f"Room {room} conflict on {day} {s}-{e}: {details}")

    # 2. Teacher time conflicts
    teacher_time_map = defaultdict(list)
    for sc in solution:
        s, e = _parse(sc.meeting_time.time)
        teacher_time_map[(sc.instructor.uid, sc.meeting_time.day)].append(
            (s, e, sc))
    for key, slots in teacher_time_map.items():
        for i, (s1, e1, sc1) in enumerate(slots):
            for s2, e2, sc2 in slots[i + 1:]:
                if max(s1, s2) < min(e1, e2):
                    try:
                        teacher = Instructor.objects.get(uid=key[0])
                        teacher_name = teacher.name
                    except Exception:
                        teacher_name = key[0]
                    conflicts.append(
                        f"Teacher {teacher_name} ({key[0]}) conflict "
                        f"on {key[1]}: "
                        f"{sc1.course.course_number} ({s1}-{e1}) vs "
                        f"{sc2.course.course_number} ({s2}-{e2})")

    # 3. Lecture teacher consistency (same div+course → same teacher)
    div_subject_teachers = defaultdict(set)
    for sc in solution:
        if sc.course.course_type == 'LECTURE' and sc.division:
            div_subject_teachers[(sc.division.id, sc.course.course_number)].add(
                sc.instructor.uid)
    for key, teachers in div_subject_teachers.items():
        if len(teachers) > 1:
            try:
                div = Division.objects.get(id=key[0])
                div_name = div.division_name
            except Exception:
                div_name = str(key[0])
            conflicts.append(
                f"Multiple teachers for {div_name} {key[1]}: {teachers}")

    # 4. Lab teacher consistency (same batch+course → same teacher)
    batch_subject_teachers = defaultdict(set)
    for sc in solution:
        if sc.course.course_type == 'LAB' and sc.batch:
            batch_subject_teachers[(sc.batch.id, sc.course.course_number)].add(
                sc.instructor.uid)
    for key, teachers in batch_subject_teachers.items():
        if len(teachers) > 1:
            try:
                batch = Batch.objects.get(id=key[0])
                batch_name = batch.batch_name
            except Exception:
                batch_name = str(key[0])
            conflicts.append(
                f"Multiple teachers for batch {batch_name} {key[1]}: "
                f"{teachers}")

    # 5. Room consistency (same batch+course → same room)
    batch_subject_rooms = defaultdict(set)
    for sc in solution:
        if sc.course.course_type == 'LAB' and sc.batch:
            batch_subject_rooms[(sc.batch.id, sc.course.course_number)].add(
                sc.room.r_number)
    for key, rooms in batch_subject_rooms.items():
        if len(rooms) > 1:
            try:
                batch = Batch.objects.get(id=key[0])
                batch_name = batch.batch_name
            except Exception:
                batch_name = str(key[0])
            conflicts.append(
                f"Batch {batch_name} {key[1]} uses multiple rooms: {rooms}")

    # 6. Teacher double-booking (exact same timeslot)
    teacher_exact_time = set()
    for sc in solution:
        s, e        = _parse(sc.meeting_time.time)
        time_key    = (sc.meeting_time.day, s, e)
        t_key       = (sc.instructor.uid, time_key)
        if t_key in teacher_exact_time:
            conflicts.append(
                f"Teacher {sc.instructor.name} double-booked at {time_key}")
        teacher_exact_time.add(t_key)

    # 7. Elective same-group same-slot consistency
    # CC and IS for the same group must occupy the SAME slot on each session day
    elec_group_slots = defaultdict(list)
    for sc in solution:
        if sc.section.is_elective and sc.section.elective_group:
            s, e = _parse(sc.meeting_time.time)
            elec_group_slots[sc.section.elective_group].append(
                (sc.meeting_time.day, s, e, sc.course.course_number))

    for group, slot_list in elec_group_slots.items():
        by_day = defaultdict(set)
        for day, s, e, _ in slot_list:
            by_day[day].add((s, e))
        for day, times in by_day.items():
            if len(times) > 1:
                conflicts.append(
                    f"Elective group {group} on {day} has mismatched slots: "
                    f"{times}")

    return conflicts


# ── Timetable generation view ─────────────────────────────────────────────────

def timetable(request):
    print("\n" + "=" * 70)
    print("🚀 TIMETABLE GENERATOR — ELECTIVES + ROOM LOCKING + LOAD BALANCED")
    print("=" * 70)

    start_time     = time_module.time()
    data           = TimetableData()
    best_solution  = None
    best_conflicts = float('inf')

    for attempt in range(1, MAX_RETRIES + 1):
        print(f"\n📊 Attempt {attempt}/{MAX_RETRIES}")
        generator = TimetableGenerator(data)
        solution  = generator.generate()
        conflicts = verify_timetable(solution)
        print(f"  → {len(solution)} classes, {len(conflicts)} conflicts")
        if len(conflicts) < best_conflicts:
            best_conflicts = len(conflicts)
            best_solution  = solution
            if best_conflicts == 0:
                print(f"\n✅ PERFECT TIMETABLE on attempt {attempt}!")
                break

    elapsed         = round(time_module.time() - start_time, 2)
    final_conflicts = verify_timetable(best_solution) if best_solution else []

    print("\n" + "=" * 70)
    print(f"🏁 FINAL: {len(best_solution) if best_solution else 0} classes, "
          f"{len(final_conflicts)} conflicts, {elapsed}s")
    if final_conflicts:
        print("Conflicts found:")
        for c in final_conflicts[:10]:
            print(f"  - {c}")
    else:
        print("✅ ZERO CONFLICTS — PERFECT TIMETABLE!")
    print("=" * 70)

    context = {
        'schedule':    best_solution or [],
        'sections':    data.sections,
        'times':       data.meeting_times,
        'generations': MAX_RETRIES,
        'fitness':     (1.0 if len(final_conflicts) == 0
                        else round(1 / (1 + len(final_conflicts)), 4)),
        'conflicts':   len(final_conflicts),
        'verified':    len(final_conflicts) == 0,
        'time_taken':  elapsed,
    }
    return render(request, 'gentimetable.html', context)


# ── Public pages ──────────────────────────────────────────────────────────────

def index(request):
    steps = [
        {'icon': '🏛️', 'title': 'Department',  'desc': 'Add your department name.'},
        {'icon': '👥', 'title': 'Divisions',    'desc': 'Add TE-I, TE-II, TE-III, TE-IV.'},
        {'icon': '🔢', 'title': 'Batches',      'desc': 'Add K, L, M, N batches per division.'},
        {'icon': '🧑‍🏫', 'title': 'Instructors', 'desc': 'Add teachers and subject eligibility.'},
        {'icon': '🚪', 'title': 'Rooms',        'desc': 'Add lecture halls and lab rooms.'},
        {'icon': '📚', 'title': 'Courses',      'desc': 'Add subjects with eligible teachers.'},
        {'icon': '🕐', 'title': 'Timings',      'desc': 'Add lecture and lab time slots.'},
        {'icon': '📋', 'title': 'Sections',     'desc': 'Add sections with sessions per week.'},
    ]
    return render(request, 'index.html', {'steps': steps})

def about(request):
    return render(request, 'index.html', {})

def help(request):
    return render(request, 'index.html', {})

def terms(request):
    return render(request, 'index.html', {})

def contact(request):
    return render(request, 'index.html', {})

def generate(request):
    return redirect('timetable')


# ── Dashboard ─────────────────────────────────────────────────────────────────

@login_required
def admindash(request):
    stats = [
        {'icon': '🏛️', 'label': 'Departments', 'count': Department.objects.count(),   'url': '/departments_list/'},
        {'icon': '👥', 'label': 'Divisions',    'count': Division.objects.count(),     'url': '/divisions_list/'},
        {'icon': '🔢', 'label': 'Batches',      'count': Batch.objects.count(),        'url': '/batches_list/'},
        {'icon': '🧑‍🏫', 'label': 'Instructors', 'count': Instructor.objects.count(),   'url': '/teachers_list/'},
        {'icon': '🚪', 'label': 'Rooms',        'count': Room.objects.count(),         'url': '/rooms_list/'},
        {'icon': '📚', 'label': 'Courses',      'count': Course.objects.count(),       'url': '/courses_list/'},
        {'icon': '🕐', 'label': 'Timings',      'count': MeetingTime.objects.count(),  'url': '/timings_list/'},
        {'icon': '📋', 'label': 'Sections',     'count': Section.objects.count(),      'url': '/sections_list/'},
    ]
    actions = [
        {'icon': '🏛️', 'label': 'Add Department',  'url': '/add_departments/'},
        {'icon': '👥', 'label': 'Add Division',     'url': '/add_divisions/'},
        {'icon': '🔢', 'label': 'Add Batch',        'url': '/add_batches/'},
        {'icon': '🧑‍🏫', 'label': 'Add Instructor',  'url': '/add_teachers/'},
        {'icon': '🚪', 'label': 'Add Room',         'url': '/add_rooms/'},
        {'icon': '📚', 'label': 'Add Course',       'url': '/add_courses/'},
        {'icon': '🕐', 'label': 'Add Timing',       'url': '/add_timings/'},
        {'icon': '📋', 'label': 'Add Section',      'url': '/add_sections/'},
    ]
    return render(request, 'admindashboard.html',
                  {'stats': stats, 'actions': actions})


# ── Data entry views ──────────────────────────────────────────────────────────

@login_required
def addDepts(request):
    form = DepartmentForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, '✅ Department added successfully!')
        return redirect('addDepts')
    return render(request, 'addDepts.html', {
        'form': form,
        'departments': Department.objects.all(),
    })

@login_required
def department_list(request):
    return render(request, 'deptlist.html',
                  {'departments': Department.objects.all()})

@login_required
def delete_department(request, pk):
    if request.method == 'POST':
        Department.objects.filter(pk=pk).delete()
        messages.success(request, '🗑️ Department deleted.')
    return redirect('addDepts')

@login_required
def addDivisions(request):
    form = DivisionForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, '✅ Division added successfully!')
        return redirect('addDivisions')
    return render(request, 'addDivisions.html', {
        'form': form,
        'divisions': Division.objects.select_related('department').all(),
    })

@login_required
def division_list(request):
    return render(request, 'divisionlist.html',
                  {'divisions': Division.objects.all()})

@login_required
def delete_division(request, pk):
    if request.method == 'POST':
        Division.objects.filter(pk=pk).delete()
        messages.success(request, '🗑️ Division deleted.')
    return redirect('addDivisions')

@login_required
def addBatches(request):
    form = BatchForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, '✅ Batch added successfully!')
        return redirect('addBatches')
    return render(request, 'addBatches.html', {
        'form': form,
        'batches': Batch.objects.select_related('division').all(),
    })

@login_required
def batch_list(request):
    return render(request, 'batchlist.html',
                  {'batches': Batch.objects.all()})

@login_required
def delete_batch(request, pk):
    if request.method == 'POST':
        Batch.objects.filter(pk=pk).delete()
        messages.success(request, '🗑️ Batch deleted.')
    return redirect('addBatches')

@login_required
def addInstructor(request):
    form = InstructorForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, '✅ Instructor added successfully!')
        return redirect('addInstructors')
    return render(request, 'addInstructors.html', {
        'form': form,
        'instructors': Instructor.objects.all(),
    })

@login_required
def inst_list_view(request):
    return render(request, 'inslist.html',
                  {'instructors': Instructor.objects.all()})

@login_required
def delete_instructor(request, pk):
    if request.method == 'POST':
        Instructor.objects.filter(pk=pk).delete()
        messages.success(request, '🗑️ Instructor deleted.')
    return redirect('addInstructors')

@login_required
def addRooms(request):
    form = RoomForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, '✅ Room added successfully!')
        return redirect('addRooms')
    return render(request, 'addRooms.html', {
        'form': form,
        'rooms': Room.objects.all(),
    })

@login_required
def room_list(request):
    return render(request, 'roomslist.html',
                  {'rooms': Room.objects.all()})

@login_required
def delete_room(request, pk):
    if request.method == 'POST':
        Room.objects.filter(pk=pk).delete()
        messages.success(request, '🗑️ Room deleted.')
    return redirect('addRooms')

@login_required
def addCourses(request):
    form = CourseForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, '✅ Course added successfully!')
        return redirect('addCourses')
    return render(request, 'addCourses.html', {
        'form': form,
        'courses': Course.objects.prefetch_related('instructors').all(),
    })

@login_required
def course_list_view(request):
    return render(request, 'courseslist.html',
                  {'courses': Course.objects.all()})

@login_required
def delete_course(request, pk):
    if request.method == 'POST':
        Course.objects.filter(pk=pk).delete()
        messages.success(request, '🗑️ Course deleted.')
    return redirect('addCourses')

@login_required
def addTimings(request):
    form = MeetingTimeForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, '✅ Meeting time added successfully!')
        return redirect('addTimings')
    return render(request, 'addTimings.html', {
        'form': form,
        'meeting_times': MeetingTime.objects.all(),
    })

@login_required
def meeting_list_view(request):
    return render(request, 'mtlist.html',
                  {'meeting_times': MeetingTime.objects.all()})

@login_required
def delete_meeting_time(request, pk):
    if request.method == 'POST':
        MeetingTime.objects.filter(pk=pk).delete()
        messages.success(request, '🗑️ Meeting time deleted.')
    return redirect('addTimings')

@login_required
def addSections(request):
    form = SectionForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, '✅ Section added successfully!')
        return redirect('addSections')
    return render(request, 'addSections.html', {
        'form': form,
        'sections': Section.objects.select_related(
            'course', 'division', 'batch').all(),
    })

@login_required
def section_list(request):
    return render(request, 'seclist.html',
                  {'sections': Section.objects.all()})

@login_required
def delete_section(request, pk):
    if request.method == 'POST':
        Section.objects.filter(pk=pk).delete()
        messages.success(request, '🗑️ Section deleted.')
    return redirect('addSections')