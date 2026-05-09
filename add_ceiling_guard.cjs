const fs = require('fs');

const file = 'src/pages/VisualizerPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `          if (targetSurface === "ceiling") {
            for (let i = 0; i < cleaned.length; i++) {
              const y = Math.floor(i / width);
              if (y > height * 0.40) cleaned[i] = 0;
            }
          }`;

const replacement = `          if (targetSurface === "ceiling") {
            for (let i = 0; i < cleaned.length; i++) {
              const y = Math.floor(i / width);
              if (y > height * 0.40) cleaned[i] = 0;
            }
          } else if (targetSurface === "wall") {
            const ceilingGuard = buildTopConnectedCeilingGuard(width, height);
            if (ceilingGuard) {
              const topBoundary = height * 0.30;
              for (let i = 0; i < cleaned.length; i++) {
                const y = Math.floor(i / width);
                if (y < topBoundary && ceilingGuard[i] === 1) {
                  cleaned[i] = 0;
                }
              }
            }
          }`;

const normalizedTarget = target.replace(/\r\n/g, '\n');
content = content.replace(/\r\n/g, '\n');

if (content.includes(normalizedTarget)) {
    content = content.replace(normalizedTarget, replacement);
    fs.writeFileSync(file, content);
    console.log('Successfully added ceilingGuard to AI mask.');
} else {
    console.log('Could not find target content in VisualizerPage.tsx');
}
