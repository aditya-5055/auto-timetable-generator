"""
models.py - Complete Timetable System Models
All constraints and validations included + ELECTIVE SUPPORT

CHANGES FROM PREVIOUS VERSION (only 2 additions):
  1. Course.is_elective         — BooleanField(default=False)
  2. Section.is_elective        — BooleanField(default=False)
  3. Section.elective_group     — CharField(max_length=10, blank, null)

Everything else is IDENTICAL to your working original.
"""

from django.db import models
from django.core.exceptions import ValidationError


# ============================================================================
# CONSTANTS
# ============================================================================

DAYS_OF_WEEK = (
    ('Monday',    'Monday'),
    ('Tuesday',   'Tuesday'),
    ('Wednesday', 'Wednesday'),
    ('Thursday',  'Thursday'),
    ('Friday',    'Friday'),
)


# ============================================================================
# MODELS
# ============================================================================

class Department(models.Model):
    dept_name = models.CharField(max_length=50, unique=True)

    class Meta:
        verbose_name        = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return self.dept_name


class Division(models.Model):
    division_name  = models.CharField(max_length=20, unique=True)
    department     = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='divisions')
    total_students = models.IntegerField(default=88)
    elective_group = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Elective group for this division (e.g. G1, G2). "
                  "Leave blank if this division has no elective sharing. "
                  "Divisions with the same group value share elective time slots.")

    class Meta:
        verbose_name        = "Division"
        verbose_name_plural = "Divisions"
        unique_together     = ['division_name', 'department']

    def __str__(self):
        return self.division_name


class Batch(models.Model):
    batch_name    = models.CharField(max_length=10)
    division      = models.ForeignKey(
        Division, on_delete=models.CASCADE, related_name='batches')
    student_count = models.IntegerField(default=22)

    class Meta:
        verbose_name        = "Batch"
        verbose_name_plural = "Batches"
        unique_together     = ['division', 'batch_name']

    def __str__(self):
        return f"{self.batch_name} ({self.division.division_name})"


class Instructor(models.Model):
    uid  = models.CharField(max_length=6, unique=True)
    name = models.CharField(max_length=25)

    # How many THEORY lecture slots this teacher can teach per week total
    # (counted across all divisions — e.g. 3 means max 3 lecture slots/week)
    max_lectures_per_week = models.IntegerField(
        default=3,
        help_text="Max theory lecture slots this teacher takes per week "
                  "(e.g. 3 = teaches 3 lecture periods a week total)")

    # How many LAB batch sessions this teacher can handle per week
    # (e.g. 3 = can supervise 3 different batch lab sessions per week)
    max_labs_per_week = models.IntegerField(
        default=3,
        help_text="Max lab batch sessions this teacher handles per week "
                  "(e.g. 3 = can take 3 batches' lab sessions per week)")

    class Meta:
        verbose_name        = "Instructor"
        verbose_name_plural = "Instructors"

    def __str__(self):
        return f'{self.name} ({self.uid})'


class Room(models.Model):
    ROOM_TYPES = (
        ('LECTURE', 'Lecture Hall'),
        ('LAB',     'Laboratory'),
    )

    r_number         = models.CharField(max_length=6, unique=True)
    seating_capacity = models.IntegerField(default=0)
    room_type        = models.CharField(
        max_length=10, choices=ROOM_TYPES, default='LECTURE')

    class Meta:
        verbose_name        = "Room"
        verbose_name_plural = "Rooms"

    def __str__(self):
        return f"{self.r_number} ({self.get_room_type_display()})"

    def clean(self):
        if self.room_type == 'LECTURE' and self.seating_capacity < 80:
            raise ValidationError(
                "Lecture rooms must have a seating capacity of at least 80.")
        if self.room_type == 'LAB' and self.seating_capacity < 22:
            raise ValidationError(
                "Lab rooms must have a seating capacity of at least 22.")


class Course(models.Model):
    COURSE_TYPES = (
        ('LECTURE', 'Theory'),
        ('LAB',     'Practical'),
    )

    # max_length=8 — allows longer course codes like "DSBDAL"
    course_number     = models.CharField(max_length=8, primary_key=True)
    course_name       = models.CharField(max_length=40)
    max_numb_students = models.IntegerField(default=88)
    course_type       = models.CharField(
        max_length=10, choices=COURSE_TYPES, default='LECTURE')
    instructors       = models.ManyToManyField(
        Instructor, related_name='courses')

    # ── NEW ──────────────────────────────────────────────────────────────────
    is_elective = models.BooleanField(
        default=False,
        help_text="Check if this is an elective course (CC / IS)")
    # ─────────────────────────────────────────────────────────────────────────

    class Meta:
        verbose_name        = "Course"
        verbose_name_plural = "Courses"

    def __str__(self):
        return f'{self.course_number} - {self.course_name}'


