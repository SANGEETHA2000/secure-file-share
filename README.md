# Secure File Sharing Application

A robust and secure file-sharing web application built with React, Django, and modern security practices. This application enables users to securely upload, download, and share files while maintaining stringent security measures through encryption, access control, and multi-factor authentication.

## Key Features

### Authentication and Security
- Multi-factor authentication (MFA) using Time-based One-Time Passwords (TOTP)
- Role-based access control (RBAC) with Admin, Regular User, and Guest roles
- JWT-based authentication with secure session management
- Password hashing using strong cryptographic algorithms
- Input sanitization and validation on both client and server sides

### File Management
- Client-side encryption before file upload
- Server-side encryption at rest using AES-256
- Secure file storage with encrypted content
- Support for various file types including PDF, images, and text files

### Sharing Capabilities
- Generate secure, time-limited sharing links
- Granular permission controls (view/download)
- User-to-user direct file sharing
- Automatic link expiration for enhanced security

## Technology Stack

### Frontend
- React with TypeScript for type safety
- Redux for state management
- Tailwind CSS for styling
- Axios for API communication
- Web Crypto API for client-side encryption

### Backend
- Django with Python 3.11
- Django REST Framework for API
- SQLite database
- JWT authentication
- Fernet symmetric encryption

## Security Features

### Data at Rest
- All files are encrypted using AES-256 before storage
- Secure key management system
- Encrypted database entries for sensitive information

### Data in Transit
- Client-side encryption before upload
- HTTPS/TLS for all communications
- Secure headers implementation
- CSRF protection

### Access Control
- Role-based permissions system
- Fine-grained file access controls
- Secure session management
- IP-based rate limiting

## Setup and Installation

### Prerequisites
- Docker and Docker Compose
- Git

### Installation Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd secure-file-share
   ```

2. Start the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Environment Variables
The application uses the following environment variables:
- Frontend:
  - NODE_ENV: Development environment
  - WATCHPACK_POLLING: Enable hot reloading
  - CHOKIDAR_USEPOLLING: Enable file watching

- Backend:
  - DEBUG: Enable debug mode
  - DJANGO_SETTINGS_MODULE: Django settings file

## Usage Guide

### User Roles

1. Admin
   - Manage all users and their permissions
   - View and manage all files in the system
   - Access system statistics and logs

2. Regular User
   - Upload and encrypt files
   - Share files with other users
   - Generate time-limited share links
   - Manage owned files

3. Guest
   - View shared files (with permission)
   - Download shared files (if permitted)
   - Limited system access

### File Operations

1. Uploading Files
   - Click "Upload File" button
   - Select file from your system
   - File is automatically encrypted and uploaded
   - Progress bar shows upload status

2. Sharing Files
   - Select file to share
   - Choose recipient email
   - Set permissions (view/download)
   - Set expiration time
   - Share link is generated

3. Downloading Files
   - Click download button on permitted files
   - File is automatically decrypted
   - Save to your local system

## API Documentation

### Authentication Endpoints
- POST /api/v1/auth/login/: User login
- POST /api/v1/auth/register/: User registration
- POST /api/v1/auth/verify-mfa/: MFA verification

### File Endpoints
- GET /api/v1/files/: List user's files
- POST /api/v1/files/: Upload new file
- GET /api/v1/files/{id}/: Get file details
- GET /api/v1/files/{id}/download/: Download file
- GET /api/v1/files/{id}/preview/: Preview file

### Share Endpoints
- POST /api/v1/shares/: Create share link
- GET /api/v1/shares/verify-access/: Verify share access
- GET /api/v1/shares/{id}/: Get share details

## Development

### Directory Structure
```
secure-file-share/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── store/
│   │   └── utils/
│   └── Dockerfile
├── backend/
│   ├── core/
│   ├── files/
│   ├── users/
│   └── Dockerfile
└── docker-compose.yml
```

### Development Workflow
1. Make changes in either frontend or backend
2. Changes are automatically reflected due to volume mounting
3. Frontend hot reloading is enabled
4. Backend auto-reloads on file changes

## Security Considerations

1. File Security
   - All files are encrypted before storage
   - Encryption keys are securely managed
   - Access is strictly controlled

2. User Security
   - Passwords are securely hashed
   - MFA provides additional security
   - Session tokens expire automatically

3. System Security
   - Input validation prevents injection attacks
   - Rate limiting prevents abuse
   - Security headers protect against common attacks

## Troubleshooting

Common issues and solutions:
1. File upload fails
   - Check file size limits
   - Verify file type is supported
   - Ensure proper permissions

2. Share link doesn't work
   - Check if link has expired
   - Verify recipient email
   - Check permissions settings

3. Preview not working
   - Ensure file type supports preview
   - Check browser compatibility
   - Verify file isn't corrupted