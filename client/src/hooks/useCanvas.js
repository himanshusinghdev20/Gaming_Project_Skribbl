import { useRef, useCallback, useEffect } from 'react';

export function useCanvas(isDrawer, emit) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const colorRef = useRef('#000000');
  const sizeRef = useRef(6);
  const toolRef = useRef('pen'); // pen or eraser

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const drawStroke = useCallback((ctx, from, to, color, size, tool) => {
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  const startDrawing = useCallback((e) => {
    if (!isDrawer) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    isDrawing.current = true;
    lastPos.current = pos;

    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = toolRef.current === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fillStyle = colorRef.current;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, sizeRef.current / 2, 0, Math.PI * 2);
    ctx.fill();

    emit('draw_start', { x: pos.x, y: pos.y, color: colorRef.current, size: sizeRef.current, tool: toolRef.current });
  }, [isDrawer, emit]);

  const draw = useCallback((e) => {
    if (!isDrawing.current || !isDrawer) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    if (lastPos.current) {
      drawStroke(ctx, lastPos.current, pos, colorRef.current, sizeRef.current, toolRef.current);
    }
    lastPos.current = pos;
    emit('draw_move', { x: pos.x, y: pos.y });
  }, [isDrawer, emit, drawStroke]);

  const stopDrawing = useCallback((e) => {
    if (!isDrawer) return;
    if (isDrawing.current) {
      emit('draw_end', {});
    }
    isDrawing.current = false;
    lastPos.current = null;
  }, [isDrawer, emit]);

  // Replay strokes from server
  const replayStrokes = useCallback((strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let currentColor = '#000000';
    let currentSize = 6;
    let currentTool = 'pen';
    let lastP = null;

    strokes.forEach(stroke => {
      if (stroke.type === 'start') {
        currentColor = stroke.color || '#000000';
        currentSize = stroke.size || 6;
        currentTool = stroke.tool || 'pen';
        lastP = { x: stroke.x, y: stroke.y };
        ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.fillStyle = currentColor;
        ctx.beginPath();
        ctx.arc(stroke.x, stroke.y, currentSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (stroke.type === 'move' && lastP) {
        drawStroke(ctx, lastP, { x: stroke.x, y: stroke.y }, currentColor, currentSize, currentTool);
        lastP = { x: stroke.x, y: stroke.y };
      } else if (stroke.type === 'end') {
        lastP = null;
      }
    });
  }, [drawStroke]);

  // Handle incoming remote strokes
  const remoteStrokeState = useRef({ color: '#000', size: 6, tool: 'pen', lastPos: null });

  const applyRemoteStroke = useCallback((stroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (stroke.type === 'start') {
      remoteStrokeState.current = {
        color: stroke.color || '#000',
        size: stroke.size || 6,
        tool: stroke.tool || 'pen',
        lastPos: { x: stroke.x, y: stroke.y }
      };
      const { color, size, tool } = remoteStrokeState.current;
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(stroke.x, stroke.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (stroke.type === 'move') {
      const s = remoteStrokeState.current;
      if (s.lastPos) {
        drawStroke(ctx, s.lastPos, { x: stroke.x, y: stroke.y }, s.color, s.size, s.tool);
        s.lastPos = { x: stroke.x, y: stroke.y };
      }
    } else if (stroke.type === 'end') {
      remoteStrokeState.current.lastPos = null;
    }
  }, [drawStroke]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const setColor = useCallback((c) => { colorRef.current = c; }, []);
  const setSize = useCallback((s) => { sizeRef.current = s; }, []);
  const setTool = useCallback((t) => { toolRef.current = t; }, []);

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    replayStrokes,
    applyRemoteStroke,
    setColor,
    setSize,
    setTool,
    colorRef,
    sizeRef,
    toolRef
  };
}
