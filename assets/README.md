# Assets Directory

This folder contains all image assets for the project, organized by purpose.

## Directory Structure

```
assets/
├── hero/                    # Hero section images (actively used)
│   ├── hero-1.jpg          # Hero slide 1
│   ├── hero-2.jpg          # Hero slide 2
│   ├── hero-3.jpg          # Hero slide 3
│   ├── hero-4.jpg          # Hero slide 4
│   ├── hero-5.jpg          # Hero slide 5
│   └── catch_copy_mobile.png # Hero overlay text
│
└── unused-images/          # Archive of unused images
    └── (old/duplicate images moved here)
```

## Image Usage

### Hero Section (`assets/hero/`)
- **hero-1.jpg to hero-5.jpg**: Main hero slider images
- **catch_copy_mobile.png**: Text overlay for hero section
- Referenced in: `hero-webgl.js`

### Featured Products (`uploads/`)
- Product images organized by year
- Referenced in: `index.html`

## Notes

- All hero images are optimized for web display
- Unused images are kept in `unused-images/` for reference
- Delete `unused-images/` folder to reduce repository size
