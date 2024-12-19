import React from 'react';

export function LogoLayout() {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
        <img src="logo.png" alt="FortiFile" className="w-14 h-14" />
      </div>
      <img src="title.png" alt="FortiFile" className="h-8" />
      <p className="text-sm text-gray-600">Secure File Sharing Made Simple</p>
    </div>
  );
}