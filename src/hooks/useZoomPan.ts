// useZoomPan — zoom y pan del preview
import React from 'react';


export function useZoomPan(containerRef: React.RefObject<HTMLElement>) {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan]   = React.useState({x:0,y:0});
  const dragging = React.useRef(false);
  const lastPos  = React.useRef({x:0,y:0});
  const lastDist = React.useRef<number | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      setZoom(z => Math.max(0.1, Math.min(10, z*factor)));
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button===1 || e.altKey) { dragging.current=true; lastPos.current={x:e.clientX,y:e.clientY}; e.preventDefault(); }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPan(p=>({x:p.x+(e.clientX-lastPos.current.x), y:p.y+(e.clientY-lastPos.current.y)}));
      lastPos.current={x:e.clientX,y:e.clientY};
    };
    const onMouseUp = () => { dragging.current=false; };

    // touch pinch
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length===2) {
        lastDist.current = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
      } else if (e.touches.length===1) {
        dragging.current=true; lastPos.current={x:e.touches[0].clientX,y:e.touches[0].clientY};
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length===2 && lastDist.current !== null) {
        const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        setZoom(z=>Math.max(0.1,Math.min(10,z*(d/lastDist.current))));
        lastDist.current=d;
      } else if (e.touches.length===1 && dragging.current) {
        setPan(p=>({x:p.x+(e.touches[0].clientX-lastPos.current.x),y:p.y+(e.touches[0].clientY-lastPos.current.y)}));
        lastPos.current={x:e.touches[0].clientX,y:e.touches[0].clientY};
      }
    };
    const onTouchEnd = () => { dragging.current=false; lastDist.current=null; };

    el.addEventListener('wheel', onWheel, {passive:false});
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('touchstart', onTouchStart, {passive:true});
    el.addEventListener('touchmove', onTouchMove, {passive:true});
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef]);

  const resetZoom = () => { setZoom(1); setPan({x:0,y:0}); };
  const zoomIn    = () => setZoom(z=>Math.min(10,z*1.25));
  const zoomOut   = () => setZoom(z=>Math.max(0.1,z*0.8));

  return { zoom, pan, resetZoom, zoomIn, zoomOut };
}