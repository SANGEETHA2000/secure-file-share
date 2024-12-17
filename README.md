# Secure File Sharing Application

A secure file-sharing web application built with Django and React, featuring end-to-end encryption, multi-factor authentication, and granular access controls.

## Features

- User Authentication with Multi-Factor Authentication (MFA)
- Role-Based Access Control (RBAC)
- Client-side and Server-side Encryption
- Secure File Sharing with Expirable Links
- Docker Containerization

## Tech Stack

### Backend
- Django REST Framework
- Simple JWT for Authentication
- PyOTP for MFA
- Cryptography for Server-side Encryption

### Frontend
- React with TypeScript
- Redux Toolkit for State Management
- Web Crypto API for Client-side Encryption
- Tailwind CSS for Styling

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd secure-file-share
```

2. Start the application using Docker Compose
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Security Features

- End-to-end encryption using AES-256
- Multi-factor authentication
- Role-based access control
- Secure session management
- Input validation and sanitization
- SSL/TLS implementation

## Development Status

This project is currently under active development.