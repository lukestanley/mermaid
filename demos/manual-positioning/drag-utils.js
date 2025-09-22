export const computeDragPosition = (start, startPoint, currentPoint) => {
  if (!currentPoint || !Number.isFinite(currentPoint.x) || !Number.isFinite(currentPoint.y)) {
    return null;
  }

  const baseX = Number.isFinite(start?.x) ? Number(start.x) : 0;
  const baseY = Number.isFinite(start?.y) ? Number(start.y) : 0;

  if (startPoint && Number.isFinite(startPoint.x) && Number.isFinite(startPoint.y)) {
    const deltaX = currentPoint.x - startPoint.x;
    const deltaY = currentPoint.y - startPoint.y;
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
      return null;
    }
    return { x: baseX + deltaX, y: baseY + deltaY };
  }

  return { x: currentPoint.x, y: currentPoint.y };
};
