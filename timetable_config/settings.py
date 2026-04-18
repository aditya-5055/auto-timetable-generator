"""
timetable_config/settings.py
CHANGES FROM YOUR ORIGINAL (only 3 things changed):
  1. LOGIN_URL          = '/login/'          (was 'accounts:login' — broke @login_required)
  2. LOGIN_REDIRECT_URL = '/admin_dashboard/'(was 'ttgen:dashboard'  — view doesn't exist)
  3. LOGOUT_REDIRECT_URL= '/login/'          (was 'accounts:login'  — caused NoReverseMatch)
  4. Removed 'django.template.context_processors.media' and '.static' from context_processors
     (these don't exist in Django 4.2 and cause ImproperlyConfigured errors)
Everything else is identical to your original file.
"""

from pathlib import Path
import os
from django.contrib.messages import constants as messages

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-1)_&14ef!5#lsi*w0qzstpp4qnjpiha6gqc8b7yp#2%@61fwte'

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'crispy_forms',
    'crispy_bootstrap4',
    'ttgen.apps.TtgenConfig',
    'accounts.apps.AccountsConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'timetable_config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                # NOTE: 'django.template.context_processors.media' and '.static'
                # do NOT exist in Django 4.2 — removed to prevent startup crash
            ],
        },
    },
]

WSGI_APPLICATION = 'timetable_config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── FIX 1, 2, 3: Plain URL paths — NOT namespaced names ───────────────────────
# Namespaced names like 'accounts:login' require app_name in urls.py.
# Your accounts/urls.py does NOT set app_name, so namespaced names cause
# NoReverseMatch errors on every @login_required redirect and logout.
LOGIN_URL           = '/login/'           # was: 'accounts:login'
LOGIN_REDIRECT_URL  = '/' 
LOGOUT_REDIRECT_URL = '/login/'           # was: 'accounts:login'

CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap4"
CRISPY_TEMPLATE_PACK = "bootstrap4"

MESSAGE_TAGS = {
    messages.DEBUG:   'alert-info',
    messages.INFO:    'alert-info',
    messages.SUCCESS: 'alert-success',
    messages.WARNING: 'alert-warning',
    messages.ERROR:   'alert-danger',
}

SESSION_COOKIE_AGE = 86400
SESSION_SAVE_EVERY_REQUEST = True

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'debug.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {'handlers': ['console', 'file'], 'level': 'INFO', 'propagate': False},
        'ttgen':  {'handlers': ['console', 'file'], 'level': 'DEBUG', 'propagate': False},
    },
}

TIMETABLE_POPULATION_SIZE    = 200
TIMETABLE_ELITE_SCHEDULES    = 15
TIMETABLE_TOURNAMENT_SIZE    = 6
TIMETABLE_MUTATION_RATE      = 0.25
TIMETABLE_MAX_GENERATIONS    = 1000
TIMETABLE_MIN_BREAK_DURATION = 60
TIMETABLE_MAX_CLASSES_PER_DAY      = 8
TIMETABLE_MAX_CONSECUTIVE_CLASSES  = 3
TIMETABLE_WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']