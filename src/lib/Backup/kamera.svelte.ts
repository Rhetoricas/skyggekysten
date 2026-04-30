import { spilTilstand } from '$lib/spilTilstand.svelte';

export function skabKamera() {
    let x = $state(0);
    let y = $state(0);
    let isDragging = $state(false);
    let harTrukket = $state(false);
    let zoomLevel = $state(1);
    
    let lastMouseX = 0;
    let lastMouseY = 0;
    let startMouseX = 0;
    let startMouseY = 0;

    function startTræk(e: PointerEvent, blokeret: boolean) {
        if (e.button !== 0 || blokeret) return; 
        isDragging = true;
        harTrukket = false;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
    }

    function træk(e: PointerEvent) {
        if (!isDragging) return;
        x -= (e.clientX - lastMouseX) / zoomLevel;
        y -= (e.clientY - lastMouseY) / zoomLevel;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        if (Math.abs(e.clientX - startMouseX) > 5 || Math.abs(e.clientY - startMouseY) > 5) {
            harTrukket = true; 
        }
    }

    function stopTræk() {
        isDragging = false;
    }

    function håndterZoom(e: WheelEvent, blokeret: boolean) {
        // Her er fejlen rettet - intet 'any'
        if (spilTilstand.inventory?.some((i: { id: string }) => i.id === 'kikkert_250' || i.id === 'kikkert_45')) return;        
        if (blokeret) return;
        e.preventDefault(); 

        zoomLevel -= e.deltaY * 0.001; 
        zoomLevel = Math.max(0.5, Math.min(zoomLevel, 2.0));
    }

    function centrerPåHex(index: number, bredde: number, hexW: number, rowH: number) {
        const r = Math.floor(index / bredde);
        const k = index % bredde;
        x = k * hexW + (r % 2 !== 0 ? hexW / 2 : 0) + (hexW / 2);
        y = r * rowH + (rowH / 2);
    }

    function foelgSpiller(index: number, bredde: number, hexW: number, rowH: number) {
        // 1. Find ud af hvor spilleren står i pixels
        const r = Math.floor(index / bredde);
        const k = index % bredde;
        const px = k * hexW + (r % 2 !== 0 ? hexW / 2 : 0) + (hexW / 2);
        const py = r * rowH + (rowH / 2);

        // 2. Den usynlige kasse (25% fra skærmens midte i alle retninger)
        const deadzoneX = window.innerWidth * 0.25; 
        const deadzoneY = window.innerHeight * 0.25;

        // 3. Skub kameraets x og y, hvis spilleren træder uden for kassen
        if (px > x + deadzoneX) x = px - deadzoneX;
        else if (px < x - deadzoneX) x = px + deadzoneX;

        if (py > y + deadzoneY) y = py - deadzoneY;
        else if (py < y - deadzoneY) y = py + deadzoneY;
    }

    // Her er funktionen, som island.svelte leder efter!
    function saetZoom(nyVaerdi: number) {
        zoomLevel = nyVaerdi;
    }

    return {
        get x() { return x; },
        set x(val) { x = val; },
        get y() { return y; },
        set y(val) { y = val; },
        get isDragging() { return isDragging; },
        get harTrukket() { return harTrukket; },
        get zoomLevel() { return zoomLevel; },
        startTræk,
        træk,
        stopTræk,
        håndterZoom,
        centrerPåHex,
        foelgSpiller,
        saetZoom // Og her gøres den tilgængelig
    };
}