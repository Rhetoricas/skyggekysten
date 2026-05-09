import { spilTilstand } from '$lib/spilTilstand.svelte';

export function skabKamera() {
    let x = $state(0);
    let y = $state(0);
    let isDragging = $state(false);
    let harTrukket = $state(false);
    
    // Vi gemmer spillerens "rigtige" zoom her
    let baseZoom = $state(1);
    
    // Forbandelsen lytter på rygsækken og tvinger værdien om på 2.5 eller 0.45
    const zoomLevel = $derived.by(() => {
        if (!spilTilstand.mitUdstyr) return baseZoom;
        if (spilTilstand.mitUdstyr.some(i => i.id === 'kikkert_250')) return 2.5;
        if (spilTilstand.mitUdstyr.some(i => i.id === 'kikkert_45')) return 0.45;
        return baseZoom;
    });
    
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
        const harForbandelse = spilTilstand.mitUdstyr?.some(i => i.id === 'kikkert_250' || i.id === 'kikkert_45');
        
        if (harForbandelse) {
            spilTilstand.logBesked = "Forbandelsen tvinger dit syn ud af fokus. Du kan ikke ændre afstanden.";
            return;
        }
        
        if (blokeret) return;
        e.preventDefault(); 

        baseZoom -= e.deltaY * 0.001; 
        baseZoom = Math.max(0.3, Math.min(baseZoom, 3.0));
    }

    function centrerPåHex(index: number, bredde: number, hexW: number, rowH: number) {
        const raekke = Math.floor(index / bredde);
        const kolonne = index % bredde;
        x = kolonne * hexW + (raekke % 2 !== 0 ? hexW / 2 : 0) + (hexW / 2);
        y = raekke * rowH + (rowH / 2);
    }

    function foelgSpiller(index: number, bredde: number, hexW: number, rowH: number) {
        const raekke = Math.floor(index / bredde);
        const kolonne = index % bredde;
        const px = kolonne * hexW + (raekke % 2 !== 0 ? hexW / 2 : 0) + (hexW / 2);
        const py = raekke * rowH + (rowH / 2);

        const deadzoneX = window.innerWidth * 0.25; 
        const deadzoneY = window.innerHeight * 0.25;

        if (px > x + deadzoneX) x = px - deadzoneX;
        else if (px < x - deadzoneX) x = px + deadzoneX;

        if (py > y + deadzoneY) y = py - deadzoneY;
        else if (py < y - deadzoneY) y = py + deadzoneY;
    }

    function saetZoom(nyVaerdi: number) {
        baseZoom = nyVaerdi;
    }

    function nulstil() {
        baseZoom = 1;
        isDragging = false;
        harTrukket = false;
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
        saetZoom,
        nulstil
    };
}