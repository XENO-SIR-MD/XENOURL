# XENO - Media to URL Converter Walkthrough

This project is a high-end, premium web application designed to convert images, audio, and video files into shareable URLs.

## 🏗️ Architecture

### 1. Frontend Structure (`index.html`)
- **Responsive Layout**: Uses a container-based grid system.
- **Glassmorphism**: Implements semi-transparent layers for a modern look.
- **SEO Ready**: Includes meta tags, description, and semantic HTML5 elements.

### 2. Styling Engine (`style.css`)
- **Theme**: Dark mode by default using `Inter` and `Outfit` font families.
- **Dynamic Backgrounds**: Uses animated "blobs" and a high-tech AI-generated banner image (`banner.png`) with blur filters.
- **CSS Animations**: Includes `fade-in`, `fade-in-up`, and `bounce` keyframes for a lively feel.

### 3. Logic Layer (`script.js`)
- **Drag & Drop**: Native API integration for handling file drops.
- **File Validation**: Recognizes MIME types for icons and previews.
- **Mock Uploading**: Simulates a high-speed upload process with progress synchronization.
- **Clipboard API**: Allows users to copy generated URLs with visual feedback.

## 🛠️ How to Customize
- **Backend Integration**: Replace the `uploadFile` function in `script.js` with a `fetch` call to your server API.
- **Branding**: Change the logo text in the `nav` section of `index.html`.
- **Colors**: Update the CSS variables in `:root` inside `style.css`.

## 📂 File Manifest
- `index.html`: Main application page.
- `style.css`: Design system and animations.
- `script.js`: Interactive functionality.
- `banner.png`: Background visual asset.
