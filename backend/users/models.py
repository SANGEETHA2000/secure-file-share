from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """
    Extended User model with MFA and role-based access control.
    Core user functionality is kept separate from file-related concerns.
    """
    class Roles(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrator'
        USER = 'USER', 'Regular User'
        GUEST = 'GUEST', 'Guest User'
    
    role = models.CharField(
        max_length=10,
        choices=Roles.choices,
        default=Roles.USER,
        help_text="User's role determines their permissions in the system"
    )
    mfa_secret = models.CharField(
        max_length=32,
        blank=True,
        help_text="Secret key for TOTP-based multi-factor authentication"
    )
    mfa_enabled = models.BooleanField(
        default=False,
        help_text="Indicates if MFA is currently enabled for this user"
    )

    def is_admin(self):
        return self.role == self.Roles.ADMIN

    def is_regular_user(self):
        return self.role == self.Roles.USER

    def is_guest(self):
        return self.role == self.Roles.GUEST

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'