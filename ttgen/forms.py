"""
ttgen/forms.py  — UPDATED FOR ELECTIVE SUPPORT

CHANGES FROM PREVIOUS VERSION:
  1. CourseForm  — added 'is_elective' field
  2. SectionForm — added 'is_elective' and 'elective_group' fields

Everything else (labels, help_texts, widget attrs) is identical to your
working original.
"""

from django.forms import ModelForm
from .models import (Department, Division, Batch, Instructor,
                     Room, Course, MeetingTime, Section)
from django import forms


class DepartmentForm(ModelForm):
    class Meta:
        model  = Department
        fields = ['dept_name']
        labels = {"dept_name": "Department Name"}
        widgets = {
            'dept_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g. Computer Engineering',
            }),
        }


class DivisionForm(ModelForm):
    class Meta:
        model  = Division
        fields = ['division_name', 'department', 'total_students', 'elective_group']
        labels = {
            "division_name":  "Division Name",
            "department":     "Department",
            "total_students": "Total Students",
            "elective_group": "Elective Group",
        }
        help_texts = {
            "elective_group": "Only for elective subjects. e.g. G1 or G2. Leave blank for SY.",
        }
        widgets = {
            'division_name':  forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. SY-I'}),
            'department':     forms.Select(attrs={'class': 'form-control'}),
            'total_students': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
            'elective_group': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. G1 (leave blank if none)'}),
        }


class BatchForm(ModelForm):
    class Meta:
        model  = Batch
        fields = ['batch_name', 'division', 'student_count']
        labels = {
            "batch_name":    "Batch Name",
            "division":      "Division",
            "student_count": "Student Count",
        }
        widgets = {
            'batch_name':    forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. K1'}),
            'division':      forms.Select(attrs={'class': 'form-control'}),
            'student_count': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
        }


class InstructorForm(ModelForm):
    class Meta:
        model  = Instructor
        fields = ['uid', 'name', 'max_lectures_per_week', 'max_labs_per_week']
        labels = {
            "uid":                  "Teacher ID",
            "name":                 "Full Name",
            "max_lectures_per_week": "Max Lecture Classes / Week",
            "max_labs_per_week":     "Max Lab Batches / Week",
        }
        help_texts = {
            "max_lectures_per_week": "How many theory lecture slots this teacher can take per week (across all divisions).",
            "max_labs_per_week":     "How many lab batch sessions this teacher can handle per week.",
        }
        widgets = {
            'uid':  forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g. T001  (max 6 chars)',
            }),
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g. Dr. A.B. Sharma',
            }),
            'max_lectures_per_week': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0, 'max': 30,
            }),
            'max_labs_per_week': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0, 'max': 20,
            }),
        }


class RoomForm(ModelForm):
    class Meta:
        model  = Room
        fields = ['r_number', 'seating_capacity', 'room_type']
        labels = {
            "r_number":         "Room Number",
            "seating_capacity": "Capacity",
            "room_type":        "Room Type",
        }
        widgets = {
            'r_number':         forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. A1-309'}),
            'seating_capacity': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
            'room_type':        forms.Select(attrs={'class': 'form-control'}),
        }


class CourseForm(ModelForm):
    class Meta:
        model  = Course
        # ── CHANGE: added 'is_elective' ──────────────────────────────────
        fields = ['course_number', 'course_name', 'max_numb_students',
                  'course_type', 'instructors', 'is_elective']
        labels = {
            "course_number":     "Course Code",
            "course_name":       "Course Name",
            "max_numb_students": "Max Students",
            "course_type":       "Course Type",
            "instructors":       "Qualified Instructors",
            "is_elective":       "Is Elective?",           # NEW
        }
        widgets = {
            'course_number':     forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. AI'}),
            'course_name':       forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. Artificial Intelligence'}),
            'max_numb_students': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
            'course_type':       forms.Select(attrs={'class': 'form-control'}),
            'instructors':       forms.SelectMultiple(attrs={'class': 'form-control', 'size': '7'}),
            # CheckboxInput needs no extra attrs — Bootstrap 4 handles it
            'is_elective':       forms.CheckboxInput(attrs={'class': 'form-check-input'}),  # NEW
        }


class MeetingTimeForm(ModelForm):
    class Meta:
        model  = MeetingTime
        fields = ['pid', 'time', 'day', 'slot_type']
        labels = {
            "pid":       "Meeting ID",
            "time":      "Time Slot",
            "day":       "Day",
            "slot_type": "Slot Type",
        }
        widgets = {
            'pid':       forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. L001'}),
            'time':      forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. 08:45 - 09:45'}),
            'day':       forms.Select(attrs={'class': 'form-control'}),
            'slot_type': forms.Select(attrs={'class': 'form-control'}),
        }


class SectionForm(ModelForm):
    class Meta:
        model  = Section
        # ── CHANGE: added 'is_elective' and 'elective_group' ─────────────
        fields = ['section_id', 'department', 'num_class_in_week',
                  'division', 'batch', 'course',
                  'is_elective', 'elective_group']
        labels = {
            "section_id":        "Section ID",
            "department":        "Department",
            "num_class_in_week": "Classes Per Week",
            "division":          "Division (for Lecture)",
            "batch":             "Batch (for Lab)",
            "course":            "Course",
            "is_elective":       "Is Elective?",                    # NEW
            "elective_group":    "Elective Group (G1 or G2)",        # NEW
        }
        help_texts = {
            "division":       "Select for Lecture courses (whole division)",
            "batch":          "Select for Lab courses (single batch)",
            "elective_group": "G1 = TE-I & TE-II  |  G2 = TE-III & TE-IV",  # NEW
        }
        widgets = {
            'section_id':        forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. CC-G1'}),
            'department':        forms.Select(attrs={'class': 'form-control'}),
            'num_class_in_week': forms.NumberInput(attrs={'class': 'form-control', 'min': 1, 'max': 10}),
            'division':          forms.Select(attrs={'class': 'form-control'}),
            'batch':             forms.Select(attrs={'class': 'form-control'}),
            'course':            forms.Select(attrs={'class': 'form-control'}),
            'is_elective':       forms.CheckboxInput(attrs={'class': 'form-check-input'}),    # NEW
            'elective_group':    forms.Select(                                                 # NEW
                choices=[('', '---------'), ('G1', 'G1 (TE-I & TE-II)'), ('G2', 'G2 (TE-III & TE-IV)')],
                attrs={'class': 'form-control'}
            ),
        }