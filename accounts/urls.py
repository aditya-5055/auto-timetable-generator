"""
accounts/urls.py
NO app_name — plain names only (settings.py uses plain paths /login/ etc.)

Routes:
  /login/   → Django built-in LoginView
  /logout/  → Django built-in LogoutView
  /signup/  → custom signup view
"""

from django.urls import path
from django.contrib.auth import views as auth_views
from . import views  # accounts/views.py

urlpatterns = [
    path(
        'login/',
        auth_views.LoginView.as_view(template_name='login.html'),
        name='login',
    ),
    path(
        'logout/',
        auth_views.LogoutView.as_view(next_page='/login/'),
        name='logout',
    ),
    path(
        'signup/',
        views.signup,
        name='signup',
    ),
]