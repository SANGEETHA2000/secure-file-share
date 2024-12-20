from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings
import os
from dotenv import load_dotenv

load_dotenv()

User = get_user_model()

class Command(BaseCommand):
    help = 'Resets the user database and creates initial admin user'

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                # Delete all existing users
                User.objects.all().delete()
                
                # Get credentials from environment variables
                admin_username = os.getenv('ADMIN_USERNAME')
                admin_email = os.getenv('ADMIN_EMAIL')
                admin_password = os.getenv('ADMIN_PASSWORD')

                if not admin_password:
                    self.stdout.write(self.style.ERROR('ADMIN_PASSWORD not set in environment variables'))
                    return

                # Create a new admin user
                admin_user = User.objects.create_user(
                    username=admin_username,
                    email=admin_email,
                    password=admin_password,
                    first_name='Admin',
                    last_name='User',
                    role='ADMIN'
                )
                admin_user.is_staff = True
                admin_user.is_superuser = True
                admin_user.save()

                self.stdout.write(self.style.SUCCESS('Successfully reset users database'))
                self.stdout.write(self.style.SUCCESS('Created admin user'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {str(e)}'))