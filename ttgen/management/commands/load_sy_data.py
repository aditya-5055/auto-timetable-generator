"""
Management Command: load_sy_data
=================================
Run with:
    python manage.py load_sy_data

What it does:
  1. CLEARS all existing timetable data (any old year's data)
  2. Loads complete 2nd Year (SY-I to SY-IV) data from PDF

Subjects loaded:
  Theory  : DMS (3/wk), SE (2/wk), OS (2/wk), EP (1/wk), ICSR (1/wk)
  Labs    : OSL(1), DMSL(2), PBL(2), CEP(1), EPL(1), CDC(1)
            Total per batch per week = 1+2+2+1+1+1 = 8 labs

SKIPPED  : MDM BFSI lecture, MDM ISSS lecture, MDML lab
           (no elective of any kind — Division.elective_group left blank)

Batches  : E, F, G, H per division (4 batches each, 16 total)
"""

from django.core.management.base import BaseCommand
from ttgen.models import (
    Department, Division, Batch, Instructor,
    Room, Course, MeetingTime, Section
)


class Command(BaseCommand):
    help = 'Clear all data and load SY (Second Year) seed data'

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
        # elective_group=None → Phase 0 automatically skipped by generator
        self.stdout.write('📦 Creating Divisions...')
        sy1 = Division.objects.create(division_name='SY-I',   department=dept,
                                      total_students=88, elective_group=None)
        sy2 = Division.objects.create(division_name='SY-II',  department=dept,
                                      total_students=88, elective_group=None)
        sy3 = Division.objects.create(division_name='SY-III', department=dept,
                                      total_students=88, elective_group=None)
        sy4 = Division.objects.create(division_name='SY-IV',  department=dept,
                                      total_students=88, elective_group=None)

        # ── STEP 3: BATCHES ──────────────────────────────────────────────────
        # 4 regular lab batches per division: E, F, G, H
        self.stdout.write('📦 Creating Batches...')
        e1 = Batch.objects.create(batch_name='E1', division=sy1, student_count=22)
        f1 = Batch.objects.create(batch_name='F1', division=sy1, student_count=22)
        g1 = Batch.objects.create(batch_name='G1', division=sy1, student_count=22)
        h1 = Batch.objects.create(batch_name='H1', division=sy1, student_count=22)

        e2 = Batch.objects.create(batch_name='E2', division=sy2, student_count=22)
        f2 = Batch.objects.create(batch_name='F2', division=sy2, student_count=22)
        g2 = Batch.objects.create(batch_name='G2', division=sy2, student_count=22)
        h2 = Batch.objects.create(batch_name='H2', division=sy2, student_count=22)

        e3 = Batch.objects.create(batch_name='E3', division=sy3, student_count=22)
        f3 = Batch.objects.create(batch_name='F3', division=sy3, student_count=22)
        g3 = Batch.objects.create(batch_name='G3', division=sy3, student_count=22)
        h3 = Batch.objects.create(batch_name='H3', division=sy3, student_count=22)

        e4 = Batch.objects.create(batch_name='E4', division=sy4, student_count=22)
        f4 = Batch.objects.create(batch_name='F4', division=sy4, student_count=22)
        g4 = Batch.objects.create(batch_name='G4', division=sy4, student_count=22)
        h4 = Batch.objects.create(batch_name='H4', division=sy4, student_count=22)

        # ── STEP 4: INSTRUCTORS ──────────────────────────────────────────────
        self.stdout.write('📦 Creating Instructors...')

        def ins(uid, name, ml=3, mb=3):
            """
            ml = max_lectures_per_week (theory lecture slots per week)
            mb = max_labs_per_week     (lab batch sessions per week)
            Both default to 3 — edit from the frontend as needed.
            """
            return Instructor.objects.create(
                uid=uid, name=name,
                max_lectures_per_week=ml,
                max_labs_per_week=mb,
            )

        son01 = ins('SON01', 'Dr. S.S.Sonawane')
        han01 = ins('HAN01', 'Prof. Y.A.Handge')
        kul01 = ins('KUL01', 'Dr. R.A.Kulkarni')
        cha01 = ins('CHA01', 'Prof. M.S.Chavan')
        jad01 = ins('JAD01', 'Prof. R.R.Jadhav')
        nav01 = ins('NAV01', 'Prof. P.R.Navghare')
        des01 = ins('DES01', 'Dr. A.R.Deshpande',   ml=2)
        shi01 = ins('SHI01', 'Prof. S.P.Shintre')
        jan01 = ins('JAN01', 'Prof. M.R.Jansari')
        tak01 = ins('TAK01', 'Dr. M.S.Takalikar',   ml=2)
        sha01 = ins('SHA01', 'Prof. P.S.Shahane',    ml=2)
        gai01 = ins('GAI01', 'Dr. V.S.Gaikwad')
        jad02 = ins('JAD02', 'Prof. S.W.Jadhav',     ml=2)
        kum01 = ins('KUM01', 'Prof. Deepika Kumari')
        kal01 = ins('KAL01', 'Dr. G.V.Kale')
        pat01 = ins('PAT01', 'Dr. P.R.Patil')
        pas01 = ins('PAS01', 'Prof. R.S.Paswan')
        wag01 = ins('WAG01', 'Dr. K.C.Waghmare')
        gir01 = ins('GIR01', 'Dr. S.N.Girme',        ml=2)
        mah01 = ins('MAH01', 'Prof. J.S.Mahajan')
        sha02 = ins('SHA02', 'Prof. S.Shah')
        cha02 = ins('CHA02', 'Prof. P.A.Chavan')
        pha01 = ins('PHA01', 'Dr. A.G.Phakatkar')
        rai01 = ins('RAI01', 'Prof. D.D.Raigar')
        urn01 = ins('URN01', 'Prof. K.R.Urane')      # noqa F841
        kum02 = ins('KUM02', 'Prof. H.S.Kumbhar',    ml=2)
        bag01 = ins('BAG01', 'Prof. V.V.Bagade',      ml=2)
        mas01 = ins('MAS01', 'Prof. B.P.Masram',      ml=2)
        jai01 = ins('JAI01', 'Prof. P.A.Jain')
        kap01 = ins('KAP01', 'Prof. N.Y.Kapadnis',   ml=2)
        bun01 = ins('BUN01', 'Prof. A.D.Bundele',     ml=2)
        jos01 = ins('JOS01', 'Prof. P.P.Joshi',       ml=2)
        jam01 = ins('JAM01', 'Prof. P.J.Jambhulkar',  ml=2)
        gan01 = ins('GAN01', 'Prof. Kopal Gangrade',  ml=2)
        man01 = ins('MAN01', 'Prof. M.V.Mane',         ml=2)
        shi02 = ins('SHI02', 'Prof. S.L.Shinde',       ml=2)

        # ── STEP 5: ROOMS ────────────────────────────────────────────────────
        self.stdout.write('📦 Creating Rooms...')

        def lroom(r_number, cap=90):
            return Room.objects.create(
                r_number=r_number, seating_capacity=cap, room_type='LECTURE')

        def labroom(r_number, cap=30):
            return Room.objects.create(
                r_number=r_number, seating_capacity=cap, room_type='LAB')

        # Lecture halls (theory classes)
        lroom('A1-211')
        lroom('A1-213')
        lroom('A1-310')
        lroom('A1-311')

        # Lab rooms (practicals — all from PDF)
        labroom('A1-203')
        labroom('A1-209')
        labroom('A1-208')
        labroom('A1-202')
        labroom('A1-105')
        labroom('A1-212')
        labroom('A1-303')
        labroom('A1-216')
        labroom('A1-306')
        labroom('A1-307')
        labroom('A1-314')
        labroom('A1-010')
        labroom('A1-111')
        labroom('A1-309')
        labroom('A1-204')
        labroom('A1-102')
        labroom('A1-315')
        labroom('A2-302')
        labroom('A2-303')

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
            """Create a Lab (LAB) course — NOT elective."""
            c = Course.objects.create(
                course_number=cn,
                course_name=cname,
                max_numb_students=22,
                course_type='LAB',
                is_elective=False,
            )
            c.instructors.set(teachers)
            return c

        # ── Theory (5 subjects) ───────────────────────────────────────────
        dms  = tcourse('DMS',  'Discrete Mathematics & Statistics',
                       [son01, pha01, wag01, pas01, tak01])

        se   = tcourse('SE',   'Software Engineering',
                       [han01, tak01, bag01, sha02])

        osc  = tcourse('OS',   'Operating Systems',
                       [kul01, shi01, rai01, cha02])

        ep   = tcourse('EP',   'Entrepreneurship & Project Mgmt',
                       [jad01, mas01])

        icsr = tcourse('ICSR', 'Indian Constitution & Soft Rights',
                       [nav01, mah01])

        # ── Labs (6 subjects, no MDML) ────────────────────────────────────
        osl  = lcourse('OSL',  'OS Lab',
                       [des01, shi01, kul01, jan01, rai01, cha02])

        dmsl = lcourse('DMSL', 'DMS Lab',
                       [son01, tak01, han01, cha02, pas01, kum02, pha01, wag01])

        pbl  = lcourse('PBL',  'Project Based Learning',
                       [sha01, shi01, tak01, pas01, sha02, cha02,
                        bag01, bun01, cha01, kum02, jos01, jam01, kul01])

        cep  = lcourse('CEP',  'Competitive Exam Prep',
                       [han01, gai01, sha01, kal01, pat01, mah01, cha01, cha02])

        epl  = lcourse('EPL',  'EP Lab',
                       [jad01, gai01, jad02, kum01, nav01, mah01, kap01, sha02])

        cdc  = lcourse('CDC',  'Career Development Cell',
                       [nav01, sha01, gir01, pat01, jai01, kal01,
                        cha02, man01, gan01, shi02, wag01])

        # ── STEP 7: MEETING TIMES ────────────────────────────────────────────
        self.stdout.write('📦 Creating Meeting Times...')

        DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

        # Lecture slots — 5 per day, pid = L01…L25
        # IMPORTANT: pids must NOT start with 'E' (reserved for elective 2-hr slots)
        lec_times = [
            '08:45 - 09:45',
            '09:45 - 10:45',
            '11:00 - 12:00',
            '12:00 - 13:00',
            '13:45 - 14:45',
        ]
        n = 1
        for day in DAYS:
            for t in lec_times:
                MeetingTime.objects.create(
                    pid=f'L{n:02d}', time=t, day=day, slot_type='LECTURE')
                n += 1

        # Lab slots — 3 per day × 5 days = 15 slots (2-hour blocks)
        # Priority order respected: 08:45 > 11:00 > 13:45
        lab_slots = [
            ('P01', 'Monday',    '08:45 - 10:45'),
            ('P02', 'Monday',    '11:00 - 13:00'),
            ('P03', 'Monday',    '13:45 - 15:45'),
            ('P04', 'Tuesday',   '08:45 - 10:45'),
            ('P05', 'Tuesday',   '11:00 - 13:00'),
            ('P06', 'Tuesday',   '13:45 - 15:45'),
            ('P07', 'Wednesday', '08:45 - 10:45'),
            ('P08', 'Wednesday', '11:00 - 13:00'),
            ('P09', 'Wednesday', '13:45 - 15:45'),
            ('P10', 'Thursday',  '08:45 - 10:45'),
            ('P11', 'Thursday',  '11:00 - 13:00'),
            ('P12', 'Thursday',  '13:45 - 15:45'),
            ('P13', 'Friday',    '08:45 - 10:45'),
            ('P14', 'Friday',    '11:00 - 13:00'),
            ('P15', 'Friday',    '13:45 - 15:45'),
        ]
        for pid, day, t in lab_slots:
            MeetingTime.objects.create(pid=pid, time=t, day=day, slot_type='LAB')

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

        # ── Theory sections ──────────────────────────────────────────────────
        # DMS=3/wk | SE=2/wk | OS=2/wk | EP=1/wk | ICSR=1/wk
        theory_data = [
            # SY-I
            ('SY1-DMS',  sy1, dms,  3),
            ('SY1-SE',   sy1, se,   2),
            ('SY1-OS',   sy1, osc,  2),
            ('SY1-EP',   sy1, ep,   1),
            ('SY1-ICSR', sy1, icsr, 1),
            # SY-II
            ('SY2-DMS',  sy2, dms,  3),
            ('SY2-SE',   sy2, se,   2),
            ('SY2-OS',   sy2, osc,  2),
            ('SY2-EP',   sy2, ep,   1),
            ('SY2-ICSR', sy2, icsr, 1),
            # SY-III
            ('SY3-DMS',  sy3, dms,  3),
            ('SY3-SE',   sy3, se,   2),
            ('SY3-OS',   sy3, osc,  2),
            ('SY3-EP',   sy3, ep,   1),
            ('SY3-ICSR', sy3, icsr, 1),
            # SY-IV
            ('SY4-DMS',  sy4, dms,  3),
            ('SY4-SE',   sy4, se,   2),
            ('SY4-OS',   sy4, osc,  2),
            ('SY4-EP',   sy4, ep,   1),
            ('SY4-ICSR', sy4, icsr, 1),
        ]
        for sid, div, course, n in theory_data:
            tsec(sid, div, course, n)

        # ── Lab sections ─────────────────────────────────────────────────────
        # OSL=1  DMSL=2  PBL=2  CEP=1  EPL=1  CDC=1  → total 8 per batch/week
        #
        # Lab sections for a division all run at the SAME time slot (different
        # rooms/teachers per batch — the generator handles this automatically).
        def div_labs(suffix, batches_list):
            """Create all 6 lab sections for one division."""
            b_e, b_f, b_g, b_h = batches_list

            # OSL — 1 session/week
            lsec(f'{suffix}-E-OSL', b_e, osl, 1)
            lsec(f'{suffix}-F-OSL', b_f, osl, 1)
            lsec(f'{suffix}-G-OSL', b_g, osl, 1)
            lsec(f'{suffix}-H-OSL', b_h, osl, 1)

            # DMSL — 2 sessions/week
            lsec(f'{suffix}-E-DMSL', b_e, dmsl, 2)
            lsec(f'{suffix}-F-DMSL', b_f, dmsl, 2)
            lsec(f'{suffix}-G-DMSL', b_g, dmsl, 2)
            lsec(f'{suffix}-H-DMSL', b_h, dmsl, 2)

            # PBL — 2 sessions/week
            lsec(f'{suffix}-E-PBL', b_e, pbl, 2)
            lsec(f'{suffix}-F-PBL', b_f, pbl, 2)
            lsec(f'{suffix}-G-PBL', b_g, pbl, 2)
            lsec(f'{suffix}-H-PBL', b_h, pbl, 2)

            # CEP — 1 session/week
            lsec(f'{suffix}-E-CEP', b_e, cep, 1)
            lsec(f'{suffix}-F-CEP', b_f, cep, 1)
            lsec(f'{suffix}-G-CEP', b_g, cep, 1)
            lsec(f'{suffix}-H-CEP', b_h, cep, 1)

            # EPL — 1 session/week
            lsec(f'{suffix}-E-EPL', b_e, epl, 1)
            lsec(f'{suffix}-F-EPL', b_f, epl, 1)
            lsec(f'{suffix}-G-EPL', b_g, epl, 1)
            lsec(f'{suffix}-H-EPL', b_h, epl, 1)

            # CDC — 1 session/week
            lsec(f'{suffix}-E-CDC', b_e, cdc, 1)
            lsec(f'{suffix}-F-CDC', b_f, cdc, 1)
            lsec(f'{suffix}-G-CDC', b_g, cdc, 1)
            lsec(f'{suffix}-H-CDC', b_h, cdc, 1)

        div_labs('SY1', [e1, f1, g1, h1])
        div_labs('SY2', [e2, f2, g2, h2])
        div_labs('SY3', [e3, f3, g3, h3])
        div_labs('SY4', [e4, f4, g4, h4])

        # ── SUMMARY ──────────────────────────────────────────────────────────
        total_th  = Section.objects.filter(course__course_type='LECTURE').count()
        total_lab = Section.objects.filter(course__course_type='LAB').count()
        labs_per_batch = 1 + 2 + 2 + 1 + 1 + 1   # OSL+DMSL+PBL+CEP+EPL+CDC

        self.stdout.write(self.style.SUCCESS('\n🎉 SY SEED DATA LOADED SUCCESSFULLY!\n'))
        self.stdout.write(f'   Departments   : {Department.objects.count()}')
        self.stdout.write(f'   Divisions     : {Division.objects.count()}')
        self.stdout.write(f'   Batches       : {Batch.objects.count()} (4 per division)')
        self.stdout.write(f'   Instructors   : {Instructor.objects.count()}')
        self.stdout.write(f'   Rooms         : {Room.objects.count()} '
                          f'(4 lecture + {Room.objects.filter(room_type="LAB").count()} labs)')
        self.stdout.write(f'   Courses       : {Course.objects.count()} '
                          f'(5 theory + 6 labs)')
        self.stdout.write(f'   Meeting Times : {MeetingTime.objects.count()} '
                          f'(25 lecture + 15 lab slots)')
        self.stdout.write(f'   Sections      : {Section.objects.count()} '
                          f'({total_th} theory + {total_lab} lab)')
        self.stdout.write(f'   Labs/batch/wk : {labs_per_batch} '
                          f'(OSL=1 DMSL=2 PBL=2 CEP=1 EPL=1 CDC=1)')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            '✅ Go to the website → click GENERATE TIMETABLE!\n'))
