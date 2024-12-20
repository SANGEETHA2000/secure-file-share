export async function encryptFile(file: File): Promise<{ encryptedFile: File; key: string }> {
    try {
        // Generate a random key for AES-GCM
        const key = await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,  // Key is extractable
            ['encrypt']
        );

        // Generate a random IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // Read file as ArrayBuffer
        const fileBuffer = await file.arrayBuffer();

        // Encrypt the file content
        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            fileBuffer
        );

        // Export the key to save it
        const exportedKey = await window.crypto.subtle.exportKey('raw', key);
        const keyString = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

        // Combine IV and encrypted content
        const combinedContent = new Uint8Array(iv.length + encryptedContent.byteLength);
        combinedContent.set(iv, 0);
        combinedContent.set(new Uint8Array(encryptedContent), iv.length);

        // Create a new File object with the encrypted content
        const encryptedFile = new File(
            [combinedContent], 
            file.name,
            { type: file.type }
        );

        return {
            encryptedFile,
            key: keyString
        };
    } catch (error) {
        console.error('Client-side encryption failed:', error);
        throw new Error('Failed to encrypt file');
    }
}

export async function decryptFile(
    encryptedData: ArrayBuffer,
    keyString: string
): Promise<ArrayBuffer> {
    try {
        // Convert base64 key back to ArrayBuffer
        const keyData = new Uint8Array(
            atob(keyString).split('').map(char => char.charCodeAt(0))
        );

        // Import the key
        const key = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { 
                name: 'AES-GCM',
                length: 256 
            },
            false, // not extractable
            ['decrypt']
        );

        // Extract IV and encrypted content
        const iv = new Uint8Array(encryptedData.slice(0, 12));
        const encryptedContent = new Uint8Array(encryptedData.slice(12));

        // Decrypt the content
        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encryptedContent
        );

        return decryptedContent;
    } catch (error) {
        console.error('Client-side decryption failed:', error);
        throw new Error('Failed to decrypt file');
    }
}