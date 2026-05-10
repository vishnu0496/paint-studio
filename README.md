# Vishnu Paints Colour Visualizer

A professional, mobile-first paint visualizer and quote generation tool designed for **Vishnu Paints**, a local JSW Paints retailer in Darsi, Andhra Pradesh.

This application allows customers and shopkeepers to preview JSW paint shades on room photos in real-time, generate quantity estimates, and send professional quotes via WhatsApp.

## Key Features

- **AI-Assisted Wall Detection**: Automatic surface segmentation with a graceful manual fallback for low-end devices.
- **Precision Selection Tools**: High-accuracy Brush, Eraser, and Polygon (shape) selection for complex architectural details.
- **JSW Shade Library**: Searchable database of JSW Colourvista shades with JSW shade names and codes used by the app.
- **Multi-Room Projects**: Manage multiple room views (Hall, Bedroom, Exterior) within a single customer project.
- **Paint Quantity Estimator**: Integrated calculator to determine required paint litres based on surface area.
- **WhatsApp Quote Generation**: Instantly generate and send project summaries and shade codes to the retailer.
- **Mobile-First UX**: Optimized for in-shop use on smartphones and tablets.
- **Local Persistence**: Save and load customer projects locally without a complex backend.

## Tech Stack

- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI/ML**: MediaPipe Tasks Vision and browser-based segmentation models loaded from CDN
- **Architecture**: Web Workers (for non-blocking AI analysis)
- **Storage**: Browser localStorage for project state
- **Integration**: WhatsApp Business deep linking

## Architecture & Engineering Highlights

The project follows a clean, modular architecture designed for stability and performance:

- **Service Layer**: `src/services/segmentation` provides a typed abstraction for AI processing, handling both high-end browser workers and low-end fallback logic.
- **Modular Hooks**: Business logic is encapsulated in dedicated hooks (`useRooms`, `useProjectPersistence`).
- **Performance**: Heavy AI operations are offloaded to Web Workers, which keeps AI processing off the main UI path where possible.
- **Persistence**: Efficient bit-packing and compression of surface masks for reliable localStorage storage.
- **Fallback-First Design**: The system prioritizes manual usability, ensuring the visualizer works perfectly even if AI detection is unavailable. AI detection is assistive, not guaranteed. Manual Brush, Eraser, and Polygon tools remain the source of control.

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Linting**:
   ```bash
   npm run lint
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

## Business Workflow

1. **Upload**: Customer/Shopkeeper uploads a photo of the room or house exterior.
2. **Select**: Use AI "Auto Select" or manual tools to define the wall area.
3. **Choose**: Search and apply any JSW shade from the library.
4. **Estimate**: Enter room dimensions to calculate paint requirements.
5. **Quote**: Enter customer details and send the complete summary to Vishnu Paints on WhatsApp.

## Disclaimer

Digital colours are indicative and may vary based on screen calibration. Customers are strongly advised to confirm final shades with a physical **JSW Paints shade card** available at the Vishnu Paints shop.

---
*Built for Vishnu Paints - Darsi, Andhra Pradesh*
