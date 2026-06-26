import { useEffect, useRef, useState } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import './DrawingCanvas.css';

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#FF6600', '#FFFF00', '#00CC00',
  '#0000FF', '#9900CC', '#FF99CC', '#FF6699', '#996633', '#808080',
  '#FF3300', '#FF9900', '#CCFF00', '#00FF99', '#00CCFF', '#CC00FF',
  '#FF99FF', '#FFCC99', '#66FFFF', '#99FF99', '#FFFF99', '#FF9999'
];

const SIZES = [3, 6, 12, 20, 32];

export default function DrawingCanvas({ isDrawer, emit, onClear, onUndo }) {
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedSize, setSelectedSize] = useState(6);
  const [selectedTool, setSelectedTool] = useState('pen');

  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    replayStrokes,
    applyRemoteStroke,
    setColor,
    setSize,
    setTool
  } = useCanvas(isDrawer, emit);

  // Expose replayStrokes and applyRemoteStroke via ref
  const apiRef = useRef({ replayStrokes, applyRemoteStroke, clearCanvas });
  apiRef.current = { replayStrokes, applyRemoteStroke, clearCanvas };

  // Attach to window for parent to call
  useEffect(() => {
    window._canvasAPI = apiRef.current;
    return () => { delete window._canvasAPI; };
  }, []);

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setColor(color);
    setSelectedTool('pen');
    setTool('pen');
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setSize(size);
  };

  const handleToolChange = (tool) => {
    setSelectedTool(tool);
    setTool(tool);
    if (tool === 'eraser') setColor('#eraser');
  };

  const handleClear = () => {
    clearCanvas();
    emit('canvas_clear', {});
    if (onClear) onClear();
  };

  const handleUndo = () => {
    emit('draw_undo', {});
    if (onUndo) onUndo();
  };

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={800}
        height={520}
        className={`drawing-canvas ${isDrawer ? 'drawer-cursor' : 'viewer-cursor'}`}
        onMouseDown={isDrawer ? startDrawing : undefined}
        onMouseMove={isDrawer ? draw : undefined}
        onMouseUp={isDrawer ? stopDrawing : undefined}
        onMouseLeave={isDrawer ? stopDrawing : undefined}
        onTouchStart={isDrawer ? startDrawing : undefined}
        onTouchMove={isDrawer ? draw : undefined}
        onTouchEnd={isDrawer ? stopDrawing : undefined}
      />

      {isDrawer && (
        <div className="toolbar">
          <div className="tool-section">
            <button
              className={`tool-btn ${selectedTool === 'pen' ? 'active' : ''}`}
              onClick={() => handleToolChange('pen')}
              title="Pen"
            >✏️</button>
            <button
              className={`tool-btn ${selectedTool === 'eraser' ? 'active' : ''}`}
              onClick={() => handleToolChange('eraser')}
              title="Eraser"
            >🧹</button>
            <button className="tool-btn" onClick={handleUndo} title="Undo">↩️</button>
            <button className="tool-btn danger" onClick={handleClear} title="Clear All">🗑️</button>
          </div>

          <div className="size-section">
            {SIZES.map(size => (
              <button
                key={size}
                className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                onClick={() => handleSizeChange(size)}
                title={`Size ${size}`}
              >
                <div className="size-dot" style={{ width: Math.min(size, 20), height: Math.min(size, 20) }}></div>
              </button>
            ))}
          </div>

          <div className="color-palette">
            {COLORS.map(color => (
              <button
                key={color}
                className={`color-swatch ${selectedColor === color && selectedTool === 'pen' ? 'active' : ''}`}
                style={{ background: color, border: color === '#FFFFFF' ? '2px solid #ccc' : 'none' }}
                onClick={() => handleColorChange(color)}
                title={color}
              />
            ))}
          </div>

          <div className="current-preview">
            <div
              className="preview-dot"
              style={{
                width: Math.min(selectedSize * 2, 40),
                height: Math.min(selectedSize * 2, 40),
                background: selectedTool === 'eraser' ? '#fff' : selectedColor,
                border: selectedTool === 'eraser' ? '2px dashed #999' : 'none'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
