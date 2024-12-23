/** @type {import('tailwindcss').Config} */
module.exports = {
    // This tells Tailwind which files to look at for utility classes
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",  // All JavaScript/TypeScript files in src
      "./public/index.html"          // The main HTML file
    ],
    theme: {
      extend: {
        // We can extend Tailwind's default theme here
        colors: {
          primary: {
            // Custom colors for our application
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
          },
          brand: {
            primary: '#6058E7',
            light: '#7A73EA',  // Lighter shade
            dark: '#4842C7',   // Darker shade
          },
        },
        // We can add custom spacing, breakpoints, or other theme values here
      },
    },
    plugins: [],
  }