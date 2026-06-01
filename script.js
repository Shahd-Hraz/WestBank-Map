const API_KEY = 'c586bb1f0452c0acb223cfea83492a53';

// =============================================
// 1. إنشاء الخريطة
// =============================================
const map = L.map('map', {
    center: [31.95, 35.20],
    zoom: 9,
    zoomControl: false
});

L.control.zoom({ position: 'topleft' }).addTo(map);

// =============================================
// 2. طبقات الخريطة الأساسية
// =============================================
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri'
});




// =============================================
// 4. محطات الطقس - Live من OpenWeatherMap
// =============================================
const weatherIcon = L.divIcon({
    html: `<div style="background:#c0392b; color:#fff; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:15px; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4);">🌡️</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const stations = [
    {name: "جنين",     lat: 32.46, lng: 35.30},
    {name: "طولكرم",   lat: 32.31, lng: 35.02},
    {name: "نابلس",    lat: 32.22, lng: 35.26},
    {name: "رام الله", lat: 31.90, lng: 35.21},
    {name: "أريحا",    lat: 31.86, lng: 35.44},
    {name: "بيت لحم",  lat: 31.70, lng: 35.20},
    {name: "الخليل",   lat: 31.53, lng: 35.10},
    {name: "غزة",      lat: 31.50, lng: 34.47}
];

const weatherMarkers = [];

stations.forEach(s => {
    const marker = L.marker([s.lat, s.lng], {icon: weatherIcon});
    marker.bindPopup(`<div style="text-align:center;">⏳ جاري التحميل...</div>`);
    weatherMarkers.push(marker);

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${s.lat}&lon=${s.lng}&appid=${API_KEY}&units=metric&lang=ar`)
        .then(r => r.json())
        .then(data => {
            const temp = Math.round(data.main.temp);
            const humidity = data.main.humidity;
            const wind = Math.round(data.wind.speed * 3.6);
            const desc = data.weather[0].description;
            marker.setPopupContent(`
                <div style="min-width:150px; text-align:right; direction:rtl; font-family:Cairo,sans-serif;">
                    <div style="font-weight:700; color:#c0392b; font-size:1rem;">📍 ${s.name}</div>
                    <div style="font-size:1.4rem; font-weight:700;">🌡️ ${temp}°C</div>
                    <div style="font-size:0.85rem; color:#555;">${desc}</div>
                    <hr style="margin:4px 0;">
                    <div style="font-size:0.82rem;">💧 الرطوبة: ${humidity}%</div>
                    <div style="font-size:0.82rem;">💨 الرياح: ${wind} كم/س</div>
                </div>
            `);
        })
        .catch(() => {
            marker.setPopupContent(`<div style="text-align:right; direction:rtl;">📍 ${s.name}<br>⚠️ تعذر تحميل البيانات</div>`);
        });
});

const weatherGroup = L.layerGroup(weatherMarkers).addTo(map);

// =============================================
// 5. التحكم بالطبقات
// =============================================
const baseMaps = {
    "Open Street Map": osm,
    "Satellite": satellite
};

const overlayMaps = {
    
    "Live Weather Stations": weatherGroup
};

const layerControl = L.control.layers(baseMaps, overlayMaps, {
    collapsed: false,
    position: 'topright'
}).addTo(map);

// =============================================
// 6. طبقة Oslo A/B/C من abc.geojson
// =============================================
fetch('abc.geojson')
    .then(r => r.json())
    .then(data => {
        const osloGroup = L.geoJSON(data, {
            style: function(feature) {
                const type = feature.properties.LandClas_1;
                const colors = {
                    'Area A': '#e07b39',
                    'Area B': '#e8c97a',
                    'Area C': '#a8d5a2'
                };
                return {
                    color: '#333',
                    fillColor: colors[type] || '#ccc',
                    fillOpacity: 0.4,
                    weight: 1.5
                };
            },
            onEachFeature: function(feature, layer) {
                layer.bindPopup(`<b>${feature.properties.LandClas_1}</b>`);
            }
        }).addTo(map);
        layerControl.addOverlay(osloGroup, "Oslo Areas (A, B, C)");
    })
    .catch(() => console.error('تعذر تحميل abc.geojson'));

// =============================================
// 7. مفتاح الخريطة (Legend)
// =============================================
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function() {
    const div = L.DomUtil.create('div');
    div.innerHTML = `
        <div style="background:white; padding:8px 12px; border-radius:6px; border:1px solid #ccc; font-family:Cairo,sans-serif; direction:rtl; font-size:0.8rem; box-shadow:0 1px 5px rgba(0,0,0,0.2);">
            <b style="display:block; margin-bottom:5px;">Map Legend</b>
            <div style="margin-bottom:3px;"><span style="display:inline-block; width:16px; height:10px; background:#e07b39; margin-left:5px; border:1px solid #aaa;"></span> Area A</div>
            <div style="margin-bottom:3px;"><span style="display:inline-block; width:16px; height:10px; background:#e8c97a; margin-left:5px; border:1px solid #aaa;"></span> Area B</div>
            <div style="margin-bottom:3px;"><span style="display:inline-block; width:16px; height:10px; background:#a8d5a2; margin-left:5px; border:1px solid #aaa;"></span> Area C</div>
            
        </div>
    `;
    return div;
};
legend.addTo(map);

// =============================================
// 8. عرض الإحداثيات
// =============================================
map.on('mousemove', function(e) {
    const x = ((e.latlng.lng - 34.0) * 111320 * Math.cos(e.latlng.lat * Math.PI / 180)).toFixed(2);
    const y = ((e.latlng.lat - 29.0) * 110540).toFixed(2);
    const el = document.getElementById('coords-display');
    if (el) el.innerHTML = `X: ${x}<br>Y: ${y}`;
});

// =============================================
// 9. زر Find Me
// =============================================
function locateUser() {
    if (!navigator.geolocation) { alert('المتصفح لا يدعم تحديد الموقع'); return; }
    navigator.geolocation.getCurrentPosition(
        p => {
            map.setView([p.coords.latitude, p.coords.longitude], 13);
            L.marker([p.coords.latitude, p.coords.longitude])
                .addTo(map)
                .bindPopup('📍 موقعك الحالي')
                .openPopup();
        },
        () => alert('تعذّر تحديد موقعك.')
    );
}

// =============================================
// 10. Scale Bar
// =============================================
L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);