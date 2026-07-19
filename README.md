# Immersive Music Experience Website

A stunning, interactive website featuring a 3D tunnel intro, WebGL animations, and smooth scrolling effects.

## ✨ Features

- **3D Tunnel Intro**: Interactive tunnel with 1000 floating music notes, spiral rifling lines, and a glowing white light at the end
- **Smooth Transitions**: White flash effect transitioning from tunnel to main site
- **WebGL Hero Section**: GPU-accelerated animations with custom shaders
- **Featured Collection Slider**: WebGL-powered product showcase with smooth transitions
- **Locomotive Smooth Scroll**: Buttery smooth scrolling experience
- **Responsive Design**: Fully responsive across all devices

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd new-offbeat
```

2. **Open in browser**
   - Simply open `index.html` in your browser
   - No build process needed - all libraries loaded via CDN

## 🎨 Key Animations

### Tunnel Experience
- Blue transparent tunnel with spiral rifling lines
- 1000 animated music notes with gentle rotation
- White pulsing light at tunnel end
- Smooth scroll-based navigation
- White flash transition effect

### Hero Section
- WebGL-powered image transitions
- Custom fragment shaders for distortion effects
- Smooth slide animations
- GPU-accelerated rendering

### Featured Collection
- Interactive WebGL canvas for product display
- Drag-to-navigate functionality
- Auto-play carousel with progress indicators
- Smooth text animations

## 🛠️ Tech Stack

- **Animation**: GSAP 3.12.5 + ScrollTrigger
- **3D Graphics**: Three.js r128
- **Smooth Scroll**: Locomotive Scroll 4.1.4
- **Particles**: p5.js 1.9.0
- **Styling**: Pure CSS with custom animations

## 📁 Project Structure

```
new-offbeat/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── script.js           # Main JavaScript logic
├── tunnel.js           # 3D tunnel experience
├── hero-webgl.js       # Hero section WebGL
├── images/             # Image assets
├── uploads/            # Product images
└── README.md           # This file
```

## 🎯 Key Sections

1. **Preloader**: Animated "Welcome to the Abyss" with particle effects
2. **Tunnel**: 3D scrollable tunnel with music notes
3. **Hero**: WebGL-powered image slider
4. **Featured Collection**: Interactive product showcase
5. **About Section**: Company information with animations

## 🎨 Customization

### Tunnel Configuration
Edit `tunnel.js` to customize:
- `noteCount`: Number of music notes (default: 1000)
- `riflingCount`: Number of spiral lines (default: 12)
- Tunnel colors and opacity

### Hero Images
Replace images in the `images/` folder:
- hero-1.jpg
- hero-2.jpg
- hero-3.jpg
- hero-4.jpg

### Featured Products
Update the product list in `index.html`:
```html
<li data-name="PRODUCT NAME" data-src="path/to/image.png" data-href="#"></li>
```

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Credits

Built with love using modern web technologies and creative coding techniques.