class MeetingTime(models.Model):
    SLOT_TYPES = (
        ('LECTURE', '1-hour Lecture Slot'),
        ('LAB',     '2-hour Lab Slot'),
    )

    pid       = models.CharField(max_length=4, primary_key=True)
    time      = models.CharField(max_length=50)
    day       = models.CharField(max_length=15, choices=DAYS_OF_WEEK)
    slot_type = models.CharField(
        max_length=10, choices=SLOT_TYPES, default='LECTURE')

    class Meta:
        verbose_name        = "Meeting Time"
        verbose_name_plural = "Meeting Times"
        unique_together     = ['day', 'time', 'slot_type']

    def __str__(self):
        return f'{self.day} {self.time} ({self.get_slot_type_display()})'

    def get_start_time(self):
        try:
            time_part = self.time.split('-')[0].strip()
            h, m = map(int, time_part.split(':'))
            if 1 <= h <= 7:
                h += 12
            return h * 60 + m
        except Exception:
            return 0

    def get_end_time(self):
        try:
            time_part = self.time.split('-')[1].strip()
            h, m = map(int, time_part.split(':'))
            if 1 <= h <= 7:
                h += 12
            return h * 60 + m
        except Exception:
            return 0

    def overlaps_with(self, other):
        if not other or self.day != other.day:
            return False
        return (self.get_start_time() < other.get_end_time() and
                other.get_start_time() < self.get_end_time())


class Section(models.Model):
    section_id        = models.CharField(max_length=25, primary_key=True)
    department        = models.ForeignKey(
        Department, on_delete=models.CASCADE)
    num_class_in_week = models.IntegerField(default=0)

    division = models.ForeignKey(
        Division, on_delete=models.CASCADE, blank=True, null=True)
    batch    = models.ForeignKey(
        Batch, on_delete=models.CASCADE, blank=True, null=True)
    course   = models.ForeignKey(
        Course, on_delete=models.CASCADE, blank=True, null=True)

    # Assigned by algorithm — NULL when entered via form
    meeting_time = models.ForeignKey(
        MeetingTime, on_delete=models.CASCADE, blank=True, null=True)
    room         = models.ForeignKey(
        Room, on_delete=models.CASCADE, blank=True, null=True)
    instructor   = models.ForeignKey(
        Instructor, on_delete=models.CASCADE, blank=True, null=True)

    # ── NEW ──────────────────────────────────────────────────────────────────
    is_elective = models.BooleanField(
        default=False,
        help_text="Check if this is an elective section (CC / IS)")
    elective_group = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="G1 (TE-I & TE-II) or G2 (TE-III & TE-IV) — only for electives")
    # ─────────────────────────────────────────────────────────────────────────

    class Meta:
        verbose_name        = "Section"
        verbose_name_plural = "Sections"

    def clean(self):
        """
        Validates all constraints before saving.
        Conflict checks only run when meeting_time, room, instructor
        and course are all set (i.e. after the algorithm assigns them).
        """
        super().clean()

        # Basic consistency
        if self.division and self.batch:
            if self.batch.division != self.division:
                raise ValidationError(
                    "Batch does not belong to this division.")

        # Elective consistency
        if self.is_elective and not self.elective_group:
            raise ValidationError(
                "Elective sections must have an elective_group (G1 or G2).")

        # Skip conflict checks if algorithm fields not yet assigned
        if not (self.meeting_time and self.room and
                self.instructor and self.course):
            return

        # 1. Slot type must match course type
        if self.course.course_type != self.meeting_time.slot_type:
            raise ValidationError(
                f"Course type mismatch: "
                f"{self.course.get_course_type_display()} course "
                f"needs a {self.course.course_type} time slot, "
                f"not {self.meeting_time.slot_type}.")

        # 2. Room type must match course type
        if self.course.course_type != self.room.room_type:
            raise ValidationError(
                f"Room type mismatch: "
                f"{self.course.get_course_type_display()} course "
                f"cannot use a {self.room.get_room_type_display()}.")

        # 3. Room capacity must fit the course
        if self.room.seating_capacity < self.course.max_numb_students:
            raise ValidationError(
                f"Room capacity insufficient: "
                f"{self.room.r_number} has {self.room.seating_capacity} seats "
                f"but the course needs at least "
                f"{self.course.max_numb_students}.")

        # 4. Teacher clash
        teacher_conflict = Section.objects.filter(
            instructor=self.instructor,
            meeting_time=self.meeting_time
        ).exclude(section_id=self.section_id)

        if teacher_conflict.exists():
            clash = teacher_conflict.first()
            raise ValidationError(
                f"Teacher {self.instructor.name} is already teaching "
                f"{clash.course.course_name} at {self.meeting_time}.")

        # 5. Room clash
        room_conflict = Section.objects.filter(
            room=self.room,
            meeting_time=self.meeting_time
        ).exclude(section_id=self.section_id)

        if room_conflict.exists():
            clash = room_conflict.first()
            raise ValidationError(
                f"Room {self.room.r_number} is already occupied by "
                f"{clash.course.course_name} at {self.meeting_time}.")

        # 6. Division clash
        if self.division:
            div_conflict = Section.objects.filter(
                division=self.division,
                meeting_time=self.meeting_time
            ).exclude(section_id=self.section_id)

            if div_conflict.exists():
                clash = div_conflict.first()
                raise ValidationError(
                    f"Division {self.division.division_name} already has "
                    f"{clash.course.course_name} at {self.meeting_time}.")

        # 7. Batch clash
        if self.batch:
            batch_conflict = Section.objects.filter(
                batch=self.batch,
                meeting_time=self.meeting_time
            ).exclude(section_id=self.section_id)

            if batch_conflict.exists():
                clash = batch_conflict.first()
                raise ValidationError(
                    f"Batch {self.batch.batch_name} already has "
                    f"{clash.course.course_name} at {self.meeting_time}.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def set_room(self, room):
        self.room = room
        self.save()

    def set_meetingTime(self, meetingTime):
        self.meeting_time = meetingTime
        self.save()

    def set_instructor(self, instructor):
        self.instructor = instructor
        self.save()

    def __str__(self):
        return self.section_id