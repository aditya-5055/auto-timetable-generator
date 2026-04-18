"""
Management Command: load_te_data
=================================
Run with:
    python manage.py load_te_data

What it does:
  1. CLEARS all existing timetable data (any old year's data)
  2. Loads complete 3rd Year (TE-I to TE-IV) data

Subjects loaded:
  Theory  : AI (3/wk), DSBDA (3/wk), WT (3/wk)
  Labs    : DSBDAL(2), LPII(2), WTL(1)
            Total per batch per week = 2+2+1 = 5 labs

  Electives (run in PARALLEL — students choose one):
    Group G1 → CC (2/wk)  ||  IS (2/wk)   [TE-I & TE-II blocked together]
    Group G2 → CC (2/wk)  ||  IS (2/wk)   [TE-III & TE-IV blocked together]

Batches  : K, L, M, N per division (4 batches each, 16 total)
           K1/L1/M1/N1 → TE-I, K2/L2/M2/N2 → TE-II, etc.

Teacher caps: max_lectures_per_week=3, max_labs_per_week=4  (for all)

Elective group mapping (Division.elective_group):
    TE-I   → G1    TE-II  → G1
    TE-III → G2    TE-IV  → G2
"""

from django.core.management.base import BaseCommand
from ttgen.models import (
    Department, Division, Batch, Instructor,
    Room, Course, MeetingTime, Section
)


