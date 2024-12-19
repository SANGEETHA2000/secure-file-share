// src/utils/encryption.ts
export async function encryptFile(file: File): Promise<{ encryptedFile: Blob; key: string }> {
    // Generate a random encryption key
    const key = await window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256
        },
        true,  // Key can be exported
        ['encrypt']
    );

    // Create a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Read the file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Encrypt the file data
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv
        },
        key,
        fileBuffer
    );

    // Export the key for storage
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    const keyString = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

    // Combine IV and encrypted data into a single blob
    const encryptedFile = new Blob([iv, encryptedData], { type: file.type });

    return { encryptedFile, key: keyString };
}