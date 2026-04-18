"""
accounts/views.py
Only the signup view lives here.
Login and logout are handled by Django's built-in auth views (in urls.py).
"""

from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django import forms


# ── Custom signup form — cleaner labels than Django default ──────────────────

class SignUpForm(UserCreationForm):
    """
    Extends Django's UserCreationForm.
    Adds email field and cleans up widget styling.
    """
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class':       'form-control',
            'placeholder': 'you@example.com',
        })
    )

    class Meta(UserCreationForm.Meta):
        fields = ('username', 'email', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add Bootstrap class + placeholder to every field
        placeholders = {
            'username':  'Choose a username',
            'password1': 'Create a password',
            'password2': 'Confirm your password',
        }
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'
            if field_name in placeholders:
                field.widget.attrs['placeholder'] = placeholders[field_name]
            # Remove verbose help texts shown by default
            field.help_text = None

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user


# ── Signup view ───────────────────────────────────────────────────────────────

def signup(request):
    """
    POST  → validate form → create user → auto-login → redirect to dashboard
    GET   → show blank signup form
    Already-authenticated users are redirected straight to dashboard.
    """
    if request.user.is_authenticated:
        return redirect('admindash')

    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Auto-login after signup — no need to re-enter credentials
            login(request, user)
            messages.success(
                request,
                f'✅ Account created successfully! Welcome, {user.username}.'
            )
            return redirect('admindash')
        else:
            messages.error(
                request,
                '❌ Please fix the errors below and try again.'
            )
    else:
        form = SignUpForm()

    return render(request, 'signup.html', {'form': form})