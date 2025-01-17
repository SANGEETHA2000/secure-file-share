# Generated by Django 5.1.4 on 2024-12-17 13:46

import django.core.validators
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='File',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier for the file', primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='Encrypted filename as stored in the system', max_length=255)),
                ('original_name', models.CharField(help_text='Original filename before encryption', max_length=255)),
                ('mime_type', models.CharField(help_text='MIME type of the file', max_length=100)),
                ('size', models.BigIntegerField(help_text='Size of the file in bytes')),
                ('encryption_key_id', models.CharField(help_text='Reference to the encryption key used for this file', max_length=64)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(help_text='User who owns this file', on_delete=django.db.models.deletion.CASCADE, related_name='owned_files', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-uploaded_at'],
            },
        ),
        migrations.CreateModel(
            name='FileShare',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('permission', models.CharField(choices=[('VIEW', 'View Only'), ('DOWNLOAD', 'Download Allowed')], default='VIEW', max_length=10)),
                ('access_token', models.CharField(max_length=64, unique=True, validators=[django.core.validators.MinLengthValidator(64)])),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_shares', to=settings.AUTH_USER_MODEL)),
                ('file', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shares', to='files.file')),
                ('shared_with', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='received_shares', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
