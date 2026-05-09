const fs = require('fs');

const file = 'src/components/VisualizerCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      // Source-over gives stronger color coverage, multiply restores texture,
      // shadows, and wall depth. The Texture Depth slider blends the two.
      if (textureMix < 1) {
        ctx.save();
        ctx.globalAlpha = opacity * (1 - textureMix) * 0.75;
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(paintCanvas, 0, 0);
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = opacity * (0.35 + textureMix * 0.65);
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(paintCanvas, 0, 0);
      ctx.restore();`;

const replacement = `      // 1. Base Color Layer
      ctx.save();
      ctx.filter = 'blur(1px)';
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = "color";
      ctx.drawImage(paintCanvas, 0, 0);
      ctx.restore();

      // 2. Shadow Depth Layer
      ctx.save();
      ctx.filter = 'blur(1px)';
      ctx.globalAlpha = opacity * (0.15 + textureMix * 0.25);
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(paintCanvas, 0, 0);
      ctx.restore();

      // 3. Highlight & Sheen Layer
      ctx.save();
      ctx.filter = 'blur(1px)';
      ctx.globalAlpha = opacity * (0.2 + textureMix * 0.3);
      ctx.globalCompositeOperation = "soft-light";
      ctx.drawImage(paintCanvas, 0, 0);
      ctx.restore();`;

// Windows might have \r\n
const normalizedTarget = target.replace(/\r\n/g, '\n');
content = content.replace(/\r\n/g, '\n');

if (content.includes(normalizedTarget)) {
    content = content.replace(normalizedTarget, replacement);
    fs.writeFileSync(file, content);
    console.log('Successfully replaced content.');
} else {
    console.log('Could not find target content.');
}
