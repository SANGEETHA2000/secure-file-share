// Constants for file validation
export const FILE_CONSTRAINTS = {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'] as const,
    DANGEROUS_EXTENSIONS: ['.exe', '.bat', '.cmd', '.sh', '.php', '.js']
};

// Comprehensive file validation with detailed error messages
export const validateFile = (file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
        errors.push(`File size exceeds ${FILE_CONSTRAINTS.MAX_SIZE / (1024 * 1024)}MB limit`);
    }
    
    // Check file type
    if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type as any)) {
        errors.push(`Invalid file type. Allowed types: PDF, JPEG, PNG, TXT`);
    }

    // Check for dangerous extensions
    if (FILE_CONSTRAINTS.DANGEROUS_EXTENSIONS.some(ext => 
        file.name.toLowerCase().endsWith(ext))) {
        errors.push('This file type is not allowed for security reasons');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Email validation with detailed error message
export const validateEmail = (email: string): { isValid: boolean; error: string | null } => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return {
        isValid: emailRegex.test(email),
        error: emailRegex.test(email) ? null : 'Please enter a valid email address'
    };
};

// Password strength validation with specific requirements
export const validatePassword = (password: string): { 
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong'
} => {
    const errors: string[] = [];
    let strengthScore = 0;

    // Length check
    if (password.length < 12) {
        errors.push('Password must be at least 12 characters long');
    } else {
        strengthScore++;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must include at least one uppercase letter');
    } else {
        strengthScore++;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
        errors.push('Password must include at least one lowercase letter');
    } else {
        strengthScore++;
    }

    // Number check
    if (!/[0-9]/.test(password)) {
        errors.push('Password must include at least one number');
    } else {
        strengthScore++;
    }

    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must include at least one special character');
    } else {
        strengthScore++;
    }

    // Determine password strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (strengthScore >= 5) strength = 'strong';
    else if (strengthScore >= 3) strength = 'medium';

    return {
        isValid: errors.length === 0,
        errors,
        strength
    };
};

// Input sanitization to prevent XSS
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/[&'"]/g, '') // Remove potentially dangerous characters
        .trim() // Remove leading/trailing whitespace
        .slice(0, 1000); // Prevent extremely long inputs
};

// Username validation
export const validateUsername = (username: string): {
    isValid: boolean;
    error: string | null
} => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    let error = '';

    if (!usernameRegex.test(username)) {
        error = 'Username must be 3-20 characters long and contain only letters, numbers, and underscores';
    }
    return {
        isValid: error === '',
        error: error
    };
};