class Command(BaseCommand):
    help = 'Clear all data and load TE (Third Year) seed data'

    def handle(self, *args, **options):

        # ── STEP 0: CLEAR ALL EXISTING DATA ─────────────────────────────────
        self.stdout.write(self.style.WARNING('🗑️  Clearing all existing data...'))
        Section.objects.all().delete()
        MeetingTime.objects.all().delete()
        Course.objects.all().delete()
        Room.objects.all().delete()
        Instructor.objects.all().delete()
        Batch.objects.all().delete()
        Division.objects.all().delete()
        Department.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('✅ Old data cleared.\n'))

        # ── STEP 1: DEPARTMENT ───────────────────────────────────────────────
        self.stdout.write('📦 Creating Department...')
        dept = Department.objects.create(dept_name='Computer Engineering')

        # ── STEP 2: DIVISIONS ────────────────────────────────────────────────
        # elective_group = 'G1' → TE-I and TE-II share elective slots
        # elective_group = 'G2' → TE-III and TE-IV share elective slots
        self.stdout.write('📦 Creating Divisions...')
        te1 = Division.objects.create(division_name='TE-I',   department=dept,
                                      total_students=88, elective_group='G1')
        te2 = Division.objects.create(division_name='TE-II',  department=dept,
                                      total_students=88, elective_group='G1')
        te3 = Division.objects.create(division_name='TE-III', department=dept,
                                      total_students=88, elective_group='G2')
        te4 = Division.objects.create(division_name='TE-IV',  department=dept,
                                      total_students=88, elective_group='G2')

        # ── STEP 3: BATCHES ──────────────────────────────────────────────────
        # 4 regular lab batches per division: K, L, M, N
        self.stdout.write('📦 Creating Batches...')
        k1 = Batch.objects.create(batch_name='K1', division=te1, student_count=22)
        l1 = Batch.objects.create(batch_name='L1', division=te1, student_count=22)
        m1 = Batch.objects.create(batch_name='M1', division=te1, student_count=22)
        n1 = Batch.objects.create(batch_name='N1', division=te1, student_count=22)

        k2 = Batch.objects.create(batch_name='K2', division=te2, student_count=22)
        l2 = Batch.objects.create(batch_name='L2', division=te2, student_count=22)
        m2 = Batch.objects.create(batch_name='M2', division=te2, student_count=22)
        n2 = Batch.objects.create(batch_name='N2', division=te2, student_count=22)

        k3 = Batch.objects.create(batch_name='K3', division=te3, student_count=22)
        l3 = Batch.objects.create(batch_name='L3', division=te3, student_count=22)
        m3 = Batch.objects.create(batch_name='M3', division=te3, student_count=22)
        n3 = Batch.objects.create(batch_name='N3', division=te3, student_count=22)

        k4 = Batch.objects.create(batch_name='K4', division=te4, student_count=22)
        l4 = Batch.objects.create(batch_name='L4', division=te4, student_count=22)
        m4 = Batch.objects.create(batch_name='M4', division=te4, student_count=22)
        n4 = Batch.objects.create(batch_name='N4', division=te4, student_count=22)

        # ── STEP 4: INSTRUCTORS ──────────────────────────────────────────────
        self.stdout.write('📦 Creating Instructors...')

        def ins(uid, name, ml=3, mb=4):
            """
            ml = max_lectures_per_week  (default 3)
            mb = max_labs_per_week      (default 4)
            """
            return Instructor.objects.create(
                uid=uid, name=name,
                max_lectures_per_week=ml,
                max_labs_per_week=mb,
            )

        # From TE data (Document 4 — Instructors list)
        t001 = ins('T001', 'Dr. S.N. Girme')
        t002 = ins('T002', 'Prof. Rutuja Kulkarni')
        t003 = ins('T003', 'Prof. A.D. Bundele')
        t004 = ins('T004', 'Prof. M.V. Mane')
        t005 = ins('T005', 'Prof. P.P. Joshi')
        t006 = ins('T006', 'Prof. P.A. Jain')
        t007 = ins('T007', 'Prof. P.J. Jambhulkar')
        t008 = ins('T008', 'Prof. S.W. Jadhav')
        t009 = ins('T009', 'Prof. B.P. Masram')
        t010 = ins('T010', 'Prof. A.A. Chandorkar')
        t011 = ins('T011', 'Prof. D.D. Raigar')
        t012 = ins('T012', 'Prof. M.S. Wakode')
        t013 = ins('T013', 'Prof. K.R. Urane')
        t014 = ins('T014', 'Prof. N.Y. Kapadnis')
        t015 = ins('T015', 'Prof. Kopal Gangrade')
        t016 = ins('T016', 'Prof. P.R. Navghare')
        t017 = ins('T017', 'Dr. P.R. Patil')
        t018 = ins('T018', 'Prof. Deepika Kumari')
        t019 = ins('T019', 'Prof. Madhuri Patil')
        t020 = ins('T020', 'Prof. R.R. Jadhav')

        # ── STEP 5: ROOMS ────────────────────────────────────────────────────
        self.stdout.write('📦 Creating Rooms...')

        def lroom(r_number, cap=100):
            return Room.objects.create(
                r_number=r_number, seating_capacity=cap, room_type='LECTURE')

        def labroom(r_number, cap=25):
            return Room.objects.create(
                r_number=r_number, seating_capacity=cap, room_type='LAB')

        # Lecture halls (from TE rooms list)
        lroom('A1-309')
        lroom('A1-310')
        lroom('A1-311')
        lroom('A1-111')
        lroom('A1-213')

        # Lab rooms (from TE rooms list)
        labroom('A1-204')
        labroom('A1-102')
        labroom('A1-306')
        labroom('A1-307')
        labroom('A1-314')
        labroom('A1-303')
        labroom('A1-216')
        labroom('A2-302')
        labroom('A2-303')
        labroom('A1-105')

        # ── STEP 6: COURSES ──────────────────────────────────────────────────
        self.stdout.write('📦 Creating Courses...')

        def tcourse(cn, cname, teachers):
            """Create a Theory (LECTURE) course."""
            c = Course.objects.create(
                course_number=cn,
                course_name=cname,
                max_numb_students=88,
                course_type='LECTURE',
                is_elective=False,
            )
            c.instructors.set(teachers)
            return c

        def lcourse(cn, cname, teachers):
            """Create a Lab (LAB) course."""
            c = Course.objects.create(
                course_number=cn,
                course_name=cname,
                max_numb_students=22,
                course_type='LAB',
                is_elective=False,
            )
            c.instructors.set(teachers)
            return c

        def ecourse(cn, cname, teachers):
            """Create an Elective (LECTURE) course."""
            c = Course.objects.create(
                course_number=cn,
                course_name=cname,
                max_numb_students=88,
                course_type='LECTURE',
                is_elective=True,
            )
            c.instructors.set(teachers)
            return c

        # ── Theory (3 subjects) ───────────────────────────────────────────
        ai    = tcourse('AI',    'Artificial Intelligence',
                        [t001, t004])

        dsbda = tcourse('DSBDA', 'Data Science & Big Data Analytics',
                        [t002, t005])

        wt    = tcourse('WT',    'Web Technology',
                        [t003, t006])

        # ── Labs (3 subjects) ─────────────────────────────────────────────
        dsbdal = lcourse('DSBDAL', 'DSBDA Lab',
                         [t002, t005, t008, t011, t012, t016, t020])

        lpii   = lcourse('LPII',   'LP-II Lab',
                         [t001, t004, t009, t010, t013, t014, t017, t018, t019])

        wtl    = lcourse('WTL',    'WT Lab',
                         [t003, t006, t007, t015])

        # ── Electives (2 subjects — run in PARALLEL per group) ────────────
        cc = ecourse('CC', 'Cloud Computing',
                     [t009, t010])

        is_ = ecourse('IS', 'Information Security',
                      [t001, t014])

        # ── STEP 7: MEETING TIMES ────────────────────────────────────────────
        self.stdout.write('📦 Creating Meeting Times...')

        DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

        # Lecture slots — 6 per day × 5 days = 30 slots (pid = L001…L030)
        # These are standard 1-hour lecture slots used by theory classes.
        lec_times = [
            '08:45 - 09:45',
            '09:45 - 10:45',
            '11:00 - 12:00',
            '12:00 - 13:00',
            '13:45 - 14:45',
            '14:45 - 15:45',
        ]
        n = 1
        for day in DAYS:
            for t in lec_times:
                MeetingTime.objects.create(
                    pid=f'L{n:03d}', time=t, day=day, slot_type='LECTURE')
                n += 1

        # Lab slots — 3 per day × 5 days = 15 slots (2-hour blocks)
        lab_slots = [
            ('B001', 'Monday',    '08:45 - 10:45'),
            ('B002', 'Monday',    '11:00 - 13:00'),
            ('B003', 'Monday',    '13:45 - 15:45'),
            ('B004', 'Tuesday',   '08:45 - 10:45'),
            ('B005', 'Tuesday',   '11:00 - 13:00'),
            ('B006', 'Tuesday',   '13:45 - 15:45'),
            ('B007', 'Wednesday', '08:45 - 10:45'),
            ('B008', 'Wednesday', '11:00 - 13:00'),
            ('B009', 'Wednesday', '13:45 - 15:45'),
            ('B010', 'Thursday',  '08:45 - 10:45'),
            ('B011', 'Thursday',  '11:00 - 13:00'),
            ('B012', 'Thursday',  '13:45 - 15:45'),
            ('B013', 'Friday',    '08:45 - 10:45'),
            ('B014', 'Friday',    '11:00 - 13:00'),
            ('B015', 'Friday',    '13:45 - 15:45'),
        ]
        for pid, day, t in lab_slots:
            MeetingTime.objects.create(pid=pid, time=t, day=day, slot_type='LAB')

        # Elective slots — 3 per day × 5 days = 15 slots (pid = E001…E015)
        # pid starts with 'E' → views.py routes these to elec_2h_by_day pool.
        # These are 2-hour blocks used exclusively for elective sessions.
        elec_slots = [
            ('E001', 'Monday',    '08:45 - 10:45'),
            ('E002', 'Monday',    '11:00 - 13:00'),
            ('E003', 'Monday',    '13:45 - 15:45'),
            ('E004', 'Tuesday',   '08:45 - 10:45'),
            ('E005', 'Tuesday',   '11:00 - 13:00'),
            ('E006', 'Tuesday',   '13:45 - 15:45'),
            ('E007', 'Wednesday', '08:45 - 10:45'),
            ('E008', 'Wednesday', '11:00 - 13:00'),
            ('E009', 'Wednesday', '13:45 - 15:45'),
            ('E010', 'Thursday',  '08:45 - 10:45'),
            ('E011', 'Thursday',  '11:00 - 13:00'),
            ('E012', 'Thursday',  '13:45 - 15:45'),
            ('E013', 'Friday',    '08:45 - 10:45'),
            ('E014', 'Friday',    '11:00 - 13:00'),
            ('E015', 'Friday',    '13:45 - 15:45'),
        ]
        for pid, day, t in elec_slots:
            # slot_type='LECTURE' so views.py processes them as lecture-type
            # slots (pid prefix 'E' is the elective discriminator in views.py)
            MeetingTime.objects.create(pid=pid, time=t, day=day, slot_type='LECTURE')

        # ── STEP 8: SECTIONS ─────────────────────────────────────────────────
        self.stdout.write('📦 Creating Sections...')

        def tsec(sid, div, course, n_per_week):
            """Theory section — division level, no batch."""
            Section.objects.create(
                section_id=sid,
                department=dept,
                division=div,
                batch=None,
                course=course,
                num_class_in_week=n_per_week,
                is_elective=False,
                elective_group=None,
            )

        def lsec(sid, batch, course, n_per_week=1):
            """Lab section — batch level, no division."""
            Section.objects.create(
                section_id=sid,
                department=dept,
                division=None,
                batch=batch,
                course=course,
                num_class_in_week=n_per_week,
                is_elective=False,
                elective_group=None,
            )

        def esec(sid, div, course, n_per_week, group):
            """
            Elective section — division level.
            The division passed here is the 'anchor' division for the section.
            views.py Phase 0 will replicate the SC for ALL divisions in the group.
            Only one section per group per elective course is needed.
            """
            Section.objects.create(
                section_id=sid,
                department=dept,
                division=div,
                batch=None,
                course=course,
                num_class_in_week=n_per_week,
                is_elective=True,
                elective_group=group,
            )

        # ── Theory sections ──────────────────────────────────────────────────
        # AI=3/wk | DSBDA=3/wk | WT=3/wk
        theory_data = [
            # TE-I
            ('AI-TE1',    te1, ai,    3),
            ('DSBDA-TE1', te1, dsbda, 3),
            ('WT-TE1',    te1, wt,    3),
            # TE-II
            ('AI-TE2',    te2, ai,    3),
            ('DSBDA-TE2', te2, dsbda, 3),
            ('WT-TE2',    te2, wt,    3),
            # TE-III
            ('AI-TE3',    te3, ai,    3),
            ('DSBDA-TE3', te3, dsbda, 3),
            ('WT-TE3',    te3, wt,    3),
            # TE-IV
            ('AI-TE4',    te4, ai,    3),
            ('DSBDA-TE4', te4, dsbda, 3),
            ('WT-TE4',    te4, wt,    3),
        ]
        for sid, div, course, n in theory_data:
            tsec(sid, div, course, n)

        # ── Elective sections ────────────────────────────────────────────────
        # CC and IS run IN PARALLEL (students choose one).
        # G1: TE-I & TE-II blocked simultaneously
        # G2: TE-III & TE-IV blocked simultaneously
        # Anchor division = first division in each group (te1 for G1, te3 for G2).
        # views.py assign_electives() broadcasts to ALL divisions in the group.
        elective_data = [
            ('CC-G1', te1, cc,  2, 'G1'),
            ('IS-G1', te1, is_, 2, 'G1'),
            ('CC-G2', te3, cc,  2, 'G2'),
            ('IS-G2', te3, is_, 2, 'G2'),
        ]
        for sid, div, course, n, group in elective_data:
            esec(sid, div, course, n, group)

        # ── Lab sections ─────────────────────────────────────────────────────
        # DSBDAL=2  LPII=2  WTL=1  → total 5 sessions per batch per week
        def div_labs(suffix, batches_list):
            """Create all 3 lab sections for one division."""
            b_k, b_l, b_m, b_n = batches_list

            # DSBDAL — 2 sessions/week
            lsec(f'{suffix}-K-DSBDAL', b_k, dsbdal, 2)
            lsec(f'{suffix}-L-DSBDAL', b_l, dsbdal, 2)
            lsec(f'{suffix}-M-DSBDAL', b_m, dsbdal, 2)
            lsec(f'{suffix}-N-DSBDAL', b_n, dsbdal, 2)

            # LPII — 2 sessions/week
            lsec(f'{suffix}-K-LPII', b_k, lpii, 2)
            lsec(f'{suffix}-L-LPII', b_l, lpii, 2)
            lsec(f'{suffix}-M-LPII', b_m, lpii, 2)
            lsec(f'{suffix}-N-LPII', b_n, lpii, 2)

            # WTL — 1 session/week
            lsec(f'{suffix}-K-WTL', b_k, wtl, 1)
            lsec(f'{suffix}-L-WTL', b_l, wtl, 1)
            lsec(f'{suffix}-M-WTL', b_m, wtl, 1)
            lsec(f'{suffix}-N-WTL', b_n, wtl, 1)

        div_labs('TE1', [k1, l1, m1, n1])
        div_labs('TE2', [k2, l2, m2, n2])
        div_labs('TE3', [k3, l3, m3, n3])
        div_labs('TE4', [k4, l4, m4, n4])

        # ── SUMMARY ──────────────────────────────────────────────────────────
        total_th  = Section.objects.filter(
            course__course_type='LECTURE', is_elective=False).count()
        total_elec = Section.objects.filter(is_elective=True).count()
        total_lab = Section.objects.filter(course__course_type='LAB').count()
        labs_per_batch = 2 + 2 + 1   # DSBDAL + LPII + WTL

        self.stdout.write(self.style.SUCCESS('\n🎉 TE SEED DATA LOADED SUCCESSFULLY!\n'))
        self.stdout.write(f'   Departments   : {Department.objects.count()}')
        self.stdout.write(f'   Divisions     : {Division.objects.count()} '
                          f'(TE-I→G1, TE-II→G1, TE-III→G2, TE-IV→G2)')
        self.stdout.write(f'   Batches       : {Batch.objects.count()} (4 per division)')
        self.stdout.write(f'   Instructors   : {Instructor.objects.count()}')
        self.stdout.write(f'   Rooms         : {Room.objects.count()} '
                          f'(5 lecture + {Room.objects.filter(room_type="LAB").count()} labs)')
        self.stdout.write(f'   Courses       : {Course.objects.count()} '
                          f'(3 theory + 3 labs + 2 electives)')
        self.stdout.write(f'   Meeting Times : {MeetingTime.objects.count()} '
                          f'(30 lecture + 15 lab + 15 elective slots)')
        self.stdout.write(f'   Sections      : {Section.objects.count()} '
                          f'({total_th} theory + {total_elec} elective + {total_lab} lab)')
        self.stdout.write(f'   Labs/batch/wk : {labs_per_batch} '
                          f'(DSBDAL=2  LPII=2  WTL=1)')
        self.stdout.write(f'   Elective groups: G1 (TE-I & TE-II), G2 (TE-III & TE-IV)')
        self.stdout.write(f'   Elective choice: CC  ||  IS  (parallel, 2x/wk each)')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            '✅ Go to the website → click GENERATE TIMETABLE!\n'))