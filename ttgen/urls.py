"""
ttgen/urls.py  — CORRECTED COMPLETE FILE

PRESERVED EXACTLY from your original:
  - All URL paths unchanged (add_departments/, add_teachers/, etc.)
  - All <int:pk> and <str:pk> unchanged
  - name='admindash', name='timetable', name='generate' — unchanged
  - name='addDepts', name='addDivisions', etc. — unchanged

ONE ADDITION:
  - path('admindashboard/', ...) alias added so LOGIN_REDIRECT_URL='/admin_dashboard/'
    AND any {% url 'admindashboard' %} both work.
    (admindash is kept too so nothing breaks)
"""

from django.urls import path
from . import views

urlpatterns = [
    # ── Public ──────────────────────────────────────────────────────────────
    path('',          views.index,   name='index'),
    path('about/',    views.about,   name='about'),
    path('help/',     views.help,    name='help'),
    path('terms/',    views.terms,   name='terms'),
    path('contact/',  views.contact, name='contact'),

    # ── Dashboard — TWO aliases so both old and new links work ───────────────
    path('admin_dashboard/', views.admindash, name='admindash'),
    path('admindashboard/',  views.admindash, name='admindashboard'),

    # ── Timetable generation ─────────────────────────────────────────────────
    path('generate_timetable/', views.generate, name='generate'),
    path('timetable_generation/', views.timetable, name='timetable'),

    # ── Department ───────────────────────────────────────────────────────────
    path('add_departments/',            views.addDepts,          name='addDepts'),
    path('departments_list/',           views.department_list,   name='editdepartment'),
    path('delete_department/<int:pk>/', views.delete_department, name='deletedepartment'),

    # ── Division ─────────────────────────────────────────────────────────────
    path('add_divisions/',           views.addDivisions,   name='addDivisions'),
    path('divisions_list/',          views.division_list,  name='editdivision'),
    path('delete_division/<int:pk>/',views.delete_division,name='deletedivision'),

    # ── Batch ────────────────────────────────────────────────────────────────
    path('add_batches/',           views.addBatches,   name='addBatches'),
    path('batches_list/',          views.batch_list,   name='editbatch'),
    path('delete_batch/<int:pk>/', views.delete_batch, name='deletebatch'),

    # ── Instructor ───────────────────────────────────────────────────────────
    path('add_teachers/',              views.addInstructor,     name='addInstructors'),
    path('teachers_list/',             views.inst_list_view,    name='editinstructor'),
    path('delete_teacher/<int:pk>/',   views.delete_instructor, name='deleteinstructor'),

    # ── Room ─────────────────────────────────────────────────────────────────
    path('add_rooms/',             views.addRooms,   name='addRooms'),
    path('rooms_list/',            views.room_list,  name='editrooms'),
    path('delete_room/<int:pk>/',  views.delete_room,name='deleteroom'),

    # ── Course (course_number is CharField PK → <str:pk>) ────────────────────
    path('add_courses/',              views.addCourses,       name='addCourses'),
    path('courses_list/',             views.course_list_view, name='editcourse'),
    path('delete_course/<str:pk>/',   views.delete_course,    name='deletecourse'),

    # ── Meeting Time (pid is CharField PK → <str:pk>) ────────────────────────
    path('add_timings/',                  views.addTimings,          name='addTimings'),
    path('timings_list/',                 views.meeting_list_view,   name='editmeetingtime'),
    path('delete_meetingtime/<str:pk>/',  views.delete_meeting_time, name='deletemeetingtime'),

    # ── Section (section_id is CharField PK → <str:pk>) ─────────────────────
    path('add_sections/',              views.addSections,   name='addSections'),
    path('sections_list/',             views.section_list,  name='editsection'),
    path('delete_section/<str:pk>/',   views.delete_section,name='deletesection'),
]